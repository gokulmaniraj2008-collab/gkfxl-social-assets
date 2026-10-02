export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });

  const { image_url, angle = 0 } = req.body || {};
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });

  // OpenAI is intentionally used for product analysis only. Image generation is
  // delegated to the configured multiview provider so the app does not call an
  // unsupported OpenAI image-generation/Responses combination.
  const provider = process.env.MULTIVIEW_PROVIDER_URL;
  if (!provider) {
    return res.status(503).json({
      code: 'MULTIVIEW_PROVIDER_NOT_CONFIGURED',
      detail: 'No 360° image-generation engine is connected yet.',
      requested_angle: Number(angle),
      next: 'Configure MULTIVIEW_PROVIDER_URL in the server environment.'
    });
  }

  try {
    const response = await fetch(provider, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MULTIVIEW_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.MULTIVIEW_PROVIDER_TOKEN}` } : {})
      },
      body: JSON.stringify({ image_url, views: 1, angle: Number(angle), index: null })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        code: 'MULTIVIEW_PROVIDER_ERROR',
        detail: data?.detail || data?.error || `Multiview provider returned ${response.status}.`
      });
    }

    return res.status(200).json({ provider: 'external', angle: Number(angle), ...data });
  } catch (error) {
    return res.status(502).json({
      code: 'MULTIVIEW_CONNECTION_FAILED',
      detail: error?.message || 'Could not reach the multiview provider.'
    });
  }
}
