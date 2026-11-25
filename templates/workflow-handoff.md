# Workflow handoff

- Topic and scope:
- Current stage and next role:
- Brief, research records and review report paths:
- Input file paths and SHA-256 hashes:
- Outputs and unresolved blockers:
- Proposed outline revision and path:
- Explicit human outline approval, scope and approved revision:
- Draft files and publication review findings:
- Explicit human publication approval and exact approved files:

Approval entries are human workflow records, not authentication.

For an explicitly requested `news-agent` autopilot run, keep structured stage
state in `sources/workflows/<topic>/news-run.json` using
`templates/news-run-state.json`. Record the request and decisions rather than
inventing outline or publication approvals. State is not authorization; a new
session needs an explicit user request to resume.
