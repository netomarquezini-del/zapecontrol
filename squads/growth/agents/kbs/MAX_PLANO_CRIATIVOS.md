# Plano de Criativos — Max (Creative Strategist)

> Documento operacional atualizado pelo Léo (Gestor de Tráfego) em 29/03/2026
> Baseado na auditoria Andromeda dos 92 criativos ativos na Campanha Única ADVG+
> LEITURA OBRIGATÓRIA antes de gerar qualquer nova copy

---

## 1. ESTADO ATUAL DA CAMPANHA

**Campanha:** Campanha Única ADVG+
**Ad Set:** Público ADVG+ (broad, 18-65, Brasil, Advantage+)
**Total de Ads:** 92 ativos
**Objetivo:** PURCHASE (Shopee ADS 2.0)
**Início:** 29/03/2026
**Link:** https://netomarquezini.com.br/curso-ads/

---

## 2. DIAGNÓSTICO — O QUE ESTÁ ERRADO

### O Andromeda clusteriza criativos por conceito (Entity ID)
Criativos com similarity > 60% são suprimidos. Dos 92 ads, o Andromeda provavelmente
vê apenas ~12-15 conceitos distintos. O resto compete consigo mesmo.

### Distribuição atual dos 92 ads por ângulo:

| Ângulo | Qty | % | Status |
|--------|-----|---|--------|
| Dor (gasto sem retorno) | 23 | 25% | SATURADO |
| Mecanismo (4 configs) | 18 | 20% | SATURADO |
| Resultado (ROAS 25) | 16 | 17% | SATURADO |
| Prova Social | 10 | 11% | OK |
| Contrarian | 9 | 10% | OK |
| Simplicidade | 7 | 8% | BAIXO |
| Oportunidade | 5 | 5% | BAIXO |
| História | 4 | 4% | CRÍTICO |
| **Demo** | **0** | **0%** | **ZERO** |
| **Identidade** | **0** | **0%** | **ZERO** |

### Distribuição por persona:

| Persona | Qty | % | Status |
|---------|-----|---|--------|
| Intermediário | 51 | 55% | SATURADO |
| Frustrado | 36 | 39% | SATURADO |
| Iniciante | 5 | 5% | CRÍTICO |
| **Orgânico** | **0** | **0%** | **ZERO** |
| **Outro marketplace** | **0** | **0%** | **ZERO** |

### Distribuição por formato:

| Formato | Qty | % | Status |
|---------|-----|---|--------|
| Motion Graphics | 45 | 49% | SATURADO |
| Talking Head | 27 | 29% | OK |
| Estático | 20 | 22% | OK |
| **Caixinha Pergunta** | **0** | **0%** | **ZERO** |
| **Screen Capture** | **0** | **0%** | **ZERO** |
| **UGC** | **0** | **0%** | **ZERO** |
| **Carrossel** | **0** | **0%** | **ZERO** |
| **Meme/Nativo** | **0** | **0%** | **ZERO** |
| **Before/After** | **0** | **0%** | **ZERO** |
| **Depoimento (aluno)** | **0** | **0%** | **ZERO** |
| **Print/Screenshot** | **0** | **0%** | **ZERO** |

---

## 3. MATRIZ ÂNGULO × FORMATO (ESTADO ATUAL)

Cada número = quantidade de ads ativos nessa combinação.
Vazio (0) = oportunidade. 3+ = saturado.

```
                  TalkHead  Caixinha  Screen  Depoim  UGC  Motion  Estático  Carrossel  Meme  B/A  Print
Dor                  8        0        0       0      0      9       6         0        0    0     0
Resultado            7        0        0       0      0      5       4         0        0    0     0
Mecanismo            7        0        0       0      0      9       2         0        0    0     0
Identidade           0        0        0       0      0      0       0         0        0    0     0
Contrarian           2        0        0       0      0      5       2         0        0    0     0
História             0        0        0       0      0      3       1         0        0    0     0
Prova Social         3        0        0       0      0      5       2         0        0    0     0
Demo                 0        0        0       0      0      0       0         0        0    0     0
Oportunidade         0        0        0       0      0      4       1         0        0    0     0
Simplicidade         0        0        0       0      0      5       2         0        0    0     0
```

