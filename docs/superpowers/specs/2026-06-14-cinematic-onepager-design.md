# Cinematic one-pager — design spec

**Date:** 2026-06-14
**Topic:** Apple-style scroll-animated landing for music.nulltag.ch
**Status:** Draft for review
**Backup of current site:** tag `backup-pre-cinematic-2026-06-14` / branch `backup/pre-cinematic-redesign` (commit `1a7071e`)

## Goal

Replace `index.html` with a single, vertically-scrolling cinematic experience in
the spirit of the Apple MacBook product page: scroll-pinned sections,
scroll-scrubbed hero visuals, and reveal-on-scroll throughout — while keeping all
the real NULLTAG information on one page and embedding the interactive tools
inline. Same brutalist-cosmic brand; no factual regressions vs. the current site.

## Non-goals (out of scope)

- `facts.html` stays a separate dedicated full-screen experience, linked from the
  page (hero + rollout). Not folded into the one-pager.
- `facts-read.html`, `family-tree.html`, `tools.html` remain as standalone pages.
  `tools.html` stays the embeddable (`?w=`) version; the one-pager gets its own
  inline copy of the three tools.
- No backend, no build step. Site stays static (GitHub Pages, `deploy.yml`).
- No changes to `config.js` / `app.js` / `build-feed.mjs` data pipeline.

## Approach — GSAP + ScrollTrigger (CDN)

Chosen over native CSS scroll-timeline (uneven Safari/Firefox pin support in 2026)
and hand-rolled vanilla JS (fiddly pin/scrub). GSAP + ScrollTrigger is the
industry standard for this motion, Safari/iOS-reliable (important for the CH
audience), and keeps the site static.

- Load `gsap` + `ScrollTrigger` from a pinned CDN version in `<head>`
  (consistent with React/Babel CDNs already used on tools/facts pages).
  Exact version + CDN URL to be confirmed against current GSAP docs at build time.
- All motion is **progressive enhancement**: the page is fully readable and
  functional with JS disabled or GSAP failing to load (content is real HTML, not
  JS-injected — except the catalog grid and tools, which already render via inline
  JS today and will keep working independently of GSAP).

## Brand / tokens

Reuse `colors_and_type.css` verbatim (Bebas Neue display, Inter Tight brutal,
JetBrains Mono, Space Grotesk; Tiefrot `#ff2a55` accent; void-black; the rail
glow vars). No new color system. New CSS lives in `index.html`'s inline `<style>`
(same pattern as today) plus a small `motion` layer.

## Page structure & motion spec

One `<main>` of stacked full-bleed sections. `data-screen-label` kept for the
existing section-marker aesthetic. Section order and motion:

1. **Hero** — full-viewport. Background = `assets/logo.mp4` (poster
   `assets/logo-poster.png`) as a **scroll-scrubbed** layer (playback/scale tied
   to scroll for the first ~1.2 viewports) behind the wordmark. Pinned wordmark
   `NULLTAG` + the three stat cells (49 Tracks / 05 Schienen / Supernova LJ-10),
   which fade/track out as the hero releases. CTA: ▶ Play latest · ↓ Explore.
2. **Latest — Supernova** — pinned cover (`covers/supernova.jpg`) with subtle
   parallax; cat/meta/desc/platform links reveal in a stagger beside it.
3. **Vol.2 Rollout** — the existing two-group timeline (① SoundCloud weekly
   singles · ② real streaming release) + the **live countdown inline** (19.06 →
   26.06 → 03.07). Rows reveal in sequence; the "real release" group visually
   distinct (Tiefrot-tinted). CTA → `facts.html`.
4. **Catalog** — featured-artwork grid + the rail filters (ALL/LJ/CT/DM/ND/ST).
   Cards stagger-reveal; hover parallax/zoom (existing). Filter interaction
   unchanged (inline JS).
5. **Schienen** — the 5 rails presented as a **scroll-pinned sequence**: the
   section pins and each rail "lights up" (its glow + title color) one at a time
   as the user scrolls through, then unpins. Mobile: plain stacked reveal (no
   pin).
6. **Lineage** — family-tree embedded (`family-tree.html` iframe) as today;
   reveal-in; full-screen link.
7. **Tools (inline)** — Drop-Countdown, Smart-Link, Schiene-Finder built directly
   into a section (ported from `tools.html`, reusing its CSS/JS). All three fully
   interactive in-page. `tools.html` remains the standalone embeddable version.
8. **Manifest** — bilingual statement; reveal-in, drop-cap Tiefrot.
9. **Listen** — six platform channels; stagger reveal.
10. **Footer** — unchanged structure.

## Components / boundaries

- **`index.html`** — markup + inline `<style>` + inline content JS (catalog
  render, rollout countdown, tools logic) + a new small **`initMotion()`** IIFE
  that wires GSAP/ScrollTrigger. `initMotion()` is isolated: if GSAP is absent it
  no-ops and the page is static. Content JS does **not** depend on motion JS.
- **Inline tools** — lifted from `tools.html` (countdown `DROPS`, smart-link copy,
  finder quiz + the 5-rail result map). The drop dates appear in both
  `tools.html` and this inline copy — keep the two in sync (documented in a code
  comment in each).
- **Motion layer** — one block of ScrollTrigger setup; each section's animation is
  an independent, named timeline so they can be tuned/disabled individually.

## Accessibility & performance

- `prefers-reduced-motion: reduce` → skip all scrub/pin/parallax; show everything
  in final state with at most opacity fades. Mandatory.
- Mobile (≤720px): disable pinning + scrubbing (cheap reveal-only); no horizontal
  overflow except the family-tree's intentional scroll.
- Lazy-load below-the-fold images (`loading="lazy"`, already used).
- Hero video `muted playsinline preload="auto"`; poster paints instantly; if the
  video can't play, the poster + static gradient remain.
- Keep SEO `<head>` (JSON-LD, OG, canonical, favicon) intact.

## Assets

All exist in-repo: `assets/logo.mp4`, `assets/logo-poster.png`, all `covers/*.jpg`
(incl. the 11 Lichtjahr tracks). No new art required. GSAP from CDN.

## Data correctness (must not regress)

5 real Schienen; Supernova LJ-10 latest; hero 49 Tracks / 05 Schienen; Lichtjahr
catalog 11 live tracks; rollout 19.06 / 26.06 / 03.07 with the SoundCloud-vs-
streaming split; no Nachtstrom / Echo-rail / Tonband-rail / Natriumdampflicht.

## Verification plan

Static (headless): all local refs resolve; CSS vars defined; forbidden-term grep;
HTTP 200 for the page + assets; GSAP CDN reachable. Runtime (browser, the part a
human/agent must watch): hero scrub smooth, sections pin/unpin without jump,
reveals fire once, catalog filters work, all three inline tools work, countdown
ticks, `prefers-reduced-motion` and ≤720px both degrade gracefully, no console
errors.

## Rollback

`git checkout backup-pre-cinematic-2026-06-14` (or restore `index.html` from it).
Built on branch `feat/cinematic-onepager`; `main` stays live until merge.
