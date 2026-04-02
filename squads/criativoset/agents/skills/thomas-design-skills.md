# Skills — Thomas (Design)

Thomas opera com 11 competências organizadas em 4 tiers de especialização. As skills externas (instaladas via skills.sh) complementam as skills internas do agente.

---

## Skill Tree

```
DESIGN (Thomas)
│
├── TIER 0: INTELIGÊNCIA CRIATIVA (Estratégia antes de design)
│   ├── 1. CREATIVE INTELLIGENCE
│   │   ├── Mapeamento de ângulos (6 categorias Hormozi)
│   │   ├── Classificação de nível de consciência (Schwartz)
│   │   ├── Extração de hooks de vídeos winners (via Max)
│   │   ├── Seleção de gatilho psicológico por ângulo
│   │   ├── Briefing visual (layout + copy + referência)
│   │   ├── Diagnóstico CTR/CPA (problema = ad, LP ou audiência?)
│   │   └── Definição de modo: ugly/organic vs. premium/brand
│   │
│   └── 2. PSYCHOLOGICAL TRIGGERS
│       ├── Mapeamento de gatilhos por ângulo (Cialdini)
│       ├── Pre-Suasion visual (priming emocional)
│       ├── Prova social brasileira (hierarquia de prints)
│       ├── Escassez e urgência visual (real, não falsa)
│       ├── Autoridade (credenciais, números, logos)
│       ├── Identificação ("Você que vende na Shopee...")
│       └── Contraste (antes/depois, dor/resultado)
│
├── TIER 1: DESIGN SYSTEM (Fundação visual)
│   ├── 3. VISUAL DESIGN SYSTEM
│   │   ├── Hierarquia visual (tamanho, peso, cor — Schoger)
│   │   ├── Sistema de espaçamento (escala 4px)
│   │   ├── Paleta de cores HSL (9 tons — Schoger)
│   │   ├── Validação cultural de cores (BR-safe)
│   │   ├── Attention Ratio 1:1 (Oli Gardner)
│   │   ├── Design tokens (consistência entre variações)
│   │   └── Modo ugly vs. premium (2 design systems)
│   │
│   ├── 4. AD LAYOUT COMPOSITION
│   │   ├── 4 layouts por formato (headline-led, image-led, split, data-led)
│   │   ├── Eye-tracking patterns (Z, F, focal)
│   │   ├── Grid 12 colunas com safe zones
│   │   ├── Color zones (background, headline, CTA, proof)
│   │   ├── 7 regras de composição
│   │   ├── Safe zones por plataforma (feed, stories, carrossel)
│   │   └── Anti-patterns (o que NÃO fazer)
│   │
│   └── 5. TYPOGRAPHY & TEXT RENDERING (via Remotion)
│       ├── Escala tipográfica (headline 64-88px, sub 32-40px, proof 28-32px)
│       ├── Fonte: Albert Sans Black (900) — instalada em public/fonts/
│       ├── 3 técnicas de blend: gradient (band escura), shadow (text-shadow pesado), frost (blur)
│       ├── REGRA: Gemini NUNCA renderiza texto. Texto é SEMPRE do Remotion.
│       ├── Validação de acentos PT-BR (garantido — fonte Albert Sans suporta diacríticos)
│       ├── Regras de espaçamento (lineHeight 1.05 headline, letterSpacing -2)
│       ├── 3 compositions: static-ad-square (1080×1080), static-ad-vertical (1080×1350), static-ad-stories (1080×1920)
│       ├── 4 layouts: headline-top, headline-center, data-hero, split
│       └── Batch rendering: render-static-ad.js --batch pack.json
│
├── TIER 2: PRODUÇÃO (Geração e execução)
│   ├── 6. IMAGE GENERATION
│   │   ├── Prompt architecture (8 componentes)
│   │   ├── 6 templates por tipo de ad
│   │   ├── Otimização por modelo (Gemini, Flux, Ideogram, Seedream, Klein)
│   │   ├── Biblioteca de modifiers (mood, foto, design, cor)
│   │   ├── Sistema de variações em 4 níveis
│   │   ├── Fallback chain (Gemini → Flux+overlay → Ideogram → Klein+upscale)
│   │   └── Quality checklist pós-geração (10 itens)
│   │
│   ├── 7. FORMAT MASTERY
│   │   ├── Feed quadrado (1080×1080) — specs e regras
│   │   ├── Feed vertical (1080×1350) — extra storytelling
│   │   ├── Stories/Reels estático (1080×1920) — safe zones
│   │   ├── Carrossel (2-10 cards) — regras de continuidade
│   │   ├── Antes/Depois (split) — contraste visual
│   │   ├── Print de resultado — prova social
│   │   ├── Meme/trend — pattern interrupt
│   │   └── Specs por plataforma Meta (texto, tamanho, resolução)
│   │
│   └── 8. CONVERSION COPYWRITING
│       ├── PAS adaptado pra estático (Joanna Wiebe)
│       ├── PRSA adaptado pra estático (Max DNA)
│       ├── One-Liner Formula (Donald Miller)
│       ├── Voice of Customer (linguagem exata do público)
│       ├── 8 tipos de hook (Stefan Georgi)
│       ├── Copy com mecanismo (RMBC — Georgi)
│       └── 7 Sweeps de revisão (copy-editing)
│
└── TIER 3: QUALIDADE E ESCALA (Validação e produção em massa)
    ├── 9. CREATIVE AUTO-SCORING
    │   ├── 5 dimensões com peso (clarity, hierarchy, readability, match, compliance)
    │   ├── Rubrics detalhados por dimensão (0-100)
    │   ├── Red flags automáticos (-3 a -5 pontos)
    │   ├── Pack report (ranking + budget allocation)
    │   ├── Quick score (3 perguntas, modo rápido)
    │   └── Feedback loop pós-launch (score vs. CTR/CPA real)
    │
    ├── 10. TESTING & OPTIMIZATION
    │   ├── 6 ângulos × 5 hooks = 30 variações (Hormozi)
    │   ├── Budget 70/20/10 (winners/testes/experimental)
    │   ├── Kill rule: CPA 50% acima após 72h → kill
    │   ├── Scale rule: CPA 20% abaixo após 72h → scale
    │   ├── Detecção de fadiga (CPM, CTR, frequência)
    │   ├── Rotação criativa (pipeline de 2-3 semanas)
    │   └── Diagnóstico: problema no ad, LP ou audiência?
    │
    ├── 11. IMAGE PROMPT ENGINEERING
    │   ├── Prompt architecture (subject, action, setting, style, composition, lighting, color, text, negative)
    │   ├── 6 templates por tipo (resultado, dor, before/after, testimonial, lifestyle, método)
    │   ├── Modifiers library (mood, fotografia, design, cor)
    │   ├── Otimização por modelo (Gemini, Flux, Ideogram, Seedream)
    │   ├── Variation system (4 níveis: output, estilo, composição, ângulo)
    │   └── Fallback chain com upscaling
    │
    └── 12. COPY-TO-BRIEFING (Max → Thomas Pipeline)
        ├── 10-component prompt architecture (estilo, sujeito, ação, cenário, composição, iluminação, cor, espaço texto, câmera, qualidade)
        ├── 9 templates por ângulo de copy (dor, resultado, erro, prova social, simplicidade, FOMO, contrarian, dados, UGC)
        ├── Monk Skin Tone Scale (MST 5-7) para pessoas brasileiras realistas
        ├── Mapeamento automático: ângulo → cenário → cor → iluminação → composição
        ├── Geração de props JSON para render-static-ad.js (batch)
        ├── Mapa de composição visual (6 zonas: headline, problema, resultado, imagem, proof, respiro)
        ├── Espaço pra texto OBRIGATÓRIO no prompt (frases-chave que funcionam)
        ├── Checklist de validação (12 itens) antes de gerar imagem
        ├── Integração com Gemini Flash, FLUX.2, Seedream (prompt otimizado por modelo)
        └── Skill file: thomas-copy-to-briefing.md
```

