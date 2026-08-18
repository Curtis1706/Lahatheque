import { clearAuthTokens, getAuthToken } from "@/lib/auth-token";
// Configuration API pour le backend Django via Axios
import axios, { AxiosError } from 'axios'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '') + '/'
export const SERVER_ROOT_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '') + '/'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const http = axios.create({
  baseURL: typeof window !== 'undefined' ? '/' : SERVER_ROOT_URL,
  withCredentials: true,
})

// Intercepteur pour ajouter le token de session et gérer le routage server-side
http.interceptors.request.use(
  (config) => {
    // Si on est sur le serveur (SSR) et qu'on appelle le BFF,
    // on redirige directement vers l'API v1 de Django pour éviter le 404
    if (typeof window === 'undefined' && config.url) {
      if (config.url.startsWith('/api/bff/')) {
        config.url = config.url.replace('/api/bff/', '/api/v1/')
      }
    }
    // Fallback localStorage token UNIQUEMENT pour les appels directs à Django
    // (hors BFF). Pour les routes /api/bff/*, le BFF injecte lui-même le cookie
    // HttpOnly laha_access — envoyer un vieux token localStorage ici écraserait
    // le cookie et causerait des vues incohérentes entre appareils.
    const isBffRoute = config.url?.startsWith('/api/bff/')
    if (!isBffRoute) {
      const token = getAuthToken()
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },

  (error) => Promise.reject(error)
)

// ── Refresh silencieux (intercepteur 401) ────────────────────────────────────
// Protège contre les appels concurrents : si 5 onglets reçoivent un 401 en même
// temps, un seul appel refresh sera effectué. Les autres attendent sa résolution.
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeToRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function notifySubscribers(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken))
  refreshSubscribers = []
}

http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const originalRequest = err.config as any
    const status = err.response?.status ?? 500
    const data = err.response?.data as any
    let message = data?.error || data?.detail
    
    if (!message && data && typeof data === 'object') {
      const firstErrorKey = Object.keys(data)[0];
      if (firstErrorKey && Array.isArray(data[firstErrorKey])) {
        message = data[firstErrorKey][0];
      } else if (firstErrorKey && typeof data[firstErrorKey] === 'string') {
        message = data[firstErrorKey];
      }
    }
    
    message = message || err.message || 'Erreur réseau'

    // Tentative de refresh silencieux sur 401 via le cookie laha_refresh (BFF)
    if (status === 401 && !originalRequest._retry) {
      const isRefreshRoute =
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/api/auth/session')

      if (!isRefreshRoute) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeToRefresh(() => {
              resolve(http(originalRequest))
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // Appel BFF : le cookie laha_refresh est joint automatiquement
          const refreshRes = await fetch('/api/auth/session/', {
            method: 'PUT',
            credentials: 'include',
          })

          if (refreshRes.ok) {
            // Le cookie laha_access est mis à jour côté serveur (HttpOnly) par le BFF.
            // SÉCURITÉ : on ne stocke PAS le token en localStorage — le cookie HttpOnly suffit.
            // On notifie les requêtes en attente pour qu'elles soient rejouées automatiquement.
            notifySubscribers('')
            return http(originalRequest)
          } else {
            // Refresh expiré → déconnexion propre
            clearAuthTokens()
            if (typeof document !== 'undefined') {
              document.cookie = 'user_session_client=;path=/;max-age=0'
            }
            if (typeof window !== 'undefined') {
              window.location.href = '/login?reason=session_expired'
            }
            return Promise.reject(new ApiError(401, 'Session expirée'))
          }
        } catch (refreshError) {
          clearAuthTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=session_expired'
          }
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
    }

    console.error(`[API Error] ${status}:`, data || err.message)
    const errMessage = typeof message === 'object' && message !== null ? JSON.stringify(message) : message
    return Promise.reject(new ApiError(status, errMessage))
  }
)

// API pour l'authentification (Phase 8 - JWT v1)
export const authApi = {
  // Inscription
  register: async (userData: any) => {
    const { data } = await http.post('/api/bff/auth/register/', userData)
    return data
  },

  // Connexion (Proxy Next.js ou direct selon config)
  login: async (credentials: { email: string; password: string }) => {
    // Note: Le hook use-auth utilise /api/auth/login (le proxy Next.js)
    // Mais on garde ceci cohérent avec v1
    const { data } = await http.post('/api/auth/session/', {
      identifier: credentials.email,
      password: credentials.password
    })
    return data
  },

  // Déconnexion
  logout: async (refresh?: string) => {
    const { data } = await http.delete('/api/auth/session/')
    return data
  },

  // Récupérer les permissions (Phase 8/9)
  getPermissions: async () => {
    const { data } = await http.get('/api/bff/me/permissions/')
    return data
  }
};

