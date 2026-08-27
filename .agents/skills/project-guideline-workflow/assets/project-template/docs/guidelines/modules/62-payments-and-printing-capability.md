
Country-aware payment materialization:

- When a project accepts or displays payments, the generated project book must
  define the exact country/scope field, default country, supported country
  catalog, accepted method catalog, currency/minor-unit rule, provider boundary,
  settlement authority, and non-supported-country fallback. Do not infer those
  facts from locale, browser timezone, host text, or client input.
- Persist accepted payment methods explicitly and require at least one. Separate
  “the business accepts this externally handled method” from “this application
  charges through a payment gateway”; do not imply a processor exists.
- Keep provider catalogs server-owned. A client submits only an approved stable
  provider key and customer-entered account fields. The server resolves and
  snapshots provider IDs, BIN/routing codes, names, capabilities, currency, and
  protocol fields. Reject unknown, deprecated, unsupported, receive-only, or
  wrong-provider-type entries and every undeclared client field.
- Treat a package/provider catalog as untrusted runtime data: parse every
  exposed row through a strict Zod schema, validate exact identifier/code/
  capability formats, require a non-empty approved set, and reject duplicate
  stable keys or protocol identifiers. A malformed catalog must fail closed at
  startup or readiness; it must never become a partially trusted client list.
- Encrypt full payment-destination account/credential values at rest with
  authenticated encryption, random nonces/IVs, associated data, and an explicit
  versioned keyring. List/activity/log projections are masked and never contain
  plaintext, ciphertext, encryption material, full QR payloads, or unrestricted
  provider responses. Document rotation, mixed-version reads, re-encryption,
  backup/restore, retention, and authorization.
- If operators need a private note about ownership, purpose, or switching
  history, model it separately from customer-visible payment instructions.
  Encrypt it with distinct associated data and include it only in an explicitly
  authorized configuration read/edit projection. Apply the security-sensitive
  notification contract in Section 8.11 whenever an effective receiving
  destination can change.
- Enforce one explicitly defined active/default destination policy with
  database uniqueness plus transactional service rules. Country/provider
  changes cannot silently reinterpret an existing destination. Settlement
  snapshots the exact customer-visible destination, amount, currency,
  reference, protocol payload, and artifact needed to preserve history.
- If a generated project supports a country- or network-specific payment QR,
  approve one maintained encoder/catalog adapter under the dependency gate.
  Define supported country, currency, transfer capability, excluded provider
  types, server-resolved routing identity, immutable amount/reference source,
  encoding limits, decode-based fixtures, and upgrade ownership in the project
  book. Do not put a specific country's provider into this generic standard.
- For a country or method without an approved QR/provider integration, show
  bounded text payment/instruction information only. Never substitute an
  unapproved remote QR-image service or silently fall back to another payment
  method.
- Materialize these decisions through product/domain requirements, API Zod
  schemas/result codes, relational constraints/migrations, permissions, activity
  tags, security/threat rules, UI screen/flow contracts, test matrices,
  operations/key rotation, and requirements traceability. If country, method,
  account format, settlement authority, or provider behavior is unclear, stop
  project generation and ask the product owner rather than guessing.

Financial settlement, adjustment, and printing decisions:

- Before implementing billing, the generated project book must decide one bill
  versus split bills, full versus partial or mixed settlement, tax order,
  rounding/minor-unit rules, bill-number allocation, mutable versus frozen
  states, and the exact event that closes financial facts. Do not infer these
  rules from an old screen or schema.
- Define every adjustment as a closed command contract: actor/permission,
  bill or line scope, fixed-minor-unit or percentage representation, stacking
  policy, positive/maximum bounds, eligibility base, tax order, required reason,
  optimistic revision, idempotency, activity tag, and database constraint.
  If any material limit or authorization rule is unknown, keep the feature
  blocked and ask the product owner.
- Distinguish bill request, payment confirmation, void/cancellation, refund,
  write-off, and unpaid/walkout states. Each terminal outcome needs its own
  immutable row or snapshot, revenue/reporting meaning, actor attribution,
  reason policy, concurrency rule, activity, event, and test; never represent
  an unpaid close as a successful payment.
