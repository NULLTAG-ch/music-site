# Cinematic One-Pager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing `index.html` into an Apple-style cinematic scroll experience (scrubbed hero, pinned Schienen sequence, reveal-on-scroll, parallax) with the three tools embedded inline — no data regressions.

**Architecture:** Surgically evolve the current (correct, deployed) `index.html` rather than rewrite. Add GSAP+ScrollTrigger (CDN) and one isolated `initMotion()` IIFE for all motion; content JS (catalog, countdown, tools) stays independent so the page works if GSAP fails. All motion is progressive enhancement gated by `prefers-reduced-motion` and a mobile breakpoint.

**Tech Stack:** Static HTML/CSS/JS (no build). GSAP 3.15 + ScrollTrigger via jsDelivr. Existing `colors_and_type.css` tokens. Branch `feat/cinematic-onepager` (off `main`; backup tag `backup-pre-cinematic-2026-06-14`).

**Verification model:** No test framework. "Test" = serve + verify: `python3 -m http.server 8788` then `curl`/grep for HTTP 200, resolved refs, defined CSS vars, forbidden-term absence; plus a final **browser runtime watch** (the part only a human/browser can confirm: scrub smoothness, pin/unpin, reveals, tool interactivity, reduced-motion + mobile).

**Shared verify snippet** (used by most tasks; run from repo root):
```bash
python3 -m http.server 8788 >/tmp/sv.log 2>&1 & SRV=$!; sleep 1
curl -s -o /dev/null -w "index.html -> %{http_code}\n" http://localhost:8788/index.html
# undefined CSS vars
DEF=$(grep -hoE '^\s*--[a-z0-9-]+\s*:' colors_and_type.css | sed -E 's/[: ]//g' | sort -u)
comm -23 <(grep -oE 'var\(--[a-z0-9-]+\)' index.html | sed -E 's/var\((--[a-z0-9-]+)\)/\1/'|sort -u) <(echo "$DEF") | sed 's/^/UNDEFINED VAR: /'
kill $SRV 2>/dev/null
```

---

### Task 1: Load GSAP + motion base CSS + global guards

**Files:**
- Modify: `index.html` (`<head>` after the `colors_and_type.css` link; `<style>` block; end of body scripts)

