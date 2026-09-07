
## 9. Flutter native-mobile standard

### 9.1 Scope and platform boundary

Use Flutter when the approved product scope includes an installed native mobile
application, independently or alongside web/API projects. Activate only the
approved native targets; a Flutter application does not require a Nuxt frontend
or an application-owned backend. An external API remains an explicitly
documented integration boundary.

- Flutter consumes the documented API; it never connects directly to
  PostgreSQL, Redis, BullMQ, or private server modules.
- Product rules, permissions, API errors, locale behavior, and analytics names
  must match the canonical shared documents.
- Flutter owns native navigation, device integration, local presentation state,
  and platform release behavior.
- Nuxt web components, Tailwind, shadcn-vue, browser state, and GSAP do not
  belong in the Flutter codebase.
- Flutter widgets and Dart packages do not belong in the Nuxt application.
- Record any different Flutter package or architecture choice in an ADR and
  `docs/flutter-standards.md`.

### 9.2 Approved Flutter stack

For a new project, start with the latest stable Flutter release, its bundled
stable Dart SDK, and the latest stable mutually compatible versions of the
approved packages below. This governance document owns package purpose and
usage; it does not freeze package numbers that will quickly become stale.
Use only language features that are stable in the pinned Dart SDK. Experimental
language flags or syntax from a newer SDK are prohibited in the production
baseline.

The generated `docs/flutter-standards.md` must record the project's actual
Flutter/Dart versions, package constraints, resolved versions, supported native
platforms, and last compatibility-check date. Pin the exact Flutter release in
CI or the approved SDK-version manager and commit `pubspec.lock`.

#### 9.2.1 Default architecture and runtime packages

| Concern | Standard | Rule |
| --- | --- | --- |
| Architecture | Feature-first MVVM-style layers | Keep views thin, Riverpod notifiers as view models, repositories as data sources of truth, and services as external boundaries. |
| State and dependency injection | `hooks_riverpod` + `riverpod_annotation` + `riverpod_generator` | Use `Notifier`/`AsyncNotifier`; upgrade the runtime, annotations, lints, and generator as one verified set. Do not add a parallel state-management system without an ADR. |
| Widget lifecycle | `flutter_hooks` | Keep as a direct dependency when application source imports it. Use hooks when they make controller, focus, animation, or subscription lifecycle clearer. |
| Immutable models | `freezed_annotation` + `freezed` | Use for immutable domain/data models and meaningful union states. Treat the generator as part of the shared analyzer compatibility set. |
| JSON | `json_annotation` + `json_serializable` | Generate explicit transport serialization for API, persisted-cache, job, and realtime contract models. Do not maintain hand-written `fromJson`/`toJson` implementations for those contracts. |
| Errors | Small typed `Result<Success, Failure>` | Model expected failures without adopting a functional-programming package by default. |
| HTTP | `dio` + `retrofit` + `retrofit_generator` | Use typed clients, bounded timeouts, cancellation, interceptors, and one error mapper. |
| Routing | `go_router` + `go_router_builder` | Use typed routes, redirects, restoration, and documented deep links. |
| Forms | Flutter `Form` and project validators | Keep labels, validation, focus, submission, and server-error mapping explicit. Add a validator package only when it removes repeated real rules. |
| Layout spacing | `gap` | Approved compact spacing helper; spacing values still come from the native design tokens. |
| Secure storage | `flutter_secure_storage` | Tokens and secrets only; configure platform security, backup, migration, and accessibility behavior deliberately. |
| Preferences | `shared_preferences` | Small non-sensitive settings only; never durable business truth. New code uses `SharedPreferencesAsync` or `SharedPreferencesWithCache`, not the legacy `SharedPreferences` API. |
| Theme | Material 3 `ThemeData` and `ColorScheme.fromSeed` | Use the approved project seed/primary, with green as fallback, and light/dark/system modes. Do not require a theme package for SDK behavior. |
| Localization | Flutter `gen_l10n`, `flutter_localizations`, and the SDK-compatible `intl` | Store copy in ARB files, enable `flutter.generate`, require resource metadata, and generate typed localization source inside the application. |
| Linting | `flutter_lints` | Keep analysis strict and generated-code exclusions narrow. Add `custom_lint` and `riverpod_lint` only after their compatibility with the approved generator set is verified. |
| Unit and widget tests | `flutter_test` | Prefer fakes. Add `mocktail` only when an external boundary is materially clearer with a mock. |
| Native integration tests | Flutter SDK `integration_test` | Required for cross-screen, plugin, persistence, and platform integration flows. Add Patrol only for approved flows that must control native dialogs or platform UI. |
| Code generation | `build_runner` | Pin it with the generator compatibility set, generate deterministically, and check generated-code drift in CI. |
| Development diagnostics | One application-owned redacting logger boundary | A package such as Talker is optional, not architectural. Never log secrets or full sensitive bodies. |
| Scaffolding | Reviewed templates only | Mason is optional. Generated structure must earn its place and must not create empty boilerplate. |

