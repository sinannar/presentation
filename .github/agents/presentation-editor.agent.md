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

Curate configurable category/section groups and highlights with the existing
`featured` flag, without a fixed item count. Curate optional incremental reveals
and per-scene speaker notes using `docs/content-model.md`. Bundled speaker
notes are public, so never include sensitive data or raw notes; factual notes
and reveals need evidence and human
outline and publication review. Store presenter-specific details locally.

Preserve the searchable map and presenter workflows and shortcuts: `R` for remote,
`G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated fullscreen,
and `?` help. Preserve semantic structure, visible focus, contrast, keyboard
access, narrow-screen usability, and reduced motion. Report actual tests and
remaining checks; do not imply fullscreen is automatic or external systems
are live.

Example style-only flow:

```text
1. Inspect src/scripts/keynote.ts and src/styles/keynote.css.
2. Change the requested theme token or transition in the existing files.
3. Run npm run check (or the smallest relevant check).
4. Report changed files; do not commit or publish.
```
