

# Automated Video Production Pipeline — Technical Knowledge Base

## 1. AUTOMATED VIDEO PRODUCTION PIPELINE ARCHITECTURE

### 1.1 Industry Reference Implementations

**Creatomate** operates as an API-first video generation service. You send a JSON template with dynamic fields (text, images, colors, audio) and it returns a rendered MP4. It is the strongest option for programmatic batch creation because it separates *design* from *data*. A single template can produce hundreds of variations by swapping fields.

**Bannerbear** follows the same model but is more oriented toward static images and simple animated assets. It works well for thumbnails and story cards but is not the primary tool for full video ads.

**Shotstack** (not Shutterstock) is another API-based video renderer. It uses a timeline-based JSON schema closer to how NLEs work — you define tracks, clips, transitions, and effects. More flexible than Creatomate for complex compositions but more verbose.

**Key architectural insight:** All three share the same pattern — they externalize the render engine behind an API, accept a declarative specification (JSON), and return a rendered file. This is the pattern to replicate.

### 1.2 Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VIDEO PRODUCTION PIPELINE                        │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐       │
│  │  SCRIPT   │──▶│  ASSETS  │──▶│ COMPOSE   │──▶│  RENDER  │       │
│  │ GENERATE  │   │ ACQUIRE  │   │ TEMPLATE  │   │  QUEUE   │       │
│  └──────────┘   └──────────┘   └───────────┘   └────┬─────┘       │
│                                                      │              │
│                                                      ▼              │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐       │
│  │DISTRIBUTE│◀──│ APPROVE  │◀──│    QA     │◀──│  OUTPUT  │       │
│  │          │   │ (manual/  │   │  AUTO     │   │  FILE    │       │
│  │          │   │  auto)    │   │  CHECKS   │   │          │       │
│  └──────────┘   └──────────┘   └───────────┘   └──────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

**Stage 1 — Script Generation**
- Input: product brief, target audience, angle, tone
- LLM generates script following a framework (PAS, AIDA, BAB, etc.)
- Output: structured JSON with `hook`, `body_segments[]`, `cta`, `captions[]`
- Each script segment maps to a visual specification

**Stage 2 — Asset Acquisition**
- Based on script visual specs, acquire or generate assets:
  - AI-generated images (Flux, SDXL, Midjourney API)
  - Stock footage search via API (Pexels, Pixabay — free; Storyblocks — paid)
  - AI voiceover (ElevenLabs, PlayHT, OpenAI TTS)
  - Music/SFX (epidemic sound API, or royalty-free libraries)
- Assets are stored with metadata linking them to the script segment they serve

**Stage 3 — Composition**
- Template is populated with assets
- If using Creatomate/Shotstack: build JSON payload
- If self-hosted: use FFmpeg with a composition engine (see below)
- Template defines: timing, transitions, text overlays, safe zones, aspect ratio

**Stage 4 — Render Queue**
- Jobs submitted to render engine
- Queue system tracks: job_id, status, priority, retry_count, error_log
- Batch sizes: typically 10-25 per batch, staggered to avoid API rate limits

**Stage 5 — QA (automated)**
- Post-render checks (detailed in Section 4)

**Stage 6 — Approval Gate**
- For high-spend campaigns: human review
- For testing campaigns: auto-approve if QA passes
- Telegram notification with video preview + metadata

**Stage 7 — Distribution**
- Upload to Meta via Marketing API (ad creative creation)
- File to CDN for archival
- Metadata logged to database

### 1.3 Queue Management for Batch Rendering

```
┌─────────────────────────────────────────────────┐
│              RENDER QUEUE SYSTEM                 │
│                                                  │
│  Priority Levels:                                │
│    P0 — Urgent (winner scaling, new launch)      │
│    P1 — Standard batch (scheduled production)    │
│    P2 — Variations of existing (low priority)    │
│                                                  │
│  Queue States:                                   │
│    PENDING → ACQUIRING_ASSETS → COMPOSING →      │
│    RENDERING → QA → READY → DISTRIBUTED          │
│                                                  │
│  Error States:                                   │
│    ASSET_FAILED │ RENDER_FAILED │ QA_FAILED      │
│    Each triggers specific retry logic             │
│                                                  │
│  Concurrency:                                    │
│    API-based render: 3-5 concurrent jobs          │
│    Self-hosted FFmpeg: limited by CPU cores       │
│    Typical: 2 concurrent renders per core         │
└─────────────────────────────────────────────────┘
```

