# Phase 0 Research: Forensic Leak Detection & Watermark Extraction

**Feature Branch**: `007-forensic-leak-detection`
**Date**: 2026-09-11
**Status**: Completed

---

## 1. Détection Stéganographique et Inspection Binaire PDF

### Décision
Utiliser **PyMuPDF (`fitz`)** pour inspecter méthodiquement chaque page du document PDF à la recherche des marqueurs injectés par `apps/protection/watermark.py` :
1. Recherche des blocs de texte injectés à `fitz.Point(1, page_height - 1)` avec taille de police `<= 1.5 pt`, couleur blanche et opacité `<= 0.005`, contenant le préfixe `LTQ:`.
2. Extraction du payload JSON chiffré/sérialisé (`uid`, `em`, `ip`, `dev`, `sig`).
3. Vérification de la signature cryptographique SHA-256 dans les métadonnées PDF (`keywords` contenant `LTQ_SIG:{hash}`).
4. Si le PDF a été altéré ou rogné par un outil de découpe, balayage regex du flux d'octets brut décompressé (`re.search(rb'LTQ:\{.*?\}', raw_stream)`) comme filet de sécurité résilient.

### Justification
- `PyMuPDF` (v1.25.3) est déjà une dépendance native du backend LAHAThèque, ultra-performante en C/C++ (mupdf), capable de parser un PDF de plusieurs centaines de pages en moins de 100 millisecondes.
- Le marquage invisible LAHAThèque utilise la stéganographie vectorielle au point bas-gauche de chaque page (`page.insert_text(fitz.Point(1, page_height - 1), f"LTQ:{invisible_payload}")`).
- L'inspection binaire combinée (structure d'arbre de page + métadonnées + flux brut) garantit un taux de détection de 100% même si l'attaquant a supprimé la page de garde ou modifié les métadonnées standard.

### Alternatives considérées
- *Inspection manuelle via regex sur fichier brut seul* : Rejeté car les flux PDF compressés (FlateDecode) masquent le texte sans décompression préalable des objets de flux.
- *Bibliothèque tierce type pdfminer.six* : Rejeté car inutilement lourde et déjà couverte par PyMuPDF.

---

## 2. Pipeline Hybride de Prétraitement Visuel et Détection sur Captures d'Écran et Photos

### Décision
Mettre en place une chaîne de traitement à deux niveaux :
1. **Niveau 1 (Local, Rapide, Zéro Coût)** :
   - **Prétraitement d'image avec Pillow (PIL)** : Conversion en niveaux de gris, rehaussement de contraste dynamique (autocontrast / expansion de dynamique), égalisation d'histogramme, masque de netteté (UnsharpMask), et seuillage adaptatif Otsu/luminance pour isoler les pixels du filigrane semi-transparent (opacité 20%) du fond de page.
   - **Extraction OCR locale avec Pytesseract** : Détection des motifs typographiques réguliers (adresses e-mail `@`, adresses IPv4/IPv6, formats de date, mentions institutionnelles "Licence accordée à").
2. **Niveau 2 (Fallback Vision Multimodale Haute Précision)** :
   - Si le niveau local ne détecte aucun motif probant ou si la confiance est faible (< 60%), et que `settings.OPENAI_API_KEY` est configuré, transmission de l'image (optimisée en JPEG base64) à `gpt-4o-mini` / `gpt-4o` avec un prompt d'expertise forensique :
     *"Analysez cette image / capture d'écran d'un ouvrage numérique. Repérez et extrayez tout texte de filigrane semi-transparent (ex: nom, adresse email, adresse IP, date, mentions légales LAHAThèque). Répondez strictement en JSON."*

### Justification
- Les captures d'écran nettes d'ordinateur (PNG/JPG) sont décodées localement en moins d'une seconde par Pillow + Tesseract sans appel API externe ni latence réseau.
- Les photos de smartphones prises avec un angle, sous un éclairage inégal ou avec du moiré d'écran mettent en échec les OCR locaux traditionnels. La vision multimodale moderne excelle dans le déchiffrement de filigranes semi-transparents sur supports inclinés ou flous.
- Le basculement automatique offre le meilleur équilibre : coût nul et vitesse maximale pour les cas simples, robustesse absolue pour les cas complexes.

