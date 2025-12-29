const KEY = 'lovesite:config';

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured on Vercel.`);
  return v;
}

export async function getConfig() {
  const kvUrl = mustEnv('KV_REST_API_URL');
  const kvToken = mustEnv('KV_REST_API_TOKEN');

  const kvRes = await fetch(`${kvUrl}/get/${encodeURIComponent(KEY)}`, {
    headers: {
      Authorization: `Bearer ${kvToken}`,
    },
  });

  if (!kvRes.ok) {
    const text = await kvRes.text();
    throw new Error(`KV get failed: ${text}`);
  }

  const data = await kvRes.json();
  const raw = data?.result ?? null;

  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      // 兼容：如果历史数据不是 JSON，就当作无配置
      return null;
    }
  }

  return null;
}

export async function saveConfig(configObj) {
  const kvUrl = mustEnv('KV_REST_API_URL');
  const kvToken = mustEnv('KV_REST_API_TOKEN');

  const kvRes = await fetch(`${kvUrl}/set/${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    // Upstash REST /set 这里保持历史兼容：value 存 JSON 字符串
    body: JSON.stringify(JSON.stringify(configObj)),
  });

  if (!kvRes.ok) {
    const text = await kvRes.text();
    throw new Error(`KV set failed: ${text}`);
  }

  return true;
}


