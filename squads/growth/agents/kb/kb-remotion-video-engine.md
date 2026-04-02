# Remotion Knowledge Base — AI Video Ad Engine

> Framework: Remotion (React-based programmatic video)
> Purpose: Build an AI agent that creates short-form video ads (up to 60s) automatically
> Last updated: 2026-03-28

---

## 1. ARCHITECTURE FUNDAMENTALS

### What Remotion Is

Remotion is a React framework that renders video frame-by-frame. Each frame is a React component rendered at a specific point in time. The video is just a React app that gets screenshot'd 30 times per second (or whatever fps you set).

### Core Mental Model

```
Video = React Component + Metadata (width, height, fps, durationInFrames)
Frame = One render of that component at a specific time
Animation = Changing props/styles based on current frame number
```

### Key Packages

| Package | Purpose |
|---------|---------|
| `remotion` | Core: Composition, Sequence, useCurrentFrame, interpolate, spring, AbsoluteFill |
| `@remotion/cli` | CLI rendering (npx remotion render) |
| `@remotion/renderer` | Node.js SSR API (renderMedia, bundle) |
| `@remotion/lambda` | AWS Lambda distributed rendering |
| `@remotion/transitions` | TransitionSeries, fade, slide, wipe, etc. |
| `@remotion/captions` | TikTok-style captions, word-by-word highlighting |
| `@remotion/media-utils` | getAudioDurationInSeconds, getAudioData |
| `@remotion/layout-utils` | Text measurement, fitting text in boxes |
| `@remotion/zod-types` | Zod schemas for input validation |

### Core Components

**Composition** — The root definition of a video. Declares dimensions, fps, duration, default props, and which React component to render.

```tsx
import { Composition } from 'remotion';
import { z } from 'zod';
import { AdVideo } from './AdVideo';

const adSchema = z.object({
  headline: z.string(),
  bodyText: z.string(),
  ctaText: z.string(),
  imageUrl: z.string(),
  audioUrl: z.string(),
  durationInSeconds: z.number(),
});

export const RemotionRoot = () => {
  return (
    <Composition
      id="ad-video"
      component={AdVideo}
      width={1080}
      height={1920}  // 9:16 vertical
      fps={30}
      durationInFrames={30 * 15}  // 15 seconds
      schema={adSchema}
      defaultProps={{
        headline: 'Your Product Here',
        bodyText: 'Description text',
        ctaText: 'Buy Now',
        imageUrl: '',
        audioUrl: '',
        durationInSeconds: 15,
      }}
      calculateMetadata={async ({ props }) => {
        return {
          durationInFrames: Math.ceil(props.durationInSeconds * 30),
        };
      }}
    />
  );
};
```

**useCurrentFrame()** — Returns the current frame number (0-indexed). This is THE core hook. Everything animates based on this.

**useVideoConfig()** — Returns `{ fps, width, height, durationInFrames }`.

**AbsoluteFill** — A `div` with `position: absolute; top: 0; left: 0; right: 0; bottom: 0;`. Used for layering elements on top of each other. Last child renders on top.

```tsx
<AbsoluteFill style={{ backgroundColor: '#000' }}>
  {/* Background layer */}
  <AbsoluteFill>
    <Img src={backgroundImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </AbsoluteFill>
  {/* Text overlay layer */}
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <h1 style={{ color: 'white', fontSize: 80 }}>{headline}</h1>
  </AbsoluteFill>
</AbsoluteFill>
```

**Sequence** — Time-shifts children. Children calling `useCurrentFrame()` get a value relative to the Sequence's `from` prop.

```tsx
<Sequence from={0} durationInFrames={90}>
  <IntroScene />  {/* useCurrentFrame() returns 0-89 here */}
</Sequence>
<Sequence from={90} durationInFrames={60}>
  <ProductScene />  {/* useCurrentFrame() returns 0-59 here */}
</Sequence>
```

**Series** — Automatically stacks sequences one after another (no manual `from` calculation).

```tsx
import { Series } from 'remotion';

<Series>
  <Series.Sequence durationInFrames={90}>
    <IntroScene />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60} offset={-10}>
    {/* offset=-10 means overlap 10 frames with previous */}
    <ProductScene />
  </Series.Sequence>
  <Series.Sequence durationInFrames={90}>
    <CTAScene />
  </Series.Sequence>
</Series>
```

### calculateMetadata — Dynamic Duration

When the AI agent generates a video, the duration depends on TTS audio length. Use `calculateMetadata` to compute duration dynamically:

```tsx
<Composition
  calculateMetadata={async ({ props }) => {
    const audioDuration = await getAudioDurationInSeconds(props.audioUrl);
    return {
      durationInFrames: Math.ceil(audioDuration * 30) + 60, // +2s buffer
      fps: 30,
    };
  }}
/>
```

---

## 2. ANIMATION SYSTEM

### interpolate() — The Core Animation Function

Maps a value from one range to another. Used for EVERYTHING: opacity, position, scale, rotation.

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

const frame = useCurrentFrame();

// Fade in over first 30 frames
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: 'clamp',  // ALWAYS USE THIS to prevent overflow
});

