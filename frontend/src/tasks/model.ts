export const statuses = ['todo', 'in_progress', 'done'] as const
export type Status = (typeof statuses)[number]
export const labels: Record<Status, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluídas',
}
export interface Task {
  id: string
  title: string
  description: string
  status: Status
  createdAt: string
  updatedAt: string
}
// O formulário envia apenas os campos editáveis; ID e datas vêm da API.
export type TaskInput = Pick<Task, 'title' | 'description' | 'status'>
export type FieldErrors = Partial<Record<keyof TaskInput, string>>

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === 'string' && statuses.some((status) => status === value)
  )
}
export function validate(input: TaskInput): FieldErrors {
  const errors: FieldErrors = {}
  // Array.from conta pontos de código, mantendo os limites coerentes com as runas do Go.
  if (
    Array.from(input.title.trim()).length < 1 ||
    Array.from(input.title.trim()).length > 120
  ) {
    errors.title = 'Informe um título de 1 a 120 caracteres.'
  }
  if (Array.from(input.description).length > 2000)
    errors.description = 'Use no máximo 2.000 caracteres.'
  if (!isStatus(input.status)) errors.status = 'Selecione um status válido.'
  return errors
}
export function sortTasks(tasks: Task[]): Task[] {
  // Ordeno uma cópia para preservar o estado React; mover só altera o status da tarefa.
  return [...tasks].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
}