Before accepting package versions in a new project:

1. start with the latest stable version of each approved direct dependency;
2. solve on the exact selected Flutter SDK;
3. resolve Riverpod, Freezed, JSON, Retrofit, GoRouter, `build_runner`,
   Analyzer, source generation, and related lints as one compatibility graph;
4. if latest stable releases do not resolve together, use the newest mutually
   compatible stable set or simplify one generator path;
5. use a prerelease only through an ADR with an owner, risk, expiry trigger,
   stable replacement target, and passing generation, analysis, test, and
   release-build evidence;
6. record the final constraints and resolved lockfile versions in
   `docs/flutter-standards.md`.

Do not silently remove packages from an existing Flutter project. First record
whether each package is imported, transitively endorsed, platform-configured,
covered by tests, or replaceable by an SDK feature. Use the global
Keep/Adapt/Split/Move/Replace/Archive/Remove protocol in Section 4.

#### 9.2.2 Capability packages

Install native capability packages only when the product and mobile-platform
contract activate the capability:

| Capability | Package | Activation and implementation rule |
| --- | --- | --- |
| Local notifications | `flutter_local_notifications` | Conditional. Document channels, permission timing, tap/deep-link behavior, platform limits, and background behavior. For scheduled notifications, add `timezone` directly, obtain the device IANA zone through an approved platform source, and document Android exact-alarm and reboot behavior. |
| Device permissions | `permission_handler` | Conditional. Declare only used permissions in Android and Apple configuration, provide denied/restricted/permanently-denied recovery, and do not request permissions preemptively. |
| Embedded web content | `webview_flutter` | Conditional. Define trusted origins, navigation allowlists, JavaScript/channel contracts, download/file behavior, cookies, authentication, external-link handling, and failure UI. |
| Android-specific WebView APIs | `webview_flutter_android` | Do not declare it merely to support Android: it is an endorsed implementation of `webview_flutter` and is included transitively. Add it directly only when application source imports its Android-specific API. |
| Platform sharing | `share_plus` | Conditional. Define what may be shared, redaction rules, file lifecycle, cancellation, and unavailable-target behavior. |
| Image acquisition | `image_picker` | Conditional. Define camera/gallery scope, consent, file size/type checks, EXIF/privacy handling, upload recovery, and Android `retrieveLostData()` startup recovery. Do not add a platform implementation directly unless its API is imported. |
| Realtime WebSocket | `web_socket` | Conditional when `docs/realtime-protocol.md` is active. Use the shared protocol fixtures and keep background notification on FCM/APNs rather than assuming a persistent socket. |

`flutter_localizations` and `integration_test` are Flutter SDK dependencies and
must be declared when the native profile is active. Set `flutter.generate:
true`, keep ARB source and generated output policy explicit, and do not use the
removed synthetic `package:flutter_gen` import path.

Generated files follow one repository-wide policy: either commit them
consistently or generate and drift-check them consistently in CI.

### 9.3 Flutter architecture

Use a pragmatic feature-first structure:

