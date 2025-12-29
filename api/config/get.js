import { json } from '../utils/http.js';
import { getConfig } from '../utils/kv.js';

export default async function handler(req, res) {
  try {
    const config = await getConfig();
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, { config });
  } catch (e) {
    return json(res, 500, { error: 'Failed to fetch config', detail: String(e) });
  }
}
