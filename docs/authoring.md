# Authoring workflow

For web research and the four-agent sequence, see the
[end-to-end guide](agents-and-skills.md). Researcher-generated news in
`sources/news/` is working evidence, not a published news page. A reviewer
may correct those generated records and record changes; original user notes
remain unchanged. Separate sessions require accessible handoff files and
explicit permission before sharing ignored material.

The steps below describe **manual mode**. Explicit
[news-agent autopilot](../README.md#one-agent-autopilot) selects and records its
own evidence-backed outline and can make eligible scoped content publishable
locally without separate approval pauses. It does not deploy; commits and
image reuse require separate authorization. Verification by the same agent is
not independent review.

## 1. Intake

Place original Markdown or plain-text notes under ignored `sources/private/`.
Keep the original files unchanged. Run `npm run validate:sources` to confirm
which files are available; it excludes workflow artifacts and candidate assets.

## 2. Prepare

Use `.agents/skills/source-grounding/SKILL.md` and `.agents/skills/outline-approval/SKILL.md`. The agent should create a source inventory and a proposed outline in `sources/workflows/`. Each claim should point to a file-qualified source range and content hash.

## 3. Approve the outline

A person approves the audience, section order, included sources, and explicit omissions. Approval is a workflow record, not a feature of the static site. Do not proceed to authoring when a source conflict or missing input is unresolved.

Propose configurable category/section groups and their ordering based on the
story, not a fixed item count. Identify highlights with the existing `featured`
flag. Include incremental reveals and curated scene speaker notes
in the outline and evidence map when they contain factual material.

## 4. Author

Use `.agents/skills/markdown-authoring/SKILL.md` or edit `src/content/docs/*.md` and `src/content/news/*.md` directly. Write concise public copy; do not paste entire source paragraphs. Keep private source mappings in ignored `sources/private/workflows/`. Only put a path or hash in a tracked `sourceRefs` field if it is approved for publication: tracked frontmatter is public in a public repository even when the site does not render it. Ask the presentation editor to adapt the existing keynote's visual design and behavior as needed.

The optional scene fields are described in [the content model](content-model.md).
Speaker notes
bundled in the site are public, including in presenter views. Never include sensitive data or raw
notes; curate and review notes and reveals as public content. Presenter-specific
details are stored locally, not in bundled speaker notes.

## 5. Review and publish

Use the publication reviewer, then run `npm run check` and `npm run build`. Review the generated site on desktop and mobile. A successful build validates structure, not truth. Publish only after a person approves the reviewed changes.

Review accessible group navigation, searchable map and
presenter workflows, optional reveals and notes, keyboard/focus behavior,
contrast, and reduced motion. Check shortcut behavior and remote separately;
report what was actually tested rather than assuming any feature works.
