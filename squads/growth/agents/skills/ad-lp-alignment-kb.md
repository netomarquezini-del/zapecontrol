# Knowledge Base: Ad-to-Landing-Page Alignment

> Referencia tecnica para Max (Creative Strategist) distinguir problemas de criativo vs. problemas de LP,
> e garantir que o criativo e a pagina de destino trabalhem juntos para maximizar conversao.

---

## 1. O Principio do "Message Match"

Message Match e o grau de alinhamento entre o que o ad promete e o que a LP entrega.
Quando o visitor clica e encontra exatamente o que esperava, o cerebro confirma "estou no lugar certo"
e a resistencia cai. Quando ha desalinhamento, o visitor sai.

### 1.1 Continuidade Visual
- Cores do ad devem aparecer na LP (paleta consistente)
- Se o ad usa foto/estilo UGC, a LP nao pode ser corporativa/stock
- Imagens do ad devem aparecer no hero da LP (mesma foto ou estilo)
- Se o ad mostra o rosto do Neto, a LP precisa ter o Neto no hero
- Tipografia e estilo grafico devem seguir a mesma linguagem

### 1.2 Continuidade de Headline
- A promessa principal do ad DEVE aparecer no H1 da LP
- Nao precisa ser identica, mas o visitor precisa reconhecer a mensagem
- Exemplo BOM: Ad "ROAS de 25 na Shopee em 7 dias" → LP "Aprenda a ter ROAS de 25 na Shopee"
- Exemplo RUIM: Ad "ROAS de 25 na Shopee" → LP "Aprenda a vender online" (generico demais)
- Regra: se o ad tem um numero/dado especifico, esse numero deve estar na LP

### 1.3 Continuidade de Tom
- Ad casual/UGC → LP deve manter tom acessivel e informal
- Ad tecnico/educativo → LP pode ser mais estruturada mas nunca corporativa
- Ad com humor → LP precisa manter pelo menos leveza (nao virar texto juridico)
- Para Zape Ecomm: tom e sempre tecnico-educativo como professor que simplifica

### 1.4 Continuidade de Oferta
- O que foi prometido no ad PRECISA estar na LP
- Se o ad fala de bonus, a LP precisa mostrar os bonus
- Se o ad fala de preco/desconto, a LP precisa confirmar imediatamente
- Se o ad fala de garantia, a LP precisa exibir a garantia
- REGRA DE OURO: Nunca adicionar na LP algo que contradiga o ad

---

## 2. Framework de Diagnostico: Problema no Ad vs. Problema na LP

### 2.1 Matriz de Diagnostico

```
┌─────────────────────┬────────────────────────┬────────────────────────────────┐
│ CENARIO             │ METRICAS               │ DIAGNOSTICO                    │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR Alto + CVR Alto │ CTR >= 1.5%            │ TUDO OK — escalar              │
│                     │ CVR >= 2% (venda)      │                                │
│                     │ CPA dentro do target   │                                │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR Alto + CVR Baixo│ CTR >= 1.5%            │ PROBLEMA NA LP                 │
│                     │ CVR < 1%               │ O ad funciona, a LP nao        │
│                     │ CPA alto               │ converte a intencao em acao    │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR Baixo + CVR ok  │ CTR < 0.72%            │ PROBLEMA NO AD                 │
│                     │ CVR pode ser decente   │ O ad nao gera interesse        │
│                     │ Poucas amostras        │ suficiente para cliques        │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR Alto + CVR Alto │ CTR >= 1.5%            │ PROBLEMA DE PUBLICO            │
│ + CPA Alto          │ CVR >= 2%              │ Atrai quem clica e converte    │
│                     │ CPA acima do target    │ mas o custo de aquisicao e     │
│                     │ CPM alto               │ alto — publico errado ou caro  │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR ok + CVR ok     │ CTR ok                 │ PROBLEMA DE ESCALA/BUDGET      │
│ + Volume baixo      │ CVR ok                 │ Metricas saudaveis mas volume  │
│                     │ Poucas conversoes      │ insuficiente — aumentar budget │
├─────────────────────┼────────────────────────┼────────────────────────────────┤
│ CTR caindo          │ CTR decrescente semana │ FADIGA CRIATIVA                │
│ progressivamente    │ a semana               │ Ad esgotou — refresh criativo  │
│                     │ Frequencia > 3         │ necessario, sinalizar pro Leo  │
└─────────────────────┴────────────────────────┴────────────────────────────────┘
```

