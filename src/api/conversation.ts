import { apiRequest } from './client'

export const DEFAULT_CONVERSATION_TITLE = 'Nova Conversa'

export type Conversation = {
  _id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type ApiMessage = {
  role: 'user' | 'model'
  parts: string
  timestamp: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp?: string
}

type CreateConversationResponse = {
  message: string
  conversation: Conversation & { messages?: unknown[] }
}

type SendMessageResponse = {
  reply: string
}

export function isDefaultConversationTitle(title: string | undefined): boolean {
  const trimmed = title?.trim() ?? ''
  return !trimmed || trimmed === DEFAULT_CONVERSATION_TITLE
}

export function summarizeMessage(text: string, maxLen = 48): string {
  const cleaned = text.trim().replace(/\s+/g, ' ')
  if (!cleaned) return DEFAULT_CONVERSATION_TITLE
  if (cleaned.length <= maxLen) return cleaned
  return `${cleaned.slice(0, Math.max(1, maxLen - 1)).trimEnd()}…`
}

export function mapApiMessagesToChat(messages: ApiMessage[]): ChatMessage[] {
  return messages
    .filter((item) => typeof item.parts === 'string' && item.parts.trim())
    .map((item, index) => ({
      id: item.timestamp ? `msg-${item.timestamp}-${index}` : `msg-${index}`,
      role: item.role === 'user' ? 'user' : 'assistant',
      text: item.parts.trim(),
      timestamp: item.timestamp,
    }))
}

export async function createConversation(
  title?: string,
): Promise<Conversation> {
  const data = await apiRequest<CreateConversationResponse>(
    '/conversation/new',
    {
      method: 'POST',
      body: {
        title: title?.trim() || DEFAULT_CONVERSATION_TITLE,
        status: 'active',
        messages: [],
      },
      auth: true,
    },
  )
  return data.conversation
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<Conversation | null> {
  try {
    const data = await apiRequest<Conversation | { conversation: Conversation }>(
      `/conversation/${conversationId}`,
      {
        method: 'PATCH',
        body: { title },
        auth: true,
      },
    )
    if (data && typeof data === 'object' && 'conversation' in data) {
      return data.conversation
    }
    if (data && typeof data === 'object' && '_id' in data) {
      return data
    }
    return null
  } catch {
    return null
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  const data = await apiRequest<Conversation[]>('/conversation/', {
    auth: true,
  })
  return Array.isArray(data) ? data : []
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const data = await apiRequest<ApiMessage[]>(
    `/conversation/${conversationId}/messages`,
    { auth: true },
  )
  return mapApiMessagesToChat(Array.isArray(data) ? data : [])
}

export async function sendConversationMessage(
  conversationId: string,
  message: string,
): Promise<string> {
  const data = await apiRequest<SendMessageResponse>(
    `/conversation/${conversationId}/message`,
    {
      method: 'POST',
      body: { conversationId, message },
      auth: true,
    },
  )
  return data.reply
}