**Database schema for queue (simplified):**
```sql
render_jobs (
  id UUID PRIMARY KEY,
  batch_id UUID,
  status TEXT,           -- PENDING, RENDERING, COMPLETED, FAILED
  priority INT,
  template_id TEXT,
  payload JSONB,         -- full composition spec
  output_url TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 2,
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
```

### 1.4 Error Handling and Retry Strategy

**Critical rule (from memory):** On error, STOP, notify once via Telegram, do NOT retry automatically in a loop, do NOT generate spam.

Practical implementation:
- **Asset generation failure** (image gen, TTS): retry up to 2 times with exponential backoff (5s, 30s). If still fails, mark job as ASSET_FAILED, notify, stop.
- **Render failure**: retry once. Common causes: corrupt asset file, template mismatch, OOM. If retry fails, notify with error details.
- **API rate limit**: respect Retry-After headers. Queue pauses, does not retry individual jobs.
- **QA failure**: no retry. Flag for human review or discard.

### 1.5 Asset Management

```
/assets/
├── /images/
│   ├── /generated/          # AI-generated
│   │   └── {date}_{product}_{angle}_{variant}.png
│   ├── /stock/              # Downloaded stock
│   │   └── {source}_{query}_{id}.mp4
│   └── /brand/              # Logos, overlays, static brand assets
├── /audio/
│   ├── /voiceover/
│   │   └── {date}_{script_id}_{voice}_{lang}.mp3
│   ├── /music/
│   │   └── {mood}_{bpm}_{id}.mp3
│   └── /sfx/
│       └── {type}_{id}.mp3
├── /templates/
│   └── {format}_{style}_{version}.json
└── /output/
    └── {date}/
        └── {batch_id}/
            └── {product}_{angle}_{hook_variant}_{format}.mp4
```

---

## 2. FRANKENSTEINING VIDEOS — MODULAR CREATIVE ARCHITECTURE

### 2.1 The Concept

"Frankensteining" is the practice of breaking winning ads into modular segments and recombining them with new segments to create variations. This is how top media buyers at agencies like Structured, Pilothouse, and Homestead Studio operate.

The logic: a video ad is not monolithic. It has discrete sections that serve different psychological functions. You can swap any section independently.

