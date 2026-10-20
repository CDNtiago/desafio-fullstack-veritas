import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { tasksAPI } from './api'
import { useTasks } from './useTasks'
import type { Task } from './model'

const task: Task = {
  id: 'a'.repeat(32),
  title: 'Planejar',
  description: '',
  status: 'todo',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
afterEach(() => vi.restoreAllMocks())

it('shows loading errors and supports retry', async () => {
  vi.spyOn(tasksAPI, 'list')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue([task])
  const { result } = renderHook(useTasks)
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.error).toBe('Offline'))
  await act(() => result.current.reload())
  expect(result.current.tasks).toEqual([task])
  expect(result.current.error).toBe('')
})

it('rolls back a failed optimistic move and reconciles with the API', async () => {
  vi.spyOn(tasksAPI, 'list').mockResolvedValue([task])
  let reject!: (reason: Error) => void
  vi.spyOn(tasksAPI, 'update').mockImplementation(
    () =>
      new Promise((_, failure) => {
        reject = failure
      }),
  )
  const { result } = renderHook(useTasks)
  await waitFor(() => expect(result.current.loading).toBe(false))
  let moving!: Promise<void>
  act(() => {
    moving = result.current.move(task, 'done')
  })
  expect(result.current.tasks[0].status).toBe('done')
  expect(result.current.pending).toBe(task.id)
  await act(async () => {
    reject(new Error('Falha de gravação'))
    await moving
  })
  expect(result.current.tasks[0].status).toBe('todo')
  expect(result.current.error).toBe('Falha de gravação')
  expect(result.current.pending).toBeNull()
})

it('blocks duplicate mutations and ignores a stale list response', async () => {
  let completeList!: (tasks: Task[]) => void
  vi.spyOn(tasksAPI, 'list').mockImplementation(
    () =>
      new Promise((resolve) => {
        completeList = resolve
      }),
  )
  let completeCreate!: (task: Task) => void
  const create = vi.spyOn(tasksAPI, 'create').mockImplementation(
    () =>
      new Promise((resolve) => {
        completeCreate = resolve
      }),
  )
  const { result } = renderHook(useTasks)
  const input = { title: task.title, description: '', status: 'todo' as const }
  let saving!: Promise<void>
  act(() => {
    saving = result.current.create(input)
  })
  await act(async () => {
    await expect(result.current.create(input)).rejects.toThrow('Aguarde')
  })
  await act(async () => {
    completeCreate(task)
    await saving
    completeList([])
  })
  expect(result.current.tasks).toEqual([task])
  expect(create).toHaveBeenCalledOnce()
})
