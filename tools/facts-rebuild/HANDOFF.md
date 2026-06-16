# Facts-Video / Cosmic-Content — Handoff & Playbook

> Wie das Lichtjahr-Vol.2-Physik-Video (und Shorts/Canvas) gebaut wurde, was funktioniert
> und was nicht — als Rezeptbuch für **alle weiteren Canvas-Loops, Shorts und Cosmic-Videos**.
> Stand: 2026-06-17 · Autor: Claude (für Ivan/NULLTAG)

---

## 0 · TL;DR — der Stack

1. **Stills** mit Higgsfield **GPT Image 2** (16:9, 2k) — volle Art-Direction-Kontrolle.
2. **Image-to-Video**: Still → Clip. **Veo 3.1 preview/high** (Kino) oder **Kling 3.0 pro** (Fallback/günstig).
3. **Overlay** (Captions/Intro/Outro) = Browser-Animations-Engine (`animations.jsx`), frame-genau via **Playwright** mit **transparentem** Hintergrund gecaptured (Alpha-PNG-Sequenz).
4. **Composite + Schnitt + Audio** = **ffmpeg** (Overlay über Clip, Per-Track-Musik, web-encode).

Alles Lokale (Overlay-Capture, ffmpeg) ist **gratis**; nur Higgsfield-Renders kosten Credits.

---

## 1 · Higgsfield — Modelle, Kosten, Fallstricke

CLI: `higgsfield generate create <model> --prompt "…" [--image|--start-image <pfad>] --wait --json`
Kosten vorab: `higgsfield generate cost <model> …` · Konto: `higgsfield account status`

| Zweck | Modell | ~Kosten | Notiz |
|---|---|---|---|
| Still (Hero) | `gpt_image_2` (2k,16:9) | 7 cr | beste Kontrolle/Text |
| Still (günstig) | `nano_banana_2` / `flux_2` | 1–2 cr | |
| Video Kino | `veo3_1` `--model veo-3-1-preview --quality high` | **58 cr/8s** | SOTA; max 8s; nativ 9:16 |
| Video Kino max | `veo3_1` preview/ultra | 87 cr/8s | selten nötig |
| Video günstig/Fallback | `kling3_0 --mode pro` | **10 cr/5s · 20 cr/10s** | bis 10s; nimmt `--start-image` |
| Reframe (Workflow) | `reframe` | **78 cr** ⛔ | **nicht nutzen** — lokal croppen ist gratis |

### ⚠️ Wichtigster Fallstrick: Veo-Moderation flaggt Kosmos-Motive als NSFW (Fehlalarm)
- **Helle, runde/symmetrische, warm-/dicht-texturierte Vollbild-Motive** (Planeten-Cluster, glühende Galaxien-Blobs, glühende Kugeln, CMB-Mottling) werden von Veo 3.1 **wiederholt fälschlich als `nsfw`** abgelehnt. Dunkle/sparsame Szenen (Schwarzes Loch, einzelner Stern) gehen durch.
- Umkomponieren des Stills half **nicht** zuverlässig.
- ✅ **Lösung: dieselben Stills über `kling3_0` rendern** — andere Moderation, geht problemlos durch. (Trappist, Event Horizon, Last Light → Veo; Andromeda, Supernova, CMB → Kling.)
- 💸 `nsfw`- und `failed`-Jobs werden **automatisch erstattet** — Fehlversuche kosten nichts (nur Wartezeit). Bei `502`/Transient einfach erneut.

### Smoothness
- Veo max 8s, Kling bis 10s. Clips auf Szenenlänge **strecken** kostet fps. Lieber **Kling nativ 10s** rendern statt 5s→10s zu strecken (sonst ~15 fps, ruckelt).
- Beim Strecken in ffmpeg `setpts` nutzen; ggf. `minterpolate` für echte Zwischenframes.

---

## 2 · Overlay-System (Captions/Intro/Outro)

