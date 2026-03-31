# Epic 5 — SDR Station

**Status:** Draft
**PRD:** docs/prd-sdr-station.md
**Author:** Morgan (PM)
**Created:** 2026-03-31

## Epic Goal
Construir módulo completo de SDR Station no zapecontrol que substitui o CRM CLINT, unificando telefonia (Power Dialer 5 linhas com BINA), inbox multicanal (WhatsApp + Instagram), CRM com pipeline, cadência automática, gravação com AI copilot, e métricas de performance.

## Epic Description

**Existing System Context:**
- Current: zapecontrol é uma aplicação Next.js + Supabase com módulos de comercial, marketing e cadastros
- Technology stack: Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase
- Integration points: sidebar, permissions.ts, Supabase auth, Supabase Storage

**Enhancement Details:**
- Novo módulo SDR Station sob `/comercial/sdr-station/`
- Integrações externas: Twilio (Voice + WebRTC), Evolution API / Twilio WhatsApp, Meta Graph API (Instagram), OpenAI Whisper, Claude API
- Uso interno, 1-2 SDRs, substituição total do CRM CLINT

## Stories

| Story | Título | Executor | Quality Gate | Depende de |
|-------|--------|----------|--------------|------------|
| 5.1 | Fundação: Schema e estrutura base | @data-engineer | @dev | — |
| 5.2 | CRM Core: Leads e Pipeline | @dev | @architect | 5.1 |
| 5.3 | Integração Twilio: Setup e Pool de Números | @dev | @architect | 5.1 |
| 5.4 | Power Dialer: Discagem Simultânea | @dev | @architect | 5.2, 5.3 |
| 5.5 | Gravação e Compliance | @dev | @architect | 5.4 |
| 5.6 | Inbox Multicanal (WhatsApp + Instagram) | @dev | @architect | 5.2 |
| 5.7 | Cadência Automática | @dev | @architect | 5.4, 5.6 |
| 5.8 | Agenda e Handoff para Closer | @dev | @architect | 5.2, 5.7 |
| 5.9 | Transcrição e AI Analysis | @dev | @architect | 5.5 |
| 5.10 | Copilot Real-Time | @dev | @architect | 5.9 |
| 5.11 | Métricas e Dashboard | @dev | @architect | 5.2, 5.4, 5.6 |

## Execution Waves (Parallel Opportunities)

```
Wave 1: 5.1 (Fundação)
Wave 2: 5.2 (CRM) + 5.3 (Twilio Setup)     ← paralelo
Wave 3: 5.4 (Dialer) + 5.6 (Inbox)          ← paralelo
Wave 4: 5.5 (Gravação) + 5.7 (Cadência) + 5.11 (Métricas)  ← paralelo
Wave 5: 5.8 (Agenda) + 5.9 (Transcrição)    ← paralelo
Wave 6: 5.10 (Copilot)
```

## Compatibility Requirements

- [x] Existing APIs remain unchanged (novas rotas sob `/api/sdr/*`)
- [x] Database schema changes are backward compatible (novas tabelas com prefixo `sdr_`)
- [x] UI changes follow existing patterns (mesmo layout, sidebar, componentes)
- [x] Performance impact is minimal (módulo isolado)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Twilio WebRTC instável | Média | Alto | Fallback, indicador qualidade |
| Números marcados spam | Alta | Alto | Rodízio, volume controlado |
| Instagram API approval delay | Média | Médio | WhatsApp primeiro, Instagram como flag |
| Custo Twilio escalar | Baixa | Médio | Alertas, limite diário |
| Cadência ligar fora horário | Baixa | Alto | Hard-lock ANATEL, timezone-aware |

**Rollback Plan:** Cada story é incremental. Se qualquer story falhar, as anteriores continuam funcionando. O módulo é isolado — remoção das rotas `/api/sdr/*` e tabelas `sdr_*` reverte completamente.

## Definition of Done

- [ ] Todas as 11 stories completadas com acceptance criteria met
- [ ] Funcionalidades existentes do zapecontrol verificadas e intactas
- [ ] Integrações (Twilio, WhatsApp, Instagram, Whisper, Claude) funcionando
- [ ] Compliance ANATEL e LGPD validado
- [ ] SDR consegue operar fluxo completo: importar leads → discar → conversar → agendar → follow-up
- [ ] Dashboard de métricas operacional com dados reais
