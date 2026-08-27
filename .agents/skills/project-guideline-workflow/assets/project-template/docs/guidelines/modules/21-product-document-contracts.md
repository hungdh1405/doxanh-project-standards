
### 4.7 Minimum content contracts: orientation and product

#### Book cover and repository entry

`docs/README.md` must include:

- project-book purpose and active profiles
- lifecycle, implementation, evidence, and severity legends
- ordered chapter table generated from `book-manifest.yaml`
- the reading paths from Section 4.6
- canonical ownership map
- manifest/schema locations and documentation generate/check commands
- how to review, approve, supersede, and deprecate a chapter
- broken-link and stale-review policy
- unresolved blocking development decisions and intentionally `N/A` chapters

It must not become a second product specification.

The root `README.md` must state the project purpose and active platform profiles,
identify the runnable workspace when it is not the root, provide only the
minimum verified Docker/Make bootstrap path, and link to chapters `00`, `10`,
and `45`. It is an onboarding entry point, not a progress report, handoff log,
or duplicate engineering standard.

#### Product, glossary, domain, module, phase, and traceability

`product-spec.md` must include:

- problem, target audience, and context of use
- actors and tenant/scope boundaries
- top workflows with start, intermediate, terminal, and failure states
- business invariants, irreversible actions, and immutable records
- locale, timezone, currency, unit, and retention expectations
- measurable outcomes and explicit exclusions
- stable requirement IDs and product-level acceptance

`glossary.md` must define:

| Term | Definition | Actor-facing label | Allowed abbreviation | Forbidden/ambiguous synonyms | Related IDs/states | Owner |
| --- | --- | --- | --- | --- | --- | --- |

Domain specifications contain detailed business behavior only. Frameworks,
ORMs, UI libraries, and deployment choices belong elsewhere.

For every module, `module-breakdown.md` must define:

- purpose and owning capability
- actors
- inputs and outputs
- rules and state ownership
- owned DATA entities/tables, TX write paths, QRY access paths, and tenant/scope
  boundaries
- stable activity `module_key` and owned `tag_type` values
- upstream/downstream modules
- APIs, events, and jobs consumed or produced
- phase and verification dependency

It does not own source paths; `source-file-guide.md` does.

Every MVP phase must define:

- goal and user-visible outcome
- included and excluded requirements
- prerequisite chapters and decisions
- build scope
- expected outputs
- deterministic data and fixture needs
- verification and evidence
- exit criteria
- deferred work and rollback or learning point

`requirements-traceability.md` must make uncovered high-risk requirements
visible. It references canonical IDs; it does not rewrite their requirements.
It also maintains the centralized clarification register from Section 4.18 so
open development decisions remain visible without creating a status or handoff
document.