// Slide up from 100px below
const translateY = interpolate(frame, [0, 30], [100, 0], {
  extrapolateRight: 'clamp',
});

// Fade in AND fade out
const fadeInOut = interpolate(
  frame,
  [0, 20, durationInFrames - 20, durationInFrames],
  [0, 1, 1, 0]
);

// Scale with easing
const scale = interpolate(frame, [0, 30], [0.5, 1], {
  extrapolateRight: 'clamp',
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease-out
});
```

**CRITICAL RULE**: Always use `extrapolateRight: 'clamp'` and/or `extrapolateLeft: 'clamp'` to prevent values from going outside your desired range.

### spring() — Physics-Based Animation

More organic, bouncy feel. Animates from 0 to 1 by default.

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Basic spring (bouncy entrance)
const scale = spring({
  frame,
  fps,
  config: {
    damping: 12,      // Higher = less bouncy (default 10)
    mass: 0.5,        // Lower = faster (default 1)
    stiffness: 200,   // Higher = snappier (default 100)
    overshootClamping: false,  // true = no overshoot
  },
});

// Delayed spring (starts at frame 20)
const delayedScale = spring({
  frame: frame - 20,  // Delay by subtracting frames
  fps,
  config: { damping: 15, mass: 0.8, stiffness: 150 },
});

// Combine spring with interpolate for custom ranges
const rotation = interpolate(
  spring({ frame, fps, config: { damping: 20 } }),
  [0, 1],
  [0, 360]
);
```

### Spring Presets for Ad Videos

```tsx
// Punchy pop-in (for headlines, CTAs)
const PUNCH_CONFIG = { damping: 8, mass: 0.4, stiffness: 300 };

// Smooth slide (for body text, images)
const SMOOTH_CONFIG = { damping: 20, mass: 1, stiffness: 100, overshootClamping: true };

// Bouncy entrance (for fun/playful brands)
const BOUNCE_CONFIG = { damping: 6, mass: 0.5, stiffness: 200 };

// Gentle fade (for elegant transitions)
const GENTLE_CONFIG = { damping: 30, mass: 1.5, stiffness: 80, overshootClamping: true };
```

### Easing Functions

```tsx
import { Easing } from 'remotion';

// Common easing curves
Easing.ease          // Standard ease
Easing.in(Easing.ease)  // Ease-in
Easing.out(Easing.ease)  // Ease-out
Easing.inOut(Easing.ease)  // Ease-in-out
Easing.bezier(0.25, 0.1, 0.25, 1)  // Custom cubic bezier
```

---

## 3. TEXT ANIMATIONS

### Pop-In Text (Scale + Opacity)

```tsx
const PopInText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 250 },
  });

  const scale = interpolate(progress, [0, 1], [0.3, 1]);
  const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      transform: `scale(${scale})`,
      opacity,
      fontSize: 64,
      fontWeight: 'bold',
      color: 'white',
      textShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      {text}
    </div>
  );
};
```

### Slide-In Text

```tsx
const SlideInText: React.FC<{
  text: string;
  direction?: 'left' | 'right' | 'bottom' | 'top';
  delay?: number;
}> = ({ text, direction = 'left', delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 150 },
  });

  const transforms = {
    left: `translateX(${interpolate(progress, [0, 1], [-200, 0])}px)`,
    right: `translateX(${interpolate(progress, [0, 1], [200, 0])}px)`,
    bottom: `translateY(${interpolate(progress, [0, 1], [100, 0])}px)`,
    top: `translateY(${interpolate(progress, [0, 1], [-100, 0])}px)`,
  };

  return (
    <div style={{
      transform: transforms[direction],
      opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      fontSize: 48,
      color: 'white',
    }}>
      {text}
    </div>
  );
};
```

### Typewriter Effect

```tsx
const Typewriter: React.FC<{ text: string; startFrame?: number }> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Characters per second
  const charsPerSecond = 20;
  const charsToShow = Math.floor(
    ((frame - startFrame) / fps) * charsPerSecond
  );

  // ALWAYS use string slicing, never per-character opacity
  const displayText = text.slice(0, Math.max(0, charsToShow));

  // Blinking cursor
  const cursorOpacity = Math.floor((frame - startFrame) / 15) % 2 === 0 ? 1 : 0;

  return (
    <div style={{ fontSize: 40, fontFamily: 'monospace', color: 'white' }}>
      {displayText}
      <span style={{ opacity: cursorOpacity }}>|</span>
    </div>
  );
};
```

### Word-by-Word Karaoke (Shake/Bounce on Active Word)

```tsx
const KaraokeWord: React.FC<{
  word: string;
  isActive: boolean;
  isPast: boolean;
}> = ({ word, isActive, isPast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeScale = isActive
    ? spring({
        frame,
        fps,
        config: { damping: 10, mass: 0.5 },
      })
    : 0;

  return (
    <span style={{
      display: 'inline-block',
      transform: isActive ? `scale(${interpolate(activeScale, [0, 1], [1.3, 1])})` : 'scale(1)',
      color: isPast || isActive ? '#FFD700' : 'white',
      fontWeight: isActive ? 'bold' : 'normal',
      fontSize: 52,
      margin: '0 6px',
      transition: 'color 0.1s',
    }}>
      {word}
    </span>
  );
};
```

