"use client";
import { useEffect } from "react";
import { animate, type AnimationSequence } from "motion";

import NavList from "./homepage/nav-list";
import Experience from "./experience-section";
import { usePrefersReducedMotion } from "~/hooks/use-prefers-reduced-motion";

export default function MainScreen() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const fade_in_sequence: AnimationSequence = [
      [".left-col", { opacity: [0, 1] }, { duration: 0.5, at: 0 }],
      [".right-col", { opacity: [0, 1] }, { duration: 0.5, at: 0 }],
    ];
    void animate(fade_in_sequence);
  }, [prefersReducedMotion]);

  return (
    <div className="flex h-full max-w-screen-xl flex-col  items-center justify-between lg:flex-row lg:items-start">
      <header className="left-col flex w-full flex-col items-center gap-4 py-12 lg:sticky lg:max-h-screen lg:w-1/2 lg:py-24">
        <NavList />
      </header>

      <div className="right-col flex h-full w-full justify-center lg:h-screen lg:w-1/2 lg:justify-normal">
        <Experience />
      </div>
    </div>
  );
}
