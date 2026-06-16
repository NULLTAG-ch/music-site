#!/usr/bin/env bash
# 6 Spotify-Canvas-Loops (1080x1920, ~8s nahtlos, stumm, kein Text): Blur-Fill + Boomerang
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=tools/facts-rebuild/out
DEL=tools/facts-rebuild/deliverables/canvas
mkdir -p "$DEL"
make_canvas () {  # name src start end
  local name="$1" src="$2" st="$3" en="$4"
  ffmpeg -y -loglevel error -i "$src" -filter_complex \
    "[0:v]trim=${st}:${en},setpts=PTS-STARTPTS,fps=30[c];\
     [c]split[a][b];\
     [b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28[bg];\
     [a]scale=1080:-2[fg];\
     [bg][fg]overlay=(W-w)/2:(H-h)/2[v0];\
     [v0]split[f][r0];[r0]reverse[rv];[f][rv]concat=n=2:v=1,format=yuv420p[v]" \
    -map "[v]" -an -r 30 -c:v libx264 -preset slow -crf 20 -movflags +faststart "$DEL/$name.mp4"
}
make_canvas "1-trappist"     "$OUT/vid-1-trappist.mp4"      1 5
make_canvas "2-eventhorizon" "$OUT/vid-2-eventhorizon.mp4"  1 5
make_canvas "3-andromeda"    "$OUT/vid-3-andromeda-10s.mp4" 2 6
make_canvas "4-supernova"    "$OUT/vid-4-supernova-10s.mp4" 2 6
make_canvas "5-cmb"          "$OUT/vid-5-cmb-10s.mp4"       2 6
make_canvas "6-lastlight"    "$OUT/vid-6-lastlight.mp4"     1 5
echo "Canvas → $DEL"; ls -la "$DEL"
