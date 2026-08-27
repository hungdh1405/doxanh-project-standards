import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cli = resolve(root, '.agents/skills/project-guideline-workflow/scripts/project-standards.mjs')

function run(command, projectRoot, repositoryRoot, ...extra) {
  return spawnSync(
    process.execPath,
    [cli, command, '--target', projectRoot, '--repo-root', repositoryRoot, ...extra],
    { cwd: root, encoding: 'utf8' },
  )
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
    assert.match(installed.stdout, /Installed doxanh-project-standards 1\.0\.0/u)

    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.version, '1.0.0')
    assert.ok(lock.project_files.length > 30)
    assert.ok(lock.repository_skill_files.length > lock.project_files.length)
    assert.equal(lock.repository_root, '.')

    const checked = run('check', roots.projectRoot, roots.repositoryRoot)
    assert.equal(checked.status, 0, checked.stderr)
    assert.match(checked.stdout, /Verified doxanh-project-standards 1\.0\.0/u)
  }
  finally {
    await rm(roots.repositoryRoot, { recursive: true, force: true })
  }
})

test('installs the project and repository skill at their correct nested roots', async () => {
  const roots = await fixture(true)
  try {
    const installed = run('install', roots.projectRoot, roots.repositoryRoot)
    assert.equal(installed.status, 0, installed.stderr)
    const lock = JSON.parse(
      await readFile(resolve(roots.projectRoot, '.doxanh-project-standards.json'), 'utf8'),
    )
    assert.equal(lock.repository_root, '../..')
    assert.match(
      await readFile(resolve(roots.repositoryRoot, '.agents/skills/project-guideline-workflow/SKILL.md'), 'utf8'),
      /name: project-guideline-workflow/u,
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
