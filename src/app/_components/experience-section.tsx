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
      date: "2022 - PRESENT",
      details:
        "Developed cross-platform and embedded software for advanced research and development projects.",
      projects: [
        {
          title: "AORTA",
          description:
            "Designed and implemented a generic filter interface in C++ to allow other research engineers to retain, drop, or propagate control/data messages throughout the network.",
          technology: ["C++", "Embedded"],
        },
        {
          title: "MOA",
          description:
            "Designed and implemented updates to the AngularJS frontend and the Flask REST API to extend field unit capabilities for end users.",
          technology: [
            "AngularJS",
            "Embedded Linux",
            "Flask",
            "Python",
            "Javascript",
          ],
        },
        {
          title: "DARPA COHO",
          description:
            "Designed and implemented both the container architecture for RF engine using Python and Docker and the experimental system user interface in Typescript.",
          technology: [
            "Python",
            "Typescript",
            "Docker",
            "ZMQ",
            "Redis",
            "TailwindCSS",
          ],
        },
      ],
    },
    {
      id: "1",
      title: "Associate Scientist",
      company: "Raytheon",
      date: "2019 - 2022",
      details:
        "Developed cross-platform and embedded software for advanced research and development projects.",
      projects: [
        {
          title: "DARPA ASTARTE",
          description:
            "Designed and implemented an interface to allow communication from new sensor hardware to subscribed nodes on the network in Java.",
          technology: ["Java", "Networking"],
        },
        {
          title: "DARPA Ground Truth",
          description:
            "Implemented scenarios to other researcher’s specifications in Java and generated reports to summarize simulation behavior during these runs using a custom-built testing library in Python.",
          technology: ["Java", "Python", "OOP"],
        },
        {
          title: "STOIC",
          description:
            "Designed and implemented UI in Python using matplotlib to display both the live data of nodes and post-processed data to researchers.",
          technology: ["Python", "Matplotlib", "Data Visualization"],
        },
      ],
    },
  ];

  return (
    <main className="experience no-scrollbar flex  h-full w-3/4 flex-row gap-4 text-zinc-300 mix-blend-exclusion lg:w-full lg:overflow-y-scroll lg:pr-24 lg:pt-24">
      <div className="flex w-full flex-col gap-6">
        {jobHistory.map((job) => {
          return (
            <JobCard
              key={job.id}
              title={job.title}
              company={job.company}
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
  date: string;
  detail: string;
  projects: ProjectType[];
};

const JobCard = ({ title, company, date, detail, projects }: JobCardProps) => {
  return (
    <main className=" job-card flex flex-row gap-2 rounded-lg py-2 pr-1 text-zinc-300 hover:bg-[#4e9fe9]/5 hover:text-blue-300">
      <p className="h-fit w-1/4 pt-1 text-center text-xs font-semibold tracking-wide ">
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
    </main>
  );
};
