# Facts-Video → Higgsfield AI · Generierungs-Handoff

> **Zweck:** Alles, was du brauchst, um das *Lichtjahr Vol.2* Physik-Video in
> Higgsfield AI (Cowork) Szene für Szene zu generieren — ohne nochmal im Code
> nachschauen zu müssen. Copy-paste-fertige Prompts, Kamera-Presets, Timing,
> Brand-Kit, Captions.
>
> **Stand:** 2026-06-16 · **Release:** 26. Juni 2026 · Branch `claude/facts-video-handoff-5263tv`

---

## 0 · TL;DR — der schnelle Weg

1. Generiere **8 Clips** (Intro + 6 Phänomene + Outro), je ~5–8 s, in der
   Reihenfolge unten. Pro Szene: Prompt + Kamera-Preset aus der Tabelle.
2. **Aspect Ratio:** `16:9` für die Website (`assets/facts.mp4` ersetzt das
   aktuelle), **oder** `9:16` für Reels/TikTok/Shorts. Prompts funktionieren für
   beide — beim 9:16 die Bildmitte als Fokus denken.
3. **Kein Text in die AI-Generierung schreiben** (AI verhunzt Typo). Titel,
   BPM-Labels und Captions werden **danach** als Overlay draufgelegt — Vorlagen
   stehen unter [§5 Captions](#5--on-screen-captions-overlay-danach).
4. Schnitt + Musik + Overlays in Cowork/Schnittprogramm zusammensetzen → 60 s
   Gesamtlänge, Reihenfolge wie in [§3 Timing-Map](#3--timing-map-60-s).
5. Export 1920×1080 (oder 1080×1920), H.264 MP4 → ersetzt `assets/facts.mp4`.

---

## 1 · Was wir bauen

Ein 60-Sekunden-Musikvideo für die EP **„Lichtjahr Vol.2"** von NULLTAG
(Cosmic Frenchcore). Jeder Track vertont ein **echtes astrophysikalisches
Phänomen**. Das Video zeigt diese Phänomene **photoreal & cinematisch** — der
gewählte Look ist „echte NASA/ESA-Footage-Ästhetik", nicht cartoonig, nicht UI.

- **Ziel-Look:** photoreal, cinematisch, dunkel, kosmisch. IMAX-Doku trifft
  Frenchcore-Energie. Tiefes Schwarz, ein paar gesättigte Glut-/Cosmic-Akzente.
- **Tempo:** ruhige, langsame Kamerafahrten (Ken-Burns / slow push-in), **außer**
  Supernova = der eine Action-Beat (Explosion, Schockwelle).
- **Keine Menschen, keine UI, keine Schrift** in den AI-Clips. Reiner Weltraum.

---

## 2 · Brand-Kit (für Overlays & Color-Grade)

**Farben** (Hex):

| Token   | Hex       | Einsatz                                   |
|---------|-----------|-------------------------------------------|
| void    | `#0a0a0a` | Hintergrund-Schwarz                       |
| deep    | `#050505` | tiefstes Schwarz / Letterbox              |
| bone    | `#e8e3da` | Haupt-Text (off-white)                    |
| dim     | `#c9c4bc` | Sekundär-Text                             |
| muted   | `#8a8580` | Labels, Meta                              |
| **red** | `#ff2a55` | NULLTAG-Signalrot (Akzent, „LIVE"/„soon") |
| cosmic  | `#e879c4` | Magenta/Pink-Glow (Highlights im Text)    |
| glut    | `#ff6a2a` | Orange-Glut (Sterne, Akkretionsscheibe)   |
| blue    | `#5fc8e0` | Eisblau (Microwave / CMB)                 |
| amber   | `#ffd9a0` | warmes Sternenlicht                       |
| good    | `#7ad08a` | grün (Status „LIVE")                       |

**Fonts** (für Overlays):
- Display/Titel: **Bebas Neue** (groß, uppercase) — Fallback Oswald
- Mono/Labels: **JetBrains Mono** (letter-spacing ~0.2em, uppercase)
- Fließtext/Lead: **Space Grotesk**

**Logo-Stamp** (Ecken, dezent, über das ganze Video):
- oben links: `NULLTAG` (Mono, letter-spacing 0.4em)
- oben rechts: `LICHTJAHR VOL.2`
- unten rechts: `music.nulltag.ch`

**Grade-Hinweis:** leichtes Vignette (Ränder ~40 % abdunkeln), feines Film-Grain
(~5 % overlay), Kontrast hoch, Schwarz wirklich schwarz.

---

## 3 · Timing-Map (60 s)

Reihenfolge & Dauer entsprechen 1:1 dem aktuellen Video (`scenes.jsx`). Higgsfield
erzeugt meist ~5-s-Clips — wo eine Szene 8 s braucht, **zwei Clips generieren und
aneinanderschneiden** (oder Clip leicht verlangsamen).

| #  | Szene          | Start | Ende  | Dauer | Track / BPM        | Status      |
|----|----------------|-------|-------|-------|--------------------|-------------|
| 1  | Intro          | 0:00  | 0:05  | 5 s   | —                  | —           |
| 2  | Trappist Loop  | 0:05  | 0:13  | 8 s   | LJ-07 · 195 BPM    | ● LIVE      |
| 3  | Event Horizon  | 0:13  | 0:21  | 8 s   | LJ-08 · 200 BPM    | ● LIVE      |
| 4  | Andromeda      | 0:21  | 0:29  | 8 s   | LJ-09 · 190 BPM    | ● LIVE      |
| 5  | Supernova      | 0:29  | 0:37  | 8 s   | LJ-10 · 200 BPM    | ● LIVE      |
| 6  | Microwave      | 0:37  | 0:45  | 8 s   | LJ-11 · 190 BPM    | ◷ FR 20.06  |
| 7  | Last Light     | 0:45  | 0:53  | 8 s   | LJ-12 · 185 BPM    | ◷ 02.07     |
| 8  | Outro          | 0:53  | 1:00  | 7 s   | —                  | —           |

Szenenübergänge: jeweils ~0,5 s Crossfade (Schwarz-Dip oder Dissolve).

---

## 4 · Szenen-Briefs (Prompts für Higgsfield)

> **So benutzen:** „Prompt" in Higgsfield als Text-to-Video oder als Bewegungs-
> Prompt zu einem Startbild (Image-to-Video) eingeben. „Kamera" = Preset/Move
> wählen. „Negative" gilt für alle Szenen (einmal global setzen).

**Globaler Negative-Prompt (für alle Clips):**
```
text, words, letters, captions, UI, interface, logos, watermark, people, human,
faces, cartoon, illustration, low quality, blurry, oversaturated cheap CGI,
flat colors, lens dirt
```

**Globaler Style-Suffix (an jeden Prompt anhängen):**
```
photorealistic, cinematic, shot on IMAX, NASA/ESA telescope footage aesthetic,
deep black space, fine film grain, subtle vignette, high contrast, 24fps, ultra
detailed, volumetric light
```

---

### Szene 1 · INTRO — 5 s

- **Inhalt:** Kalter Sternenhimmel, langsam aus dem Sternenfeld nach vorn fliegend,
  ein zarter magenta-pinker Nebel-Glow in der Mitte. Ruhiger, ehrfürchtiger Auftakt.
- **Prompt:**
  ```
  Slow flight through a vast star field in deep space, thousands of distant stars,
  a faint magenta-pink nebula glow blooming softly in the center, calm and
  awe-inspiring, infinite dark cosmos
  ```
- **Kamera:** slow dolly-in / forward push (Higgsfield „Dolly In", langsam).
- **Overlay danach:** Titel „LICHTJAHR VOL.2", Subline „6 TRACKS · 6 ECHTE PHÄNOMENE".

---

### Szene 2 · TRAPPIST LOOP — 8 s · LJ-07 · 195 BPM

- **Fakt:** 40 Lichtjahre entfernt umkreisen **7 erdgroße Planeten** den kühlen
  Zwergstern TRAPPIST-1, exakt in Resonanz (8:5:3:2). Drei in der habitablen Zone.
- **Prompt:**
  ```
  A cool dim red dwarf star with seven Earth-sized rocky planets orbiting in tight
  concentric paths, top-down view of a planetary system, planets aligned in
  rhythmic orbital resonance, warm amber starlight, one planet glowing faint pink,
  vast dark space around
  ```
- **Kamera:** langsamer Orbit / leichtes Push-in (Higgsfield „Orbit" sanft, oder
  „Dolly In").
- **Footage-Alternative:** echte TRAPPIST-1 Artist-Renders der NASA/JPL (Public Domain).
- **Overlay:** „TRAPPIST LOOP" · `LJ-07 · 195 BPM` · ● LIVE · Chip „40 Lichtjahre · 7-Beat-Phrasen".

---

### Szene 3 · EVENT HORIZON — 8 s · LJ-08 · 200 BPM

- **Fakt:** Der Ereignishorizont eines Schwarzen Lochs — ab hier entkommt nicht
  mal Licht. Von außen scheint die Zeit am Rand einzufrieren.
- **Prompt:**
  ```
  A supermassive black hole with a bright glowing orange accretion disk swirling
  around a perfectly black event horizon, gravitational lensing bending light into
  a halo ring, photon sphere, Interstellar-style Gargantua, intense detail, hot
  amber and orange plasma, deep space
  ```
- **Kamera:** sehr langsames Push-in Richtung Horizont, minimal kreisend
  („Dolly In" + leichter „Orbit").
- **Footage-Alternative:** EHT-Foto M87*, NASA Schwarzloch-Visualisierungen.
- **Overlay:** „EVENT HORIZON" · `LJ-08 · 200 BPM` · ● LIVE · Chip „Outro: 200 → 140 BPM".

---

### Szene 4 · ANDROMEDA — 8 s · LJ-09 · 190 BPM

- **Fakt:** Andromeda rast mit ~110 km/s auf die Milchstraße zu — Verschmelzung
  in ~4 Mrd. Jahren. Sterne kollidieren kaum, dazwischen fast nur Leere.
- **Prompt:**
  ```
  Two giant spiral galaxies drifting toward each other on a collision course in
  deep space, glowing galactic cores, sweeping spiral arms of pink, blue and gold
  stars, slow majestic cosmic dance, gravitational tidal streams of stars between
  them, ultra wide
  ```
- **Kamera:** weiter, langsamer Pull-back / Drift (Higgsfield „Dolly Out").
- **Footage-Alternative:** Hubble/ESA Galaxien-Merger-Sims, NGC-Aufnahmen.
- **Overlay:** „ANDROMEDA" · `LJ-09 · 190 BPM` · ● LIVE · Chip „~110 km/s".

---

### Szene 5 · SUPERNOVA — 8 s · LJ-10 · 200 BPM  ⚡ ACTION-BEAT

- **Fakt:** Massereicher Stern kollabiert in Sekunden, explodiert kurz heller als
  eine ganze Galaxie. Hier entstehen Eisen & Gold.
- **Prompt:**
  ```
  A massive star collapsing then exploding in a brilliant supernova, blinding
  white-hot flash, expanding shockwave ring of orange and red plasma blasting
  outward, debris and glowing ejecta flying across space, a remnant nebula forming,
  the brightest moment in the cosmos, explosive energy
  ```
- **Kamera:** Crash-Zoom / Snap auf die Explosion, dann Schockwelle die auf die
  Kamera zurast (Higgsfield „Crash Zoom" oder „Explosion" Preset). **Hier darf's
  knallen** — der einzige schnelle Cut.
- **Hinweis:** evtl. 2 Clips — (a) Aufbau/Kollaps, (b) Flash + Schockwelle — und am
  Drop des Tracks schneiden.
- **Overlay:** „SUPERNOVA" · `LJ-10 · 200 BPM` · ● LIVE · Chip „Hier entsteht Gold & Eisen".

---

### Szene 6 · MICROWAVE — 8 s · LJ-11 · 190 BPM

- **Fakt:** Das älteste Licht im All (kosmische Mikrowellen-Hintergrundstrahlung),
  ~380.000 Jahre nach dem Urknall frei geworden, heute bei 2,7 Kelvin. Man kann es
  als Teil des TV-Rauschens „hören".
- **Prompt:**
  ```
  The cosmic microwave background radiation as a glowing sphere of the entire early
  universe, faint mottled temperature fluctuations in cold blue and warm orange
  patches, expanding ripples of ancient light, pulling back to reveal the whole
  observable universe, oldest light, ethereal and cold
  ```
- **Kamera:** starker Pull-back vom Detail zum Ganzen (Higgsfield „Dolly Out",
  weit). Im Original zoomt es von 2.4× auf 1× raus.
- **Footage-Alternative:** Planck/WMAP CMB-Map (ESA, Public Domain).
- **Overlay:** „MICROWAVE" · `LJ-11 · 190 BPM` · ◷ FR 20.06 (in Rot) · Chip „2,7 Kelvin · 13,8 Mrd. Jahre".

---

### Szene 7 · LAST LIGHT — 8 s · LJ-12 · 185 BPM

- **Fakt:** Am Ende der Zeit (Heat Death) emittiert der allerletzte Stern sein
  letztes Photon. Danach: Dunkelheit.
- **Prompt:**
  ```
  A single dim red dwarf star, the very last star in a dying universe, slowly
  fading and flickering out, surrounding stars winking out one by one into total
  darkness, cold lonely red glow shrinking, the heat death of the cosmos, melancholic,
  almost complete blackness
  ```
- **Kamera:** sehr langsames Push-in auf den sterbenden Stern, der ausgeht
  („Dolly In", minimal). Endet fast komplett schwarz.
- **Overlay:** „LAST LIGHT" · `LJ-12 · 185 BPM` · ◷ 02.07 (in Rot) · Chip „Ende der Zeit".

---

### Szene 8 · OUTRO — 7 s

- **Inhalt:** Zurück ins Sternenfeld, diesmal mit rotem (statt pinkem) Zentral-Glow.
  Ruhig, auflösend — Platz für Release-Infos.
- **Prompt:**
  ```
  Slow drift through a calm star field in deep space, a soft deep-red glow pulsing
  gently in the center, peaceful resolution, infinite cosmos, fading to black
  ```
- **Kamera:** langsamer Drift / leichter Pull-back.
- **Overlay:** „HÖR DIE PHYSIK" · „Auf allen gängigen Streaming-Diensten" ·
  „26. JUNI 2026" · „SPOTIFY · APPLE MUSIC · SOUNDCLOUD · DEEZER · YOUTUBE".

---

## 5 · On-Screen Captions (Overlay danach)

Pro Phänomen-Szene gleicher Aufbau, unten zentriert, über einem Schwarz-Verlauf
(unten 92 % schwarz → oben transparent):

```
[KATEGORIE-LABEL · BPM]        ← JetBrains Mono, cosmic-pink #e879c4, 0.24em spacing
[STATUS]                       ← ● LIVE = grün #7ad08a / ◷ Datum = rot #ff2a55
GROSSER TITEL                  ← Bebas Neue, uppercase, bone #e8e3da, ~110px
Ein Satz Fakt mit <Highlight>  ← Space Grotesk, 25px, Highlight-Wort in cosmic-pink
[ CHIP ]                       ← Mono, kleiner, roter 1px-Rahmen, rot-transparenter BG
```

**Fertige Texte je Szene:**

| Szene | Label / BPM | Status | Titel | Fakt-Satz | Chip |
|-------|-------------|--------|-------|-----------|------|
| 2 | LJ-07 · 195 BPM | ● LIVE | TRAPPIST LOOP | **7 Planeten** umkreisen einen Zwergstern — perfekt im Takt (8:5:3:2). | 40 Lichtjahre · 7-Beat-Phrasen |
| 3 | LJ-08 · 200 BPM | ● LIVE | EVENT HORIZON | Am Rand eines **Schwarzen Lochs** friert die Zeit ein. Licht kommt nicht zurück. | Outro: 200 → 140 BPM |
| 4 | LJ-09 · 190 BPM | ● LIVE | ANDROMEDA | Zwei Galaxien auf **Kollisionskurs** — sie verschmelzen in 4 Mrd. Jahren. | ~110 km/s |
| 5 | LJ-10 · 200 BPM | ● LIVE | SUPERNOVA | Ein Stern stirbt — und leuchtet kurz **heller als eine Galaxie**. | Hier entsteht Gold & Eisen |
| 6 | LJ-11 · 190 BPM | ◷ FR 20.06 | MICROWAVE | Das **älteste Licht** im All — du kannst es hören (Rauschen zwischen TV-Sendern). | 2,7 Kelvin · 13,8 Mrd. Jahre |
| 7 | LJ-12 · 185 BPM | ◷ 02.07 | LAST LIGHT | Der **allerletzte Stern** sendet sein letztes Photon. Danach: Dunkelheit. | Ende der Zeit |

(Fett = Highlight-Wort in cosmic-pink `#e879c4`.)

---

## 6 · Audio & Sync

- **Musik:** die jeweiligen NULLTAG-Tracks (SoundCloud/Master). BPM stehen oben —
  Cuts möglichst auf den Beat/Drop legen, v. a. **Supernova-Flash auf den Drop**.
- Das aktuelle Web-Video startet stumm (`muted`, Autoplay) mit „♪ Ton an"-Button;
  fürs Reel/Social ruhig mit Ton exportieren.
- Reihenfolge der Track-Snippets = Reihenfolge der Szenen oben.

---

## 7 · Export & Einbau ins Repo

- **Web (16:9):** 1920×1080 (oder 1280×720), H.264 MP4, ~12–15 MB Ziel (das
  aktuelle `assets/facts.mp4` ist 12,6 MB). Datei ersetzt `assets/facts.mp4`.
  Poster-Frame als `assets/facts-poster.jpg` (ein schönes Standbild, z. B.
  Black-Hole- oder Andromeda-Frame).
- **Reel (9:16):** 1080×1920 — separat exportieren, nicht ins Repo nötig.
- Eingebunden wird das Video über `facts.html` (`<video src="assets/facts.mp4">`).
  Wenn nur die Datei getauscht wird, muss am Code nichts geändert werden.
- Footage-Credit bleibt im Footer von `facts.html`:
  „Footage: NASA / SVS · ESA / Hubble · Public Domain".

---

## 8 · Referenzen im Repo

- **Szenen-Logik / Timing / Captions (Quelle der Wahrheit):** `scenes.jsx`
- **Animations-Engine:** `animations.jsx`
- **Video-Player-Seite:** `facts.html`
- **Lange Fakten-Texte (zum Nachlesen):** `facts-read.html`
- **Aktuelle Assets:** `assets/facts.mp4`, `assets/facts-poster.jpg`
- **Brand-Tokens:** `colors_and_type.css`

---

*Higgsfield-Tipp: Presets wie „Crash Zoom", „Dolly In/Out", „Orbit" und
„Explosion" decken alle hier genannten Kamerabewegungen ab. Generiere lieber 2–3
Varianten pro Szene und nimm die beste — Weltraum-Prompts streuen stark.*
