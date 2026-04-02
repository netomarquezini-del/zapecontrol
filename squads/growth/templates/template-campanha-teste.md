# Template — Campanha de Teste de Criativos

## Modelo: Andromeda + CBO — Teste e Descoberta de Winners

---

## 1. OBJETIVO

Testar novos criativos (vídeo, imagem e carrossel) com diferentes ângulos e copies para descobrir winners que serão graduados para a campanha de escala.

**Meta:** Encontrar criativos com ROAS ≥ 1.8x e 20+ compras para graduar como winner.

**Regra fundamental:** Campanha de teste testa **CRIATIVOS, não públicos**. Sempre 1 campanha, 1 ad set, N ads.

---

## 2. ESTRUTURA DA CAMPANHA

```
CAMPANHA TESTE [Nº] (CBO) — Estrutura 1-1-N
  Budget: R$800/dia (FIXO — nunca alterar)
  Objetivo: Sales (Purchase)
  │
  └── Ad Set 1 — Broad ADV+ (25-44) — ÚNICO ad set
      ├── Ad 1 — Vídeo (ângulo A)
      ├── Ad 2 — Imagem (ângulo B)
      ├── Ad 3 — Carrossel (ângulo C)
      ├── ...
      └── Mínimo 8, Máximo 15 criativos
```

**REGRA:** Sempre 1-1-N. Nunca criar múltiplos ad sets. Não testamos público — testamos criativo.

### Configuração Técnica

| Parâmetro | Valor | Observação |
|-----------|-------|------------|
| **Nome** | `ShopeeADS \| Teste [Nº] \| DD-MM-YYYY` | Número sequencial |
| **Objetivo** | OUTCOME_SALES | Otimizar para compra |
| **Tipo de Budget** | CBO | Andromeda distribui automaticamente |
| **Budget Diário** | R$800 | **FIXO — nunca alterar** |
| **Bid Strategy** | Highest Volume (Lowest Cost) | Sem cap — máximo de dados |
| **Otimização** | Purchase (OFFSITE_CONVERSIONS) | Evento = compra |
| **Atribuição** | 7-day click, 1-day view | Padrão Meta |
| **Billing** | IMPRESSIONS | |
| **Destination** | WEBSITE (nunca APP) | |

### Segmentação

| Parâmetro | Valor |
|-----------|-------|
| **Idade** | 25-44 anos |
| **Gênero** | Todos |
| **Localização** | Brasil |
| **Público** | Broad com Advantage+ Audience (ÚNICO) |
| **Exclusão** | Compradores últimos 60 dias |

**Regra:** Sempre 1 ad set, sempre Broad ADV+. Não testamos público — testamos criativo.

### Placements (Manual)

**Incluídos:**
- Instagram Feed
- Instagram Stories
- Instagram Reels
- Facebook Feed
- Facebook Stories
- Facebook Reels

**Excluídos:**
- Audience Network (Classic e Rewarded) — cliques acidentais
- Facebook Instream Video — connect rate baixo
- Facebook Reels Overlay — connect rate baixo
- Instagram Explore — connect rate muito baixo
- Threads, Messenger, Search, Marketplace, Notifications, Profile Feed

### Schedule

| Tipo | Início |
|------|--------|
| **Campanha NOVA** | Dia seguinte às **00:03** |
| **Criativos novos** (em campanha existente) | **Imediato** |

| Horário | Status |
|---------|--------|
| 00h-07h | **OFF** — CPA 2-3x maior na madrugada |
| 08h-23h | **ON** — Horário de performance |

---

## 3. CRIATIVOS

### Regras Gerais

| Regra | Valor |
|-------|-------|
| **Máximo por campanha** | 15 criativos |
| **Mínimo por campanha** | 8 criativos |
| **Mix obrigatório** | Vídeo + Imagem + Carrossel |
| **Variação de ângulo** | Cada criativo DEVE ter ângulo diferente |
| **Variação de texto** | Copies diferentes — texto primário, headline, descrição |
| **Pipeline semanal** | 3-5 conceitos novos por semana |

