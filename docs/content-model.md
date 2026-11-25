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
sourceRefs: []
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

`draft: true` entries are excluded from routes and builds. Source references are for authoring and provenance; public links must be intentionally selected.

## Presentation selection and order

Without a `presentation` setting, all published docs followed by all published
news appear in the keynote as before. To use an approved outline, add an
ordered `presentation` property to `site.config.ts`:

```ts
presentation: {
  sections: [
    { name: 'Opening', items: ['news/template-workflow', 'docs/getting-started'] },
    { name: 'Next steps', items: ['docs/make-it-yours'] },
  ],
},
```

Use collection-qualified content IDs (the Markdown path without `.md`).
Sections and items appear in that order. Duplicate names or references and
unknown IDs fail the build; existing drafts are omitted until approved for
publication. `sections: []` deliberately shows no content scenes. The news
and docs archives remain independent of this presentation selection.

## Optional attributed images

After confirming reuse permission and authorizing publication, place a raster
asset in `public/images/` and add this optional field to a doc or news entry:

```yaml
image:
  src: /images/example.png
  alt: Description of the image
  credit: Creator name
  sourceUrl: https://example.com/image
  licenseUrl: https://example.com/license
```

The image and visible credit appear on the corresponding keynote scene; news
articles also display it. Only existing local PNG, JPEG, GIF, WebP or AVIF
files are accepted; external image URLs, SVG, traversal and missing files are
rejected. Source and permission links must be HTTP(S). URLs are base-aware.
Metadata validation cannot establish ownership, license scope or consent;
verify those independently. If rights are unclear, keep a source link in
research and do not publish the image.

Run `npm run validate:sources` to obtain file-qualified references in the format `sources/notes.md#L1-L8@sha256:<full-file-hash>`. Keep private references in ignored `sources/private/workflows/`; `sources/workflows/` and tracked frontmatter can be public even if not rendered. Only use `sourceRefs` for paths and hashes approved for publication, and only for lines supporting the entry. Use `npm run validate:sources -- --check-refs` when the inputs are available. Hash checks detect changes; they do not prove a claim is true. Do not treat source references as public links.

## Keynote scene fields

The starter has `category` and `featured`; curate configurable
category/section groups and select highlights with `featured`, rather than
inventing a second highlight flag or assuming five items. The requested scene
model supports these optional authoring fields:

```ts
reveals?: string[];
speakerNotes?: {
  talkingPoints?: string[];
  technicalDetails?: string[];
  transition?: string;
};
```

`reveals` holds optional incremental scene content. `speakerNotes` holds
curated presenter-facing material for a scene. Either may be absent. Omitted
arrays default to empty arrays and an omitted transition to an empty string.
Any speaker notes bundled in the site are **public**, regardless of presentation
mode: never include sensitive data or raw source notes. Ground factual reveals
and notes in the source map and include them in human outline and publication
review. Presenter-specific details are stored locally, separate from bundled
content; local storage is not a guarantee of secrecy.