```text
apps/mobile/
├── lib/
│   ├── app/
│   │   ├── app.dart
│   │   ├── routing/
│   │   ├── shell/
│   │   │   ├── app_master_page.dart
│   │   │   ├── app_master_layout.dart
│   │   │   └── app_loading_overlay.dart
│   │   ├── theme/
│   │   └── l10n/
│   ├── core/
│   │   ├── config/
│   │   ├── error/
│   │   ├── loading/
│   │   │   ├── app_loading_controller.dart
│   │   │   └── blocking_activity.dart
│   │   ├── network/
│   │   │   └── loading_interceptor.dart
│   │   ├── observability/
│   │   ├── storage/
│   │   └── widgets/
│   │       └── app_mutation_confirm_dialog.dart
│   └── features/
│       └── <feature>/
│           ├── data/
│           │   ├── models/
│           │   ├── repositories/
│           │   └── services/
│           ├── domain/
│           │   ├── models/
│           │   ├── repositories/
│           │   └── use_cases/       # only when justified
│           └── presentation/
│               ├── controllers/     # Riverpod view models
│               ├── views/
│               └── widgets/
├── test/
└── integration_test/
```

Dependency direction:

```text
view/widget
  -> Riverpod notifier/view model
    -> use case (optional)
      -> repository interface
        -> repository implementation
          -> service/API or approved local source
```

Rules:

- Views render state, forward user intent, and own only ephemeral widget state.
- Riverpod notifiers own presentation state and UI-facing actions.
- Repositories are the app-facing source of truth for their data and reconcile
  remote and approved local sources. The server API and PostgreSQL remain
  authoritative for durable business state.
- Services wrap stateless external APIs, platform APIs, and storage operations.
- Add a use case only for complex, reusable, or multi-repository business logic.
- Domain code must not depend on Flutter widgets, HTTP clients, or storage
  plugins.
- Parse transport models at the data boundary; do not leak raw API maps into UI.
- Use generated serializers for transport and persisted-cache contracts.
  Hand-written map destructuring or Dart pattern matching may narrow a small
  local dynamic value, but it must not become a parallel serializer or a
  substitute for the server contract and generated model tests.
- Map expected transport, authentication, validation, conflict, permission,
  offline, and unknown failures to typed failures.
- Keep the server's numeric result code and request ID available for recovery,
  localization, telemetry, and support without showing internal detail to users.
- Represent closed result and presentation-state families with `sealed` types.
  Use exhaustive pattern matching for value-producing state mapping; do not add
  a wildcard that silently absorbs a newly introduced expected state.

### 9.4 Native navigation, state, and lifecycle

- Give every important destination a typed route and stable deep-link contract.
- Keep route guards thin; the API still enforces authentication and
  authorization.
- Restore useful navigation and form state after OS interruption when the
  product requires it.
- Scope providers to the smallest useful lifetime and enable disposal for
  screen-owned work.
- Cancel stale HTTP requests and asynchronous work when screens or parameters
  change.
- Represent asynchronous state explicitly: initial, loading, refreshing, data,
  empty, expected failure, and retry.
- Do not put transient field state or every remote response into global
  providers.
- Keep route definitions generated and typed. Redirects are deterministic,
  side-effect-free navigation decisions; data loading stays in the owning
  notifier/repository boundary.
- Test app-link/universal-link behavior, unauthenticated redirects, expired
  sessions, back navigation, and process restoration where supported.

### 9.5 Adaptive mobile-first layout

Design the phone composition first, then deliberately adapt it for larger
windows, tablets, foldables, desktop-class targets, and accessibility text
scales.

- Make layout decisions from available constraints with `LayoutBuilder` and
  `MediaQuery.sizeOf`, not device names or orientation alone.
- Define project breakpoints where the composition needs to change; do not copy
  breakpoints without testing the actual content.
- Use `Expanded`, `Flexible`, wrapping, and scrollable regions to avoid overflow.
- Constrain reading, form, and dialog widths on large windows with
  `ConstrainedBox` and intentional centering or split layouts.
