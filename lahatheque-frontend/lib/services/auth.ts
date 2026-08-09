const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country: string;
  role: "student" | "teacher" | "author" | "publisher";
}

export async function registerUser(payload: RegisterPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  await delay(1000); // simulation délai réseau
  
  if (!payload.email.includes("@")) {
    return { success: false, error: "Adresse email invalide." };
  }

  // Stocker l'utilisateur dans le stockage de session (mock)
  if (typeof window !== "undefined") {
    sessionStorage.setItem("user_role", payload.role);
    sessionStorage.setItem("user_email", payload.email);
    sessionStorage.setItem("user_name", `${payload.first_name} ${payload.last_name}`);
  }

  return {
    success: true,
    data: {
      message: "Inscription réussie",
      role: payload.role,
      email: payload.email
    }
  };
}
