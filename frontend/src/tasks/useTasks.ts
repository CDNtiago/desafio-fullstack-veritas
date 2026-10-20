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
  const busy = useRef(false)
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
      controller.abort()
      window.removeEventListener('focus', onFocus)
    }
  }, [reload])

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
    if (optimistic) setTasks(optimistic)
    try {
      const result = await operation()
      setTasks((current) => sortTasks(apply(result, current)))
      setNotice(message)
    } catch (error) {
      if (optimistic) setTasks(previous)
      // A lost response may still have persisted. Reconcile without retrying a mutation.
      try {
        setTasks(sortTasks(await tasksAPI.list()))
      } catch {
        /* Keep the last confirmed snapshot. */
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
