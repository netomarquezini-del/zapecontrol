# Skills — Maicon (Video Creator)

## Skill Tree

```
VIDEO CREATOR (Maicon)
├── 1. ROTEIRIZAÇÃO PARA RETENÇÃO
│   ├── Roteiro PRSA com timeline de cortes (marcação de corte/zoom/texto a cada 2-3s)
│   ├── Marcação de pattern interrupts a cada 3s (tipo: visual, auditivo, semântico)
│   ├── Definição de pacing curve (rápido→médio→rápido) baseado na energy wave
│   ├── Integração com padrões vencedores do Max (recebe dados de winners)
│   ├── Variação em massa (10-50 roteiros de uma vez usando concept engine)
│   ├── Seleção de storytelling structure (7 formatos)
│   ├── Geração de hooks duais (visual + verbal) usando 7 categorias Jake Thomas
│   └── RMBC compliance (mecanismo obrigatório em todo roteiro)
│
├── 2. GERAÇÃO DE VOZ IA
│   ├── Narração PT-BR natural (eleven_v3 para qualidade, flash para volume)
│   ├── Controle de tom por segmento (hook=energético, explicação=calmo, CTA=urgente)
│   ├── Sincronização de pausas com cortes visuais
│   ├── Clonagem de voz (IVC: 1-2min, PVC: 30min+)
│   ├── Múltiplas vozes por vídeo (diálogo simulado, fake podcast)
│   ├── Word-level timestamps via convertWithTimestamps (karaoke captions)
│   ├── Batch generation com p-limit (5 concurrent no Creator plan)
│   └── Cache de narrações para variações de vídeo
│
├── 3. GERAÇÃO DE IMAGENS
│   ├── Produto em contexto (lifestyle, uso real) via gpt-image-1
│   ├── Antes/Depois (transformações visuais consistentes)
│   ├── Screenshots estilizados (dashboard, resultados)
│   ├── Thumbnails com alto contraste e texto bold
│   ├── Cenários e backgrounds temáticos
│   ├── B-roll search via Pexels (orientation: portrait, size: large)
│   ├── Batch generation (Flux Schnell $0.003/img para volume)
│   ├── Visual consistency via shared style descriptors
│   └── Prompt templates por formato (UGC, Before/After, Product, Social Proof, Problem/Solution)
│
├── 4. MOTION & ANIMAÇÃO
│   ├── Texto animado (pop-in, slide-in, typewriter, karaoke, shake, neon, 3D, glitch, scramble)
│   ├── Punch-in zoom Hormozi-style (10-15%) via spring()
│   ├── Ken Burns em imagens estáticas (zoom-in, zoom-out, pan, multi-point)
│   ├── Speed ramp (câmera lenta → rápido) via interpolate()
│   ├── Glitch transitions (0.2-0.5s, RGB split + slice displacement)
│   ├── Shake/bounce para ênfase (sin wave, 3-5px intensity)
│   ├── Progresso visual (barras, timers, countdowns)
│   ├── Particle effects (confetti, sparkles via canvas-confetti)
│   ├── Lower thirds animados (name/title overlays)
│   ├── Counter/number animations (revenue, students, ROAS)
│   ├── Background motion (animated gradients, floating shapes, bokeh)
│   ├── Film grain + vignette overlay (cinematic feel)
│   └── Light leaks e lens flares (warm, 20-30% opacity)
│
├── 5. COMPOSIÇÃO DE VÍDEO
│   ├── Templates por formato (UGC, Antes/Depois, Hormozi, Slideshow, Problema→Solução, etc.)
│   ├── Safe zones por plataforma (Meta, TikTok, Reels, YouTube Shorts)
│   ├── Formatos: 9:16 (1080x1920), 1:1 (1080x1080), 4:5 (1080x1350)
│   ├── Color grading por seção (warm hook → cool problem → bright demo → urgent CTA)
│   ├── Layering: background → image/video → gradient → text → captions → logo
│   ├── Audio ducking (música baixa quando voz presente)
│   └── TransitionSeries para transições entre cenas
│
├── 6. SOUND DESIGN
│   ├── Música de fundo por energia (60-150 BPM por tipo)
│   ├── SFX library (whoosh, pop, cha-ching, record scratch, boom, click)
│   ├── Beat-sync (cortes alinhados ao ritmo)
│   ├── Notification sound no hook (iPhone ding trick)
│   ├── 3-layer design: Voz → SFX → Music
│   ├── Audio ducking automático (-6dB quando voz presente)
│   ├── Phone speaker optimization (high-pass 150Hz, mid boost 2-4kHz)
│   └── Normalização LUFS (target -14 LUFS)
│
├── 7. PRODUÇÃO EM MASSA
│   ├── Batch rendering (10-50 vídeos em paralelo via Remotion Lambda ou local)
│   ├── Variação automática (hooks diferentes / visuais diferentes / CTAs diferentes)
│   ├── Frankensteining (hook A + body B + CTA C)
│   ├── A/B de elementos (mesma narração com visuais diferentes, ou inverso)
│   ├── Fila de produção com prioridade (P0, P1, P2)
│   ├── Concept engine (6 ângulos × 5 formatos × 10 hooks = 300 combinações)
│   ├── Naming convention: {date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4
│   └── Lineage tracking (cada criativo liga ao parent concept)
│
├── 8. CONTROLE DE QUALIDADE
│   ├── Hook nos primeiros 1.7s (algo novo no primeiro frame)
│   ├── Corte a cada 2-4s (contagem de scene changes)
│   ├── Texto legível (48px+ mobile)
│   ├── CTA claro nos últimos 5s
│   ├── Safe zones respeitadas
│   ├── Áudio normalizado (-14 LUFS)
│   ├── Resolução correta (1080x1920 ou 1080x1080)
│   ├── Duração 15-60s
│   ├── Sem frames pretos
│   ├── Funciona sem som (captions/text present)
│   ├── 12 Pillars score (Dara Denney checklist)
│   └── Meta policy compliance (Policy KB check)
│
└── 9. OUTPUT & DISTRIBUIÇÃO
    ├── MP4 otimizado (H.264, CRF 23, -movflags +faststart)
    ├── Bitrate: 5M balanced, 8M high quality
    ├── Thumbnail automática (frame com maior entropia visual)
    ├── Metadata tracking (script_id, voice_id, music_track, template_id, images_used)
    ├── Upload para Supabase Storage
    ├── Notificação Telegram com preview (video + metadata + QA score)
    ├── Naming: {date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4
    └── Multi-format render: same content → 9:16 + 1:1 + 4:5
```

