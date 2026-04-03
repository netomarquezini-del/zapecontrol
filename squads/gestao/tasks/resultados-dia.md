# Task: Resultados do Dia

## Metadata
- agent: head-comercial
- trigger: "*resultados"
- cron: `0 0 * * *` (21h BRT)
- script: `cron-rafa.js --zapecontrol`
- template: `templates/resultados-dia-tmpl.md`
- elicit: false

## Descricao
Puxa os lançamentos do dia no Supabase (tabela `movements`), consolida
vendas por closer, compara com metas diárias e mensais, e envia relatório
de fechamento do dia no Telegram.

## Pre-Requisitos
- Supabase com tabelas: `movements`, `closers`, `sdrs`, `metas_mensais`, `metas_closers`
- Metas do mês configuradas (níveis: mínima, super, ultra, black)

## Dados

### Fontes Supabase
- `movements` — lançamentos diários (agendamentos, reuniões, reagendamentos, no-shows, ganhos)
- `closers` / `sdrs` — lookup de nomes
- `metas_mensais` — metas por nível (mínima, super, ultra, black)
- `metas_closers` — metas individuais por closer

## Pipeline (automático)

### Step 1: Coletar Movimentos
- Query `movements` filtrado por `data_raw = hoje`
- Agregar por closer: agendamentos, reuniões, reagendamentos, no-shows, vendas

### Step 2: Calcular Metas
- Comparar vendas do dia vs meta diária
- Calcular acumulado do mês vs metas mensais (mínima → black)
- Calcular % de atingimento por closer

### Step 3: Gerar Relatório
- Gera via LLM usando `resultados-dia-tmpl.md`
- Inclui ranking de closers, detalhes de cada venda (serviço, origem, SDR)
- Adiciona comentário estratégico sobre performance e projeção do mês

### Step 4: Enviar
- Envia no Telegram com formatação HTML

## Execução Manual
```bash
node cron-rafa.js --zapecontrol
# ou para data específica:
node cron-rafa.js --zapecontrol --date=2026-04-02
```

## Output
Mensagem Telegram com resultados do dia, ranking de closers e projeção mensal.
