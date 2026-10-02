"""Local development fallback for testing the complete one-image -> 360 pipeline.

This intentionally does NOT claim to reconstruct unseen geometry. It produces an
ordered 36/72/120-frame turntable from one image so the frontend and FramePeel
pipeline can be tested before a real GPU multi-view model is connected.
"""
from pathlib import Path
from PIL import Image
import argparse
import math


def render(source: Path, output: Path, frames: int = 72):
    if frames not in (36, 72, 120):
        raise ValueError("frames must be 36, 72, or 120")
    image = Image.open(source).convert("RGBA")
    size = 1200
    output.mkdir(parents=True, exist_ok=True)
    for i in range(frames):
        angle = i * 360 / frames
        rad = math.radians(angle)
        # Perspective-style squash and slight vertical tilt. This is a testing
        # fallback, not hidden-side reconstruction.
        scale_x = max(0.08, 1 - abs(math.sin(rad)) * 0.82)
        scale_y = 1 - abs(math.sin(rad * 2)) * 0.025
        w = max(1, round(size * scale_x))
        h = max(1, round(size * 0.72 * scale_y))
        frame = image.copy()
        frame.thumbnail((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (size, round(size * 0.72)), (8, 8, 8))
        canvas.alpha_composite(frame, ((size - frame.width) // 2, (canvas.height - frame.height) // 2)) if canvas.mode == "RGBA" else canvas.paste(frame, ((size - frame.width) // 2, (canvas.height - frame.height) // 2), frame)
        canvas.save(output / f"frame_{i:04d}.jpg", quality=92, optimize=True)
    print(f"Generated {frames} test frames in {output}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("image")
    p.add_argument("--frames", type=int, default=72)
    p.add_argument("--output", default="./out-360")
    a = p.parse_args()
    render(Path(a.image), Path(a.output), a.frames)
