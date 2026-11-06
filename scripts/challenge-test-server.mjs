// Loopback-only isolated harness. Mock OTP/mail; never deploy or use real credentials.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createApp } from '../services/challenge/dist/app.js';
import { createOtp } from '../services/challenge/dist/otp.js';
import { config, fixtureBank } from '../services/challenge/tests/fixtures.ts';
import { totp } from '../services/challenge/dist/security.js';
import { loadBank } from '../services/challenge/dist/bank.js';
import { Buffer } from 'node:buffer';
import { clearInterval } from 'node:timers';
if (process.env.VERCEL || process.env.NODE_ENV === 'production')
  throw new Error('Local harness only');
const port = Number(process.env.CHALLENGE_TEST_PORT || 4340);
if (!Number.isInteger(port) || port < 1024 || port > 65534) throw new Error('Invalid test port');
const c = config({ CHALLENGE_ORIGIN: `http://127.0.0.1:${port}` });
const bank =
  process.env.CHALLENGE_PREVIEW_BANK === 'real'
    ? loadBank('content/challenge/questions.json', true)
    : fixtureBank;
const { app, admin, engine } = createApp(c, bank, createOtp(c));
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
await admin.create('local-admin@example.test', 'Local-test-password-only!', secret);
await admin.create('local-ar-admin@example.test', 'Local-test-password-only!', secret);
const timer = setInterval(() => engine.sweep(), 500);
timer.unref();
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/__test/totp') {
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ code: totp(secret, Date.now()) }));
    return;
  }
  if (path.startsWith('/api/challenge/')) {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 8192) {
        res.writeHead(413).end();
        return;
      }
    }
    try {
      const result = await app.inject({
        method: req.method,
        url: req.url.replace('/api/challenge', '').replace(/\/$/, ''),
        headers: req.headers,
        payload: body || undefined,
        remoteAddress: '127.0.0.1',
      });
      res.writeHead(result.statusCode, result.headers);
      res.end(result.body);
    } catch {
      res.writeHead(500).end();
    }
    return;
  }
  if (path === '/api/feedback/') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ available: false }));
    return;
  }
  const root = resolve('.local/challenge-preview');
  try {
    let file = resolve(root, '.' + decodeURIComponent(path));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
      '.pdf': 'application/pdf',
      '.xml': 'application/xml',
      '.txt': 'text/plain',
    };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
const close = () => {
  clearInterval(timer);
  server.close();
  void app.close();
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
server.listen(port, '127.0.0.1');
