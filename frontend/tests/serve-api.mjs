import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'
import console from 'node:console'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

// Cada execução usa um diretório temporário próprio, sem reutilizar os dados da demonstração.
const directory = mkdtempSync(join(tmpdir(), 'veritas-e2e-'))
const binary = join(directory, process.platform === 'win32' ? 'api.exe' : 'api')
const cwd = fileURLToPath(new URL('../../backend/', import.meta.url))
const build = spawnSync('go', ['build', '-o', binary, '.'], {
  cwd,
  stdio: 'inherit',
})
if (build.error || build.status !== 0) {
  console.error(build.error ?? 'Go build failed')
  process.exit(1)
}
const server = spawn(binary, [], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HTTP_ADDR: '127.0.0.1:8082',
    TASKS_FILE: join(directory, 'tasks.json'),
    ALLOWED_ORIGINS: 'http://127.0.0.1:5174',
  },
})
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.kill(signal))
server.on('exit', (code) => process.exit(code ?? 0))
server.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
