# SDR Station — Brownfield Enhancement PRD

**Template:** brownfield-prd-template-v2 | **Version:** 1.0 | **Date:** 2026-03-31 | **Author:** Morgan (PM)

---

## 1. Intro Project Analysis and Context

### Analysis Source
- IDE-based analysis — projeto zapecontrol carregado

### Current Project State
O zapecontrol é uma aplicação Next.js com Supabase que gerencia operações internas — incluindo módulos de comercial, marketing, cadastros e webhooks. O projeto possui sidebar com navegação, API routes, e integração com Supabase.

### Enhancement Scope

| Item | Valor |
|------|-------|
| **Tipo** | New Feature Addition + Integration with New Systems |
| **Impacto** | Significant Impact (substantial new code + integrações externas) |

**Descrição:** Construir um módulo completo de SDR Station dentro do zapecontrol que substitui o CRM atual (CLINT). Inclui: Power Dialer (5 linhas simultâneas via Twilio com BINA por DDD), Inbox Multicanal (WhatsApp + Instagram Direct), CRM com pipeline kanban, cadência automática de contato, gravação de chamadas com transcrição AI, copilot em tempo real, métricas de performance, e sistema de agendamento/handoff para closers.

### Goals
- Eliminar tempo ocioso do SDR entre ligações com discagem automática (5 linhas)
- Unificar telefonia + WhatsApp + Instagram + CRM em uma única interface
- Substituir o CRM CLINT por solução interna com controle total
- Gerar inteligência sobre performance (gravação, transcrição, copilot AI)
- Automatizar cadência de contato (3 tentativas ligação → WhatsApp/Instagram)
- Manter compliance total com regulamentações ANATEL e LGPD

### Background Context
A operação de SDR hoje é manual — o SDR usa o CRM CLINT para gerenciar leads, liga um por um, e alterna entre WhatsApp e telefone sem integração. Com 1-2 SDRs, a produtividade é limitada pelo tempo entre ligações. O Power Dialer com 5 linhas simultâneas e BINA por DDD local aumenta significativamente a taxa de conexão, enquanto a cadência automática elimina decisões manuais sobre quando e como contatar cada lead. O copilot AI (modelado a partir do copilot do closer já existente) adiciona inteligência à operação.

---

## 2. Requirements

### Functional Requirements

- **FR1:** O sistema deve disparar até 5 chamadas simultâneas via Twilio API quando o SDR iniciar uma rodada de discagem
- **FR2:** Quando uma chamada for atendida, o sistema deve conectar automaticamente ao SDR via WebRTC e derrubar as demais chamadas pendentes
- **FR3:** O sistema deve utilizar BINA rotativa por DDD, selecionando automaticamente um número local correspondente ao DDD do lead
- **FR4:** O sistema deve gravar todas as chamadas automaticamente e armazenar o áudio no Supabase Storage
- **FR5:** O sistema deve detectar chamadas perdidas (lead ligou de volta) e exibir notificação ao SDR com opção de retorno
- **FR6:** O sistema deve fornecer inbox multicanal (WhatsApp + Instagram Direct) bidirecional com suporte a texto, áudio, imagens e templates de mensagem
- **FR7:** O sistema deve executar cadência automática por lead: 3 tentativas de ligação → disparo de WhatsApp/Instagram → descarte/repool
- **FR8:** O sistema deve respeitar horários permitidos pela ANATEL (seg-sex 8h-21h, sáb 8h-13h, sem domingos/feriados)
- **FR9:** O CRM deve gerenciar leads com pipeline kanban: Novo → Tentativa → Conectado → Qualificado → Agendado → Descartado
- **FR10:** O sistema deve manter timeline unificada por lead (chamadas + WhatsApp + Instagram + notas manuais)
- **FR11:** O sistema deve permitir importação de leads via CSV e integração com CRM externo via API
- **FR12:** O SDR deve poder agendar reunião na agenda do closer e fazer follow-up automático até a data da call
- **FR13:** O sistema deve transcrever chamadas automaticamente (Whisper API) e gerar resumo via Claude API
- **FR14:** O copilot AI deve fornecer sugestões em tempo real durante a ligação via WebSocket
- **FR15:** O sistema deve exibir dashboard de métricas: taxa de conexão, chamadas/hora, tempo médio, conversão por etapa, heatmap de melhor horário, ranking por SDR, métricas por canal
- **FR16:** Após cada chamada, o sistema deve exibir tela de disposição rápida (1 clique): Atendeu / Não atendeu / Agendar / Sem interesse / Número errado / Caixa postal
- **FR17:** O sistema deve integrar com Instagram Direct API (Meta Graph API) para envio e recebimento de mensagens, com histórico unificado na timeline do lead

