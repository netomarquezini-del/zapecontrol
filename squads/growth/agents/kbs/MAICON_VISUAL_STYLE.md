# MAICON VISUAL STYLE GUIDE v1.0

> Definitive visual style specification for the Maicon Video Creator agent.
> Every value is a concrete number. Every rule is implementation-ready.
> Approved by Neto Marquezini on 2026-03-28.

---

## 1. IDENTITY

Maicon is a motion graphics video producer specialized in vertical Meta Ads (9:16, 30-50s) for cold traffic. He produces 100% motion graphics videos — ZERO photos, ZERO stock footage, ZERO static images. Every frame is animated typography, geometric symbols, and kinetic energy.

His signature style is **bold kinetic typography on dark backgrounds** — inspired by Burger King's rebrand energy, Apple's minimalist speed, and TIDAL's vibrant text-driven aesthetic. Text IS the visual. Words slam onto screen one at a time, sized for maximum impact, synced to narration beat-for-beat. The result feels premium, fast, and impossible to scroll past.

Language is always PT-BR. The brand is Zape Ecomm. The product is Shopee ADS 2.0.

---

## 2. MOTION PRINCIPLES

Four personality pillars that govern every animation decision:

```yaml
motion_principles:
  IMPACTO:
    definition: >
      Every element enters with force and purpose. Nothing fades in gently.
      Words SLAM. Symbols PUNCH. Transitions SNAP. The viewer feels each
      beat physically. Inspired by Burger King rebrand — text IS the event.
    manifestation: >
      Snappy spring entrances (damping: 100, stiffness: 200).
      Scale overshoots on emphasis words. Flash transitions between scenes.
      Zero ease-in-out — everything is ease-out (arrive fast, settle).

  VELOCIDADE:
    definition: >
      The pace never lets the viewer's thumb reach the scroll button.
      Scene changes every 2-3 seconds. Words appear and disappear with urgency.
      Inspired by Apple Don't Blink — relentless forward momentum.
    manifestation: >
      Max 2.5s per word group. 100ms timing tokens for entrances.
      Staggered word reveals at 80ms intervals. No lingering.
      Body sections run at 3-4 words/second display rate.

  CONTRASTE:
    definition: >
      Hierarchy is AGGRESSIVE. Big vs small. Fast vs slow. Dark vs lime green.
      The eye is guided by dramatic size differences, not subtle variations.
      Inspired by Apple Carbon Neutral — strategic use of space and scale.
    manifestation: >
      Emphasis words at 140px, connectors at 52px — a 2.7x size ratio.
      Dark backgrounds (#0A0A0A) against lime green (#A3E635) accents.
      Fast body (2s scenes) contrasted with slow CTA (5s breathing room).

  FLUIDEZ:
    definition: >
      Despite the speed, nothing feels jarring or broken. Each element
      flows into the next with intentional choreography. No stutters,
      no dead frames, no orphaned animations.
      Inspired by Slack AI — smooth tech transitions, professional polish.
    manifestation: >
      Spring physics (never linear tweens). Overlapping exit/entrance timing.
      Background color shifts over 500ms (not instant cuts).
      Every frame has exactly one focal point — never competing elements.
```

---

## 3. VISUAL FOUNDATION

### Background System

The background is ALWAYS a full-screen animated gradient. Never flat black. Never static.

```yaml
background:
  base: "radial gradient from center"
  base_center_color: "#1A1A1A"
  base_edge_color: "#0A0A0A"
  animation: "subtle pulse — center color shifts +/-5% brightness over 3s loop"

  section_overlays:
    hook:
      overlay: "none"
      mood: "neutral dark, mysterious"
      gradient_center: "#1A1A1A"
      gradient_edge: "#0A0A0A"

    problem:
      overlay: "radial gradient, #FF0000 at center, transparent at edge"
      overlay_opacity: 0.12
      mood: "dark, tense, uncomfortable"
      gradient_center: "#1A0A0A"
      gradient_edge: "#0A0A0A"

    result:
      overlay: "radial gradient, #A3E635 at center, transparent at edge"
      overlay_opacity: 0.10
      mood: "dark but hopeful, green tint"
      gradient_center: "#0A1A0A"
      gradient_edge: "#0A0A0A"

    mechanism:
      overlay: "radial gradient, #F59E0B at center, transparent at edge"
      overlay_opacity: 0.08
      mood: "dark, golden, revelatory"
      gradient_center: "#1A150A"
      gradient_edge: "#0A0A0A"

    cta:
      overlay: "NONE — solid color background replaces gradient"
      background: "#A3E635"
      mood: "bright, energetic, action"
      text_color: "#0A0A0A"

  transition_between_sections:
    duration_ms: 500
    easing: "ease-in-out"
    method: "crossfade overlay opacity from 0 to target over 500ms"
```

### What Fills the Screen

```yaml
screen_composition:
  text_percentage: 80  # 80% of visual impact comes from typography
  symbol_percentage: 15  # 15% from animated symbols/icons
  accent_percentage: 5   # 5% from particles, lines, flash effects

  rule: >
    Text IS the visual. The word on screen is the main event.
    Symbols support and illustrate. Accents add energy.
    There is NEVER a moment where the screen shows only background.
```

---

## 4. TYPOGRAPHY SYSTEM

### Font Specification

```yaml
font:
  family: "Albert Sans"
  file_path: "public/fonts/AlbertSans-VariableFont_wght.ttf"
  load_method: "loadFont() with waitUntilDone: true BEFORE any measureText/fitText call"
  fallback: "NONE — if Albert Sans fails to load, halt render and report error"
```

### Size Scale (exact pixel values at 1080x1920)

```yaml
typography_scale:
  HERO:
    size_px: 160
    weight: 900  # Black
    use: "Single-word maximum impact (numbers, key nouns in CTA)"
    max_characters: 6
    line_height: 1.0
    letter_spacing_px: -2
    color: "#FFFFFF"
    example_words: ["ROAS", "25X", "AGORA", "GRATIS"]

  HUGE:
    size_px: 140
    weight: 900  # Black
    use: "Primary emphasis words in body"
    max_characters: 10
    line_height: 1.1
    letter_spacing_px: -1
    color: "#FFFFFF"
    example_words: ["SHOPEE", "VENDAS", "LUCRO", "RESULTADO"]

  LARGE:
    size_px: 96
    weight: 800  # ExtraBold
    use: "Secondary emphasis, important nouns and verbs"
    max_characters: 14
    line_height: 1.2
    letter_spacing_px: 0
    color: "#FFFFFF"
    example_words: ["configuracoes", "anuncios", "faturamento"]

  MEDIUM:
    size_px: 68
    weight: 700  # Bold
    use: "Normal words — common nouns, verbs, adjectives"
    max_characters: 18
    line_height: 1.3
    letter_spacing_px: 1
    color: "#E5E5E5"
    example_words: ["vender", "usando", "metodo", "simples"]

  SMALL:
    size_px: 52
    weight: 700  # Bold
    use: "Connectors — articles, prepositions, conjunctions"
    max_characters: 20
    line_height: 1.4
    letter_spacing_px: 2
    color: "#A3A3A3"
    example_words: ["de", "para", "com", "que", "no", "na", "um", "uma", "e", "ou"]
```

