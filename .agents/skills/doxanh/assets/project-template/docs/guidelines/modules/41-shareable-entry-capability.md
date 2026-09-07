
### 7.8.2 Shareable application entry points when required

When a project exposes more than one audience entry, invitation, pairing flow,
public resource, deep link, QR destination, or device/display entry, create one
canonical registry in `docs/ui-system.md`:

| Entry ID | Audience and purpose | Canonical host/path | Discovery/share surface | Authentication or proof | Expiry/revocation | Environment resolution | Owner/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |

Rules:

- Use the project's exact audience names. Do not assume the roles or scope
  hierarchy of a reference product.
- A general share action copies or opens only the canonical locator. Keep
  credentials, session cookies, bearer tokens, one-time codes, pairing proofs,
  and private query state out of reusable/shareable URLs.
- When access needs proof, issue it through a separately defined authenticated
  or rate-limited flow with explicit purpose, TTL, rotation, revocation, replay,
  and recovery semantics. A permanent URL or QR is not current authorization.
- The server owns canonical host construction from approved configuration and a
  strict trusted-proxy/forwarded-host policy. Do not construct security-relevant
  destinations from an arbitrary inbound `Host` header or client-supplied base
  URL.
- Define exact local, test, staging, and production resolution. Production
  output must not leak a development protocol, port, hostname, or seed-only
  credential.
- Surface each entry where its authorized user naturally manages or shares the
  related resource. Do not force the user to discover an unrelated global page
  solely to copy a contextual link.
- Provide copy and open actions and a QR only when QR is useful. Each rendered
  action must work; there are no placeholder buttons or silent no-ops.
- Verify audience authorization, wrong-scope identifiers, expired/revoked
  proof, canonical production host, clipboard/open/QR behavior, direct requests,
  and sensitive-value absence from logs, history, screenshots, and analytics.
