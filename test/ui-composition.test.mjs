import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { planUI, verifyUI, UI_RULES } from '../.agents/skills/doxanh/scripts/ui-composition-policy.mjs'
import { planVerification } from '../.agents/skills/doxanh/scripts/verification-policy.mjs'

const hash = value => createHash('sha256').update(value).digest('hex')
function screen(id = 'edit') {
  return {
    id, route: '/records/:id', actor: 'authorized editor', task: 'Edit a record',
    platform: 'web', desktop_supported: true, primary_action: 'Review changes',
    hierarchy: 'Record identity, editing fields, consequence summary, actions',
    width_strategy: 'Constrained editor with separate supporting information',
    states: ['editing', 'validation'],
    supporting_regions: [{ id: 'summary', purpose: 'Show consequences', sizing: 'Content height; no equal-height stretch' }],
    fields: [
      { id: 'quantity', meaning: 'Number of copies', value_kind: 'integer', value_limit: '1 to 999', format: '3 decimal digits', unit: 'copies', width_strategy: 'Bounded short control, label above', inspection: 'Complete formatted number visible' },
      { id: 'title', meaning: 'Record title', value_kind: 'text', value_limit: '200 characters', format: 'plain text', unit: 'none', width_strategy: 'Fill constrained editor', inspection: 'Keyboard horizontal inspection while editing; wrapping detail view' },
    ],
    cases: ['phone', 'desktop', 'wide-desktop'].flatMap((kind, index) => ['light', 'dark'].flatMap(theme => ['representative', 'maximum-values', 'long-labels-errors'].map(fixture => ({
      id: `${kind}-${theme}-${fixture}`, state: fixture === 'long-labels-errors' ? 'validation' : 'editing',
      fixture, locale: 'en', theme,
      viewport: { kind, width: [390, 1440, 2560][index], height: 900 },
      max_content_width: index === 0 ? 358 : 960,
      hidden_fields: [],
      field_widths: { quantity: { min: 80, max: 160 }, title: { min: index === 0 ? 200 : 400, max: index === 0 ? 358 : 900 } },
    })))),
    checks: ['layout'], exceptions: [],
  }
}
function fixture() {
  return {
    schema_version: 3, mode: 'changed', changed_paths: ['app/Edit.vue'], review_paths: [], unmatched_paths: [],
    impacts: [{ path: 'app/Edit.vue', kind: 'runtime', reason: 'Edit field composition', checks: ['static'] }],
    checks: [
      { id: 'static', command: ['node', 'static.mjs'], kind: 'static', binding: 'content', phase: 'verify', browser_runs: [] },
      { id: 'layout', command: ['node', 'layout.mjs'], kind: 'runtime', binding: 'content', phase: 'verify', browser_runs: [{ project: 'chrome', engine: 'chromium', coverage: 'functional' }] },
      { id: 'unrelated-payment', command: ['node', 'payment.mjs'], kind: 'runtime', binding: 'content', phase: 'verify', browser_runs: [] },
    ],
    bindings: { content: 'source-digest', context: 'fixture-toolchain-digest', environment: 'isolated-render' },
    browser_policy: { functional_project: 'chrome' },
    ui: { schema_version: 1, paths: [{ path: 'app/Edit.vue', screens: ['edit'], consumers: [], reason: 'Owning screen' }], screens: [screen()], evidence: [] },
  }
}
async function evidence(input, root) {
  input.ui.evidence = []
  for (const entry of planUI(input).screens) for (const scenario of entry.cases) {
    const name = `${entry.id}-${scenario.id}`
    // These are policy fixtures, not claimed browser or subjective-design proof.
    const measurement = {
      schema_version: 1, content_width: scenario.viewport.kind === 'phone' ? 358 : 960,
      page_overflow_px: 0, hidden_fields: scenario.hidden_fields,
      field_widths: Object.fromEntries(Object.keys(scenario.field_widths).map(id => [id,
        id === 'quantity' ? 120 : scenario.viewport.kind === 'phone' ? 350 : 850])),
      labels_readable: true, values_inspectable: true, errors_readable: true,
      keyboard_operable: true, focus_order_correct: true, actions_order_correct: true, no_overlap: true,
      min_touch_target: entry.platform === 'native' ? 48 : 44,
    }
    const source = JSON.stringify(measurement)
    await writeFile(resolve(root, `${name}.json`), source)
    await writeFile(resolve(root, `${name}.png`), 'fixture artifact, not a real screenshot')
    input.ui.evidence.push({
      screen: entry.id, case_id: scenario.id, route: entry.route, actor: entry.actor,
      state: scenario.state, fixture: scenario.fixture, locale: scenario.locale,
      theme: scenario.theme, viewport: scenario.viewport, status: 'passed',
      contract_digest: entry.contract_digest, bindings: { ...input.bindings },
      runner: 'policy fixture', recorded_at: '2026-09-14T00:00:00Z',
      measurement_artifact: { path: `${name}.json`, sha256: hash(source) },
      screenshot: { path: `${name}.png`, sha256: hash('fixture artifact, not a real screenshot') },
      visual_review: {
        reviewer: 'Fixture reviewer', reviewer_kind: 'human', reviewed_at: '2026-09-14T00:00:00Z', notes: 'Explicit fixture evaluation', status: 'passed',
        measurement_sha256: hash(source), screenshot_sha256: hash('fixture artifact, not a real screenshot'),
        criteria: Object.fromEntries(['field_sizing', 'hierarchy', 'supporting_regions', 'empty_space', 'copy_relevance', 'action_meaning', 'grouping', 'typography_density'].map(key => [key, 'passed'])),
      },
    })
  }
}
async function withEvidence(run) {
  const root = await mkdtemp(resolve(tmpdir(), 'doxanh-ui-'))
  try { const input = fixture(); await evidence(input, root); await run(input, root) }
  finally { await rm(root, { recursive: true, force: true }) }
}

