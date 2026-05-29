export const meta = {
  name: 'site-audit',
  description: 'Audit the portfolio site across the six team dimensions, adversarially verify each finding, and synthesize a prioritized improvement backlog',
  whenToUse: 'When you want a full, verified health check of the site and a prioritized backlog of fixes — before a redesign, after a big change, or on a cadence.',
  phases: [
    { title: 'Map', detail: 'inventory the repo into a shared context map' },
    { title: 'Audit', detail: 'one specialist team-agent auditor per dimension' },
    { title: 'Verify', detail: 'adversarially verify each finding against the real code' },
    { title: 'Synthesize', detail: 'dedupe + prioritize confirmed findings into a backlog' },
  ],
}

// ----------------------------- Schemas -----------------------------

const MAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'files'],
  properties: {
    summary: { type: 'string', description: 'Short overview of the codebase structure and stack' },
    files: {
      type: 'array',
      description: 'Notable source/config files, each with a one-line note',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'note'],
        properties: {
          path: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
  },
}

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'findings'],
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'file', 'description', 'suggestedFix'],
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          file: { type: 'string', description: 'file or file:line the finding refers to' },
          description: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isReal', 'confidence', 'reasoning'],
  properties: {
    isReal: { type: 'boolean', description: 'true only if confirmed by reading the actual code' },
    confidence: { type: 'number', description: '0..1' },
    reasoning: { type: 'string' },
    adjustedSeverity: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
}

// ---------------- Dimensions, each backed by a team agent ----------------

const DIMENSIONS = [
  {
    key: 'shaders',
    agent: 'shader-particle-specialist',
    focus: 'The Three.js particle system and GLSL shaders. Look at: per-frame allocations inside useFrame, particle count vs. mobile/low-end GPU cost, shader correctness, the .glsl asset/source import path, the @ts-expect-error on the uniforms update, and dead experiments (TwistedBox / BasicParticles) shipped in the bundle.',
  },
  {
    key: 'ui',
    agent: 'ui-component-builder',
    focus: 'React components, Tailwind, responsive layout, the custom cursor, and motion animations. Look at: contradictory Tailwind classes (e.g. "flex hidden"), nested <main> elements, breakpoints that break on tablet/mobile, event listeners attached on every render in custom-cursor, and the timeline()-on-import animation pattern.',
  },
  {
    key: 'content',
    agent: 'content-curator',
    focus: 'Written content. Look at: the jobHistory array in experience-section.tsx for typos/inconsistent formatting/malformed entries, the bio/tagline/role text, social links, and whether the layout.tsx metadata (empty description) reads well as a professional public site.',
  },
  {
    key: 'perf-a11y',
    agent: 'perf-a11y-auditor',
    focus: 'Performance and accessibility. Look at: prefers-reduced-motion support for the motion timelines and the constantly-animating particle field, keyboard navigation and focus states under cursor-none, semantic HTML / landmarks, color contrast against mix-blend backgrounds, bundle weight of three/r3f/drei/motion, and SEO/meta (empty description, no Open Graph).',
  },
  {
    key: 'build-deploy',
    agent: 'build-deploy-guardian',
    focus: 'Build, tooling, dependencies, and the GitHub Pages deploy. Look at: any static-export (output:"export") violations, the lack of a test/lint gate before deploy in deploy.yml, dependency compatibility risk across three / @react-three/fiber / @react-three/drei, eslint-config-next pinned to 14 while next is 15, and env validation.',
  },
  {
    key: 'testing',
    agent: 'test-harness-engineer',
    focus: 'The testing gap: there is no test runner, no tests, no test script. Identify the highest-value first tests and the concrete setup blockers (WebGL not running in jsdom, GLSL raw-string imports, motion timeline side effects, the ~/* alias).',
  },
]

// ----------------------------- Phase 1: Map -----------------------------

phase('Map')
const map = await agent(
  `Build a concise structural map of this repository for downstream auditors. Read package.json, next.config.js, tsconfig.json, .eslintrc.cjs, the GitHub Actions workflow, and everything under src/. Return a short summary plus the notable files with a one-line note each. Do not audit — just map.`,
  { label: 'repo-map', phase: 'Map', schema: MAP_SCHEMA, agentType: 'Explore' },
)

