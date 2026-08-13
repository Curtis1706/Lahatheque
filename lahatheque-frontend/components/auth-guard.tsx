"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import type { User } from '@/hooks/use-auth'

// ─── Types ──────────────────────────────────────────────────────────────────

type AppRole = 'student' | 'teacher' | 'parent' | 'author' | 'admin' | 'super_admin' | 'super_client' | 'publisher' | 'librarian' | 'legal_reviewer' | 'layout_artist' | 'manager'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: AppRole
  requiredRoles?: AppRole[]
}

// ─── Logique d'autorisation centralisée ─────────────────────────────────────
// Fonction pure extraite pour éviter la duplication entre useEffect et le render.

function resolveAuthorization(
  user: User,
  effectiveRole: string,
  allowedRoles: AppRole[]
): boolean {
  if (allowedRoles.length === 0) return true
  if (allowedRoles.includes(effectiveRole as AppRole)) return true
  // Cas spécial : super_client autorisé à voir toutes les ressources de l'élève (vidéothèque, examens, devoirs)
  if (allowedRoles.includes('student') && effectiveRole === 'super_client') {
    return true
  }
  // Cas spécial : auteur certifié autorisé à voir les outils enseignant
  if (
    allowedRoles.includes('teacher') &&
    effectiveRole === 'author' &&
    ((user as any).teacher_profile?.verification_status === 'approved' ||
      (user as any).author_profile?.content_visibility_status === 'published')
  ) {
    return true
  }
  return false
}

// ─── Helper : lire access_expires_at depuis le cookie UI ────────────────────
// Le JWT est HttpOnly (illisible en JS), mais le BFF expose son `exp`
// (un simple timestamp Unix, pas un secret) dans user_session_client.

function readAccessExpiresAt(): number | null {
  try {
    const raw = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('user_session_client='))
      ?.split('=')
      .slice(1)
      .join('=')
    if (!raw) return null
    const payload = JSON.parse(decodeURIComponent(raw))
    return typeof payload.access_expires_at === 'number' ? payload.access_expires_at : null
  } catch {
    return null
  }
}

// Constantes de la politique de refresh
const REFRESH_MARGIN_MS   = 60_000        // Rafraîchir 60s avant l'expiration
const FALLBACK_REFRESH_MS = 4 * 60_000   // Fallback si access_expires_at absent : 4 min
const RETRY_ON_ERROR_MS   = 30_000        // Retry réseau après 30s

// ─── Composant ───────────────────────────────────────────────────────────────

