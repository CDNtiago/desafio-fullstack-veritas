import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const api = 'http://127.0.0.1:8082'
async function create(page: Page, title: string, description = '') {
  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  await page.getByLabel('Título', { exact: false }).fill(title)
  if (description)
    await page.getByLabel('Descrição', { exact: false }).fill(description)
  await page.getByRole('button', { name: 'Criar tarefa', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
async function seed(
  request: APIRequestContext,
  title: string,
  status = 'todo',
) {
  const response = await request.post(`${api}/tasks`, {
    data: { title, status, description: 'Uma tarefa para testar o fluxo.' },
  })
  expect(response.status()).toBe(201)
}

test.beforeEach(async ({ request }) => {
  const response = await request.get(`${api}/tasks`)
  for (const task of await response.json())
    expect((await request.delete(`${api}/tasks/${task.id}`)).status()).toBe(204)
})

test('CRUD completo e todas as colunas usando a API real', async ({ page }) => {
  await page.goto('/')
  await create(page, 'Planejar entrega', 'Conferir os requisitos do desafio.')
  const card = page.getByRole('article', {
    name: 'Planejar entrega',
    exact: true,
  })
  await expect(page.getByRole('region', { name: 'A Fazer' })).toContainText(
    'Planejar entrega',
  )
  await card.getByRole('button', { name: 'Editar Planejar entrega' }).click()
  await page.getByLabel('Título', { exact: false }).fill('Revisar entrega')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  for (const [value, label] of [
    ['in_progress', 'Em Progresso'],
    ['done', 'Concluídas'],
    ['todo', 'A Fazer'],
  ]) {
    await page
      .getByRole('combobox', { name: 'Mover Revisar entrega' })
      .selectOption(value)
    await expect(page.getByRole('region', { name: label })).toContainText(
      'Revisar entrega',
    )
    await expect(
      page.getByRole('combobox', { name: 'Mover Revisar entrega' }),
    ).toBeEnabled()
  }
  await page.reload()
  await expect(
    page.getByRole('article', { name: 'Revisar entrega', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Excluir Revisar entrega' }).click()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Excluir Revisar entrega' }).click()
  await page
    .getByRole('button', { name: 'Excluir tarefa', exact: true })
    .click()
  await expect(page.getByRole('article')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'A Fazer' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)
})

test('arraste pelo corpo para coluna vazia e cancelamento por Escape', async ({
  page,
  request,
}) => {
  await seed(request, 'Arrastar cartão')
  await page.goto('/')
  const handle = page.getByRole('button', { name: 'Arrastar Arrastar cartão' })
  const target = page.getByRole('region', { name: 'Em Progresso' })
  const sourceBox = await page
    .getByRole('heading', { name: 'Arrastar cartão', exact: true })
    .boundingBox()
  const targetBox = await target.boundingBox()
  expect(sourceBox).not.toBeNull()
  expect(targetBox).not.toBeNull()
  await page.mouse.move(sourceBox!.x + 15, sourceBox!.y + 15)
  await page.mouse.down()
  await page.mouse.move(sourceBox!.x + 30, sourceBox!.y + 30, { steps: 6 })
  await page.mouse.move(
    targetBox!.x + targetBox!.width / 2,
    targetBox!.y + 140,
    { steps: 20 },
  )
  await page.mouse.up()
  await expect(
    target.getByRole('article', { name: 'Arrastar cartão', exact: true }),
  ).toBeVisible()
  await expect(handle).toBeEnabled()
  await handle.focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(
    target.getByRole('article', { name: 'Arrastar cartão', exact: true }),
  ).toBeVisible()
})

test('falha preserva formulário e a movimentação é reconciliada', async ({
  page,
  request,
}) => {
  await seed(request, 'Manter status')
  await page.goto('/')
  await page.route('**/tasks', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({
        status: 500,
        json: { error: { message: 'Falha simulada de gravação.' } },
      })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  await page.getByLabel('Título', { exact: false }).fill('Preservar rascunho')
  await page.getByRole('button', { name: 'Criar tarefa', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Falha simulada de gravação.',
  )
  await expect(page.getByLabel('Título', { exact: false })).toHaveValue(
    'Preservar rascunho',
  )
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.route('**/tasks/*', async (route) => {
    if (route.request().method() === 'PUT')
      await route.fulfill({
        status: 500,
        json: { error: { message: 'Não foi possível mover.' } },
      })
    else await route.continue()
  })
  await page
    .getByRole('combobox', { name: 'Mover Manter status' })
    .selectOption('done')
  await expect(page.getByRole('alert')).toContainText('Não foi possível mover.')
  await expect(page.getByRole('region', { name: 'A Fazer' })).toContainText(
    'Manter status',
  )
})

test('teclado, texto seguro, acessibilidade e tela móvel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await create(
    page,
    '<script>alert("teste")</script>',
    'Texto literal, sem execução de HTML.',
  )
  const move = page.getByRole('combobox', { name: /Mover <script>/ })
  await move.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('region', { name: 'Em Progresso' }),
  ).toContainText('<script>')
  await expect(move).toBeEnabled()
  expect(await page.locator('article script').count()).toBe(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
      .violations,
  ).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('menu lateral recolhe e reabre no desktop e fecha pelo fundo no celular', async ({
  page,
}) => {
  await page.goto('/')
  const sidebar = page.locator('#menu-lateral')
  const showMenu = page.getByRole('button', { name: 'Mostrar menu lateral' })
  const hideMenu = page.getByRole('button', { name: 'Ocultar menu lateral' })
  await expect(sidebar).toBeInViewport()
  await hideMenu.click()
  await expect(sidebar).not.toBeInViewport()
  await expect(sidebar).toHaveAttribute('inert', '')
  await showMenu.click()
  await expect(sidebar).toBeInViewport()
  await expect(hideMenu).toHaveAttribute('aria-expanded', 'true')

  await hideMenu.click()
  await page.setViewportSize({ width: 390, height: 844 })
  await showMenu.click()
  await expect(sidebar).toBeInViewport()
  await page.getByRole('button', { name: 'Fechar menu lateral' }).click({
    position: { x: 378, y: 100 },
  })
  await expect(sidebar).not.toBeInViewport()
  await expect(showMenu).toHaveAttribute('aria-expanded', 'false')
})

test('descrição mantém a altura e rola até o cursor sem redimensionamento manual', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  const description = page.getByLabel('Descrição', { exact: false })
  const initialHeight = await description.evaluate(
    (field) => field.clientHeight,
  )
  await description.fill(
    Array.from(
      { length: 40 },
      (_, index) => `Linha ${index + 1}: contexto.`,
    ).join('\n'),
  )
  await description.press('ControlOrMeta+End')
  await description.press('Enter')
  await description.pressSequentially('Última linha')
  await expect(description).toHaveCSS('resize', 'none')
  expect(await description.evaluate((field) => field.clientHeight)).toBe(
    initialHeight,
  )
  await expect
    .poll(() => description.evaluate((field) => field.scrollTop))
    .toBeGreaterThan(0)
  const scrollAtEnd = await description.evaluate((field) => field.scrollTop)
  await description.press('ControlOrMeta+Home')
  await expect(description).toHaveJSProperty('selectionStart', 0)
  await expect
    .poll(() => description.evaluate((field) => field.scrollTop))
    .toBeLessThan(scrollAtEnd)
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('article')).toHaveCount(0)
})
