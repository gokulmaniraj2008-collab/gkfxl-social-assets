# Multi-view backend starter

This folder defines the backend boundary for the one-image-to-360 workflow.

The frontend expects:

- `POST /generate-multiview`
- multipart field: `image`
- form field: `frames` (default 72)
- form field: `elevation` (default 0)

Response:

```json
{
  "mode": "ai-multiview",
  "frames": 72,
  "step_degrees": 5,
  "images": [
    {"index": 0, "angle": 0, "url": "..."},
    {"index": 1, "angle": 5, "url": "..."}
  ]
}
```

## Important

This is an integration boundary, not a fake AI implementation. A real multi-view/3D model must be installed on a GPU host and exposed through this endpoint. Until then, the browser Studio must clearly label its fallback as `Simulated 360`.

Recommended model layer: a compatible open-source single-image-to-multi-view or image-to-3D model that can produce consistent turntable views. Keep model weights and GPU dependencies outside the Vercel frontend.
