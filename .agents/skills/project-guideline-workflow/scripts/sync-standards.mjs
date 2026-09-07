#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { lstat, mkdir, rename, unlink, rmdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
function option(name) {
  const index = args.indexOf(name)
  return args.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1)
    ?? (index >= 0 ? args[index + 1] : undefined)
}
function run(script, command, probe = false) {
  // The new skill is checked against the selected release before the project's
  // old lock is upgraded. Passing --target here would resolve the old version.
  const forwarded = script === 'manage-user-skill.mjs'
    ? args.filter((value, index) => !['--target', '--repo-root'].includes(value)
      && !['--target', '--repo-root'].includes(args[index - 1])
      && !value.startsWith('--target=') && !value.startsWith('--repo-root='))
    : args
  const result = spawnSync(process.execPath, [resolve(directory, script), command, ...forwarded], { encoding: 'utf8' })
  if (probe) return result.status === 0
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || `${script} failed`)
}
async function exists(path) {
  try { await lstat(path); return true }
  catch (error) { if (error.code === 'ENOENT') return false; throw error }
}

let guard
let backup
let destination
let completed = false
let linkChanged = false
try {
  if (!option('--target')) throw new Error('--target is required')
  const home = resolve(option('--skills-home') ?? (process.env.CODEX_HOME
    ? resolve(process.env.CODEX_HOME, 'skills') : resolve(homedir(), '.codex/skills')))
  // Both sides are validated before changing either. One sequential process
  // also keeps make -j from racing independent update/link prerequisites.
  run('project-standards.mjs', 'preflight')
  run('manage-user-skill.mjs', 'preflight')
  await mkdir(home, { recursive: true })
  guard = resolve(home, '.doxanh-standards-sync.lock')
  await mkdir(guard)
  destination = resolve(home, 'project-guideline-workflow')
  const alreadyLinked = run('manage-user-skill.mjs', 'check', true)
  if (!alreadyLinked && await exists(destination)) {
    backup = resolve(home, `.project-guideline-workflow.sync-${process.pid}-${Date.now()}.bak`)
    await rename(destination, backup)
  }
  try {
    if (!alreadyLinked) {
      linkChanged = true
      run('manage-user-skill.mjs', 'sync')
    }
    run('manage-user-skill.mjs', 'check')
    run('project-standards.mjs', 'update')
    completed = true
    if (backup) console.log(`Previous user skill retained at ${backup}`)
  }
  catch (error) {
    if (linkChanged && await exists(destination)) {
      if (!(await lstat(destination)).isSymbolicLink()) throw new Error(`Unexpected concurrent change at ${destination}; recovery copy: ${backup ?? 'none'}`)
      await unlink(destination)
    }
    if (backup) await rename(backup, destination)
    throw error
  }
}
catch (error) {
  console.error(`Standards sync failed: ${error.message}`)
  process.exitCode = 1
}
finally {
  // Never remove another process's guard if mkdir failed with EEXIST.
  if (guard && (completed || destination)) await rmdir(guard)
}