### Alternatives considérées
- *Vision multimodale systématique* : Rejeté car coûteux en jetons API, dépendant de la connectivité externe et plus lent (2 à 4 secondes).
- *OCR local exclusif sans fallback* : Rejeté car incapable de traiter convenablement les photos inclinées de smartphone avec reflets d'écran.

---

## 3. Corrélation en Base de Données et Score de Certitude

### Décision
Construire un moteur de corrélation (`ForensicCorrelator`) qui croise les données brutes extraites avec les modèles réels :
1. **Recherche par identifiant utilisateur (`uid`) ou e-mail (`em`)** :
   - Requête sur `apps.accounts.models.User` (avec `select_related('institution')`).
   - Requête sur `apps.commerce.models.Commande` / `LigneCommande` pour retrouver la date d'achat, le mode de paiement et le montant.
   - Requête sur `apps.protection.models.TraceAcces` pour retrouver les sessions de consultation de cet ouvrage.
2. **Recherche par adresse IP et créneau temporel** :
   - Si seul un fragment d'e-mail ou une adresse IP est détecté, recherche dans `TraceAcces.objects.filter(ip_address=ip)` pour isoler le ou les utilisateurs ayant consulté l'ouvrage depuis cette adresse.
3. **Calcul de l'indice de certitude** :
   - **100% (Formel)** : Marqueur invisible complet + signature SHA-256 validée + utilisateur correspondant en base.
   - **90% à 99% (Très élevé)** : Filigrane visible complet (e-mail + IP) vérifié dans `TraceAcces`.
   - **70% à 89% (Probable)** : E-mail partiel ou IP seule corrélée avec une session unique d'accès sur l'ouvrage.
   - **0%** : Aucune trace ni marqueur LAHAThèque.

### Justification
Conforme au principe de traçabilité absolue et à l'interdiction formelle des mocks : toutes les informations d'enquête s'appuient sur les enregistrements réels de la plateforme.

---

## 4. Actions Administratives Immédiates et Génération de Preuve

### Décision
Intégrer directement dans la vue forensique :
1. **Suspension de compte** : Mise à jour de `user.is_suspended = True` et `user.suspension_reason = f"Suspension suite à détection de fuite documentaire forensique #{investigation_id}"`.
2. **Révocation immédiate des sessions** : Incrémentation de `user.session_version += 1` (rendant instantanément invalides tous les JWT en circulation sur tous les appareils du lecteur).
3. **Génération d'un rapport certifié PDF (ReportLab)** : Génération d'un document officiel téléchargeable comprenant :
   - En-tête officiel LAHAThèque avec sceau de sécurité.
   - Identifiant unique d'enquête forensique (UUIDv4).
   - Horodatage certifié UTC.
   - Empreinte SHA-256 du fichier suspect téléversé.
   - Données d'attribution (nom, e-mail, IP, transaction d'achat, établissement).
   - Historique des traces d'accès associées.
   - Signature cryptographique de certification administrative.

### Justification
Permet à l'administrateur de réagir en moins de 30 secondes face à une fuite avérée (sanction + sécurisation immédiate du compte + dossier juridique opposable).

---

## 5. Cloisonnement et Sécurité d'Accès

### Décision
- **Backend** : Contrôle strict `permission_classes = [IsAuthenticated, IsAdminUser]` et vérification explicite `request.user.role in ['admin', 'super_admin']`.
- **Frontend** : Route `/admin/security/forensic` intégrée dans le sous-menu Sécurité du Dashboard Admin (`AdminGuard`).
- **Journalisation légale** : Création du modèle `ForensicInvestigation` dans `apps/protection/models.py` enregistrant chaque acte d'investigation (qui a analysé quoi, quel fichier, quel résultat, quelles sanctions appliquées).
