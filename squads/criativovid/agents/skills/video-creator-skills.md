# Skills — Maicon (Video Creator) — Motion Graphics Only

## Skill Tree

```
VIDEO CREATOR (Maicon) — MOTION FOCUS
├── 1. ROTEIRIZAÇÃO PARA MOTION
│   ├── Roteiro PRSA com timeline de cortes (marcação de corte/zoom/texto a cada 2-3s)
│   ├── Marcação de pattern interrupts a cada 3s (tipo: visual, auditivo, semântico)
│   ├── Definição de pacing curve (rápido→médio→rápido) baseado na energy wave
│   ├── Integração com padrões vencedores do Max (recebe dados de winners)
│   ├── Seleção de storytelling structure (7 formatos)
│   ├── Geração de hooks duais (visual + verbal) usando 7 categorias Jake Thomas
│   └── RMBC compliance (mecanismo obrigatório em todo roteiro)
│
├── 2. MOTION & ANIMAÇÃO (CORE)
│   ├── Texto animado (pop-in, slide-in, typewriter, karaoke, shake, neon, 3D, glitch, scramble)
│   ├── Punch-in zoom Hormozi-style (10-15%) via spring()
│   ├── Speed ramp (câmera lenta → rápido) via interpolate()
│   ├── Glitch transitions (0.2-0.5s, RGB split + slice displacement)
│   ├── Shake/bounce para ênfase (sin wave, 3-5px intensity)
│   ├── Progresso visual (barras, timers, countdowns)
│   ├── Particle effects (confetti, sparkles via canvas-confetti)
│   ├── Counter/number animations (revenue, students, ROAS)
│   ├── Background motion (animated gradients, floating shapes, bokeh)
│   ├── Film grain + vignette overlay (cinematic feel)
│   ├── Light leaks e lens flares (warm, 20-30% opacity)
│   └── Remotion best practices (Composition, Sequence, Series, spring, interpolate)
│
├── 3. COMPOSIÇÃO DE VÍDEO
│   ├── Templates motion: SyncedMotion (principal), MotionGraphics, Narração+Texto
│   ├── Safe zones por plataforma (Meta, TikTok, Reels, YouTube Shorts)
│   ├── Formatos: 9:16 (1080x1920), 1:1 (1080x1080), 4:5 (1080x1350)
│   ├── Color grading por seção (warm hook → cool problem → bright demo → urgent CTA)
│   ├── Layering: background → gradient → symbols → text → captions
│   ├── Audio ducking (música baixa quando voz presente)
│   └── TransitionSeries para transições entre cenas
│
├── 4. SOUND DESIGN
│   ├── Música de fundo por energia (60-150 BPM por tipo)
│   ├── SFX library (whoosh, pop, cha-ching, record scratch, boom, click)
│   ├── Beat-sync (cortes alinhados ao ritmo)
│   ├── Notification sound no hook (iPhone ding trick)
│   ├── 3-layer design: Voz → SFX → Music
│   ├── Audio ducking automático (-6dB quando voz presente)
│   ├── Phone speaker optimization (high-pass 150Hz, mid boost 2-4kHz)
│   └── Normalização LUFS (target -14 LUFS)
│
├── 5. CONTROLE DE QUALIDADE
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
└── 6. OUTPUT & DISTRIBUIÇÃO
    ├── MP4 otimizado (H.264, CRF 23, -movflags +faststart)
    ├── Bitrate: 5M balanced, 8M high quality
    ├── Thumbnail automática (frame com maior entropia visual)
    ├── Metadata tracking (script_id, music_track, template_id)
    ├── Upload para Supabase Storage
    ├── Notificação Telegram com preview (video + metadata + QA score)
    ├── Naming: {date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4
    └── Multi-format render: same content → 9:16 + 1:1 + 4:5
```

---

## Detalhamento por Skill

### 1. Roteirização para Motion
**Nível:** Core
**O que faz:** Gera roteiros otimizados para motion graphics com timeline de cortes segundo-a-segundo.

**Sub-skills:**
- Roteiro PRSA com timeline de cortes (marcação de corte/zoom/texto a cada 2-3s)
- Marcação de pattern interrupts a cada 3s (tipo: visual, auditivo, semântico)
- Definição de pacing curve (rápido→médio→rápido) baseado na energy wave
- Integração com padrões vencedores do Max (recebe dados de winners)
- Seleção de storytelling structure (7 formatos)
- Geração de hooks duais (visual + verbal) usando 7 categorias de Jake Thomas
- RMBC compliance (mecanismo obrigatório em todo roteiro)

