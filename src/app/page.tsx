'use client'
import { CustomCursor } from "./_components/custom-cursor";
import NavList from "./_components/homepage/nav-list";
import { ParticleDisplay } from "./_components/homepage/particle-display/particle-display";
import MainScreen from "./_components/main-screen";

export default function Home() {
  return (
    <CustomCursor>
      <main className="flex flex-row min-h-screen min-w-screen justify-center text-white mix-blend-exclusion bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
        <MainScreen />
      </main>
    </CustomCursor>
  );
}


