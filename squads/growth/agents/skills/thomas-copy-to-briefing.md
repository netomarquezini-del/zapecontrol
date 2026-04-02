# Skill: Copy-to-Briefing — Thomas Design

> Transforma copies do Max em briefings visuais completos: prompt de imagem IA + props de texto + mapeamento de composição.
> Pipeline: **Max (copy) → Thomas copy-to-briefing (prompt + props) → Gemini/Flux (imagem) → Remotion (PNG final)**

---

## Quando Usar

- Quando o Max entrega um JSON de copies estáticas (`estaticos-v1-input.json`)
- Quando precisa gerar prompts de imagem para Gemini/Flux/Seedream
- Quando precisa montar o `batch-props.json` pro `render-static-ad.js`
- Quando precisa garantir que texto e imagem vão se encaixar perfeitamente

---

## Input Esperado

JSON do Max com estrutura:
```json
{
  "ad_ref": "AD110 | Vídeo | Shopee Ads",
  "statics": [
    {
      "number": 1,
      "angle": "Dor do gasto sem retorno",
      "hook_type": "dor_direta",
      "headline": "VOCÊ TÁ PAGANDO PRA PERDER DINHEIRO NA SHOPEE",
      "problema": "Você coloca R$100, R$200 em ADS e o retorno não aparece...",
      "resultado_solucao": "Nossos alunos alcançam ROAS de 25 com 4 configurações...",
      "proof": "+4.000 alunos já aplicaram",
      "body_text": "...",
      "suggested_layout": "headline-top",
      "suggested_blend": "gradient"
    }
  ]
}
```

---

## Output Gerado

Para CADA copy estática, gerar um briefing completo com 3 seções:

### 1. PROMPT DE IMAGEM (para Gemini/Flux)
### 2. PROPS JSON (para render-static-ad.js)
### 3. MAPA DE COMPOSIÇÃO (onde cada texto vai)

---

## Arquitetura do Prompt de Imagem — 10 Componentes

Todo prompt de imagem DEVE conter estes 10 componentes, nesta ordem:

```
[1. ESTILO] + [2. SUJEITO] + [3. AÇÃO/POSE] + [4. CENÁRIO] + [5. COMPOSIÇÃO] + [6. ILUMINAÇÃO] + [7. COR DOMINANTE] + [8. ESPAÇO PRA TEXTO] + [9. CÂMERA] + [10. QUALIDADE]
```

### Componente 1: ESTILO
Define a estética geral da imagem.

| Modo | Quando Usar | Prompt |
|------|-------------|--------|
| **Fotorrealista** | Default para ads de conversão | `"Professional commercial photography, photorealistic"` |
| **UGC/Ugly** | Cold traffic, low-ticket | `"Candid iPhone photo, authentic, casual, not staged"` |
| **Editorial** | Autoridade, premium | `"Editorial photography, magazine quality, refined"` |
| **Screenshot** | Prova social, resultado | `"Realistic smartphone screenshot, UI elements"` |
| **Minimal/Texto** | Mensagem direta, FOMO | `"Solid dark background, clean minimal composition"` |

### Componente 2: SUJEITO
Quem ou o que aparece na imagem.

**Para pessoas brasileiras (OBRIGATÓRIO usar Monk Skin Tone Scale):**
```
Brazilian [man/woman], age [25-40], skin tone: [anchor] (MST [#]), [undertone] undertone,
[hair description], [expression], wearing [clothing]
```

**Tabela MST para público Zape (sellers de Shopee):**

| MST | Anchor | Undertone | Descrição |
|-----|--------|-----------|-----------|
| 5 | Honey | Warm golden | Misturado, muito comum no BR |
| 6 | Caramel | Warm golden | Tom mais comum do BR |
| 7 | Bronze | Warm golden | Tom mais escuro, comum |

