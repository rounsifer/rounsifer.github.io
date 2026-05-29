# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site for Ron Rounsifer, deployed to GitHub Pages at rounsifer.github.io. Built with Next.js (App Router, Next 16 / Turbopack) as a **static export**, with a Three.js / WebGL particle animation as the centerpiece. Stack: React 19, @react-three/fiber v9 + drei v10, Tailwind CSS v4, Zod v4. Originally bootstrapped from the T3 stack (create-t3-app).

## Commands

```bash
npm run dev      # Local dev server at http://localhost:3000
npm run build    # Static export → ./out (this is what GitHub Pages deploys)
npm run lint     # eslint . (flat config, type-aware rules)
npm run start    # Serve a production build
npm run smoke    # Headless-browser runtime check of ./out (build first)
```

`npm run smoke` (see `scripts/smoke.mjs`) serves `./out`, loads it in headless Chromium, and fails on any console/page error — it catches runtime crashes that a green `next build` does **not** (e.g. a bad client bundle that white-screens). Run it after dependency or rendering changes. Requires `npx playwright install chromium` once.

There is no unit-test suite; the smoke test + build + lint are the safety net.

`SKIP_ENV_VALIDATION=1` can prefix `build`/`dev` to bypass env-var validation (see `src/env.js`).

## Architecture

**Static export, not SSR.** `next.config.js` sets `output: "export"` and `images.unoptimized`. There is no server runtime — everything ships as static HTML/JS to GitHub Pages. Avoid Next.js features that require a server (API routes, ISR, dynamic server rendering, `next/image` optimization).

**Deployment** is fully automated via `.github/workflows/deploy.yml`: every push to `main` runs `next build` and publishes `./out` to GitHub Pages. No manual deploy step.

**The Three.js `<Canvas>` is loaded client-only.** `ParticleDisplay` is imported via `next/dynamic(..., { ssr: false })` in `nav-list.tsx` because react-three-fiber's reconciler cannot be server-prerendered during static export. Keep WebGL/Canvas code out of the server-render path.

**GLSL shaders as modules.** Custom vertex/fragment shaders live in `src/app/_components/homepage/particle-display/shaders/*.glsl` and are imported as raw strings. Because Next 16 defaults to Turbopack, the loader is configured under `turbopack.rules` (`raw-loader`, `as: "*.js"`) in `next.config.js`, with the legacy `webpack` `asset/source` rule kept as a `--webpack` fallback. `glsl.d.ts` provides the TS declaration. The particle field is a `<points>` with a `shaderMaterial` driven by a `uTime` uniform updated every frame via `useFrame`.

**Component layout** (`src/app/`):
- `page.tsx` → `MainScreen` wrapped in `CustomCursor`. Two-column layout: `NavList` (name/tagline/links + particle display) on the left, `Experience` on the right.
- `experience-section.tsx` holds the **job history as a hardcoded `jobHistory` array** — edit this array to update work experience and projects.
- `particle-display.tsx` renders `CustomGeometryParticles`. Particle positions are generated once in a lazy `useState` initializer (keeps the `Math.random()` out of render per React 19's purity rule).

**Animation pattern.** Several components run a `motion` `animate(sequence)` (typed `AnimationSequence`) fade-in guarded by `typeof document !== "undefined"` so it only executes in the browser, not during static generation. Follow this guard pattern for any code touching `document`/`window`.

## Conventions

- **Import alias:** `~/*` maps to `./src/*` (tsconfig path).
- **Strict TypeScript** with `noUncheckedIndexedAccess` and `checkJs` enabled. `out` is excluded from tsconfig (don't let tsc type-check build artifacts).
- Components needing browser APIs / hooks are marked `"use client"`.
- **Styling is Tailwind v4, CSS-first.** There is no `tailwind.config.ts`; theme customization lives in `@theme` blocks in `src/styles/globals.css` (e.g. `--font-sans` mapped from next/font's `--font-inter`, the `--drop-shadow-glow` token). PostCSS uses `@tailwindcss/postcss`. Prettier with `prettier-plugin-tailwindcss` auto-sorts classes.
- **ESLint flat config** in `eslint.config.mjs` extends `eslint-config-next` (`core-web-vitals` + `typescript`); type-aware rules use `projectService`. Pinned to ESLint 9 (Next's bundled `eslint-plugin-react` is incompatible with ESLint 10).
- Env vars are validated through `@t3-oss/env-nextjs` + Zod in `src/env.js` — add new vars to that schema, not just `.env`.
