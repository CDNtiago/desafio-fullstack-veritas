import { useState } from 'react'
import {
  DragDropProvider,
  PointerSensor,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/react'
import { Accessibility, PointerActivationConstraints } from '@dnd-kit/dom'
import { Icon } from './components/Icon'
import { Column } from './tasks/Column'
import { TaskCard } from './tasks/TaskCard'
import { TaskForm } from './tasks/TaskForm'
import { DeleteDialog } from './tasks/DeleteDialog'
import { isStatus, labels, statuses, type Task } from './tasks/model'
import { useTasks } from './tasks/useTasks'
import styles from './App.module.css'

const accessibility = Accessibility.configure({
  screenReaderInstructions: {
    draggable:
      'Pressione Espaço para arrastar, use as setas para mover, Espaço para soltar ou Escape para cancelar. Você também pode usar o seletor de status da tarefa.',
  },
  announcements: {
    dragstart: () => 'Tarefa selecionada para movimentação.',
    dragover: ({ operation }: DragOverEvent) =>
      isStatus(operation.target?.id)
        ? `Destino: ${labels[operation.target.id]}.`
        : undefined,
    dragend: ({ canceled }: DragEndEvent) =>
      canceled ? 'Movimentação cancelada.' : 'Arraste finalizado.',
  },
})

const cardPointerSensor = PointerSensor.configure({
  activatorElements: (source) => (source.element ? [source.element] : []),
  activationConstraints: (event) =>
    event.pointerType === 'touch'
      ? [new PointerActivationConstraints.Delay({ value: 220, tolerance: 6 })]
      : [new PointerActivationConstraints.Distance({ value: 5 })],
})

export function App() {
  const board = useTasks()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(max-width: 900px)').matches,
  )
  const [editor, setEditor] = useState<Task | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const completed = board.tasks.filter((task) => task.status === 'done').length
  const progress = board.tasks.length
    ? Math.round((completed / board.tasks.length) * 100)
    : 0
  const busy = board.pending !== null
  return (
    <div
      className={`${styles.app} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}
    >
      <a className={styles.skipLink} href="#quadro">
        Pular para o quadro
      </a>
      <button
        type="button"
        className={styles.sidebarBackdrop}
        aria-label="Fechar menu lateral"
        tabIndex={sidebarCollapsed ? -1 : 0}
        onClick={() => setSidebarCollapsed(true)}
      />
      <aside
        id="menu-lateral"
        className={styles.sidebar}
        aria-label="Menu lateral"
        aria-hidden={sidebarCollapsed}
        inert={sidebarCollapsed}
      >
        <a className={styles.brand} href="#quadro">
          <span className={styles.brandMark} aria-hidden="true">
            K
          </span>
          Kanban
        </a>
        <span className={styles.navLabel}>QUADRO DE TAREFAS</span>
        <a href="#quadro" className={styles.navItem} aria-current="page">
          <Icon name="board" />
          Meu quadro<span className={styles.navNumber}>01</span>
        </a>
        <div className={styles.sidebarNote}>
          <p>
            Grandes ideias.
            <br />
            <strong>Pequenos passos.</strong>
          </p>
          <span>Um lugar para organizar o que vem a seguir.</span>
        </div>
        <div className={styles.sidebarFooter}>
          <span className={styles.footerDot} />
          Mini Kanban<span>01 / 01</span>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeading}>
            <button
              type="button"
              className={styles.sidebarToggle}
              aria-label={
                sidebarCollapsed
                  ? 'Mostrar menu lateral'
                  : 'Ocultar menu lateral'
              }
              aria-expanded={!sidebarCollapsed}
              aria-controls="menu-lateral"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              <Icon
                name={sidebarCollapsed ? 'sidebarOpen' : 'sidebarClose'}
                size={17}
              />
            </button>
            <Icon name="board" size={16} />
            <span>Kanban</span>
            <span className={styles.separator}>/</span>
            <strong>Meu quadro</strong>
          </div>
          <span className={styles.localBadge}>Quadro local</span>
        </header>
        <main id="quadro" className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>CLAREZA PARA O SEU DIA</p>
              <h1>
                Meu quadro<span>.</span>
              </h1>
              <p className={styles.subtitle}>
                Organize as ideias. Acompanhe os passos. Celebre as entregas.
              </p>
            </div>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || board.loading}
              onClick={() => setEditor('new')}
            >
              <Icon name="plus" />
              Nova tarefa
            </button>
          </div>
          <div className={styles.overview}>
            <div className={styles.boardLabel}>
              <Icon name="board" />
              <strong>Visão geral</strong>
              <span>
                {board.tasks.length}{' '}
                {board.tasks.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
            <div className={styles.progressGroup}>
              <span>
                {completed} de {board.tasks.length} concluídas
              </span>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Tarefas concluídas"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <strong>{progress}%</strong>
            </div>
          </div>
          <div className={styles.feedback}>
            {board.error ? (
              <div className={styles.errorBanner} role="alert">
                <span>{board.error}</span>
                <button
                  type="button"
                  onClick={() => void board.reload()}
                  disabled={busy || board.loading}
                >
                  <Icon name="refresh" size={15} />
                  Tentar novamente
                </button>
              </div>
            ) : null}
            <p role="status" aria-live="polite" className={styles.notice}>
              {board.notice ||
                (board.loading ? 'Carregando seu quadro…' : '\u00a0')}
            </p>
          </div>
          <DragDropProvider
            sensors={(defaults) =>
              defaults.map((sensor) =>
                sensor === PointerSensor ? cardPointerSensor : sensor,
              )
            }
            plugins={(defaults) => [
              ...defaults.filter((plugin) => plugin !== Accessibility),
              accessibility,
            ]}
            onDragEnd={(event) => {
              if (event.canceled || !isStatus(event.operation.target?.id))
                return
              const task = board.tasks.find(
                (item) => item.id === event.operation.source?.id,
              )
              if (task) void board.move(task, event.operation.target.id)
            }}
          >
            <div className={styles.board} aria-busy={board.loading}>
              {statuses.map((status) => {
                const tasks = board.tasks.filter(
                  (task) => task.status === status,
                )
                return (
                  <Column
                    key={status}
                    status={status}
                    count={tasks.length}
                    loading={board.loading}
                  >
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        busy={busy || board.loading}
                        saving={board.pending === task.id}
                        onEdit={() => setEditor(task)}
                        onDelete={() => setDeleting(task)}
                        onMove={(status) => void board.move(task, status)}
                      />
                    ))}
                  </Column>
                )
              })}
            </div>
          </DragDropProvider>
          <footer className={styles.boardFooter}>
            <span>
              <Icon name="grip" size={15} />
              Arraste para mover ou use o status de cada tarefa.
            </span>
            <span>Um passo de cada vez.</span>
          </footer>
        </main>
      </div>
      {editor ? (
        <TaskForm
          task={editor === 'new' ? undefined : editor}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={(input) =>
            editor === 'new'
              ? board.create(input)
              : board.update(editor.id, input)
          }
        />
      ) : null}
      {deleting ? (
        <DeleteDialog
          task={deleting}
          busy={busy}
          onClose={() => setDeleting(null)}
          onDelete={() => board.remove(deleting.id)}
        />
      ) : null}
    </div>
  )
}
