"use client"

import { getAuthToken, getRefreshToken, getActiveRole, setAuthToken, clearAuthTokens } from "@/lib/auth-token";
import React, { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import logger from '@/lib/logger'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher' | 'parent' | 'author' | 'admin' | 'super_admin' | 'super_client' | 'publisher' | 'librarian' | 'legal_reviewer' | 'layout_artist'
  active_roles: string[]  // Source de vérité Phase 8 — lire ceci plutôt que role
  phone?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  date_joined?: string
  reputation_score: number
  badges: any[]
  profile_photo: string | null
  avatar?: string
  profile_id?: string | null
  is_new_user?: boolean
  is_guest?: boolean
  is_premium?: boolean
  has_active_family_subscription?: boolean
  allowed_subjects?: string[]
  teacher_profile?: {
    verification_status: string;
    [key: string]: any;
  }
}

export interface LoginResponse {
  success: boolean
  user?: User
  error?: string
}

export type RegisterRole = 'student' | 'teacher' | 'parent' | 'author'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  register: (role: RegisterRole, userData: any) => Promise<LoginResponse>
  activeRole: string | null
  switchRole: (role: string) => void
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<any>
  loginWithToken: (token: string, user: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Ces flags sont au niveau module pour survivre aux re-mounts React Strict Mode
// Mais sont réinitialisés à chaque navigation complète (refresh page)
let _isRefreshing = false
let _hasInitialChecked = false

const DEFAULT_MOCK_USER: User = {
  id: "user-student-001",
  email: "firinze.dossou@uac.bj",
  first_name: "Firinze",
  last_name: "DOSSOU",
  role: "student",
  active_roles: ["student"],
  is_verified: true,
  is_active: true,
  created_at: new Date().toISOString(),
  reputation_score: 100,
  badges: [],
  profile_photo: null
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_MOCK_USER)
  const [activeRole, setActiveRole] = useState<string | null>("student")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const setSessionCookie = (user: User | null) => {
    if (user) {
      // Cookie UI non-sensible (lisible par JS). Ne contient JAMAIS laha_access ni laha_refresh (HttpOnly).
      const sessionData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        active_roles: user.active_roles || [],
        teacher_profile: (user as any).teacher_profile || null,
        author_profile: (user as any).author_profile || null,
        is_verified: user.is_verified,
        profile_photo: user.profile_photo || null,
        has_active_family_subscription: !!(user as any).has_active_family_subscription,
      }))
      document.cookie = `user_session_client=${sessionData}; path=/; max-age=${12 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = 'user_session_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  const refreshUser = async () => {
    if (_isRefreshing) return
    
    try {
      _isRefreshing = true

      logger.debug('Syncing user data with backend (BFF)', { context: 'useAuth' })
      // Appel via BFF : le cookie HttpOnly est joint automatiquement par le navigateur
      const response = await fetch('/api/auth/session/', {
        method: 'GET',
        cache: 'no-store'
      })

      if (response.ok) {
        const syncData = await response.json()
        if (syncData?.user?.id) {
          setUser(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(syncData.user)) {
              setSessionCookie(syncData.user)
              if (syncData.user.role) {
                setActiveRole(syncData.user.role)
              }
              return syncData.user
            }
            return prev
          })
          if (syncData.user.role) {
            setActiveRole(syncData.user.role)
          }
          return syncData.user
        }
      } else if (response.status === 401) {
        // Access token expiré → tenter un refresh silencieux avant de déconnecter
        logger.warn('Access token expiré (401), tentative de refresh silencieux...', { context: 'useAuth' })
        try {
          const refreshRes = await fetch('/api/auth/session/', {
            method: 'PUT',
            credentials: 'include',
          })
          if (refreshRes.ok) {
            // Refresh réussi → re-tenter le GET pour récupérer le user
            logger.debug('Refresh silencieux réussi, re-synchronisation...', { context: 'useAuth' })
            const retryRes = await fetch('/api/auth/session/', { method: 'GET', cache: 'no-store' })
            if (retryRes.ok) {
              const retryData = await retryRes.json()
              if (retryData?.user?.id) {
                setUser(retryData.user)
                setSessionCookie(retryData.user)
                return retryData.user
              }
            }
          } else {
            // Refresh token expiré aussi → déconnexion propre
            logger.warn('Refresh token invalide, déconnexion.', { context: 'useAuth' })
            clearAuthTokens()
            setUser(null)
            setSessionCookie(null)
          }
        } catch (refreshError) {
          logger.error('Erreur réseau lors du refresh silencieux', refreshError as Error, { context: 'useAuth' })
          setUser(null)
          setSessionCookie(null)
        }
      } else {
        // Autre erreur BFF (ex. 500, 502) → par précaution on vide la session
        setUser(null)
        setSessionCookie(null)
      }
    } catch (error) {
      logger.error('Error refreshing user data', error as Error, { context: 'useAuth' })
      setUser(null)
      setSessionCookie(null)
    } finally {
      _isRefreshing = false
    }
  }

  useEffect(() => {
    // Évite le double appel lors du re-mount de React Strict Mode
    if (_hasInitialChecked) {
      setLoading(false)
      return
    }
    _hasInitialChecked = true
    
    const checkAuth = async () => {
      try {
        const cookies = document.cookie.split(';')
        const userSessionCookie = cookies.find(cookie => cookie.trim().startsWith('user_session_client='))
        // NOTE: laha_access est HttpOnly → illisible par JS. On ne peut pas le vérifier ici.
        // On vérifie uniquement le cookie client visible pour l'hydratation UI immédiate.

        if (userSessionCookie) {
          // Hydratation immédiate depuis le cookie UI (zéro latence)
          const sessionValue = decodeURIComponent(userSessionCookie.split('=').slice(1).join('='))
          try {
            const sessionObj = JSON.parse(sessionValue)
            const userData = sessionObj.user || sessionObj
            if (userData?.id) {
              setUser(userData)
              if (userData.role) {
                setActiveRole(userData.role)
              }
            }
          } catch (e) {
            logger.warn('Could not parse user_session_client cookie', { context: 'useAuth' })
          }
        }

        // ── Migration automatique localStorage → HttpOnly cookie ──────────
        // Si l'utilisateur avait une session avec l'ancien système (token en localStorage)
        const localToken = getAuthToken()
        const localRefresh = getRefreshToken()
        if (localToken) {
          logger.debug('Migration BFF: token localStorage détecté, migration en cours...', { context: 'useAuth' })
          try {
            const migrateRes = await fetch('/api/auth/session/', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access: localToken, refresh: localRefresh }),
            })
            if (migrateRes.ok) {
              const migrateData = await migrateRes.json()
              if (migrateData.user) {
                setUser(migrateData.user)
                setSessionCookie(migrateData.user)
                if (migrateData.user.role) setActiveRole(migrateData.user.role)
              }
              clearAuthTokens()
              logger.debug('Migration BFF réussie, localStorage nettoyé.', { context: 'useAuth' })
            } else {
              logger.warn('Migration BFF: token localStorage invalide/expiré.', { context: 'useAuth' })
              clearAuthTokens()
              // Tenter quand même le refresh via cookie HttpOnly
              await refreshUser()
            }
          } catch (e) {
            logger.error('Migration BFF: erreur réseau', e as Error, { context: 'useAuth' })
            await refreshUser()
          }
        } else {
          // Pas de token localStorage → vérifier le cookie HttpOnly via le BFF
          // refreshUser() gère aussi le refresh silencieux si l'access token est expiré
          await refreshUser()
        }
      } catch (error) {
        logger.error('Error checking authentication', error as Error, { context: 'useAuth' })
      } finally {
        const savedRole = getActiveRole()
        if (savedRole) setActiveRole(savedRole)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Appel du Route Handler BFF pour gérer la session HttpOnly
      const response = await fetch('/api/auth/session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || data.detail || 'Erreur de connexion' }
      }

      if (data.success && data.user) {
        setUser(data.user)
        
        // Par défaut au login, on active le rôle principal de l'utilisateur
        if (data.user.role) {
          setActiveRole(data.user.role)
        }
        
        return { success: true, user: data.user as User }
      }
      return { success: false, error: 'Connexion échouée' }
    } catch (error) {
      logger.error('Error during login', error as Error, { context: 'useAuth/login' })
      return { success: false, error: 'Erreur interne du serveur' }
    }
  }

  const register = async (role: RegisterRole, userData: any): Promise<LoginResponse> => {
    try {
      const endpoint = `/api/bff/auth/register/${role}/`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || data.detail || "Erreur lors de l'inscription" }
      }

      const accessToken = data.tokens?.access || data.token
      const refreshToken = data.tokens?.refresh

      // Migrer les tokens vers les cookies HttpOnly via le BFF
      if (accessToken) {
        const migrateRes = await fetch('/api/auth/session/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access: accessToken, refresh: refreshToken }),
        })
        if (migrateRes.ok) {
          const migrateData = await migrateRes.json()
          const registeredUser = migrateData.user || data.user
          setUser(registeredUser)
          setSessionCookie(registeredUser)
          if (registeredUser?.role) setActiveRole(registeredUser.role)
          return { success: true, user: registeredUser as User }
        }
      }

      // Fallback si pas de token (inscription sans auto-login)
      if (data.user) {
        setUser(data.user)
        setSessionCookie(data.user)
      }
      return { success: true, user: data.user as User }
    } catch (error) {
      logger.error('Error during registration', error as Error, { context: 'useAuth/register' })
      return { success: false, error: 'Erreur interne du serveur' }
    }
  }

  const logout = async () => {
    try {
      // Déconnexion via le BFF (détruit les cookies HttpOnly et notifie Django)
      await fetch('/api/auth/session/', {
        method: 'DELETE',
      }).catch(err => logger.debug('BFF logout failed', err))

      // Nettoyage local de secours
      clearAuthTokens()
      setUser(null)
      setSessionCookie(null)
      
      // On redirige vers l'accueil ou le login
      router.push('/login')
    } catch (error) {
      logger.error('Error during logout', error as Error, { context: 'useAuth/logout' })
      router.push('/login')
    }
  }

  const loginWithToken = async (token: string, userData: User) => {
    // 1. Mise à jour immédiate de l'état React (UI réactive sans attendre le réseau)
    setUser(userData)
    setSessionCookie(userData)
    if (userData.role) setActiveRole(userData.role)

    // 2. Migration BFF en arrière-plan : stockage sécurisé dans cookie HttpOnly
    try {
      const migrateRes = await fetch('/api/auth/session/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access: token }),
      })
      if (migrateRes.ok) {
        const migrateData = await migrateRes.json()
        // Mise à jour avec les données complètes si disponibles
        if (migrateData.user) {
          setUser(migrateData.user)
          setSessionCookie(migrateData.user)
          if (migrateData.user.role) setActiveRole(migrateData.user.role)
        }
        // Nettoyer l'ancien token du localStorage
        clearAuthTokens()
      } else {
        // Fallback : conserver dans localStorage jusqu'au prochain chargement
        setAuthToken(token)
        logger.warn('loginWithToken: migration BFF échouée, fallback localStorage', { context: 'useAuth' })
      }
    } catch (e) {
      // Fallback réseau
      setAuthToken(token)
      logger.warn('loginWithToken: erreur réseau BFF, fallback localStorage', { context: 'useAuth' })
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...userData }
      setUser(newUser)
      setSessionCookie(newUser)
    }
  }

  const switchRole = (role: string) => {
    setActiveRole(role)
    
    // Redirection intelligente selon le rôle
    if (role === 'teacher') router.push('/teacher')
    else if (role === 'author') router.push('/author')
    else if (role === 'student') router.push('/student')
    else if (role === 'super_client') router.push('/student')
    else if (role === 'parent') router.push('/student')
    else if (role === 'admin') router.push('/admin')
    else if (role === 'super_admin') router.push('/super-admin')
  }

  const value = React.useMemo(() => ({
    user,
    activeRole,
    loading,
    login,
    register,
    logout,
    switchRole,
    updateUser,
    refreshUser,
    loginWithToken,
  }), [user, activeRole, loading])

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
