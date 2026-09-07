import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'
import { planVerification } from '../.agents/skills/doxanh/scripts/verification-policy.mjs'

const skill = resolve('.agents/skills/doxanh')
const check = (id, kind = 'runtime', extra = {}) => ({ id, kind, command: ['node', `${id}.mjs`], binding: 'content', phase: 'verify', browser_runs: [], ...extra })
const checks = [check('book', 'documentation'), check('unit'), check('api'), check('chrome'), check('unrelated'), check('all', 'runtime', { full_only: true })]
function fixture(runtime = false) {
  return {
    schema_version: 2, mode: 'changed', changed_paths: ['docs/product.md'], unmatched_paths: [],
    impacts: [{ path: 'docs/product.md', kind: 'documentation', reason: 'Wording only', checks: ['book'] },
      ...(runtime ? [{ path: 'src/orders.ts', kind: 'runtime', reason: 'Changed order validation and its API boundary', checks: ['unit', 'api'] }] : [])],
    checks: structuredClone(checks), bindings: { content: 'content-a', context: 'toolchain-a' }, evidence: [],
    ...(runtime ? { changed_paths: ['docs/product.md', 'src/orders.ts'] } : {}),
  }
}
function evidenceFor(plan, bindings) {
  return plan.selected.map(row => ({ check: row.id, check_digest: row.check_digest, bindings: { ...bindings }, status: 'passed' }))
}
function releaseFixture() {
  const input = fixture(true)
  input.mode = 'release'
  input.bindings = { ...input.bindings, revision: 'candidate-a', image: 'sha256:image-a', environment: 'cloud-dev', deployment: 'deployment-a' }
  input.release = { base: 'accepted-a', candidate: 'candidate-a', environment: 'cloud-dev', diff_digest: 'diff-a', baseline: { predeploy: [], postdeploy: [] } }
  for (const [phase, purposes] of Object.entries({ predeploy: ['candidate-integrity', 'target-readiness', 'recovery-readiness'], postdeploy: ['deployed-identity', 'live-smoke'] })) {
    for (const purpose of purposes) {
      input.checks.push(check(purpose, 'runtime', { phase, binding: phase === 'predeploy' ? 'candidate' : 'deployment', baseline_purpose: purpose }))
      input.release.baseline[phase].push({ purpose, check: purpose })
    }
  }
  return input
}

test('documentation alone never selects application checks; CLI returns a real plan', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'doxanh-policy-'))
  try {
    const path = resolve(dir, 'plan.json')
    await writeFile(path, JSON.stringify(fixture()))
    const result = spawnSync(process.execPath, [resolve(skill, 'scripts/verification-policy.mjs'), path], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    const plan = JSON.parse(result.stdout)
    assert.deepEqual(plan.selected.map(row => row.id), ['book'])
    assert.deepEqual(plan.excluded.map(row => row.id), ['unit', 'api', 'chrome', 'unrelated', 'all'])
    assert.equal(plan.result, 'selection-valid-not-test-evidence')
  }
  finally { await rm(dir, { recursive: true, force: true }) }
})

test('mixed/module-local source uses the union once, excluding unrelated roles and capabilities', () => {
  const input = fixture(true)
  input.impacts[1].checks.push('book')
  const plan = planVerification(input)
  assert.deepEqual(plan.selected.map(row => row.id), ['book', 'unit', 'api'])
  assert.equal(plan.selected[0].reasons.length, 2)
})

test('documentation cannot smuggle runtime tests through a prerequisite', () => {
  const input = fixture()
  input.checks[0].depends_on = ['api']
  assert.throws(() => planVerification(input), /documentation cannot select runtime check api/)
})

test('unknown paths, missing command mappings and cyclic dependencies fail closed', () => {
  const unmatched = fixture()
  unmatched.unmatched_paths = ['unknown.ts']
  assert.throws(() => planVerification(unmatched), /unmatched paths/)
  const missing = fixture()
  missing.changed_paths.push('src/new.ts')
  assert.throws(() => planVerification(missing), /every changed path/)
  missing.changed_paths.pop()
  missing.impacts[0].checks = ['missing']
  assert.throws(() => planVerification(missing), /unknown check/)
  const cycle = fixture()
  cycle.checks[1].depends_on = ['api']
  cycle.checks[2].depends_on = ['unit']
  assert.throws(() => planVerification(cycle), /dependency cycle/)
})

