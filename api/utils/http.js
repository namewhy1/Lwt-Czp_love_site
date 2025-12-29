export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function verifyAdminToken(req) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return { valid: false, status: 500, error: 'ADMIN_TOKEN is not configured on Vercel.' };
  }

  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== adminToken) {
    return { valid: false, status: 401, error: 'Unauthorized' };
  }

  return { valid: true, status: 200 };
}

export function safeJsonParse(input) {
  if (input == null) return { ok: true, value: null };
  if (typeof input === 'object') return { ok: true, value: input };
  if (typeof input !== 'string') return { ok: false, error: 'Body must be JSON object or JSON string.' };

  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e) {
    return { ok: false, error: 'Invalid JSON', detail: String(e) };
  }
}


