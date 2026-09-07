import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  cp,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = resolve(root, '.agents/skills/doxanh')
const templateRoot = resolve(skillRoot, 'assets/project-template')
const cli = resolve(skillRoot, 'scripts/project-standards.mjs')
const userSkillCli = resolve(skillRoot, 'scripts/manage-user-skill.mjs')
const metadata = JSON.parse(
  await readFile(resolve(skillRoot, 'assets/project-standards.json'), 'utf8'),
)

function run(command, projectRoot, repositoryRoot, ...extra) {
  return spawnSync(
    process.execPath,
    [cli, command, '--target', projectRoot, '--repo-root', repositoryRoot, ...extra],
    { cwd: root, encoding: 'utf8' },
  )
}

function runSkill(command, skillsHome, ...extra) {
  return spawnSync(
    process.execPath,
    [userSkillCli, command, '--skills-home', skillsHome, ...extra],
    { cwd: root, encoding: 'utf8' },
  )
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function collectFiles(directory, base = directory) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const absolute = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolute, base))
    else if (entry.isFile()) files.push(absolute.slice(base.length + 1).split('\\').join('/'))
  }
  return files
}

async function fixture(nested = false) {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'doxanh-standards-test-'))
  const projectRoot = nested ? resolve(repositoryRoot, 'apps/web') : repositoryRoot
  await mkdir(projectRoot, { recursive: true })
  return { repositoryRoot, projectRoot }
}

async function materialize(sourceRoot, destinationRoot) {
  for (const path of await collectFiles(sourceRoot)) {
    const destination = resolve(destinationRoot, path)
    await mkdir(dirname(destination), { recursive: true })
    await cp(resolve(sourceRoot, path), destination)
  }
}

async function writeLegacyInstallation(roots, schemaVersion) {
  await materialize(templateRoot, roots.projectRoot)
  const projectFiles = []
  for (const path of await collectFiles(templateRoot)) {
    projectFiles.push({ path, sha256: sha256(await readFile(resolve(templateRoot, path))) })
  }
  const lock = {
    schema_version: schemaVersion,
    name: metadata.name,
    version: '2.0.1',
    repository: metadata.repository,
    installed_at: new Date().toISOString(),
    repository_root: relative(roots.projectRoot, roots.repositoryRoot) || '.',
    project_template_sha256: metadata.project_template_sha256,
    project_files: projectFiles,
  }
  if (schemaVersion === 1) {
    const destination = resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow')
    await materialize(skillRoot, destination)
    lock.skill_contract_sha256 = metadata.skill_contract_sha256
    lock.repository_skill_files = []
    for (const path of await collectFiles(skillRoot)) {
      lock.repository_skill_files.push({
        path: `.agents/skills/project-guideline-workflow/${path}`,
        sha256: sha256(await readFile(resolve(skillRoot, path))),
      })
    }
  }
  else {
    lock.skill = {
      name: 'project-guideline-workflow',
      distribution: 'user-scope',
      repository_path: '.agents/skills/project-guideline-workflow',
      contract_sha256: metadata.skill_contract_sha256,
    }
  }
  await writeFile(
    resolve(roots.projectRoot, '.doxanh-project-standards.json'),
    `${JSON.stringify(lock, null, 2)}\n`,
  )
}

