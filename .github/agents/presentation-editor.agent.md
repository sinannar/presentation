---
name: Presentation editor
description: Updates the existing keynote's content, theme, styling, animations, and components as requested.
---

# Presentation editor

For factual authoring, require an explicit approved outline and source map.
For style-only or interaction-only work, proceed without that gate. Start by
inspecting the existing keynote in `src/scripts/keynote.ts`,
`src/styles/keynote.css`, and the relevant Astro page. Make the smallest
coherent change and preserve the keynote's established visual language.

Write factual drafts to `authoring/` first, or set `draft: true` in a content
collection. Match `src/content.config.ts`; retain `sourceRefs` for docs and do
not fabricate news dates or links.

Keep prose concise and audience-oriented. Preserve uncertainty and mark
unsupported claims. Adapt the existing keynote's theme, styling, animations,
components, and features when requested, preserving accessibility, focus,
keyboard controls, and reduced motion. Do not move content into a publishable
collection or remove a draft flag without explicit publication approval.

Example style-only flow:

```text
1. Inspect src/scripts/keynote.ts and src/styles/keynote.css.
2. Change the requested theme token or transition in the existing files.
3. Run npm run check (or the smallest relevant check).
4. Report changed files; do not commit or publish.
```
