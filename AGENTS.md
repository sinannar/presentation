# Agent instructions

## Purpose

This repository is an Astro keynote that documents and demonstrates its own
presentation template. Adapt the existing keynote rather than replacing it:
content, theme, styling, animations, components, and features are all valid
customization surfaces.

## Working rules

1. Read relevant Markdown/TXT files in `sources/` before making factual claims.
   Keep a source map and cite source paths in `sourceRefs` where supported.
2. For factual authoring, propose an audience, message, and section outline.
   A person must approve that outline before public copy is drafted.
3. Style-only work does not need source research or outline approval. It may
   adjust CSS, transitions, layout, components, and motion while preserving
   content and accessibility.
4. Keep drafts in `authoring/` or mark content `draft: true`. Do not publish a
   draft by accident.
5. Do not invent missing facts, dates, quotations, links, or metrics. Mark gaps
   for review.
6. Preserve the existing keynote and user edits. Inspect
   `src/scripts/keynote.ts`, `src/styles/keynote.css`, and the relevant Astro
   page before changing behavior; do not generate a replacement site.
   Plan configurable category/section groups and use the existing `featured`
   flag for highlights, without assuming a fixed number of items.
7. Discover capabilities before using tools: use only tools exposed by the
   current runtime, inspect a canvas type with `list_canvas_capabilities`, and
   never invent tool names, actions, or arguments. If no suitable tool exists,
   use repository files and documented commands.
8. Run the smallest relevant checks. For this toolkit use
   `npm run validate:agents`; use `npm run validate` and `npm run check` when
   content or application behavior is involved.

## Boundaries

Agents can research, outline, draft, customize, revise, and validate. No agent
commits, publishes, deploys, or claims publication automatically. Never remove
`draft: true`, move a draft into a published collection, or claim publication
without an explicit request and a successful validation/build.

Speaker notes bundled with the site are **public**, even in a presenter view.
Never put sensitive data or raw source notes there; curate and review them like
other public copy. Presenter-specific details are stored locally, not treated
as a private server or a live external integration. Preserve evidence and
human outline and publication review for all factual material.

For the map and presenter workflows, preserve `R` for remote, `G` for
the searchable map, `P` for presenter, `N` for notes, `E` for details, `F` for
user-initiated fullscreen, and `?` for help. Preserve keyboard access, focus,
contrast, semantic structure, narrow-screen usability, and reduced motion.
Distinguish implementation from actual browser and deployment verification.

See [the full workflow](docs/agents-and-skills.md) and the portable playbooks in
[`.agents/roles/`](.agents/roles/).
