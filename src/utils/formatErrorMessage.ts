import { ApiError } from '../api/client'

const QUOTA_MESSAGE =
  'O limite de uso da IA foi atingido. Tente novamente em alguns minutos.'
const INTERNAL_MESSAGE =
  'Não foi possível processar sua mensagem agora. Tente de novo em instantes.'
const GENERIC_MESSAGE = 'Não foi possível completar a ação. Tente novamente.'

function looksLikeTechnicalPayload(message: string): boolean {
  const trimmed = message.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true
  const lower = trimmed.toLowerCase()
  return (
    lower.includes('resource_exhausted') ||
    lower.includes('generativelanguage.googleapis.com') ||
    lower.includes('"error"') ||
    lower.includes('quota exceeded')
  )
}

export function formatErrorMessage(
  err: unknown,
  fallback = GENERIC_MESSAGE,
): string {
  if (!(err instanceof Error)) return fallback

  const status = err instanceof ApiError ? err.status : undefined
  const raw = err.message.trim()
  const lower = raw.toLowerCase()

  if (
    status === 429 ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota')
  ) {
    return QUOTA_MESSAGE
  }

  if (
    (status !== undefined && status >= 500) ||
    lower.includes('erro interno')
  ) {
    return INTERNAL_MESSAGE
  }

  if (looksLikeTechnicalPayload(raw) || raw.length > 120) {
    return GENERIC_MESSAGE
  }

  if (raw) return raw

  return fallback
}
