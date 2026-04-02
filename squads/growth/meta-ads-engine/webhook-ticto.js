/**
 * @deprecated USE O WEBHOOK PRINCIPAL: app/src/app/api/webhooks/ticto/route.ts
 *
 * Este arquivo é um servidor standalone de DESENVOLVIMENTO LOCAL.
 * A produção usa o endpoint Next.js no Vercel:
 * https://zapecontrol.vercel.app/api/webhooks/ticto
 *
 * Este arquivo NÃO tem: cookie forwarding (fbc/fbp), validação de token,
 * suporte a bumps, extração de city/state. Use apenas pra debug local.
 *
 * Porta: 8890 (não conflita com dashboard na 8899)
 */

const http = require('http');
const https = require('https');
const MetaCAPI = require('./lib/meta-capi');

// ============================================================
// Config
// ============================================================

const dotenv = require('dotenv') || null;
try { require('dotenv').config({ path: __dirname + '/../.env' }); } catch (e) {}

const PORT = process.env.TICTO_WEBHOOK_PORT || 8890;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrchphqqgbssndijichd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID;

const SALES_PAGE_URL = 'https://netomarquezini.com.br/curso-ads/';

// Segredo para validar webhook (configurar na Ticto)
const WEBHOOK_SECRET = process.env.TICTO_WEBHOOK_SECRET || null;

const capi = new MetaCAPI();

// ============================================================
// Helpers
// ============================================================

function log(msg) {
  console.log(`[${new Date().toISOString()}] [webhook-ticto] ${msg}`);
}

function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT,
    text: message,
    parse_mode: 'HTML',
  });

  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  });
  req.on('error', (e) => log(`Telegram error: ${e.message}`));
  req.write(body);
  req.end();
}