test('commit-only change reuses proof; source, command or context changes invalidate it', () => {
  const input = fixture(true)
  input.evidence = evidenceFor(planVerification(input), { ...input.bindings, revision: 'before-commit' })
  input.bindings.revision = 'after-commit'
  assert.ok(planVerification(input).selected.every(row => row.action === 'reuse'))
  input.bindings.content = 'content-b'
  assert.ok(planVerification(input).selected.every(row => row.action === 'run'))
  input.bindings.content = 'content-a'
  input.bindings.context = 'toolchain-b'
  assert.ok(planVerification(input).selected.every(row => row.action === 'run'))
  input.bindings.context = 'toolchain-a'
  input.checks[1].command = ['node', 'updated-unit.mjs']
  assert.equal(planVerification(input).selected.find(row => row.id === 'unit').action, 'run')
  assert.equal(planVerification(input).selected.find(row => row.id === 'api').action, 'reuse')
})

test('failed, pending, skipped and retry-only evidence are never reusable', () => {
  for (const status of ['failed', 'pending', 'skipped', 'retry-only']) {
    const input = fixture()
    input.evidence = evidenceFor(planVerification(input), input.bindings)
    input.evidence[0].status = status
    assert.equal(planVerification(input).selected[0].action, 'run')
  }
  const input = fixture()
  input.evidence = evidenceFor(planVerification(input), input.bindings)
  input.evidence.push({ ...input.evidence[0], status: 'failed' })
  assert.equal(planVerification(input).selected[0].action, 'run')
})

test('release adds baseline plus affected slice and requires target-specific live proof', () => {
  const input = releaseFixture()
  const plan = planVerification(input)
  assert.equal(plan.selected.length, 8)
  assert.deepEqual(plan.excluded.map(row => row.id), ['chrome', 'unrelated', 'all'])
  input.evidence = evidenceFor(plan, input.bindings)
  input.bindings.deployment = 'deployment-b'
  const next = planVerification(input)
  assert.deepEqual(next.selected.filter(row => row.action === 'run').map(row => row.id), ['deployed-identity', 'live-smoke'])
  input.bindings.environment = input.release.environment = 'cloud-prod'
  assert.equal(planVerification(input).selected.filter(row => row.action === 'run').length, 5)
  delete input.release.baseline.postdeploy
  assert.throws(() => planVerification(input), /missing postdeploy/)
})

test('a release label cannot run full regression, but a documented objective trigger can', () => {
  const input = releaseFixture()
  input.impacts[1].checks.push('all')
  assert.throws(() => planVerification(input), /full-only/)
  input.mode = 'full'
  input.full_regression = { trigger: 'release', reason: 'Just deploying' }
  assert.throws(() => planVerification(input), /objective trigger/)
  input.full_regression = { trigger: 'explicit-request', reason: 'Owner explicitly requested all active suites for this candidate' }
  assert.equal(planVerification(input).excluded.length, 0)
})

test('predeployment dispatch does not require running postdeployment checks early', () => {
  const input = releaseFixture()
  input.dispatch_phase = 'predeploy'
  input.requested_checks = planVerification(input).selected.filter(row => row.phase !== 'postdeploy').map(row => row.id)
  assert.doesNotThrow(() => planVerification(input))
  input.requested_checks.push('live-smoke')
  assert.throws(() => planVerification(input), /another deployment phase/)
})

test('proposed command dispatch rejects unrelated tests, omitted proof and redundant reruns', () => {
  const input = fixture(true)
  input.requested_checks = ['book', 'unit', 'api', 'chrome']
  assert.throws(() => planVerification(input), /unrelated/)
  input.requested_checks = ['book']
  assert.throws(() => planVerification(input), /omit required/)
  input.requested_checks = ['book', 'unit', 'api']
  input.evidence = evidenceFor(planVerification(input), input.bindings)
  assert.throws(() => planVerification(input), /rerun reusable/)
  input.requested_checks = []
  assert.ok(planVerification(input).selected.every(row => row.action === 'reuse'))
})

