#!/usr/bin/env bash
# 6 Shorts (9:16, 1080x1920): Blur-Fill-Clip + vertikales Caption-Overlay + Track-Musik-Ausschnitt
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=tools/facts-rebuild/out
FV=tools/facts-rebuild/render/frames-v
DEL=tools/facts-rebuild/deliverables/shorts
AUD="/Users/istricker/Obsidian/TA-NULLTAG/assets/releases/LJ_lichtjahr_vol2/audio"
mkdir -p "$DEL"
SL=11.5
NAMES=( trappist eventhorizon andromeda supernova cmb lastlight )
CLIPS=( "$OUT/vid-1-trappist.mp4" "$OUT/vid-2-eventhorizon.mp4" "$OUT/vid-3-andromeda-10s.mp4" "$OUT/vid-4-supernova-10s.mp4" "$OUT/vid-5-cmb-10s.mp4" "$OUT/vid-6-lastlight.mp4" )
TRACKS=( 01_trappist_loop 02_event_horizon 03_andromeda_approach 04_supernova 05_microwave 06_last_light )
OFFS=( 45 60 45 40 50 60 )

for i in 0 1 2 3 4 5; do
  n=$((i+1)); name="${NAMES[$i]}"; src="${CLIPS[$i]}"; tr="${TRACKS[$i]}"; off="${OFFS[$i]}"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  f=$(echo "scale=6; $SL/$dur" | bc)
  ffmpeg -y -loglevel error \
    -i "$src" \
    -framerate 30 -i "$FV/s$i/f_%05d.png" \
    -ss "$off" -t "$SL" -i "$AUD/$tr.mp3" \
    -filter_complex "\
      [0:v]setpts=${f}*PTS,fps=30,split[a][b];\
      [b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=26[bg];\
      [a]scale=1080:-2[fg];\
      [bg][fg]overlay=(W-w)/2:(H-h)/2,trim=duration=${SL},setpts=PTS-STARTPTS,hqdn3d=2:1.5:3:3[base];\
      [base][1:v]overlay=0:0:shortest=1,format=yuv420p[v];\
      [2:a]afade=t=in:st=0:d=0.4,afade=t=out:st=11.0:d=0.5[au]" \
    -map "[v]" -map "[au]" \
    -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 160k -shortest "$DEL/$n-$name.mp4"
  printf "%-16s " "$n-$name"; ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 "$DEL/$n-$name.mp4" | head -1
done
echo "=== Shorts fertig ==="; du -sh "$DEL"; ls -la "$DEL"
