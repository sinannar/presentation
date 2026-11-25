---
name: source-news-review
description: Verify generated web-research records and review handoffs without changing original notes or public content.
---

# Source news review

In the manual workflow ask the `publication-reviewer` to use an explicit mode:
`source-review` or `final-review`. If absent, do not write. An explicitly
requested `news-agent` autopilot invokes source-review directly; its second
pass is self-verification, not independent review.

## Source-review mode

Read `AGENTS.md`, the handoff, the authorized inputs, and
`templates/source-news.md`, `templates/research-review.md`, and
`templates/workflow-handoff.md`. Verify material claims against the cited
sources and check metadata, publication dates, conflicting accounts, and any
image-rights assertions.

You may correct only generated records in the exact user-authorized
`sources/news/<topic>/` directory and the associated review/handoff files under
`sources/workflows/`. Preserve original notes and pre-existing unrelated records.
Record changed claims, evidence, before/after hashes, unresolved issues, and
readiness for outlining. Do not invent evidence or draft/publicize content.
After corrections, update the handoff's JSON source references with the
reviewed files' current line ranges and hashes. Run `npm run validate:sources`
to inventory them and `npm run validate:research -- <topic-directory>
<references.json>` to check the handoff. Report failures and keep unresolved
records blocked rather than treating validation as factual verification.

## Final-review mode

Read-only regardless of available tools. Review the approved outline, evidence,
drafts, privacy, and publication boundaries. Report findings and blockers;
never edit files or grant approval on the user's behalf.

Host permissions do not necessarily enforce mode or path boundaries. Where
path-scoped permissions are unavailable, review the complete diff before
accepting changes.