- Use lazy `ListView.builder` and `GridView.builder` for substantial collections.
- Use phone-appropriate navigation at narrow widths and intentional side
  navigation, drawer, or multi-pane composition when space supports it.
- Do not lock orientation to hide layout defects.
- Support safe areas, display cutouts, the on-screen keyboard, large text, and
  split-screen resizing.
- If desktop-class targets are supported, verify keyboard, mouse, hover,
  shortcuts, scrolling, and focus behavior.

Every important Flutter screen must define and verify:

- compact phone and large-phone composition
- portrait and landscape behavior
- tablet/foldable or wide-window composition when supported
- light, dark, and system theme
- increased text scale and screen-reader semantics
- loading, empty, error, denied, conflict, offline, and destructive states where
  relevant

#### 9.5.1 Flutter master page and layout components

Flutter implements the same shell ownership as Nuxt with native composition:

Follow the approved native navigation and layout decisions without a new ADR.
The names below describe shared responsibilities; keep an existing equivalent
composition. Web sidebar defaults do not require adding a sidebar to a native
phone application.

- `AppMasterPage` is the canonical authenticated application shell. It owns the
  root `Scaffold`, adaptive navigation, top app bar when required, bounded body,
  global overlay stack, safe-area policy, and stable application regions.
- `AppMasterLayout` is the reusable adaptive layout component. It accepts the
  routed page as a required `child` and exposes only justified optional widget
  or builder parameters for title, page actions, secondary pane, floating
  action, and bottom/sticky actions. These parameters are Flutter's equivalent
  of typed layout slots.
- Feature pages provide content to the body contract. They do not repeat global
  navigation, create a competing root `Scaffold`, or implement their own
  full-screen loading overlay.
- Keep `auth`, `public/onboarding`, and deliberately focused layout families
  separate only when their navigation semantics differ. Every family composes
  one shared app-shell root so the global loading and feedback layers remain
  consistent.
- Use compact default Material 3 components. Phone navigation may use
  `NavigationBar` or `NavigationDrawer`; wide layouts may use
  `NavigationRail` or a justified split pane. Choose by constraints and task,
  not by device label.
- The master layout supplies a bounded body; each feature page owns exactly one
  primary lazy/native scrollable appropriate to its content. Do not wrap every
  page in an outer `SingleChildScrollView`, nest competing primary vertical
  scrollables, or render a large collection as eager children.
- Fullscreen camera, map, media, kiosk, or editor experiences require a named
  focused-layout exception with safe exit, system-back, interruption,
  accessibility, and loading-overlay behavior.

#### 9.5.2 Riverpod global blocking activity

Use a generated, application-lifetime Riverpod `Notifier` for
`AppLoadingController`. Its immutable state is a map/set of active opaque lease
IDs and safe operation metadata; `loadingCount` and `isLoading` are derived.
Do not add `ChangeNotifier`, Bloc, Provider, GetX, or a second state system for
this concern.

`AppLoadingOverlay` is rendered once at the app-shell root in a `Stack`. While
`isLoading`:

- a non-dismissible `ModalBarrier` blocks unsafe touch/pointer interaction
- the shell also prevents keyboard/shortcut and accessibility activation of
  blocked content, with deliberate focus/semantics exclusion and restoration;
  a pointer barrier alone is insufficient
- a compact Material 3 `CircularProgressIndicator` communicates indeterminate
  work; use `LinearProgressIndicator` when reliable progress is known
- localized `Semantics` identifies the application as busy and announces one
  concise status without exposing request or technical details
- the overlay covers the bounded application viewport, not each page's scroll
  content independently

The controller implements the shared Section 6.6 lease rules, including one
idempotent release per operation, the central 500 ms final-release hold,
non-negative count, timeout/watchdog telemetry, and `runBlocking<T>()` with
`try/finally`. It is kept alive for the running application but never persisted
to secure storage, preferences, restoration state, or a local database. A
fresh process starts at zero.

Attach one loading interceptor to the application-owned Dio instance; generated
Retrofit clients inherit it. The interceptor:

