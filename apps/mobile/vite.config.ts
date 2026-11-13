import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Content-Security-Policy for the shipped app (build only — the dev server needs inline HMR scripts).
 * Everything is bundled locally, so nothing outside the app origin may load or be contacted;
 * this limits what an injected script could do even if one ever got in.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'", // wasm: browser-only sql.js fallback
  "style-src 'self' 'unsafe-inline'", // inline style attributes (animations)
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data:",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
const csp = (): Plugin => ({
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

export default defineConfig({
  plugins: [react(), tailwindcss(), csp()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // one React even if the project is reached through a different drive path (e.g. subst L:)
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5173 },
});