**77 das 110 células estão vazias = 77 oportunidades de Entity ID inexploradas.**

---

## 4. O QUE O MAX DEVE GERAR — PRÓXIMOS BATCHES

### BATCH 1 — PRIORIDADE URGENTE (Ângulos Inexplorados)
**Objetivo:** Criar os ângulos que NÃO existem na campanha
**Formato:** Estático (Thomas produz rápido, teste barato)
**Prazo:** Imediato

| # | Ângulo | Persona | Hook | Formato | Referência de Copy |
|---|--------|---------|------|---------|--------------------|
| 1 | **Demo** | intermediário | passo_a_passo | estático | "Olha o painel: ROAS 25 em tempo real. São 4 configurações." |
| 2 | **Demo** | iniciante | pergunta | estático | "Quer ver como funciona? Clique por clique, sem segredo." |
| 3 | **Identidade** | orgânico | identificação | estático | "Você vende bem no orgânico. Imagina com ADS." |
| 4 | **Identidade** | outro_marketplace | identificação | estático | "Vende no ML? A Shopee tá crescendo 40%. Entre agora." |
| 5 | **Identidade** | iniciante | identificação | estático | "Pra quem tá começando na Shopee e quer fazer certo desde o dia 1." |
| 6 | **História** | frustrado | história | estático | "Gastei R$3.000 em ADS antes de descobrir o que tava errado." |
| 7 | **História** | intermediário | história | estático | "De ROAS 3 pra ROAS 25. A virada aconteceu quando mudei 4 configs." |
| 8 | **Oportunidade** | orgânico | fomo | estático | "Cada dia sem ADS = vendas que seu concorrente tá levando." |
| 9 | **Simplicidade** | iniciante | resultado | estático | "Nunca anunciou? 4 configurações. Passo a passo. Resultado em horas." |
| 10 | **Contrarian** | frustrado | pattern_interrupt | estático | "O guru mandou aumentar orçamento. Eu fiz o contrário. Deu certo." |

**Regras deste batch:**
- Cada estático segue o formato Thomas: headline bold + problema + resultado/solução + proof
- ~60-80 palavras por estático
- TODAS as copies devem incluir as tags [ÂNGULO] [PERSONA] [HOOK] [FORMATO]
- Mecanismo único (4 configurações) e promessa (ROAS 25) presentes em TODA copy
- Entregar TAMBÉM: texto primário + headline + descrição pro ad feed (copy body)

---

### BATCH 2 — PRIORIDADE ALTA (Formatos Inexplorados dos Winners)
**Objetivo:** Multiplicar os ângulos que JÁ FUNCIONAM em formatos que NUNCA testamos
**Quando:** Após 3-5 dias de dados do Batch 1 + campanha atual
**Depende de:** Dados de performance pra confirmar winners

**Winners conhecidos (dados históricos 30d):**
- AD163: CPA R$6 — ângulo DOR (ROAS abaixo de 10 = sem lucro)
- AD169: CPA R$7 — ângulo PROVA SOCIAL (depoimento "ROAS de 8 pra 27")
- AD129: CPA R$8 — ângulo DOR (ROAS abaixo de 10 = dinheiro na mesa)
- AD156: CPA R$11 — ângulo MECANISMO (4 configs progressivo)
- AD45: CPA R$12 — ângulo RESULTADO
- AD77: CPA R$14 — ângulo RESULTADO (estático)
- AD145: CPA R$22 — ângulo CONTRARIAN (refém da plataforma)

**Para cada winner, gerar copy adaptada para:**

| Winner | Ângulo Original | Formatos a Criar |
|--------|----------------|-----------------|
| AD163 (dor) | Talking Head | Caixinha, Screen Capture, Estático, Before/After, Print |
| AD169 (prova social) | Talking Head | Carrossel de depoimentos, UGC, Meme, Print |
| AD129 (dor) | Talking Head | Motion Graphics, Caixinha, UGC |
| AD145 (contrarian) | Talking Head | Caixinha, Estático, Meme/Nativo |

