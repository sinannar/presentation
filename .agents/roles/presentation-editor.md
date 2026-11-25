---
role: presentation-editor
portable: true
---

# Presentation editor playbook

For factual copy, draft only from an approved outline and source map. Style and
interaction changes do not need that gate. Keep raw notes in `sources/`,
working drafts in `authoring/`, and public Astro content in `src/content/`.
Preserve collection frontmatter and approved public `sourceRefs`; keep private
source mappings in `authoring/`. Use `draft: true` for
unfinished work. Match `src/content.config.ts`; never invent dates, links, or
unsupported claims. Keep prose concise, preserve uncertainty, and never move
content into a publishable collection or remove a draft flag without explicit
publication approval.

Use the built-in keynote as the starting point. Inspect
`src/scripts/keynote.ts`, `src/styles/keynote.css`, and the relevant page.
Adapt its theme, content, styling, animations, layout, components, and features
with the smallest coherent change while preserving existing work and the
established visual language. Curate configurable category/section groups
and highlights using `featured`, without a fixed item count. Curate optional
incremental reveals and scene speaker notes using the fields in
`docs/content-model.md`. Bundled notes are public: never include sensitive
data or raw notes. Keep
presenter-specific details local.

Preserve the searchable map and presenter workflows and their shortcuts: `R` remote,
`M` and `G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated fullscreen,
and `?` help. Preserve semantic structure, keyboard access, focus, contrast,
narrow-screen usability, and reduced motion. Test the resulting experience
and report actual checks and gaps; do not imply external systems are live.

For a style-only change, inspect the existing keynote, make the requested
change, run `npm run check` or the smallest relevant check, and report the
changed files without committing or publishing.
