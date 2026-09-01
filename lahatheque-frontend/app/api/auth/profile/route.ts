import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DJANGO_API_URL = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api')
  .replace(/\/+$/, '')
  .replace('localhost:8000', '127.0.0.1:8000')
  .replace(/\/v1$/, '')
  .replace(/\/api$/, '') + '/api'

const IS_PROD = process.env.NODE_ENV === 'production'
const UI_COOKIE_MAX_AGE = 12 * 60 * 60

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

function updateUiSessionCookie(response: NextResponse, userData: any, accessToken?: string) {
  if (!userData) return
  const accessExpiresAt = accessToken ? (parseJwt(accessToken)?.exp ?? null) : null
  const avatarUrl = userData.avatar_url || userData.avatar || userData.profile_photo || null
  const uiPayload = {
    id: userData.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
    role: userData.role,
    active_roles: userData.active_roles || [userData.role],
    avatar_url: avatarUrl,
    avatar: avatarUrl,
    profile_photo: avatarUrl,
    country: userData.country || 'BJ',
    phone: userData.phone || '',
    university_affiliation: userData.university_affiliation || '',
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

export async function GET(request: NextRequest) {
  const token = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const targetUrl = `${DJANGO_API_URL}/v1/auth/profile/`
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[API Auth Profile GET] Erreur:', err)
    return NextResponse.json({ success: false, error: 'Impossible de joindre le serveur Django' }, { status: 502 })
  }
}

export async function PATCH(request: NextRequest) {
  const startTime = Date.now()
  const token = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return NextResponse.json({ success: false, error: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') || ''
  const targetUrl = `${DJANGO_API_URL}/v1/auth/profile/`
  console.log(`[API Auth Profile] PATCH reçu. Content-Type: ${contentType}. Cible: ${targetUrl}`)

  let forwardBody: any = undefined
  const forwardHeaders = new Headers()
  forwardHeaders.set('Authorization', `Bearer ${token}`)

  try {
    if (contentType.includes('multipart/form-data')) {
      const incomingFormData = await request.formData()
      const outgoingFormData = new FormData()
      for (const [key, value] of incomingFormData.entries()) {
        outgoingFormData.append(key, value)
      }
      forwardBody = outgoingFormData
    } else {
      forwardBody = await request.text()
      forwardHeaders.set('Content-Type', contentType || 'application/json')
    }
  } catch (parseErr: any) {
    console.error('[API Auth Profile] Erreur parsing body:', parseErr)
    return NextResponse.json({ success: false, error: 'Format de données invalide.' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers: forwardHeaders,
      body: forwardBody,
      cache: 'no-store',
      signal: controller.signal,
      // @ts-ignore
      duplex: 'half',
    })
    const elapsed = Date.now() - startTime
    const json = await res.json()
    const responsePayload = {
      ...json,
      _debug: {
        elapsed_ms: elapsed,
        django_status: res.status,
        target_url: targetUrl,
        timestamp: new Date().toISOString(),
      }
    }
    const nextRes = NextResponse.json(responsePayload, { status: res.status })

    if (res.ok && json.data) {
      updateUiSessionCookie(nextRes, json.data, token)
    }

    return nextRes
  } catch (err: any) {
    clearTimeout(timeoutId)
    const elapsed = Date.now() - startTime
    if (err?.name === 'AbortError') {
      console.error(`[API Auth Profile TIMEOUT] Django n'a pas répondu en 25s pour ${targetUrl}`)
      return NextResponse.json(
        { success: false, error: "Le serveur de stockage n'a pas répondu dans les délais (25s)." },
        { status: 504 }
      )
    }
    console.error(`[API Auth Profile NET ERROR] Exception après ${elapsed}ms:`, err)
    return NextResponse.json(
      { success: false, error: `Erreur réseau vers le backend: ${err.message || err}` },
      { status: 502 }
    )
  }
}
