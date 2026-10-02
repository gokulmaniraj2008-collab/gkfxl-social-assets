export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'GET only' });

  const configured = Boolean(process.env.MULTIVIEW_PROVIDER_URL);
  return res.status(200).json({
    configured,
    provider: configured ? 'external' : null,
    supported_views: [36, 72, 120],
    token_configured: Boolean(process.env.MULTIVIEW_PROVIDER_TOKEN)
  });
}