**Exemplo detalhado — AD163 (CPA R$6) em 5 formatos novos:**

**1. Caixinha de Pergunta:**
```
[ÂNGULO: dor] [PERSONA: frustrado] [HOOK: pergunta] [FORMATO: caixinha_pergunta]

Pergunta na tela: "Meu ROAS tá em 5, o que eu faço?"

Resposta (Neto fala): "ROAS abaixo de 10 na Shopee é sinal claro de problema.
Você vende, mas não lucra. Alguns sellers descobriram que o caminho não é
vender mais — é vender melhor. Pra isso, existem 4 configurações que travam
seu ROAS em 25. Clica no link da bio que eu te mostro."

Copy Body:
- Texto primário: "ROAS abaixo de 10? Você vende mas não lucra. Descubra as 4 configurações que travam seu ROAS em 25."
- Headline: "Pare de Vender no Prejuízo"
- Descrição: "Método testado por +4.000 alunos"
```

**2. Screen Capture:**
```
[ÂNGULO: dor] [PERSONA: intermediario] [HOOK: dado] [FORMATO: screen_capture]

Narração enquanto mostra tela:
"Olha aqui meu painel do Shopee ADS. Tá vendo esse ROAS? 25.
Agora olha esse seller aqui — ROAS 4. Mesma plataforma, mesmo nicho.
A diferença? 4 configurações. Vou te mostrar qual é a primeira..."
[Corta antes de mostrar] "Quer ver as 4? Clica no botão."

Copy Body:
- Texto primário: "Mesmo nicho, mesma plataforma. Um com ROAS 4, outro com ROAS 25. A diferença são 4 configurações."
- Headline: "Veja a Diferença na Tela"
- Descrição: "Clique por clique — acesso imediato"
```

**3. Before/After:**
```
[ÂNGULO: dor] [PERSONA: frustrado] [HOOK: contraste] [FORMATO: before_after]

ANTES: Painel Shopee com ROAS 3.2, saldo vermelho, margem negativa
Texto: "ANTES: Gastando R$100/dia, faturando R$320. Lucro: ZERO."

DEPOIS: Painel Shopee com ROAS 25, saldo verde, lucro alto
Texto: "DEPOIS: Gastando R$100/dia, faturando R$2.500. 4 configurações mudaram tudo."

Copy Body:
- Texto primário: "De ROAS 3 pra ROAS 25. Mesma loja, mesmo produto. A diferença foram 4 configurações no Shopee ADS."
- Headline: "Antes vs Depois — ROAS Real"
- Descrição: "Veja como +4.000 alunos fizeram essa virada"
```

**4. Print/Screenshot:**
```
[ÂNGULO: dor] [PERSONA: intermediario] [HOOK: dado] [FORMATO: print_screenshot]

Imagem: Print REAL do painel Shopee mostrando ROAS 25+
Overlay de texto: "Isso não é Photoshop. São as 4 configurações certas."
Badge: "+4.000 alunos com resultado"

Copy Body:
- Texto primário: "Print real. ROAS 25. Sem Photoshop, sem promessa vazia. 4 configurações que qualquer seller aplica."
- Headline: "ROAS 25 — Print Real"
- Descrição: "Acesso imediato ao método"
```

**5. Carrossel (para prova social):**
```
[ÂNGULO: prova_social] [PERSONA: intermediario] [HOOK: depoimento] [FORMATO: carrossel]

Card 1: "O que acontece quando seller descobre as 4 configurações:"
Card 2: Print aluno 1 — "ROAS saiu de 8 pra 27 em 10 dias"
Card 3: Print aluno 2 — "Faturei R$200K em 4 meses"
Card 4: Print aluno 3 — "Gastando R$15/dia e vendendo R$500"
Card 5: "Mais de 4.000 alunos já fizeram isso. Sua vez. Clica no botão."

Copy Body:
- Texto primário: "ROAS de 8 pra 27. R$200K em 4 meses. R$15/dia gerando R$500. Prints reais de alunos reais."
- Headline: "+4.000 Resultados Comprovados"
- Descrição: "Veja os prints e comece hoje"
```