---

## Detalhamento por Skill

### 1. Creative Intelligence

**Nível:** Core
**O que faz:** Decide O QUÊ criar antes de qualquer pixel ser gerado. É o cérebro estratégico que transforma dados de performance e briefings em decisões visuais.

**Sub-skills:**
- Receber input do Max (hooks winners, ângulos validados, copies) e traduzir em briefing visual
- Classificar o público-alvo pelo nível de consciência de Schwartz para adaptar a mensagem
- Mapear ângulos disponíveis usando as 6 categorias de Hormozi (Dor, Resultado, Mecanismo, Identidade, Contrarian, História)
- Selecionar o gatilho psicológico mais adequado para cada ângulo
- Decidir o modo de produção: ugly/organic (cold traffic) vs. premium/brand (retargeting)
- Diagnosticar problemas de performance: criativo, LP ou audiência

**Output:** Briefing visual estruturado:

```
BRIEFING:
- Ângulo: [dor/resultado/mecanismo/identidade/contrarian/história]
- Funil: [TOFU/MOFU/BOFU]
- Formato: [feed square/vertical/stories/carrossel/split]
- Modo: [ugly-organic/premium-brand]
- Headline: [copy do Max ou gerada]
- Prova: [tipo de prova social a usar]
- CTA: [ação desejada]
- Gatilho: [principal gatilho psicológico]
- Referência visual: [swipe file ou template]
```