### Shake Effect

```tsx
const ShakeText: React.FC<{ text: string; intensity?: number }> = ({
  text,
  intensity = 5,
}) => {
  const frame = useCurrentFrame();

  const shakeX = Math.sin(frame * 1.5) * intensity;
  const shakeY = Math.cos(frame * 2) * intensity;

  return (
    <div style={{
      transform: `translate(${shakeX}px, ${shakeY}px)`,
      fontSize: 60,
      fontWeight: 'bold',
      color: 'red',
    }}>
      {text}
    </div>
  );
};
```

---

## 4. MOTION & VISUAL EFFECTS

### Punch-In Zoom

```tsx
const PunchInZoom: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 200 },
  });

  const scale = interpolate(zoom, [0, 1], [1, 1.3]);

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
      {children}
    </AbsoluteFill>
  );
};
```

### Ken Burns Effect on Images

```tsx
const KenBurns: React.FC<{
  src: string;
  direction?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
}> = ({ src, direction = 'zoom-in' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const transforms = {
    'zoom-in': {
      scale: interpolate(progress, [0, 1], [1, 1.3]),
      x: 0, y: 0,
    },
    'zoom-out': {
      scale: interpolate(progress, [0, 1], [1.3, 1]),
      x: 0, y: 0,
    },
    'pan-left': {
      scale: 1.2,
      x: interpolate(progress, [0, 1], [0, -100]),
      y: 0,
    },
    'pan-right': {
      scale: 1.2,
      x: interpolate(progress, [0, 1], [-100, 0]),
      y: 0,
    },
  };

  const t = transforms[direction];

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${t.scale}) translate(${t.x}px, ${t.y}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

### Glitch Effect

```tsx
const GlitchOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Glitch only on specific frames
  const glitchActive = [5, 12, 18, 25, 33].some(
    (f) => Math.abs(frame % 60 - f) < 2
  );

  if (!glitchActive) return null;

  const offset = Math.random() * 20 - 10;

  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
      <div style={{
        position: 'absolute',
        top: `${30 + offset}%`,
        left: 0,
        right: 0,
        height: '5%',
        background: `rgba(255, 0, 0, 0.3)`,
        transform: `translateX(${offset}px)`,
      }} />
      <div style={{
        position: 'absolute',
        top: `${60 + offset}%`,
        left: 0,
        right: 0,
        height: '3%',
        background: `rgba(0, 255, 255, 0.3)`,
        transform: `translateX(${-offset}px)`,
      }} />
    </AbsoluteFill>
  );
};
```

### Speed Ramp (Slow-Mo / Fast-Forward Feel)

Speed ramps in Remotion are achieved by manipulating which frames appear when. You control the visual pacing, not actual playback speed:

```tsx
const SpeedRamp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Slow section (frames 30-60 play at half speed)
  const remappedFrame = (() => {
    if (frame < 30) return frame;
    if (frame < 60) return 30 + (frame - 30) * 0.5; // Half speed
    return 45 + (frame - 60) * 2; // Double speed to catch up
  })();

  // Use remappedFrame to drive child animations
  return <>{children}</>;
};
```

---

## 5. TRANSITIONS (Between Scenes)

### TransitionSeries — The Transition System

```tsx
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';

const AdVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <HookScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-left' })}
        timing={springTiming({ config: { damping: 15 }, durationInFrames: 20 })}
      />

      <TransitionSeries.Sequence durationInFrames={120}>
        <ProductScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      <TransitionSeries.Sequence durationInFrames={90}>
        <CTAScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

### Available Built-In Presentations

