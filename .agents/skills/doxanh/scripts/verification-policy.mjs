#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fullTriggers = new Set([
  'explicit-request', 'initial-release-or-missing-baseline',
  'cross-cutting-change', 'systemic-evidence', 'unbounded-impact',
])
const baselinePurposes = {
  predeploy: ['candidate-integrity', 'target-readiness', 'recovery-readiness'],
  postdeploy: ['deployed-identity', 'live-smoke'],
}
const kinds = new Set(['documentation', 'static', 'tooling', 'runtime'])
const bindings = {
  content: ['content', 'context'],
  candidate: ['content', 'context', 'revision', 'image', 'environment'],
  deployment: ['content', 'context', 'revision', 'image', 'environment', 'deployment'],
}
const nonempty = value => typeof value === 'string' && value.trim().length > 0
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const browserTriggers = new Set(['explicit-request', 'browser-specific-risk', 'observed-browser-failure'])

function requireThat(condition, message) {
  if (!condition) throw new Error(message)
}

function strings(value, label) {
  requireThat(Array.isArray(value) && value.every(nonempty), `${label}: expected string array`)
  requireThat(new Set(value).size === value.length, `${label}: duplicate entries`)
  return value
}

/**
 * Validate a project-owned planner export; never discover dependencies by guessing
 * filenames or run commands. The adapter supplies real Git paths, command metadata
 * and trusted evidence. A valid selection is not proof its tests passed.
 */
