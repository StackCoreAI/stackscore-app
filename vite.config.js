// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function stackscoreApi() {
  return {
    name: 'stackscore-api',
    configureServer(server) {
      server.middlewares.use('/api/gpt-plan', async (req, res) => {
        try {
          // ---- parse query
          const u = new URL(req.originalUrl || req.url, 'http://localhost');
          req.query = Object.fromEntries(u.searchParams);

          // ---- parse JSON body (POST)
          if (req.method === 'POST') {
            await new Promise((resolve) => {
              let body = '';
              req.on('data', (c) => (body += c));
              req.on('end', () => {
                try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
                resolve();
              });
            });
          } else {
            req.body = {};
          }

          // ---- add Next-like helpers to the Node response
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (obj) => {
            if (!res.getHeader('content-type')) {
              res.setHeader('content-type', 'application/json');
            }
            res.end(JSON.stringify(obj));
            return obj;
          };

          // ---- load the TS handler via Vite (works with .ts/.js)
          const candidates = [
            '/src/api/gpt-plan.ts',
            '/api/gpt-plan.ts',
            '/api/gpt-plan.js',
          ];

          let mod; let lastErr;
          for (const p of candidates) {
            try {
              // hot-reload each request in dev
              mod = await server.ssrLoadModule(p);
              if (mod?.default) break;
            } catch (e) { lastErr = e; }
          }
          if (!mod?.default) {
            res.status(500).json({
              error: 'Dev API error',
              detail: `Could not load gpt-plan handler (${lastErr?.message || 'no module found'})`,
            });
            return;
          }

          // ---- hand off to your existing handler
          await mod.default(req, res);
        } catch (e) {
          console.error('stackscore-api dev error:', e);
          res.status(500).json({ error: 'Dev API error', detail: String(e?.message || e) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), stackscoreApi()],
});


