#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  lstat,
  cp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillName = 'project-guideline-workflow'
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
    !skill.startsWith(`---\nname: ${skillName}\n`)
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

async function skillsHome(create) {
  const defaultHome = process.env.CODEX_HOME
    ? resolve(process.env.CODEX_HOME, 'skills')
    : resolve(homedir(), '.codex', 'skills')
  const input = resolve(option('--skills-home') ?? defaultHome)
  if (create) await mkdir(input, { recursive: true })
  const details = await lstat(input)
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new Error(`skills home must be a real directory: ${input}`)
  }
  return realpath(input)
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

async function replaceWithSymlink(destination, source) {
  const suffix = `${process.pid}-${Date.now()}-${sha256(source).slice(0, 8)}`
  const temporary = resolve(dirname(destination), `.${basename(destination)}.${suffix}.tmp`)
  const backup = resolve(dirname(destination), `.${basename(destination)}.${suffix}.bak`)
  await symlink(source, temporary, 'dir')
  let movedExisting = false
  try {
    if (await exists(destination)) {
      await rename(destination, backup)
      movedExisting = true
    }
    await rename(temporary, destination)
    if (movedExisting) console.log(`Previous installation retained at ${backup}`)
  }
  catch (error) {
    await rm(temporary, { force: true })
    if (movedExisting && !await exists(destination)) await rename(backup, destination)
    throw error
  }
}

async function check() {
  const { metadata } = await canonicalSource()
  const home = await skillsHome(false)
  if (option('--target')) {
    const source = await resolveLocked(home)
    console.log(`Verified locked user skill: ${source}`)
    return
  }
  const source = snapshotPath(home, metadata)
  await verifySnapshot(home, metadata)
  const destination = resolve(home, skillName)
  const state = await destinationState(destination, source)
  if (state.kind !== 'current-symlink') {
    throw new Error(
      `${destination} is ${state.kind}; run skill-sync from the selected standards release`,
    )
  }
  console.log(
    `Verified user skill ${skillName} ${metadata.version}: ${destination} -> ${source}`,
  )
}

async function sync() {
  const { metadata, source } = await canonicalSource()
  const home = await skillsHome(true)
  const destination = resolve(home, skillName)
  const snapshot = snapshotPath(home, metadata)
  await assertSnapshotParents(home, snapshot)
  const state = await destinationState(destination, snapshot)
  await assertReplaceable(state, home, source)
  await cacheSnapshot(home, source, metadata)
  if (state.kind === 'current-symlink') {
    console.log(`User skill ${skillName} ${metadata.version} is already synchronized.`)
    return
  }
  await replaceWithSymlink(destination, snapshot)
  console.log(
    `Synchronized user skill ${skillName} ${metadata.version}: ${destination} -> ${snapshot}`,
  )
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
  return resolve(home, '.doxanh-project-standards', `${metadata.version}-${metadata.project_template_sha256}-${metadata.skill_contract_sha256}`, skillName)
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
    || !/^[a-f0-9]{64}$/u.test(lock.skill?.contract_sha256 ?? '')) {
    throw new Error('version resolution requires a valid reference-only project lock')
  }
  const expected = { version: lock.version, project_template_sha256: lock.guideline_package_sha256, skill_contract_sha256: lock.skill.contract_sha256 }
  return verifySnapshot(home, expected)
}

async function preflight() {
  const { metadata, source } = await canonicalSource()
  const homeInput = option('--skills-home') ?? (process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME, 'skills') : resolve(homedir(), '.codex/skills'))
  if (await exists(homeInput)) {
    const home = await skillsHome(false)
    const snapshot = snapshotPath(home, metadata)
    await assertSnapshotParents(home, snapshot)
    if (await exists(snapshot)) await verifySnapshot(home, metadata)
    await assertReplaceable(await destinationState(resolve(home, skillName), snapshot), home, source)
  }
  console.log('User skill preflight passed; no files changed.')
}

try {
  if (!['check', 'sync', 'cache', 'preflight', 'resolve'].includes(command)) {
    fail('use check, sync, cache --source <released-skill>, preflight, or resolve --target <project-root>')
  }
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
