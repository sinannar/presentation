---
name: asset-validation
description: Validate agent-toolkit frontmatter and repository path references.
---

# Agent asset validation

Run `npm run validate:agents`. It checks required toolkit files, frontmatter,
Markdown links, and repository paths referenced by the toolkit when that
repository command exists. For content changes also run `npm run validate`; for
a full application check run `npm run check`. Report the exact command and
result rather than assuming validation passed. Do not modify the validator,
package manifest, or application source as part of asset-only work.