| Critério de Qualidade | Benchmark |
|---|---|
| Briefing completo (todos os campos) | 100% preenchidos |
| Alinhamento com dados do Max | Ângulo baseado em winner validado |
| Nível de consciência identificado | 1 dos 5 níveis de Schwartz |
| Modo ugly/premium justificado | Baseado em estágio do funil |

---

### 2. Psychological Triggers

**Nível:** Core
**O que faz:** Aplica princípios de psicologia e neurociência em cada decisão visual para maximizar persuasão e conversão.

**Sub-skills:**
- Mapear gatilhos de Cialdini para cada zona do criativo (Pre-Suasion no topo, Social Proof no meio, Scarcity no CTA)
- Aplicar priming visual: a primeira imagem/cor que o usuário vê prepara a emoção para a mensagem
- Selecionar tipo de prova social mais eficaz para público BR (print WhatsApp > depoimento escrito)
- Criar urgência real (sem fake scarcity — compliance Meta)
- Aplicar gaze cueing: rosto olhando para headline/CTA
- Usar especificidade numérica (números exatos > adjetivos vagos)
- Aplicar Von Restorff: criar contraste com o feed padrão do público

**Output:** Mapa de gatilhos por zona do criativo

| Zona do Criativo | Gatilho Primário | Gatilho Secundário | Implementação Visual |
|---|---|---|---|
| Hook (topo) | Pre-Suasion | Von Restorff | Cor/imagem que ativa emoção desejada |
| Valor (meio) | Social Proof | Autoridade | Print de resultado + credencial |
| CTA (base) | Escassez | Compromisso | Urgência visual + botão de alto contraste |

---

### 3. Visual Design System

**Nível:** Core
**O que faz:** Mantém consistência visual entre todos os criativos através de um sistema de design com tokens, escalas e paletas definidas.

**Sub-skills:**
- Gerar paleta HSL com 9 tons por cor (50-900) seguindo sistema Schoger
- Aplicar escala de espaçamento 4px (4, 8, 12, 16, 24, 32, 48, 64px)
- Definir hierarquia visual por tamanho → peso → cor (nessa ordem)
- Manter Attention Ratio 1:1 (1 objetivo por criativo)
- Validar cores contra lista de restrições culturais BR (roxo, verde+amarelo, mostarda)
- Manter dois design systems: "organic" (UGC, casual, imperfeito) e "premium" (limpo, profissional)
- Gerar design tokens exportáveis (CSS, Tailwind)

