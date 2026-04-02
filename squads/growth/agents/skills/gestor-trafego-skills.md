# Skills — Léo (Gestor de Tráfego)

## Skill Tree

```
GESTOR DE TRÁFEGO
├── AUDITORIA DE CONTA
│   ├── Análise de Estrutura (campanhas, ad sets, ads)
│   ├── Detecção de Sobreposição de Público
│   ├── Avaliação de Tracking (Pixel + CAPI)
│   └── Score de Saúde da Conta (0-100)
│
├── DIAGNÓSTICO DE PERFORMANCE
│   ├── Análise de KPIs (CPA, ROAS, CTR, CPM, CVR)
│   ├── Identificação de Causa Raiz (CPMC Framework)
│   ├── Detecção de Saturação (frequência, CTR decay)
│   └── Correlação Causa-Efeito
│
├── OTIMIZAÇÃO DE CAMPANHAS
│   ├── Ajuste de Budget (Regra dos 20%)
│   ├── Pausar/Ativar Ads e Ad Sets (Kill Rules)
│   ├── Otimização de Público (expansão, exclusão, LAL)
│   ├── Otimização de Bid Strategy
│   └── Recomendação de Placement
│
├── CREATIVE INTELLIGENCE
│   ├── Análise de Performance de Criativos
│   ├── Detecção de Creative Fatigue
│   ├── Framework 3:2:2 para Testes
│   ├── Análise de Hook Rate e Hold Rate
│   └── Recomendação de Novos Ângulos
│
├── ESCALA
│   ├── Avaliação de Prontidão (escalar ou não?)
│   ├── Escala Vertical (budget incremental)
│   ├── Escala Horizontal (novo público/duplicação)
│   ├── CBO Graduation (ABO → CBO)
│   └── Advantage+ Migration
│
├── RELATÓRIOS & DASHBOARDS
│   ├── Relatório Diário de Performance
│   ├── Relatório Semanal Comparativo
│   ├── Dashboard Consolidado
│   ├── Análise de Funil (impression → sale)
│   └── Comparativo de Períodos
│
├── INTELIGÊNCIA COMPETITIVA
│   ├── Monitoramento de Ad Library
│   ├── Análise de Criativos Concorrentes
│   ├── Detecção de Tendências de Mercado
│   └── Benchmarking de Métricas
│
└── INTEGRAÇÃO COM FUNIL COMERCIAL
    ├── Correlação Lead Quality → Ad Source
    ├── Análise CPL → CPA → LTV
    ├── Feedback Loop com Equipe Comercial
    └── Alertas de Qualidade de Lead
```

---

## Detalhamento por Skill

### 1. Auditoria de Conta
**Nível:** Core
**O que faz:** Análise completa da estrutura da conta Meta Ads, verificando configurações, organização, tracking e oportunidades.

**Dimensões auditadas:**
| Dimensão | Peso | O que verifica |
|----------|------|---------------|
| Estrutura | 25% | Quantidade de campanhas, organização, nomenclatura |
| Segmentação | 25% | Públicos, sobreposição, exclusões |
| Criativos | 25% | Diversidade, performance, saturação |
| Tracking | 15% | Pixel, CAPI, eventos, atribuição |
| Budget | 10% | Distribuição, desperdício, oportunidade |

**Como executa:**
1. Puxa dados da conta via Meta Ads API (campanhas ativas, ad sets, ads)
2. Verifica estrutura: quantidade, nomenclatura, objetivos
3. Analisa sobreposição de público entre ad sets
4. Avalia diversidade e performance de criativos
5. Checa pixel, eventos e atribuição
6. Calcula score geral (0-100) com breakdown por dimensão
7. Lista red flags, oportunidades e plano de ação

---

### 2. Diagnóstico de Performance
**Nível:** Core
**O que faz:** Identifica exatamente por que uma campanha/conta está performando abaixo do esperado.

**Processo de diagnóstico:**
1. Coletar métricas do período (vs período anterior)
2. Identificar qual KPI está fora do target
3. Seguir árvore de decisão (DNA → Diagnóstico Rápido)
4. Isolar a causa raiz usando framework CPMC
5. Propor ação corretiva com impacto esperado

