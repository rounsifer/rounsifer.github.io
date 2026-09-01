import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { marked } from "marked";
import PDFDocument from "pdfkit";

const SOURCE_PATH = path.join(process.cwd(), "Ron_Rounsifer_Resume.md");
const OUTPUT_PATH = path.join(
  process.cwd(),
  "public",
  "Ron_Rounsifer_Resume.pdf",
);

const COLORS = {
  accent: "#315ea8",
  body: "#22252a",
  heading: "#111827",
  muted: "#59616d",
  rule: "#cbd5e1",
};

/** @typedef {{ text: string, bold: boolean, italic: boolean, link?: string }} TextRun */

/**
 * Converts Marked inline tokens to styled runs understood by PDFKit.
 * @param {import("marked").Token[]} tokens
 * @param {{ bold?: boolean, italic?: boolean, link?: string }} [style]
 * @returns {TextRun[]}
 */
function inlineRuns(tokens, style = {}) {
  /** @type {TextRun[]} */
  const runs = [];

  for (const token of tokens) {
    if (token.type === "br") {
      runs.push({ text: "\n", bold: !!style.bold, italic: !!style.italic });
      continue;
    }

    if (
      token.type === "strong" ||
      token.type === "em" ||
      token.type === "link"
    ) {
      runs.push(
        ...inlineRuns(token.tokens, {
          ...style,
          bold: style.bold || token.type === "strong",
          italic: style.italic || token.type === "em",
          link: token.type === "link" ? token.href : style.link,
        }),
      );
      continue;
    }

    if ("tokens" in token && Array.isArray(token.tokens)) {
      runs.push(...inlineRuns(token.tokens, style));
      continue;
    }

    if ("text" in token && typeof token.text === "string") {
      runs.push({
        text: token.text,
        bold: !!style.bold,
        italic: !!style.italic,
        link: style.link,
      });
    }
  }

  return runs;
}

