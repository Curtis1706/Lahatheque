import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Construit une URL absolue pour les médias (photos de profil, documents, etc.)
 * Gère les chemins relatifs renvoyés par l'API Django.
 */
export function getMediaUrl(path: any): string {
  if (!path || typeof path !== 'string') return ""
  if (path.startsWith("http")) return path
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  
  return `${cleanBase}${cleanPath}`
}

/**
 * Construit une URL absolue vers le backend Django pour les appels server-side (BFF).
 * Utilise NEXT_PUBLIC_API_URL ou l'URL locale Django en fallback.
 *
 * Normalise la base : retire le suffixe /api s'il est déjà présent dans NEXT_PUBLIC_API_URL
 * pour éviter le double /api/api. Les appelants passent toujours le chemin complet
 * depuis la racine (ex: /api/v1/payments/status/<id>/).
 */
export function getDjangoProxyUrl(path: string): string {
  const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  // Supprimer le /api trailing si présent, pour normaliser la base au niveau du host
  const cleanBase = rawBase.replace(/\/api\/?$/, "").replace(/\/$/, "")
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${cleanBase}${cleanPath}`
}
