# Template — Campanha de Escala

## Modelo: Andromeda + CBO — Escala e Maximização de ROAS

---

## 1. OBJETIVO

Maximizar vendas e ROAS com os criativos winners validados nas campanhas de teste. Esta é a campanha que gera receita — aqui só entra o que já provou que funciona.

**Meta:** Escalar volume de vendas mantendo ROAS acima de 1.8x.

**Regra fundamental:** Campanha de escala é **1-1-N**. 1 campanha, 1 ad set (Broad ADV+), N winners. Não testamos público — o Andromeda decide pra quem mostrar com base no criativo.

---

## 2. ESTRUTURA DA CAMPANHA

```
CAMPANHA ESCALA (CBO) — Estrutura 1-1-N
  Budget: R$1.000/dia (inicial, escalável ±15%/dia)
  Objetivo: Sales (Purchase)
  │
  └── Ad Set 1 — Broad ADV+ (25-44) — ÚNICO ad set
      ├── Winner 1 — (graduado da teste)
      ├── Winner 2 — (graduado da teste)
      ├── Winner 3 — (graduado da teste)
      ├── ...
      └── Mínimo 8, Máximo 15 winners
```

**REGRA:** Sempre 1-1-N. Nunca criar múltiplos ad sets. O Andromeda é creative-first — criativo é o targeting.

### Configuração Técnica

| Parâmetro | Valor | Observação |
|-----------|-------|------------|
| **Nome** | `ShopeeADS \| Escala \| DD-MM-YYYY` | 1 campanha permanente |
| **Objetivo** | OUTCOME_SALES | Otimizar para compra |
| **Tipo de Budget** | CBO | Andromeda distribui entre ads |
| **Budget Diário** | R$1.000 (inicial) | Escalável ±15%/dia após dia 5 |
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

**Regra:** Sempre 1 ad set, sempre Broad ADV+. Não testamos público — o Andromeda decide a audiência com base no criativo (Entity ID).

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

| Horário | Status |
|---------|--------|
| 00h-07h | **OFF** — CPA 2-3x maior na madrugada |
| 08h-23h | **ON** — Horário de performance |

---

## 3. CRIATIVOS — SÓ WINNERS

### Regras

| Regra | Valor |
|-------|-------|
| **Máximo** | 15 winners |
| **Mínimo** | 8 winners |
| **Quem entra** | SOMENTE winners graduados das campanhas de teste |
| **Mix** | Diversidade de formatos e ângulos (Andromeda suprime Entity IDs similares) |
| **Prova social** | Todo winner entra com o MESMO Post ID (curtidas e comentários preservados) |
| **Nomenclatura** | Segue o que estiver na pipeline |
| **Copy** | Segue o que estiver na pipeline |

### Critério de Entrada (Graduação da Teste)

Para entrar na escala, o criativo DEVE ter atingido na campanha de teste:

| Critério | Valor |
|----------|-------|
| **Compras** | **20+ compras** |
| **ROAS** | **≥ 1.8x** |

### Processo de Entrada

```
WINNER GRADUADO NA CAMPANHA DE TESTE (20+ compras E ROAS ≥ 1.8x)
        │
        ▼
Campanha de escala tem vaga? (< 15 winners)
        │
   SIM → Duplica usando MESMO Post ID (prova social preservada)
   │     Nomenclatura e copy seguem a pipeline
        │
   NÃO → Escala está cheia (15 winners)
              │
              ▼
         Comparar ROAS do novo winner vs piores da escala
              │
         Novo tem ROAS melhor? → TROCA pelo pior (pausa o pior, entra o novo)
         Novo tem ROAS pior?  → Não entra. Mantém no teste apenas
```

### Link de Destino

- **URL:** `https://netomarquezini.com.br/curso-ads/`
- **Sempre com barra no final**
- **Sempre HTTPS**
- **UTMs:** `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}`

---

## 4. KILL RULES — QUANDO SAIR DA ESCALA

### Regra de Saída

| Situação | Ação |
|----------|------|
| **ROAS abaixo de 1.3 por 5 dias SEGUIDOS** | **PAUSA** — sai da escala |
| Frequência > 3.5 + CTR caindo | **PAUSA** — saturação |

### Por que a tolerância é maior que na teste