### Dynamic Sizing Rules

```yaml
dynamic_sizing:
  method: "fitText() from @remotion/layout-utils"
  max_width_px: 840  # safe area width (1080 - 120 - 120)
  max_lines: 3
  min_font_size_px: 44
  white_space: "pre"

  procedure:
    1: "Load Albert Sans with waitUntilDone()"
    2: "Determine word category (HERO/HUGE/LARGE/MEDIUM/SMALL) from emphasis map"
    3: "Call fitText({ text, fontFamily: 'Albert Sans', fontWeight, maxWidth: 840, maxLines: 1 })"
    4: "If fitText returns size < min_font_size_px (44px), split into 2 lines and re-fit"
    5: "If still < 44px after 2 lines, reduce to max 3 lines — NEVER go below 44px"
    6: "Apply letter-spacing after fitting (letter-spacing not included in fitText measurement)"

  overflow_protection:
    description: >
      TEXT MUST NEVER GO OUTSIDE THE VISIBLE SCREEN. This was a V6 bug.
      After all sizing and positioning, verify EVERY word stays within bounds.
    rules:
      - "Max text width: 760px (70% of 1080, more conservative than safe zone)"
      - "If text at assigned fontSize exceeds 760px: REDUCE fontSize until it fits"
      - "Add CSS overflow: hidden + textOverflow: ellipsis as LAST RESORT safety net"
      - "Test with longest words in PT-BR: 'CONFIGURAÇÕES', 'TRANSFORMAR', 'FATURAMENTO'"
      - "Position top (y=550): text top edge must be >= 250px (top safe zone)"
      - "Position bottom (y=1300): text bottom edge must be <= 1600px (bottom safe zone)"
      - "NEVER trust fontSize alone — always measure rendered width against max_width"
    implementation: >
      In WordDisplay component: after calculating fontSize, compute approximate
      rendered width = fontSize * characterCount * 0.55 (average char width ratio).
      If > 760px, reduce fontSize by 10% and recompute. Repeat until fits.
```

### Safe Zones (exact pixel values for 1080x1920)

```yaml
safe_zones:
  resolution: "1080x1920"
  top_unsafe_px: 250     # status bar, notifications, platform UI
  bottom_unsafe_px: 320  # CTA buttons, swipe-up, platform UI
  left_unsafe_px: 120    # thumb zone, edge clips
  right_unsafe_px: 120   # thumb zone, edge clips

  safe_area:
    x_start: 120
    x_end: 960
    y_start: 250
    y_end: 1600
    width: 840
    height: 1350

  text_safe_area:
    description: "Text must fit within 80% of total width for extra breathing room"
    max_width_px: 864  # 80% of 1080
    x_center: 540
    x_start: 108
    x_end: 972

  cta_safe_area:
    description: "CTA text positioned in the center-to-lower-center zone"
    y_start: 600
    y_end: 1400
```

### Color Rules for Text

```yaml
text_colors:
  default_body: "#FFFFFF"
  secondary_body: "#E5E5E5"
  connector_words: "#A3A3A3"
  emphasis_highlight: "#A3E635"  # lime green for key numbers/words
  cta_text: "#0A0A0A"           # dark text on green CTA background
  problem_section_accent: "#FF6B6B"  # soft red for pain words
  result_section_accent: "#A3E635"   # lime green for gain words

  rules:
    - "NEVER use pure yellow (#FFFF00) — looks cheap"
    - "NEVER use red for CTA — red = problem, green = action"
    - "Emphasis highlight (#A3E635) used on MAX 2 words per word group"
    - "In CTA section: ALL text is #0A0A0A on #A3E635 background"
```

---

## 5. ANIMATION SYSTEM

### Named Animation Presets (Remotion Spring Configs)

```yaml
animation_presets:
  SLAM:
    description: "Primary text entrance — fast, snappy, arrives with authority"
    use: "Every word entrance, emphasis words, symbols appearing"
    spring_config:
      damping: 100
      stiffness: 200
      mass: 0.5
    initial_state:
      scale: 0.3
      opacity: 0
      translateY: 60
    final_state:
      scale: 1.0
      opacity: 1
      translateY: 0
    duration_frames_approx: 8  # at 30fps = ~267ms
    notes: "Use measureSpring() for exact frame count. Slight overshoot is desired."

  PUNCH:
    description: "Emphasis pulse — word is already on screen, gets a size/color punch"
    use: "Highlighting a number, key benefit word, or Shopee mention"
    spring_config:
      damping: 10
      stiffness: 200
      mass: 0.5
    initial_state:
      scale: 1.0
    peak_state:
      scale: 1.15
    final_state:
      scale: 1.0
    duration_frames_approx: 18  # at 30fps = ~600ms
    notes: "Bouncy — 2-3 visible oscillations before settling. Use for max 1 word per group."

  SMOOTH:
    description: "Gentle slide for position changes, background transitions, symbol movements"
    use: "Background color shifts, symbol repositioning, camera-like pans"
    spring_config:
      damping: 20
      stiffness: 100
      mass: 0.8
    duration_frames_approx: 24  # at 30fps = ~800ms
    notes: "Fluid, no sharp edges. Good for elements that move while staying on screen."

  SNAP:
    description: "Clean exit — element disappears quickly and cleanly"
    use: "Word group exits, symbol exits, scene transitions"
    spring_config:
      damping: 200
      stiffness: 100
      mass: 1
      overshootClamping: true
    initial_state:
      scale: 1.0
      opacity: 1
    final_state:
      scale: 0.85
      opacity: 0
    duration_frames_approx: 6  # at 30fps = ~200ms
    notes: "overshootClamping: true prevents any bounce. Clean disappearance."

  FLASH:
    description: "White/green flash overlay between scene transitions"
    use: "Between word groups, section transitions, CTA entrance"
    type: "opacity tween (not spring)"
    duration_frames: 3  # at 30fps = 100ms
    sequence:
      - frame_0: { opacity: 0 }
      - frame_1: { opacity: 0.7 }
      - frame_2: { opacity: 0.3 }
      - frame_3: { opacity: 0 }
    color_by_section:
      hook: "#FFFFFF"
      problem: "#FF4444"
      result: "#A3E635"
      mechanism: "#F59E0B"
      cta: "#A3E635"
```

