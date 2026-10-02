# GKFXL Free Creative Pipeline

## Goal

Turn a manually generated AI image/video into a reusable web animation with as little paid infrastructure as possible.

## Flow

1. **Idea** — write the creative brief in ChatGPT.
2. **Image** — generate the reference/product image in ChatGPT.
3. **Video** — use Google Flow manually for image-to-video/text-to-video when its free allowance is available.
4. **Input** — place the exported Flow video in `input/` when video processing is needed, or put FramePeel's ZIP in `frames/`.
5. **Automation** — GitHub Actions validates/extracts/normalizes frames.
6. **Website** — `index.html` renders the sequence with Canvas and maps scroll progress to frames.
7. **Deploy** — Vercel deploys from GitHub automatically.

## Folder contract

```text
input/                 # optional Flow exports
frames/*.zip           # FramePeel frame archive
frames_web/             # generated/normalized web frames
prompts/               # reusable image/video prompts
index.html             # demo website
build.sh               # Vercel build preparation
vercel.json            # Vercel configuration
.github/workflows/     # automation
```

## Free-first rule

AI generation is the only intentionally manual step. Do not put API keys for paid AI services in this repository.

GitHub Actions can run standard runners for free in public repositories. GitHub Free also includes a monthly allowance for private repositories. Vercel Hobby is free for personal/non-commercial projects, so use it for demos and learning rather than commercial production unless the account is upgraded.

## Updating an animation

- Generate a new video in Flow.
- Extract frames with FramePeel.
- Replace the ZIP in `frames/`.
- Push the ZIP.
- The media pipeline prepares `frames_web/`.
- Vercel picks up the commit and redeploys.

## Important

Google Flow is not directly automated by this repository. Keep the generation step manual unless an official API/connector is available and its free terms permit automation.
