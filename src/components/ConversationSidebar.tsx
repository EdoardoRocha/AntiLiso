import type { Conversation } from '../api/conversation'

type ConversationSidebarProps = {
  conversations: Conversation[]
  activeId?: string
  loading: boolean
  creating?: boolean
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onNew: () => void
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `há ${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `há ${diffDays}d`

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function ConversationSidebar({
  conversations,
  activeId,
  loading,
  creating = false,
  open,
  onClose,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`conversation-sidebar${open ? ' open' : ''}`}
        aria-label="Conversas"
      >
        <div className="sidebar-header">
          <p className="sidebar-title">Conversas</p>
          <button
            type="button"
            className="btn-primary sidebar-new"
            onClick={onNew}
            disabled={creating}
          >
            {creating ? 'Criando…' : 'Nova conversa'}
          </button>
        </div>

        <div className="sidebar-list">
          {loading ? (
            <p className="sidebar-empty">Carregando…</p>
          ) : conversations.length === 0 ? (
            <p className="sidebar-empty">Nenhuma conversa ainda.</p>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation._id === activeId
              return (
                <button
                  key={conversation._id}
                  type="button"
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                  onClick={() => onSelect(conversation._id)}
                >
                  <span className="sidebar-item-title">
                    {conversation.title || 'Nova Conversa'}
                  </span>
                  <span className="sidebar-item-date">
                    {formatRelativeDate(conversation.updatedAt)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
