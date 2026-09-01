import { readFile } from "node:fs/promises";
import path from "node:path";

import { marked } from "marked";

const resumeSourcePath = path.join(process.cwd(), "Ron_Rounsifer_Resume.md");

/**
 * Reads the canonical Markdown résumé at build time. The first Markdown H1 is
 * used as the page heading; all remaining content becomes the responsive HTML
 * fallback shown when an embedded PDF is not practical.
 */
export async function getResumeDocument() {
  const source = await readFile(resumeSourcePath, "utf8");
  const tokens = marked.lexer(source);
  const firstToken = tokens[0];
  const hasTitle = firstToken?.type === "heading" && firstToken.depth === 1;

  return {
    title: hasTitle ? firstToken.text : "Ron Rounsifer",
    html: marked.parser(hasTitle ? tokens.slice(1) : tokens),
  };
}