### Formatos

| Formato | Quando usar | Specs |
|---------|-------------|-------|
| **Vídeo** | Hook forte, storytelling, demonstração | 9:16 (Stories/Reels) + 1:1 (Feed) |
| **Imagem** | Mensagem direta, prova social, oferta clara | 1:1 (Feed) + 9:16 (Stories) |
| **Carrossel** | Múltiplos benefícios, passo a passo, cases | 1:1 (cards) |

### Texto no Criativo

O texto (copy primário, headline, descrição) faz tanta diferença quanto o visual. O Andromeda usa o texto para decidir para quem mostrar o anúncio. Texto diferente = público diferente, mesmo com o mesmo visual.

**Regra:** Cada criativo deve ter combinação única de visual + texto. Não subir 3 visuais diferentes com a mesma copy.

### Link de Destino

- **URL:** `https://netomarquezini.com.br/curso-ads/`
- **Sempre com barra no final** (evitar redirect 301)
- **Sempre HTTPS** (nunca HTTP)
- **UTMs:** `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}`

---

## 4. COMO SUBIR NOVOS CRIATIVOS

### Pré-requisitos

1. Criativo produzido (Max + Thomas/Maicon)
2. Campanha de teste tem vaga (< 15 ads ativos)
3. Compliance verificado (consultar meta-policy-kb.md)

### Fluxo de Upload

```
Criativos prontos para subir (ex: 8 novos)
        │
        ▼
Campanha de teste atual tem vagas? (< 15 ads)
        │
   SIM → Quantas vagas? (ex: campanha tem 14 ads → 1 vaga)
        │
        ├── Vagas suficientes pra todos? → Sobe todos
        │
        └── Vagas INSUFICIENTES? (ex: 1 vaga pra 8 criativos)
                │
                ▼
           Sobe apenas o que CABE na campanha atual (ex: 1)
           Os restantes (ex: 7) → CRIA NOVA CAMPANHA DE TESTE
           Nome: ShopeeADS | Teste [Nº+1] | DD-MM-YYYY
           Mesma config (CBO, R$800, 25-44, placements)
           Nova campanha inicia no DIA SEGUINTE às 00:03
        │
   NÃO (0 vagas) → CRIA NOVA CAMPANHA DE TESTE
              Nome: ShopeeADS | Teste [Nº+1] | DD-MM-YYYY
              Mesma config (CBO, R$800, 25-44, placements)
              Nova campanha inicia no DIA SEGUINTE às 00:03
```

**REGRA CRÍTICA:** Nunca pausar criativo ativo para abrir vaga. Se não tem vaga, cria nova campanha. Novos criativos adicionados em campanha EXISTENTE iniciam **imediatamente**. Campanha NOVA inicia no **dia seguinte às 00:03**.

### Regras de Upload

- **Anti-ban:** Delay humanizado 15-30s entre cada upload
- **Rate limit:** Max 60 escritas/hora na API
- **Vídeo:** Aguardar processamento (polling 5s, timeout 2min). Só criar creative quando video_status = ready
- **Thumbnail:** Buscar automática via /{videoId}/thumbnails
- **Creative config:** Todos os OPT_OUT aplicados (advantage_plus_creative, text_optimizations, video_auto_crop, etc.)

---

## 5. KILL RULES — QUANDO PAUSAR

### Regras de Pausa (temporária)

| # | Situação | Ação | Prazo |
|---|----------|------|-------|
| 1 | Gastou 2x CPA target, ZERO conversão | **PAUSA IMEDIATO** | Imediato |
| 2 | Gastou 1.5x CPA target, apenas 1 conversão | **MONITORA 48h** | Espera |
| 3 | CPA 50%+ acima do target por 5 dias seguidos | **PAUSA** | 5 dias |
| 4 | Frequência > 3.5 + CTR caindo | **PAUSA** | Imediato |
| 5 | CTR caiu 30%+ vs primeiros 3 dias | **PAUSA** | Imediato |