// API pour les étudiants
export const studentApi = {
  // Inscription d'un étudiant
  register: async (studentData: any) => {
    const { data } = await http.post('/api/bff/auth/register/student/', studentData)
    return data
  },

  // Obtenir le dashboard complet
  getDashboard: async () => {
    const { data } = await http.get('/api/bff/students/dashboard/')
    return data
  },
  
  getScoreDetails: async () => {
    const { data } = await http.get('/api/bff/students/dashboard/scores/')
    return data
  },

  // Débloquer un livre via QR Code
  unlockQRCode: async (token: string, deviceFingerprint?: string) => {
    const { data } = await http.post('/api/bff/library/livre/activate/', { 
      token,
      device_fingerprint: deviceFingerprint 
    })
    return data
  },

  // Obtenir les vidéos/cours des enseignants de l'étudiant
  getMyVideos: async () => {
    const { data } = await http.get('/api/bff/content/student/my-teachers-courses/')
    return data
  },

  // Obtenir les vidéos de la vidéothèque publique
  getLibraryVideos: async () => {
    const { data } = await http.get('/api/bff/content/lessons/?library=true&limit=6')
    return data
  },
};


// API pour les enseignants
export const teacherApi = {
  // Liste publique des enseignants
  getPublicTeachers: async () => {
    const { data } = await http.get('/api/teachers')
    return data
  },

  // Inscription d'un enseignant (Flash Registration - JSON)
  register: async (teacherData: any) => {
    const { data } = await http.post('/api/bff/auth/register/teacher/', {
      first_name: teacherData.firstName,
      last_name: teacherData.lastName,
      email: teacherData.email,
      phone: teacherData.phone,
      password: teacherData.password
    })
    return data
  },

  // Compléter le profil (Bio, Tarif, etc.)
  updateProfile: async (profileData: any) => {
    const { data } = await http.patch('/api/bff/teachers/profile/', profileData)
    return data
  },

  // Uploader un justificatif métier (CV, Diplôme)
  uploadDocument: async (file: File, documentType: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    formData.append('target_role_code', 'teacher')

    const { data } = await http.post('/api/bff/verification/submissions/documents/upload/', formData)
    return data
  },

  // Onboarding complet (Status + Verification)
  submitOnboarding: async () => {
    const { data } = await http.post('/api/bff/teachers/profile/onboarding/submit/')
    return data
  },
  // Récupérer le statut détaillé de l'onboarding (avec documents)
  getOnboardingStatus: async () => {
    const { data } = await http.get('/api/bff/teachers/profile/onboarding/status/')
    return data
  },
  // Récupérer les sessions à venir
  getSessions: async (params?: any) => {
    const { data } = await http.get('/api/bff/bookings/sessions/', { params })
    return data
  },
  // Obtenir les revenus (Phase 14 v1)
  getEarnings: async () => {
    const { data } = await http.get('/api/bff/analytics/earnings/')
    return data
  },
  // Obtenir le profil complet (Expertise, Stats, etc.) - PRIVÉ
  getProfile: async () => {
    const { data } = await http.get('/api/bff/teachers/profile/')
    return data
  },

  // Rechercher des professeurs - PUBLIC
  search: async (params: any) => {
    const { data } = await http.get('/api/bff/teachers/search/', { params })
    return data
  },

  // Obtenir le profil public d'un professeur - PUBLIC
  getPublicProfile: async (id: string) => {
    const { data } = await http.get(`/api/bff/teachers/search/${id}/`)
    return data
  },

  // Obtenir les KPIs du dashboard
  getDashboardKpis: async () => {
    const { data } = await http.get('/api/bff/teachers/dashboard/kpis/')
    return data
  },

  // Obtenir les élèves actifs du dashboard
  getDashboardStudents: async () => {
    const { data } = await http.get('/api/bff/teachers/dashboard/students/')
    return data
  },
};

// API pour le référentiel académique (Matières, Niveaux, Années)
export const academicsApi = {
  getSubjects: () => http.get('/api/bff/academics/subjects/').then(r => r.data),
  getLevels: () => http.get('/api/bff/academics/levels/').then(r => r.data),
  getYears: () => http.get('/api/bff/academics/years/').then(r => r.data),
};

// API pour la gestion de l'agenda (Slots récurrents)
export const availabilityApi = {
  getSlots: (teacherId?: string, extraParams?: any) => http.get('/api/bff/bookings/availability/', { 
    params: { ...(teacherId ? { teacher_id: teacherId } : {}), ...(extraParams || {}) } 
  }).then(r => r.data),
  bulkUpdate: (slots: any) => http.post('/api/bff/bookings/availability/bulk_update/', { slots }).then(r => r.data),
  dailyUpdate: (date: string, slots: any) => http.post('/api/bff/bookings/availability/daily_update/', { date, slots }).then(r => r.data),
};

// API pour les abonnements
export const subscriptionApi = {
  getPlans: () => http.get('/api/bff/payments/subscriptions/plans/').then(r => r.data)
};


// API pour les auteurs (Phase 16 - Industrialisation v1)
export const authorApi = {
  // Inscription d'un auteur
  register: async (authorData: any) => {
    const { data } = await http.post('/api/bff/auth/register/author/', authorData)
    return data
  },

  // Obtenir le profil
  getMe: async () => {
    const { data } = await http.get('/api/bff/authors/me/')
    return data
  },

  // Obtenir les publications
  getPublications: async () => {
    const { data } = await http.get('/api/bff/authors/contents/')
    return data
  },
};

