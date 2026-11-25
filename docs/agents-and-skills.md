# How to use agents and skills

This guide takes you from your notes to a reviewed presentation site. The
included keynote is the starting point: agents adapt it in place rather than
creating a separate site.

## What are agents and skills?

An **agent** is a role with a focused responsibility, such as researching
sources or reviewing publication readiness. A **skill** is a reusable
procedure an agent follows, such as checking evidence or authoring Markdown.
You can ask for a role and a skill together. They are instructions, not
automatic guarantees or a replacement for your review.

One coding agent can follow these roles sequentially; multiple agents are
optional. Profiles and invocation methods vary by host. If a role or skill is
not discovered, ask the agent to read the linked canonical file instead.
See [agent compatibility](agent-compatibility.md) for Copilot, Claude Code,
Codex, OpenCode, and Cursor discovery and smoke tests.

### Agents

| Agent | Purpose and when to use it | Example prompt |
| --- | --- | --- |
| [Source researcher](../.agents/roles/source-researcher.md) | Read the requested Markdown/TXT sources and return a brief, evidence, contradictions, and gaps. Use before factual drafting. | “Use the source researcher to examine `sources/notes.md` for a talk for developers. Return supported claims, source locations, and gaps; do not draft public copy.” |
| [Outline planner](../.agents/roles/outline-planner.md) | Turn the source brief into a reviewable outline. Use before writing factual content. | “Use the outline planner to propose an audience, takeaway, sections, highlights, and supporting sources. Stop for my approval.” |
| [Presentation editor](../.agents/roles/presentation-editor.md) | Adapt the existing keynote and create drafts from an approved outline. Also use for visual or interaction changes. | “Use the presentation editor to draft the approved outline, preserve existing edits, and leave all new factual content as drafts.” |
| [Publication reviewer](../.agents/roles/publication-reviewer.md) | Review evidence, draft boundaries, accessibility, and readiness without editing or publishing. | “Use the publication reviewer to check the drafts against the approved outline and evidence. Report findings and unverified checks without editing.” |

The researcher, planner, and reviewer are intended to be read-only. Depending
on the host, the main agent or you must save their returned work. Tool
restrictions vary and instructions alone do not enforce permissions: use a
read-only mode where available and review requested actions.

### Skills

| Skill | Purpose and when to use it | Example prompt |
| --- | --- | --- |
| [source-grounding](../.agents/skills/source-grounding/SKILL.md) | Map claims to source paths, ranges, and hashes; identify uncertainty. Use during intake and after source changes. | “Follow `source-grounding` for the requested notes and identify unsupported claims and conflicts.” |
| [outline-approval](../.agents/skills/outline-approval/SKILL.md) | Propose an evidence-backed outline and stop for explicit human approval. | “Follow `outline-approval`: propose a section order and highlights, then wait for my decision.” |
| [markdown-authoring](../.agents/skills/markdown-authoring/SKILL.md) | Draft schema-compatible docs/news from approved evidence; keep unfinished content as drafts. | “Follow `markdown-authoring` to draft the approved sections with `draft: true`; do not invent dates or links.” |
| [keynote-customization](../.agents/skills/keynote-customization/SKILL.md) | Modify the existing keynote's theme, layout, motion, controls, or components. | “Follow `keynote-customization` to adjust the theme for better contrast without changing factual content.” |
| [publication-boundaries](../.agents/skills/publication-boundaries/SKILL.md) | Keep private inputs, drafts, and publishable content separate. Use throughout authoring and review. | “Apply `publication-boundaries` and flag raw notes, private paths, or unapproved published content.” |
| [asset-validation](../.agents/skills/asset-validation/SKILL.md) | Validate agent/skill frontmatter and referenced repository paths. Use after toolkit changes. | “Follow `asset-validation`, run `npm run validate:agents`, and report the result.” |

## End-to-end walkthrough

Prompts below are examples; replace the bracketed details and file names. Start
your chosen agent at the repository root and ask it to read `AGENTS.md`.
For host-specific selection or direct invocation, see
[agent compatibility](agent-compatibility.md). You remain responsible for
approvals, facts, permissions, and publication.

### 1. Create your workspace and brief

