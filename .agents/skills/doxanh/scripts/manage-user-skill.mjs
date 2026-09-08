#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  lstat,
  cp,
  mkdir,
  readFile,
  readlink,
  readdir,
  realpath,
  rename,
  rm,
  rmdir,
  symlink,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillName = 'doxanh'
const legacySkillName = 'project-guideline-workflow'
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const sourceSkillRoot = resolve(scriptDirectory, '..')
const command = process.argv[2]

function fail(message) {
  console.error(`User skill ${command ?? 'command'} failed:`)
  console.error(`- ${message}`)
  process.exit(1)
}

function option(name) {
  const directIndex = process.argv.indexOf(name)
  const equalsValue = process.argv.find(value => value.startsWith(`${name}=`))
  return equalsValue?.slice(name.length + 1)
    ?? (directIndex >= 0 ? process.argv[directIndex + 1] : undefined)
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function exists(path) {
  try {
    await lstat(path)
    return true
  }
  catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function collectFiles(root, directory = root) {
  const paths = []
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const absolute = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(`source skill contains a symlink: ${absolute}`)
    }
    if (entry.isDirectory()) paths.push(...await collectFiles(root, absolute))
    else if (entry.isFile()) paths.push(absolute.slice(root.length + 1).split('\\').join('/'))
    else throw new Error(`source skill contains an unsupported entry: ${absolute}`)
  }
  return paths
}

async function skillContractFingerprint(source) {
  const paths = ['SKILL.md']
  for (const directory of ['agents', 'scripts']) {
    for (const path of await collectFiles(resolve(source, directory))) {
      paths.push(`${directory}/${path}`)
    }
  }
  paths.sort()
  let rows = ''
  for (const path of paths) {
    rows += `${path}\0${sha256(await readFile(resolve(source, path)))}\n`
  }
  return sha256(rows)
}

async function canonicalSource() {
  const source = await realpath(option('--source') ?? sourceSkillRoot)
  const metadata = await verifyPackage(source)
  return { metadata, source }
}

async function verifyPackage(source) {
  const skill = await readFile(resolve(source, 'SKILL.md'), 'utf8')
  const metadata = JSON.parse(
    await readFile(resolve(source, 'assets/project-standards.json'), 'utf8'),
  )
  if (
    ![skillName, legacySkillName].includes(metadata.skill_name ?? legacySkillName)
    || !skill.startsWith(`---\nname: ${metadata.skill_name ?? legacySkillName}\n`)
    || metadata.name !== 'doxanh-project-standards'
    || !/^\d+\.\d+\.\d+$/u.test(metadata.version ?? '')
    || !/^[a-f0-9]{64}$/u.test(metadata.skill_contract_sha256 ?? '')
  ) {
    throw new Error('source skill does not have a valid Doxanh package identity')
  }
  const fingerprint = await skillContractFingerprint(source)
  if (fingerprint !== metadata.skill_contract_sha256) {
    throw new Error('source skill contract differs from its package fingerprint')
  }
  const template = resolve(source, 'assets/project-template')
  let rows = ''
  for (const path of await collectFiles(template)) {
    rows += `${path}\0${sha256(await readFile(resolve(template, path)))}\n`
  }
  if (sha256(rows) !== metadata.project_template_sha256) {
    throw new Error('source template differs from its package fingerprint')
  }
  // Extra personal files are divergence too, not disposable installer content.
  const allowed = new Set(['SKILL.md', 'assets/project-standards.json'])
  for (const path of await collectFiles(source)) {
    if (!allowed.has(path) && !['agents/', 'scripts/', 'assets/project-template/'].some(prefix => path.startsWith(prefix))) {
      throw new Error(`unmanaged file in installed skill: ${path}`)
    }
  }
  return metadata
}

function snapshotHome(skillRoot) {
  const cache = dirname(dirname(skillRoot))
  return basename(cache) === '.doxanh-project-standards' ? dirname(cache) : null
}

function selectedAgents() {
  const agents = option('--agents') ?? 'codex'
  if (!['codex', 'claude', 'both'].includes(agents)) throw new Error('--agents must be codex, claude, or both')
  return agents
}

function claudeHome() {
  return resolve(option('--claude-skills-home') ?? resolve(process.env.CLAUDE_CONFIG_DIR ?? resolve(homedir(), '.claude'), 'skills'))
}