const mapText = `${map.summary}\n\nKey files:\n${map.files.map((f) => `- ${f.path} — ${f.note}`).join('\n')}`
log(`Mapped ${map.files.length} notable files; auditing ${DIMENSIONS.length} dimensions`)

// ------------------- Phases 2+3: Audit -> Verify (pipeline) -------------------
// Pipeline (no barrier): each dimension's findings start verifying the moment
// that dimension's audit returns, while slower dimensions are still auditing.

const auditPrompt = (d) =>
  `You are auditing the "${d.key}" dimension of this static-export Next.js + Three.js portfolio site.

FIRST, read your operating manual at \`.claude/agents/${d.agent}.md\` and fully adopt that role — its ownership boundaries, conventions, and constraints govern this audit.

Shared repo map:
${mapText}

Then read the relevant source files yourself and report concrete, specific findings ONLY within your area of ownership. Every finding must cite a real file (with a line number when you can), describe the actual problem, and propose a concrete fix. Prefer a few high-confidence findings over speculation — an empty list is acceptable if the area is clean.

Focus area: ${d.focus}`

const audited = await pipeline(
  DIMENSIONS,
  // Stage 1 — audit (default workflow agent; persona comes from the agent's own manual file)
  (d) =>
    agent(auditPrompt(d), {
      label: `audit:${d.key}`,
      phase: 'Audit',
      schema: FINDINGS_SCHEMA,
    }).then((res) => ({ d, findings: res && res.findings ? res.findings : [] })),
  // Stage 2 — verify each finding adversarially (skip if none)
  ({ d, findings }) => {
    if (!findings.length) return { d, verified: [] }
    return parallel(
      findings.map((f) => () =>
        agent(
          `Adversarially verify this audit finding for a static-export Next.js + Three.js portfolio site. Be skeptical: set isReal=false unless you can confirm it by reading the actual cited code. Watch for findings that don't apply to a static export, or that the code already handles.

Finding: ${f.title}
Severity claimed: ${f.severity}
File: ${f.file}
Description: ${f.description}
Proposed fix: ${f.suggestedFix}

Read the cited file(s), decide whether this is a real, actionable issue, set confidence 0..1, and adjust severity if warranted.`,
          {
            label: `verify:${d.key}:${f.title.slice(0, 28)}`,
            phase: 'Verify',
            schema: VERDICT_SCHEMA,
          },
        ).then((v) => ({ ...f, dimension: d.key, owner: d.agent, verdict: v })),
      ),
    ).then((vs) => ({ d, verified: vs.filter(Boolean) }))
  },
)

// --------------------- Collect confirmed findings ---------------------

const allVerified = audited.filter(Boolean).flatMap((x) => x.verified)
const confirmed = allVerified.filter(
  (f) => f.verdict && f.verdict.isReal && f.verdict.confidence >= 0.6,
)
const rejected = allVerified.length - confirmed.length
log(`Verified ${allVerified.length} findings → ${confirmed.length} confirmed, ${rejected} rejected/low-confidence`)

if (!confirmed.length) {
  return {
    backlog: '# Site Audit\n\nNo high-confidence issues survived adversarial verification. The audited dimensions look clean.',
    confirmedCount: 0,
    rejectedCount: rejected,
    dimensions: DIMENSIONS.map((d) => d.key),
  }
}

// ----------------------------- Phase 4: Synthesize -----------------------------

phase('Synthesize')
const backlog = await agent(
  `You are the tech lead for this portfolio site. Below are audit findings that PASSED adversarial verification (JSON). Produce a prioritized improvement backlog as clean GitHub-flavored Markdown.

Rules:
- Group under P0 (must fix / breaks build or deploy or a11y blocker), P1 (should fix), P2 (nice to have).
- Dedupe and merge overlapping findings across dimensions.
- For each item give: a short title, the owning agent (use the "owner" field), affected file(s), one line on why it matters, and the concrete fix.
- Order by severity then impact. Be concise and actionable — this becomes the team's task list.
- End with a one-line "Suggested first sprint" naming the top 3 items.

Verified findings:
${JSON.stringify(confirmed, null, 2)}`,
  { label: 'synthesize-backlog', phase: 'Synthesize' },
)

return {
  backlog,
  confirmedCount: confirmed.length,
  rejectedCount: rejected,
  dimensions: DIMENSIONS.map((d) => d.key),
}
