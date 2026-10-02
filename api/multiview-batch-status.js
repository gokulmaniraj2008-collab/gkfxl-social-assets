export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'GET only' });
  return res.status(200).json({
    endpoint: '/api/multiview-batch',
    mode: '72-view-orchestration',
    retry_attempts: 2,
    angles: '0° through 355° in 5° increments',
    playback_order: 'frame index ascending',
    provider: Boolean(process.env.MULTIVIEW_PROVIDER_URL)
  });
}