- acquires one lease before a participating request and stores its token in
  `RequestOptions.extra`
- releases that token on response, mapped HTTP/application failure, Dio error,
  cancellation, and timeout
- treats a handled non-zero application code returned in HTTP 200 as a normal
  terminal path for loading cleanup
- honors typed local `noLoading: true` metadata without sending it to the API
- prevents token refresh and retry layers from double-counting the same
  user-visible operation

The interceptor owns loading cleanup, not product feedback. The response mapper
turns a non-zero envelope into the typed expected result once; the owning
notifier/screen decides the localized recovery UI without also reporting it as
an unexpected Dio failure.

Heavy non-network work uses the same controller through a focused service or
notifier action. Widgets must not manually pair increment/decrement calls.
Screen-owned `AsyncValue` still represents initial/loading/refreshing/data/
failure content state; it is not replaced by the global counter.

### 9.6 Native UI, copy, accessibility, and motion

- Read the approved native decisions in `design-system/MASTER.md`, the owning
  screen contract, and one comparable shipped screen before changing UI.
  Preserve their theme, density, navigation, components and action placement;
  inspect the affected rendered states to prove consistency.
- Use default Material 3 widgets and platform conventions before custom
  controls.
- Use the approved project theme seed/primary and semantic tokens, with green
  as fallback when no design is approved; do not recolor screens independently.
- Keep density compact but preserve a minimum 48×48 logical-pixel interactive
  target.
- Reuse approved page-template intent through native screens, sheets, dialogs,
  side navigation and platform navigation patterns. A native screen contract
  records logical-pixel constraints, native scroll/navigation/focus ownership
  and widget validation; it must not require Nuxt routes, shadcn-vue components,
  CSS widths or browser automation. Shared product/copy/accessibility meanings
  remain consistent across active clients.
- Keep product copy real, concise, localized, and action-oriented. The same
  dummy-content and explanation-card prohibitions apply.
- Keep ARB keys semantic and stable. Require resource metadata for translator
  context, type and document every placeholder, use ICU plural/select messages
  instead of concatenating grammar, and make untranslated-message output a CI
  failure for every shipping locale. Generated localization source lives
  inside `lib/`; never import it from the removed synthetic
  `package:flutter_gen` path.
- Use semantic widgets, meaningful labels, logical focus order, contrast that
  meets WCAG 2.2 AA where applicable, and non-color state cues.
- Use built-in implicit or explicit Flutter animation for purposeful native
  motion. Respect disabled/reduced animation preferences.
- Never make animation a prerequisite for understanding or completing a task.
- Use native alerts and permission prompts only at the moment they are needed,
  with a clear pre-prompt rationale when the platform experience benefits.

#### 9.6.1 Mandatory Flutter mutation confirmation

Every Flutter create/update/delete trigger awaits one shared typed confirmation
helper that renders the default `AlertDialog.adaptive`/Material 3
`AlertDialog`. It returns `true` only from the explicit confirm action; `false`
or `null` from Cancel, system back, route disposal, or interruption performs no
mutation.

The dialog uses:

- a localized action-and-target title rather than a generic question
- concise consequence/recovery text and optional safe tenant/scope context
- the selected count and exact selection scope for bulk commands
- `Cancel` plus an explicit create/save/archive/restore/delete action
- normal primary emphasis for create/update and semantic destructive emphasis
  for destructive actions
- a semantic label and focus order that screen readers announce correctly
- scrollable/bounded content when large text or compact phones would otherwise
  overflow

Client form validation runs before `showDialog<bool>`. After a `true` result,
the owning Riverpod notifier starts the Section 9.5.2 loading lease and executes
the mutation once. The dialog/helper contains no Dio client or business logic.
Disable repeated trigger/confirm activation, preserve safe form state on
cancel, and restore focus to the invoking control when the dialog closes.
Optimistic state, activity logging, success feedback, and authoritative refresh
occur only after confirmation and according to the command result.

#### 9.6.2 Native temporal presentation