### Regra de Ouro

**NUNCA pausar antes de 1.000 impressões.** Antes disso não tem amostra suficiente para julgar. Mesmo que o CPA esteja alto nos primeiros reais, espere as 1.000 impressões.

### Pausar vs Matar (Arquivar)

| Ação | Quando |
|------|--------|
| **PAUSAR** (temporário) | Performance caiu mas pode voltar. Saturação temporária. CPA dentro de 1.5-2x target |
| **MATAR** (arquivar) | CPA 3x acima do target com 2.000+ impressões. Ficou pausado 2+ semanas sem reuso. Conceito superado por novos |

---

## 6. GRADUAÇÃO — QUANDO VIRA WINNER

### Critérios para Graduação

O criativo se torna winner quando atinge **TODOS** os critérios:

| Critério | Valor |
|----------|-------|
| **Compras** | **20+ compras** |
| **ROAS** | **≥ 1.8x** |

### Processo de Graduação

```
WINNER IDENTIFICADO NA CAMPANHA TESTE (20+ compras E ROAS ≥ 1.8x)
        │
        ▼
1. Usa o MESMO Post ID (effective_object_story_id)
   → Mantém prova social (curtidas, comentários)
2. Move para a PIPELINE WINNER (campanha de escala)
3. Nomenclatura e copy seguem o que estiver na pipeline
```

### Duplicar com Prova Social

Para manter curtidas e comentários ao levar para a escala:
- Usar o **mesmo Post ID** (`effective_object_story_id`)
- NÃO criar creative novo do zero
- Referencia o post original — prova social aparece na campanha de escala

---

## 7. QUANDO CRIAR NOVA CAMPANHA DE TESTE

### Criar quando:
- Campanha atual não tem vagas suficientes para os criativos novos
- Tem novos criativos prontos para subir e campanha atual está cheia (15 ads)

### NÃO criar quando:
- Ainda tem vagas na campanha atual
- Não tem criativos novos prontos

### Config da nova campanha
- Exatamente a mesma configuração da anterior
- Nome: `ShopeeADS | Teste [próximo número] | DD-MM-YYYY`
- Budget: R$800/dia (FIXO — nunca alterar)
- Mesmo público (Broad ADV+ 25-44), placements, schedule
- **Início:** Dia seguinte às 00:03

---

## 8. QUANDO FECHAR UMA CAMPANHA DE TESTE

### NUNCA fechar se:
- Está vendendo com CPA bom, mesmo com poucos criativos
- Tem winners ativos que ainda não foram graduados
- Performance está boa

### FECHAR quando:
- Poucos criativos (1-2) E CPA ruim
- 0 criativos ativos (todos morreram por kill rule)
- Performance ruim por 7+ dias sem melhora

### Processo de fechamento:
1. Se tem criativos sobreviventes com CPA bom → migra para outra campanha de teste que tenha vaga
2. Se todos estão ruins → pausa a campanha inteira
3. Aguarda 7 dias e arquiva se não retomar

---

## 9. CICLO DE VIDA DO CRIATIVO

| Fase | Duração | Sinais | Ação |
|------|---------|--------|------|
| **Aprendizado** | 3-7 dias | CPA instável, pouca entrega | NÃO MEXE. Espera 1.000 impressões |
| **Ramp Up** | 3-7 dias | CPA caindo, CTR subindo | Monitora. Se CPA atingir target, preparar graduação |
| **Pico** | 7-21 dias | CPA estável, ROAS bom, freq < 2.5 | Se atingir critérios → GRADUA para escala |
| **Declínio** | 3-7 dias | CPA subindo, CTR caindo, freq > 3 | Já deveria ter sido graduado. Manter se ainda vende |
| **Morte** | — | CPA 2x+ target, freq > 4 | PAUSA. Se 2 semanas pausado → ARQUIVA |

