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
  stat,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const skillRoot = resolve(scriptDirectory, '..')
const assetsRoot = resolve(skillRoot, 'assets')
const templateRoot = resolve(assetsRoot, 'project-template')
const metadataPath = resolve(assetsRoot, 'project-standards.json')
const lockFilename = '.doxanh-project-standards.json'
const repoSkillPath = '.agents/skills/project-guideline-workflow'
const command = process.argv[2]

function fail(message) {
  console.error(`Project standards ${command ?? 'command'} failed:`)
  const messages = Array.isArray(message) ? message : [message]
  messages.forEach(item => console.error(`- ${item}`))
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

function normalizePath(value) {
  return value.split(sep).join('/')
}

function isWithin(parent, child) {
  const result = relative(parent, child)
  return result === '' || (!result.startsWith(`..${sep}`) && result !== '..')
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

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  }
  catch (error) {
    throw new Error(`${label} is not readable JSON: ${error.message}`)
  }
}

async function collectFiles(root) {
  const files = []
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const absolute = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) {
        throw new Error(`source package contains symlink ${normalizePath(relative(root, absolute))}`)
      }
      if (entry.isDirectory()) await walk(absolute)
      else if (entry.isFile()) files.push(normalizePath(relative(root, absolute)))
      else throw new Error(`source package contains unsupported entry ${absolute}`)
    }
  }
  await walk(root)
  return files
}

async function fingerprint(root, paths) {
  const rows = []
  for (const path of paths) {
    rows.push(`${path}\0${sha256(await readFile(resolve(root, path)))}\n`)
  }
  return sha256(rows.join(''))
}

async function sourcePackage() {
  const metadata = await readJson(metadataPath, 'package metadata')
  if (
    metadata.schema_version !== 1
    || metadata.name !== 'doxanh-project-standards'
    || !/^\d+\.\d+\.\d+$/u.test(metadata.version ?? '')
    || !/^https:\/\//u.test(metadata.repository ?? '')
  ) {
    throw new Error('package metadata has an invalid schema, name, version, or repository')
  }

  const projectPaths = await collectFiles(templateRoot)
  const contractRoots = ['SKILL.md', 'agents', 'scripts']
  const skillContractPaths = []
  for (const rootPath of contractRoots) {
    const absolute = resolve(skillRoot, rootPath)
    const details = await stat(absolute)
    if (details.isFile()) skillContractPaths.push(rootPath)
    else {
      const nested = await collectFiles(absolute)
      nested.forEach(path => skillContractPaths.push(normalizePath(`${rootPath}/${path}`)))
    }
  }
  skillContractPaths.sort()

  const actualProjectFingerprint = await fingerprint(templateRoot, projectPaths)
  const actualSkillFingerprint = await fingerprint(skillRoot, skillContractPaths)
  const sourceErrors = []
  if (metadata.project_template_sha256 !== actualProjectFingerprint) {
    sourceErrors.push(
      `project template fingerprint ${actualProjectFingerprint} does not match package metadata`,
    )
  }
  if (metadata.skill_contract_sha256 !== actualSkillFingerprint) {
    sourceErrors.push(
      `skill contract fingerprint ${actualSkillFingerprint} does not match package metadata`,
    )
  }
  if (sourceErrors.length > 0) throw new Error(sourceErrors.join('; '))

  const skillPaths = await collectFiles(skillRoot)
  return { metadata, projectPaths, skillPaths }
}

async function canonicalDirectory(input, label, create = false) {
  const absolute = resolve(input)
  if (create) await mkdir(absolute, { recursive: true })
  const details = await lstat(absolute)
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new Error(`${label} must be a real directory: ${absolute}`)
  }
  return realpath(absolute)
}

async function assertSafeTarget(root, path) {
  const absolute = resolve(root, path)
  if (!isWithin(root, absolute)) throw new Error(`managed path escapes its root: ${path}`)

  let cursor = absolute
  while (cursor !== root) {
    if (await exists(cursor)) {
      const details = await lstat(cursor)
      if (details.isSymbolicLink()) throw new Error(`managed path uses symlink: ${absolute}`)
    }
    cursor = dirname(cursor)
  }
  return absolute
}

async function sourceEntries(sourceRoot, paths, destinationPrefix = '') {
  const entries = []
  for (const path of paths) {
    const source = resolve(sourceRoot, path)
    const content = await readFile(source)
    const mode = (await stat(source)).mode & 0o777
    const destination = normalizePath(destinationPrefix ? `${destinationPrefix}/${path}` : path)
    entries.push({ path: destination, content, sha256: sha256(content), mode })
  }
  return entries
}

async function currentDigest(root, path) {
  const target = await assertSafeTarget(root, path)
  if (!await exists(target)) return null
  const details = await lstat(target)
  if (!details.isFile()) throw new Error(`managed target is not a regular file: ${target}`)
  return sha256(await readFile(target))
}

