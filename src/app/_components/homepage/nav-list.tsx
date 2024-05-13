"use client"

import { TimelineDefinition, timeline } from "motion";

export const NavList = () => {

    if (typeof document !== 'undefined') {
        // will run in client's browser only
        
        const fade_in_sequence: TimelineDefinition = [
            [".my-name", {opacity: [0,1]}, {duration: 1, at: 0.5}],
            [".my-tagline", {opacity: [0,1]}, {duration: 1, at: 1.25}],
            [".social-links", {opacity: [0,1]}, {duration: 1, at: 1.75}]
        ];
        timeline(fade_in_sequence);
    }

    return (
        <div className="w-fit  items-center flex justify-center">
            <ul className="flex text-center items-center sm:text-start sm:items-start flex-col gap-2 text-base w-fit rounded-2xl h-full text-white ">
                <li className="my-name text-5xl font-semibold tracking-tight sm:text-[3rem]">
                Ron<span className="text-[#4e9fe9]"> Rounsifer</span>
                </li>

                <li className="my-tagline text-white/85 font-light tracking-wide w-2/3 sm:w-full sm:text-start text-center italic">
                    just another <span className="font-semibold text-white">software engineer</span> that likes to build things
                </li>
                <ul className="social-links w-full flex flex-row gap-1 justify-center sm:justify-start">
                    <li className="text-white/50">
                        <a href="https://github.com/rounsifer" target="_blank" rel="noopener noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-brand-github mix-blend-exclusion" width="28" height="28" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                            </svg>
                        </a>
                    </li>
                    <li className="text-white/50">
                        <a href="https://www.linkedin.com/in/ronaldrounsifer/" target="_blank" rel="noopener noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-brand-linkedin mix-blend-exclusion" width="28" height="28" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
                        <button onClick={() => window.location.href = 'mailto:ronrounsifer@gmail.com'}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-mail" width="28" height="28" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
                                <path d="M3 7l9 6l9 -6" />
                            </svg>

                        </button>

                    </li>
                </ul>
            </ul>
        </div>
    );
}