import { type TimelineDefinition, timeline } from "motion";

export default function Experience() {
  if (typeof document !== "undefined") {
    // will run in client's browser only
    const fade_in_sequence: TimelineDefinition = [
      [".experience", { opacity: [0, 1] }, { duration: 1, at: 0 }],
    ];
    timeline(fade_in_sequence);
  }

  const jobHistory = [
    {
      id: "0",
      title: "Research Engineer, II",
      company: "Raytheon",
      url: "https://www.rtx.com/who-we-are/we-are-rtx/transformative-technologies/bbn",
      date: "2022 - 2024",
      details:
        "Developed cross-platform and embedded software for advanced research and development projects.",
      projects: [
        {
          title: "AORTA/RIPL",
          description:
            "Designed and implemented a generic filter interface in C++ to allow other researchers to retain, drop, or propagate control/data messages throughout the network while using CTest for unit testing and Kubernetes to build a cluster to run across distributed computing environments.",
          technology: ["C++", "Kubernetes", "CTest", "Embedded"],
        },
        {
          title: "MOA",
          description:
          "Designed and implemented updates to the AngularJS frontend using HTML, CSS, JavaScript and the Python Flask REST API to extend field unit capabilities for end users.",
          technology: [
            "AngularJS",
            "Embedded Linux",
            "Python",
            "Flask",
            "Javascript",
            "HTML",
            "CSS"
          ],
        },
        {
          title: "DARPA COHO",
          description:
          "Designed and implemented both the container architecture for an RF engine and cyclostationary signal processor using Python, Docker, Redis, ZMQ and the experimental system user interface in Typescript leveraging React and Tailwind.",
          technology: [
            "Python",
            "Typescript",
            "Docker",
            "ZMQ",
            "Redis",
            "React",
            "TailwindCSS",
          ],
        },
      ],
    },
    {
      id: "1",
      title: "Associate Scientist",
      company: "Raytheon",
      url: "https://www.rtx.com/who-we-are/we-are-rtx/transformative-technologies/bbn",
      date: "2019 - 2022",
      details:
        "Developed cross-platform and embedded software for advanced research and development projects.",
      projects: [
        {
          title: "STOIC",
          description:
            "Designed and implemented the data visualization libraries used to observe the behavior of our state-of-the-art positioning, navigation, and timing (PNT) algorithms using Python and Matplotlib for real-time experiments as well as post-processing data analysis.",
          technology: ["Python", "Matplotlib", "Data Visualization"],
        },
        {
          title: "DARPA ASTARTE",
          description:
          "Designed and implemented an interface to allow communication from new sensor hardware to subscribed nodes on the network in Java using Maven, Eclipse, and JUnit for unit tests.",
          technology: ["Java", "Networking", "Maven", "Eclipse", "JUnit"],
        },
        {
          title: "DARPA Ground Truth",
          description:
            "Implemented scenarios to other researcher’s specifications in Java using Eclipse, Maven, and JUnit while also writing custom scripts in Python to generate reports to summarize simulation behavior after a completed run.",
          technology: ["Java", "Python", "OOP", "Maven", "Eclipse", "JUnit"],
        },
      ],
    },
  ];

  return (
    <main className="experience no-scrollbar flex h-full w-3/4 flex-col gap-4 text-zinc-300 mix-blend-exclusion lg:w-full lg:overflow-y-scroll lg:pr-24 lg:pt-24">
      <h1 className="flex w-1/4 text-xs font-bold uppercase tracking-widest text-zinc-500 lg:hidden">
        experience
      </h1>
      <div className="flex w-full flex-col gap-6">
        {jobHistory.map((job) => {
          return (
            <JobCard
              key={job.id}
              title={job.title}
              company={job.company}
              url={job.url}
              date={job.date}
              detail={job.details}
              projects={job.projects}
            />
          );
        })}
      </div>
    </main>
  );
}

type ProjectType = {
  title: string;
  description: string;
  technology: string[];
};

type JobCardProps = {
  title: string;
  company: string;
  url: string;
  date: string;
  detail: string;
  projects: ProjectType[];
};

const JobCard = ({
  title,
  company,
  url,
  date,
  detail,
  projects,
}: JobCardProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className=" job-card flex flex-row gap-2 rounded-lg py-2 pr-1 text-zinc-300 hover:bg-[#4e9fe9]/5 hover:text-blue-300"
    >
      <p className="h-fit w-1/4 pt-1 text-xs font-semibold tracking-wide lg:text-center ">
        {date}
      </p>
      <div className="flex w-3/4 flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:gap-2">
          <p className="text-base font-semibold ">{title} </p>
          <span className="hidden md:flex">{"·"}</span>
          <p className="text-base">{company}</p>
        </div>
        <p className="text-sm leading-normal text-zinc-300">{detail}</p>
        <ul className="flex w-full flex-col gap-1.5">
          {projects.map((project) => {
            return (
              <li key={project.title} className="flex w-full">
                <div className="flex w-full flex-col gap-2  rounded p-2 text-sm">
                  <p className="flex text-xs font-semibold">{project.title}</p>
                  <p className="flex text-zinc-300">{project.description}</p>
                  <ul className="flex w-full flex-wrap gap-2 text-end text-xs text-zinc-300">
                    {project.technology.map((tech, index) => {
                      return (
                        <li
                          key={index}
                          className="rounded-full bg-[#6071e2]/10  px-3 py-1  "
                        >
                          {tech}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </a>
  );
};