// API pour les parents (Phase 10)
export const parentApi = {
  // Profil et dashboard
  getMe: () => http.get('/api/bff/me/').then(r => r.data),
  getProfile: () => http.get('/api/bff/parents/profile/').then(r => r.data),
  updateProfile: (profileData: any) => http.patch('/api/bff/parents/profile/', profileData).then(r => r.data),
  getChildren: () => http.get('/api/bff/parents/children/').then(r => r.data),
  getChildSummary: (studentId: string) => http.get(`/api/bff/parents/children/${studentId}/summary/`).then(r => r.data),
  getChildActivity: (studentId: string) => http.get(`/api/bff/parents/children/${studentId}/activity/`).then(r => r.data),

  // Inscriptions et invitations (Phase 10)
  linkChild: (studentEmail: string, relationship: string) => 
    http.post('/api/bff/parents/children/link/', { 
      student_email: studentEmail, 
      relationship_type: relationship 
    }).then(r => r.data),
  
  updateChildControls: (studentId: string, controls: any) => 
    http.patch(`/api/bff/parents/children/${studentId}/controls/`, controls).then(r => r.data),

  // Inscriptions et invitations (Phase 10)
  inviteChild: (email: string) => 
    http.post('/api/bff/parents/children/link/', { 
      student_email: email, 
      relationship_type: 'parent' 
    }).then(r => r.data),

  approveInvitation: (id: number) => http.post(`/api/bff/parents/invitations/${id}/approve/`).then(r => r.data),
  rejectInvitation: (id: number) => http.post(`/api/bff/parents/invitations/${id}/reject/`).then(r => r.data),

  // Côté Étudiant : Gérer les demandes des parents
  getStudentRequests: () => http.get('/api/bff/parents/student-requests/').then(r => r.data),
  respondToRequest: (requestId: number, accept: boolean) => 
    http.post('/api/bff/parents/student-accept/', { 
      request_id: requestId, 
      action: accept ? 'accept' : 'reject' 
    }).then(r => r.data),

  // Données consolidées (Phase Industrialisation)
  getCourses: () => http.get('/api/bff/parents/courses/').then(r => r.data),
  getProgress: () => http.get('/api/bff/parents/progress/').then(r => r.data),
  getPayments: () => http.get('/api/bff/parents/payments/').then(r => r.data),
  getNotifications: () => http.get('/api/bff/notifications/').then(r => r.data),
  getEvents: (childId?: string) => 
    http.get(`/api/bff/parents/events/${childId ? `?child_id=${childId}` : ''}`).then(r => r.data),
  getChildPointsFaibles: (studentId: string) => 
    http.get(`/api/bff/assessments/parents/child-points-faibles/${studentId}/`).then(r => r.data),
  getScoreDetails: (childId?: string) => 
    http.get(`/api/bff/parents/scores/${childId ? `?child_id=${childId}` : ''}`).then(r => r.data),
  
  // Comptes Enfants Mineurs
  createMinorChild: (data: any) => 
    http.post('/api/bff/parents/minor-children/', data).then(r => r.data),
  resetMinorChildPin: (childId: string, newPin: string) => 
    http.post(`/api/bff/parents/minor-children/${childId}/reset-pin/`, { new_pin: newPin }).then(r => r.data),

  // Monétisation
  buySlot: () => http.post('/api/bff/parents/slots/buy/').then(r => r.data),
};

// API pour les cours (Phase 13 - LMS v1)
export const courseApi = {
  // Liste publique des cours
  getPublicCourses: async () => {
    const { data } = await http.get('/api/courses')
    return data
  },
  
  // Catalogue
  getAll: (filters?: any) => http.get('/api/bff/content/courses/', { params: filters }).then(r => r.data),
  getSyllabus: (courseId: string) => http.get(`/api/bff/content/courses/${courseId}/syllabus/`).then(r => r.data),
  getLesson: (lessonId: string) => http.get(`/api/bff/content/lessons/${lessonId}/`).then(r => r.data),
  trackProgress: (lessonId: string, data: { 
    is_completed?: boolean, 
    time_spent?: number, 
    last_watched?: number 
  }) => http.post(`/api/bff/content/lessons/${lessonId}/progress/`, data).then(r => r.data),
};

// API pour l'apprentissage et la progression (Phase 13)
export const learningApi = {
  enroll: (courseId: string, studentId?: string) => http.post('/api/bff/learning/enroll/', { 
    course_id: courseId,
    student_id: studentId 
  }).then(r => r.data),
  getMyCourses: () => http.get('/api/bff/learning/my-courses/').then(r => r.data),
  updateProgress: (lessonId: string, data: { 
    is_completed?: boolean, 
    time_spent?: number, 
    last_watched?: number 
  }) => http.patch(`/api/bff/learning/lessons/${lessonId}/progress/`, data).then(r => r.data),
};

