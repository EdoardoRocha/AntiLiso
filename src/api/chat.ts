import { apiRequest } from './client'

export type HistoryPart = {
  text: string
}

export type HistoryItem = {
  role: 'user' | 'model'
  parts: HistoryPart[]
}

export type ChatHistoryResponse = {
  history: HistoryItem[]
}

export type ChatReplyResponse = {
  reply: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function mapHistoryToMessages(history: HistoryItem[]): ChatMessage[] {
  return history
    .filter((item) => item.parts?.some((p) => p.text?.trim()))
    .map((item, index) => ({
      id: `hist-${index}`,
      role: item.role === 'user' ? 'user' : 'assistant',
      text: item.parts.map((p) => p.text).join('\n').trim(),
    }))
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const data = await apiRequest<ChatHistoryResponse>(
    '/transaction/chat/history',
    { auth: true },
  )
  return mapHistoryToMessages(data.history ?? [])
}

export async function sendChatMessage(message: string): Promise<string> {
  const data = await apiRequest<ChatReplyResponse>('/transaction/chat', {
    method: 'POST',
    body: { message },
    auth: true,
  })
  return data.reply
}
