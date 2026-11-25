# Dev Container and Codespaces

The Dev Container provides Node.js 24 and the `copilot`, `claude`, `codex`, and
`opencode` CLIs. It runs `npm ci` after creating the workspace and forwards
port 4321. It does not configure model providers, sign in, or grant permissions.

## GitHub Codespaces

1. Create your own repository with **Use this template**. In that repository,
   select **Code → Codespaces → Create codespace on [branch]**.
2. Wait for the container build and `npm ci` to finish, then open a terminal in
   the workspace. Codespaces checks out the repository in the cloud; no local
   clone or local Docker installation is needed.
3. Start the preview with `npm run dev -- --host 0.0.0.0` and open the
   forwarded port from the Ports tab. Stop the server with Ctrl+C.

## Local Dev Container

Install Docker or another compatible container runtime, VS Code, and the
Microsoft Dev Containers extension. Clone your generated repository, open its
folder in VS Code, and run **Dev Containers: Reopen in Container**. After
creation, use the same preview command above and open the forwarded port.
Local containers still require a local checkout and a running container engine.

## Sign in and test

From the repository root, start the CLI you want: `copilot`, `claude`, `codex`,
or `opencode`. Follow that product's interactive sign-in or provider setup.
Accounts, access, subscriptions, API keys, and usage charges are separate;
installing the CLIs does not provide model access. Do not put credentials in
the repository, image, Dockerfile, or committed configuration. Review each
tool's permission prompts; the container does not enable approval bypass.

See [agent compatibility](agent-compatibility.md) for host-specific discovery
and smoke tests, including Claude and Codex. Availability of a CLI does not
guarantee that its agents or skills are discovered.

## Versions and updates

The Dockerfile installs the latest npm releases of Copilot, Codex, and OpenCode
and uses Anthropic's signed latest apt channel for Claude Code. Rebuild the
container without cache to fetch current CLI releases, then repeat the smoke
tests. Versions and behavior can change between builds; OpenCode discovery and
permissions should be verified in particular. The Node 24 base image tag can
also change: pull the base image to refresh it. Changes made inside a container
outside the workspace may be lost on rebuild.

## Privacy

Codespaces stores the checkout and working files on GitHub's infrastructure;
usage may incur Codespaces and provider charges. Forwarded ports have their own
visibility settings: keep the preview private unless you intend to share it.
Generated files in `sources/news/` and `sources/workflows/` are trackable.
Other files under `sources/` are Git-ignored but not automatically private:
placing notes in a Codespace uploads them to that cloud workspace, and agents
may send accessed content to their configured providers. Only use notes you are
authorized to place there and share with the selected provider. Review data
handling and retention before using sensitive material.
