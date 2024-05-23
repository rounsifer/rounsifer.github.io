"use client";

import { TimelineDefinition, timeline } from "motion";

export default function NavList() {
  if (typeof document !== "undefined") {
    // will run in client's browser only

    const fade_in_sequence: TimelineDefinition = [
      [".navlist", { display: "flex" }],
    ];
    timeline(fade_in_sequence);

    const fade_in_sequence_2: TimelineDefinition = [
      [".my-name", { opacity: [0, 1] }, { duration: 1, at: 0 }],
      [".my-tagline", { opacity: [0, 1] }, { duration: 1, at: 0 }],
      [".social-links", { opacity: [0, 1] }, { duration: 1, at: 0 }],
    ];
    timeline(fade_in_sequence_2);
  }

  return (
    <div className="navlist flex hidden  w-fit items-center justify-center">
      <ul className="flex h-full w-fit flex-col items-center gap-2 rounded-2xl text-center text-white">
        <li className="my-name text-5xl text-[#4e9fe9] font-semibold tracking-tight sm:text-[3rem]">
          Ron Rounsifer
        </li>

        <li className="my-tagline w-2/3 text-center font-light  tracking-wide text-white/85 sm:w-full sm:text-start">
          just another{" "}
          <span className="font-semibold text-[#4e9fe9] ">software engineer</span>{" "}
          that likes to build
        </li>
      </ul>
    </div>
  );
}

