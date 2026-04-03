# Task: Relatório Semanal 1:1

## Metadata
- agent: head-comercial
- trigger: "*semanal"
- cron: `0 9 * * 1` (06h BRT, segunda-feira)
- script: `cron-rafa.js --semanal`
- template: `templates/relatorio-semanal-1x1-tmpl.md`
- elicit: false

## Descricao
Gera relatório semanal consolidado por closer para reunião 1:1.
Analisa evolução da semana, compara com semana anterior,
identifica tendências e gera pauta sugerida para o 1:1.

## Pre-Requisitos
- Análises de calls da semana em `data/analises/`
- Template: `relatorio-semanal-1x1-tmpl.md`

## Pipeline (automático)

### Step 1: Coletar Análises da Semana
- Filtra análises dos últimos 7 dias
- Agrupa por closer

### Step 2: Consolidar por Closer
- Nota média da semana
- Taxa de fechamento
- Evolução vs semana anterior
- Objeções mais frequentes
- Etapas com maior gap

### Step 3: Gerar Relatório
- Roda `gerar-relatorio-semanal.js --send-telegram`
- Gera via LLM usando `relatorio-semanal-1x1-tmpl.md`
- Inclui pauta sugerida para 1:1

### Step 4: Enviar
- Envia no Telegram por closer

## Execução Manual
```bash
node cron-rafa.js --semanal
# ou direto:
node gerar-relatorio-semanal.js --send-telegram
```

## Output
Relatório semanal individual por closer via Telegram, com pauta para 1:1.
