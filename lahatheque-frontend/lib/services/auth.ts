export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country: string;
  role: "student" | "author" | "publisher" | "university" | "teacher" | "wholesaler";
  pen_name?: string;
  bio?: string;
}

export interface UserProfileData {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  role: string;
  active_roles: string[];
  avatar_url?: string | null;
  pen_name?: string;
  university_affiliation?: string;
  bio?: string;
  bank_name?: string;
  iban?: string;
  swift?: string;
  momo_number?: string;
  institution_id?: string | null;
  institution_name?: string | null;
  is_suspended?: boolean;
  is_verified?: boolean;
}

export async function registerUser(
  payload: RegisterPayload, 
  avatarFile?: File | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let body: BodyInit;
    let headers: HeadersInit = {};

    if (avatarFile) {
      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('password', payload.password);
      formData.append('first_name', payload.first_name);
      formData.append('last_name', payload.last_name);
      if (payload.phone) formData.append('phone', payload.phone);
      formData.append('country', payload.country);
      formData.append('role', payload.role);
      if (payload.pen_name) formData.append('pen_name', payload.pen_name);
      if (payload.bio) formData.append('bio', payload.bio);
      formData.append('avatar', avatarFile);
      body = formData;
    } else {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify(payload);
    }

    const res = await fetch('/api/bff/auth/register/', {
      method: 'POST',
      headers,
      body,
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

export async function getProfile(): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
  try {
    const res = await fetch('/api/bff/auth/profile/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur de chargement du profil.' };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Impossible de récupérer le profil.' };
  }
}

export async function updateProfile(formData: FormData): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
  const startTime = Date.now();
  const avatarFile = formData.get("avatar");
  const avatarInfo = avatarFile instanceof File 
    ? `Fichier: "${avatarFile.name}", ${(avatarFile.size / 1024).toFixed(1)} Ko, type: ${avatarFile.type}`
    : "Aucun fichier binaire";
  
  console.log(`[AUTH SERVICE] [PHOTO UPLOAD START] Envoi PATCH /api/bff/auth/profile/ -> ${avatarInfo}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[AUTH SERVICE] [PHOTO UPLOAD TIMEOUT] La requête a dépassé 60 secondes d'attente.`);
      controller.abort();
    }, 60000);

    const res = await fetch('/api/bff/auth/profile/', {
      method: 'PATCH',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    console.log(`[AUTH SERVICE] [PHOTO UPLOAD RESPONSE] Statut HTTP ${res.status} reçu en ${elapsed}ms.`);

    const data = await res.json();
    if (!res.ok) {
      console.error(`[AUTH SERVICE] [PHOTO UPLOAD ERROR] Échec HTTP ${res.status}:`, data);
      return { success: false, error: data.error || 'Erreur lors de la mise à jour du profil.' };
    }

    console.log(`[AUTH SERVICE] [PHOTO UPLOAD SUCCESS] Profil mis à jour:`, {
      avatar_url: data.data?.avatar_url,
      email: data.data?.email,
      elapsed_ms: elapsed,
    });

    return { success: true, data: data.data, message: data.message };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (err?.name === 'AbortError') {
      console.error(`[AUTH SERVICE] [PHOTO UPLOAD TIMEOUT] Délai d'attente de 60s dépassé.`);
      return { success: false, error: 'Délai d’attente dépassé (60s) lors de l’envoi de la photo vers Cloudflare R2.' };
    }
    console.error(`[AUTH SERVICE] [PHOTO UPLOAD NETWORK ERROR] Exception après ${elapsed}ms:`, err);
    return { success: false, error: 'Impossible de mettre à jour le profil.' };
  }
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/bff/auth/change-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la modification du mot de passe.' };
    }

    return { success: true, message: data.message || 'Mot de passe modifié avec succès.' };
  } catch {
    return { success: false, error: 'Impossible de joindre le serveur pour modifier le mot de passe.' };
  }
}
