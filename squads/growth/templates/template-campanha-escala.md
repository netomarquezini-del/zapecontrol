# Template — Campanha de Escala

## Modelo: Andromeda + CBO — Escala e Maximização de ROAS

---

## 1. OBJETIVO

Maximizar vendas e ROAS com os criativos winners validados nas campanhas de teste. Esta é a campanha que gera receita — aqui só entra o que já provou que funciona.

**Meta:** Escalar volume de vendas mantendo CPA dentro do target e ROAS acima da meta.

---

## 2. ESTRUTURA DA CAMPANHA

```
CAMPANHA ESCALA (CBO)
  Budget: Escalável (inicia R$X, cresce com performance)
  Objetivo: Sales (Purchase)
  │
  ├── Ad Set 1 — Broad ADV+ (25-44)
  │   ├── Winner 1 — Vídeo (melhor CPA)
  │   ├── Winner 2 — Imagem (melhor ROAS)
  │   ├── Winner 3 — Carrossel (bom volume)
  │   ├── ...
  │   └── Máximo 15 winners
  │
  ├── Ad Set 2 — Interesse específico (25-44) [opcional]
  │   └── Top winners (mesmos ou seleção)
  │
  └── Ad Set 3 — LAL compradores (25-44) [opcional]
      └── Top winners (mesmos ou seleção)
```

### Configuração Técnica

| Parâmetro | Valor | Observação |
|-----------|-------|------------|
| **Nome** | `ShopeeADS \| Escala \| DD-MM-YYYY` | 1 campanha permanente |
| **Objetivo** | OUTCOME_SALES | Otimizar para compra |
| **Tipo de Budget** | CBO | Andromeda distribui entre ad sets e ads |
| **Budget Diário** | Escalável (ver seção 5) | Cresce conforme performance |
| **Bid Strategy** | Highest Volume (Lowest Cost) | Quando estável, considerar Cost Cap |
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
| **Público (Ad Set 1)** | Broad com Advantage+ Audience |
| **Público (Ad Set 2)** | Interesse específico (muito diferente do broad) |
| **Público (Ad Set 3)** | Lookalike 1% de compradores |
| **Exclusão** | Compradores últimos 60 dias |

**Regra de públicos:** Múltiplos ad sets SOMENTE se os públicos forem MUITO diferentes (sobreposição < 30%). Objetivo: evitar saturação de um único público. Se não tiver públicos diferentes validados, rodar só com Broad.

### Placements (Manual)

**Incluídos:**
- Instagram Feed
- Instagram Stories
- Instagram Reels
- Facebook Feed
- Facebook Stories
- Facebook Reels

**Excluídos:**
- Audience Network (Classic e Rewarded)
- Facebook Instream Video
- Facebook Reels Overlay
- Instagram Explore
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
| **Máximo** | 15 criativos |
| **Mínimo** | 3 criativos |
| **Quem entra** | SOMENTE winners graduados das campanhas de teste |
| **Mix** | Vídeo + Imagem + Carrossel (manter diversidade de formatos) |
| **Prova social** | Todo winner entra com o MESMO Post ID (curtidas e comentários preservados) |

### Critério de Entrada (Graduação)

Para entrar na escala, o criativo DEVE ter atingido na campanha de teste:

| Critério | Valor |
|----------|-------|
| **CPA** | ≤ CPA target por 3-5 dias consecutivos |
| **Compras** | 5+ compras |
| **Impressões** | 1.000+ |
| **Tendência** | CPA estável ou caindo |

### Processo de Entrada

```
WINNER GRADUADO NA CAMPANHA DE TESTE
        │
        ▼
1. Verificar se campanha de escala tem vaga (< 15 ads)
        │
   SIM → Duplica o criativo usando MESMO Post ID
   │     (effective_object_story_id do post original)
   │     Prova social compartilhada entre teste e escala
        │
   NÃO → Escala tem 15 ads
              │
              ▼
         Comparar novo winner vs piores da escala
              │
         Novo tem CPA melhor? → Pausa o pior, entra o novo
         Novo tem CPA pior?  → Não entra. Mantém no teste apenas
```

### Link de Destino

- **URL:** `https://netomarquezini.com.br/curso-ads/`
- **Sempre com barra no final**
- **Sempre HTTPS**
- **UTMs:** `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}`

---

## 4. KILL RULES — QUANDO PAUSAR NA ESCALA

### Regras de Pausa

| # | Situação | Ação | Observação |
|---|----------|------|------------|
| 1 | CPA 50%+ acima do target por 5 dias | **PAUSA** | Na escala somos mais pacientes — o criativo já provou que funciona |
| 2 | Frequência > 3.5 + CTR caindo | **PAUSA** | Saturação — criativo precisa de descanso |
| 3 | CTR caiu 30%+ vs média histórica | **PAUSA** | Creative fatigue |
| 4 | CPA 3x acima do target com 2.000+ imp | **ARQUIVA** | Não tem mais salvação |

