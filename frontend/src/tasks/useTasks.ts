import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, tasksAPI } from './api'
import {
  labels,
  sortTasks,
  type Status,
  type Task,
  type TaskInput,
} from './model'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  // A ref bloqueia outro envio imediatamente, antes do próximo render da interface.
  const busy = useRef(false)
  // Uma consulta antiga não pode substituir o resultado de uma operação mais recente.
  const revision = useRef(0)

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (busy.current) return
    const current = ++revision.current
    setLoading(true)
    setError('')
    try {
      const result = await tasksAPI.list(signal)
      if (current === revision.current) setTasks(sortTasks(result))
    } catch (error) {
      if (!signal?.aborted && current === revision.current)
        setError(errorMessage(error))
    } finally {
      if (!signal?.aborted && current === revision.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const current = ++revision.current
    void tasksAPI
      .list(controller.signal)
      .then((result) => {
        if (current === revision.current && !controller.signal.aborted) {
          setTasks(sortTasks(result))
          setLoading(false)
        }
      })
      .catch((error: unknown) => {
        if (current === revision.current && !controller.signal.aborted) {
          setError(errorMessage(error))
          setLoading(false)
        }
      })
    const onFocus = () => {
      void reload()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      // Cancelo a carga e removo o evento ao desmontar, inclusive no StrictMode.
      controller.abort()
      window.removeEventListener('focus', onFocus)
    }
  }, [reload])

  // Centralizo o ciclo de gravação para manter bloqueio e feedback iguais entre as ações.
  async function mutate<T>(
    key: string,
    operation: () => Promise<T>,
    apply: (result: T, current: Task[]) => Task[],
    message: string,
    optimistic?: (current: Task[]) => Task[],
  ) {
    if (busy.current) throw new Error('Aguarde a operação em andamento.')
    busy.current = true
    ++revision.current
    setLoading(false)
    setPending(key)
    setError('')
    setNotice('')
    const previous = tasks
    // Só a movimentação antecipa o resultado visual; o servidor confirma o estado definitivo.
    if (optimistic) setTasks(optimistic)
    try {
      const result = await operation()
      setTasks((current) => sortTasks(apply(result, current)))
      setNotice(message)
    } catch (error) {
      if (optimistic) setTasks(previous)
      // A resposta pode se perder depois de salvar. Consulto a API sem repetir a mutação.
      try {
        setTasks(sortTasks(await tasksAPI.list()))
      } catch {
        /* Sem reconciliação, mantenho a lista anterior para permitir nova tentativa consciente. */
      }
      throw error
    } finally {
      busy.current = false
      setPending(null)
    }
  }

  const create = (input: TaskInput) =>
    mutate(
      'create',
      () => tasksAPI.create(input),
      (task, current) => [...current, task],
      'Tarefa criada. Um novo passo no seu quadro.',
    )
  const update = (id: string, input: TaskInput) =>
    mutate(
      id,
      () => tasksAPI.update(id, input),
      (task, current) => current.map((item) => (item.id === id ? task : item)),
      'Alterações salvas.',
    )
  const remove = (id: string) =>
    mutate(
      id,
      () => tasksAPI.remove(id),
      (_, current) => current.filter((item) => item.id !== id),
      'Tarefa excluída.',
    )
  async function move(task: Task, status: Status) {
    if (task.status === status || busy.current) return
    try {
      await mutate(
        task.id,
        () =>
          tasksAPI.update(task.id, {
            title: task.title,
            description: task.description,
            status,
          }),
        (updated, current) =>
          current.map((item) => (item.id === task.id ? updated : item)),
        `Tarefa movida para ${labels[status]}.`,
        (current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, status } : item,
          ),
      )
    } catch (error) {
      setError(errorMessage(error))
    }
  }
  return {
    tasks,
    loading,
    error,
    notice,
    pending,
    reload,
    create,
    update,
    remove,
    move,
  }
}