export function AuthGuard({ children, requiredRole, requiredRoles }: AuthGuardProps) {
  const { user, loading, activeRole } = useAuth()
  const router = useRouter()

  const allowedRoles = requiredRoles && requiredRoles.length > 0
    ? requiredRoles
    : requiredRole ? [requiredRole] : []

  // --- Redirection si non authentifié ou non autorisé ---
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    const effectiveRole = activeRole || user.role
    if (!effectiveRole) {
      router.push('/login')
      return
    }
    if (!resolveAuthorization(user, effectiveRole, allowedRoles)) {
      const targetPath = effectiveRole === 'super_admin' ? '/super-admin' : effectiveRole === 'legal_reviewer' ? '/legal-reviewer' : effectiveRole === 'layout_artist' ? '/layout-artist' : `/${effectiveRole}`
      router.push(targetPath)
    }
  }, [user, loading, activeRole, requiredRole, requiredRoles, router])

  // --- Refresh proactif basé sur le vrai exp du JWT ---
  // Aucune constante en dur : le délai est calculé depuis access_expires_at
  // exposé dans le cookie UI par le BFF (timestamp Unix, pas le token).
  //
  // Anti-race multi-onglets : navigator.locks assure qu'un seul onglet
  // déclenche le PUT à la fois — les autres attendent ou récupèrent le
  // nouveau token via le cookie mis à jour par le premier onglet.
  useEffect(() => {
    if (loading || !user) return

    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>

    const scheduleRefresh = () => {
      if (cancelled) return

      // Calculer le délai depuis le vrai exp du JWT (via cookie UI)
      const expiresAt = readAccessExpiresAt()
      const delay = expiresAt
        ? Math.max(expiresAt * 1000 - Date.now() - REFRESH_MARGIN_MS, 0)
        : FALLBACK_REFRESH_MS

      timeout = setTimeout(async () => {
        if (cancelled) return

        // navigator.locks : un seul onglet tient le verrou → pas de double refresh
        const doRefresh = async () => {
          try {
            const res = await fetch('/api/auth/session', {
              method: 'PUT',
              credentials: 'include',
            })

            if (res.ok) {
              // Refresh réussi → replanifier uniquement si le composant est encore monté
              if (!cancelled) scheduleRefresh()
            } else if (res.status === 401) {
              // Refresh token vraiment expiré → déconnexion légitime
              window.location.href = '/login?reason=session_expired'
            } else {
              // Erreur serveur passagère (5xx, déploiement...) → retry dans 30s
              // On ne déconnecte pas l'utilisateur pour un blip réseau
              if (!cancelled) timeout = setTimeout(scheduleRefresh, RETRY_ON_ERROR_MS)
            }
          } catch {
            // Erreur réseau (offline, timeout) → retry dans 30s
            if (!cancelled) timeout = setTimeout(scheduleRefresh, RETRY_ON_ERROR_MS)
          }
        }

        if (typeof navigator !== 'undefined' && 'locks' in navigator) {
          // Web Locks API — déduplique les refreshs entre onglets
          await navigator.locks.request('laha_session_refresh', { ifAvailable: true }, async (lock) => {
            if (lock) {
              await doRefresh()
            } else {
              // Un autre onglet est déjà en train de rafraîchir → attendre puis replanifier
              setTimeout(scheduleRefresh, 2_000)
            }
          })
        } else {
          // Fallback : navigateurs sans Web Locks (très rare)
          await doRefresh()
        }
      }, delay)
    }

    scheduleRefresh()

    // Vérification anti-multi-device : fusionnée dans le cycle PUT ci-dessus.
    // Le PUT lui-même confirme la validité de la session, pas besoin d'un GET séparé.
    // On ajoute un check de validation de session espacé uniquement pour détecter
    // une invalidation externe (ex. déconnexion admin côté serveur).
    // Note : si user_session_client est absent (edge case : purge cookies navigateur),
    // le PUT renouvelle quand même laha_access/laha_refresh correctement, mais
    // access_expires_at reste absent jusqu'au prochain GET anti-multi-device (≤5 min).
    // readAccessExpiresAt() tombera sur FALLBACK_REFRESH_MS entretemps — comportement
    // intentionnel et auto-guérissant, pas un oubli.
    const antiMDInterval = setInterval(async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data && data.authenticated === false) {
            window.location.href = '/login?reason=session_expired'
          }
        }
        // On ignore les 401 (le refresh proactif s'en charge) et les 5xx (blip serveur)
      } catch {
        // Erreur réseau temporaire — on ne déconnecte pas
      }
    }, 5 * 60_000) // toutes les 5 minutes — pas de 401 en console dans le cas normal

    return () => {
      cancelled = true
      clearTimeout(timeout)
      clearInterval(antiMDInterval)
    }
  }, [user, loading])

  // --- Render ---

  if (loading) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-laha-black via-laha-black to-laha-gold-dark flex items-center justify-center">
        <div suppressHydrationWarning className="text-center">
          <div suppressHydrationWarning className="w-16 h-16 border-4 border-laha-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p suppressHydrationWarning className="text-white/70">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const effectiveRole = activeRole || user.role
  if (!resolveAuthorization(user, effectiveRole, allowedRoles)) return null

  return <>{children}</>
}

export default AuthGuard