test('installs and verifies a reference-only standalone project', async () => {
  const roots = await fixture()
  try {
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    assert.match(installed.stdout, new RegExp(`Installed doxanh-project-standards ${metadata.version.replaceAll('.', '\\.')}\\b`, 'u'))

    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.schema_version, 3)
    assert.equal(lock.version, metadata.version)
    assert.equal(lock.consumer_mode, 'reference-only')
    assert.equal(lock.guideline_package_sha256, metadata.project_template_sha256)
    assert.equal(lock.project_files, undefined)
    assert.equal(lock.project_template_sha256, undefined)
    assert.equal(lock.repository_skill_files, undefined)
    assert.deepEqual(lock.skill, {
      name: 'doxanh',
      distribution: 'user-scope',
      repository_path: '.agents/skills/doxanh',
      contract_sha256: metadata.skill_contract_sha256,
    })
    assert.equal(lock.repository_root, '.')
    await assert.rejects(
      readFile(resolve(roots.repositoryRoot, '.agents/skills/doxanh/SKILL.md')),
    )

    const checked = run('check', roots.projectRoot, roots.repositoryRoot)
    assert.equal(checked.status, 0, checked.stderr)
    assert.match(checked.stdout, new RegExp(`Verified doxanh-project-standards ${metadata.version.replaceAll('.', '\\.')}`, 'u'))

    await assert.rejects(readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md')))
    await assert.rejects(readFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md')))

    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const lockBeforeUpdate = await readFile(lockPath, 'utf8')
    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.equal(updated.status, 0, updated.stderr)
    assert.match(updated.stdout, /is already current/u)
    assert.equal(await readFile(lockPath, 'utf8'), lockBeforeUpdate)
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('requires executable temporal presentation rules in generated projects', async () => {
  const runtimeContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/42-nuxt-runtime-contracts.md',
  ), 'utf8')
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

  for (const source of [
    runtimeContract,
    testingContract,
    agentTemplate,
    skillContract,
  ]) {
    assert.match(source, /TIME-PRESENTATION-001/u)
  }
  assert.match(runtimeContract, /never expose the raw API, database, ISO/u)
  assert.match(runtimeContract, /standards:check.*reject direct rendered temporal fields/su)
})

test('requires complete source-reconciled project-book and database documentation', async () => {
  const systemDocuments = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/24-system-document-contracts.md',
  ), 'utf8')
  const deliveryContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/25-quality-delivery-and-generation.md',
  ), 'utf8')
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))

  for (const source of [testingContract, agentTemplate, skillContract]) {
    assert.match(source, /DOC-BOOK-001/u)
    assert.match(source, /DATA-DOC-001/u)
  }
  assert.match(systemDocuments, /what one row represents and why the product needs it/u)
  assert.match(systemDocuments, /every persisted state value/u)
  assert.match(deliveryContract, /every maintained application table and physical column/u)
  assert.equal(manifest.critical_contracts.project_book_documentation.rule_id, 'DOC-BOOK-001')
  assert.equal(manifest.critical_contracts.database_documentation.rule_id, 'DATA-DOC-001')
})

test('keeps documentation-only verification bounded to documentation evidence', async () => {
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))

  assert.match(testingContract, /Reusable standard, skill, or documentation only/u)
  assert.match(testingContract, /Do not select consumer UI, API, database, actor, or production suites/u)
  assert.match(testingContract, /unresolved review state, not permission to\s+run every command/u)
  assert.match(testingContract, /union of the per-path, per-boundary evidence\s+plans/u)
  assert.match(testingContract, /mixed documentation-plus-runtime case/u)
  assert.match(agentTemplate, /Documentation-only work still runs changed-scope verification/u)
  assert.match(agentTemplate, /not unrelated browser or production testing/u)
  assert.match(agentTemplate, /union of\s+per-path evidence/u)
  assert.match(skillContract, /Start with the smallest complete risk-scoped evidence set/u)
  assert.match(skillContract, /safe full-rule fallback is an\s+unresolved mapping state/u)
  assert.match(skillContract, /Build mixed-worktree verification as the union of per-path evidence/u)
  assert.match(testingContract, /commit-only transition with identical content remains valid/u)
  assert.match(testingContract, /complete maintained project/u)
  assert.match(testingContract, /exact candidate Git revision must match/u)
  assert.match(agentTemplate, /do not rerun\s+suites solely because `HEAD` changed/u)
  assert.match(skillContract, /Never rerun a changed-scope suite solely because verified files were committed/u)
  assert.equal(manifest.critical_contracts.verification_scope.changed_evidence_binding, 'maintained-content-fingerprint')
  assert.equal(manifest.critical_contracts.verification_scope.commit_only_transition_preserves_evidence, true)
  assert.equal(manifest.critical_contracts.verification_scope.full_release_revision_binding_strict, true)
  assert.match(testingContract, /dependency-closed verification\s+slice/u)
  assert.match(testingContract, /A source edit does not by itself justify every actor flow/u)
  assert.match(agentTemplate, /Application source code does not automatically require full regression/u)
  assert.match(skillContract, /Do not select every suite merely\s+because at least one source file changed/u)
  assert.equal(manifest.critical_contracts.verification_scope.source_change_scope, 'changed-module-boundaries-and-direct-consumers')
  assert.equal(manifest.critical_contracts.verification_scope.source_change_forces_full_regression, false)
  assert.equal(manifest.critical_contracts.verification_scope.multi_module_scope, 'union-of-focused-slices')
  assert.equal(manifest.critical_contracts.verification_scope.unrelated_suites_forbidden, true)
  assert.equal(manifest.critical_contracts.verification_scope.safe_fallback_requires_review, true)
})

