#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, resolve } from 'node:path'
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
  const source = await realpath(sourceSkillRoot)
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
  return { metadata, source }
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
    const skill = await readFile(resolve(destination, 'SKILL.md'), 'utf8')
    const metadata = JSON.parse(
      await readFile(resolve(destination, 'assets/project-standards.json'), 'utf8'),
    )
    return skill.startsWith(`---\nname: ${skillName}\n`)
      && metadata.name === 'doxanh-project-standards'
      && /^[a-f0-9]{64}$/u.test(metadata.skill_contract_sha256 ?? '')
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
    if (movedExisting) await rm(backup, { recursive: true, force: true })
  }
  catch (error) {
    await rm(temporary, { force: true })
    if (movedExisting && !await exists(destination)) await rename(backup, destination)
    throw error
  }
}

async function check() {
  const { metadata, source } = await canonicalSource()
  const home = await skillsHome(false)
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
  const state = await destinationState(destination, source)
  if (state.kind === 'current-symlink') {
    console.log(`User skill ${skillName} ${metadata.version} is already synchronized.`)
    return
  }
  if (
    state.kind !== 'missing'
    && !(state.kind === 'recognized-directory' && hasFlag('--replace-recognized'))
  ) {
    throw new Error(
      `${destination} is ${state.kind}; refusing to replace an unowned skill path`,
    )
  }
  await replaceWithSymlink(destination, source)
  console.log(
    `Synchronized user skill ${skillName} ${metadata.version}: ${destination} -> ${source}`,
  )
}

try {
  if (!['check', 'sync'].includes(command)) {
    fail('use check or sync')
  }
  if (command === 'check') await check()
  else await sync()
}
catch (error) {
  fail(error.message)
}
