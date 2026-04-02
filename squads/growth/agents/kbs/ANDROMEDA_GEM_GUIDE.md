# Andromeda & GEM — Guia Prático para Gestão de Tráfego

> Last updated: 2026-03-29
> Baseado em: Meta Engineering Blog, papers ArXiv, análises de mercado
> Para uso do Léo (Gestor de Tráfego) na análise e otimização de campanhas

---

## 1. AS 4 CAMADAS DO META ADS AI STACK

```
┌─────────────────────────────────────────────────┐
│  GEM (Generative Ads Recommendation Model)      │  ← Cérebro central
│  Modelo fundacional treinado em escala LLM       │     Ensina todos os outros
│  Dados: ads + orgânico de TODAS as superfícies   │     via knowledge distillation
│  Lançado: Nov 2025                               │
├─────────────────────────────────────────────────┤
│  ANDROMEDA (Retrieval Engine)                    │  ← Porteiro
│  Filtra bilhões → ~1.000 candidatos em 300ms     │     Decide quem PODE aparecer
│  Arquitetura HSNN (3 torres)                     │     Rollout global: Out 2025
│  Hardware: Grace Hopper + MTIA                   │
├─────────────────────────────────────────────────┤
│  LATTICE (Ranking/Auction)                       │  ← Juiz
│  Trilhões de parâmetros, multi-task              │     Decide quem GANHA
│  Substituiu centenas de modelos separados         │     Lançado: Mai 2023
├─────────────────────────────────────────────────┤
│  UTIS (User True Interest Survey)                │  ← Calibrador
│  Feedback direto do usuário (1-5 scale)          │     Calibra o Lattice
│  Precisão 63.2% vs 48.3% heurísticas            │     Lançado: Jan 2026
└─────────────────────────────────────────────────┘
```

**Fluxo**: GEM alimenta → Andromeda filtra → Lattice rankeia → UTIS calibra

---

## 2. ANDROMEDA — COMO FUNCIONA

### 2.1 O Que É
Motor de retrieval que substitui o sistema antigo de regras + heurísticas. Usa deep neural networks pra decidir quais ads são relevantes pra cada usuário ANTES do leilão.

### 2.2 Arquitetura HSNN (3 Torres)
O sistema antigo usava 2 torres (user + ad) com dot-product simples. Andromeda usa 3:

| Torre | O Que Processa |
|-------|---------------|
| **User Tower** | Features do usuário → embedding fixo |
| **Ad Tower** | Features do ad → embedding + cluster assignment |
| **Interaction Tower** | Interações de ordem superior entre user e ad (NOVO) |
| **MergeNet** | Combina as 3 via MLPs → logit final |

### 2.3 Entity ID — Impressão Digital do Criativo
Cada criativo recebe um Entity ID baseado em:
- **Visão computacional**: produtos, cores, composição, mood, pessoas
- **NLP**: texto, captions, overlays, headlines (via Rosetta OCR)
- **Áudio**: características, pacing, música
- **Ações**: demonstrações, unboxings, depoimentos
- **Formato**: duração, aspect ratio, tipo

### 2.4 Clustering de Criativos (CRÍTICO)
- Ads com mensagem similar são agrupados no mesmo cluster
- **Similarity Score > ~60% = supressão de retrieval**
- O sistema mostra apenas 1 representante de cada cluster
- 50 variações do mesmo conceito = apenas 1 ticket pro leilão

### 2.5 O Que É "Mesmo" vs "Diferente"

| MESMO Entity ID (suprimido) | DIFERENTE Entity ID (entra) |
|-----------------------------|-----------------------------|
| Trocar cor do botão | Ângulo diferente (problema vs depoimento) |
| Trocar música | Persona diferente |
| Ajuste de headline menor | Mensagem core diferente |
| Mudar background | Formato diferente (UGC vs demo vs talking head) |
| Trocar fonte | Proposta de valor diferente |

### 2.6 Sinais Que Alimentam o Andromeda

**Do Criativo:**
- Elementos visuais, texto, áudio, ações, formato

**Do Usuário:**
- Histórico de engajamento
- Comportamento real-time
- Velocidade de scroll
- Padrões cross-surface (Feed, Stories, Reels, Messenger)
- Sequência e timing de interações

