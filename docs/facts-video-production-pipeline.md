# Facts-Video · Produktions-Pipeline (einmal generieren, überall nutzen)

> **Zweck:** Higgsfield korrekt anbinden und die Clips so generieren, dass **ein**
> Generierungs-Durchlauf gleichzeitig (a) das 60-s-Facts-Video, (b) 10–15-s
> Reels/Shorts pro Track und (c) Spotify-Canvas-Loops liefert — alles aus
> denselben Assets, zentral verwaltet.
>
> **Stand:** 2026-06-16 · Begleitdokument zu `docs/facts-video-higgsfield-handoff.md`
> (dort stehen die fertigen Szenen-Prompts & Captions).

---

## 1 · Higgsfield anbinden (korrekt für diese Umgebung)

`/mcp` gibt es in Claude Code **on the web / Cowork nicht** — MCP-Server werden
hier als **Connectors** in den Claude-Einstellungen verbunden, nicht per Befehl.

### Weg A — Claude Web / Cowork (das hier)
1. **Settings → Connectors → „Add custom connector"**
2. Name: `Higgsfield` · URL: `https://mcp.higgsfield.ai/mcp`
3. **Connect** → im Browser mit deinem **Higgsfield-Account** einloggen (OAuth, **keine API-Keys**).
4. Zurück im Chat sind dann die Higgsfield-Tools verfügbar (Bild/Video-Modelle,
   Reframe etc.). Erst danach kann ich sie aufrufen.

> Hinweis: Connector wird **pro Account** verbunden, nicht über das Repo. Die
> committete `.mcp.json` im Repo greift nur für **lokales** Claude Code (Weg B).

### Weg B — lokales Claude Code (Alternative)
```bash
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
```
Dann Claude Code starten → Browser-OAuth → fertig. (Die `.mcp.json` im Repo macht
dasselbe projektweit.)

### Sobald verbunden
Sag mir **„verbunden"** — dann fahre ich die Generierung unten automatisch durch
und rufe die Higgsfield-Tools szenenweise mit den Prompts aus dem Handoff auf.

---

## 2 · Welche „Skills" / Werkzeuge wir nutzen

**Es gibt keinen fertigen „Facts-Video"-Skill** — der Mechanismus ist der
Higgsfield-Connector + die Pipeline hier. Konkret im Einsatz:

