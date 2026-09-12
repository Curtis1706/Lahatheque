"""
Service d'analyse forensique, d'extraction de filigranes et de traçabilité de fuites.
Permet d'inspecter les fichiers suspects (PDF, images, photos de smartphone),
d'extraire les tatouages invisibles et filigranes semi-transparents, et de corréler
avec les enregistrements réels (User, TraceAcces, Commande).
Conforme au plan d'implémentation SpecKit 007 et aux principes constitutionnels.
"""

import os
import io
import re
import json
import base64
import hashlib
import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from django.conf import settings
from django.utils import timezone
from django.db.models import Q

import fitz  # PyMuPDF
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .models import ForensicInvestigation, TraceAcces
from apps.accounts.models import User
from apps.catalog.models import Ouvrage

logger = logging.getLogger(__name__)


class ForensicService:
    """
    Moteur unifié d'investigation forensique pour la détection de fuites de documents protégés.
    """

    @classmethod
    def analyze_evidence(
        cls,
        file_bytes: bytes,
        file_name: str,
        admin_user: Any,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Point d'entrée principal pour analyser un fichier suspect (PDF ou Image).
        Calcule le hachage SHA-256, exécute l'inspection adéquate, effectue la corrélation
        en base de données et consigne l'enquête dans ForensicInvestigation.
        """
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)
        lower_name = file_name.lower()

        is_pdf = file_bytes.startswith(b"%PDF") or lower_name.endswith(".pdf")
        file_type = "pdf" if is_pdf else "image"

        logger.info(
            f"[FORENSIC ANALYZE START] Fichier: {file_name} | Type: {file_type} | "
            f"Taille: {file_size} octets | SHA-256: {file_hash[:12]}... | Par: {admin_user.email}"
        )

        extracted_data: Dict[str, Any] = {}
        analysis_mode = "inconclusive"
        certainty_score = 0

        if is_pdf:
            pdf_result = cls.inspect_pdf_watermark(file_bytes)
            if pdf_result.get("detected"):
                extracted_data = pdf_result
                analysis_mode = "pdf_steganography"
                certainty_score = 100 if pdf_result.get("signature_valid") else 90
            else:
                # Tentative de balayage binaire brut de secours
                raw_result = cls.scan_pdf_raw_stream(file_bytes)
                if raw_result.get("detected"):
                    extracted_data = raw_result
                    analysis_mode = "pdf_steganography"
                    certainty_score = 85
        else:
            # Traitement d'image : captures d'écran et photos de smartphones
            img_result = cls.analyze_image_evidence(file_bytes)
            extracted_data = img_result
            analysis_mode = img_result.get("analysis_mode", "local_ocr")
            certainty_score = img_result.get("confidence_score", 0)

        # Corrélation croisée en base de données
        correlation = cls.correlate_with_database(extracted_data)

        # Ajustement du score de certitude basé sur la corrélation réelle
        if correlation.get("suspect_user"):
            if certainty_score < 75:
                certainty_score = 85
            if extracted_data.get("signature_valid"):
                certainty_score = 100
            status_result = "identified"
            status_message = "Fuite documentaire et lecteur source formellement identifiés."
        elif correlation.get("is_partner_reader"):
            p_name = correlation.get("partner_app_name") or "Partenaire SaaS"
            if certainty_score < 75:
                certainty_score = 85
            if extracted_data.get("signature_valid"):
                certainty_score = 100
            status_result = "identified"
            status_message = f"Fuite documentaire et lecteur externe formellement identifiés chez le partenaire {p_name}."
        elif correlation.get("matched_traces"):
            certainty_score = max(certainty_score, 70)
            status_result = "inconclusive"
            status_message = "Traces d'accès correspondantes localisées sans certitude absolue sur l'utilisateur."
        else:
            if certainty_score == 0:
                status_result = "no_trace"
                status_message = "Aucun marqueur ni filigrane LAHAThèque valide détecté dans ce document."
            else:
                status_result = "inconclusive"
                status_message = "Filigrane partiel détecté, mais aucune correspondance trouvée dans les comptes actifs."

        suspect_user = correlation.get("suspect_user")
        ouvrage = correlation.get("ouvrage")
        order_ref = correlation.get("purchase_details", {}).get("reference", "")

        # Persistance dans le journal d'audit des investigations
        investigation = ForensicInvestigation.objects.create(
            admin_user=admin_user,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            file_hash=file_hash,
            analysis_mode=analysis_mode,
            certainty_score=certainty_score,
            status=status_result,
            detected_payload=extracted_data,
            suspect_user=suspect_user,
            suspect_email=extracted_data.get("email") or (suspect_user.email if suspect_user else ""),
            suspect_ip=extracted_data.get("ip_address") or None,
            ouvrage=ouvrage,
            order_reference=order_ref,
            notes=notes,
            actions_taken=[]
        )

        logger.info(
            f"[FORENSIC ANALYZE COMPLETED] Enquête #{investigation.id} | Statut: {status_result} | "
            f"Score: {certainty_score}% | Suspect: {suspect_user.email if suspect_user else (extracted_data.get('email') or 'Aucun')}"
        )

        # Construction du payload de réponse unifié
        return {
            "investigation_id": str(investigation.id),
            "file_name": file_name,
            "file_hash": file_hash,
            "file_size": file_size,
            "file_type": file_type,
            "analysis_mode": analysis_mode,
            "certainty_score": certainty_score,
            "status": status_result,
            "message": status_message,
            "extracted_data": {
                "user_id": extracted_data.get("user_id"),
                "email": extracted_data.get("email"),
                "ip_address": extracted_data.get("ip_address"),
                "device_fingerprint": extracted_data.get("device_fingerprint"),
                "signature_valid": extracted_data.get("signature_valid", False),
                "raw_text_detected": extracted_data.get("raw_text_detected", "")
            },
            "suspect_profile": correlation.get("suspect_profile"),
            "book_details": correlation.get("book_details"),
            "purchase_details": correlation.get("purchase_details"),
            "matched_traces": correlation.get("matched_traces", []),
            "available_actions": {
                "can_suspend": bool(suspect_user and not getattr(suspect_user, "is_suspended", False)),
                "can_block_partner": bool(correlation.get("is_partner_reader") or (not suspect_user and (extracted_data.get("email") or extracted_data.get("ip_address")))),
                "can_revoke_sessions": bool(suspect_user or correlation.get("is_partner_reader")),
                "can_download_report": True
            }
        }

    # =========================================================================
    # 1. Inspection Stéganographique et Binaire PDF
    # =========================================================================

    @classmethod
    def inspect_pdf_watermark(cls, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Inspecte les pages du PDF avec PyMuPDF pour détecter les chaînes de tatouage
        invisible 'LTQ:{...}' et vérifie la signature SHA-256 dans les métadonnées.
        """
        result: Dict[str, Any] = {"detected": False}
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"[FORENSIC PDF] Impossible d'ouvrir le flux PDF: {e}")
            return result

        metadata = doc.metadata or {}
        keywords = metadata.get("keywords", "")
        ltq_sig_match = re.search(r"LTQ_SIG:([a-f0-9]{64})", keywords)
        expected_sig = ltq_sig_match.group(1) if ltq_sig_match else None

        # Parcourt les pages à la recherche du texte stéganographique LTQ:
        for page_idx, page in enumerate(doc):
            try:
                text_page = page.get_text("text")
                # Recherche directe dans le texte extrait
                ltq_match = re.search(r"LTQ:(\{.*?\})", text_page)
                if not ltq_match:
                    # Recherche dans les blocs textuels détaillés (taille 1 pt, coordonnées bas de page)
                    blocks = page.get_text("blocks")
                    for b in blocks:
                        block_text = b[4] if len(b) > 4 else ""
                        if "LTQ:{" in block_text:
                            ltq_match = re.search(r"LTQ:(\{.*?\})", block_text)
                            if ltq_match:
                                break

                if ltq_match:
                    payload_raw = ltq_match.group(1)
                    try:
                        payload = json.loads(payload_raw)
                        uid = payload.get("uid")
                        em = payload.get("em")
                        ip = payload.get("ip")
                        dev = payload.get("dev", "")
                        sig = payload.get("sig", "")

                        # Vérification cryptographique de la signature
                        signature_valid = False
                        if expected_sig:
                            computed_sig = hashlib.sha256(payload_raw.encode()).hexdigest()
                            signature_valid = (computed_sig == expected_sig)
                        elif sig:
                            computed_short = hashlib.sha256(f"{uid}:{em}:{ip}".encode()).hexdigest()[:16]
                            signature_valid = (computed_short == sig)

                        result = {
                            "detected": True,
                            "user_id": str(uid) if uid else None,
                            "email": em,
                            "ip_address": ip,
                            "device_fingerprint": dev,
                            "signature_valid": signature_valid,
                            "page_index": page_idx + 1,
                            "raw_text_detected": f"LTQ:{payload_raw}"
                        }
                        logger.info(f"[FORENSIC PDF] Tatouage invisible décodé page {page_idx + 1}: {em} ({ip})")
                        doc.close()
                        return result
                    except Exception as parse_err:
                        logger.warning(f"[FORENSIC PDF] Erreur parsing JSON du tatouage: {parse_err}")
            except Exception as page_err:
                logger.warning(f"[FORENSIC PDF] Erreur examen page {page_idx + 1}: {page_err}")

        doc.close()
        return result

    @classmethod
    def scan_pdf_raw_stream(cls, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Balayage binaire de secours en cas de PDF dont la structure d'arbre est endommagée.
        Recherche par expression régulière sur le flux brut décompressé.
        """
        result: Dict[str, Any] = {"detected": False}
        match = re.search(rb"LTQ:(\{.*?\})", pdf_bytes)
        if match:
            try:
                payload_str = match.group(1).decode("utf-8", errors="ignore")
                payload = json.loads(payload_str)
                result = {
                    "detected": True,
                    "user_id": str(payload.get("uid", "")),
                    "email": payload.get("em", ""),
                    "ip_address": payload.get("ip", ""),
                    "device_fingerprint": payload.get("dev", ""),
                    "signature_valid": False,
                    "raw_text_detected": f"LTQ:{payload_str}"
                }
            except Exception as e:
                logger.warning(f"[FORENSIC PDF RAW] Erreur décodage payload brut: {e}")
        return result

    # =========================================================================
    # 2. Prétraitement d'Image et Détection sur Captures / Photos
    # =========================================================================

    @classmethod
    def analyze_image_evidence(cls, image_bytes: bytes) -> Dict[str, Any]:
        """
        Pipeline haute performance pour l'inspection d'images et captures d'écran :
        1. Priorité absolue à la Vision Multimodale (OpenAI GPT-4o-mini Vision) :
           Détection quasi-instantanée (2 à 4 secondes) des filigranes transparents (20%)
           et diagonaux (45°), là où les OCRs traditionnels échouent ou prennent des minutes.
        2. Repli rapide sur OCR Tesseract local (avec redimensionnement et timeout strict de 8s)
           si l'API Vision n'est pas configurée ou indisponible.
        """
        api_key = getattr(settings, "OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
        if api_key:
            logger.info("[FORENSIC IMAGE] Lancement prioritaire de la vision multimodale...")
            try:
                vision_result = cls.multimodal_vision_extract(image_bytes)
                if vision_result.get("detected"):
                    return vision_result
                logger.info("[FORENSIC IMAGE] Vision multimodale n'a pas détecté de filigrane probant, repli sur OCR local...")
            except Exception as vision_err:
                logger.warning(f"[FORENSIC IMAGE] Échec vision multimodale ({vision_err}), repli sur OCR local...")

        # 2. Prétraitement et OCR local rapide sécurisé par timeout strict
        preprocessed_img, raw_text_local = cls.preprocess_and_local_ocr(image_bytes)
        detected_emails = cls.extract_emails_from_text(raw_text_local)
        detected_ips = cls.extract_ips_from_text(raw_text_local)

        if detected_emails or detected_ips:
            return {
                "detected": True,
                "analysis_mode": "local_ocr",
                "confidence_score": 90 if (detected_emails and detected_ips) else 75,
                "email": detected_emails[0] if detected_emails else "",
                "ip_address": detected_ips[0] if detected_ips else "",
                "raw_text_detected": raw_text_local.strip()
            }

        return {
            "detected": False,
            "analysis_mode": "inconclusive",
            "confidence_score": 0,
            "email": "",
            "ip_address": "",
            "raw_text_detected": raw_text_local.strip()
        }

    @classmethod
    def _run_safe_tesseract_ocr(cls, pil_image: Image.Image, timeout_seconds: float = 4.0) -> str:
        """
        Exécute Tesseract OCR avec un isolement système natif et inviolable :
        1. Vérifie si le binaire 'tesseract' existe dans le PATH.
        2. Sauvegarde l'image dans un fichier temporaire disque pour éviter tout verrou de mémoire partagée.
        3. Lance le processus avec start_new_session=True (sur POSIX) et OMP_THREAD_LIMIT=1.
        4. Si le processus dépasse le délai strict, proc.kill() (ou SIGKILL de groupe)
           l'extermine immédiatement et garantit un retour à Django en moins de timeout_seconds.
        """
        import shutil
        import subprocess
        import tempfile
        import signal

        tesseract_bin = shutil.which("tesseract")
        if not tesseract_bin:
            logger.info("[FORENSIC OCR] Binaire système 'tesseract' absent, OCR local ignoré instantanément.")
            return ""

        tmp_in_path = None
        tmp_out_base = None
        tmp_out_txt = None

        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in_path = tmp_in.name
                pil_image.save(tmp_in_path, format="PNG")

            tmp_out_base = tmp_in_path + "_out"
            tmp_out_txt = tmp_out_base + ".txt"

            env = os.environ.copy()
            env["OMP_THREAD_LIMIT"] = "1"
            env["OMP_NUM_THREADS"] = "1"

            # Arguments optimisés pour détection ultra-rapide de texte/filigrane
            cmd = [
                tesseract_bin,
                tmp_in_path,
                tmp_out_base,
                "-l", "fra+eng",
                "--psm", "11",
                "--oem", "1"
            ]

            is_posix = os.name != "nt"
            popen_kwargs = {
                "stdout": subprocess.DEVNULL,
                "stderr": subprocess.DEVNULL,
                "env": env
            }
            if is_posix:
                popen_kwargs["start_new_session"] = True

            logger.info(f"[FORENSIC OCR] Lancement Tesseract subprocess (timeout={timeout_seconds}s)...")
            proc = subprocess.Popen(cmd, **popen_kwargs)

            try:
                proc.wait(timeout=timeout_seconds)
            except subprocess.TimeoutExpired:
                logger.warning(f"[FORENSIC OCR] Timeout dur de {timeout_seconds}s dépassé, terminaison immédiate.")
                try:
                    if is_posix and hasattr(os, "killpg"):
                        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                    else:
                        proc.kill()
                except Exception:
                    proc.kill()
                proc.wait()
                return ""

            if os.path.exists(tmp_out_txt):
                with open(tmp_out_txt, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()

            return ""
        except Exception as ocr_err:
            logger.warning(f"[FORENSIC OCR] Exception OCR sécurisé: {ocr_err}")
            return ""
        finally:
            for path in [tmp_in_path, tmp_out_txt]:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except OSError:
                        pass

    @classmethod
    def preprocess_and_local_ocr(cls, image_bytes: bytes) -> Tuple[Image.Image, str]:
        """
        Applique un prétraitement doux sur l'image pour révéler les filigranes
        sans générer de bruit haute-fréquence qui ferait caler l'OCR,
        puis exécute l'OCR Tesseract de manière isolée et chronométrée.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))

            # Redimensionner l'image si elle est trop grande (max 1024px) pour préserver le CPU
            max_dim = 1024
            if max(image.size) > max_dim:
                image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            # Normalisation en mode RGB
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            # 1. Conversion en niveaux de gris
            gray = ImageOps.grayscale(image)

            # 2. Expansion dynamique de contraste modérée (sans bruit de moiré excessif)
            contrast_enhancer = ImageEnhance.Contrast(gray)
            enhanced = contrast_enhancer.enhance(1.4)

            # 3. Rehaussement subtil de la netteté
            sharpness_enhancer = ImageEnhance.Sharpness(enhanced)
            sharpened = sharpness_enhancer.enhance(1.2)

            raw_text = cls._run_safe_tesseract_ocr(sharpened, timeout_seconds=4.0)
            if raw_text:
                logger.info(f"[FORENSIC OCR] Texte extrait ({len(raw_text)} caractères) : {raw_text[:120].strip()}...")

            return sharpened, raw_text
        except Exception as e:
            logger.error(f"[FORENSIC PREPROCESS] Erreur prétraitement image: {e}")
            return Image.new("RGB", (100, 100)), ""

    @classmethod
    def multimodal_vision_extract(cls, image_bytes: bytes) -> Dict[str, Any]:
        """
        Bascule sur le modèle de vision multimodale OpenAI pour décoder
        les filigranes transparents sur les captures d'écran ou photos de smartphones.
        Exécution ultra-rapide (2 à 4 secondes) sécurisée par timeout réseau strict et 0 retry.
        """
        try:
            import openai
            import httpx
            api_key = getattr(settings, "OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
            if not api_key or api_key.startswith("your_api") or len(api_key) < 20:
                logger.warning("[FORENSIC VISION] Aucune clé OPENAI_API_KEY valide configurée.")
                return {"detected": False}

            client = openai.OpenAI(
                api_key=api_key,
                timeout=httpx.Timeout(8.0, connect=3.0),
                max_retries=0
            )

            # Compression légère de l'image en JPEG base64 (max 1024px) pour transmission instantanée
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            max_size = 1024
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=75)
            b64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

            prompt = (
                "Tu es un expert judiciaire et forensique spécialisé dans l'analyse de documents numériques et la traçabilité des fuites.\n"
                "Cette image est une capture d'écran ou une photographie d'un document sécurisé de la plateforme LAHAThèque.\n"
                "Sur cette page se trouve un filigrane semi-transparent (opacité 15% à 30%), souvent situé en diagonale centrale, en arrière-plan, en en-tête ou en pied de page.\n"
                "Ce filigrane contient généralement des mentions telles que: 'Licence accordée à [Nom] ([email]) - IP: [adresse IP]', ou 'Document Certifié LAHAThèque', ou un identifiant de session.\n\n"
                "Inspecte attentivement l'image entière et réponds STRICTEMENT sous forme d'un objet JSON valide contenant:\n"
                "{\n"
                "  \"detected\": true | false,\n"
                "  \"email\": \"adresse email détectée ou chaîne vide\",\n"
                "  \"ip_address\": \"adresse IP détectée ou chaîne vide\",\n"
                "  \"user_name\": \"nom complet du lecteur ou chaîne vide\",\n"
                "  \"raw_text\": \"texte exact du filigrane lu sur l'image\",\n"
                "  \"confidence\": nombre entre 0 et 100\n"
                "}"
            )

            logger.info("[FORENSIC VISION] Appel OpenAI GPT-4o-mini Vision pour analyse haute précision...")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{b64_image}", "detail": "high"}
                            }
                        ]
                    }
                ],
                max_tokens=350,
                temperature=0.1,
                timeout=8.0
            )

            content = response.choices[0].message.content or "{}"
            cleaned_content = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE).strip()
            data = json.loads(cleaned_content)

            if data.get("detected") and (data.get("email") or data.get("ip_address")):
                logger.info(f"[FORENSIC VISION] Filigrane extrait par vision: {data.get('email')} - {data.get('ip_address')}")
                return {
                    "detected": True,
                    "analysis_mode": "multimodal_vision",
                    "confidence_score": min(95, max(75, int(data.get("confidence", 85)))),
                    "email": data.get("email", ""),
                    "ip_address": data.get("ip_address", ""),
                    "user_name": data.get("user_name", ""),
                    "raw_text_detected": data.get("raw_text", "")
                }
            elif data.get("raw_text"):
                logger.info(f"[FORENSIC VISION] Texte partiel détecté sans email/ip: {data.get('raw_text')}")
                return {
                    "detected": True,
                    "analysis_mode": "multimodal_vision",
                    "confidence_score": min(70, int(data.get("confidence", 50))),
                    "email": data.get("email", ""),
                    "ip_address": data.get("ip_address", ""),
                    "user_name": data.get("user_name", ""),
                    "raw_text_detected": data.get("raw_text", "")
                }
        except Exception as e:
            logger.error(f"[FORENSIC VISION] Erreur appel vision multimodale: {e}")

        return {"detected": False}

    # =========================================================================
    # 3. Corrélation en Base de Données
    # =========================================================================

    @classmethod
    def correlate_with_database(cls, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Croise les données extraites (user_id, email, ip) avec les modèles réels :
        User, TraceAcces, Ouvrage et Commande.
        """
        user_id = extracted_data.get("user_id")
        email = extracted_data.get("email")
        ip = extracted_data.get("ip_address")

        suspect_user: Optional[User] = None
        matched_traces: List[Dict[str, Any]] = []
        ouvrage: Optional[Ouvrage] = None
        purchase_details: Dict[str, Any] = {}

        # 1. Recherche de l'utilisateur par UUID ou par email exact
        if user_id:
            try:
                suspect_user = User.objects.select_related("institution").filter(id=user_id).first()
            except Exception:
                pass

        if not suspect_user and email:
            suspect_user = User.objects.select_related("institution").filter(
                Q(email__iexact=email) | Q(username__iexact=email)
            ).first()

        # 2. Si pas d'utilisateur exact mais une adresse IP, recherche dans TraceAcces
        traces_qs = TraceAcces.objects.select_related("user", "ouvrage", "institution").all()
        if suspect_user:
            user_traces = traces_qs.filter(user=suspect_user)[:5]
        elif ip:
            user_traces = traces_qs.filter(ip_address=ip)[:5]
            if user_traces.exists() and user_traces.first().user:
                suspect_user = user_traces.first().user
        else:
            user_traces = []

        for t in user_traces:
            if not ouvrage and t.ouvrage:
                ouvrage = t.ouvrage
            matched_traces.append({
                "id": str(t.id),
                "ip_address": t.ip_address,
                "country": t.country or "BJ",
                "device_fingerprint": t.device_fingerprint or "Appareil Sécurisé",
                "access_type": t.access_type,
                "page_number": t.page_number,
                "timestamp": t.timestamp.isoformat()
            })

        # 3. Recherche des détails de commande d'achat si utilisateur identifié
        if suspect_user:
            try:
                from apps.commerce.models import Order, LigneCommande
                order_item = LigneCommande.objects.filter(
                    commande__user=suspect_user
                ).select_related("commande", "ouvrage").order_by("-commande__created_at").first()

                if order_item:
                    cmd = order_item.commande
                    if not ouvrage:
                        ouvrage = order_item.ouvrage
                    purchase_details = {
                        "order_id": str(cmd.id),
                        "reference": f"CMD-{str(cmd.id)[:8]}",
                        "purchase_date": cmd.created_at.isoformat() if hasattr(cmd, "created_at") else "",
                        "amount": float(getattr(cmd, "total_amount", 0.0) or 0.0),
                        "currency": str(getattr(cmd, "currency", "XOF")),
                        "payment_method": getattr(cmd, "mode_paiement", "Mobile Money")
                    }
            except Exception as cmd_err:
                logger.warning(f"[FORENSIC] Erreur recherche commande: {cmd_err}")

        # 4. Construction du profil suspect (Compte Local ou Lecteur Tiers Partenaire SaaS)
        suspect_profile = None
        is_partner_reader = False
        partner_app_name = ""

        if suspect_user:
            inst_name = suspect_user.institution.name if getattr(suspect_user, "institution", None) else ""
            suspect_profile = {
                "id": str(suspect_user.id),
                "full_name": f"{suspect_user.first_name} {suspect_user.last_name}".strip() or suspect_user.username,
                "email": suspect_user.email,
                "role": suspect_user.role,
                "phone": suspect_user.phone or "",
                "country": suspect_user.country or "BJ",
                "university_affiliation": suspect_user.university_affiliation or inst_name,
                "institution_name": inst_name,
                "is_partner_reader": False,
                "is_suspended": getattr(suspect_user, "is_suspended", False),
                "suspension_reason": getattr(suspect_user, "suspension_reason", ""),
                "created_at": suspect_user.date_joined.isoformat() if hasattr(suspect_user, "date_joined") else ""
            }
        else:
            # Recherche dans les utilisateurs de SaaS partenaires (LAHALEX, Universités, API)
            try:
                from apps.reader.models import PartnerEndUser, ReaderSession
                partner_end_user = None
                if email:
                    partner_end_user = PartnerEndUser.objects.select_related("partner").filter(email__iexact=email).first()
                if not partner_end_user and user_id and str(user_id).startswith("partner:"):
                    parts = str(user_id).split(":")
                    if len(parts) >= 3:
                        p_id, ext_ref = parts[1], parts[2]
                        partner_end_user = PartnerEndUser.objects.select_related("partner").filter(
                            external_ref=ext_ref
                        ).first()

                if partner_end_user:
                    is_partner_reader = True
                    p_app = partner_end_user.partner
                    partner_app_name = p_app.name if p_app else "Partenaire API"
                    suspect_profile = {
                        "id": f"partner:{p_app.id if p_app else 'ext'}:{partner_end_user.external_ref}",
                        "full_name": partner_end_user.display_name or partner_end_user.external_ref,
                        "email": partner_end_user.email or email or "",
                        "role": "Lecteur SaaS Partenaire",
                        "partner_name": partner_app_name,
                        "partner_id": str(p_app.id) if p_app else "",
                        "is_partner_reader": True,
                        "country": "BJ",
                        "university_affiliation": partner_app_name,
                        "institution_name": partner_app_name,
                        "is_suspended": False,
                        "suspension_reason": "",
                        "created_at": partner_end_user.created_at.isoformat() if hasattr(partner_end_user, "created_at") else ""
                    }
                    # Recherche de session et ouvrage associé
                    p_sess = ReaderSession.objects.filter(end_user=partner_end_user).select_related("ouvrage").order_by("-created_at").first()
                    if p_sess:
                        if not ouvrage and p_sess.ouvrage:
                            ouvrage = p_sess.ouvrage
                        if not matched_traces:
                            sess_ip = (p_sess.metadata.get("user_ip") if isinstance(p_sess.metadata, dict) else None) or ip or "127.0.0.1"
                            matched_traces.append({
                                "id": str(p_sess.id),
                                "ip_address": sess_ip,
                                "country": (p_sess.metadata.get("country") if isinstance(p_sess.metadata, dict) else "BJ") or "BJ",
                                "device_fingerprint": f"Liseuse SaaS ({partner_app_name})",
                                "access_type": "api_stream",
                                "page_number": p_sess.last_page or 1,
                                "timestamp": p_sess.created_at.isoformat() if p_sess.created_at else timezone.now().isoformat()
                            })
            except Exception as partner_err:
                logger.warning(f"[FORENSIC] Erreur recherche lecteur partenaire: {partner_err}")

        book_details = None
        if ouvrage:
            book_details = {
                "id": str(ouvrage.id),
                "title": ouvrage.title,
                "author": getattr(ouvrage, "author_name", "") or "Auteur LAHAThèque",
                "cover_url": ouvrage.cover_image.url if getattr(ouvrage, "cover_image", None) else ""
            }

        return {
            "suspect_user": suspect_user,
            "suspect_profile": suspect_profile,
            "is_partner_reader": is_partner_reader,
            "partner_app_name": partner_app_name,
            "ouvrage": ouvrage,
            "book_details": book_details,
            "purchase_details": purchase_details,
            "matched_traces": matched_traces
        }

    # =========================================================================
    # 4. Actions Administratives Immédiates (Sanctions)
    # =========================================================================

    @classmethod
    def mitigate_infraction(
        cls,
        investigation_id: str,
        action: str,
        reason: str,
        admin_user: Any
    ) -> Dict[str, Any]:
        """
        Applique les sanctions administratives directes :
        - 'suspend_user' : Passe le compte en is_suspended=True et incrémente session_version.
        - 'revoke_sessions' : Incrémente uniquement session_version pour forcer la déconnexion.
        """
        investigation = ForensicInvestigation.objects.select_related("suspect_user").filter(id=investigation_id).first()
        if not investigation:
            raise ValueError("Dossier d'investigation introuvable.")

        suspect = investigation.suspect_user
        actions_taken = list(investigation.actions_taken or [])
        msg = ""

        if action == "block_partner_reader" or (not suspect and action in ["suspend_user", "block_reader"]):
            from .models import BlockedReaderIdentity
            from apps.reader.models import ReaderSession
            payload = investigation.detected_payload or {}
            r_email = investigation.suspect_email or payload.get("email", "")
            r_ip = investigation.suspect_ip or payload.get("ip_address")
            r_dev = payload.get("device_fingerprint", "")
            p_id = str(payload.get("partner_id") or "")

            blocked_obj, _ = BlockedReaderIdentity.objects.get_or_create(
                reader_email=r_email,
                defaults={
                    "partner_id": p_id,
                    "device_fingerprint": r_dev,
                    "ip_address": r_ip,
                    "reason": reason or f"Fuite documentaire #{str(investigation.id)[:8]}",
                    "blocked_by": admin_user,
                    "forensic_investigation": investigation,
                    "is_active": True
                }
            )
            revoked_count = 0
            if r_email:
                revoked_count = ReaderSession.objects.filter(end_user__email__iexact=r_email, is_revoked=False).update(
                    is_revoked=True,
                    revoked_reason=f"Identité bloquée suite à fuite documentaire #{str(investigation.id)[:8]}"
                )
            if "partner_reader_blocked" not in actions_taken:
                actions_taken.append("partner_reader_blocked")
            if "sessions_revoked" not in actions_taken:
                actions_taken.append("sessions_revoked")

            investigation.actions_taken = actions_taken
            investigation.save(update_fields=["actions_taken"])

            msg = f"Lecteur tiers ({r_email or 'Inconnu'}) inscrit en liste noire active et {revoked_count} session(s) révoquée(s)."
            logger.warning(
                f"[FORENSIC MITIGATION] Lecteur tiers bloqué: {r_email} par {admin_user.email} (Enquête #{investigation.id})"
            )
            return {
                "investigation_id": str(investigation.id),
                "action_executed": action,
                "user_id": str(blocked_obj.id),
                "is_suspended": True,
                "session_version": 1,
                "message": msg
            }

        if not suspect:
            raise ValueError("Aucun utilisateur ni identité de lecteur n'est rattaché à ce dossier.")

        if action == "suspend_user":
            suspect.is_suspended = True
            suspect.suspension_reason = reason or f"Sanction suite à fuite documentaire #{str(investigation.id)[:8]}"
            # Révocation simultanée de toutes les sessions actives
            suspect.session_version = int(getattr(suspect, "session_version", 1) or 1) + 1
            suspect.save(update_fields=["is_suspended", "suspension_reason", "session_version"])

            if "account_suspended" not in actions_taken:
                actions_taken.append("account_suspended")
            if "sessions_revoked" not in actions_taken:
                actions_taken.append("sessions_revoked")

            msg = "Compte du lecteur suspendu avec succès et sessions actives révoquées."
            logger.warning(
                f"[FORENSIC MITIGATION] Compte suspendu: {suspect.email} par {admin_user.email} "
                f"(Enquête #{investigation.id})"
            )

        elif action == "revoke_sessions":
            suspect.session_version = int(getattr(suspect, "session_version", 1) or 1) + 1
            suspect.save(update_fields=["session_version"])

            if "sessions_revoked" not in actions_taken:
                actions_taken.append("sessions_revoked")

            msg = "Toutes les sessions de lecture actives du lecteur ont été révoquées immédiatement."
            logger.info(
                f"[FORENSIC MITIGATION] Sessions révoquées pour: {suspect.email} par {admin_user.email}"
            )
        else:
            raise ValueError(f"Action '{action}' non reconnue.")

        investigation.actions_taken = actions_taken
        investigation.save(update_fields=["actions_taken"])

        return {
            "investigation_id": str(investigation.id),
            "action_executed": action,
            "user_id": str(suspect.id),
            "is_suspended": suspect.is_suspended,
            "session_version": suspect.session_version,
            "message": msg
        }

    # =========================================================================
    # 5. Génération du Rapport de Preuve Certifié PDF (ReportLab)
    # =========================================================================

    @classmethod
    def generate_certified_report(cls, investigation_id: str) -> bytes:
        """
        Génère un document PDF certifié et horodaté (avec ReportLab) attestant des résultats
        d'investigation, des empreintes cryptographiques et de l'attribution de la fuite.
        """
        investigation = ForensicInvestigation.objects.select_related(
            "admin_user", "suspect_user", "ouvrage"
        ).filter(id=investigation_id).first()

        if not investigation:
            raise ValueError("Investigation non trouvée pour l'export de preuve.")

        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        # Création de styles chic conformes à l'identité LAHAThèque
        navy_color = colors.HexColor("#1B2A4E")
        gold_color = colors.HexColor("#B08D42")
        gray_bg = colors.HexColor("#F8FAFC")
        border_color = colors.HexColor("#E2E8F0")

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=navy_color
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=gold_color
        )
        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=navy_color
        )
        text_style = ParagraphStyle(
            "ReportText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1E293B")
        )
        bold_text_style = ParagraphStyle(
            "ReportBoldText",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#0F172A")
        )

        story = []

        # En-tête officiel
        story.append(Paragraph("LAHATHÈQUE • DIRECTION DE LA SÉCURITÉ ET DU COPYRIGHT", subtitle_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph("PROCÈS-VERBAL D'INVESTIGATION FORENSIQUE", title_style))
        story.append(Paragraph(f"Dossier de Preuve Réf: {str(investigation.id).upper()}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=2, color=gold_color, spaceAfter=14))

        # Tableau Récapitulatif de l'Investigation
        status_label = "Fuite Identifiée avec Certitude" if investigation.status == "identified" else investigation.get_status_display()
        admin_email = investigation.admin_user.email if investigation.admin_user else "Administrateur"

        info_data = [
            [Paragraph("Date et heure de l'analyse :", bold_text_style), Paragraph(investigation.created_at.strftime("%d/%m/%Y à %H:%M:%S UTC"), text_style)],
            [Paragraph("Officier d'enquête :", bold_text_style), Paragraph(admin_email, text_style)],
            [Paragraph("Fichier suspect analysé :", bold_text_style), Paragraph(f"{investigation.file_name} ({investigation.file_size} octets)", text_style)],
            [Paragraph("Empreinte SHA-256 du fichier :", bold_text_style), Paragraph(investigation.file_hash, text_style)],
            [Paragraph("Mécanisme de détection :", bold_text_style), Paragraph(investigation.get_analysis_mode_display(), text_style)],
            [Paragraph("Degré de certitude calculé :", bold_text_style), Paragraph(f"<b>{investigation.certainty_score}%</b> ({status_label})", bold_text_style)],
        ]
        info_table = Table(info_data, colWidths=[160, 360])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), gray_bg),
            ("BOX", (0, 0), (-1, -1), 1, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 14))

        # Identification du Lecteur Facheteur
        story.append(Paragraph("1. IDENTIFICATION DU LECTEUR SOURCE", section_style))
        story.append(Spacer(1, 6))

        suspect = investigation.suspect_user
        if suspect:
            inst_affiliation = getattr(suspect, "university_affiliation", "") or (suspect.institution.name if getattr(suspect, "institution", None) else "Particulier")
            suspect_data = [
                [Paragraph("Nom et prénom :", bold_text_style), Paragraph(f"{suspect.first_name} {suspect.last_name}".strip() or suspect.username, text_style)],
                [Paragraph("Adresse e-mail :", bold_text_style), Paragraph(suspect.email, text_style)],
                [Paragraph("Identifiant unique (UUID) :", bold_text_style), Paragraph(str(suspect.id), text_style)],
                [Paragraph("Pays et Téléphone :", bold_text_style), Paragraph(f"{suspect.country} • {suspect.phone or 'Non renseigné'}", text_style)],
                [Paragraph("Affiliation institutionnelle :", bold_text_style), Paragraph(inst_affiliation, text_style)],
                [Paragraph("Statut actuel du compte :", bold_text_style), Paragraph("SUSPENDU" if getattr(suspect, "is_suspended", False) else "Actif", bold_text_style)],
            ]
        else:
            suspect_data = [
                [Paragraph("Adresse e-mail détectée :", bold_text_style), Paragraph(investigation.suspect_email or "Non extraite", text_style)],
                [Paragraph("Adresse IP associée :", bold_text_style), Paragraph(str(investigation.suspect_ip or "Non extraite"), text_style)],
                [Paragraph("Conclusion :", bold_text_style), Paragraph("Aucun compte actif correspondant trouvé.", text_style)],
            ]

        suspect_table = Table(suspect_data, colWidths=[160, 360])
        suspect_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 1, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(suspect_table)
        story.append(Spacer(1, 14))

        # Ouvrage et Transaction Commerciale
        story.append(Paragraph("2. CONTEXTE ÉDITORIAL ET TRANSACTION D'ACQUISITION", section_style))
        story.append(Spacer(1, 6))

        ouvrage_title = investigation.ouvrage.title if investigation.ouvrage else "Ouvrage LAHAThèque non résolu"
        order_ref = investigation.order_reference or "Non disponible"

        editorial_data = [
            [Paragraph("Titre de l'ouvrage piraté :", bold_text_style), Paragraph(ouvrage_title, text_style)],
            [Paragraph("Référence de la commande :", bold_text_style), Paragraph(order_ref, text_style)],
            [Paragraph("Sanctions appliquées :", bold_text_style), Paragraph(", ".join(investigation.actions_taken) if investigation.actions_taken else "Aucune action directe enregistrée", text_style)],
        ]
        editorial_table = Table(editorial_data, colWidths=[160, 360])
        editorial_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), gray_bg),
            ("BOX", (0, 0), (-1, -1), 1, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(editorial_table)
        story.append(Spacer(1, 20))

        # Sceau légal de certification
        story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceAfter=10))
        legal_text = (
            "Ce document constitue une attestation technique d'investigation délivrée par le moteur DRM & Forensique LAHAThèque. "
            "Les preuves cryptographiques et les empreintes d'horodatage contenues dans ce dossier sont opposables aux fins "
            "de poursuites disciplinaires, civiles ou pénales conformément aux dispositions légales sur la protection du droit d'auteur."
        )
        story.append(Paragraph(legal_text, ParagraphStyle("Legal", parent=styles["Normal"], fontSize=7.5, leading=10, textColor=colors.HexColor("#64748B"))))

        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        return pdf_content

    # =========================================================================
    # Fonctions Utilitaires
    # =========================================================================

    @staticmethod
    def extract_emails_from_text(text: str) -> List[str]:
        """Extrait toutes les adresses e-mail valides présentes dans une chaîne."""
        pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
        found = re.findall(pattern, text)
        cleaned = [e.strip(".,;:()") for e in found if len(e) > 5]
        return list(dict.fromkeys(cleaned))

    @staticmethod
    def extract_ips_from_text(text: str) -> List[str]:
        """Extrait toutes les adresses IPv4 valides présentes dans une chaîne."""
        pattern = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
        found = re.findall(pattern, text)
        valid_ips = []
        for ip in found:
            parts = ip.split(".")
            if all(0 <= int(p) <= 255 for p in parts):
                valid_ips.append(ip)
        return list(dict.fromkeys(valid_ips))
