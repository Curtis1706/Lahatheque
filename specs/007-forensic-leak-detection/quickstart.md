# Guide de Démarrage et Scénarios de Validation Forensique

Ce document détaille les scénarios d'exécution et de validation technique pour l'outil forensique d'analyse de fuites et d'extraction de filigranes.

---

## 1. Prérequis
- Backend Django démarré avec environnement virtuel actif (`python manage.py runserver`).
- Base de données migrée avec le nouveau modèle `ForensicInvestigation`.
- Frontend Next.js démarré (`npm run dev`).
- Un compte administrateur authentifié (`role: admin` ou `role: super_admin`).

---

## 2. Scénario 1 : Détection sur Fichier PDF Fuité (Tatouage Stéganographique Invisible)

### Procédure
1. Générer un PDF de test tatoué par le moteur de filigrane :
   ```bash
   python manage.py shell -c "
   from apps.protection.watermark import WatermarkEngine
   from apps.accounts.models import User
   u = User.objects.filter(role='student').first()
   data = WatermarkEngine.apply_watermark_to_pdf(b'%PDF-1.4 test dummy content...', user_info={'id': str(u.id), 'email': u.email, 'ip': '197.234.221.14', 'nom': u.get_full_name()})
   open('test_leak.pdf', 'wb').write(data)
   "
   ```
2. Se connecter sur l'espace d'administration : `http://localhost:3000/admin/security/forensic`.
3. Déposer `test_leak.pdf` dans la zone de glisser-déposer.
4. Cliquer sur **Lancer l'analyse forensique**.

### Résultat Attendu
- Statut : **100% Identification formelle**.
- Méthode : `pdf_steganography`.
- Données affichées : Identifiant utilisateur exact, nom complet, e-mail, adresse IP d'origine, signature cryptographique validée.
- Boutons d'action disponibles : "Suspendre le compte", "Révoquer les sessions actives", "Télécharger le rapport certifié".

---

## 3. Scénario 2 : Détection sur Capture d'Écran ou Photo (Filigrane Semi-Transparent)

### Procédure
1. Ouvrir une capture d'écran montrant une page de liseuse avec le filigrane "Licence accordée à ... (email) - IP: ...".
2. Déposer l'image (PNG ou JPG) dans `/admin/security/forensic`.
3. Cliquer sur **Lancer l'analyse forensique**.

### Résultat Attendu
- Le serveur applique le rehaussement de contraste Pillow et l'OCR (ou fallback vision multimodale si photo de biais).
- Statut : **Score >= 85%**.
- Les informations textuelles du filigrane sont extraites et corrélées avec la table `TraceAcces` et les comptes utilisateurs réels.

---

## 4. Scénario 3 : Action Immédiate et Sanction

### Procédure
1. Depuis la fiche de résultat de l'analyse, cliquer sur **Suspendre le compte du lecteur**.
2. Confirmer dans la modale d'avertissement.

### Résultat Attendu
- Le compte passe en `is_suspended=True`.
- La version de session `session_version` est incrémentée, invalidant instantanément toutes ses sessions actives de lecture.
- La ligne d'enquête enregistre l'action dans `actions_taken`.
- Un toast de confirmation vert apparaît et la fiche se met à jour visuellement.

---

## 5. Scénario 4 : Téléchargement du Rapport de Preuve Certifié PDF

### Procédure
1. Cliquer sur **Télécharger le rapport certifié (PDF)**.

### Résultat Attendu
- Un fichier PDF officiel est téléchargé, contenant l'en-tête de sécurité LAHAThèque, l'empreinte SHA-256 du fichier déposé, l'horodatage précis, l'identité du suspect, l'historique des traces et la certification administrative.
