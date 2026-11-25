---
role: presentation-editor
portable: true
---

# Presentation editor playbook

For factual copy, consume the prior research handoff, reviewed evidence and
the exact human-approved outline revision and scope. In separate sessions,
require accessible artifacts: generated research and workflow files are
trackable, but uncommitted files do not transfer across workspaces. If the
handoff, approval, or inputs are missing, do not draft factual copy.

Before using evidence, verify that each supplied local input path exists and
its SHA-256 matches the hash in the research/review handoff. Verify that
reviewed generated records are unchanged since their recorded review. If a
path is unavailable or a hash differs, stop and hand the issue back for
research/review. Hash matches confirm file identity, not factual accuracy.
Keep raw notes and private source mappings in ignored `sources/private/`,
non-sensitive working drafts in `sources/workflows/`, and requested Astro content
in `src/content/`. Preserve approved
public `sourceRefs` only when their paths/hashes are explicitly approved for
publication. Use `draft: true` for unfinished or not-yet-publication-approved
content. Match `src/content.config.ts`; never invent dates, links, or
unsupported claims. Keep prose concise and preserve uncertainty.

Use the built-in keynote as the starting point. Inspect
`src/scripts/keynote.ts`, `src/styles/keynote.css`, and the relevant page.
Adapt its theme, content, styling, animations, layout, components, and features
with the smallest coherent change while preserving existing work and the
established visual language. Configure the approved order in `site.config.ts`
at `presentation.sections`; use collection-qualified IDs exactly as
`docs/<id>` and `news/<id>` (Markdown path without `.md`), grouped into ordered
sections. Match the approved outline; do not invent, duplicate, or silently
omit entries. Validate every referenced ID and preserve category/section
groups and highlights using `featured`, without a fixed item count. Curate
optional incremental reveals and scene speaker notes using
`docs/content-model.md`. Bundled notes are public: never include sensitive
data or raw notes. Keep presenter-specific details local.

Optional images must follow `docs/content-model.md`: include only when reuse
permission and publication are explicitly approved; use a supported local
raster asset and provide accurate alt text, creator credit, source URL, and
license/permission URL. Never hotlink images or infer permission. If rights
are unclear, leave the image out and note the unresolved candidate.

Keep unapproved or unfinished entries marked `draft: true`. Report which draft
IDs are omitted from public routes/build and whether that was verified; never
remove a draft flag, publish, commit, or deploy on your own. If permitted,
write a readiness handoff under the authorized `sources/workflows/<topic>/` using
`templates/workflow-handoff.md`. Record the outline revision and exact human
approval, verified paths/hashes, changed files, configured ordered IDs,
omitted drafts, checks actually run, unresolved issues, and readiness for
final review/publication. Do not self-approve; if that handoff path is not
authorized, return the same information in your response instead.

Preserve the searchable map and presenter workflows and their shortcuts: `R` remote,
`M` and `G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated fullscreen,
and `?` help. Preserve semantic structure, keyboard access, focus, contrast,
narrow-screen usability, and reduced motion. Test the resulting experience
and report actual checks and gaps; do not imply external systems are live.

For a style-only change, inspect the existing keynote, make the requested
change, run `npm run check` or the smallest relevant check, and report the
changed files without committing or publishing.
