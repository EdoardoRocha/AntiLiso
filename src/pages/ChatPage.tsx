import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  fetchChatHistory,
  sendChatMessage,
  type ChatMessage,
} from '../api/chat'
import { ChatInput } from '../components/ChatInput'
import { MessageList } from '../components/MessageList'
import { useAuth } from '../context/AuthContext'

export function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingHistory(true)
      setError('')
      try {
        const history = await fetchChatHistory()
        if (!cancelled) setMessages(history)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar o histórico.',
        )
      } finally {
        if (!cancelled) setLoadingHistory(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [logout, navigate])

  async function handleSend(text: string) {
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)
    setError('')

    try {
      const reply = await sendChatMessage(text)
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          text: reply,
        },
      ])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(
        err instanceof ApiError
          ? err.message
          : 'Falha ao enviar. Tente de novo.',
      )
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setSending(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div>
          <p className="brand compact">AntiLiso</p>
          {user?.name ? (
            <p className="chat-user">{user.name}</p>
          ) : null}
        </div>
        <button type="button" className="btn-ghost" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main className="chat-main">
        {loadingHistory ? (
          <div className="message-list empty">
            <p>Carregando conversa…</p>
          </div>
        ) : (
          <MessageList messages={messages} typing={sending} />
        )}
      </main>

      {error ? <p className="chat-error">{error}</p> : null}

      <ChatInput disabled={loadingHistory || sending} onSend={handleSend} />
    </div>
  )
}
