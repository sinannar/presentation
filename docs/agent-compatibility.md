# Using different coding agents

The canonical repository instructions are in `AGENTS.md`, role playbooks are
in `.agents/roles/`, and reusable skills are in `.agents/skills/`. Workflows
are the same whether you use an agent or follow them manually. See
[agents and skills](agents-and-skills.md) and [authoring](authoring.md).

## Discovery

| Host | Project instructions | Skills | Named agents |
| --- | --- | --- | --- |
| GitHub Copilot | `AGENTS.md` and `.github/copilot-instructions.md`, subject to host support | `.agents/skills/` | `.github/agents/` |
| Codex | `AGENTS.md` | `.agents/skills/` | `.codex/agents/` |
| Claude Code | `CLAUDE.md` imports `AGENTS.md` | `.claude/skills/` adapters | `.claude/agents/` |
| OpenCode | `AGENTS.md` | `.agents/skills/` | `.opencode/agents/` |
| Cursor | `AGENTS.md` | `.agents/skills/` | `.cursor/agents/` |

These are documented discovery paths, not a claim that every product version,
IDE integration, or cloud environment has been tested. Agent files instruct the
agent to read the matching canonical playbook; Claude skill adapters similarly
ask it to read the canonical skill. These are instructions, not automatic
includes or guarantees of compliance. Claude's `@AGENTS.md` import is distinct:
it loads the referenced instructions using Claude Code's import mechanism.

The Claude skill adapters use the same names and descriptions as the canonical
skills. Hosts that also discover `.claude/skills/` can encounter both copies;
their precedence or selector behavior may vary. OpenCode documents precedence
for `.agents/skills/` over `.claude/skills/`. If duplicate entries appear,
choose the repository skill and confirm the canonical file was read. Do not
edit the adapter as a second source of instructions.

The source researcher writes generated research records and the publication
reviewer may correct those records in source-review mode. The outline planner
may save its proposal and handoff; final-review mode is read-only. Host permissions may not enforce these
path and mode boundaries; Codex custom agents inherit the parent session's
permissions. Review requested actions and select a read-only mode for tasks
that do not require writes. No adapter pins a model, configures MCP, or
authorizes a commit, deployment, or access to private inputs. Explicit
`news-agent` autopilot is a skills-first exception to manual content approval
gates, not a bypass for host permission prompts. Commits require separate
per-run opt-in and scope; hosted platforms may control commit behavior.

To smoke-test autopilot discovery, ask the host to identify `news-agent` and
read `.agents/roles/news-agent.md` and `.agents/skills/news-orchestration/SKILL.md`
without starting a run. OpenCode's profile is primary-capable. On hosts that
expose only subagents, ask the main agent to follow those files directly.
Actual tool availability, web access and invocation must be tested separately.

## Smoke test: Claude Code

From the repository root, start a new `claude` session. Use your normal
permissions; do not enable permission bypass.

1. Use `/memory` to check that `CLAUDE.md` and its `AGENTS.md` import loaded.
   Ask Claude to summarize the outline approval and publication rules.
2. Invoke `/outline-approval` and ask it to propose an outline using only
   `examples/sources/example-notes.md`. Tell it not to edit files. Confirm it
   reads `.agents/skills/outline-approval/SKILL.md`, identifies the source,
   presents a proposal, and stops for human approval.
3. Ask Claude to use the `publication-reviewer` subagent to review the
   repository's publication boundaries without editing files. Confirm the
   agent reads `.agents/roles/publication-reviewer.md` and reports findings.
   If the agent cannot run checks, provide results from the main session.

If a skill or agent is missing, restart the session, check the project path and
your Claude settings, and inspect `/skills` or `/agents`. Imports and adapters
may behave differently in cloud sessions. No real notes are needed for this test.

## Smoke test: Codex

From the repository root, start a new `codex` session in a read-only
permission mode if available.

1. Ask Codex to summarize the repository's outline approval and publication
   rules and identify the instruction file it used.
2. Use `/skills` or type `$` to select `outline-approval`. Ask for an outline
   using only `examples/sources/example-notes.md`, with no edits. Confirm that
   it reads the canonical skill, cites the synthetic input, and stops for human
   approval.
3. Ask Codex to delegate a read-only review of publication boundaries to the
   `publication-reviewer` agent and report the role file used. Inspect the
   subagent activity and confirm it made no edits. If unavailable, check your
   Codex version and project trust settings; read the role directly as a
   fallback. Role instructions alone do not enforce read-only access.

## Smoke test: Copilot, OpenCode, and Cursor

Start a new session at the repository root with your normal permissions. For
each host, ask it to identify its project instructions, use the
`outline-approval` skill on `examples/sources/example-notes.md` without editing
files, and delegate a read-only publication-boundary review to
`publication-reviewer` if the host offers custom agents. Confirm the same
source, canonical skill and role reads, approval stop, and lack of edits as in
the Claude and Codex tests. If the host cannot discover a role or skill, ask it
to read the matching `.agents/` file directly and record the discovery failure
separately.

## Test outcomes and privacy

Discovery, actual invocation, canonical-file reading, approval behavior, and
file changes are separate checks. Record the host version and each result;
do not infer success from the existence of files or a successful build. Use
`git status --short` before and after the test to check for unexpected edits.
Do not commit or publish as part of a smoke test.

Generated `sources/news/` and `sources/workflows/` are trackable; other source
paths including `sources/private/` are ignored. Isolated GitHub cloud
sessions cannot automatically share uncommitted files; the
[workflow guide](agents-and-skills.md#moving-between-sessions) explains
explicitly sharing sanitized handoffs on a branch. Never upload private notes
or credentials implicitly. Tracked files and bundled speaker notes in a
public repository/site are public.

## References

- [Copilot skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) and [custom agents](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills](https://learn.chatgpt.com/docs/build-skills), and [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Claude Code instructions](https://code.claude.com/docs/en/memory), [skills](https://code.claude.com/docs/en/skills), and [subagents](https://code.claude.com/docs/en/sub-agents)
- [OpenCode instructions](https://opencode.ai/docs/instructions/), [skills](https://opencode.ai/docs/skills/), and [agents](https://opencode.ai/docs/agents/)
- [Cursor rules](https://cursor.com/docs/rules), [skills](https://cursor.com/docs/skills), and [subagents](https://cursor.com/docs/subagents)
