import { createHash } from 'node:crypto'
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '../..')
const manifestPath = resolve(
  projectRoot,
  'docs/guidelines/guideline-manifest.json',
)
const schemaPath = resolve(
  projectRoot,
  'docs/guidelines/guideline-manifest.schema.json',
)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const command = process.argv[2] ?? 'check'

function fail(messages) {
  const list = Array.isArray(messages) ? messages : [messages]
  console.error(`Guideline ${command} failed with ${list.length} issue(s):`)
  list.forEach(message => console.error(`- ${message}`))
  process.exit(1)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function lineCount(value) {
  return [...value.matchAll(/\n/g)].length
}

function parseCsvOption(name) {
  const directIndex = process.argv.indexOf(name)
  const equals = process.argv.find(value => value.startsWith(`${name}=`))
  const raw = equals?.slice(name.length + 1)
    ?? (directIndex >= 0 ? process.argv[directIndex + 1] : undefined)
  return new Set(
    (raw ?? '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  )
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireStringArray(errors, label, value) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.length === 0)) {
    errors.push(`${label} must be an array of non-empty strings`)
    return []
  }
  if (new Set(value).size !== value.length) {
    errors.push(`${label} must not contain duplicates`)
  }
  return value
}

function validateManifestShape() {
  const errors = []
  JSON.parse(schemaSource)
  if (manifest.schema_version !== 1) errors.push('schema_version must be 1')
  if (manifest.entry_path !== 'docs/guidelines/README.md') {
    errors.push('entry_path must be docs/guidelines/README.md')
  }
  if (manifest.entry_template_path !== 'docs/guidelines/entry-template.md') {
    errors.push('entry_template_path must be docs/guidelines/entry-template.md')
  }
  if (manifest.agent_instructions_template_path !== 'docs/guidelines/AGENTS.template.md') {
    errors.push('agent_instructions_template_path must be docs/guidelines/AGENTS.template.md')
  }
  if (!isRecord(manifest.semantic_baseline)) {
    errors.push('semantic_baseline must be an object')
  }
  else {
    if (!/^[a-f0-9]{64}$/u.test(manifest.semantic_baseline.sha256 ?? '')) {
      errors.push('semantic_baseline.sha256 must be a lowercase SHA-256 digest')
    }
    for (const field of ['bytes', 'lines']) {
      if (!Number.isInteger(manifest.semantic_baseline[field]) || manifest.semantic_baseline[field] < 1) {
        errors.push(`semantic_baseline.${field} must be a positive integer`)
      }
    }
  }
  if (!isRecord(manifest.profiles)) errors.push('profiles must be an object')
  const requiredProfiles = requireStringArray(
    errors,
    'profiles.required',
    manifest.profiles?.required,
  )
  const optionalProfiles = requireStringArray(
    errors,
    'profiles.optional',
    manifest.profiles?.optional,
  )
  const capabilities = requireStringArray(
    errors,
    'capabilities',
    manifest.capabilities,
  )
  const profileOverlap = requiredProfiles.filter(profile => optionalProfiles.includes(profile))
  if (profileOverlap.length > 0) {
    errors.push(`required and optional profiles overlap: ${profileOverlap.join(', ')}`)
  }
  const expectedEnvelope = {
    top_level_fields: ['success', 'code', 'message', 'data', 'request_id'],
    endpoint_specific_field: 'data',
    success_code: 0,
    handled_http_status: 200,
    unexpected_http_status: 500,
    extra_top_level_fields: 'forbidden',
  }
  if (
    JSON.stringify(manifest.critical_contracts?.api_response_envelope)
    !== JSON.stringify(expectedEnvelope)
  ) {
    errors.push('critical_contracts.api_response_envelope differs from the fixed contract')
  }
  const expectedChoiceControls = {
    rule_id: 'UI-CONTROL-001',
    select_max_options: 9,
    combobox_min_options: 10,
    combobox_for_remote_catalogs: true,
    combobox_for_name_or_code_lookup: true,
  }
  if (
    JSON.stringify(manifest.critical_contracts?.ui_choice_controls)
    !== JSON.stringify(expectedChoiceControls)
  ) {
    errors.push('critical_contracts.ui_choice_controls differs from the fixed contract')
  }
  const expectedUiCopy = {
    rule_id: 'UI-COPY-001',
    implementation_details_forbidden: true,
    policy_narration_forbidden_by_default: true,
    complete_rendered_copy_review: true,
    canonical_actor_scope_vocabulary: true,
    raw_or_humanized_technical_keys_forbidden: true,
    competing_synonyms_rejected: true,
  }
  if (
    JSON.stringify(manifest.critical_contracts?.ui_copy)
    !== JSON.stringify(expectedUiCopy)
  ) {
    errors.push('critical_contracts.ui_copy differs from the fixed contract')
  }
  const expectedUiDensity = {
    rule_id: 'UI-DENSITY-001',
    default_density: 'compact',
    phone_touch_target_min_css_px: 44,
    adjacent_target_separation_min_css_px: 8,
    desktop_action_width: 'natural',
  }
  if (
    JSON.stringify(manifest.critical_contracts?.ui_density)
    !== JSON.stringify(expectedUiDensity)
  ) {
    errors.push('critical_contracts.ui_density differs from the fixed contract')
  }
  const expectedUiAudienceProjection = {
    rule_id: 'UI-AUDIENCE-001',
    server_authoritative: true,
    complete_observable_surface: true,
    shared_components_permission_neutral: true,
    filter_options_from_authorized_scope: true,
    counts_and_facets_scope_projected: true,
    cross_boundary_identity_default: 'redacted',
    direct_request_no_leak_tests: true,
  }
  if (
    JSON.stringify(manifest.critical_contracts?.ui_audience_projection)
    !== JSON.stringify(expectedUiAudienceProjection)
  ) {
    errors.push('critical_contracts.ui_audience_projection differs from the fixed contract')
  }
  const expectedVerificationScope = {
    rule_id: 'VERIFY-SCOPE-001',
    default_mode: 'risk-scoped',
    safe_fallback_requires_review: true,
    unrelated_suites_forbidden: true,
    changed_evidence_binding: 'maintained-content-fingerprint',
    commit_only_transition_preserves_evidence: true,
    full_release_revision_binding_strict: true,
    source_change_scope: 'changed-module-boundaries-and-direct-consumers',
    source_change_forces_full_regression: false,
    multi_module_scope: 'union-of-focused-slices',
    release_scope: 'candidate-diff-plus-universal-release-baseline',
    release_candidate_forces_full_regression: false,
    release_base_revision_required: true,
    release_target_environment_required: true,
    release_predeployment_baseline_required: true,
    release_postdeployment_baseline_required: true,
    release_unrelated_suites_forbidden: true,
    full_regression_triggers: [
      'explicit-request',
      'initial-release-or-missing-baseline',
      'cross-cutting-change',
      'systemic-evidence',
      'unbounded-impact',
    ],
  }
  if (
    JSON.stringify(manifest.critical_contracts?.verification_scope)
    !== JSON.stringify(expectedVerificationScope)
  ) {
    errors.push('critical_contracts.verification_scope differs from the fixed contract')
  }
  const expectedVerificationClaim = {
    rule_id: 'VERIFY-CLAIM-001',
    claim_unit: 'declared-finite-scope',
    binary_lead_required: true,
    absolute_zero_defect_claim_forbidden: true,
    scope_complete_requires_zero_open_boundaries: true,
    incomplete_claim: 'not_verified',
  }
  if (
    JSON.stringify(manifest.critical_contracts?.verification_claim)
    !== JSON.stringify(expectedVerificationClaim)
  ) {
    errors.push('critical_contracts.verification_claim differs from the fixed contract')
  }
  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
    errors.push('modules must be a non-empty array')
    return errors
  }
  const ids = new Set()
  const paths = new Set()
  const knownProfiles = new Set([
    ...requiredProfiles,
    ...optionalProfiles,
  ])
  const knownCapabilities = new Set(capabilities)
  for (const [index, module] of manifest.modules.entries()) {
    if (!isRecord(module)) {
      errors.push(`modules[${index}] must be an object`)
      continue
    }
    if (!/^GDL-[0-9]{3}$/.test(module.id)) {
      errors.push(`${module.id}: invalid module ID`)
    }
    if (ids.has(module.id)) errors.push(`${module.id}: duplicate module ID`)
    if (paths.has(module.path)) errors.push(`${module.path}: duplicate path`)
    ids.add(module.id)
    paths.add(module.path)
    if (
      typeof module.path !== 'string'
      || !/^docs\/guidelines\/modules\/.+\.md$/u.test(module.path)
    ) {
      errors.push(`${module.id}: module path must stay under docs/guidelines/modules`)
    }
    if (typeof module.title !== 'string' || module.title.length === 0) {
      errors.push(`${module.id}: title must be a non-empty string`)
    }
    if (!isRecord(module.activation)) {
      errors.push(`${module.id}: activation must be an object`)
      continue
    }
    const { kind } = module.activation
    const values = requireStringArray(
      errors,
      `${module.id}.activation.values`,
      module.activation.values,
    )
    if (!['always', 'profile-any', 'capability-any'].includes(kind)) {
      errors.push(`${module.id}: invalid activation kind ${kind}`)
    }
    if (kind === 'always' && values.length !== 0) {
      errors.push(`${module.id}: always activation must have no values`)
    }
    const catalog = kind === 'profile-any' ? knownProfiles : knownCapabilities
    if (kind !== 'always') {
      if (values.length === 0) errors.push(`${module.id}: activation values are required`)
      values.forEach(value => {
        if (!catalog.has(value)) errors.push(`${module.id}: unknown activation value ${value}`)
      })
    }
    if (index === 0 && module.start_marker !== null) {
      errors.push(`${module.id}: first module start_marker must be null`)
    }
    if (index > 0 && (typeof module.start_marker !== 'string' || module.start_marker.length === 0)) {
      errors.push(`${module.id}: start_marker must be a non-empty string`)
    }
    if (index === manifest.modules.length - 1 && module.end_before !== null) {
      errors.push(`${module.id}: final module end_before must be null`)
    }
    if (
      index < manifest.modules.length - 1
      && (typeof module.end_before !== 'string' || module.end_before.length === 0)
    ) {
      errors.push(`${module.id}: end_before must be a non-empty string`)
    }
  }
  return errors
}

