import { useEffect, useRef, useState, type FormEvent } from 'react'

type NewConversationDialogProps = {
  creating?: boolean
  onCancel: () => void
  onConfirm: (title?: string) => void
}

const MAX_TITLE_LENGTH = 60

export function NewConversationDialog({
  creating = false,
  onCancel,
  onConfirm,
}: NewConversationDialogProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !creating) onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [creating, onCancel])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (creating) return
    const trimmed = title.trim()
    onConfirm(trimmed || undefined)
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!creating) onCancel()
      }}
    >
      <form
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="new-conversation-title" className="dialog-title">
          Nova conversa
        </h2>
        <p className="dialog-message">
          Dê um nome opcional. Se deixar em branco, usaremos um resumo da
          primeira mensagem.
        </p>
        <label className="dialog-field">
          <span className="dialog-label">Nome</span>
          <input
            ref={inputRef}
            type="text"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Ex: Gastos de março"
            disabled={creating}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Nome da conversa"
          />
        </label>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancel}
            disabled={creating}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
}
