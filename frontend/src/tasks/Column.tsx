import { useDroppable } from '@dnd-kit/react'
import type { ReactNode } from 'react'
import { labels, type Status } from './model'
import { Icon } from '../components/Icon'
import styles from '../App.module.css'

const captions: Record<Status, string> = {
  todo: 'Ideias que vão ganhar vida',
  in_progress: 'Um passo mais perto',
  done: 'Pequenas grandes conquistas',
}
const empty: Record<Status, string> = {
  todo: 'Seu próximo passo começa aqui.',
  in_progress: 'Dê o primeiro passo.',
  done: 'Suas conquistas terão lugar aqui.',
}
export function Column({
  status,
  count,
  loading,
  children,
}: {
  status: Status
  count: number
  loading: boolean
  children: ReactNode
}) {
  const { ref, isDropTarget } = useDroppable({ id: status })
  return (
    <section
      ref={ref}
      className={`${styles.column} ${isDropTarget ? styles.dropTarget : ''}`}
      aria-labelledby={`column-${status}`}
    >
      <div className={styles.columnHeading}>
        <div>
          <h2 id={`column-${status}`}>
            <span className={`${styles.dot} ${styles[status]}`} />
            {labels[status]}
            <span className={styles.count} aria-label={`${count} tarefas`}>
              {count}
            </span>
          </h2>
          <p>{captions[status]}</p>
        </div>
      </div>
      <div className={styles.cardList}>
        {children}
        {!count ? (
          <div className={styles.emptyColumn}>
            <span className={`${styles.emptyIcon} ${styles[status]}`}>
              <Icon
                name={
                  status === 'done'
                    ? 'check'
                    : status === 'in_progress'
                      ? 'arrow'
                      : 'board'
                }
                size={24}
              />
            </span>
            <p>{loading ? 'Carregando tarefas…' : empty[status]}</p>
            <span>
              {loading
                ? 'Preparando seu quadro'
                : 'Arraste uma tarefa para esta coluna'}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
