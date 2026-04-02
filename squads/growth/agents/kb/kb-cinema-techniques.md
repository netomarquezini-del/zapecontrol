# Cinema & Film Techniques for Short-Form Video Ads (15-60s)
## Advanced Knowledge Base for Programmatic Video Creation

> Reference document for AI video generation agents. Every technique includes
> implementation parameters suitable for programmatic/code-driven video pipelines
> (Remotion, FFmpeg, After Effects expressions, GLSL shaders, CSS animations).

---

## 1. CINEMATIC COMPOSITION FOR MOBILE (9:16)

### 1.1 Rule of Thirds -- Vertical Adaptation

Traditional rule of thirds places subjects at intersection points on a 3x3 grid.
In vertical (1080x1920), the grid changes behavior:

| Zone | Y Range (px) | Purpose | Why |
|------|-------------|---------|-----|
| Top Third | 0-640 | Hook text, brand logo | Eye enters here first on scroll |
| Center Third | 640-1280 | Subject face / product hero | Natural focal point |
| Bottom Third | 1280-1920 | CTA, price, caption area | Thumb zone on mobile; Instagram/TikTok UI overlays here |

**Key intersection points (1080x1920):**
- Top-left: (360, 640) -- secondary text placement
- Top-right: (720, 640) -- logo / badge
- Center-left: (360, 960) -- subject eye line (most powerful point)
- Center-right: (720, 960) -- product placement beside subject
- Bottom-left: (360, 1280) -- price tag / social proof
- Bottom-right: (720, 1280) -- CTA button

**Implementation note:** Place the subject's eyes at y=860-960 for maximum
engagement. Eye-tracking studies on mobile show this zone gets 2.3x more
fixation than any other area in vertical video.

**Safe zones:** Keep critical content within 810px wide (center 75%) and between
y=200 and y=1680 to avoid platform UI overlap (status bar, TikTok buttons,
Instagram captions).

### 1.2 Leading Lines in Portrait Format

Vertical format transforms how leading lines work:

| Technique | Implementation | Best For |
|-----------|---------------|----------|
| **Vertical convergence** | Lines from bottom corners converging to subject at center | Product reveals, authority shots |
| **Diagonal slash** | 30-45 degree line from bottom-left to top-right | Energy, dynamism, progress |
| **S-curve** | Sinusoidal path starting bottom-center, weaving up | Journey narratives, before/after |
| **Frame-within-frame** | Doorway, phone screen, mirror creating inner rectangle | Isolation, focus, premium feel |
| **Radial burst** | Lines emanating from product center outward | Product hero shots, explosion reveals |

**Programmatic implementation:**
- Use gradient overlays with directional blur (angle parameter) to simulate leading lines
- Animated lines: draw SVG paths with stroke-dashoffset animation (0 to pathLength over 0.5s)
- Background elements with motion blur in the direction of desired eye flow

### 1.3 Depth of Field Simulation

Real shallow DOF requires physical lenses. Programmatically:

**Technique 1: Layered Blur**
```
Layer stack (back to front):
  - Background: Gaussian blur radius 8-12px, scale 1.05x (slight zoom = distance feel)
  - Midground: Gaussian blur radius 2-4px
  - Subject: Sharp (blur 0px), slight edge sharpening (unsharp mask 0.5px)
  - Foreground element: Gaussian blur 6-8px, 40% opacity (bokeh particles optional)
```

**Technique 2: Bokeh Overlay**
- Circular bokeh: 20-40 soft circles, radius 15-40px, opacity 10-30%
- Place in top-right and bottom-left quadrants
- Animate with slow drift (0.5-1px/frame horizontal, subtle scale pulse)
- Color: sample from highlight color in scene + 20% saturation boost

**Technique 3: Vignette**
- Radial gradient from center (transparent) to edges (black, 30-50% opacity)
- Oval shape, 1.2:1.8 aspect ratio for vertical
- Draws eye to center subject

**Technique 4: Rack Focus Simulation**
- Transition blur from background-sharp/foreground-blurry to opposite
- Duration: 0.8-1.2 seconds
- Use ease-in-out curve
- Powerful for "reveal" moments -- blur subject, then snap to sharp

### 1.4 Framing Techniques for Small Screens

Mobile screens are 6-7 inches. Everything must read at arm's length:

| Technique | Description | When to Use |
|-----------|-------------|-------------|
| **Tight crop** | Face fills 60-70% of frame | Testimonials, emotional hooks |
| **Medium-close** | Chest-up, some environment | Product demos, talking head |
| **Product isolation** | Product centered, 40-50% frame, clean background | Hero shots, price reveals |
| **Split frame** | Screen divided vertically or horizontally, two visuals | Before/after, comparison |
| **Over-the-shoulder** | Camera behind person looking at product/screen | Tutorial feel, intimacy |
| **Dutch angle** | 10-15 degree tilt | Urgency, disruption, attention-grab in hooks |
| **Extreme close-up** | Texture, detail filling entire screen | Luxury, quality proof, ASMR feel |
| **Negative space** | Subject occupies only 30%, rest is solid color | Premium brands, text placement area |

**Critical rule:** On mobile, minimum readable text size is 48px at 1080w.
Anything smaller gets lost. Headlines should be 72-96px minimum.

### 1.5 Creating Cinematic Feel in 1080x1920

Cinema feel = specific combination of technical choices:

**Letterbox emulation:**
- Add 120-160px black bars top and bottom (effective frame becomes 1080x1600-1680)
- This triggers "movie" association in viewer's brain
- Use for premium/luxury products only -- reduces visible area

**Frame rate perception:**
- 24fps = cinematic (natural motion blur, filmic)
- 30fps = broadcast/standard
- 60fps = hyper-real, sports, tech demos
- For cinematic feel, render at 24fps with 180-degree shutter (1/48s motion blur simulation)

**Aspect ratio play within vertical:**
- Embed a 16:9 cinematic clip inside the vertical frame (pillarboxed)
- Surround with branded gradient or blurred duplicate
- Transition from 16:9 to full 9:16 as visual reveal

