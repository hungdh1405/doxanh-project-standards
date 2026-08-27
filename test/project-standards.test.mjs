import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  cp,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = resolve(root, '.agents/skills/project-guideline-workflow')
const cli = resolve(skillRoot, 'scripts/project-standards.mjs')
const userSkillCli = resolve(skillRoot, 'scripts/manage-user-skill.mjs')
const metadata = JSON.parse(
  await readFile(resolve(skillRoot, 'assets/project-standards.json'), 'utf8'),
)

function run(command, projectRoot, repositoryRoot, ...extra) {
  return spawnSync(
    process.execPath,
    [cli, command, '--target', projectRoot, '--repo-root', repositoryRoot, ...extra],
    { cwd: root, encoding: 'utf8' },
  )
}

function runSkill(command, skillsHome, ...extra) {
  return spawnSync(
    process.execPath,
    [userSkillCli, command, '--skills-home', skillsHome, ...extra],
    { cwd: root, encoding: 'utf8' },
  )
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function collectFiles(directory, base = directory) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const absolute = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolute, base))
    else if (entry.isFile()) files.push(absolute.slice(base.length + 1).split('\\').join('/'))
  }
  return files
}

async function fixture(nested = false) {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'doxanh-standards-test-'))
  const projectRoot = nested ? resolve(repositoryRoot, 'apps/web') : repositoryRoot
  await mkdir(projectRoot, { recursive: true })
  return { repositoryRoot, projectRoot }
}

