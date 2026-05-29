# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site for Ron Rounsifer, deployed to GitHub Pages at rounsifer.github.io. Built with Next.js (App Router) as a **static export** with a Three.js / WebGL particle animation as the centerpiece. Bootstrapped from the T3 stack (create-t3-app).

## Commands

```bash
npm run dev      # Local dev server at http://localhost:3000
npm run build    # Static export → ./out (this is what GitHub Pages deploys)
npm run lint     # next lint (ESLint, type-checked rules)
npm run start    # Serve a production build
```

There is no test suite or test runner configured.

`SKIP_ENV_VALIDATION=1` can prefix `build`/`dev` to bypass env-var validation (see `src/env.js`).

## Architecture

**Static export, not SSR.** `next.config.js` sets `output: "export"` and `images.unoptimized`. There is no server runtime — everything ships as static HTML/JS to GitHub Pages. Avoid Next.js features that require a server (API routes, ISR, dynamic server rendering, `next/image` optimization).

**Deployment** is fully automated via `.github/workflows/deploy.yml`: every push to `main` runs `next build` and publishes `./out` to GitHub Pages. No manual deploy step.

**GLSL shaders as modules.** Custom vertex/fragment shaders live in `src/app/_components/homepage/particle-display/shaders/*.glsl`. The webpack rule in `next.config.js` (`type: "asset/source"`) imports them as raw strings; `glsl.d.ts` provides the TypeScript declaration. The particle field is a `<points>` with a `shaderMaterial` driven by a `uTime` uniform updated every frame via `useFrame`.

**Component layout** (`src/app/`):
- `page.tsx` → `MainScreen` wrapped in `CustomCursor`. Two-column layout: `NavList` (name/tagline/links + particle display) on the left, `Experience` on the right.
- `experience-section.tsx` holds the **job history as a hardcoded `jobHistory` array** — edit this array to update work experience and projects.
- `particle-display.tsx` contains the active `CustomGeometryParticles` plus unused experiments (`TwistedBox`, `BasicParticles`) kept for reference.

**Animation pattern.** Several components run a `motion` (`timeline(...)`) fade-in sequence guarded by `typeof document !== "undefined"` so it only executes in the browser, not during static generation. Follow this guard pattern for any code touching `document`/`window`.

## Conventions

- **Import alias:** `~/*` maps to `./src/*` (tsconfig path).
- **Strict TypeScript** with `noUncheckedIndexedAccess` and `checkJs` enabled.
- Components needing browser APIs / hooks are marked `"use client"`.
- Prettier with `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes); styling is Tailwind utility classes throughout.
- Env vars are validated through `@t3-oss/env-nextjs` + Zod in `src/env.js` — add new vars to that schema, not just `.env`.