**Régua de urgência:**
| Desvio do Target | Urgência | Ação |
|-----------------|----------|------|
| CPA +10-20% | Baixa | Monitorar 48h |
| CPA +20-50% | Média | Diagnosticar e ajustar em 24h |
| CPA +50-100% | Alta | Diagnosticar e agir imediatamente |
| CPA +100%+ | Crítica | Pausar, diagnosticar, replanejar |

---

### 3. Otimização de Campanhas
**Nível:** Core
**O que faz:** Executa otimizações táticas no dia a dia — ajuste de budget, pausar/ativar, trocar público.

**Tipos de otimização:**

#### Budget
- Aumentar budget de winners (máx 20%/dia)
- Reduzir budget de underperformers
- Redistribuir entre campanhas
- **Pede confirmação** antes de executar

#### Ads / Ad Sets
- Pausar ads com CPA > 2x target
- Pausar ad sets com frequência > 3.5
- Ativar ads pausados que foram iterados
- **Executa automaticamente** kill rules, **pede confirmação** para ativar

#### Público
- Expandir público quando saturado
- Criar Lookalike de conversores
- Ajustar exclusões (clientes, leads recentes)
- **Recomenda** e pede confirmação

---

### 4. Creative Intelligence
**Nível:** Avançado
**O que faz:** Analisa performance de criativos, detecta fadiga, e estrutura testes usando framework 3:2:2.

**Métricas de criativo:**
| Métrica | O que indica | Benchmark |
|---------|-------------|-----------|
| Hook Rate | Atenção inicial (3s view / impressions) | ≥ 30% |
| Hold Rate | Retenção (ThruPlay / 3s view) | ≥ 25% |
| CTR | Interesse em agir | ≥ 1.5% |
| CVR | Conversão efetiva | ≥ 10% |
| CPA | Custo final | ≤ target |

**Detecção de Creative Fatigue:**
```
Criativo analisado
├── Frequência > 3.0?
│   ├── SIM + CTR caindo → SATURADO — pausar ou refresh
│   └── SIM + CTR estável → OK por enquanto, monitorar
├── CTR caiu > 20% vs primeiros 3 dias?
│   └── SIM → FADIGA — mesmo com frequência ok, público cansou do ângulo
└── CPA subindo com volume estável?
    └── SIM → DECLÍNIO — criativo perdendo eficiência
```

**Processo de teste (3:2:2):**
1. Definir hipótese (ex: "vídeo curto < 15s performa melhor que imagem")
2. Criar 3 visuais, 2 textos, 2 headlines
3. Configurar Dynamic Creative ou combinações manuais
4. Budget: R$30-50/dia por ad set de teste
5. Rodar até 1000+ impressões por combinação
6. Declarar winner pelo menor CPA com volume
7. Iterar: criar variações do winner

---

### 5. Escala
**Nível:** Avançado
**O que faz:** Avalia se uma campanha está pronta para escalar e executa a estratégia adequada.

**Checklist de prontidão para escala:**
- [ ] CPA ≤ target por 3+ dias consecutivos
- [ ] 50+ conversões no ad set
- [ ] Frequência < 2.5
- [ ] CTR estável ou crescendo
- [ ] Sem mudanças recentes na campanha (48h+)

**Estratégias de escala:**

| Estratégia | Quando usar | Como |
|-----------|------------|------|
| Vertical (budget) | CPA estável, frequência baixa | +20%/dia no budget |
| Horizontal (público) | Público saturando, quer testar novo | Duplicar ad set com novo público |
| CBO Graduation | 2-3 ad sets winners em ABO | Mover para CBO com budget consolidado |
| Advantage+ | Escala broad com criativos validados | Campanha ASC com top criativos |

---

### 6. Relatórios & Dashboards
**Nível:** Core
**O que faz:** Gera relatórios de performance em diferentes granularidades.

**Tipos de relatório:**

| Relatório | Frequência | Conteúdo |
|-----------|-----------|----------|
| Flash | Sob demanda | KPIs principais do dia atual |
| Diário | Todo dia | Performance completa + ações + recomendações |
| Semanal | Toda segunda | Comparativo semana vs semana + tendências |
| Mensal | Dia 1 | Consolidado do mês + análise de funil + ROI |

**Dados incluídos:**
- Investimento, leads, CPL, agendamentos, CPA, ROAS
- Top campanhas e criativos
- Alertas e red flags
- Ações executadas
- Recomendações para próximo período
- Comparativo com período anterior

---