test('installs and verifies a clean standalone project', async () => {
  const roots = await fixture()
  try {
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    assert.match(installed.stdout, new RegExp(`Installed doxanh-project-standards ${metadata.version.replaceAll('.', '\\.')}\\b`, 'u'))

    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.schema_version, 2)
    assert.equal(lock.version, metadata.version)
    assert.ok(lock.project_files.length > 30)
    assert.equal(lock.repository_skill_files, undefined)
    assert.deepEqual(lock.skill, {
      name: 'project-guideline-workflow',
      distribution: 'user-scope',
      repository_path: '.agents/skills/project-guideline-workflow',
      contract_sha256: metadata.skill_contract_sha256,
    })
    assert.equal(lock.repository_root, '.')
    await assert.rejects(
      readFile(resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow/SKILL.md')),
    )

    const checked = run('check', roots.projectRoot, roots.repositoryRoot)
    assert.equal(checked.status, 0, checked.stderr)
    assert.match(checked.stdout, new RegExp(`Verified doxanh-project-standards ${metadata.version.replaceAll('.', '\\.')}`, 'u'))

    const offlineChecked = spawnSync(
      process.execPath,
      [
        resolve(roots.projectRoot, 'scripts/docs/check-installed-standards.mjs'),
        '--target',
        roots.projectRoot,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(offlineChecked.status, 0, offlineChecked.stderr)
    assert.match(offlineChecked.stdout, /user-scoped skill contract/u)

    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const lockBeforeUpdate = await readFile(lockPath, 'utf8')
    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.equal(updated.status, 0, updated.stderr)
    assert.match(updated.stdout, /is already current/u)
    assert.equal(await readFile(lockPath, 'utf8'), lockBeforeUpdate)
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('installs only project artifacts at the correct nested root', async () => {
  const roots = await fixture(true)
  try {
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.repository_root, '../..')
    await assert.rejects(
      readFile(resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow/SKILL.md')),
    )
    assert.match(
      await readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md'), 'utf8'),
      /# New Project Guideline/u,
    )
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('migrates a verified version-1 repository skill to the user-scope contract', async () => {
  const roots = await fixture(true)
  try {
    assert.equal(run('install', roots.projectRoot, roots.repositoryRoot).status, 0)
    const destination = resolve(
      roots.repositoryRoot,
      '.agents/skills/project-guideline-workflow',
    )
    await cp(skillRoot, destination, { recursive: true })
    const repositorySkillFiles = []
    for (const path of await collectFiles(destination)) {
      repositorySkillFiles.push({
        path: `.agents/skills/project-guideline-workflow/${path}`,
        sha256: sha256(await readFile(resolve(destination, path))),
      })
    }
    const lockPath = resolve(roots.projectRoot, '.doxanh-project-standards.json')
    const lock = JSON.parse(await readFile(lockPath, 'utf8'))
    lock.schema_version = 1
    lock.version = '1.0.0'
    lock.skill_contract_sha256 = lock.skill.contract_sha256
    lock.repository_skill_files = repositorySkillFiles
    delete lock.skill
    await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`)

    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.equal(updated.status, 0, updated.stderr)
    const migrated = JSON.parse(await readFile(lockPath, 'utf8'))
    assert.equal(migrated.schema_version, 2)
    assert.equal(migrated.version, metadata.version)
    assert.equal(migrated.repository_skill_files, undefined)
    await assert.rejects(readFile(resolve(destination, 'SKILL.md')))
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('adopts identical files and installs the remaining package', async () => {
  const roots = await fixture()
  try {
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    const expected = await readFile(
      resolve(root, '.agents/skills/project-guideline-workflow/assets/project-template/docs/new-project-guideline.md'),
    )
    await writeFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), expected)
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    assert.ok(await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json')))
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses a conflicting install before writing managed content', async () => {
  const roots = await fixture()
  try {
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    await writeFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), 'local contract\n')
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(installed.status, 0)
    assert.match(installed.stderr, /conflicts with existing file/u)
    await assert.rejects(readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json')))
    await assert.rejects(readFile(resolve(roots.projectRoot, 'docs/guidelines/README.md')))
    assert.equal(
      await readFile(resolve(roots.projectRoot, 'docs/new-project-guideline.md'), 'utf8'),
      'local contract\n',
    )
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('refuses check and update after local managed-file drift', async () => {
  const roots = await fixture()
  try {
    assert.equal(run('install', roots.projectRoot, roots.repositoryRoot).status, 0)
    const target = resolve(roots.projectRoot, 'docs/guidelines/README.md')
    await writeFile(target, 'locally changed\n')

    const checked = run('check', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(checked.status, 0)
    assert.match(checked.stderr, /project standard file diverged/u)

    const updated = run('update', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(updated.status, 0)
    assert.match(updated.stderr, /installed project standard file diverged/u)
    assert.equal(await readFile(target, 'utf8'), 'locally changed\n')
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('rejects a symlink at a managed target', async () => {
  const roots = await fixture()
  try {
    const external = resolve(roots.repositoryRoot, 'external.md')
    await writeFile(external, 'external\n')
    await mkdir(resolve(roots.projectRoot, 'docs'), { recursive: true })
    await symlink(external, resolve(roots.projectRoot, 'docs/new-project-guideline.md'))

    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.notEqual(installed.status, 0)
    assert.match(installed.stderr, /managed path uses symlink/u)
    assert.equal(await readFile(external, 'utf8'), 'external\n')
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('synchronizes and verifies one user-level skill symlink', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  try {
    const synced = runSkill('sync', skillsHome)
    assert.equal(synced.status, 0, synced.stderr)
    const destination = resolve(skillsHome, 'project-guideline-workflow')
    assert.equal((await lstat(destination)).isSymbolicLink(), true)
    assert.equal(await realpath(destination), await realpath(skillRoot))

    const checked = runSkill('check', skillsHome)
    assert.equal(checked.status, 0, checked.stderr)
    assert.match(checked.stdout, /Verified user skill project-guideline-workflow/u)
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})

test('requires explicit migration for a recognized copied user skill', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  const destination = resolve(skillsHome, 'project-guideline-workflow')
  try {
    await mkdir(skillsHome, { recursive: true })
    await cp(skillRoot, destination, { recursive: true })
    const refused = runSkill('sync', skillsHome)
    assert.notEqual(refused.status, 0)
    assert.match(refused.stderr, /recognized-directory/u)

    const migrated = runSkill('sync', skillsHome, '--replace-recognized')
    assert.equal(migrated.status, 0, migrated.stderr)
    assert.equal((await lstat(destination)).isSymbolicLink(), true)
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})

test('refuses to replace an unknown user skill directory', async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-user-skill-test-'))
  const skillsHome = resolve(sandbox, 'skills')
  const destination = resolve(skillsHome, 'project-guideline-workflow')
  try {
    await mkdir(destination, { recursive: true })
    await writeFile(resolve(destination, 'SKILL.md'), 'not owned by Doxanh\n')
    const synced = runSkill('sync', skillsHome, '--replace-recognized')
    assert.notEqual(synced.status, 0)
    assert.match(synced.stderr, /refusing to replace an unowned skill path/u)
    assert.equal(await readFile(resolve(destination, 'SKILL.md'), 'utf8'), 'not owned by Doxanh\n')
  }
  finally {
    await rm(sandbox, { recursive: true, force: true })
  }
})