### 2.2 Thresholds de Referencia (Meta Ads 2025)

| Metrica | Ruim | Aceitavel | Bom | Excelente |
|---------|------|-----------|-----|-----------|
| CTR (Link Click) | < 0.72% | 0.72-1.0% | 1.0-1.5% | > 1.5% |
| CVR (Venda/Lead) | < 1% | 1-2% | 2-5% | > 5% |
| CVR (Lead Gen) | < 3% | 3-5% | 5-9% | > 9% |
| Hook Rate (3s) | < 20% | 20-30% | 30-40% | > 40% |
| Bounce Rate LP | > 70% | 50-70% | 35-50% | < 35% |
| Page Load (mobile) | > 5s | 3-5s | 2-3s | < 2s |
| CPA (low-ticket R$27-97) | > R$80 | R$40-80 | R$20-40 | < R$20 |

### 2.3 Metricas Especificas para Diagnostico de LP

Quando Max identifica CTR Alto + CVR Baixo, os sinais adicionais sao:

**Na Meta (dados disponiveis):**
- Outbound Click Rate alto mas conversao baixa = LP problem confirmado
- Landing Page View / Link Click ratio < 80% = LP carregando devagar (visitors desistindo antes de carregar)
- Tempo entre clique e conversao muito alto = LP confusa ou longa demais

**Na LP (se tiver analytics):**
- Bounce Rate > 70% = primeira impressao ruim (message mismatch provavel)
- Scroll Depth < 25% = hero section nao convence
- Tempo na pagina < 10s = visitor nao encontrou o que esperava
- Cliques no CTA baixos = CTA fraco, posicao ruim, ou preco assustou

---

## 3. Mismatches Comuns que Matam a Conversao

### 3.1 Escalada de Promessa
- **O que e:** Ad promete X. LP promete X + Y + Z + bonus + transformacao de vida
- **Por que mata:** Overwhelm. O visitor veio por X e se sente bombardeado
- **Solucao:** LP deve entregar X com clareza. Bonus e extras vem DEPOIS do CTA principal
- **Exemplo:** Ad fala de "curso de Shopee ADS" → LP começa falando de "programa completo de e-commerce com 47 modulos, 12 bonus, mentoria..."

### 3.2 Tone Mismatch
- **O que e:** Ad e casual/UGC/autenticO → LP e corporativa/polida/formal
- **Por que mata:** Quebra a confianca. O visitor sente que caiu numa pagina errada
- **Solucao:** Se o ad e UGC, a LP deve ter elementos UGC (depoimentos reais, fotos reais, texto informal)
- **Dado:** Engajamento aumenta ~28% quando UGC e brand creative sao combinados

### 3.3 Desconexao Visual
- **O que e:** Ad usa foto real/selfie/UGC → LP tem stock photos profissionais
- **Por que mata:** O cerebro nao reconhece a continuidade. "Sera que e a mesma coisa?"
- **Solucao:** Hero da LP deve usar mesma estetica visual do ad

### 3.4 Ponte de Prova Social Ausente
- **O que e:** Ad mostra depoimento/resultado → LP nao tem nenhuma prova social
- **Por que mata:** A prova social que motivou o clique desaparece, a confianca cai
- **Solucao:** Se o ad lidera com prova social, a LP DEVE ter prova social acima do fold
- **Best practice:** Colocar depoimentos/numeros ANTES do CTA principal