### Non-Functional Requirements

- **NFR1:** Latência máxima de 500ms entre atendimento do lead e conexão com o SDR (WebRTC bridge)
- **NFR2:** O sistema deve suportar 1-2 SDRs simultâneos sem degradação de performance
- **NFR3:** Gravações devem ser retidas por mínimo 90 dias com possibilidade de extensão
- **NFR4:** A interface do SDR deve funcionar em desktop (Chrome/Edge), não é necessário suporte mobile
- **NFR5:** O custo operacional mensal deve se manter abaixo de R$600 para a operação de 1-2 SDRs
- **NFR6:** O sistema deve operar dentro das regulamentações ANATEL e LGPD (caller ID válido, lista Não Perturbe, consentimento para gravação)
- **NFR7:** Transcrições devem ser geradas em até 5 minutos após o término da chamada
- **NFR8:** O pool de números Twilio deve começar com os 3-5 DDDs mais frequentes da base de leads

### Compatibility Requirements

- **CR1:** As API routes existentes do zapecontrol não devem ser afetadas — o módulo SDR Station opera em rotas próprias (`/api/sdr/*`)
- **CR2:** O schema Supabase existente deve permanecer intacto — novas tabelas serão adicionadas sem alterar as existentes
- **CR3:** A UI deve seguir os padrões visuais já estabelecidos no zapecontrol (sidebar, layout de painel, componentes existentes)
- **CR4:** A autenticação e permissões existentes (`permissions.ts`) devem ser reutilizadas e estendidas para o módulo SDR

---

## 3. User Interface Enhancement Goals

### Integration with Existing UI
O módulo SDR Station será uma nova seção no painel do zapecontrol, acessível via sidebar existente. Seguirá os mesmos padrões de layout, componentes e design system já estabelecidos (cards, tabelas, formulários). A tela principal será um workspace dedicado onde o SDR opera sem precisar navegar entre páginas durante o fluxo de trabalho.

### Modified/New Screens and Views

| Tela | Tipo | Descrição |
|------|------|-----------|
| `/comercial/sdr-station` | Nova | Workspace principal do SDR — dialer + inbox + lead ativo |
| `/comercial/sdr-station/leads` | Nova | Lista de leads com filtros, tags, import CSV |
| `/comercial/sdr-station/pipeline` | Nova | Kanban do pipeline (Novo -> Descartado) |
| `/comercial/sdr-station/cadencias` | Nova | Configuração de cadências automáticas |
| `/comercial/sdr-station/metricas` | Nova | Dashboard de métricas e performance |
| `/comercial/sdr-station/gravacoes` | Nova | Lista de gravações com transcrição e score AI |
| `/comercial/sdr-station/numeros` | Nova | Gestão do pool de números Twilio (BINA por DDD) |
| Sidebar | Modificada | Adicionar seção "SDR Station" com sub-itens |

