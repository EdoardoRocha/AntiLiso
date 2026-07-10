import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../api/chat'

type MessageListProps = {
  messages: ChatMessage[]
  typing?: boolean
}

export function MessageList({ messages, typing = false }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  if (messages.length === 0 && !typing) {
    return (
      <div className="message-list empty">
        <p>Nenhuma conversa ainda.</p>
        <p className="hint">Envie um gasto ou pergunta para começar.</p>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`bubble-row ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className={`bubble ${message.role}`}>
            {message.text}
          </div>
        </div>
      ))}
      {typing ? (
        <div className="bubble-row assistant">
          <div className="bubble assistant typing">Digitando…</div>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  )
}
