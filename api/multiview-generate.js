function dataUrlToBlob(dataUrl) {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('image_url must be a data:image/...;base64,... URL when no external provider is configured.');
  return new Blob([Buffer.from(match[2], 'base64')], { type: match[1] });
}

async function openaiImageEdit(imageUrl, angle) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured.');
  const form = new FormData();
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2');
  form.append('image', dataUrlToBlob(imageUrl), 'product.png');
  form.append('prompt', `Create a single photorealistic product image showing the SAME product rotated to approximately ${angle} degrees around its vertical axis. Preserve exact identity, proportions, colors, materials, markings, attached parts, and lighting. Do not redesign, add, remove, duplicate, or stylize the product. Use a clean pale studio background and soft contact shadow. This is one frame of a 72-frame 360-degree rotation sequence, so prioritize geometric and visual consistency with the reference.`);
  form.append('size', '1024x1024');
  form.append('quality', 'medium');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI Images API returned ${response.status}.`);
  const item = data?.data?.[0];
  if (!item?.b64_json) throw new Error('OpenAI returned no generated image data.');
  return { image_base64: item.b64_json, mime_type: 'image/png' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', detail: 'POST only' });
  const { image_url, views = 72, angle, index } = req.body || {};
  const count = Number(views);
  if (!image_url) return res.status(400).json({ code: 'IMAGE_REQUIRED', detail: 'image_url is required.' });
  if (![1, 36, 72, 120].includes(count)) return res.status(400).json({ code: 'INVALID_VIEW_COUNT', detail: 'views must be 1, 36, 72, or 120.' });
  if (count === 1 && (angle === undefined || Number.isNaN(Number(angle)))) return res.status(400).json({ code: 'ANGLE_REQUIRED', detail: 'angle is required for a single view.' });

  try {
    if (!process.env.MULTIVIEW_PROVIDER_URL) {
      if (count !== 1) return res.status(400).json({ code: 'USE_SINGLE_FRAME_ENDPOINT', detail: 'The OpenAI fallback generates one frame per request. The frontend should orchestrate the 72 frames.' });
      const result = await openaiImageEdit(image_url, Number(angle));
      return res.status(200).json({ provider: 'openai-images', views: 1, angle: Number(angle), index: index === undefined ? null : Number(index), ...result });
    }

    const payload = { image_url, views: count };
    if (count === 1) payload.angle = Number(angle);
    if (index !== undefined) payload.index = Number(index);
    const response = await fetch(process.env.MULTIVIEW_PROVIDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.MULTIVIEW_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.MULTIVIEW_PROVIDER_TOKEN}` } : {}) },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ code: 'MULTIVIEW_PROVIDER_ERROR', detail: data?.detail || data?.error || 'Multiview provider request failed.' });
    return res.status(200).json({ provider: 'external', views: count, ...(count === 1 ? { angle: Number(angle), index: index === undefined ? null : Number(index) } : {}), ...data });
  } catch (error) {
    return res.status(502).json({ code: 'MULTIVIEW_GENERATION_FAILED', detail: error?.message || 'Could not generate the requested view.' });
  }
}
