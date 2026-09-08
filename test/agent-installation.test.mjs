import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skill = resolve(root, '.agents/skills/doxanh')
const metadata = JSON.parse(await readFile(resolve(skill, 'assets/project-standards.json'), 'utf8'))
const digest = value => createHash('sha256').update(value).digest('hex')
const run = (source, script, args, env = process.env) => spawnSync(process.execPath, [resolve(source, 'scripts', script), ...args], { cwd: root, encoding: 'utf8', env })
const good = result => { assert.equal(result.status, 0, result.stderr); return result.stdout.trim() }

async function files(directory, prefix = '') {
  const result = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix + entry.name
    if (entry.isDirectory()) result.push(...await files(resolve(directory, entry.name), `${name}/`))
    else result.push(name)
  }
  return result
}

async function fixture() {
  const sandbox = await mkdtemp(resolve(tmpdir(), 'doxanh-agents-'))
  const codex = resolve(sandbox, 'codex skills')
  const claude = resolve(sandbox, 'claude skills')
  const project = resolve(sandbox, 'project/apps/web')
  await mkdir(project, { recursive: true })
  const options = ['--skills-home', codex, '--agents', 'both', '--claude-skills-home', claude]
  const manage = (command, extra = [], source = skill) => run(source, 'manage-user-skill.mjs', [command, ...options, ...extra])
  good(run(skill, 'project-standards.mjs', ['install', '--target', project]))
  return { sandbox, codex, claude, project, options, manage }
}

async function nextRelease(sandbox) {
  const next = resolve(sandbox, 'next release')
  await cp(skill, next, { recursive: true })
  const paths = (await files(next)).filter(p => p === 'SKILL.md' || p.startsWith('scripts/') || p.startsWith('agents/')).sort()
  let rows = ''
  for (const path of paths) rows += `${path}\0${digest(await readFile(resolve(next, path)))}\n`
  await writeFile(resolve(next, 'assets/project-standards.json'), JSON.stringify({ ...metadata, version: '99.0.0', skill_contract_sha256: digest(rows) }))
  return next
}

test('both agents share one snapshot and keep older nested project locks after updates', async () => {
  const f = await fixture()
  try {
    good(run(skill, 'manage-user-skill.mjs', ['sync', '--skills-home', f.codex]))
    await mkdir(f.claude)
    await symlink(await realpath(resolve(f.codex, 'doxanh')), resolve(f.claude, 'doxanh'))
    // Normalize an existing direct snapshot link into a stable shared link.
    good(f.manage('sync'))
    const before = await realpath(resolve(f.codex, 'doxanh'))
    assert.equal(await realpath(resolve(f.claude, 'doxanh')), before)
    await assert.rejects(lstat(resolve(f.claude, '.doxanh-project-standards')), { code: 'ENOENT' })
    good(f.manage('check', ['--target', f.project]))
    const entries = await readdir(f.claude)
    good(f.manage('sync'))
    assert.deepEqual(await readdir(f.claude), entries)
    const next = await nextRelease(f.sandbox)
    // A later Codex-only update also advances Claude's stable discovery link.
    good(run(next, 'manage-user-skill.mjs', ['sync', '--skills-home', f.codex]))
    assert.notEqual(await realpath(resolve(f.codex, 'doxanh')), before)
    assert.equal(await realpath(resolve(f.claude, 'doxanh')), await realpath(resolve(f.codex, 'doxanh')))
    assert.equal(good(run(resolve(f.claude, 'doxanh'), 'manage-user-skill.mjs', ['resolve', '--target', f.project])), before)
    good(f.manage('check', ['--target', f.project]))
    good(run(next, 'project-standards.mjs', ['update', '--target', f.project]))
    const updated = good(run(resolve(f.claude, 'doxanh'), 'manage-user-skill.mjs', ['resolve', '--target', f.project]))
    assert.notEqual(updated, before)
    await writeFile(resolve(updated, 'SKILL.md'), 'local drift\n')
    assert.notEqual(run(resolve(f.claude, 'doxanh'), 'manage-user-skill.mjs', ['resolve', '--target', f.project]).status, 0)
  }
  finally { await rm(f.sandbox, { recursive: true, force: true }) }
})

test('joining an existing Claude-only store retains its older locked versions', async () => {
  const f = await fixture()
  try {
    good(run(skill, 'manage-user-skill.mjs', ['sync', '--agents', 'claude', '--skills-home', f.claude]))
    const old = await realpath(resolve(f.claude, 'doxanh'))
    const next = await nextRelease(f.sandbox)
    good(run(next, 'manage-user-skill.mjs', ['sync', '--skills-home', f.codex]))
    good(f.manage('sync', [], next))
    const resolved = good(run(resolve(f.claude, 'doxanh'), 'manage-user-skill.mjs', ['resolve', '--target', f.project]))
    assert.notEqual(resolved, old)
    assert.ok(resolved.startsWith(await realpath(f.codex)))
    assert.equal(await readFile(resolve(resolved, 'SKILL.md'), 'utf8'), await readFile(resolve(old, 'SKILL.md'), 'utf8'))
    good(f.manage('check', ['--target', f.project], next))
  }
  finally { await rm(f.sandbox, { recursive: true, force: true }) }
})

