# One-Image AI 360 Product Pipeline

## Goal
Upload one product image and generate a convincing 360-degree sequence by creating unseen viewpoints with an image-to-multi-view model, then render 72 frames at 5-degree intervals.

## Important
A single 2D image cannot reveal physically verified hidden geometry. Generated back/side views are AI reconstructions and must be reviewed for consistency.

## Pipeline
1. Upload one clean product image.
2. Remove background / isolate subject.
3. Generate multi-view images from the source using a compatible open-source multi-view or 3D reconstruction model.
4. Generate 72 ordered views: 0, 5, 10, ... 355 degrees.
5. Run consistency checks: silhouette, color, logos, dimensions, lighting.
6. Preview interactive 360 spin.
7. Export frames for FramePeel.
8. Generate scroll-controlled website.

## UI states
- Source image ready
- Generating viewpoints
- Consistency check
- 72 views ready
- Preview 360
- Send to FramePeel

## Backend contract
`POST /generate-multiview` with multipart image and JSON options `{frames:72, elevation:0}`.

Response should return ordered image URLs/files and metadata. The frontend should never claim true physical accuracy unless the backend/model provides it.

## Free fallback
If no AI backend is configured, use the existing browser 3D simulation. Label it clearly as `Simulated 360`, not AI-generated 360.