/** @param {TextRun} run */
function fontForRun(run) {
  if (run.bold && run.italic) return "Helvetica-BoldOblique";
  if (run.bold) return "Helvetica-Bold";
  if (run.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {TextRun[]} runs
 * @param {{ x?: number, y?: number, width?: number, size?: number, color?: string, lineGap?: number }} [options]
 */
function renderRuns(doc, runs, options = {}) {
  if (runs.length === 0) return;

  runs.forEach((run, index) => {
    const first = index === 0;
    doc.font(fontForRun(run));
    doc.fontSize(options.size ?? 8.6);
    doc.fillColor(run.link ? COLORS.accent : (options.color ?? COLORS.body));

    const textOptions = {
      continued: index < runs.length - 1,
      lineGap: options.lineGap ?? 1.2,
      link: run.link,
      underline: !!run.link,
      width: options.width,
    };

    if (first && options.x !== undefined && options.y !== undefined) {
      doc.text(run.text, options.x, options.y, textOptions);
    } else {
      doc.text(run.text, textOptions);
    }
  });
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {number} height
 */
function ensureSpace(doc, height) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottom) doc.addPage();
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {import("marked").Tokens.Heading} token
 */
function renderHeading(doc, token) {
  doc.x = doc.page.margins.left;

  if (token.depth === 1) {
    doc
      .font("Helvetica-Bold")
      .fontSize(23)
      .fillColor(COLORS.heading)
      .text(token.text, { characterSpacing: 0.15 });
    doc.moveDown(0.16);
    return;
  }

  if (token.depth === 2) {
    ensureSpace(doc, 28);
    doc.moveDown(0.55);
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(COLORS.accent)
      .text(token.text.toUpperCase(), { characterSpacing: 1.25 });
    const ruleY = doc.y + 1;
    doc
      .moveTo(doc.page.margins.left, ruleY)
      .lineTo(doc.page.width - doc.page.margins.right, ruleY)
      .lineWidth(0.55)
      .strokeColor(COLORS.rule)
      .stroke();
    doc.moveDown(0.45);
    return;
  }

  ensureSpace(doc, 24);
  doc.moveDown(0.35);
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLORS.heading)
    .text(token.text, { lineGap: 1 });
  doc.moveDown(0.1);
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {import("marked").Tokens.Paragraph} token
 */
function renderParagraph(doc, token) {
  doc.x = doc.page.margins.left;
  const runs = inlineRuns(token.tokens);
  const isSubtitle =
    token.tokens.length === 1 && token.tokens[0]?.type === "strong";
  const isRoleLine =
    token.tokens.length === 1 && token.tokens[0]?.type === "em";

  ensureSpace(doc, isSubtitle ? 24 : 18);
  renderRuns(doc, runs, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    size: isSubtitle ? 9.5 : isRoleLine ? 8.2 : 8.55,
    color: isSubtitle ? COLORS.accent : isRoleLine ? COLORS.muted : COLORS.body,
    lineGap: isSubtitle ? 1.4 : 1.25,
  });
  doc.moveDown(isSubtitle ? 0.28 : isRoleLine ? 0.18 : 0.3);
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {import("marked").Tokens.List} token
 */
function renderList(doc, token) {
  const left = doc.page.margins.left;
  const textX = left + 12;
  const width = doc.page.width - doc.page.margins.right - textX;

  for (const item of token.items) {
    const runs = inlineRuns(item.tokens);
    const plainText = runs.map((run) => run.text).join("");
    doc.font("Helvetica").fontSize(8.25);
    const height = doc.heightOfString(plainText, { width, lineGap: 1.1 });
    ensureSpace(doc, height + 5);
    const y = doc.y;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.accent)
      .text("•", left + 1, y);
    renderRuns(doc, runs, {
      x: textX,
      y,
      width,
      size: 8.25,
      color: COLORS.body,
      lineGap: 1.1,
    });
    doc.moveDown(0.18);
  }

  doc.x = left;
  doc.moveDown(0.08);
}

const markdown = await readFile(SOURCE_PATH, "utf8");
const tokens = marked.lexer(markdown);

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

const doc = new PDFDocument({
  autoFirstPage: true,
  bufferPages: true,
  displayTitle: true,
  margins: { top: 34, right: 40, bottom: 38, left: 40 },
  size: "LETTER",
  info: {
    Title: "Ron Rounsifer — Résumé",
    Author: "Ron Rounsifer",
    Subject: "Senior Embedded & Systems Software Engineer",
    Keywords: "embedded systems, embedded Linux, C++, software engineering",
  },
});

const stream = createWriteStream(OUTPUT_PATH);
doc.pipe(stream);

for (const token of tokens) {
  if (token.type === "heading") renderHeading(doc, token);
  if (token.type === "paragraph") renderParagraph(doc, token);
  if (token.type === "list") renderList(doc, token);
}

const pageRange = doc.bufferedPageRange();
for (
  let index = pageRange.start;
  index < pageRange.start + pageRange.count;
  index += 1
) {
  doc.switchToPage(index);
  const originalBottomMargin = doc.page.margins.bottom;
  // PDFKit normally constrains text to the content box. Temporarily release
  // the bottom margin so drawing the footer cannot create a blank extra page.
  doc.page.margins.bottom = 0;
  doc
    .font("Helvetica")
    .fontSize(7.2)
    .fillColor(COLORS.muted)
    .text(
      `rounsifer.github.io  •  ${index + 1} / ${pageRange.count}`,
      doc.page.margins.left,
      doc.page.height - 25,
      {
        align: "right",
        lineBreak: false,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      },
    );
  doc.page.margins.bottom = originalBottomMargin;
}

doc.end();

await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

console.log(
  `Generated ${path.relative(process.cwd(), OUTPUT_PATH)} from ${path.basename(SOURCE_PATH)}`,
);