const schemaSource = await readFile(schemaPath, 'utf8')
const manifestErrors = validateManifestShape()
if (manifestErrors.length) fail(manifestErrors)

async function moduleFiles() {
  const directory = resolve(projectRoot, 'docs/guidelines/modules')
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => relative(projectRoot, resolve(directory, entry.name)))
      .sort()
  }
  catch {
    return []
  }
}

async function readCompleteGuideline() {
  const parts = []
  for (const module of manifest.modules) {
    parts.push(await readFile(resolve(projectRoot, module.path), 'utf8'))
  }
  return parts.join('')
}

async function writeEntry() {
  const template = await readFile(
    resolve(projectRoot, manifest.entry_template_path),
    'utf8',
  )
  await writeFile(resolve(projectRoot, manifest.entry_path), template)
  console.log(`Generated guideline entry at ${manifest.entry_path}.`)
}

function markerOffsets(source) {
  const errors = []
  const offsets = []
  let cursor = 0
  for (const [index, module] of manifest.modules.entries()) {
    const start = module.start_marker === null
      ? 0
      : source.indexOf(module.start_marker, cursor)
    if (start < 0) {
      errors.push(`${module.id}: start marker not found: ${module.start_marker}`)
      continue
    }
    if (index > 0 && start !== cursor) {
      errors.push(`${module.id}: start marker is not contiguous at byte ${cursor}`)
    }
    const end = module.end_before === null
      ? source.length
      : source.indexOf(module.end_before, start)
    if (end < 0) {
      errors.push(`${module.id}: end marker not found: ${module.end_before}`)
      continue
    }
    offsets.push({ module, start, end })
    cursor = end
  }
  if (cursor !== source.length) {
    errors.push(`module boundaries stop at byte ${cursor} of ${source.length}`)
  }
  return { errors, offsets }
}