export function planVerification(input) {
  requireThat(input?.schema_version === 2, 'schema_version must be 2; export browser_runs for every command')
  requireThat(['changed', 'release', 'full'].includes(input.mode), 'invalid mode')
  const changedPaths = strings(input.changed_paths, 'changed_paths')
  requireThat(changedPaths.every(path => !path.startsWith('/') && !path.split('/').includes('..')), 'paths must be project-relative')
  requireThat(Array.isArray(input.impacts), 'impacts must be an array')
  requireThat(Array.isArray(input.checks) && input.checks.length > 0, 'checks must contain the active command catalog')
  requireThat(input.bindings && nonempty(input.bindings.content) && nonempty(input.bindings.context), 'content and context fingerprints are required')
  requireThat(input.unmatched_paths?.length === 0, 'unmatched paths require impact review before tests')
  if (input.mode === 'full') {
    requireThat(fullTriggers.has(input.full_regression?.trigger) && nonempty(input.full_regression?.reason), 'full regression requires an objective trigger and evidence/reason')
  }
  else requireThat(!input.full_regression, 'full_regression is only valid in full mode')

  const checks = new Map()
  const browserProjects = new Map()
  for (const check of input.checks) {
    requireThat(nonempty(check.id) && !checks.has(check.id), 'check IDs must be nonempty and unique')
    requireThat(Array.isArray(check.command) && check.command.length > 0 && check.command.every(nonempty), `${check.id}: command must be a nonempty argument array`)
    requireThat(kinds.has(check.kind), `${check.id}: unknown kind`)
    requireThat(Object.hasOwn(bindings, check.binding), `${check.id}: invalid binding`)
    requireThat(['verify', 'predeploy', 'postdeploy'].includes(check.phase), `${check.id}: invalid phase`)
    strings(check.depends_on ?? [], `${check.id}.depends_on`)
    requireThat(Array.isArray(check.browser_runs), `${check.id}: browser_runs must be an array (empty for non-browser commands)`)
    const projects = new Set()
    for (const run of check.browser_runs) {
      requireThat(nonempty(run.project) && !projects.has(run.project), `${check.id}: browser projects must be nonempty and unique`)
      requireThat(['chromium', 'firefox', 'webkit'].includes(run.engine), `${check.id}: invalid browser engine`)
      requireThat(['functional', 'ui-ux'].includes(run.coverage), `${check.id}: invalid browser coverage`)
      requireThat(check.kind === 'runtime', `${check.id}: browser commands must be runtime checks`)
      requireThat(!browserProjects.has(run.project) || browserProjects.get(run.project) === run.engine, `${run.project}: inconsistent engine`)
      browserProjects.set(run.project, run.engine)
      projects.add(run.project)
    }
    checks.set(check.id, check)
  }
  const primary = input.browser_policy?.functional_project
  const additional = new Map()
  if (browserProjects.size > 0) {
    requireThat(browserProjects.has(primary), 'browser_policy.functional_project must name a registered browser project')
    requireThat(browserProjects.get(primary) === 'chromium', 'primary functional project must use Chrome/Chromium')
    requireThat(input.checks.some(check => check.browser_runs.some(run => run.project === primary && run.coverage === 'functional')), 'primary project needs registered functional coverage')
  }
  for (const exception of input.browser_policy?.additional_functional ?? []) {
    requireThat(browserProjects.has(exception.project) && exception.project !== primary && !additional.has(exception.project), 'additional functional project must be registered, secondary and unique')
    requireThat(browserTriggers.has(exception.trigger) && nonempty(exception.reason), `${exception.project}: extra functional coverage requires a browser-specific trigger and reason`)
    const ids = strings(exception.checks, `${exception.project}.checks`)
    requireThat(ids.length > 0 && ids.every(id => checks.get(id)?.browser_runs.some(run => run.project === exception.project && run.coverage === 'functional')), `${exception.project}: exception checks must name its functional commands`)
    additional.set(exception.project, exception)
  }
  function browserAllowed(check) {
    return check.browser_runs.every(run => run.coverage === 'ui-ux' || run.project === primary || additional.get(run.project)?.checks.includes(check.id))
  }
  // Validate the entire catalog, including excluded commands: future selection
  // must not uncover a dangling dependency or an infinite prerequisite loop.
  const visited = new Set()
  function visit(id, chain = []) {
    requireThat(checks.has(id), `unknown check ${id}`)
    requireThat(!chain.includes(id), `dependency cycle: ${[...chain, id].join(' -> ')}`)
    if (visited.has(id)) return
    for (const dependency of checks.get(id).depends_on ?? []) visit(dependency, [...chain, id])
    visited.add(id)
  }
  checks.forEach(check => visit(check.id))

  const selected = new Map()
  function select(id, reason, originKind) {
    const check = checks.get(id)
    requireThat(check, `unknown check ${id}`)
    requireThat(browserAllowed(check), `${id}: secondary-browser functional coverage needs its own browser-specific trigger; split aggregate commands`)
    requireThat(!(originKind === 'documentation' && !['documentation', 'static'].includes(check.kind)), `documentation cannot select ${check.kind} check ${id}`)
    requireThat(input.mode === 'full' || !check.full_only, `${id}: full-only command requires an objective full-regression trigger`)
    for (const dependency of check.depends_on ?? []) {
      requireThat(checks.get(dependency).phase === check.phase, `${id}: prerequisites must run in the same phase`)
      select(dependency, `prerequisite of ${id}: ${reason}`, originKind)
    }
    const reasons = selected.get(id) ?? new Set()
    reasons.add(reason)
    selected.set(id, reasons)
  }
  const mapped = new Set()
  for (const impact of input.impacts) {
    requireThat(changedPaths.includes(impact.path), `impact path is not changed: ${impact.path}`)
    requireThat(kinds.has(impact.kind) && nonempty(impact.reason), `${impact.path}: kind and impact reason required`)
    const ids = strings(impact.checks, `${impact.path}.checks`)
    requireThat(ids.length > 0, `${impact.path}: maintained change needs at least one check`)
    mapped.add(impact.path)
    ids.forEach(id => select(id, `${impact.path}: ${impact.reason}`, impact.kind))
  }
  requireThat(changedPaths.every(path => mapped.has(path)), 'every changed path needs an impact mapping')

  if (input.release) {
    requireThat(input.mode !== 'changed', 'release context cannot use changed mode')
    const { base, candidate, environment, diff_digest, baseline } = input.release
    requireThat(nonempty(base) && nonempty(diff_digest), 'release needs accepted/deployed base and complete diff digest')
    requireThat(nonempty(candidate) && candidate === input.bindings.revision, 'release candidate must match bindings')
    requireThat(nonempty(environment) && environment === input.bindings.environment, 'release target must match bindings')
    for (const [phase, purposes] of Object.entries(baselinePurposes)) {
      const entries = baseline?.[phase]
      requireThat(Array.isArray(entries), `missing ${phase} universal baseline`)
      for (const purpose of purposes) requireThat(entries.some(row => row.purpose === purpose), `missing baseline ${purpose}`)
      for (const entry of entries) {
        requireThat(purposes.includes(entry.purpose), `unknown baseline purpose ${entry.purpose}`)
        const check = checks.get(entry.check)
        requireThat(check?.phase === phase && check.binding === (phase === 'predeploy' ? 'candidate' : 'deployment'), `${entry.check}: baseline phase/binding mismatch`)
        requireThat(check.baseline_purpose === entry.purpose, `${entry.check}: not registered for baseline ${entry.purpose}`)
        select(entry.check, `universal release baseline: ${entry.purpose}`)
      }
    }
  }
  else requireThat(input.mode !== 'release', 'release context is required')
  if (input.mode === 'full') {
    for (const check of checks.values()) {
      if ((check.phase === 'verify' || input.release) && browserAllowed(check)) select(check.id, `full: ${input.full_regression.reason}`)
    }
  }

  const evidence = input.evidence ?? []
  requireThat(Array.isArray(evidence), 'evidence must be an array')
  const planned = [...selected].map(([id, reasons]) => {
    const check = checks.get(id)
    // The context fingerprint includes toolchain, environment/config and fixtures
    // as applicable. Missing proof is never replaced with a timestamp or Git SHA.
    const required = bindings[check.binding]
    const checkDigest = digest(check)
    const latest = evidence.findLast(row => row.check === id
      && row.check_digest === checkDigest && required.every(key => nonempty(input.bindings[key])
        && row.bindings?.[key] === input.bindings[key]))
    const reusable = latest?.status === 'passed'
    return { ...check, check_digest: checkDigest, reasons: [...reasons], action: reusable ? 'reuse' : 'run' }
  })
  if (input.requested_checks !== undefined) {
    const requested = strings(input.requested_checks, 'requested_checks')
    requireThat(input.dispatch_phase === undefined || ['verify', 'predeploy', 'postdeploy'].includes(input.dispatch_phase), 'invalid dispatch_phase')
    const inPhase = check => input.dispatch_phase === undefined
      || check.phase === input.dispatch_phase
      || (input.dispatch_phase === 'predeploy' && check.phase === 'verify')
    const dispatchable = planned.filter(check => inPhase(check) && check.action === 'run')
    requireThat(requested.every(id => selected.has(id)), 'requested command is unrelated to the reviewed impact plan')
    requireThat(requested.every(id => inPhase(checks.get(id))), 'requested command belongs to another deployment phase')
    requireThat(dispatchable.every(check => requested.includes(check.id)), 'requested commands omit required missing evidence')
    requireThat(requested.every(id => planned.find(check => check.id === id).action === 'run'), 'requested commands rerun reusable evidence')
  }
  return {
    schema_version: 2, mode: input.mode, selected: planned,
    browser_policy: input.browser_policy ?? null,
    excluded: [...checks.keys()].filter(id => !selected.has(id)).map(id => ({ id, reason: browserAllowed(checks.get(id))
      ? 'no changed-path dependency, release baseline or full-regression trigger'
      : 'secondary browser defaults to UI/UX compatibility; no functional expansion trigger' })),
    full_regression: input.full_regression ?? null,
    result: 'selection-valid-not-test-evidence',
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--help') {
      console.log('Usage: node verification-policy.mjs <project-export.json>\nContract and adoption fixtures: assets/project-template/docs/guidelines/modules/80-testing-and-verification.md, section 13.7.2.\nRead-only: prints selected run/reuse checks and exclusions; never runs tests or proves project compliance.')
    }
    else {
      if (!process.argv[2]) throw new Error('supply the project scope-plan JSON or --help')
      console.log(JSON.stringify(planVerification(JSON.parse(await readFile(resolve(process.argv[2]), 'utf8'))), null, 2))
    }
  }
  catch (error) {
    console.error(`Verification scope rejected: ${error.message}`)
    process.exitCode = 1
  }
}