function primaryHome() {
  // An installed helper knows its owning snapshot store. This also makes a
  // Claude-only installation work without CODEX_HOME or a Codex installation.
  return resolve(option('--skills-home')
    ?? (!option('--agents') ? snapshotHome(sourceSkillRoot) : null)
    ?? (selectedAgents() === 'claude'
      ? claudeHome()
      : resolve(process.env.CODEX_HOME ?? resolve(homedir(), '.codex'), 'skills')))
}

async function canonicalHome(input, create = false) {
  if (create) await mkdir(input, { recursive: true })
  if (!await exists(input)) return resolve(await canonicalHome(dirname(input)), basename(input))
  const details = await lstat(input)
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new Error(`skills home must be a real directory: ${input}`)
  }
  return realpath(input)
}

async function storageHome(home) {
  const discovery = resolve(home, skillName)
  if (!await exists(discovery) || !(await lstat(discovery)).isSymbolicLink()) return home
  let target
  try { target = await realpath(discovery) }
  catch { return home } // Preflight reports a broken link without replacing it.
  const store = snapshotHome(target)
  if (!store) return home
  await assertSnapshotParents(store, target)
  await verifyPackage(target)
  return canonicalHome(store)
}

async function skillsHome(create) {
  return storageHome(await canonicalHome(primaryHome(), create))
}

async function installation() {
  selectedAgents()
  const primary = await canonicalHome(primaryHome())
  const home = await storageHome(primary)
  const homes = [home, primary]
  if (selectedAgents() === 'both') homes.push(await canonicalHome(claudeHome()))
  return { home, homes: [...new Set(homes)] }
}

async function recognizedInstalledDirectory(destination) {
  try {
    await verifyPackage(destination)
    return true
  }
  catch {
    return false
  }
}

async function destinationState(destination, source) {
  if (!await exists(destination)) return { kind: 'missing' }
  const details = await lstat(destination)
  if (details.isSymbolicLink()) {
    let target = null
    try {
      target = await realpath(destination)
    }
    catch {
      return { kind: 'broken-symlink' }
    }
    return { kind: target === source ? 'current-symlink' : 'other-symlink', target }
  }
  if (details.isDirectory()) {
    return {
      kind: await recognizedInstalledDirectory(destination)
        ? 'recognized-directory'
        : 'other-directory',
    }
  }
  return { kind: 'other-entry' }
}

async function checkInstallation(metadata, plan) {
  const source = snapshotPath(plan.home, metadata)
  await verifySnapshot(plan.home, metadata)
  for (const home of plan.homes) {
    const destination = resolve(home, skillName)
    const state = await destinationState(destination, source)
    if (state.kind !== 'current-symlink') {
      throw new Error(`${destination} is ${state.kind}; run skill-sync from the selected standards release`)
    }
    if (home !== plan.home && resolve(home, await readlink(destination)) !== resolve(plan.home, skillName)) {
      throw new Error(`${destination} must follow the shared discovery link; run skill-sync for both agents`)
    }
    if (await exists(resolve(home, legacySkillName))) {
      throw new Error(`legacy skill is still discoverable in ${home}; run skill-sync to migrate it safely`)
    }
  }
  return source
}

async function check() {
  const { metadata } = await canonicalSource()
  const plan = await installation()
  if (option('--target')) {
    // Verify discovery separately from the project's possibly older snapshot.
    // The source release is the selected bootstrap, not an implicit lock upgrade.
    const active = await verifyPackage(await realpath(resolve(plan.home, skillName)))
    await checkInstallation(active, plan)
    console.log(`Verified locked user skill: ${await resolveLocked(plan.home)}`)
    return
  }
  const source = await checkInstallation(metadata, plan)
  console.log(`Verified user skill ${skillName} ${metadata.version}: ${plan.homes.map(home => resolve(home, skillName)).join(', ')} -> ${source}`)
}