async function bootstrap() {
  const existing = await moduleFiles()
  if (existing.length > 0) {
    fail(`refusing to overwrite ${existing.length} existing module file(s)`)
  }
  const source = await readFile(resolve(projectRoot, manifest.entry_path), 'utf8')
  const actualHash = sha256(source)
  if (actualHash !== manifest.semantic_baseline.sha256) {
    fail(`entry hash ${actualHash} does not match frozen baseline ${manifest.semantic_baseline.sha256}`)
  }
  const { errors, offsets } = markerOffsets(source)
  if (errors.length) fail(errors)
  const chunks = offsets.map(({ start, end }) => source.slice(start, end))
  for (let index = 0; index < chunks.length - 1; index += 1) {
    const separator = chunks[index].match(/\n{2,}$/u)?.[0]
    if (separator === undefined) continue
    chunks[index] = `${chunks[index].slice(0, -separator.length)}\n`
    chunks[index + 1] = `${separator.slice(1)}${chunks[index + 1]}`
  }
  for (const [index, { module }] of offsets.entries()) {
    const target = resolve(projectRoot, module.path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, chunks[index])
  }
  console.log(`Extracted ${offsets.length} byte-preserving guideline modules.`)
}

function validateApiContract(source) {
  const errors = []
  const expected = manifest.critical_contracts.api_response_envelope
  const responseSectionStart = source.indexOf('#### 10.1.3 Response envelope')
  const responseSectionEnd = source.indexOf('### 10.2 PostgreSQL and Drizzle')
  const responseSection = source.slice(responseSectionStart, responseSectionEnd)
  if (responseSectionStart < 0 || responseSectionEnd < 0) {
    return ['API response-envelope section is missing']
  }
  for (const field of expected.top_level_fields) {
    if (!responseSection.includes(`- \`${field}\``)) {
      errors.push(`API response envelope is missing top-level field ${field}`)
    }
  }
  if (!responseSection.includes('All five top-level fields are required. Do not add endpoint-specific top-level')) {
    errors.push('API response envelope no longer forbids endpoint-specific top-level fields')
  }
  if (!responseSection.includes('`data` is the endpoint-specific payload.')) {
    errors.push('API response envelope no longer makes data endpoint-specific')
  }
  if (!responseSection.includes('`0` is permanently reserved for real application')) {
    errors.push('API response envelope no longer reserves code 0 for real success')
  }
  if (!responseSection.includes('Return HTTP `200` for every handled application outcome')) {
    errors.push('API response envelope no longer maps handled outcomes to HTTP 200')
  }
  if (!responseSection.includes('Return HTTP `500` only for an unexpected, unhandled programming or system')) {
    errors.push('API response envelope no longer reserves HTTP 500 for unexpected failure')
  }
  return errors
}

