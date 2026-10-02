import io
import os
import tempfile
from pathlib import Path

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from diffusers import WanImageToVideoPipeline
from diffusers.utils import export_to_video

MODEL_ID = os.getenv("WAN_MODEL", "Wan-AI/Wan2.1-I2V-14B-720P")
OUTPUT_DIR = Path(os.getenv("WAN_OUTPUT_DIR", "./outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Gokul AI Factory · Wan2.1")

pipe = None

def get_pipe():
    global pipe
    if pipe is None:
        dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
        if not torch.cuda.is_available():
            raise RuntimeError("Wan2.1 I2V requires a compatible GPU for practical generation.")
        pipe = WanImageToVideoPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
        )
        pipe.enable_model_cpu_offload()
    return pipe

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_ID, "cuda": torch.cuda.is_available()}

@app.post("/generate")
async def generate(
    image: UploadFile = File(...),
    prompt: str = Form(...),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "image must be PNG/JPG/WebP")
    try:
        raw = await image.read()
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
        # Keep the first version conservative for local machines.
        max_side = 1280
        scale = min(1.0, max_side / max(pil.width, pil.height))
        if scale < 1:
            pil = pil.resize((round(pil.width * scale), round(pil.height * scale)), Image.LANCZOS)

        generator = torch.Generator(device="cuda").manual_seed(42)
        result = get_pipe()(
            image=pil,
            prompt=prompt,
            height=480,
            width=832,
            num_frames=81,
            guidance_scale=5.0,
            generator=generator,
        )
        frames = result.frames[0]
        out = OUTPUT_DIR / "gokul-motion.mp4"
        export_to_video(frames, str(out), fps=16)
        return FileResponse(out, media_type="video/mp4", filename="gokul-motion.mp4")
    except Exception as exc:
        raise HTTPException(500, f"Generation failed: {exc}") from exc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))
