import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Headers explicitement autorisés à être transférés au backend
const ALLOWED_HEADERS = [
  'content-type',
  'content-length',
  'accept',
  'user-agent',
  'x-requested-with',
  'accept-language',
  'authorization',
  'x-vault-password', // Authentification du Video Vault
]

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const pathStr = params.path.join('/')
    const url = new URL(request.url)
    
    // Reconstruire l'URL avec un slash final par défaut pour Django (APPEND_SLASH)
    let targetPath = `${DJANGO_API_URL}/v1/${pathStr}`
    
    // Support pour les anciennes routes Django directement sous /api/ (ex: tts, proxy)
    if (pathStr.startsWith('legacy/')) {
      targetPath = `${DJANGO_API_URL}/${pathStr.replace('legacy/', '')}`
    }

    if (!pathStr.includes('.') && !targetPath.endsWith('/')) {
      targetPath += '/'
    }
    const targetUrl = `${targetPath}${url.search}`

    // 1. Validation CSRF stricte sur Origin/Referer pour les mutations
    // EXEMPTION: l'endpoint d'activation QR est sécurisé par le token unique lui-même
    // Safari sur iOS n'envoie pas toujours un header Origin depuis un QR code scanné
    // BUG FIX: on retire le slash final avant de comparer
    const isQrActivation = (
      pathStr.replace(/\/$/, '') === 'library/livre/activate' ||
      pathStr.replace(/\/$/, '') === 'library/qr/activate'
    )
    
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !isQrActivation) {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      const requestOrigin = request.nextUrl.origin
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host')

      const checkUrlMatches = (urlStr: string | null) => {
        if (!urlStr) return false
        try {
          if (requestOrigin && urlStr.startsWith(requestOrigin)) return true
          if (APP_URL && urlStr.startsWith(APP_URL)) return true
          if (urlStr.startsWith('http://localhost') || urlStr.startsWith('http://127.0.0.1')) return true
          
          const parsed = new URL(urlStr)
          if (host && (parsed.host === host || parsed.host.split(':')[0] === host.split(':')[0])) return true
          if (parsed.hostname.endsWith('lahacademia.com') || parsed.hostname.endsWith('lahaacademia.com')) return true
          if (parsed.hostname.endsWith('vercel.app')) return true
        } catch {
          // Format d'URL invalide
        }
        return false
      }

      const isValidOrigin = checkUrlMatches(origin) || checkUrlMatches(referer)

      if (!isValidOrigin) {
        console.warn(`[BFF CSRF BLOCKED] Path: ${pathStr}, Origin: ${origin}, Referer: ${referer}`)
        return NextResponse.json({ error: 'Invalid origin or referer (CSRF Protection)' }, { status: 403 })
      }
      console.log(`[BFF] ${request.method} ${pathStr} - Origin OK: ${origin || referer}`)
    }

    // 2. Préparation des en-têtes
    const headers = new Headers()
    request.headers.forEach((value, key) => {
      if (ALLOWED_HEADERS.includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    // 3. Injection du JWT depuis le cookie HttpOnly (sauf si mode Guest forcé ou activation QR)
    // IMPORTANT: Pour l'activation QR, on n'injecte JAMAIS le JWT existant.
    // @authentication_classes([]) est configuré côté Django — un JWT expiré causerait
    // des erreurs 401 intermittentes sur certains téléphones qui ont un vieux cookie.
    const forceGuest = request.headers.get('x-laha-guest-only') === 'true'
    if (!forceGuest && !isQrActivation) {
      const accessToken = request.cookies.get('laha_access')?.value
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }
    }

    // 4. Configuration du Proxy avec Timeout de 60s
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    const fetchOptions: RequestInit & { duplex?: 'half' } = {
      method: request.method,
      headers,
      signal: controller.signal,
      redirect: 'manual',
      cache: 'no-store',
    }

    // Intercepter les uploads multipart pour éviter les problèmes de stream sous Vercel/Node.js
    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')
    
    if (isMultipart && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const formData = await request.formData()
        fetchOptions.body = formData
        // Ne pas définir manuellement Content-Type ou Content-Length pour laisser fetch générer les bons en-têtes avec la boundary
        headers.delete('content-type')
        headers.delete('content-length')
      } catch (err) {
        console.error('[BFF Proxy] Failed to parse upload formData:', err)
        if (request.body) {
          fetchOptions.body = request.body
          fetchOptions.duplex = 'half'
        }
      }
    } else if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      fetchOptions.body = request.body
      fetchOptions.duplex = 'half' // Nécessaire pour Node.js fetch avec ReadableStream
    }

    console.log(`[BFF Proxy] ${request.method} -> ${targetUrl}`)

    // 5. Appel à Django
    const response = await fetch(targetUrl, fetchOptions)
    clearTimeout(timeoutId)

    // 6. Gestion des réponses et des cookies retournés par Django
    // On copie la réponse pour renvoyer au client
    const responseHeaders = new Headers(response.headers)
    
    // Node.js fetch décompresse automatiquement le body s'il est gzip/br.
    // Si on laisse Content-Encoding ou Content-Length, le navigateur va échouer
    // à lire le stream (TypeError: Failed to fetch / Request aborted).
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')
    responseHeaders.delete('transfer-encoding')
    
    if (response.status === 204 || response.status === 205 || response.status === 304) {
      return new NextResponse(null, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // Vercel Serverless Functions can sometimes drop connections prematurely 
    // when piping a raw fetch stream (response.body) whose headers were modified.
    // Buffering the response into memory ensures the body is fully received and 
    // sent correctly to the client. (Safe for JSON BFF).
    const bodyBuffer = await response.arrayBuffer()
    
    // Le BFF doit propager le statut et le body
    return new NextResponse(bodyBuffer, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[BFF Proxy] Request timeout')
      return NextResponse.json({ error: 'Gateway Timeout' }, { status: 504 })
    }
    console.error('[BFF Proxy] Proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const OPTIONS = proxyRequest
