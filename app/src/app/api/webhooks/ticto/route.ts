import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * Webhook receiver para Ticto (v2.0)
 *
 * Recebe eventos de venda do Shopee ADS 2.0 e salva no Supabase.
 * URL pra configurar na Ticto: https://zapecontrol.vercel.app/api/webhooks/ticto
 *
 * Eventos tratados:
 * - authorized (venda aprovada)
 * - refunded (reembolso)
 * - chargeback (disputa)
 */

// Token de segurança — validar que o request vem da Ticto
const TICTO_WEBHOOK_TOKEN = process.env.TICTO_WEBHOOK_TOKEN || ''

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
    // Ticto pode enviar token no body.token ou não enviar
    // Log pra debug — remover depois de validar
    console.log('[Ticto Webhook] Received token:', body.token ? body.token.substring(0, 15) + '...' : 'NONE')
    console.log('[Ticto Webhook] Expected token:', TICTO_WEBHOOK_TOKEN ? TICTO_WEBHOOK_TOKEN.substring(0, 15) + '...' : 'NOT SET')

    if (TICTO_WEBHOOK_TOKEN && body.token && body.token !== TICTO_WEBHOOK_TOKEN) {
      console.warn('[Ticto Webhook] Token mismatch!')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const version = body.version || '1.0'
    const status = body.status

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // Extrair dados conforme versão
    const sale = version === '2.0' ? parseV2(body) : parseV1(body)

    if (!sale.order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Salvar no Supabase
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('ticto_sales')
      .upsert(sale, { onConflict: 'order_id,status' })

    if (error) {
      console.error('[Ticto Webhook] Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Ticto Webhook] ${status} | ${sale.product_name} | R$${sale.paid_amount} | ${sale.customer_email} | utm_source=${sale.utm_source}`)

    return NextResponse.json({ ok: true, status: sale.status, order_id: sale.order_id })
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
  const paidAmountCents = Number(order.paid_amount || item.amount || offer.price || 0)
  const paidAmount = paidAmountCents > 1000 ? paidAmountCents / 100 : paidAmountCents // auto-detect centavos
  const producerAmount = Number(producer.amount || 0)
  const commission = producerAmount > 1000 ? producerAmount / 100 : producerAmount
  const itemPrice = Number(item.amount || offer.price || 0)
  const price = itemPrice > 1000 ? itemPrice / 100 : itemPrice

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
    order_total: paidAmount,
    commission,
    net_amount: commission,
    installments: Number(order.installments || 1),
    installments_count: Number(order.installments || 1),
    customer_name: String(customer.name || ''),
    customer_email: String(customer.email || ''),
    customer_cpf: String(customer.cpf || ''),
    customer_document: String(customer.cpf || customer.cnpj || ''),
    customer_phone: String(body.phone_number_customer || customerPhone.number || ''),
    customer_city: '',
    customer_state: '',
    utm_source: String(tracking.utm_source || ''),
    utm_medium: String(tracking.utm_medium || ''),
    utm_campaign: String(tracking.utm_campaign || ''),
    utm_content: String(tracking.utm_content || ''),
    utm_term: String(tracking.utm_term || ''),
    is_bump: String(body.commission_type) === 'bump',
    is_upsell: String(item.offer_name || offer.name || '').toLowerCase().includes('upsell'),
    is_downsell: String(item.offer_name || offer.name || '').toLowerCase().includes('dowsell') || String(item.offer_name || offer.name || '').toLowerCase().includes('downsell'),
    parent_product: null,
    card_brand: null,
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
