
## 10. Server, API, and data rules

### 10.1 API boundary

The implementation rules below govern the project's owned TypeScript server
boundary. A web or Flutter client consuming an existing external API must keep
that provider's approved wire contract, authentication, status, and version
semantics. Document any translation in one explicit client/integration adapter;
do not require a remote service rewrite, invent an envelope/DTO, or silently
substitute fallback data. Missing provider contracts block only the dependent
integration and require clarification under Section 4.18.

Every server route must:

1. establish request and correlation context
2. authenticate where required
3. parse and validate params, query, headers, and body
4. enforce role, scope, ownership, and record-state authorization
5. call a service/use case
6. map every expected outcome to the standard response contract
7. emit structured completion or failure telemetry

#### 10.1.1 Request validation

Zod is the required and only request-schema validation library. Nuxt/Nitro
request utilities read raw values; they are framework infrastructure, not a
second validation library. Do not add H3 or another package as a direct
application validation dependency.

For every first-party JSON application route:

1. read raw route params, query, selected headers, and body with the applicable
   Nuxt/Nitro request utilities
2. validate each applicable input group with an explicit Zod schema using
   `safeParse`, or `safeParseAsync` only when the schema has an approved
   asynchronous refinement or transform
3. map Zod issues into the standard HTTP `200`, `success: false`, registered
   non-zero result-code envelope and log it at `warn` without an exception stack
4. pass only parsed `result.data` into the service/use case

Rules:

- A TypeScript type, generic parameter, cast, or interface is not runtime
  validation.
- Prefer raw request readers plus Zod `safeParse` so expected validation does
  not escape as a framework-generated HTTP error.
- Do not use a request helper that automatically throws a validation HTTP status
  unless the boundary catches and maps it to the standard handled-result
  envelope.
- Define the unknown-key policy deliberately: reject, strip, or preserve only
  when the endpoint contract says so.
- Treat query and route values as untrusted strings. Use Zod coercion only where
  the contract explicitly permits it; do not silently coerce body values merely
  to make invalid input pass.
- Validate selected headers, not an unrestricted copy of every proxy or browser
  header.
- Keep transport schemas at the boundary. Stateful business invariants belong
  in services/use cases, and PostgreSQL constraints remain the final durable
  enforcement layer.
- Share a Zod schema through `shared/schemas/` only when the client and server
  meanings are truly identical. Otherwise keep the stricter request schema in
  `server/validation/`.

`docs/api-contract.md` must name the Zod schema path, input groups, unknown-key
policy, coercions/transforms, handled numeric result code, and returned
field-error data shape for each endpoint.

#### 10.1.2 Protected mutation rate limiting

Rate limiting is an application boundary, not repeated controller logic.
Public and pre-authentication routes use endpoint-specific IP, challenge,
identity-correlation, and session-abuse controls. In addition, every protected
unsafe method (`POST`, `PUT`, `PATCH`, and `DELETE`) must pass one central
authenticated-mutation limiter after trusted-origin and authenticated actor
resolution but before the route use case runs.

The generated project book must specify:

- the exact actor-wide and registered-action/target limits, time windows,
  burst policy, retry contract, result code, and client recovery behavior
- which authoritative actor-context scope type/ID namespaces the limit for
  each actor and host, using the project's closed actor/scope catalogs rather
  than an open generic string or a client-submitted scope
- the normalized action/route ID and optional target dimension; never place an
  untrusted raw URL, query string, request body, email, token, or other
  sensitive value into the key
- the runtime environment and application namespace so development, test,
  staging, production, and unrelated applications cannot share a bucket
- the central shared store, outage/fail-open-or-closed decision, metrics,
  WARN/log-redaction contract, retention/TTL, and auto-scale behavior

For Redis, use an atomic increment plus first-expiry operation, normally Lua,
so concurrent API replicas cannot create an immortal counter. Bind actor,
authoritative scope, dimension, registered action, and safe target through a
server-secret HMAC when their raw values should not appear in infrastructure
keys. A security-sensitive protected mutation should fail closed when the
central limiter dependency fails unexpectedly; map that failure to the
standard HTTP `500` envelope, not a handled rate-limit result.