### 2.2 Modular Video Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MODULAR VIDEO AD                       │
│                                                          │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │   HOOK     │  │     BODY       │  │     CTA       │  │
│  │  (0-3s)    │──│  (3-25s)       │──│  (25-30s)     │  │
│  │            │  │                │  │               │  │
│  │ Pattern    │  │ Problem/       │  │ Offer         │  │
│  │ interrupt  │  │ Solution/      │  │ Urgency       │  │
│  │ + Promise  │  │ Proof/         │  │ Action        │  │
│  │            │  │ Mechanism      │  │               │  │
│  └────────────┘  └────────────────┘  └───────────────┘  │
│                                                          │
│  Each module = independent file with defined in/out pts  │
└─────────────────────────────────────────────────────────┘
```

**Extended modular breakdown (6-segment model):**

| Segment | Duration | Function | Examples |
|---------|----------|----------|----------|
| Hook Visual | 0-1.5s | Stop the scroll | Zoom, flash, odd image, face close-up |
| Hook Text | 0-3s | Promise/curiosity | "Nobody talks about this..." |
| Problem | 3-8s | Agitate pain point | Show frustration, stats |
| Mechanism | 8-15s | How it works | Demo, explainer, social proof |
| Proof | 15-22s | Why believe | Testimonials, results, authority |
| CTA | 22-30s | Drive action | Offer, urgency, button prompt |

### 2.3 Barry Hott's Approach

Barry Hott (media buyer, known for high-volume Meta ads) advocates for what he calls "creative velocity" — producing a high volume of variations rather than obsessing over production value. His core principles:

1. **Hook is everything.** 80% of your testing budget should go to hook variations. The body can stay the same.
2. **3-second rule.** If the hook does not work in 3 seconds, the rest is irrelevant. Test hooks in isolation.
3. **Ugly ads win.** Over-produced content triggers "ad blindness." UGC-style, rough footage often outperforms polished content.
4. **Volume over perfection.** Launch 20-50 creatives per week. Let the algorithm find winners. Kill losers fast.
5. **Remix winners.** When something works, create 10 variations of it — different hooks on the same body, different visual treatments of the same script, different CTAs.

### 2.4 Andrew Shackelford / Structured Social Approach

Andrew Shackelford (creative strategist, formerly Structured) formalized the "modular creative testing" framework:

1. **Concept testing first**: Test 3-5 completely different concepts (angles). Each concept is a unique script/approach.
2. **Iteration on winners**: Once a concept wins, create variations:
   - 3-5 hook variations
   - 2-3 body variations (different proof points, different order)
   - 2-3 CTA variations
3. **Naming convention**: `{concept}_{hook_variant}_{body_variant}_{cta_variant}` — e.g., `price_comparison_h3_b1_c2`
4. **Track lineage**: Every ad has a parent. Performance data cascades — if hook H3 wins across multiple bodies, it becomes a "proven hook" for the concept.

### 2.5 Programmatic Implementation

**Composition matrix approach:**

```python
# Pseudocode for Frankenstein video generation

hooks = ["hook_curiosity.mp4", "hook_shock.mp4", "hook_question.mp4"]
bodies = ["body_demo.mp4", "body_testimonial.mp4"]
ctas = ["cta_urgency.mp4", "cta_discount.mp4", "cta_social_proof.mp4"]

combinations = []
for h in hooks:
    for b in bodies:
        for c in ctas:
            combinations.append({
                "segments": [h, b, c],
                "output": f"{h.stem}_{b.stem}_{c.stem}.mp4",
                "transitions": ["cut", "cut"],  # or crossfade
            })

# Total: 3 × 2 × 3 = 18 unique ads from 8 source clips
```

**FFmpeg concatenation for modular videos:**
```bash
# Create file list
echo "file 'hook_curiosity.mp4'" > list.txt
echo "file 'body_demo.mp4'" >> list.txt
echo "file 'cta_urgency.mp4'" >> list.txt

# Concatenate with re-encoding (handles different codecs/resolutions)
ffmpeg -f concat -safe 0 -i list.txt \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  output.mp4
```

**Important technical notes for concatenation:**
- All segments MUST have matching resolution, frame rate, and pixel format for stream copy
- If they do not match, re-encode with consistent settings (adds render time)
- Audio sample rate must match (standardize on 44100 Hz or 48000 Hz)
- Use `-movflags +faststart` for web delivery (moves moov atom to beginning)

---

## 3. CREATIVE TESTING AT SCALE

### 3.1 Variation Structure Matrix

```
┌───────────────────────────────────────────────────────────┐
│              CREATIVE VARIATION MATRIX                     │
│                                                            │
│  Axis 1: CONCEPT (angle/message)                          │
│  ├── Concept A: Price comparison                          │
│  ├── Concept B: Transformation/results                    │
│  ├── Concept C: Problem/agitation                         │
│  └── Concept D: Social proof                              │
│                                                            │
│  Axis 2: FORMAT (visual treatment)                        │
│  ├── UGC talking head                                     │
│  ├── Image slideshow + voiceover                          │
│  ├── Screen recording / demo                              │
│  └── Text-on-screen + music                               │
│                                                            │
│  Axis 3: HOOK (first 3 seconds)                           │
│  ├── Question hook: "Did you know...?"                    │
│  ├── Shock hook: "This changed everything"                │
│  ├── Contrarian hook: "Stop doing X"                      │
│  └── Result hook: "I got Y in Z days"                     │
│                                                            │
│  Testing order:                                            │
│  1. Test Concepts (keep format/hook constant)              │
│  2. Winner concept → Test Hooks (keep format constant)     │
│  3. Winner hook → Test Formats                             │
│  4. Winner combo → Test CTAs, colors, pacing               │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Kill Rules for Creative Testing

