/**
 * lib/services/storage.ts
 * Service universel de téléversement direct vers Cloudflare R2 (S3 Presigned URLs).
 */

export interface PresignedUrlResponse {
  direct_to_r2: boolean;
  upload_url?: string;
  file_key?: string;
  bucket?: string;
  message?: string;
}

export interface UploadProgressCallback {
  (percentage: number, loadedBytes: number, totalBytes: number): void;
}

/**
 * Demande une URL présignée temporaire au backend pour Cloudflare R2.
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  fileType: "book" | "cover" = "book"
): Promise<PresignedUrlResponse> {
  const res = await fetch("/api/bff/catalog/my-deposits/presigned-upload-url/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      filename,
      content_type: contentType,
      file_type: fileType,
    }),
  });

  if (!res.ok) {
    console.warn("[Storage Service] Échec récupération Presigned URL -> fallback standard:", res.status);
    return { direct_to_r2: false };
  }

  const json = await res.json();
  return json.data || { direct_to_r2: false };
}

/**
 * Téléverse un fichier directement vers Cloudflare R2 via HTTP PUT avec suivi de progression réel.
 */
export async function uploadFileDirectlyToR2(
  file: File,
  fileType: "book" | "cover" = "book",
  onProgress?: UploadProgressCallback
): Promise<{ fileKey?: string; directToR2: boolean }> {
  const presigned = await getPresignedUploadUrl(
    file.name,
    file.type || (fileType === "cover" ? "image/jpeg" : "application/pdf"),
    fileType
  );

  const { upload_url: uploadUrl, file_key: fileKey, direct_to_r2: directToR2 } = presigned;

  if (!directToR2 || !uploadUrl || !fileKey) {
    console.log("[Storage Service] Téléversement R2 direct indisponible -> mode multipart classique.");
    return { directToR2: false };
  }

  console.log(`[Storage Service] Début du téléversement DIRECT vers Cloudflare R2 pour « ${file.name} » (${(file.size / (1024 * 1024)).toFixed(2)} Mo)...`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || (fileType === "cover" ? "image/jpeg" : "application/pdf"));

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent, event.loaded, event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`[Storage Service SUCCESS] Téléversement R2 direct réussi pour « ${presigned.file_key} » !`);
        resolve({ fileKey: presigned.file_key, directToR2: true });
      } else {
        console.error(`[Storage Service ERROR] Échec PUT R2 (HTTP ${xhr.status}) :`, xhr.responseText);
        reject(new Error(`Échec du téléversement direct vers Cloudflare R2 (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      console.error("[Storage Service ERROR] Erreur réseau lors du téléversement direct R2.");
      reject(new Error("Erreur réseau lors du téléversement vers Cloudflare R2."));
    };

    xhr.send(file);
  });
}