### 3.5 Price Shock (Choque de Preco)
- **O que e:** Ad nao menciona preco → LP bate com preco logo de cara
- **Por que mata:** O visitor nao foi preparado para investir. Resistencia maxima
- **Solucao para low-ticket (R$27-97):** Pode mostrar preco, mas DEPOIS de construir valor
- **Solucao para high-ticket:** NUNCA mostrar preco na LP sem contexto de valor
- **Regra:** Exibir preco SEMPRE depois de: beneficios + prova social + comparacao de valor

### 3.6 Tempo de Carregamento Destruindo Intencao
- **O que e:** LP demora > 3 segundos para carregar no mobile
- **Por que mata:** A intencao criada pelo ad tem prazo de validade — a cada segundo perdido, o desejo esfria
- **Dados criticos:**
  - 53% dos visitors mobile saem se a LP demora > 3s
  - Cada segundo extra de load = queda de 7-20% na conversao
  - Bounce rate aumenta 103% com 2s extras de load
  - Sweet spot: 2.4s para pico de conversao mobile
- **Como detectar:** Landing Page View / Link Click < 80% = LP lenta
- **Solucao:** Comprimir imagens, eliminar scripts desnecessarios, usar CDN, testar no PageSpeed Insights

### 3.7 Excesso de Links/Distracao na LP
- **O que e:** LP tem menu de navegacao, links pro Instagram, blog, sobre nos, etc.
- **Por que mata:** Cada link extra e uma saida. Attention Ratio ideal = 1:1
- **Regra:** LP dedicada para ads = ZERO links de navegacao, APENAS CTAs de conversao

---

## 4. Best Practices para LP Design Alinhada com Meta Ads

### 4.1 Above-the-Fold (Hero Section)
- DEVE espelhar a promessa exata do ad
- Headline = mesma linguagem do ad (nao um resumo generico)
- Imagem/video = mesmo estilo visual do ad
- CTA visivel sem scroll
- NENHUM link de navegacao

### 4.2 Hierarquia de Conteudo Mobile-First
```
ACIMA DO FOLD (sem scroll):
├── Headline (= promessa do ad)
├── Sub-headline (expandir a promessa em 1 frase)
├── Imagem/video hero (mesmo estilo do ad)
└── CTA #1 (botao grande, thumb-friendly)

PRIMEIRO SCROLL:
├── Prova social rapida (numeros ou 1 depoimento curto)
├── 3-5 bullets de beneficios
└── CTA #2

CORPO:
├── Video de vendas / VSL (se aplicavel)
├── Detalhamento da oferta
├── Mais prova social (depoimentos, prints)
├── Quebrando objecoes
├── Comparacao de valor (o que voce recebe vs. preco)
├── Garantia
└── CTA #3

FINAL:
├── FAQ (responder objecoes restantes)
├── Ultima prova social
└── CTA #4 (final)
```

### 4.3 Requisitos Tecnicos Mobile
- 80%+ do trafego Meta e mobile — design mobile-first OBRIGATORIO
- Page load < 3 segundos (ideal < 2.4s)
- Botoes com minimo 44x44px (thumb-friendly)
- Texto legivel sem zoom (minimo 16px body)
- Forms com campos grandes para digitacao mobile
- Layout vertical, sem scroll horizontal
- Imagens comprimidas (WebP quando possivel)
- Lazy loading para imagens abaixo do fold

### 4.4 Quantos CTAs e Onde
- Minimo 3 CTAs numa sales page
- CTA #1: Acima do fold (para quem ja esta convencido)
- CTA #2: Apos prova social (para quem precisava de confianca)
- CTA #3: Apos detalhamento da oferta (para quem precisava de informacao)
- CTA #4: Final da pagina (ultima chance)
- Para paginas longas: CTA a cada 2-3 scrolls
- Texto do CTA: acao direta ("Quero minha vaga", "Comecar agora", "Garantir acesso")
- NUNCA "Saiba mais" ou "Clique aqui" — sempre orientado a acao

---

## 5. Frameworks para Sales Pages de Cursos/Infoprodutos

### 5.1 VSL Page (Video Sales Letter)

**Quando usar:** Produto com ticket medio (R$97-497), necessita explicacao, publico morno a quente.