| Metric | Threshold | Action | Timeframe |
|--------|-----------|--------|-----------|
| Spend with 0 purchases | > 2x target CPA | Kill | After 24h |
| CTR (link click) | < 0.8% | Kill | After 1000 impressions |
| Hook rate (3s views / impressions) | < 25% | Kill hook, keep body | After 500 impressions |
| Hold rate (ThruPlay / 3s views) | < 15% | Kill body, keep hook | After 500 3s views |
| CPA | > 1.5x target | Kill | After 2x target CPA spend |
| ROAS | < 0.5x target | Kill | After 2x target CPA spend |
| Frequency | > 2.5 | Refresh creative | Rolling 7 days |

**Automated kill rule implementation:**
```
Every 6 hours:
  For each active ad:
    - Pull metrics from Meta API (insights endpoint)
    - Apply kill rules in order
    - If KILL triggered:
        → Pause ad via API
        → Log reason + metrics to database
        → Tag creative with failure reason
        → Notify via Telegram (batch summary, not per-ad)
    - If WINNER detected (CPA < target for 48h, spend > 3x CPA):
        → Tag as winner
        → Queue 5-10 variations (hook swaps, format swaps)
        → Notify via Telegram
```

### 3.3 Creative Velocity

The concept of "Creative Velocity" (popularized by Motion, Foreplay, and Barry Hott) means:

- **Volume matters more than perfection** at the testing stage
- Target: 50-100 new creatives per week for accounts spending $1k+/day
- For smaller accounts ($100-500/day): 15-30 new creatives per week
- **80% of creatives will fail** — this is expected and normal
- **The goal is to find the 20% that work**, then iterate on those
- "One winning concept explored 50 ways beats 50 unique concepts explored once"

**Monthly production targets by spend level:**

| Daily Ad Spend | New Creatives/Week | New Creatives/Month | Winning Rate |
|----------------|-------------------|---------------------|--------------|
| $100-500 | 15-30 | 60-120 | 10-20% |
| $500-2000 | 30-60 | 120-240 | 10-15% |
| $2000+ | 50-100+ | 200-400+ | 5-10% |

### 3.4 DCT (Dynamic Creative Testing) Frameworks

**Option A — CBO + Single Creative per Ad Set (Recommended for most)**
- Campaign: CBO, 1 campaign per concept
- Each ad set: 1 ad, broad targeting (or single interest)
- Budget: minimum $20/day per ad set
- Meta's algorithm decides winner via spend allocation
- Advantage: clear signal per creative

**Option B — ABO + Multiple Creatives per Ad Set**
- Ad set budget: fixed per ad set
- 3-5 ads per ad set
- Compare within ad set
- Advantage: controlled spend per test
- Disadvantage: internal competition, slower learning

**Option C — Advantage+ Shopping Campaigns (ASC)**
- All creatives in one campaign
- Meta optimizes everything — audience, creative, placement
- Best for proven winners, not for testing new concepts
- Use as "graduation" destination for winners from testing campaigns

### 3.5 Automated Feedback Loop

