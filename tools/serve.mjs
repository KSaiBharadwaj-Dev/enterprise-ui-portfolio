/* A tiny static server for trying the site locally: npm run serve, then open http://localhost:8080
   Opening index.html straight from disk also works, but a server shows the explorer reading live files. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".ts": "text/plain",
  ".tsx": "text/plain",
  ".md": "text/plain",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

createServer(async (req, res) => {
  let path;
  try {
    path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  } catch {
    res.writeHead(400).end("Bad request"); // a malformed % sequence in the address
    return;
  }
  const file = join(root, path === "/" || path === "\\" ? "index.html" : path);
  if (!file.startsWith(root + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(file); // read first, so a missing file cannot leave a half-sent 200 behind
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(8080, () => console.log("http://localhost:8080"));