// API pour les évaluations (Phase 13.5)
export const assessmentApi = {
  getQuiz: (quizId: string) => http.get(`/api/bff/assessments/quiz/${quizId}/`).then(r => r.data),
  submitQuiz: (quizId: string, answers: any) => http.post(`/api/bff/assessments/quiz/${quizId}/submit/`, { answers }).then(r => r.data),
  getWeakAreas: () => http.get('/api/bff/assessments/points-faibles/').then(r => r.data),
  getQCMs: (params?: { search?: string; subject?: string; grade_level?: string; country?: string; type?: string }) => {
    return http.get('/api/bff/assessments/qcms/', { params }).then(r => r.data)
  },
  getExercises: (params?: { search?: string; subject?: string; grade_level?: string; country?: string }) => {
    return http.get('/api/bff/assessments/student/exercises/', { params }).then(r => r.data)
  },
};

// API pour la messagerie (Phase 14)
export const messagingApi = {
  getUnreadMessagesCount: () => http.get('/api/bff/messaging/unread-count/').then(r => r.data),
  getConversations: () => http.get('/api/bff/messaging/conversations/').then(r => r.data.results || r.data),
  getMessages: (convId: string) => http.get(`/api/bff/messaging/conversations/${convId}/`).then(r => r.data),
  sendMessage: (recipientId: string, body: string, attachments?: { url: string; name: string; type: string }[]) => 
    http.post('/api/bff/messaging/messages/send/', { 
      recipient_id: recipientId, 
      body: body || " ", // body vide interdit par le backend : espace si only-attachments
      attachments: attachments || [],
    }).then(r => r.data),
};

// API pour la messagerie forum (Groupes)
export const messagingForumApi = {
  getGroups: () => http.get('/api/bff/messaging-forum/groups/').then(r => r.data),
  getGroupMessages: (groupId: string) => http.get('/api/bff/messaging-forum/messages/', { params: { group: groupId } }).then(r => r.data),
  sendMessage: (groupId: string, data: any) => 
    http.post('/api/bff/messaging-forum/messages/', data).then(r => r.data),
  deleteMessage: (messageId: string) => 
    http.delete(`/api/bff/messaging-forum/messages/${messageId}/`).then(r => r.data),
};

// API pour la modération et les signalements (Phase 14.5)
export const communicationsApi = {
  submitReport: (data: { reported_user_id: string, reason: string, conversation_id?: string }) => 
    http.post('/api/bff/communications/reports/', data).then(r => r.data),
  blockUser: (userId: string) => 
    http.post('/api/bff/messaging/block/', { user_id: userId }).then(r => r.data),
  admin: {
    getAuditConversation: (convId: string) => 
      http.get(`/api/bff/communications/admin/audit/conversation/${convId}/`).then(r => r.data),
  }
};

// API pour la communauté (Phase 14 + Mini-Facebook Extensions)
export const communityApi = {
  // Forums
  getForums: (params?: any) => http.get('/api/bff/community/forums/', { params }).then(r => r.data),
  getForum: (id: string) => http.get(`/api/bff/community/forums/${id}/`).then(r => r.data),
  joinForum: (id: string) => http.post(`/api/bff/community/forums/${id}/join/`).then(r => r.data),
  leaveForum: (id: string) => http.post(`/api/bff/community/forums/${id}/leave/`).then(r => r.data),

  // Threads (Social Feed)
  getThreads: (forumId?: string) => 
    http.get('/api/bff/community/threads/', { params: { forum: forumId } }).then(r => r.data),
  
  getThreadDetail: (threadId: string) => http.get(`/api/bff/community/threads/${threadId}/`).then(r => r.data),
  
  createThread: (formData: FormData) => 
    http.post('/api/bff/community/threads/', formData).then(r => r.data),
  
  shareThread: (id: string, targetForum: string, content: string) => 
    http.post(`/api/bff/community/threads/${id}/share/`, { 
      target_forum: targetForum, 
      content 
    }).then(r => r.data),

  likeThread: (id: string) => 
    http.post(`/api/bff/community/threads/${id}/like/`).then(r => r.data),

  updateThread: (id: string, content: string) =>
    http.patch(`/api/bff/community/threads/${id}/`, { content }).then(r => r.data),

  deleteThread: (id: string) =>
    http.delete(`/api/bff/community/threads/${id}/`).then(r => r.data),

  // Posts (Commentaires)
  getPosts: (threadId: string) => 
    http.get('/api/bff/community/posts/', { params: { thread: threadId } }).then(r => r.data),
  
  postReply: (threadId: string, content: string, parentId?: string) => 
    http.post('/api/bff/community/posts/', { 
      thread: threadId, 
      content, 
      parent: parentId 
    }).then(r => r.data),

  likePost: (id: string) => 
    http.post(`/api/bff/community/posts/${id}/like/`).then(r => r.data),

  updatePost: (id: string, content: string) =>
    http.patch(`/api/bff/community/posts/${id}/`, { content }).then(r => r.data),

  deletePost: (id: string) =>
    http.delete(`/api/bff/community/posts/${id}/`).then(r => r.data),

  // Modération
  report: (data: { reason: string, description: string, item_type: string, item_id: string }) => 
    http.post('/api/bff/community/report/', data).then(r => r.data),

  // Friendship / Study Buddy
  getPeers: () => http.get('/api/bff/community/friends/peers/').then(r => r.data),
  sendFriendRequest: (userId: string) => http.post('/api/bff/community/friends/request/', { user_id: userId }).then(r => r.data),
  acceptFriendRequest: (userId: string) => http.post('/api/bff/community/friends/accept/', { user_id: userId }).then(r => r.data),
  rejectFriendRequest: (userId: string) => http.post('/api/bff/community/friends/reject/', { user_id: userId }).then(r => r.data),
};

