# Content model

Astro content collections live in `src/content/docs/` and `src/content/news/`.

## Docs

```yaml
title: A concise title
summary: One-sentence description
category: guide
order: 1
draft: false
featured: false
tags: [topic]
sourceRefs: [notes.md#L1-L8]
takeaway: The point to remember
```

## News

News uses the same common fields plus `published`, optional `status`, and selected public `links`:

```yaml
published: 2026-01-01
links:
  - label: Official source
    url: https://example.com/source
```

`draft: true` entries are excluded from routes and builds. Source references are for authoring/provenance; public links must be intentionally selected.