**Regras de sujeito:**
- NUNCA usar "Latino" ou "Hispanic" como atalho — descrever features concretas
- Sempre descrever textura do cabelo: coily, curly, wavy, straight
- Expressão deve combinar com o ângulo da copy (frustrado pra dor, confiante pra resultado)
- Roupa casual/realista — camiseta, home office, nada de terno
- SEMPRE adicionar: `"100% photorealistic, natural skin texture with pores, not AI-looking"`

**Para produto/cenário (sem pessoa):**
```
[Elemento visual principal]: laptop com dashboard, smartphone com Shopee,
pacotes de e-commerce, home office desk
```

### Componente 3: AÇÃO/POSE
O que o sujeito está fazendo.

| Ângulo da Copy | Ação/Pose |
|----------------|-----------|
| Dor/Frustração | `"looking frustrated at laptop screen, head in hands"` |
| Resultado | `"smiling confidently, showing phone screen with results"` |
| Prova social | `"surrounded by product boxes, celebrating"` |
| Simplicidade | `"casually tapping on smartphone, relaxed"` |
| Erro comum | `"confused expression, looking at complex screen"` |
| FOMO | `"turning away, looking over shoulder at viewer"` |
| Contrarian | `"arms crossed, confident smirk, challenging"` |

**Regra de olhar (Gaze Cueing — Thomas DNA Layer 1):**
- Pessoa SEMPRE olha na direção do headline ou do espaço reservado pro texto
- NUNCA olha direto pra câmera (exceto formato UGC/selfie)
- Olhar guia o viewer pro texto → texto guia pro CTA

### Componente 4: CENÁRIO
Onde a cena acontece.

| Ângulo da Copy | Cenário |
|----------------|---------|
| Dor/Frustração | `"dimly lit home office, cluttered desk, late night"` |
| Resultado | `"bright modern home office, clean desk, natural sunlight"` |
| Prova social | `"warehouse with product boxes, or living room celebrating"` |
| Simplicidade | `"clean minimal desk, warm ambient lighting"` |
| Lifestyle | `"Brazilian apartment balcony, morning light, coffee"` |

**Regra:** cenário SEMPRE contextual ao público (seller de Shopee, home office, pacotes). NUNCA cenário genérico corporativo.

### Componente 5: COMPOSIÇÃO
Posicionamento dos elementos na imagem.

| Layout (do Max) | Composição no Prompt |
|-----------------|---------------------|
| **headline-top** | `"Subject positioned in lower 60% of frame. Upper 40% has clean open space with smooth dark gradient for text overlay. Rule of thirds, subject on right third."` |
| **headline-center** | `"Subject slightly blurred in background. Center of frame has clean area with dark overlay space for centered text. Shallow depth of field."` |
| **data-hero** | `"Clean minimal background, large empty center area for big number display. Subject small or absent. Gradient background dark to darker."` |
| **split** | `"Split composition — left side shows [before/problem], right side shows [after/result]. Clear visual division. Both sides have small text area at top."` |

**Regra crítica:** o prompt DEVE instruir onde o espaço pra texto fica. Frases que funcionam:
- `"large clean empty area at [top/center] for text overlay"`
- `"smooth gradient background suitable for bold typography"`
- `"advertising layout with designated copy space"`
- `"negative space on [upper portion] for headline placement"`
- `"banner-style composition with headline area at top, clean and unobstructed"`

### Componente 6: ILUMINAÇÃO
Define o mood da imagem.

| Ângulo da Copy | Iluminação |
|----------------|------------|
| Dor/Frustração | `"harsh overhead fluorescent, cold blue-white, unflattering shadows"` |
| Resultado | `"warm golden hour sunlight, soft window light, optimistic"` |
| Prova social | `"bright natural daylight, warm and inviting"` |
| Urgência/FOMO | `"dramatic side lighting, high contrast, moody"` |
| Simplicidade | `"soft diffused natural light, clean and even"` |
| Contrarian | `"bold dramatic lighting, strong shadows, cinematic"` |