test('keeps releases risk-scoped while requiring candidate and live-target proof', async () => {
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const readinessContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/100-readiness-and-build-order.md',
  ), 'utf8')
  const agentRules = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/110-ai-agent-rules.md',
  ), 'utf8')
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const guidelineEntry = await readFile(resolve(
    templateRoot,
    'docs/guidelines/README.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))
  const scope = manifest.critical_contracts.verification_scope

  assert.equal(scope.release_scope, 'candidate-diff-plus-universal-release-baseline')
  assert.equal(scope.release_candidate_forces_full_regression, false)
  assert.equal(scope.release_base_revision_required, true)
  assert.equal(scope.release_target_environment_required, true)
  assert.equal(scope.release_predeployment_baseline_required, true)
  assert.equal(scope.release_postdeployment_baseline_required, true)
  assert.equal(scope.release_unrelated_suites_forbidden, true)
  assert.deepEqual(scope.full_regression_triggers, [
    'explicit-request',
    'initial-release-or-missing-baseline',
    'cross-cutting-change',
    'systemic-evidence',
    'unbounded-impact',
  ])

  for (const source of [testingContract, readinessContract, agentRules, agentTemplate]) {
    assert.match(source, /release:plan/u)
    assert.match(source, /universal release baseline/u)
    assert.match(source, /accepted(?:\/| or )deployed base/u)
    assert.match(source, /target\s+environment/u)
  }
  for (const source of [testingContract, agentRules, agentTemplate, skillContract]) {
    assert.match(source, /(?:a )?release (?:label|status)\s+alone.*not.*full-regression trigger/isu)
    assert.match(source, /local-only evidence|Local evidence.*never replaces/isu)
  }
  assert.match(testingContract, /records unrelated actors, screens, and browser profiles as excluded/u)
  assert.match(testingContract, /content-identical changed evidence/u)
  assert.match(testingContract, /phase-aware universal baseline/u)
  assert.match(testingContract, /Before deployment.*After deployment/su)
  assert.match(testingContract, /mode \(`changed`, `release`, or `full`\)/u)
  assert.match(testingContract, /candidate `release` report, or a `full` report when full regression was selected.*deployed-target evidence/su)
  assert.match(agentRules, /only missing\s+revision-, image-, deployment-, target-readiness-, and focused live gates/u)
  assert.match(agentTemplate, /<release-plan-command>/u)
  assert.match(guidelineEntry, /pnpm release:plan -- --base/u)
})

test('requires readable responsive composition for actionable feedback', async () => {
  const interactionContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/52-web-interaction-and-verification.md',
  ), 'utf8')
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

  for (const source of [interactionContract, testingContract, agentTemplate, skillContract]) {
    assert.match(source, /UI-ACTION-001/u)
    assert.match(source, /actionable.feedback|notifications?/iu)
  }
  assert.match(interactionContract, /separate action-only region below the content/u)
  assert.match(interactionContract, /icon\/content\/action three-column row/u)
  assert.match(interactionContract, /longest supported localized/u)
})

test('requires server-authorized complete-surface audience projection', async () => {
  const layoutContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/51-web-layouts-and-screens.md',
  ), 'utf8')
  const interactionContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/52-web-interaction-and-verification.md',
  ), 'utf8')
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

  for (const source of [
    layoutContract,
    interactionContract,
    testingContract,
    agentTemplate,
    skillContract,
  ]) {
    assert.match(source, /UI-AUDIENCE-001/u)
  }
  assert.match(layoutContract, /Shared presentation components must remain permission-neutral/u)
  assert.match(layoutContract, /filter options, facets, suggestions/u)
  assert.match(layoutContract, /counts, totals, status summaries/u)
  assert.match(layoutContract, /Cross-boundary accountability/u)
  assert.match(layoutContract, /redact the external actor's ID/u)
  assert.deepEqual(manifest.critical_contracts.ui_audience_projection, {
    rule_id: 'UI-AUDIENCE-001',
    server_authoritative: true,
    complete_observable_surface: true,
    shared_components_permission_neutral: true,
    filter_options_from_authorized_scope: true,
    counts_and_facets_scope_projected: true,
    cross_boundary_identity_default: 'redacted',
    direct_request_no_leak_tests: true,
  })
})