### 7. Inteligência Competitiva
**Nível:** Estratégico
**O que faz:** Monitora o que os concorrentes estão fazendo em Meta Ads.

**Fontes:**
- Meta Ad Library (via API ou scraping)
- Dados do squad ad-spy
- Relatórios de inteligência existentes em `/squads/zapeads/intel/`

**Output:**
- Novos criativos detectados dos concorrentes
- Ângulos e hooks sendo usados
- Estimativa de investimento (baseado em Ad Library data)
- Oportunidades de diferenciação

---

### 8. Integração com Funil Comercial
**Nível:** Estratégico
**O que faz:** Conecta dados de ads com dados do comercial para medir qualidade real dos leads.

**Métricas cross-funil:**
```
Impressão → Clique → Lead → Agendamento → Call → Fechamento
    │          │        │         │           │         │
   CPM        CPC      CPL      CPA_agend   CPA_call  CPA_venda
```

**Feedback loop:**
- Se taxa de agendamento cai: problema no copy/targeting (lead frio)
- Se taxa de fechamento cai: problema na qualificação (lead errado)
- Se ambos ok mas volume baixo: problema de budget/escala

---

### 9. Conhecimento Técnico de Plataforma
**Nível:** Core
**O que faz:** Domínio completo do Meta Ads Manager — objetivos ODAX, eventos de otimização, Pixel/CAPI, Advantage+ Suite, bidding, placements, regras automatizadas, atribuição.

**Sub-skills críticas:**
- 6 objetivos de campanha (Awareness, Traffic, Engagement, Leads, App, Sales) — quando usar cada
- Eventos de otimização: padrão vs custom, AEM, hierarquia (Purchase > Lead > ViewContent)
- Pixel + CAPI: instalação, deduplicação, EMQ (score ≥ 6.0), troubleshooting
- Advantage+ Suite: Audience, Placements, Creative, Shopping (ASC), quando ativar/desativar
- Bidding: Highest Volume, Cost Cap, ROAS Goal, Bid Cap — decisão por fase da campanha
- Placements: 20+ posicionamentos, specs por formato, Advantage+ vs manual
- A/B Testing nativo: Experiments, holdout tests, significância estatística
- Regras automatizadas: kill rules, budget rules, alertas, scheduling

**Referência detalhada:** `skills/mapa-completo-skills-meta-ads.md` seções 1.1-1.12

---

### 10. Análise Avançada de Criativos e Copy
**Nível:** Avançado
**O que faz:** Análise profunda de criativos além de métricas básicas — copy frameworks, análise visual, LP fit.

**Sub-skills:**
- **Copy frameworks:** PAS, AIDA, BAB, 4Ps, PASTOR, Star-Chain-Hook, OATH
- **Hooks para mentoria:** "Você está vendendo na Shopee do jeito errado", "Como meu aluno saiu do zero...", "3 erros que estão matando suas vendas"
- **Ângulos por produto:** Aceleração (transformação, escala), Ultra (exclusividade), Shopee ADS (técnico, ROI)
- **Análise de LP:** Message match, bounce rate, page speed, form completion, scroll depth
- **Formatos:** UGC, talking head, carrossel de cases, screen capture, depoimento em vídeo
- **Thumb-stop ratio:** 3s views / reach — mais preciso que hook rate

**Referência detalhada:** `skills/mapa-completo-skills-meta-ads.md` seções 3.1-3.4

---

### 11. Domínio de Audiência
**Nível:** Avançado
**O que faz:** Gestão completa de públicos — custom audiences, lookalikes, retargeting avançado.

**Sub-skills:**
- **Custom audiences:** Website (por tempo, evento, página), customer list, engagement (IG, FB, video, lead form), lead form opener (OURO)
- **Lookalike:** Seeds de qualidade (compradores > leads qualificados > engagers), value-based LAL, stacking, refresh trimestral
- **Retargeting avançado:** Sequencial (dia 1-3 prova social, 4-7 educação, 8-14 oferta), por intenção, progressive exclusion
- **Broad targeting:** Funciona com Advantage+ e criativo forte — criativo é o filtro natural
- **Overlap tool:** Sobreposição > 30% = consolidar

**Referência detalhada:** `skills/mapa-completo-skills-meta-ads.md` seções 5.1-5.4

---

