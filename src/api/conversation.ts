import { apiRequest } from './client'

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

export async function createConversation(): Promise<Conversation> {
  const data = await apiRequest<CreateConversationResponse>(
    '/conversation/new',
    {
      method: 'POST',
      body: {
        title: 'Nova Conversa',
        status: 'active',
        messages: [],
      },
      auth: true,
    },
  )
  return data.conversation
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
