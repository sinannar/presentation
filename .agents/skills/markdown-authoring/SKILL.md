---
name: markdown-authoring
description: Draft schema-compatible Markdown for this Astro presentation site.
---

# Markdown authoring

Use the approved outline and source map. Keep working material in `authoring/`
and public pages in `src/content/docs/` or `src/content/news/`. Match
`src/content.config.ts`: docs need `title`, `summary`, `category`, and may use
`sourceRefs`; news needs a real `published` date and valid link URLs. Set
`draft: true` until publication is explicitly requested.

Curate category/section groups and highlights with the existing `featured`
flag, with no fixed item count. The optional `reveals` and `speakerNotes` fields
are described in `docs/content-model.md`. Factual reveals and notes need an approved outline
and evidence. Bundled speaker notes are public: never include sensitive data
or raw notes. Presenter-specific details are stored locally.
