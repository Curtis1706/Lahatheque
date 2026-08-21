import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const IS_PROD = process.env.NODE_ENV === 'production'

const ACCESS_COOKIE_MAX_AGE = 12 * 60 * 60
const REFRESH_COOKIE_MAX_AGE_CAP = 7 * 24 * 60 * 60
const UI_COOKIE_MAX_AGE = 12 * 60 * 60

const HTTP_ONLY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function computeTokenMaxAge(token: string, cap: number): number {
  const payload = parseJwt(token)
  if (!payload?.exp) return cap
  const remaining = payload.exp - Math.floor(Date.now() / 1000)
  return Math.min(Math.max(remaining, 60), cap)
}

function setTokenCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string | null
) {
  response.cookies.set('laha_access', accessToken, {
    ...HTTP_ONLY_COOKIE_OPTIONS,
    maxAge: computeTokenMaxAge(accessToken, ACCESS_COOKIE_MAX_AGE),
  })
  if (refreshToken) {
    response.cookies.set('laha_refresh', refreshToken, {
      ...HTTP_ONLY_COOKIE_OPTIONS,
      maxAge: computeTokenMaxAge(refreshToken, REFRESH_COOKIE_MAX_AGE_CAP),
    })
  }
}

function setUiCookie(response: NextResponse, userData: any, accessToken?: string) {
  const accessExpiresAt = accessToken ? (parseJwt(accessToken)?.exp ?? null) : null
  const uiPayload = {
    id: userData.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
    active_roles: userData.active_roles || [],
    is_verified: userData.is_verified,
    is_active: userData.is_active,
    profile_photo: userData.profile_photo || null,
    teacher_profile: userData.teacher_profile || null,
    author_profile: userData.author_profile || null,
    has_active_family_subscription: !!userData.has_active_family_subscription,
    access_expires_at: accessExpiresAt,
  }
  response.cookies.set('user_session_client', JSON.stringify(uiPayload), {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: UI_COOKIE_MAX_AGE,
  })
}

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  country: z.string().optional().default('BJ'),
  role: z.enum(['student', 'teacher', 'author', 'publisher', 'university']).default('student'),
})

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const validation = registerSchema.safeParse(rawBody)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors as Record<string, string[] | undefined>
      const firstErrorKey = Object.keys(fieldErrors)[0]
      const errorMessage = firstErrorKey && fieldErrors[firstErrorKey]?.[0]
        ? `${firstErrorKey}: ${fieldErrors[firstErrorKey]?.[0]}`
        : 'Données d\'inscription invalides'

      return NextResponse.json(
        { error: errorMessage, details: fieldErrors },
        { status: 400 }
      )
    }

    const response = await fetch(`${DJANGO_API_URL}/v1/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    })

    const data = await response.json()

    if (!response.ok) {
      const errMsg = typeof data === 'string' 
        ? data 
        : (data.error || data.detail || (data.email ? `Email: ${data.email[0]}` : 'Erreur d\'inscription'))
      return NextResponse.json({ error: errMsg }, { status: response.status })
    }

    const accessToken = data.tokens?.access || data.access || data.token
    const refreshToken = data.tokens?.refresh || data.refresh

    const nextResponse = NextResponse.json({
      success: true,
      user: data.user,
    }, { status: 201 })

    if (accessToken) {
      setTokenCookies(nextResponse, accessToken, refreshToken)
    }
    if (data.user) {
      setUiCookie(nextResponse, data.user, accessToken)
    }

    return nextResponse
  } catch (error) {
    console.error('[BFF Register] Internal error:', error)
    return NextResponse.json(
      { error: 'Impossible de contacter le serveur d\'authentification' },
      { status: 500 }
    )
  }
}
