import { createServer } from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const args = process.argv.slice(2),
  get = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const root = await realpath(resolve(get("--root", "."))),
  prefix = get("--prefix", "/"),
  port = Number(get("--port", "4173")),
  host = get("--host", "127.0.0.1");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".zip": "application/zip",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://local").pathname,
    );
    if (!pathname.startsWith(prefix)) throw Error("outside prefix");
    let rel = pathname.slice(prefix.length);
    if (!rel || rel.endsWith("/")) rel += "index.html";
    if (
      rel.split("/").some((p) => p.startsWith(".")) ||
      rel.startsWith("node_modules/")
    )
      throw Error("private path");
    const path = await realpath(resolve(root, rel));
    if (!path.startsWith(root + sep) || (await stat(path)).isDirectory())
      throw Error("outside root");
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, host, () =>
  console.log(`Serving ${root} at http://${host}:${port}${prefix}`),
);
