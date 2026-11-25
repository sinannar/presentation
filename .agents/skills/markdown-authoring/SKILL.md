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
