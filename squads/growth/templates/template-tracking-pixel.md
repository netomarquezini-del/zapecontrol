# Template — Tracking de Produto (Pixel + CAPI)

## Setup completo de rastreamento Meta Ads para um novo produto/funil

---

## 1. DADOS DO PRODUTO

Preencher antes de gerar o script:

| Campo | Valor | Exemplo |
|-------|-------|---------|
| **Nome do produto** | `{{PRODUCT_NAME}}` | Shopee ADS 2.0 |
| **Valor** | `{{PRODUCT_VALUE}}` | 97.00 |
| **Moeda** | `{{CURRENCY}}` | BRL |
| **Pixel ID** | `{{PIXEL_ID}}` | 9457207547700143 |
| **URLs da pagina de vendas** | `{{SALES_PAGES}}` | ['/curso-ads/', '/shopee-adss/'] |
| **Dominio do checkout** | `{{CHECKOUT_DOMAIN}}` | checkout.ticto, pay.ticto |
| **URL do checkout** | `{{CHECKOUT_URL}}` | https://checkout.ticto.app/OC19DC06B |
| **Plataforma de pagamento** | `{{PAYMENT_PLATFORM}}` | Ticto |
| **Webhook endpoint** | `{{WEBHOOK_URL}}` | https://zapecontrol.vercel.app/api/webhooks/ticto |

---

## 2. CHECKLIST PRE-LANCAMENTO

### Pixel (client-side)
- [ ] Script do Pixel instalado no HEAD (Elementor Custom Code ou WPCode)
- [ ] PageView disparando em todas as paginas
- [ ] ViewContent disparando nas paginas de vendas
- [ ] InitiateCheckout disparando no click do botao de compra
- [ ] Lead disparando em clicks de WhatsApp e submits de form
- [ ] ScrollDepth trackando engajamento na pagina de vendas
- [ ] Cookie `_fbp` sendo capturado e injetado nos links de checkout
- [ ] Cookie `_fbc` / `fbclid` sendo capturado e injetado nos links de checkout
- [ ] Nenhum evento duplicado (verificar com Ctrl+U → buscar fbq('init'))
- [ ] Cache limpo apos instalacao (LiteSpeed, Hostinger, CDN)

### CAPI (server-side)
- [ ] Webhook recebendo eventos da plataforma de pagamento
- [ ] Token de seguranca validando requests
- [ ] Evento Purchase sendo enviado no status 'authorized'
- [ ] Evento Refund sendo enviado no status 'refunded'/'chargeback'
- [ ] User data completo: email, phone, name, CPF, city, state
- [ ] `fbc` e `fbp` extraidos do query_params do webhook
- [ ] `fbclid` convertido em `fbc` quando fbc direto nao esta disponivel
- [ ] event_id unico pra deduplicacao (formato: `{EventName}_{order_id}`)

### Meta Events Manager
- [ ] Advanced Matching ativado (todos os campos)
- [ ] Dominio verificado
- [ ] Aggregated Event Measurement configurado (Purchase = prioridade 1)
- [ ] Test Events validado com evento real

### Validacao final
- [ ] Abrir pagina de vendas → verificar PageView + ViewContent no Console
- [ ] Clicar no botao → verificar InitiateCheckout + redirect com fbp/fbc na URL
- [ ] Fazer compra teste → verificar Purchase no Events Manager com EMQ >= 8
- [ ] Verificar nota EMQ de todos os eventos apos 48h

---

## 3. SCRIPT DO PIXEL (TEMPLATE)

Substituir os valores `{{...}}` pelos dados do produto.

Instalar em: **Elementor → Custom Code → Head** (ou WPCode Header)

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '{{PIXEL_ID}}', {}, {
  agent: 'zapeecomm-pixel-v2'
});
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={{PIXEL_ID}}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->

