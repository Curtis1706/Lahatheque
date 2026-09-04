import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy Router & HTTP Request Logger
 * Intercepte toutes les requêtes en production et en développement pour :
 * 1. Écrire les logs d'accès HTTP en direct sur stdout (capturés par Coolify / Docker)
 * 2. Gérer la sécurité des sessions et les redirections par rôle
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const method = request.method
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  // 1. Extraction de la session utilisateur
  const userSessionRaw =
    request.cookies.get('user_session_client')?.value ||
    request.cookies.get('user_session')?.value

  let role = ''
  let userIdentifier = 'anonymous'
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
      userIdentifier = session?.email || session?.id || session?.username || 'user'

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
    } catch {
      // Ignorer l'erreur de parsing
    }
  }

  if (!isLoggedIn) {
    isLoggedIn = request.cookies.has('laha_access') || request.cookies.has('laha_refresh')
    if (isLoggedIn) userIdentifier = 'auth-token'
  }

  // 2. Journalisation HTTP directe sur stdout (visible dans Coolify Runtime Logs)
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/images/') || pathname.includes('.')
  
  if (!isStaticAsset) {
    const authTag = isLoggedIn ? `[${role || 'auth'}:${userIdentifier}]` : '[guest]'
    console.log(`[HTTP ${now}] ${method} ${pathname}${search} ${authTag}`)
  }

  // 3. Helper pour obtenir l'URL de redirection par rôle
  const getRoleDashboardUrl = (userRole: string): string => {
    switch (userRole) {
      case 'student':
      case 'parent':
      case 'teacher':
        return '/student'
      case 'author':
        return '/author'
      case 'university':
        return '/university'
      case 'publisher':
        return '/publisher'
      case 'wholesaler':
      case 'super_client':
        return '/wholesaler'
      case 'legal_reviewer':
        return '/legal-reviewer'
      case 'layout_artist':
        return '/layout-artist'
      case 'chief_layout':
        return '/chief-layout'
      case 'manager':
        return '/manager'
      case 'admin':
      case 'super_admin':
        return '/admin'
      default:
        return '/student'
    }
  }

  // 4. Si connecté et tente d'accéder aux pages d'auth (/login, /register) ou aux pages publiques
  const isAuthPage = pathname === '/login' || pathname.startsWith('/register')
  const isPublicShowcase =
    pathname === '/' ||
    pathname === '/about' || pathname.startsWith('/about/') ||
    pathname === '/authors' || pathname.startsWith('/authors/') ||
    pathname === '/partners' || pathname.startsWith('/partners/') ||
    pathname === '/prestations' || pathname.startsWith('/prestations/') ||
    pathname === '/subscriptions' || pathname.startsWith('/subscriptions/') ||
    (pathname === '/catalog' || (pathname.startsWith('/catalog/') && !pathname.startsWith('/catalog/reader'))) ||
    pathname === '/legal' || pathname.startsWith('/legal/') ||
    pathname === '/cgu' || pathname.startsWith('/cgu/') ||
    pathname === '/cgv' || pathname.startsWith('/cgv/') ||
    pathname === '/contact' || pathname.startsWith('/contact/') ||
    pathname === '/submit' || pathname.startsWith('/submit/') ||
    pathname === '/guide' || pathname.startsWith('/guide/') ||
    pathname === '/checkout' || pathname.startsWith('/checkout/')

  if (isLoggedIn && (isAuthPage || isPublicShowcase) && role) {
    const dashboardUrl = getRoleDashboardUrl(role)
    if (dashboardUrl && dashboardUrl !== pathname) {
      console.log(`[HTTP Auth ${now}] Redirection auto ${userIdentifier} (${role}) -> ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
  }

  // 5. Si non connecté et tente d'accéder à un espace protégé
  const protectedRoutes = [
    '/university',
    '/student',
    '/wholesaler',
    '/publisher',
    '/author',
    '/legal-reviewer',
    '/layout-artist',
    '/chief-layout',
    '/manager',
    '/admin'
  ]
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  if (!isLoggedIn && isProtectedRoute && pathname !== '/login') {
    console.log(`[HTTP Auth ${now}] Accès refusé non-authentifié -> Redirection /login pour ${pathname}`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
