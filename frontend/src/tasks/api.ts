import { isStatus, type Task, type TaskInput } from './model'

const baseURL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '')
export class APIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    /^[a-f0-9]{32}$/.test(item.id) &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    isStatus(item.status) &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  )
}
async function request(
  path: string,
  method = 'GET',
  input?: TaskInput,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = AbortSignal.timeout(15000)
  let response: Response
  try {
    response = await fetch(`${baseURL}${path}`, {
      method,
      headers: input ? { 'Content-Type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new APIError(
      'Não foi possível conectar à API. Verifique a conexão e tente novamente.',
      0,
    )
  }
  if (response.status === 204) return undefined
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      body.error &&
      typeof body.error === 'object' &&
      'message' in body.error &&
      typeof body.error.message === 'string'
        ? body.error.message
        : 'Não foi possível concluir a operação.'
    throw new APIError(message, response.status)
  }
  return body
}
async function write(
  path: string,
  method: string,
  input: TaskInput,
): Promise<Task> {
  const value = await request(path, method, input)
  if (!isTask(value))
    throw new APIError(
      'A API retornou uma tarefa inválida. Atualize o quadro.',
      0,
    )
  return value
}
export const tasksAPI = {
  async list(signal?: AbortSignal): Promise<Task[]> {
    const value = await request('/tasks', 'GET', undefined, signal)
    if (!Array.isArray(value) || !value.every(isTask))
      throw new APIError('A API retornou dados inválidos.', 0)
    return value
  },
  create: (input: TaskInput) => write('/tasks', 'POST', input),
  update: (id: string, input: TaskInput) =>
    write(`/tasks/${encodeURIComponent(id)}`, 'PUT', input),
  async remove(id: string) {
    await request(`/tasks/${encodeURIComponent(id)}`, 'DELETE')
  },
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocorreu um erro inesperado. Tente novamente.'
}
