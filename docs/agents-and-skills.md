# From research to a presentation

Choose [news-agent autopilot](../README.md#one-agent-autopilot) for a single
skills-driven run, or the manual flow **Source researcher → Publication reviewer → Outline
planner → Presentation editor**. Each agent has a role; skills are reusable
procedures that guide a role. You can use one session, or hand files between
sessions. Agents adapt the existing keynote instead of replacing the site.
The [README](../README.md#agent-workflow) has four concise prompts.

## Agents

| Agent | Purpose | Example prompt |
| --- | --- | --- |
| [News agent](../.agents/roles/news-agent.md) | Run research, self-verification, outline, editing and local validation without approval pauses when explicitly requested. | “Use news-agent autopilot for [event], [dates], [audience]; prepare a local site without deploying.” |
| [Source researcher](../.agents/roles/source-researcher.md) | Search the web when requested, verify sources, and create source-news records; or map existing notes. | “Research [event] between [dates] for [audience], write records with evidence under `sources/news/event/`, and flag gaps.” |
| [Publication reviewer](../.agents/roles/publication-reviewer.md) | Independently check and correct generated source-news records, recording changes and unresolved issues. In optional final-review mode, review the site without edits. | “Review `sources/news/event/` against original sources; correct supported errors and write a review log. Do not edit the site.” |
| [Outline planner](../.agents/roles/outline-planner.md) | Select and order reviewed stories with evidence, then stop for human approval. | “Plan sections and scene order from the reviewed news and report omissions. Stop for my approval.” |
| [Presentation editor](../.agents/roles/presentation-editor.md) | Turn the approved outline into draft content and adapt the existing keynote. | “Create drafts from approved outline revision [ID], configure the deck order, and report checks; do not publish.” |

Review instructions are not a security sandbox. Hosts differ in tool
permissions: source review needs web and limited write access, while the
planner may write the proposed outline and handoff only; final review should
be read-only where available. Review tool
requests and use the smallest available permissions. Profiles and skills may
not be discovered identically in every host; see
[compatibility](agent-compatibility.md). When a profile is unavailable, ask the
agent to read the matching canonical role and skill files directly.

## Skills

| Skill | Purpose | Example prompt |
| --- | --- | --- |
| [news-orchestration](../.agents/skills/news-orchestration/SKILL.md) | Coordinate stages, state, resume and optional scoped checkpoints. | “Resume news-agent autopilot for [topic] from the run state; do not commit.” |
| [web-research](../.agents/skills/web-research/SKILL.md) | Find and inspect original sources; create attributed source-news records. | “Use web-research for [event] during [dates]; flag inaccessible sources.” |
| [source-news-review](../.agents/skills/source-news-review/SKILL.md) | Verify and correct generated research records, recording evidence and changes. | “Use source-news-review on `sources/news/event/`; report unresolved claims.” |
| [source-grounding](../.agents/skills/source-grounding/SKILL.md) | Map claims to file-qualified ranges and hashes. | “Build an evidence map; keep private paths in `sources/private/workflows/`.” |
| [outline-approval](../.agents/skills/outline-approval/SKILL.md) | Propose an evidence-backed outline and stop for approval. | “Use outline-approval and wait for approval of the named revision.” |
| [markdown-authoring](../.agents/skills/markdown-authoring/SKILL.md) | Write schema-compatible drafts from an approved outline. | “Draft the approved news with public links and `draft: true`.” |
| [keynote-customization](../.agents/skills/keynote-customization/SKILL.md) | Adapt the existing keynote, theme, components, and interactions. | “Improve contrast and mobile layout without changing factual content.” |
| [publication-boundaries](../.agents/skills/publication-boundaries/SKILL.md) | Separate source notes, drafts, and publishable content. | “Check that private notes and unapproved images are not published.” |
| [asset-validation](../.agents/skills/asset-validation/SKILL.md) | Check toolkit frontmatter and paths. | “Run `npm run validate:agents` and report the result.” |

## Autopilot and manual modes

Explicit autopilot chooses and records a grounded outline and makes eligible
scoped content publishable locally without separate approval pauses. It uses
the other skills directly; self-verification is not an independent review.
Manual specialists retain the outline and publication approval gates below.
Autopilot stops if web access, verified material, safe workspace ownership, or
validation is insufficient. It never deploys, and commits only when opted in
for the run with an exact non-sensitive scope. See the [start, resume and
checkpoint prompts](../README.md#one-agent-autopilot).

Each completed stage records checks and artifact hashes in
`sources/workflows/<topic>/news-run.json` from
[`templates/news-run-state.json`](../templates/news-run-state.json). Run
`npm run validate:news-run -- sources/workflows/<topic>/news-run.json`; this validates
structure and current artifact identity, not facts, rights, authorization or
Git history. Changes invalidate affected stages and their dependents.
Explicitly request resume in every new session. Some hosts manage commits and
cannot guarantee stage-level checkpoints.

## Four-stage manual walkthrough

1. **Start.** Create a repository using the template. Open a
   [Codespace or local Dev Container](devcontainer.md), or use a local Node
   installation. In a Codespace run `copilot`, `claude`, `codex`, or `opencode`
   and complete that tool's own sign-in. Alternatively select custom agents in
   the GitHub repository **Agents** page, if available for your account.
   Give the researcher your scope and audience in the prompt; it can record
   them using [`templates/research-brief.md`](../templates/research-brief.md).
   You do not need to prepare Markdown or TXT notes manually.
2. **Research.** Ask the source researcher for a specific event, date window,
   audience and scope. For example: “Research the official announcements from
   [specific .NET conference and year], [date range], for .NET developers.
   Create one record per story in `sources/news/dotnet/`, with original-source
   URLs for every claim, published date if known, retrieval time, and gaps.
   Record image candidates and rights evidence; don't publish.” Records use
   [`templates/source-news.md`](../templates/source-news.md); preserve original
   user notes. Search snippets alone do not verify a claim. Unavailable tools
   or inaccessible pages must be reported, not invented.
   GitHub documents the `web` tool alias as unavailable to its cloud agent:
   a GitHub web session needs a separately configured, permitted web-access
   capability or user-provided material. A Codespace CLI's available tools
   depend on that host and its configuration. See
   [GitHub custom-agent tools](https://docs.github.com/en/copilot/reference/custom-agents-configuration#tool-aliases).
3. **Review research.** Ask the publication reviewer: “Verify the generated
   records in `sources/news/dotnet/` in source-review mode against the cited pages. Correct supported
   errors there, record before/after hashes, evidence and unresolved issues in
   `sources/workflows/dotnet/`, and update the handoff; do not edit the site.” Use
   [`templates/research-review.md`](../templates/research-review.md). Resolve
   material conflicts before proceeding. A reviewer without web access cannot
   claim independent verification.
4. **Plan.** Ask the outline planner: “Read the reviewed records and review
   report. Propose a named outline with audience, sections, ordered news IDs,
   highlights, image choices, evidence and omissions. Stop for my approval.”
   Save the returned outline if the role cannot write. Explicitly approve the
   specific revision and scope, e.g. “I approve outline revision 2 and its
   listed stories; do not publish.” Record the approval and source hashes in
   [`templates/workflow-handoff.md`](../templates/workflow-handoff.md).
5. **Edit.** Ask the presentation editor: “Use my approval of revision 2 and
   the reviewed evidence to create draft news and adapt the existing keynote
   in the proposed order. Preserve existing work and public citation links;
   report checks and gaps. Do not publish or deploy.” Drafts are excluded from
   the public build. Run `npm run check`, `npm test`, `npm run build`, and
   `npm run test:production`; inspect the preview on desktop and mobile.
   Optionally call the publication reviewer again for a read-only final review.
6. **Approve and preview.** Review the exact draft pages and remaining issues.
   Explicitly approve publication of the chosen pages before removing draft
   flags; rerun checks and build. Start `npm run dev -- --host 0.0.0.0` in a
   Codespace and open the forwarded port. A build verifies structure, not
   factual truth. Deploy only through a separately authorized Git/Pages
   workflow; see [deployment](deployment.md).

Use the handoff file to record stage, source paths and hashes, output paths,
blockers, next role, outline revision, and exact human approvals. A source
change invalidates dependent review and may require a new outline approval.
`npm run validate:sources` inventories source hashes;
`npm run validate:research -- sources/news/dotnet` validates research record
metadata. These checks do not prove facts, rights, or approvals. For automated
stale-reference checks, pass a JSON file containing an array of
`path#L1-L2@sha256:<hash>` references as a second argument:
`npm run validate:research -- sources/news/dotnet sources/workflows/dotnet/references.json`.

## Moving between sessions

Within the same workspace, the next session can read local files directly.
Cloud agents can use separate checkouts. `sources/news/` and
`sources/workflows/` are trackable, but uncommitted files do not travel
between checkouts. Review and sanitize first, then explicitly authorize sharing
the exact non-sensitive files on a branch accessible to the next agent.
Other source paths, including `sources/private/`, remain ignored. Existing
`authoring/` files remain ignored and are not moved automatically. Tracked
files and Git history in a public repository are public, even if later removed.
Do not upload private notes, credentials, or image candidates this way.
GitHub-hosted session behavior, permissions, web access, and handoff availability
vary; inspect each result rather than assuming four background sessions share
state or automatically merge changes.

## Image and privacy boundaries

Use images only when reuse rights and attribution are established. Keep
candidates under ignored `sources/private/assets/`, outside the Markdown/TXT source
inventory. If permission is unclear, record the source link and omit the image.
Only explicitly approved assets belong under `public/images/`; metadata and
human review must preserve credit and the license/permission source. An
attribution field is not proof of permission.

`sources/news/` and `sources/workflows/` are trackable; keep sensitive material
in ignored `sources/private/`, which is not guaranteed private either. A cloud
workspace or model provider may receive files used there. Do not put private
paths or hashes in tracked `sourceRefs` unless approved for publication.
Bundled speaker notes are public even in presenter view. See
[content model](content-model.md), [authoring](authoring.md), and
[Dev Container privacy](devcontainer.md#privacy).
