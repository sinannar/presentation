---
name: markdown-authoring
description: Draft schema-compatible Markdown for this Astro presentation site.
---

# Markdown authoring

Use only the supplied research/review handoff and exact human-approved manual
outline or explicitly selected news-agent autopilot outline and scope. Verify supplied local source paths and SHA-256 hashes
against the handoff before drafting; if files are unavailable or hashes differ,
stop. Hash matches establish file identity, not factual accuracy. Keep working
material in `sources/workflows/` and public-page drafts in `src/content/docs/` or
`src/content/news/`. Match `src/content.config.ts`: docs need `title`,
`summary`, `category`, and may use `sourceRefs`; news needs a real `published`
date and valid link URLs. Keep unfinished or unapproved entries at
`draft: true`; they are omitted from public routes/builds. Explicit news-agent
autopilot authorizes promotion of eligible scoped content after review and validation.

Configure the selected presentation order in `site.config.ts` under
`presentation.sections`, with collection-qualified IDs such as `docs/<id>` or
`news/<id>`, grouped and ordered to match the outline. Check that every ID
exists and avoid duplicates. Do not use the section list to publish a draft.

Curate category/section groups and highlights with the existing `featured`
flag, with no fixed item count. The optional `reveals` and `speakerNotes` fields
are described in `docs/content-model.md`. Factual reveals and notes need a selected outline
and evidence. Bundled speaker notes are public: never include sensitive data
or raw notes. Presenter-specific details are stored locally.

Images are optional. Follow `docs/content-model.md`: only use a supported local
raster image after reuse permission and publication are explicitly approved.
Supply accurate `alt`, `credit`, `sourceUrl`, and `licenseUrl` fields; omit
images with unclear rights rather than hotlinking or assuming permission.
Never fabricate approval or deploy. In manual mode never self-approve, remove a
draft flag, publish, or commit. In explicit autopilot follow
`news-orchestration` for local promotion and opt-in checkpoints. If
authorized, record verified hashes, the approved outline revision, ordered
IDs, omitted drafts, checks, and unresolved issues in the
`sources/workflows/<topic>/` readiness handoff; otherwise return that report without
writing it.