**Output:** Design tokens do pack

```json
{
  "colors": {
    "primary": "hsl(24, 100%, 50%)",
    "primary-50": "hsl(24, 100%, 95%)",
    "primary-900": "hsl(24, 100%, 15%)",
    "cta": "hsl(24, 100%, 50%)",
    "background": "hsl(0, 0%, 8%)",
    "text-primary": "hsl(0, 0%, 100%)",
    "text-secondary": "hsla(0, 0%, 100%, 0.7)"
  },
  "spacing": {
    "xs": "4px", "sm": "8px", "md": "16px",
    "lg": "24px", "xl": "32px", "2xl": "48px", "3xl": "64px"
  },
  "typography": {
    "headline": { "family": "Montserrat", "weight": 900, "size": "72px" },
    "sub": { "family": "Inter", "weight": 600, "size": "36px" },
    "body": { "family": "Inter", "weight": 400, "size": "28px" },
    "cta": { "family": "Inter", "weight": 700, "size": "32px" }
  },
  "mode": "organic"
}
```

---

### 4. Ad Layout Composition

**Nível:** Core
**O que faz:** Define a estrutura espacial de cada criativo — onde cada elemento vai, como o olho se move, quais zonas são safe/unsafe.

**Sub-skills:**
- Selecionar layout pattern por objetivo (headline-led, image-led, split, data-led)
- Aplicar eye-tracking pattern correto (Z para image-heavy, F para text-heavy, focal para emocional)
- Usar grid de 12 colunas para alinhamento consistente
- Respeitar safe zones por plataforma (stories: top 15% e bottom 20% = unsafe)
- Mapear color zones por função (background, headline, CTA, proof)
- Aplicar as 7 regras de composição (focal point, hierarquia por tamanho, whitespace, contraste, alinhamento, repetição, proximidade)
- Evitar anti-patterns (múltiplos CTAs, text wall, headline minúscula, logo como hero)

**Output:** Layout grid com posicionamento definido

| Elemento | Posição | Tamanho | Zona de Cor |
|---|---|---|---|
| Headline | Top 25%, center | 8-12 cols | Alto contraste |
| Hero image | Center 50% | 12 cols | Neutral/emotional |
| Social proof | Below image | 6-8 cols | Secondary |
| CTA | Bottom center | 6-8 cols | Accent (máx contraste) |

---

### 5. Typography & Text Rendering

**Nível:** Core
**O que faz:** Garante que todo texto no criativo é legível na tela do celular durante scroll rápido, usando o método correto de renderização.

**Sub-skills:**
- Aplicar escala tipográfica: headline 64-88px (weight 900), sub 32-40px (weight 700), proof 28-32px (weight 700)
- Fonte ÚNICA: Albert Sans Black — instalada em public/fonts/ (Regular 400, Bold 700, ExtraBold 800, Black 900)
- REGRA ABSOLUTA: Gemini NUNCA renderiza texto. Texto é SEMPRE renderizado pelo Remotion via render-static-ad.js
- 3 técnicas de blend pra integrar texto com imagem (não parecer "colado"):
  - gradient: banda gradiente escura atrás do texto (default, mais natural)
  - shadow: text-shadow pesado multi-camada (0 2px 4px + 0 4px 12px + 0 8px 24px)
  - frost: frosted glass (backdrop-filter blur 16px + bg semi-transparente)
- Validação de acentos PT-BR: garantida (Albert Sans suporta ç, ã, õ, é, ê, ú, á, â)
- Validar contraste mínimo 4.5:1 (WCAG AA) em todo texto
- 4 layouts disponíveis no template StaticAd.tsx:
  - headline-top: headline no topo com gradient, prova embaixo (default pra cold traffic)
  - headline-center: centralizado com overlay (mensagens curtas e impactantes)
  - data-hero: número grande como hero central (ângulo de resultado)
  - split: antes/depois lado a lado (ângulo de transformação)
