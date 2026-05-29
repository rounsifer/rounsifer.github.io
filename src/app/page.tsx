"use client";
import { CustomCursor } from "./_components/custom-cursor";
import MainScreen from "./_components/main-screen";
import { ParticleThemeProvider } from "./_components/particle-theme";
import { ParticleBackground } from "./_components/homepage/particle-display/particle-display";
import { WebGLDebug } from "./_components/webgl-debug";

export default function Home() {
  return (
    <CustomCursor>
      <ParticleThemeProvider>
        <ParticleBackground />
        <main className="min-w-screen flex min-h-screen flex-row justify-center text-white">
          <MainScreen />
        </main>
      </ParticleThemeProvider>
      <WebGLDebug />
    </CustomCursor>
  );
}
