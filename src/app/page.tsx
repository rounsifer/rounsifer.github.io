"use client";
import { CustomCursor } from "./_components/custom-cursor";
import MainScreen from "./_components/main-screen";

export default function Home() {
  return (
    <CustomCursor>
      <main className="min-w-screen flex min-h-screen flex-row justify-center bg-zinc-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-white mix-blend-exclusion">
        <MainScreen />
      </main>
    </CustomCursor>
  );
}
