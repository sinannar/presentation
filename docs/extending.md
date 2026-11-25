# Extending the template

Add a content category through frontmatter and layout logic before adding a new page family. Keep routes base-aware through `withBase()`.

New skills belong in `.agents/skills/<name>/SKILL.md`. New Copilot agents belong in `.github/agents/<name>.agent.md` and should reference a portable role under `.agents/roles/`. Update `AGENTS.md`, `README.md`, and `docs/agents-and-skills.md` when adding one.

The keynote consumes the same curated docs and news as the supporting pages. Extend its scene rendering without duplicating source facts.