function validateUiChoiceControlContract(source) {
  const errors = []
  const formsSectionStart = source.indexOf('### 8.12 Forms and validation')
  const formsSectionEnd = source.indexOf('### 8.13 Accessibility baseline')
  if (formsSectionStart < 0 || formsSectionEnd < 0) {
    return ['UI forms-and-validation section is missing']
  }
  const formsSection = source.slice(formsSectionStart, formsSectionEnd)
  const requiredTokens = [
    '`UI-CONTROL-001`',
    'at most nine easily scanned',
    'ten or more options',
    'remotely loaded catalogs',
    'name or code',
    'default shadcn-vue `Combobox`',
  ]
  for (const token of requiredTokens) {
    if (!formsSection.includes(token)) {
      errors.push(`UI choice-control contract is missing ${token}`)
    }
  }
  return errors
}

function validateUiCopyAndDensityContracts(source) {
  const errors = []
  const copyStart = source.indexOf('### 8.10 UI copy and content')
  const copyEnd = source.indexOf('### 8.11 Feedback surfaces')
  const densityStart = source.indexOf('### 8.3 Compact component policy')
  const densityEnd = source.indexOf('### 8.4 Tailwind is layout-only')
  if (copyStart < 0 || copyEnd < 0) {
    errors.push('UI copy section is missing')
  }
  else {
    const copy = source.slice(copyStart, copyEnd)
    for (const token of [
      '`UI-COPY-001`',
      'Product UI is not documentation.',
      'not the policy rationale or system mechanism',
      'canonical actor, scope, entity, state, and action labels',
      'Never humanize an unknown',
      'Do not expose database IDs, tokens, queue names, field keys, or internal status',
      'enumerate every rendered localized title',
    ]) {
      if (!copy.includes(token)) errors.push(`UI copy contract is missing ${token}`)
    }
  }
  if (densityStart < 0 || densityEnd < 0) {
    errors.push('UI compact-component section is missing')
  }
  else {
    const density = source.slice(densityStart, densityEnd)
    for (const token of [
      '`UI-DENSITY-001`',
      'Compact means high information clarity with efficient space, not tiny controls.',
      '44×44 CSS pixels',
      'natural-width desktop actions',
    ]) {
      if (!density.includes(token)) errors.push(`UI density contract is missing ${token}`)
    }
  }
  return errors
}

