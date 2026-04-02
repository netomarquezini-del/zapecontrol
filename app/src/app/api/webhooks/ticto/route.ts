import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * Webhook receiver para Ticto (v2.0) + Meta CAPI
 *
 * Recebe eventos de venda do Shopee ADS 2.0:
 * 1. Salva no Supabase (ticto_sales)
 * 2. Envia evento Purchase/Refund via Meta Conversions API (CAPI)
 * 3. Notifica no Telegram
 *
 * URL: https://zapecontrol.vercel.app/api/webhooks/ticto
 */

// Config
const TICTO_WEBHOOK_TOKEN = process.env.TICTO_WEBHOOK_TOKEN || ''
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || ''
const META_PIXEL_ID = process.env.META_PIXEL_ID || '9457207547700143'
const TELEGRAM_TOKEN = process.env.LEO_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT = process.env.LEO_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || ''
const SALES_PAGE_URL = 'https://netomarquezini.com.br/curso-ads/'

// ============================================================
// Meta CAPI helpers
// ============================================================

function sha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return undefined
  return createHash('sha256').update(normalized).digest('hex')
}

function hashPhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined
  let cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
  if (!cleaned.startsWith('55')) cleaned = '55' + cleaned
  return sha256(cleaned)
}

async function sendCAPIEvent(eventName: string, sale: Record<string, unknown>, ip: string, ua: string) {
  if (!META_ACCESS_TOKEN) return { skipped: true, reason: 'no token' }

  const userData: Record<string, unknown> = { country: [sha256('br')] }
  if (sale.customer_email) userData.em = [sha256(String(sale.customer_email))]
  if (sale.customer_phone) userData.ph = [hashPhone(String(sale.customer_phone))]
  if (sale.customer_name) {
    const parts = String(sale.customer_name).split(' ')
    userData.fn = [sha256(parts[0])]
    if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(' '))]
  }
  if (sale.customer_document || sale.customer_cpf) userData.external_id = [sha256(String(sale.customer_document || sale.customer_cpf))]
  if (sale.customer_city) userData.ct = [sha256(String(sale.customer_city))]
  if (sale.customer_state) userData.st = [sha256(String(sale.customer_state))]
  if (ip) userData.client_ip_address = ip
  if (ua) userData.client_user_agent = ua

  // fbc/fbp — cookies do Facebook capturados via query_params da Ticto
  if (sale._fbc) userData.fbc = String(sale._fbc)
  if (sale._fbp) userData.fbp = String(sale._fbp)

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: `${eventName}_${sale.order_id}`,
    action_source: 'website',
    event_source_url: SALES_PAGE_URL,
    user_data: userData,
    custom_data: {
      value: Number(sale.paid_amount) || 0,
      currency: 'BRL',
      content_name: sale.product_name,
      content_ids: sale.product_id ? [String(sale.product_id)] : undefined,
      content_type: 'product',
      order_id: sale.order_id,
    },
  }

  const params = new URLSearchParams({
    data: JSON.stringify([event]),
    access_token: META_ACCESS_TOKEN,
  })

  const res = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()
  if (data.error) throw new Error(`CAPI: ${data.error.message}`)
  return { events_received: data.events_received || 0 }
}

async function sendTelegram(message: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: message }),
    })
  } catch { /* silent */ }
}