```
ESTRUTURA:
┌─────────────────────────────────────┐
│ HEADLINE (forte, especifica)        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        VIDEO (VSL)              │ │
│ │   (autoplay sem som ou click)   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [CTA BUTTON]                        │
│                                     │
│ (nada mais acima do fold)           │
└─────────────────────────────────────┘
```

- Acima do fold: APENAS headline + video + CTA
- Video segue estrutura PRSA (Problema → Resultado → Solucao → Acao)
- CTA pode aparecer so apos X minutos do video (cria escassez)
- Abaixo do fold: bullets de beneficio + depoimentos + FAQ
- Ideal para quando o Neto grava um video longo de vendas

### 5.2 Long-Form Sales Page (Pagina Longa de Vendas)

**Quando usar:** Cursos de ticket baixo a medio (R$47-297), publico que precisa ser educado, ofertas com muitos beneficios.

```
ORDEM DOS ELEMENTOS:
1. HEADLINE (promessa principal — mirror do ad)
2. SUB-HEADLINE (expandir + qualificar)
3. LEAD (historia/problema — identificacao)
4. VIDEO OU PROVA INICIAL (resultado, print, depoimento)
5. BENEFICIOS (5-7 bullets com beneficios, nao features)
6. [CTA #1]
7. PROVA SOCIAL (3-5 depoimentos com resultado especifico)
8. DETALHAMENTO DA OFERTA (modulos, conteudo, bonus)
9. COMPARACAO DE VALOR ("isso valeria R$X, mas voce paga R$Y")
10. [CTA #2]
11. GARANTIA (7 dias incondicionais)
12. QUEBRANDO OBJECOES (3-5 objecoes mais comuns)
13. FAQ (5-10 perguntas)
14. PROVA SOCIAL FINAL (depoimento forte + numeros)
15. [CTA #3 — URGENCIA]
```

**Regra de copy:** Cada secao deve fluir naturalmente para a proxima como um "escorregador"
("slippery slope") — o leitor nunca deve ter motivo para parar de ler.

### 5.3 Mini Sales Page (Impulse Low-Ticket R$27-R$97)

**Quando usar:** Shopee ADS 2.0, produtos de entrada, compra por impulso.

```
ESTRUTURA ENXUTA (1-2 scrolls mobile):
┌─────────────────────────────────────┐
│ HEADLINE (resultado especifico)     │
│ "Aprenda a ter ROAS de 25 na       │
│  Shopee com ADS em 7 dias"         │
│                                     │
│ VIDEO CURTO (30-90s) ou IMAGEM      │
│                                     │
│ 3-5 BULLETS de beneficio            │
│                                     │
│ PRECO + GARANTIA lado a lado        │
│ "R$47 — Garantia de 7 dias"        │
│                                     │
│ [CTA GRANDE — "QUERO MINHA VAGA"]  │
│                                     │
│ 2-3 DEPOIMENTOS rapidos (print)    │
│                                     │
│ [CTA FINAL]                         │
└─────────────────────────────────────┘
```

**Principios do low-ticket:**
- Decisao por impulso — LP curta, direta, sem overthinking
- Mostrar preco CEDO (apos bullets) — low-ticket nao precisa esconder preco
- Valor percebido > preco: "Tudo isso por apenas R$47?"
- Adicionar 2-3 bonus para amplificar percepcao de valor
- Garantia remove risco: "Se nao gostar, devolvo 100%"
- Preco redondo preferido: R$47, R$67, R$97
- Compra deve ser possivel em < 60 segundos apos pouso na LP

### 5.4 Escolha do Formato por Produto Zape Ecomm

| Produto | Ticket | Formato LP | Motivo |
|---------|--------|-----------|--------|
| Shopee ADS 2.0 | R$47-97 | Mini Sales Page | Impulso, baixo risco, decisao rapida |
| Futuros low-tickets | R$27-97 | Mini Sales Page | Mesmo principio |
| Programa de Aceleracao | R$12.000 | Long-Form + VSL | Precisa educar e construir confianca |
| Consultoria Premium | R$42.000 | VSL Page + Agendamento | Precisa de video longo + call |

