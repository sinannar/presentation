---
name: web-research
description: Gather current web evidence into traceable source-news records when web tools are available.
---

# Web research

1. Treat the user's topic and scope as the research prompt. Do not require
   manually prepared Markdown/TXT notes: web research is the default for
   requested current news, with bring-your-own notes optional.
2. Read `AGENTS.md` and `templates/research-brief.md`,
   `templates/source-news.md`, and `templates/workflow-handoff.md`.
3. Confirm the user's topic, date window, breadth, authorized source-news
   directory (`sources/news/<topic>/`), and any local input paths. Preserve
   existing source notes and records. Create a safe topic directory when
   needed; do not broaden beyond the prompt or overwrite records.
4. Use only search/fetch tools actually exposed by the active runtime. If no
   suitable web capability is available, say so in the handoff and state that
   the web request is unfulfilled. Do not invent tool names, simulate browsing,
   replace current research with model memory, or silently fall back to local
   notes alone.
5. Prefer primary, authoritative sources; use independent corroboration for
   material claims where practical. Record publisher, title, URL, publication
   date when verifiable, and retrieval time. Summarize in original language;
   distinguish reporting, analysis, uncertainty, and conflicting accounts.
6. For each relevant image candidate, capture source URL, creator when known,
   accurate alt text, proposed credit, license/permission URL, and approval
   status in the record's `images` metadata. Use `approved: false` until the
   user explicitly approves reuse and publication. Never infer rights. If
   rights are unclear, record only the source link and rights gap: do not
   download or publish it. Download only after verifying reuse permission and
   explicit user authorization; keep permitted candidate files under ignored
   `sources/private/assets/`, outside `sources/news/` and the Markdown/TXT source
   inventory. Candidate assets are not public content.
7. Save generated records only in the authorized
   `sources/news/<topic>/`, following `templates/source-news.md`. Save the
   non-sensitive claim map, gaps, brief, and handoff under `sources/workflows/`.
   These paths are trackable; keep private details in `sources/private/workflows/`.
   Keep image candidate files and JSON metadata out of the inventoried
   source-news directory; it is scanned for Markdown/TXT records.
8. Create `sources/workflows/<topic>/research-references.json` as a JSON array of
   exact source-news record references, including line ranges and full SHA-256
   hashes, such as
   `sources/news/<topic>/<record>.md#L1-L8@sha256:<hash>`. Include its path in
   the workflow handoff and run:

   ```sh
   npm run validate:research -- sources/news/<topic> sources/workflows/<topic>/research-references.json
   ```

   Report the exact result. The command checks record metadata and reference
   integrity, not factual accuracy, source trust, or image rights.
9. In the research stage do not draft public presentation copy, edit original
   notes, approve an outline, publish, commit, or deploy. In the manual
   workflow hand off to `publication-reviewer` in `source-review` mode; in
   explicit news-agent autopilot continue with the source-review skill directly.

Original notes and private working outputs are Git-ignored, not confidential.
Generated records and workflow outputs are trackable but are not shared across
checkouts until committed and made available on an accessible branch.