- A payment confirmation must resolve the exact accepted method and, when
  relevant, the exact operator-selected destination. The displayed account or
  QR must match that selected destination and the current server-calculated
  amount/reference. Never display a mutable default/setup QR as if it were the
  selected final payment instruction.
- Snapshot immutable line, adjustment, tax, total, destination, protocol
  payload, actor, and time facts at the documented financial-finalization
  boundary. Historical bills and reports must not read mutable menu, provider,
  account, display-name, or tax configuration as their source of truth.
- Require row locks or optimistic versions, a durable idempotency key, one-
  settlement database constraints, same-transaction financial activity, safe
  committed invalidation events, and concurrent same-key/different-key tests.
- Decide printing topology separately from bill content. Browser print preview
  is a manual client-side output and must render only an authorized,
  server-resolved bill revision through a dedicated layout; terminal receipts
  use immutable settlement snapshots. Automatic ESC/POS or other onsite/
  network-local printing requires an approved authenticated local bridge,
  durable print intent/delivery state, environment/scope-safe job keys, retry
  semantics, and operational runbooks. Autoscaled cloud API replicas must not
  assume access to a private LAN printer.
- When a printable operational document represents incremental work, define a
  durable server-owned batch/part identity at the business commit that releases
  that work, not when a browser print button is clicked. Allocate its positive
  scope-local sequence under the same aggregate lock, attach every released
  line to exactly one part, make the ordinary print route select one explicit
  part, and make an explicit reprint retain that part number. A later business
  commit creates a later part and must never silently include earlier parts.
  Any optional recovery projection such as “all work not yet started” must be
  a separately named, server-filtered, authorized closed scope with explicit UI
  confirmation and tests for every excluded state. The generated book must
  close the printed row order and information hierarchy instead of inheriting
  incidental database or insertion order. For human-scanned item lists, lead
  with the full item name, then an explicit quantity and state; state whether
  ordering is locale-aware alphabetical, business-priority, or chronological,
  and prove the choice with deliberately reverse-ordered fixtures. Under
  browser printing, never persist `print_completed` or use `window.print()`
  return as delivery proof: the browser cannot distinguish print, cancel,
  driver failure, or physical-printer failure. True completion requires an
  approved local bridge and an acknowledged delivery ledger.
- Every generated printable business document must define its issuing identity
  block explicitly. Use one reusable prop-only component fed by the authorized
  server projection, lead with the project-defined organization/location
  display name, and include only the approved public contact fields such as
  address, phone, or canonical website. State which fields are required or
  nullable, their Zod and database constraints, snapshot/current-value
  semantics, and clean omission behavior. Never accept identity facts from a
  print query, duplicate the header composition per page, or render empty
  labels for missing optional values.
- When browser print is selected, the generated book must define a closed paper
  profile for every document kind rather than relying on the operator's last
  browser setting. Name the supported physical width, finite page length,
  margins, default and alternatives, query/config source, authorization, and
  maximum document size. Use CSS `@page size` and named pages; keep screen-only
  controls out of print media.
- Define fragmentation deliberately: one document boundary, item rows and
  semantic summary/QR/signature blocks with `break-inside: avoid`, long
  collections breakable only between rows, and explicit force-before/after
  utilities for approved composed documents. Do not apply `break-inside:
  avoid` to an unbounded whole document because the browser must still be able
  to paginate it.
- Define a physical print type scale separately from screen typography and
  apply it only under print media. Unless a documented hardware/user study
  approves another scale, use at least 10.5–11 pt for primary body text,
  9.5–10 pt for secondary metadata, 13–16 pt bold for critical totals,
  table/order identity, or item quantities, 1.35–1.5 line height, and
  high-contrast dark text on white. Never use browser zoom, scale-to-fit, or
  sub-9 pt text to force content onto fewer thermal pages. Narrow profiles
  must wrap or stack fields and may become longer; define safe fragmentation
  between complete semantic pairs/rows instead of shrinking the type.
- Browser/PDF verification must prove the resolved physical width and height
  with CSS page size preferred, selector/query persistence, controls hidden in
  print media, computed physical print font sizes, no clipped content,
  pair/row-safe multi-page fragmentation, critical first-page context, and no
  empty trailing page. The generated project book must distinguish this proof
  from printer-driver/hardware evidence.