Na escala, a tolerância é **maior** porque:
- O criativo já provou que converte (20+ compras, ROAS ≥ 1.8x)
- Pode ser uma flutuação temporária
- Pausar winner na escala impacta receita diretamente

### Pausar vs Arquivar

| Ação | Quando |
|------|--------|
| **PAUSAR** | ROAS < 1.3 por 5 dias, saturação, frequência alta |
| **ARQUIVAR** | Ficou pausado 2+ semanas sem reuso. Conceito superado por novos |

**Nota:** Um winner pausado pode VOLTAR se o público tiver tempo de "esfriar" (2-3 semanas). Não arquive rápido demais.

---

## 5. REGRAS DE BUDGET

### Budget Inicial: R$1.000/dia

### Dias 1-5: NÃO MEXER EM NADA

Nos primeiros 5 dias da campanha, **não mexer em absolutamente nada**:
- Não alterar budget
- Não pausar winners
- Não adicionar winners
- Não mudar público
- Não mudar placements
- **NADA. Esperar os 5 dias.**

### Dia 6+: Ajuste de ±15%/dia

Olhar ROAS MÉDIO dos últimos 3 dias para decidir:

| ROAS médio últimos 3 dias | Ação |
|---------------------------|------|
| ≥ 1.8x (acima do target) | **SOBE +15%** |
| 1.5x - 1.8x (ok) | **MANTÉM** |
| 1.3x - 1.5x (abaixo) | **DESCE -15%** |
| < 1.3x | **DESCE -15%** e investiga causa |

### Exceções — NÃO mexer no budget se:

| Situação | Ação | Por quê |
|----------|------|---------|
| Acabou de subir winners novos | **ESPERA 7 dias** | Andromeda testando novos Entity IDs |
| Acabou de pausar winners | **ESPERA 3-5 dias** | CBO recalibrando distribuição |

### Exemplo Prático de Escala

```
Dia 1:  R$1.000/dia — Campanha lançada com winners
Dia 2-5: INTOCÁVEL (não mexer em nada)
Dia 6:  ROAS 3d ≥ 1.8x → R$1.150 (+15%)
Dia 7:  ROAS 3d ≥ 1.8x → R$1.322 (+15%)
Dia 8:  ROAS 3d caiu pra 1.6x → MANTÉM R$1.322
Dia 9:  ROAS 3d caiu pra 1.4x → R$1.124 (-15%)
Dia 10: ROAS 3d subiu pra 1.9x → R$1.293 (+15%)
...e assim por diante
```

**Regra: Nunca mais que ±15% por dia. Nunca mexer em nada nos dias 1-5.**

---

## 6. DISTRIBUIÇÃO DE VERBA — QUANDO 1 CRIATIVO DOMINA

### Cenário 1: Dominando + ROAS Bom

- 1 winner consome 70%+ da verba
- ROAS acima de 1.8x
- **Ação: NÃO MEXE**
- CBO está funcionando corretamente. Andromeda coloca dinheiro onde dá resultado

### Cenário 2: Dominando + ROAS Caindo

- 1 winner consome 80%+ da verba
- ROAS caindo há 3 dias, frequência > 3
- **Ação: TRAZ WINNERS NOVOS da teste**
  1. NÃO pausa o dominante (ainda é o melhor)
  2. Traz 2-3 winners novos da campanha de teste
  3. Andromeda testa os novos Entity IDs automaticamente
  4. CBO redistribui se novo ganhar

### Cenário 3: Novos NÃO Pegam Tração

- 1 winner consome 85%+ da verba
- Winners novos recebem quase 0 impressão
- **Ação ESCALONADA:**
  1. Verificar se novos são REALMENTE diferentes (Entity ID distinto — ângulo, formato, persona)
  2. Se são similares: Andromeda está suprimindo. Criar conceitos genuinamente diferentes
  3. Se são diferentes: sobe budget +15% (mais $$ = mais exploração pelo Andromeda)

### Regra de Ouro

Um criativo dominando a verba com ROAS bom **NÃO é problema** — é o Andromeda funcionando. Só vira problema quando o ROAS começa a cair. Aí o sinal é: traz winners novos da teste com Entity IDs diferentes, não mexe no dominante.

---

## 7. FREQUÊNCIA E SATURAÇÃO

### Régua de Frequência

