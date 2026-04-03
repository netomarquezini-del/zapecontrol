# Task: Relatório Completo Diário

## Metadata
- agent: head-comercial
- trigger: "*relatorio-completo"
- cron: `0 8 * * *` (05h BRT)
- script: `cron-rafa.js --relatorio-completo`
- template: `templates/dashboard-comparativo-tmpl.md`
- elicit: false

## Descricao
Pipeline completo de auditoria matinal: analisa calls do dia anterior,
gera relatório consolidado com ranking de closers, envia PDDs individuais
e relatórios diários por closer via Telegram.

## Pre-Requisitos
- Google Calendar OAuth configurado (`.credentials/google-oauth.json` + `google-token.json`)
- Closers cadastrados em `data/closers.json`
- Templates: `dashboard-comparativo-tmpl.md`, `pdd-tmpl.md`, `relatorio-diario-calls-tmpl.md`

## Pipeline (automático)

### Step 1: Analisar Calls
- Para cada closer em `closers.json`, roda `analisar-call.js --email={email} --days=1`
- Transcreve e pontua contra as 12 etapas do script de fechamento
- Salva análises em `data/analises/`

### Step 2: Gerar Relatório Consolidado
- Agrega todas as análises do dia anterior
- Calcula ranking de closers por nota média
- Mapeia objeções mais frequentes
- Identifica etapas mais fracas do time
- Gera relatório via LLM usando `dashboard-comparativo-tmpl.md`
- Envia no Telegram

### Step 3: Gerar PDDs
- Roda `gerar-pdd-v2.js --days=1 --send-telegram`
- Gera Plano de Desenvolvimento Diário individual por closer
- Usa template `pdd-tmpl.md`

### Step 4: Gerar Relatórios Diários de Calls
- Roda `gerar-relatorio-diario.js --days=1 --send-telegram`
- 1 relatório por closer com detalhes de cada call
- Usa template `relatorio-diario-calls-tmpl.md`

## Execução Manual
```bash
node cron-rafa.js --relatorio-completo
```

## Output
Envia no Telegram:
1. Relatório consolidado com ranking
2. PDD individual por closer
3. Relatório diário de calls por closer
