# Extending the template

Add a content category through frontmatter and layout logic before adding a new page family. Keep routes base-aware through `withBase()`.

Extend the built-in keynote rather than replacing it. Plan configurable
category/section groups for any number of items and use the existing `featured`
flag for highlights. The [content model](content-model.md) describes optional
per-scene reveals and speaker notes. Notes bundled into the site are public and must contain no
sensitive data or raw notes. Store presenter-specific details locally.

Preserve the searchable map and presenter workflows: `R` remote,
`M` and `G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated fullscreen,
and `?` help. Preserve visible focus, semantic labels, contrast, responsive
layout, and reduced motion. Test the implemented behavior and report actual
results; do not assume fullscreen availability or live external systems.

New skills belong in `.agents/skills/<name>/SKILL.md`; add a matching Claude adapter in `.claude/skills/`. Put canonical role instructions in `.agents/roles/` and add a thin discovery profile for each supported host. Adapters instruct the agent to read the canonical file; they are not automatic includes. Update the validator and [compatibility guide](agent-compatibility.md) when adding one.

The keynote consumes the same curated docs and news as the supporting pages. Extend its scene rendering without duplicating source facts.