**Do Anunciante:**
- Dados de conversão (especialmente CAPI)
- EMQ (Event Match Quality)
- Budget signals
- Objetivo de campanha

---

## 3. GEM — O CÉREBRO CENTRAL

### 3.1 O Que É
- NÃO é "GPU-based Execution Module" — é **Generative Ads Recommendation Model**
- Maior modelo de RecSys da Meta, treinado em milhares de GPUs
- Processa trilhões de informações de ads + engajamento orgânico
- Usa knowledge distillation pra ensinar Andromeda e Lattice

### 3.2 Sub-Arquiteturas
1. **Enhanced Wukong**: Interações de features em escala
2. **Pyramid-Parallel Sequences**: Modelagem temporal
3. **InterFormer**: Aprendizado cross-feature

### 3.3 Resultados
- +5% conversão Instagram
- +3% Facebook Feed
- 4x eficiência vs predecessores
- 23x throughput de treinamento

---

## 4. LATTICE — O RANKER

- Arquitetura unificada que substituiu centenas de modelos
- Multi-domain, multi-task com sparse activation
- Trilhões de parâmetros
- Fórmula do leilão: `(Bid x Estimated Action Rate) + Ad Quality Score`
- Resultados: +10% receita, +11.5% satisfação, +6% conversão

---

## 5. IMPLICAÇÕES PRÁTICAS PARA GESTÃO DE TRÁFEGO

### 5.1 Estrutura de Campanha
- **1-3 campanhas por objetivo** (consolidar sinais)
- **1-2 ad sets com broad targeting** (18-65+, mínimo de exclusões)
- **CBO** pra distribuição automática
- **Remover interest targeting** — deixar a IA explorar
- **Janela mínima: 14-21 dias** ou 50-75 conversões antes de mexer

### 5.2 Criativos — A Nova Regra do Jogo
- **8-20 conceitos DISTINTOS por ad set** (não variações)
- Diversidade de ângulos: problema/solução, prova social, founder story, demo, objeção, oferta, lifestyle
- Diversidade de formatos: 6-15s vertical, 20-30s square, estático, carrossel, UGC
- Diversidade de personas: primeiro comprador vs experiente, budget vs premium
- **3-5 conceitos novos por semana**
- **Refresh a cada 1-3 semanas** (mais rápido que antes)

### 5.3 Framework P.D.A. para Diversidade Criativa
- **P**ersona: Quem é o target?
- **D**esire: Que resultado importa pra ele?
- **A**wareness: Onde está na jornada problema/solução?

### 5.4 Dados e Tracking
- **CAPI server-side obrigatório**
- **EMQ alto**: hash de email, phone, IP, CEP, valores de compra
- **Deduplicar eventos** entre browser e server
- **Nunca depender só de pixel**

### 5.5 Budget
- Escalar 20-30% a cada poucos dias (sem saltos)
- Cost cap a 105-110% do CPA histórico
- Budgets mais altos = ciclos de aprendizado mais rápidos

### 5.6 KPIs Pós-Andromeda
| KPI | O Que Mede |
|-----|-----------|
| 3s view rate / thumb-stop | Qualidade do hook (Andromeda observa) |
| CTR normalizado por placement | Interesse real |
| LP view rate / add-to-cart | Alinhamento mensagem |
| Cost per qualified acquisition | Resultado real |
| Velocidade de tração de novo criativo | Saúde do pipeline |
| Duração antes de fadiga | Vida útil do conceito |
| Frequência por conceito | Saturação |

---

## 6. DIAGNÓSTICO PÓS-ANDROMEDA

### 6.1 Árvore de Decisão Atualizada

