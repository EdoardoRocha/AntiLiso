import { useEffect, useRef } from 'react'

type ErrorDialogProps = {
  message: string
  onClose: () => void
}

export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="error-dialog-title" className="dialog-title">
          Ops, algo deu errado
        </h2>
        <p id="error-dialog-message" className="dialog-message">
          {message}
        </p>
        <div className="dialog-actions">
          <button
            ref={buttonRef}
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
