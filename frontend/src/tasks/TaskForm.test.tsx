import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('validates before sending and trims a valid title', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<TaskForm busy={false} onSave={onSave} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(
      screen.getByText('Informe um título de 1 a 120 caracteres.'),
    ).toBeVisible()
    expect(screen.getByLabelText(/Título/)).toHaveFocus()
    await user.type(screen.getByLabelText(/Título/), '  Primeiro passo  ')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        title: 'Primeiro passo',
        description: '',
        status: 'todo',
      }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('preserves the form and shows server failures', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <TaskForm
        busy={false}
        onSave={vi.fn().mockRejectedValue(new Error('Falha ao salvar.'))}
        onClose={onClose}
      />,
    )
    await user.type(screen.getByLabelText(/Título/), 'Não perder')
    await user.type(screen.getByLabelText(/Descrição/), 'Minhas anotações')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha ao salvar.',
    )
    expect(screen.getByLabelText(/Título/)).toHaveValue('Não perder')
    expect(screen.getByLabelText(/Descrição/)).toHaveValue('Minhas anotações')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('focuses an invalid description so its error is reachable by keyboard', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<TaskForm busy={false} onSave={onSave} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Título/), 'Planejar')
    const description = screen.getByLabelText(/Descrição/)
    await user.click(description)
    await user.paste('x'.repeat(2001))
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(description).toHaveFocus()
    expect(description).toHaveAttribute('aria-invalid', 'true')
    expect(description).toHaveAccessibleDescription(
      'Use no máximo 2.000 caracteres.',
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  it('disables submitting and closing while pending', () => {
    render(<TaskForm busy={true} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByLabelText(/Título/)).toBeDisabled()
  })
})