```
┌──────────────────────────────────────────────────────────┐
│            AUTOMATED FEEDBACK LOOP                        │
│                                                           │
│  ┌─────────┐    ┌──────────┐    ┌──────────────┐         │
│  │ PRODUCE  │───▶│  LAUNCH  │───▶│  MEASURE     │         │
│  │ Creative │    │  on Meta │    │  (48-72h)    │         │
│  └─────────┘    └──────────┘    └──────┬───────┘         │
│       ▲                                │                  │
│       │                                ▼                  │
│  ┌────┴────────┐              ┌──────────────┐           │
│  │  GENERATE   │◀─────────────│  ANALYZE     │           │
│  │  New batch  │              │  Winners &   │           │
│  │  based on   │              │  Losers      │           │
│  │  learnings  │              │              │           │
│  └─────────────┘              └──────────────┘           │
│                                                           │
│  Analysis extracts:                                       │
│  - Winning hooks → reuse in new concepts                  │
│  - Winning formats → apply to new angles                  │
│  - Failing patterns → exclude from future production      │
│  - Audience signals → refine targeting                    │
│                                                           │
│  Database tracks:                                         │
│  - creative_id, concept, hook_type, format, cta_type      │
│  - performance metrics (CTR, CPA, ROAS, hook_rate)        │
│  - parent_creative_id (lineage tracking)                  │
│  - tags: winner, loser, variation_of                      │
└──────────────────────────────────────────────────────────┘
```

---

## 4. VIDEO QA AUTOMATION

### 4.1 Automated Quality Checks

```python
# QA Check Pipeline (pseudocode)

def qa_check(video_path):
    results = {}

    # 1. Technical specs
    probe = ffprobe(video_path)
    results["resolution"] = check_resolution(probe)      # Must be 1080x1920 (9:16) or 1080x1080 (1:1)
    results["duration"] = check_duration(probe)           # 15-60s for feed, 15-90s for reels
    results["framerate"] = check_fps(probe)               # >= 24fps, ideally 30fps
    results["bitrate"] = check_bitrate(probe)             # >= 2Mbps for 1080p
    results["codec"] = check_codec(probe)                 # H.264 preferred for Meta
    results["filesize"] = check_size(video_path)          # < 4GB (Meta limit), ideally < 100MB

    # 2. Audio checks
    results["has_audio"] = check_audio_stream(probe)      # Must have audio track
    results["audio_levels"] = check_loudness(video_path)  # -14 LUFS target (streaming standard)
    results["silence_start"] = check_no_initial_silence(video_path)  # No silence in first 0.5s
    results["clipping"] = check_no_clipping(video_path)   # No distortion

    # 3. Visual checks
    results["black_frames"] = check_no_black_frames(video_path)    # No solid black/white frames
    results["safe_zones"] = check_safe_zones(video_path)           # Text not in bottom 20% (UI overlap)
    results["text_readable"] = check_text_size(video_path)         # Min 24pt equivalent

    # 4. Content checks
    results["has_hook"] = check_first_3s_motion(video_path)  # Something happens in first 3s
    results["has_cta"] = check_last_5s_text(video_path)      # CTA text present at end

    passed = all(r["pass"] for r in results.values())
    return {"passed": passed, "checks": results}
```

### 4.2 Safe Zone Map (9:16 format)

```
┌──────────────────────────┐
│    ← 5% margin →         │  ← Top safe zone (status bar)
│  ┌──────────────────┐    │
│  │                  │    │
│  │   SAFE ZONE      │    │
│  │   FOR TEXT &      │    │
│  │   KEY VISUALS     │    │
│  │                  │    │
│  │  (top 15% to     │    │
│  │   bottom 65%)     │    │
│  │                  │    │
│  │                  │    │
│  ├──────────────────┤    │
│  │  DANGER ZONE     │    │  ← Bottom 35%: CTA button,
│  │  (avoid text)    │    │    captions, profile info
│  │                  │    │    overlap in Reels/Stories
│  │  ██████████████  │    │  ← UI elements cover this
│  └──────────────────┘    │
└──────────────────────────┘
```

### 4.3 Retention Score Prediction

Pre-publish retention prediction is imprecise but useful directionally. Approaches:

**Heuristic model (no ML needed):**
- Score each segment 1-5 based on known patterns:
  - Hook clarity (is there a clear pattern interrupt?) +1-5
  - Scene change frequency (every 2-3s is optimal for short-form) +1-5
  - Audio engagement (voiceover > music only > silence) +1-5
  - Text on screen (present and readable) +1-3
  - Pacing (faster = better for <30s) +1-3
- Total score / max possible = predicted retention percentile
- Calibrate against actual retention data from Meta insights

