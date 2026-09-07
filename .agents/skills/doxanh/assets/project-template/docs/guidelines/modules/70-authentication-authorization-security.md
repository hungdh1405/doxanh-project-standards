
## 11. Authentication, authorization, and security

Apply server implementation rules to owned server boundaries and native/browser
session rules to the selected clients. With an external identity/API provider,
document its actual contract and the client's enforcement responsibilities;
do not invent a second identity store, server framework, or authentication path
merely to satisfy an inactive profile.

### 11.1 Authentication

Define:

- identity provider and login identifiers
- password, passkey, and MFA policy as applicable, including which mechanisms
  are intentionally absent so generators do not invent a second auth path
- secure recovery
- session lifetime and idle timeout
- session rotation and revocation
- account disable and forced logout behavior
- throttling by identifier and source
- privileged re-authentication requirements

Do not infer a universal one-device or unlimited-session rule. The generated
`docs/security-model.md` must decide per exact project actor type:

| Actor type | Credential/session kind | Concurrent session/device limit | Counted identity | New sign-in behavior | Tabs/windows | Expiry/refresh | Revoke/recover | Realtime effect | Commercial-limit link | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

The policy must define:

- whether it counts active sessions, registered devices, concurrent devices,
  memberships, API credentials, or another unit; do not call all of them
  `staff` or `users`
- the stable device/client identifier and privacy boundary when device counting
  exists; a mutable user-agent string or IP address alone is not a device ID
- whether another browser tab shares one browser session and how private/
  cleared storage affects device identity
- whether a new sign-in is rejected, replaces the oldest session, requires
  explicit approval, or revokes all other sessions
- refresh rotation, replay detection, idle/absolute expiry, logout, passwordless
  recovery or other approved recovery, account disable, role/access change, and
  administrator revocation behavior
- how revocation reaches API authorization, cached policy, WebSocket
  connections/subscriptions, background jobs, and protected local state
- the user-visible active-session/device list, naming, last-seen data, revoke
  action, accessibility, and privacy decision when self-management is supported
- direct race tests for simultaneous sign-ins at the limit, refresh/revoke,
  expired sessions, replaced sessions, and cross-tenant/account isolation

If a commercial plan constrains the counted unit, link the exact
`commercial-model.md` entitlement and define fail-closed behavior when usage is
at the limit. Commercial configuration never replaces server authentication or
authorization enforcement.

For browser sessions:

- prefer secure, `HttpOnly`, appropriately scoped cookies
- use `SameSite` and CSRF protection appropriate to the architecture
- do not store long-lived bearer tokens in local storage
- rotate session identifiers after authentication and privilege changes
- invalidate sessions when account or access state changes

For native sessions:

- keep access tokens short-lived and refresh credentials in secure storage
- serialize refresh attempts and rotate/revoke refresh credentials server-side
- clear protected local state on logout, account disable, or unrecoverable
  session expiry
- never treat biometric device access as server authorization by itself

### 11.2 Authorization

Authorization is deny by default. An operation proceeds only when an explicit
policy allows it. Evaluate:

- actor identity
- role
- tenant/scope
- ownership
- subject-to-resource relationship
- record state
- explicit capability flags
- delegation, impersonation, or override context
- security-sensitive environmental conditions when the threat model requires
  them

Authentication creates one immutable, server-derived
`AuthenticatedActorContext` in the execution's Awilix child scope. Every
protected entry handler requires it. The context includes the internal actor
ID, bounded display-name snapshot, optional role assignment, stable role and
permission keys, authorization version when used, impersonator, registered
authorization scope hierarchy, and safe request correlation. Missing context
fails closed.

Enforce authorization on every protected request, job, realtime subscription,
file access, export, and server-side action. Route middleware and UI gating may
improve navigation but are not the enforcement boundary.

Every sensitive action needs:

- useful UI gating when an active client interface exposes the action
- one named server policy/enforcement point
- scope-safe lookup
- field- and output-level filtering where full resource visibility is not
  allowed
- an explicit allowed-state transition
- a stable handled numeric denial code and safe recovery message
- direct-request denial tests
- warning telemetry and audit behavior when appropriate

Rules:

- Load records through scope-safe predicates or verify scope before revealing
  whether an identifier exists.
- Do not grant access merely because an actor has a broad role. Apply every
  ownership, relationship, state, and capability condition named by the
  permission contract.
- Do not authorize by display name or treat the injected context as proof that
  a target belongs to its tenant. Policies and scope-safe queries verify the
  requested resource; high-risk or long-running work rechecks current
  assignment/revocation state as documented.
- Explicit deny wins over inherited or conditional allow unless an approved
  break-glass rule says otherwise and records the override.
- Role or capability changes must invalidate or bound stale sessions, cached
  authorization, active subscriptions, and queued work according to the
  documented revocation window.
- Background jobs carry the minimum actor/scope/revision context required for
  audit and re-check current authorization or durable preconditions when the
  action still depends on current access.
- Realtime subscription authorization is checked at subscribe/reconnect time
  and again when membership or access changes.
- Impersonation and support access show the acting and represented identities,
  require an approved reason and duration, restrict prohibited actions, and
  write durable audit records.
- Break-glass access is exceptional, time-bounded, alerted, reviewed, and never
  a hidden permanent administrator shortcut.
- Permission assignment and removal follow the role/capability ownership,
  re-authentication, approval, separation-of-duty, expiry, and audit rules in
  `docs/permissions-matrix.md`.
- A handled denial returns HTTP `200`, `success: false`, and its registered
  non-zero code under Section 10.1. It is logged at `warn` without an exception
  stack.
- Tests cover allowed and denied paths for wrong role, tenant, owner,
  relationship, state, capability, guessed identifier, stale session,
  impersonation, and direct requests that bypass the UI.

Never rely on role alone, hidden buttons, client state, or unscoped record IDs.

### 11.3 Security baseline

- Validate every owned TypeScript request boundary with Zod; native clients use
  the approved Dart models and explicit runtime parsing from their profile.
  Do not introduce an
  equivalent or parallel schema-validation library without an approved ADR.
- Escape output by default and sanitize any approved rich HTML.
- Protect against IDOR, CSRF, XSS, injection, unsafe redirects, SSRF, upload
  abuse, replay, and cross-tenant access.
- Rate-limit authentication, expensive reads, writes, uploads, and abuse-prone
  public endpoints.
- Store secrets outside source control and validate required runtime values at
  boot.
- Use least-privilege credentials for database, Redis, object storage, and
  providers.
- Redact credentials, cookies, tokens, secret headers, and sensitive personal
  data from logs and error reports.
- Keep dependencies and runtime images patched and scanned.
- Use a Content Security Policy appropriate to the product.
- Review third-party scripts and load only necessary ones.
- Audit permission changes, security overrides, impersonation, exports,
  financial changes, and destructive actions.