**Grain and texture:**
- Film grain overlay: 2-4% noise, organic pattern (not uniform digital noise)
- Animated at 24fps independently of content
- Slight desaturation: reduce saturation 10-15% from captured footage
- Subtle halation: soft glow on highlights, 2-3px radius, 15% opacity

**Light leaks and flares:**
- Anamorphic-style horizontal streak on bright areas
- Warm orange/amber color, 20-30% opacity
- Animate position slowly (2-3 second drift cycle)

---

## 2. COLOR GRADING & COLOR THEORY FOR ADS

### 2.1 Color Palettes That Convert (By Industry & Emotion)

**Research-backed color performance in digital ads:**

| Industry | Primary | Accent | Background | Conversion Lift |
|----------|---------|--------|------------|----------------|
| **E-commerce / Retail** | #FF6B35 (warm orange) | #004E89 (deep blue) | #FAFAFA | CTA in orange outperforms green by 21% (HubSpot) |
| **Finance / Fintech** | #1A2B4A (navy) | #00C9A7 (teal) | #F5F7FA | Trust blue + growth green signals security + opportunity |
| **Health / Wellness** | #4CAF50 (green) | #FF9800 (amber) | #FFFFFF | Green = natural/organic, amber = energy/vitality |
| **Tech / SaaS** | #6C5CE7 (electric purple) | #00D2FF (cyan) | #0D1117 | Dark mode + neon accents = modern/innovative |
| **Beauty / Fashion** | #C9A96E (gold) | #2D2D2D (charcoal) | #F8F0E3 | Gold = luxury, charcoal = sophistication |
| **Food / Delivery** | #E63946 (red) | #F4A261 (warm yellow) | #FFFDF7 | Red stimulates appetite, warm tones = comfort |
| **Education** | #2196F3 (blue) | #FFC107 (yellow) | #FFFFFF | Blue = trust/authority, yellow = optimism/clarity |
| **Fitness** | #FF2D55 (hot pink) | #1E1E1E (near-black) | #111111 | High contrast = intensity, energy |

### 2.2 Programmatic Color Grading (LUT-Style)

Apply color transforms via channel manipulation:

**Warm Cinematic (Orange & Teal -- the Hollywood look):**
```
Shadows:   Push blue +15, pull red -5
Midtones:  Push red +10, push green +5, pull blue -10
Highlights: Push orange (red+20, green+10), pull blue -15
Saturation: +10% global, +20% on orange/teal range
Contrast:  Lift blacks to 10/255, crush whites to 245/255
```

**Cold Corporate / Trust:**
```
Shadows:   Push blue +20, push cyan +10
Midtones:  Desaturate reds -30%, push blue +5
Highlights: Cool white (slight blue +5)
Saturation: -10% global, preserve blues
Contrast:  Higher contrast, blacks at 5/255
```

**Moody / Dramatic:**
```
Shadows:   Deep teal (blue +25, green +10)
Midtones:  Desaturate -20%, push warm slightly
Highlights: Soft amber (red +15, green +8)
Saturation: -25% global, selective boost on skin tones
Contrast:  High contrast, S-curve with crushed blacks
```

**Clean / Bright (E-comm product):**
```
Shadows:   Lift to 20/255 (no true blacks)
Midtones:  Slight warm push, saturation +15%
Highlights: Pure white, no color cast
Saturation: +20% product colors, -10% background
Contrast:  Low contrast, flat-lit feel
```

**Implementation via FFmpeg color curves:**
```
ffmpeg -i input.mp4 -vf "curves=r='0/0.05 0.5/0.55 1/0.95':g='0/0.03 0.5/0.52 1/0.93':b='0/0.08 0.5/0.48 1/0.85'" output.mp4
```

### 2.3 Color Psychology -- Specific Hex Combinations

Beyond basics, these specific combinations are proven performers:

| Emotion / Goal | Combo | Hex Values | Usage |
|---------------|-------|------------|-------|
| **Urgency + Trust** | Red + Navy | #E63946 + #1D3557 | Flash sale countdown overlays |
| **Premium + Warmth** | Gold + Cream | #C9A96E + #F5F0E8 | Luxury product reveals |
| **Fresh + Clean** | Mint + White | #A8E6CF + #FFFFFF | Health, organic, skincare |
| **Bold + Modern** | Electric purple + Black | #7C3AED + #111111 | Tech, SaaS, innovation |
| **Friendly + Energetic** | Coral + Bright Yellow | #FF6B6B + #FFE66D | Social apps, food, lifestyle |
| **Professional + Growth** | Slate + Emerald | #475569 + #10B981 | B2B, fintech, analytics |
| **Romantic + Soft** | Dusty Rose + Ivory | #D4A5A5 + #FFFBF0 | Beauty, wedding, feminine |
| **Power + Confidence** | Black + Gold | #1A1A1A + #D4AF37 | Luxury, authority, high-ticket |
| **Calm + Trustworthy** | Sage + Warm Gray | #9CAF88 + #E8E4E0 | Wellness, therapy, coaching |
| **Playful + Young** | Hot Pink + Electric Blue | #FF69B4 + #00D4FF | Gen Z targeting, trendy |

### 2.4 Color Temperature by Ad Section

Strategic color temperature shifts within a single ad:

| Section | Seconds | Temperature | Why | Hex Range |
|---------|---------|-------------|-----|-----------|
| **Hook** (0-3s) | 0-3 | Warm (5500-6500K emulation) | Warm colors grab attention, activate arousal | Overlay #FF6B0020 (orange, 12% opacity) |
| **Problem** (3-8s) | 3-8 | Cool/Desaturated (7500-9000K) | Cool = discomfort, problem state | Overlay #1A3A5C15 (steel blue, 8%) + saturation -15% |
| **Solution Intro** (8-15s) | 8-15 | Neutral transitioning warm | Bridge from problem to hope | Gradually animate overlay from cool to warm over 2s |
| **Demo/Proof** (15-35s) | 15-35 | Bright, saturated, clean | Product looks best, clarity, clean | Remove overlay, boost saturation +10%, whites crisp |
| **Social Proof** (35-45s) | 35-45 | Warm, authentic | Trust, human connection, warmth | Slight warm filter #F5E6D320, +5% saturation |
| **CTA** (45-60s) | 45-60 | High contrast, brand colors | Maximum visibility, brand recognition | Brand primary at full saturation, high contrast |

