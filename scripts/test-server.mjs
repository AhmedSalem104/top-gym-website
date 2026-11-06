// Local test harness: real API handler + Astro production assets, without production secrets.
import { spawn } from 'node:child_process';
import { createServer, request as proxyRequest } from 'node:http';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import { createFeedbackHandler } from '../src/server/feedback/handler.ts';

const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex < 0 ? 4321 : process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65534) throw new Error('Invalid port');
const assetPort = port + 1;
const child = spawn(
  process.execPath,
  [
    'node_modules/astro/bin/astro.mjs',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(assetPort),
  ],
  { stdio: 'inherit', env: process.env },
);
const handler = createFeedbackHandler({
  send: async () => {
    throw new Error('Test mail disabled');
  },
});
const server = createServer(async (req, res) => {
  if (new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '') === '/api/feedback') {
    try {
      const response = await handler(
        new globalThis.Request('http://127.0.0.1:' + port + req.url, {
          method: req.method,
          headers: req.headers,
          ...(['GET', 'HEAD'].includes(req.method)
            ? {}
            : { body: Readable.toWeb(req), duplex: 'half' }),
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500).end();
    }
    return;
  }
  const upstream = proxyRequest(
    {
      hostname: '127.0.0.1',
      port: assetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(503);
    res.end();
  });
  req.pipe(upstream);
});
const close = () => {
  server.close();
  child.kill();
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
child.on('exit', (code) => {
  server.close();
  process.exitCode = code || 0;
});
server.listen(port, '127.0.0.1');