### 12. Métricas Financeiras e Unit Economics
**Nível:** Estratégico
**O que faz:** Conecta ads com visão de negócio — LTV, CAC, payback, break-even ROAS.

**Métricas:**
| Métrica | Fórmula | Target Zapeecomm |
|---------|---------|-----------------|
| LTV:CAC | LTV / CAC total | ≥ 3:1 |
| Break-even ROAS | 1 / Margem contribuição | Depende do produto |
| Payback Period | CAC / Receita mensal por cliente | < 3 meses |
| Contribution Margin | Receita - custos variáveis | Positiva |
| Cohort LTV | LTV por período de aquisição | Crescente |

**Análise de cohort:** Por período, por fonte, por criativo. Lead barato que não fecha vale menos que lead caro que fecha.

**Referência detalhada:** `skills/mapa-completo-skills-meta-ads.md` seções 4.1-4.6, 6.3

---

### 13. Low-Ticket Strategy
**Nível:** Estratégico
**O que faz:** Planejamento, execução e análise de campanhas de produtos low-ticket (R$27-R$297).

**Skill tree:**
```
LOW-TICKET
├── ESTRATÉGIA DE PRODUTO
│   ├── Tipos: mini-curso, template, workshop, desafio pago, comunidade
│   ├── Extração de conteúdo do high-ticket existente
│   ├── Pricing psychology (R$47 vs R$97 vs R$197)
│   └── Product ladder (low → mid → high)
│
├── FUNIS DE LOW-TICKET
│   ├── Tripwire (ad → compra → upsell → high-ticket)
│   ├── Self-Liquidating Offer (SLO)
│   ├── Flash Sale / Impulse
│   ├── Challenge pago
│   └── Stack de produtos
│
├── META ADS PARA LOW-TICKET
│   ├── Objetivo: Purchase (não Lead)
│   ├── Budget: R$50-300/dia (50 purchases/semana = learning OK)
│   ├── Criativo: direct response, preço no ad, urgência
│   ├── Público: broad funciona MELHOR (compra por impulso)
│   └── ASC: excelente para low-ticket com 10+ criativos
│
├── MONETIZAÇÃO
│   ├── Order Bump (30-60% do preço principal, CVR 15-35%)
│   ├── Upsell imediato pós-compra (CVR 10-25%)
│   ├── Downsell se recusar upsell
│   ├── Sequência nurture (email/WhatsApp 14 dias)
│   └── Cross-sell entre low-tickets
│
├── MÉTRICAS LOW-TICKET
│   ├── Front-end ROAS (só venda direta): 1.0-2.0x aceitável
│   ├── ACV (Average Cart Value): produto + bump + upsell
│   ├── CAB (Cost to Acquire Buyer): custo de ads por compra
│   ├── Back-end ROAS (incluindo high-ticket): 5-15x
│   ├── Taxa de ascensão: buyer → high-ticket (benchmark 5-15%)
│   └── Tempo de ascensão: dias até compra do high-ticket
│
└── INTEGRAÇÃO COM HIGH-TICKET
    ├── Retargeting de compradores para campanha de lead gen
    ├── LAL de compradores (melhor seed possível)
    ├── Nurture sequence: comprou low-ticket → educação → oferta high-ticket
    └── Sinal de prontidão: engajou com conteúdo pós-compra, pediu mais info
```

**Produtos low-ticket potenciais Zapeecomm:**
1. Shopee ADS 2.0 (já existe)
2. Guia de SEO/Otimização de listings Shopee
3. Metodologia de pesquisa de produtos
4. Quickstart Mercado Livre
5. Guia de fornecedores
6. Estratégia de precificação para marketplaces
7. Fotografia/design de anúncios
8. Primeiros 30 dias na Shopee (playbook)
9. Dashboard de métricas Shopee
10. Automação de processos para sellers

**Referência detalhada:** `data/conhecimento-low-ticket.md` e `data/conhecimento-low-ticket-ads.md`

---

### 14. Compliance e Políticas Meta
**Nível:** Core
**O que faz:** Garante que todos os ads estão em conformidade com as políticas da Meta.

**Sub-skills:**
- **Motivos comuns de reprovação:** Claims financeiros, antes/depois, texto excessivo, linguagem sensacionalista
- **Copy compliant para mentorias:** Como falar de resultados sem violar políticas ("alunos relatam..." vs "você VAI ganhar...")
- **Conta restrita:** Causas, prevenção, request review, business verification
- **Workarounds:** Reformular copy mantendo a mensagem sem trigger de reprovação
- **Checklist pré-publicação:** Verificar antes de subir qualquer ad