async function preflightInstallation(metadata, source, plan) {
  const snapshot = snapshotPath(plan.home, metadata)
  await assertSnapshotParents(plan.home, snapshot)
  if (await exists(snapshot)) await verifySnapshot(plan.home, metadata)
  for (const home of plan.homes) {
    for (const name of [skillName, legacySkillName]) {
      const state = await destinationState(resolve(home, name), snapshot)
      // Links already owned by either the shared store or this discovery home
      // are safe to update; copied or foreign packages still require migration.
      try { await assertReplaceable(state, plan.home, source) }
      catch { await assertReplaceable(state, home, source) }
    }
  }
  // A prior standalone Claude installation can contain versions pinned by
  // projects we cannot enumerate. Verify and retain all of them when joining
  // the shared store, so discovery migration does not strand those locks.
  const imports = []
  for (const home of plan.homes.filter(home => home !== plan.home)) {
    const cache = resolve(home, '.doxanh-project-standards')
    if (!await exists(cache)) continue
    await assertSnapshotParents(home, cache)
    for (const entry of await readdir(cache)) {
      const directory = resolve(cache, entry)
      await assertSnapshotParents(home, directory)
      const names = await readdir(directory)
      if (names.length !== 1 || ![skillName, legacySkillName].includes(names[0])) {
        throw new Error(`unrecognized cached snapshot: ${directory}`)
      }
      const previous = resolve(directory, names[0])
      const previousMetadata = await verifyPackage(previous)
      if (snapshotPath(home, previousMetadata) !== previous) throw new Error(`cached snapshot identity differs: ${previous}`)
      await verifySnapshot(home, previousMetadata)
      const destination = snapshotPath(plan.home, previousMetadata)
      await assertSnapshotParents(plan.home, destination)
      if (await exists(destination)) await verifySnapshot(plan.home, previousMetadata)
      imports.push({ source: previous, metadata: previousMetadata })
    }
  }
  return imports
}

function projectCommand(command) {
  const target = option('--target')
  if (!target) throw new Error('--update-project requires --target')
  const args = [resolve(scriptDirectory, 'project-standards.mjs'), command, '--target', target]
  if (option('--repo-root')) args.push('--repo-root', option('--repo-root'))
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || `Project ${command} failed`)
}

async function sync() {
  const { metadata, source } = await canonicalSource()
  const plan = await installation()
  if (hasFlag('--update-project')) projectCommand('preflight')
  await preflightInstallation(metadata, source, plan)
  for (const home of plan.homes) await canonicalHome(home, true)
  // All discovery entries and the optional project update share one transaction.
  const guards = []
  const changes = []
  try {
    for (const home of [...plan.homes].sort()) {
      const guard = resolve(home, '.doxanh-standards-sync.lock')
      await mkdir(guard)
      guards.push(guard)
    }
    // Recheck after acquiring the shared guard, before changing any links.
    const imports = await preflightInstallation(metadata, source, plan)
    for (const previous of imports) await cacheSnapshot(plan.home, previous.source, previous.metadata)
    const snapshot = await cacheSnapshot(plan.home, source, metadata)
    for (const home of plan.homes) {
      for (const name of [legacySkillName, skillName]) {
        const destination = resolve(home, name)
        if (name === skillName && (await destinationState(destination, snapshot)).kind === 'current-symlink'
          && (home === plan.home || resolve(home, await readlink(destination)) === resolve(plan.home, skillName))) continue
        const present = await exists(destination)
        if (!present && name === legacySkillName) continue
        const backup = present ? resolve(home, `.${name}.${process.pid}-${Date.now()}.bak`) : null
        if (backup) await rename(destination, backup)
        const change = { destination, backup, installed: false }
        changes.push(change)
        if (name === skillName) {
          // Other agents follow the store's stable discovery link, so even a
          // later single-agent update keeps the shared release consistent.
          const target = home === plan.home ? snapshot : resolve(plan.home, skillName)
          await symlink(target, destination, 'dir')
          change.installed = true
        }
      }
    }
    await checkInstallation(metadata, plan)
    if (hasFlag('--update-project')) projectCommand('update')
    for (const change of changes) {
      if (change.backup) console.log(`Previous installation retained at ${change.backup}`)
    }
    console.log(`Synchronized user skill ${skillName} ${metadata.version}: ${plan.homes.map(home => resolve(home, skillName)).join(', ')} -> ${snapshot}`)
  }
  catch (error) {
    for (const change of changes.reverse()) {
      if (change.installed && await exists(change.destination)) {
        if (!(await lstat(change.destination)).isSymbolicLink()) throw new Error(`Unexpected concurrent change at ${change.destination}; recovery copy: ${change.backup ?? 'none'}`)
        await rm(change.destination)
      }
      if (change.backup) await rename(change.backup, change.destination)
    }
    throw error
  }
  finally { for (const guard of guards.reverse()) await rmdir(guard) }
}

async function cacheSnapshot(home, source, metadata) {
  const snapshot = snapshotPath(home, metadata)
  await assertSnapshotParents(home, snapshot)
  if (await exists(snapshot)) await verifySnapshot(home, metadata)
  else {
    const parent = dirname(snapshot)
    await mkdir(parent, { recursive: true })
    const temporary = `${snapshot}.tmp-${process.pid}-${Date.now()}`
    try {
      await cp(source, temporary, { recursive: true, errorOnExist: true, force: false })
      await verifyPackage(temporary)
      await rename(temporary, snapshot)
    }
    finally { await rm(temporary, { recursive: true, force: true }) }
  }
  return snapshot
}

