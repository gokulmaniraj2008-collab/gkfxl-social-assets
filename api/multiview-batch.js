export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });
  const { image_url, views = 72, max_retries = 2 } = req.body || {};
  const count = Number(views);
  const retries = Math.max(0, Math.min(5, Number(max_retries)));
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });
  if (count !== 72) return res.status(400).json({ code: 'BATCH_REQUIRES_72', detail: 'This endpoint is intentionally the 72-view MVP.' });
  const provider = process.env.MULTIVIEW_PROVIDER_URL;
  if (!provider) return res.status(503).json({ code: 'MULTIVIEW_PROVIDER_NOT_CONFIGURED', detail: 'Set MULTIVIEW_PROVIDER_URL to a real multiview generation server.' });

  const frames = Array.from({ length: 72 }, (_, i) => ({ index: i + 1, angle: i * 5, status: 'pending', attempts: 0 }));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const results = [];

  for (const frame of frames) {
    let lastError = 'Unknown provider error';
    for (let attempt = 0; attempt <= retries; attempt++) {
      frame.attempts = attempt + 1;
      try {
        const response = await fetch(provider, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(process.env.MULTIVIEW_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.MULTIVIEW_PROVIDER_TOKEN}` } : {}) },
          body: JSON.stringify({ image_url, views: 1, angle: frame.angle, index: frame.index })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.detail || data?.error || `Provider returned ${response.status}`);
        frame.status = 'completed';
        results.push({ index: frame.index, angle: frame.angle, ...data });
        break;
      } catch (error) {
        lastError = error?.message || lastError;
        if (attempt < retries) await sleep(400 * (attempt + 1));
      }
    }
    if (frame.status !== 'completed') {
      frame.status = 'failed';
      frame.error = lastError;
      results.push({ index: frame.index, angle: frame.angle, error: lastError });
    }
  }

  const completed = frames.filter(f => f.status === 'completed').length;
  return res.status(200).json({
    views: 72,
    completed,
    failed: 72 - completed,
    progress: completed / 72,
    frames: results,
    playback: results.filter(x => !x.error).sort((a,b) => a.index - b.index)
  });
}
