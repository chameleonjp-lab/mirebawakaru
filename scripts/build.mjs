import {
  cp,
  mkdir,
  readFile,
  writeFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const args = process.argv.slice(2),
  out = resolve(
    args.includes("--out") ? args[args.indexOf("--out") + 1] : "dist",
  );
if (out === process.cwd() || !out.includes("/"))
  throw Error("Unsafe output directory");
const sha =
  process.env.BUILD_SHA ??
  process.env.GITHUB_SHA ??
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(sha)) throw Error("Full commit SHA required");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// Explicitly selected publication files. Never copy the repository root.
const documents = [
  "README.md",
  "catalog.json",
  "visual-illusion-atlas.html",
  "visual-illusion-guide.md",
  "visual-illusion-guide.docx",
  "visual-illusion-materials.zip",
  "source",
  "docs",
];
for (const file of documents)
  await cp(file, join(out, file), { recursive: true });
const release = `_releases/${sha}`;
await mkdir(join(out, release, "docs/question-bank"), { recursive: true });
await cp("game", join(out, release, "game"), { recursive: true });
await cp(
  "docs/question-bank/questions-v1.json",
  join(out, release, "docs/question-bank/questions-v1.json"),
);
for (const file of ["index.html", "dev/question-gallery.html"]) {
  const prefix = file.startsWith("dev/") ? "../" : "./";
  let html = await readFile(file, "utf8");
  html = html
    .replace('content="development"', `content="${sha}"`)
    .replace(`${prefix}game/styles.css`, `${prefix}${release}/game/styles.css`)
    .replace(`${prefix}game/main.js`, `${prefix}${release}/game/main.js`);
  await mkdir(resolve(out, file, ".."), { recursive: true });
  await writeFile(join(out, file), html);
}
await writeFile(join(out, ".nojekyll"), "");
const files = {};
async function walk(dir) {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const p = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error("Symlink cannot be published");
    if (entry.isDirectory()) await walk(p);
    else
      files[relative(out, p)] = createHash("sha256")
        .update(await readFile(p))
        .digest("hex");
  }
}
await walk(out);
const manifest = JSON.stringify({ schema: 1, sha, files }, null, 2) + "\n";
await writeFile(join(out, "release.json"), manifest);
await writeFile(join(out, release, "manifest.json"), manifest);
console.log(`Built ${Object.keys(files).length} files from ${sha} → ${out}`);
