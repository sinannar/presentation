---
name: keynote-customization
description: Customize the built-in keynote's content, theme, styling, motion, components, and features without replacing it.
---

# Keynote customization

Use this skill for visual, interaction, or presentation-structure changes.
Do not impose a source-outline gate when the request does not change factual
copy. For factual authoring, combine this skill with `source-grounding`,
`outline-approval`, and `markdown-authoring`.

## Workflow

1. Inspect the existing implementation:
   - `src/scripts/keynote.ts` for scenes, controls, and behavior;
   - `src/styles/keynote.css` and `src/styles/global.css` for theme and layout;
   - the relevant Astro page and `site.config.ts` for composition and navigation.
2. Identify the smallest extension point. Prefer existing scene data, CSS
   variables, components, and controls over a parallel implementation.
3. Preserve keyboard navigation, focus visibility, semantic structure, and
   `prefers-reduced-motion`. Check contrast and keep the presentation usable on
   narrow screens.
4. Validate with the smallest relevant command, normally `npm run check` for
   application changes. Do not commit, publish, or deploy automatically except
   for scoped local promotion and opt-in checkpoints by news-agent autopilot.

Plan configurable category/section groups and highlights using the existing
`featured` flag, without a fixed item count. Optional incremental reveals and
per-scene speaker notes use the fields in `docs/content-model.md`. Bundled speaker notes are public:
never put sensitive data or raw notes there. Curate factual notes and reveals
through source mapping and publication review, with human outline approval in
manual mode or a recorded decision in explicitly requested news-agent autopilot.
Presenter-specific details are stored locally.

Preserve the searchable map and presenter workflows, including `R` for
remote, `M` and `G` map, `P` presenter, `N` notes, `E` details, `F` user-initiated
fullscreen, and `?` help. Test implemented interactions, including focus and
keyboard behavior; don't claim unverified behavior or external systems are live,
or that fullscreen happens automatically.

## Hands-on examples

**Change the theme:** adjust existing color/type tokens in
`src/styles/keynote.css`, then check contrast and reduced-motion behavior.

**Add a scene:** follow the scene shape and transition handling in
`src/scripts/keynote.ts`; add claims only from a reviewed factual brief.

**Change interaction:** reuse existing controls and focus behavior; verify
Arrow keys, Home, and reduced motion rather than adding a second controller.

Report exact files changed, the command run, and remaining visual checks.