---

## 10. CHECKLIST DIÁRIO — CAMPANHA DE TESTE

### Dias 1-5: APENAS OBSERVAR (não mexer em nada)

1. **Métricas gerais** — Anotar CPA, ROAS, CTR para referência
2. **Entrega** — Criativos estão recebendo impressões? (só observar)
3. **NÃO MEXER** — Sem pausas, sem adições, sem alterações

### Dia 6+ Manhã (10 min)

1. **Kill rules** — Algum criativo bateu kill rule? → PAUSA
2. **Criativos novos pegaram tração?** — Se subiu conceitos novos, verificar se estão recebendo impressões
3. **Frequência** — Algum criativo acima de 3.0? Atenção

### Dia 6+ Tarde (10 min)

4. **Winners para graduar?** — Algum criativo atingiu 20+ compras E ROAS ≥ 1.8x? → Graduar para pipeline winner
5. **Pipeline** — Tem conceitos novos prontos? Se não, acionar Max/Maicon/Thomas
6. **Vaga disponível?** — Se tem criativos novos e campanha lotou → criar nova campanha de teste

---

## 11. REGRAS DE BUDGET — CAMPANHA DE TESTE

### Budget: R$800/dia — FIXO, NUNCA ALTERAR

O budget da campanha de teste é **R$800/dia** e **nunca muda**. Não existe otimização de budget em campanha de teste. O objetivo é testar criativos, não otimizar gasto.

### Dias 1-5: NÃO MEXER EM NADA

Nos primeiros 5 dias da campanha, **não mexer em absolutamente nada**:
- Não alterar budget
- Não pausar criativos
- Não adicionar criativos
- Não mudar público
- Não mudar placements
- **NADA. Esperar os 5 dias.**

### Dia 6+: Análise de Criativos

A partir do dia 6, analisar performance dos **criativos** (não do budget):

| Decisão | Janela |
|---------|--------|
| **Kill rule de criativo** | Últimos 5 dias |
| **Análise semanal** | Últimos 7 dias |
| **Graduação** | Acumulado (20+ compras, ROAS ≥ 1.8x) |

### Regra: Budget é FIXO em R$800. Nunca mexer em nada nos dias 1-5.

---

## 12. METAS E BENCHMARKS

| Métrica | Target | Aceitável | Kill |
|---------|--------|-----------|------|
| **CPA** | A definir com dados novos | +30% do target | 2x target sem conversão |
| **ROAS** | ≥ 1.8x (graduação) | ≥ 1.5x | < 1.0x por 5 dias |
| **Connect Rate** | > 80% | > 70% | < 60% |
| **Frequência** | < 2.0 | < 3.0 | > 3.5 + CTR caindo |
| **CTR** | > 1.2% | > 0.8% | Queda de 30%+ |

**Nota:** CPA e ROAS targets serão calibrados com os dados das primeiras 2 semanas da nova operação. Os targets antigos (90 dias) não se aplicam porque a estrutura mudou.

---

## 12. NOMENCLATURA

### Campanha
`ShopeeADS | Teste [Nº] | DD-MM-YYYY`

Exemplo: `ShopeeADS | Teste 01 | 01-04-2026`

### Ad Set
`[Tipo Público] | [Detalhe]`

Exemplos:
- `Broad ADV+ | 25-44`
- `Interesse | E-commerce`
- `LAL 1% | Compradores`

### Ad
**Seguir exatamente o que estiver na pipeline.** Nome e copy vêm da pipeline — não inventar.

Exemplos (referência, o real vem da pipeline):
- `AD170 | Vídeo | Shopee Ads`
- `AD171 | Imagem | Shopee Ads`
- `AD172 | Carrossel | Shopee Ads`

---

