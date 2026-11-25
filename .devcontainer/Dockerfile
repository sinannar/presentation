FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

# The npm-installed CLIs are pinned; Claude Code follows Anthropic's latest apt channel.
ARG COPILOT_VERSION=1.0.115
ARG CODEX_VERSION=0.172.0
ARG OPENCODE_VERSION=2.4.1

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && install -d -m 0755 /etc/apt/keyrings \
    && curl -fsSL https://downloads.claude.ai/keys/claude-code.asc -o /etc/apt/keyrings/claude-code.asc \
    && test "$(gpg --show-keys --with-colons /etc/apt/keyrings/claude-code.asc | awk -F: '$1 == "fpr" {print $10}')" = "31DDDE24DDFAB679F42D7BD2BAA929FF1A7ECACE" \
    && echo "deb [signed-by=/etc/apt/keyrings/claude-code.asc] https://downloads.claude.ai/claude-code/apt/latest latest main" > /etc/apt/sources.list.d/claude-code.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends claude-code \
    && npm install -g "@github/copilot@${COPILOT_VERSION}" "@openai/codex@${CODEX_VERSION}" "@opencode/cli@${OPENCODE_VERSION}" \
    && rm -rf /var/lib/apt/lists/*

USER node