test('UI rules and browser slice are automatic without the user naming rules', () => {
  const plan = planVerification(fixture())
  assert.deepEqual(plan.ui.rules, UI_RULES)
  assert.deepEqual(plan.selected.map(row => row.id), ['static', 'layout'])
  assert.deepEqual(plan.excluded.map(row => row.id), ['unrelated-payment'])
})
test('shared dependency closure includes each consumer, handles cycles and supports read-only review', () => {
  const input = fixture()
  input.ui.screens.push(screen('create'), screen('unrelated'))
  input.ui.paths.push({ path: 'app/Shared.vue', screens: [], consumers: ['app/Edit.vue', 'app/Create.vue'], reason: 'Shared field owner' })
  input.ui.paths.push({ path: 'app/Create.vue', screens: ['create'], consumers: [], reason: 'Creation screen' })
  input.ui.paths[0].consumers = ['app/Shared.vue']
  input.changed_paths = []; input.impacts = []; input.review_paths = ['app/Shared.vue']
  assert.deepEqual(planVerification(input).ui.screens.map(row => row.id), ['create', 'edit'])
  input.ui.paths[1].consumers.push('app/Missing.vue')
  assert.throws(() => planVerification(input), /unmapped shared consumer/)
})
test('missing mappings, rules, commands, numeric strategy and incomplete viewport/theme coverage fail closed', () => {
  for (const alter of [
    input => { delete input.ui },
    input => { input.ui.paths = [] },
    input => { input.ui.paths[0].screens = [] },
    input => { input.ui.screens[0].checks = [] },
    input => { input.ui.screens[0].checks = ['unknown'] },
    input => { delete input.ui.screens[0].fields[0].width_strategy },
    input => { input.ui.screens[0].cases.pop() },
    input => { input.ui.screens[0].cases[0].viewport.width = 1440 },
    input => { input.ui.screens[0].states.push('empty') },
    input => { input.ui.screens[0].cases = input.ui.screens[0].cases.filter(row => row.id !== 'phone-dark-maximum-values') },
  ]) { const input = fixture(); alter(input); assert.throws(() => planVerification(input)) }
})
test('bounded shared-region coverage follows each source independently and cannot certify a parent page', () => {
  const input = fixture()
  input.ui.screens[0].scope_sources = ['app/Dialog.vue']
  input.ui.screens.push({ ...screen('create-dialog'), scope_sources: ['app/Dialog.vue'] })
  input.ui.paths.push(
    { path: 'app/Dialog.vue', screens: [], consumers: ['app/Edit.vue', 'app/Create.vue'], reason: 'Shared dialog' },
    { path: 'app/Create.vue', screens: ['create-dialog'], consumers: [], reason: 'Second dialog consumer' },
    { path: 'app/Other.ts', screens: [], consumers: ['app/Edit.vue'], reason: 'Other shared dependency' },
  )
  input.changed_paths = []; input.impacts = []; input.review_paths = ['app/Dialog.vue']
  assert.deepEqual(planUI(input).screens.map(row => row.id), ['create-dialog', 'edit'])
  for (const roots of [['app/Edit.vue'], ['app/Other.ts'],
    ['app/Dialog.vue', 'app/Edit.vue'], ['app/Edit.vue', 'app/Dialog.vue']]) {
    input.review_paths = roots
    assert.throws(() => planUI(input), /scoped evidence does not cover/)
  }
  input.review_paths = ['app/Dialog.vue']; input.mode = 'full'
  assert.throws(() => planUI(input), /scoped evidence does not cover/)
  input.ui.screens.push(screen('complete-edit'), screen('complete-create'))
  input.ui.paths[0].screens.push('complete-edit')
  input.ui.paths[2].screens.push('complete-create')
  assert.equal(planUI(input).screens.length, 4)
  input.mode = 'changed'; input.review_paths = ['app/Edit.vue']
  assert.deepEqual(planUI(input).screens.map(row => row.id), ['complete-edit'])
})
test('scoped contracts reject malformed or unmapped source lists', () => {
  for (const scope of [[], null, 'app/Edit.vue', ['../escape.vue'],
    ['app/Missing.vue'], ['app/Edit.vue', 'app/Edit.vue']]) {
    const input = fixture(); input.ui.screens[0].scope_sources = scope
    assert.throws(() => planUI(input), /scope_sources/)
  }
})
test('documents and non-UI runtime do not select UI even in a mixed task', () => {
  const input = fixture()
  input.changed_paths = ['docs/spec.md', 'server/order.ts']
  input.impacts = input.changed_paths.map(path => ({ path, kind: path.endsWith('.md') ? 'documentation' : 'runtime', reason: 'Non-UI boundary', checks: ['static'] }))
  input.ui.paths.push({ path: 'server/order.ts', screens: [], consumers: [], reason: 'Server-only logic; no changed UI contract' })
  assert.deepEqual(planVerification(input).selected.map(row => row.id), ['static'])
})
test('legitimate wide title fields and responsive width budgets pass, not a universal width', async () => {
  await withEvidence(async (input, root) => assert.equal((await verifyUI(input, root)).status, 'scope_complete'))
})
test('oversized number, stretched content, unreadable fields, target and keyboard defects fail with current artifacts', async () => {
  for (const alter of [
    row => { row.field_widths.quantity = 850 }, row => { row.content_width = 2000 },
    row => { row.labels_readable = false }, row => { row.values_inspectable = false },
    row => { row.keyboard_operable = false }, row => { row.min_touch_target = 24 },
    row => { row.actions_order_correct = false }, row => { row.page_overflow_px = 1 },
  ]) await withEvidence(async (input, root) => {
    const ref = input.ui.evidence[0].measurement_artifact
    const row = JSON.parse(await readFile(resolve(root, ref.path), 'utf8'))
    alter(row); const source = JSON.stringify(row)
    await writeFile(resolve(root, ref.path), source); ref.sha256 = hash(source)
    input.ui.evidence[0].visual_review.measurement_sha256 = ref.sha256
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
  })
})
test('zero overflow and screenshots cannot override failed composition, redundant copy or confusing actions', async () => {
  for (const criterion of ['hierarchy', 'supporting_regions', 'empty_space', 'copy_relevance', 'action_meaning', 'grouping']) {
    await withEvidence(async (input, root) => {
      input.ui.evidence[0].visual_review.criteria[criterion] = 'failed'
      assert.equal((await verifyUI(input, root)).status, 'not_verified')
    })
  }
})
test('missing, failed, pending, stale or anonymous evidence blocks completion, not planning', async () => {
  for (const alter of [
    input => input.ui.evidence.pop(),
    input => { input.ui.evidence[0].status = 'pending' },
    input => { input.ui.evidence[0].status = 'failed' },
    input => { input.bindings.content = 'new-content' },
    input => { input.ui.evidence[0].actor = 'another actor' },
    input => { input.ui.evidence[0].theme = 'another theme' },
    input => { input.ui.evidence[0].viewport = { ...input.ui.evidence[0].viewport, width: 500 } },
    input => { input.ui.evidence[0].visual_review.screenshot_sha256 = 'wrong-artifact' },
    input => { input.ui.evidence[0].visual_review.reviewer = '' },
    input => { input.ui.evidence[0].visual_review.reviewer_kind = 'automated' },
    input => { input.ui.evidence[0].visual_review.status = 'pending' },
    input => { input.ui.screens[0].fields[0].value_limit = '1000' },
  ]) await withEvidence(async (input, root) => {
    alter(input); assert.doesNotThrow(() => planVerification(input))
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
  })
})

