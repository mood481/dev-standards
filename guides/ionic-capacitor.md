# Ionic + Capacitor guide

## Purpose and scope

Keep Ionic interfaces and Capacitor applications coherent across supported web and native platforms, with explicit boundaries between framework UI, application logic, native capabilities and distribution.

The shared guidance is framework-agnostic: Ionic Core works with JavaScript or framework integrations such as Angular, React and Vue; Capacitor can be integrated with a web application independently of its UI framework. The Angular profile below applies only to applications using `@ionic/angular`. This guide complements `ts-js` where TypeScript is used and `angular` where Angular is used; consumers MUST select companion guides explicitly because the dev-standards CLI does not resolve dependencies.

This guide does not require Angular, RxJS, any particular router, design system, package manager or CI/CD provider.

## Framework and platform baseline

- Projects MUST pin and maintain compatible versions of Ionic, Capacitor core and CLI, native platform packages, plugins, and the selected web framework/toolchain.
- Major framework, Capacitor or native toolchain upgrades SHOULD be independently scoped and validated; migration notes MUST be reviewed.
- Projects MUST identify supported targets (web, Android and/or iOS, as applicable) and minimum OS versions for their supported native targets. A passing web build MUST NOT be considered proof that native builds work.
- Ionic components SHOULD be consumed through their documented APIs. Parallel wrappers around ordinary Ionic components SHOULD NOT be introduced without genuine shared behavior or a stable domain contract.
- Application-wide styles SHOULD use documented Ionic CSS custom properties, theme tokens and platform conventions. Supported devices MUST be checked for safe areas, system bars, dark mode, keyboard overlap and accessibility where applicable.

## Architecture and ownership

- Presentation components SHOULD own rendering and view-local interaction, not HTTP protocols, persistence, native permissions or platform orchestration.
- Native capabilities and nontrivial plugin interactions SHOULD be isolated behind focused, application-owned adapters or services, enabling narrow tests and explicit platform fallbacks.
- New wrappers, services, base classes and state managers MUST address a demonstrated need, not hypothetical reuse.
- Composition SHOULD be preferred to inheritance; exceptions MUST have a specific reason and MUST NOT establish inheritance as the default method of sharing dependencies.
- Application identity MUST be treated separately from implementation naming where the platform distinguishes them: Android application ID and Java/Kotlin namespace and iOS bundle identifier serve different purposes. Renaming MUST include relevant native configuration, resources and tests.

## Ionic UI, navigation and lifecycle

- Projects SHOULD use routing and state patterns supported by their chosen Ionic integration rather than combine independent navigation stacks by default.
- Navigation MUST account for history, hardware back actions, deep links, nested outlets, tab stacks and state restoration when those behaviors are in scope.
- Route pages SHOULD coordinate navigation and accessible feedback. Loading, empty, error, retry and offline behavior SHOULD be defined deliberately.
- Where Ionic navigation caches pages, page/view lifecycle events and framework component lifecycle hooks MUST NOT be treated as interchangeable. Listeners, timers, subscriptions and resources MUST have clear cleanup ownership; refresh-on-enter behavior SHOULD be deliberate.
- Alerts, toasts, modals, popovers and loading indicators SHOULD use Ionic's documented components or controllers first. Custom wrappers need a real shared contract and MUST preserve focus, dismissal and accessible semantics.

## Capacitor plugins and native capabilities

- New plugins MUST be evaluated for compatibility with the pinned Capacitor major version, supported platforms, native dependency management and expected security/maintenance requirements.
- Platform-only APIs MUST be guarded or given an appropriate browser implementation/fallback. Importability in JavaScript does not guarantee functionality on every platform.
- Permissions MUST be requested when needed, with a clear explanation. Denial, unsupported hardware, revocation and interruptions MUST be handled without assuming success.
- Native listeners MUST be removed when no longer owned, including when asynchronous registration or teardown fails. Background/foreground transitions SHOULD be considered for long-running work.
- Credentials and secrets MUST NOT be embedded in bundled JavaScript, public Capacitor configuration, committed native files or ordinary unencrypted browser storage. Secure storage requires a project-owned decision.
- For Capacitor 8, `SystemBars` is exposed from `@capacitor/core`. Projects MUST check the installed API and platform behavior instead of introducing older status-bar plugins by habit.

## Native projects and synchronization

- Projects MUST document whether `android/` and `ios/` are version-controlled native sources or intentionally regenerated artifacts. Native modifications owned by the application SHOULD be version-controlled and reviewed.
- Web assets MUST be built before synchronizing them into native projects. Run `cap sync` for affected platforms after relevant web, dependency or plugin changes. Synchronization does not replace native compilation or testing.
- CLI- and dependency-manager-generated files MUST NOT be treated as durable customization points unless the tool expressly supports that use. Use supported application configuration, native project settings and owned native code.
- For Capacitor 8, newly generated iOS projects default to Swift Package Manager. Existing compatible CocoaPods projects MAY continue. With SPM, `CapApp-SPM/Package.swift` is CLI-managed and may change during plugin synchronization.
- Native platform directories MUST NOT be casually deleted and recreated: regeneration can lose application IDs, signing configuration, entitlements, resources and owned native changes.
- Platform-specific changes MUST be validated with their applicable native toolchain (Android SDK/Gradle or Xcode on macOS). Browser tests alone do not establish native correctness.