**Output:** JSON com `{scenes[], hooks[], transitions[], timing[], captionMarkers[]}`

**Métricas de qualidade:**
| Check | Critério |
|---|---|
| Hook em <1.7s | Primeiro frame tem motion/contraste |
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

---

### 2. Motion & Animação (CORE)
**Nível:** Core
**O que faz:** Aplica motion graphics e animações usando Remotion. Skill principal do Maicon.

**Sub-skills:**
- Texto animado: pop-in, slide-in, typewriter, karaoke word-by-word, shake, neon, 3D, glitch, scramble
- Punch-in zoom (Hormozi-style, 10-15%) em momentos-chave via spring()
- Speed ramp (câmera lenta → rápido) via interpolate()
- Glitch transitions (0.2-0.5s, RGB split + slice displacement)
- Shake/bounce para ênfase (sin wave, 3-5px intensity)
- Progresso visual (barras, timers, countdowns)
- Particle effects (confetti, sparkles via canvas-confetti)
- Counter/number animations (revenue, students, ROAS)
- Background motion (animated gradients, floating shapes, bokeh)
- Film grain + vignette overlay (cinematic feel)
- Light leaks e lens flares (warm, 20-30% opacity)
- Remotion best practices (Composition, Sequence, Series, spring(), interpolate(), AbsoluteFill)

**Stack de libs por tier:**
| Tier | Libs | Quando usar |
|---|---|---|
| Core | Remotion native (interpolate, spring, Easing, Sequence, Series) | Sempre — primeira opção |
| Extended | GSAP, @remotion/lottie | Timelines complexas, ícones animados |
| Advanced | @remotion/three, Three.js | 3D (usar com moderação — pesado) |
| Specialized | Matter.js, tsparticles | Física, partículas |

**Remotion Core Concepts (via remotion-best-practices):**
| Conceito | O que faz | Quando usar |
|---|---|---|
| Composition | Define projeto (width, height, fps, durationInFrames) | Sempre — container do vídeo |
| Sequence | Controla quando cada elemento aparece (from, durationInFrames) | Timeline positioning |
| Series | Encadeia cenas em sequência automática | Seções sequenciais |
| AbsoluteFill | Camadas sobrepostas (layers) | Layering de elementos |
| spring() | Animação física (mass, damping, stiffness) | Presets SLAM/PUNCH/SMOOTH/SNAP |
| interpolate() | Mapeia ranges de valores com easing | Fades, scales, movimentos |
| useCurrentFrame() | Retorna frame atual — base de toda animação | Sempre |

**Parâmetros de animação padrão:**
| Animação | Parâmetros | Uso |
|---|---|---|
| spring() zoom | damping=15, mass=0.8 | Punch-in suave |
| spring() pop-in | damping=12, mass=0.5 | Texto entrando |
| interpolate() fade | [0, 15] → [0, 1] | Fade in (0.5s a 30fps) |
| Glitch | duration=8 frames, slices=5 | Transição entre cenas |
| Shake | sin(frame*0.8) * 4px | Ênfase em momento-chave |

---

### 3. Composição de Vídeo
**Nível:** Core
**O que faz:** Monta o vídeo final usando templates Remotion 100% motion graphics.

**Sub-skills:**
- Templates motion:
  - **SyncedMotion** (principal) — audio-driven, word-by-word, símbolos animados
  - **MotionGraphics** — cenas com visualizações (textReveal, counter, graphUp, checkmarks)
  - **Narração + Texto** — estilo Hormozi com motion graphics
  - **Problema → Solução** — drama + resolução com motion
- Safe zones por plataforma (Meta, TikTok, Reels, YouTube Shorts)
- Formatos: 9:16 (1080x1920), 1:1 (1080x1080), 4:5 (1080x1350)
- Color grading por seção (warm hook → cool problem → bright demo → urgent CTA)
- Layering: background → gradient → symbols → text → captions
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

### 4. Sound Design
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

### 5. Controle de Qualidade
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

### 6. Output & Distribuição
**Nível:** Core
**O que faz:** Exporta, armazena e notifica sobre vídeos prontos.

**Sub-skills:**
- MP4 otimizado (H.264, CRF 23, -movflags +faststart)
- Bitrate: 5M balanced, 8M high quality
- Thumbnail automática (frame com maior entropia visual)
- Metadata tracking: script_id, music_track, template_id
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
  "music_track": "energetic-120bpm",
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
