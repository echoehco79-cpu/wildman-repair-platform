import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "standalone-showcase");
const outputDir = path.join(root, "dist");
const output = path.join(outputDir, "野人先生_AI设备维修协同方案看板_Standalone.html");

const [template, css, data, sandbox, app] = await Promise.all([
  fs.readFile(path.join(source, "index.html"), "utf8"),
  fs.readFile(path.join(source, "standalone.css"), "utf8"),
  fs.readFile(path.join(source, "standalone-data.js"), "utf8"),
  fs.readFile(path.join(source, "standalone-sandbox.js"), "utf8"),
  fs.readFile(path.join(source, "standalone.js"), "utf8"),
]);

const mimeByExt = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
let html = template
  .replace("/*__INLINE_CSS__*/", () => css)
  .replace("/*__INLINE_DATA__*/", () => data)
  .replace("/*__INLINE_SANDBOX__*/", () => sandbox)
  .replace("/*__INLINE_APP__*/", () => app);

const imageTokens = [...html.matchAll(/__IMG_([^_]+(?:-[^_]+)*\.(?:png|jpe?g|webp|svg))__/gi)];
for (const match of imageTokens) {
  const filename = match[1];
  const file = path.join(root, "public", "showcase", filename);
  const bytes = await fs.readFile(file);
  const mime = mimeByExt[path.extname(filename).toLowerCase()];
  html = html.split(match[0]).join(`data:${mime};base64,${bytes.toString("base64")}`);
}

html = html.replace(/<script>([\s\S]*?)<\/script>/g, (_, code) => `<script>${code.replace(/<\/script/gi, "<\\/script")}</script>`);
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(output, html);
const stat = await fs.stat(output);
console.log(`Standalone showcase built: ${output}`);
console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);