// API pour les sessions
export const sessionApi = {
  // Obtenir toutes les sessions
  getAll: async () => {
    const { data } = await http.get('/sessions/')
    return data
  },

  // Rejoindre une session
  join: async (sessionId: string) => {
    const { data } = await http.post(`/sessions/${sessionId}/join/`)
    return data
  },

  // Obtenir les participants
  getParticipants: async (sessionId: string) => {
    const { data } = await http.get(`sessions/${sessionId}/participants/`)
    return data
  },
};

// API pour les réservations (Phase 12 v1)
export const bookingApi = {
  // Obtenir toutes les réservations de l'utilisateur connecté
  getAll: async (params?: any) => {
    const { data } = await http.get('/api/bff/bookings/me/', { params })
    return data.results ? data.results : data
  },

  // Créer un compte mineur (Phase 4/5)
  createMinorChild: async (childData: any) => {
    const { data } = await http.post('/api/v1/parents/minor-children/', childData)
    return data
  },

  // Créer une réservation
  create: async (bookingData: any) => {
    const { data } = await http.post('/api/bff/bookings/reserve/', bookingData)
    return data
  },

  // Annuler une réservation
  cancel: async (bookingId: string) => {
    const { data } = await http.post(`/api/bff/bookings/bookings/${bookingId}/cancel/`)
    return data
  },

  concludeSession: async (sessionId: string, attendances: any[]) => {
    const { data } = await http.post(`/api/bff/bookings/sessions/${sessionId}/conclude/`, { attendances })
    return data
  },

  cancelSession: async (sessionId: string, reason: string) => {
    const { data } = await http.post(`/api/bff/bookings/sessions/${sessionId}/cancel/`, { reason })
    return data
  },

  // Obtenir les cours collectifs disponibles (Masterclasses)
  getCollective: async (params?: any) => {
    const { data } = await http.get('/api/bff/bookings/sessions/collective/', { params })
    return data
  },

  // Obtenir toutes les sessions (individuelles + collectives)
  getSessions: async (params?: any) => {
    const { data } = await http.get('/api/bff/bookings/sessions/', { params })
    return data
  },
  
  // Rejoindre une session collective
  joinSession: async (sessionId: string, studentId?: string) => {
    const { data } = await http.post(`/api/bff/bookings/sessions/${sessionId}/join/`, { student_id: studentId })
    return data
  },

  // Obtenir les créneaux générés dynamiquement (Slot Engine)
  getBookableSlots: async (teacherId: string, params?: { start_date?: string, end_date?: string }) => {
    const { data } = await http.get(`/api/bff/bookings/teachers/${teacherId}/bookable-slots/`, { params })
    return data
  },
};


// API pour les paiements
export const paymentApi = {
  getHistory: (params?: any) => http.get('/api/bff/payments/history/', { params }).then(r => r.data),
  getSubscriptions: () => http.get('/api/bff/payments/subscriptions/').then(r => r.data),
  cancelPayment: (id: string) => http.post(`/api/bff/payments/${id}/cancel/`).then(r => r.data),
  initiatePayment: (data: any) => http.post('/api/bff/payments/initiate/', data).then(r => r.data),
};

// API pour les notifications (Phase 15)
export const notificationApi = {
  getAll: () => http.get('/api/bff/notifications/').then(r => r.data),
  markAsRead: (notificationId: string) => http.patch(`/api/bff/notifications/${notificationId}/read/`).then(r => r.data),
  markAllAsRead: () => http.patch('/api/bff/notifications/all/read/').then(r => r.data),
  getPreferences: () => http.get('/api/bff/notifications/preferences/').then(r => r.data),
  updatePreferences: (data: any) => http.put('/api/bff/notifications/preferences/', data).then(r => r.data),
  getUnreadCount: () => http.get('/api/bff/notifications/unread-count/').then(r => r.data),
  delete: (notificationId: string) => http.delete(`/api/bff/notifications/${notificationId}/delete/`).then(r => r.data),
};

// API pour la Gamification & Analytics (Phase E)
export const analyticsApi = {
  getStudentDashboard: () => http.get('/api/bff/analytics/dashboard/student/').then(r => r.data),
  getTeacherDashboard: () => http.get('/api/bff/analytics/dashboard/teacher/').then(r => r.data),
  // Statistiques QCM détaillées par matière (Phase E)
  getMyAnalytics: () => http.get('/api/bff/analytics/student/me/').then(r => r.data),
};

