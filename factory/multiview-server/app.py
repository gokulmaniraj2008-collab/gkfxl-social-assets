import os
from typing import Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="Gokul AI Factory Multi-view API", version="0.1.0")

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "not-configured")

@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "multiview",
        "provider": MODEL_PROVIDER,
        "model_connected": MODEL_PROVIDER != "not-configured",
    }

@app.post("/generate-multiview")
async def generate_multiview(
    image: UploadFile = File(...),
    frames: int = Form(72),
    elevation: float = Form(0),
):
    if frames not in (36, 72, 120):
        raise HTTPException(400, "frames must be 36, 72, or 120")
    if MODEL_PROVIDER == "not-configured":
        raise HTTPException(
            503,
            "No multi-view model is configured. Install/connect an open-source image-to-3D or multi-view model on this GPU host.",
        )

    # Model adapter boundary. A real provider implementation should:
    # 1) save image securely,
    # 2) run the selected model,
    # 3) render ordered camera views,
    # 4) return persistent frame URLs.
    raise HTTPException(501, "MODEL_PROVIDER adapter is configured but not implemented yet")

@app.get("/")
def root():
    return JSONResponse({"service": "Gokul AI Factory Multi-view API", "docs": "/docs"})