test('native phone-only UI selects its native harness without manufacturing desktop or browser evidence', async () => {
  await withEvidence(async (input, root) => {
    input.ui.screens[0].platform = 'native'
    input.ui.screens[0].desktop_supported = false
    input.ui.screens[0].cases = input.ui.screens[0].cases.filter(row => row.viewport.kind === 'phone')
    input.checks[1].browser_runs = []
    delete input.browser_policy
    await evidence(input, root)
    assert.deepEqual(planVerification(input).selected.map(row => row.id), ['static', 'layout'])
    assert.equal((await verifyUI(input, root)).status, 'scope_complete')
  })
})

test('explicit loading visibility is supported but omitted or unexpectedly rendered fields fail', async () => {
  await withEvidence(async (input, root) => {
    const entry = input.ui.screens[0]
    entry.states.push('loading')
    entry.cases.push({ ...entry.cases[0], id: 'loading', state: 'loading', fixture: 'loading',
      field_widths: {}, hidden_fields: ['quantity', 'title'], visibility_reason: 'Inputs replaced by loading feedback' })
    await evidence(input, root)
    assert.equal((await verifyUI(input, root)).status, 'scope_complete')
    const row = input.ui.evidence.at(-1)
    const data = JSON.parse(await readFile(resolve(root, row.measurement_artifact.path), 'utf8'))
    data.field_widths.quantity = 120
    const source = JSON.stringify(data)
    await writeFile(resolve(root, row.measurement_artifact.path), source)
    row.measurement_artifact.sha256 = row.visual_review.measurement_sha256 = hash(source)
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
    entry.cases.at(-1).hidden_fields = []
    assert.throws(() => planVerification(input), /cover every field/)
  })
})