export const reputationApi = {
  // Retourne le score, le niveau et les grades (Architecture 10 niveaux)
  getMe: () => http.get('/api/bff/reputation/me/').then(r => r.data),
  // Retourne les métriques d'engagement réelles
  getEngagement: () => http.get('/api/bff/reputation/engagement/').then(r => r.data),
  // Retourne la liste des badges
  getBadges: () => http.get('/api/bff/reputation/badges/').then(r => r.data),
  
  // Rétrocompatibilité (Optionnel)
  getMyReputation: () => http.get('/api/bff/reputation/me/').then(r => r.data),
};

export const certificateApi = {
  // Mes certificats (privé)
  getMyCertificates: () => http.get('/api/bff/learning/my-certificates/').then(r => r.data),
  // Vérification publique par UUID (sans auth)
  verify: (uuid: string) => http.get(`/api/bff/learning/certificates/verify/${uuid}/`).then(r => r.data),
};

export const referralsApi = {
  getMyCode: () => http.get('/api/bff/referrals/my-code/').then(r => r.data),
};

// API pour le contenu éducatif (Bibliothèque)
export const educationalContentApi = {
  getAll: (params: any) => http.get('/api/bff/educational-content/', { params }).then(r => r.data),
  getProgress: (contentId: string) => http.get('/api/bff/progress/', { params: { content: contentId } }).then(r => r.data),
};

// API pour les annotations/highlights
export const annotationApi = {
  save: (data: { content_id: string; text: string; page_number?: number }) => 
    http.post('/api/bff/annotations/', data).then(r => r.data),
};

// API pour les vidéos publiques (Vault)
export const publicVideoApi = {
  getAll: (password?: string) => {
    const config = password ? { headers: { 'X-Vault-Password': password } } : {}
    return http.get('/api/bff/content/public-videos/', config).then(r => r.data)
  },
  getOne: (id: string) => http.get(`/api/bff/content/public-videos/${id}/`).then(r => r.data),
  create: (data: any, password: string) => 
    http.post('/api/bff/content/public-videos/', data, { headers: { 'X-Vault-Password': password } }).then(r => r.data),
  update: (id: string, data: any, password: string) =>
    http.patch(`/api/bff/content/public-videos/${id}/`, data, { headers: { 'X-Vault-Password': password } }).then(r => r.data),
  delete: (id: string, password: string) =>
    http.delete(`/api/bff/content/public-videos/${id}/`, { headers: { 'X-Vault-Password': password } }).then(r => r.data),
  getQRCodeUrl: (id: string) => `${SERVER_ROOT_URL}api/v1/content/public-videos/${id}/download_qr/`
};

export const adminUsersApi = {
  getUsers: (params?: any) => http.get('/api/bff/admin/users/', { params }).then(r => r.data),
  getUser: (id: string) => http.get(`/api/bff/admin/users/${id}/`).then(r => r.data),
  updateUser: (id: string, data: any) => http.patch(`/api/bff/admin/users/${id}/`, data).then(r => r.data),
  deleteUser: (id: string) => http.delete(`/api/bff/admin/users/${id}/`).then(r => r.data),
  sendEmail: (data: {userId: string, subject: string, message: string}) => http.post('/api/bff/admin/users/send_email', data).then(r => r.data),
};

export const adminModularApi = {
  action: (id: string, actionName: string, data?: any) => http.post(`/api/bff/admin/users/${id}/${actionName}/`, data).then(r => r.data),
};

export const invoiceApi = {
  getInvoices: (params?: any) => http.get('/api/bff/finances/invoices/', { params }).then(r => r.data),
};

export const correctionLockApi = {
  refreshLock: (attemptId: string) => http.post(`/api/bff/assessments/teacher/grading/${attemptId}/refresh_lock/`).then(r => r.data),
};

export const contentStatsApi = {
  getStats: (contentType: string) => http.get('/api/bff/admin/content/', { params: { content_type: contentType } }).then(r => r.data),
};

export default {
  auth: authApi,
  student: studentApi,
  teacher: teacherApi,
  author: authorApi,
  parent: parentApi,
  course: courseApi,
  learning: learningApi,
  assessment: assessmentApi,
  messaging: messagingApi,
  messagingForum: messagingForumApi,
  communications: communicationsApi,
  community: communityApi,
  session: sessionApi,
  booking: bookingApi,
  payment: paymentApi,
  notification: notificationApi,
  analytics: analyticsApi,
  reputation: reputationApi,
  referrals: referralsApi,
  academics: academicsApi,
  availability: availabilityApi,
  educationalContent: educationalContentApi,
  annotation: annotationApi,
  publicVideo: publicVideoApi,
  guidedPaths: {
    getAll: () => http.get('/api/bff/guided-paths/paths/').then(r => r.data),
    getEnrollments: () => http.get('/api/bff/guided-paths/enrollments/').then(r => r.data),
  },
  admin: {
    users: adminUsersApi,
    modular: adminModularApi,
  },
  invoice: invoiceApi,
  correctionLock: correctionLockApi,
  contentStats: contentStatsApi,
};