### Timing Tokens

```yaml
timing_tokens:
  t1:
    name: "instant"
    ms: 80
    frames: 2
    use: "Stagger delay between words in same group, particle spawns"

  t2:
    name: "snap"
    ms: 150
    frames: 5
    use: "Word exits, flash transitions, quick accent animations"

  t3:
    name: "beat"
    ms: 267
    frames: 8
    use: "Standard word entrance (SLAM), symbol entrance"

  t4:
    name: "flow"
    ms: 500
    frames: 15
    use: "Background transitions, section color shifts, smooth repositions"

  t5:
    name: "breathe"
    ms: 700
    frames: 21
    use: "CTA entrance, final emphasis hold, dramatic pause before CTA"

  t6:
    name: "hold"
    ms: 1000
    frames: 30
    use: "Minimum time text stays readable on screen, CTA display duration"
```

### Easing Curves

```yaml
easing_curves:
  entrance:
    name: "ease-out / snappy"
    description: "Arrives fast, decelerates to rest. Used for ALL entrances."
    css_equivalent: "cubic-bezier(0.0, 0.0, 0.2, 1.0)"
    remotion: "Use spring with high stiffness (SLAM preset)"

  exit:
    name: "ease-in / accelerate away"
    description: "Starts slow, accelerates out. Used for ALL exits."
    css_equivalent: "cubic-bezier(0.4, 0.0, 1.0, 1.0)"
    remotion: "Use spring with overshootClamping (SNAP preset)"

  standard:
    name: "ease-in-out"
    description: "ONLY for background/ambient animations. Never for text."
    css_equivalent: "cubic-bezier(0.4, 0.0, 0.2, 1.0)"
    remotion: "Use spring with balanced damping (SMOOTH preset)"

  rule: "NEVER use linear easing for any visible element. Linear = robotic = amateur."
```

---

## 5B. AUDIO PROCESSING RULES

### Breath Removal & Pause Compression

```yaml
audio_processing:
  breath_removal:
    description: >
      ALWAYS process narration audio to remove/reduce breathing sounds between phrases.
      Breaths create dead air that kills pacing. The video should feel RELENTLESS.
    method: >
      1. After generating narration via ElevenLabs, analyze word-level timestamps
      2. Identify gaps between word groups > 300ms
      3. For gaps > 300ms and < 800ms: compress to 200ms (trim silence, keep natural transition)
      4. For gaps > 800ms: compress to 300ms (likely a breath or long pause)
      5. NEVER compress gaps < 300ms (these are natural word transitions)
      6. After compression, regenerate timestamps to match new timings
    max_gap_ms: 400  # no gap between word groups should exceed 400ms after processing
    exception: "Before CTA section — allow a 700ms dramatic pause (t5 breathe token)"

  punctuation_detection:
    description: >
      Detect questions in the copy and display "?" on screen.
      The viewer must SEE the punctuation to feel the rhetorical weight.
    rules:
      - "If a word group ends with a question (detected by '?' in copy or interrogative structure), show '?' after the last word"
      - "Interrogative structures: starts with 'como', 'por que', 'qual', 'quando', 'onde', 'quem', or ends with intonation rise"
      - "The '?' appears as a separate animated element: HERO size (160px), brandColor (#A3E635), SCALE_POP entrance"
      - "Display '?' for minimum 15 frames (500ms) after the question word"
      - "Also detect: 'né?', 'certo?', 'sabe?', 'entende?', 'vem?' — common PT-BR question markers"
    implementation: >
      In the wordGroups JSON, add 'punctuation: \"?\"' field to groups that are questions.
      The WordDisplay component renders the punctuation after the last word of the group.
```

---

## 6. WORD DISPLAY RULES

### How Words Appear

```yaml
word_display:
  mode: "one word at a time, synced to narration audio timestamps"
  sync_method: "ElevenLabs word-level timestamps -> frame mapping at 30fps"

  entrance_variety:
    description: >
      NEVER use the same entrance animation for more than 3 consecutive word groups.
      Cycle through these 4 entrance types to create visual variety:
    types:
      SLAM_UP:
        description: "Word flies in from below with spring"
        translateY: "60px -> 0px"
        scale: "0.3 -> 1.0"
        frequency: "40% of word groups (default)"
      SLIDE_LEFT:
        description: "Word slides in from the left"
        translateX: "-200px -> 0px"
        scale: "0.8 -> 1.0"
        frequency: "20% of word groups"
      SLIDE_RIGHT:
        description: "Word slides in from the right"
        translateX: "200px -> 0px"
        scale: "0.8 -> 1.0"
        frequency: "20% of word groups"
      SCALE_POP:
        description: "Word pops from center (scale only, no translate)"
        scale: "0.0 -> 1.1 -> 1.0 (bounce)"
        frequency: "20% of word groups — use for emphasis words"
    rule: >
      Assign entrance type per word group in props JSON via 'entranceType' field.
      If not specified, cycle: SLAM_UP, SLIDE_LEFT, SLAM_UP, SLIDE_RIGHT, SCALE_POP, repeat.
      NEVER same entrance 3x in a row.

  entrance_sequence:
    1: "Previous word group exits with SNAP (6 frames)"
    2: "FLASH fires (3 frames, overlaps with step 1)"
    3: "New word enters with assigned entrance type (8 frames)"
    4: "If emphasis word: PUNCH fires after entrance settles (18 frames)"
    5: "Symbol enters 2 frames after word (staggered)"

  multi_word_groups:
    description: "When a word group has 2-4 words, they appear staggered"
    stagger_delay_ms: 80  # t1 token
    method: "Each word SLAMs in sequence with 80ms delay between each"
    arrangement: "Stack vertically, centered horizontally"
    max_words_per_line: 3
    max_lines: 2
    line_spacing_factor: 1.5  # lineHeight
```

### Sizing Logic