function snapshotPath(home, metadata) {
  return resolve(home, '.doxanh-project-standards', `${metadata.version}-${metadata.project_template_sha256}-${metadata.skill_contract_sha256}`, metadata.skill_name ?? legacySkillName)
}

async function assertSnapshotParents(home, snapshot) {
  let cursor = snapshot
  while (cursor !== home) {
    if (await exists(cursor)) {
      const details = await lstat(cursor)
      if (details.isSymbolicLink() || !details.isDirectory()) throw new Error(`snapshot path must use real directories: ${cursor}`)
    }
    cursor = dirname(cursor)
  }
}

async function verifySnapshot(home, expected) {
  const snapshot = snapshotPath(home, expected)
  await assertSnapshotParents(home, snapshot)
  const actual = await verifyPackage(snapshot)
  if ((actual.skill_name ?? legacySkillName) !== (expected.skill_name ?? legacySkillName)) throw new Error('snapshot skill name differs from selected release')
  for (const key of ['version', 'project_template_sha256', 'skill_contract_sha256']) {
    if (actual[key] !== expected[key]) throw new Error(`snapshot ${key} differs from selected release`)
  }
  return snapshot
}

async function assertReplaceable(state, home, source) {
  if (['missing', 'current-symlink'].includes(state.kind)) return
  if (state.kind === 'recognized-directory' && hasFlag('--replace-recognized')) return
  if (state.kind === 'other-symlink' && await recognizedInstalledDirectory(state.target)) {
    const managedRelative = relative(resolve(home, '.doxanh-project-standards'), state.target)
    const managed = managedRelative !== '..' && !managedRelative.startsWith(`..${sep}`) && !managedRelative.startsWith(sep)
    if (managed || state.target === source || hasFlag('--replace-recognized')) return
  }
  throw new Error(`${skillName} is ${state.kind}; refusing to replace an unowned skill path or local divergence`)
}

async function resolveLocked(home) {
  const lockPath = resolve(option('--target'), '.doxanh-project-standards.json')
  if ((await lstat(lockPath)).isSymbolicLink()) throw new Error('project lock must not be a symlink')
  const lock = JSON.parse(await readFile(lockPath, 'utf8'))
  if (lock.schema_version !== 3 || lock.name !== 'doxanh-project-standards'
    || !/^\d+\.\d+\.\d+$/u.test(lock.version ?? '')
    || !/^[a-f0-9]{64}$/u.test(lock.guideline_package_sha256 ?? '')
    || !/^[a-f0-9]{64}$/u.test(lock.skill?.contract_sha256 ?? '')
    || ![skillName, legacySkillName].includes(lock.skill?.name)
    || lock.skill?.distribution !== 'user-scope'
    || lock.skill?.repository_path !== `.agents/skills/${lock.skill?.name}`) {
    throw new Error('version resolution requires a valid reference-only project lock')
  }
  const expected = { version: lock.version, skill_name: lock.skill.name, project_template_sha256: lock.guideline_package_sha256, skill_contract_sha256: lock.skill.contract_sha256 }
  return verifySnapshot(home, expected)
}

async function preflight() {
  const { metadata, source } = await canonicalSource()
  await preflightInstallation(metadata, source, await installation())
  console.log('User skill preflight passed; no files changed.')
}

try {
  if (!['check', 'sync', 'cache', 'preflight', 'resolve'].includes(command)) {
    fail('use check, sync, cache --source <released-skill>, preflight, or resolve --target <project-root>')
  }
  selectedAgents()
  if (hasFlag('--update-project') && command !== 'sync') throw new Error('--update-project is only supported by sync')
  if (option('--source') && command !== 'cache') throw new Error('--source is only supported by cache; sync must use its own release')
  if (command === 'check') await check()
  else if (command === 'preflight') await preflight()
  else if (command === 'resolve') {
    if (!option('--target')) throw new Error('--target is required')
    console.log(await resolveLocked(await skillsHome(false)))
  }
  else if (command === 'cache') {
    const { source, metadata } = await canonicalSource()
    console.log(await cacheSnapshot(await skillsHome(true), source, metadata))
  }
  else await sync()
}
catch (error) {
  fail(error.message)
}