test('task reading narrows owners and rejects unknown IDs or silently enabled features', () => {
  const planner = resolve(skill, 'assets/project-template/scripts/docs/manage-guideline.mjs')
  const run = (...args) => spawnSync(process.execPath, [planner, 'plan', ...args], { encoding: 'utf8' })
  const full = JSON.parse(run('--mode', 'project', '--profiles', 'nuxt-web,nuxt-api').stdout)
  const focused = JSON.parse(run('--mode', 'task', '--rules', 'VERIFY-SCOPE-001').stdout)
  assert.deepEqual(focused.modules.map(row => row.id), ['GDL-000', 'GDL-080'])
  assert.ok(focused.modules.length < full.modules.length / 2)
  assert.notEqual(run('--mode', 'task').status, 0)
  assert.notEqual(run('--mode', 'task', '--rules', 'TYPO-001').status, 0)
  assert.notEqual(run('--mode', 'task', '--rules', 'COMMERCIAL-001').status, 0)
  const capability = run('--mode', 'task', '--modules', 'GDL-065', '--capabilities', 'scheduler')
  assert.equal(capability.status, 0, capability.stderr)
  const plan = JSON.parse(capability.stdout)
  assert.deepEqual(plan.capabilities, ['queue', 'scheduler'])
  assert.ok(plan.modules.some(row => row.id === 'GDL-064'))
})

test('project planning requires explicit independent platforms and never scaffolds another client', () => {
  const planner = resolve(skill, 'assets/project-template/scripts/docs/manage-guideline.mjs')
  const run = (...args) => spawnSync(process.execPath, [planner, 'plan', ...args], { encoding: 'utf8' })
  const missing = run('--mode', 'project')
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /approved --profiles/)
  for (const profile of ['nuxt-web', 'nuxt-api', 'flutter-native']) {
    const result = run('--mode', 'project', '--profiles', profile)
    assert.equal(result.status, 0, result.stderr)
    const plan = JSON.parse(result.stdout)
    assert.deepEqual(plan.profiles, [profile, 'shared'].sort())
    const ids = new Set(plan.modules.map(row => row.id))
    assert.equal(ids.has('GDL-050'), profile === 'nuxt-web')
    assert.equal(ids.has('GDL-053'), profile === 'flutter-native')
    assert.equal(ids.has('GDL-061'), profile === 'nuxt-api')
  }
})

test('mixed-project native tasks select native rule owners and reject unapproved task platforms', () => {
  const planner = resolve(skill, 'assets/project-template/scripts/docs/manage-guideline.mjs')
  const run = (...args) => spawnSync(process.execPath, [planner, 'plan', '--mode', 'task', ...args], { encoding: 'utf8' })
  const native = run('--profiles', 'nuxt-web,nuxt-api,flutter-native', '--task-profiles', 'flutter-native', '--rules', 'UI-COPY-001,UI-RESP-001,TIME-PRESENTATION-001')
  assert.equal(native.status, 0, native.stderr)
  const plan = JSON.parse(native.stdout)
  assert.deepEqual(plan.task_profiles, ['flutter-native', 'shared'])
  assert.ok(plan.modules.some(row => row.id === 'GDL-053'))
  assert.ok(plan.modules.every(row => !['GDL-040', 'GDL-042', 'GDL-050', 'GDL-051', 'GDL-052'].includes(row.id)))
  const web = run('--profiles', 'nuxt-web,flutter-native', '--task-profiles', 'nuxt-web', '--rules', 'UI-COPY-001')
  assert.equal(web.status, 0, web.stderr)
  assert.ok(JSON.parse(web.stdout).modules.every(row => row.id !== 'GDL-053'))
  assert.notEqual(run('--profiles', 'nuxt-web', '--task-profiles', 'flutter-native', '--rules', 'UI-COPY-001').status, 0)
  assert.notEqual(run('--profiles', 'nuxt-api', '--rules', 'UI-COPY-001').status, 0)
})

test('published example is an executable valid documentation-only scope plan', async () => {
  const source = await readFile(resolve(skill, 'assets/project-template/docs/guidelines/modules/80-testing-and-verification.md'), 'utf8')
  const section = source.slice(source.indexOf('For example, one documentation edit'))
  const example = JSON.parse(section.match(/```json\n([\s\S]*?)\n```/u)[1])
  assert.deepEqual(planVerification(example).selected.map(row => row.id), ['book'])
})

