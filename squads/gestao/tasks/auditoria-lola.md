# Task: Auditoria Diária da Lola (SDR)

## Metadata
- agent: head-comercial
- trigger: "*auditoria-lola"
- cron: `0 23 * * *` (20h BRT)
- script: `cron-rafa-audit.js`
- template: `templates/auditoria-lola-tmpl.md`
- elicit: false

## Descricao
Audita todas as conversas da Lola (SDR automatizada via WhatsApp) do dia.
Avalia qualidade da qualificação, naturalidade, aderência ao processo
e gera sugestões de melhoria pro system prompt dela.
Requer aprovação do Neto para aplicar mudanças.

## Pre-Requisitos
- Leads com mensagens do dia em `data/leads/`
- Processo da Lola documentado em `data/processo-completo-lola-sdr.md`
- DNA do Rafa em `agents/dna/head-comercial-dna.md`
- Template: `auditoria-lola-tmpl.md`

## Pipeline (automático)

### Step 1: Coletar Conversas do Dia
- Lê todos os JSONs em `data/leads/`
- Filtra leads com mensagens de hoje
- Extrai: nome, telefone, estado, step de qualificação, portões passados

### Step 2: Auditar via LLM
Para cada conversa, avalia:
1. **Nota geral** (0-10) com justificativa
2. **Acertos** — o que a Lola fez bem
3. **Erros** — onde errou (com trecho exato)
4. **Red flags** — violações graves das regras
5. **Naturalidade** (0-10) — pareceu humana ou robô?
6. **Aderência ao processo** — pulou etapas? perguntas demais?
7. **Qualificação** — portões bem detectados?
8. **Sugestões de melhoria** — instruções concretas pro prompt

### Step 3: Salvar e Enviar
- Salva relatório em `data/relatorios/lola-audit-{timestamp}.txt`
- Salva sugestões pendentes em `data/pending-improvements.json`
- Envia relatório no Telegram

### Step 4: Aguardar Aprovação
- Envia mensagem pedindo "APROVAR LOLA" ou "IGNORAR"
- Quando Neto aprova, `telegram-rafa.js` lê `pending-improvements.json` e aplica

## Execução Manual
```bash
node cron-rafa-audit.js --now
```

## Output
Relatório de auditoria no Telegram + sugestões pendentes aguardando aprovação.
