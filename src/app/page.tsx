"use client";
import { CustomCursor } from "./_components/custom-cursor";
import MainScreen from "./_components/main-screen";
import { ParticleThemeProvider } from "./_components/particle-theme";
import { ParticleBackground } from "./_components/homepage/particle-display/particle-display";

export default function Home() {
  return (
    <CustomCursor>
      <ParticleThemeProvider>
        <ParticleBackground />
        <main className="min-w-screen flex min-h-screen flex-row justify-center text-white mix-blend-exclusion">
          <MainScreen />
        </main>
      </ParticleThemeProvider>
    </CustomCursor>
  );
}