async function verifyEntries(root, entries, label) {
  const errors = []
  for (const entry of entries) {
    try {
      const actual = await currentDigest(root, entry.path)
      if (actual === null) errors.push(`${label} file is missing: ${entry.path}`)
      else if (actual !== entry.sha256) errors.push(`${label} file diverged: ${entry.path}`)
    }
    catch (error) {
      errors.push(error.message)
    }
  }
  return errors
}

async function preflightInstall(root, entries, label) {
  const errors = []
  for (const entry of entries) {
    try {
      const actual = await currentDigest(root, entry.path)
      if (actual !== null && actual !== entry.sha256) {
        errors.push(`${label} conflicts with existing file: ${entry.path}`)
      }
    }
    catch (error) {
      errors.push(error.message)
    }
  }
  return errors
}

async function writeAtomic(root, entry) {
  const target = await assertSafeTarget(root, entry.path)
  await mkdir(dirname(target), { recursive: true })
  await assertSafeTarget(root, entry.path)
  const temporary = resolve(
    dirname(target),
    `.${basename(target)}.doxanh-${process.pid}-${Date.now()}.tmp`,
  )
  try {
    await writeFile(temporary, entry.content, { mode: entry.mode })
    await rename(temporary, target)
  }
  finally {
    await rm(temporary, { force: true })
  }
}

async function writeEntries(root, entries) {
  for (const entry of entries) await writeAtomic(root, entry)
}

function lockEntries(entries) {
  return entries.map(({ path, sha256: digest }) => ({ path, sha256: digest }))
}

function validateLock(lock) {
  const errors = []
  if (lock.schema_version !== 1) errors.push('lock schema_version must be 1')
  if (lock.name !== 'doxanh-project-standards') errors.push('lock name is invalid')
  if (!/^\d+\.\d+\.\d+$/u.test(lock.version ?? '')) errors.push('lock version is invalid')
  if (typeof lock.repository_root !== 'string') errors.push('lock repository_root is invalid')
  for (const field of ['project_files', 'repository_skill_files']) {
    if (!Array.isArray(lock[field])) {
      errors.push(`lock ${field} must be an array`)
      continue
    }
    const paths = new Set()
    for (const entry of lock[field]) {
      if (
        typeof entry?.path !== 'string'
        || entry.path.startsWith('/')
        || entry.path.split('/').includes('..')
        || !/^[a-f0-9]{64}$/u.test(entry?.sha256 ?? '')
      ) {
        errors.push(`lock ${field} contains an invalid entry`)
        continue
      }
      if (paths.has(entry.path)) errors.push(`lock ${field} repeats ${entry.path}`)
      paths.add(entry.path)
    }
  }
  if (errors.length > 0) throw new Error(errors.join('; '))
}

async function readLock(projectRoot) {
  const lockPath = resolve(projectRoot, lockFilename)
  if (!await exists(lockPath)) {
    throw new Error(`${lockFilename} is missing; use install for a new project`)
  }
  const details = await lstat(lockPath)
  if (details.isSymbolicLink() || !details.isFile()) {
    throw new Error(`${lockFilename} must be a regular file`)
  }
  const lock = await readJson(lockPath, 'installation lock')
  validateLock(lock)
  return lock
}

async function resolveRoots(existingLock) {
  const targetInput = option('--target') ?? process.cwd()
  const projectRoot = await canonicalDirectory(targetInput, 'project root', command === 'install')
  const storedRepositoryRoot = existingLock
    ? resolve(projectRoot, existingLock.repository_root)
    : projectRoot
  const repoInput = option('--repo-root') ?? storedRepositoryRoot
  const repositoryRoot = await canonicalDirectory(repoInput, 'repository root', command === 'install')
  if (!isWithin(repositoryRoot, projectRoot)) {
    throw new Error('project root must be the repository root or a directory inside it')
  }
  return { projectRoot, repositoryRoot }
}

async function desiredEntries(packageData, includeRepoSkill) {
  const projectEntries = await sourceEntries(templateRoot, packageData.projectPaths)
  const repositorySkillEntries = includeRepoSkill
    ? await sourceEntries(skillRoot, packageData.skillPaths, repoSkillPath)
    : []
  return { projectEntries, repositorySkillEntries }
}

async function writeLock(projectRoot, repositoryRoot, packageData, entries) {
  const repositoryRootRelative = normalizePath(relative(projectRoot, repositoryRoot) || '.')
  const lock = {
    schema_version: 1,
    name: packageData.metadata.name,
    version: packageData.metadata.version,
    repository: packageData.metadata.repository,
    installed_at: new Date().toISOString(),
    repository_root: repositoryRootRelative,
    project_template_sha256: packageData.metadata.project_template_sha256,
    skill_contract_sha256: packageData.metadata.skill_contract_sha256,
    project_files: lockEntries(entries.projectEntries),
    repository_skill_files: lockEntries(entries.repositorySkillEntries),
  }
  const content = Buffer.from(`${JSON.stringify(lock, null, 2)}\n`)
  await writeAtomic(projectRoot, {
    path: lockFilename,
    content,
    sha256: sha256(content),
    mode: 0o644,
  })
}

