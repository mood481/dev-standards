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

## Composition and dependencies

- Components SHOULD be independently consumable; importing one component MUST NOT require consumers to import or register the whole library unless that is an explicit repository-level distribution decision.
- A composite component that needs behavior already provided by another component in the same library SHOULD compose that public component rather than duplicate its markup, styles or interaction contract.
- Component-to-component dependencies MUST use public package or component entrypoints and MUST NOT rely on private implementation imports.
- Cyclic component dependencies MUST NOT be introduced.
- Transitive dependencies needed by a selected component MAY be loaded or registered with it when required for correct behavior.
- Framework adapters MAY wrap Web Components, but the core component contract MUST NOT depend on Angular, React, Vue or another consumer framework.
- Public component APIs SHOULD be expressible with web-platform primitives: properties, attributes, methods, events, slots, CSS custom properties and parts.
- Lit-specific implementation types and lifecycle details MUST NOT leak into the consumer-facing contract unless they are intentionally part of the library API.

## Rendering and events

- Native semantic HTML MUST be preferred over recreating controls with `div`.
- Interactive components MUST preserve keyboard access, focus behavior, accessible names, disabled states and semantic roles.
- Components acting as form controls SHOULD preserve native form semantics and SHOULD use form-associated custom element capabilities such as `ElementInternals` when appropriate.
- Slots SHOULD carry consumer-provided content; ARIA MUST only be added when native semantics are insufficient.
- Standard events MUST be used when one exists.
- Custom events MUST be typed and use `bubbles` and `composed` only when they must cross the Shadow DOM.
- Listeners, observers and resources MUST be cleaned up in the component lifecycle.
- Side effects MUST NOT live in `render`.
- Untrusted content MUST NOT be rendered through `unsafeHTML`, and untrusted values MUST NOT be passed to `unsafeCSS`.

## Styling and theming

- Native CSS through `static styles` and the `css` tag is the default styling option.
- Every component SHOULD have a usable default appearance without requiring a consumer-provided theme.
- Design tokens and theming SHOULD use CSS custom properties, especially for values intended to inherit through the component tree.
- Properties SHOULD represent data, state or behavior; visual customization SHOULD prefer CSS custom properties instead of duplicating styling decisions as component properties.
- `::part` and slots are an intentional public surface; internal selectors MUST NOT be exposed for styling.
- CSS custom properties, parts, slots and other documented styling hooks form part of the component's public API and MUST be treated as versioned compatibility surfaces.
- Components MUST NOT depend on global styles or embed external `<link>` stylesheets.
- Existing design tokens SHOULD be reused before one-off values.
- Theme inheritance, token precedence, concrete token names and supported theme combinations belong to the consuming library's architecture and documentation.
- SCSS is not part of the initial standard; it MAY only be adopted through a repository-specific decision as a build step producing Lit-compatible CSS with no Sass runtime dependency.

## Tests and documentation

- Tests MUST run in a real browser and cover the public contract, rendering, events, slots, accessibility and resource cleanup.
- Tests MUST NOT couple to private DOM or rely on extensive snapshots.
- Each component MUST document its usage, public API, component dependencies, slots, events, tokens and parts, states, and accessibility considerations.
- Bundler choice, supported browsers, polyfills, the concrete element prefix, package/entrypoint layout, registration strategy, theme catalog and demo tooling belong to the consuming repository's architecture or operations documentation.
