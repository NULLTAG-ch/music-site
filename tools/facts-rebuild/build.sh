#!/usr/bin/env bash
# Baut das neue facts.mp4 aus den 6 Veo-Clips + croppt 9:16-Shorts.
# Reihenfolge LJ-07..12: trappist, eventhorizon, andromeda, supernova, cmb, lastlight
set -euo pipefail
cd "$(dirname "$0")/../.."   # -> repo root
OUT=tools/facts-rebuild/out
WORK=tools/facts-rebuild/work
mkdir -p "$WORK" assets/shorts

CLIPS=(vid-1-trappist vid-2-eventhorizon vid-3-andromeda vid-4-supernova vid-5-cmb vid-6-lastlight)
SEG=10  # Ziel-Sekunden pro Segment (6*10 = 60s, matcht Musik)

# 1) Jeden 8s-Clip auf SEG sek strecken (setpts), normalisieren auf 1920x1080@30, ohne Audio
i=0
: > "$WORK/concat.txt"
for c in "${CLIPS[@]}"; do
  i=$((i+1))
  src="$OUT/$c.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  factor=$(echo "scale=6; $SEG/$dur" | bc)
  ffmpeg -y -loglevel error -i "$src" \
    -filter:v "setpts=${factor}*PTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" \
    -an -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p "$WORK/seg-$i.mp4"
  echo "file 'seg-$i.mp4'" >> "$WORK/concat.txt"
done

# 2) Segmente concat (Video)
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/concat.txt" -c copy "$WORK/video-silent.mp4"

# 3) Bestehende Musik aus altem facts.mp4 übernehmen, auf 60s muxen
ffmpeg -y -loglevel error -i "$WORK/video-silent.mp4" -i tools/facts-rebuild/facts-original-backup.mp4 \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$WORK/facts-new.mp4"
mv "$WORK/facts-new.mp4" assets/facts.mp4

# 4) 9:16-Shorts: je Clip zentral aus dem 16:9-Master croppen (1080x1920), inkl. Audio-Segment
i=0
for c in "${CLIPS[@]}"; do
  i=$((i+1))
  name="${c#vid-?-}"
  ffmpeg -y -loglevel error -i "$WORK/seg-$i.mp4" \
    -filter:v "crop=ih*9/16:ih,scale=1080:1920" -an \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "assets/shorts/${i}-${name}.mp4"
done

echo "FERTIG: assets/facts.mp4 + assets/shorts/*.mp4"
ffprobe -v error -show_entries format=duration:stream=width,height,codec_type -of default=noprint_wrappers=1 assets/facts.mp4