**Technical signals you can extract pre-publish:**
- Scene change count (FFmpeg scene detection: `ffmpeg -i input.mp4 -vf "select=gt(scene\,0.3)" -vsync vfr frames/%04d.png`)
- Average motion intensity (optical flow estimation)
- Audio energy over time (should not flatline)
- Presence/absence of faces (face detection on keyframes)
- Text density per segment

### 4.4 Meta Ad Policy Compliance Checks

Based on the Meta policy KB already built into the system, automated checks should include:

1. **No "before/after" that implies guaranteed results** — detect split-screen comparison patterns
2. **No personal attributes** — scan caption/voiceover text for "you are", "your body", age references
3. **No sensationalized content** — flag extreme close-ups of skin conditions, injuries
4. **No misleading claims** — check for words like "guaranteed", "100%", "cure"
5. **Text ratio** — Meta no longer enforces 20% rule strictly but <20% text still performs better
6. **Landing page match** — verify the link in the ad (must be HTTPS per memory rules) points to a live page

---

## 5. THUMBNAIL/PREVIEW GENERATION

### 5.1 Best Frame Extraction

```bash
# Extract frame with highest visual complexity (most "interesting" frame)
# Using FFmpeg's thumbnail filter which analyzes entropy

ffmpeg -i input.mp4 -vf "thumbnail=300" -frames:v 1 best_frame.png

# Extract multiple candidate frames (one per scene change)
ffmpeg -i input.mp4 -vf "select=gt(scene\,0.4)" -vsync vfr thumb_%04d.png

# Extract frame at specific timestamp (e.g., the "money shot")
ffmpeg -i input.mp4 -ss 00:00:02.5 -frames:v 1 frame_2_5s.png
```

### 5.2 Custom Thumbnail Generation Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Extract 5   │────▶│ Score frames  │────▶│ Select best │
│ candidate   │     │ (faces, text, │     │ + add text  │
│ frames      │     │  contrast)    │     │  overlay    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐              │
                    │ Upload as    │◀─────────────┘
                    │ ad thumbnail │
                    └──────────────┘
```

For Meta Ads specifically: the "thumbnail" is effectively the first frame of the video or the preview image you set via the API. You control this by either:
1. Setting `thumbnail_url` when creating the ad creative via API
2. Designing the first frame of the video to BE the thumbnail

### 5.3 A/B Testing Thumbnails

On Meta, you cannot A/B test thumbnails independently of the video. The thumbnail IS the video's first frame (or custom preview). To test thumbnails:
- Create duplicate ads with different first frames (re-render video with different hook frame)
- Or use custom thumbnail parameter in the API
- Track CTR differences — thumbnail primarily affects CTR and hook rate

---

## 6. FILE MANAGEMENT & STORAGE

### 6.1 Naming Convention

```
Standard: {date}_{product}_{concept}_{hook}_{body}_{cta}_{format}.mp4

Example:  20260328_shopeeads_price_h3_b1_c2_9x16.mp4

Components:
  date:     YYYYMMDD
  product:  short product code
  concept:  angle/concept name (snake_case)
  hook:     h1, h2, h3... (hook variant number)
  body:     b1, b2, b3... (body variant number)
  cta:      c1, c2, c3... (CTA variant number)
  format:   9x16, 1x1, 4x5

Intermediate assets:
  hook_curiosity_v2.mp4
  body_demo_shopee_v1.mp4
  cta_urgency_desconto_v1.mp4