## 13. CHECKLIST DE COMPLIANCE — OBRIGATÓRIO ANTES DE QUALQUER AÇÃO

### Regra Absoluta

**ANTES de criar campanha, subir criativo, configurar público, ajustar budget, criar ad ou editar copy**, o Léo DEVE consultar internamente a base de conhecimento abaixo e validar compliance. NÃO executar nenhuma ação na Meta sem passar por este checklist.

### Base de Conhecimento (consultar SEMPRE)

| Documento | O que verificar |
|-----------|----------------|
| `meta-policy-kb.md` | Regras gerais de política de ads, copy proibida, personal attributes |
| `meta-policy-kb-antiban.md` | Account warming, limites de budget, escalada segura, billing |
| `meta-policy-kb-tecnico.md` | Learning phase, resetar aprendizado, ad review process, Advantage+ |
| `meta-policy-kb-api-reference.md` | Endpoints corretos, parâmetros, enums, specs de criativos, CAPI |
| `meta-policy-kb-developers-deep.md` | Rate limits, error handling, batch requests |
| `meta-policy-kb-advanced.md` | Regras avançadas, edge cases, compliance de claims |
| `ANDROMEDA_GEM_GUIDE.md` | Como o Andromeda distribui, sinais de texto, auction dynamics |
| `META_ADS_ML_INFRASTRUCTURE.md` | ML pipeline, learning phase internals, budget optimization |

### Checklist Pré-Criação de Campanha

- [ ] **Conta aquecida?** Conta nova precisa de 2-4 semanas de aquecimento (meta-policy-kb-antiban.md seção 1)
- [ ] **Budget dentro dos limites?** Não fazer saltos > 20% (meta-policy-kb-antiban.md seção 2)
- [ ] **Objetivo correto?** OUTCOME_SALES para Purchase (meta-policy-kb-api-reference.md seção 1)
- [ ] **Targeting compliance?** Advantage+ não permite age_max < 65 como hard limit (meta-policy-kb-tecnico.md seção 2)
- [ ] **Placements válidos?** facebook_reels (não "reels"), instagram positions: stream/story/reels (meta-policy-kb-api-reference.md)
- [ ] **Day parting + daily budget?** Não compatíveis — usar lifetime budget OU remover schedule (meta-policy-kb-api-reference.md)

### Checklist Pré-Upload de Criativo

- [ ] **Copy sem Personal Attributes?** Não usar "você investe", "seu ROAS", "pare de" (meta-policy-kb.md seção 3.1)
- [ ] **Copy sem palavras proibidas?** "ficar rico rápido", "dinheiro fácil", "esquema", "garanta" (meta-policy-kb.md seção 3.2)
- [ ] **Claims com disclaimer?** "Resultados individuais podem variar" (meta-policy-kb.md seção 3.3)
- [ ] **Specs técnicos corretos?** Resolução, aspect ratio, tamanho máximo (meta-policy-kb-api-reference.md seção criativos)
- [ ] **OPT_OUT de enhancements?** standard_enhancements = OPT_OUT (controlar texto exato)
- [ ] **Vídeo processado?** Aguardar video_status = ready antes de criar creative (meta-policy-kb-api-reference.md)
- [ ] **Rate limit respeitado?** Max 60 escritas/hora, delay 15-30s entre uploads (meta-policy-kb-developers-deep.md)

### Budget — Campanha de Teste

**NÃO EXISTE ajuste de budget em campanha de teste.** Budget é FIXO em R$800/dia. Sempre.

### Se em Dúvida

1. Consultar o documento específico listado acima
2. Se a dúvida persistir, NÃO executar
3. Alertar Neto no Telegram com o contexto da dúvida
4. Aguardar resolução manual

---

*Template criado por Léo — Gestor de Tráfego | Zape Ecomm*
*Baseado no Manual Operacional Meta Ads 2026 + diretrizes da gerente de conta Meta*
