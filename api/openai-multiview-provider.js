export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ code: 'OPENAI_NOT_CONFIGURED', detail: 'OPENAI_API_KEY is not configured.' });

  const { image_url, angle = 0 } = req.body || {};
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });
  const normalizedAngle = ((Number(angle) % 360) + 360) % 360;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-6-luna',
        input: [{ role: 'user', content: [
          { type: 'input_text', text: `Create one clean product-view image corresponding to approximately ${normalizedAngle} degrees around the product. Preserve the same product identity, proportions, materials, colors, lighting and neutral studio presentation. Infer only hidden geometry that is reasonably supported by the reference. Do not add text, logos, people, props or background clutter. This is one frame in a multi-view 360 product sequence.` },
          { type: 'input_image', image_url }
        ] }],
        tools: [{ type: 'image_generation' }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ code: 'OPENAI_IMAGE_ERROR', detail: data?.error?.message || 'OpenAI image generation failed.' });
    const image = (data.output || []).find(item => item.type === 'image_generation_call');
    if (!image) return res.status(502).json({ code: 'OPENAI_NO_IMAGE', detail: 'OpenAI completed the request without returning an image-generation result.' });
    return res.status(200).json({ provider: 'openai', angle: normalizedAngle, result: image, response_id: data.id });
  } catch (error) {
    return res.status(502).json({ code: 'OPENAI_IMAGE_CONNECTION_FAILED', detail: error?.message || 'Could not reach OpenAI image generation.' });
  }
}
