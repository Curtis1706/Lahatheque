/**
 * Module d'upload et de gestion des médias Cloudflare (R2 & Stream).
 */
export async function uploadToCloudflare(...args: any[]): Promise<any> {
  return { secure_url: "" };
}

// Alias pour compatibilité
export const uploadToCloudinary = uploadToCloudflare;
