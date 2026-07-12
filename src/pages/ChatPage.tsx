import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  sendConversationMessage,
  type ChatMessage,
  type Conversation,
} from '../api/conversation'
import { ChatInput } from '../components/ChatInput'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { MessageList } from '../components/MessageList'
import { useAuth } from '../context/AuthContext'

function sortByUpdatedDesc(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleUnauthorized = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const refreshConversations = useCallback(async (): Promise<
    Conversation[]
  > => {
    const list = sortByUpdatedDesc(await fetchConversations())
    setConversations(list)
    return list
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadConversations() {
      setLoadingConversations(true)
      setError('')
      try {
        await refreshConversations()
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized()
          return
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar as conversas.',
        )
      } finally {
        if (!cancelled) setLoadingConversations(false)
      }
    }

    void loadConversations()
    return () => {
      cancelled = true
    }
  }, [handleUnauthorized, refreshConversations])

  useEffect(() => {
    if (loadingConversations || conversationId || conversations.length === 0) {
      return
    }
    navigate(`/chat/${conversations[0]._id}`, { replace: true })
  }, [conversationId, conversations, loadingConversations, navigate])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let cancelled = false

    async function loadMessages() {
      setLoadingMessages(true)
      setError('')
      setMessages([])
      try {
        const history = await fetchConversationMessages(conversationId!)
        if (!cancelled) setMessages(history)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized()
          return
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar as mensagens.',
        )
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    }

    void loadMessages()
    return () => {
      cancelled = true
    }
  }, [conversationId, handleUnauthorized])

  async function handleNewConversation() {
    setCreating(true)
    setError('')
    try {
      const conversation = await createConversation()
      setConversations((prev) =>
        sortByUpdatedDesc([conversation, ...prev]),
      )
      setSidebarOpen(false)
      navigate(`/chat/${conversation._id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized()
        return
      }
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível criar a conversa.',
      )
    } finally {
      setCreating(false)
    }
  }

  function handleSelectConversation(id: string) {
    setSidebarOpen(false)
    if (id !== conversationId) {
      navigate(`/chat/${id}`)
    }
  }

  async function handleSend(text: string) {
    if (!conversationId) return

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)
    setError('')

    try {
      const reply = await sendConversationMessage(conversationId, text)
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          text: reply,
        },
      ])
      void refreshConversations().catch(() => undefined)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized()
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

  const hasActiveConversation = Boolean(conversationId)
  const chatBusy = loadingMessages || sending || creating

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-left">
          <button
            type="button"
            className="btn-ghost sidebar-toggle"
            aria-label="Abrir conversas"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            Menu
          </button>
          <div>
            <p className="brand compact">AntiLiso</p>
            {user?.name ? <p className="chat-user">{user.name}</p> : null}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <div className="chat-body">
        <ConversationSidebar
          conversations={conversations}
          activeId={conversationId}
          loading={loadingConversations}
          creating={creating}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={handleSelectConversation}
          onNew={() => void handleNewConversation()}
        />

        <div className="chat-panel">
          <main className="chat-main">
            {!hasActiveConversation ? (
              <div className="message-list empty">
                <p>Nenhuma conversa selecionada.</p>
                <p className="hint">
                  Crie uma nova conversa para começar a falar com o agente.
                </p>
                <button
                  type="button"
                  className="btn-primary empty-cta"
                  onClick={() => void handleNewConversation()}
                  disabled={creating || loadingConversations}
                >
                  {creating ? 'Criando…' : 'Iniciar conversa'}
                </button>
              </div>
            ) : loadingMessages ? (
              <div className="message-list empty">
                <p>Carregando conversa…</p>
              </div>
            ) : (
              <MessageList messages={messages} typing={sending} />
            )}
          </main>

          {error ? <p className="chat-error">{error}</p> : null}

          {hasActiveConversation ? (
            <ChatInput disabled={chatBusy} onSend={handleSend} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