The limiter result is an expected HTTP `200`, `success: false`, registered
non-zero outcome and WARN event. It does not replace authorization,
idempotency, optimistic concurrency, database constraints, or per-integration
limits. Tests must prove boundary order, actor/action thresholds, concurrent
atomicity, TTL, environment and authoritative-scope isolation, opaque key
material, horizontal-replica sharing, handled-result telemetry, and the
documented dependency-failure decision.

#### 10.1.3 Response envelope

Every first-party JSON application endpoint must return the same flat response
envelope:

- `success`
- `code`
- `message`
- `data`
- `request_id`

All five top-level fields are required. Do not add endpoint-specific top-level
keys.

Required successful-result shape:

```json
{
  "success": true,
  "code": 0,
  "message": "If this request is allowed, a verification email will arrive shortly.",
  "data": {
    "challenge_type": "code"
  },
  "request_id": "req_01JABCXYZ123"
}
```

Required handled business/validation-result shape:

```json
{
  "success": false,
  "code": 1001,
  "message": "Please correct the highlighted fields.",
  "data": {
    "field_errors": [
      {
        "field": "quantity",
        "code": 100101,
        "message": "Enter a value greater than zero.",
        "params": {
          "minimum": 1
        }
      }
    ]
  },
  "request_id": "req_01JABCXYZ123"
}
```

Required unexpected-error shape:

```json
{
  "success": false,
  "code": 9000,
  "message": "An unexpected error occurred. Try again or contact support with the request ID.",
  "data": null,
  "request_id": "req_01JABCXYZ123"
}
```

Response-field rules:

- `success` is the authoritative application-result signal. It is `true` only
  when the requested application operation completed successfully.
- `code` is a required integer. `0` is permanently reserved for real application
  success. Every handled business outcome and every unexpected failure uses a
  stable registered non-zero code.
- `success: true` requires `code: 0`; `success: false` requires a non-zero code.
  Any other combination is a contract violation that clients and contract tests
  must reject.
- Clients use the numeric code for control flow, analytics, localization, and
  tests. Do not infer meaning from a numeric range unless the project's result
  code registry explicitly defines ranges.
- `message` is a required safe human-readable summary. It must not contain
  secrets, stack traces, provider payloads, internal paths, or unsafe personal
  data. Clients must not branch on message text. `docs/api-contract.md` must
  state whether the server localizes it from the request locale or returns one
  documented fallback language.
- `data` is the endpoint-specific payload. Use `null` when there is no payload.
  Put pagination, validation details, retry information, and other structured
  result details inside `data`, never in new top-level fields.
- `request_id` is required for logs and support. Return the same value in the
  `X-Request-ID` response header.

List results keep pagination inside `data`:

```json
{
  "success": true,
  "code": 0,
  "message": "Orders retrieved.",
  "data": {
    "items": [],
    "pagination": {
      "next_cursor": null,
      "has_more": false
    }
  },
  "request_id": "req_01JABCXYZ123"
}
```

HTTP/result rules:

- Return HTTP `200` for every handled application outcome, including success,
  validation failure, business-rule rejection, known constraint conflict,
  authentication failure, authorization denial, application-level not-found,
  rate limit, and a known recoverable dependency outcome. Use `success` and
  `code` to distinguish the result.
- Do not use HTTP `4xx` to represent a handled first-party application result
  under this contract.
- Return HTTP `500` only for an unexpected, unhandled programming or system
  failure. The central handler still returns the five-field envelope with
  `success: false`, a registered non-zero internal-error `code`, safe `message`,
  `data: null`, and `request_id`.
- Do not throw generic exceptions for expected validation, constraint, state,
  permission, or other business outcomes. Return a typed result or a typed
  application error that the boundary maps to HTTP `200`.
- Do not catch programmer defects and disguise them as handled business results.
- Generate shared TypeScript and Dart envelope models or contract tests from the
  same API contract; do not hand-invent different client response shapes.
- Nuxt and Flutter may localize by `code`; `message` remains the safe
  human-readable server summary or fallback.
- Clients treat HTTP `200` as transport completion, not application success.
  They proceed on the success path only when `success` is `true` and `code` is
  `0`.
- Do not automatically retry an HTTP `200` response with a non-zero code unless
  that registered result explicitly permits retry and defines the retry
  behavior.
