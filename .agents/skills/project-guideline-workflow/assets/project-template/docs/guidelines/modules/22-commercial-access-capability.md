
When pricing, trials, plans, feature entitlements, quotas, seats, devices, or
contracted access exist, `commercial-model.md` must keep reusable offerings
separate from access assigned to a specific project-defined subject.

Define reusable offering/catalog rows with:

| Offering/version | Name and audience | Features/limits | Price/currency/tax meaning | Lifecycle | Sale/assignment window | Upgrade compatibility | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |

Define assignee-specific access rows with:

| Assignment ID | Assignee type/ID | Offering version | Start/end | Status | Approved overrides | Usage/seat/device basis | Renewal/replacement | Suspension/revocation | Audit/tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Rules:

- An offering describes what may be assigned. It does not make every assignee
  share one start date, end date, status, or override.
- An assignment/grant/subscription records who receives access, the exact
  offering version, effective period, current state, and authorized overrides.
  The generated project must choose one term and use it consistently.
- Distinguish a catalog edit from an assignment edit. Version or retire an
  offering when changing it would silently alter existing contracts.
- Define trial start/end, activation, scheduled access, renewal by extending an
  assignment, upgrade/downgrade, suspension, revocation, expiry, restoration,
  grace behavior, quotas, usage reset, and concurrent change semantics.
- Name the counted unit precisely. An account, membership, active session,
  registered device, concurrent device, API key, location, or usage event is
  not interchangeable with another unit.
- State whether price is snapshotted on assignment, calculated from a current
  catalog, invoiced externally, or outside the product. Never infer billing
  from access dates alone.
- Put reusable-offering creation/versioning in a catalog surface. Put current,
  scheduled, expired, suspended, and assignee-specific access management in the
  assignee detail context. A shortcut may link to the canonical action but must
  not create a second mutation contract.
- Define server authorization, optimistic revision, idempotency, activity,
  notification, outbox/job, reporting, and direct-request tests for every
  consequential change.
- If the product has no commercial access capability, keep the chapter as an
  honest N/A stub with its activation trigger; do not generate placeholder
  pricing or trial behavior.
