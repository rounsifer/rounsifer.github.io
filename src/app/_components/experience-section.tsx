import { type TimelineDefinition, timeline, inView, animate } from "motion";

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
            "Designed and implemented a generic filter interface in C++ to allow other research engineers to retain, drop, or propagate control/data messages throughout the network",
          technology: ["C++", "Embedded"],
        },
        {
          title: "MOA",
          description:
            "designed and implemented updates to the AngularJS frontend and the Flask REST API to extend field unit capabilities for end users",
          technology: [
            "AngularJS",
            "Embedded Linux",
            "Flask",
            "Python",
            "JavaScript",
          ],
        },
        {
          title: "DARPA COHO",
          description:
            "designed and implemented both the container architecture for RF engine using Python and Docker and the experimental system user interface in Typescript",
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
            "designed and implemented an interface to allow communication from new sensor hardware to subscribed nodes on the network in Java",
          technology: ["Java", "Networking"],
        },
        {
          title: "DARPA Ground Truth",
          description:
            "implemented scenarios to other researcher’s specifications in Java and generated reports to summarize simulation behavior during these runs using a custom-built testing library in Python",
          technology: ["Java", "Python", "OOP"],
        },
        {
          title: "STOIC",
          description:
            "designed and implemented UI in Python using matplotlib to display both the live data of nodes and post-processed data to researchers",
          technology: ["Python", "Matplotlib", "Data Viz"],
        },
      ],
    },
  ];

  return (
    <main className="experience no-scrollbar pr-24 flex w-full flex-row gap-4 text-zinc-300 mix-blend-exclusion py-24">
      <div className="flex h-full flex-col gap-6">
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
    <main className="job-card flex flex-row rounded-lg py-2 pr-1 hover:bg-[#4e9fe9]/5 hover:text-white">
      <p className="h-fit w-1/4 pt-1 text-center text-xs font-semibold tracking-wide ">
        {date}
      </p>
      <div className="flex w-3/4 flex-col gap-3">
        <div className="flex flex-row items-center gap-2">
          <p className="font-semibold text-base">{title} </p>
          {"·"}
          <p className="text-base text-white/90">{company}</p>
        </div>
        <p className="text-sm tracking-wide">{detail}</p>
        <ul className="flex w-full flex-col gap-1.5">
          {projects.map((project) => {
            return (
              <li key={project.title} className="flex w-full">
                <div className="flex w-full flex-col gap-2  rounded p-2 text-sm">
                  <p className="flex text-xs font-semibold text-white/85">
                    {project.title}
                  </p>
                  <p className="flex text-white/85">
                    {project.description}
                  </p>
                  <ul className="flex w-full flex-wrap gap-2 text-end text-xs">
                    {project.technology.map((tech, index) => {
                      return (
                        <li
                          key={index}
                          className="rounded-full bg-[#6071e2]/10  px-3 py-1  text-white/75"
                          
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
