# Motion Graphics Library for AI Video Creation Agent
## Comprehensive Reference for Programmatic Video Effects with React/Remotion

> Target: Hollywood-level motion graphics generated entirely in code.
> Stack: React + Remotion + CSS + Canvas + SVG + WebGL

---

## TABLE OF CONTENTS

1. [Animation Libraries Compatible with Remotion](#1-animation-libraries-compatible-with-remotion)
2. [Motion Graphics Patterns for Ads](#2-motion-graphics-patterns-for-ads)
3. [Advanced Text Effects](#3-advanced-text-effects)
4. [Overlay and Compositing Effects](#4-overlay-and-compositing-effects)
5. [Image Animation Techniques](#5-image-animation-techniques)
6. [Programmatic Video Effects](#6-programmatic-video-effects)
7. [Sound-Reactive Visuals](#7-sound-reactive-visuals)
8. [Complexity Reference Matrix](#8-complexity-reference-matrix)
9. [Ad Type to Effect Mapping](#9-ad-type-to-effect-mapping)

---

## 1. ANIMATION LIBRARIES COMPATIBLE WITH REMOTION

### 1.1 Remotion Built-in Animation System (NATIVE - USE FIRST)

Remotion provides its own powerful animation primitives. These should be the default choice because they are frame-accurate and deterministic (critical for video rendering).

**Core Functions:**

| Function | Purpose | Key Parameters |
|---|---|---|
| `useCurrentFrame()` | Returns the current frame number | - |
| `interpolate()` | Maps a value from one range to another | inputRange, outputRange, extrapolation |
| `spring()` | Physics-based spring animation | fps, frame, config: {damping, stiffness, mass, overshootClamping} |
| `interpolateStyles()` | Interpolates CSS style objects | - |
| `Easing.*` | Easing curves (bezier, bounce, elastic, etc.) | - |

**Spring Configuration Presets for Common Effects:**

```
// Bouncy entrance (logo pop-in)
spring({ fps, frame, config: { damping: 8, stiffness: 200, mass: 0.5 } })

// Smooth slide (lower third)
spring({ fps, frame, config: { damping: 20, stiffness: 100, mass: 1 } })

// Snappy response (UI element)
spring({ fps, frame, config: { damping: 15, stiffness: 300, mass: 0.3 } })

// Heavy/dramatic (title card)
spring({ fps, frame, config: { damping: 12, stiffness: 80, mass: 2 } })

// No bounce, smooth deceleration
spring({ fps, frame, config: { damping: 30, stiffness: 100, mass: 1, overshootClamping: true } })
```

**Built-in Packages:**

| Package | Purpose | Install |
|---|---|---|
| `@remotion/noise` | Perlin noise (2D/3D) for organic movement | `npm i @remotion/noise` |
| `@remotion/motion-blur` | Motion blur and trail effects | `npm i @remotion/motion-blur` |
| `@remotion/three` | React Three Fiber bridge for 3D | `npm i @remotion/three three @react-three/fiber` |
| `@remotion/lottie` | Lottie animation playback | `npm i @remotion/lottie lottie-web` |
| `@remotion/rive` | Rive animation playback | `npm i @remotion/rive` |
| `@remotion/media-utils` | Audio analysis and visualization | `npm i @remotion/media-utils` |
| `@remotion/animation-utils` | interpolateStyles, makeTransform | `npm i @remotion/animation-utils` |

---

### 1.2 GSAP (GreenSock) + Remotion

**Compatibility: CONFIRMED WORKING** -- Official integration documented by Remotion.

**How the Bridge Works:**
1. Create a GSAP timeline with `paused: true`
2. On each Remotion frame, seek the timeline to `frame / fps`
3. GSAP handles the tweening, Remotion handles the rendering

**Key Pattern:**
```jsx
const timeline = useRef(gsap.timeline({ paused: true }));
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

useEffect(() => {
  timeline.current
    .to(elementRef.current, { x: 500, duration: 1, ease: "power2.out" })
    .to(elementRef.current, { opacity: 0, duration: 0.5 }, "+=0.5");
}, []);

// Seek timeline to current frame position
timeline.current.seek(frame / fps);
```

**GSAP Capabilities in Remotion:**
- Timeline orchestration (sequencing multiple animations)
- SplitText plugin (split text into chars/words/lines for staggered animation)
- ScrambleText plugin (Matrix-style text decode)
- MorphSVG plugin (morph one SVG shape to another)
- DrawSVG plugin (animate SVG stroke drawing)
- MotionPath plugin (animate along a path)
- ScrollTrigger: NOT applicable in Remotion (no scroll)
- Physics2D plugin: works for physics-based animation

**Caveat:** GSAP premium plugins (MorphSVG, SplitText, DrawSVG, ScrambleText) require a GSAP Club/Business license. Complex clip-path polygon animations can slow down Remotion's headless Chrome rendering -- prefer opacity/transform-based alternatives where possible.

**Complexity:** Medium
**Best For:** Complex multi-step timeline animations, professional motion design

---

### 1.3 Motion (formerly Framer Motion)

**Compatibility: LIMITED** -- No official Remotion integration. Framer Motion relies on its own animation loop and React lifecycle which conflicts with Remotion's frame-based rendering model.

**Workaround Approach:**
- Use Motion for designing animation concepts, then re-implement using Remotion's `interpolate()` and `spring()`
- Motion's spring physics model is similar to Remotion's -- parameters translate roughly

**When to Reference Motion:**
- Its spring presets and easing curves are excellent references for tuning Remotion springs
- Layout animation concepts (AnimatePresence, layoutId) can inspire Remotion scene transitions

**Recommendation:** Do NOT use as a direct dependency. Use Remotion native springs instead.

---

### 1.4 React Spring

**Compatibility: LIMITED** -- Like Framer Motion, react-spring has its own animation loop that does not sync with Remotion's frame-based system.

**Remotion Alternative:** Remotion's `spring()` function IS a physics-based spring. It provides equivalent functionality:
- `damping` = how quickly oscillation settles
- `stiffness` = spring tension (higher = snappier)
- `mass` = weight (higher = slower, more dramatic)

**Recommendation:** Use Remotion's native `spring()` which is frame-accurate.

---

### 1.5 Anime.js + Remotion

**Compatibility: CONFIRMED WORKING** -- Listed as official third-party integration.

**Bridge Pattern:** Similar to GSAP -- create a paused animation timeline, seek to current frame position.

**Capabilities:**
- CSS properties animation
- SVG attributes animation
- Staggered animations (cascade effects)
- Timeline sequencing
- Custom easing functions

**When to Use Over GSAP:** Lighter weight, simpler API for basic stagger/cascade effects. GSAP is better for complex professional timelines.

---

### 1.6 Lottie + Remotion

**Compatibility: NATIVE** -- `@remotion/lottie` is an official package.

**What Lottie Provides:**
- Pre-made vector animations designed in After Effects
- Icon animations, loading spinners, transitions, character animations
- Thousands of free animations on LottieFiles.com
- JSON-based, tiny file sizes, infinitely scalable

**Integration Pattern:**
```jsx
import { Lottie } from "@remotion/lottie";
import animationData from "./animation.json";

// Remotion syncs the Lottie playback to the current frame
<Lottie animationData={animationData} />
```

**Sources:** Load from staticFile(), remote URL with fetch + delayRender, or import JSON directly.

**Best For:**
- Quick icon animations (checkmarks, hearts, stars, loading spinners)
- Character/mascot animations
- Complex After Effects animations without re-coding
- Transition effects (wipes, reveals)

**Complexity:** Low (using pre-made), Medium (creating custom in After Effects/Bodymovin)

---

### 1.7 Rive + Remotion

**Compatibility: NATIVE** -- `@remotion/rive` is an official package.

**Advantages Over Lottie:**
- State machines (interactive logic built into the animation)
- Multiple artboards per file
- Input parameters (change colors, text, states dynamically)
- Smaller runtime than Lottie
- Better performance for complex animations

**Best For:**
- Interactive-style animations with multiple states
- Animations that need dynamic parameter changes (color themes, text)
- Complex character animations with bone-based rigging

**Complexity:** Medium

---

### 1.8 Three.js + React Three Fiber + Remotion

**Compatibility: NATIVE** -- `@remotion/three` provides `<ThreeCanvas>` component.

**Critical Rule:** Use `useCurrentFrame()` for ALL animation, NOT `useFrame()` from R3F. Remotion requires declarative, frame-based animation for scrubbing and rendering.

**Capabilities:**
- Full 3D scenes rendered to video
- GLTF/GLB model loading with `useGLTF()`
- Video as 3D texture with `useVideoTexture()`
- Physically-based rendering (PBR materials)
- Post-processing effects (bloom, depth of field, color grading)
- Spline integration (import from Spline 3D editor)
- Particle systems in 3D space
- 3D text with `@react-three/drei`

**Use Cases in Ads:**
- 3D product showcase (rotate, zoom, explode view)
- 3D text with lighting and reflections
- Device mockups in 3D (phone rotating to show app)
- Abstract 3D backgrounds (floating shapes, liquid blobs)
- 3D logo reveals with lighting effects

**Performance Note:** 3D rendering is heavy. Keep polygon count reasonable. Use instancing for particles. Test render times early.

**Complexity:** High

---

### 1.9 D3.js for Data Visualization in Video

**Compatibility: WORKS WITH CARE** -- D3 manipulates DOM directly, which conflicts with React's virtual DOM. Best approach: use D3 for calculations only, React for rendering.

**Pattern:**
```jsx
// Use D3 for data processing / scale calculations
const scale = d3.scaleLinear().domain([0, max]).range([0, height]);
const frame = useCurrentFrame();
const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });

// Animate bar height using Remotion's frame
const animatedHeight = scale(dataPoint) * progress;

// Render with React
<rect height={animatedHeight} />
```

**D3 Capabilities for Video:**
- Bar charts growing from zero
- Pie/donut charts filling up
- Line charts drawing progressively
- Treemaps morphing
- Geographic maps with animated paths
- Force-directed network graphs
- Sankey diagrams flowing

**Complexity:** Medium-High

---

### 1.10 Matter.js (Physics Engine)

**Compatibility: WORKS** -- Listed as official third-party integration.

**What It Provides:**
- 2D rigid body physics simulation
- Gravity, collisions, bouncing, friction
- Constraints and joints
- Sleeping and static bodies

**Use Cases in Ads:**
- Letters/logos falling and bouncing
- Confetti/object rain with realistic physics
- Product images stacking up
- "Breaking" or "exploding" elements
- Gravity-affected text or icons

**Integration:** Run Matter.Engine.update() per frame, read body positions, render with React.

**Complexity:** Medium-High

---

## 2. MOTION GRAPHICS PATTERNS FOR ADS

### 2.1 Logo Reveal Animations (25+ Styles)

| # | Style | Technique | Complexity |
|---|---|---|---|
| 1 | **Scale Pop** | Spring from scale(0) to scale(1) with bounce | Low |
| 2 | **Fade Rise** | Opacity 0->1 + translateY from below | Low |
| 3 | **Rotate In** | Rotate from -180deg + scale with spring | Low |
| 4 | **Blur Reveal** | Filter blur(20px) -> blur(0) + opacity | Low |
| 5 | **Slice Reveal** | Multiple horizontal slices slide in from alternating sides | Medium |
| 6 | **Mask Wipe** | CSS clip-path circle/polygon expanding to reveal | Medium |
| 7 | **SVG Path Draw** | Logo drawn stroke by stroke (stroke-dasharray animation) | Medium |
| 8 | **Particle Assemble** | Scattered particles converge to form logo shape | High |
| 9 | **Glitch Reveal** | Rapid glitch/distortion that stabilizes to reveal logo | Medium |
| 10 | **Liquid Morph** | SVG blob morphing into logo shape | High |
| 11 | **3D Flip** | Logo rotates in 3D from behind (rotateY 180->0) | Medium |
| 12 | **Typewriter Build** | Logo text typed character by character | Low |
| 13 | **Split Halves** | Logo splits into top/bottom halves that slide apart then together | Medium |
| 14 | **Neon Flicker** | Logo flickers with neon glow, stabilizes | Medium |
| 15 | **Shatter Reverse** | Shattered pieces reassemble into logo | High |
| 16 | **Zoom Through** | Camera zooms through a shape/tunnel to reveal logo | Medium |
| 17 | **Ink Bleed** | SVG displacement filter simulating ink spreading | Medium |
| 18 | **Light Sweep** | Bright light sweeps across logo surface | Medium |
| 19 | **Stagger Letters** | Each letter animates in separately with stagger | Medium |
| 20 | **Curtain Pull** | Two panels pull apart like curtains | Low |
| 21 | **Bounce Drop** | Logo falls from top with gravity bounce (Matter.js) | Medium |
| 22 | **Pixelate In** | Starts extremely pixelated, progressively sharpens | Medium |
| 23 | **Smoke/Fog Reveal** | Fog clears to reveal logo (noise-based mask) | High |
| 24 | **Elastic Stretch** | Logo stretches and snaps into place | Medium |
| 25 | **Mirror Reflection** | Logo appears with animated reflection below | Medium |

**Implementation Approach:**
- Low complexity: CSS transforms + Remotion `interpolate()` / `spring()`
- Medium complexity: CSS + SVG clip-paths, GSAP timelines
- High complexity: Canvas/WebGL, particle systems, physics engines

---

### 2.2 Lower Thirds (Name/Title Overlays)

| Style | Description | Technique |
|---|---|---|
| **Slide In Bar** | Colored bar slides in from left, text follows | CSS transform translateX + spring |
| **Expand Line** | Thin line expands, text fades up from below | Width animation + opacity/translateY |
| **Glass Card** | Frosted glass card slides up | backdrop-filter: blur() + slide animation |
| **Split Line** | Line splits into two, name appears between | Two elements with opposing translateX |
| **Corner Bracket** | L-shaped brackets frame the text | SVG path draw + text fade |
| **Underline Draw** | Name appears, underline draws beneath | Text opacity + SVG stroke animation |
| **Tag Style** | Colored tag slides in like a label | Transform + border-radius styling |
| **Minimal Fade** | Simple fade with subtle translateY | Opacity + translateY interpolation |
| **News Ticker** | Full-width bar with sliding text | Full-width bar + text translateX |
| **Gradient Wipe** | Text revealed by moving gradient mask | Linear-gradient mask animation |

**Implementation:** All achievable with CSS transforms + Remotion interpolate(). No external libraries needed.

**Complexity:** Low to Medium

---

### 2.3 Progress Bars and Loading Animations

| Pattern | Technique |
|---|---|
| **Linear fill** | `width` from 0% to target%, with color gradient |
| **Circular/radial** | SVG circle with `stroke-dashoffset` animation |
| **Step progress** | Multiple segments filling sequentially |
| **Liquid fill** | SVG wave + clip-path rising inside container |
| **Skeleton pulse** | CSS gradient animation simulating content loading |
| **Percentage counter** | Number counting paired with bar fill |

**Complexity:** Low

---

### 2.4 Counter/Number Animations

**Libraries:**
- `react-countup` -- simple count from A to B with easing
- `react-slot-counter` -- slot machine style digit roll (mechanical/premium feel)
- `react-animated-counter` -- smooth digit transitions
- Motion's `AnimateNumber` -- lightweight, works well with spring physics
- Manual with Remotion: `Math.round(interpolate(frame, [0, 90], [0, targetNumber]))`

**Styles:**
| Style | Description |
|---|---|
| **Simple count** | Number increments smoothly from 0 to target |
| **Slot machine roll** | Digits roll like a slot machine vertically |
| **Odometer** | Each digit rolls independently, mechanical style |
| **Spring overshoot** | Counts past target, springs back (creates excitement) |
| **Formatted** | R$ 50.000+ with currency/suffix appearing |
| **Stagger** | Each digit appears with a slight delay |

**Best For Ads:** Revenue numbers, student counts, result metrics, social proof

**Complexity:** Low

---

### 2.5 Particle Effects

| Effect | Library/Approach | Complexity |
|---|---|---|
| **Confetti** | `canvas-confetti` or `react-canvas-confetti` | Low |
| **Sparkles** | `tsparticles` or custom SVG particles | Medium |
| **Fire** | Canvas + noise-based particle system | High |
| **Smoke** | `@remotion/noise` + Canvas with alpha blending | High |
| **Fireworks** | `tsparticles` with fireworks preset or custom Canvas | Medium |
| **Snow** | CSS animation with random transforms or tsparticles | Low |
| **Rain** | CSS vertical lines with random delays/speeds | Low |
| **Bubbles** | SVG circles with spring-based floating motion | Medium |
| **Stars** | Random positioned elements with scale/opacity pulse | Low |
| **Dust motes** | Tiny particles with Brownian motion (noise2D) | Medium |

**tsParticles Approach:**
```
// tsparticles-react provides <Particles> component
// Configure particle count, shape, movement, color, opacity
// Works with Canvas renderer for performance
```

**Custom Canvas Approach:**
```
// For each frame:
// 1. Calculate particle positions based on frame number
// 2. Apply physics (gravity, wind, drag)
// 3. Draw to Canvas with globalAlpha for trails
// Use @remotion/noise for organic movement
```

**Complexity:** Low (presets) to High (custom physics)

---

### 2.6 Background Motion Patterns

| Pattern | Technique | Complexity |
|---|---|---|
| **Animated gradient** | CSS `background-position` or `hue-rotate` animation | Low |
| **Flowing waves** | SVG path with animated d attribute or CSS transforms | Medium |
| **Geometric grid** | CSS grid pattern with translateX/Y loop | Low |
| **Particle field** | Canvas particles floating slowly | Medium |
| **Noise texture** | `@remotion/noise` with noise2D mapped to colors | Medium |
| **Floating shapes** | Multiple divs with independent float animations | Low |
| **Gradient mesh** | Multiple radial gradients with animated positions | Medium |
| **Matrix rain** | Canvas columns of falling characters | Medium |
| **Aurora/Northern lights** | SVG blurred gradient blobs with slow movement | Medium |
| **Topographic lines** | SVG contour paths with draw animation | Medium |
| **Moving dots grid** | Grid of dots with wave displacement | Medium |
| **Bokeh circles** | Large blurred circles with slow drift and scale | Low |

**Implementation:** Most achievable with pure CSS + Remotion interpolate. For organic patterns, use `@remotion/noise`.

---

### 2.7 Icon Animations

| Icon | Animation Style | Technique |
|---|---|---|
| **Checkmark** | Draw on (path draws itself) | SVG stroke-dasharray + dashoffset |
| **Arrow** | Slide in direction + spring bounce | CSS transform + spring() |
| **Heart** | Scale pulse (beat effect) | Scale with sin() oscillation |
| **Star** | Spin + scale pop with sparkle burst | Rotate + scale + particle spawn |
| **Thumbs up** | Rise up + slight tilt | TranslateY + rotate |
| **Loading spinner** | Continuous rotation | CSS animation rotate 360deg |
| **Play button** | Morph from triangle to pause bars | SVG path morphing |
| **Notification bell** | Swing/wobble with spring | RotateZ oscillation with damping |
| **Download arrow** | Drop down + bounce | TranslateY with spring physics |
| **Emoji reactions** | Float up with scale + fade | TranslateY + scale + opacity |

**Best Approach:** Lottie for complex icon animations (thousands available free). SVG + CSS for simple, custom ones.

**Complexity:** Low to Medium

---

### 2.8 Chart/Graph Animations

| Chart Type | Animation | Technique |
|---|---|---|
| **Bar chart** | Bars grow from bottom up | Height interpolation, staggered timing |
| **Pie chart** | Segments fill clockwise | SVG stroke-dasharray on circle |
| **Donut chart** | Ring fills with percentage | Conic-gradient or SVG arc |
| **Line chart** | Line draws progressively | SVG path with stroke-dashoffset |
| **Area chart** | Fill rises like water | clipPath height animation |
| **Scatter plot** | Points pop in with spring | Scale from 0, staggered |
| **Gauge/speedometer** | Needle rotates to value | Rotate transform with spring |
| **Funnel** | Sections narrow progressively | Width animation, staged |
| **Horizontal bar race** | Bars race to their values | Width animation, reordering |

**Implementation:** D3 for data calculations + SVG rendering with Remotion interpolation. No need for charting libraries.

**Complexity:** Medium

---

### 2.9 Map Animations

| Effect | Technique |
|---|---|
| **Pin drop** | Scale from 0 + bounce spring at coordinates |
| **Route line draw** | SVG path with stroke-dashoffset progressive reveal |
| **Radius pulse** | Circle expanding from a point with opacity fade |
| **Region highlight** | SVG fill-opacity animation on geographic paths |
| **Zoom to location** | Scale + translate to center on a coordinate |
| **Multiple pins cascade** | Staggered pin drops across map |
| **Connection lines** | Animated lines between two points (bezier curves) |
| **Heat map pulse** | Color intensity oscillation on regions |

**Data Source:** GeoJSON for map shapes + D3-geo for projections.

**Complexity:** Medium-High

---

### 2.10 Device Mockups with Screen Animation

| Device | Approach | Complexity |
|---|---|---|
| **Phone (flat)** | CSS border/border-radius frame + content inside | Low |
| **Phone (3D perspective)** | CSS transform: perspective() + rotateY/X | Medium |
| **Phone (Three.js)** | 3D model with video texture on screen | High |
| **Laptop (flat)** | CSS shapes for base + screen | Medium |
| **Laptop (3D)** | Three.js model or CSS 3D transforms | High |
| **Tablet** | Similar to phone, larger proportions | Low-Medium |
| **Browser window** | CSS mockup of chrome/safari frame | Low |
| **App store listing** | Structured layout with ratings, screenshots | Medium |

**Screen Content Animation:**
- Scroll simulation (translateY the content inside the screen)
- App interaction replay (sequence of screen states)
- Typing simulation in search bars
- Notification pop-ups on device

**Best Template:** Remotion has an official React Three Fiber template with a phone mockup that supports video texture and configurable device parameters.

**Complexity:** Low (flat CSS) to High (3D model)

---

## 3. ADVANCED TEXT EFFECTS

### 3.1 3D Text with Shadows and Depth

**Approaches:**

A) **CSS text-shadow stacking** (simplest):
```css
text-shadow:
  1px 1px 0 #333,
  2px 2px 0 #333,
  3px 3px 0 #333,
  4px 4px 0 #333,
  5px 5px 10px rgba(0,0,0,0.4);
```
Animate by interpolating each shadow offset.

B) **CSS transform-style: preserve-3d** -- stack multiple copies of text with translateZ:
```css
transform-style: preserve-3d;
transform: rotateX(-10deg) rotateY(15deg);
```

C) **Three.js TextGeometry** -- true 3D text with lighting, reflections, materials. Use `@react-three/drei`'s `<Text3D>` component with `@remotion/three`.

| Approach | Quality | Performance | Complexity |
|---|---|---|---|
| CSS text-shadow | Good | Excellent | Low |
| CSS 3D transform | Good | Good | Medium |
| Three.js TextGeometry | Excellent | Heavy | High |

---

### 3.2 Neon/Glow Text Effect

**CSS Implementation:**
```css
color: #fff;
text-shadow:
  0 0 7px #fff,
  0 0 10px #fff,
  0 0 21px #fff,
  0 0 42px #0fa,
  0 0 82px #0fa,
  0 0 92px #0fa,
  0 0 102px #0fa,
  0 0 151px #0fa;
```

**Flicker Effect:** Animate opacity with irregular keyframes (0%, 18%, 20%, 50%, 52%, 100%) to simulate neon tube flicker.

**SVG Enhancement:** Use `<feGaussianBlur>` and `<feColorMatrix>` SVG filters for more controllable glow radius and color.

**Complexity:** Low (CSS), Medium (SVG filters with animation)

---

### 3.3 Handwriting Animation (SVG Path Drawing)

**Technique:** SVG `stroke-dasharray` and `stroke-dashoffset` animation.

```
1. Convert text to SVG paths (or use handwriting font converted to paths)
2. Calculate total path length with getTotalLength()
3. Set stroke-dasharray to total length
4. Animate stroke-dashoffset from total length to 0
5. Optionally fill in the text after stroke completes
```

**Remotion Implementation:**
```jsx
const frame = useCurrentFrame();
const pathLength = 1000; // measured
const drawProgress = interpolate(frame, [0, 90], [pathLength, 0], { extrapolateRight: "clamp" });

<path d="..." strokeDasharray={pathLength} strokeDashoffset={drawProgress} fill="none" stroke="#fff" />
```

**Enhancement:** Add a "pen" element that follows the path tip for realism.

**Complexity:** Medium

---

### 3.4 Scramble/Decode Text (Matrix-Style Reveal)

**Libraries:**
- GSAP `ScrambleTextPlugin` -- gold standard, configurable character sets
- `use-scramble` -- React hook, zero dependencies
- `react-text-scramble` -- component-based
- `react-text-animator` -- includes scramble + glitch + wave modes

**Custom Implementation in Remotion:**
```
For each character position:
  - Before reveal frame: show random character from charset
  - At reveal frame: show correct character
  - After reveal frame: show correct character

Stagger reveal frames left-to-right for classic decode effect.
Use interpolate() to calculate which characters are revealed at current frame.
```

**Character Sets:** `"!@#$%^&*" | "01" | "ABCXYZ" | "█▓▒░" | Japanese katakana`

**Complexity:** Low (with library), Medium (custom)

---

### 3.5 Liquid/Fluid Text Morphing

**Technique:** SVG `<feTurbulence>` + `<feDisplacementMap>` filters.

```
1. Create SVG text
2. Apply feTurbulence filter with animated baseFrequency
3. Use feDisplacementMap to distort text based on turbulence
4. Animate turbulence intensity from high to zero (text settles)
```

**Alternative:** GSAP MorphSVG to morph letter shapes between two words.

**Complexity:** Medium-High

---

### 3.6 Text with Video Fill (Text as Mask)

**Technique:** CSS `background-clip: text` or SVG mask.

**CSS Approach:**
```css
background: url(video.mp4); /* or use Remotion <Video> */
background-clip: text;
-webkit-background-clip: text;
color: transparent;
```

**SVG Approach:**
```svg
<defs>
  <mask id="textMask">
    <rect fill="black" width="100%" height="100%" />
    <text fill="white" font-size="120">YOUR TEXT</text>
  </mask>
</defs>
<foreignObject mask="url(#textMask)">
  <!-- Video or animated content here -->
</foreignObject>
```

**Remotion Note:** Position a `<Video>` component behind an SVG mask layer. The video plays synced to Remotion's frame, visible only through the text shape.

**Complexity:** Medium

---

### 3.7 Bouncing/Physics Text

**Approach A -- Matter.js:**
Each letter is a physics body. Drop them, let them bounce and settle. Read positions/rotations each frame to position React elements.

**Approach B -- Spring physics:**
```
Each letter gets a spring animation with:
  - Different delay (stagger)
  - Bounce (low damping)
  - Start from above (high Y) to resting position
```

**Approach C -- Sin wave:**
```
Each letter's Y position = baseY + sin(frame * speed + index * offset) * amplitude
Creates a continuous wave ripple through text.
```

**Complexity:** Low (spring), Medium (Matter.js)

---

### 3.8 Gradient Text with Animated Gradient

**CSS Implementation:**
```css
background: linear-gradient(90deg, #ff0080, #7928ca, #ff0080);
background-size: 200% 100%;
background-clip: text;
color: transparent;
/* Animate background-position with Remotion interpolate */
```

**Remotion:** Interpolate `backgroundPosition` from "0% 0%" to "100% 0%" over the desired frame range.

**Complexity:** Low

---

### 3.9 Text Explosion/Disintegration

**Technique:**
1. Split text into individual character `<span>` elements
2. On trigger frame, each character gets random velocity (x, y) + rotation
3. Apply gravity to y-velocity each frame
4. Fade opacity as characters fly outward
5. Optionally add particle trail on each character

**Enhancement:** Use Canvas to draw tiny particles emanating from each character position during explosion.

**Complexity:** Medium-High

---

### 3.10 Typewriter with Cursor

**Implementation:**
```jsx
const frame = useCurrentFrame();
const text = "Your message here";
const charsPerFrame = 0.5; // speed control
const visibleChars = Math.floor(frame * charsPerFrame);
const displayText = text.slice(0, visibleChars);
const cursorVisible = Math.floor(frame / 15) % 2 === 0; // blink every 15 frames

return <span>{displayText}{cursorVisible ? "|" : " "}</span>;
```

**Variations:**
- Backspace and retype (simulate correction)
- Multiple lines with newline pauses
- Variable speed (faster for common words, slower for emphasis)
- Sound effect sync (key click per character)

**Complexity:** Low

---

## 4. OVERLAY AND COMPOSITING EFFECTS

### 4.1 Light Leaks and Lens Flares

**Programmatic Approach:**
```
1. Create multiple radial gradients with warm colors (orange, yellow, red)
2. Apply CSS mix-blend-mode: screen (or overlay/soft-light)
3. Animate position, scale, and opacity over time
4. Use @remotion/noise for organic movement paths
```

**Parameters:**
- Color: warm (orange/amber) for vintage, cool (blue/cyan) for modern
- Intensity: control via opacity
- Shape: radial gradients for flares, linear for streaks
- Movement: slow drift with noise-based paths

**Alternative:** Pre-rendered light leak video overlays with `mix-blend-mode: screen`

**Complexity:** Medium

---

### 4.2 Bokeh/Depth-of-Field Overlays

**CSS Approach:**
```
Multiple large circles (100-300px) with:
  - background: radial-gradient(circle, rgba(255,255,255,0.3), transparent)
  - filter: blur(2-5px)
  - Slow random float animation
  - Various sizes for depth illusion
  - mix-blend-mode: overlay
```

**Canvas Approach:** Draw circles with varying radius, alpha, and blur on Canvas. Animate positions with noise.

**Complexity:** Low

---

### 4.3 Film Grain and Noise Textures

**CSS Approach (Performant):**
```css
.grain::after {
  content: "";
  position: absolute;
  inset: -50%;
  background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
  opacity: 0.05;
  animation: grain 0.5s steps(6) infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

**Canvas Approach (Higher Quality):**
```
For each frame:
  - Fill canvas with random per-pixel grayscale noise
  - Control intensity with globalAlpha (0.02-0.08 for subtle)
  - Use mix-blend-mode: overlay for natural integration
  - Vary seed per frame for animation
```

**@remotion/noise Approach:**
```
Use noise2D with varying seed per frame
Map noise values to grayscale pixel values
Render to Canvas overlay
```

**Complexity:** Low (CSS), Medium (Canvas)

---

### 4.4 Vignette Effects

**CSS Implementation (Simplest):**
```css
box-shadow: inset 0 0 150px 60px rgba(0,0,0,0.7);
```

**Radial Gradient (More Control):**
```css
background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%);
```

**Animated Vignette:** Interpolate the spread/opacity to pulse or intensify at dramatic moments.

**Complexity:** Low

---

### 4.5 Duotone/Color Wash Effects

**CSS Implementation:**
```css
filter: grayscale(100%);
/* Then overlay with a colored element using mix-blend-mode */
```

**SVG Filter Approach:**
```svg
<feColorMatrix type="matrix" values="
  R1 R2 R3 0 0
  G1 G2 G3 0 0
  B1 B2 B3 0 0
  0  0  0  1 0" />
```

**Animate:** Transition between two color matrices over time for color shift effect.

**Complexity:** Low-Medium

---

### 4.6 Glitch/Distortion Effects

**CSS Glitch (Text/Elements):**
```
1. Create 2-3 copies of the element (pseudo-elements)
2. Offset each copy slightly in X direction
3. Apply clip-path with rapidly changing inset values
4. Tint each copy with different color channels (red, cyan)
5. Animate with irregular timing (random clip-path values per frame)
```

**RGB Split:**
```css
.red { color: red; mix-blend-mode: multiply; transform: translate(-3px, 1px); }
.cyan { color: cyan; mix-blend-mode: multiply; transform: translate(3px, -1px); }
```

**Screen Tear:** Horizontal slices with offset translateX values that change per frame.

**Complexity:** Medium

---

### 4.7 VHS/Analog Distortion

**Components to Layer:**
1. **Scan lines:** Repeating 2px horizontal lines with subtle opacity
2. **Color bleeding:** Slight horizontal RGB offset (like glitch but permanent)
3. **Noise overlay:** Film grain with higher intensity
4. **Tracking lines:** Horizontal white bars that drift vertically
5. **Chromatic aberration:** Red and blue channel offset by 2-4px
6. **Warped edges:** Slight barrel distortion at edges
7. **Timestamp overlay:** "REC" + blinking red dot + date in VHS font
8. **Interlace lines:** Alternating line opacity

**All achievable with CSS layers + Canvas. No WebGL needed.**

**Complexity:** Medium

---

### 4.8 Smoke/Fog Overlays

**Approach:**
```
1. Use @remotion/noise with noise2D
2. Create multiple "cloud" layers with different speeds
3. Apply Gaussian blur (CSS filter: blur())
4. Animate translateX slowly for drift
5. Low opacity (0.1-0.3) with white or light gray
6. mix-blend-mode: screen for light fog, normal for dense
```

**Alternative:** Multiple large SVG circles with blur, animated with different speeds for parallax depth.

**Complexity:** Medium

---

### 4.9 Rain/Snow Particle Overlays

**Rain (CSS approach):**
```
Multiple small white divs (1px x 15px):
  - Absolute positioned at random X
  - TranslateY animation from -10% to 110%
  - Slight angle (transform: rotate(5deg))
  - Random animation-delay and duration for variety
  - Motion blur: filter blur(0.5px) in Y direction
```

**Snow (CSS approach):**
```
Small circles (3-8px) with:
  - Slow downward translateY
  - Gentle horizontal sin() oscillation
  - Random sizes for depth
  - Slight blur on larger particles
```

**For Remotion:** Calculate particle positions deterministically from frame number so renders are consistent.

**Complexity:** Low-Medium

---

## 5. IMAGE ANIMATION TECHNIQUES

### 5.1 Ken Burns Effect (Advanced Variations)

**Basic Ken Burns:**
```jsx
const frame = useCurrentFrame();
const scale = interpolate(frame, [0, durationFrames], [1, 1.3]);
const translateX = interpolate(frame, [0, durationFrames], [0, -50]);
const translateY = interpolate(frame, [0, durationFrames], [0, -30]);

<Img style={{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }} />
```

**Advanced Variations:**

| Variation | Description |
|---|---|
| **Zoom In + Pan Left** | Classic documentary feel |
| **Zoom Out (reveal)** | Starts close, zooms out to reveal full scene |
| **Slow Pan** | No zoom, horizontal or vertical drift |
| **Focus Pull** | Combine zoom with blur transition |
| **Multi-point** | Zoom to detail A, pause, pan to detail B |
| **Spring Ken Burns** | Apply spring easing for organic start/stop |
| **Breathing** | Subtle scale oscillation (sin wave, 1.0-1.03) |
| **Dramatic Zoom** | Fast zoom into a face/product detail |

**Complexity:** Low

---

### 5.2 Parallax Effect on Single Images (2.5D)

**Technique:**
1. Separate image into layers (foreground, subject, background) -- can be done with AI depth estimation or manual masking
2. Place layers at different z-depths
3. Animate camera position (slight translateX/Y)
4. Each layer moves proportional to its depth

**Implementation in Remotion:**
```jsx
const frame = useCurrentFrame();
const cameraX = interpolate(frame, [0, 90], [-20, 20]);

// Background moves least
<div style={{ transform: `translateX(${cameraX * 0.3}px)` }}><Img src={bg} /></div>
// Midground
<div style={{ transform: `translateX(${cameraX * 0.6}px)` }}><Img src={mid} /></div>
// Foreground moves most
<div style={{ transform: `translateX(${cameraX * 1.0}px)` }}><Img src={fg} /></div>
```

**AI Depth Map Approach:** Use an AI model to generate a depth map from a single image, then use it as a displacement map in WebGL/Three.js to create true 3D parallax from a flat image.

**Complexity:** Medium (manual layers), High (AI depth map)

---

### 5.3 Cinemagraph-Style Loops from Stills

**Approach:** Isolate one region of a still image and add subtle animation:
- Water: apply noise displacement filter (feTurbulence animated)
- Hair/fabric: slight wave distortion
- Smoke: overlay animated noise in the smoke region
- Lights: pulse brightness on light sources

**Technique:**
```
1. Mask the region to animate (clip-path or SVG mask)
2. Apply animation only within that mask:
   - feTurbulence for water/fluid
   - TranslateY oscillation for steam
   - Opacity pulse for lights
3. Keep the rest of the image static
```

**Complexity:** Medium-High

---

### 5.4 Image Reveal Animations

| Style | Technique | Complexity |
|---|---|---|
| **Curtain (horizontal)** | clip-path: inset(0 50% 0 50%) -> inset(0) | Low |
| **Curtain (vertical)** | clip-path: inset(50% 0 50% 0) -> inset(0) | Low |
| **Circle expand** | clip-path: circle(0%) -> circle(100%) | Low |
| **Diagonal wipe** | clip-path: polygon with animated points | Medium |
| **Puzzle pieces** | Multiple clip-path regions revealing independently | High |
| **Shatter** | Image split into triangles that fly apart in reverse | High |
| **Blinds** | Multiple horizontal strips revealing with stagger | Medium |
| **Pixel reveal** | Start with large pixelation, reduce block size | Medium |
| **Paint brush** | SVG mask with animated brush stroke path | Medium |
| **Dissolve noise** | Noise-based threshold mask, animate threshold | Medium |

---

### 5.5 Before/After Slider Animation

**Implementation:**
```jsx
const frame = useCurrentFrame();
const sliderPos = interpolate(frame, [30, 90], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

<div style={{ position: "relative" }}>
  <Img src={before} /> {/* Full width */}
  <div style={{ clipPath: `inset(0 0 0 ${sliderPos}%)`, position: "absolute", inset: 0 }}>
    <Img src={after} />
  </div>
  <div style={{ position: "absolute", left: `${sliderPos}%`, top: 0, bottom: 0, width: 3, background: "#fff" }} />
</div>
```

**Complexity:** Low

---

### 5.6 Photo Stack/Carousel Animations

| Style | Description |
|---|---|
| **Fan spread** | Stack of tilted photos that fan out |
| **Card flip** | Photos flip like cards being dealt |
| **Carousel rotate** | Photos arranged in 3D circle (CSS perspective) |
| **Pile scatter** | Neatly stacked photos scatter randomly |
| **Shuffle** | Top card moves to back, revealing next |
| **Tinder swipe** | Cards swipe left/right off screen |
| **Polaroid drop** | Photos drop in with slight rotation, like thrown polaroids |

**Implementation:** CSS transforms (translate, rotate, scale) with staggered Remotion interpolation per card.

**Complexity:** Medium

---

### 5.7 Image Morph/Dissolve Between Two Images

| Technique | Approach | Quality |
|---|---|---|
| **Cross dissolve** | Opacity crossfade (image A fades out, B fades in) | Basic |
| **Noise dissolve** | Noise-based threshold mask, animate threshold | High |
| **Wipe dissolve** | Gradient mask moving across, soft edge | Good |
| **Pixelate transition** | Pixelate A up, swap, pixelate B down | Stylistic |
| **Morph (AI)** | Requires AI model to interpolate between images | Cinematic |
| **RGB split dissolve** | Each color channel transitions at different timing | Stylistic |

**Complexity:** Low (dissolve) to High (morph)

---

### 5.8 Zoom-to-Detail

**Implementation:**
```jsx
const frame = useCurrentFrame();
// Phase 1: Show full image (frames 0-60)
// Phase 2: Zoom to detail (frames 60-90)
const scale = interpolate(frame, [60, 90], [1, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const translateX = interpolate(frame, [60, 90], [0, -30], { /* clamp */ });
const translateY = interpolate(frame, [60, 90], [0, -20], { /* clamp */ });

// Apply spring for smooth deceleration at the end
```

**Enhancement:** Add spotlight/vignette that appears during zoom to focus attention.

**Complexity:** Low

---

## 6. PROGRAMMATIC VIDEO EFFECTS

### 6.1 Chromakey (Green Screen) in Code

**WebGL Approach (Best Quality):**
```
Fragment shader compares each pixel to the key color.
If distance < threshold: set alpha to 0
Soft edge: interpolate alpha based on distance for feathering
Spill correction: remove green tint from edges
```

**Libraries:**
- `gl-chromakey` -- WebGL 2, multiple key colors, tolerance/smoothness control
- Custom Canvas: iterate pixels, calculate color distance, set alpha

**Canvas Fallback:**
```
1. Draw video frame to canvas
2. getImageData()
3. For each pixel: calculate Euclidean distance to green (0, 177, 64)
4. If within threshold: set alpha to 0
5. putImageData()
```

**Complexity:** Medium (Canvas), Medium-High (WebGL with spill correction)

---

### 6.2 Picture-in-Picture with Animated Borders

**Implementation:**
```jsx
<AbsoluteFill>
  <Video src={mainVideo} />
  <div style={{
    position: "absolute",
    bottom: 20, right: 20,
    width: 300, height: 200,
    borderRadius: 12,
    overflow: "hidden",
    border: "3px solid #fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    transform: `scale(${pipScale})`, // animate entrance
  }}>
    <Video src={pipVideo} />
  </div>
</AbsoluteFill>
```

**Border Animation Ideas:**
- Gradient border (animated conic-gradient on pseudo-element)
- Pulsing glow border (animated box-shadow)
- Corner accents (SVG corner brackets)
- Rotating gradient border (background on padding area)

**Complexity:** Low-Medium

---

### 6.3 Split Screen with Animated Divider

**Implementation:**
```jsx
const frame = useCurrentFrame();
const dividerX = interpolate(frame, [0, 30], [0, 50], { extrapolateRight: "clamp" }); // % position

<div style={{ clipPath: `inset(0 ${100 - dividerX}% 0 0)` }}>
  <Video src={videoA} />
</div>
<div style={{ clipPath: `inset(0 0 0 ${dividerX}%)` }}>
  <Video src={videoB} />
</div>
<div style={{ position: "absolute", left: `${dividerX}%`, width: 3, height: "100%", background: "#fff" }} />
```

**Divider Styles:** Straight line, diagonal, wavy (SVG path), zigzag, animated slide

**Complexity:** Low

---

### 6.4 Mirror/Kaleidoscope Effects

**CSS Mirror:**
```css
transform: scaleX(-1); /* horizontal flip */
```

**Kaleidoscope (Canvas):**
```
1. Take a triangular slice of the source
2. Reflect and rotate it N times (6, 8, 12 segments)
3. Draw each segment with Canvas transformations
4. Animate the source region position for movement
```

**Complexity:** Low (mirror), Medium-High (kaleidoscope)

---

### 6.5 Tilt-Shift (Miniature Effect) Simulation

**CSS Approach:**
```css
/* Apply blur to top and bottom regions */
.scene {
  filter: blur(0);
}
/* Use a mask with gradient to apply blur selectively */
/* Or use SVG with feGaussianBlur + gradient mask */
```

**Better Approach:** Canvas with two passes -- blurred full image + sharp center strip, composited with gradient alpha mask.

**Enhancement:** Increase saturation slightly for that miniature look.

**Complexity:** Medium

---

### 6.6 Vintage/Retro TV Effects

**Layer Stack:**
1. Content with reduced saturation + warm color shift
2. Rounded rectangle mask (old TV shape)
3. Scan lines overlay (repeating 2px lines)
4. Slight barrel distortion at edges (SVG displacement)
5. Static noise overlay with low opacity
6. Occasional horizontal glitch line
7. "Turn on" effect: vertical line expanding to full screen

**Complexity:** Medium

---

### 6.7 VHS/Analog Distortion

**Complete VHS Look Stack:**
```
1. Base: Reduce resolution perception (slight blur 0.5px)
2. Color: Reduce saturation by 20%, add warm tint
3. Chromatic aberration: Offset red channel +2px, blue -2px
4. Scan lines: Repeating 2px horizontal bands at 5% opacity
5. Tracking noise: Random horizontal offset bands that drift
6. Noise: High-frequency grain at 8% opacity
7. Timestamp: "PLAY" + date in pixelated font
8. Edge distortion: Slight wave on left/right edges
```

**Complexity:** Medium

---

### 6.8 Speed Ramp with Motion Blur

**Remotion Approach:**
```
1. Map frame to playbackRate using interpolate()
   - Normal speed: 1x
   - Slow motion: 0.25x
   - Fast motion: 3-4x

2. During fast sections, wrap content in <Trail> from @remotion/motion-blur
   - More layers = more blur
   - lagInFrames controls blur amount

3. Or use <CameraMotionBlur> for natural-looking motion blur
```

**<Trail> Component:**
```jsx
<Trail layers={6} lagInFrames={0.2} trailOpacity={0.6}>
  <YourAnimatedContent />
</Trail>
```

**Complexity:** Medium

---

## 7. SOUND-REACTIVE VISUALS

### 7.1 Audio Waveform Visualization

**Remotion Built-in:**
```jsx
import { getAudioData, visualizeAudioWaveform } from "@remotion/media-utils";

// Fetch audio data
const audioData = await getAudioData(audioSrc);

// Get waveform at current frame
const waveform = visualizeAudioWaveform({
  audioData,
  frame,
  fps,
  numberOfSamples: 256,
});
// Returns array of amplitudes to render as bars, line, or path
```

**Rendering Styles:**
- Classic bars (rectangles at each frequency)
- Circular waveform (bars arranged in a circle)
- Line waveform (smooth path through sample points)
- Mirrored (bars extend both up and down)
- Filled area under the waveform curve

**Complexity:** Medium

---

### 7.2 Beat-Reactive Backgrounds

**Approach:**
```jsx
import { visualizeAudio } from "@remotion/media-utils";

const visualization = visualizeAudio({
  audioData,
  frame,
  fps,
  numberOfSamples: 3, // Just bass, mid, high
});

const bass = visualization[0]; // 0-1 value
const backgroundScale = 1 + bass * 0.1; // Pulse on beat
const brightness = 1 + bass * 0.3; // Flash on beat
```

**Effects That React to Audio:**
| Effect | Drive Parameter | Audio Source |
|---|---|---|
| Background pulse | scale | Bass (low freq) |
| Color flash | brightness/hue | Bass hits |
| Particle burst | particle count/speed | Transients |
| Ring expand | radius/scale | Bass |
| Glow intensity | text-shadow blur radius | Overall volume |
| Shape morph speed | animation speed | Mid freq |
| Camera shake | translateX/Y random offset | Bass |

**Complexity:** Medium

---

### 7.3 Music-Synced Particle Effects

**Approach:**
```
1. Analyze audio with visualizeAudio() at each frame
2. When bass exceeds threshold: spawn burst of particles
3. Particle count proportional to beat intensity
4. Particle color from current scene palette
5. Apply gravity + fade to particles over time
```

**Implementation:** Canvas-based particle system where spawn rate and initial velocity are driven by audio amplitude.

**Complexity:** High

---

### 7.4 Volume-Reactive Text Size

```jsx
const visualization = visualizeAudio({ audioData, frame, fps, numberOfSamples: 1 });
const volume = visualization[0];
const fontSize = interpolate(volume, [0, 1], [48, 72]);
const textShadowBlur = interpolate(volume, [0, 1], [0, 20]);
```

**Complexity:** Low

---

### 7.5 Equalizer Visualizations

**Classic Bar Equalizer:**
```jsx
const bars = visualizeAudio({ audioData, frame, fps, numberOfSamples: 32 });

bars.map((amplitude, i) => (
  <rect
    x={i * barWidth}
    y={height - amplitude * height}
    width={barWidth - gap}
    height={amplitude * height}
    fill={getColor(i)}
  />
));
```

**Variations:**
- Vertical bars (classic)
- Circular arrangement (radial equalizer)
- Mirrored (reflection below)
- Smooth line connecting peaks
- LED matrix style (discrete blocks)
- Neon glow on each bar

**Complexity:** Medium

---

## 8. COMPLEXITY REFERENCE MATRIX

| Complexity | Description | Typical Tools | Render Time Impact |
|---|---|---|---|
| **Low** | CSS transforms, opacity, basic interpolation | Remotion native, CSS | Minimal |
| **Medium** | SVG animations, GSAP timelines, Canvas 2D | GSAP, SVG, Canvas | Moderate |
| **Medium-High** | Physics simulation, complex Canvas, D3 viz | Matter.js, D3, Canvas | Noticeable |
| **High** | WebGL/Three.js, particle systems, shaders | Three.js, WebGL, R3F | Significant |

**Performance Rules of Thumb:**
1. CSS transforms (translate, scale, rotate, opacity) are GPU-accelerated -- always prefer these
2. `filter: blur()` is expensive -- use sparingly, never animate blur radius frame-by-frame on large elements
3. Canvas is faster than DOM for 100+ animated elements
4. Three.js adds 5-20x render time per frame -- use only when 3D is essential
5. `clip-path: polygon()` with many points is heavy in headless Chrome -- simplify shapes
6. Lottie animations render efficiently -- prefer over custom Canvas for equivalent effects
7. Keep particle counts under 500 for reasonable render times

---

## 9. AD TYPE TO EFFECT MAPPING

### Testimonial/Social Proof Ads
| Effect | Usage |
|---|---|
| Counter animation | "3.247 alunos" counting up |
| Star rating animation | Stars filling in |
| Lower third | Customer name + result |
| Quote reveal (typewriter) | Customer quote |
| Before/after slider | Transformation result |
| Subtle background gradient | Professional feel |

### Product Showcase Ads
| Effect | Usage |
|---|---|
| Device mockup | Product in phone/laptop |
| Zoom-to-detail | Feature close-ups |
| 3D rotation | Product from all angles |
| Particle sparkle | Highlight premium quality |
| Ken Burns | Product photography |
| Logo reveal | Brand identity |

### Urgency/Scarcity Ads
| Effect | Usage |
|---|---|
| Counter (counting down) | Time remaining |
| Progress bar | "87% das vagas preenchidas" |
| Pulsing text/glow | Urgent CTA |
| Glitch effect | Attention grab |
| Flash/strobe background | Energy/urgency |
| Shaking text | Emphasis |

### Course/Education Ads
| Effect | Usage |
|---|---|
| Chart animations | Results/metrics growing |
| Typewriter | Module titles |
| Checkmark animations | Curriculum items |
| Photo stack | Module previews |
| Number counter | Revenue/students |
| Lower thirds | Instructor credentials |

### VSL (Video Sales Letter) Style
| Effect | Usage |
|---|---|
| Text on screen (animated) | Key copy points |
| Highlight underline draw | Emphasis on key phrases |
| Split screen | Problem vs solution |
| Vignette | Focus attention |
| Subtle Ken Burns | Background movement |
| CTA button pulse | Call to action moments |

### Brand Awareness / Top-of-Funnel
| Effect | Usage |
|---|---|
| Logo reveal (elaborate) | Brand identity |
| 3D text | Brand name impact |
| Neon glow | Modern/tech brands |
| Particle effects | Premium feel |
| Liquid morphing | Creative/artistic brands |
| Animated gradient background | Contemporary feel |
| Audio-reactive visuals | Music-driven content |

---

## RECOMMENDED TECH STACK FOR AI VIDEO AGENT

### Tier 1 -- Core (Always Install)
```
remotion
@remotion/cli
@remotion/animation-utils
@remotion/noise
@remotion/motion-blur
@remotion/media-utils
```

### Tier 2 -- Extended Animation (Install as needed)
```
gsap                    # Timeline orchestration, text effects
@remotion/lottie        # Pre-made animations
lottie-web             # Lottie renderer
canvas-confetti        # Confetti effects
react-countup          # Number counting
```

### Tier 3 -- Advanced (Heavy, use strategically)
```
@remotion/three        # 3D rendering
three                  # Three.js core
@react-three/fiber     # React Three Fiber
@react-three/drei      # Three.js helpers
matter-js              # Physics engine
d3                     # Data visualization
```

### Tier 4 -- Specialized
```
@remotion/rive         # Rive animations
tsparticles            # Complex particle systems
gl-chromakey           # Green screen
```

---

## SOURCES AND REFERENCES

- Remotion Official Docs: https://www.remotion.dev/docs
- Remotion Spring: https://www.remotion.dev/docs/spring
- Remotion Interpolate: https://www.remotion.dev/docs/interpolate
- Remotion Three.js: https://www.remotion.dev/docs/three
- Remotion Lottie: https://www.remotion.dev/docs/lottie
- Remotion Noise: https://www.remotion.dev/docs/noise
- Remotion Motion Blur: https://www.remotion.dev/docs/motion-blur
- Remotion Audio Visualization: https://www.remotion.dev/docs/audio/visualization
- Remotion Third-Party Integrations: https://www.remotion.dev/docs/third-party
- Remotion AI SaaS Template: https://www.remotion.dev/docs/ai/ai-saas-template
- GSAP + Remotion Integration: https://enlear.academy/how-to-integrate-greensock-with-remotion-e4eee6f5a41f
- Remotion + Anime.js: https://revidcraft.com/posts/remotion-part-02
- GSAP ScrambleText: https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/
- tsParticles: https://particles.js.org/
- Canvas Confetti: https://github.com/catdad/canvas-confetti
- react-countup: https://www.npmjs.com/package/react-countup
- react-slot-counter: https://www.npmjs.com/package/react-slot-counter
- Motion (Framer Motion): https://motion.dev/
- use-scramble: https://www.use-scramble.dev/
- Matter.js: https://brm.io/matter-js/
- D3.js: https://d3js.org/
- CSS Neon Text: https://css-tricks.com/how-to-create-neon-text-with-css/
- SVG Path Drawing: https://www.cassie.codes/posts/creating-my-logo-animation/
- WebGL Chromakey: https://jameshfisher.com/2020/08/11/production-ready-green-screen-in-the-browser/
- CSS VHS Glitch: https://github.com/dulnan/css-vhs-glitch
- gl-chromakey: https://github.com/bhj/gl-chromakey
- WebGL Shader + GSAP: https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
- Remotion Audio Visualizer: https://github.com/satelllte/remotion-audio-visualizer
- LogRocket React Animation Libraries: https://blog.logrocket.com/best-react-animation-libraries/
