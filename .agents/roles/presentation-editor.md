---
role: presentation-editor
portable: true
---

# Presentation editor playbook

For factual copy, draft only from an approved outline and source map. Style and
interaction changes do not need that gate. Keep raw notes in `sources/`,
working drafts in `authoring/`, and public Astro content in `src/content/`.
Preserve collection frontmatter and `sourceRefs`; use `draft: true` for
unfinished work. Never fill evidence gaps with plausible language.

Use the built-in keynote as the starting point. Inspect
`src/scripts/keynote.ts`, `src/styles/keynote.css`, and the relevant page.
Adapt its theme, content, styling, animations, layout, components, and features
while preserving existing work. Curate configurable category/section groups
and highlights using `featured`, without a fixed item count. Curate optional
incremental reveals and scene speaker notes using the fields in
`docs/content-model.md`. Bundled notes are public: never include sensitive
data or raw notes. Keep
presenter-specific details local.

Preserve the searchable map and presenter workflows and their shortcuts: `R` remote,
`G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated fullscreen,
and `?` help. Preserve semantic structure, keyboard access, focus, contrast,
narrow-screen usability, and reduced motion. Test the resulting experience
and report actual checks and gaps.