| Presentation | Effect |
|-------------|--------|
| `fade()` | Crossfade opacity |
| `slide({ direction })` | Slide in, push previous out. Directions: from-left, from-right, from-top, from-bottom |
| `wipe({ direction })` | Slide over previous (doesn't push) |
| `flip()` | 3D rotation flip |
| `clockWipe()` | Circular reveal like a clock hand |
| `iris()` | Circular mask from center |
| `cube()` | 3D cube rotation |
| `none()` | No visual effect (timing only) |

### Custom Transition (e.g., Zoom Transition)

```tsx
import { TransitionPresentation } from '@remotion/transitions';

const zoomTransition = (): TransitionPresentation<{}> => {
  return {
    component: ({ presentationProgress, presentationDirection, children }) => {
      const isEntering = presentationDirection === 'entering';
      const scale = isEntering
        ? interpolate(presentationProgress, [0, 1], [1.5, 1])
        : interpolate(presentationProgress, [0, 1], [1, 0.5]);
      const opacity = isEntering
        ? interpolate(presentationProgress, [0, 1], [0, 1])
        : interpolate(presentationProgress, [0, 1], [1, 0]);

      return (
        <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
          {children}
        </AbsoluteFill>
      );
    },
  };
};
```

**IMPORTANT**: Transitions overlap scenes. If Scene A = 60 frames, Scene B = 60 frames, transition = 15 frames, total duration = 60 + 60 - 15 = 105 frames.

---

## 6. AUDIO INTEGRATION

### Adding Audio

```tsx
import { Audio, Sequence } from 'remotion';

const AdVideo: React.FC<{ narrationUrl: string; musicUrl: string }> = ({
  narrationUrl,
  musicUrl,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Music volume ducking during narration
  const musicVolume = interpolate(
    frame,
    [0, 15, durationInFrames - 30, durationInFrames],
    [0, 0.15, 0.15, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      {/* Background music — full duration, low volume */}
      <Audio src={musicUrl} volume={musicVolume} />

      {/* Narration — starts at frame 15 */}
      <Sequence from={15}>
        <Audio src={narrationUrl} volume={0.9} />
      </Sequence>

      {/* SFX — whoosh on transition */}
      <Sequence from={90} durationInFrames={30}>
        <Audio src="/sfx/whoosh.mp3" volume={0.6} />
      </Sequence>

      {/* Visual content */}
      <AbsoluteFill>
        {/* ... scenes ... */}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

### Audio Duration-Based Composition

```tsx
import { getAudioDurationInSeconds } from '@remotion/media-utils';

// In calculateMetadata:
calculateMetadata={async ({ props }) => {
  const [narrationDuration] = await Promise.all([
    getAudioDurationInSeconds(props.narrationUrl),
  ]);
  const totalFrames = Math.ceil(narrationDuration * 30) + 90; // +3s for intro/outro
  return { durationInFrames: totalFrames };
}}
```

### Audio Volume Ducking Pattern

```tsx
// Duck music when narration is playing (frames 60-180)
const musicVolume = (f: number) => {
  return interpolate(
    f,
    [0, 60, 75, 170, 180, durationInFrames],
    [0.3, 0.3, 0.08, 0.08, 0.3, 0],
    { extrapolateRight: 'clamp' }
  );
};

<Audio src={musicUrl} volume={musicVolume} />
```

### Syncing Visuals to Audio (Beat Detection)

```tsx
import { getAudioData, useAudioData } from '@remotion/media-utils';

// Pre-calculate audio data for beat sync
const audioData = useAudioData(audioUrl);

if (!audioData) return null;

// Use audio amplitude to drive visual effects
const currentAmplitude = audioData.channelWaveforms[0][frame] || 0;
const visualScale = interpolate(currentAmplitude, [0, 0.5], [1, 1.5], {
  extrapolateRight: 'clamp',
});
```

---

## 7. TIKTOK-STYLE CAPTIONS (@remotion/captions)

### Setup and Usage

```tsx
import { createTikTokStyleCaptions } from '@remotion/captions';

// Input: Array of Caption objects (from Whisper, Deepgram, etc.)
type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};

// Create pages of captions
const { pages } = createTikTokStyleCaptions({
  captions: captionData,  // from transcription API
  combineTokensWithinMilliseconds: 800,  // Group words within 800ms
});

// Each page has:
// - text: string (full page text)
// - startMs: number
// - durationMs: number
// - tokens: Array<{ text, fromMs, toMs }> (per-word timing)
```

### Rendering Captions with Word Highlighting

```tsx
const CaptionOverlay: React.FC<{ pages: TikTokPage[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Find current page
  const currentPage = pages.find(
    (p) => currentTimeMs >= p.startMs && currentTimeMs < p.startMs + p.durationMs
  );

  if (!currentPage) return null;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: '12px 24px',
        maxWidth: '80%',
      }}>
        {currentPage.tokens.map((token, i) => {
          const isActive = currentTimeMs >= token.fromMs && currentTimeMs < token.toMs;
          const isPast = currentTimeMs >= token.toMs;

          return (
            <span
              key={i}
              style={{
                color: isActive ? '#FFD700' : isPast ? '#ccc' : '#fff',
                fontWeight: isActive ? 900 : 600,
                fontSize: isActive ? 46 : 42,
                display: 'inline',
                transition: 'all 0.1s',
              }}
            >
              {token.text}{' '}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### Recommended Settings

| Content Type | combineTokensWithinMilliseconds | Notes |
|-------------|-------------------------------|-------|
| Fast-paced product demo | 400-600 | More word-by-word feel |
| Educational/explainer | 1000-1500 | Natural phrasing |
| UGC testimonial | 800 | Good balance |
| High-energy sale | 300-500 | Rapid-fire words |

---

## 8. IMAGE & VIDEO COMPOSITION

### Layering with AbsoluteFill

```tsx
<AbsoluteFill>
  {/* Layer 1: Background */}
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </AbsoluteFill>

  {/* Layer 2: Gradient overlay */}
  <AbsoluteFill style={{
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  }} />

  {/* Layer 3: Text content */}
  <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 60 }}>
    <h1 style={{ color: 'white', fontSize: 72 }}>{headline}</h1>
  </AbsoluteFill>

  {/* Layer 4: Logo watermark */}
  <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-end', padding: 40 }}>
    <Img src={logoUrl} style={{ width: 120 }} />
  </AbsoluteFill>
</AbsoluteFill>
```

### Picture-in-Picture (PiP)

```tsx
const PiPLayout: React.FC<{ mainSrc: string; pipSrc: string }> = ({ mainSrc, pipSrc }) => {
  return (
    <AbsoluteFill>
      {/* Main video / image */}
      <AbsoluteFill>
        <Video src={mainSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {/* PiP overlay — bottom-right corner */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        width: 300,
        height: 300,
        borderRadius: 20,
        overflow: 'hidden',
        border: '4px solid white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <Video src={pipSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </AbsoluteFill>
  );
};
```

### Split-Screen

```tsx
const SplitScreen: React.FC<{
  leftSrc: string;
  rightSrc: string;
  split?: number;  // 0-1, where 0.5 = even split
}> = ({ leftSrc, rightSrc, split = 0.5 }) => {
  return (
    <AbsoluteFill style={{ flexDirection: 'row' }}>
      <div style={{ width: `${split * 100}%`, height: '100%', overflow: 'hidden' }}>
        <Img src={leftSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ width: `${(1 - split) * 100}%`, height: '100%', overflow: 'hidden' }}>
        <Img src={rightSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </AbsoluteFill>
  );
};
```

### Before/After Reveal

```tsx
const BeforeAfter: React.FC<{ beforeSrc: string; afterSrc: string }> = ({
  beforeSrc,
  afterSrc,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Hold "before" for 2s, then reveal "after" over 1s
  const revealProgress = interpolate(
    frame,
    [2 * fps, 3 * fps],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <Img src={afterSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${100 - revealProgress}%`,
        overflow: 'hidden',
      }}>
        <Img src={beforeSrc} style={{
          width: '100vw', height: '100%', objectFit: 'cover',
        }} />
      </div>
      {/* Divider line */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: `${100 - revealProgress}%`,
        width: 4,
        backgroundColor: 'white',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      }} />
    </AbsoluteFill>
  );
};
```

---

## 9. TEMPLATE SYSTEM — Reusable Ad Templates

### Architecture for AI Agent

The recommended architecture for an AI agent is a **scene-based template system**:

```
Composition (AdVideo)
├── Scene 1: Hook (various types: question, shock stat, problem)
├── Scene 2: Problem/Pain
├── Scene 3: Product/Solution
├── Scene 4: Social Proof / Testimonial
├── Scene 5: CTA
└── Audio Layer (narration + music + SFX)
```

### Template Definition Schema

```tsx
import { z } from 'zod';

