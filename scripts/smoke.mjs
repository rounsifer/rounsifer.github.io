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

// Console errors that are expected noise on a GPU-less SwiftShader runner or
// from static-export quirks — everything else is treated as fatal.
const BENIGN =
  /favicon|swiftshader|software webgl|performance caveat|automatic fallback|GroupMarkerNotSet|Failed to load resource.*404|WebGL context could not be created|could not create a webgl context|BindToCurrentSequence/i;

// A GPU-less runner can fail to *create* a WebGL context — that's environmental,
// not a code regression, so it must not hard-fail the gate (the page still
// renders; `name visible` + `cursorGlow` remain the real signals). Covers both
// console errors and the pageerror three.js throws.
const WEBGL_ENV_FAILURE =
  /Error creating WebGL|WebGL context could not be created|could not create a webgl context|BindToCurrentSequence/i;

async function check(label, { reducedMotion, viewport, shot }) {
  const page = await browser.newPage(viewport ? { viewport } : undefined);
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

  // The <canvas> mounts even when WebGL fails, so assert a live, non-lost
  // WebGL context rather than just the element's presence.
  const glHealthy = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return false;
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return !!gl && !gl.isContextLost();
  });

  // Show the custom cursor and confirm its glow filter actually renders
  // (a broken drop-shadow token collapses to filter: none).
  await page.mouse.move(120, 120);
  await page.mouse.move(220, 240);
  const cursorFilter = await page.evaluate(() => {
    const el = document.querySelector(".custom-cursor");
    return el ? getComputedStyle(el).filter : "missing";
  });
  const cursorGlowOk = cursorFilter !== "none" && cursorFilter !== "missing";

  if (shot) await page.screenshot({ path: shot, fullPage: true });
  await page.close();

  const webglEnvFailure =
    consoleErrors.some((e) => WEBGL_ENV_FAILURE.test(e)) ||
    pageErrors.some((e) => WEBGL_ENV_FAILURE.test(e));
  const badConsole = consoleErrors.filter(
    (e) => !BENIGN.test(e) && !WEBGL_ENV_FAILURE.test(e),
  );
  const badPageErrors = pageErrors.filter((e) => !WEBGL_ENV_FAILURE.test(e));
  const fatal =
    badPageErrors.length > 0 ||
    badConsole.length > 0 ||
    !nameVisible ||
    !cursorGlowOk ||
    (!glHealthy && !webglEnvFailure); // dead context is only fatal if WebGL *could* init

  console.log(`--- ${label} ---`);
  console.log(
    "name visible:", nameVisible,
    "| canvas:", canvasCount,
    "| glHealthy:", glHealthy,
    "| cursorGlow:", cursorGlowOk,
    webglEnvFailure ? "| (WebGL unavailable — environmental, ignored)" : "",
  );
  console.log("pageErrors (real):", badPageErrors.length ? badPageErrors : "none");
  console.log("console errors (non-benign):", badConsole.length ? badConsole : "none");
  return !fatal;
}

const desktop = { width: 1280, height: 800 };
const mobile = { width: 390, height: 844 };

const results = [
  await check("default motion (desktop)", {
    reducedMotion: false,
    viewport: desktop,
    shot: "/tmp/smoke-desktop.png",
  }),
  await check("reduced motion (desktop)", {
    reducedMotion: true,
    viewport: desktop,
  }),
  await check("default motion (mobile)", {
    reducedMotion: false,
    viewport: mobile,
    shot: "/tmp/smoke-mobile.png",
  }),
];

await browser.close();
await new Promise((r) => server.close(r));

const pass = results.every(Boolean);
console.log("=== SMOKE RESULT:", pass ? "PASS" : "FAIL", "===");
process.exit(pass ? 0 : 1);
