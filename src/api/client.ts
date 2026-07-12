const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'https://antiliso-api.apichatzon.online/api/v1'

const TOKEN_KEY = 'antiliso_token'
const USER_KEY = 'antiliso_user'

export type StoredUser = {
  id: string
  name: string
  email?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  clearToken()
  clearStoredUser()
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (!token) {
      throw new ApiError('Não autenticado', 401)
    }
    headers.Authorization = `Bearer ${token}`
  }

  const requestUrl = `${API_BASE}${path}`
  // #region agent log
  fetch('http://127.0.0.1:7879/ingest/e3e929ba-faea-407b-83e0-ae6bb701e190',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426b9e'},body:JSON.stringify({sessionId:'426b9e',location:'client.ts:apiRequest:beforeFetch',message:'API request starting',data:{apiBase:API_BASE,path,method,requestUrl,origin:typeof window!=='undefined'?window.location.origin:null},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  let response: Response
  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7879/ingest/e3e929ba-faea-407b-83e0-ae6bb701e190',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426b9e'},body:JSON.stringify({sessionId:'426b9e',location:'client.ts:apiRequest:fetchError',message:'Fetch failed (likely CORS or network)',data:{requestUrl,errorName:err instanceof Error?err.name:'unknown',errorMessage:err instanceof Error?err.message:String(err)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw err
  }

  // #region agent log
  fetch('http://127.0.0.1:7879/ingest/e3e929ba-faea-407b-83e0-ae6bb701e190',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'426b9e'},body:JSON.stringify({sessionId:'426b9e',location:'client.ts:apiRequest:afterFetch',message:'Fetch response received',data:{requestUrl,status:response.status,ok:response.ok,corsHeader:response.headers.get('access-control-allow-origin')},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Erro ${response.status}`

    if (response.status === 401) {
      clearAuth()
    }

    throw new ApiError(message, response.status)
  }

  return data as T
}