export async function POST(req: NextRequest) {
  try {
    // Suportar JSON e URL-encoded
    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, unknown>

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      const params = new URLSearchParams(text)
      // Ticto pode mandar JSON stringificado em form fields
      const raw: Record<string, string> = {}
      params.forEach((v, k) => { raw[k] = v })
      // Tentar parsear valores JSON dentro dos campos
      body = {}
      for (const [k, v] of Object.entries(raw)) {
        try { body[k] = JSON.parse(v) } catch { body[k] = v }
      }
    } else {
      body = await req.json()
    }

    console.log('[Ticto Webhook] Content-Type:', contentType)
    console.log('[Ticto Webhook] Body keys:', Object.keys(body).join(', '))

    // Validar token de segurança
    if (TICTO_WEBHOOK_TOKEN && body.token !== TICTO_WEBHOOK_TOKEN) {
      console.warn('[Ticto Webhook] Invalid token received')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = body.status

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // Detectar versão: se tem 'order' ou 'customer' como objeto, é V2
    const isV2 = body.version === '2.0' || body.order || body.customer || body.item
    const sale = isV2 ? parseV2(body) : parseV1(body)

    if (!sale.order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Salvar no Supabase
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('ticto_sales')
      .upsert(sale, { onConflict: 'order_id,status,product_name,is_bump' })

    if (error) {
      console.error('[Ticto Webhook] Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Ticto Webhook] ${status} | ${sale.product_name} | R$${sale.paid_amount} | ${sale.customer_email} | utm_source=${sale.utm_source}`)

    // 2b. Processar bumps do array (Ticto V2 envia bumps junto com o produto principal)
    const bumpsArray = Array.isArray(body.bumps) ? body.bumps : []
    let bumpsInserted = 0
    for (const bump of bumpsArray) {
      const bumpRecord = {
        order_id: sale.order_id,
        order_hash: sale.order_hash,
        transaction_hash: sale.transaction_hash,
        status: sale.status,
        status_date: sale.status_date,
        payment_method: sale.payment_method,
        product_name: String((bump as Record<string, unknown>).product_name || ''),
        product_id: String((bump as Record<string, unknown>).product_id || ''),
        offer_name: String((bump as Record<string, unknown>).offer_name || ''),
        offer_code: String((bump as Record<string, unknown>).offer_code || ''),
        quantity: 1,
        price: Number((bump as Record<string, unknown>).offer_price || 0),
        paid_amount: Number((bump as Record<string, unknown>).offer_price || 0),
        item_price: Number((bump as Record<string, unknown>).offer_price || 0),
        commission: Number((bump as Record<string, unknown>).offer_price || 0),
        net_amount: Number((bump as Record<string, unknown>).offer_price || 0),
        installments: sale.installments,
        customer_name: sale.customer_name,
        customer_email: sale.customer_email,
        customer_cpf: sale.customer_cpf,
        customer_document: 'customer_document' in sale ? sale.customer_document : sale.customer_cpf,
        customer_phone: 'customer_phone' in sale ? sale.customer_phone : '',
        customer_city: sale.customer_city,
        customer_state: sale.customer_state,
        utm_source: sale.utm_source,
        utm_medium: sale.utm_medium,
        utm_campaign: sale.utm_campaign,
        utm_content: sale.utm_content,
        utm_term: sale.utm_term,
        is_bump: true,
        is_upsell: false,
        is_downsell: false,
        parent_product: sale.product_name,
        raw_payload: bump,
        updated_at: new Date().toISOString(),
      }

      const { error: bumpError } = await supabase
        .from('ticto_sales')
        .upsert(bumpRecord, { onConflict: 'order_id,status,product_name,is_bump' })

      if (bumpError) {
        console.error(`[Ticto Webhook] Bump save error: ${bumpError.message}`)
      } else {
        bumpsInserted++
        console.log(`[Ticto Webhook] Bump saved: ${bumpRecord.product_name} | R$${bumpRecord.paid_amount}`)
      }
    }

    // 2. Meta CAPI — enviar evento server-side
    let capiResult = 'skipped'
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    const ua = req.headers.get('user-agent') || ''

    try {
      if (sale.status === 'authorized') {
        const r = await sendCAPIEvent('Purchase', sale, ip, ua)
        capiResult = 'events_received' in r ? `ok:${r.events_received}` : 'skipped'
      } else if (sale.status === 'refunded' || sale.status === 'chargeback') {
        const r = await sendCAPIEvent('Refund', sale, ip, ua)
        capiResult = 'events_received' in r ? `ok:${r.events_received}` : 'skipped'
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      capiResult = `error:${msg}`
      console.error(`[Ticto Webhook] CAPI error: ${msg}`)
    }

    return NextResponse.json({ ok: true, status: sale.status, order_id: sale.order_id, bumps: bumpsInserted, capi: capiResult })
  } catch (e) {
    console.error('[Ticto Webhook] Parse error:', e)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

// Ticto v2.0 payload parser
// Ticto sends amounts in CENTAVOS (9700 = R$97.00)
function parseV2(body: Record<string, unknown>) {
  const order = (body.order || {}) as Record<string, unknown>
  const customer = (body.customer || {}) as Record<string, unknown>
  const customerPhone = (customer.phone || {}) as Record<string, unknown>
  const tracking = (body.tracking || {}) as Record<string, unknown>
  const producer = (body.producer || {}) as Record<string, unknown>
  const offer = (body.offer || {}) as Record<string, unknown>

  // item pode ser singular (item) ou array (items)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = (body.item || ((body.items as any)?.[0]) || {}) as Record<string, unknown>

  // Valores em centavos → converter pra reais
  // Se tem bumps no payload, order.paid_amount inclui tudo (produto + bumps)
  // Usar item.amount pro produto principal pra não contar bump duas vezes
  const hasBumps = Array.isArray(body.bumps) && body.bumps.length > 0
  const paidAmountCents = hasBumps
    ? Number(item.amount || offer.price || order.paid_amount || 0)
    : Number(order.paid_amount || item.amount || offer.price || 0)
  const paidAmount = paidAmountCents > 1000 ? paidAmountCents / 100 : paidAmountCents // auto-detect centavos
  const producerAmount = Number(producer.amount || 0)
  const commission = producerAmount > 1000 ? producerAmount / 100 : producerAmount
  const itemPrice = Number(item.amount || offer.price || 0)
  const price = itemPrice > 1000 ? itemPrice / 100 : itemPrice

  // Extrair fbc/fbp/fbclid dos query_params da Ticto
  const queryParams = (body.query_params || {}) as Record<string, unknown>
  let fbc = String(queryParams.fbc || '')
  const fbp = String(queryParams.fbp || '')
  const fbclid = String(queryParams.fbclid || '')

  // Se não tem fbc mas tem fbclid, construir o fbc no formato da Meta
  // Formato: fb.1.{timestamp_ms}.{fbclid}
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`
  }

  // Extrair endereço do customer (Ticto pode enviar em customer.address)
  const customerAddress = (customer.address || {}) as Record<string, unknown>
  const city = String(customerAddress.city || '')
  const state = String(customerAddress.state || '')

  return {
    order_id: String(order.hash || order.id || ''),
    order_hash: String(order.hash || ''),
    transaction_hash: String((body.transaction as Record<string, unknown>)?.hash || order.transaction_hash || ''),
    status: String(body.status || ''),
    status_date: body.status_date ? new Date(String(body.status_date)).toISOString() : new Date().toISOString(),
    payment_method: String(body.payment_method || ''),
    product_name: String(item.product_name || ''),
    product_id: String(item.product_id || ''),
    offer_name: String(item.offer_name || offer.name || ''),
    offer_code: String(item.offer_code || offer.code || ''),
    quantity: Number(item.quantity || 1),
    price,
    paid_amount: paidAmount,
    item_price: price,
    order_total: Number(order.paid_amount || 0) > 1000 ? Number(order.paid_amount) / 100 : Number(order.paid_amount || 0),
    commission,
    net_amount: commission,
    installments: Number(order.installments || 1),
    installments_count: Number(order.installments || 1),
    customer_name: String(customer.name || ''),
    customer_email: String(customer.email || ''),
    customer_cpf: String(customer.cpf || ''),
    customer_document: String(customer.cpf || customer.cnpj || ''),
    customer_phone: String(body.phone_number_customer || customerPhone.number || ''),
    customer_city: city,
    customer_state: state,
    utm_source: String(tracking.utm_source || ''),
    utm_medium: String(tracking.utm_medium || ''),
    utm_campaign: String(tracking.utm_campaign || ''),
    utm_content: String(tracking.utm_content || ''),
    utm_term: String(tracking.utm_term || ''),
    is_bump: String(body.commission_type) === 'bump',
    is_upsell: String(item.offer_name || offer.name || '').toLowerCase().includes('upsell'),
    is_downsell: String(item.offer_name || offer.name || '').toLowerCase().includes('dowsell') || String(item.offer_name || offer.name || '').toLowerCase().includes('downsell'),
    parent_product: String(body.commission_type) === 'bump' ? String(item.product_name || '') : null,
    card_brand: null,
    // Campos extras pra Meta CAPI (não vão pro Supabase, usados só no sendCAPIEvent)
    _fbc: fbc || null,
    _fbp: fbp || null,
    raw_payload: body,
    updated_at: new Date().toISOString(),
  }
}

// Ticto v1.0 legacy payload parser
function parseV1(body: Record<string, unknown>) {
  return {
    order_id: String(body.transaction_code || body.order_id || ''),
    order_hash: String(body.order_hash || ''),
    transaction_hash: '',
    status: mapV1Status(String(body.status || '')),
    status_date: body.date ? new Date(String(body.date)).toISOString() : new Date().toISOString(),
    payment_method: String(body.payment_method || ''),
    product_name: String(body.product_name || ''),
    offer_id: String(body.offer_id || ''),
    quantity: 1,
    price: Number(body.product_price || 0),
    paid_amount: Number(body.amount || body.product_price || 0),
    installments: Number(body.installments || 1),
    customer_name: String(body.customer_name || ''),
    customer_email: String(body.customer_email || ''),
    customer_cpf: String(body.customer_doc || ''),
    customer_city: '',
    customer_state: '',
    utm_source: String(body.utm_source || ''),
    utm_medium: String(body.utm_medium || ''),
    utm_campaign: String(body.utm_campaign || ''),
    utm_content: String(body.utm_content || ''),
    utm_term: String(body.utm_term || ''),
    raw_payload: body,
    updated_at: new Date().toISOString(),
  }
}

function mapV1Status(status: string): string {
  const map: Record<string, string> = {
    paid: 'authorized',
    approved: 'authorized',
    refused: 'refused',
    refunded: 'refunded',
    chargeback: 'chargeback',
    claimed: 'chargeback',
  }
  return map[status.toLowerCase()] || status
}

// GET — health check / status
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Ticto Webhook Receiver',
    product: 'Shopee ADS 2.0',
    events: ['authorized', 'refused', 'refunded', 'chargeback'],
    version: '2.0',
  })
}
