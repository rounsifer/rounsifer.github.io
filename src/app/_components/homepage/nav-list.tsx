"use client";

import { type TimelineDefinition, timeline } from "motion";

import { ParticleDisplay } from "./particle-display/particle-display";
import Link from "next/link";

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
    <div className="navlist flex hidden h-full max-h-screen flex-col justify-between ">
      <div className="mb-12 flex lg:mb-24 lg:hidden">
        <ParticleDisplay />
      </div>

      <div className="flex  w-fit flex-col gap-2 rounded-2xl  text-white">
        <a
          href="/"
          className="my-name text-4xl font-bold tracking-tight text-zinc-300 sm:text-5xl"
        >
          Ron Rounsifer
        </a>
        <h2 className="text-lg font-medium">Senior Software Engineer</h2>
        <p className="mt-2 max-w-xs  leading-normal text-zinc-400 lg:mt-4">
          I design and build highly performant, mission-critical systems for all
          domains.
        </p>

        

      </div>

      <div className=" mt-10 pt-5 pb-5 rounded-t-lg p-10 hidden lg:flex bg-slate-800/10 border-zinc-800 border">
        <ParticleDisplay />
      </div>
      
      <div className="flex flex-row justify-between px-4 border p-2.5 rounded-b-lg bg-slate-800/20 border-zinc-800 text-sm font-light text-white/50 w-full">

<a href={"https://ieeexplore.ieee.org/author/37087008577"} target="_blank" rel="noreferrer" className="hover:text-white hover:scale-105">
  publications
</a>
-
<Link href={""} className="hover:text-white hover:scale-105">
  algorithms
</Link>
-
<Link href={""} className="hover:text-white hover:scale-105">
  system design
</Link>


</div>
      <ul className="social-links mt-4 flex w-full flex-row justify-evenly lg:mt-8">
        <li className="text-zinc-500">
          <a
            href="https://github.com/rounsifer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="icon icon-tabler icons-tabler-filled icon-tabler-brand-github"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z" />
            </svg>
          </a>
        </li>
        <li className="text-zinc-500">
          <a
            href="https://www.linkedin.com/in/ronaldrounsifer/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
              <path d="M8 11l0 5" />
              <path d="M8 8l0 .01" />
              <path d="M12 16l0 -5" />
              <path d="M16 16v-3a2 2 0 0 0 -4 0" />
            </svg>
          </a>
        </li>

        <li className="text-zinc-500">
          <button
            onClick={() =>
              (window.location.href = "mailto:ronrounsifer@gmail.com")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="icon icon-tabler icons-tabler-filled icon-tabler-mail"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" />
              <path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  );
}