---

## 6. Como Max Deve Flaggar Problemas de LP

### 6.1 Sinais que Indicam Problema de LP (nao de Criativo)

Max deve alertar Neto quando detectar TODOS estes sinais simultaneamente:

```
ALERTA DE LP — Criterios (TODOS devem ser verdadeiros):
1. CTR >= 1.5% (ad esta funcionando — gera cliques)
2. Hook Rate >= 30% (video prende atencao)
3. CVR < 1% (mas ninguem converte)
4. CPA > 2x o target
5. Padrao se repete em 2+ criativos diferentes com o mesmo link de destino
```

Se esses 5 criterios sao verdadeiros, o problema NAO e o criativo — e a LP.

### 6.2 Sinais Adicionais que Reforçam Diagnostico de LP

- Landing Page Views / Link Clicks < 80% → LP lenta demais
- Mesmo ad com LP diferente converte melhor → LP A e o problema
- Varias angles/copies com CTR bom mas CVR uniformemente baixo → LP e gargalo
- Conversao melhor em desktop que mobile → LP nao e mobile-friendly

### 6.3 Template de Alerta para Neto (via Telegram)

```
🚨 ALERTA DE LP — Max (Creative Strategist)

Detectei que o problema de conversao NAO esta nos criativos.

EVIDENCIA:
- {X} criativos com CTR > 1.5% e Hook Rate > 30%
- Todos apontam para: {URL da LP}
- CVR media: {X}% (target: {Y}%)
- CPA medio: R${X} (target: R${Y})

DIAGNOSTICO: Problema na Landing Page
- Os ads estao gerando cliques qualificados
- A LP nao esta convertendo essa intencao

POSSIVEIS CAUSAS (verificar):
☐ Message mismatch (headline da LP ≠ promessa do ad)
☐ Page speed (> 3s no mobile)
☐ Preco exposto cedo demais / sem contexto de valor
☐ Falta de prova social acima do fold
☐ CTA fraco ou escondido
☐ Design nao mobile-friendly
☐ Excesso de links/distracao

RECOMENDACAO:
{recomendacao_especifica baseada nos dados}

— Max 🎯
```

### 6.4 Template de Audit "Creative → LP Alignment"

Max deve rodar este audit quando for fazer analise semanal:

```
═══════════════════════════════════════════════
CREATIVE → LP ALIGNMENT AUDIT
Data: {data}
LP analisada: {URL}
Criativos apontando para esta LP: {lista}
═══════════════════════════════════════════════

1. MESSAGE MATCH SCORE (0-10)
   ☐ Headline da LP espelha promessa do ad? ___/2
   ☐ Imagem/estilo visual consistente? ___/2
   ☐ Tom de voz alinhado? ___/2
   ☐ Oferta identica ao prometido no ad? ___/2
   ☐ CTA na LP e coerente com CTA do ad? ___/2
   TOTAL MESSAGE MATCH: ___/10

2. LP PERFORMANCE SIGNALS
   ☐ LP Views / Link Clicks ratio: ___%  (benchmark: > 80%)
   ☐ CVR atual: ___% (benchmark: > 2% venda, > 5% lead)
   ☐ Bounce Rate (se disponivel): ___% (benchmark: < 50%)
   ☐ Mobile Page Speed: ___s (benchmark: < 3s)
   ☐ Mobile-friendly? (sim/nao)

3. CHECKLIST DE MISMATCH
   ☐ Escalada de promessa? (LP promete mais que o ad)
   ☐ Tone mismatch? (casual ad → corporate LP ou vice-versa)
   ☐ Visual disconnect? (UGC ad → stock LP)
   ☐ Prova social ausente? (ad mostra prova → LP nao tem)
   ☐ Price shock? (preco aparece sem contexto de valor)
   ☐ Excesso de links/navegacao? (attention ratio > 1:1)
   ☐ CTA escondido? (precisa scrollar muito pra achar)
   ☐ Hero section nao mirror do ad?

4. DIAGNOSTICO
   ☐ Problema e do CRIATIVO → {acao}
   ☐ Problema e da LP → {acao}
   ☐ Problema e do PUBLICO → sinalizar Leo
   ☐ Problema e de FADIGA → refresh criativo

5. RECOMENDACOES PARA NETO
   Prioridade 1: _________________________________
   Prioridade 2: _________________________________
   Prioridade 3: _________________________________

═══════════════════════════════════════════════
```

