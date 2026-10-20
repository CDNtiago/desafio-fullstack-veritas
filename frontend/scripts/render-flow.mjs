import process from 'node:process'
import console from 'node:console'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { chromium } from '@playwright/test'

if (!process.env.npm_execpath)
  throw new Error('Run this script with npm run docs:flow.')
const temporary = mkdtempSync(join(tmpdir(), 'veritas-flow-'))
const config = join(temporary, 'puppeteer.json')
const root = fileURLToPath(new URL('../../', import.meta.url))
writeFileSync(
  config,
  JSON.stringify({
    executablePath: chromium.executablePath(),
    pipe: true,
    timeout: 120000,
  }),
)
try {
  const result = spawnSync(
    process.execPath,
    [
      process.env.npm_execpath,
      'exec',
      '--yes',
      '--package=@mermaid-js/mermaid-cli@12.0.0',
      '--',
      'mmdc',
      '-i',
      'docs/user-flow.mmd',
      '-o',
      'docs/user-flow.png',
      '-b',
      'white',
      '--size',
      '2400',
      '-s',
      '2',
      '-p',
      config,
    ],
    { cwd: root, stdio: 'inherit' },
  )
  if (result.error) console.error(result.error)
  process.exitCode = result.status ?? 1
} finally {
  unlinkSync(config)
  rmdirSync(temporary)
}
