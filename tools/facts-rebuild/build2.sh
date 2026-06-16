#!/usr/bin/env bash
# Assembly v2: Higgsfield-Clips (BG) + Overlay (Alpha-PNG-Seq) + Per-Track-Audio-Bett -> facts.mp4
# Timeline (muss zu overlay.html passen): Intro 0-6.5 · 6 Szenen je 11.5s (6.5..75.5) · Outro 75.5-83
set -euo pipefail
cd "$(dirname "$0")/../.."                  # repo root
OUT=tools/facts-rebuild/out
W=tools/facts-rebuild/work2
FR=tools/facts-rebuild/render/frames
AUD="/Users/istricker/Obsidian/TA-NULLTAG/assets/releases/LJ_lichtjahr_vol2/audio"
mkdir -p "$W"
SL=11.5

# clip-Quelle je Szene (Veo 8s bzw. Kling 10s)
CLIPS=( "$OUT/vid-1-trappist.mp4" "$OUT/vid-2-eventhorizon.mp4" "$OUT/vid-3-andromeda-10s.mp4" "$OUT/vid-4-supernova-10s.mp4" "$OUT/vid-5-cmb-10s.mp4" "$OUT/vid-6-lastlight.mp4" )

# ---- 1) BG-Track: schwarz(intro) + 6 Segmente (je auf 11.5s gestreckt) + schwarz(outro) ----
ffmpeg -y -loglevel error -f lavfi -i color=c=black:s=1920x1080:r=30:d=6.5 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p "$W/blk-intro.mp4"
ffmpeg -y -loglevel error -f lavfi -i color=c=black:s=1920x1080:r=30:d=7.5 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p "$W/blk-outro.mp4"
: > "$W/concat.txt"
echo "file 'blk-intro.mp4'" >> "$W/concat.txt"
i=0
for src in "${CLIPS[@]}"; do
  i=$((i+1))
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  f=$(echo "scale=6; $SL/$dur" | bc)
  ffmpeg -y -loglevel error -i "$src" \
    -filter:v "setpts=${f}*PTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,trim=duration=${SL},setpts=PTS-STARTPTS" \
    -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "$W/seg-$i.mp4"
  echo "file 'seg-$i.mp4'" >> "$W/concat.txt"
done
echo "file 'blk-outro.mp4'" >> "$W/concat.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$W/concat.txt" -c copy "$W/bg.mp4"

# ---- 2) Audio-Bett: je Szene ~11.5s Ausschnitt + Intro/Outro, mit Fades, concat ----
TRACKS=( 01_trappist_loop 02_event_horizon 03_andromeda_approach 04_supernova 05_microwave 06_last_light )
OFFS=( 45 60 45 40 50 60 )     # Start-Offset (s) je Track – markante Stelle
: > "$W/aconcat.txt"
# Intro-Audio: erste 6.5s aus Track1, fade-in
ffmpeg -y -loglevel error -ss 30 -t 6.5 -i "$AUD/01_trappist_loop.mp3" -af "afade=t=in:st=0:d=1.2,afade=t=out:st=6.0:d=0.5" -ar 48000 -ac 2 "$W/a-intro.m4a"
echo "file 'a-intro.m4a'" >> "$W/aconcat.txt"
for idx in 0 1 2 3 4 5; do
  t="${TRACKS[$idx]}"; off="${OFFS[$idx]}"; n=$((idx+1))
  ffmpeg -y -loglevel error -ss "$off" -t "$SL" -i "$AUD/$t.mp3" -af "afade=t=in:st=0:d=0.3,afade=t=out:st=11.0:d=0.5" -ar 48000 -ac 2 "$W/a-$n.m4a"
  echo "file 'a-$n.m4a'" >> "$W/aconcat.txt"
done
# Outro-Audio: 7.5s aus Last Light, fade-out
ffmpeg -y -loglevel error -ss 70 -t 7.5 -i "$AUD/06_last_light.mp3" -af "afade=t=in:st=0:d=0.3,afade=t=out:st=6.0:d=1.5" -ar 48000 -ac 2 "$W/a-outro.m4a"
echo "file 'a-outro.m4a'" >> "$W/aconcat.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$W/aconcat.txt" -c copy "$W/audio.m4a"

# ---- 3) Composite Overlay (Alpha-PNG-Seq @30) über BG + Audio + web-encode ----
ffmpeg -y -loglevel error -i "$W/bg.mp4" -framerate 30 -i "$FR/f_%05d.png" -i "$W/audio.m4a" \
  -filter_complex "[0:v]hqdn3d=2:1.5:3:3[bgc];[bgc][1:v]overlay=0:0:shortest=1[v]" \
  -map "[v]" -map 2:a \
  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 160k -shortest "$W/facts-final.mp4"

echo "=== FERTIG ==="
ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_type,width,height -of default=noprint_wrappers=1 "$W/facts-final.mp4"
ls -la "$W/facts-final.mp4"
