#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The skill manager owns the shared-store guard and rollback of every agent
// discovery entry. The project installer preserves its own lock/files on failure.
const directory = dirname(fileURLToPath(import.meta.url))
const result = spawnSync(process.execPath, [
  resolve(directory, 'manage-user-skill.mjs'), 'sync', '--update-project',
  ...process.argv.slice(2),
], { stdio: 'inherit' })
if (result.error) console.error(result.error.message)
process.exitCode = result.status ?? 1