---

### BATCH 3 — PRIORIDADE MÉDIA (Personas Inexploradas)
**Objetivo:** Criar copies pra personas que NÃO estão representadas
**Quando:** Após Batch 1 e 2 estarem rodando

**Persona: Seller Orgânico (0 ads atual)**
Esse seller vende bem SEM ads. Precisa entender por que ADS acelera.

| # | Ângulo | Hook | Formato | Copy (hook) |
|---|--------|------|---------|-------------|
| 1 | Oportunidade | fomo | estático | "Você vende bem no orgânico. Agora imagina multiplicar por 25." |
| 2 | Identidade | identificação | talking_head | "Se você já vende sem ADS, esse método vai explodir sua loja." |
| 3 | Resultado | dado | before_after | "Seller orgânico: R$5K/mês. Mesmo seller + ADS: R$50K/mês." |
| 4 | Mecanismo | secreto | caixinha | "Por que sellers orgânicos que aprendem ADS escalam 10x mais rápido?" |
| 5 | Simplicidade | resultado | motion_graphics | "Já vende bem? 4 configurações. 15 minutos. Resultado em 24h." |

**Persona: Seller de Outro Marketplace (0 ads atual)**
Esse seller vende no ML/Amazon e quer diversificar.

| # | Ângulo | Hook | Formato | Copy (hook) |
|---|--------|------|---------|-------------|
| 1 | Oportunidade | dado | estático | "Shopee cresceu 40% no Brasil. ML cresceu 12%. Onde você quer estar?" |
| 2 | Identidade | identificação | talking_head | "Vende no Mercado Livre? Shopee é a próxima onda. Entre antes da concorrência." |
| 3 | Simplicidade | resultado | motion_graphics | "Já sabe vender. Só precisa aprender as 4 configs do Shopee ADS." |
| 4 | Resultado | dado | before_after | "Seller ML: margem 8%. Mesmo seller na Shopee com ADS: margem 25%." |
| 5 | Contrarian | contrarian | estático | "Todo mundo tá focado no ML. Os espertos estão migrando pra Shopee." |

**Persona: Seller Iniciante (só 5 ads atual)**
Nunca vendeu ou acabou de começar. Precisa de segurança.

| # | Ângulo | Hook | Formato | Copy (hook) |
|---|--------|------|---------|-------------|
| 1 | Simplicidade | resultado | estático | "Primeira venda na Shopee em 24h? Com as 4 configurações é possível." |
| 2 | Demo | passo_a_passo | screen_capture | "Nunca mexeu em ADS? Eu te mostro clique por clique. Zero experiência necessária." |
| 3 | História | história | talking_head | "Comecei do zero. Em 30 dias fiz minha primeira venda com ADS. Hoje faturo R$40K." |
| 4 | Mecanismo | pergunta | caixinha | "Posso usar Shopee ADS mesmo sem experiência?" |
| 5 | Identidade | identificação | motion_graphics | "Pra quem tá começando e quer fazer certo desde o dia 1." |

---

## 5. REGRAS DE GERAÇÃO (OBRIGATÓRIAS)

### Toda copy DEVE conter:
1. **Tags completas:** `[ÂNGULO] [PERSONA] [HOOK] [FORMATO]`
2. **Mecanismo único:** "4 configurações do Shopee ADS" (presente em toda copy)
3. **Promessa:** ROAS de 25 (presente em toda copy)
4. **Copy body para o ad feed:**
   - Texto primário (max 125 caracteres visíveis, total até 250)
   - Headline (max 40 caracteres)
   - Descrição (max 30 caracteres)
5. **Estrutura PRSA** (mesmo em formatos curtos, comprimida)
6. **Nome do ad sugerido:** `AD### | [Formato] | [Ângulo] | Shopee Ads`

### Quotas por batch de 10 copies:
- Mínimo 4 ângulos diferentes
- Mínimo 3 formatos diferentes
- Mínimo 3 hooks diferentes
- Mínimo 2 personas diferentes
- Máximo 3 criativos do mesmo ângulo × formato