const SceneSchema = z.object({
  type: z.enum([
    'hook-question',
    'hook-stat',
    'hook-problem',
    'product-showcase',
    'feature-highlight',
    'testimonial',
    'before-after',
    'cta-urgency',
    'cta-simple',
  ]),
  durationFrames: z.number(),
  headline: z.string().optional(),
  bodyText: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  transition: z.enum(['fade', 'slide', 'wipe', 'none']).default('fade'),
});

const AdTemplateSchema = z.object({
  format: z.enum(['9:16', '1:1', '4:5']),
  scenes: z.array(SceneSchema),
  narrationUrl: z.string(),
  musicUrl: z.string().optional(),
  brandColor: z.string().default('#FF6B00'),
  fontFamily: z.string().default('Inter'),
  captionData: z.array(z.any()).optional(),
});
```

### Scene Component Registry

```tsx
const SCENE_REGISTRY: Record<string, React.FC<SceneProps>> = {
  'hook-question': HookQuestionScene,
  'hook-stat': HookStatScene,
  'hook-problem': HookProblemScene,
  'product-showcase': ProductShowcaseScene,
  'feature-highlight': FeatureHighlightScene,
  'testimonial': TestimonialScene,
  'before-after': BeforeAfterScene,
  'cta-urgency': CTAUrgencyScene,
  'cta-simple': CTASimpleScene,
};

const AdVideo: React.FC<z.infer<typeof AdTemplateSchema>> = (props) => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {props.scenes.map((scene, i) => {
          const SceneComponent = SCENE_REGISTRY[scene.type];
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <TransitionSeries.Transition
                  presentation={getTransition(scene.transition)}
                  timing={linearTiming({ durationInFrames: 12 })}
                />
              )}
              <TransitionSeries.Sequence durationInFrames={scene.durationFrames}>
                <SceneComponent {...scene} brandColor={props.brandColor} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* Audio layers */}
      {props.musicUrl && <Audio src={props.musicUrl} volume={0.12} />}
      <Audio src={props.narrationUrl} volume={0.9} />

      {/* Caption overlay */}
      {props.captionData && <CaptionOverlay pages={props.captionData} />}
    </AbsoluteFill>
  );
};
```

---

## 10. DYNAMIC DATA & API INTEGRATION

### Feeding Data via inputProps

```tsx
// From Node.js server / AI agent:
import { renderMedia, selectComposition, bundle } from '@remotion/renderer';

async function renderAdVideo(adData: AdInputData) {
  const bundleLocation = await bundle({
    entryPoint: './src/index.ts',
    webpackOverride: (config) => config,
  });

  const inputProps = {
    scenes: adData.scenes,
    narrationUrl: adData.narrationUrl,
    musicUrl: adData.musicUrl,
    brandColor: adData.brandColor,
    captionData: adData.captions,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'ad-video',
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: `./output/${adData.id}.mp4`,
    inputProps,
  });

  return `./output/${adData.id}.mp4`;
}
```

### CLI Rendering with Props

```bash
# Pass props via JSON file
npx remotion render src/index.ts ad-video out/video.mp4 --props='{"headline":"50% OFF","ctaText":"Buy Now"}'

