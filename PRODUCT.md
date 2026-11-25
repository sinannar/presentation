# Product scope

This repository is a reusable, one-site-per-repository keynote template. It starts with a working example presentation that agents adapt using Markdown and plain-text notes.

## Version 1 includes

- A styled, keyboard-navigable keynote at `/`, with optional fullscreen and `?` help.
- Content-driven section and highlights overviews, a searchable scene map, and optional progressive reveals.
- A presenter window, local presenter details, public speaker notes, swipe and clicker navigation, and blackout controls.
- Opt-in phone or tablet remote control through an encrypted public-relay connection.
- Supporting `/docs/` and `/news/` pages.
- Agent-assisted changes to the existing presentation's content, theme, styling, animations, and components.
- Curated Markdown content with validated frontmatter.
- Local `.md` and `.txt` source inventory.
- Agent-directed web research, reviewed source-news handoffs, and an
  optional curated presentation order. Web access depends on the chosen host.
- Source-grounded, human-approved authoring workflow.
- Agent-neutral roles and skills plus GitHub Copilot agent profiles.
- GitHub Pages build and deployment.

## Version 1 excludes

PDF/DOCX/PPTX ingestion, scheduled crawling, autonomous background research,
databases, logins, CMS editing, and hosted model services.

## Publication boundary

`sources/` holds research and workflow artifacts; generated `sources/news/` and `sources/workflows/` are trackable. Only intentional content under `src/content/` and public assets are built. Bundled speaker notes are public. A file being ignored by Git is not a privacy guarantee.