// API pour la vérification (Phase 16 - Admin)
export const adminVerificationApi = {
  // Liste des dossiers filtrés par statut et rôle
  getSubmissions: async (status: string = 'SUBMITTED', role?: string) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.append('status', status)
    if (role && role !== 'all') params.append('role', role)
    
    const { data } = await http.get(`/api/bff/verification/admin/submissions/?${params.toString()}`)
    return data
  },
  
  // Approuver un dossier
  approve: async (id: string | number, notes: string = "Validé via Admin Dashboard") => {
    const { data } = await http.post(`/api/bff/verification/admin/submissions/${id}/approve/`, { notes })
    return data
  },
  
  // Rejeter un dossier
  reject: async (id: string | number, reason: string) => {
    const { data } = await http.post(`/api/bff/verification/admin/submissions/${id}/reject/`, { reason })
    return data
  },
};

// API pour l'administration des forums
export const adminForumApi = {
  getForums: (page = 1, search = "", level = "", country = "", status = "") => {
    const params = new URLSearchParams()
    if (page) params.append('page', String(page))
    if (search) params.append('search', search)
    if (level && level !== 'all') params.append('level', level)
    if (country && country !== 'all') params.append('country', country)
    if (status && status !== 'all') params.append('status', status)
    return http.get(`/api/bff/admin/forums/?${params.toString()}`).then(r => r.data)
  },
  getModeration: () => http.get('/api/bff/admin/forums/moderation/').then(r => r.data),
  getModerationStats: () => http.get('/api/bff/admin/forums/moderation/stats/').then(r => r.data),
  getStats: () => http.get('/api/bff/admin/forums/stats/').then(r => r.data),
  getAnalytics: () => http.get('/api/bff/admin/forums/analytics/').then(r => r.data),
  createForum: (data: any) => http.post('/api/bff/admin/forums/', data).then(r => r.data),
  updateForum: (id: string, data: any) => http.patch(`/api/bff/admin/forums/${id}/`, data).then(r => r.data),
  resolveModeration: (id: string, action: string) => 
    http.post(`/api/bff/admin/forums/moderation/${id}/resolve/`, { action }).then(r => r.data),
};


