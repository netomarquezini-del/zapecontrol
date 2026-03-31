# SDR Station — Guia de Setup

## O que ja esta pronto (codigo)
- Migration SQL com 10 tabelas, 11 enums, 30+ indexes, RLS
- 47 API routes
- 8 paginas
- 11 componentes React
- 11 bibliotecas (BINA selector, cadence engine, copilot, etc.)
- Cron jobs configurados no vercel.json
- Storage bucket setup automatico

## O que voce precisa fazer

### 1. Banco de Dados (5 min)
1. Abra o Supabase Dashboard → SQL Editor
2. Cole o conteudo de `app/supabase/migration-sdr-station.sql`
3. Execute
4. Verifique que as tabelas `sdr_*` foram criadas

### 2. Twilio - Telefonia (15 min)
1. Crie conta em [twilio.com](https://www.twilio.com) (trial gratis para testar)
2. No Console → Account Info:
   - Copie **Account SID** → `TWILIO_ACCOUNT_SID`
   - Copie **Auth Token** → `TWILIO_AUTH_TOKEN`
3. Console → API Keys → Create API Key:
   - Copie **SID** → `TWILIO_API_KEY`
   - Copie **Secret** → `TWILIO_API_SECRET`
4. Console → Voice → TwiML Apps → Create:
   - Nome: "SDR Station"
   - Voice Request URL: `https://SEU-DOMINIO/api/sdr/calls/twiml`
   - Status Callback URL: `https://SEU-DOMINIO/api/sdr/calls/webhook`
   - Copie o **SID** do TwiML App → `TWILIO_TWIML_APP_SID`
5. Console → Phone Numbers → Buy a Number:
   - Compre numeros brasileiros (1 por DDD: 11, 21, 31, etc.)
   - Em cada numero → Voice Config → TwiML App → selecione "SDR Station"

### 3. WhatsApp - Evolution API (10 min)
Se ja usa Evolution API no zapecontrol:
1. Copie a URL da instancia → `EVOLUTION_API_URL`
2. Copie a API Key → `EVOLUTION_API_KEY`
3. Copie o nome da instancia → `EVOLUTION_INSTANCE`
4. Configure webhook de recebimento:
   - URL: `https://SEU-DOMINIO/api/sdr/whatsapp/webhook`
   - Events: messages

### 4. Instagram - Meta Graph API (20 min + aprovacao)
1. Crie um App em [developers.facebook.com](https://developers.facebook.com)
2. Adicione o produto "Instagram" → "Instagram API with Instagram Login"
3. Gere um Access Token → `INSTAGRAM_ACCESS_TOKEN`
4. Configure → `META_APP_ID`, `META_APP_SECRET`
5. Webhook config:
   - Callback URL: `https://SEU-DOMINIO/api/sdr/instagram/webhook`
   - Verify Token: `sdr-station-verify-token` (ou o que definir em `META_WEBHOOK_VERIFY_TOKEN`)
   - Subscribe to: messages
6. Submeta para App Review (1-2 semanas)
   - **WhatsApp funciona independente enquanto Instagram e aprovado**

### 5. AI - Transcricao e Copilot (5 min)
1. OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → `OPENAI_API_KEY`
2. Anthropic: [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`

### 6. Variaveis de Ambiente (5 min)
1. Copie `.env.example` para `.env.local`
2. Preencha todos os valores
3. No Vercel: Settings → Environment Variables → adicione todas
4. Defina `NEXT_PUBLIC_APP_URL` com a URL do deploy
5. Gere um token aleatorio para `CRON_SECRET`

### 7. Deploy e Setup Final
```bash
# Commit e push
git add .
git commit -m "feat: add SDR Station module"
git push

# Apos deploy, execute o setup (cria storage bucket):
curl -X POST https://SEU-DOMINIO/api/sdr/setup
```

### 8. Cadastrar Numeros
1. Acesse `/comercial/sdr-station/numeros`
2. Clique "Validar Credenciais" para verificar Twilio
3. Cadastre cada numero comprado com DDD correspondente
4. Faca um teste de chamada

### 9. Primeiro Uso
1. Acesse `/comercial/sdr-station`
2. Va em "Cadencias" — verifique a cadencia padrao (3 ligacoes + WhatsApp + Instagram)
3. Importe leads via CSV em "Leads"
4. Abra o Pipeline para visualizar
5. Clique "Discar Proximos" no softphone!

## Cron Jobs (automatico via vercel.json)
| Endpoint | Frequencia | Funcao |
|----------|-----------|--------|
| /api/sdr/cadences/execute | 5 min | Processa cadencias automaticas |
| /api/sdr/schedules/followup | 30 min | Envia follow-up D-1/D-0 e detecta no-shows |
| /api/sdr/transcriptions/batch | 10 min | Transcreve e analisa gravacoes pendentes |

Verifique em Vercel Dashboard → Cron Jobs se estao ativos.

## Custos Estimados (1-2 SDRs)
| Item | Custo/mes |
|------|-----------|
| Twilio numeros (3-5) | ~R$30-50 |
| Twilio chamadas (~2000 discagens) | ~R$200-400 |
| Whisper transcricao (~25h audio) | ~R$15 |
| Claude analise + copilot | ~R$30-50 |
| **Total** | **~R$275-515** |
