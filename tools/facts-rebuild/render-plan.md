# Cosmic Facts Video — Rebuild Render Plan (Higgsfield, Tier A)

Pipeline: **Image-to-Video**. Per Phänomen: GPT Image 2 Still (16:9, 2k) → Veo 3.1 (preview/high, 8s) animieren.
Master 16:9 1080p+. Shorts: native 9:16 ODER lokaler ffmpeg-Crop. Audio: aus bestehendem `assets/facts.mp4` übernehmen.
HARD RULE für alle Prompts: **kein Text/keine Captions/kein Watermark im Bild.**

Negative (alle Stills): `no text, no captions, no subtitles, no watermark, no logo, clean image only`

---

## 1 · Trappist Loop (LJ-07)
- **Still:** Photoreal deep-space scene, a cool dim red dwarf star (TRAPPIST-1) center-frame, seven Earth-sized rocky planets of varied terrain aligned along faint elliptical orbital paths, subtle orbital rings, dense starfield, volumetric backlight, anamorphic cinematic, ultra-detailed, 8k.
- **Motion (Veo):** Slow orbital drift — the seven planets glide along their paths in resonance, gentle parallax, the red dwarf flares softly, camera slow push-in. Hypnotic, smooth, no cuts.

## 2 · Event Horizon (LJ-08)
- **Still:** Photoreal supermassive black hole, brilliant orange-white accretion disk warped by gravitational lensing, glowing photon ring, pitch-black event horizon at center, light-bending arcs, deep space, Interstellar-grade, 8k.
- **Motion (Veo):** Accretion disk rotates slowly, light shimmers and bends around the event horizon, a faint stream of matter spirals inward, camera slow push-in toward the void. Ominous, weighty. [HERO SHOT — ggf. ultra]

## 3 · Andromeda Approach (LJ-09)
- **Still:** Two vast photoreal spiral galaxies approaching across deep space, glowing cores, intricate dust lanes, pink and blue nebulae between them, billions of stars, cinematic wide shot, 8k.
- **Motion (Veo):** The two galaxies drift slowly toward each other, stars and dust lanes swirl, subtle gravitational distortion begins, slow majestic camera drift. Epic, slow.

## 4 · Supernova (LJ-10)
- **Still:** Photoreal massive blue-white star on the verge of core collapse, blinding hot core, surrounding gas shells, deep space, dramatic cinematic lighting, 8k.
- **Motion (Veo):** The core pulses then erupts in a brilliant supernova flash, a luminous shockwave ring expands outward through surrounding gas, glowing debris scatters, camera holds then slightly pulls back. Explosive, awe-inspiring.

## 5 · Microwave / CMB (LJ-11)
- **Still:** Photoreal cosmic microwave background — a vast sphere of faint mottled temperature fluctuations in blue and orange, the ancient afterglow of the Big Bang, ethereal, cinematic, 8k.
- **Motion (Veo):** The CMB sphere gently pulses and shimmers, faint ripples of ancient light expand outward in concentric waves, soft drifting glow, slow contemplative camera. Hopeful, vast.

## 6 · Last Light (LJ-12)
- **Still:** Photoreal final dying red dwarf star, a tiny faint red ember alone in a near-empty black void, the last light of the universe, heat death, minimal, deep darkness, cinematic, 8k.
- **Motion (Veo):** The lone red star flickers and slowly fades, its glow dimming toward darkness, surrounding faint stars wink out one by one, slow somber camera drift into black. Melancholic, final.

---

## Render commands (Beispiel je Clip)
```bash
# Still
higgsfield generate create gpt_image_2 --prompt "<STILL>" --aspect_ratio 16:9 --resolution 2k --wait
# Animate (preview/high)
higgsfield generate create veo3_1 --prompt "<MOTION>" --image <still_url_or_id> \
  --duration 8 --aspect_ratio 16:9 --model veo-3-1-preview --quality high --wait
```

## Assembly (ffmpeg, lokal/gratis)
1. Audio aus bestehendem Master ziehen: `ffmpeg -i assets/facts.mp4 -vn -acodec copy facts-audio.m4a`
2. Jeden 8s-Clip auf ~10s retimen (setpts), 6 Clips concat → 60s.
3. Audio drüberlegen, export `assets/facts.mp4` (1080p, h264, aac).
4. Shorts: je Clip 9:16 (nativ-Render ODER `crop`/`scale` aus 16:9-Master) nach `assets/shorts/`.
