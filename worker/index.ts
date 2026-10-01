// worker/index.ts
interface IWorkerEnv {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGIN: string; // может быть списком: "http://localhost:3001,https://horcrux-canvas.vercel.app"
}

interface IIncomingBody {
  prompt: string;
  image: string | null;
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-flash';

function getCorsHeaders(origin: string, allowedList: string): Record<string, string> {
  const allowed = allowedList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const matched = allowed.includes(origin) ? origin : allowed[0] ?? '';

  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request: Request, env: IWorkerEnv): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedList = env.ALLOWED_ORIGIN ?? '';

    console.log('[worker] request', {
      method: request.method,
      origin,
      allowedList,
    });

    // CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('[worker] responding to OPTIONS');
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    let body: IIncomingBody;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const { prompt, image, history } = body;

    if (!Array.isArray(history) || history.length === 0) {
      return new Response('Bad Request: empty history', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const currentContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    if (prompt && prompt.trim().length > 0) {
      currentContent.push({ type: 'text', text: prompt });
    }

    if (image && image.length > 0) {
      currentContent.push({ type: 'image_url', image_url: { url: image } });
    }

    if (currentContent.length === 0) {
      return new Response('Bad Request: empty input', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const messages = [
      ...history,
      { role: 'user', content: currentContent },
    ];

    console.log('[worker] sending to DeepSeek', {
      model: MODEL,
      messagesCount: messages.length,
      hasImage: Boolean(image),
    });

    let deepseekResponse: Response;
    try {
      deepseekResponse = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({ model: MODEL, messages }),
      });
    } catch (err) {
      console.error('[worker] fetch to DeepSeek threw', err);
      return new Response(
        JSON.stringify({ error: 'DeepSeek fetch failed', detail: String(err) }),
        {
          status: 502,
          headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
        }
      );
    }

    if (!deepseekResponse.ok) {
      const errText = await deepseekResponse.text().catch(() => '');
      console.error('[worker] DeepSeek error', deepseekResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'DeepSeek error', status: deepseekResponse.status, detail: errText }),
        {
          status: 502,
          headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await deepseekResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
    });
  },
};