```
Performance caiu
├── Delivery baixa (impressões)?
│   ├── Entity IDs muito similares? → Andromeda suprimindo criativos redundantes
│   │   └── Ação: Criar conceitos REALMENTE diferentes
│   ├── Criativos novos não pegam tração? → GEM não encontrou match de audiência
│   │   └── Ação: Diversificar ângulos + personas, não só visual
│   └── Budget ok mas entrega caiu? → Andromeda priorizando outros anunciantes
│       └── Ação: Novos conceitos criativos (o targeting é automático)
│
├── CPA subiu?
│   ├── Frequência alta? → Andromeda saturou o cluster de criativos
│   │   └── Ação: Refresh com conceitos novos, não variações
│   ├── CTR ok mas CVR caiu? → Lattice encontra cliques mas não conversões
│   │   └── Ação: Checar LP, EMQ, CAPI
│   └── Tudo ok mas CPA subiu? → GEM recalibrando predições
│       └── Ação: Aguardar 3-5 dias, manter dados limpos
│
└── Volume caiu?
    ├── Poucos conceitos ativos? → Andromeda tem pouco pra trabalhar
    │   └── Ação: Escalar pipeline criativo (8-20 conceitos)
    ├── EMQ baixo? → GEM recebendo sinais fracos
    │   └── Ação: Melhorar CAPI, enviar mais parâmetros
    └── Budget atingiu teto? → Lattice limitando spend
        └── Ação: Escalar 20-30% gradual
```

### 6.2 Red Flags Pós-Andromeda
1. **Muitos ads, pouca entrega distribuída** → Entity IDs similares demais
2. **Novo criativo não sai do "Learning"** → Conceito não diferenciado
3. **ROAS cai com mais criativos** → Diluição, não diversidade
4. **Performance cai após editar ad** → Andromeda reclassificou Entity ID

---

## 7. MÉTRICAS DE PERFORMANCE DO SISTEMA

| Métrica | Melhoria |
|---------|----------|
| Capacidade do modelo | 10.000x |
| QPS de inferência | 3x+ |
| Recall de retrieval | +6% |
| Qualidade de ads (segmentos select) | +8% |
| Latência de feature extraction (vs CPU) | 100x |
| Eficiência de inferência | 10x |
| ROAS Advantage+ Creative | +22% |
| Conversões GenAI images | +7% |
| ROAS contas adaptadas | +20-35% |

---

## 8. APLICAÇÃO DIRETA — ZAPEECOMM

### 8.1 Nossa Estrutura Atual (Campanha Única ADVG+)
- ✅ Campanha consolidada (1 campanha, 1 ad set)
- ✅ Broad targeting (Público ADVG+)
- ✅ 92 ads ativos
- ⚠️ Verificar: Quantos CONCEITOS distintos temos entre os 92?
- ⚠️ Verificar: Entity IDs estão sendo suprimidos?
- ⚠️ Verificar: EMQ e CAPI estão otimizados?

### 8.2 Ações Recomendadas
1. **Auditar diversidade de conceitos** — Mapear os 92 ads por ângulo/conceito
2. **Monitorar distribuição de entrega** — Se 80% do spend vai pra 5 ads, Entity IDs redundantes
3. **Pipeline semanal de 3-5 conceitos novos** (não variações)
4. **Garantir EMQ > 6.0** em todos os eventos
5. **Refresh proativo a cada 1-3 semanas** antes da fadiga

### 8.3 Framework de Ângulos Zapeecomm (P.D.A.)
| Persona | Desire | Awareness | Conceito |
|---------|--------|-----------|----------|
| Seller iniciante | Primeira venda | Não sabe como | "Como fazer sua 1ª venda com Shopee ADS" |
| Seller com vendas | Escalar ROAS | Sabe o básico | "ROAS 25 com 4 configurações" |
| Seller frustrado | Parar de perder $ | Tentou e falhou | "Por que seus ADS não convertem" |
| Seller orgânico | Acelerar crescimento | Nunca usou ADS | "De orgânico pra ADS: o salto" |
| Seller ML | Diversificar | Só Mercado Livre | "Shopee é o novo ML — entre agora" |

---

## 9. FONTES

### Meta Oficial
- Meta Andromeda Engineering Blog (Dez 2024)
- GEM Engineering Blog (Nov 2025)
- Meta Lattice AI Blog (Mai 2023)
- AI Innovation in Meta's Ads Ranking (Meta for Business)

### Papers
- HSNN Paper (arXiv:2408.06653) — Arquitetura base do Andromeda
- Meta Lattice Paper (arXiv:2512.09200)
- Rosetta OCR System (Meta AI Research)

### Análises de Mercado
- Triple Whale, Admetrics, AdMove, Adsuploader, Confect.io
- Jon Loomer, AdExchanger, Search Engine Land
- Silverback Strategies, The MTM Agency