### Componente 7: COR DOMINANTE
Cor emocional da imagem (NÃO cor da marca — regra do Thomas DNA).

| Ângulo da Copy | Cor Dominante | Hex | Motivo |
|----------------|---------------|-----|--------|
| Dor/Frustração | Vermelho/escuro | `#991B1B` | Urgência, perda, dor |
| Resultado | Verde/dourado | `#15803D` | Dinheiro, crescimento, sucesso |
| Prova social | Azul quente | `#1E40AF` | Confiança, comunidade |
| Urgência/FOMO | Laranja/vermelho | `#C2410C` | Ação imediata |
| Simplicidade | Cinza neutro | `#404040` | Clareza, foco |
| Contrarian | Roxo escuro | `#581C87` | Quebra de padrão, diferente |
| Erro comum | Âmbar/warning | `#B45309` | Alerta, atenção |

**Regra:** a cor dominante é do FUNDO/MOOD. O texto do Remotion sempre usa branco + verde lima (#A3E635) do sistema Zape.

### Componente 8: TEXTO NA IMAGEM (CRÍTICO — Gemini gera tudo)
Instrução ULTRA-EXPLÍCITA de cada texto, posição, tamanho, cor e fonte.

**Regra de ouro:** ser LITERAL. A IA não interpreta — ela segue instruções. Quanto mais específico, melhor o resultado.

**Regras de instrução de texto pro Gemini:**
- Colocar cada texto entre aspas duplas: `the text "EXATAMENTE ISSO"`
- Especificar posição: `at the top`, `centered`, `bottom left`
- Especificar tamanho relativo: `very large bold text`, `medium text`, `small text`
- Especificar cor: `in white color`, `in lime green (#A3E635)`
- Especificar estilo: `bold uppercase sans-serif`, `regular weight`
- NUNCA pedir fonte específica (Gemini não garante) — pedir estilo: `modern bold sans-serif`

**Template de instrução de texto por layout:**

**headline-top (default):**
```
The image has a dark gradient area at the top 40%.
In this dark area, render the following text elements from top to bottom:

1. HEADLINE: The text "[HEADLINE AQUI]" in very large, bold, uppercase,
   white sans-serif font. Positioned at the top center of the image.
   This is the biggest and most prominent text.

2. PROBLEMA: Below the headline, the text "[PROBLEMA AQUI]" in medium,
   regular weight, light gray (#D4D4D4) sans-serif font. Left-aligned
   with comfortable margins.

3. RESULTADO: Below the problema, the text "[RESULTADO_SOLUCAO AQUI]"
   in medium, bold, lime green (#A3E635) sans-serif font. This text
   should stand out from the problema text.

4. PROOF: At the bottom of the text area, a thin horizontal line, then
   the text "[PROOF AQUI]" in small bold lime green (#A3E635) font.

The subject/scene occupies the lower 60% of the image below the text.
```

**headline-center:**
```
Full-bleed image with dark semi-transparent overlay across the entire frame.
All text centered vertically and horizontally:

1. HEADLINE: "[HEADLINE AQUI]" in very large bold uppercase white
   sans-serif, centered.
2. PROBLEMA: "[PROBLEMA AQUI]" below, medium light gray, centered.
3. RESULTADO: "[RESULTADO_SOLUCAO AQUI]" below, medium bold lime
   green (#A3E635), centered.
4. PROOF: "[PROOF AQUI]" at bottom, small bold lime green.

Subject visible through the dark overlay, slightly blurred.
```

**data-hero:**
```
Dark minimal background. Large prominent number/statistic as hero element:

1. HEADLINE: "[HEADLINE COM NÚMERO]" in VERY LARGE bold uppercase white
   sans-serif, centered in the upper third. The number should be the
   biggest visual element.
2. RESULTADO: "[RESULTADO_SOLUCAO]" below in medium bold lime green
   (#A3E635), centered.
3. PROOF: "[PROOF]" at bottom, small bold lime green.

Minimal or no photographic subject — the number IS the hero.
```

### Componente 9: CÂMERA
Referência técnica para fotorrealismo.

**Default (Fotorrealista):**
```
Shot on Sony A7IV, 35mm lens, f/2.8, shallow depth of field, high dynamic
range, clean sharp focus on subject
```

**UGC/Ugly:**
```
Shot on iPhone 14 Pro, natural handheld, slight motion, authentic mobile
photography, no post-processing
```

**Editorial:**
```
Shot on Canon 5D Mark IV, 50mm lens, f/1.8, beautiful bokeh, studio
lighting, magazine-quality
```

**Produto/Screenshot:**
```
Flat lay photography, shot from above, even studio lighting, clean white
or dark surface, product centered
```

### Componente 10: QUALIDADE
Modificadores finais de qualidade.

**Sempre incluir:**
```
8K resolution, professional photography, photorealistic, natural colors,
not AI-generated looking, authentic and warm, high detail
```

**Pra FLUX.2 (sem negative prompts — usar frases positivas):**
```
Clean image, professional quality, pristine, sharp focus, crisp details,
natural proportions, anatomically correct, consistent lighting
```

**Pra Gemini (negative prompts suportados):**
```
Negative: blurred, deformed, extra fingers, plastic skin, stock photo,
clipart, cartoon, illustration, watermark, text, typography, lettering,
oversaturated, uncanny valley, mannequin
```

---

## Mapeamento de Ângulo → Prompt Template

### Template 1: DOR (Frustração/Problema)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian man, age 32, skin tone: caramel (MST 6), warm golden undertone, short dark wavy hair, frustrated expression, wearing casual gray t-shirt. Looking stressed at laptop screen, head slightly tilted, one hand on forehead. Dimly lit home office, cluttered desk with product boxes, late night, cold blue-white monitor glow on face. Subject in the lower 55% of the frame.

LIGHTING: Harsh overhead fluorescent mixed with monitor light, unflattering shadows, moody. Dark reds and blues undertone, sense of financial stress.

CAMERA: Shot on Sony A7IV, 35mm lens, f/2.8, shallow depth of field.

TEXT OVERLAY — The upper 45% of the image has a solid dark gradient background (#0A0A0A fading into the scene). Render these text elements on the dark area, top to bottom:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif font, centered at the top. This is the most prominent element.
2. Below it, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4) sans-serif font.
3. Below it, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635) sans-serif font.
4. Below it, a thin line, then the text "{PROOF}" in small bold lime green (#A3E635) font.

All text must be perfectly spelled, legible, and properly accented in Portuguese. 8K resolution, photorealistic, natural skin texture with pores, not AI-generated looking.
```

### Template 2: RESULTADO (Sucesso/Conquista)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian woman, age 28, skin tone: honey (MST 5), warm golden undertone, dark curly hair past shoulders, confident radiant smile. Holding smartphone showing sales dashboard, other hand raised in celebration. Bright modern home office, clean desk, morning golden sunlight through window. Subject in lower right 55% of frame.

LIGHTING: Warm golden hour sunlight, soft and optimistic. Greens and golds undertone, success.

CAMERA: Shot on Sony A7IV, 50mm lens, f/2.0, beautiful bokeh.

TEXT OVERLAY — The upper 45% has a smooth warm-to-dark gradient. Render these text elements on the dark area:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, centered at top.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4) sans-serif.
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635) sans-serif.
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, legible, proper Portuguese accents. 8K, photorealistic, authentic.
```

### Template 3: ERRO COMUM (Alerta/Educativo)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian man, age 35, skin tone: bronze (MST 7), warm golden undertone, short dark hair, confused concerned expression. Staring at laptop showing complex settings, fingers hovering over keyboard. Home office with scattered notes and empty coffee cup. Subject in lower 55%.

LIGHTING: Soft diffused overhead mixed with screen glow, amber warning mood (#B45309).

CAMERA: Shot on Sony A7IV, 35mm lens, f/2.8.

TEXT OVERLAY — Upper 45% dark gradient area. Render:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, centered top.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4).
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents correct. 8K, photorealistic, authentic.
```

### Template 4: PROVA SOCIAL (Comunidade/Resultados)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Group of 3 diverse Brazilian people (man MST 6, woman MST 5, man MST 7), ages 25-38, all smiling looking at a phone screen one holds showing results. Casual clothing, relaxed, natural interaction. Modern living room, warm ambient, product boxes in background. Group in lower 55%.

LIGHTING: Bright natural daylight, warm and inviting. Blues undertone (#1E40AF), community.

CAMERA: Shot on Sony A7IV, 35mm lens, f/2.8.

TEXT OVERLAY — Upper 45% dark gradient. Render:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, centered.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4).
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents. 8K, photorealistic, authentic group, not stock photo.
```

### Template 5: SIMPLICIDADE (Fácil/Acessível)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian woman, age 30, skin tone: caramel (MST 6), warm golden undertone, straight dark hair in ponytail, relaxed calm smile. Casually tapping smartphone on couch, laptop nearby. Clean minimal living room, neutral tones. Subject in lower right 55%.

LIGHTING: Soft diffused natural window light, peaceful. Neutral grays (#404040), clarity.

CAMERA: Shot on Sony A7IV, 50mm lens, f/2.0.

TEXT OVERLAY — Upper 45% soft neutral-to-dark gradient. Render:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, centered.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4).
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents. 8K, photorealistic, authentic.
```

### Template 6: FOMO/URGÊNCIA (Medo de ficar pra trás)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian man, age 33, skin tone: honey (MST 5), warm golden undertone, short dark hair, serious determined expression, looking over shoulder at viewer. Standing in front of wall of shipping boxes, arms crossed. Subject on right 55%.

LIGHTING: Dramatic side lighting, bold shadows, high contrast, cinematic. Orange (#C2410C), urgency.

CAMERA: Shot on Sony A7IV, 35mm lens, f/2.8, high contrast.

TEXT OVERLAY — Left 45% and upper area has dark dramatic gradient. Render:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, top area.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4).
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents. 8K, photorealistic, cinematic.
```

### Template 7: CONTRARIAN (Desafiar crença)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Brazilian man, age 36, skin tone: bronze (MST 7), warm golden undertone, short dark curly hair, confident challenging expression, arms crossed, slight head tilt. Modern space, YouTube play icons faintly visible on wall (out of focus). Subject in right 55%.

LIGHTING: Bold dramatic side key light, deep shadows, powerful. Purple-black (#581C87), pattern break.

CAMERA: Shot on Canon 5D Mark IV, 50mm lens, f/1.8.

TEXT OVERLAY — Upper left 45% dark dramatic gradient. Render:

1. The text "{HEADLINE}" in very large bold uppercase white sans-serif, top area.
2. Below, the text "{PROBLEMA}" in medium regular light gray (#D4D4D4).
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents. 8K, photorealistic, cinematic, powerful.
```

### Template 8: CALCULADORA/DADOS (Resultado numérico)
```
Professional commercial photography for a social media ad, photorealistic, 1080x1080 pixels.

SCENE: Clean minimal dark background (#0A0A0A). Close-up of hands holding smartphone showing e-commerce dashboard with green profit numbers. Skin tone: caramel (MST 6). Dramatic spotlight on phone, rest falls to darkness. Hands and phone in lower 45%.

LIGHTING: Dramatic spotlight, dark with green accents (#15803D), data mood.

CAMERA: Shot on Sony A7IV, macro lens, tight crop.

TEXT OVERLAY — Upper 55% is solid dark space. Render:

1. The text "{HEADLINE}" in VERY LARGE bold uppercase white sans-serif, centered. The number in the headline should be the biggest visual element.
2. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
3. Below, the text "{PROOF}" in small bold lime green (#A3E635).

All text perfectly spelled, Portuguese accents. 8K, photorealistic, sharp focus on screen.
```

### Template 9: UGC/UGLY (Orgânico/Nativo)
```
Candid iPhone photo for social media, authentic, casual, NOT staged, 1080x1080 pixels.

SCENE: Brazilian [man/woman], age [28-35], skin tone: [honey/caramel] (MST [5/6]), warm golden undertone, natural appearance, genuine expression. [Selfie-style or casual desk shot]. Real home environment, natural mess, warm lamp light.

LIGHTING: Natural available light, warm, casual. NOT professional, NOT studio.

CAMERA: Shot on iPhone 14 Pro, natural handheld, slight motion, no post-processing.

TEXT OVERLAY — Upper 35% relatively clean area. Render in a casual, slightly rough style (not perfectly aligned — feels organic):

1. The text "{HEADLINE}" in large bold uppercase white font, top area. Slightly informal alignment.
2. Below, the text "{PROBLEMA}" in medium light gray.
3. Below, the text "{RESULTADO_SOLUCAO}" in medium bold lime green (#A3E635).
4. Below, the text "{PROOF}" in small bold lime green.

Text should look like it was added with a phone app, not professionally designed. Portuguese accents correct. Authentic and relatable.
```

---

## Output: Prompt Final Montado

Para cada copy estática, o output é um prompt completo pronto pra enviar pro Gemini:

```json
{
  "copy_number": 1,
  "angle": "Dor do gasto sem retorno",
  "prompt": "[template completo com {HEADLINE}, {PROBLEMA}, {RESULTADO_SOLUCAO}, {PROOF} substituídos pelos textos reais da copy]",
  "model": "gemini-2.5-flash-image",
  "aspect_ratio": "1:1",
  "dimensions": "1080x1080",
  "body_text": "[body text do Meta — NÃO vai na imagem]"
}
```

**Regra de aspecto:**
- Default: `1:1` (1080×1080) — melhor pra feed
- Se headline muito longo (>10 palavras): usar `4:5` (1080×1350) — mais espaço
- Se Stories: `9:16` (1080×1920)

---

## Mapa de Composição Visual

Para cada criativo, documentar:

```
┌─────────────────────────────┐
│   HEADLINE (64-88px)        │  ← Zona 1: Upper 15%
│   Albert Sans Black 900     │     Branco #FFFFFF
│   uppercase, letterSpacing -2│
├─────────────────────────────┤
│   PROBLEMA (28-32px)        │  ← Zona 2: 15-30%
│   Albert Sans Regular 400   │     Cinza claro #D4D4D4
│   sentence case             │
├─────────────────────────────┤
│   RESULTADO_SOLUCAO (28-32px)│ ← Zona 3: 30-45%
│   Albert Sans Bold 700      │     Verde lima #A3E635
│   sentence case              │
├─────────────────────────────┤
│                              │
│   [IMAGEM PRINCIPAL]         │  ← Zona 4: 45-85%
│   Gerada pelo Gemini/Flux    │     Sujeito + cenário
│                              │
├─────────────────────────────┤
│   PROOF (24-28px)            │  ← Zona 5: 85-92%
│   Albert Sans Bold 700       │     Verde lima #A3E635
│   Borda superior sutil       │
├─────────────────────────────┤
│   [gradient fade to black]   │  ← Zona 6: 92-100%
│                              │     Respiro visual
└─────────────────────────────┘
```

**Variação por layout:**

- **headline-top**: Texto nas zonas 1-3 (topo), imagem nas zonas 4-6 (baixo). DEFAULT.
- **headline-center**: Imagem full-bleed com overlay escuro. Texto centralizado verticalmente.
- **data-hero**: Número gigante (ex: "ROAS 25") no centro, prova embaixo, fundo clean.
- **split**: Dividido ao meio. Esquerda = antes/problema. Direita = depois/resultado.

---

## Checklist de Validação (por briefing)

Antes de enviar pra geração:

- [ ] Prompt tem todos os 10 componentes?
- [ ] Espaço pro texto está explicitamente descrito no prompt?
- [ ] Sujeito usa MST Scale (não genérico)?
- [ ] Cenário é contextual (seller, home office, Shopee)?
- [ ] Cor dominante combina com ângulo da copy?
- [ ] Iluminação combina com mood da copy?
- [ ] Props JSON tem todos os campos?
- [ ] Headline cabe no layout (< 60 caracteres pra square)?
- [ ] Zero inglês no prompt visível (termos técnicos OK)?
- [ ] Negative prompt incluído (se modelo suporta)?
- [ ] Texto usa "ADS" e nunca "anúncio"?
- [ ] Câmera descrita pra fotorrealismo?

---

## Workflow de Execução (Pipeline Direto — Sem Remotion)

```
1. Thomas recebe JSON do Max (estaticos-v1-input.json)
   │
2. Para cada copy estática:
   │
   ├── 2a. Classificar ângulo → selecionar template de prompt (1-9)
   │
   ├── 2b. Substituir placeholders pelos textos reais:
   │       {HEADLINE} → headline da copy
   │       {PROBLEMA} → problema da copy
   │       {RESULTADO_SOLUCAO} → resultado_solucao da copy
   │       {PROOF} → proof da copy
   │
   ├── 2c. Adaptar template com dados específicos:
   │       - Expressão do sujeito baseada no ângulo
   │       - Cenário baseado na dor/resultado
   │       - Cor dominante baseada na emoção
   │
   └── 2d. Gerar prompt final completo (pronto pro Gemini)
   │
3. Salvar output como batch-prompts.json:
   {
     "prompts": [
       {
         "copy_number": 1,
         "angle": "Dor do gasto sem retorno",
         "prompt": "[prompt completo com textos reais substituídos]",
         "model": "gemini-2.5-flash-image",
         "aspect_ratio": "1:1",
         "body_text": "[body text Meta — NÃO vai na imagem]",
         "ad_ref": "AD110 | Vídeo | Shopee Ads"
       }
     ]
   }
   │
4. Enviar cada prompt pro Gemini → receber imagem COMPLETA (com texto)
   │
5. Salvar PNGs em /criativos/novos/thomas/
   │
6. Review visual — checar se textos saíram corretos
   │
7. Imagens aprovadas → prontas pro Léo subir na Meta
```

**Script de execução:**
```
node thomas-static-pipeline.js --input estaticos-v1-input.json

# O que faz:
# 1. Lê JSON do Max
# 2. Monta 70 prompts (copy-to-briefing)
# 3. Chama Gemini pra cada um
# 4. Salva 70 PNGs em /criativos/novos/thomas/
# 5. Gera relatório com thumbnails pra review
```

---

## Regras Fixas

1. **Gemini gera imagem COMPLETA com texto** — uma etapa só, sem Remotion
2. **Prompt DEVE especificar cada texto, posição, tamanho e cor** — ser ultra-explícito pra IA acertar
3. **Pessoas 100% fotorrealistas** — NUNCA AI-looking, NUNCA stock photo
4. **Zero inglês no criativo final** — termos técnicos no prompt OK, mas nada visível pro viewer
5. **Cor = emoção, NÃO marca** — fundo/mood segue emoção do ângulo, texto segue sistema Zape (branco + verde)
6. **Texto NUNCA sobre elementos importantes** — sempre sobre área limpa/gradient
7. **Mobile-first** — font mínima 28px, headline mínimo 64px no canvas 1080px
8. **"ADS" nunca "anúncio"** — em TUDO: prompts, props, textos, briefings
9. **Review obrigatório** — como a IA pode errar acentos/texto, todo criativo passa por review visual antes de subir