**Referência detalhada:** `skills/mapa-completo-skills-meta-ads.md` seções 8.2, 13

---

### 15. Troubleshooting Avançado
**Nível:** Avançado
**O que faz:** Diagnóstico e resolução de problemas técnicos e de performance.

**Árvore de troubleshooting:**
```
Problema identificado
├── Entrega (impressões/alcance)
│   ├── Learning Limited → Consolidar, expandir público, subir evento
│   ├── 0 impressões → Checklist: budget, schedule, público, bid, aprovação
│   ├── Flutuação → Média móvel 7d, não reagir a 1 dia
│   └── Entrega concentrada → Bid cap ou schedule
│
├── Tracking
│   ├── Pixel não dispara → Pixel Helper, reinstalar, debugar JS
│   ├── Eventos duplicados → Deduplicação via event_id
│   ├── EMQ baixo → Enviar mais parâmetros (email, phone, fbp)
│   └── Discrepância Meta vs CRM → UTMs, janela atribuição, filtrar bots
│
├── Performance
│   ├── CPA subindo gradual → Saturação, público esgotado, competição
│   ├── CPA explodiu → Mudança na campanha, LP, pixel, update Meta
│   ├── Volume caiu → Budget cap, público saturado, bid baixo
│   └── ROAS caiu sem CPA mudar → Ticket, fechamento, inadimplência (NÃO é ads)
│
└── Creative
    ├── CTR caindo → Creative fatigue (frequência > 3)
    ├── Hook fraco → 3s view baixo, trocar primeiros 3 segundos
    ├── Hold fraco → Conteúdo pós-hook não entrega, reestruturar
    └── CVR baixa com CTR alto → Problema na LP, não no ad
```

---

## Matriz de Maturidade

| Nível | Skills Desbloqueadas | Dados Necessários |
|-------|---------------------|-------------------|
| **Básico** | Relatório diário, diagnóstico, otimização, compliance | Acesso à API Meta Ads |
| **Intermediário** | + Auditoria, creative intelligence, escala, copy analysis | 7+ dias de dados |
| **Avançado** | + Funil completo, audiência avançada, troubleshooting, low-ticket | 30+ dias + dados comerciais |
| **Estratégico** | + Inteligência competitiva, unit economics, cohort, multi-produto | 90+ dias + dados do mercado |

---

## Integração com Meta Ads API

### Endpoints Principais
| Ação | Endpoint | Permissão |
|------|----------|-----------|
| Listar campanhas | `GET /{ad_account_id}/campaigns` | Leitura |
| Listar ad sets | `GET /{ad_account_id}/adsets` | Leitura |
| Listar ads | `GET /{ad_account_id}/ads` | Leitura |
| Insights (métricas) | `GET /{object_id}/insights` | Leitura |
| Atualizar budget | `POST /{campaign_id}` | Escrita |
| Pausar/Ativar | `POST /{object_id}` (status) | Escrita |
| Criar ad | `POST /{ad_account_id}/ads` | Escrita |
| Audience Overlap | `GET /{audience_id}/delivery_estimate` | Leitura |
| Custom Audience | `POST /{ad_account_id}/customaudiences` | Escrita |

### Campos de Insights Essenciais
```
impressions, reach, frequency, clicks, ctr, cpc, cpm,
spend, actions (leads, purchases), cost_per_action_type,
video_30_sec_watched_actions, video_p25_watched_actions,
video_p50_watched_actions, video_p75_watched_actions,
video_p100_watched_actions, website_ctr,
quality_ranking, engagement_rate_ranking, conversion_rate_ranking
```

### Rate Limits
- Respeitar rate limits da API (200 calls/hora por ad account)
- Cachear dados quando possível
- Usar batch requests para múltiplas métricas

---

## Knowledge Base References

Para profundidade máxima em cada área, consultar:
- `skills/mapa-completo-skills-meta-ads.md` — 14 áreas técnicas exaustivas (~1500 linhas)
- `data/conhecimento-low-ticket.md` — Estratégia completa de low-ticket (~1500 linhas)
- `data/conhecimento-low-ticket-ads.md` — Táticas de Meta Ads para low-ticket