- Cache first-party JSON application results only when the endpoint contract
  permits it and the result has `success: true` and `code: 0`. Sensitive,
  mutation, challenge, and non-zero-code results are `no-store` by default.

Protocol-driven exceptions include `204 No Content`, redirects, files, streams,
SSE, health/metrics formats, provider-mandated webhook responses, and third-party
callback contracts. Document every exception in `docs/api-contract.md`, including
its content type, status behavior, error behavior, and client handling. An
exception does not authorize an unrelated JSON endpoint to invent a new shape.
Respect bodyless `HEAD`/`204`/`304` responses, conditional/range requests, and
protocol-required headers; never attach an envelope where HTTP forbids a body.
The handled-`200` convention is a deliberate first-party application contract,
not a claim that external HTTP protocols or third-party SDKs use that convention.
An unknown route or method, unsupported content type, malformed transport that
cannot enter the application boundary, reverse-proxy rejection, or upstream
infrastructure response may still use its appropriate non-`200` protocol status.
Return the standard envelope when the application controls that JSON response;
clients must also handle non-envelope infrastructure failures defensively.

Central result and exception handling must:

- normalize unknown failures into the standard HTTP `500` envelope
- preserve expected validation, authentication, authorization, conflict,
  not-found, rate-limit, and dependency result codes in HTTP `200` envelopes
- attach and return the request ID in the standard header and `request_id` field
- log every HTTP `200` result with `code: 0` as normal `info` completion telemetry
- log every HTTP `200` result with a non-zero code as `warn`, including the
  numeric code and request ID but no manufactured exception stack
- log each unexpected server-side error once with safe context and a restricted
  server-side stack at `error`
- avoid duplicate controller/route logging for the same outcome or exception
- never expose stack traces, SQL, secrets, internal paths, or provider payloads
  to clients
- keep the stable machine `code` separate from the human-readable `message`
- preserve framework-native redirects, streams, and response errors where the
  documented endpoint contract requires them

Define application error classes or discriminated result types only for
outcomes callers can meaningfully handle. Unexpected programmer and system
errors remain HTTP `500`; a handled HTTP `200` result with `success: false` must
always carry a specific registered non-zero `code`.

#### 10.1.4 External APIs and webhooks when active

For each approved integration, `docs/api-contract.md` must name the official
contract/version, environment and account binding, authentication/secret owner,
request and response schemas, limits/timeouts, retry/idempotency policy,
redaction, compatibility, and reconciliation/recovery behavior. Do not infer
these from an example response or a successful browser redirect. Validate
untrusted provider responses at the adapter and map them to approved internal
outcomes without disguising malformed or unknown data as success.

For inbound webhooks or callbacks that can change durable state:

- Use the provider's documented signature/authentication method and preserve
  the exact raw bytes when verification requires them. Validate timestamps,
  replay limits, schema/version, expected environment/account, and event kind
  before any business effect. An IP allowlist or hidden endpoint alone is not
  signature verification.
- Resolve ownership and scope from trusted provider-to-project mappings, never
  an unrestricted submitted account/resource ID. Browser return URLs and client
  payment-success messages do not establish settlement or grant access.
- Persist a verified event/intent with a scoped unique provider-event identity
  before acknowledging acceptance when later processing is asynchronous. Define
  duplicates, different payloads for one identity, out-of-order events, and
  unknown event handling. Preserve the provider's acknowledgement status/body
  contract; a local application envelope must not suppress provider retries
  after a failed durable handoff.
- Run the same authorized domain transition and audit/effect rules as other
  entry paths. A webhook is an integration execution context, not a fabricated
  human session. Bound parsing, delivery attempts, retention, and replay access.

For outbound effects, enforce deadlines/cancellation, bounded response size,
approved destinations/redirects, and the provider's retry contract. A timeout
may mean the provider accepted the operation even though the response was lost;
reuse a supported idempotency key or reconcile before repeating a potentially
duplicate effect. Keep provider-confirmed facts separate from local delivery
intent as defined in Section 10.7. Test the changed authentication, validation,
duplicate/order, failure, and recovery boundaries against approved fixtures or
the named provider sandbox; neither proves production behavior by itself.
