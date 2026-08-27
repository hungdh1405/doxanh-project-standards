import { createHash } from 'node:crypto'
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = resolve(root, '.agents/skills/project-guideline-workflow')
const assetRoot = resolve(skillRoot, 'assets')
const templateRoot = resolve(assetRoot, 'project-template')
const metadata = JSON.parse(await readFile(resolve(assetRoot, 'project-standards.json'), 'utf8'))
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const errors = []

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function collectFiles(directory, base = directory) {
  const files = []
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const absolute = resolve(current, entry.name)
      if (entry.isSymbolicLink()) errors.push(`symlink is not allowed in package: ${absolute}`)
      else if (entry.isDirectory()) await walk(absolute)
      else if (entry.isFile()) files.push(relative(base, absolute).split('\\').join('/'))
      else errors.push(`unsupported package entry: ${absolute}`)
    }
  }
  await walk(directory)
  return files
}

async function fingerprint(directory, paths) {
  let source = ''
  for (const path of paths) {
    source += `${path}\0${sha256(await readFile(resolve(directory, path)))}\n`
  }
  return sha256(source)
}

if (packageJson.version !== metadata.version) {
  errors.push(`package.json version ${packageJson.version} differs from metadata ${metadata.version}`)
}
const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## [${metadata.version}]`)) {
  errors.push(`CHANGELOG.md has no ${metadata.version} release`)
}

const projectPaths = await collectFiles(templateRoot)
const projectFingerprint = await fingerprint(templateRoot, projectPaths)
if (projectFingerprint !== metadata.project_template_sha256) {
  errors.push(`project template fingerprint is ${projectFingerprint}`)
}

const skillContractPaths = [
  'SKILL.md',
  ...(await collectFiles(resolve(skillRoot, 'agents'))).map(path => `agents/${path}`),
  ...(await collectFiles(resolve(skillRoot, 'scripts'))).map(path => `scripts/${path}`),
].sort()
const skillFingerprint = await fingerprint(skillRoot, skillContractPaths)
if (skillFingerprint !== metadata.skill_contract_sha256) {
  errors.push(`skill contract fingerprint is ${skillFingerprint}`)
}

const manifestPath = resolve(templateRoot, 'docs/guidelines/guideline-manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const registeredPaths = manifest.modules.map(module => module.path)
const actualModulePaths = (await collectFiles(resolve(templateRoot, 'docs/guidelines/modules')))
  .map(path => `docs/guidelines/modules/${path}`)
if (JSON.stringify([...registeredPaths].sort()) !== JSON.stringify([...actualModulePaths].sort())) {
  errors.push('guideline manifest and module files differ')
}
const complete = Buffer.concat(
  await Promise.all(registeredPaths.map(path => readFile(resolve(templateRoot, path)))),
)
const completeLines = [...complete.toString('utf8').matchAll(/\n/g)].length
if (sha256(complete) !== manifest.semantic_baseline.sha256) errors.push('semantic baseline SHA-256 differs')
if (complete.byteLength !== manifest.semantic_baseline.bytes) errors.push('semantic baseline byte count differs')
if (completeLines !== manifest.semantic_baseline.lines) errors.push('semantic baseline line count differs')

const skillSource = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')
if (!skillSource.startsWith('---\nname: project-guideline-workflow\n')) {
  errors.push('SKILL.md frontmatter name is invalid')
}
if (!skillSource.includes('\ndescription: ')) errors.push('SKILL.md description is missing')
const openAiYaml = await readFile(resolve(skillRoot, 'agents/openai.yaml'), 'utf8')
for (const token of ['interface:', 'display_name:', 'short_description:', 'default_prompt:']) {
  if (!openAiYaml.includes(token)) errors.push(`agents/openai.yaml is missing ${token}`)
}

const localMarkdownFiles = ['README.md', 'CHANGELOG.md']
for (const markdownPath of localMarkdownFiles) {
  const source = await readFile(resolve(root, markdownPath), 'utf8')
  for (const match of source.matchAll(/\]\((\.\.?\/[^)#]+)(?:#[^)]+)?\)/gu)) {
    const target = resolve(dirname(resolve(root, markdownPath)), match[1])
    try {
      await stat(target)
    }
    catch {
      errors.push(`${markdownPath} has broken local link ${match[1]}`)
    }
  }
}

for (const script of [
  resolve(skillRoot, 'scripts/manage-user-skill.mjs'),
  resolve(skillRoot, 'scripts/project-standards.mjs'),
  resolve(templateRoot, 'scripts/docs/manage-guideline.mjs'),
]) {
  const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' })
  if (result.status !== 0) errors.push(`${relative(root, script)} has invalid syntax: ${result.stderr.trim()}`)
}

const fixtureRoot = await mkdtemp(resolve(tmpdir(), 'doxanh-standards-check-'))
try {
  await cp(templateRoot, fixtureRoot, { recursive: true })
  const result = spawnSync(
    process.execPath,
    [resolve(fixtureRoot, 'scripts/docs/manage-guideline.mjs'), 'check'],
    { cwd: fixtureRoot, encoding: 'utf8' },
  )
  if (result.status !== 0) errors.push(`packaged guideline check failed: ${result.stderr.trim()}`)
}
finally {
  await rm(fixtureRoot, { recursive: true, force: true })
}

if (errors.length > 0) {
  console.error(`Package check failed with ${errors.length} issue(s):`)
  errors.forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

console.log(
  `Package check passed: version ${metadata.version}, ${projectPaths.length} guideline package files, `
  + `${manifest.modules.length} guideline modules, ${complete.byteLength} baseline bytes.`,
)