### UI Consistency Requirements
- Reutilizar componentes existentes do zapecontrol (Table, Card, Button, Modal, Sidebar)
- Manter paleta de cores e tipografia consistentes
- O softphone WebRTC será um componente flutuante (bottom-right) persistente durante a navegação
- O inbox multicanal seguirá padrão de chat (mensagens à esquerda/direita, bolhas, timestamps) com indicador visual do canal (WhatsApp / Instagram / Telefone)
- Disposição rápida pós-call será um modal overlay com botões grandes para 1-clique

---

## 4. Technical Constraints and Integration Requirements

### Existing Technology Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + permissions.ts customizado |
| **Deploy** | Vercel |
| **Storage** | Supabase Storage |

### Integration Approach

**Database Integration Strategy:**
Novas tabelas no Supabase sem alterar schema existente:
- `sdr_leads` — leads com dados de contato, origem, status, tags
- `sdr_calls` — log de chamadas (lead_id, sdr_id, duration, recording_url, status, disposition)
- `sdr_messages` — mensagens multicanal (lead_id, direction, content, channel [whatsapp|instagram|phone], media_url, status)
- `sdr_interactions` — timeline unificada (lead_id, type, reference_id, timestamp)
- `sdr_cadences` — configuração de cadências (steps, intervals, channels)
- `sdr_cadence_executions` — estado de execução por lead (current_step, next_action_at)
- `sdr_numbers` — pool de números Twilio (number, ddd, status, call_count)
- `sdr_transcriptions` — transcrições e análises AI (call_id, text, summary, score)
- `sdr_schedules` — agendamentos de reunião com closer (lead_id, closer_id, datetime, status)

**API Integration Strategy:**
- Twilio Voice API — chamadas, gravação, webhooks
- Twilio Client SDK (WebRTC) — softphone no browser
- Evolution API ou Twilio WhatsApp — mensagens bidirecionais WhatsApp
- Meta Graph API — Instagram Direct messaging
- OpenAI Whisper API — transcrição de áudio
- Claude API — resumo, score, copilot real-time
- Todas as rotas novas sob `/api/sdr/*`

**Frontend Integration Strategy:**
- Reutilizar layout do painel existente `(panel)`
- Novas páginas sob `app/src/app/(panel)/comercial/sdr-station/`
- Componentes compartilhados em `app/src/components/sdr/`
- WebSocket para copilot real-time e notificações de chamada perdida

**Testing Integration Strategy:**
- Testes de integração para webhooks Twilio (signature validation)
- Testes unitários para lógica de cadência e BINA
- Testes E2E para fluxo completo de discagem (mock Twilio em dev)

### Code Organization and Standards

**File Structure:**
```
app/src/app/(panel)/comercial/sdr-station/
├── page.tsx                    # Workspace principal
├── leads/page.tsx              # Lista de leads
├── pipeline/page.tsx           # Kanban
├── cadencias/page.tsx          # Config cadências
├── metricas/page.tsx           # Dashboard
├── gravacoes/page.tsx          # Gravações + transcrições
└── numeros/page.tsx            # Pool de números

app/src/app/api/sdr/
├── calls/route.ts              # Iniciar/gerenciar chamadas
├── calls/webhook/route.ts      # Webhooks Twilio
├── calls/recording/route.ts    # Gravações
├── whatsapp/route.ts           # Envio/recebimento WhatsApp
├── whatsapp/webhook/route.ts   # Webhooks WhatsApp
├── instagram/route.ts          # Envio/recebimento Instagram
├── instagram/webhook/route.ts  # Webhooks Instagram (Meta)
├── leads/route.ts              # CRUD leads
├── leads/import/route.ts       # Import CSV
├── cadences/route.ts           # CRUD cadências
├── cadences/execute/route.ts   # Motor de execução
├── transcriptions/route.ts     # Transcrição + AI
├── copilot/route.ts            # Copilot streaming
├── metrics/route.ts            # Dados de métricas
└── numbers/route.ts            # Gestão pool números

app/src/components/sdr/
├── softphone.tsx               # Componente WebRTC flutuante
├── call-controls.tsx           # Controles de chamada
├── disposition-modal.tsx       # Modal pós-call
├── multichannel-inbox.tsx      # Chat WhatsApp + Instagram
├── lead-timeline.tsx           # Timeline unificada
├── pipeline-board.tsx          # Kanban
├── cadence-builder.tsx         # Config cadência
└── metrics-dashboard.tsx       # Charts e KPIs
```

