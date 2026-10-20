import process from 'node:process'
import console from 'node:console'
import { fileURLToPath, URL } from 'node:url'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const api = process.env.CAPTURE_API_URL || 'http://localhost:8080'
const url = process.env.CAPTURE_URL || 'http://localhost:5173'
const ids = []
const samples = [
  [
    'Desenhar o próximo passo',
    'Transformar uma boa ideia em uma tarefa clara e possível.',
    'todo',
  ],
  [
    'Revisar os detalhes',
    'Reservar um momento para conferir o que faz a diferença.',
    'todo',
  ],
  [
    'Dar vida ao projeto',
    'Construir, testar e aprender a cada pequena entrega.',
    'in_progress',
  ],
  [
    'Organizar as prioridades',
    'Um quadro simples para enxergar o que realmente importa.',
    'done',
  ],
  [
    'Celebrar o progresso',
    'Reconhecer cada etapa concluída também faz parte do caminho.',
    'done',
  ],
]
const browser = await chromium.launch()
try {
  for (const [title, description, status] of samples) {
    const response = await fetch(`${api}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status }),
    })
    if (!response.ok) throw new Error(`Seed failed: ${response.status}`)
    ids.push((await response.json()).id)
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(url)
  await page
    .getByRole('article', { name: samples[0][0], exact: true })
    .waitFor()
  const violations = (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
  ).violations
  if (violations.length)
    throw new Error(
      JSON.stringify(
        violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.failureSummary),
        })),
      ),
    )
  await page.screenshot({
    path: fileURLToPath(new URL('../../docs/quadro.png', import.meta.url)),
    fullPage: true,
  })
  console.log('Screenshot saved; desktop accessibility check passed.')
} finally {
  await browser.close()
  for (const id of ids) {
    const response = await fetch(`${api}/tasks/${id}`, { method: 'DELETE' })
    if (!response.ok)
      console.error(`Could not remove sample ${id}: ${response.status}`)
  }
}
