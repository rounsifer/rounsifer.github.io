"use client";
import { CustomCursor } from "./_components/custom-cursor";
import MainScreen from "./_components/main-screen";
import { ParticleThemeProvider } from "./_components/particle-theme";
import { ParticleBackground } from "./_components/homepage/particle-display/particle-display";
import { WebGLDebug } from "./_components/webgl-debug";

export default function Home() {
  return (
    <CustomCursor>
      <a
        href="#experience"
        className="sr-only z-50 rounded bg-zinc-800 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Skip to experience
      </a>
      <ParticleThemeProvider>
        <ParticleBackground />
        <main className="flex min-h-screen min-w-screen flex-row justify-center text-white">
          <MainScreen />
        </main>
      </ParticleThemeProvider>
      <WebGLDebug />
    </CustomCursor>
  );
}
