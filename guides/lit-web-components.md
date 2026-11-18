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

## Component templates and styles

- Components SHOULD place their Lit HTML templates in an adjacent `<component>.template.ts` file, keeping the component class focused on reactive properties, state, lifecycle and behavior.
- A consuming repository MAY define a convention to keep a trivial `render()` inline; triviality MUST NOT prevent extracting its template when the project prefers consistent separation.
- A component's `render()` SHOULD delegate to or compose its template functions, preserving Lit's native rendering, directives, bindings and event behavior.
- Template functions MUST return native Lit template results using `html` and MUST NOT introduce HTML text loading, runtime loaders, extra template compilers or `unsafeHTML` for the purpose of extraction.
- Template functions SHOULD receive explicit typed data and event callbacks; they MUST NOT require passing the entire component instance or exposing private state merely to extract markup.
- Extracted templates MUST remain free of side effects, avoid circular dependencies, and preserve the intended event-handler context.
- Components with their own CSS MUST define component-specific styles in an adjacent `<component>.styles.ts` file, using native Lit `css` results consumed through the component's `static styles`.
- Components without component-specific CSS need no `*.styles.ts` file. Shared style modules MAY be composed through `static styles` without copying their contents into the component class.
- Template and style modules MUST NOT be exposed as package public APIs merely because they were separated from the component implementation.
- Existing components MUST NOT undergo mechanical template or style extraction as an unrelated cleanup; organizational migrations are separate, validated changes.

## Styling and theming

- Native CSS through `static styles` and the `css` tag is the default styling option.
- Every component MUST have a usable default appearance without requiring a consumer-provided theme.
- Design tokens and theming SHOULD use CSS custom properties, especially for values intended to inherit through the component tree.
- Properties SHOULD represent data, state or behavior; visual customization SHOULD prefer CSS custom properties instead of duplicating styling decisions as component properties.
- `::part` and slots are an intentional public surface; internal selectors MUST NOT be exposed for styling.
- CSS custom properties, parts, slots and other documented styling hooks form part of the component's public API and MUST be treated as versioned compatibility surfaces.
- Components MUST NOT depend on global styles or embed external `<link>` stylesheets.
- Existing shared or semantic tokens SHOULD provide defaults when they express the same role, but their presence MUST NOT preclude independent component customization.
- Components MAY expose public CSS custom properties for component-specific typography, dimensions and spacing where independent customization has a demonstrated purpose; MUST NOT expose each internal CSS declaration as a public token.
- Public component tokens MUST identify a meaningful role and only include a size when that distinction is needed; they MUST NOT be generated as an exhaustive matrix of component parts, dimensions, sizes and states.
- A size-specific token for a role MUST NOT use another size's token for that same role as its fallback, even when their defaults happen to match.
- Component tokens MAY fall back to a matching shared semantic token or directly to an internal baseline when no shared token expresses that role.
- Different roles MAY have different defaults; supporting roles MAY intentionally remain fixed across size presets when that is their defined behavior.
- Internal proportions and derived dimensions MAY remain private instead of expanding the component's public token API.
- Every new public token MUST be documented and tested for explicit override, absent override, fallback behavior and isolation from unrelated parts, sizes and components.
- Theme inheritance, token precedence, concrete token names, prefixes, size catalogs and supported theme combinations belong to the consuming library's architecture and documentation.
- SCSS is not part of the initial standard; it MAY only be adopted through a repository-specific decision as a build step producing Lit-compatible CSS with no Sass runtime dependency.

## Tests and documentation

- Tests MUST run in a real browser and cover the public contract, rendering, events, slots, accessibility and resource cleanup.
- Tests MUST NOT couple to private DOM or rely on extensive snapshots.
- Each component MUST document its usage, public API, component dependencies, slots, events, tokens and parts, states, and accessibility considerations.
- Bundler choice, supported browsers, polyfills, the concrete element prefix, package/entrypoint layout, registration strategy, theme catalog and demo tooling belong to the consuming repository's architecture or operations documentation.
