"""
media/stream_client.py — Client HTTP pour l'API Cloudflare Stream.

Centralise tous les appels vers l'API Stream :
- Upload de vidéos (depuis fichier ou URL)
- Récupération du statut d'encodage
- Génération des sous-titres FR (IA native Cloudflare)
- Suppression de vidéos
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

CF_API_BASE = "https://api.cloudflare.com/client/v4"


class CloudflareStreamClient:
    """
    Client pour l'API Cloudflare Stream.
    """

    def __init__(self):
        self.api_token = settings.CLOUDFLARE_STREAM_API_TOKEN
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.subdomain = settings.CLOUDFLARE_STREAM_SUBDOMAIN

    def _headers(self) -> dict:
        """Headers d'authentification Cloudflare Stream."""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def _account_url(self, path: str) -> str:
        """Construit l'URL complète pour un endpoint lié au compte."""
        return f"{CF_API_BASE}/accounts/{self.account_id}{path}"

    def upload_from_url(self, video_url: str, meta: dict = None) -> dict:
        """Uploade une vidéo depuis une URL externe."""
        payload = {
            "url": video_url,
            "meta": meta or {},
            "requireSignedURLs": False,
        }
        response = requests.post(
            self._account_url("/stream/copy"),
            headers=self._headers(),
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"Cloudflare Stream upload error: {errors}")

        return self._parse_video_result(data["result"])

    def create_live_input(self, meta: dict = None) -> dict:
        """
        Crée un Live Input (RTMP) sur Cloudflare Stream.
        """
        payload = {
            "meta": meta or {},
            "recording": {
                "mode": "automatic",
                "requireSignedURLs": False,
                "timeoutSeconds": 0
            }
        }
        response = requests.post(
            self._account_url("/stream/live_inputs"),
            headers=self._headers(),
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"Cloudflare Stream Live Input error: {errors}")
            
        result = data.get("result", {})
        rtmps_data = result.get("rtmps", {})
        
        return {
            "live_input_id": result.get("uid"),
            "rtmp_url": f"{rtmps_data.get('url')}{rtmps_data.get('streamKey')}",
            "stream_key": rtmps_data.get("streamKey"),
            "recording_status": result.get("recording", {}).get("mode"),
        }

    def upload_file(self, file_obj, filename: str = "video.mp4") -> dict:
        """Uploade un fichier vidéo directement (TUS/multipart)."""
        upload_headers = {
            "Authorization": f"Bearer {self.api_token}",
        }
        
        # Ensure we read from the beginning in case the file was read by Django parsers
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
            
        response = requests.post(
            self._account_url("/stream"),
            headers=upload_headers,
            files={"file": (filename, file_obj, "video/mp4")},
            timeout=300,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"Cloudflare Stream upload error: {errors}")

        return self._parse_video_result(data["result"])

    def get_direct_upload_url(self, max_duration: int = 3600, filename: str = "video.mp4") -> dict:
        """Génère une URL d'upload direct à sens unique pour éviter de passer les bytes par notre serveur."""
        payload = {
            "maxDurationSeconds": max_duration,
            "meta": {
                "name": filename
            }
        }
        response = requests.post(
            self._account_url("/stream/direct_upload"),
            headers=self._headers(),
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"Cloudflare Stream direct upload error: {errors}")

        result = data.get("result", {})
        return {
            "upload_url": result.get("uploadURL"),
            "stream_id": result.get("uid"),
        }

    def get_tus_upload_url(self, upload_length: int, filename: str = "video.mp4") -> dict:
        """Génère une URL d'upload direct compatible TUS."""
        import base64
        headers = self._headers()
        # Nom de fichier en base64 pour TUS
        encoded_filename = base64.b64encode(filename.encode('utf-8')).decode('utf-8')
        
        headers.update({
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(upload_length),
            "Upload-Metadata": f"name {encoded_filename}"
        })
        
        response = requests.post(
            self._account_url("/stream?direct_user=true"),
            headers=headers,
            timeout=15,
        )
        response.raise_for_status()
        
        # L'URL TUS est dans le header Location
        location = response.headers.get("Location")
        stream_id = response.headers.get("stream-media-id")
        
        return {
            "upload_url": location,
            "stream_id": stream_id,
        }

    def get_video(self, stream_id: str) -> dict:
        """Récupère les détails d'une vidéo. Lève HTTPError si non trouvée."""
        response = requests.get(
            self._account_url(f"/stream/{stream_id}"),
            headers=self._headers(),
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            raise RuntimeError(f"Cloudflare Stream get_video error: {data.get('errors')}")

        return self._parse_video_result(data["result"])

    def get_video_status(self, stream_id: str) -> dict:
        """
        Vérifie le statut d'encodage d'une vidéo sans lever d'exception sur 404.

        Retourne un dict normalisé :
            status : 'pending' | 'inprogress' | 'ready' | 'error'
            ready  : bool
            ...    : autres champs de _parse_video_result
        """
        response = requests.get(
            self._account_url(f"/stream/{stream_id}"),
            headers=self._headers(),
            timeout=15,
        )

        # 404 = CF n'a pas encore indexé la vidéo (normal juste après TUS)
        if response.status_code == 404:
            return {"status": "pending", "ready": False, "stream_id": stream_id}

        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            logger.warning(f"[Stream] get_video_status errors for {stream_id}: {errors}")
            return {"status": "error", "ready": False, "stream_id": stream_id}

        parsed = self._parse_video_result(data["result"])
        parsed["ready"] = parsed["status"] == "ready"
        return parsed

    def delete_video(self, stream_id: str) -> bool:
        """Supprime une vidéo."""
        response = requests.delete(
            self._account_url(f"/stream/{stream_id}"),
            headers=self._headers(),
            timeout=15,
        )
        if response.status_code == 204:
            return True
        response.raise_for_status()
        return False

    def generate_fr_captions(self, stream_id: str) -> dict:
        """Déclenche la génération automatique de sous-titres en français."""
        response = requests.post(
            self._account_url(f"/stream/{stream_id}/captions/fr/generate"),
            headers=self._headers(),
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            logger.warning(f"[Stream] Génération captions FR échouée pour {stream_id}: {errors}")
            return {"success": False, "errors": errors}

        logger.info(f"[Stream] Génération captions FR déclenchée pour {stream_id}")
        return {"success": True, "result": data.get("result")}

    def _parse_video_result(self, result: dict) -> dict:
        """Normalise la réponse de l'API Stream."""
        stream_id = result.get("uid", "")
        subdomain = self.subdomain

        ready_to_stream = result.get("readyToStream", False)

        # L'API Cloudflare Stream retourne `status` comme une STRING ("queued", "inprogress", "ready", "error")
        # mais anciennement certaines versions retournaient un dict {"state": "..."}.
        # On gère les deux cas pour robustesse.
        status_raw = result.get("status", "")
        if isinstance(status_raw, dict):
            state = status_raw.get("state", "pending")
        elif isinstance(status_raw, str) and status_raw:
            state = status_raw
        else:
            state = "pending"

        # Si readyToStream == True, on force le statut à 'ready' peu importe ce que CF dit
        effective_status = "ready" if ready_to_stream else state

        hls_url = (
            f"https://{subdomain}/{stream_id}/manifest/video.m3u8"
            if ready_to_stream and stream_id
            else ""
        )
        iframe_url = (
            f"https://{subdomain}/{stream_id}/iframe"
            if stream_id
            else ""
        )
        thumbnail_url = (
            f"https://{subdomain}/{stream_id}/thumbnails/thumbnail.jpg"
            if ready_to_stream and stream_id
            else ""
        )

        return {
            "stream_id": stream_id,
            "status": effective_status,
            "hls_url": hls_url,
            "iframe_url": iframe_url,
            "thumbnail_url": thumbnail_url,
            "duration": result.get("duration"),
            "size": result.get("size"),
            "meta": result.get("meta", {}),
        }