- Batch rendering: node render-static-ad.js --batch pack.json (30+ criativos de uma vez)
- Compositions Remotion: static-ad-square (1080×1080), static-ad-vertical (1080×1350), static-ad-stories (1080×1920)

**Output:** Especificação tipográfica do criativo

| Elemento | Fonte | Peso | Tamanho | Cor | Contraste | Método |
|---|---|---|---|---|---|---|
| Headline | Albert Sans | 900 | 64-88px | #FFFFFF | 12:1 ✅ | Remotion (StaticAd.tsx) |
| Sub | Albert Sans | 700 | 32-40px | #FFFFFFe6 | 8:1 ✅ | Remotion (StaticAd.tsx) |
| Proof | Albert Sans | 700 | 28-32px | brandColor | 7:1 ✅ | Remotion (StaticAd.tsx) |

---

### 6. Image Generation

**Nível:** Advanced
**O que faz:** Produz as imagens usando IA generativa, selecionando o modelo ideal para cada tipo de criativo e otimizando os prompts para máxima qualidade.

**Sub-skills:**
- Montar prompt usando a arquitetura de 8 componentes (subject, action, setting, style, composition, lighting, color, text, negative)
- Selecionar modelo por tipo de output:

| Tipo de Criativo | Modelo Primário | Fallback |
|---|---|---|
| Headline bold + texto | Gemini 3.1 Flash | Ideogram |
| Lifestyle/cenário | Seedream 4.5 / Flux Dev | Gemini |
| Estilo custom da marca | Flux Dev LoRA | Seedream |
| Teste rápido (30 vars) | Flux Klein ($0.0001/img) | - |
| Upscale pra qualidade | Topaz Upscaler | - |
| Remover fundo | Background Removal | - |

- Gerar variações em 4 níveis (output, estilo, composição, ângulo)
- Aplicar fallback chain quando resultado é insatisfatório
- Validar cada imagem contra quality checklist (10 itens)
- Usar multi-reference input do Gemini (até 14 imagens de referência)

---

### 7. Format Mastery

**Nível:** Core
**O que faz:** Garante que cada criativo respeita as especificações técnicas e boas práticas do formato/plataforma onde vai rodar.

**Sub-skills:**
- Dominar specs de cada formato:

| Formato | Dimensão | Particularidade |
|---|---|---|
| Feed Square | 1080×1080 | Mais versátil, funciona em tudo |
| Feed Vertical | 1080×1350 | +25% espaço, mais storytelling |
| Stories | 1080×1920 | Safe zone: meio 66% apenas |
| Carrossel | 1080×1080 ×2-10 | Card 1 = tudo, continuidade visual |
| Before/After | 1080×1080 split | Muted left vs. vibrant right |
| Print/Result | 1080×1350 | Screenshot + headline |
| Meme/Trend | 1080×1080 | Pattern interrupt, nativo do feed |

- Aplicar regras específicas de carrossel (numeração, setas, visual continuity, CTA no último card)
- Respeitar regra de texto <20% (não enforced mas afeta delivery)
- Adaptar criativo entre formatos (feed → stories → carrossel)

---

### 8. Conversion Copywriting

**Nível:** Advanced
**O que faz:** Gera e refina o texto que vai dentro dos criativos, usando frameworks de copy de conversão adaptados para espaço visual limitado.

**Sub-skills:**
- Adaptar PRSA para estático: P (headline) → R (prova visual) → S (mecanismo implícito) → A (CTA)
- Aplicar PAS para headlines: Pain (dor) → Agitate (amplificar) → Solve (promessa)
- Usar One-Liner Formula: Problema + Solução + Resultado em 1 frase
- Extrair Voice of Customer da Persona Zape Ecomm (linguagem exata)
- Gerar variações de hook usando 8 tipos de Georgi (contrarian, story, question, data, se/então, segredo, identificação, pattern interrupt)
- Incluir mecanismo em toda copy (RMBC)
- Aplicar 7 Sweeps de revisão antes de finalizar