```yaml
word_sizing:
  emphasis_words:
    detection: "Marked in wordGroups JSON emphasis array"
    size: "HUGE (140px) or HERO (160px) for single-word numbers"
    weight: 900
    color: "#FFFFFF or #A3E635 for key numbers"

  normal_words:
    detection: "Any word NOT in emphasis array and NOT a connector"
    size: "Alternating cycle — LARGE (96px) then MEDIUM (68px) for variety"
    weight: "800 for LARGE, 700 for MEDIUM"
    color: "#FFFFFF for LARGE, #E5E5E5 for MEDIUM"

  connector_words:
    detection: "Articles, prepositions, conjunctions: de, para, com, que, no, na, um, uma, e, ou, o, a, os, as, em, do, da, pelo, pela, se, mas, nem, ate"
    size: "SMALL (52px)"
    weight: 700
    color: "#A3A3A3"
    special_rule: "Connectors can be grouped with the next content word on same line"
```

### Position Variation

```yaml
position_system:
  positions:
    center:
      x: 540
      y: 960
      description: "Dead center of safe area"
      frequency: "40% of word groups"

    top_center:
      x: 540
      y: 550
      description: "Upper third of safe area"
      frequency: "30% of word groups"

    bottom_center:
      x: 540
      y: 1300
      description: "Lower third of safe area"
      frequency: "30% of word groups"

  rules:
    - "NEVER use the same position for 3 consecutive word groups"
    - "Hook words: center (maximum visibility)"
    - "Problem words: top_center (creates tension, viewer looks up)"
    - "Result words: center (authority, confidence)"
    - "CTA words: center (focused, clean)"
    - "Position transition uses SMOOTH spring (24 frames)"
```

### Highlight Box Treatment

```yaml
highlight_box:
  description: "Colored box behind emphasis words for maximum contrast"
  use: "Key numbers (ROAS 25, R$200mil), product name (Shopee ADS), action words (AGORA)"
  max_per_video: 5
  max_per_word_group: 1

  specs:
    background_color: "#A3E635"
    text_color: "#0A0A0A"
    padding_x_px: 24
    padding_y_px: 12
    border_radius_px: 8
    entrance: "SLAM preset (same as word, 2 frames before word arrives)"
    exit: "SNAP preset"

  rules:
    - "ONLY on words already marked as emphasis"
    - "NEVER on connector words"
    - "In CTA section: invert — dark box (#0A0A0A) with green text (#A3E635) on green background"
```

---

## 7. VISUAL ELEMENTS

The 20% that is not text. Each element has exact specs and limits.

### 7.1 Highlight Boxes

See section 6 (highlight_box) above. Max 5 per video.

### 7.2 Movement Lines

```yaml
movement_lines:
  description: "Short animated lines that streak across screen during transitions"
  visual: "3-5 parallel diagonal lines, thin, moving in same direction"
  stroke_width_px: 3
  length_px: 200
  color: "#FFFFFF"
  opacity: 0.4
  angle_degrees: -30  # top-right to bottom-left
  speed: "Cross screen in 6 frames (200ms)"
  entrance: "Appear from right edge, exit left edge"
  when_to_use: "During FLASH transitions between word groups"
  max_per_transition: 4
  max_per_video: 20  # roughly 1 per transition, not every one
  frequency: "Every 3rd word group transition (not every transition)"
```

### 7.3 Impact Particles

```yaml
impact_particles:
  description: "Small dots/squares that burst outward from emphasis word"
  shape: "circle (60%) or square rotated 45deg (40%)"
  count_per_burst: 8
  size_px: "4 to 12 (random within range)"
  color: "#A3E635"
  opacity_start: 0.8
  opacity_end: 0.0
  spread_radius_px: 200
  duration_frames: 12  # 400ms
  origin: "Center of the emphasis word"
  when_to_use: "When PUNCH animation fires on emphasis word"
  max_per_video: 8
  performance_note: "Use CSS transforms only — no blur, no box-shadow"
```

### 7.4 Counters (Animated Numbers)

```yaml
counter:
  description: "Number that rapidly counts up from 0 to target value"
  font_size: "HERO (160px)"
  font_weight: 900
  color: "#A3E635"
  duration_frames: 18  # 600ms
  easing: "ease-out (fast at start, slows at end)"
  overshoot: "Count to 110% of target, then spring back to target (PUNCH preset)"
  format: "Integer only, no decimals (round if needed)"
  prefix_suffix: "Add R$, X, %, etc. AFTER the number, same line, LARGE size (96px)"
  when_to_use: "Any time copy mentions a specific number (ROAS 25, 10 dias, R$200k)"
  max_per_video: 3
```

### 7.5 Flash Transitions

```yaml
flash_transition:
  description: "Brief full-screen color flash between word groups"
  duration_frames: 3  # 100ms
  opacity_peak: 0.7
  color_by_section:
    hook_to_problem: "#FFFFFF"
    problem_internal: "#FF4444"
    problem_to_result: "#A3E635"
    result_internal: "#A3E635"
    result_to_mechanism: "#F59E0B"
    mechanism_to_cta: "#A3E635"
  when_to_use: "Every word group transition"
  blend_mode: "screen"
  rule: "Flash OVERLAPS with word exit — starts 1 frame before SNAP begins"
```

### 7.6 Animated Symbols

```yaml
symbols:
  description: "Motion graphics icons that illustrate the concept being spoken"
  size: "Min 40% of screen width (432px), max 60% (648px) — LARGE and VISIBLE"
  opacity: "Min 0.6, max 0.9 — NEVER below 0.5"
  position: >
    NEVER overlap with text. Symbols and text occupy SEPARATE zones:
    - If text is at center (y=960): symbol goes to top zone (y=350) or bottom zone (y=1500)
    - If text is at top (y=550): symbol goes to bottom zone (y=1400)
    - If text is at bottom (y=1300): symbol goes to top zone (y=400)
    Rule: symbol and text must have minimum 200px vertical distance between them.
  entrance: "SLAM preset, 2 frames after word entrance"
  exit: "SNAP preset, simultaneous with word exit"
  animation_while_visible: "Subtle loop — float 10px up/down over 60 frames (2s)"

  available_symbols:
    dollarFly: "Animated dollar sign with upward trajectory + trail"
    dollarRain: "3-5 dollar signs falling from top with gravity"
    arrowUp: "Thick green arrow pointing up, pulsing"
    arrowDown: "Thick red arrow pointing down"
    xMark: "Red X with shake animation"
    checkmark: "Green checkmark with draw-on animation (stroke-dashoffset)"
    counter: "See counter spec above"
    clock: "Clock face with hands spinning fast"
    rocket: "Rocket moving upward with flame trail"
    target: "Bullseye with arrow hitting center"
    graph: "Line chart going up with green line"
    celebration: "Confetti burst (lime green + white particles)"
    person: "Simple silhouette/stick figure"
    shopee_logo: "Shopee orange logo mark (static, no animation)"
    fire: "Animated flame icon"
    lock: "Padlock with unlock animation"
    star: "5-point star with sparkle"
    lightning: "Lightning bolt with flash"

  assignment_rule: "Every word group MUST have exactly 1 symbol. Chosen to match concept."

  max_symbols_visible: 1  # only current group's symbol
```

