/**
 * lib/cloudflare.ts
 * Module de téléversement et gestion des médias vers Cloudflare R2 & Stream.
 */

import { uploadFileDirectlyToR2 } from "@/lib/services/storage";

const R2_PUBLIC_DOMAIN = (
  process.env.NEXT_PUBLIC_R2_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev"
).replace(/\/+$/, "");

/**
 * Téléverse un fichier média vers Cloudflare R2 avec fallback instantané.
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
      const publicUrl = `${R2_PUBLIC_DOMAIN}/${res.fileKey}`;
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