### Diferença das Kill Rules do Teste

Na escala, a tolerância é **maior** porque:
- O criativo já provou que converte
- Pode ser uma flutuação temporária
- Pausar winner na escala impacta receita diretamente

| Kill Rule | Na Teste | Na Escala |
|-----------|----------|-----------|
| 2x CPA sem conversão | Pausa imediato | Monitora 48h (já converteu antes) |
| CPA acima do target | 3-5 dias | 5 dias |
| Frequência | > 3.0 | > 3.5 |

### Pausar vs Arquivar na Escala

| Ação | Quando |
|------|--------|
| **PAUSAR** | Saturação temporária, CPA subiu mas pode voltar, frequência alta |
| **ARQUIVAR** | CPA 3x target com 2.000+ imp, pausado 2+ semanas, conceito superado |

**Nota:** Um winner pausado pode VOLTAR se o público tiver tempo de "esfriar" (2-3 semanas). Não arquive rápido demais.

---

## 5. REGRAS DE BUDGET — QUANDO ESCALAR

### Regra dos 20-30%

**Nunca aumentar mais de 30% de uma vez.** Aumentos maiores resetam a fase de aprendizado do Andromeda. O algoritmo precisa reaprender com o novo volume de budget, causando instabilidade de 2-3 dias.

### Dias 1-5: INTOCÁVEL
Não mexer no budget. Andromeda está aprendendo. Sem exceções.

### Dia 6+: Otimização DIÁRIA (±15%)

Olhar CPA MÉDIO dos últimos 3 dias para decidir:

| CPA médio últimos 3 dias | Ação |
|--------------------------|------|
| ≤ CPA target | **SOBE +15%** |
| Pouco acima (+10-20%) | **MANTÉM** |
| Muito acima (+20-50%) | **DESCE -15%** |
| Disparou (+50%+) | **DESCE -15%** e investiga causa |

### Exceções — NÃO mexer no budget se:
| Situação | Ação | Por quê |
|----------|------|---------|
| Acabou de subir winners novos | **ESPERA 7 dias** | Andromeda testando novos |
| Acabou de pausar criativos | **ESPERA 3-5 dias** | CBO recalibrando |

### Janelas de Análise

| Decisão | Janela |
|---------|--------|
| **Budget (subir/descer)** | Últimos 3 dias |
| **Kill rule de criativo** | Últimos 5 dias |
| **Análise semanal** | Últimos 7 dias |

### Exemplo Prático de Escala

```
Dia 1:  R$500/dia — Campanha lançada com winners
Dia 2-5: INTOCÁVEL (aprendizado)
Dia 6:  CPA 3d ok → R$575 (+15%)
Dia 7:  CPA 3d ok → R$661 (+15%)
Dia 8:  CPA 3d subiu → MANTÉM R$661
Dia 9:  CPA 3d piorou → R$562 (-15%)
Dia 10: CPA 3d estabilizou → R$646 (+15%)
...e assim por diante
```

**Regra: Nunca mais que 15% por dia. Nunca mexer nos dias 1-5.**

---

## 6. DISTRIBUIÇÃO DE VERBA — QUANDO 1 CRIATIVO DOMINA

### Cenário 1: Dominando + CPA Bom ✅

- 1 criativo consome 70%+ da verba
- CPA dentro do target, ROAS bom
- **Ação: NÃO MEXE**
- CBO está funcionando corretamente. Algoritmo coloca dinheiro onde dá resultado

### Cenário 2: Dominando + CPA Subindo ⚠️

- 1 criativo consome 80%+ da verba
- CPA subindo há 3 dias, frequência > 3
- **Ação: SOBE WINNERS NOVOS da teste**
  1. NÃO pausa o dominante (ainda é o melhor)
  2. Traz 2-3 winners novos da campanha de teste
  3. Andromeda testa automaticamente
  4. CBO redistribui se novo ganhar

### Cenário 3: Novos NÃO Pegam Tração 🚨

- 1 criativo consome 85%+ da verba
- Winners novos recebem quase 0 impressão
- **Ação ESCALONADA:**
  1. Verificar se novos são REALMENTE diferentes (ângulo, formato, copy)
  2. Se sim: sobe budget +20% (mais $$ = mais exploração pelo Andromeda)
  3. Último recurso: criar 2º ad set com os novos winners

### Regra de Ouro

