# Security policy

## Supported versions

Security fixes are applied to the latest tagged release. Consumers should use a
versioned installation lock and update through the guarded installer.

## Reporting a vulnerability

Do not open a public issue for a vulnerability, secret, private project path,
production log, or customer data. Report it privately to
`hungdh@doxanh.dev` with:

- the affected release and file;
- the impact and required preconditions;
- a minimal non-sensitive reproduction;
- any suggested remediation.

Do not include live credentials, tokens, database exports, or personal data.

## Package trust boundary

Managed-file SHA-256 digests detect consumer drift. They do not authenticate the
publisher. Pin a reviewed Git tag or commit, and use Git signature verification
when cryptographic publisher provenance is required.

The installer performs local file writes only. It does not execute a consuming
project, contact its services, or mutate its data. A consumer must still review
the installed standard, materialize project-specific gates, and run current
verification.
