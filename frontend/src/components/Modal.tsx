import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import styles from '../App.module.css'

export function Modal({
  title,
  titleId,
  busy,
  onClose,
  children,
}: {
  title: string
  titleId: string
  busy: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    // O dialog nativo mantém a navegação na janela; ao fechar, restauro o foco anterior.
    const previous = document.activeElement
    const dialog = ref.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className={styles.modalHeading}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          disabled={busy}
          aria-label="Fechar janela"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