# Or from a file
npx remotion render src/index.ts ad-video out/video.mp4 --props=./data/ad-props.json
```

### Dataset Batch Rendering

```tsx
import { renderMedia, selectComposition, bundle } from '@remotion/renderer';

async function batchRender(ads: AdInputData[]) {
  const bundleLocation = await bundle({ entryPoint: './src/index.ts' });

  // Render in parallel with concurrency limit
  const CONCURRENCY = 3;
  const results = [];

  for (let i = 0; i < ads.length; i += CONCURRENCY) {
    const batch = ads.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (ad) => {
        const composition = await selectComposition({
          serveUrl: bundleLocation,
          id: 'ad-video',
          inputProps: ad,
        });

        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: 'h264',
          outputLocation: `./output/${ad.id}.mp4`,
          inputProps: ad,
          concurrency: 2,  // Threads per render
        });

        return `./output/${ad.id}.mp4`;
      })
    );
    results.push(...batchResults);
  }

  return results;
}
```

---

## 11. BATCH RENDERING & LAMBDA (Scale)

### Local CLI Rendering

```bash
# Basic render
npx remotion render src/index.ts ad-video out/video.mp4

# With concurrency (use all CPU cores)
npx remotion render src/index.ts ad-video out/video.mp4 --concurrency=8

# Custom dimensions for different formats
npx remotion render src/index.ts ad-video out/vertical.mp4 --height=1920 --width=1080
npx remotion render src/index.ts ad-video out/square.mp4 --height=1080 --width=1080
```

### Lambda Rendering (Production Scale)

```tsx
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';

async function renderOnLambda(inputProps: AdInputData) {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: 'us-east-1',
    functionName: 'remotion-render-function',
    serveUrl: 'https://your-bundle-url.s3.amazonaws.com/bundle/index.html',
    composition: 'ad-video',
    inputProps,
    codec: 'h264',
    framesPerLambda: 20,  // Distribute: each Lambda renders 20 frames
    privacy: 'public',
    webhook: {
      url: 'https://your-api.com/webhook/render-complete',
      secret: process.env.WEBHOOK_SECRET,
    },
  });

  return { renderId, bucketName };
}

// Poll progress (or use webhook)
async function checkProgress(renderId: string, bucketName: string) {
  const progress = await getRenderProgress({
    renderId,
    bucketName,
    region: 'us-east-1',
    functionName: 'remotion-render-function',
  });

  if (progress.done) {
    return progress.outputFile;  // S3 URL of rendered video
  }

  return progress.overallProgress;  // 0-1
}
```

### Lambda Webhook Handler

```tsx
import express from 'express';
import { expressWebhook } from '@remotion/lambda';

const app = express();

app.post('/webhook/render-complete', express.json(), (req, res) => {
  expressWebhook({
    req,
    secret: process.env.WEBHOOK_SECRET!,
    onSuccess: async (payload) => {
      console.log('Render complete:', payload.outputUrl);
      // Notify via Telegram, update DB, etc.
    },
    onError: async (payload) => {
      console.error('Render failed:', payload.errors);
    },
    onTimeout: async (payload) => {
      console.error('Render timed out');
    },
  });

  res.status(200).send('OK');
});
```

### Lambda Performance Tips

- Each Lambda renders a chunk of frames in parallel
- Use `framesPerLambda: 15-25` for short videos (15-60s)
- Default memory is 2048MB. Increase for complex compositions (3008MB recommended)
- A 15-second video typically renders in 5-15 seconds on Lambda
- Lambda has ~500MB disk space limit for output files
- Deploy one function, render unlimited compositions

---

## 12. OUTPUT OPTIMIZATION

### Format Configurations for Social Media

```tsx
// Format presets
const FORMAT_PRESETS = {
  'tiktok-reels': { width: 1080, height: 1920, fps: 30 },  // 9:16
  'feed-square': { width: 1080, height: 1080, fps: 30 },    // 1:1
  'feed-portrait': { width: 1080, height: 1350, fps: 30 },  // 4:5
  'youtube-shorts': { width: 1080, height: 1920, fps: 30 }, // 9:16
  'story': { width: 1080, height: 1920, fps: 30 },          // 9:16
};
```

### Encoding Settings

```bash
# High quality (larger file, ~8MB for 15s)
npx remotion render ... --video-bitrate=8M --audio-bitrate=320k

# Balanced (good quality, ~4MB for 15s) — RECOMMENDED for social
npx remotion render ... --video-bitrate=5M --audio-bitrate=192k

# Small file size (acceptable quality, ~2MB for 15s)
npx remotion render ... --crf=28

# Using CRF (Constant Rate Factor)
# Lower CRF = higher quality. Default is ~18. Range 0-51 for H.264.
npx remotion render ... --crf=23  # Good balance

