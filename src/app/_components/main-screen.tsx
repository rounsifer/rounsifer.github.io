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
    <main className="flex h-full w-3/4 w-full flex-row items-center justify-center">
      <div className="left-col flex h-full w-full flex-col items-center gap-4">
        <ParticleDisplay />
        <NavList />
        <div className="w-full text-center">
          <ul className="nav-btns flex flex-col gap-8 text-xs font-semibold tracking-wider text-white/75">
            <li>
              <button className="text-[#4e9fe9]/85 hover:text-[#4e9fe9]">
                EXPERIENCE
              </button>
            </li>
            <li>
              <button className="hover:text-[#4e9fe9]">EDUCATION</button>
            </li>
            <li>
              <button className="hover:text-[#4e9fe9]">PUBLICATIONS</button>
            </li>
          </ul>
        </div>

        <ul className="social-links flex w-full flex-row justify-center gap-8">
          <li className="text-white/50">
            <a
              href="https://github.com/rounsifer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-brand-github mix-blend-exclusion"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
              </svg>
            </a>
          </li>
          <li className="text-white/50">
            <a
              href="https://www.linkedin.com/in/ronaldrounsifer/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-brand-linkedin mix-blend-exclusion"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
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

          <li className="text-white/50">
            <button
              onClick={() =>
                (window.location.href = "mailto:ronrounsifer@gmail.com")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-mail"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
                <path d="M3 7l9 6l9 -6" />
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <div className="right-col flex h-screen overflow-y-scroll">
        <Experience />
      </div>
    </main>
  );
}