### 7.7 Pulse Ring

```yaml
pulse_ring:
  description: "Expanding circle ring from CTA button, draws attention to action"
  color: "#0A0A0A"
  stroke_width_px: 4
  start_radius_px: 80
  end_radius_px: 300
  opacity_start: 0.6
  opacity_end: 0.0
  duration_frames: 30  # 1s
  loop: true
  loop_delay_frames: 15  # 500ms between pulses
  when_to_use: "CTA section only, emanating from 'botao' text area"
  max_per_video: 1  # only in CTA
```

---

## 8. SECTION ARCHITECTURE

### Overview

Every video follows the Hook-Problem-Result-Mechanism-CTA structure. Each section has exact timing, visual treatment, energy level, and pacing specs.

```yaml
sections:
  HOOK:
    timing:
      start_second: 0
      end_second: 3
      duration_seconds: 3
      word_groups: 2
    visual_treatment:
      background: "neutral dark gradient"
      text_size: "HUGE to HERO — maximum impact"
      symbol: "attention-grabbing (fire, lightning, dollar)"
      flash_color: "#FFFFFF"
    energy_level: 10  # scale 1-10
    pacing:
      words_per_second: 3
      scene_change_frequency_seconds: 1.5
    content_rules:
      - "MUST mention 'Shopee' or 'Shopee Ads' in first word group"
      - "Pattern interrupt: unexpected visual or statement"
      - "First frame has content (NEVER black)"
      - "First word appears within 200ms of video start"

  PROBLEM:
    timing:
      start_second: 3
      end_second: 12
      duration_seconds: 9
      word_groups: 4
    visual_treatment:
      background: "dark with red overlay (12% opacity)"
      text_size: "Mix of HUGE (pain words) and MEDIUM (context)"
      symbol: "negative symbols (arrowDown, xMark, clock)"
      flash_color: "#FF4444"
    energy_level: 7
    pacing:
      words_per_second: 2.5
      scene_change_frequency_seconds: 2.5
    content_rules:
      - "Agitate the pain — make viewer feel the problem"
      - "Use loss aversion language"
      - "Emphasis on pain words: 'perdendo', 'travado', 'nada'"

  RESULT:
    timing:
      start_second: 12
      end_second: 22
      duration_seconds: 10
      word_groups: 4
    visual_treatment:
      background: "dark with green overlay (10% opacity)"
      text_size: "HUGE for results, counters for numbers"
      symbol: "positive symbols (arrowUp, checkmark, graph, celebration)"
      flash_color: "#A3E635"
    energy_level: 8
    pacing:
      words_per_second: 2.5
      scene_change_frequency_seconds: 2.5
    content_rules:
      - "Paint the transformation — before vs after"
      - "Use specific numbers with counter animation"
      - "Highlight lime green (#A3E635) on result words"

  MECHANISM:
    timing:
      start_second: 22
      end_second: 32
      duration_seconds: 10
      word_groups: 4
    visual_treatment:
      background: "dark with amber overlay (8% opacity)"
      text_size: "LARGE for explanations, HUGE for method name"
      symbol: "process symbols (target, lock, rocket, lightning)"
      flash_color: "#F59E0B"
    energy_level: 6
    pacing:
      words_per_second: 2
      scene_change_frequency_seconds: 3
    content_rules:
      - "Explain HOW it works — the method, the system"
      - "This is the credibility section — be specific"
      - "Slightly slower pace than problem/result for comprehension"
      - "If copy mentions 'Shopee ADS 2.0', use highlight box"

  CTA:
    timing:
      start_second: 32
      end_second: 38
      duration_seconds: 6
      word_groups: 2
    visual_treatment:
      background: "SOLID #A3E635 (lime green) — NO gradient, NO dark"
      text_size: "HUGE for action phrase, LARGE for supporting text"
      text_color: "#0A0A0A (dark on green)"
      symbol: "pulse_ring only"
      flash_color: "#A3E635"
    energy_level: 9
    pacing:
      words_per_second: 1.5
      scene_change_frequency_seconds: 3
    content_rules:
      - "MUST mention 'botao' — 'clica no botao', 'toca no botao de saiba mais'"
      - "NEVER 'link na bio' (this is Meta Ads, not organic)"
      - "Max 2 lines of text — short, punchy"
      - "Pulse ring animation on 'botao' word"
      - "This is the LAST frame visible — video ends on CTA, never black"
      - "Slower pace than body — let viewer READ and ACT"
      - "NEVER use red/urgency colors — green = go = click"
```

### Timing Flexibility

```yaml
timing_flexibility:
  rule: >
    The total duration depends on the copy length (150-220 words = 35-55 seconds).
    Adjust section proportions PROPORTIONALLY:
    - Hook: always exactly 3s (fixed)
    - Problem: 25% of remaining time
    - Result: 28% of remaining time
    - Mechanism: 28% of remaining time
    - CTA: always exactly 5-6s (fixed)
  min_total_duration_seconds: 30
  max_total_duration_seconds: 55
```

---

## 9. SOUND DESIGN

### Volume Levels

```yaml
audio_levels:
  narration:
    volume: 1.0
    description: "Full volume — narration is ALWAYS the primary audio layer"
    processing: "No compression, no reverb, clean dry signal from ElevenLabs"
    voice_selection:
      priority_1: "Neto's cloned voice (IVC) — voice_id stored in env NETO_VOICE_ID"
      priority_2: "Best PT-BR male voice from ElevenLabs catalog — mature, confident, educational tone"
      priority_3: "Any PT-BR male voice — NEVER use English/foreign voice"
      model: "eleven_v3 (quality) for final render, eleven_flash_v2_5 for previews"
      requirements:
        - "MUST sound like a Brazilian male, 28-40 years old"
        - "MUST sound educational/confident — like a teacher explaining"
        - "MUST NOT sound robotic or monotone"
        - "Test voice with a sample phrase before full generation"
    breath_processing: "See section 5B — breaths MUST be compressed/removed after generation"

  sfx:
    volume: 0.25
    description: "Subtle — felt more than heard. Never compete with narration."
    max_simultaneous: 2

  background_music:
    volume: 0.10
    description: "Ambient bed that follows the video energy — NOT generic, CONNECTED to the content"
    ducking: "Auto-duck to 0.05 when narration is playing, rise to 0.12 during pauses"
    bpm_range:
      min: 120
      max: 140
    genre: "lo-fi electronic, minimal beat, no lyrics, no melody"
    energy_matching:
      hook: "subtle tension build, dark pad"
      problem: "low ominous bass, minor key, tension"
      result: "brighter tones, major shift, hopeful"
      mechanism: "steady confident beat, neutral"
      cta: "energy peak, uplifting, motivating"
    rule: >
      Music MUST be present in every video. It is NOT optional.
      The music must feel CONNECTED to the video energy — building tension
      in problem, releasing in result, peaking in CTA.
      If no custom track available, generate a simple ambient tone progression.
```