# IMPORTANT: --crf and --video-bitrate are MUTUALLY EXCLUSIVE
```

### Node.js API Encoding

```tsx
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',             // Best compatibility for all platforms
  outputLocation: 'out.mp4',
  inputProps,
  videoBitrate: '5M',        // 5 Mbps
  audioBitrate: '192k',
  // OR use CRF instead:
  // crf: 23,
});
```

### Supported Codecs

| Codec | Container | Use Case |
|-------|-----------|----------|
| `h264` | MP4 | Default. Best compatibility. Use this for social media. |
| `h265` | MP4 | Better compression, less compatible |
| `vp8` | WebM | Web playback |
| `vp9` | WebM | Better quality WebM |
| `prores` | MOV | Professional editing, supports transparency |
| `gif` | GIF | Short loops |

### Hardware Acceleration

Available for faster encoding on supported hardware. Check `npx remotion render --help` for `--gl` flag options.

---

## 13. BEST PRACTICES & LIMITATIONS

### Performance Rules

1. **Set concurrency to CPU count**: `concurrency: os.cpus().length` for fastest local rendering
2. **Use `staticFile()` for local assets**: Import assets from the `public/` folder
3. **Avoid heavy computation in render**: Pre-calculate data in `calculateMetadata`, not in the component
4. **Minimize re-renders**: Keep animated state minimal; use `useMemo` for expensive calculations
5. **Use `<Img>` not `<img>`**: Remotion's `<Img>` component ensures the image is loaded before screenshot
6. **Use `<Video>` not `<video>`**: Same reason as above
7. **Preload assets**: Use `prefetch()` or `preloadVideo()` / `preloadAudio()` to avoid render delays

### Memory Management

- Each frame is rendered in a headless browser tab
- Complex scenes with many elements can cause high memory usage
- For long videos (>2 min), consider splitting into chunks
- On Lambda, the `angle` GL backend had memory leaks in older versions; use `swangle` if issues arise
- Lambda disk space limits output file size to ~250MB

### What Remotion CAN Do

- Any visual that HTML/CSS/SVG/Canvas/WebGL can render
- Dynamic text, images, video overlays
- Complex animations with spring physics
- Audio sync with frame-perfect accuracy
- Batch render thousands of variations
- Distribute rendering across Lambda functions
- Accept dynamic data via API/JSON
- Generate transparent video (ProRes codec)
- TikTok-style animated captions
- Custom transitions between scenes
- Real-time preview in Remotion Studio

### What Remotion CANNOT Do

- **Real-time video processing/filters** (no blur, color grade on imported video clips in real-time)
- **3D rendering** beyond CSS 3D transforms (no Three.js-level 3D without significant performance hit)
- **Live streaming** (it's for pre-rendered video only)
- **Audio manipulation** (no EQ, reverb, pitch shift — process audio externally before feeding to Remotion)
- **Face/object detection** in video (no ML inference during render)
- **Import After Effects / Premiere projects**
- **Edit existing video files** (it creates new videos from scratch)
- **Render video faster than real-time on a single machine** without Lambda

### Common Pitfalls

1. **Forgetting `extrapolateRight: 'clamp'`** — Values will keep growing past your output range
2. **Not using `<Img>` / `<Video>`** — Regular HTML tags may not load before frame capture
3. **Random values in render** — `Math.random()` produces different values per frame. Use `random()` from Remotion with a seed
4. **Heavy assets without preloading** — Causes black frames or missing content
5. **Not passing inputProps to BOTH selectComposition AND renderMedia** — Will use defaultProps instead
6. **Setting CRF and videoBitrate together** — They are mutually exclusive
7. **Absolute paths in assets** — Use `staticFile()` or remote URLs

### Remotion AI Skills Integration

Remotion provides official Agent Skills for Claude Code:

```bash
npx skills add remotion-dev/skills
```

This gives Claude deep knowledge of Remotion APIs and best practices. The skills include rules for:
- animations.md — Spring, interpolate, easing
- text-animations.md — Typography effects
- transitions.md — Scene transitions
- display-captions.md — TikTok captions
- charts.md — Data visualization
- get-audio-duration.md — Audio handling

### Documentation Access for AI Agents

Any Remotion doc page can be accessed as raw markdown by appending `.md`:
```
https://www.remotion.dev/docs/interpolate.md
https://www.remotion.dev/docs/spring.md
```

---

## 14. RECOMMENDED ARCHITECTURE FOR AI VIDEO AD AGENT

### Pipeline Overview

```
┌─────────────────┐
│  AI Agent (LLM)  │  Decides: script, scenes, transitions, timing
└────────┬────────┘
         │ generates JSON
         ▼
┌─────────────────┐
│  Scene Builder   │  Maps JSON to Remotion inputProps
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│  TTS   │ │ Assets │  Generate narration audio, fetch images
│ Engine │ │ Fetch  │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│ Caption Engine   │  Transcribe TTS → word timestamps
│ (Whisper/Deepgram)│
└────────┬────────┘
         ▼
┌─────────────────┐
│ Remotion Render  │  renderMedia() or renderMediaOnLambda()
│ (Local or Lambda)│
└────────┬────────┘
         ▼
