import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy Router (ex-middleware.ts)
 * Exécuté au niveau Node.js pour contrôler l'accès UI et le routage par rôle.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Extraction du cookie de session UI
  const userSessionRaw =
    request.cookies.get('user_session_client')?.value ||
    request.cookies.get('user_session')?.value

  let role = ''
  let isLoggedIn = false

  if (userSessionRaw) {
    try {
      let session: any = null
      try {
        session = JSON.parse(decodeURIComponent(userSessionRaw))
      } catch {
        session = JSON.parse(userSessionRaw)
      }

      role = session?.role?.toLowerCase() || ''
      if (!role && Array.isArray(session?.active_roles)) {
        const adminRoles = ['admin', 'super_admin']
        for (const r of session.active_roles) {
          if (adminRoles.includes(r)) { role = r; break }
        }
        if (!role && session.active_roles.length > 0) {
          role = session.active_roles[0].toLowerCase()
        }
      }

      isLoggedIn = !!(session?.id || session?.email)
    } catch (e) {
      console.error('Proxy: Error parsing session cookie', e)
    }
  }

  // Fallback : présence du cookie laha_access ou laha_refresh (HttpOnly)
  if (!isLoggedIn) {
    isLoggedIn = request.cookies.has('laha_access') || request.cookies.has('laha_refresh')
  }

  // 2. Si l'utilisateur est connecté et tente d'accéder à des pages publiques
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname.startsWith('/register')
  if (isLoggedIn && isPublicPage) {
    let dashboardUrl = '/dashboard'
    if (role === 'student') {
      dashboardUrl = '/student'
    } else if (role === 'teacher' || role === 'author') {
      dashboardUrl = '/teacher'
    } else if (role === 'librarian') {
      dashboardUrl = '/librarian'
    } else if (role === 'publisher') {
      dashboardUrl = '/publisher'
    } else if (role === 'legal_reviewer') {
      dashboardUrl = '/legal-reviewer'
    } else if (role === 'layout_artist') {
      dashboardUrl = '/layout-artist'
    } else if (['admin', 'super_admin'].includes(role)) {
      dashboardUrl = '/admin'
    }
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // 3. Si l'utilisateur n'est pas connecté et tente d'accéder à un espace protégé
  const protectedRoutes = ['/student', '/teacher', '/librarian', '/publisher', '/author', '/legal-reviewer', '/layout-artist', '/admin', '/super-admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/student/:path*',
    '/teacher/:path*',
    '/librarian/:path*',
    '/publisher/:path*',
    '/author/:path*',
    '/legal-reviewer/:path*',
    '/layout-artist/:path*',
    '/admin/:path*',
    '/super-admin/:path*',
    '/login',
    '/register/:path*',
    '/',
  ],
}
