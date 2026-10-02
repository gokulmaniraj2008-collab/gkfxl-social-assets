export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'POST only' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ code: 'OPENAI_NOT_CONFIGURED', detail: 'OpenAI is not configured on the server.' });
  }
  try {
    const { prompt = '', image_url } = req.body || {};
    const input = image_url
      ? [{ role: 'user', content: [{ type: 'input_text', text: prompt || 'Analyze this product image for an AI 360-degree product workflow. Return a concise description of the product, materials, colors, geometry, likely hidden-side structure, and generation guidance.' }, { type: 'input_image', image_url }] }]
      : [{ role: 'user', content: [{ type: 'input_text', text: prompt || 'Describe the product for a 360-degree product-generation workflow. Focus on geometry, materials, colors and camera guidance.' }] }];
    const model = process.env.OPENAI_VISION_MODEL || 'gpt-6-luna';
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, input, max_output_tokens: 700 })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ code: 'OPENAI_ERROR', detail: data?.error?.message || `OpenAI request failed for model ${model}.` });

    const text = typeof data.output_text === 'string' && data.output_text.trim()
      ? data.output_text.trim()
      : (Array.isArray(data.output) ? data.output.flatMap(item => Array.isArray(item.content) ? item.content : []).map(part => part?.text || part?.value || '').filter(Boolean).join('\n').trim() : '');

    if (!text) {
      return res.status(502).json({ code: 'OPENAI_EMPTY_OUTPUT', detail: 'OpenAI returned a successful response but no text output.', response_id: data.id || null });
    }
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ code: 'ANALYSIS_FAILED', detail: e?.message || 'Product analysis failed.' });
  }
}
