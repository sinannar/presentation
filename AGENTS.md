# Agent instructions

## Purpose

This repository is an Astro keynote that documents and demonstrates its own
presentation template. Adapt the existing keynote rather than replacing it:
content, theme, styling, animations, components, and features are all valid
customization surfaces.

## Working rules

1. Read only user-authorized Markdown/TXT files under `sources/` before making
   factual claims. Preserve original notes byte-for-byte. Generated current
   web research may be saved only under the explicitly authorized
   `sources/news/<topic>/` directory, with its brief, review, and handoff under
   `sources/workflows/<topic>/`. These generated directories are trackable:
   never place secrets, private notes, sensitive requests or unapproved private
   paths there. Put private working material under ignored `sources/private/`.
2. In the manual mode, use the four-stage factual workflow across explicit, separate prompts:
   source researcher gathers traceable online evidence from the topic prompt
   (local notes are optional); publication reviewer uses explicit
   `source-review` mode to correct only generated records and review/handoff
   files; outline planner saves a proposed outline and handoff only under the
   authorized `sources/workflows/<topic>/`; presentation editor adapts the existing
   keynote only after human approval of that exact outline revision and scope,
   using verified handoff paths/hashes and configuring the ordered
   `siteConfig.presentation.sections` with collection-qualified `docs/<id>` and
   `news/<id>`. The planner never edits the site or self-approves. The editor
   reports drafts omitted from the public build and may write a readiness
   handoff only to authorized `sources/workflows/<topic>/`; it never publishes.
   Publication review uses explicit `final-review` mode and is read-only.
3. In manual mode, a person must approve the identified outline revision and scope before
   factual public copy is drafted. A separate explicit publication approval is
   required before content becomes publishable.
4. Style-only work does not need source research or outline approval. It may
   adjust CSS, transitions, layout, components, and motion while preserving
   content and accessibility.
5. Keep drafts in `sources/workflows/` or mark content `draft: true`. Do not publish a
   draft by accident.
6. Do not invent missing facts, dates, quotations, links, or metrics. Mark gaps
   for review.
7. Preserve the existing keynote and user edits. Inspect
   `src/scripts/keynote.ts`, `src/styles/keynote.css`, and the relevant Astro
   page before changing behavior; do not generate a replacement site.
   Plan configurable category/section groups and use the existing `featured`
   flag for highlights, without assuming a fixed number of items.
8. Discover capabilities before using tools: use only tools exposed by the
   current runtime and never invent tool names, actions, or arguments. If no
   suitable tool exists, use repository files and documented commands.
9. Web research starts from the user's topic and scope; user-prepared Markdown
   or TXT notes are optional. A suitable search/fetch capability must actually
   be exposed by the active runtime. Never invent tool names or claim
   unavailable web research occurred; note that the request is unfulfilled in
   the handoff. Generated `sources/news/` and `sources/workflows/` files are
   trackable but only travel across checkouts after an authorized commit and
   sharing on an accessible branch. Other source paths, including
   `sources/private/`, are ignored. Each session must receive the preceding
   approved artifacts; do not assume uncommitted files are present elsewhere.
10. Profile instructions do not guarantee tool permissions or file-boundary
   enforcement. Configure final reviews read-only where the host permits;
   source-review requires bounded editing. Some hosts inherit parent
   permissions or lack path-level controls, so inspect the complete diff.
11. Run the smallest relevant checks. For this toolkit use
   `npm run validate:agents`; use `npm run validate` and `npm run check` when
   content or application behavior is involved.

## Boundaries

Agents can research, outline, draft, customize, revise, and validate. In manual
mode no agent commits or makes content publishable automatically. Never remove
`draft: true`, move a draft into a published collection, or claim publication
without an explicit request and a successful validation/build.

An explicit request to run or resume `news-agent` autopilot authorizes that
run to select its own evidence-backed outline and make eligible scoped content
publishable locally after review and validation, without separate outline or
publication approval. It does not imply a human approved an outline, grant
image reuse rights, authorize deployment or bypass tool permissions. It does
not apply to specialist sessions or authorize a later session to resume.
Stage commits are off unless explicitly opted into for the run with a defined
non-sensitive scope; follow `.agents/skills/news-orchestration/SKILL.md`.
Never push, merge, or deploy automatically.

Speaker notes bundled with the site are **public**, even in a presenter view.
Never put sensitive data or raw source notes there; curate and review them like
other public copy. Presenter-specific details are stored locally, not treated
as a private server or a live external integration. Preserve evidence and
review for all factual material, with human outline and publication approval
in manual mode and documented self-verification in explicit autopilot mode.

For the map and presenter workflows, preserve `R` for remote, `M` and `G` for
the searchable map, `P` for presenter, `N` for notes, `E` for details, `F` for
user-initiated fullscreen, and `?` for help. Preserve keyboard access, focus,
contrast, semantic structure, narrow-screen usability, and reduced motion.
Distinguish implementation from actual browser and deployment verification.

See [the full workflow](docs/agents-and-skills.md) and the portable playbooks in
[`.agents/roles/`](.agents/roles/).
