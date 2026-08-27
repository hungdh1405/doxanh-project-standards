
### 10.2 PostgreSQL and Drizzle

Schema and integrity:

- Keep the Drizzle schema and reviewed SQL migrations in version control.
- Treat the Drizzle schema as the reviewed intended current model, committed SQL
  migrations as immutable change history, and the applied PostgreSQL schema as
  runtime state that must be checked. Do not rewrite an applied migration to
  make history appear clean.
- Record the PostgreSQL version, extensions, schema names, identifier strategy,
  naming rules, and public-identifier boundary in `docs/database-schema.md`.
- Define not-null, foreign-key, unique, check, exclusion, and other durable
  constraints in PostgreSQL, not only in application validation.
- Name important constraints and map expected violations to registered numeric
  result codes without parsing vendor error text as the primary business rule.
- A known business constraint conflict is a handled HTTP `200`,
  `success: false`, non-zero result logged at `warn`. An unknown database or
  migration failure remains an unexpected HTTP `500`/operation failure logged
  at `error`.
- Index referencing columns and access paths when query or delete/update
  behavior requires it; do not assume a foreign key creates the needed
  referencing index.
- Use partial, expression, covering, specialized, or partitioned indexes only
  for a documented constraint or measured query need.
- Keep stable query/filter/order keys relational. Use `jsonb` for an explicitly
  versioned flexible contract, validate writes with Zod, and promote stable
  relationships/invariants/common access keys to typed columns.
- Document database-generated defaults separately from application defaults.
  A default must not hide a value that the business workflow must choose.
- Choose PostgreSQL enums, check-constrained text, or reference tables
  deliberately. Document how values are introduced, retired, localized, and
  kept backward compatible.
- Store instants in timezone-aware columns and UTC; store a separate IANA zone
  only when the business meaning depends on a local zone. Document conversion
  and daylight-saving behavior.
- Persist any scope-specific date/time presentation setting separately from
  instants. Use a not-null system default, a closed format preset constraint,
  a non-blank IANA zone field, versioned mutation, and activity evidence. The
  application validates membership in the runtime IANA catalog because a
  PostgreSQL `CHECK` must not depend on a changing timezone lookup table.
- Use exact numeric types or a documented minor-unit integer convention for
  money and other precise quantities. Never use floating point for exact money.
- Define one soft-delete vocabulary and specify which tables are hard-deleted,
  soft-deleted, anonymized, archived, or immutable.