When the application displays or accepts dates/times, consume the canonical
API contract for instants, calendar dates, local input and the server-resolved
presentation context. Register one typed Riverpod context owner and one native
formatting/input boundary. Replace that projection on session refresh and scope
changes; clear stale actor-derived values on logout or failed restoration before
rendering another scope.

Map approved format/preset IDs explicitly to Dart `intl` patterns. Day.js and
ICU tokens are different: `YYYY-MM-DD HH:mm:ss` must not be passed unchanged to
`DateFormat`; its equivalent numeric pattern is `yyyy-MM-dd HH:mm:ss`. Use an
approved IANA-aware conversion boundary for scoped instant display; `intl`
formatting and `DateTime.toLocal()` do not resolve an arbitrary business zone.
Unknown contexts, presets or invalid values produce localized unavailable states,
never guessed device-zone values or raw transport fallback.

Keep the server's instant/date/local-input meanings in generated DTOs and input
adapters. Do not shift calendar dates through UTC or convert scope-local mutation
input on the device when the API owns that conversion. Record native preset and
timezone support in `flutter-standards.md` and use shared valid/invalid fixtures
to prove client/server agreement, including locale, scope changes and DST where
applicable. Missing API timezone or preset decisions block this dependent work;
ask the owner instead of inventing a format mapping.

### 9.7 Networking, storage, offline, and security

- Derive API clients from the canonical API contract where practical.
- Set connect, send, and receive timeouts and support cancellation.
- Centralize base URL, safe headers, request correlation, token refresh, and
  error mapping in the network boundary. The same central Dio boundary owns the
  Section 9.5.2 loading interceptor.
- Serialize concurrent refresh attempts and fail closed if session renewal
  fails.
- Never log authorization headers, refresh tokens, secure-storage values, or
  unredacted sensitive request/response bodies.
- Store secrets only in secure storage. Treat preferences and local databases as
  device-local caches, not server-authoritative business state.
- Add offline writes, synchronization, or conflict resolution only when
  `docs/mobile-platform-contract.md` defines ownership, queueing, retries,
  reconciliation, encryption, expiry, and user-visible status.
- Request the minimum device permissions and document denial, restricted,
  permanently denied, and settings-recovery behavior.
- Define certificate, device-integrity, screenshot, clipboard, and biometric
  controls from the product threat model rather than adding them by reflex.

### 9.8 Flutter verification and command surface

Apply `VERIFY-SCOPE-001` to the changed Dart, widget, API and platform boundaries.
Use Flutter/native runners for native behavior; a Chrome browser result does not
verify an Android or iOS application. Test at the appropriate boundaries:

| Layer | Required focus |
| --- | --- |
| Unit | Notifiers/view models, use cases, repositories, error mapping, serialization, and pure rules. |
| Widget | Rendering states, forms, navigation decisions, semantics, focus, themes, and constrained layouts. |
| Integration | Real API contract, session refresh, storage, deep links, key workflows, and process restoration. |
| Native end-to-end | Permission prompts, pickers, notifications, biometrics, app links, and other platform UI when used. |
| Device review | Supported phones/tablets, text scales, orientations, themes, poor networks, and release builds. |

Mirror `lib/` under `test/` with `_test.dart` filenames; keep cross-screen and
plugin flows under `integration_test/`. Prefer deterministic fakes at repository
and platform boundaries. A mock library may be added only through Section 3.8
when interaction verification is materially clearer than a fake; do not make a
second mocking style the project default.

Every Flutter project documents its setup, selected-test and shipping-platform
commands. For ordinary changes, use the affected test files and an explicit
target device/environment, for example:

```sh
flutter test test/features/<feature>/<changed_contract>_test.dart
flutter test integration_test/<changed_workflow>_test.dart -d <device-id>
```

Run platform-independent unit/widget proof once on the pinned SDK. Select
representative layout/text/theme states and the affected native workflows on
each OS whose platform behavior differs. Plugin, permission, secure-storage,
deep-link, signing and lifecycle behavior may require functional proof on both
Android and iOS; the web secondary-browser UI/UX policy cannot waive it. Do not
repeat unrelated workflows on every device or multiply all states, devices,
orientations and themes. Reuse accepted unchanged evidence.