| Frequência | Status | Ação |
|-----------|--------|------|
| 1.0 - 2.0 | **SAUDÁVEL** | Manter, pode escalar budget |
| 2.0 - 3.0 | **ATENÇÃO** | Monitorar, garantir pipeline de novos winners na teste |
| 3.0 - 3.5 | **PREPARAR** | Trazer winners novos da teste (conceitos diferentes) |
| 3.5+ | **AÇÃO** | Se CTR caindo → PAUSA o winner saturado |

### Como Combater Saturação na Escala

1. **Winners novos** — trazer winners frescos da campanha de teste (Entity IDs diferentes)
2. **Pausar e descansar** — winner saturado pode voltar após 2-3 semanas
3. **Nunca:** aumentar budget pra "forçar" um criativo saturado
4. **Nunca:** criar novo ad set com público diferente (somos 1-1-N)

**Lembrete Andromeda:** Saturação acontece quando o Entity ID esgotou o cluster de audiência. A solução é SEMPRE trazer conceitos genuinamente novos (Entity IDs distintos), não mudar público.

---

## 8. CICLO DE VIDA DO WINNER NA ESCALA

| Fase | Sinais | Ação |
|------|--------|------|
| **Entrada** | Winner graduado da teste (20+ compras, ROAS ≥ 1.8x), prova social preservada | Monitorar primeiros 5 dias (não mexer em nada) |
| **Performance** | ROAS estável ≥ 1.8x, recebendo budget do CBO | Manter. Escalar budget se consistente |
| **Saturação** | Frequência subindo, CTR caindo, ROAS entre 1.3-1.8x | Trazer novos winners da teste |
| **Declínio** | ROAS < 1.3 por 5 dias seguidos | **PAUSA** |
| **Morte** | Pausado 2+ semanas sem reuso | **ARQUIVA** |

### Pipeline Contínuo

A escala depende de um **fluxo contínuo de winners** da campanha de teste. Se a teste para de produzir winners, a escala vai saturar eventualmente.

**Meta:** Pelo menos 1-2 novos winners graduados por semana entrando na escala.

---

## 9. CHECKLIST DIÁRIO — CAMPANHA DE ESCALA

### Dias 1-5: APENAS OBSERVAR (não mexer em nada)

1. **Métricas gerais** — Anotar ROAS, CPA, CTR para referência
2. **Entrega** — Winners estão recebendo impressões? (só observar)
3. **NÃO MEXER** — Sem pausas, sem adições, sem alterações

### Dia 6+ Manhã (10 min)

1. **ROAS geral** — Está acima de 1.8x? Comparar com ontem e média 3 dias
2. **Kill rule** — Algum winner com ROAS < 1.3 por 5 dias seguidos? → PAUSA
3. **Distribuição de verba** — 1 winner domina? ROAS dele está bom?
4. **Frequência dos top winners** — Algum acima de 3.0?

### Dia 6+ Tarde (10 min)

5. **Winners novos para entrar?** — Algum criativo graduado na teste (20+ compras, ROAS ≥ 1.8x)?
6. **Decisão de budget** — ROAS médio 3 dias ≥ 1.8x? Considerar +15%
7. **Pipeline** — Quantos winners prontos na teste para graduar?

### Checklist Semanal (Segunda-feira, 30 min)

- **Performance 7 dias:** ROAS, CPA, volume vs semana anterior
- **Saúde dos winners:** Quantos ativos? Quantos saturando? Quantos novos entraram?
- **Frequência:** Tendência de saturação? Algum Entity ID esgotando?
- **Budget:** Momento de escalar ou manter?
- **Pipeline:** Quantos winners prontos na teste para graduar?
- **Limpeza:** Winners pausados há 2+ semanas → arquivar

---

## 10. METAS E BENCHMARKS

| Métrica | Target | Aceitável | Kill |
|---------|--------|-----------|------|
| **ROAS** | ≥ 1.8x | ≥ 1.5x | < 1.3x por 5 dias seguidos |
| **Connect Rate** | > 80% | > 70% | < 60% |
| **Frequência** | < 2.0 | < 3.0 | > 3.5 + CTR caindo |
| **CTR** | > 1.2% | > 0.8% | Queda 30%+ |

---

## 11. NOMENCLATURA