**Higgsfield-Modelle (über MCP):**
- **Nano Banana Pro** (oder Seedream) → **Standbild pro Szene** (die „Source of Truth" für den Look)
- **Kling 3.0 / Veo 3.1 / Sora 2** → Image-to-Video (Standbild animieren)
- **DOP / Kamera-Presets** → Dolly In/Out, Orbit, Crash Zoom (siehe Handoff je Szene)
- **Reframe** → Seitenverhältnis per Outpainting ändern (9:16 ↔ 16:9), **ohne Crop** — der Schlüssel fürs Multi-Format

**Im Repo schon da:**
- `docs/facts-video-higgsfield-handoff.md` — fertige Prompts, Captions, Brand-Kit
- `scenes.jsx` — Timing & Texte (Source of Truth, 1:1 das aktuelle Video)
- `facts.html` — Player, bindet `assets/facts.mp4` ein
- `.mcp.json` — Higgsfield-Connector für lokales Claude Code

**Claude-Code-Skills, die hier helfen:** `run`/`verify` (Seite lokal prüfen),
`loop` (wiederkehrende Generier-/Poll-Schritte planen), `deep-research` (weitere
Recherche). Keiner davon generiert Video — das macht ausschließlich Higgsfield.

---

## 3 · Kernidee: „Scene Master" → alle Formate ableiten

Statt für jedes Zielformat neu zu generieren, erzeugen wir pro Szene **einen
Master** und leiten daraus alle drei Deliverables per Schnitt/Reframe ab.

```
                       ┌─ Standbild (Nano Banana Pro)  ← der Look, fixer Seed
   1× SCENE MASTER ────┤
   (pro Szene)         ├─ Vertikal-Clip 9:16 (image-to-video, ~10 s)  ← MASTER-Orientierung
                       └─ 16:9-Variante  (Reframe-Outpaint  ODER  2. native Render)
                                  │
         ┌────────────────────────┼─────────────────────────────┐
         ▼                        ▼                              ▼
  FULL VIDEO 16:9          REEL/SHORT 9:16              SPOTIFY CANVAS 9:16
  60 s, mit Ton           10–15 s, mit Ton             3–8 s Loop, OHNE Ton
  (alle 8 Szenen          (1 Track = 1 Short)          (1 Track = 1 Canvas,
   aneinander)                                          loop-tauglicher Ausschnitt)
```

**Warum 9:16 als Master:** zwei der drei Outputs sind vertikal (Canvas + Reels),
und für Weltraum-Szenen fügt Reframe beim 9:16 → 16:9 einfach mehr Sternenfeld an
den Seiten an — das zentrale Motiv (Schwarzes Loch, Stern) bleibt mittig. Wer die
**maximale** Qualität fürs Hero-Video will: die 6 Phänomen-Szenen **zusätzlich
nativ in 16:9** rendern (gleiches Standbild + Seed) statt nur zu reframen.

### Format-Specs (Ziel)
| Output | Ratio | Auflösung | Länge | Ton | Loop | Datei |
|--------|-------|-----------|-------|-----|------|-------|
| Full Facts-Video | 16:9 | 1920×1080 | 60 s | ja | nein | `assets/facts.mp4` |
| Reel / Short | 9:16 | 1080×1920 | 10–15 s | ja | nein | pro Track |
| Spotify Canvas | 9:16 | 1080×1920 | **3–8 s** | **nein** | **nahtlos** | pro Track, MP4 |

---

## 4 · Loop-tauglich generieren (für Canvas)

Spotify-Canvas muss **nahtlos loopen** (3–8 s, kein harter Schnitt). Darum die
Master-Clips so anlegen, dass **Anfangszustand ≈ Endzustand**:

- **Trappist, Microwave, Andromeda, Intro/Outro, Last Light** → von Natur aus
  loop-freundlich (kreisende Orbits, pulsierender Glow, langsamer Drift). Prompt-
  Zusatz: `seamless loop, return to start, no hard cut`.
- **Event Horizon** → rotierende Akkretionsscheibe loopt sauber.
- **Supernova** → **nicht** loopbar (einmalige Explosion). Für ihren Canvas einen
  separaten **„breathing core"-Loop** generieren (pulsierender heißer Kern vor der
  Explosion), die Explosion bleibt nur im Full-Video/Short.
- Fallback im Schnitt: **Rebound-Loop** (vorwärts → rückwärts) macht fast jeden
  Clip nahtlos.

---

## 5 · Asset-Struktur & Manifest (zentral verwalten)

Vorschlag für eine saubere Ablage, damit pro Szene alles zusammenliegt:

```
assets/video/
  _masters/
    01-intro.still.png   01-intro.9x16.mp4   01-intro.16x9.mp4
    02-trappist.still.png 02-trappist.9x16.mp4 02-trappist.16x9.mp4
    03-eventhorizon.*  04-andromeda.*  05-supernova.*
    06-microwave.*  07-lastlight.*  08-outro.*
  exports/
    full/facts-16x9.mp4              → wird zu assets/facts.mp4
    shorts/lj07-trappist-9x16.mp4    (10–15 s)
    canvas/lj07-trappist-canvas.mp4  (3–8 s, ohne Ton)
    ...
  manifest.json
```

**`manifest.json`** = das „alles zusammen verwalten"-Stück: pro Szene Modell,
Seed, Prompt, Dauer und die abgeleiteten Exporte. Beispiel:

```json
{
  "scenes": [
    {
      "id": "02-trappist", "track": "LJ-07", "bpm": 195,
      "model": "kling-3.0", "seed": 0,
      "prompt": "…(aus dem Handoff)…",
      "still": "_masters/02-trappist.still.png",
      "masters": { "9x16": "_masters/02-trappist.9x16.mp4", "16x9": "_masters/02-trappist.16x9.mp4" },
      "exports": {
        "full":   { "in": 5.0, "out": 13.0 },
        "short":  "exports/shorts/lj07-trappist-9x16.mp4",
        "canvas": "exports/canvas/lj07-trappist-canvas.mp4"
      }
    }
  ]
}
```