### Linguagem:
- Português BR do seller (não do expert)
- NUNCA usar "anúncio" — sempre "ADS"
- Shopee no hook sempre que possível
- "Botão" no CTA
- 150-220 palavras por roteiro de vídeo
- 60-80 palavras por estático
- Simples, direto, sem enrolação

---

## 6. QUEM PRODUZ O QUÊ

| Formato | Quem Produz | O Que Max Entrega |
|---------|------------|-------------------|
| Estático | Thomas | Briefing: headline, body, layout, blend |
| Motion Graphics | Maicon | Roteiro PRSA com timecodes + direção visual |
| Talking Head | Neto (grava) | Roteiro completo + sugestão de cenário |
| Caixinha Pergunta | Neto (grava) | Pergunta + roteiro da resposta |
| Screen Capture | Neto (grava) | Script narrado + indicações de tela |
| UGC | Aluno/Neto | Briefing 70% estruturado + 30% personalidade |
| Depoimento | Aluno | Perguntas guia + pontos obrigatórios |
| Carrossel | Thomas | Copy de cada card + layout |
| Meme/Nativo | Thomas | Conceito + copy + referência visual |
| Before/After | Thomas ou Maicon | Dados antes/depois + layout |
| Split Screen | Maicon | Roteiro dos 2 lados + timecodes |
| Print/Screenshot | Captura real | Indicação de qual tela capturar + overlay text |

---

## 7. CICLO DE OPERAÇÃO SEMANAL

```
SEGUNDA — Análise
  Max recebe dados de performance do Léo (últimos 7 dias)
  Atualiza matriz ângulo × formato com contagem e status
  Identifica winners (CPA ≤ target por 3+ dias)
  Identifica losers (CPA > 2× target)
  Identifica ângulos saturados e inexplorados

TERÇA — Geração Batch Estáticos
  Gera 5-10 copies de estáticos pra TESTAR ângulos novos
  Prioriza ângulos inexplorados + personas subrepresentadas
  Entrega briefings pro Thomas

QUARTA — Geração Batch Vídeos (winners)
  Pega ângulos validados (estáticos com bom CTR/Hook Rate)
  Gera roteiros pra formatos de vídeo (talking head, caixinha, motion, UGC)
  Entrega roteiros pro Neto (gravar) e Maicon (motion graphics)

QUINTA-SEXTA — Multiplicação de Formatos
  Winners confirmados → gerar copy adaptada pra 4-6 formatos
  Entregar briefings completos pra Thomas, Maicon e Neto

CONTÍNUO — Pipeline
  Nunca ter menos de 5 copies novas prontas pra produção
  Nunca ter menos de 3 ângulos diferentes no pipeline
  Alertar Léo quando criativo winner precisa de refresh (frequência > 3)
```

---

## 8. NOMENCLATURA PADRÃO DE ADS

A partir de agora, todo ad subido na Meta DEVE seguir:

```
AD[NÚMERO] | [FORMATO_ABREV] | [ÂNGULO_ABREV] | Shopee Ads
```

**Abreviações de formato:**
| Formato | Abrev |
|---------|-------|
| Talking Head | TH |
| Caixinha Pergunta | CX |
| Screen Capture | SC |
| Depoimento | DP |
| UGC | UGC |
| Motion Graphics | MG |
| Estático | EST |
| Carrossel | CAR |
| Meme/Nativo | MEM |
| Before/After | BA |
| Split Screen | SS |
| Print/Screenshot | PRT |

**Abreviações de ângulo:**
| Ângulo | Abrev |
|--------|-------|
| Dor | DOR |
| Resultado | RES |
| Mecanismo | MEC |
| Identidade | IDE |
| Contrarian | CON |
| História | HIS |
| Prova Social | PSO |
| Demo | DEM |
| Oportunidade | OPO |
| Simplicidade | SIM |

**Exemplos:**
- `AD187 | EST | DEM | Shopee Ads` (Estático, ângulo Demo)
- `AD188 | TH | IDE | Shopee Ads` (Talking Head, ângulo Identidade)
- `AD189 | CX | DOR | Shopee Ads` (Caixinha, ângulo Dor)
- `AD190 | MG | CON | Shopee Ads` (Motion Graphics, ângulo Contrarian)