### 6.5 Quando Max NAO Deve Culpar a LP

Max deve ter cuidado para nao atribuir problemas a LP quando na verdade sao do criativo:

- **CTR baixo (<0.72%)** = Problema e 100% no ad, nao na LP (visitor nem chegou la)
- **Hook Rate baixo (<20%)** = Problema e no hook do video, nao na LP
- **CTR caindo semana a semana** = Fadiga criativa, nao LP
- **Apenas 1 criativo com CVR baixo** = Pode ser o criativo, nao a LP (testar com outro)
- **Poucos dados (<100 cliques)** = Amostra insuficiente para diagnosticar LP

**Regra de amostra minima:** Precisamos de pelo menos 100-200 cliques (Landing Page Views)
num unico ad antes de diagnosticar problema de LP com confianca.

---

## 7. Integracao com Fluxo Operacional

### 7.1 Onde Este Conhecimento Entra no Fluxo Semanal

```
SEGUNDA-FEIRA:
Leo puxa metricas → Max analisa criativos → Max roda LP Alignment Audit

SE detectar problema de LP:
1. Max envia alerta no Telegram (template 6.3)
2. Max NAO gera mais variações de copy para essa LP (seria desperdicio)
3. Max recomenda ajustes especificos na LP
4. So volta a gerar novos criativos quando LP for corrigida

SE tudo OK:
1. Max gera variações normalmente
2. Max inclui LP Alignment Score no relatorio semanal
```

### 7.2 Regras de Decisao para Max

```
SE CTR_alto E CVR_baixo:
  → PARAR de otimizar criativos
  → ALERTAR Neto sobre LP
  → RECOMENDAR ajustes especificos

SE CTR_baixo:
  → Problema e no CRIATIVO
  → Gerar novos hooks/angulos
  → NAO mencionar LP

SE CTR_alto E CVR_alto E CPA_alto:
  → Problema e no PUBLICO
  → SINALIZAR Leo para ajustar segmentacao
  → Criativos e LP estao OK

SE tudo_OK:
  → Escalar (aumentar budget)
  → Gerar variações para diversificar
  → Monitorar fadiga
```

---

## Fontes e Referencias

- Disruptive Advertising — "Message Match: The Good, The Bad, and The Ugly"
- KlientBoost — "Message Match: Critical Component For Ad Success"
- Avalanche Firm — "Message Matching: Boost Conversions with Ad & Landing Page Harmony"
- Smart Insights — "High CTR and Low Conversion Rate: Common Marketing Mistakes"
- PPC Hero — "High CTR? Low Conversion Volume? Where's The PPC Disconnect?"
- Search Engine Journal — "How To Maximize Paid Ads Profitability With A Strategic Landing Page Audit"
- Unbounce — "7 Page Speed Stats Every Marketer Should Know"
- WordStream — "Facebook Ads Benchmarks 2025"
- AdAmigo — "Meta Ads Benchmarks 2025 by Industry"
- Enrich Labs — "Meta Ads Benchmarks 2026"
- Systeme.io — "How to Write a Long-Form Sales Page (With 7 Templates)"
- Thrive Themes — "7 Elements of a Successful Sales Page"
- EstudioSite — "Low Ticket que Funciona: Como Vender Produtos de R$27 a R$97 em Alto Volume"
- Dancing Chicken — "Ultimate Guide to Landing Page Design for Meta Ads"
- Instapage — "100-Point Landing Page Audit Checklist"
