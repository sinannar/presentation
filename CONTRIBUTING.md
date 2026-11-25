# Contributing

Thank you for helping improve the presentation template. Issues and pull
requests in this repository should focus on the reusable template, its starter
presentation, documentation, or agent tooling. For a presentation created
from this template, use that repository's own contribution process instead.

## Propose a change

Use the bug, feature, or documentation issue form to describe your change.
For larger changes, discussing the approach in an issue before implementation
helps keep it aligned with the template's scope in [PRODUCT.md](PRODUCT.md).
Issues, pull requests, screenshots, and their history are public: do not
include secrets, remote pairing codes, private notes, or sensitive data.

## Set up locally

Install Node.js 22.23.4 or newer and run:

```sh
npm ci
npm run dev
```

See the [README](README.md) for the full command list and
[AGENTS.md](AGENTS.md) for agent and content-authoring rules. Edit source
files rather than generated `dist/` output. Preserve existing behavior and
keep changes focused.

## Validate and submit

Run the checks relevant to your change. For application or content changes,
start with:

```sh
npm run check
npm test
npm run build
npm run test:production
```

The Pages workflow also checks a project base path. To reproduce it locally:

```sh
ASTRO_BASE=/sample-presentation npm run build
ASTRO_BASE=/sample-presentation npm run test:production
```

For visual or interactive changes, check keyboard access, responsive layout,
and reduced motion where applicable. Include sanitized screenshots when they
help reviewers, and report checks you could not perform. For factual content,
follow the source-grounded, human-approved [authoring workflow](docs/authoring.md).
Never include raw private inputs in published content; bundled speaker notes
are public. A successful build does not verify factual accuracy.

Open a pull request describing the change, linking any related issue, and
listing validation results. Reviewers may request changes before merging.

## Repositories created from this template

Issue forms, the pull request template, and this guide are copied into new
repositories made using **Use this template**. Their owners should adapt or
remove them to suit their own presentation and contribution process.