### SFX Types Per Moment

```yaml
sfx_map:
  word_entrance_slam:
    sound: "deep bass thud / low punch"
    file: "public/sfx/bass-hit.mp3"
    trigger: "Every 3rd word group entrance (not every one — prevents fatigue)"
    volume: 0.20

  emphasis_punch:
    sound: "short metallic impact / snap"
    file: "public/sfx/impact.mp3"
    trigger: "When PUNCH animation fires on emphasis word"
    volume: 0.25

  flash_transition:
    sound: "quick whoosh / air sweep"
    file: "public/sfx/whoosh.mp3"
    trigger: "Every section transition (hook->problem, problem->result, etc.)"
    volume: 0.30

  counter_tick:
    sound: "rapid clicking / ticking"
    file: "public/sfx/tick.mp3"
    trigger: "During counter animation (numbers counting up)"
    volume: 0.15

  cta_entrance:
    sound: "rising chime / bright notification"
    file: "public/sfx/chime.mp3"
    trigger: "When CTA section begins (green background appears)"
    volume: 0.30

  checkmark_draw:
    sound: "soft pop / confirmation"
    file: "public/sfx/pop.mp3"
    trigger: "When checkmark symbol draws on"
    volume: 0.20

  celebration:
    sound: "short confetti burst / sparkle"
    file: "public/sfx/celebration.mp3"
    trigger: "When celebration symbol appears in result section"
    volume: 0.25

sfx_verification:
  description: >
    SFX MUST be audible in the final render. After every render, play the video
    and verify SFX are present. Common causes of missing SFX:
  checklist:
    - "Verify SFX files exist at public/sfx/ — ls each referenced file"
    - "Verify staticFile() path matches: staticFile('sfx/filename.mp3')"
    - "Verify volume is not too low — minimum 0.15 for any SFX"
    - "Verify SFX Sequence 'from' frame is correct (Math.floor(time * fps))"
    - "Verify SFX files are not silent/corrupt — play each file independently"
    - "If SFX still missing: increase volume to 0.40 and re-test"
  rule: >
    If SFX are not audible in the rendered video, this is a CRITICAL QA failure.
    Debug immediately — do NOT deliver video without working SFX.
```

---

## 10. RHYTHM & PACING

### The Apple Don't Blink Contrast

```yaml
rhythm:
  philosophy: >
    The body is RELENTLESS — fast, aggressive, no breathing room.
    The CTA is CALM — spacious, clear, inviting action.
    This contrast makes the CTA feel like relief after a storm.
    The viewer's brain shifts from System 1 (fast processing) to System 2 (deliberate action).

  body_rhythm:
    words_per_second_display: 3  # how fast words cycle on screen
    scene_change_seconds: 2.5   # average time per word group
    max_scene_duration_seconds: 3  # ABSOLUTE max — never exceed
    min_scene_duration_seconds: 1.5
    stagger_between_words_ms: 80
    energy_descriptor: "relentless forward momentum — viewer cannot look away"

  cta_rhythm:
    words_per_second_display: 1.5  # half the body speed
    scene_duration_seconds: 3      # each CTA word group stays longer
    energy_descriptor: "calm authority — clear, spacious, actionable"
    breathing_room_ms: 700  # t5 token — pause before CTA text appears

  hook_rhythm:
    words_per_second_display: 3.5  # fastest section
    scene_change_seconds: 1.5     # ultra-fast scene changes
    energy_descriptor: "explosive pattern interrupt — impossible to ignore"

  pacing_curve:
    description: >
      Energy over time follows a wave pattern:
      Hook (10/10) -> Problem drop (7/10) -> Result rise (8/10) ->
      Mechanism calm (6/10) -> CTA spike (9/10, then calm to 7/10 for action)
```

### Scene Change Frequency

```yaml
scene_changes:
  hook: "Every 1.5 seconds (2 changes in 3s)"
  problem: "Every 2.5 seconds (4 changes in 10s)"
  result: "Every 2.5 seconds (4 changes in 10s)"
  mechanism: "Every 3 seconds (3-4 changes in 10s)"
  cta: "Every 3 seconds (2 changes in 6s)"
  total_for_40s_video: "approximately 15-16 scene changes"
```

---

## 11. TECHNICAL SPECS

```yaml
render_specs:
  resolution:
    width: 1080
    height: 1920
    aspect_ratio: "9:16"
    orientation: "vertical"

  frame_rate: 30  # fps
  codec: "H.264"
  pixel_format: "yuv420p"
  crf: 18  # quality level — lower = better, 18 = visually lossless
  audio_codec: "aac"
  audio_bitrate: "192k"
  container: "mp4"

  render_command: >
    npx remotion render synced-motion
    --props temp/props.json
    --output output/video.mp4
    --codec h264
    --crf 18
    --pixel-format yuv420p
    --audio-codec aac
    --audio-bitrate 192k

  performance:
    concurrency: 4  # parallel frame rendering
    memoize: "All spring calculations, fitText results, and font measurements"
    avoid: "blur(), box-shadow, filter: drop-shadow — use opacity + transforms only"
    font_loading: "Call loadFont() in Root.tsx, await waitUntilDone() before any composition"

  output_naming: "maicon_{product}_{angle}_{variation}_{date}.mp4"
  output_example: "maicon_shopee-ads_roas_v1_20260328.mp4"
```

---

## 12. PROHIBITED TECHNIQUES

Explicit "NEVER do this" list. Violation of any item is a render-blocking error.