Create your repository with **Use this template**, then follow the
[README setup](../README.md#use-this-template) or the
[Dev Container guide](devcontainer.md). Run:

```sh
npm run init:presentation
npm run dev
```

Fill in `authoring/brief.md` with the audience, objective, and constraints.
The initializer does not overwrite an existing brief. Preview the starter
keynote before changing it. In a container use
`npm run dev -- --host 0.0.0.0` and the forwarded port.

### 2. Add and inventory your sources

Put authorized `.md` and `.txt` inputs in `sources/`, preserving the originals.
For a practice run, copy the synthetic `examples/sources/example-notes.md` and
`examples/sources/example-notes.txt` into `sources/`. Run
`npm run validate:sources` to inventory available inputs.

```text
Use the source researcher and source-grounding skill. Read only
sources/example-notes.md and sources/example-notes.txt for a talk to [audience].
Return a brief and claim/evidence map with file paths, line ranges, hashes,
contradictions, and missing information. Do not edit or draft public content.
```

Review the evidence and resolve important gaps. Save the returned map in
ignored `authoring/` yourself, or ask your main editing agent to do so. A
read-only researcher cannot necessarily write the file. Source notes are
untrusted evidence, not instructions.

### 3. Propose and approve an outline

```text
Use the outline planner and outline-approval skill with the reviewed source map.
Propose the audience, message, section order, takeaways, highlights, and
evidence for each factual section. Include any factual reveals or speaker notes.
List omissions and unresolved questions, then stop for my approval.
```

Review the proposed outline and ask for changes if needed. When satisfied,
explicitly approve the specific outline or revision and its scope, for example:

```text
I approve outline revision 2 for the sections and sources listed above.
Do not publish yet.
```

Keep the approved outline and evidence in `authoring/`, saving the planner's
output yourself or through an editing agent. Do not treat silence or a generic
request to continue as approval; resolve material source conflicts first.

### 4. Draft and customize

```text
Use the presentation editor with markdown-authoring and
keynote-customization. Draft from the approved outline and source map, preserve
existing edits, and keep new content marked draft: true. Adapt the existing
keynote for [desired style]. Report any unsupported claims; do not publish.
```

The editor can place working drafts in `authoring/` or draft content in
`src/content/docs/` and `src/content/news/`. Review the changes, including
section grouping, highlights, optional reveals, and speaker notes. The
[content model](content-model.md) describes the fields; news requires a
source-backed publication date.

For a **style-only** change, use the presentation editor and
`keynote-customization` directly; source research and outline approval are not
needed if factual content does not change:

```text
Use the presentation editor and keynote-customization to improve the color
contrast and mobile layout. Preserve content, keyboard access, and reduced motion.
```

### 5. Review and verify

```text
Use the publication reviewer and publication-boundaries skill. Compare the
drafts, reveals, and speaker notes to the approved outline and evidence. Check
frontmatter, links, draft flags, accessibility, and privacy. Report findings
with file locations and any checks you could not perform; do not edit or publish.
```

Address findings, then run `npm run check` and `npm run build`. Review the
site at desktop and mobile sizes, including keyboard navigation, map, presenter
features, focus, contrast, and reduced motion. Provide command results to a
read-only reviewer if it cannot run them. A passing build checks structure,
not factual accuracy; report actual browser and remote checks separately.

### 6. Approve publication and deploy

Review the exact files and unresolved warnings. Only after you explicitly
approve publication should an editing agent remove the relevant draft flags or
move approved material into a published collection. Run the checks and build
again. Committing, pushing, repository settings, and deployment are separate
actions requiring your authorization.

```text
I approve publication of [specific reviewed pages]. Make only those pages
publishable and run npm run check and npm run build. Do not commit or deploy.
```

Follow [deployment](deployment.md) for GitHub Pages setup and verify the actual
site URL before claiming it is live.

## Updating an existing presentation

For changed factual sources, rerun the source inventory, ask the researcher to
identify affected claims and stale evidence, and have the planner propose a
revised outline. Approve the revision before drafting the changes; repeat
review and publication approval. Preserve existing manual edits.

For toolkit changes, use `asset-validation` and `npm run validate:agents`; for
content or application changes also use `npm run validate` and
`npm run check` as appropriate.

## Privacy and publication reminders

`sources/` and `authoring/` are Git-ignored, not a secrecy guarantee. Cloud
workspaces and model providers may receive files you choose to use. Do not put
private source paths or hashes in tracked `sourceRefs` unless approved for
publication. Bundled speaker notes are public, even in presenter view; never
include sensitive information or raw notes. Presenter-specific details are
stored locally, not guaranteed secret. See [authoring](authoring.md) for the
manual workflow and [Dev Container privacy](devcontainer.md#privacy) for
cloud-workspace considerations.