async function install(packageData) {
  const lockAtTarget = resolve(option('--target') ?? process.cwd(), lockFilename)
  if (await exists(lockAtTarget)) {
    throw new Error(`${lockFilename} already exists; use check or update`)
  }
  const roots = await resolveRoots(null)
  const includeRepoSkill = !hasFlag('--without-repo-skill')
  const entries = await desiredEntries(packageData, includeRepoSkill)
  const errors = [
    ...await preflightInstall(roots.projectRoot, entries.projectEntries, 'project standard'),
    ...await preflightInstall(roots.repositoryRoot, entries.repositorySkillEntries, 'repository skill'),
  ]
  if (errors.length > 0) throw new Error(errors.join('; '))

  await writeEntries(roots.projectRoot, entries.projectEntries)
  await writeEntries(roots.repositoryRoot, entries.repositorySkillEntries)
  await writeLock(roots.projectRoot, roots.repositoryRoot, packageData, entries)
  console.log(
    `Installed ${packageData.metadata.name} ${packageData.metadata.version}: `
    + `${entries.projectEntries.length} project files and `
    + `${entries.repositorySkillEntries.length} repository skill files.`,
  )
}

async function checkInstalled(packageData) {
  const targetInput = option('--target') ?? process.cwd()
  const projectRoot = await canonicalDirectory(targetInput, 'project root')
  const lock = await readLock(projectRoot)
  const roots = await resolveRoots(lock)
  const errors = [
    ...await verifyEntries(roots.projectRoot, lock.project_files, 'project standard'),
    ...await verifyEntries(roots.repositoryRoot, lock.repository_skill_files, 'repository skill'),
  ]
  if (lock.version !== packageData.metadata.version) {
    errors.push(
      `installed version ${lock.version} differs from available version ${packageData.metadata.version}; run update`,
    )
  }
  if (errors.length > 0) throw new Error(errors.join('; '))
  console.log(
    `Verified ${lock.name} ${lock.version}: ${lock.project_files.length} project files and `
    + `${lock.repository_skill_files.length} repository skill files.`,
  )
}

async function update(packageData) {
  const targetInput = option('--target') ?? process.cwd()
  const projectRoot = await canonicalDirectory(targetInput, 'project root')
  const lock = await readLock(projectRoot)
  const roots = await resolveRoots(lock)
  const includeRepoSkill = lock.repository_skill_files.length > 0
  const desired = await desiredEntries(packageData, includeRepoSkill)
  const errors = [
    ...await verifyEntries(roots.projectRoot, lock.project_files, 'installed project standard'),
    ...await verifyEntries(roots.repositoryRoot, lock.repository_skill_files, 'installed repository skill'),
  ]

  const oldProjectPaths = new Set(lock.project_files.map(entry => entry.path))
  const oldSkillPaths = new Set(lock.repository_skill_files.map(entry => entry.path))
  errors.push(...await preflightInstall(
    roots.projectRoot,
    desired.projectEntries.filter(entry => !oldProjectPaths.has(entry.path)),
    'new project standard',
  ))
  errors.push(...await preflightInstall(
    roots.repositoryRoot,
    desired.repositorySkillEntries.filter(entry => !oldSkillPaths.has(entry.path)),
    'new repository skill',
  ))
  if (errors.length > 0) throw new Error(errors.join('; '))

  await writeEntries(roots.projectRoot, desired.projectEntries)
  await writeEntries(roots.repositoryRoot, desired.repositorySkillEntries)

  const newProjectPaths = new Set(desired.projectEntries.map(entry => entry.path))
  const newSkillPaths = new Set(desired.repositorySkillEntries.map(entry => entry.path))
  for (const entry of lock.project_files.filter(item => !newProjectPaths.has(item.path))) {
    await rm(await assertSafeTarget(roots.projectRoot, entry.path))
  }
  for (const entry of lock.repository_skill_files.filter(item => !newSkillPaths.has(item.path))) {
    await rm(await assertSafeTarget(roots.repositoryRoot, entry.path))
  }

  await writeLock(roots.projectRoot, roots.repositoryRoot, packageData, desired)
  console.log(
    `Updated ${packageData.metadata.name} from ${lock.version} to ${packageData.metadata.version}.`,
  )
}

async function main() {
  if (!['install', 'check', 'update'].includes(command)) {
    fail('use install, check, or update')
  }
  const packageData = await sourcePackage()
  if (command === 'install') await install(packageData)
  else if (command === 'check') await checkInstalled(packageData)
  else await update(packageData)
}

try {
  await main()
}
catch (error) {
  fail(error.message)
}
