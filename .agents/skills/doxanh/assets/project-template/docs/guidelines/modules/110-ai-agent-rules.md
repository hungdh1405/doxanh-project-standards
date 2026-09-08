
## 17. AI agent operating rules

Use the Doxanh skill (`$doxanh` in Codex, `/doxanh` in Claude Code, also called
“doxanh skill”) as the task bootstrap. Both agents use the same maintained skill,
rules and project lock. Read applicable root/nested `AGENTS.md` and `CLAUDE.md`,
resolve the project's locked standard, inspect the actual owning source and
project book, and preserve unrelated work. Installed prose, memory, a version
lock, and previous claims are not implementation evidence.

Use the invoked skill's installed resolver rather than assuming a Codex-specific
home directory. Agent discovery and a project's pinned rule version are separate:
updating a shared discovery link must not silently upgrade another project's lock.
Keep shared repository instructions in `AGENTS.md`; a Claude startup file may
import that file instead of duplicating its rules. Preserve existing instructions
and conflicts for review. Check required tools and relevant framework skills in
the agent actually running the task; installation in another agent is not proof
of availability. Follow that agent's permissions and tools without assuming
Codex-specific tool names or bypassing Claude's permission controls.

Use task mode for bounded maintenance. Read the selected owners completely and
form acceptance criteria from their stable rule IDs. Use project mode for
initial generation, profile changes, or a complete standard review. Missing
material product decisions block their dependent work; routine implementation
choices within approved scope do not require renewed permission.

Select web, API, and Flutter independently under Section 1. For a task inside a
mixed-profile repository, pass the approved `--profiles` and affected
`--task-profiles` to the planner; native UI IDs resolve to GDL-053. Complete
reviews use Section 4.19's inventory of every applicable requirement and
generated output, with questions for material missing decisions under 4.18.

### 17.1 Framework skills and documentation

Discover skills in the current session and configured machine/project skill
locations. At adoption, record the relevant installed skills, their source or
version where available, and missing guidance in the existing engineering
standards chapter. At task time, load only skills relevant to the changed
boundary. Having a skill installed is not proof it was read or applied.

| Work | Expected available guidance | Selection and compatibility |
| --- | --- | --- |
| Nuxt/Vue | `vue-best-practices`, `vue`; `vue-router-best-practices` for routing; `pinia` for stores | Read the installed framework version/config first. Use the official Nuxt documentation index and relevant API/module pages in Section 18. |
| Web components | `shadcn-vue` | Read project context, registry/component docs and applicable composition rules. Keep the project's approved theme, components and layout-only Tailwind policy. Example cards do not require descriptions or filler copy. |
| UI/UX work | `ui-ux-pro-max`; `frontend-design` for new visual design or a requested redesign | Review the approved design master and comparable shipped screens. Design suggestions cannot silently replace an established visual system. |
| Build or test tooling | `vite`, `vitest` when those tools are affected | Follow the project lock/toolchain and the selected test scope. Loading a testing skill does not select every test. |
| Playwright automation | Relevant application-testing skills from `microsoft/playwright`, such as `playwright-cli`; `playwright-trace` for trace diagnosis | Use the setup guidance below and Section 13.3. Select skills by their actual contents and compatibility with the installed tools. |
| Motion | `gsap-core` and the relevant `gsap-frameworks`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, or `gsap-utils` | Load only for actual GSAP work. Do not add animation or a library just because a skill exists. |
| Flutter architecture | `flutter-apply-architecture-best-practices` | Reuse layering/repository guidance. Its ChangeNotifier/Provider/GetIt examples do not replace the approved Riverpod architecture in Section 9. |
| Flutter responsive UI | `flutter-build-responsive-layout`; `flutter-fix-layout-issues` for layout failures | Use parent/window constraints and real rendered evidence. Apply fixes to the actual constraint tree, not a blanket Expanded wrapper. |
| Flutter localization | `flutter-setup-localization` | Use ARB and generated localization guidance; verify the pinned SDK's official migration docs. Do not copy stale `synthetic-package: true` or `package:flutter_gen` examples. |
| Flutter JSON models | `flutter-implement-json-serialization` only for an approved manual-mapping boundary | Preserve Section 9's generated models and shared Dio/API envelope. A sample HTTP-200 check does not prove `success: true` and `code: 0`; do not add an untracked HTTP client. |
| Dart tests | `dart-add-unit-test` | Use `flutter_test` for Flutter and `package:test` for pure Dart. Cover meaningful changed behavior; select test paths instead of copying unfiltered full-suite commands. |
| Dart dependency conflicts | `dart-resolve-package-conflicts` | Diagnose the actual solver conflict; use supported targeted pub resolution and review the lock diff. Do not broaden into unrelated upgrades or hand-edit/delete the lock as a default fix. |
| Native FFI | `dart-use-ffigen` | Only when an approved native binding is affected; generate the required bindings and verify the exact toolchain and platform boundary. |
| Dart patterns | `dart-use-pattern-matching`, `dart-use-primary-constructors` | Use only syntax supported by the project's installed and constrained stable SDK. A skill's version claim is not permission to enable experiments or upgrade the SDK. |

