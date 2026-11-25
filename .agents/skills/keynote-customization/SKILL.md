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
   `prefers-reduced-motion`. Keep the presentation usable on narrow screens.
4. Validate with the smallest relevant command, normally `npm run check` for
   application changes. Do not commit, publish, or deploy automatically.

## Hands-on examples

**Change the theme:** adjust existing color/type tokens in
`src/styles/keynote.css`, then check contrast and reduced-motion behavior.

**Add a scene:** follow the scene shape and transition handling in
`src/scripts/keynote.ts`; add claims only from an approved factual brief.

**Change interaction:** reuse existing controls and focus behavior; verify
Arrow keys, Home/End, and reduced motion rather than adding a second controller.

Report exact files changed, the command run, and remaining visual checks.