- [ ] **Step 1: Add GSAP CDN to `<head>`** (immediately after `<link rel="stylesheet" href="colors_and_type.css" />`)

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js" defer></script>
```

- [ ] **Step 2: Add motion base CSS** at the end of the inline `<style>` (initial hidden state for reveal elements; auto-revealed if motion is off so nothing is ever stuck hidden):

```css
/* ===== motion ===== */
[data-reveal] { opacity: 0; transform: translateY(28px); }
.motion-ready [data-reveal] { will-change: opacity, transform; }
/* fail-safe: if JS/GSAP never runs, or reduced motion, show everything */
.no-motion [data-reveal], html:not(.motion-ready) [data-reveal] { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 3: Add the motion bootstrap** as a new `<script>` right before `</body>` (after the existing content scripts). This sets `no-motion` when motion must be disabled, else `motion-ready`, and defines `initMotion()` (filled in later tasks):

```html
<script>
  (function () {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var smallOrNoGsap = (window.innerWidth <= 720) || !window.gsap || !window.ScrollTrigger;
    function boot() {
      if (reduce || !window.gsap || !window.ScrollTrigger) {
        document.documentElement.classList.add('no-motion');
        return;
      }
      document.documentElement.classList.add('motion-ready');
      gsap.registerPlugin(ScrollTrigger);
      window.__ntMobile = window.innerWidth <= 720; // pins disabled on mobile
      initMotion();
    }
    function initMotion() { /* filled in Tasks 2-6 */ }
    window.initMotion = initMotion;
    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot);
  })();
</script>
```

- [ ] **Step 4: Verify** — run the shared verify snippet. Expected: `index.html -> 200`, no `UNDEFINED VAR` lines. Also confirm GSAP CDN is reachable:

```bash
curl -s -o /dev/null -w "gsap %{http_code}\n" https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js
curl -s -o /dev/null -w "st %{http_code}\n" https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js
```
Expected: both `200`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat(onepager): load GSAP + motion base CSS + guards"
```

---

### Task 2: Reveal-on-scroll system

**Files:** Modify `index.html` (add `data-reveal` to section content blocks; fill reveal logic in `initMotion`)

- [ ] **Step 1: Tag content blocks** — add `data-reveal` to each section's primary content wrappers (the `.s__head`, and each grid/card/row group). For staggered groups add `data-reveal-stagger` to the parent and `data-reveal-item` to children (e.g. `.cat` cards, `.ch` channels, `.rail` articles, `.ro-row`s). Do not tag the hero (Task 3) or elements that must never hide (nav).

- [ ] **Step 2: Implement reveals in `initMotion()`** (append inside the function):

```javascript
// simple reveals
gsap.utils.toArray('[data-reveal]').forEach(function (el) {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});
// staggered groups
gsap.utils.toArray('[data-reveal-stagger]').forEach(function (group) {
  var items = group.querySelectorAll('[data-reveal-item]');
  gsap.fromTo(items, { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06,
    scrollTrigger: { trigger: group, start: 'top 80%', once: true }
  });
});
```

- [ ] **Step 3: Add CSS** for stagger items (same hidden initial state):
```css
.motion-ready [data-reveal-item] { opacity: 0; }
.no-motion [data-reveal-item] { opacity: 1; }
@media (prefers-reduced-motion: reduce){ [data-reveal-item]{ opacity:1 !important; } }
```

- [ ] **Step 4: Verify** — shared snippet (200, no undefined vars). Browser spot: scrolling reveals each section once; with DevTools "Emulate prefers-reduced-motion" everything is visible immediately.

- [ ] **Step 5: Commit** — `git commit -am "feat(onepager): reveal-on-scroll system"`

---

### Task 3: Scrubbed + pinned hero

**Files:** Modify `index.html` (hero markup ids; hero CSS; `initMotion` hero block)

- [ ] **Step 1: Ensure hero has hooks** — the hero `<header class="hero">` keeps `#hero-video`/`#hero-poster`; wrap the headline+stats in `<div class="hero__inner" id="hero-inner">` (already present). Add `id="hero-stats"` to the `.hero__meta`.

- [ ] **Step 2: Hero motion** (append to `initMotion`, guard pins on mobile):

```javascript
if (!window.__ntMobile) {
  var heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', scrub: 1, pin: true }
  });
  heroTl.to('#hero-video', { scale: 1.25, yPercent: 8, ease: 'none' }, 0)
        .to('#hero-poster', { scale: 1.25, yPercent: 8, ease: 'none' }, 0)
        .to('#hero-stats', { opacity: 0, y: -20, ease: 'none' }, 0.4)
        .to('.hero__title', { opacity: 0.15, ease: 'none' }, 0.5);
}
```

- [ ] **Step 3: Verify** — shared snippet. Browser: hero pins, the cosmic visual scales/parallaxes as you scroll ~1.2 screens, stats fade, then the page continues to Latest. On mobile width (≤720) the hero does NOT pin (normal scroll). No layout jump at unpin.

- [ ] **Step 4: Commit** — `git commit -am "feat(onepager): scrubbed pinned hero"`

---

### Task 4: Latest cover parallax

**Files:** Modify `index.html` (`#latest` cover id; `initMotion` block)

- [ ] **Step 1:** Add `id="latest-cover-wrap"` to the `.latest__cover` div.
- [ ] **Step 2:** Append to `initMotion`:
```javascript
if (!window.__ntMobile) {
  gsap.fromTo('#latest-cover-wrap img', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '#latest', start: 'top bottom', end: 'bottom top', scrub: true }
  });
}
```
- [ ] **Step 3: Verify** — shared snippet; browser: cover drifts subtly vs. its frame while scrolling past Latest.
- [ ] **Step 4: Commit** — `git commit -am "feat(onepager): latest cover parallax"`

---

### Task 5: Schienen pinned "light-up" sequence

**Files:** Modify `index.html` (`#schienen` markup ids; CSS for dimmed/active rail; `initMotion` block)

- [ ] **Step 1: CSS** — rails start dimmed; `.rail.is-active` is full. Append:
```css
.motion-ready #schienen .rail { opacity: 0.32; filter: saturate(0.6); transition: opacity .4s var(--ease), filter .4s var(--ease); }
.motion-ready #schienen .rail.is-active { opacity: 1; filter: none; }
.no-motion #schienen .rail, #schienen.no-pin .rail { opacity: 1 !important; filter: none !important; }
```

- [ ] **Step 2: Motion** (append to `initMotion`; mobile = no pin, all rails shown):
```javascript
(function () {
  var sec = document.querySelector('#schienen');
  if (!sec) return;
  var rails = gsap.utils.toArray('#schienen .rail');
  if (window.__ntMobile) { sec.classList.add('no-pin'); return; }
  function setActive(i){ rails.forEach(function(r,idx){ r.classList.toggle('is-active', idx===i); }); }
  setActive(0);
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: '+=' + (rails.length * 60) + '%',
    pin: true, scrub: true,
    onUpdate: function (self) {
      var i = Math.min(rails.length - 1, Math.floor(self.progress * rails.length));
      setActive(i);
    }
  });
})();
```

- [ ] **Step 3: Verify** — shared snippet; browser: section pins, each of the 5 rails lights up in turn as you scroll, then unpins. Mobile: all 5 rails visible, no pin. Reduced-motion: all visible.
- [ ] **Step 4: Commit** — `git commit -am "feat(onepager): schienen pinned light-up sequence"`

---

### Task 6: Catalog hover-parallax polish

**Files:** Modify `index.html` (catalog CSS only — reveal already handled in Task 2)

- [ ] **Step 1:** Confirm `.cat img` already has `transition: transform 600ms` and `.cat:hover img { transform: scale(1.04) }` (from current build). Add a subtle tilt-on-hover:
```css
.cat { transition: transform 200ms var(--ease); }
.cat:hover { transform: translateY(-3px); }
```
- [ ] **Step 2: Verify** — shared snippet; browser: catalog cards lift/zoom on hover; filter buttons still switch rails (LJ shows all 11 live tracks).
- [ ] **Step 3: Commit** — `git commit -am "feat(onepager): catalog hover polish"`

---

### Task 7: Inline tools section (countdown · smart-link · finder)

**Files:** Modify `index.html` (replace the `#tools` "cards linking out" section with the inline tools); reference `tools.html` for markup/CSS/JS to port.

- [ ] **Step 1: Port CSS** — copy the `.cd*`, `.sl*`, `.sf*`, `.gadget*` rules from `tools.html`'s `<style>` into `index.html`'s `<style>` (they use the same tokens; no collisions with existing classes — verify by grepping for each class name in `index.html` first).

```bash
for c in cd__ sl__ sf__ gadget__; do echo "$c -> $(grep -c "$c" index.html)"; done   # expect 0 before porting
```

- [ ] **Step 2: Port markup** — replace the current `<section id="tools">` inner `.channels` (the four outbound `.ch` cards) with the three gadget blocks from `tools.html` (`#cd`/countdown, `#sl`/smart-link, `#sf`/finder), keeping the existing `.s__head`. Keep one small "↗ Standalone / embed" link to `tools.html`.

- [ ] **Step 3: Port JS** — copy the tools JS (countdown `DROPS` + `tickCountdown`, smart-link copy, finder quiz state machine + the 5-rail `RAILS` result map) from `tools.html` into a dedicated `<script>` in `index.html`, AFTER the existing catalog/rollout scripts. Add a header comment: `// NOTE: drop dates duplicated in tools.html — keep in sync.` Mirror the same comment in `tools.html`.

- [ ] **Step 4: De-dup the rollout vs tools countdown** — both use the same dates (19.06 / 26.06 / 03.07). Leave both arrays but ensure values match exactly (Last Light 19.06 188 BPM; EP 26.06; Showroom 03.07).

- [ ] **Step 5: Verify** — shared snippet; ALSO:
```bash
# the three tool roots exist exactly once in the page
for id in 'id="cd-title"' 'id="sl-copy"' 'id="sf-prompt"'; do echo "$id -> $(grep -c "$id" index.html)"; done  # expect 1 each
```
Browser: countdown ticks to 19.06; Smart-Link copy button copies + shows "✓ Kopiert"; Schiene-Finder quiz runs 3 questions and returns one of the 5 real rails with a cover. `tools.html` still works standalone.
- [ ] **Step 6: Commit** — `git commit -am "feat(onepager): embed countdown, smart-link, finder inline"`

---

### Task 8: Rollout / Manifest / Listen reveal polish

**Files:** Modify `index.html` (ensure these sections have the Task-2 reveal hooks; no new motion)

- [ ] **Step 1:** Confirm `#rollout` rows (`.ro-row`, `.ro-grp`) use `data-reveal-stagger`/`-item`; `#manifest` body and `#listen` `.ch` cards have reveal hooks.
- [ ] **Step 2: Verify** — browser: rollout rows cascade in; the two groups (SoundCloud vs streaming) stay visually distinct; manifest + listen reveal.
- [ ] **Step 3: Commit** — `git commit -am "feat(onepager): reveal polish for rollout/manifest/listen"`

---

### Task 9: Reduced-motion + mobile full pass

**Files:** Modify `index.html` (fix anything found)

- [ ] **Step 1: Reduced-motion** — in browser DevTools enable "Emulate CSS prefers-reduced-motion: reduce". Reload. Expected: everything visible, no pin/scrub/parallax, page fully usable. Fix any element stuck hidden.
- [ ] **Step 2: Mobile ≤720** — set viewport to 390px. Expected: hero no pin; schienen no pin (all 5 shown); no horizontal overflow except the family-tree iframe's intended scroll; tools usable; catalog grid reflows.
```bash
# overflow smell test: any fixed huge widths?
grep -nE 'width:\s*[0-9]{4,}px' index.html || echo "no oversized fixed widths"
```
- [ ] **Step 3: Commit** — `git commit -am "fix(onepager): reduced-motion + mobile passes"`

---

### Task 10: Full verification (static + runtime watch)

**Files:** none (verification only)

- [ ] **Step 1: Static sweep** (serve, then):
```bash
# all local refs resolve (skip JS template literals)
for r in $(grep -oE '(href|src)="[^"#]+"' index.html | sed -E 's/(href|src)="//;s/"$//' | grep -vE '^(https?:|mailto:|//|data:)' | grep -vE "[+'{]" | sed -E 's/\?.*$//' | sort -u); do [ -e "$r" ] || echo "MISS $r"; done; echo "ref check done"
# forbidden terms (rails only)
for t in nachtstrom natriumdampflicht; do grep -iq "$t" index.html && echo "FOUND $t" || echo "clean $t"; done
# required data
grep -oE 'LICHTJAHR · 11|49 <small>live|SUPERNOVA <small>LJ-10|19\.06|26\.06|03\.07' index.html | sort -u
```
Expected: no `MISS`, `clean` for both, all required strings present.

- [ ] **Step 2: Runtime watch** (browser — the mandatory human/agent check). Walk the full scroll and confirm, zero console errors:
  - Hero scrubs + pins; releases cleanly.
  - Each section reveals once; Schienen light-up sequence pins/unpins.
  - Catalog filters work; LJ shows 11 tracks.
  - Countdown ticks (19.06); Smart-Link copies; Finder returns a real rail.
  - Rollout shows the SoundCloud-vs-streaming split.
  - Facts/Tree/Tools links + family-tree iframe load.
  - Re-run reduced-motion + 390px mobile (Task 9) once more end-to-end.

- [ ] **Step 3:** If anything fails, fix inline and re-verify before proceeding.

---

### Task 11: Ship decision

**Files:** none

- [ ] **Step 1: Push branch** — `git push -u origin feat/cinematic-onepager`
- [ ] **Step 2: Present to user** the verification results and ask: open a PR, or merge to `main` to deploy live (Pages auto-deploy). Do NOT merge without the user's explicit choice.
- [ ] **Step 3:** On deploy, poll `https://music.nulltag.ch` for the new hero/markers; confirm live. Backup tag `backup-pre-cinematic-2026-06-14` remains the rollback.

---

## Self-review notes

- **Spec coverage:** hero scrub (T3), latest parallax (T4), rollout inline countdown (T7/T8), catalog (T6), schienen pin sequence (T5), lineage iframe (unchanged), inline tools (T7), manifest/listen (T8), reduced-motion + mobile (T1/T9), data correctness (T10), rollback (T11). Facts stays separate (no task — intentional). All covered.
- **No placeholders:** motion JS, CSS, and verify commands are concrete. Section markup ports reference existing, working source files (`index.html` current sections, `tools.html`) rather than re-pasting — DRY, and those files are in the repo.
- **Consistency:** `initMotion()` defined in T1, appended in T2-T5; `__ntMobile` set in T1, used in T3-T5; reveal hooks `data-reveal`/`-stagger`/`-item` consistent across T2/T8.
