import { useId, useState } from 'react'
import { Modal } from '../components/Modal'
import { errorMessage } from './api'
import type { Task } from './model'
import styles from '../App.module.css'

export function DeleteDialog({
  task,
  busy,
  onDelete,
  onClose,
}: {
  task: Task
  busy: boolean
  onDelete: () => Promise<void>
  onClose: () => void
}) {
  const id = useId()
  const [error, setError] = useState('')
  async function confirm() {
    if (busy) return
    setError('')
    try {
      await onDelete()
      onClose()
    } catch (error) {
      setError(errorMessage(error))
    }
  }
  return (
    <Modal title="Excluir tarefa?" titleId={id} busy={busy} onClose={onClose}>
      <p className={styles.deleteText}>
        A tarefa <strong>“{task.title}”</strong> será excluída. Essa ação não
        pode ser desfeita.
      </p>
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
        <button
          type="button"
          className={styles.danger}
          onClick={() => void confirm()}
          disabled={busy}
        >
          {busy ? 'Excluindo…' : 'Excluir tarefa'}
        </button>
      </div>
    </Modal>
  )
}
