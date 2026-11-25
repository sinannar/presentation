# Product scope

This repository is a reusable, one-site-per-repository keynote template. It starts with a working example presentation that agents adapt using Markdown and plain-text notes.

## Version 1 includes

- A styled, keyboard-navigable keynote at `/`, with optional fullscreen and `?` help.
- Supporting `/docs/` and `/news/` pages.
- Agent-assisted changes to the existing presentation's content, theme, styling, animations, and components.
- Curated Markdown content with validated frontmatter.
- Local `.md` and `.txt` source inventory.
- Source-grounded, human-approved authoring workflow.
- Agent-neutral roles and skills plus GitHub Copilot agent profiles.
- GitHub Pages build and deployment.

## Version 1 excludes

Presenter mode, remote control, PDF/DOCX/PPTX ingestion, web crawling, automatic research, databases, logins, CMS editing, and hosted model services.

## Publication boundary

`sources/` and `authoring/` are local working areas. Only intentional content under `src/content/` and public assets are built. A file being ignored by Git is not a privacy guarantee.