**Naming/Coding Standards:** Seguir padrões existentes — TypeScript, kebab-case para arquivos, PascalCase para componentes, camelCase para funções.

### Deployment and Operations

- **Build Process:** Sem mudanças — Next.js build padrão via Vercel
- **Deployment:** Variáveis de ambiente novas: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`
- **Monitoring:** Logs de chamada no Supabase + métricas no dashboard interno
- **Config:** Pool de números e cadências configuráveis via UI admin

### Risk Assessment

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Twilio WebRTC instável em redes lentas | Média | Alto | Fallback para redial, indicador de qualidade de conexão |
| Número marcado como spam pelas operadoras | Alta | Alto | Rodízio de números, volume controlado por número, monitorar status |
| Custo Twilio escalar acima do esperado | Baixa | Médio | Alertas de custo, limite diário configurável |
| Whisper transcrição imprecisa em PT-BR | Média | Médio | Usar modelo large-v3, permitir correção manual |
| Cadência automática ligar fora de horário | Baixa | Alto | Scheduler com hard-lock de horários ANATEL, timezone-aware |
| Evolution API instabilidade | Média | Médio | Retry com backoff, fallback para Twilio WhatsApp |
| Instagram API approval delay | Média | Médio | Iniciar processo de App Review na Meta desde a Story 1.1, implementar WhatsApp primeiro |
| Instagram API rate limits | Média | Baixo | Fila de envio com throttling, priorizar WhatsApp para volume |

---

## 5. Epic Structure

**Epic Structure Decision:** Epic único — "SDR Station"

**Rationale:** Todos os módulos (CRM, Dialer, WhatsApp, Instagram, Cadência, AI, Métricas) são interdependentes e formam um produto coeso. Separar em múltiplos épicos criaria overhead de coordenação desnecessário. A estratégia é um épico com stories sequenciais onde cada uma entrega valor incremental e mantém o sistema funcional.

---

## 6. Epic 1: SDR Station

**Epic Goal:** Construir módulo completo de SDR Station no zapecontrol que substitui o CRM CLINT, unificando telefonia (Power Dialer 5 linhas com BINA), inbox multicanal (WhatsApp + Instagram), CRM com pipeline, cadência automática, gravação com AI copilot, e métricas de performance.

**Integration Requirements:** Supabase existente, sidebar do painel, sistema de permissões, padrões de UI.

---

### Story 1.1 — Fundação: Schema do banco e estrutura base

> Como SDR, quero que a estrutura de dados do módulo esteja pronta, para que todas as funcionalidades subsequentes tenham onde persistir informações.

**Acceptance Criteria:**
1. Migrations Supabase criadas para todas as tabelas (`sdr_leads`, `sdr_calls`, `sdr_messages`, `sdr_interactions`, `sdr_cadences`, `sdr_cadence_executions`, `sdr_numbers`, `sdr_transcriptions`, `sdr_schedules`)
2. RLS (Row Level Security) configurado nas tabelas
3. Tipos TypeScript gerados a partir do schema
4. Seção "SDR Station" adicionada na sidebar com navegação funcional
5. Página base `/comercial/sdr-station` renderiza sem erros
6. Permissões estendidas no `permissions.ts` para o módulo SDR
7. Iniciar processo de App Review na Meta para Instagram Direct API

**Integration Verification:**
- IV1: Tabelas existentes do zapecontrol permanecem inalteradas
- IV2: Sidebar existente funciona normalmente com a nova seção
- IV3: Sistema de auth/permissões existente continua operando

---

### Story 1.2 — CRM Core: Leads e Pipeline

> Como SDR, quero gerenciar meus leads em um pipeline visual, para ter controle total sobre o status de cada contato sem depender do CLINT.

**Acceptance Criteria:**
1. CRUD completo de leads (criar, editar, visualizar, deletar)
2. Import de leads via CSV com mapeamento de colunas
3. Pipeline kanban funcional com drag-and-drop (Novo -> Tentativa -> Conectado -> Qualificado -> Agendado -> Descartado)
4. Filtros por status, tags, SDR responsável, data de criação
5. Sistema de tags customizáveis
6. Página de detalhe do lead com timeline (vazia por enquanto)
7. Busca por nome, telefone, email

**Integration Verification:**
- IV1: Dados de leads persistem corretamente no Supabase
- IV2: Permissões respeitam o usuário logado
- IV3: Performance aceitável com 5.000+ leads

---

### Story 1.3 — Integração Twilio: Setup e Pool de Números

> Como gestor, quero configurar os números Twilio e o pool de BINA por DDD, para que o dialer use o número local correto para cada lead.

**Acceptance Criteria:**
1. Tela de gestão de números (`/numeros`) com CRUD
2. Cadastro de número Twilio com DDD associado
3. Lógica de seleção automática de número por DDD do lead
4. Rodízio automático entre números do mesmo DDD
5. Status do número (ativo, pausado, bloqueado) com contadores
6. Validação de credenciais Twilio (Account SID, Auth Token, API Key/Secret)
7. Teste de chamada funcional (ligar para número de teste)

**Integration Verification:**
- IV1: Credenciais Twilio armazenadas de forma segura (env vars)
- IV2: Seleção de BINA funciona corretamente para DDDs mapeados e fallback para DDDs sem número local
- IV3: Nenhum impacto nas rotas API existentes

---

### Story 1.4 — Power Dialer: Discagem Simultânea

> Como SDR, quero disparar 5 chamadas simultaneamente e ser conectado automaticamente quando alguém atender, para maximizar meu tempo produtivo.

**Acceptance Criteria:**
1. Componente softphone WebRTC flutuante funcional
2. Botão "Discar Próximos" dispara até 5 chamadas simultâneas da fila
3. BINA aplicada automaticamente por DDD do lead
4. Ao atender, sistema conecta chamada ao SDR via conference/bridge em <500ms
5. Chamadas não atendidas são derrubadas automaticamente
6. Status visual de cada chamada em tempo real (discando, tocando, atendida, finalizada)
7. Modal de disposição rápida após cada chamada (Atendeu / Não atendeu / Agendar / Sem interesse / Número errado / Caixa postal)
8. Log de chamada salvo na tabela `sdr_calls` e na timeline do lead
9. Notificação visual de chamada perdida (lead retornando)

**Integration Verification:**
- IV1: WebRTC funciona em Chrome e Edge
- IV2: Webhooks Twilio processados corretamente (signature validation)
- IV3: Timeline do lead atualizada em tempo real

---

### Story 1.5 — Gravação e Compliance

> Como gestor, quero que todas as chamadas sejam gravadas automaticamente e dentro da legislação, para ter histórico e base para análise de performance.

**Acceptance Criteria:**
1. Gravação automática de todas as chamadas via Twilio Recording API
2. Áudio armazenado no Supabase Storage com link na tabela `sdr_calls`
3. Controle de horários ANATEL (seg-sex 8h-21h, sáb 8h-13h, bloqueio dom/feriado)
4. Caller ID válido em todas as chamadas
5. Tela de gravações (`/gravacoes`) com player de áudio, filtros por data/SDR/lead
6. Retenção mínima de 90 dias configurável
7. Aviso de gravação no início da chamada (compliance LGPD)

**Integration Verification:**
- IV1: Áudios acessíveis via Supabase Storage com URLs assinadas
- IV2: Bloqueio de horário impede discagem fora dos horários permitidos
- IV3: Armazenamento de áudio não impacta performance do Supabase

---

### Story 1.6 — Inbox Multicanal (WhatsApp + Instagram)

> Como SDR, quero enviar e receber mensagens por WhatsApp e Instagram Direct no mesmo painel, para atender o lead no canal que ele preferir.

**Acceptance Criteria:**
1. Inbox multicanal integrado no workspace do SDR
2. Envio de mensagens de texto e áudio via WhatsApp
3. Envio de mensagens de texto e imagens via Instagram Direct
4. Recebimento de mensagens em tempo real via webhooks (ambos canais)
5. Templates de mensagem pré-configurados com variáveis (nome, empresa, etc.)
6. Histórico de conversa por lead na timeline unificada
7. Indicador visual do canal em cada mensagem (ícone WhatsApp / Instagram / Telefone)
8. Indicador de mensagem não lida
9. Status de entrega (enviado, entregue, lido) quando disponível
10. Número da empresa como remetente (WhatsApp) / Conta business (Instagram)
11. Filtro por canal no inbox
12. Identificação do lead por conta Instagram (vinculação ao lead)

**Integration Verification:**
- IV1: Webhooks WhatsApp e Instagram processados sem conflito com outras rotas
- IV2: Mensagens persistem na tabela `sdr_messages` com channel correto e aparecem na timeline
- IV3: Templates renderizam variáveis corretamente em ambos os canais

**Notas:**
- Instagram Direct API exige Meta Business Suite + App Review (processo iniciado na Story 1.1)
- Rate limits do Instagram mais restritivos — fila de envio com throttling
- Se aprovação Instagram atrasar, WhatsApp funciona independente

---

### Story 1.7 — Cadência Automática

> Como SDR, quero que o sistema execute automaticamente a sequência de contato (3 ligações -> WhatsApp/Instagram), para não precisar lembrar e decidir manualmente o próximo passo.

**Acceptance Criteria:**
1. Tela de configuração de cadências (`/cadencias`) com builder visual
2. Cadência padrão: Dia 1 liga, Dia 2 liga, Dia 4 liga, Dia 5 WhatsApp, Dia 6 Instagram
3. Motor de execução (scheduler/cron) que processa `sdr_cadence_executions`
4. Leads entram automaticamente na cadência ao serem criados ou importados
5. SDR pode pausar/retomar/pular etapa manualmente
6. Cadência respeita horários ANATEL automaticamente
7. Lead sai da cadência ao: atender, agendar, pedir para não ligar, ou completar todas as etapas
8. Dashboard mostra quantos leads estão em cada etapa da cadência
9. Suporte a múltiplos canais por step (telefone, WhatsApp, Instagram)

**Integration Verification:**
- IV1: Scheduler executa dentro dos horários corretos (timezone-aware)
- IV2: Cadência integra corretamente com o dialer (Story 1.4) e inbox multicanal (Story 1.6)
- IV3: Performance do scheduler aceitável com 1.000+ leads em cadência simultânea

---

### Story 1.8 — Agenda e Handoff para Closer

> Como SDR, quero agendar reuniões na agenda do closer e acompanhar o follow-up automaticamente, para garantir que o lead compareça.

**Acceptance Criteria:**
1. Ao marcar disposição "Agendar", abrir formulário de agendamento (data, hora, closer, observações)
2. Evento salvo na tabela `sdr_schedules` com status (agendado, confirmado, realizado, no-show)
3. Follow-up automático via WhatsApp antes da reunião (D-1, D-0)
4. Visualização de agenda por closer
5. Indicador de próximos agendamentos no workspace do SDR
6. Lead move automaticamente para status "Agendado" no pipeline

**Integration Verification:**
- IV1: Agendamentos persistem corretamente
- IV2: Follow-up automático usa o motor de cadência existente (Story 1.7)
- IV3: Status do pipeline atualiza automaticamente

---

### Story 1.9 — Transcrição e AI Analysis

> Como gestor, quero que as chamadas sejam transcritas e analisadas por AI automaticamente, para avaliar performance sem ouvir cada gravação.

**Acceptance Criteria:**
1. Após chamada finalizada, áudio enviado para Whisper API (transcrição automática)
2. Transcrição salva na tabela `sdr_transcriptions`
3. Claude API gera resumo da ligação, score de qualidade (1-10), e pontos de melhoria
4. Detecção automática de objeções e como foram tratadas
5. Tela de gravações mostra transcrição + análise lado a lado com player de áudio
6. Processamento em background (não bloqueia o SDR) com status visível
7. Tempo máximo de processamento: 5 minutos após término da chamada

**Integration Verification:**
- IV1: Transcrição PT-BR com qualidade aceitável (Whisper large-v3)
- IV2: Custo por transcrição dentro do orçamento (~R$0,01/min)
- IV3: Análise AI consistente e útil para coaching

---

### Story 1.10 — Copilot Real-Time

> Como SDR, quero receber sugestões do AI em tempo real durante a ligação, para melhorar minha performance e tratar objeções com mais confiança.

**Acceptance Criteria:**
1. Painel de copilot visível durante a chamada (lateral ao softphone)
2. Streaming de sugestões via WebSocket baseado no áudio da conversa
3. Detecção de objeções com contra-argumentos sugeridos
4. Sugestão de próximos passos baseado no contexto da conversa
5. Dados do lead visíveis durante a chamada (histórico, empresa, notas)
6. Copilot modelado a partir do copilot do closer já existente
7. Toggle para ativar/desativar copilot por preferência do SDR

**Integration Verification:**
- IV1: WebSocket estável durante chamadas de até 30 minutos
- IV2: Latência de sugestão < 3 segundos
- IV3: Copilot não interfere na qualidade de áudio da chamada

---

### Story 1.11 — Métricas e Dashboard

> Como gestor, quero um dashboard com métricas de performance dos SDRs, para tomar decisões baseadas em dados.

**Acceptance Criteria:**
1. Dashboard (`/metricas`) com período selecionável (dia, semana, mês)
2. KPIs principais: taxa de conexão, chamadas/hora, tempo médio de conversa, custo por conexão
3. Conversão por etapa do pipeline (funil)
4. Heatmap de melhor horário para ligar (por dia/hora)
5. Ranking comparativo entre SDRs (se houver mais de 1)
6. Taxa de no-show em agendamentos
7. Speed to lead (tempo entre entrada do lead e primeira tentativa)
8. Métricas por canal (WhatsApp vs Instagram vs Telefone) — taxa de resposta, tempo de resposta
9. Gráficos interativos (charts) com export básico

**Integration Verification:**
- IV1: Queries de métricas performam bem com volume de dados de 3+ meses
- IV2: Dashboard carrega em < 3 segundos
- IV3: Dados consistentes com os registros nas tabelas de chamadas e mensagens

---

## Story Dependency Map

| Story | Módulo | Depende de |
|-------|--------|------------|
| 1.1 | Fundação (schema + sidebar) | — |
| 1.2 | CRM Core (leads + pipeline) | 1.1 |
| 1.3 | Twilio Setup (números + BINA) | 1.1 |
| 1.4 | Power Dialer (5 linhas + WebRTC) | 1.2, 1.3 |
| 1.5 | Gravação + Compliance | 1.4 |
| 1.6 | Inbox Multicanal (WhatsApp + Instagram) | 1.2 |
| 1.7 | Cadência Automática | 1.4, 1.6 |
| 1.8 | Agenda + Handoff | 1.2, 1.7 |
| 1.9 | Transcrição + AI Analysis | 1.5 |
| 1.10 | Copilot Real-Time | 1.9 |
| 1.11 | Métricas + Dashboard | 1.2, 1.4, 1.6 |

---

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Criação inicial | 2026-03-31 | 1.0 | PRD completo SDR Station com Instagram | Morgan (PM) |
