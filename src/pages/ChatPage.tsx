import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  isDefaultConversationTitle,
  sendConversationMessage,
  summarizeMessage,
  updateConversationTitle,
  type ChatMessage,
  type Conversation,
} from '../api/conversation'
import { ChatInput } from '../components/ChatInput'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { ErrorDialog } from '../components/ErrorDialog'
import { MessageList } from '../components/MessageList'
import { NewConversationDialog } from '../components/NewConversationDialog'
import { useAuth } from '../context/AuthContext'
import { formatErrorMessage } from '../utils/formatErrorMessage'

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newConversationOpen, setNewConversationOpen] = useState(false)

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
      setErrorMessage(null)
      try {
        await refreshConversations()
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized()
          return
        }
        setErrorMessage(
          formatErrorMessage(
            err,
            'Não foi possível carregar as conversas.',
          ),
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
      setErrorMessage(null)
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
        setErrorMessage(
          formatErrorMessage(
            err,
            'Não foi possível carregar as mensagens.',
          ),
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

  function openNewConversationDialog() {
    setErrorMessage(null)
    setNewConversationOpen(true)
  }

  async function handleCreateConversation(title?: string) {
    setCreating(true)
    setErrorMessage(null)
    try {
      const conversation = await createConversation(title)
      setConversations((prev) =>
        sortByUpdatedDesc([conversation, ...prev]),
      )
      setNewConversationOpen(false)
      setSidebarOpen(false)
      navigate(`/chat/${conversation._id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized()
        return
      }
      setErrorMessage(
        formatErrorMessage(err, 'Não foi possível criar a conversa.'),
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

  async function maybeUpdateTitleFromFirstMessage(
    activeId: string,
    text: string,
    list: Conversation[],
  ) {
    const active = list.find((item) => item._id === activeId)
    if (!active || !isDefaultConversationTitle(active.title)) return

    const summary = summarizeMessage(text)
    const updated = await updateConversationTitle(activeId, summary)
    const nextTitle = updated?.title ?? summary
    const nextUpdatedAt = updated?.updatedAt ?? new Date().toISOString()

    setConversations((prev) =>
      sortByUpdatedDesc(
        prev.map((item) =>
          item._id === activeId
            ? { ...item, title: nextTitle, updatedAt: nextUpdatedAt }
            : item,
        ),
      ),
    )
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
    setErrorMessage(null)

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
      let list = conversations
      try {
        list = await refreshConversations()
      } catch {
        // keep local list if refresh fails
      }
      await maybeUpdateTitleFromFirstMessage(conversationId, text, list)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized()
        return
      }
      setErrorMessage(
        formatErrorMessage(err, 'Falha ao enviar. Tente de novo.'),
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
          onNew={openNewConversationDialog}
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
                  onClick={openNewConversationDialog}
                  disabled={creating || loadingConversations}
                >
                  Iniciar conversa
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

          {hasActiveConversation ? (
            <ChatInput disabled={chatBusy} onSend={handleSend} />
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <ErrorDialog
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      ) : null}

      {newConversationOpen ? (
        <NewConversationDialog
          creating={creating}
          onCancel={() => {
            if (!creating) setNewConversationOpen(false)
          }}
          onConfirm={(title) => void handleCreateConversation(title)}
        />
      ) : null}
    </div>
  )
}
