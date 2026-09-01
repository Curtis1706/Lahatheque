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
  const isFile = avatarFile instanceof File;
  
  console.groupCollapsed(
    `%c[LAHAThèque Telemetry] Envoi Profil & Avatar (%c${isFile ? (avatarFile as File).name : "Texte seul"}%c)`,
    "background: #1B2A4E; color: #B08D42; font-weight: bold; padding: 2px 6px; border-radius: 4px;",
    "color: #3b82f6; font-weight: bold;",
    "color: #B08D42;"
  );

  console.log(`[AUTH SERVICE] [STEP 1] Détails payload:`, {
    has_file: isFile,
    file_name: isFile ? (avatarFile as File).name : null,
    file_size_bytes: isFile ? (avatarFile as File).size : 0,
    file_size_kb: isFile ? ((avatarFile as File).size / 1024).toFixed(1) + " Ko" : null,
    file_type: isFile ? (avatarFile as File).type : null,
    timestamp: new Date().toISOString(),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[AUTH SERVICE] [TIMEOUT 30s] La requête n'a pas répondu après 30s.`);
      controller.abort();
    }, 30000);

    let res: Response;
    let usedEndpoint = '/api/auth/profile';

    try {
      console.log(`[AUTH SERVICE] [STEP 2] Tentative de connexion via ${usedEndpoint}...`);
      res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      usedEndpoint = '/api/bff/auth/profile/';
      console.warn(`[AUTH SERVICE] [FALLBACK] Redirection vers ${usedEndpoint} suite à:`, e);
      res = await fetch('/api/bff/auth/profile/', {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });
    }
    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    console.log(`[AUTH SERVICE] [STEP 3] Réponse HTTP ${res.status} (${res.statusText}) via ${usedEndpoint} reçue en ${elapsed}ms.`);

    const data = await res.json();
    console.log(`[AUTH SERVICE] [STEP 4] Corps de la réponse décodé:`, data);

    if (!res.ok) {
      console.error(`[AUTH SERVICE] [ERROR] Échec (HTTP ${res.status}):`, data.error || data);
      console.groupEnd();
      return { success: false, error: data.error || 'Erreur lors de la mise à jour du profil.' };
    }

    console.log(`[AUTH SERVICE] [STEP 5 - SUCCESS] Profil synchronisé avec succès:`, {
      avatar_url: data.data?.avatar_url || data.avatar_url,
      user_id: data.data?.id || data.id,
      email: data.data?.email || data.email,
      elapsed_ms: elapsed,
      debug_info: data._debug || null,
    });
    console.groupEnd();

    return { success: true, data: data.data || data, message: data.message };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (err?.name === 'AbortError') {
      console.error(`[AUTH SERVICE] [TIMEOUT ERROR] Délai d'attente de 30s dépassé. Le serveur n'a pas répondu.`);
      console.groupEnd();
      return { success: false, error: 'Délai d’attente dépassé (30s) lors de l’envoi de la photo.' };
    }
    console.error(`[AUTH SERVICE] [NETWORK ERROR] Exception attrapée après ${elapsed}ms:`, err);
    console.groupEnd();
    return { success: false, error: 'Impossible de joindre le serveur pour mettre à jour le profil.' };
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
