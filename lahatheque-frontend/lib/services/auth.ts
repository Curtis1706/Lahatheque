export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country: string;
  role: "student" | "teacher" | "author" | "publisher" | "librarian";
}

export async function registerUser(payload: RegisterPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || data.detail || 'Erreur lors de l\'inscription.' };
    }

    return {
      success: true,
      data: data,
    };
  } catch {
    return { success: false, error: 'Impossible d\'effectuer l\'inscription. Vérifiez votre connexion.' };
  }
}
