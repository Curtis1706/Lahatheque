// Helper pour l'accès aux tokens (Passe 1 de la migration BFF)

const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const ACTIVE_ROLE_KEY = 'active_role'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getActiveRole(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_ROLE_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function setActiveRole(role: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_ROLE_KEY, role)
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ACTIVE_ROLE_KEY)
}