> **Git-Hinweis:** Roh-Master können groß werden. Entweder nur die **finalen
> Exporte** committen (`assets/facts.mp4` + ggf. ausgewählte) und `_masters/` per
> `.gitignore` ausschließen, oder ein externes Drive nutzen und im Manifest
> verlinken. `manifest.json` selbst immer committen.

---

## 6 · Track-Mapping (was wird woraus)

8 Scene-Master → 1 Full-Video + 6 Shorts + 6 Canvas:

| Szene-Master | Track | Full-Video (in/out) | Short 9:16 (10–15 s) | Canvas 9:16 (3–8 s) |
|--------------|-------|---------------------|----------------------|---------------------|
| 01 Intro | — | 0:00–0:05 | (Teaser optional) | — |
| 02 Trappist | LJ-07 | 0:05–0:13 | ✓ | ✓ (Orbit-Loop) |
| 03 Event Horizon | LJ-08 | 0:13–0:21 | ✓ | ✓ (Disk-Loop) |
| 04 Andromeda | LJ-09 | 0:21–0:29 | ✓ | ✓ (Drift-Loop) |
| 05 Supernova | LJ-10 | 0:29–0:37 | ✓ (Explosion) | ✓ (Core-Loop separat) |
| 06 Microwave | LJ-11 | 0:37–0:45 | ✓ | ✓ (Pulse-Loop) |
| 07 Last Light | LJ-12 | 0:45–0:53 | ✓ | ✓ (Flicker-Loop) |
| 08 Outro | — | 0:53–1:00 | (CTA optional) | — |

Captions/Overlays kommen **nach** der Generierung drauf (Texte & Farben im
Handoff, §5). Fürs Canvas Text minimal halten (oder weglassen — Spotify zeigt
Track-Titel ohnehin an).

---

## 7 · Ablauf (was ich automatisiert mache, sobald verbunden)

Pro Szene (01→08):
1. **Standbild** generieren (Nano Banana Pro, Szenen-Prompt + Style-Suffix, fixer Seed) → 2–3 Varianten, beste wählen.
2. **Vertikal-Master 9:16** animieren (image-to-video, Kamera-Preset aus Handoff, ~10 s, loop-Zusatz wo sinnvoll).
3. **16:9** ableiten: Reframe-Outpaint (schnell) **oder** nativer 2. Render (max. Qualität).
4. Pfade ins `manifest.json` eintragen.

Danach Montage (kann ich vorbereiten/scripten, finaler Schnitt in Cowork/NLE):
5. **Full-Video**: 8×16:9-Master nach Timing-Map schneiden, Musik + Overlays, 60 s, Export → `assets/facts.mp4`.
6. **Shorts**: pro Track den 9:16-Master auf 10–15 s + Caption + Track-Audio.
7. **Canvas**: pro Track 3–8 s loop-tauglicher 9:16-Ausschnitt, **Ton entfernen**, nahtlos (oder Rebound) → MP4.

---

## 8 · Offene Entscheidungen (für dich)

- **Master-Orientierung:** 9:16-first + Reframe (schnell, 1 Render) **oder** beide nativ rendern (mehr Render, beste Qualität fürs Hero-Video)?
- **Video-Modell:** Kling 3.0 (gut für Bewegung) vs. Veo 3.1 vs. Sora 2 — je nach deinem Higgsfield-Plan.
- **Was wird committet:** nur finale Exporte, oder auch Roh-Master?

Sag mir deine Präferenzen (oder „nimm Defaults") und **„verbunden"**, sobald der
Higgsfield-Connector steht — dann starte ich mit Szene 1.

---

*Quellen: Higgsfield MCP (offizieller Connector), Spotify-Canvas-Specs (9:16,
3–8 s, MP4, nahtloser Loop, kein Gesang), Higgsfield Reframe (Aspect-Ratio per
Outpainting). Links siehe Chat.*