---

## 9. PRÓXIMO AD NUMBER

O último AD usado é **AD186**. O próximo batch começa em **AD187**.

**Batch 1 (estáticos urgentes):** AD187-AD196
**Batch 2 (formatos winners):** AD197-AD216
**Batch 3 (personas novas):** AD217-AD231

---

## 10. COPIES PRONTAS DO AD FEED (por ângulo)

Quando o Léo subir os ads, usar estas copies no body do ad.
Cada ângulo tem copy específica pra diferenciar o Entity ID no Andromeda.

### Dor
- **Texto:** Você tá gastando com ADS na Shopee e no final do mês não sabe pra onde foi o dinheiro? O problema não é o orçamento — são as configurações erradas. Descubra as 4 configurações que os top sellers usam pra ter ROAS de 25.
- **Headline:** Pare de Perder Dinheiro na Shopee
- **Descrição:** Método testado por +4.000 alunos

### Resultado
- **Texto:** ROAS de 25. Não é promessa — é o resultado real dos alunos que aplicam as 4 configurações do Shopee ADS. Mais de 4.000 sellers já transformaram seus ADS com esse método passo a passo.
- **Headline:** ROAS 25 com 4 Configurações
- **Descrição:** Curso Shopee ADS 2.0 — Acesso imediato

### Mecanismo
- **Texto:** Existem 4 configurações no Shopee ADS que 90% dos sellers não conhecem. São elas que separam quem tem ROAS de 25 de quem queima dinheiro todo dia. Nesse curso, mostro clique por clique.
- **Headline:** As 4 Configurações que Mudam Tudo
- **Descrição:** Passo a passo completo

### Identidade
- **Texto:** Se você vende na Shopee e ainda não domina a ferramenta de ADS, tá no modo difícil. Esse curso foi feito pra sellers que querem escalar de verdade — sem enrolação, só prática.
- **Headline:** Pra Quem Quer Escalar na Shopee
- **Descrição:** Mesmo que nunca tenha anunciado

### Contrarian
- **Texto:** Todo mundo fala pra aumentar orçamento. Eu discordo. O problema não é quanto você gasta — é COMO configura. Sellers gastando R$15/dia com as configurações certas vendem mais que quem gasta R$100 no automático.
- **Headline:** Não Aumente Seu Orçamento
- **Descrição:** Antes de gastar mais, configure certo

### História
- **Texto:** Um ano atrás eu tava queimando dinheiro na Shopee igual você. Testei tudo que guru mandava e nada funcionava. Até que descobri 4 configurações que ninguém ensinava. Hoje, ROAS de 25.
- **Headline:** De Prejuízo a ROAS 25
- **Descrição:** A história que mudou tudo

### Prova Social
- **Texto:** Mais de 4.000 alunos. Mais de R$50 milhões vendidos em marketplaces. Sellers que saíram do zero e chegaram a R$200K de faturamento. Esses são os números — agora é sua vez.
- **Headline:** 4.000 Alunos Já Comprovaram
- **Descrição:** Resultados reais de sellers reais

### Demo
- **Texto:** Vou te mostrar na tela, clique por clique, como configurar seus ADS na Shopee pra ter ROAS de 25. Sem teoria — tela compartilhada, passo a passo, do zero ao resultado.
- **Headline:** Veja na Prática — Clique por Clique
- **Descrição:** Acesso imediato ao curso

### Oportunidade
- **Texto:** A Shopee tá crescendo 40% ao ano no Brasil. Quem dominar ADS agora vai surfar essa onda. Quem não aprender, vai ficar pra trás vendo o concorrente vender.
- **Headline:** A Oportunidade é Agora
- **Descrição:** Entre antes do mercado saturar

### Simplicidade
- **Texto:** 4 configurações. Passo a passo. Sem enrolação. Mesmo que você nunca tenha anunciado na vida, em poucas horas você vai saber exatamente o que fazer pra ter resultado com Shopee ADS.
- **Headline:** 4 Passos. Resultado Real.
- **Descrição:** Simples, direto — acesso imediato
