import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { resolve, relative, dirname } from 'node:path'

export const UI_RULES = ['UI-VISUAL-001', 'UI-DENSITY-001', 'UI-RESP-001',
  'UI-ACTION-001', 'UI-COPY-001', 'UI-CONTROL-001', 'UI-STATE-001', 'UI-ACCESS-001']
const text = value => typeof value === 'string' && value.trim().length > 0
const hash = value => createHash('sha256').update(value).digest('hex')
const digest = value => hash(JSON.stringify(value))
function need(value, message) { if (!value) throw new Error(`UI composition: ${message}`) }
function list(value, name) { need(Array.isArray(value), `${name} must be an array`); return value }
function unique(rows, name) {
  const map = new Map()
  for (const row of list(rows, name)) {
    need(text(row.id) && !map.has(row.id), `${name} IDs must be unique and nonempty`)
    map.set(row.id, row)
  }
  return map
}
function pathOK(path) {
  return text(path) && !path.startsWith('/') && !path.includes('\\')
    && !path.split('/').some(part => ['', '.', '..'].includes(part))
}
function fields(object, names, label) {
  need(object && names.every(name => text(object[name])), `${label}: missing ${names.join('/')}`)
}

/** The project adapter supplies source-derived ownership, including shared consumers.
 * This guard validates that mapping; it cannot infer arbitrary framework imports. */
