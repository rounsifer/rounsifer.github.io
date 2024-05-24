import NavList from "./homepage/nav-list";
import { ParticleDisplay } from "./homepage/particle-display/particle-display";
import Experience from "./experience-section";
import { TimelineDefinition, timeline } from "motion";

export default function MainScreen() {
  if (typeof document !== "undefined") {
    // will run in client's browser only
    const fade_in_sequence: TimelineDefinition = [
      [".left-col", { opacity: [0, 1] }, { duration: 0.5, at: 0 }],
      [".right-col", { opacity: [0, 1] }, { duration: 0.5, at: 0 }],
      [".nav-btns", { opacity: [0, 1] }, { duration: 1, at: 0 }],
    ];
    timeline(fade_in_sequence);
  }

  return (
    <main className="flex h-full max-w-screen-xl flex-row justify-between">
      <header className="left-col flex lg:sticky lg:w-1/2 lg:max-h-screen py-24 w-full flex-col items-center gap-4">
        <NavList />
      </header>

      <div className="right-col flex h-screen lg:w-1/2 overflow-y-scroll no-scrollbar">
        <Experience />
      </div>
    </main>
  );
}
