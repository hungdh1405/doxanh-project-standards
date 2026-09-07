
### 10.9 Files and media

Activate this capability only when the product stores, processes, or serves
managed files. Static application assets do not require a customer-upload
workflow. Document each active file kind in the existing API, database,
security, and operations chapters; do not create a second source of truth.
Server/storage implementation obligations apply to owned boundaries. For an
external file service, record and verify its supported guarantees through the
approved API adapter and identify controls that remain the provider's
responsibility; do not invent a second backend or claim provider internals were
tested.

Before implementation, decide the storage/provider and environment boundary,
authorized uploaders/readers, owning resource and scope, allowed types, byte/
count/processing limits, public or protected access, inspection requirements,
original/derivative retention, replacement/deletion, and backup/restore policy.
Unknown ownership, publication, retention, or provider behavior blocks its
dependent slice under Section 4.18; ask the responsible owner instead of
inventing a bucket, scanner, retention period, or public-access policy.

Upload and publication:

- The server authorizes the owning resource and issues a bounded upload intent
  or handles the upload directly. Bind it to the authenticated actor/scope,
  logical file kind, server-selected storage key, limits, expiry, and allowed
  finalization action. A client filename, MIME type, URL, or object key is never
  proof of ownership or permission.
- Generate safe storage identities; keep a sanitized display filename separate.
  Validate the actual bytes/type and applicable content/processing limits,
  including decoded image dimensions or decompressed archive limits when used.
  Do not execute uploaded content or serve active content from a trusted
  application origin without the approved isolation and response-header policy.
- Define the upload, validation/inspection, ready, rejected, and deleted states
  that the workflow actually needs. Untrusted files remain unavailable to
  consumers until required checks pass. Quarantine, antivirus, content
  disarm/reconstruction, and manual moderation are risk-based decisions, not
  mandatory new infrastructure for every trusted-only file workflow.
- For direct/signed uploads, scope method/key/expiry and supported size/checksum
  constraints. Finalization reauthorizes the actor and owning resource, verifies
  the stored object's identity, bytes, limits, and required inspection result,
  and atomically attaches the accepted reference in PostgreSQL. A successful
  client upload callback does not prove the server accepted the file.
- A signed upload URL may be reusable until expiry and may overwrite its object
  key. Publish an immutable verified version or move/copy to a fresh protected
  key so an earlier upload grant cannot replace already accepted bytes. Define
  same-intent replay, concurrent finalization, and failed-finalization recovery.

Access and lifecycle:

- Resolve downloads, previews, derivatives, and exports through scope-safe
  authorization. Public access is an explicit publication decision. Signed
  download URLs are bearer access grants: define expiry, sharing, revocation
  limits, cache behavior, and safe redaction; do not imply app logout instantly
  revokes an already issued URL.
- Set content type, disposition, filename escaping, caching, and browser
  isolation deliberately. Remote URL imports additionally need the approved
  SSRF destination/redirect/network policy and bounded download/parse behavior.
- Replace the business reference only after the new object is accepted; keep
  the old object until references and retention policy permit deletion. Record
  durable cleanup intent for abandoned uploads, rejected objects, replaced
  versions, and derivatives. Recheck ownership/references before deletion and
  make cleanup retry-safe. Object storage and a PostgreSQL transaction are not
  one atomic commit; document recovery for failure on either side.
- Restore database references and retained objects consistently. Record what
  backups include and which expired/deleted objects cannot be recovered.

Verify the affected workflow with real approved storage or an explicitly named
compatible test service: wrong-scope access, forged type/key, size/processing
limits, incomplete or expired upload, required inspection failure, finalize
replay/race, accepted-byte immutability, protected download, replacement, and
cleanup recovery as applicable. These are capability acceptance cases; select
only changed risks and affected consumers for an existing-project edit under
`VERIFY-SCOPE-001`.
