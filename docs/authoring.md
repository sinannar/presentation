# Authoring workflow

## 1. Intake

Place Markdown or plain-text notes under `sources/`. Keep the original files unchanged. Run `npm run validate:sources` to confirm which files are available.

## 2. Prepare

Use `.agents/skills/source-grounding/SKILL.md` and `.agents/skills/outline-approval/SKILL.md`. The agent should create a source inventory and a proposed outline in `authoring/`. Each claim should point to a file-qualified source range and content hash.

## 3. Approve the outline

A person approves the audience, section order, included sources, and explicit omissions. Approval is a workflow record, not a feature of the static site. Do not proceed to authoring when a source conflict or missing input is unresolved.

## 4. Author

Use `.agents/skills/markdown-authoring/SKILL.md` or edit `src/content/docs/*.md` and `src/content/news/*.md` directly. Write concise public copy; do not paste entire source paragraphs. Keep `sourceRefs` useful for local review, but do not render private filenames as public links. Ask the presentation editor to adapt the existing keynote's visual design and behavior as needed.

## 5. Review and publish

Use the publication reviewer, then run `npm run check` and `npm run build`. Review the generated site on desktop and mobile. A successful build validates structure, not truth. Publish only after a person approves the reviewed changes.
