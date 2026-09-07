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
  rmdir,
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
const repoSkillPath = '.agents/skills/doxanh'
const legacyRepoSkillPath = '.agents/skills/project-guideline-workflow'
const retiredConsumerPaths = [
  'docs/guidelines/reference-template.md',
  'docs/new-project-guideline.md',
  'scripts/docs/check-installed-standards.mjs',
]
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
    || metadata.skill_name !== 'doxanh'
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

  return { metadata, projectPaths }
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

function validateLockEntries(lock, field, errors) {
  if (!Array.isArray(lock[field])) {
    errors.push(`lock ${field} must be an array`)
    return
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

function validateLock(lock) {
  const errors = []
  if (![1, 2, 3].includes(lock.schema_version)) {
    errors.push('lock schema_version must be 1, 2, or 3')
  }
  if (lock.name !== 'doxanh-project-standards') errors.push('lock name is invalid')
  if (!/^\d+\.\d+\.\d+$/u.test(lock.version ?? '')) errors.push('lock version is invalid')
  if (typeof lock.repository_root !== 'string') errors.push('lock repository_root is invalid')
  if ([1, 2].includes(lock.schema_version)) {
    if (!/^[a-f0-9]{64}$/u.test(lock.project_template_sha256 ?? '')) {
      errors.push('lock project_template_sha256 is invalid')
    }
    validateLockEntries(lock, 'project_files', errors)
  }
  if (lock.schema_version === 1) {
    validateLockEntries(lock, 'repository_skill_files', errors)
    if (!/^[a-f0-9]{64}$/u.test(lock.skill_contract_sha256 ?? '')) {
      errors.push('schema 1 lock skill_contract_sha256 is invalid')
    }
  }
  if ([2, 3].includes(lock.schema_version)) {
    if (lock.repository_skill_files !== undefined) {
      errors.push('schema 2 or 3 lock must not contain repository_skill_files')
    }
    if (
      !['doxanh', 'project-guideline-workflow'].includes(lock.skill?.name)
      || lock.skill?.distribution !== 'user-scope'
      || lock.skill?.repository_path !== `.agents/skills/${lock.skill?.name}`
      || !/^[a-f0-9]{64}$/u.test(lock.skill?.contract_sha256 ?? '')
    ) {
      errors.push('lock skill distribution metadata is invalid')
    }
  }
  if (lock.schema_version === 3) {
    if (lock.consumer_mode !== 'reference-only') {
      errors.push('schema 3 lock consumer_mode must be reference-only')
    }
    if (!/^[a-f0-9]{64}$/u.test(lock.guideline_package_sha256 ?? '')) {
      errors.push('schema 3 lock guideline_package_sha256 is invalid')
    }
    if (lock.project_files !== undefined || lock.project_template_sha256 !== undefined) {
      errors.push('schema 3 lock must not contain copied project files')
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

async function writeLock(projectRoot, repositoryRoot, packageData) {
  const repositoryRootRelative = normalizePath(relative(projectRoot, repositoryRoot) || '.')
  const lock = {
    schema_version: 3,
    name: packageData.metadata.name,
    version: packageData.metadata.version,
    repository: packageData.metadata.repository,
    installed_at: new Date().toISOString(),
    repository_root: repositoryRootRelative,
    consumer_mode: 'reference-only',
    guideline_package_sha256: packageData.metadata.project_template_sha256,
    skill: {
      name: 'doxanh',
      distribution: 'user-scope',
      repository_path: repoSkillPath,
      contract_sha256: packageData.metadata.skill_contract_sha256,
    },
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
  const errors = await referenceOnlyErrors(
    roots.projectRoot,
    [...packageData.projectPaths, ...retiredConsumerPaths],
  )
  if (errors.length > 0) throw new Error(errors.join('; '))

  await writeLock(roots.projectRoot, roots.repositoryRoot, packageData)
  console.log(
    `Installed ${packageData.metadata.name} ${packageData.metadata.version}: `
    + 'reference-only consumer lock; reusable guidelines and the Codex skill '
    + 'remain outside the application repository.',
  )
}

async function checkInstalled(packageData) {
  const targetInput = option('--target') ?? process.cwd()
  const projectRoot = await canonicalDirectory(targetInput, 'project root')
  const lock = await readLock(projectRoot)
  const roots = await resolveRoots(lock)
  const legacyProjectEntries = lock.schema_version <= 2 ? lock.project_files : []
  const legacySkillEntries = lock.schema_version === 1
    ? lock.repository_skill_files
    : []
  const errors = [
    ...await verifyEntries(roots.projectRoot, legacyProjectEntries, 'legacy project standard'),
    ...await verifyEntries(roots.repositoryRoot, legacySkillEntries, 'legacy repository skill'),
  ]
  if (lock.schema_version === 3) {
    errors.push(...await referenceOnlyErrors(
      roots.projectRoot,
      [...packageData.projectPaths, ...retiredConsumerPaths],
    ))
  }
  if (lock.version !== packageData.metadata.version) {
    errors.push(
      `installed version ${lock.version} differs from available version ${packageData.metadata.version}; run update`,
    )
  }
  if (
    lock.version === packageData.metadata.version
    && (lock.schema_version === 3
      ? lock.guideline_package_sha256
      : lock.project_template_sha256) !== packageData.metadata.project_template_sha256
  ) {
    errors.push('installed project fingerprint differs from the available release')
  }
  const installedSkillFingerprint = lock.schema_version === 1
    ? lock.skill_contract_sha256
    : lock.skill.contract_sha256
  if (
    lock.version === packageData.metadata.version
    && installedSkillFingerprint !== packageData.metadata.skill_contract_sha256
  ) {
    errors.push('installed skill contract differs from the available release')
  }
  if (errors.length > 0) throw new Error(errors.join('; '))
  console.log(`Verified ${lock.name} ${lock.version}: reference-only consumer lock and user-scoped skill contract.`)
}

async function pruneManagedDirectories(root, entries, boundaryPath = '.') {
  const boundary = resolve(root, boundaryPath)
  const directories = new Set()
  for (const entry of entries) {
    let cursor = dirname(resolve(root, entry.path))
    while (isWithin(boundary, cursor)) {
      directories.add(cursor)
      if (cursor === boundary) break
      cursor = dirname(cursor)
    }
  }
  const deepestFirst = [...directories].sort((left, right) => right.length - left.length)
  for (const directory of deepestFirst) {
    try {
      await rmdir(directory)
    }
    catch (error) {
      if (!['ENOENT', 'ENOTEMPTY'].includes(error?.code)) throw error
    }
  }
}

async function referenceOnlyErrors(projectRoot, paths) {
  const errors = []
  for (const path of paths) {
    try {
      if (await currentDigest(projectRoot, path) !== null) {
        errors.push(`reference-only consumer must not contain reusable standard file: ${path}`)
      }
    }
    catch (error) {
      errors.push(error.message)
    }
  }
  return errors
}

async function update(packageData) {
  const targetInput = option('--target') ?? process.cwd()
  const projectRoot = await canonicalDirectory(targetInput, 'project root')
  const lock = await readLock(projectRoot)
  const roots = await resolveRoots(lock)
  const legacyProjectEntries = lock.schema_version <= 2 ? lock.project_files : []
  const legacySkillEntries = lock.schema_version === 1
    ? lock.repository_skill_files
    : []
  const errors = [
    ...await verifyEntries(roots.projectRoot, legacyProjectEntries, 'installed project standard'),
    ...await verifyEntries(
      roots.repositoryRoot,
      legacySkillEntries,
      'installed legacy repository skill',
    ),
  ]

  if (lock.schema_version === 3) {
    errors.push(...await referenceOnlyErrors(
      roots.projectRoot,
      [...packageData.projectPaths, ...retiredConsumerPaths],
    ))
  }
  if (errors.length > 0) throw new Error(errors.join('; '))

  const alreadyCurrent = lock.schema_version === 3
    && lock.version === packageData.metadata.version
    && lock.guideline_package_sha256 === packageData.metadata.project_template_sha256
    && lock.skill.contract_sha256 === packageData.metadata.skill_contract_sha256
  if (command === 'preflight') {
    console.log('Project update preflight passed; no files changed.')
    return
  }
  if (alreadyCurrent) {
    console.log(`${packageData.metadata.name} ${lock.version} is already current.`)
    return
  }

  const originals = []
  for (const [root, entries] of [
    [roots.projectRoot, [...legacyProjectEntries, { path: lockFilename }]],
    [roots.repositoryRoot, legacySkillEntries],
  ]) {
    for (const entry of entries) {
      const path = await assertSafeTarget(root, entry.path)
      originals.push({ root, path: entry.path, content: await readFile(path), mode: (await stat(path)).mode })
    }
  }
  try {
    for (const entry of legacyProjectEntries) await rm(await assertSafeTarget(roots.projectRoot, entry.path))
    for (const entry of legacySkillEntries) await rm(await assertSafeTarget(roots.repositoryRoot, entry.path))
    await pruneManagedDirectories(roots.projectRoot, legacyProjectEntries)
    await pruneManagedDirectories(roots.repositoryRoot, legacySkillEntries, legacyRepoSkillPath)
    await writeLock(roots.projectRoot, roots.repositoryRoot, packageData)
    await checkInstalled(packageData)
  }
  catch (error) {
    for (const original of originals) await writeAtomic(original.root, original)
    throw new Error(`update failed; previous lock and managed files restored: ${error.message}`)
  }
  console.log(
    `Updated ${packageData.metadata.name} from ${lock.version} to ${packageData.metadata.version}.`,
  )
}

async function main() {
  if (!['install', 'check', 'update', 'preflight'].includes(command)) {
    fail('use install, check, update, or preflight')
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
