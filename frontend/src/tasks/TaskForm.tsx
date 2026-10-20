import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { Modal } from '../components/Modal'
import { errorMessage } from './api'
import {
  labels,
  statuses,
  validate,
  type FieldErrors,
  type Task,
  type TaskInput,
} from './model'
import styles from '../App.module.css'

export function TaskForm({
  task,
  busy,
  onSave,
  onClose,
}: {
  task?: Task
  busy: boolean
  onSave: (input: TaskInput) => Promise<void>
  onClose: () => void
}) {
  const id = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])
  const [input, setInput] = useState<TaskInput>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = validate(input)
    setErrors(fields)
    setError('')
    if (Object.keys(fields).length) {
      if (fields.title) titleRef.current?.focus()
      else if (fields.description) descriptionRef.current?.focus()
      return
    }
    try {
      await onSave({ ...input, title: input.title.trim() })
      onClose()
    } catch (error) {
      setError(errorMessage(error))
    }
  }
  return (
    <Modal
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      titleId={`${id}-heading`}
      busy={busy}
      onClose={onClose}
    >
      <p className={styles.modalIntro}>
        {task
          ? 'Ajuste os detalhes e siga em frente.'
          : 'Toda conquista começa com um primeiro passo.'}
      </p>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} className={styles.fields}>
          <label htmlFor={`${id}-title`}>
            Título <span aria-hidden="true">*</span>
          </label>
          <input
            ref={titleRef}
            id={`${id}-title`}
            name="title"
            value={input.title}
            onChange={(e) => setInput({ ...input, title: e.target.value })}
            placeholder="O que precisa ser feito?"
            required
            aria-invalid={!!errors.title}
            aria-describedby={
              errors.title ? `${id}-title-error` : `${id}-title-hint`
            }
          />
          {errors.title ? (
            <span id={`${id}-title-error`} className={styles.fieldError}>
              {errors.title}
            </span>
          ) : (
            <span id={`${id}-title-hint`} className={styles.fieldHint}>
              Até 120 caracteres · {Array.from(input.title.trim()).length}/120
            </span>
          )}
          <label htmlFor={`${id}-description`}>
            Descrição <span className={styles.optional}>(opcional)</span>
          </label>
          <textarea
            ref={descriptionRef}
            id={`${id}-description`}
            name="description"
            rows={4}
            value={input.description}
            onChange={(e) =>
              setInput({ ...input, description: e.target.value })
            }
            placeholder="Adicione contexto, ideias ou próximos passos..."
            aria-invalid={!!errors.description}
            aria-describedby={`${id}-description-hint`}
          />
          <span
            id={`${id}-description-hint`}
            className={
              errors.description ? styles.fieldError : styles.fieldHint
            }
          >
            {errors.description ||
              `${Array.from(input.description).length}/2.000 caracteres`}
          </span>
          <label htmlFor={`${id}-status`}>Status</label>
          <select
            id={`${id}-status`}
            value={input.status}
            onChange={(e) =>
              setInput({
                ...input,
                status: e.target.value as TaskInput['status'],
              })
            }
          >
            {statuses.map((status) => (
              <option value={status} key={status}>
                {labels[status]}
              </option>
            ))}
          </select>
        </fieldset>
        {error ? (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        ) : null}
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? 'Salvando…' : task ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