**Output:** Copy pack por criativo

```
HEADLINE: "De 0 a R$200K em 4 meses com o Método dos 6 Produtos"
SUB: "4.127 alunos já usam. Quando vai ser sua vez?"
CTA: "QUERO COMEÇAR AGORA"
PROOF: "ROAS de 25 — comprovado"
ÂNGULO: Resultado
HOOK TYPE: Data (número específico)
MECANISMO: Método dos 6 Produtos
```

---

### 9. Creative Auto-Scoring

**Nível:** Advanced
**O que faz:** Avalia cada criativo antes de publicar usando 5 dimensões ponderadas, garantindo que apenas criativos com alta probabilidade de conversão recebam budget.

**Sub-skills:**
- Aplicar score de 5 dimensões:

| Dimensão | Peso | Baseado em |
|---|---|---|
| Instant Clarity | 30% | Grunt Test (Donald Miller) |
| Visual Hierarchy | 25% | Sistema visual (Steve Schoger) |
| Text Readability | 20% | WCAG + mobile test |
| Message Match | 15% | Alinhamento ângulo/visual |
| Meta Compliance | 10% | Políticas Meta Ads |

- Identificar red flags automáticos (-3 a -5 pontos por violação)
- Gerar pack report com ranking e recomendação de budget
- Aplicar quick score (3 perguntas) para avaliação rápida de 30+ criativos
- Calibrar scoring baseado em feedback loop (score predito vs. CTR/CPA real)

**Classificação:**

| Score | Classificação | Ação |
|---|---|---|
| 85-100 | Elite | Publicar. 25%+ do budget. |
| 70-84 | Strong | Publicar. Budget padrão. |
| 55-69 | Acceptable | Publicar com budget baixo. Monitorar. |
| 40-54 | Weak | Não publicar. Revisar. |
| 0-39 | Reject | Refazer do zero. |

---

### 10. Testing & Optimization

**Nível:** Advanced
**O que faz:** Gerencia o ciclo de teste, escala e rotação de criativos para manter performance constante e evitar fadiga.

**Sub-skills:**
- Gerar 30 variações por conceito: 6 ângulos × 5 hooks
- Aplicar budget 70/20/10 (winners / testes / experimental)
- Monitorar sinais de fadiga: frequência > 3, CTR declinante, CPM crescente
- Aplicar kill/scale rules: kill se CPA 50% acima após 72h, scale se 20% abaixo
- Manter pipeline de 2-3 semanas de criativos prontos
- Diagnosticar origem do problema: CTR alto + CPA alto = audiência, CTR baixo = criativo, CTR alto + CVR baixo = LP
- Marcar cada criativo como winner/test/experimental para o Léo

**Output:** Test plan

```
CONCEITO: Método dos 6 Produtos
│
├── ÂNGULO 1: Resultado
│   ├── Hook A: "De 0 a R$200K em 4 meses" (Data)
│   ├── Hook B: "ROAS de 25. Todo santo dia." (Data)
│   ├── Hook C: "Meus alunos faturam mais que médicos" (Contrarian)
│   ├── Formato: Feed Square + Vertical + Carrossel
│   └── Modo: Organic (cold traffic)
│
├── ÂNGULO 2: Dor
│   ├── Hook A: "100 produtos e fatura R$60K. Onde tá o erro?" (Question)
│   ├── Hook B: "Gastando com Ads sem retorno?" (Identification)
│   ├── Formato: Feed Square + Split Before/After
│   └── Modo: Organic
│
└── ÂNGULO 3: Mecanismo
    ├── Hook A: "O sistema que gerou R$50M em vendas" (Secret)
    ├── Hook B: "Por que 6 produtos vendem mais que 100" (Contrarian)
    ├── Formato: Carrossel + Feed Vertical
    └── Modo: Organic
```