export function planUI(input) {
  const ui = input.ui
  need(ui?.schema_version === 1, 'export ui schema_version 1, paths and screens; migrate the project adapter')
  const screens = unique(ui.screens, 'screens')
  const paths = new Map()
  for (const row of list(ui.paths, 'paths')) {
    need(pathOK(row.path) && !paths.has(row.path), 'path mappings must be unique project-relative paths')
    fields(row, ['reason'], row.path)
    list(row.screens, `${row.path}.screens`).forEach(id => need(screens.has(id), `unknown screen ${id}`))
    list(row.consumers, `${row.path}.consumers`)
    paths.set(row.path, row)
  }
  for (const row of paths.values()) {
    row.consumers.forEach(path => need(paths.has(path), `unmapped shared consumer ${path}`))
  }
  for (const screen of screens.values()) {
    if (!Object.hasOwn(screen, 'scope_sources')) continue
    const scope = list(screen.scope_sources, `${screen.id}.scope_sources`)
    need(scope.length && new Set(scope).size === scope.length
      && scope.every(path => pathOK(path) && paths.has(path)),
    `${screen.id}: scope_sources must name unique mapped source paths`)
  }
  const roots = new Set([
    ...input.impacts.filter(row => row.kind === 'runtime').map(row => row.path),
    ...input.changed_paths.filter(path => paths.has(path)
      && !input.impacts.some(row => row.path === path && row.kind === 'documentation')),
    ...input.changed_paths.filter(path => /\.(vue|jsx|tsx|css|scss|html)$/u.test(path)),
    ...list(input.review_paths, 'review_paths'),
  ])
  const selected = new Set()
  function visit(path, root, visited) {
    need(paths.has(path), `missing applicability mapping for ${path}`)
    if (visited.has(path)) return
    visited.add(path)
    const row = paths.get(path)
    const eligible = row.screens.filter(id => {
      const scope = screens.get(id).scope_sources
      return !scope || (input.mode !== 'full' && scope.includes(root))
    })
    need(!row.screens.length || eligible.length,
      `${path}: scoped evidence does not cover ${root}; map the complete affected composition`)
    eligible.forEach(id => selected.add(id))
    row.consumers.forEach(consumer => visit(consumer, root, visited))
  }
  // Coverage is checked independently per initiating source. A previously
  // visited consumer must not hide an uncovered second root in a mixed task.
  roots.forEach(root => visit(root, root, new Set()))
  if (input.mode === 'full') {
    paths.forEach(row => { if (row.screens.length) visit(row.path, row.path, new Set()) })
    screens.forEach((_, id) => selected.add(id))
  }
  for (const path of roots) {
    if (/\.(vue|jsx|tsx|css|scss|html)$/u.test(path)) {
      const reached = new Set()
      const seen = new Set()
      function collect(key) {
        if (seen.has(key)) return
        seen.add(key)
        paths.get(key).screens.forEach(id => reached.add(id))
        paths.get(key).consumers.forEach(collect)
      }
      collect(path)
      need(reached.size, `${path}: presentation source cannot silently opt out of rendered evidence`)
    }
  }
  const result = [...selected].sort().map(id => {
    const screen = screens.get(id)
    fields(screen, ['route', 'actor', 'task', 'width_strategy', 'hierarchy', 'primary_action'], id)
    need(['web', 'native'].includes(screen.platform), `${id}: platform must be web or native`)
    need(typeof screen.desktop_supported === 'boolean', `${id}: desktop_supported is required`)
    need(screen.platform !== 'web' || screen.desktop_supported, `${id}: web requires desktop evidence`)
    unique(screen.supporting_regions, `${id}.supporting_regions`)
      .forEach(region => fields(region, ['purpose', 'sizing'], `${id} region`))
    const controls = unique(screen.fields, `${id}.fields`)
    for (const field of controls.values()) {
      fields(field, ['meaning', 'value_kind', 'value_limit', 'format', 'unit', 'width_strategy', 'inspection'], `${id}.${field.id}`)
    }
    const cases = unique(screen.cases, `${id}.cases`)
    need(cases.size, `${id}: rendered cases required`)
    const states = list(screen.states, `${id}.states`)
    need(states.length && states.every(text) && new Set(states).size === states.length,
      `${id}: relevant states must be explicit and unique`)
    for (const scenario of cases.values()) {
      fields(scenario, ['state', 'fixture', 'theme', 'locale'], `${id}.${scenario.id}`)
      need(states.includes(scenario.state), `${id}: unregistered case state`)
      need(['light', 'dark'].includes(scenario.theme), `${id}: unknown theme`)
      const vp = scenario.viewport
      need(vp && ['phone', 'desktop', 'wide-desktop'].includes(vp.kind)
        && Number.isFinite(vp.width) && Number.isFinite(vp.height) && vp.height > 0,
      `${id}: invalid viewport`)
      need(vp.kind === 'phone' ? vp.width >= 320 && vp.width <= 430
        : vp.kind === 'desktop' ? vp.width >= 1280 && vp.width < 1920 : vp.width >= 1920,
      `${id}: viewport dimensions do not match its kind`)
      const ranges = scenario.field_widths
      const hidden = list(scenario.hidden_fields, `${id}.hidden_fields`)
      need(hidden.every(key => controls.has(key)) && new Set(hidden).size === hidden.length,
        `${id}: hidden fields must name unique registered fields`)
      if (hidden.length) fields(scenario, ['visibility_reason'], `${id} conditional fields`)
      need(ranges && Object.keys(ranges).length + hidden.length === controls.size,
        `${id}: width budgets and explicit hidden fields must cover every field`)
      for (const [key, range] of Object.entries(ranges)) {
        need(controls.has(key) && !hidden.includes(key) && Number.isFinite(range.min) && Number.isFinite(range.max)
          && range.min > 0 && range.max >= range.min && range.max <= vp.width,
        `${id}.${key}: invalid per-case field width budget`)
      }
      need(Number.isFinite(scenario.max_content_width) && scenario.max_content_width > 0
        && scenario.max_content_width <= vp.width, `${id}: content width budget required`)
    }
    const rows = [...cases.values()]
    states.forEach(state => need(rows.some(row => row.state === state), `${id}: missing state ${state}`))
    for (const kind of screen.desktop_supported ? ['phone', 'desktop', 'wide-desktop'] : ['phone']) {
      for (const theme of ['light', 'dark']) {
        for (const fixture of ['representative', 'maximum-values', 'long-labels-errors']) {
          need(rows.some(row => row.viewport.kind === kind && row.theme === theme && row.fixture === fixture),
            `${id}: missing ${kind}/${theme}/${fixture}`)
        }
      }
    }
    const checks = list(screen.checks, `${id}.checks`)
    need(checks.length && checks.every(text) && new Set(checks).size === checks.length, `${id}: checks required`)
    const exceptions = unique(screen.exceptions, `${id}.exceptions`)
    for (const exception of exceptions.values()) {
      fields(exception, ['criterion', 'target', 'reason', 'approval', 'reviewer', 'contract_ref', 'alternative'], `${id} exception`)
      need(exception.status === 'approved', `${id}: exception approval must be explicit and current`)
      need(cases.has(exception.case_id), `${id}: exception must name an exact case`)
      need(['field-width', 'content-width', 'touch-target'].includes(exception.criterion), `${id}: exception cannot waive review or evidence`)
      need(exception.criterion === 'field-width' ? controls.has(exception.target) : exception.target === 'screen', `${id}: unknown exception target`)
    }
    return { ...screen, rules: [...UI_RULES], contract_digest: digest(screen) }
  })
  return { screens: result, rules: result.length ? [...UI_RULES] : [], checks: [...new Set(result.flatMap(row => row.checks))] }
}

const measuredCriteria = ['labels_readable', 'values_inspectable', 'errors_readable',
  'keyboard_operable', 'focus_order_correct', 'actions_order_correct', 'no_overlap']
const visualCriteria = ['field_sizing', 'hierarchy', 'supporting_regions', 'empty_space',
  'copy_relevance', 'action_meaning', 'grouping', 'typography_density']

