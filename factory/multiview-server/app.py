import os
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gokul AI Factory Multi-view API", version="0.1.1")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "not-configured").strip()

@app.get("/health")
def health():
    ready = bool(MODEL_PROVIDER and MODEL_PROVIDER != "not-configured")
    return {"ok": True, "service": "multiview", "provider": MODEL_PROVIDER or "not-configured", "model_connected": ready}

@app.post("/generate-multiview")
async def generate_multiview(
    image: UploadFile = File(...),
    frames: int = Form(72),
    elevation: float = Form(0),
):
    if frames not in (36, 72, 120):
        raise HTTPException(400, "frames must be 36, 72, or 120")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(415, "image must be an image upload")
    if not MODEL_PROVIDER or MODEL_PROVIDER == "not-configured":
        raise HTTPException(503, "AI model is not connected. Use the browser Simulated 360 mode or configure a GPU model provider.")
    raise HTTPException(501, "The selected model provider has no adapter installed yet. Do not label this result as AI-generated 360.")

@app.get("/")
def root():
    return {"service": "Gokul AI Factory Multi-view API", "health": "/health", "docs": "/docs", "ai_model_connected": bool(MODEL_PROVIDER and MODEL_PROVIDER != "not-configured")}