┌─────────────────┐
│   Output MP4     │  Upload to S3, send via Telegram, etc.
└─────────────────┘
```

### Key Design Decisions

1. **Template-first, not prompt-to-code**: Pre-build scene templates, let AI select and populate them with data. Much more reliable than having AI generate Remotion code from scratch.

2. **JSON-driven rendering**: The AI agent outputs a JSON spec, the renderer consumes it. No code generation needed at render time.

3. **Separate TTS from rendering**: Generate audio first, get duration, then set video duration dynamically via `calculateMetadata`.

4. **Caption generation as a pipeline step**: Transcribe TTS audio to get word-level timestamps before rendering, then pass as inputProps.

5. **Lambda for production**: Local rendering for development/testing, Lambda for production scale. A single Lambda function handles all templates.

6. **Webhook for async flow**: Use Lambda webhooks to trigger post-render actions (Telegram notification, database update, upload to ad platform).

---

## Sources

- [The Fundamentals](https://www.remotion.dev/docs/the-fundamentals)
- [Composition](https://www.remotion.dev/docs/composition)
- [Sequence](https://www.remotion.dev/docs/sequence)
- [Series](https://www.remotion.dev/docs/series)
- [AbsoluteFill](https://www.remotion.dev/docs/absolute-fill)
- [interpolate()](https://www.remotion.dev/docs/interpolate)
- [spring()](https://www.remotion.dev/docs/spring)
- [Easing](https://www.remotion.dev/docs/easing)
- [Animating Properties](https://www.remotion.dev/docs/animating-properties)
- [Transitions](https://www.remotion.dev/docs/transitions/)
- [TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries)
- [Presentations (fade, slide, wipe)](https://www.remotion.dev/docs/transitions/presentations)
- [Custom Presentations](https://www.remotion.dev/docs/transitions/presentations/custom)
- [Using Audio](https://www.remotion.dev/docs/using-audio)
- [Audio Volume Control](https://www.remotion.dev/docs/audio/volume)
- [getAudioDurationInSeconds()](https://www.remotion.dev/docs/get-audio-duration-in-seconds)
- [Layers](https://www.remotion.dev/docs/layers)
- [Creating Overlays](https://www.remotion.dev/docs/overlay)
- [B-Roll](https://www.remotion.dev/docs/recorder/editing/b-roll)
- [Captions (@remotion/captions)](https://www.remotion.dev/docs/captions/)
- [createTikTokStyleCaptions()](https://www.remotion.dev/docs/captions/create-tiktok-style-captions)
- [Data Fetching](https://www.remotion.dev/docs/data-fetching)
- [Input Props](https://www.remotion.dev/docs/terminology/input-props)
- [Passing Props](https://www.remotion.dev/docs/passing-props)
- [calculateMetadata()](https://www.remotion.dev/docs/calculate-metadata)
- [Zod Schemas](https://www.remotion.dev/docs/schemas)
- [Variable Duration](https://www.remotion.dev/docs/dynamic-metadata)
- [Dataset Rendering](https://www.remotion.dev/docs/dataset-render)
- [renderMedia()](https://www.remotion.dev/docs/renderer/render-media)
- [Encoding Guide](https://www.remotion.dev/docs/encoding)
- [Quality Guide](https://www.remotion.dev/docs/quality)
- [Video Formats](https://www.remotion.dev/docs/miscellaneous/video-formats)
- [CLI Render](https://www.remotion.dev/docs/cli/render)
- [Lambda](https://www.remotion.dev/docs/lambda)
- [renderMediaOnLambda()](https://www.remotion.dev/docs/lambda/rendermediaonlambda)
- [Lambda Webhooks](https://www.remotion.dev/docs/lambda/webhooks)
- [Lambda Performance](https://www.remotion.dev/docs/lambda/optimizing-speed)
- [Performance Tips](https://www.remotion.dev/docs/performance)
- [Building with AI](https://www.remotion.dev/docs/ai/)
- [AI System Prompt](https://www.remotion.dev/docs/ai/system-prompt)
- [Agent Skills](https://www.remotion.dev/docs/ai/skills)
- [Remotion Skills GitHub](https://github.com/remotion-dev/skills)
- [Text Animations Rules](https://github.com/remotion-dev/skills/blob/main/skills/remotion/rules/text-animations.md)
- [Animations Rules](https://github.com/remotion-dev/skills/blob/main/skills/remotion/rules/animations.md)
- [Transitions Rules](https://github.com/remotion-dev/skills/blob/main/skills/remotion/rules/transitions.md)
- [Display Captions Rules](https://github.com/remotion-dev/skills/blob/main/skills/remotion/rules/display-captions.md)
- [Free Templates (reactvideoeditor)](https://www.reactvideoeditor.com/remotion-templates)
- [TikTok Template](https://github.com/remotion-dev/template-tiktok)
- [Animated Captions Pro](https://www.remotion.pro/store/animated-captions)
- [Video Pipeline DEV Article](https://dev.to/ryancwynar/i-built-a-programmatic-video-pipeline-with-remotion-and-you-should-too-jaa)
- [AI-Generated Video with Remotion (Medium)](https://medium.com/@kenzic/building-ai-generated-video-with-json-render-and-remotion-b9f1000ff7af)