// Evidence files are bounded local artifacts, never fetched URLs or symlink escapes.
async function artifact(root, entry) {
  need(entry && pathOK(entry.path) && /^[a-f0-9]{64}$/u.test(entry.sha256 ?? ''), 'invalid artifact reference')
  const base = await realpath(root)
  const target = resolve(base, entry.path)
  let cursor = target
  while (cursor !== base) {
    need(!(await lstat(cursor)).isSymbolicLink(), 'artifact must not use symlinks')
    cursor = dirname(cursor)
  }
  need((await lstat(target)).isFile() && !relative(base, await realpath(target)).startsWith('..'), 'artifact must be a regular contained file')
  need(hash(await readFile(target)) === entry.sha256, 'artifact hash mismatch')
}

/** Completion is separate from planning: missing evidence allows planning, never completion.
 * Measurements/review assertions must come from trusted runners/reviewers, not invented JSON. */
export async function verifyUI(input, artifactRoot) {
  const plan = planUI(input)
  const failures = []
  for (const screen of plan.screens) {
    for (const scenario of screen.cases) {
      const label = `${screen.id}/${scenario.id}`
      try {
        const evidence = list(input.ui.evidence, 'evidence').filter(row => row.screen === screen.id && row.case_id === scenario.id)
        need(evidence.length === 1, `${label}: exactly one current evidence record required`)
        const row = evidence[0]
        need(row.status === 'passed' && row.contract_digest === screen.contract_digest, `${label}: failed/pending/stale contract evidence`)
        const keys = !input.release ? ['content', 'context', 'environment']
          : ['content', 'context', 'environment', 'revision', 'image', ...(input.dispatch_phase === 'postdeploy' ? ['deployment'] : [])]
        need(keys.every(key => text(input.bindings[key]) && row.bindings?.[key] === input.bindings[key]), `${label}: candidate/environment binding mismatch`)
        need(row.route === screen.route && row.actor === screen.actor && row.state === scenario.state
          && row.fixture === scenario.fixture && row.locale === scenario.locale && row.theme === scenario.theme
          && digest(row.viewport) === digest(scenario.viewport), `${label}: rendered context mismatch`)
        fields(row, ['runner', 'recorded_at'], label)
        need(Number.isFinite(Date.parse(row.recorded_at)), `${label}: invalid timestamp`)
        await artifact(artifactRoot, row.measurement_artifact)
        await artifact(artifactRoot, row.screenshot)
        const measurements = JSON.parse(await readFile(resolve(artifactRoot, row.measurement_artifact.path), 'utf8'))
        need(measurements.schema_version === 1, `${label}: measurement schema required`)
        const except = (criterion, target) => screen.exceptions.some(item => item.case_id === scenario.id
          && item.criterion === criterion && item.target === target && row.applied_exceptions?.includes(item.id))
        const applied = list(row.applied_exceptions ?? [], 'applied_exceptions')
        need(new Set(applied).size === applied.length, `${label}: duplicate applied exception`)
        for (const id of applied) need(screen.exceptions.some(item => item.id === id && item.case_id === scenario.id), `${label}: unapproved exception`)
        need(Number.isFinite(measurements.content_width) && measurements.content_width > 0
          && (measurements.content_width <= scenario.max_content_width || except('content-width', 'screen')), `${label}: content exceeds width budget`)
        need(measurements.page_overflow_px === 0, `${label}: page overflow`)
        need(scenario.hidden_fields.every(id => measurements.hidden_fields?.includes(id)
          && !Object.hasOwn(measurements.field_widths ?? {}, id)), `${label}: conditional field visibility mismatch`)
        for (const [id, range] of Object.entries(scenario.field_widths)) {
          const width = measurements.field_widths?.[id]
          need(Number.isFinite(width) && width > 0 && ((width >= range.min && width <= range.max)
            || except('field-width', id)), `${label}: field-width ${id} outside approved budget`)
        }
        need(measuredCriteria.every(key => measurements[key] === true), `${label}: missing/failed readability, keyboard or action assertions`)
        if (scenario.viewport.kind === 'phone') {
          need(Number.isFinite(measurements.min_touch_target) && (measurements.min_touch_target >= (screen.platform === 'native' ? 48 : 44)
            || except('touch-target', 'screen')), `${label}: touch-target below minimum`)
        }
        const review = row.visual_review
        fields(review, ['reviewer', 'reviewer_kind', 'reviewed_at', 'notes'], `${label} visual review`)
        need(['human', 'agent'].includes(review.reviewer_kind) && Number.isFinite(Date.parse(review.reviewed_at)), `${label}: named visual reviewer required`)
        need(review.status === 'passed' && visualCriteria.every(key => review.criteria?.[key] === 'passed'), `${label}: visual composition review incomplete or failed`)
        need(review.measurement_sha256 === row.measurement_artifact.sha256 && review.screenshot_sha256 === row.screenshot.sha256,
          `${label}: visual review must bind the inspected artifacts`)
      } catch (error) { failures.push(`${label}: ${error.message}`) }
    }
  }
  return { status: failures.length ? 'not_verified' : 'scope_complete', screens: plan.screens.map(row => row.id), failures }
}