**Transition between temperatures:** Always ease over 1-2 seconds using
cubic-bezier(0.4, 0, 0.2, 1). Abrupt color shifts feel like mistakes.

### 2.5 How Top Brands Use Color in Video Ads

**Apple:** Near-monochromatic backgrounds (white, black, or single saturated
color). Product is the only colorful element. Forces eye to product. When using
colored backgrounds, they match the product color exactly (Purple iPhone on
purple background). Text is always white or black, never colored.

**Nike:** High contrast black and white with ONE accent color (usually Volt
#CDDC39 or their orange). Creates energy. Skin tones are always graded warm and
rich. Backgrounds tend toward dark, making athletes pop.

**Coca-Cola:** Everything red. Not subtle. #F40009 dominates every frame. They
own red so completely that even a red flash triggers brand recognition. In video
ads, red appears in at least 60% of every frame's area.

**Glossier:** Millennial pink (#F5C6C6) as through-line. Very low contrast,
soft, airy. Whites are slightly warm, never blue-white. Creates an aspirational
"effortless" feel.

**Samsung:** Blue (#1428A0) used as tech-authority anchor, then product colors
shine against neutral/dark backgrounds. Heavy use of gradient backgrounds
(blue-to-black) for premium positioning.

### 2.6 Seasonal Color Trends

| Season | Primary Palette | Accent | Feel |
|--------|----------------|--------|------|
| **Spring** | Pastels: #E8D5B7, #A8E6CF, #FFB7B2 | #FF6B6B (coral) | Fresh, renewal, light |
| **Summer** | Vibrant: #00B4D8, #FFD166, #EF476F | #06D6A0 (tropical green) | Energy, heat, vacation |
| **Autumn** | Earth: #BC6C25, #DDA15E, #606C38 | #283618 (forest) | Warm, cozy, harvest |
| **Winter** | Cool: #CAF0F8, #90E0EF, #0077B6 | #D4AF37 (gold) | Crisp, premium, festive |
| **Holiday** | Classic: #C41E3A, #2D5016, #D4AF37 | #FFFDD0 (cream) | Traditional, celebration |
| **Black Friday** | Dark: #1A1A1A, #FFD700, #FF0000 | #FFFFFF (white) | Urgency, value, premium |
| **Valentine's** | Romance: #FF1744, #F8BBD0, #880E4F | #FFD700 (gold) | Passion, love, desire |

---

## 3. KINETIC TYPOGRAPHY (ADVANCED TEXT ANIMATION)

### 3.1 Beyond Basic Pop-In: Advanced Text Effects

**LIQUID TEXT**
- Letters appear to be made of fluid, with surface tension and wobble
- Implementation: Apply sine-wave displacement to letter outlines
- Parameters: amplitude 3-5px, frequency 0.5Hz, phase offset per letter (index * 0.2)
- SVG filter: feTurbulence (baseFrequency=0.015, numOctaves=3) + feDisplacementMap (scale=10)
- Best for: Organic brands, beverages, beauty products

**3D TEXT (Extruded)**
- Text with visible depth/thickness
- Implementation: Stack 5-8 copies of text, each offset by (1px, 1px) in alternating dark shade
- Or: CSS transform perspective(800px) rotateY(15deg) with shadow layers
- Animate rotation on Y-axis: 0deg to 5deg oscillation for subtle 3D wobble
- Light source simulation: gradient on face vs shadow on sides
- Best for: Premium, bold statements, product names

**GLITCH TEXT**
- Text distorts with RGB split, slice displacement, scan lines
- Implementation layers:
  1. Base text (white)
  2. Red channel copy: offset x+3px, mix-blend-mode: screen
  3. Blue channel copy: offset x-3px, mix-blend-mode: screen
  4. Random horizontal slice displacement (5-8 slices, offset 2-10px) for 2-3 frames
  5. Scan line overlay (1px lines, 50% opacity, every 3px)
- Trigger: On beat/transition, flash glitch for 4-6 frames (0.16-0.25s at 24fps)
- Best for: Tech, gaming, urgency, disruption hooks

**NEON TEXT**
- Text with realistic neon glow effect
- Implementation:
  1. Base text: bright color (#FF006E or #00FFD1)
  2. Inner glow: same color, blur 2px, 100% opacity
  3. Outer glow: same color, blur 8px, 60% opacity
  4. Wide glow: same color, blur 20px, 30% opacity
  5. Subtle flicker: opacity oscillates between 85-100% at irregular intervals
- Background must be dark (#0A0A0A to #1A1A1A)
- Best for: Nightlife, entertainment, modern/edgy brands

**TYPEWRITER TEXT**
- Characters appear one at a time with cursor
- Timing: 40-60ms per character (16-25 chars/sec)
- Cursor: blinking rectangle, same color as text, 530ms blink cycle
- Variation: Add random delay (20-80ms jitter) for organic feel
- Sound design: pair with subtle key-click audio
- Best for: Tech, coding themes, building suspense in copy

### 3.2 Text That Follows Motion/Path

**Circular path text:**
- Place characters along arc using trigonometry
- Each character position: x = cx + r*cos(angle), y = cy + r*sin(angle)
- Rotate each character to be tangent to the circle
- Animate by incrementing start angle over time

**Wave path text:**
- Each character's Y offset: sin(charIndex * 0.5 + time * 2) * amplitude
- Amplitude: 10-20px for subtle wave, 30-50px for dramatic
- Creates "breathing" or "floating" text feel

**Follow-the-leader:**
- Text follows a bezier curve path
- Head character traces the path, each subsequent character follows with time delay
- Delay per character: 30-50ms
- Creates a flowing, organic reveal

**Orbit around product:**
- Text on circular path rotating around center product
- 3D perspective: scale characters smaller as they go "behind"
- Rotation speed: 8-12 seconds per full revolution
- Best for: feature callouts orbiting a product hero shot

### 3.3 Split-Text Animations

**Letter explosion:**
- Word displayed, then each letter gets independent physics
- Each letter: random velocity vector, random rotation speed
- Add gravity (y acceleration +2px/frame)
- Reverse for assembly effect (letters fly in from random positions)
- Duration: 0.5-0.8s for explosion, 0.8-1.2s for assembly

**Letter cascade:**
- Letters fall from top, one by one, landing in position
- Stagger: 40-60ms between letters
- Bounce on landing: overshoot final Y by 5px, spring back
- Easing: cubic-bezier(0.34, 1.56, 0.64, 1) for bounce

**Letter shuffle/scramble:**
- Display random characters cycling through (like airport departure board)
- Each position resolves to correct letter at staggered intervals
- Cycle speed: 30ms per random character
- Resolution stagger: 80-120ms between positions, left to right
- Best for: tech/crypto/data-driven brands

**Horizontal spread:**
- Letters start stacked on top of each other at center
- Spread out to final spacing with spring easing
- Duration: 0.4-0.6s
- Variation: spread from a single point (cursor position or product)

### 3.4 Morphing Text Transitions

**Word morph (one word transforms into another):**
- Match common letters between words, interpolate positions
- Unmatched letters: fade out / fade in during transition
- Duration: 0.6-1.0s
- Works best with same-length words or words sharing letters

**Scale morph:**
- Headline word scales up massively (300-500%) becoming background texture
- New text appears on top at normal scale
- Duration: 0.8-1.2s with ease-in-out

**Color morph:**
- Text cycles through brand colors or emotional colors
- Each word highlighted in sequence with color change
- Useful for listing features: each word pulses with a highlight color

**Shape morph:**
- Text outlines morph into a shape (product silhouette, logo, icon)
- Requires SVG path interpolation between text path and target shape
- Duration: 1.0-1.5s
- Very high production value feel

### 3.5 Text Reveal Techniques

| Technique | Description | Duration | Best For |
|-----------|-------------|----------|----------|
| **Mask wipe (left-to-right)** | Solid block moves right, revealing text behind | 0.3-0.5s | Headlines, clean reveals |
| **Mask wipe (bottom-to-top)** | Block moves up, line by line | 0.2-0.4s per line | Multi-line text, lists |
| **Blur-to-sharp** | Text starts at blur radius 20px, animates to 0 | 0.4-0.6s | Dramatic reveals, premium |
| **Scale-from-zero** | Text scales from 0% to 100% (+ slight overshoot) | 0.3-0.5s | Impact words, prices |
| **Clip from center** | Clip rectangle expands from center point | 0.3-0.4s | Balanced, premium |
| **Character mask** | Each character has its own mask, staggered reveal | 0.5-1.0s total | Elegant, high-end |
| **Fade up** | Opacity 0-to-1 combined with Y translation (+20px to 0) | 0.4-0.6s | Subtle, professional |
| **Rotation in** | Text rotates from -90deg to 0deg with fade | 0.3-0.5s | Dynamic, energetic |
| **Elastic pop** | Scale from 0 to 120% then settle to 100% | 0.4-0.6s | Fun, playful brands |
| **Stamp/slam** | Scale from 200% to 100% with slight shake | 0.2-0.3s | Urgency, impact, discounts |

### 3.6 Typography Hierarchy in Motion

**Three-tier system for video ads:**

| Tier | Role | Size (at 1080w) | Weight | Animation | Duration on Screen |
|------|------|-----------------|--------|-----------|-------------------|
| **Headline** | Primary message, hook text | 72-96px | Bold/Black (800-900) | Slam, wipe, or elastic pop | 2-4 seconds |
| **Subtext** | Supporting detail, features | 40-52px | Medium (500) | Fade up, 200ms after headline | 2-3 seconds |
| **Caption/Label** | Price, small detail, source | 28-36px | Regular (400) | Subtle fade, 400ms after subtext | Persistent or 2s |

**Sequencing rule:** Never show all tiers simultaneously from the start.
Stagger reveals: Headline first (0ms), subtext second (+200-400ms), caption last
(+400-800ms). This creates reading hierarchy and holds attention longer.

**Font pairing for ads:**
- Headline: Bold sans-serif (Montserrat Black, Inter Bold, Poppins Bold)
- Subtext: Medium weight of same family or complementary sans
- Caption: Light/regular weight, can be a secondary font
- Never use more than 2 font families in a single ad

---

## 4. ADVANCED TRANSITION LIBRARY

### 4.1 Complete Transition Catalog (30+ Types)

#### CUT FAMILY (0-frame transitions)
| # | Transition | Description | When to Use | Energy Level |
|---|-----------|-------------|-------------|-------------|
| 1 | **Hard cut** | Instant switch, no effect | Fast-paced content, beat sync | High |
| 2 | **Jump cut** | Same subject, slight position change | Energy, passage of time, TikTok style | High |
| 3 | **Match cut** | Visual element continues between scenes (shape, color, motion) | Storytelling, conceptual links | Medium |
| 4 | **Smash cut** | Abrupt cut from quiet to loud or vice versa | Comedy, shock, attention reset | Very High |
| 5 | **L-cut / J-cut** | Audio precedes or outlasts the visual cut | Narrative flow, professional feel | Low-Medium |

#### FADE/DISSOLVE FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 6 | **Cross dissolve** | Opacity blend between scenes | Duration: 0.5-1.0s | Low |
| 7 | **Fade to black** | Scene fades to black, new scene fades in | 0.3-0.5s each direction | Low |
| 8 | **Fade to white** | Flash to white, new scene emerges | 0.2-0.4s, high energy feel | Medium |
| 9 | **Color flash** | Brief flash of solid color (brand color) between scenes | Color duration: 2-4 frames (80-160ms) | High |
| 10 | **Additive dissolve** | Blend with additive blending (brighter overlap) | 0.4-0.8s, dreamy/ethereal | Low |

#### WIPE FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 11 | **Linear wipe** | Hard edge sweeps across (L-R, R-L, T-B, B-T) | Duration 0.3-0.5s, angle: 0/90/180/270 deg | Medium |
| 12 | **Diagonal wipe** | Edge sweeps at 45 degrees | Duration 0.3-0.5s, angle: 45/135/225/315 deg | Medium |
| 13 | **Circle wipe (iris)** | Circle expands from center or contracts to center | Start radius 0, end radius = diagonal/2 | Medium |
| 14 | **Diamond wipe** | Diamond shape expands from center | Rotated square mask expanding | Medium |
| 15 | **Clock wipe** | Edge sweeps like a clock hand | 0.5-1.0s, CW or CCW | Medium |
| 16 | **Star wipe** | Star shape expands (retro/playful) | 5-point star expanding from center | Low (playful) |
| 17 | **Heart wipe** | Heart shape reveals | Niche: romance/Valentine's themed | Low |

#### MOTION FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 18 | **Whip pan** | Scene blurs horizontally as if camera whipped | Motion blur 30-50px horizontal, 0.15-0.25s | Very High |
| 19 | **Whip tilt** | Same but vertical | Motion blur 30-50px vertical | Very High |
| 20 | **Zoom transition** | Scene zooms in rapidly, new scene zooms out from same point | Scale 1x to 3-5x, 0.2-0.4s | High |
| 21 | **Spin transition** | Scene rotates rapidly, blur, new scene unspins | 180-360deg rotation, 0.3-0.5s | Very High |
| 22 | **Push** | New scene pushes old scene off-screen | Direction: L/R/T/B, 0.3-0.5s | Medium |
| 23 | **Slide** | Old scene slides away, revealing new scene already there | 0.3-0.5s, with ease-out | Medium |
| 24 | **Parallax slide** | Multi-layer push at different speeds (BG slow, FG fast) | 3 layers, speed ratio 1:1.5:2 | Medium-High |

#### DIGITAL/STYLIZED FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 25 | **Glitch transition** | RGB split + slice displacement + noise burst | 4-8 frames, random seed per frame | Very High |
| 26 | **Pixel dissolve** | Scene breaks into pixels that rearrange to new scene | Block size: 8-32px, 0.5-0.8s | Medium-High |
| 27 | **Noise dissolve** | Perlin noise mask drives transition | Noise scale 50-100, threshold animates 0-1 | Medium |
| 28 | **Datamosh** | Intentional compression artifact look | Blend I-frames with P-frame motion vectors | Very High |
| 29 | **VHS/Tape** | Tracking lines, color bleed, static | Horizontal distortion + noise | High |

#### ORGANIC/FLUID FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 30 | **Liquid/Fluid** | Scene melts/flows into next like liquid | Displacement map with fluid sim or turbulence | Medium |
| 31 | **Ink bleed** | Black ink bleeds across frame, reveals new scene | Animated ink texture mask, 0.5-1.0s | Medium |
| 32 | **Smoke/Fog** | Smoke wafts across, revealing new scene | Particle system or animated fog texture | Low-Medium |
| 33 | **Paint stroke** | Brush strokes wipe across revealing new scene | Animated brush alpha mask, multiple strokes | Medium |

#### OBJECT-BASED FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 34 | **Product fill** | Product scales up to fill entire screen, then scene changes behind it, product scales down | Scale to 300-500%, 0.3s up, cut behind, 0.3s down | High |
| 35 | **Hand swipe** | Filmed hand swipes across camera | Requires asset: hand-swipe video with alpha | High |
| 36 | **Object throw** | Object is thrown toward camera, fills frame | Scale + motion blur + brief black/blur | Very High |
| 37 | **Phone frame** | Content appears inside a phone mockup that fills screen | Phone bezel mask, content composited inside | Medium |

#### MORPH FAMILY
| # | Transition | Description | Parameters | Energy |
|---|-----------|-------------|------------|--------|
| 38 | **Morph cut** | Subject smoothly morphs between two positions/expressions | Optical flow interpolation between frames | Low |
| 39 | **Shape morph** | Scene A crops into a shape that morphs into scene B's shape | SVG path animation between two shapes | Medium |
| 40 | **Color morph** | Scene A's dominant color floods frame, becomes scene B's background | Extract dominant color, expand, dissolve | Low-Medium |

### 4.2 When to Use Each Transition

**By ad section:**
- **Hook (0-3s):** Hard cut, jump cut, smash cut, glitch -- maximum energy to stop scroll
- **Problem statement (3-8s):** Cross dissolve, push, fade to desaturated -- convey discomfort
- **Solution/Demo (8-30s):** Match cut, zoom, product fill -- connect ideas, showcase product
- **Social proof (30-45s):** Whip pan between testimonials, slide -- pace and credibility
- **CTA (45-60s):** Color flash to brand color, zoom to CTA -- focus and urgency

**By brand energy:**
- **Luxury/Premium:** Dissolve, fade, morph cut, slow push -- nothing jarring
- **Tech/Startup:** Glitch, zoom, whip pan, parallax -- modern and dynamic
- **Lifestyle/Organic:** Liquid, ink bleed, smoke -- organic and natural
- **Retail/Sale:** Color flash, smash cut, spin -- urgency and energy
- **Educational:** L-cut/J-cut, match cut, push -- smooth narrative flow

### 4.3 Transition Performance Data

Based on aggregate analysis of high-performing video ads:

| Transition | Avg Watch-Through Rate Impact | Best Platform | Notes |
|-----------|------------------------------|---------------|-------|
| **Hard cut (beat-synced)** | +15-20% vs. no transitions | TikTok, Reels | Must sync to audio beat |
| **Zoom transition** | +12-18% | Instagram Reels | Creates momentum, prevents drop-off |
| **Whip pan** | +10-15% | TikTok | Feels native to platform |
| **Match cut** | +8-12% | YouTube Shorts, Facebook | Higher perceived production quality |
| **Cross dissolve** | -5% (feels slow) | Facebook (older demos) | Acceptable for 35+ audience |
| **Glitch** | +5-10% | TikTok, gaming audience | Overuse causes fatigue |
| **Product fill** | +20-25% on product focus metrics | Instagram, Facebook | Forces product visibility |
| **Color flash (brand color)** | +15% brand recall | All platforms | Brief (2-4 frames) is key |

**Key finding:** The highest-performing ads use 4-6 transitions in a 30-second
ad (one every 5-7 seconds). More than 8 transitions causes cognitive overload
and hurts completion rates. Fewer than 3 feels static and causes mid-roll
drop-off.

---

## 5. STORYTELLING MICRO-STRUCTURES FOR 30-60s

### 5.1 The Hero's Journey Compressed to 60 Seconds

Campbell's 17-stage monomyth compressed to 7 beats:

| Beat | Time | Stage | Content | Visual |
|------|------|-------|---------|--------|
| 1 | 0-3s | **Ordinary World** | Show the relatable status quo | Wide shot, mundane setting, warm but flat color |
| 2 | 3-8s | **Call + Refusal** | Problem appears, viewer recognizes frustration | Close-up on frustration, cool/desaturated grade |
| 3 | 8-15s | **Meeting the Mentor** | Product/brand introduced as the guide | Product reveal, lighting brightens, music lifts |
| 4 | 15-30s | **Crossing Threshold + Tests** | Using the product, showing the journey | Demo footage, multiple quick cuts, energy builds |
| 5 | 30-45s | **Ordeal + Reward** | The transformation / result | Before/after, metrics, testimonial, warm grade |
| 6 | 45-53s | **Return with Elixir** | New life with the product | Aspirational shot, full color, confident subject |
| 7 | 53-60s | **Call to Adventure (for viewer)** | CTA - your turn to begin | Direct address, CTA button, urgency |

### 5.2 Three-Act Structure in 30 Seconds

| Act | Time | Purpose | Technique |
|-----|------|---------|-----------|
| **Act I: Setup** | 0-8s | Establish context, hook, introduce conflict | Open with question or provocative statement. Show the "before." Fast cuts. |
| **Act II: Confrontation** | 8-22s | Present solution, demonstrate, build credibility | Product demo, features shown through use (not told). Medium pace. Social proof. |
| **Act III: Resolution** | 22-30s | Resolve conflict, show transformation, CTA | Result shown. Emotional payoff. Clear CTA. Single focus. |

**The critical ratio:** 27% setup, 47% confrontation, 27% resolution.
Many ads fail by spending too long on setup (boring) or too little on
confrontation (unpersuasive).

### 5.3 In Medias Res (Starting in the Middle)

Start with the most dramatic/interesting moment, then contextualize:

**Structure:**
```
0-3s:  CLIMAX MOMENT (result, reaction, transformation) -- the hook
3-8s:  "Let me show you how..." -- rewind indication (visual or verbal)
8-25s: The actual story/demo from beginning
25-30s: Return to climax moment (now it has context and meaning)
30-35s: CTA
```

**Implementation signals:**
- Visual "rewind" effect (video plays backward briefly, or glitch/time-stamp)
- Audio: record scratch, rewind sound, or beat drop
- Text overlay: "Wait, let me explain..." / "3 hours earlier..." / "Here's how"

**Why it works:** The human brain is wired to resolve open loops. Showing the
result first creates curiosity about the process. Average hook rate increase:
+25-40% compared to linear storytelling.

### 5.4 The "Day in My Life" Narrative Arc

UGC-native format, feels authentic:

| Beat | Time | Content | Visual Style |
|------|------|---------|-------------|
| 1 | 0-5s | Morning routine, relatable moment | POV or selfie cam, natural light, raw |
| 2 | 5-12s | Problem encounter (organic insertion) | Authentic frustration, handheld camera |
| 3 | 12-20s | Discovery/use of product (natural placement) | "Let me show you this thing I found" |
| 4 | 20-30s | Product in use, integrated into daily life | Clean shots of product but still casual |
| 5 | 30-40s | Result / how it changed the routine | Happiness, ease, satisfaction |
| 6 | 40-45s | Recommendation to viewer (breaking fourth wall) | Direct eye contact, genuine tone |

**Authenticity markers (programmatic):**
- Slight camera shake (2-4px random oscillation)
- Inconsistent lighting between scenes (different warmth)
- Ambient background noise (not silence)
- Text overlays in native platform font (Proxima Nova for Instagram, etc.)
- Aspect ratio: True 9:16, no letterboxing

### 5.5 Before/After Transformation Storytelling

Most powerful structure for product/service ads:

**Split-screen variant:**
```
0-5s:   Full screen "BEFORE" state (pain point, problem)
5-8s:   Wipe transition (left-to-right or diagonal) introducing "AFTER"
8-15s:  Split screen showing both simultaneously
15-20s: Product bridge (how you get from before to after)
20-25s: Full screen "AFTER" state (desired outcome)
25-30s: CTA
```

**Time-lapse variant:**
```
0-3s:   "Before" state (static or slow)
3-15s:  Time-lapse of transformation process (4-8x speed)
15-20s: "After" reveal (dramatic pause, then reveal)
20-25s: Product credit
25-30s: CTA
```

**Side-by-side comparison (vertical):**
- Top half: "Before" (desaturated, slightly blurry, low energy)
- Bottom half: "After" (saturated, sharp, vibrant)
- Divider line animated from top to bottom (reveals after state)

**Key principle:** The "before" state must be visually WORSE than reality
(desaturated, slightly dark, slower pace). The "after" state must be visually
BETTER (oversaturated, bright, faster/energetic). This visual contrast is
subconscious and amplifies perceived transformation.

### 5.6 Conflict-Resolution in 15 Seconds

The tightest narrative possible:

| Beat | Time | Content | Frame |
|------|------|---------|-------|
| **Conflict** | 0-3s | Single sharp statement of problem | Text: "Tired of X?" + visual of problem |
| **Twist** | 3-5s | "What if" or product intro | Quick cut, product enters frame |
| **Evidence** | 5-10s | One compelling proof point | Demo shot, testimonial clip, or statistic |
| **Resolution** | 10-13s | Result/transformation | After state, smile, success visual |
| **CTA** | 13-15s | Action step | CTA button, verbal prompt |

**Rhythm:** 1-1-2-1-1 beat pattern. The evidence section gets the most time
because it carries the persuasive weight.

### 5.7 Non-Linear Storytelling in Short-Form

Breaking chronological order for impact:

**Reverse chronology:**
```
0-5s:   End state (amazing result)
5-10s:  How they used the product
10-15s: When they discovered it
15-20s: What life was like before
20-25s: Return to end state (now emotionally loaded)
25-30s: "Start your story" CTA
```

**Parallel timelines:**
- Split screen showing two people/scenarios simultaneously
- One uses the product, one does not
- Diverging outcomes shown in real-time
- Converge at the end with CTA

**Fragmented/Puzzle:**
```
0-3s:   Fragment 3 (result glimpse)
3-6s:   Fragment 1 (beginning)
6-12s:  Fragment 2 (middle/demo)
12-18s: Fragment 3 full (result with context)
18-20s: CTA
```
Best for: Curiosity-driven hooks, Gen Z audience, TikTok.

**Loop structure:**
- The last frame visually matches the first frame
- Creates infinite loop effect native to social platforms
- Viewer may watch 2-3x without realizing, boosting watch time metrics
- Implementation: Match cut between last and first frame, ensure last 1s transitions
  smoothly to first 1s visually

---

## 6. VISUAL METAPHORS AND SYMBOLISM IN ADS

### 6.1 Communicating Complex Ideas in 2-3 Seconds

The goal: replace 10 seconds of explanation with 2 seconds of visual.

**Speed of understanding hierarchy:**
1. Universal icons (0.2s to process): checkmark=yes, X=no, arrow=direction
2. Cultural symbols (0.5s): thumbs up, heart, fire, rocket
3. Visual metaphors (1-2s): growth=ascending graph, speed=blur, safety=shield
4. Abstract associations (2-3s): freedom=open sky, complexity=tangled lines

**The "visual equation" technique:**
Show two images with a visual operator:
- [Problem image] + [Product] = [Solution image]
- Duration: 1s per element, total 3s
- The "+" can be a flash, zoom, or morphing transition
- Example: [Messy desk] + [App icon] = [Organized desk]

**Visual shorthand that requires zero explanation:**

| Concept | Visual | Implementation Time |
|---------|--------|-------------------|
| Fast/Quick | Blur + speed lines + motion trail | 1 element, 0.5s |
| Savings/Money | Coins falling, green upward arrows, piggy bank | 1-2s clip or animation |
| Growth | Plant sprouting, graph ascending, upward zoom | 1-2s animation |
| Security | Shield icon, lock, fortress, vault door | 0.5s icon or 1s clip |
| Ease/Simple | One-tap gesture, "easy" button, feather floating | 1s animation |
| Premium/Luxury | Gold particles, slow motion, black background | 2s atmosphere shot |
| Community | Multiple faces in grid, hands joining, crowd | 1-2s composite |
| Time saved | Clock hands spinning fast, hourglass flip, calendar pages | 1s animation |
| Stress relief | Knot untying, weight lifting off shoulders, exhale | 1-2s animation |
| Innovation | Light bulb, spark, neural network pattern | 0.5-1s animation |

### 6.2 Common Visual Metaphors (Expanded)

**GROWTH & PROGRESS**
- Seedling to tree (time-lapse feel) -- organic growth
- Staircase ascending -- step-by-step progress
- Rocket launch -- explosive growth (use sparingly, becoming cliche)
- Loading bar filling -- progress toward goal
- Mountain summit -- achievement, overcoming obstacles
- Sunrise/dawn -- new beginning, fresh start
- Butterfly emerging from cocoon -- transformation

**SPEED & EFFICIENCY**
- Light trails (long exposure simulation) -- fast movement
- Domino effect -- chain reaction, momentum
- Cheetah/falcon -- natural speed (avoid if overused in niche)
- Stopwatch freezing -- time captured/saved
- Snap of fingers -- instant results
- Bullet through apple (slow-mo) -- precision at speed

**CONNECTION & TRUST**
- Bridge between two sides -- connecting gaps
- Handshake -- partnership, deal
- Puzzle pieces fitting -- perfect fit, compatibility
- Safety net -- protection, reliability
- Anchor -- stability, grounding
- Root system of tree -- deep foundation, established

**PROBLEM & PAIN**
- Tangled headphones/wires -- complexity, frustration
- Rain cloud over person -- sadness, difficulty
- Maze/labyrinth -- confusion, being lost
- Cracked/dry ground -- drought, lack, need
- Sinking ship -- failing approach
- Alarm clock slamming -- interrupted, annoying, urgency

**FREEDOM & POSSIBILITY**
- Open door/gate -- new opportunity
- Bird taking flight -- liberation
- Chains breaking -- freedom from constraints
- Open road/horizon -- unlimited potential
- Blank canvas -- creative freedom
- Keys -- access, unlocking potential

### 6.3 Showing Transformation Without Words

**The morph technique:**
- Object A smoothly transforms into Object B using shape interpolation
- Example: Frown morphs into smile, old phone morphs into new phone
- Duration: 1-2s
- Requires SVG path morphing or pre-rendered morph sequence

**The reveal technique:**
- Surface is wiped/peeled/scraped away to reveal transformation underneath
- Example: Dull surface peels away revealing shiny/new surface
- Metaphor for: renewal, cleaning, uncovering truth
- Implementation: Animated mask with texture (peel, scratch, wipe)

**The side-by-side slide:**
- Single frame, divider line moves across the image
- Left of line: before state
- Right of line: after state
- Viewer controls perception by where the line is
- Duration: 2-3s for line to cross full frame

**The container fill:**
- Empty container (glass, bar, circle) fills with color/content
- Represents progress, completeness, value accumulation
- Animate fill from 0% to 100% with slight overshoot
- Color of fill = brand primary or positive outcome color

**The weight change:**
- Heavy visual (slow, dark, compressed, low position) transforms to
  light visual (fast, bright, expanded, elevated position)
- Represents: burden removed, problem solved, freedom gained
- Pair with audio: low drone transitioning to bright melody

### 6.4 Symbolic Color Usage

Beyond basic color psychology, how specific colors function as symbols:

| Color | Symbol | In Ad Context | Visual Implementation |
|-------|--------|---------------|----------------------|
| **Red** | Danger, passion, urgency | Flash red on countdown timers, "last chance" messaging | Red pulse overlay (10% opacity, 0.5s pulse) |
| **Gold** | Value, premium, achievement | Product highlights, price reveals for premium offers | Gold particle overlay, metallic text sheen |
| **Green** | Go, growth, money, health | "Safe to buy" signals, organic/health products, financial gains | Green checkmarks, green gradient transitions |
| **Blue** | Trust, calm, depth | Payment/security screens, tech interfaces, corporate trust | Blue tint on trust elements (testimonials, guarantees) |
| **White** | Purity, simplicity, space** | Clean product shots, minimalist brands, "clean" messaging | White flash transitions, negative space compositions |
| **Black** | Power, luxury, authority | Premium pricing, exclusive offers, bold statements | Black backgrounds, dark vignettes |
| **Purple** | Creativity, wisdom, mystique | Innovation reveals, premium-tier products | Purple gradient overlays on key moments |
| **Orange** | Energy, enthusiasm, action | CTAs, button highlights, "act now" elements | Orange glow on CTA, orange color flash transition |

**Symbolic color sequences (story through color alone):**
```
Problem arc:    Gray/desaturated --> deep blue --> black (darkest moment)
Solution arc:   Black --> amber/warm --> gold (enlightenment)
Trust arc:      Cold blue --> warm blue --> green (safe to proceed)
Urgency arc:    Neutral --> yellow (warning) --> red (act now)
```

---

## APPENDIX A: IMPLEMENTATION PRIORITY MATRIX

For programmatic video generation, implement in this order based on impact vs complexity:

| Priority | Technique | Impact | Complexity | Notes |
|----------|-----------|--------|------------|-------|
| P0 | Color grading by section | Very High | Low | Color curve transforms, overlay blending |
| P0 | Text hierarchy + staggered reveal | Very High | Low | Timing offsets + basic easing |
| P0 | Hard cut on beat | Very High | Low | Audio analysis + frame-accurate cuts |
| P1 | Whip pan / zoom transitions | High | Medium | Motion blur + scale transforms |
| P1 | Safe zone composition | High | Low | Margin/padding rules |
| P1 | Vignette + grain overlay | High | Low | Radial gradient + noise texture |
| P1 | Before/after narrative structure | High | Low | Template-based sequencing |
| P2 | Depth of field simulation | Medium | Medium | Layered blur compositing |
| P2 | Glitch text / RGB split | Medium | Medium | Channel offset + displacement |
| P2 | Product fill transition | Medium | Medium | Scale animation + compositing |
| P2 | In medias res structure | Medium | Low | Reordering template segments |
| P3 | Liquid text / morphing text | Medium | High | SVG path animation, shader-based |
| P3 | Match cuts | Medium | High | Requires visual similarity detection |
| P3 | Parallax transitions | Low-Medium | Medium | Multi-layer compositing |
| P3 | Loop structure | Medium | Medium | First/last frame matching |

## APPENDIX B: TIMING CHEAT SHEET

| Element | Minimum Duration | Optimal Duration | Maximum | Notes |
|---------|-----------------|------------------|---------|-------|
| Text on screen (3-5 words) | 1.5s | 2.0-2.5s | 3.0s | Assume 200ms to start reading |
| Text on screen (6-10 words) | 2.0s | 3.0-3.5s | 4.0s | Longer = boring; shorter = missed |
| Transition effect | 0.1s | 0.2-0.4s | 0.8s | Longer transitions feel sluggish |
| Scene/shot duration | 1.0s | 2.0-4.0s | 6.0s | <1s feels jarring; >6s causes drop |
| Product hero shot | 2.0s | 3.0-4.0s | 5.0s | Must be long enough to register |
| CTA display | 2.0s | 3.0-4.0s | 5.0s | Needs time for decision-making |
| Logo/branding | 1.0s | 1.5-2.0s | 3.0s | Opener or closer, not both (for short ads) |
| Hook (scroll-stop moment) | 0.5s | 1.0-2.0s | 3.0s | First frame must be visually arresting |

## APPENDIX C: AUDIO-VISUAL SYNC RULES

Audio-visual sync is what separates amateur from cinematic:

| Rule | Description |
|------|-------------|
| **Beat-sync cuts** | Major transitions land exactly on musical beats (downbeats, not upbeats) |
| **Rise-before-reveal** | Audio crescendo 0.5-1s before visual reveal creates anticipation |
| **Silence = power** | 0.3-0.5s of silence before the most important line/visual |
| **Bass = impact** | Low frequency hit (bass drop) paired with visual slam/impact text |
| **Mood match** | Minor key = problem section; major key = solution section |
| **Tempo = pacing** | Cut rhythm should match BPM of music (120 BPM = cut every 2 beats = 1s) |
| **Sound design layers** | Whoosh on transitions, click on text pop, subtle ambient under VO |

---

*This knowledge base is designed to be consumed by AI video creation agents.
Every technique includes specific parameters (px, seconds, hex values, ratios)
that can be directly translated into programmatic video generation code.*
