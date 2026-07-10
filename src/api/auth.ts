import { apiRequest, setStoredUser, setToken, type StoredUser } from './client'

export type LoginResponse = {
  message: string
  token: string
  user: {
    _id: string
    name: string
    email: string
    phone: string
  }
}

export type RegisterResponse = {
  message: string
  token: string
  userId: string
}

export async function login(
  email: string,
  password: string,
): Promise<StoredUser> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  setToken(data.token)
  const user: StoredUser = {
    id: data.user._id,
    name: data.user.name,
    email: data.user.email,
  }
  setStoredUser(user)
  return user
}

export async function register(input: {
  name: string
  email: string
  password: string
  phone: string
}): Promise<StoredUser> {
  const data = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: input,
  })

  setToken(data.token)
  const user: StoredUser = {
    id: data.userId,
    name: input.name,
    email: input.email,
  }
  setStoredUser(user)
  return user
}