```yaml
prohibited:
  # VISUAL
  - id: P01
    rule: "NEVER use stock photos, stock footage, or static images as scene content"
    reason: "Brand is 100% motion graphics. Photos look cheap in this context."

  - id: P02
    rule: "NEVER show a black/empty frame at any point in the video"
    reason: "V4 had black frames at start and between scenes. Every frame must have content."

  - id: P03
    rule: "NEVER show text outside the safe zone (keep within 864px width)"
    reason: "V4 had 'CONFIGURACOES' cut off at the edge."

  - id: P04
    rule: "NEVER show more than 4 words on screen simultaneously"
    reason: "V4 had 5-6 words stacked. Max 3 per line, max 2 lines."

  - id: P05
    rule: "NEVER mix the end of one sentence with the start of another in the same word group"
    reason: "V4 showed 'NADA VOLTANDO. VOCE' — crossing sentence boundaries."

  - id: P06
    rule: "NEVER place symbols BEHIND text with low opacity (<0.5)"
    reason: "V4 had dollar signs at 0.1-0.2 opacity behind text — invisible."

  - id: P07
    rule: "NEVER use a font other than Albert Sans"
    reason: "Brand consistency with Zape Ecomm."

  - id: P08
    rule: "NEVER use linear easing on any visible element"
    reason: "Linear motion looks robotic and cheap. Always spring physics."

  - id: P09
    rule: "NEVER use blur(), box-shadow, or filter: drop-shadow in Remotion"
    reason: "Performance killer. Use opacity and transforms only."

  - id: P10
    rule: "NEVER keep text in the same position for more than 2 consecutive word groups"
    reason: "Creates visual monotony. Alternate center/top/bottom."

  # CONTENT
  - id: P11
    rule: "NEVER invent words not in the copy"
    reason: "If copy says '4 configuracoes' without details, do NOT invent what they are."

  - id: P12
    rule: "NEVER use English words in on-screen text"
    reason: "Target audience is PT-BR sellers. Exception: proper nouns (Shopee, ROAS)."

  - id: P13
    rule: "NEVER use 'ficar rico rapido', 'dinheiro facil', 'esquema', or profanity"
    reason: "Meta Ads compliance + Neto's explicit brand rules."

  - id: P14
    rule: "NEVER use 'link na bio' in CTA — always 'botao'"
    reason: "This is Meta Ads (has CTA button), not organic Instagram."

  - id: P15
    rule: "NEVER make the CTA a wall of small text"
    reason: "V4 CTA was tiny unreadable paragraph. Max 2 lines, HUGE text."

  # AUDIO
  - id: P16
    rule: "NEVER deliver a video without narration audio"
    reason: "V2 came without voice. Audio is mandatory."

  - id: P17
    rule: "NEVER let SFX or music volume exceed narration volume"
    reason: "Narration is always primary. SFX at 0.25, music at 0.08."

  # TIMING
  - id: P18
    rule: "NEVER hold a single scene for more than 3 seconds"
    reason: "Kills retention. Scene change every 2-3s maximum."

  - id: P19
    rule: "NEVER end the video on a non-CTA frame"
    reason: "V4 ended on empty frame. Last visible frame must be the CTA."

  - id: P20
    rule: "NEVER use colors outside the brand palette for primary elements"
    reason: "Zape identity: #A3E635 + #0A0A0A + grays + #FFFFFF. No purple, blue, orange."
```

---

## 13. QA CHECKLIST

Pre-render verification. Run BEFORE every render. Organized by priority.

```yaml
qa_checklist:

  critical:  # Render BLOCKED if any fail
    - id: QA01
      check: "First frame has visual content (not black/empty)"
      how: "Inspect frame 0 — must show background + first word entering"

    - id: QA02
      check: "Last frame shows CTA (green background + action text)"
      how: "Inspect final frame — must be #A3E635 background with #0A0A0A text"

    - id: QA03
      check: "ZERO black/empty frames in entire video"
      how: "Scan all frames — every frame has at minimum the animated background"

    - id: QA04
      check: "All text within safe zone (max 864px width)"
      how: "Verify no text element exceeds x:108 to x:972 bounds"

    - id: QA05
      check: "Audio narration present and synced to words"
      how: "Play video — every word on screen matches spoken word within 100ms"

    - id: QA06
      check: "All on-screen text is PT-BR (zero English)"
      how: "Read every word group — no English except proper nouns"

    - id: QA07
      check: "No prohibited phrases in text or audio"
      how: "Search for: 'rico rapido', 'dinheiro facil', 'esquema', profanity"

    - id: QA08
      check: "Copy fidelity — zero invented words"
      how: "Compare every word group to source copy — 1:1 match"

    - id: QA09
      check: "Resolution is 1080x1920 at 30fps"
      how: "Check render output metadata"

    - id: QA10
      check: "CTA mentions 'botao' (not 'link na bio')"
      how: "Read CTA word groups — must reference the button"

  high:  # Fix if possible before delivery
    - id: QA11
      check: "Word groups contain complete logical phrases (no cross-sentence mixing)"
      how: "Read each group — must make sense as standalone phrase"

    - id: QA12
      check: "Max 4 words per word group"
      how: "Count words in each group"

    - id: QA13
      check: "Every word group has a visible symbol (opacity >= 0.6, size >= 324px)"
      how: "Verify symbolMap has entry for each group, check render"

    - id: QA14
      check: "Text position varies (not all center)"
      how: "Check position field — no more than 2 consecutive 'center'"

    - id: QA15
      check: "Background color shifts per section (hook/problem/result/mechanism/cta)"
      how: "Verify section field in each word group, check overlay colors in render"

    - id: QA16
      check: "Scene changes every 2-3s (no scene > 3s)"
      how: "Calculate endTime - startTime for each group — all <= 3.0"

    - id: QA17
      check: "Font is Albert Sans throughout"
      how: "Verify fontFamily in all text components"

    - id: QA18
      check: "Flash transitions between every word group (no hard cuts)"
      how: "Check FLASH component fires between each group"

  medium:  # Nice to have
    - id: QA19
      check: "SFX present at section transitions"
      how: "Listen for whoosh/impact sounds at hook->problem, problem->result, etc."

    - id: QA20
      check: "Background music present at low volume"
      how: "Listen for ambient music bed (barely audible)"

    - id: QA21
      check: "Counter animation on numbers in copy"
      how: "Check if numeric emphasis words use counter component"

    - id: QA22
      check: "Highlight box on max 5 key words"
      how: "Count highlight boxes — should be 3-5, never more"

    - id: QA23
      check: "Total duration within 30-55 seconds"
      how: "Check video duration metadata"

    - id: QA24
      check: "Pulse ring animation in CTA section"
      how: "Verify pulse_ring component renders in CTA frames"
```

---

## 14. REFERENCE VIDEOS

The 5 approved visual references and what to extract from each.

