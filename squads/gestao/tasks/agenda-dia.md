# Task: Agenda do Dia

## Metadata
- agent: head-comercial
- trigger: "*agenda"
- cron: `0 10 * * *` (07h BRT)
- script: `cron-rafa.js --agenda`
- template: `templates/agenda-tmpl.md`
- elicit: false

## Descricao
Puxa a agenda de todos os closers no Google Calendar, classifica os eventos
por tipo (venda, fechamento, no-show, reagendamento, pendente) usando o mapa
de cores, e envia resumo estratégico no Telegram.

## Pre-Requisitos
- Google Calendar OAuth configurado
- Closers cadastrados em `data/closers.json` com emails do Calendar
- Mapa de cores: 🟡 Venda, 🟢 Fechamento, 🔴 No-show, 🟠 Reagend., 🔵 Pendente, 🟣 Ativ. Diária

## Pipeline (automático)

### Step 1: Coletar Eventos
- Para cada closer, consulta Google Calendar API
- Filtra eventos do dia (timezone São Paulo)
- Ignora bloqueios (cor branca)

### Step 2: Classificar
- Mapeia `colorId` do evento para tipo comercial
- Contabiliza totais por tipo por closer

### Step 3: Gerar Agenda
- Gera via LLM usando `agenda-tmpl.md`
- Adiciona 1 linha de comentário estratégico por closer (carga, oportunidades, riscos)

### Step 4: Enviar
- Envia no Telegram com formatação HTML

## Execução Manual
```bash
node cron-rafa.js --agenda
```

## Output
Mensagem Telegram com agenda completa do dia, eventos por closer e insights.