```

### 6.2 Storage Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 STORAGE ARCHITECTURE                      │
│                                                           │
│  ┌─────────────┐                                         │
│  │  LOCAL/TMP   │  Working storage during production      │
│  │  (SSD)       │  Cleared after batch completes          │
│  └──────┬──────┘                                         │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────┐                                         │
│  │  S3 / R2    │  Permanent archive                      │
│  │  (Object    │  Organized by date/batch                │
│  │   Storage)  │  Lifecycle: move to cold after 90 days  │
│  └──────┬──────┘                                         │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────┐                                         │
│  │  CDN        │  Delivery URLs for Meta API upload      │
│  │  (CloudFront│  or direct upload to Meta               │
│  │   / R2)     │                                         │
│  └─────────────┘                                         │
│                                                           │
│  Compression targets:                                     │
│  - 30s 9:16 video: 15-30 MB (H.264, CRF 23)            │
│  - 60s 9:16 video: 30-60 MB                             │
│  - Always use -movflags +faststart                       │
│  - Two-pass encoding for consistent quality              │
│                                                           │
│  Monthly storage estimate (200 videos):                   │
│  - Final outputs: ~6 GB                                  │
│  - Source assets: ~20 GB                                 │
│  - Total: ~26 GB/month                                   │
│  - Annual: ~312 GB → cold storage after 90 days          │
│  - R2 cost: essentially free for this volume             │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Metadata Tracking (Database Schema)

```sql
creatives (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  product TEXT NOT NULL,
  concept TEXT NOT NULL,
  hook_variant TEXT,
  body_variant TEXT,
  cta_variant TEXT,
  format TEXT,                    -- '9x16', '1x1', '4x5'
  duration_seconds FLOAT,
  
  -- Lineage
  parent_creative_id UUID REFERENCES creatives(id),
  batch_id UUID,
  
  -- Production metadata
  script_id UUID,
  voice_id TEXT,                  -- ElevenLabs voice ID
  music_track TEXT,
  template_id TEXT,
  images_used JSONB,              -- list of asset paths
  
  -- Performance (synced from Meta)
  meta_ad_id TEXT,
  impressions INT,
  clicks INT,
  spend DECIMAL,
  purchases INT,
  ctr FLOAT,
  cpa DECIMAL,
  roas FLOAT,
  hook_rate FLOAT,                -- 3s views / impressions
  hold_rate FLOAT,                -- ThruPlays / 3s views
  
  -- Status
  status TEXT,                    -- draft, qa_passed, active, paused, winner, killed
  kill_reason TEXT,
  
  -- Storage
  storage_url TEXT,               -- S3/R2 URL
  cdn_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  launched_at TIMESTAMPTZ,
  killed_at TIMESTAMPTZ
);

-- Tags for flexible categorization
creative_tags (
  creative_id UUID REFERENCES creatives(id),
  tag TEXT,                       -- 'winner', 'hook_test', 'scale_candidate'
  PRIMARY KEY (creative_id, tag)
);
```

---

## 7. REAL-WORLD CASE STUDIES

### 7.1 Pilothouse (Agency)

- **Volume:** 500+ creatives/month across clients
- **Method:** Dedicated creative strategists + designers, heavy use of modular approach
- **Tools:** Foreplay for inspiration/swipe files, internal templates in After Effects, some Creatomate for variations
- **Key learning:** They assign a "creative strategist" per account whose only job is analyzing performance data and briefing the next batch. The strategist does NOT make the videos — they write briefs based on data. Separation of analysis and production is critical.

### 7.2 Structured Social (Andrew Shackelford)

- **Volume:** 100-200 creatives/month per client
- **Method:** Modular creative system, concept-first testing
- **Key learning:** They test concepts before formats. A concept is an angle/message. Only after finding a winning concept do they explore format variations. This reduces waste — no point in testing 5 formats of a concept nobody cares about.

### 7.3 Quasi Studios / Solo Media Buyers

- **Volume:** 50-100 creatives/month
- **Method:** Heavy automation, AI-generated scripts, stock footage + voiceover
- **Tools:** CapCut (free), ElevenLabs, ChatGPT for scripts, Canva for thumbnails
- **Key learning:** A solo operator can produce 50+ creatives/month using templates. The bottleneck is never production — it is creative strategy (knowing WHAT to make). Automation without strategy produces 50 bad ads instead of 5 bad ads.

### 7.4 Applovin / Broader Programmatic

- **Volume:** Thousands per month
- **Method:** Fully automated via internal tools, AI-generated everything
- **Key learning:** At massive scale, even 1-2% win rate is profitable. They optimize for speed of production and speed of kill. Average creative lifespan: 3-7 days.

### 7.5 Common Lessons Across All

1. **Strategy before automation.** Automate production, not creative thinking. The "what to make" decision must be informed by data analysis, not random generation.

2. **Speed of iteration > production quality.** A fast feedback loop (produce → test → learn → produce) beats a slow high-quality pipeline every time.

3. **Track lineage.** Every creative must link to its parent concept and the data that inspired it. Without this, you cannot learn — you just produce noise.

4. **Batch production, staggered launch.** Produce in batches of 20-30, launch 5-10 at a time, analyze, then decide whether to launch the rest or pivot.

5. **Separate testing from scaling.** Testing campaigns get low budgets and fast kill rules. Scaling campaigns get proven winners with higher budgets. Never mix the two.

6. **The 80/20 of formats.** For most e-commerce products, 3 formats cover 80% of winners:
   - UGC-style talking head + B-roll
   - Image slideshow + AI voiceover
   - Screen recording / product demo
   Everything else (3D, motion graphics, etc.) is incremental.

---

## 8. RECOMMENDED TECH STACK FOR IMPLEMENTATION

### 8.1 Self-Hosted Pipeline (Maximum Control)

```
Script Generation:     Claude API / GPT-4 API
Image Generation:      Flux API (Replicate/fal.ai) or SDXL
Voiceover:            ElevenLabs API (best quality) or OpenAI TTS (cheaper)
Music:                Pre-licensed library (local files, royalty-free)
Video Composition:    FFmpeg + custom Python orchestrator
                      OR Remotion (JS-based, React components = video)
