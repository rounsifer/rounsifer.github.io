import NavList from "./homepage/nav-list";
import Experience from "./experience-section";
import { type TimelineDefinition, timeline } from "motion";

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
    <main className="flex h-full max-w-screen-xl flex-col  items-center justify-between lg:flex-row lg:items-start">
      <header className="left-col flex w-full flex-col items-center gap-4 py-12 lg:sticky lg:max-h-screen lg:w-1/2 lg:py-24">
        <NavList />
      </header>

      <div className="right-col flex h-full w-full justify-center lg:h-screen lg:w-1/2 lg:justify-normal">
        <Experience />
      </div>
    </main>
  );
}