---

## Detalhamento por Skill

### 1. Roteirização para Retenção
**Nível:** Core
**O que faz:** Gera roteiros otimizados para retenção máxima com timeline de cortes segundo-a-segundo.

**Sub-skills:**
- Roteiro PRSA com timeline de cortes (marcação de corte/zoom/texto a cada 2-3s)
- Marcação de pattern interrupts a cada 3s (tipo: visual, auditivo, semântico)
- Definição de pacing curve (rápido→médio→rápido) baseado na energy wave
- Integração com padrões vencedores do Max (recebe dados de winners)
- Variação em massa (10-50 roteiros de uma vez usando concept engine)
- Seleção de storytelling structure (7 formatos: Hero's Journey 60s, 3-Act 30s, In Medias Res, etc.)
- Geração de hooks duais (visual + verbal) usando 7 categorias de Jake Thomas
- RMBC compliance (mecanismo obrigatório em todo roteiro)

**Output:** JSON com `{scenes[], hooks[], transitions[], timing[], captionMarkers[]}`

**Métricas de qualidade:**
| Check | Critério |
|---|---|
| Hook em <1.7s | Primeiro frame tem face/motion/contraste |
| Pattern interrupt | Mínimo 1 a cada 3s |
| Cortes | Mínimo 1 a cada 2-4s |
| CTA | Presente nos últimos 5s |
| Mecanismo | Presente no corpo |
| Funciona sem som | Texto/caption carrega a mensagem |

**Storytelling Structures:**
| Formato | Duração ideal | Estrutura |
|---|---|---|
| Hero's Journey | 60s | Hook → Problema → Jornada → Transformação → CTA |
| 3-Act | 30s | Setup → Confronto → Resolução |
| In Medias Res | 30-45s | Resultado → Flashback → Como → CTA |
| Problema→Solução | 15-30s | Dor → Agitação → Mecanismo → CTA |
| Listicle | 30-60s | Hook → Item 1 → Item 2 → Item N → CTA |
| Testemunho | 30-45s | Antes → Descoberta → Depois → CTA |
| POV/Trend | 15-30s | Setup relatable → Punchline → CTA |

---

### 2. Geração de Voz IA
**Nível:** Core
**O que faz:** Gera narração PT-BR natural via ElevenLabs API com word-level timestamps para karaoke sync.

**Sub-skills:**
- Narração PT-BR natural (eleven_v3 para qualidade, flash para volume)
- Controle de tom por segmento (hook=energético stability=0.30, explicação=calmo stability=0.55, CTA=urgente stability=0.25)
- Sincronização de pausas com cortes visuais
- Clonagem de voz (IVC: 1-2min áudio, PVC: 30min+)
- Múltiplas vozes por vídeo (diálogo simulado, fake podcast)
- Word-level timestamps via convertWithTimestamps para karaoke captions
- Batch generation com p-limit (5 concurrent no Creator plan)
- Cache de narrações para variações de vídeo (reutilizar áudio)

**Output:** `{audioBuffer, wordTimestamps[], srtFile, duration}`

**Presets de voz por segmento:**
| Segmento | stability | similarity_boost | style | model |
|---|---|---|---|---|
| Hook energético | 0.30 | 0.75 | 0.40 | eleven_v3 |
| Explicação | 0.55 | 0.75 | 0.15 | eleven_v3 |
| Storytelling | 0.40 | 0.80 | 0.35 | eleven_v3 |
| CTA urgente | 0.25 | 0.75 | 0.45 | eleven_v3 |
| Preview/draft | 0.45 | 0.75 | 0.20 | eleven_flash_v2_5 |

**Custos ElevenLabs (Creator plan):**
| Item | Valor |
|---|---|
| Quota mensal | 100.000 caracteres |
| Custo por char excedente | ~$0.30/1000 chars |
| IVC (Instant Voice Clone) | Incluso no plano |
| PVC (Professional Voice Clone) | Add-on separado |
| Concurrent requests | Até 5 (p-limit) |

---

### 3. Geração de Imagens
**Nível:** Core
**O que faz:** Gera imagens para os vídeos via gpt-image-1, Flux, e busca B-roll via Pexels.

**Sub-skills:**
- Produto em contexto (lifestyle, uso real) via gpt-image-1
- Antes/Depois (transformações visuais consistentes)
- Screenshots estilizados (dashboard, resultados)
- Thumbnails com alto contraste e texto bold
- Cenários e backgrounds temáticos
- B-roll search via Pexels (orientation: portrait, size: large)
- Batch generation (Flux Schnell $0.003/img para volume)
- Visual consistency via shared style descriptors
- Prompt templates por formato (UGC, Before/After, Product, Social Proof, Problem/Solution)

**Custo por provider:**
| Provider | Custo/img | Velocidade | Qualidade | Uso principal |
|---|---|---|---|---|
| gpt-image-1 | $0.015 | 5-10s | Alta | Hero shots, thumbnails |
| Flux Schnell | $0.003 | 1-2s | Boa | Bulk testing, backgrounds |
| Flux Pro | $0.055 | 4.5s | Muito alta | Premium shots |
| Pexels | Grátis | Instant | Variada | B-roll, lifestyle |

**Prompt templates por formato:**
| Formato | Prompt base |
|---|---|
| UGC | "Person using [product] in [context], natural lighting, phone selfie style, authentic" |
| Before/After | "Split image, left: [pain state], right: [desired state], same person/setting" |
| Product | "[Product] on [surface], studio lighting, hero angle, clean background" |
| Social Proof | "Screenshot of [result], highlighted numbers, modern UI, dark mode" |
| Problem/Solution | "Person frustrated with [problem], dramatic lighting, expressive face" |

---

### 4. Motion & Animação
**Nível:** Core
**O que faz:** Aplica motion graphics e animações usando Remotion + bibliotecas compatíveis.

**Sub-skills:**
- Texto animado: pop-in, slide-in, typewriter, karaoke word-by-word, shake, neon, 3D, glitch, scramble
- Punch-in zoom (Hormozi-style, 10-15%) em momentos-chave via spring()
- Ken Burns em imagens estáticas (zoom-in, zoom-out, pan, multi-point)
- Speed ramp (câmera lenta → rápido) via interpolate()
- Glitch transitions (0.2-0.5s, RGB split + slice displacement)
- Shake/bounce para ênfase (sin wave, 3-5px intensity)
- Progresso visual (barras, timers, countdowns)
- Particle effects (confetti, sparkles via canvas-confetti)
- Lower thirds animados (name/title overlays)
- Counter/number animations (revenue, students, ROAS)
- Background motion (animated gradients, floating shapes, bokeh)
- Film grain + vignette overlay (cinematic feel)
- Light leaks e lens flares (warm, 20-30% opacity)

**Stack de libs por tier:**
| Tier | Libs | Quando usar |
|---|---|---|
| Core | Remotion native (interpolate, spring, Easing) | Sempre — primeira opção |
| Extended | GSAP, @remotion/lottie | Timelines complexas, ícones animados |
| Advanced | @remotion/three, Three.js | 3D (usar com moderação — pesado) |
| Specialized | Matter.js, tsparticles | Física, partículas |

**Parâmetros de animação padrão:**
| Animação | Parâmetros | Uso |
|---|---|---|
| spring() zoom | damping=15, mass=0.8 | Punch-in suave |
| spring() pop-in | damping=12, mass=0.5 | Texto entrando |
| interpolate() fade | [0, 15] → [0, 1] | Fade in (0.5s a 30fps) |
| Ken Burns | scale [1, 1.15] over 90 frames | Zoom lento em imagem |
| Glitch | duration=8 frames, slices=5 | Transição entre cenas |
| Shake | sin(frame*0.8) * 4px | Ênfase em momento-chave |

---

### 5. Composição de Vídeo
**Nível:** Core
**O que faz:** Monta o vídeo final combinando todos os assets usando templates Remotion.

**Sub-skills:**
- Templates por formato:
  - **UGC** — voz + texto + cortes rápidos
  - **Antes/Depois** — split-screen + transição wipe
  - **Narração + Texto na tela** — estilo Hormozi
  - **Slideshow dinâmico** — imagens + Ken Burns + motion
  - **Problema → Solução** — drama + resolução
  - **Prova social** — prints + resultados + counters
  - **POV** — "POV: você comprou no impulso mas NÃO se arrependeu"
  - **Fake Podcast** — split screen, 2 vozes
  - **Storytime** — narração + ilustrações geradas
- Safe zones por plataforma (Meta, TikTok, Reels, YouTube Shorts)
- Formatos: 9:16 (1080x1920), 1:1 (1080x1080), 4:5 (1080x1350)
- Color grading por seção (warm hook → cool problem → bright demo → urgent CTA)
- Layering: background → image/video → gradient overlay → text → captions → logo
- Audio ducking (música baixa quando voz presente)
- TransitionSeries para transições entre cenas

**Template Schema (JSON-driven):**
```json
{
  "format": "9:16",
  "fps": 30,
  "durationFrames": 900,
  "scenes": [
    {
      "type": "hook-question",
      "durationFrames": 90,
      "headline": "Você sabia que 90% dos sellers...",
      "background": "gradient-dark",
      "textAnimation": "pop-in",
      "transition": "fade"
    },
    {
      "type": "problem",
      "durationFrames": 150,
      "narrationSegment": 1,
      "image": "frustrated-seller.png",
      "motionEffect": "ken-burns-in",
      "transition": "glitch"
    },
    {
      "type": "solution",
      "durationFrames": 180,
      "narrationSegment": 2,
      "image": "dashboard-results.png",
      "motionEffect": "zoom-reveal",
      "transition": "wipe-left"
    },
    {
      "type": "cta",
      "durationFrames": 120,
      "headline": "Link na bio",
      "narrationSegment": 3,
      "textAnimation": "pulse",
      "transition": "none"
    }
  ],
  "narrationUrl": "https://storage.../narration.mp3",
  "musicUrl": "https://storage.../bg-music.mp3",
  "musicVolume": 0.15,
  "brandColor": "#FF6B00",
  "captionData": [
    { "word": "Você", "start": 0.0, "end": 0.3 },
    { "word": "sabia", "start": 0.3, "end": 0.6 }
  ]
}
```

**Safe zones (pixels from edge):**
| Plataforma | Top | Bottom | Left | Right | Notas |
|---|---|---|---|---|---|
| Meta Feed | 0 | 0 | 0 | 0 | Sem restrição |
| Meta Stories/Reels | 250px | 340px | 60px | 60px | CTA button embaixo |
| TikTok | 150px | 400px | 40px | 40px | Username + description |
| YouTube Shorts | 150px | 300px | 40px | 40px | Subscribe button |
| Instagram Reels | 250px | 380px | 60px | 60px | Similar ao Meta |

---

### 6. Sound Design
**Nível:** Avançado
**O que faz:** Seleciona e compõe o áudio do vídeo (música, SFX, layering).

**Sub-skills:**
- Música de fundo por energia: Urgency 130-150 BPM, Energetic 110-130, Testimonial 80-100, Premium 60-80
- SFX library: whoosh (transições), pop/ding (texto), cha-ching (revenue), record scratch (pattern interrupt), boom (reveals), click (CTAs)
- Beat-sync (cortes alinhados ao ritmo da música)
- Notification sound no hook (iPhone ding trick — usar com moderação)
- 3-layer design: Voz (foreground, -6dB) → SFX (mid, -12dB) → Music (background, -18dB)
- Audio ducking automático (música -6dB quando voz presente)
- Phone speaker optimization: high-pass 150Hz, mid boost 2-4kHz
- Normalização LUFS: target -14 LUFS (streaming standard)

**Mapa de SFX por momento:**
| Momento | SFX | Volume | Duração |
|---|---|---|---|
| Hook (primeiro frame) | Notification ding / whoosh | -10dB | 0.3s |
| Transição entre cenas | Whoosh / glitch sound | -12dB | 0.2-0.5s |
| Texto aparecendo | Pop / ding | -14dB | 0.1-0.2s |
| Número/resultado | Cha-ching / counter tick | -10dB | 0.5-1s |
| Pattern interrupt | Record scratch / boom | -8dB | 0.3-0.5s |
| CTA | Click / swoosh | -12dB | 0.2s |
| Reveal/surpresa | Boom / impact | -8dB | 0.5s |

**Música por tipo de conteúdo:**
| Tipo de vídeo | BPM | Estilo | Energia |
|---|---|---|---|
| Urgência/Escassez | 130-150 | Trap, Electronic | Alta |
| Energético/Motivacional | 110-130 | Pop, Hip Hop | Média-Alta |
| Testemunho/História | 80-100 | Lo-fi, Acoustic | Média |
| Premium/Aspiracional | 60-80 | Cinematic, Piano | Baixa-Média |
| Tutorial/Explicação | 90-110 | Corporate, Ambient | Baixa |

**Audio ducking curve:**
```
Voz presente:  Música -18dB (base) → -24dB (ducked) = -6dB reduction
Voz ausente:   Música volta para -18dB com fade de 0.3s
SFX:           Sempre -12dB, não faz duck na música
```

---

### 7. Produção em Massa
**Nível:** Avançado
**O que faz:** Produz 50-200 vídeos por mês com variações automatizadas.

**Sub-skills:**
- Batch rendering (10-50 vídeos em paralelo via Remotion Lambda ou local)
- Variação automática: mesmo roteiro, hooks diferentes / visuais diferentes / CTAs diferentes
- Frankensteining: combinar módulos de vídeos diferentes (hook A + body B + CTA C)
- A/B de elementos: mesma narração com visuais diferentes, ou mesmo visual com hooks diferentes
- Fila de produção com prioridade (P0=urgente, P1=standard, P2=variações)
- Concept engine: 6 ângulos × 5 formatos × 10 hooks = 300 combinações viáveis
- Naming convention: `{date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4`
- Lineage tracking: cada criativo liga ao parent concept

**Concept engine — Combinações:**
| Dimensão | Variáveis | Exemplo |
|---|---|---|
| Ângulos (6) | Dor, Resultado, Mecanismo, Identidade, Contrarian, História | "Dor de não vender" |
| Formatos (5) | UGC, Slideshow, Hormozi, Before/After, POV | "Slideshow dinâmico" |
| Hooks (10) | Curiosidade, Prova, Contrarian, Dado, História, If/Then, POV, Pergunta, Choque, Trend | "Hook de prova social" |
| CTAs (5) | Link bio, Swipe up, Comenta, DM, Arrasta | "Link na bio" |
| **Total** | **6 × 5 × 10 × 5 = 1.500** | Filtrar para ~300 viáveis |

**Fila de produção:**
| Prioridade | SLA | Exemplo |
|---|---|---|
| P0 — Urgente | Mesmo dia | Winner que precisa de variação imediata |
| P1 — Standard | 24-48h | Novos criativos da semana |
| P2 — Variações | 48-72h | Variações de hooks/visuais de criativos existentes |
| P3 — Backlog | Quando possível | Conceitos experimentais, novos formatos |

**Kill rules automáticas (quando integrado com Léo):**
| Métrica | Threshold | Ação |
|---|---|---|
| Spend sem compra | > 2x CPA target | Kill |
| CTR | < 0.8% após 1000 impressões | Kill |
| Hook rate | < 25% após 500 impressões | Kill hook, manter body |
| CPA | > 1.5x target | Kill |
| Frequência | > 2.5 (7 dias) | Refresh (novo hook/visual) |

**Naming convention breakdown:**
```
20260328_shopeeads_dor-nao-vender_hook-pergunta_body-mecanismo_cta-link_9x16.mp4
│        │         │              │             │              │       │
│        │         │              │             │              │       └── Formato
│        │         │              │             │              └── CTA usado
│        │         │              │             └── Body type
│        │         │              └── Hook type
│        │         └── Conceito/ângulo
│        └── Produto
└── Data (YYYYMMDD)
```

---

### 8. Controle de Qualidade
**Nível:** Core
**O que faz:** Valida cada vídeo contra checklist antes de exportar.

**Checklist automático:**
| # | Check | Critério | Auto? |
|---|---|---|---|
| 1 | Hook nos primeiros 1.7s | Algo novo no primeiro frame | Auto |
| 2 | Corte a cada 2-4s | Contagem de scene changes | Auto |
| 3 | Texto legível (48px+ mobile) | Font size check | Auto |
| 4 | CTA claro nos últimos 5s | Text detection no final | Auto |
| 5 | Safe zones respeitadas | Conteúdo dentro de margins | Auto |
| 6 | Áudio normalizado (-14 LUFS) | Loudness check | Auto |
| 7 | Resolução correta | 1080x1920 ou 1080x1080 | Auto |
| 8 | Duração 15-60s | Duration check | Auto |
| 9 | Sem frames pretos | Black frame detection | Auto |
| 10 | Funciona sem som | Captions/text present | Auto |
| 11 | 12 Pillars score | Dara Denney checklist | Manual |
| 12 | Meta policy compliance | Policy KB check | Semi-auto |

**Score:** Passa com 10/12 automáticos OK + review dos 2 manuais.

**12 Pillars (Dara Denney) — Referência manual:**
| # | Pilar | O que validar |
|---|---|---|
| 1 | Hook | Captura atenção em <3s? |
| 2 | Problem | Dor/problema claro? |
| 3 | Solution | Solução apresentada? |
| 4 | Features | Funcionalidades mostradas? |
| 5 | Benefits | Benefícios tangíveis? |
| 6 | Social Proof | Prova social presente? |
| 7 | Urgency | Urgência/escassez? |
| 8 | CTA | Call to action claro? |
| 9 | Branding | Marca reconhecível? |
| 10 | Emotion | Gera emoção? |
| 11 | Sound | Áudio/música adequados? |
| 12 | Format | Formato nativo da plataforma? |

**Ações por score:**
| Score | Status | Ação |
|---|---|---|
| 12/12 | Excelente | Exportar e subir direto |
| 10-11/12 | Aprovado | Exportar, notar itens pendentes |
| 8-9/12 | Revisar | Corrigir itens falhados antes de exportar |
| <8/12 | Reprovar | Refazer — não exportar |

---

### 9. Output & Distribuição
**Nível:** Core
**O que faz:** Exporta, armazena e notifica sobre vídeos prontos.

**Sub-skills:**
- MP4 otimizado (H.264, CRF 23, -movflags +faststart)
- Bitrate: 5M balanced, 8M high quality
- Thumbnail automática (frame com maior entropia visual)
- Metadata tracking: script_id, voice_id, music_track, template_id, images_used
- Upload para Supabase Storage
- Notificação Telegram com preview (video + metadata + QA score)
- Naming: `{date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4`
- Multi-format render: same content → 9:16 + 1:1 + 4:5

**Configuração de export:**
| Preset | CRF | Bitrate | Uso | Tamanho ~30s |
|---|---|---|---|---|
| Draft | 28 | 2M | Preview rápido | ~4MB |
| Balanced | 23 | 5M | Produção padrão | ~10MB |
| High Quality | 18 | 8M | Premium / showcase | ~18MB |

**FFmpeg flags padrão:**
```
-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p
-c:a aac -b:a 128k -ar 44100
-movflags +faststart
-r 30
```

**Metadata tracking (salvo em Supabase):**
```json
{
  "video_id": "uuid",
  "created_at": "2026-03-28T10:00:00Z",
  "product": "shopee-ads",
  "concept": "dor-nao-vender",
  "hook_type": "pergunta",
  "body_type": "mecanismo",
  "cta_type": "link-bio",
  "format": "9:16",
  "duration_s": 30,
  "template_id": "hormozi-narration",
  "script_id": "script-uuid",
  "voice_id": "elevenlabs-voice-id",
  "music_track": "energetic-120bpm",
  "images_used": ["img1.png", "img2.png"],
  "qa_score": 11,
  "qa_failed": ["meta-policy-manual"],
  "parent_concept_id": "concept-uuid",
  "storage_url": "https://supabase.../video.mp4",
  "thumbnail_url": "https://supabase.../thumb.jpg",
  "file_size_mb": 10.2
}
```

**Notificação Telegram (formato):**
```
🎬 Novo vídeo pronto!

📦 Produto: Shopee ADS 2.0
🎯 Conceito: Dor de não vender
🪝 Hook: Pergunta
⏱ Duração: 30s
📐 Formato: 9:16

✅ QA Score: 11/12
❌ Falhou: Meta policy (manual review)

📎 [Link do vídeo]
🖼 [Thumbnail preview]
```

**Multi-format render:**
| Source | Target | Adaptação |
|---|---|---|
| 9:16 (1080x1920) | 1:1 (1080x1080) | Crop center + reposicionar texto |
| 9:16 (1080x1920) | 4:5 (1080x1350) | Crop suave + ajustar safe zones |
| 1:1 (1080x1080) | 9:16 (1080x1920) | Adicionar background blur/gradient |
