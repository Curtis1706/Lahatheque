import { getAuthToken } from "@/lib/auth-token";
// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  }

  if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  if (typeof window !== "undefined") {
    let token = getAuthToken()
    
    if (!token) {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('user_session_client='))
      if (cookie) {
        try {
          const sessionValue = decodeURIComponent(cookie.split('=')[1] || '')
          const session = JSON.parse(sessionValue)
          token = session?.token
        } catch (e) {}
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login?reason=session_expired"
      return Promise.reject(new Error("Session expirée"))
    }
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error?.error || error?.detail || `HTTP ${res.status}`)
  }
  
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentAuthor {
  id: string
  user_id: string
  name: string
  email: string
  details: string
  avatar: string | null
}

export interface QuestionMessage {
  id: string
  user: string
  user_name: string
  user_role: "AUTHOR" | "STUDENT" | "USER"
  user_avatar: string | null
  body: string
  message_type: "text" | "audio" | "video"
  audio_file?: string | null
  video_file?: string | null
  created_at: string
}

export interface StudentExpertQuestion {
  id: string
  subject: string
  author_name: string
  student_name?: string
  author_avatar: string | null
  book?: string
  book_title?: string
  is_answered: boolean
  messages: QuestionMessage[]
  created_at: string
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getStudentAuthors(): Promise<any> {
  return apiFetch<any>("/api/bff/students/dashboard/authors/")
}

export async function getStudentQuestions(): Promise<any> {
  return apiFetch<any>("/api/bff/authors/questions/feed/")
}

export async function getParentChildDiscussions(childId: string, page: number = 1): Promise<any> {
  return apiFetch<any>(`/api/bff/parents/dashboard/child-discussions/?child_id=${childId}&page=${page}`)
}

export async function askExpertQuestion(authorId: string, subject: string, body: string, bookId?: string): Promise<StudentExpertQuestion> {
  return apiFetch<StudentExpertQuestion>("/api/bff/authors/questions/feed/", {
    method: "POST",
    body: JSON.stringify({ author_profile: authorId, subject, body, book: bookId }),
  })
}

export async function replyToQuestion(
  questionId: string, 
  body: string = "", 
  message_type: "text" | "audio" | "video" = "text",
  audio_file?: File | Blob | null,
  video_file?: File | Blob | null
): Promise<QuestionMessage> {
  const formData = new FormData()
  formData.append('body', body)
  formData.append('message_type', message_type)
  
  if (audio_file) {
    // On ajoute une extension pour que Django/Cloudinary détecte le bon type
    const file = audio_file instanceof File ? audio_file : new File([audio_file], "response.webm", { type: "audio/webm" })
    formData.append('audio_file', file)
  }
  
  if (video_file) {
    formData.append('video_file', video_file)
  }

  return apiFetch<QuestionMessage>(`/api/bff/authors/questions/${questionId}/reply/`, {
    method: "POST",
    body: formData,
  })
}

// ─── CRUD (New) ─────────────────────────────────────────────────────────────

export async function updateQuestion(id: string, subject: string): Promise<StudentExpertQuestion> {
  return apiFetch<StudentExpertQuestion>(`/api/bff/authors/questions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ subject }),
  })
}

export async function deleteQuestion(id: string): Promise<void> {
  return apiFetch<void>(`/api/bff/authors/questions/${id}/`, {
    method: "DELETE",
  })
}

export async function updateMessage(id: string, body: string): Promise<QuestionMessage> {
  return apiFetch<QuestionMessage>(`/api/bff/authors/questions/messages/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  })
}

export async function deleteMessage(id: string): Promise<void> {
  return apiFetch<void>(`/api/bff/authors/questions/messages/${id}/`, {
    method: "DELETE",
  })
}

export async function getAuthorQuestionStats(): Promise<{ total: number, answered: number, pending: number, rate: number }> {
  return apiFetch<{ total: number, answered: number, pending: number, rate: number }>("/api/bff/authors/questions/stats/")
}