function validateUiAudienceProjectionContract(source) {
  const errors = []
  const audienceStart = source.indexOf('### 8.8.3 Audience separation and management information architecture')
  const audienceEnd = source.indexOf('### 8.8.4 Long collections, categorized discovery, and stable item anatomy')
  if (audienceStart < 0 || audienceEnd < 0) {
    return ['UI audience-separation section is missing']
  }
  const audience = source.slice(audienceStart, audienceEnd)
  for (const token of [
    '`UI-AUDIENCE-001`',
    'Shared presentation components must remain permission-neutral.',
    'complete observable surface',
    'same authorized scope\nas the result query',
    'Cross-boundary accountability may expose a bounded actor category only when',
    "redact the external actor's ID",
    'direct requests that substitute filters or identifiers',
  ]) {
    if (!audience.includes(token)) {
      errors.push(`UI audience-projection contract is missing ${token}`)
    }
  }
  return errors
}

function validateVerificationScopeContract(source) {
  const errors = []
  const sectionStart = source.indexOf('#### 13.7.2 Risk-scoped verification selection')
  const sectionEnd = source.indexOf('### 13.8 Docker and Make verification')
  if (sectionStart < 0 || sectionEnd < 0) {
    return ['risk-scoped verification section is missing']
  }
  const section = source.slice(sectionStart, sectionEnd)
  for (const token of [
    '`VERIFY-SCOPE-001`',
    '**risk-scoped** verification',
    'selected commands and evidence with a reason',
    'Full regression is required only when',
    'Release status alone does not require full regression',
    '`release:plan`',
    'universal release baseline',
    'accepted/deployed base revision',
    'target environment',
    'safe full-rule\nfallback',
    '`verify:changed` must refuse to execute',
    '`full_regression_required`',
  ]) {
    if (!section.includes(token)) {
      errors.push(`verification-scope contract is missing ${token}`)
    }
  }
  return errors
}

function validateVerificationClaimContract(source) {
  const errors = []
  const sectionStart = source.indexOf('#### 13.7.3 Evidence-scoped completion and readiness claims')
  const sectionEnd = source.indexOf('### 13.8 Docker and Make verification')
  if (sectionStart < 0 || sectionEnd < 0) {
    return ['evidence-scoped completion-claim section is missing']
  }
  const section = source.slice(sectionStart, sectionEnd)
  for (const token of [
    '`VERIFY-CLAIM-001`',
    '`No — this is not 100% verified.`',
    '`Yes — 100% of the declared acceptance scope passed for <candidate> in',
    'finite acceptance scope',
    'failed, skipped, stale, pending, flaky-only, not-tested, and open-boundary',
    'not a\n  guarantee of zero defects or unknown future cases',
    '`completion_claim`',
    '`scope_complete` or `not_verified`',
    '`verification:check`',
  ]) {
    if (!section.includes(token)) {
      errors.push(`verification-claim contract is missing ${token}`)
    }
  }
  return errors
}