The complete command catalog also includes these operations, selected only when
their setup, generation, analysis, full-regression or release boundary applies:

```sh
flutter pub get
flutter gen-l10n
dart run build_runner build --delete-conflicting-outputs
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter test integration_test
flutter build appbundle --release
flutter build ipa --release
```

Run only release builds for approved target platforms and the selected flavor,
entrypoint and configuration. A release candidate requires code-generation drift,
formatting, analysis, applicable unit/widget and integration evidence, and a
release-mode build per shipping platform. A successful build does not prove
device behavior. Routine source changes do not unconditionally run this entire
catalog or repeat signing/store checks.

### 9.9 Flutter UI/UX release checklist

Use the affected screen/platform set and reusable evidence selected in Section
9.8. A checklist's universal applicability does not require rerunning unchanged
app flows or release artifacts for every widget edit.

#### Product and native behavior

- [ ] The screen's actor, job, entry route/deep link, primary action, and states are documented.
- [ ] Real localized content is used; no dummy, explanation-heavy, or internal wording remains.
- [ ] Permission requests, offline behavior, interruptions, and recovery are defined where relevant.
- [ ] Back, system back, app resume, deep-link entry, and expired-session behavior are verified.

#### Components and theme

- [ ] Default Material 3 or platform-appropriate components were used first.
- [ ] Approved project primary colors (green as fallback) and semantic colors work in light, dark, and system modes.
- [ ] No screen-level theme overrides or unrelated visual system was introduced.
- [ ] Compact density remains readable and all interactive targets are touch-safe.

#### Adaptive layout

- [ ] Every routed application screen composes through the canonical
  `AppMasterPage`/`AppMasterLayout` child contract and does not duplicate the
  root `Scaffold`, navigation, or blocking overlay.
- [ ] Compact and large phones are intentional in portrait and landscape.
- [ ] Supported tablets, foldables, split-screen, and wide windows are intentional.
- [ ] Increased text scale, keyboard opening, safe areas, and display cutouts do not cause overflow.
- [ ] Long content scrolls correctly; substantial lists/grids are lazy.
- [ ] Wide screens use constrained or multi-pane composition instead of stretched phone UI.

#### States, accessibility, and motion

- [ ] Loading, refreshing, empty, error, offline, denied, expired, conflict, success, and destructive states exist where relevant.
- [ ] Every user-initiated create/update/delete, state transition, archive,
  restore, and bulk mutation awaits the shared adaptive `AlertDialog` before
  the Riverpod notifier executes it.
- [ ] Invalid input opens no dialog; cancel/back/dismiss sends no request;
  confirm sends exactly one request; action/target/effect/bulk scope, semantic
  label, focus return, large text, and compact-phone overflow are tested.
- [ ] The Riverpod lease registry and root `AppLoadingOverlay` keep the viewport
  blocked while the derived count is greater than zero and apply the central
  500 ms final-release hold.
- [ ] Dio/Retrofit and heavy-task tests cover ten concurrent operations,
  out-of-order completion, handled non-zero HTTP-200 results, error,
  cancellation, timeout, refresh/retry, duplicate release, stuck warning,
  `noLoading`, app restart, and no count leak/underflow.
- [ ] Screen-reader labels, focus order, contrast, non-color cues, and dynamic announcements are correct.
- [ ] Hardware keyboard, mouse, hover, scrolling, and shortcuts work on supported desktop-class targets.
- [ ] Motion is purposeful, interruptible, and respects reduced/disabled animation.

#### Native verification

- [ ] Widget tests cover important states, themes, text scales, semantics, and layout constraints.
- [ ] Key workflows pass on supported emulators/simulators and representative real devices.
- [ ] Native dialogs, permissions, notifications, pickers, biometrics, and app links are tested when used.
- [ ] Release-mode builds, signing, environment configuration, privacy declarations, and store metadata are verified.
- [ ] All `Not tested` items name a reason, owner, and follow-up.
