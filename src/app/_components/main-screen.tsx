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
    <main className="flex h-full max-w-screen-xl flex-row justify-between">
      <header className="left-col flex w-full flex-col items-center gap-4 py-24 lg:sticky lg:max-h-screen lg:w-1/2">
        <NavList />
      </header>

      <div className="right-col no-scrollbar flex h-screen overflow-y-scroll lg:w-1/2">
        <Experience />
      </div>
    </main>
  );
}