```yaml
references:
  - name: "Burger King Rebrand"
    url: "https://www.youtube.com/watch?v=SKnHN_e6dQY"
    what_to_take:
      - "Bold typography synced to beat — words ARE the visual event"
      - "Colorful accent flashes on dark backgrounds"
      - "Fast transitions between typographic compositions"
      - "High energy, celebratory feel"
    what_to_ignore:
      - "Multi-color palette — we use only lime green + white + grays"
      - "Horizontal format — we are 9:16 vertical"

  - name: "TIDAL Brand Refresh"
    url: "https://www.youtube.com/watch?v=UrGSBCQsGOY"
    what_to_take:
      - "Kinetic bold typography with vibrant energy"
      - "Text-driven storytelling — words carry the entire visual"
      - "Movement and rhythm synced to audio"
      - "Premium feel despite simplicity"
    what_to_ignore:
      - "Blue/teal color scheme — we use lime green"
      - "Music industry aesthetic — we are e-commerce education"

  - name: "Apple - Don't Blink"
    url: "https://www.youtube.com/watch?v=brDJMk0oQJE"
    what_to_take:
      - "Dark background, minimalist typography, extreme speed"
      - "The CONTRAST: ultra-fast body vs moments of stillness"
      - "Premium feel through restraint and space"
      - "Each frame is intentional — zero waste"
    what_to_ignore:
      - "Product showcase elements — we have no physical product to show"
      - "Horizontal cinematic format"

  - name: "Apple - Carbon Neutral 2030"
    url: "https://www.youtube.com/watch?v=QNv9PRDIhes"
    what_to_take:
      - "Dark, clean background with strategic text placement"
      - "Large legible text with generous spacing"
      - "Slow, deliberate pacing in key moments (our CTA model)"
      - "Data/numbers presented with visual weight"
    what_to_ignore:
      - "Corporate/environmental messaging tone"
      - "Very slow overall pace — we only slow down for CTA"

  - name: "Slack AI - New Day"
    url: "https://www.youtube.com/watch?v=jm_9u0zfFl8"
    what_to_take:
      - "Tech/dark aesthetic with smooth transitions"
      - "Fast typography with professional polish"
      - "Clean, minimal visual elements supporting text"
      - "The FLUIDITY — nothing feels jarring despite high speed"
    what_to_ignore:
      - "SaaS/enterprise messaging"
      - "Purple/blue tech color palette"

  rejected:
    - name: "Audi A1"
      reason: "Too chaotic — visual noise without hierarchy. We need controlled chaos."
    - name: "McDonald's Star Wars"
      reason: "Doesn't fit the brand energy or visual style."
```

---

## 15. PRODUCTION PIPELINE

7 phases from briefing to delivery. Each phase has explicit input, process, output, and tools.

```yaml
pipeline:
  phase_1:
    name: "Briefing & Conceito"
    input: "Raw briefing from user OR winner analysis from Max agent"
    process:
      - "Define angle (ROAS, simplicidade, prova social, curiosidade, medo de perder, exclusividade)"
      - "Choose section structure: Hook (3s) + Problem + Result + Mechanism + CTA (6s)"
      - "Map emotional arc: intrigue -> pain -> hope -> credibility -> action"
    output: "Concept doc with angle, emotional arc, section breakdown"
    tools: ["Claude (analysis)"]
    duration_minutes: 5

  phase_2:
    name: "Copy & Roteiro"
    input: "Concept doc"
    process:
      - "Write or receive copy (150-220 words)"
      - "Validate: Shopee in hook, botao in CTA, zero English, compliance check"
      - "Split into word groups: max 4 words each, logical phrases, section tagged"
      - "Assign emphasis words, symbol type, and position per group"
      - "Generate 10 variations if requested (different hooks and angles)"
    output: "wordGroups JSON with all metadata"
    tools: ["Claude (copywriting)"]
    duration_minutes: 10

  phase_3:
    name: "Narracao (Voz IA)"
    input: "Full copy text"
    process:
      - "Generate narration via ElevenLabs API (eleven_v3 model)"
      - "Request word-level timestamps"
      - "Validate: all words present in timestamps, timing makes sense"
      - "If total duration too long, slightly accelerate (max 1.15x speed)"
    output: "Audio MP3 + word timestamps JSON"
    tools: ["ElevenLabs API"]
    duration_minutes: 3

  phase_4:
    name: "Word-Audio Sync"
    input: "wordGroups JSON + audio timestamps JSON"
    process:
      - "Map each word group to exact audio timestamps"
      - "Calculate frame numbers: startFrame = Math.round(startTime * 30)"
      - "Verify no group exceeds 3 seconds"
      - "Verify no gaps between groups (continuous audio coverage)"
      - "Assign section transitions at correct frame boundaries"
    output: "Synced props JSON with frame-accurate timing"
    tools: ["Node.js script"]
    duration_minutes: 2

  phase_5:
    name: "Composicao Visual"
    input: "Synced props JSON"
    process:
      - "Load Remotion SyncedMotion template"
      - "Configure 4 layers: AnimatedBackground, SymbolRenderer, WordDisplay, Audio"
      - "Apply this visual style guide to all components"
      - "Run QA checklist (section 13) on props BEFORE render"
      - "Fix any QA failures"
    output: "Final props JSON ready for render"
    tools: ["Remotion, TypeScript"]
    duration_minutes: 5

  phase_6:
    name: "Renderizacao"
    input: "Final props JSON + SyncedMotion template"
    process:
      - "npx remotion render synced-motion --props temp/props.json --output output/video.mp4"
      - "Monitor render progress"
      - "If render fails: check error, fix, re-render"
    output: "MP4 file (1080x1920, 30fps, H.264, CRF 18)"
    tools: ["Remotion CLI"]
    duration_minutes: 5

  phase_7:
    name: "QA & Entrega"
    input: "Rendered MP4"
    process:
      - "Visual QA: watch full video, check every item in QA checklist"
      - "If any CRITICAL item fails: go back to relevant phase and fix"
      - "If all CRITICAL pass: approve"
      - "Send to Telegram for Neto review"
      - "Log to Supabase (render_jobs + creatives tables)"
      - "If approved: hand off to Leo agent for campaign upload"
    output: "Approved video + metadata for Leo"
    tools: ["Telegram bot, Supabase"]
    duration_minutes: 3

  total_estimated_time: "33 minutes per video (first render)"
  batch_efficiency: "After first video, subsequent variations take ~15 minutes each"
```

---

## CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-28 | Initial version. Based on 5 approved references, V4 audit feedback, and Remotion technical research. |
