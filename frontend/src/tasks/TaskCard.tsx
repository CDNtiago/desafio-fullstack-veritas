import { useDraggable } from '@dnd-kit/react'
import { Icon } from '../components/Icon'
import { labels, statuses, type Status, type Task } from './model'
import styles from '../App.module.css'

export function TaskCard({
  task,
  busy,
  saving,
  onEdit,
  onDelete,
  onMove,
}: {
  task: Task
  busy: boolean
  saving: boolean
  onEdit: () => void
  onDelete: () => void
  onMove: (status: Status) => void
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: task.id,
    disabled: busy,
  })
  return (
    <article
      ref={ref}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      aria-label={task.title}
      aria-busy={saving}
    >
      <div className={styles.cardTop}>
        <span className={`${styles.statusBadge} ${styles[task.status]}`}>
          {labels[task.status]}
        </span>
        <button
          ref={handleRef}
          type="button"
          className={`${styles.iconButton} ${styles.dragHandle}`}
          disabled={busy}
          aria-label={`Arrastar ${task.title}`}
        >
          <Icon name="grip" />
        </button>
      </div>
      <h3>{task.title}</h3>
      {task.description ? (
        <p className={styles.description}>{task.description}</p>
      ) : null}
      <div className={styles.cardBottom}>
        <select
          className={styles.moveSelect}
          value={task.status}
          disabled={busy}
          aria-label={`Mover ${task.title}`}
          onChange={(e) => onMove(e.target.value as Status)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {labels[status]}
            </option>
          ))}
        </select>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.iconButton}
            disabled={busy}
            aria-label={`Editar ${task.title}`}
            onClick={onEdit}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.deleteButton}`}
            disabled={busy}
            aria-label={`Excluir ${task.title}`}
            onClick={onDelete}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
      {saving ? <span className={styles.saving}>Salvando…</span> : null}
    </article>
  )
}