## Configuration, versioning and distribution

- Configuration delivered to the web bundle MUST be considered public. Build-time environment selection SHOULD be explicit and reproducible; secrets MUST remain in restricted secret-management systems.
- App version, release tag, native version name, Android version code and iOS build number SHOULD follow a documented source-of-truth policy, preserving each platform's distinct format and monotonicity requirements.
- Release validation SHOULD cover relevant types, unit and critical browser E2E tests, web build, native synchronization, native compilation and signing checks appropriate to the release. Each project owns the exact commands and gates.
- Building, signing, uploading, submitting for review and public rollout are distinct actions. Automation MUST state which actions it authorizes; a branch or tag MUST NOT cause unintended production publication.
- Signing keys, provisioning profiles, store credentials and API tokens MUST remain in restricted secret management, with released artifacts traceable to the approved source revision.
- No CI/CD vendor, app-store workflow, branching strategy or update mechanism is mandated here. These choices belong to repository-owned operations documentation.

## Testing and verification

- Unit tests SHOULD cover stateful services, adapters, transformations and failure paths without native simulators when the behavior is platform-independent.
- Browser E2E tests SHOULD cover important navigation, overlays, interactions and accessibility-visible states; they count as web tests unless actually run in a native shell.
- Plugin adapters SHOULD be mocked narrowly in unit tests and verified on devices or simulators for permissions, system bars, hardware behavior and app lifecycle when relevant.
- Android instrumentation testing SHOULD target the intended application module rather than all generated auxiliary subprojects unless the wider task graph is deliberate.
- iOS builds and runtime behavior SHOULD be exercised on compatible Xcode simulators or devices, particularly for SPM dependency resolution and native plugins.
- Validation not performed MUST be reported as pending, not implied to have passed.

## Angular integration profile

Only applications using Ionic Angular follow these additional conventions. Consumers SHOULD install the `angular` and `ts-js` guides alongside `ionic-capacitor`.

- Prefer standalone Angular bootstrap, components, routes and provider APIs when compatible with the project's pinned Ionic/Angular versions.
- Use `provideIonicAngular()`, `IonRouterOutlet` and the appropriate `RouteReuseStrategy` according to the installed integration; prefer Angular Router and lazy routes for URL-based navigation.
- Components SHOULD focus on presentation and local state. Angular signals MAY own synchronous state; Observables SHOULD remain where they serve existing streaming contracts, with explicit subscription ownership.
- Ionic view caching and Angular change detection MUST be reviewed together. `OnPush` and Angular lifecycle hooks alone do not guarantee that a cached route refreshes when visible again; use Ionic view events or appropriate reactive state deliberately.
- Ionic components and controllers SHOULD be used directly unless a wrapper provides a demonstrable shared contract.
- Prefer Angular dependency injection, error handling and framework testing tools over broad global patches when they fit the use case.
- Vitest MAY be used with Angular's supported test tooling, and Playwright MAY be used for browser E2E. Native capabilities still require platform testing.

## Framework-neutral JavaScript profile

Ionic Core also works with plain JavaScript. Keep its requirements focused on established web-platform behaviors; a specific framework integration MUST NOT be inferred.

- Register Ionic web components and select a documented navigation approach, such as Ionic Router when there is no framework router.
- Handle custom-element lifecycle, event cleanup, application state and plugin adapters explicitly.
- Angular decorators, dependency injection, RxJS and Angular change-detection practices MUST NOT be imposed on framework-neutral consumers.

## Adoption

- Catalog ID: `ionic-capacitor`; installed source: `guides/ionic-capacitor.md`.
- Ionic Angular applications SHOULD select `ts-js`, `angular` and `ionic-capacitor`. Other projects select only applicable companion technology guides.
- Development workflow choices remain separate: choose either `devel` or `simple-devel` as appropriate, never both.
- Repository-specific commands, target OS versions, framework integrations, native exceptions and delivery tools belong in project-owned operations and ADRs.

## Official references

- [Ionic Angular overview](https://ionicframework.com/docs/angular/overview)
- [Ionic Angular navigation](https://ionicframework.com/docs/angular/navigation)
- [Ionic Angular page lifecycle](https://ionicframework.com/docs/angular/lifecycle)
- [Ionic JavaScript quickstart](https://ionicframework.com/docs/javascript/quickstart)
- [Capacitor documentation](https://capacitorjs.com/docs)
- [Capacitor installation and synchronization](https://capacitorjs.com/docs/getting-started)
- [Capacitor Swift Package Manager](https://capacitorjs.com/docs/ios/spm)
- [Capacitor 8 migration notes](https://capacitorjs.com/docs/updating/8-0)
- [Capacitor System Bars](https://capacitorjs.com/docs/apis/system-bars)
