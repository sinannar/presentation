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
while preserving existing work, keyboard behavior, and reduced motion. Test the
resulting experience.
