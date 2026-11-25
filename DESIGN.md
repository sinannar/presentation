# Design system

The starter uses a dark, editorial visual system inspired by presentation sites without copying event branding.

- Use one dominant background, one readable text color, one muted text color, and a small accent palette.
- Keep headings short and high contrast. Use whitespace and cards instead of decorative title rules.
- Use semantic headings in order and visible keyboard focus.
- Keep cards useful on touch screens; do not make hover the only way to discover state.
- Preserve `prefers-reduced-motion` and readable content without JavaScript.
- Keep body copy around a comfortable reading width and use responsive grids rather than fixed presentation coordinates.
- Put visual changes in `src/styles/global.css` and identity changes in `site.config.ts`; do not encode event-specific styling in content entries.

Before publishing a customization, check a desktop viewport, a narrow mobile viewport, keyboard navigation, and a no-JavaScript page load.
