# Lit guide

## Purpose

Define reusable conventions for interoperable Web Components built with `LitElement`, complementary to the TypeScript/JavaScript guide. HTML and CSS have no standalone guides; their rules live here as applied to Lit components.

## Elements and public API

- Custom element names MUST be stable and use a prefix owned by the library.
- Public APIs SHOULD be small and explicit through properties, attributes, slots, methods and events.
- Shadow DOM is the default rendering root; light DOM MUST only result from an explicit architectural decision.
- Properties form the public API; internal state MUST remain private.
- Attribute reflection MUST only be used when the attribute carries HTML semantics.
- One decorator and configuration style MUST be used per repository.
- A new shared component MUST NOT be introduced when an existing native element or established component already covers the behavior.

## Rendering and events

- Native semantic HTML MUST be preferred over recreating controls with `div`.
- Interactive components MUST preserve keyboard access, focus behavior, accessible names, disabled states and semantic roles.
- Slots SHOULD carry consumer-provided content; ARIA MUST only be added when native semantics are insufficient.
- Standard events MUST be used when one exists.
- Custom events MUST be typed and use `bubbles` and `composed` only when they must cross the Shadow DOM.
- Listeners, observers and resources MUST be cleaned up in the component lifecycle.
- Side effects MUST NOT live in `render`.
- Untrusted content MUST NOT be rendered through `unsafeHTML`, and untrusted values MUST NOT be passed to `unsafeCSS`.

## Styling

- Native CSS through `static styles` and the `css` tag is the default styling option.
- Design tokens and theming SHOULD use CSS custom properties.
- `::part` and slots are an intentional public surface; internal selectors MUST NOT be exposed for styling.
- Components MUST NOT depend on global styles or embed external `<link>` stylesheets.
- Existing design tokens SHOULD be reused before one-off values.
- SCSS is not part of the initial standard; it MAY only be adopted through a repository-specific decision as a build step producing Lit-compatible CSS with no Sass runtime dependency.

## Tests and documentation

- Tests MUST run in a real browser and cover the public contract, rendering, events, slots, accessibility and resource cleanup.
- Tests MUST NOT couple to private DOM or rely on extensive snapshots.
- Each component MUST document its usage, public API, slots, events, tokens and parts, states, and accessibility considerations.
- Bundler choice, supported browsers, polyfills, the concrete element prefix and demo tooling belong to the consuming repository's operations documentation.