The Flutter/Dart rows cover the installed skill families reviewed for this
standard; availability varies by machine. Recheck the actual inventory rather
than claiming that the package bundles or installs these dependencies.
`nuxt-ui` or another component-system skill applies only to a project that has
explicitly adopted that system; it does not authorize mixing it into shadcn-vue.

When relevant guidance is missing, locate its reviewed upstream source (for
shadcn-vue use the Section 18 skill link) and use official version-appropriate
docs for the current task. Report the missing skill briefly. Install only the
needed skills when setup/installation is authorized, preserving existing local
versions and edits; a normal feature task does not authorize a global skill
refresh. If a required tool cannot be substituted, complete independent work
and state the exact dependent step that remains blocked.

#### Playwright automation setup

Before authoring or restructuring automated browser/API tests, check for and
read the relevant installed Playwright skills. If missing, inform the user of
the upstream package and its installation command:

```bash
npx skills add microsoft/playwright
```

Inspect the current package selections and choose only relevant skills for the
intended agent and installation scope. `playwright-cli` covers browser automation
and test workflows; `playwright-trace` covers trace inspection. Select
`playwright-component-testing` only for an applicable isolated-component task
supported by the project's toolchain. Read the installed `SKILL.md` and needed
references; do not assume that running the package command installed every
listed skill. Installation follows the authorization and preservation rule above.

`playwright-dev`, `playwright-devops`, `playwright-test-results`, and
`playwright-triage` target maintenance of Playwright itself. Their upstream CI,
exhaustive browser/version matrices, and contributor setup are not application
test structure requirements. Skill installation also does not install the
application's test runner or browser binaries. Preserve its pinned toolchain;
verify support for suggested APIs instead of automatically upgrading to `latest`
or `next`. Use Section 13.3 and the official best-practices/fixtures references
for application test structure. Keep Doxanh's affected-scope selection, browser
division, and evidence-reuse rules when applying external examples.

### 17.2 Implement and review the affected slice

- Follow project truth and the genericity boundary in Section 1.1. Keep business
  actors, routes, providers and states in each project's book. Never invent
  DTOs, fallback data, permissions, capabilities or runtime behavior.
- Run `rules:plan` for anticipated paths, read the selected owners and use their
  acceptance criteria. Run the actual-worktree plan again after final edits.
- UI work follows `UI-VISUAL-001`, `UI-DENSITY-001`, `UI-COPY-001` and the other
  applicable `UI-*` rules. Reuse the approved shell and shared compositions;
  inspect real copy, responsive/theme states and the changed interaction.
- Source changes follow their owning API, data, authorization, concurrency,
  activity and capability contracts. Test server enforcement and durable
  results when those boundaries are affected, not only a toast or hidden UI.
- Project-book work follows `DOC-BOOK-001`/`DATA-DOC-001` and the Section 4
  generation/preservation contracts. Update canonical decisions and derived
  outputs without rewriting unrelated approved chapters.
- Use current official sources for unstable framework behavior. Apply the
  dependency acceptance gate only when selecting/changing a dependency.

### 17.3 Verify once, then finish the authorized work

`VERIFY-SCOPE-001` in Section 13.7.2 owns test selection and reuse. State the
changed behavior and selected checks before dispatch, validate the real command
expansion, and run only missing affected evidence. Unknown mappings require
investigation; they do not authorize an unconditional full suite. The Section
13.3 browser policy separates functional proof from UI/UX compatibility.

After final edits, satisfy `verify:changed` with current evidence and run
`verification:check` before claiming completion. The runner must reuse current
passing checks and execute only missing proof; on a commit-only continuation,
check freshness without dispatching those suites again. After selected checks
pass, stop testing. When commit and push were
requested, inspect the intended staged diff, commit it, push the requested
branch and verify the remote result. Preserve authorization from earlier turns;
do not ask again solely because a required intermediate check has finished.
Without that authorization, finish a reviewable working-tree change and report
its validation. Never bypass a failing required hook or silently stage unrelated
files. If hooks change maintained content, inspect it and refresh affected proof.

A commit-only transition preserves content-bound evidence. Run only missing
revision-, image-, deployment-, target-readiness-, and focused live gates.
For releases, `release:plan` uses the accepted/deployed base and exact candidate,
the named target environment, universal release baseline, and affected slices;
a release label alone is not a full-regression trigger. Local-only evidence
cannot satisfy a production claim. Resolve a relevant failure in its affected
slice before expanding to new work or broader suites.

Apply `VERIFY-CLAIM-001` for completion/readiness questions. Report the actual
result, tests run or reused, material exclusions/blockers and requested Git or
deployment outcome. Do not create a new status document or repeat a long
checklist unless the project or user needs that artifact.
