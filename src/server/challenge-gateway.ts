import { createHmac, randomBytes } from 'node:crypto';
const routes =
  /^\/v1\/(?:challenge\/(?:info|start|session|sync|answer|finalize|result|event)|verification\/(?:request|confirm)|admin\/(?:login|logout|me|summary|participants(?:\/(?:search|[a-f0-9-]{36}))?|coupons\/(?:lookup|redeem)|audit))$/;
export async function challengeGateway(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): Promise<Response> {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
  };
  const fail = (status: number, code: string) => Response.json({ code }, { status, headers });
  const url = new URL(request.url);
  // Astro's static deployment needs an explicit rewrite to one native function.
  // Support both the original URL and the rewritten destination URL; never
  // forward the internal routing parameter or allow it to override a real path.
  const rewritten = url.searchParams.getAll('__tg_route');
  if (rewritten.length > 1 || url.searchParams.getAll('__tg_path').length > 1)
    return fail(400, 'invalid_request');
  const pathname = url.pathname.replace(/\/$/, '');
  const path =
    pathname === '/api/challenge'
      ? '/' + (rewritten[0] || '').replace(/\/$/, '')
      : pathname.replace(/^\/api\/challenge(?=\/)/, '');
  url.searchParams.delete('__tg_route');
  // Vercel also appends named source captures to the destination query.
  url.searchParams.delete('__tg_path');
  if (!routes.test(path) || !['GET', 'POST'].includes(request.method))
    return fail(404, 'not_found');
  if (!env.CHALLENGE_BACKEND_URL || !env.CHALLENGE_GATEWAY_KEY || !env.CHALLENGE_ORIGIN)
    return fail(503, 'unavailable');
  if (
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    (request.method === 'POST' && request.headers.get('origin') !== env.CHALLENGE_ORIGIN)
  )
    return fail(403, 'blocked');
  if (
    request.method === 'POST' &&
    request.headers.get('content-type')?.split(';')[0] !== 'application/json'
  )
    return fail(415, 'invalid_request');
  try {
    const base = new URL(env.CHALLENGE_BACKEND_URL);
    if (
      base.protocol !== 'https:' ||
      base.username ||
      base.password ||
      base.pathname !== '/' ||
      base.search ||
      base.hash ||
      !/^[a-f0-9]{64}$/i.test(env.CHALLENGE_GATEWAY_KEY)
    )
      return fail(503, 'unavailable');
    let body = '';
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length') || 0) > 8192)
        return fail(413, 'request_too_large');
      const reader = request.body?.getReader();
      if (!reader) return fail(400, 'invalid_request');
      let size = 0;
      const chunks: Uint8Array[] = [];
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          (async () => {
            for (;;) {
              const r = await reader.read();
              if (r.done) break;
              size += r.value.length;
              if (size > 8192) throw new Error('too_large');
              chunks.push(r.value);
            }
          })(),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error('timeout')), 8000);
          }),
        ]);
        body = Buffer.concat(chunks).toString('utf8');
      } finally {
        clearTimeout(timeout);
        void reader.cancel().catch(() => {});
      }
    }
    const target = path + url.search,
      timestamp = String(Date.now()),
      nonce = randomBytes(16).toString('hex');
    const client = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const signature = createHmac('sha256', Buffer.from(env.CHALLENGE_GATEWAY_KEY, 'hex'))
      .update([request.method, target, timestamp, nonce, client, body].join('\n'))
      .digest('hex');
    const upstream = await fetch(new URL(target, base), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        Origin: env.CHALLENGE_ORIGIN,
        'x-tg-time': timestamp,
        'x-tg-nonce': nonce,
        'x-tg-client': client,
        'x-tg-signature': signature,
        Cookie: (request.headers.get('cookie') || '')
          .split(';')
          .filter((x) => /^\s*__Host-tg_(player|admin)=/.test(x))
          .join(';'),
        'Idempotency-Key': request.headers.get('idempotency-key') || '',
        'X-CSRF-Token': request.headers.get('x-csrf-token') || '',
      },
      body: request.method === 'POST' ? body : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(12000),
    });
    const responseHeaders = new Headers(headers);
    responseHeaders.set('Content-Type', 'application/json');
    for (const value of upstream.headers.getSetCookie())
      if (/^__Host-tg_(player|admin)=/.test(value)) responseHeaders.append('Set-Cookie', value);
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return fail(
      (error as Error).message === 'too_large' ? 413 : 503,
      (error as Error).message === 'too_large' ? 'request_too_large' : 'unavailable',
    );
  }
}
