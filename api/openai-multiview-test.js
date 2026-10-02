export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });
  const { image_url, angle = 0 } = req.body || {};
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });

  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    const response = await fetch(`${base}/api/multiview-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url, views: 1, angle: Number(angle), index: null })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(data);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ code: 'MULTIVIEW_CONNECTION_FAILED', detail: error?.message || 'Could not reach the multiview generator.' });
  }
}
