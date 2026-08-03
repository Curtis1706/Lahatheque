import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const IS_PROD = process.env.NODE_ENV === 'production'

// Constantes centralisées

/**
 * Plafond du cookie d'accès (12h).
 * Le maxAge réel est toujours ≤ à la durée restante du JWT lui-même.
 */
const ACCESS_COOKIE_MAX_AGE = 12 * 60 * 60

/**
 * Plafond du cookie de refresh (7 jours).
 * Le maxAge réel est dérivé du payload du refresh token Django — pas une durée fixe.
 * Cela évite la session glissante infinie si Django n'effectue pas de rotation.
 */
const REFRESH_COOKIE_MAX_AGE_CAP = 7 * 24 * 60 * 60  // 7 jours max

/** Durée du cookie UI non-sensible (12h). Aligné sur l'access token. */
const UI_COOKIE_MAX_AGE = 12 * 60 * 60

// Options des cookies HttpOnly (tokens secrets)
const HTTP_ONLY_COOKIE_OPTIONS = {
  httpOnly: true,      // Inaccessible depuis JS : protège contre XSS
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
}

// ─── Helper : calcul sécurisé de maxAge depuis le payload JWT ───────────────
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

/**
 * Calcule le maxAge d'un cookie depuis le payload JWT du token.
 * - Jamais plus long que le JWT lui-même (Math.min).
 * - Jamais moins de 60s pour absorber la latence réseau (Math.max).
 * - Plafonné par `cap` pour ne pas dépasser la politique de session souhaitée.
 */
function computeTokenMaxAge(token: string, cap: number): number {
  const payload = parseJwt(token)
  if (!payload?.exp) return cap
  const remaining = payload.exp - Math.floor(Date.now() / 1000)
  return Math.min(Math.max(remaining, 60), cap)
}

// Helper : définir les cookies d'accès et de refresh (HttpOnly)
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
    // Dériver le maxAge du payload du refresh token Django (exp fixe, non glissant)
    // plutôt qu'une constante fixe — évite une session glissante infinie.
    response.cookies.set('laha_refresh', refreshToken, {
      ...HTTP_ONLY_COOKIE_OPTIONS,
      maxAge: computeTokenMaxAge(refreshToken, REFRESH_COOKIE_MAX_AGE_CAP),
    })
  }
}

/**
 * Définit le cookie UI non-HttpOnly.
 * RÈGLE : Ne jamais y inclure `access` ni `refresh`.
 * Ce cookie est lisible par JS (nécessaire pour les hooks UI),
 * mais NE contient PAS les secrets JWT.
 *
 * `access_expires_at` est l'horodatage Unix (secondes) de l'expiration du token d'accès.
 * C'est un timestamp public (pas un secret) — il permet au client de planifier
 * le refresh proactif sans avoir à deviner la durée de vie côté Django.
 */
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
    // Timestamp Unix de l'expiration du token d'accès — pas un secret, juste une horloge.
    // Permet au client de planifier le refresh proactif sur le vrai exp.
    access_expires_at: accessExpiresAt,
    // ⚠️ Aucun champ `token`, `access`, `refresh` ici
  }
  response.cookies.set('user_session_client', JSON.stringify(uiPayload), {
    httpOnly: false,     // Lisible par les hooks UI — sans token
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: UI_COOKIE_MAX_AGE,
  })
}


// POST : Login

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const validation = loginSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Identifiants invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const response = await fetch(`${DJANGO_API_URL}/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const accessToken = data.tokens?.access || data.access || data.token
    const refreshToken = data.tokens?.refresh || data.refresh

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token returned' }, { status: 500 })
    }

    // Réponse : ne jamais inclure les tokens dans le corps JSON
    const nextResponse = NextResponse.json(
      { success: true, user: data.user || null },
      { status: 200 }
    )

    setTokenCookies(nextResponse, accessToken, refreshToken)
    if (data.user) setUiCookie(nextResponse, data.user, accessToken)

    return nextResponse

  } catch (error) {
    console.error('[BFF Session] Login error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

//DELETE : Logout

export async function DELETE(request: NextRequest) {
  const refreshToken = request.cookies.get('laha_refresh')?.value

  if (refreshToken) {
    try {
      await fetch(`${DJANGO_API_URL}/v1/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
    } catch (e) {
      console.error('[BFF Session] Django logout failed, ignoring.', e)
    }
  }

  const nextResponse = NextResponse.json({ success: true })
  nextResponse.cookies.delete('laha_access')
  nextResponse.cookies.delete('laha_refresh')
  nextResponse.cookies.delete('user_session_client')

  return nextResponse
}

