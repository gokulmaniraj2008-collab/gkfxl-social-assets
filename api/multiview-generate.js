export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });

  const { image_url, views = 72 } = req.body || {};
  const count = Number(views);
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });
  if (![36, 72, 120].includes(count)) {
    return res.status(400).json({ code: 'INVALID_VIEW_COUNT', detail: 'views must be 36, 72, or 120.' });
  }

  // Provider-independent contract. A real multiview provider can be attached later
  // without changing the frontend contract. No fake frames are returned here.
  const provider = process.env.MULTIVIEW_PROVIDER_URL;
  if (!provider) {
    return res.status(503).json({
      code: 'MULTIVIEW_PROVIDER_NOT_CONFIGURED',
      detail: 'The multiview generation engine is not connected yet.',
      next: 'Set MULTIVIEW_PROVIDER_URL to a compatible server endpoint.',
      requested_views: count
    });
  }

  try {
    const response = await fetch(provider, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.MULTIVIEW_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.MULTIVIEW_PROVIDER_TOKEN}` } : {}) },
      body: JSON.stringify({ image_url, views: count })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ code: 'MULTIVIEW_PROVIDER_ERROR', detail: data?.detail || data?.error || 'Multiview provider request failed.' });
    return res.status(200).json({ provider: 'external', views: count, ...data });
  } catch (error) {
    return res.status(502).json({ code: 'MULTIVIEW_CONNECTION_FAILED', detail: error?.message || 'Could not reach the multiview provider.' });
  }
}
