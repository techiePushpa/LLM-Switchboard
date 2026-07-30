// Tiny local reverse proxy for Ollama.this is important to run the project in other system when the ollama is running locally in my syatem.
//
// Ollama rejects incoming requests whose Host header isn't "localhost" or
// "127.0.0.1" (a defense against DNS-rebinding attacks). A public tunnel
// (Tailscale Funnel, ngrok, etc.) forwards the original public hostname
// as the Host header, which Ollama then rejects with a 403. This proxy
// sits in between and rewrites the Host header back to "localhost"
// before forwarding, so Ollama accepts it.
//
// Run it with:   node ollama-proxy.js
// Then point your tunnel at PROXY_PORT (11435) instead of Ollama's own
// port (11434) directly.

const http = require("http");

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const PROXY_PORT = 11435;

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: "localhost" },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error("Proxy -> Ollama error:", err.message);
    if (!res.headersSent) res.writeHead(502);
    res.end(`Proxy error reaching Ollama: ${err.message}`);
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(
    `Ollama proxy listening on http://localhost:${PROXY_PORT}, forwarding to ` +
      `http://${OLLAMA_HOST}:${OLLAMA_PORT} with Host header rewritten to "localhost".`
  );
  console.log("Keep this window open. Point your tunnel at this port instead of 11434.");
});