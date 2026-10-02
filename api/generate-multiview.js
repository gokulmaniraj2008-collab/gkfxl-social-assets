export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'POST only' });

  // The open-source project deliberately does not ship model credentials.
  // Configure a compatible provider through MULTIVIEW_ENGINE_URL in Vercel.
  const endpoint = process.env.MULTIVIEW_ENGINE_URL;
  if (!endpoint) {
    return res.status(503).json({
      detail: 'No multiview generation engine is configured. Set MULTIVIEW_ENGINE_URL to a compatible provider.',
      code: 'ENGINE_NOT_CONFIGURED'
    });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    const body = await readBody(req);
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { detail: text || 'Generation engine returned an invalid response.' }; }

    return res.status(upstream.status).json(data);
  } catch (error) {
    return res.status(502).json({ detail: error?.message || 'Unable to reach the multiview generation engine.' });
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