//GET : Vérification de session

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('laha_access')?.value

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const response = await fetch(`${DJANGO_API_URL}/v1/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: response.status })
    }

    const userData = await response.json()

    // Réponse : uniquement l'état d'auth + données profil UI. Pas de token.
    const sessionRes = NextResponse.json({ authenticated: true, user: userData })

    // Rafraîchit le cookie UI (sans token) pour garder les données profil à jour
    // Passe l'accessToken pour que access_expires_at soit synchronisé avec le vrai exp.
    setUiCookie(sessionRes, userData, accessToken)

    return sessionRes

  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

// ─── PATCH : Migration transitoire localStorage → cookies HttpOnly ───────────
// TODO (prod) : Désactiver ou supprimer ce endpoint une fois que localStorage
//               n'est plus utilisé en production — il réduit la surface d'attaque.

const patchSchema = z.object({
  access: z.string().min(1, 'Token requis'),
  refresh: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const validation = patchSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Payload invalide', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { access, refresh } = validation.data

    // Vérifier que le token est valide côté Django
    const verifyResponse = await fetch(`${DJANGO_API_URL}/v1/me/`, {
      headers: { Authorization: `Bearer ${access}` },
    })

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 })
    }

    const userData = await verifyResponse.json()

    // Réponse : succès + profil UI. Pas de token dans le corps.
    const nextResponse = NextResponse.json({ success: true, user: userData })

    setTokenCookies(nextResponse, access, refresh)
    setUiCookie(nextResponse, userData, access)

    return nextResponse

  } catch (error) {
    console.error('[BFF Session] Migration error:', error)
    return NextResponse.json({ error: 'Erreur lors de la migration' }, { status: 500 })
  }
}

// ─── PUT : Refresh silencieux ────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  // Lire le refresh token depuis le cookie HttpOnly uniquement
  const refreshToken = request.cookies.get('laha_refresh')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'Pas de token de rafraîchissement' }, { status: 401 })
  }

  try {
    const response = await fetch(`${DJANGO_API_URL}/v1/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      const nextResponse = NextResponse.json({ error: 'Session expirée' }, { status: 401 })
      nextResponse.cookies.delete('laha_access')
      nextResponse.cookies.delete('laha_refresh')
      nextResponse.cookies.delete('user_session_client')
      return nextResponse
    }

    const data = await response.json()
    const newAccessToken = data.access
    const newRefreshToken = data.refresh

    if (!newAccessToken) {
      return NextResponse.json({ error: 'Refresh échoué, pas de nouveau token' }, { status: 500 })
    }

    // Réponse : succès uniquement. Pas de token dans le corps JSON.
    const nextResponse = NextResponse.json({ success: true })

    setTokenCookies(nextResponse, newAccessToken, newRefreshToken)

    // Mettre à jour le cookie UI avec le nouveau access_expires_at
    // On ne peut pas appeler /v1/me/ ici sans ralentir le refresh, donc
    // on met à jour uniquement le timestamp d'expiration dans le cookie existant.
    const rawClientSession = request.cookies.get('user_session_client')?.value
    if (rawClientSession) {
      try {
        const clientSession = JSON.parse(decodeURIComponent(rawClientSession))
        // S'assurer qu'aucun token ne traîne + mettre à jour l'expiration
        const { token: _t, access: _a, refresh: _r, ...safeSession } = clientSession
        const newPayload = {
          ...safeSession,
          access_expires_at: parseJwt(newAccessToken)?.exp ?? null,
        }
        nextResponse.cookies.set('user_session_client', JSON.stringify(newPayload), {
          httpOnly: false,
          secure: IS_PROD,
          sameSite: 'lax',
          path: '/',
          maxAge: UI_COOKIE_MAX_AGE,
        })
      } catch (e) {
        console.error('[BFF Session] Failed to parse user_session_client during refresh', e)
      }
    }

    return nextResponse

  } catch (error) {
    console.error('[BFF Session] Refresh error:', error)
    return NextResponse.json({ error: 'Erreur de rafraîchissement' }, { status: 500 })
  }
}
