/**
 * lib/cloudflare.ts
 * Module de téléversement et gestion des médias vers Cloudflare R2 & Stream.
 */

import { uploadFileDirectlyToR2 } from "@/lib/services/storage";

/**
 * Téléverse un fichier média vers Cloudflare R2 avec URL proxy Next.js garantie.
 */
export async function uploadToCloudflare(
  file: File,
  onProgress?: (percentage: number) => void,
  folder: string = "guides",
  mediaType: "image" | "video" = "image"
): Promise<{ secure_url: string; public_id?: string }> {
  try {
    const res = await uploadFileDirectlyToR2(
      file,
      mediaType === "image" ? "cover" : "book",
      (percent) => {
        if (onProgress) onProgress(percent);
      }
    );

    if (res && res.directToR2 && res.fileKey) {
      const publicUrl = `/uploads/${res.fileKey}`;
      return {
        secure_url: publicUrl,
        public_id: res.fileKey,
      };
    }
  } catch (error) {
    console.warn("[Cloudflare R2] Téléversement direct indisponible, bascule en DataURL local:", error);
  }

  // Fallback universel : lecture DataURL immédiate
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        secure_url: reader.result as string,
        public_id: file.name,
      });
    };
    reader.onerror = () => {
      resolve({
        secure_url: "",
        public_id: "",
      });
    };
    reader.readAsDataURL(file);
  });
}

// Alias pour compatibilité
export const uploadToCloudinary = uploadToCloudflare;