function supabaseInsert(table, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/rest/v1/${table}?on_conflict=order_id,status,product_name,is_bump`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ============================================================
// Mapear payload Ticto → dados internos
// ============================================================

function mapTictoStatus(status) {
  const map = {
    'approved': 'authorized',
    'authorized': 'authorized',
    'refunded': 'refunded',
    'refused': 'refused',
    'chargeback': 'chargeback',
    'canceled': 'refused',
    'waiting_payment': 'pending',
    'expired': 'refused',
    // Variantes em português (Ticto envia ambos)
    'Autorizado': 'authorized',
    'Reembolsado': 'refunded',
    'Recusado': 'refused',
    'Chargeback': 'chargeback',
    'Cancelado': 'refused',
  };
  return map[status] || String(status).toLowerCase();
}

function mapPaymentMethod(method) {
  const map = {
    'pix': 'pix',
    'credit_card': 'credit_card',
    'bank_slip': 'bank_slip',
    'Pix': 'pix',
    'Cartão de Crédito': 'credit_card',
    'Boleto': 'bank_slip',
  };
  return map[method] || method;
}

/**
 * Extrai dados do payload Ticto (formato pode variar — suporta os dois formatos conhecidos)
 */
function extractTictoData(payload) {
  // Ticto pode enviar evento wrapper ou dados direto
  const data = payload.data || payload;
  const customer = data.customer || data.buyer || {};
  const product = data.product || data.products?.[0] || {};
  const transaction = data.transaction || data;
  const subscription = data.subscription || {};

  return {
    // Evento
    event: payload.event || payload.type || 'purchase',
    status: mapTictoStatus(transaction.status || payload.status || 'approved'),

    // Transação
    orderId: String(transaction.order_id || transaction.id || data.order_id || ''),
    transactionHash: transaction.hash || transaction.transaction_hash || '',
    value: parseFloat(transaction.amount || transaction.value || data.amount || product.price || 0) / 100, // Ticto envia em centavos
    currency: 'BRL',
    paymentMethod: mapPaymentMethod(transaction.payment_method || data.payment_method || ''),

    // Cliente
    customer: {
      email: customer.email || '',
      phone: customer.phone || customer.cel || '',
      firstName: (customer.name || customer.full_name || '').split(' ')[0] || '',
      lastName: (customer.name || customer.full_name || '').split(' ').slice(1).join(' ') || '',
      fullName: customer.name || customer.full_name || '',
      document: customer.document || customer.cpf || '',
      city: customer.city || '',
      state: customer.state || '',
      country: 'br',
    },

    // Produto
    productName: product.name || product.title || '',
    productId: String(product.id || product.product_id || ''),
    offerName: data.offer_name || product.offer_name || '',

    // UTMs (se disponíveis no payload)
    utmSource: data.utm_source || transaction.utm_source || '',
    utmMedium: data.utm_medium || transaction.utm_medium || '',
    utmCampaign: data.utm_campaign || transaction.utm_campaign || '',
    utmContent: data.utm_content || transaction.utm_content || '',
    utmTerm: data.utm_term || transaction.utm_term || '',

    // Tipo (bump, upsell, etc.)
    isBump: data.is_bump === true || data.is_bump === 'sim',
    isUpsell: (data.offer_name || '').toLowerCase().includes('upsell'),
    isDownsell: (data.offer_name || '').toLowerCase().includes('dowsell') || (data.offer_name || '').toLowerCase().includes('downsell'),
  };
}

// ============================================================
// Processar evento
// ============================================================

async function processEvent(payload) {
  const d = extractTictoData(payload);
  log(`Evento: ${d.event} | Status: ${d.status} | Produto: ${d.productName} | Valor: R$${d.value} | Cliente: ${d.customer.email}`);

  const results = { capi: null, supabase: null };

  // 1. Enviar para Meta CAPI
  try {
    if (d.status === 'authorized') {
      results.capi = await capi.sendPurchase({
        userData: {
          email: d.customer.email,
          phone: d.customer.phone,
          firstName: d.customer.firstName,
          lastName: d.customer.lastName,
          city: d.customer.city,
          state: d.customer.state,
          document: d.customer.document,
          country: 'br',
        },
        orderId: d.orderId,
        value: d.value,
        currency: d.currency,
        productName: d.productName,
        productId: d.productId,
        eventSourceUrl: SALES_PAGE_URL,
      });
      log(`CAPI Purchase enviado — events_received: ${results.capi.events_received}`);

    } else if (d.status === 'refunded' || d.status === 'chargeback') {
      results.capi = await capi.sendRefund({
        userData: {
          email: d.customer.email,
          phone: d.customer.phone,
          firstName: d.customer.firstName,
          lastName: d.customer.lastName,
          document: d.customer.document,
        },
        orderId: d.orderId,
        value: d.value,
        currency: d.currency,
        productName: d.productName,
        eventSourceUrl: SALES_PAGE_URL,
      });
      log(`CAPI Refund enviado — events_received: ${results.capi.events_received}`);
    }
  } catch (err) {
    log(`CAPI ERRO: ${err.message}`);
    results.capi = { error: err.message };
    // Não retenta — avisa no Telegram e segue
    sendTelegram(`⚠️ <b>CAPI Erro</b>\nEvento: ${d.event}\nProduto: ${d.productName}\nErro: ${err.message}\n\nVerificar manualmente.`);
  }

  // 2. Salvar no Supabase
  try {
    const parentProduct = detectParentProduct(d.offerName, d.productName);
    const supabaseRow = {
      order_id: d.orderId,
      transaction_hash: d.transactionHash,
      status: d.status,
      payment_method: d.paymentMethod,
      product_name: d.productName,
      product_id: d.productId,
      offer_name: d.offerName,
      customer_name: d.customer.fullName,
      customer_email: d.customer.email,
      customer_phone: d.customer.phone,
      customer_document: d.customer.document,
      customer_city: d.customer.city,
      customer_state: d.customer.state,
      paid_amount: d.value,
      order_total: d.value,
      is_bump: d.isBump,
      is_upsell: d.isUpsell,
      is_downsell: d.isDownsell,
      parent_product: parentProduct,
      utm_source: d.utmSource,
      utm_medium: d.utmMedium,
      utm_campaign: d.utmCampaign,
      utm_content: d.utmContent,
      utm_term: d.utmTerm,
      created_at: new Date().toISOString(),
    };

    results.supabase = await supabaseInsert('ticto_sales', supabaseRow);
    log(`Supabase: ${results.supabase.status}`);
  } catch (err) {
    log(`Supabase ERRO: ${err.message}`);
    results.supabase = { error: err.message };
  }

  // 3. Notificar Telegram (só para compras aprovadas)
  if (d.status === 'authorized') {
    const tipo = d.isBump ? '(Bump)' : d.isUpsell ? '(Upsell)' : d.isDownsell ? '(Downsell)' : '';
    sendTelegram(
      `💰 <b>Venda Confirmada!</b> ${tipo}\n` +
      `Produto: ${d.productName}\n` +
      `Valor: R$${d.value.toFixed(2)}\n` +
      `Cliente: ${d.customer.fullName}\n` +
      `Pagamento: ${d.paymentMethod}\n` +
      `CAPI: ${results.capi?.events_received ? '✅' : '❌'}\n` +
      `UTM: ${d.utmSource || 'direto'}`
    );
  } else if (d.status === 'refunded') {
    sendTelegram(
      `🔄 <b>Reembolso</b>\n` +
      `Produto: ${d.productName}\n` +
      `Valor: R$${d.value.toFixed(2)}\n` +
      `Cliente: ${d.customer.fullName}`
    );
  }

  return results;
}

function detectParentProduct(offerName, productName) {
  const lower = (offerName || '').toLowerCase();
  if (lower.includes('shopee ads') || lower.includes('shopee ad')) return 'Shopee ADS 2.0';
  if (lower.includes('ranqueando')) return 'Ranqueando em 15 Dias 2.0';
  return productName || 'unknown';
}

// ============================================================
// HTTP Server
// ============================================================

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'webhook-ticto', uptime: process.uptime() }));
    return;
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook/ticto') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        // Validar secret se configurado
        if (WEBHOOK_SECRET) {
          const signature = req.headers['x-webhook-secret'] || req.headers['x-ticto-secret'] || '';
          if (signature !== WEBHOOK_SECRET) {
            log('Webhook rejeitado — secret inválido');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'unauthorized' }));
            return;
          }
        }

        const payload = JSON.parse(body);
        log(`Payload recebido: ${JSON.stringify(payload).substring(0, 500)}`);

        // Responde 200 imediatamente (Ticto espera resposta rápida)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));

        // Processa em background
        await processEvent(payload);

      } catch (err) {
        log(`Erro processando webhook: ${err.message}`);
        if (!res.headersSent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid payload' }));
        }
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  log(`Webhook Ticto rodando na porta ${PORT}`);
  log(`Endpoint: http://localhost:${PORT}/webhook/ticto`);
  log(`Health: http://localhost:${PORT}/health`);
  sendTelegram(`🔗 Webhook Ticto CAPI online na porta ${PORT}`);
});

module.exports = server;