Um criativo dominando a verba com CPA bom **NÃO é problema** — é o algoritmo funcionando. Só vira problema quando o CPA começa a subir. Aí o sinal é: traz winners novos da teste, não mexe no dominante.

---

## 7. FREQUÊNCIA E SATURAÇÃO

### Régua de Frequência

| Frequência | Status | Ação |
|-----------|--------|------|
| 1.0 - 2.0 | **SAUDÁVEL** | Manter, pode escalar |
| 2.0 - 3.0 | **ATENÇÃO** | Monitorar, garantir pipeline de novos criativos |
| 3.0 - 3.5 | **PREPARAR** | Trazer novos winners da teste, começar rotação |
| 3.5+ | **AÇÃO** | Se CTR caindo → PAUSA o criativo saturado |

### Como Combater Saturação na Escala

1. **Criativos novos** — trazer winners frescos da campanha de teste
2. **Públicos diferentes** — adicionar ad set com público novo (muito diferente)
3. **Pausar e descansar** — winner saturado pode voltar após 2-3 semanas
4. **Nunca:** aumentar budget pra "forçar" um criativo saturado

---

## 8. PÚBLICOS NA ESCALA

### Estrutura de Públicos

A campanha de escala pode ter múltiplos ad sets com públicos MUITO diferentes para evitar saturação:

| Ad Set | Público | Quando adicionar |
|--------|---------|-----------------|
| **Principal** | Broad ADV+ (25-44) | Sempre ativo |
| **Interesse** | Interesse específico validado | Quando broad saturar |
| **LAL** | Lookalike 1% de compradores | Quando tiver base de compradores |

### Regras de Públicos

- **Sobreposição máxima:** 30% entre ad sets. Se passar disso, consolidar
- **Cada público novo** = teste. Monitorar CPA separado por ad set
- **Se ad set novo tem CPA 2x do principal** por 7 dias → pausar
- **CBO distribui** — não forçar budget por ad set. Deixar o algoritmo decidir

---

## 9. CICLO DE VIDA DO WINNER NA ESCALA

| Fase | Sinais | Ação |
|------|--------|------|
| **Entrada** | Winner graduado da teste, prova social preservada | Monitorar primeiros 3-5 dias |
| **Performance** | CPA estável, ROAS bom, recebendo budget do CBO | Manter. Escalar budget se consistente |
| **Saturação** | Frequência subindo, CTR caindo | Trazer novos winners da teste |
| **Declínio** | CPA acima do target por 5 dias | Pausa. Pode voltar após 2-3 semanas |
| **Morte** | CPA 3x target, sem recuperação | Arquiva |

### Pipeline Contínuo

A escala depende de um **fluxo contínuo de winners** da campanha de teste. Se a teste para de produzir winners, a escala vai saturar eventualmente.

**Meta:** Pelo menos 1-2 novos winners graduados por semana entrando na escala.

---

## 10. CHECKLIST DIÁRIO — CAMPANHA DE ESCALA

### Manhã (10 min)

1. **CPA geral** — Está no target? Comparar com ontem e média 7 dias
2. **ROAS geral** — Acima da meta? Tendência subindo ou caindo?
3. **Budget gastou ontem?** — Se não gastou 90%+, verificar entrega
4. **Algum winner bateu kill rule?** — Verificar CPA individual de cada criativo
5. **Distribuição de verba** — 1 criativo domina? CPA dele está bom?

### Tarde (10 min)

6. **Frequência dos top criativos** — Algum acima de 3.0?
7. **Winners novos para entrar?** — Algum criativo graduado na teste pronto?
8. **Decisão de budget** — CPA estável 5+ dias? Considerar +20-30%
9. **Saúde dos ad sets** — Se múltiplos públicos, comparar CPA entre eles

### Checklist Semanal (Segunda-feira, 30 min)

- **Performance 7 dias:** CPA, ROAS, volume vs semana anterior
- **Saúde dos criativos:** Quantos winners ativos? Quantos saturando? Quantos novos entraram?
- **Frequência:** Tendência de saturação?
- **Budget:** Momento de escalar ou manter?
- **Pipeline:** Quantos winners prontos na teste para graduar?
- **Limpeza:** Winners pausados há 2+ semanas → arquivar

---

## 11. METAS E BENCHMARKS

| Métrica | Target | Aceitável | Alerta | Kill |
|---------|--------|-----------|--------|------|
| **CPA** | A definir | +30% target | +50% target (3 dias) | 3x target |
| **ROAS** | A definir | -20% target | < 1.2x (3 dias) | < 1.0x (5 dias) |
| **Connect Rate** | > 80% | > 70% | < 70% | < 60% |
| **Frequência** | < 2.0 | < 3.0 | > 3.0 | > 3.5 + CTR caindo |
| **CTR** | > 1.2% | > 0.8% | Queda 20% | Queda 30%+ |