---

### 11. Image Prompt Engineering

**Nível:** Specialized
**O que faz:** Traduz briefings visuais em prompts otimizados para IA generativa, maximizando qualidade e minimizando iterações.

**Sub-skills:**
- Montar prompts usando arquitetura de 8 componentes
- Usar templates específicos por tipo de ad (6 templates)
- Aplicar modifiers de mood, fotografia, design e cor
- Otimizar prompt por modelo (Gemini prefere texto explícito, Flux prefere linguagem natural)
- Incluir negative prompts para evitar artefatos comuns
- Usar referências visuais (até 14 imagens no Gemini)
- Gerar batch de variações sistemáticas (não aleatórias)
- Aplicar fallback chain quando resultado é insatisfatório

**Output:** Prompt estruturado

```
MODEL: google/gemini-3-1-flash-image-preview
ASPECT: 1:1
RESOLUTION: 2K
NUM_IMAGES: 4

PROMPT: "Brazilian man in his early 30s, casual t-shirt, sitting at desk
with laptop showing Shopee dashboard with green metrics. Genuine smile of
satisfaction. Modern home office, shipping boxes visible. Photorealistic,
authentic UGC feel. Medium shot, subject left third, space at top-right
for text. Soft natural window light, warm earth tones with green accents.
Bold white sans-serif text at top: 'DE ZERO A R$200K'. No stock photo feel,
no artificial lighting, no blurry text, no distorted face."

NEGATIVE: "corporate, staged, stock photo, blurry text, wrong spelling,
extra fingers, artificial pose, overly polished, dark mood"
```

---

## Mapa de Dependências entre Skills

```
Max (input) ──→ [1. Creative Intelligence] ──→ BRIEFING
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   [2. Triggers]  [8. Copy]   [3. Design System]
          │             │             │
          └──────┬──────┘      ┌──────┘
                 ▼             ▼
          [4. Layout] ←── [5. Typography]
                 │
                 ▼
          [11. Prompt Eng.] ──→ [6. Image Gen.] ──→ [7. Format]
                                      │
                                      ▼
                               [9. Auto-Score]
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                        Score ≥ 70      Score < 70
                              │               │
                              ▼               ▼
                       [10. Testing]    Voltar pra [4]
                              │
                              ▼
                      Léo (upload Meta)
```

---

## Skills Externas Integradas

| Skill | Fonte | Integrada em |
|---|---|---|
| ad-creative | skills.sh (coreyhaines31) | Skill 1 (intelligence) + Skill 7 (formats) |
| marketing-psychology | skills.sh (coreyhaines31) | Skill 2 (triggers) |
| copywriting | skills.sh (coreyhaines31) | Skill 8 (copy) |
| copy-editing | skills.sh (coreyhaines31) | Skill 8 (copy — 7 Sweeps) |
| ai-image-generation | skills.sh (inferen-sh) | Skill 6 (image gen) |
| skill-persona-zape-ecomm | local (zapeads squad) | Skill 1 (intelligence) + Skill 8 (copy) |

---

## KPIs do Thomas

| Métrica | O que mede | Target |
|---|---|---|
| Score médio dos packs | Qualidade geral | ≥ 75/100 |
| % de criativos Elite (85+) | Taxa de excelência | ≥ 20% do pack |
| % de criativos Reject (<40) | Taxa de desperdício | ≤ 5% do pack |
| Variações por conceito | Velocidade criativa | ≥ 15 por conceito |
| Tempo do pipeline | Cobertura futura | ≥ 2 semanas de criativos prontos |
| Score predito vs. CTR real | Calibração do scoring | Correlação ≥ 0.7 |
| CTR dos criativos do Thomas | Performance real | ≥ 1.0% (target 1.5%+) |