test('Claude-only Make installation and installed helpers work without a Codex home', async () => {
  const f = await fixture()
  try {
    const config = resolve(f.sandbox, 'claude config')
    const unusedCodex = resolve(f.sandbox, 'absent-codex')
    const env = { ...process.env, CLAUDE_CONFIG_DIR: config, CODEX_HOME: unusedCodex }
    good(spawnSync('make', ['skill-sync', 'AGENTS=claude'], { cwd: root, env, encoding: 'utf8' }))
    const discovery = resolve(config, 'skills/doxanh')
    const resolved = good(run(discovery, 'manage-user-skill.mjs', ['resolve', '--target', f.project], env))
    assert.equal(resolved, await realpath(discovery))
    good(run(discovery, 'manage-user-skill.mjs', ['check', '--target', f.project], env))
    await assert.rejects(lstat(unusedCodex), { code: 'ENOENT' })
  }
  finally { await rm(f.sandbox, { recursive: true, force: true }) }
})

test('a conflicting Claude entry prevents updates to either agent or the project lock', async () => {
  for (const conflict of ['directory', 'broken-link', 'drift', 'legacy']) {
    const f = await fixture()
    try {
      good(run(skill, 'manage-user-skill.mjs', ['sync', '--skills-home', f.codex]))
      const before = await realpath(resolve(f.codex, 'doxanh'))
      const lock = await readFile(resolve(f.project, '.doxanh-project-standards.json'), 'utf8')
      const next = await nextRelease(f.sandbox)
      const destination = resolve(f.claude, conflict === 'legacy' ? 'project-guideline-workflow' : 'doxanh')
      await mkdir(f.claude, { recursive: true })
      if (conflict === 'broken-link') await symlink(resolve(f.sandbox, 'missing'), destination)
      else {
        if (conflict === 'drift') await cp(skill, destination, { recursive: true })
        else await mkdir(destination)
        await writeFile(resolve(destination, 'SKILL.md'), 'personal instructions\n')
      }
      const entries = await readdir(f.codex)
      const result = run(next, 'sync-standards.mjs', [...f.options, '--target', f.project, '--replace-recognized'])
      assert.notEqual(result.status, 0)
      assert.equal(await realpath(resolve(f.codex, 'doxanh')), before)
      assert.deepEqual(await readdir(f.codex), entries)
      assert.equal(await readFile(resolve(f.project, '.doxanh-project-standards.json'), 'utf8'), lock)
      if (conflict !== 'broken-link') assert.equal(await readFile(resolve(destination, 'SKILL.md'), 'utf8'), 'personal instructions\n')
    }
    finally { await rm(f.sandbox, { recursive: true, force: true }) }
  }
})

test('failed nested project migration restores both agents and preserves both instruction files', async () => {
  const f = await fixture()
  try {
    good(f.manage('sync'))
    const before = await realpath(resolve(f.codex, 'doxanh'))
    const template = resolve(skill, 'assets/project-template')
    await cp(template, f.project, { recursive: true })
    const paths = await files(template)
    const projectFiles = []
    for (const path of paths) projectFiles.push({ path, sha256: digest(await readFile(resolve(template, path))) })
    const oldLock = JSON.stringify({ schema_version: 2, name: metadata.name, version: '2.0.1', repository: metadata.repository, repository_root: '../..', project_template_sha256: metadata.project_template_sha256, project_files: projectFiles, skill: { name: 'doxanh', distribution: 'user-scope', repository_path: '.agents/skills/doxanh', contract_sha256: metadata.skill_contract_sha256 } })
    await writeFile(resolve(f.project, '.doxanh-project-standards.json'), oldLock)
    await writeFile(resolve(f.project, 'docs/new-project-guideline.md'), 'unregistered legacy copy\n')
    const repository = resolve(f.project, '../..')
    await writeFile(resolve(repository, 'AGENTS.md'), 'owned instructions\n')
    await writeFile(resolve(repository, 'CLAUDE.md'), 'owned Claude instructions\n')
    const next = await nextRelease(f.sandbox)
    const result = run(next, 'sync-standards.mjs', [...f.options, '--target', f.project, '--repo-root', repository])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /previous lock and managed files restored/)
    assert.equal(await realpath(resolve(f.codex, 'doxanh')), before)
    assert.equal(await realpath(resolve(f.claude, 'doxanh')), before)
    assert.equal(await readFile(resolve(f.project, '.doxanh-project-standards.json'), 'utf8'), oldLock)
    assert.equal(await readFile(resolve(repository, 'AGENTS.md'), 'utf8'), 'owned instructions\n')
    assert.equal(await readFile(resolve(repository, 'CLAUDE.md'), 'utf8'), 'owned Claude instructions\n')
  }
  finally { await rm(f.sandbox, { recursive: true, force: true }) }
})

test('an existing Claude sync guard is preserved and blocks both-agent changes', async () => {
  const f = await fixture()
  try {
    good(f.manage('sync'))
    const before = await realpath(resolve(f.codex, 'doxanh'))
    const guard = resolve(f.claude, '.doxanh-standards-sync.lock')
    await mkdir(guard)
    const next = await nextRelease(f.sandbox)
    assert.notEqual(f.manage('sync', [], next).status, 0)
    assert.equal((await lstat(guard)).isDirectory(), true)
    assert.equal(await realpath(resolve(f.codex, 'doxanh')), before)
    assert.equal(await realpath(resolve(f.claude, 'doxanh')), before)
    await assert.rejects(lstat(resolve(f.codex, '.doxanh-standards-sync.lock')), { code: 'ENOENT' })
  }
  finally { await rm(f.sandbox, { recursive: true, force: true }) }
})