**Nota:** CPA e ROAS targets serão calibrados com os dados das primeiras 2 semanas da nova operação.

---

## 12. NOMENCLATURA

### Campanha
`ShopeeADS | Escala | DD-MM-YYYY`

Exemplo: `ShopeeADS | Escala | 01-04-2026`

### Ad Set
`[Tipo Público] | [Detalhe]`

Exemplos:
- `Broad ADV+ | 25-44`
- `Interesse | E-commerce`
- `LAL 1% | Compradores`

### Ad
**Exatamente o nome do criativo original** (mantém o mesmo nome da teste)

Exemplos:
- `AD170 | Vídeo | Shopee Ads`
- `AD171 | Imagem | Shopee Ads`
- `AD172 | Carrossel | Shopee Ads`

---

## 13. REGRAS DE SEGURANÇA

### O que NUNCA fazer na campanha de escala

1. **Nunca subir criativo não testado** — só winners da teste
2. **Nunca aumentar budget mais de 30%** — reseta aprendizado
3. **Nunca pausar winner que está vendendo** só porque tem CPA um pouco acima
4. **Nunca mudar público sem monitorar** — sempre testar em ad set separado
5. **Nunca mexer em muita coisa ao mesmo tempo** — 1 mudança por vez, esperar resultado

### O que SEMPRE fazer

1. **Sempre verificar compliance** antes de subir qualquer ad (meta-policy-kb.md)
2. **Sempre preservar prova social** ao duplicar winner (mesmo Post ID)
3. **Sempre manter pipeline** — sem novos winners a escala morre
4. **Sempre reportar o que está ruim** com a mesma energia do que está bom
5. **Sempre comparar com período anterior** — nunca olhar métrica isolada

---

## 14. CHECKLIST DE COMPLIANCE — OBRIGATÓRIO ANTES DE QUALQUER AÇÃO

### Regra Absoluta

**ANTES de criar campanha de escala, adicionar winner, ajustar budget ou qualquer operação na Meta**, o Léo DEVE consultar internamente a base de conhecimento e validar compliance. NÃO executar sem passar por este checklist.

### Base de Conhecimento (consultar SEMPRE)

| Documento | O que verificar |
|-----------|----------------|
| `meta-policy-kb.md` | Regras gerais de política, copy, personal attributes, claims |
| `meta-policy-kb-antiban.md` | Limites de escalada, billing, saúde da conta |
| `meta-policy-kb-tecnico.md` | Learning phase, ad review, Advantage+, CBO/ABO |
| `meta-policy-kb-api-reference.md` | Endpoints, parâmetros, enums, specs, CAPI |
| `meta-policy-kb-developers-deep.md` | Rate limits, error handling, batch requests |
| `meta-policy-kb-advanced.md` | Regras avançadas, edge cases |
| `ANDROMEDA_GEM_GUIDE.md` | Distribuição Andromeda, auction dynamics |
| `META_ADS_ML_INFRASTRUCTURE.md` | ML pipeline, learning phase internals |

### Checklist Pré-Escala

- [ ] **Winner validado?** 5+ compras, CPA ≤ target por 3+ dias, 1.000+ imp
- [ ] **Post ID preservado?** Usar effective_object_story_id (prova social)
- [ ] **Budget não salta > 30%?** Reseta learning (meta-policy-kb-antiban.md seção 2)
- [ ] **Dias 1-5 intocável?** Não mexer no budget da campanha nova
- [ ] **Ad set com 50 eventos?** Não escalar antes de sair do learning
- [ ] **Copy compliance?** Sem personal attributes, sem claims sem disclaimer
- [ ] **Rate limit?** Max 60 escritas/hora, delay entre operações
- [ ] **Targeting correto?** Advantage+ age 18-65 como hard + 25-44 como sugestão

### Checklist Pré-Ajuste de Budget na Escala

- [ ] **Janela de 3 dias?** Decisão baseada em CPA médio últimos 3 dias
- [ ] **Máx ±15% por dia?** Nunca mais que isso
- [ ] **Acabou de subir winner novo?** Esperar 7 dias antes de mexer
- [ ] **Acabou de pausar criativo?** Esperar 3-5 dias (CBO recalibrando)
- [ ] **Não está no learning?** Verificar se ad set tem 50+ eventos

### Se em Dúvida

1. Consultar o documento específico
2. Se persistir, NÃO executar
3. Alertar Neto no Telegram
4. Aguardar resolução manual

---

*Template criado por Léo — Gestor de Tráfego | Zape Ecomm*
*Baseado no Manual Operacional Meta Ads 2026 + diretrizes da gerente de conta Meta*