test('task planner automatically loads UI owners and screen generation is deterministic and read-only', async () => {
  const template = '.agents/skills/doxanh/assets/project-template'
  const script = `${template}/scripts/docs/manage-guideline.mjs`
  const plan = spawnSync(process.execPath, [script, 'plan', '--mode', 'task', '--profiles', 'nuxt-web', '--ui'], { encoding: 'utf8' })
  assert.equal(plan.status, 0, plan.stderr)
  const parsed = JSON.parse(plan.stdout)
  // Assert the selected owners and rule set, not whether prose mentions a requirement.
  assert.deepEqual(parsed.rules, [...UI_RULES].sort())
  for (const id of ['GDL-023', 'GDL-050', 'GDL-051', 'GDL-052', 'GDL-080']) assert.ok(parsed.modules.some(row => row.id === id), id)
  const path = `${template}/docs/guidelines/modules/51-web-layouts-and-screens.md`
  const before = await readFile(path, 'utf8')
  const expected = before.slice(before.indexOf('### 8.9')).match(/````md\n([\s\S]*?)\n````/u)[1]
  const generate = () => spawnSync(process.execPath, [script, 'screen-template'], { encoding: 'utf8' })
  const first = generate(); const second = generate()
  assert.equal(first.status, 0, first.stderr)
  assert.equal(first.stdout.trim(), expected.trim())
  assert.equal(second.stdout, first.stdout)
  assert.equal(await readFile(path, 'utf8'), before)
})
test('exact approved exceptions preserve alternative designs but cannot waive review', async () => {
  await withEvidence(async (input, root) => {
    input.ui.screens[0].exceptions.push({ id: 'numeric-slider', status: 'approved', case_id: 'phone-light-representative', criterion: 'field-width', target: 'quantity', reason: 'Approved large accessible slider', approval: 'ADR-007 approved', reviewer: 'Design owner', contract_ref: 'docs/adr/007.md', alternative: 'Slider with separate readable value' })
    await evidence(input, root)
    const row = input.ui.evidence[0]
    const data = JSON.parse(await readFile(resolve(root, row.measurement_artifact.path), 'utf8'))
    data.field_widths.quantity = 300
    const source = JSON.stringify(data)
    await writeFile(resolve(root, row.measurement_artifact.path), source)
    row.measurement_artifact.sha256 = row.visual_review.measurement_sha256 = hash(source)
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
    row.applied_exceptions = ['numeric-slider']
    assert.equal((await verifyUI(input, root)).status, 'scope_complete')
    row.visual_review.status = 'pending'
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
    input.ui.screens[0].exceptions[0].status = 'pending'
    assert.throws(() => planVerification(input), /exception approval/)
  })
})
test('artifact tampering, symlinks, and mismatched visual attachments fail', async () => {
  await withEvidence(async (input, root) => {
    const ref = input.ui.evidence[0].screenshot
    await writeFile(resolve(root, ref.path), 'changed')
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
    await evidence(input, root)
    await symlink(resolve(root, ref.path), resolve(root, 'alias.png'))
    input.ui.evidence[0].screenshot.path = 'alias.png'
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
  })
})
test('commit-only evidence is reusable, release revision and deployment proof stay strict; CLI fails missing evidence', async () => {
  await withEvidence(async (input, root) => {
    input.bindings.revision = 'new-commit'
    assert.equal((await verifyUI(input, root)).status, 'scope_complete')
    input.mode = 'release'
    input.release = {}
    assert.equal((await verifyUI(input, root)).status, 'not_verified')
    input.mode = 'changed'; delete input.release; input.ui.evidence = []
    const path = resolve(root, 'plan.json'); await writeFile(path, JSON.stringify(input))
    const result = spawnSync(process.execPath, ['.agents/skills/doxanh/scripts/verification-policy.mjs', path, '--ui-complete', root], { encoding: 'utf8' })
    assert.equal(result.status, 1, result.stderr)
    assert.equal(JSON.parse(result.stdout).status, 'not_verified')
  })
})
