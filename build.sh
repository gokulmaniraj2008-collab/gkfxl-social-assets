#!/usr/bin/env bash
set -euo pipefail

rm -rf .frame_extract frames_web
mkdir -p .frame_extract frames_web

zip_file=$(find frames -maxdepth 1 -type f -iname '*.zip' | head -n 1)
if [ -z "$zip_file" ]; then
  echo "No frame ZIP found in frames/"
  exit 1
fi

unzip -o "$zip_file" -d .frame_extract >/dev/null
mapfile -d '' files < <(find .frame_extract -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 | sort -z)

if [ "${#files[@]}" -lt 40 ]; then
  echo "Expected at least 40 frames, found ${#files[@]}"
  exit 1
fi

rm -f frames_web/frame_*.jpg
for i in $(seq 1 40); do
  file="${files[$((i-1))]}"
  printf -v output 'frames_web/frame_%04d.jpg' "$i"
  cp "$file" "$output"
done

rm -rf .frame_extract
printf 'Prepared 40 frames for Vercel.\n'
