// Headless smoke test for the static export in ./out
// Serves out/ on a local port, loads it in chromium under both default and
// reduced-motion preferences, and fails on any console/page error or if the
// page renders no visible content. Writes a screenshot of the default run.
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

// --enable-unsafe-swiftshader lets WebGL run via software rendering on
// GPU-less CI runners (GitHub Actions), so the Three.js canvas still mounts.
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});

const FATAL = /ReactCurrentBatchConfig|is not defined|Cannot read prop/i;

async function check(label, { reducedMotion }) {
  const page = await browser.newPage();
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(reducedMotion ? 1500 : 3000);

  const canvasCount = await page.locator("canvas").count();
  const nameVisible = await page
    .getByText("Ron Rounsifer")
    .first()
    .isVisible()
    .catch(() => false);

  if (!reducedMotion) await page.screenshot({ path: "/tmp/smoke.png", fullPage: true });
  await page.close();

  const fatal =
    pageErrors.length > 0 ||
    consoleErrors.some((e) => FATAL.test(e)) ||
    !nameVisible;

  console.log(`--- ${label} ---`);
  console.log("name 'Ron Rounsifer' visible:", nameVisible, "| canvas:", canvasCount);
  console.log("pageErrors:", pageErrors.length ? pageErrors : "none");
  console.log("consoleErrors:", consoleErrors.length ? consoleErrors : "none");
  return !fatal;
}

const okDefault = await check("default motion", { reducedMotion: false });
const okReduced = await check("reduced motion", { reducedMotion: true });

await browser.close();
await new Promise((r) => server.close(r));

console.log("=== SMOKE RESULT:", okDefault && okReduced ? "PASS" : "FAIL", "===");
process.exit(okDefault && okReduced ? 0 : 1);
