---
name: publication-boundaries
description: Keep source notes, drafts, and published content separated.
---

# Publication boundaries

Never edit source notes to make them fit a story. Never treat `sources/workflows/` as
published. Never remove `draft: true` or move a file into a published collection without
explicit human authorization and validation. Explicit news-agent autopilot
authorizes promotion of eligible scoped content locally after review and
validation; it does not authorize deployment or claiming a page is live.
Workflow artifacts are trackable even though they are not site content; keep
sensitive material under ignored `sources/private/` and review diffs before sharing.

In manual mode a reviewer may approve readiness; only the separately authorized
publication step crosses the boundary. In autopilot record the agent's decision,
not a fabricated human approval.

Speaker notes bundled in the site are public even if shown in a presenter view.
Never put sensitive information or raw source notes there. Curated factual
notes and reveals require evidence and publication review; manual mode also
requires human outline approval. Presenter-specific details are stored locally; do not represent local
storage as a guarantee of secrecy.
