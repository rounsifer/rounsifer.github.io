import { type Metadata } from "next";
import Link from "next/link";

import { RESUME_PDF_URL } from "~/lib/resume-constants";
import { getResumeDocument } from "~/lib/resume";

export const metadata: Metadata = {
  title: "Résumé | Ron Rounsifer",
  description:
    "Résumé for Ron Rounsifer, a senior embedded and systems software engineer.",
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Résumé | Ron Rounsifer",
    description:
      "Senior embedded and systems software engineer specializing in safety- and mission-critical systems.",
    url: "https://rounsifer.github.io/resume",
    type: "profile",
  },
};

export default async function ResumePage() {
  const resume = await getResumeDocument();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 text-zinc-200 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8">
      <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 transition-colors hover:text-blue-300"
          >
            <span aria-hidden="true">←</span> Portfolio
          </Link>
          <div className="border-l border-white/15 pl-4">
            <h1 className="text-xl font-semibold text-zinc-100">
              {resume.title}
            </h1>
            <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
              Résumé
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={RESUME_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-blue-300/50 hover:text-blue-300"
          >
            Open PDF
          </a>
          <a
            href={RESUME_PDF_URL}
            download="Ron_Rounsifer_Resume.pdf"
            className="rounded-lg bg-blue-400/15 px-3 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-400/25 hover:text-blue-100"
          >
            Download PDF
          </a>
        </div>
      </header>

      <section
        aria-label="Embedded résumé PDF"
        className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-800/70 shadow-2xl shadow-black/30 lg:block"
      >
        <object
          data={`${RESUME_PDF_URL}#view=FitH&toolbar=1`}
          type="application/pdf"
          title={`${resume.title} résumé PDF`}
          className="h-full min-h-[40rem] w-full"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <p>This browser could not display the embedded résumé.</p>
            <a className="text-blue-300 underline" href={RESUME_PDF_URL}>
              Open the PDF directly
            </a>
          </div>
        </object>
      </section>

      <article
        aria-label="Résumé content"
        className="resume-document rounded-2xl border border-white/10 bg-zinc-900/75 p-5 shadow-2xl shadow-black/20 sm:p-8 lg:hidden"
        dangerouslySetInnerHTML={{ __html: resume.html }}
      />
    </main>
  );
}
