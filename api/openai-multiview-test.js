export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ code: 'OPENAI_NOT_CONFIGURED', detail: 'OpenAI is not configured.' });

  const { image_url, angle = 0 } = req.body || {};
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });

  const prompt = `Create one consistent product view for a 360-degree product sequence. Target horizontal rotation angle: ${Number(angle)} degrees. Preserve the product identity, proportions, materials, colors, branding, lighting and neutral studio background. Infer only the hidden geometry needed for this view. Do not add objects or text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        input: [{ role: 'user', content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url }
        ] }],
        tools: [{ type: 'image_generation' }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ code: 'OPENAI_IMAGE_ERROR', detail: data?.error?.message || 'OpenAI image generation failed.' });

    const imageCall = (data.output || []).find(item => item.type === 'image_generation_call');
    if (!imageCall?.result) return res.status(502).json({ code: 'IMAGE_RESULT_MISSING', detail: 'OpenAI completed the request but returned no generated image result.' });

    return res.status(200).json({ angle: Number(angle), image_base64: imageCall.result, mime_type: 'image/png' });
  } catch (error) {
    return res.status(502).json({ code: 'OPENAI_CONNECTION_FAILED', detail: error?.message || 'Could not reach OpenAI.' });
  }
}