test('requires canonical product vocabulary across rendered surfaces', async () => {
  const productContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/21-product-document-contracts.md',
  ), 'utf8')
  const interactionContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/52-web-interaction-and-verification.md',
  ), 'utf8')
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

  assert.match(productContract, /one canonical user-facing singular label/u)
  for (const source of [interactionContract, testingContract, agentTemplate, skillContract]) {
    assert.match(source, /UI-COPY-001/u)
    assert.match(source, /canonical actor|canonical product vocabulary/iu)
  }
  assert.deepEqual(manifest.critical_contracts.ui_copy, {
    rule_id: 'UI-COPY-001',
    implementation_details_forbidden: true,
    policy_narration_forbidden_by_default: true,
    complete_rendered_copy_review: true,
    canonical_actor_scope_vocabulary: true,
    raw_or_humanized_technical_keys_forbidden: true,
    competing_synonyms_rejected: true,
  })
})

test('requires evidence-scoped binary completion claims', async () => {
  const testingContract = await readFile(resolve(
    templateRoot,
    'docs/guidelines/modules/80-testing-and-verification.md',
  ), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(
    templateRoot,
    'docs/guidelines/guideline-manifest.json',
  ), 'utf8'))
  const agentTemplate = await readFile(resolve(
    templateRoot,
    'docs/guidelines/AGENTS.template.md',
  ), 'utf8')
  const skillContract = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

  for (const source of [testingContract, agentTemplate, skillContract]) {
    assert.match(source, /VERIFY-CLAIM-001/u)
    assert.match(source, /unambiguous [`]?Yes[`]? or [`]?No|first sentence must give one unambiguous answer/iu)
    assert.match(source, /finite (?:declared |acceptance )?scope/iu)
    assert.match(source, /zero\s+defects/u)
  }
  assert.match(testingContract, /failed, skipped, stale, pending, flaky-only, not-tested/iu)
  assert.match(testingContract, /completion_claim/u)
  assert.deepEqual(manifest.critical_contracts.verification_claim, {
    rule_id: 'VERIFY-CLAIM-001',
    claim_unit: 'declared-finite-scope',
    binary_lead_required: true,
    absolute_zero_defect_claim_forbidden: true,
    scope_complete_requires_zero_open_boundaries: true,
    incomplete_claim: 'not_verified',
  })
})

test('installs only a reference lock at the correct nested root', async () => {
  const roots = await fixture(true)
  try {
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.repository_root, '../..')
    await assert.rejects(
      readFile(resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow/SKILL.md')),
    )
    await assert.rejects(readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md')))
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('migrates verified version-1 copies to the reference-only contract', async () => {
  const roots = await fixture(true)
  try {
    await writeLegacyInstallation(roots, 1)
    const destination = resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow')
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')

    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.equal(updated.status, 0, updated.stderr)
    const migrated = JSON.parse(await readFile(lockPath, 'utf8'))
    assert.equal(migrated.schema_version, 3)
    assert.equal(migrated.version, metadata.version)
    assert.equal(migrated.consumer_mode, 'reference-only')
    assert.equal(migrated.project_files, undefined)
    assert.equal(migrated.repository_skill_files, undefined)
    await assert.rejects(readFile(resolve(destination, 'SKILL.md')))
    await assert.rejects(readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md')))
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses installation when a reusable guideline copy already exists', async () => {
  const roots = await fixture()
  try {
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    const expected = await readFile(resolve(templateRoot, 'docs/guidelines/README.md'))
    await mkdir(resolve(roots.projectRoot, 'docs/guidelines'), { recursive: true })
    await writeFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), expected)
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(installed.status, 0)
    assert.match(installed.stderr, /reference-only consumer must not contain/u)
    await assert.rejects(readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json')))
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses installation when a retired reusable reference remains', async () => {
  const roots = await fixture()
  try {
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    await writeFile(
      resolve(roots.projectRoot, 'docs/new-project-guideline.md'),
      '# Retired local copy\n',
    )

    const installed = run('install', roots.projectRoot, roots.repositoryRoot)

    assert.notEqual(installed.status, 0)
    assert.match(
      installed.stderr,
      /reference-only consumer must not contain reusable standard file: docs\/new-project-guideline\.md/u,
    )
    await assert.rejects(
      readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json')),
    )
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses a conflicting install before writing managed content', async () => {
  const roots = await fixture()
  try {
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    await mkdir(resolve(roots.projectRoot, 'docs/guidelines'), { recursive: true })
    await writeFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), 'local contract\n')
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(installed.status, 0)
    assert.match(installed.stderr, /reference-only consumer must not contain/u)
    await assert.rejects(readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json')))
    assert.equal(
      await readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), 'utf8'),
      'local contract\n',
    )
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses migration after local managed-file drift', async () => {
  const roots = await fixture()
  try {
    await writeLegacyInstallation(roots, 2)
    const target = resolve(roots.projectRoot, 'docs/guidelines/README.md')
    await writeFile(target, 'locally changed\n')

    const checked = run('check', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(checked.status, 0)
    assert.match(checked.stderr, /legacy project standard file diverged/u)

    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(updated.status, 0)
    assert.match(updated.stderr, /installed project standard file diverged/u)
    assert.equal(await readFile(target, 'utf8'), 'locally changed\n')
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('rejects a symlink at a managed target', async () => {
  const roots = await fixture()
  try {
    const external = resolve(roots.repositoryRoot, 'external.md')
    await writeFile(external, 'external\n')
    await mkdir(resolve(roots.projectRoot, 'docs/guidelines'), { recursive: true })
    await symlink(external, resolve(roots.projectRoot, 'docs/guidelines/README.md'))

    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(installed.status, 0)
    assert.match(installed.stderr, /managed path uses symlink/u)
    assert.equal(await readFile(external, 'utf8'), 'external\n')
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('synchronizes and verifies one user-level skill symlink', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  try {
    const synced = runSkill('sync', skillsHome)
    assert.equal(synced.status, 0, synced.stderr)
    const destination = resolve(skillsHome, 'doxanh')
    assert.equal((await lstat(destination)).isSymbolicLink(), true)
    assert.notEqual(await realpath(destination), await realpath(skillRoot))
    assert.equal(await readFile(resolve(destination, 'SKILL.md'), 'utf8'), await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8'))

    const checked = runSkill('check', skillsHome)
    assert.equal(checked.status, 0, checked.stderr)
    assert.match(checked.stdout, /Verified user skill doxanh/u)
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})

test('requires explicit migration for a recognized copied user skill', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  const destination = resolve(skillsHome, 'doxanh')
  try {
    await mkdir(skillsHome, { recursive: true })
    await cp(skillRoot, destination, { recursive: true })
    const refused = runSkill('sync', skillsHome)
    assert.notEqual(refused.status, 0)
    assert.match(refused.stderr, /recognized-directory/u)

    const migrated = runSkill('sync', skillsHome, '--replace-recognized')
    assert.equal(migrated.status, 0, migrated.stderr)
    assert.equal((await lstat(destination)).isSymbolicLink(), true)
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})

test('refuses to replace an unknown user skill directory', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  const destination = resolve(skillsHome, 'doxanh')
  try {
    await mkdir(destination, { recursive: true })
    await writeFile(resolve(destination, 'SKILL.md'), 'not owned by Doxanh\n')
    const synced = runSkill('sync', skillsHome, '--replace-recognized')
    assert.notEqual(synced.status, 0)
    assert.match(synced.stderr, /refusing to replace an unowned skill path/u)
    assert.equal(await readFile(resolve(destination, 'SKILL.md'), 'utf8'), 'not owned by Doxanh\n')
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})

test('copied skill migration refuses changed instructions, assets and extra personal files', async () => {
  for (const path of ['SKILL.md', 'assets/project-template/docs/guidelines/README.md', 'my-notes.md']) {
    const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-skill-drift-'))
    const skillsHome = resolve(sandbox, 'skills')
    const destination = resolve(skillsHome, 'doxanh')
    try {
      await cp(skillRoot, destination, { recursive: true })
      await writeFile(resolve(destination, path), 'local work; must preserve\n')
      const result = runSkill('sync', skillsHome, '--replace-recognized')
      assert.notEqual(result.status, 0)
      assert.equal(await readFile(resolve(destination, path), 'utf8'), 'local work; must preserve\n')
      assert.equal((await lstat(destination)).isDirectory(), true)
    }
    finally { await rm(sandbox, { recursive: true, force: true }) }
  }
})

test('verified copied skill migration retains a recoverable backup', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-skill-backup-'))
  const skillsHome = resolve(sandbox, 'skills')
  try {
    await cp(skillRoot, resolve(skillsHome, 'doxanh'), { recursive: true })
    const result = runSkill('sync', skillsHome, '--replace-recognized')
    assert.equal(result.status, 0, result.stderr)
    const backup = (await readdir(skillsHome)).find(name => name.endsWith('.bak'))
    assert.ok(backup)
    assert.equal(await readFile(resolve(skillsHome, backup, 'SKILL.md'), 'utf8'), await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8'))
  }
  finally { await rm(sandbox, { recursive: true, force: true }) }
})

test('two projects resolve distinct immutable versions after another project upgrades', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-two-versions-'))
  const skillsHome = resolve(sandbox, 'skills')
  const first = resolve(sandbox, 'first')
  const second = resolve(sandbox, 'second')
  const nextSkill = resolve(sandbox, 'next-release')
  try {
    await mkdir(first)
    await mkdir(second)
    assert.equal(run('install', first, first).status, 0)
    assert.equal(runSkill('sync', skillsHome).status, 0)
    const firstRoot = runSkill('resolve', skillsHome, '--target', first).stdout.trim()
    assert.ok(firstRoot)
    await cp(skillRoot, nextSkill, { recursive: true })
    const nextMetadata = { ...metadata, version: '99.0.0' }
    // Change the checkout after caching: its existing snapshot stays untouched.
    await writeFile(resolve(nextSkill, 'SKILL.md'), `${await readFile(resolve(nextSkill, 'SKILL.md'), 'utf8')}\nNew release fixture.\n`)
    const paths = (await collectFiles(nextSkill)).filter(path => path === 'SKILL.md' || path.startsWith('agents/') || path.startsWith('scripts/')).sort()
    let rows = ''
    for (const path of paths) rows += `${path}\0${sha256(await readFile(resolve(nextSkill, path)))}\n`
    nextMetadata.skill_contract_sha256 = sha256(rows)
    await writeFile(resolve(nextSkill, 'assets/project-standards.json'), JSON.stringify(nextMetadata))
    const install = spawnSync(process.execPath, [resolve(nextSkill, 'scripts/project-standards.mjs'), 'install', '--target', second], { encoding: 'utf8' })
    assert.equal(install.status, 0, install.stderr)
    const cached = runSkill('cache', skillsHome, '--source', nextSkill)
    assert.equal(cached.status, 0, cached.stderr)
    assert.equal(await realpath(resolve(skillsHome, 'doxanh')), firstRoot)
    assert.equal(runSkill('resolve', skillsHome, '--target', second).status, 0)
    const sync = spawnSync(process.execPath, [resolve(nextSkill, 'scripts/manage-user-skill.mjs'), 'sync', '--skills-home', skillsHome], { encoding: 'utf8' })
    assert.equal(sync.status, 0, sync.stderr)
    const secondRoot = runSkill('resolve', skillsHome, '--target', second).stdout.trim()
    assert.notEqual(firstRoot, secondRoot)
    assert.equal(runSkill('resolve', skillsHome, '--target', first).stdout.trim(), firstRoot)
    assert.equal(await readFile(resolve(firstRoot, 'SKILL.md'), 'utf8'), await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8'))
    await writeFile(resolve(nextSkill, 'SKILL.md'), 'mutable checkout changed again\n')
    assert.equal(runSkill('resolve', skillsHome, '--target', second).status, 0)
    await writeFile(resolve(secondRoot, 'SKILL.md'), 'snapshot drift\n')
    assert.notEqual(runSkill('resolve', skillsHome, '--target', second).status, 0)
  }
  finally { await rm(sandbox, { recursive: true, force: true }) }
})

test('parallel make sync is sequential internally and preflight preserves a conflicting installation', async () => {
  const roots = await fixture(true)
  const skillsHome = resolve(roots.repositoryRoot, 'skills')
  try {
    await writeLegacyInstallation(roots, 2)
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const before = await readFile(lockPath, 'utf8')
    await mkdir(resolve(skillsHome, 'doxanh'), { recursive: true })
    await writeFile(resolve(skillsHome, 'doxanh/SKILL.md'), 'unowned\n')
    const runSync = () => spawnSync('make', ['-j4', 'sync', `PROJECT_ROOT=${roots.projectRoot}`, `REPO_ROOT=${roots.repositoryRoot}`, `SKILLS_HOME=${skillsHome}`], { cwd: root, encoding: 'utf8' })
    assert.notEqual(runSync().status, 0)
    assert.equal(await readFile(lockPath, 'utf8'), before)
    assert.equal(await readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), 'utf8'), await readFile(resolve(templateRoot, 'docs/guidelines/README.md'), 'utf8'))
    await rm(resolve(skillsHome, 'doxanh'), { recursive: true })
    const result = runSync()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(run('check', roots.projectRoot, roots.repositoryRoot).status, 0)
    assert.equal(runSkill('check', skillsHome).status, 0)
    const skillEntries = await readdir(skillsHome)
    const currentLock = await readFile(lockPath, 'utf8')
    assert.equal(runSync().status, 0)
    assert.deepEqual(await readdir(skillsHome), skillEntries)
    assert.equal(await readFile(lockPath, 'utf8'), currentLock)
    const syncGuard = resolve(skillsHome, '.doxanh-standards-sync.lock')
    await mkdir(syncGuard)
    assert.notEqual(runSync().status, 0)
    assert.equal((await lstat(syncGuard)).isDirectory(), true)
    assert.equal(await readFile(lockPath, 'utf8'), currentLock)
  }
  finally { await rm(roots.repositoryRoot, { recursive: true, force: true }) }
})

test('failed migration restores the previous project files, lock and user skill', async () => {
  const roots = await fixture(true)
  const skillsHome = resolve(roots.repositoryRoot, 'skills')
  try {
    await writeLegacyInstallation(roots, 2)
    await cp(skillRoot, resolve(skillsHome, 'doxanh'), { recursive: true })
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const before = await readFile(lockPath, 'utf8')
    // Not present in the legacy lock: discovered by the final reference-only
    // check after migration, forcing the rollback path without fault-injection APIs.
    await writeFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), 'unregistered copy\n')
    const result = spawnSync('make', ['sync', `PROJECT_ROOT=${roots.projectRoot}`, `REPO_ROOT=${roots.repositoryRoot}`, `SKILLS_HOME=${skillsHome}`, 'REPLACE_SKILL=1'], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /previous lock and managed files restored/)
    assert.equal(await readFile(lockPath, 'utf8'), before)
    assert.equal(await readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), 'utf8'), await readFile(resolve(templateRoot, 'docs/guidelines/README.md'), 'utf8'))
    assert.equal((await lstat(resolve(skillsHome, 'doxanh'))).isDirectory(), true)
    assert.equal(await readFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), 'utf8'), 'unregistered copy\n')
  }
  finally { await rm(roots.repositoryRoot, { recursive: true, force: true }) }
})

async function legacyUserFixture(sandbox, skillsHome) {
  const legacySource = resolve(sandbox, 'legacy-source')
  await cp(skillRoot, legacySource, { recursive: true })
  const skillPath = resolve(legacySource, 'SKILL.md')
  await writeFile(skillPath, (await readFile(skillPath, 'utf8')).replace('name: doxanh\n', 'name: project-guideline-workflow\n'))
  const oldMetadata = { ...metadata, version: '3.7.0' }
  delete oldMetadata.skill_name
  const paths = (await collectFiles(legacySource)).filter(path => path === 'SKILL.md' || path.startsWith('agents/') || path.startsWith('scripts/')).sort()
  let rows = ''
  for (const path of paths) rows += `${path}\0${sha256(await readFile(resolve(legacySource, path)))}\n`
  oldMetadata.skill_contract_sha256 = sha256(rows)
  await writeFile(resolve(legacySource, 'assets/project-standards.json'), JSON.stringify(oldMetadata))
  const cached = runSkill('cache', skillsHome, '--source', legacySource)
  assert.equal(cached.status, 0, cached.stderr)
  const snapshot = cached.stdout.trim()
  assert.ok(snapshot.endsWith('/project-guideline-workflow'))
  const legacyLink = resolve(skillsHome, 'project-guideline-workflow')
  await symlink(snapshot, legacyLink)
  return { legacySource, snapshot, legacyLink, oldMetadata }
}

test('renames legacy discovery while preserving old locks, snapshots, documents and nested projects', async () => {
  const roots = await fixture(true)
  const skillsHome = resolve(roots.repositoryRoot, 'skills')
  try {
    const { legacyLink, snapshot, oldMetadata } = await legacyUserFixture(roots.repositoryRoot, skillsHome)
    assert.equal(run('install', roots.projectRoot, roots.repositoryRoot).status, 0)
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const lock = JSON.parse(await readFile(lockPath, 'utf8'))
    lock.version = oldMetadata.version
    lock.skill = { ...lock.skill, name: 'project-guideline-workflow', repository_path: '.agents/skills/project-guideline-workflow', contract_sha256: oldMetadata.skill_contract_sha256 }
    await writeFile(lockPath, JSON.stringify(lock))
    await writeFile(resolve(roots.repositoryRoot, 'AGENTS.md'), 'Project-owned instructions\n')
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    await writeFile(resolve(roots.projectRoot, 'docs/product.md'), 'Project-owned book\n')
    const oldLock = await readFile(lockPath, 'utf8')
    const result = runSkill('sync', skillsHome)
    assert.equal(result.status, 0, result.stderr)
    await assert.rejects(lstat(legacyLink), { code: 'ENOENT' })
    assert.ok((await readdir(skillsHome)).some(name => name.startsWith('.project-guideline-workflow.') && name.endsWith('.bak')))
    assert.equal(await readFile(lockPath, 'utf8'), oldLock)
    assert.equal(runSkill('resolve', skillsHome, '--target', roots.projectRoot).stdout.trim(), snapshot)
    assert.equal(runSkill('check', skillsHome).status, 0)
    assert.equal(run('update', roots.projectRoot, roots.repositoryRoot).status, 0)
    assert.equal(run('check', roots.projectRoot, roots.repositoryRoot).status, 0)
    const updated = JSON.parse(await readFile(lockPath, 'utf8'))
    assert.equal(updated.skill.name, 'doxanh')
    assert.equal(updated.skill.repository_path, '.agents/skills/doxanh')
    assert.ok(runSkill('resolve', skillsHome, '--target', roots.projectRoot).stdout.trim().endsWith('/doxanh'))
    assert.equal(await readFile(resolve(roots.repositoryRoot, 'AGENTS.md'), 'utf8'), 'Project-owned instructions\n')
    assert.equal(await readFile(resolve(roots.projectRoot, 'docs/product.md'), 'utf8'), 'Project-owned book\n')
  }
  finally { await rm(roots.repositoryRoot, { recursive: true, force: true }) }
})

test('old-name divergence, broken links and new-name conflicts prevent migration without loss', async () => {
  for (const conflict of ['legacy-drift', 'legacy-personal-file', 'legacy-broken-link', 'new-name-unowned']) {
    const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-name-conflict-'))
    const skillsHome = resolve(sandbox, 'skills')
    try {
      const { legacyLink, snapshot } = await legacyUserFixture(sandbox, skillsHome)
      if (conflict === 'legacy-drift') await writeFile(resolve(snapshot, 'SKILL.md'), 'local edits\n')
      if (conflict === 'legacy-personal-file') await writeFile(resolve(snapshot, 'notes.md'), 'personal\n')
      if (conflict === 'legacy-broken-link') await rm(snapshot, { recursive: true })
      if (conflict === 'new-name-unowned') {
        await mkdir(resolve(skillsHome, 'doxanh'))
        await writeFile(resolve(skillsHome, 'doxanh/SKILL.md'), 'unowned\n')
      }
      const before = await readdir(skillsHome)
      const result = runSkill('sync', skillsHome, '--replace-recognized')
      assert.notEqual(result.status, 0)
      assert.deepEqual(await readdir(skillsHome), before)
      assert.equal((await lstat(legacyLink)).isSymbolicLink(), true)
      if (conflict === 'legacy-drift') assert.equal(await readFile(resolve(snapshot, 'SKILL.md'), 'utf8'), 'local edits\n')
      if (conflict === 'legacy-personal-file') assert.equal(await readFile(resolve(snapshot, 'notes.md'), 'utf8'), 'personal\n')
      if (conflict === 'new-name-unowned') assert.equal(await readFile(resolve(skillsHome, 'doxanh/SKILL.md'), 'utf8'), 'unowned\n')
    }
    finally { await rm(sandbox, { recursive: true, force: true }) }
  }
})

test('coordinated migration failure restores both discovery names and the old project lock', async () => {
  const roots = await fixture(true)
  const skillsHome = resolve(roots.repositoryRoot, 'skills')
  try {
    await writeLegacyInstallation(roots, 2)
    const { legacyLink, snapshot } = await legacyUserFixture(roots.repositoryRoot, skillsHome)
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const before = await readFile(lockPath, 'utf8')
    await writeFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), 'unregistered copy\n')
    const result = spawnSync('make', ['sync', `PROJECT_ROOT=${roots.projectRoot}`, `REPO_ROOT=${roots.repositoryRoot}`, `SKILLS_HOME=${skillsHome}`], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /previous lock and managed files restored/)
    assert.equal(await realpath(legacyLink), snapshot)
    await assert.rejects(lstat(resolve(skillsHome, 'doxanh')), { code: 'ENOENT' })
    assert.equal(await readFile(lockPath, 'utf8'), before)
  }
  finally { await rm(roots.repositoryRoot, { recursive: true, force: true }) }
})
