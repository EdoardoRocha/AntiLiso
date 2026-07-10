import { useState, type FormEvent, type KeyboardEvent } from 'react'

type ChatInputProps = {
  disabled?: boolean
  onSend: (message: string) => Promise<void> | void
}

export function ChatInput({ disabled = false, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')

  async function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    setValue('')
    await onSend(trimmed)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        rows={1}
        placeholder="Ex: Gastei 50 reais com almoço"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Mensagem"
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Enviar
      </button>
    </form>
  )
}
