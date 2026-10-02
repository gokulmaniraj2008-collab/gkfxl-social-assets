# Wan2.1 local video backend

This is the open-source local backend adapter for Gokul AI Motion Factory.

It uses the official Wan2.1 Image-to-Video model through Diffusers. Wan2.1 supports image-to-video and is open source. The 1.3B text-to-video model is documented at about 8.19 GB VRAM; the I2V 14B models need substantially more GPU memory.

## Run

Recommended: Python 3.10/3.11 + NVIDIA GPU + recent CUDA/PyTorch.

```bash
pip install -r requirements.txt
python server.py
```

The API listens on `http://127.0.0.1:7860`.

### Endpoint

`POST /generate`

Multipart form:
- `image`: PNG/JPG/WebP
- `prompt`: motion prompt
- `seconds`: requested duration (the model produces a short clip; the server trims if necessary)

Returns an MP4 video.

## Connect the website

In Gokul AI Motion Factory, choose **Wan2.1 Local** and set the backend URL to your machine's reachable URL.

A Vercel-hosted frontend cannot run the GPU model itself. The GPU backend must run on a computer/server with a compatible GPU, while the open-source frontend remains on Vercel.