async function check() {
  const errors = []
  const entry = await readFile(resolve(projectRoot, manifest.entry_path), 'utf8')
  const entryTemplate = await readFile(
    resolve(projectRoot, manifest.entry_template_path),
    'utf8',
  )
  const agentInstructionsTemplate = await readFile(
    resolve(projectRoot, manifest.agent_instructions_template_path),
    'utf8',
  )
  if (entry !== entryTemplate) {
    errors.push(`${manifest.entry_path} differs from ${manifest.entry_template_path}`)
  }
  const requiredAgentTemplateTokens = [
    'root `AGENTS.md`',
    'installed `project-guideline-workflow`',
    '<rules-plan-command>',
    '<release-plan-command>',
    '<changed-verification-command>',
    '<verification-freshness-command>',
    'Never claim `100%`',
    '`UI-COPY-001`',
    '`UI-CONTROL-001`',
    '`UI-DENSITY-001`',
    '`VERIFY-SCOPE-001`',
    '`VERIFY-CLAIM-001`',
    'safe full-rule fallback',
    'objective full-regression trigger',
    'release label alone is not a',
    'universal release baseline',
    'Local-only evidence cannot satisfy a production claim',
  ]
  for (const token of requiredAgentTemplateTokens) {
    if (!agentInstructionsTemplate.includes(token)) {
      errors.push(`${manifest.agent_instructions_template_path} is missing ${token}`)
    }
  }
  const expectedPaths = manifest.modules.map(module => module.path).sort()
  const actualPaths = await moduleFiles()
  for (const path of expectedPaths) {
    try {
      await access(resolve(projectRoot, path))
    }
    catch {
      errors.push(`missing module ${path}`)
    }
  }
  actualPaths.filter(path => !expectedPaths.includes(path)).forEach(
    path => errors.push(`unregistered module ${path}`),
  )
  if (errors.length) fail(errors)

  const moduleSources = await Promise.all(manifest.modules.map(
    module => readFile(resolve(projectRoot, module.path), 'utf8'),
  ))
  moduleSources.slice(0, -1).forEach((source, index) => {
    if (/\n{2,}$/u.test(source)) {
      errors.push(`${manifest.modules[index].path} has a blank line at EOF`)
    }
  })
  const complete = moduleSources.join('')
  const actual = {
    sha256: sha256(complete),
    bytes: Buffer.byteLength(complete),
    lines: lineCount(complete),
  }
  for (const key of ['sha256', 'bytes', 'lines']) {
    if (actual[key] !== manifest.semantic_baseline[key]) {
      errors.push(`complete guideline ${key} ${actual[key]} does not match baseline ${manifest.semantic_baseline[key]}`)
    }
  }
  errors.push(...validateApiContract(complete))
  errors.push(...validateUiChoiceControlContract(complete))
  errors.push(...validateUiCopyAndDensityContracts(complete))
  errors.push(...validateUiAudienceProjectionContract(complete))
  errors.push(...validateVerificationScopeContract(complete))
  errors.push(...validateVerificationClaimContract(complete))
  const genericSources = [
    [manifest.entry_path, entry],
    [manifest.agent_instructions_template_path, agentInstructionsTemplate],
    ['complete modular guideline', complete],
  ]
  const forbiddenGenericPatterns = [
    {
      label: 'project/business-specific token',
      pattern: /\b(?:TableFlow|Bia68|restaurant|waiter|chef|VietQR|vietnam-qr-pay|dxAuth)\b/i,
    },
    {
      label: 'project-specific workspace path',
      pattern: /\btableflow\/source\b/i,
    },
  ]
  for (const [sourcePath, source] of genericSources) {
    for (const { label, pattern } of forbiddenGenericPatterns) {
      const forbidden = source.match(pattern)?.[0]
      if (forbidden !== undefined) {
        errors.push(`${sourcePath} contains ${label} ${forbidden}`)
      }
    }
  }
  if (errors.length) fail(errors)
  console.log(
    `Guideline equivalence passed: ${manifest.modules.length} modules, `
    + `${actual.lines} lines, ${actual.bytes} bytes, ${actual.sha256}.`,
  )
}

function isActive(module, profiles, capabilities) {
  const { kind, values } = module.activation
  if (kind === 'always') return true
  const selected = kind === 'profile-any' ? profiles : capabilities
  return values.some(value => selected.has(value))
}

async function plan() {
  const profiles = parseCsvOption('--profiles')
  const capabilities = parseCsvOption('--capabilities')
  manifest.profiles.required.forEach(profile => profiles.add(profile))
  const unknownProfiles = [...profiles].filter(
    profile => ![...manifest.profiles.required, ...manifest.profiles.optional].includes(profile),
  )
  const unknownCapabilities = [...capabilities].filter(
    capability => !manifest.capabilities.includes(capability),
  )
  if (unknownProfiles.length || unknownCapabilities.length) {
    fail([
      ...unknownProfiles.map(value => `unknown profile ${value}`),
      ...unknownCapabilities.map(value => `unknown capability ${value}`),
    ])
  }
  const active = manifest.modules.filter(
    module => isActive(module, profiles, capabilities),
  )
  console.log(JSON.stringify({
    schema_version: 1,
    entry_path: manifest.entry_path,
    profiles: [...profiles].sort(),
    capabilities: [...capabilities].sort(),
    modules: active.map(({ id, path, title }) => ({ id, path, title })),
    excluded_conditional_modules: manifest.modules
      .filter(module => !active.includes(module))
      .map(({ id, path, title, activation }) => ({ id, path, title, activation })),
    critical_contracts: manifest.critical_contracts,
  }, null, 2))
}

if (command === 'bootstrap') await bootstrap()
else if (command === 'entry') await writeEntry()
else if (command === 'check') await check()
else if (command === 'plan') await plan()
else fail(`unknown command ${command}; use bootstrap, entry, check, or plan`)
