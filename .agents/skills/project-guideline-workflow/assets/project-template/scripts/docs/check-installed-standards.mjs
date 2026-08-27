#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'

const lockFilename = '.doxanh-project-standards.json'

function fail(messages) {
  console.error('Installed project standards check failed:')
  for (const message of Array.isArray(messages) ? messages : [messages]) {
    console.error(`- ${message}`)
  }
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

async function projectRoot() {
  const input = resolve(option('--target') ?? process.cwd())
  const details = await lstat(input)
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new Error(`project root must be a real directory: ${input}`)
  }
  return realpath(input)
}

function validateEntry(entry, paths) {
  if (
    typeof entry?.path !== 'string'
    || entry.path.startsWith('/')
    || entry.path.split('/').includes('..')
    || !/^[a-f0-9]{64}$/u.test(entry?.sha256 ?? '')
  ) {
    throw new Error('installation lock contains an invalid project file entry')
  }
  if (paths.has(entry.path)) {
    throw new Error(`installation lock repeats ${entry.path}`)
  }
  paths.add(entry.path)
}

async function readLock(root) {
  const path = resolve(root, lockFilename)
  const details = await lstat(path)
  if (details.isSymbolicLink() || !details.isFile()) {
    throw new Error(`${lockFilename} must be a regular file`)
  }
  const lock = JSON.parse(await readFile(path, 'utf8'))
  if (
    lock.schema_version !== 2
    || lock.name !== 'doxanh-project-standards'
    || !/^\d+\.\d+\.\d+$/u.test(lock.version ?? '')
    || !/^[a-f0-9]{64}$/u.test(lock.project_template_sha256 ?? '')
    || lock.skill?.name !== 'project-guideline-workflow'
    || lock.skill?.distribution !== 'user-scope'
    || !/^[a-f0-9]{64}$/u.test(lock.skill?.contract_sha256 ?? '')
    || !Array.isArray(lock.project_files)
  ) {
    throw new Error('installation lock has an invalid schema or package identity')
  }
  const paths = new Set()
  lock.project_files.forEach(entry => validateEntry(entry, paths))
  return lock
}

async function digestManagedFile(root, entry) {
  const path = resolve(root, entry.path)
  if (!isWithin(root, path)) throw new Error(`managed path escapes the project: ${entry.path}`)

  let cursor = path
  while (cursor !== root) {
    const details = await lstat(cursor)
    if (details.isSymbolicLink()) {
      throw new Error(`managed path uses a symlink: ${entry.path}`)
    }
    cursor = dirname(cursor)
  }
  const details = await lstat(path)
  if (!details.isFile()) throw new Error(`managed path is not a regular file: ${entry.path}`)
  return sha256(await readFile(path))
}

try {
  const root = await projectRoot()
  const lock = await readLock(root)
  const errors = []
  let fingerprintSource = ''
  for (const entry of lock.project_files) {
    try {
      const digest = await digestManagedFile(root, entry)
      if (digest !== entry.sha256) errors.push(`managed file diverged: ${entry.path}`)
      fingerprintSource += `${entry.path}\0${digest}\n`
    }
    catch (error) {
      errors.push(error.message)
    }
  }
  const fingerprint = sha256(fingerprintSource)
  if (fingerprint !== lock.project_template_sha256) {
    errors.push('managed project fingerprint differs from the installation lock')
  }
  if (errors.length > 0) fail(errors)
  console.log(
    `Verified ${lock.name} ${lock.version}: ${lock.project_files.length} `
    + 'project files and a user-scoped skill contract.',
  )
}
catch (error) {
  fail(error.message)
}