<!-- Eventos de Funil + Cookie Forwarding -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var PRODUCT_NAME = '{{PRODUCT_NAME}}';
  var PRODUCT_VALUE = {{PRODUCT_VALUE}};
  var CURRENCY = '{{CURRENCY}}';

  var SALES_PAGES = {{SALES_PAGES}};
  var CHECKOUT_DOMAINS = ['checkout.ticto', 'pay.ticto'];
  var WHATSAPP_PATTERNS = ['wa.me', 'api.whatsapp.com', 'whatsapp'];

  function isPage(paths) {
    var path = window.location.pathname.toLowerCase();
    for (var i = 0; i < paths.length; i++) {
      if (path === paths[i] || path === paths[i] + '/') return true;
    }
    return false;
  }

  function generateEventId(eventName) {
    return eventName + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  var fbp = getCookie('_fbp');
  var fbc = getCookie('_fbc');
  var fbclid = getUrlParam('fbclid');

  if (!fbc && fbclid) {
    fbc = 'fb.1.' + Date.now() + '.' + fbclid;
  }

  function enrichCheckoutLinks() {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].href || '';
      var isCheckout = false;
      for (var j = 0; j < CHECKOUT_DOMAINS.length; j++) {
        if (href.indexOf(CHECKOUT_DOMAINS[j]) > -1) { isCheckout = true; break; }
      }
      if (!isCheckout) continue;

      try {
        var url = new URL(href);
        if (fbp) url.searchParams.set('fbp', fbp);
        if (fbc) url.searchParams.set('fbc', fbc);
        if (fbclid && !fbc) url.searchParams.set('fbclid', fbclid);
        links[i].href = url.toString();
      } catch (e) {}
    }
  }

  enrichCheckoutLinks();
  if (window.MutationObserver) {
    var observer = new MutationObserver(function() { enrichCheckoutLinks(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  setTimeout(enrichCheckoutLinks, 2000);
  setTimeout(enrichCheckoutLinks, 5000);

  if (isPage(SALES_PAGES)) {
    var vcId = generateEventId('ViewContent');
    fbq('track', 'ViewContent', {
      content_name: PRODUCT_NAME,
      content_type: 'product',
      value: PRODUCT_VALUE,
      currency: CURRENCY
    }, { eventID: vcId });
  }

  var icFired = false;
  document.addEventListener('click', function(e) {
    var target = e.target;

    for (var i = 0; i < 5 && target; i++) {
      var href = (target.tagName === 'A' && target.href) ? target.href : '';

      if (!icFired) {
        var isCheckout = false;
        for (var j = 0; j < CHECKOUT_DOMAINS.length; j++) {
          if (href.indexOf(CHECKOUT_DOMAINS[j]) > -1) { isCheckout = true; break; }
        }
        if (isCheckout) {
          e.preventDefault();
          icFired = true;

          var destino = href;
          try {
            var url = new URL(href);
            if (fbp && !url.searchParams.get('fbp')) url.searchParams.set('fbp', fbp);
            if (fbc && !url.searchParams.get('fbc')) url.searchParams.set('fbc', fbc);
            destino = url.toString();
          } catch (err) {}

          var icId = generateEventId('InitiateCheckout');
          fbq('track', 'InitiateCheckout', {
            content_name: PRODUCT_NAME,
            content_type: 'product',
            value: PRODUCT_VALUE,
            currency: CURRENCY
          }, { eventID: icId });

          setTimeout(function() { window.location.href = destino; }, 350);
          return;
        }
      }

      var isWhatsApp = false;
      for (var k = 0; k < WHATSAPP_PATTERNS.length; k++) {
        if (href.indexOf(WHATSAPP_PATTERNS[k]) > -1) { isWhatsApp = true; break; }
      }
      if (isWhatsApp) {
        var leadId = generateEventId('Lead');
        fbq('track', 'Lead', {
          content_name: PRODUCT_NAME + ' - WhatsApp',
          content_category: 'whatsapp_click'
        }, { eventID: leadId });
        return;
      }

      target = target.parentElement;
    }
  });

  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    var leadId = generateEventId('Lead');
    fbq('track', 'Lead', {
      content_name: PRODUCT_NAME + ' - Form',
      content_category: 'form_submit'
    }, { eventID: leadId });
  });

  if (isPage(SALES_PAGES)) {
    var scrollFired = {};
    window.addEventListener('scroll', function() {
      var docHeight = document.body.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var scrollPercent = Math.round((window.scrollY / docHeight) * 100);

      var thresholds = [25, 50, 75, 90];
      for (var i = 0; i < thresholds.length; i++) {
        var t = thresholds[i];
        if (scrollPercent >= t && !scrollFired[t]) {
          scrollFired[t] = true;
          fbq('trackCustom', 'ScrollDepth', {
            percent: t,
            page: window.location.pathname
          });
        }
      }
    });
  }

});
</script>
```

---

## 4. WEBHOOK CAPI (SERVER-SIDE)

O webhook principal esta em: `app/src/app/api/webhooks/ticto/route.ts`

Para novo produto na **mesma plataforma (Ticto)**: nao precisa mudar nada — o webhook ja processa qualquer produto.

Para **nova plataforma de pagamento**: criar novo endpoint em `app/src/app/api/webhooks/{plataforma}/route.ts` seguindo o mesmo padrao:
1. Receber payload → parsear dados do cliente
2. Extrair `fbc`/`fbp` do query_params
3. Hash SHA-256: email, phone, name, CPF
4. Enviar evento via Meta CAPI com user_data completo
5. Salvar no Supabase
6. Notificar no Telegram

---

## 5. VALIDACAO — COMANDOS DE TESTE

### No Console do navegador (F12):
```javascript
// Verificar se Pixel carregou
fbq.getState()

// Listar eventos disparados
fbq.getState().pixels[0].events

// Verificar se script esta na pagina
document.querySelectorAll('script[src*="fbevents"]').length
```

### No Events Manager:
1. Test Events → abrir pagina → verificar eventos chegando
2. Diagnostics → verificar EMQ de cada evento
3. Overview → confirmar volume de eventos

---

## 6. TROUBLESHOOTING

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| `fbq is not defined` | Script nao carregou | Verificar se esta no HEAD, limpar cache |
| Eventos nao disparam | Script no HEAD sem DOMContentLoaded | Usar `document.addEventListener('DOMContentLoaded', ...)` |
| EMQ baixo (< 7) | Faltando fbc/fbp | Verificar cookie forwarding nos links de checkout |
| Eventos duplicados | Pixel instalado em 2 lugares | Buscar `fbq('init')` no codigo fonte (Ctrl+U) |
| Checkout nao redireciona | `e.preventDefault()` sem fallback | Verificar se CHECKOUT_DOMAINS bate com a URL real |
| Purchase nao chega na CAPI | Token invalido no webhook | Verificar TICTO_WEBHOOK_TOKEN no .env |