Engine: `animations.jsx` (React+Babel im Browser; Stage/Sprite/useTime/useSprite/Easing/interpolate/clamp).
Harness: `render/overlay.html` (16:9) bzw. `render/overlay-vertical.html` (9:16). Capture: `render/capture.mjs` / `capture-v.mjs` (Playwright).

**Prinzip:** Overlay mit **transparentem** BG rendern → `screenshot({omitBackground:true})` je Frame → Alpha-PNG-Sequenz → in ffmpeg über den Clip legen. Intro/Outro haben eigenen dunklen BG (liegen über schwarzem Abschnitt).

### Capture-Fallstricke (alle gelöst — beim Kopieren beachten)
1. **`file://` blockiert** das Nachladen externer `.jsx` (CORS). → **lokalen HTTP-Server** nutzen: `python3 -m http.server 8765` (vom Repo-Root) und `http://localhost:8765/…` laden.
2. **Babel automatic-runtime** injiziert `import "react/jsx-runtime"` → bricht im Browser („Cannot use import statement…"). → **classic runtime erzwingen**:
   ```html
   <script>Babel.registerPreset('react-classic',{presets:[[Babel.availablePresets['react'],{runtime:'classic'}]]});</script>
   <script type="text/babel" data-presets="react-classic">…</script>
   ```
3. **Globales Lexical-Scope geteilt** über klassische Scripts: `animations.jsx` deklariert `Sprite`, `TimelineContext` etc. global — im Inline-Script **nicht** neu deklarieren (`let Sprite` → „already declared"), einfach direkt verwenden.
4. **Deterministik:** kein RAF/autoplay. Eigener `TimelineContext.Provider` mit `time` aus `window.__setT(t)`; pro Frame `setT` → `await requestAnimationFrame×2` → screenshot. Twinkle/Grain hängen an `useTime()` und sind so reproduzierbar.
5. **Fonts** vor Capture laden: `await page.evaluate(()=>document.fonts.ready)` (Bebas Neue via Google Fonts).
6. **Schärfe:** 16:9 wird als 1280×720-Tree mit `transform:scale(1.5)` in 1920×1080 gerendert (CSS-Scale ist auflösungsunabhängig → scharf). Vertikal direkt in 1080×1920.

Tempo: ~30fps-Capture, ~15–20 Frames/s in headless → 83s-Video ≈ 3–4 min.

---

## 3 · ffmpeg-Rezepte (gratis, lokal)

**Clip auf Szenenlänge strecken (z.B. 8s→11.5s) + auf 1080p normalisieren:**
```bash
f=$(echo "scale=6; 11.5/$dur" | bc)
ffmpeg -i in.mp4 -filter:v "setpts=${f}*PTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,trim=duration=11.5,setpts=PTS-STARTPTS" -an out.mp4
```

**Alpha-Overlay über Clip:**
```bash
ffmpeg -i bg.mp4 -framerate 30 -i frames/f_%05d.png \
  -filter_complex "[0:v][1:v]overlay=0:0:shortest=1[v]" -map "[v]" … out.mp4
```

**Blur-Fill 16:9 → 9:16 (volle Komposition erhalten, kein Center-Crop):**
```bash
[0:v]split[a][b];
[b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=26[bg];
[a]scale=1080:-2[fg];
[bg][fg]overlay=(W-w)/2:(H-h)/2
```

**Spotify-Canvas-Loop (nahtlos, ~8s, stumm):** Boomerang = forward+reverse:
```bash
[v0]split[f][r0];[r0]reverse[rv];[f][rv]concat=n=2:v=1,format=yuv420p[v]
```

**Web-Encode (Kosmos-Footage komprimiert schlecht → Denoise hilft enorm):**
```bash
-vf hqdn3d=2:1.5:3:3 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart
```
Richtwerte: facts.mp4 (83s/1080p) ≈ 35 MB @ crf25+denoise. Ohne Denoise schnell 80–140 MB (Sternenfeld-Grain).

**Audio-Bett (Per-Track-Ausschnitte):** Master in `…/LJ_lichtjahr_vol2/audio/0X_*.mp3` (3–5 min).
Pro Szene ~11.5s an markanter Stelle (`-ss <offset> -t 11.5`) mit `afade` in/out, concat.
Verwendete Offsets: trappist 45 · event_horizon 60 · andromeda 45 · supernova 40 (nach Piano-Intro) · microwave 50 · last_light 60.

---

## 4 · Format-Specs

| Format | Maße | Länge | Audio | Text | Hinweis |
|---|---|---|---|---|---|
| **Hauptvideo** (facts.html) | 1920×1080 | 83s | ja | volles Overlay | `assets/facts.mp4`, faststart |
| **Shorts** (TikTok/IG/YT) | 1080×1920 | ~11.5s | ja (Track) | Caption-Overlay | Blur-Fill |
| **Spotify Canvas** | 1080×1920 | 3–8s | **nein** (stumm) | **kein Text/Logo/CTA** | nahtlos loopen, sonst Reject |

---

## 5 · So baust du MEHR

**Weitere Canvas-Loops:** `tools/facts-rebuild/build-canvas` (Quelle = `out/vid-*.mp4`, Start/Ende-Fenster je Clip wählen). Reines ffmpeg, keine Credits.
**Weitere Shorts:** vertikale Frames mit `render/capture-v.mjs` (Server muss laufen), dann `build-shorts.sh`.
**Neue Szene/Track:** (1) Still in GPT Image 2; (2) Clip in Veo 3.1 — bei NSFW-Flag auf Kling 3.0; (3) Copy in `render/overlay*.html` (`SCENES`-Array) ergänzen; (4) Timeline in `overlay.html` anpassen; (5) capturen + `build2.sh`.
**Neuer Komplett-Render:** Server starten → `capture.mjs full` → `build2.sh`.

### Wiederkehrende Gotchas (Checkliste)
- [ ] HTTP-Server läuft (nicht `file://`)
- [ ] `data-presets="react-classic"` gesetzt
- [ ] keine Re-Deklaration von Engine-Globals im Inline-Script
- [ ] Fonts geladen vor Capture
- [ ] Veo-NSFW? → Kling-Fallback, Fehlversuche werden erstattet
- [ ] Reframe meiden (78 cr) — lokal croppen
- [ ] Denoise vor x264 bei Kosmos-Footage
- [ ] Spotify-Canvas: stumm, kein Text, nahtloser Loop, 3–8s

---

## 6 · Dateien

```
tools/facts-rebuild/
  render-plan.md            # Still-/Motion-Prompts der 6 Phänomene
  out/                      # Stills + Clip-Master (vid-*.mp4) — wiederverwendbar
  render/
    overlay.html            # 16:9 Overlay-Harness (Intro/6 Captions/Outro)
    overlay-vertical.html   # 9:16 Overlay-Harness (Shorts)
    capture.mjs             # Playwright-Capture 16:9 (full|probe)
    capture-v.mjs           # Playwright-Capture 9:16 (alle Szenen)
    frames/ frames-v/       # Alpha-PNG-Sequenzen (groß, gitignored)
  build2.sh                 # Hauptvideo: BG+Overlay+Audio → facts.mp4
  build-shorts.sh           # 6 Shorts
  build-canvas …            # 6 Canvas-Loops
  deliverables/{shorts,canvas}/   # fertige Hochformat-Assets
  HANDOFF.md                # dieses Dokument
```

**Live-Deploy:** `assets/facts.mp4` + `assets/facts-poster.jpg` committen → Push auf `main` → GitHub-Actions („Deploy to GitHub Pages") published auf music.nulltag.ch. Bei gleichem Dateinamen Hard-Refresh (Browser-Cache).