// API pour la bibliothèque numérique
export const libraryApi = {
  // Administration
  admin: {
    getBooks: (search = "", status?: string, page = 1) => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (page) params.append('page', String(page))
      const qs = params.toString()
      return http.get(`/api/bff/admin/library/${qs ? `?${qs}` : ''}`).then(r => r.data)
    },
    getAuthors: () => http.get('/api/bff/authors/admin/list/').then(r => r.data),
    createBook: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => http.post('/api/bff/admin/library/', formData, { onUploadProgress }).then(r => r.data),
    updateBook: (id: string, data: any) => http.patch(`/api/bff/admin/library/${id}/`, data).then(r => r.data),
    deleteBook: (id: string) => http.delete(`/api/bff/admin/library/${id}/`).then(r => r.data),
    approve: (id: string) => http.post(`/api/bff/admin/library/${id}/approve/`).then(r => r.data),
    reject: (id: string, reason: string) => http.post(`/api/bff/admin/library/${id}/reject/`, { reason }).then(r => r.data),
  },
  // Étudiants/Public — supporte les filtres par matière, classe, pays et recherche
  getBooks: (search = "", subject?: string, page = 1, gradeLevel?: string, country?: string) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (subject && subject !== 'all') params.append('subject', subject)
    if (gradeLevel && gradeLevel !== 'all') params.append('grade_level', gradeLevel)
    if (country && country !== 'all') params.append('country', country)
    if (page) params.append('page', String(page))
    const qs = params.toString()
    return http.get(`/api/bff/library/books/${qs ? `?${qs}` : ''}`).then(r => r.data)
  },
  getBook: (id: string) => http.get(`/api/bff/library/books/${id}/`).then(r => r.data),

  // Création Enseignant/Auteur
  createBook: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => http.post('/api/bff/library/author-books/', formData, { onUploadProgress }).then(r => r.data),

  // Livres de l'auteur connecté uniquement (endpoint dédié auteur)
  getMyBooks: (search = "", subject?: string, page = 1) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (subject) params.append('subject', subject)
    if (page) params.append('page', String(page))
    const qs = params.toString()
    return http.get(`/api/bff/library/author-books/${qs ? `?${qs}` : ''}`).then(r => r.data)
  },
  deleteBook: (id: string) => http.delete(`/api/bff/library/author-books/${id}/`).then(r => r.data),
  syncProgress: (bookId: string, lastPage: number, totalPages: number) => 
    http.post(`/api/bff/library/progress/${bookId}/sync-page/`, { last_page: lastPage, total_pages: totalPages }).then(r => r.data),
  
  // Annotations
  getAnnotations: (bookId: string) => http.get(`/api/bff/library/annotations/?book=${bookId}`).then(r => r.data),
  saveAnnotation: (data: any) => http.post('/api/bff/library/annotations/', data).then(r => r.data),
  deleteAnnotation: (id: string) => http.delete(`/api/bff/library/annotations/${id}/`).then(r => r.data),

  // Quiz
  quizzes: {
    // Gestion (Admin/Auteur)
    getForBook: (bookId: string) => http.get(`/api/bff/library/quizzes/`, { params: { book: bookId } }).then(r => r.data),
    getById: (id: string) => http.get(`/api/bff/library/quizzes/${id}/`).then(r => r.data),
    create: (data: any) => http.post('/api/bff/library/quizzes/', data).then(r => r.data),
    update: (id: string, data: any) => http.patch(`/api/bff/library/quizzes/${id}/`, data).then(r => r.data),
    delete: (id: string) => http.delete(`/api/bff/library/quizzes/${id}/`).then(r => r.data),
    
    // Réalisation (Élève)
    submit: (quizId: string, answers: any) => http.post(`/api/bff/library/quizzes/${quizId}/submit/`, { answers }).then(r => r.data),
    getAttempts: (quizId?: string) => http.get('/api/bff/library/attempts/', { params: quizId ? { quiz: quizId } : {} }).then(r => r.data),
  },

  // --- Livres Physiques (Admin Freemium) ---
  physicalBooks: {
    BASE: '/api/bff/library/admin/physical-books',

    list: (params?: { search?: string; subject?: string; grade_level?: string }) =>
      http.get('/api/bff/library/admin/physical-books/', { params }).then(r => r.data),

    get: (id: string) =>
      http.get(`/api/bff/library/admin/physical-books/${id}/`).then(r => r.data),

    create: (data: FormData | Record<string, any>) =>
      http.post('/api/bff/library/admin/physical-books/', data).then(r => r.data),

    update: (id: string, data: FormData | Record<string, any>) =>
      http.patch(`/api/bff/library/admin/physical-books/${id}/`, data).then(r => r.data),

    delete: (id: string) =>
      http.delete(`/api/bff/library/admin/physical-books/${id}/`).then(r => r.data),

    // Chapitres
    listChapters: (bookId: string) =>
      http.get(`/api/bff/library/admin/physical-books/${bookId}/chapters/`).then(r => r.data),

    addChapter: (bookId: string, data: { title: string; order: number }) =>
      http.post(`/api/bff/library/admin/physical-books/${bookId}/chapters/add/`, data).then(r => r.data),

    updateChapter: (bookId: string, chapterId: string, data: any) =>
      http.patch(`/api/bff/library/admin/physical-books/${bookId}/chapters/${chapterId}/`, data).then(r => r.data),

    deleteChapter: (bookId: string, chapterId: string) =>
      http.delete(`/api/bff/library/admin/physical-books/${bookId}/chapters/${chapterId}/`).then(r => r.data),

    // Ressources
    addResource: (bookId: string, chapterId: string, data: any) =>
      http.post(`/api/bff/library/admin/physical-books/${bookId}/chapters/${chapterId}/resources/add/`, data).then(r => r.data),

    updateResource: (bookId: string, chapterId: string, resourceId: string, data: any) =>
      http.patch(`/api/bff/library/admin/physical-books/${bookId}/chapters/${chapterId}/resources/${resourceId}/`, data).then(r => r.data),

    deleteResource: (bookId: string, chapterId: string, resourceId: string) =>
      http.delete(`/api/bff/library/admin/physical-books/${bookId}/chapters/${chapterId}/resources/${resourceId}/`).then(r => r.data),

    // Lots QR
    listQRBatches: (bookId: string) =>
      http.get(`/api/bff/library/admin/physical-books/${bookId}/qr-batches/`).then(r => r.data),

    generateQRBatch: (bookId: string, data: { quantity: number; notes?: string }) =>
      http.post(`/api/bff/library/admin/physical-books/${bookId}/qr-batches/generate/`, data).then(r => r.data),

    getQRStats: (bookId: string) =>
      http.get(`/api/bff/library/admin/physical-books/${bookId}/qr-stats/`).then(r => r.data),

    // Recherche de contenu existant (pour le ResourcePicker)
    searchLessons: (q: string, subjectId?: string) =>
      http.get('/api/bff/library/admin/physical-books/search-lessons/', {
        params: { q, ...(subjectId ? { subject: subjectId } : {}) }
      }).then(r => r.data),

    searchQCM: (q: string, subjectId?: string) =>
      http.get('/api/bff/library/admin/physical-books/search-qcm/', {
        params: { q, ...(subjectId ? { subject: subjectId } : {}) }
      }).then(r => r.data),

    searchExercises: (q: string, subjectId?: string) =>
      http.get('/api/bff/library/admin/physical-books/search-exercises/', {
        params: { q, ...(subjectId ? { subject: subjectId } : {}) }
      }).then(r => r.data),
  }
};

export interface PdfPageText {
  page_number: number
  text: string
  is_empty: boolean
}

export interface PdfTextResponse {
  total_pages: number
  pages: PdfPageText[]
}

export const documentApi = {
  getPdfText: (documentId: string): Promise<PdfTextResponse> => 
    http.get('/api/bff/documents/text/', { params: { document_id: documentId } }).then(r => r.data),
};


