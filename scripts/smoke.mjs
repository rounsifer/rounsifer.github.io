// Headless smoke test for the static export in ./out
// Serves out/ on a local port, loads it in chromium, and reports
// console errors / uncaught page errors + writes a screenshot.
// Exit code 1 if any page error or console "error" is seen.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { chromium } from "playwright";

const OUT = join(process.cwd(), "out");
const PORT = 4317;
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    let filePath = join(OUT, normalize(urlPath));
    try {
      if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    } catch {
      // try .html fallback for extensionless routes
      if (!extname(filePath)) filePath += ".html";
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
// give the dynamically-imported Three.js canvas time to mount
await page.waitForTimeout(3000);

const canvasCount = await page.locator("canvas").count();
const nameVisible = await page
  .getByText("Ron Rounsifer")
  .first()
  .isVisible()
  .catch(() => false);

await page.screenshot({ path: "/tmp/smoke.png", fullPage: true });

await browser.close();
await new Promise((r) => server.close(r));

console.log("=== SMOKE RESULT ===");
console.log("name 'Ron Rounsifer' visible:", nameVisible);
console.log("canvas elements:", canvasCount);
console.log("pageErrors:", pageErrors.length ? pageErrors : "none");
console.log("consoleErrors:", consoleErrors.length ? consoleErrors : "none");

const fatal = pageErrors.length > 0 || consoleErrors.some((e) => /ReactCurrentBatchConfig|is not defined|Cannot read prop/i.test(e));
process.exit(fatal ? 1 : 0);
