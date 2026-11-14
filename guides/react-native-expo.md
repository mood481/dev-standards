# React Native + Expo guide

## Purpose

Keep React Native applications built with TypeScript and Expo composable, predictable across platforms, and explicit about presentation, application logic and native capabilities.

This guide complements `ts-js`, which remains the general TypeScript design standard. Consumers SHOULD install both guides explicitly; the dev-standards CLI does not resolve dependencies between guides. React components and hooks follow React's functional model rather than the class preference for service and domain boundaries in `ts-js`.

## Framework and structure

- Use the Expo SDK, React Native and TypeScript versions pinned by the consuming repository.
- New projects SHOULD start on a supported Expo SDK and compatible React Native/toolchain versions.
- Major framework or native dependency upgrades MUST be separate changes unless required by the requested work.
- Organize application code around cohesive features and clear ownership; keep public APIs intentional.
- Screens and route components SHOULD coordinate presentation and navigation rather than own substantial business logic, persistence or low-level HTTP access.
- Application operations, remote clients, persistence and platform integrations SHOULD have explicit boundaries independent of screen rendering.
- Prefer composition for sharing behavior. Services and adapters SHOULD use classes when they own dependencies, state, invariants or a related set of operations, following `ts-js`.

## Components, hooks and state

- Prefer functional components and hooks for React presentation and lifecycle behavior; do not introduce class components for new code without a compatibility reason.
- Components SHOULD keep rendering, user interaction and view-local state cohesive; complex non-UI operations SHOULD live behind application or service boundaries.
- Hooks SHOULD encapsulate React-specific state, effects or subscriptions, not become generic containers for business logic that can run independently of React.
- State MUST have a clear owner. Keep state local until real sharing or cross-screen lifetime justifies lifting it.
- Derived state SHOULD be calculated from its inputs instead of redundantly stored or synchronized through effects.
- Effects MUST be reserved for synchronization with external systems and MUST clean up owned resources, listeners and subscriptions.
- State management, remote-cache, styling and form libraries MUST NOT be introduced without an established project need or architectural decision.

## Navigation

- New Expo applications SHOULD prefer Expo Router unless the project has a justified alternative.
- Existing navigation conventions SHOULD be preserved rather than adding a competing routing model.
- Navigation parameters and deep links SHOULD have explicit, validated contracts; do not treat route inputs as trusted application data.
- Changes to navigation MUST consider authentication, back behavior, initial navigation and platform-specific deep links.
- Route files SHOULD stay focused on navigation composition; feature logic belongs outside the route tree.

## Native capabilities and platforms

- Native modules and third-party packages MUST be checked for compatibility with the project's Expo SDK, React Native version and supported platforms before adoption.
- Permissions MUST be requested deliberately and explained in the application; request only capabilities the feature uses.
- Keep platform-specific behavior behind a focused adapter when implementations materially differ.
- When using Expo prebuild or Continuous Native Generation, native customization MUST be reproducible from app configuration, config plugins or owned native modules; do not rely solely on edits to regenerated `ios/` or `android/` files.
- Do not assume Expo Go supports a native module or configuration change; validate native-dependent features in a suitable development build.
- Secrets MUST NOT be embedded in client bundles, public Expo configuration or committed native settings.

## Data and application lifecycle

- Remote requests SHOULD pass through an owned client or service boundary; HTTP contracts and domain models SHOULD remain distinct from view state.
- Loading, empty, error and retry behavior SHOULD be deliberate, including interrupted connectivity when relevant.
- Persist only what the application needs; credentials and sensitive values MUST use platform-appropriate secure storage.
- Long-running work, foreground/background transitions and asynchronous effects MUST define cancellation, cleanup and error handling where applicable.

## Testing and quality

- Prefer Jest and React Native Testing Library for component, hook and interaction tests; use the appropriate Expo Jest preset when needed.
- Tests SHOULD focus on observable behavior, user interaction and application contracts rather than private implementation details or snapshots alone.
- Services and domain operations SHOULD be testable without mounting React components.
- Native APIs SHOULD be mocked narrowly in unit tests and validated with platform-aware integration or device/simulator tests where behavior depends on native execution.
- End-to-end tooling and coverage expectations belong to the consuming project; critical cross-platform user flows SHOULD be exercised on supported platforms.
- Interactive screens MUST consider accessibility labels, touch targets, focus/assistive technology behavior and system appearance settings.

## Build and delivery boundaries

- Application configuration, native capabilities and environment-specific variants MUST be explicit and reproducible.
- The project MUST define ownership of native builds, code signing, distribution, and over-the-air update compatibility in its operational documentation.
- No CI/CD, build, store submission or update service is mandated by this guide. Expo SDK usage does not imply using EAS Build or EAS Update.