function browserFixture() {
  const input = fixture(true)
  const browserCheck = (id, project, engine, coverage) => check(id, 'runtime', {
    command: ['pnpm', 'exec', 'playwright', 'test', `${id}.spec.ts`, `--project=${project}`],
    browser_runs: [{ project, engine, coverage }],
  })
  input.checks.push(
    browserCheck('chrome-flow', 'chrome', 'chromium', 'functional'),
    browserCheck('firefox-layout', 'firefox', 'firefox', 'ui-ux'),
    browserCheck('safari-layout', 'safari', 'webkit', 'ui-ux'),
    browserCheck('mobile-layout', 'mobile-chrome', 'chromium', 'ui-ux'),
    browserCheck('safari-print', 'safari', 'webkit', 'functional'),
    browserCheck('safari-unrelated-flow', 'safari', 'webkit', 'functional'),
  )
  input.browser_policy = { functional_project: 'chrome' }
  input.impacts[1].checks.push('chrome-flow', 'firefox-layout', 'safari-layout', 'mobile-layout')
  return input
}

test('Chrome functional and secondary UI/UX checks run only for selected surfaces', () => {
  const input = browserFixture()
  const plan = planVerification(input)
  assert.deepEqual(plan.selected.map(row => row.id), ['book', 'unit', 'api', 'chrome-flow', 'firefox-layout', 'safari-layout', 'mobile-layout'])
  input.evidence = evidenceFor(plan, input.bindings)
  input.bindings.revision = 'committed-content'
  input.requested_checks = []
  assert.ok(planVerification(input).selected.every(row => row.action === 'reuse'))
})

test('full regression expands workflows without multiplying secondary functional suites', () => {
  const input = browserFixture()
  input.mode = 'full'
  input.full_regression = { trigger: 'explicit-request', reason: 'Run full tests for the candidate' }
  const plan = planVerification(input)
  assert.ok(plan.selected.some(row => row.id === 'all'))
  assert.deepEqual(plan.excluded.map(row => row.id), ['safari-print', 'safari-unrelated-flow'])
  assert.match(plan.excluded[0].reason, /UI\/UX compatibility/)
})

test('secondary functional coverage requires a specific browser reason and exact checks', () => {
  const input = browserFixture()
  input.impacts[1].checks.push('safari-print')
  assert.throws(() => planVerification(input), /secondary-browser functional/)
  input.browser_policy.additional_functional = [{ project: 'safari', trigger: 'release', reason: 'Deploying', checks: ['safari-print'] }]
  assert.throws(() => planVerification(input), /browser-specific trigger/)
  input.browser_policy.additional_functional[0] = { project: 'safari', trigger: 'browser-specific-risk', reason: 'Changed print handling uses a browser-specific popup lifecycle', checks: ['safari-print'] }
  assert.ok(planVerification(input).selected.some(row => row.id === 'safari-print'))
  input.mode = 'full'
  input.full_regression = { trigger: 'cross-cutting-change', reason: 'Shared print component affects registered consumers' }
  assert.deepEqual(planVerification(input).excluded.map(row => row.id), ['safari-unrelated-flow'])
  input.browser_policy.additional_functional[0].checks.push('missing')
  assert.throws(() => planVerification(input), /exception checks/)
})

test('aggregate commands cannot hide extra browser runs, even in full mode', () => {
  const input = browserFixture()
  input.checks.push(check('legacy-browser-matrix', 'runtime', { browser_runs: [
    { project: 'chrome', engine: 'chromium', coverage: 'functional' },
    { project: 'safari', engine: 'webkit', coverage: 'functional' },
  ] }))
  input.impacts[1].checks.push('legacy-browser-matrix')
  assert.throws(() => planVerification(input), /split aggregate commands/)
  input.mode = 'full'
  input.full_regression = { trigger: 'explicit-request', reason: 'Full workflow baseline' }
  assert.throws(() => planVerification(input), /split aggregate commands/)
  input.checks.at(-1).kind = 'static'
  assert.throws(() => planVerification(input), /browser commands must be runtime/)
})

test('missing browser metadata and old exports require migration instead of silent fallback', () => {
  const old = fixture()
  old.schema_version = 1
  assert.throws(() => planVerification(old), /schema_version must be 2/)
  const incomplete = fixture()
  delete incomplete.checks[0].browser_runs
  assert.throws(() => planVerification(incomplete), /browser_runs must be an array/)
  const invalid = browserFixture()
  invalid.browser_policy.functional_project = 'safari'
  assert.throws(() => planVerification(invalid), /Chrome\/Chromium/)
})