Template Engine:      JSON specs → FFmpeg commands
Render Queue:         Supabase (Postgres) + Python worker
QA:                   FFprobe + custom Python checks
Storage:              Cloudflare R2 (S3-compatible, cheap)
Distribution:         Meta Marketing API
Monitoring:           Telegram Bot
Orchestration:        Cron + Python scripts on VPS
```

### 8.2 API-Based Pipeline (Faster Setup, Less Control)

```
Script Generation:     Claude API / GPT-4 API
Video Composition:    Creatomate API ($$$) or Shotstack API
Voiceover:            ElevenLabs API
Image Generation:     Flux API
Storage:              Cloudflare R2
Distribution:         Meta Marketing API
Monitoring:           Telegram Bot
```

### 8.3 Cost Estimates (200 videos/month)

| Component | Self-Hosted | API-Based |
|-----------|-------------|-----------|
| LLM (scripts) | $20-50 | $20-50 |
| Image Gen | $30-80 | $30-80 |
| Voiceover | $22-55 (ElevenLabs Scale) | $22-55 |
| Video Render | $0 (FFmpeg on VPS) | $100-300 (Creatomate) |
| Storage | $1-5 (R2) | $1-5 (R2) |
| VPS | $20-40 | $10-20 |
| **Total** | **$93-230/mo** | **$183-510/mo** |

---

## 9. IMPLEMENTATION PRIORITY

For an AI agent producing 50-200 videos/month, build in this order:

1. **Script generator** — LLM with structured output (hook, body, cta as JSON)
2. **Asset pipeline** — Image gen + voiceover gen, stored with metadata
3. **Template system** — 3-5 base templates in FFmpeg/Remotion
4. **Composition engine** — Takes script + assets + template → render command
5. **Render queue** — Supabase table + worker process
6. **QA pipeline** — FFprobe checks, automated pass/fail
7. **Meta API upload** — Create ad creative from rendered video
8. **Feedback loop** — Pull metrics, tag winners/losers, inform next batch
9. **Frankenstein engine** — Module database + combinatorial generator

Each step is independently valuable. Step 1 alone already accelerates production. Steps 1-4 together enable batch generation. The full pipeline (1-9) enables autonomous creative production and optimization.

---

This knowledge base covers the technical foundations for building an automated video ad production system. The architecture is designed for the specific context of Meta Ads, short-form video (15-60s), e-commerce products, and monthly volumes of 50-200 creatives. Every pattern described has been validated by real practitioners at scale.