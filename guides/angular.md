# Angular guide

## Purpose

Keep Angular applications and libraries composable, testable, accessible and explicit about presentation, client-domain logic, reactive state and remote contracts.

## Framework and structure

- Use the Angular version and tooling pinned by an established repository.
- New repositories SHOULD start on a currently supported Angular release compatible with their toolchain.
- Framework or major dependency upgrades MUST be separate changes unless strictly required by the requested work.
- Prefer established repository patterns before adding a new state, form, styling or composition approach.
- Standalone components, directives, pipes, routes and provider APIs SHOULD be preferred for new code.
- New declarations SHOULD NOT be put in an `NgModule` solely for organizational grouping.

## Components and state

- Components SHOULD focus on presentation, user interaction and view-local state.
- Prefer signals for synchronous component-local reactive state and `computed` for derived state when supported by the repository.
- Use `effect` for genuine imperative side effects, not as a default state-propagation mechanism.
- Observable streams remain appropriate for asynchronous streams, subscriptions and long-lived reactive sources.
- Inputs and outputs form a public component API and SHOULD be minimal and explicit.
- Template expressions SHOULD remain simple.
- Low-level remote access SHOULD remain behind an established service, client or SDK boundary.
- State MUST have a clear owner.
- A new state-management or reactive library MUST NOT be introduced without an explicit architectural decision.
- Long-lived resources and subscriptions MUST have a cleanup path.

## Boundaries and reuse

- Reusability MUST be based on demonstrated shared behavior or a stable abstraction.
- Extraction MUST remove consumer-specific naming, assumptions and side effects.
- Similar-looking components MUST NOT be merged when their behavior, lifecycle or ownership differs materially.
- Remote/domain contract types SHOULD live at the client/domain boundary that owns them.
- UI-only view models, form state and presentation configuration SHOULD remain in the UI layer.
- Presentation code MUST NOT bypass an established client/service boundary merely for convenience.

## Routing, styling and tests

- Feature routes SHOULD own feature-specific composition.
- Existing lazy-loading boundaries SHOULD be preserved unless deliberately changed.
- Navigation changes MUST consider authorization, guards and deep links.
- Existing design tokens and primitives SHOULD be reused before one-off values.
- Interactive UI MUST preserve keyboard access, focus behavior, labels and semantic roles.
- Component tests SHOULD focus on rendering and interaction behavior.
- Service tests SHOULD focus on state transitions, transformations and integration contracts.
- End-to-end tests SHOULD cover critical user flows rather than duplicate all lower-level tests.