### Campanha
`ShopeeADS | Escala | DD-MM-YYYY`

Exemplo: `ShopeeADS | Escala | 01-04-2026`

### Ad Set
`Broad ADV+ | 25-44`

Sempre esse. Não muda.

### Ad
**Seguir exatamente o que estiver na pipeline.** Nome e copy vêm da pipeline — não inventar.

---

## 12. REGRAS DE SEGURANÇA

### O que NUNCA fazer na campanha de escala

1. **Nunca subir criativo não testado** — só winners da teste (20+ compras, ROAS ≥ 1.8x)
2. **Nunca ajustar budget mais de ±15%/dia** — reseta aprendizado do Andromeda
3. **Nunca mexer em nada nos dias 1-5** — Andromeda calibrando Entity IDs
4. **Nunca criar múltiplos ad sets** — sempre 1-1-N
5. **Nunca pausar winner que está vendendo** só porque ROAS caiu um pouco
6. **Nunca mudar público** — sempre Broad ADV+ 25-44
7. **Nunca mexer em muita coisa ao mesmo tempo** — 1 mudança por vez, esperar resultado

### O que SEMPRE fazer

1. **Sempre verificar compliance** antes de subir qualquer ad (meta-policy-kb.md)
2. **Sempre preservar prova social** ao duplicar winner (mesmo Post ID)
3. **Sempre manter pipeline** — sem novos winners a escala morre
4. **Sempre reportar o que está ruim** com a mesma energia do que está bom
5. **Sempre comparar com período anterior** — nunca olhar métrica isolada
6. **Sempre seguir nomenclatura e copy da pipeline**

---

## 13. CHECKLIST DE COMPLIANCE — OBRIGATÓRIO ANTES DE QUALQUER AÇÃO

### Regra Absoluta

**ANTES de adicionar winner, ajustar budget ou qualquer operação na Meta**, o Léo DEVE consultar internamente a base de conhecimento e validar compliance. NÃO executar sem passar por este checklist.

### Base de Conhecimento (consultar SEMPRE)

| Documento | O que verificar |
|-----------|----------------|
| `meta-policy-kb.md` | Regras gerais de política, copy, personal attributes, claims |
| `meta-policy-kb-antiban.md` | Limites de escalada, billing, saúde da conta |
| `meta-policy-kb-tecnico.md` | Learning phase, ad review, Advantage+, CBO |
| `meta-policy-kb-api-reference.md` | Endpoints, parâmetros, enums, specs, CAPI |
| `meta-policy-kb-developers-deep.md` | Rate limits, error handling, batch requests |
| `meta-policy-kb-advanced.md` | Regras avançadas, edge cases |
| `ANDROMEDA_GEM_GUIDE.md` | Distribuição Andromeda, Entity ID, supressão de criativos |
| `META_ADS_ML_INFRASTRUCTURE.md` | ML pipeline, learning phase internals |

### Checklist Pré-Entrada de Winner

- [ ] **Winner validado?** 20+ compras E ROAS ≥ 1.8x na teste
- [ ] **Post ID preservado?** Usar effective_object_story_id (prova social)
- [ ] **Entity ID diferente?** Conceito genuinamente distinto dos winners atuais (Andromeda suprime similares)
- [ ] **Copy compliance?** Sem personal attributes, sem claims sem disclaimer
- [ ] **Nomenclatura e copy da pipeline?** Seguir exatamente o que estiver lá
- [ ] **Rate limit?** Max 60 escritas/hora, delay entre operações

### Checklist Pré-Ajuste de Budget

- [ ] **Não está nos dias 1-5?** Se sim, NÃO MEXER em nada
- [ ] **Máx ±15%/dia?** Nunca mais que isso
- [ ] **ROAS médio 3 dias?** Base pra decisão
- [ ] **Acabou de subir winner novo?** Esperar 7 dias antes de mexer
- [ ] **Acabou de pausar winner?** Esperar 3-5 dias (CBO recalibrando)

### Se em Dúvida

1. Consultar o documento específico
2. Se persistir, NÃO executar
3. Alertar Neto no Telegram
4. Aguardar resolução manual

---

*Template criado por Léo — Gestor de Tráfego | Zape Ecomm*
*Baseado no Manual Operacional Meta Ads 2026 + Andromeda/GEM + diretrizes do Neto*
