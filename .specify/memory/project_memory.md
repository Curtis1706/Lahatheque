# Mémoire Persistante du Projet LAHAThèque

> **DOCUMENT DE RÉFÉRENCE OBLIGATOIRE (PRINCIPE CONSTITUTIONNEL XIII)**  
> Ce fichier consigne de façon exhaustive l'historique, les règles inviolables, l'architecture et les décisions techniques du projet LAHAThèque. Il doit être **systématiquement et impérativement lu au démarrage de chaque nouvelle session d'agent ou après chaque compaction d'historique** pour garantir une continuité parfaite sans aucune perte de contexte.

---

## 1. Règles Inviolables & Absolues du Projet (À Respecter en Toutes Circonstances)

1. **Zéro Émoji (Règle Absolue)** :
   - Aucun émoji n'est toléré, ni dans le code, ni dans les commentaires, ni dans les messages du chat, ni sur les dashboards, ni dans les modales, ni dans les e-mails. Utiliser **exclusivement des icônes vectorielles Lucide React (`lucide-react`)** ou de la typographie textuelle soignée.

2. **Interdiction des Couleurs Hexadécimales en Dur (`#...`)** :
   - Jamais de classe Tailwind avec hex inline (ex: `bg-[#1B2A4E]`, `text-[#B08D42]`).
   - Utiliser exclusivement les tokens sémantiques configurés dans `globals.css` : `bg-navy`, `bg-navy-dark`, `bg-navy-hover`, `bg-gold`, `text-gold`, `border-gold`, `bg-background`, `bg-background-secondary`, `border-border`.

3. **Interdiction Totale et Définitive des Données Mockées (Zéro Mock)** :
   - Toutes les données proviennent obligatoirement des véritables endpoints de l'API Django via le client HTTP ou le proxy BFF (`/api/bff/...`), avec authentification par cookies `HttpOnly` et typage TypeScript strict calqué sur les modèles Django réels.

4. **Typographie Officielle (Google Fonts)** :
   - **Titres, En-têtes, Logo & Noms de section** : **Playfair Display** (`font-serif`, `font-playfair` — Bold 700 / Semi-Bold 600).
   - **Textes, Menus, Boutons, Prix & Formulaires** : **Poppins** (`font-sans`, `font-poppins` — Regular 400 pour corps, Medium 500 pour menus/boutons).

5. **Mobile-First Non-Négociable** :
   - Toute interface est pensée d'abord pour mobile (~375–390px) puis étendue (`sm:`, `md:`, `lg:`, `xl:`).
   - Zones tactiles minimales >= 44px. Zéro défilement horizontal parasite.

6. **Lecture Intégrale Exhaustive de 100% des Fichiers** :
   - Zéro omission, zéro survol, zéro troncature. Pour tout audit, analyse ou refactoring, lecture de 100% des lignes du premier au dernier caractère.

7. **Télémétrie et Console Logs Systématiques** :
   - Côté frontend : `console.groupCollapsed` / `console.log` / `console.error` balisés par module (ex: `[AUTH REGISTER]`, `[PROFILE UPDATE]`, `[CONTACT FORM]`, `[CHECKOUT FLOW]`, `[CHECKOUT AUTH]`) avec horodatage, données envoyées (mots de passe masqués), temps d'exécution en ms et détail précis des erreurs pour faciliter le débogage instantané dans les DevTools.
   - Côté backend : `logger.info` / `warning` / `error` balisés étape par étape avec `exc_info=True`.

---

## 2. Architecture & Système d'Authentification / OTP (Verrouillé)

### A. Inscription Publique (`/register`)
- Formulaire multi-step 4 étapes : (1) Profil Lecteur/Auteur & Avatar optionnel → (2) Identité & Téléphone → (3) Email & Mot de passe → (4) Vérification OTP.
- Composant 21st.dev `OTPInput` (`ruixen.ui/otpinput`, id 6845) : saut automatique d'une case à l'autre, retour arrière géré, collage direct du code complet à 6 chiffres, séparateur médian.
- **Zéro Échec au Premier Coup** :
  - Validité de 15 minutes.
  - Conservation des codes actifs lors d'un renvoi (ne pas détruire le premier code si un second est demandé, afin que le premier code reçu reste valide).
  - Normalisation exhaustive des identifiants (espaces nettoyés, casse email gérée, format téléphone normalisé).
  - Consommation atomique : dès qu'un code valide est renseigné, tous les OTPs actifs de l'utilisateur passent à `is_verified = True`.
- **Auto-Connexion & Redirection Directe** :
  - Dès la validation de l'OTP, les jetons JWT sont activés et l'utilisateur est immédiatement redirigé vers son dashboard (`/student` ou `/author`), sans aucune étape intermédiaire de reconnexion sur `/login`.

### B. Connexion Classique (`/login`)
- **JAMAIS d'OTP** : La connexion se fait exclusivement par identifiant (email/téléphone/username) et mot de passe.
- Les tokens JWT sont délivrés immédiatement dans des cookies `HttpOnly` et l'utilisateur accède directement à son espace.

### C. Comptes Créés par l'Administrateur
- Tout compte créé par un administrateur (via le dashboard Back-Office, l'API admin ou `admin_create_user_wizard`) est **automatiquement vérifié (`is_verified = True`) dès sa création**.
- **Aucun code OTP n'est généré ni demandé** pour ces comptes. L'utilisateur reçoit uniquement ses identifiants temporaires et se connecte directement via `/login`.

### D. Comptes Pré-Existants en Base
- Migration `0010_mark_existing_users_verified.py` appliquée : 100% des comptes existants sont marqués vérifiés (`is_verified = True`).

---

## 3. Configuration des E-mails & Notifications

- **Fournisseur Principal** : Resend via `ResendEmailBackend` (`EMAIL_PROVIDER=resend`).
- **Repli / Fallback** : SMTP Pro Hostinger (`smtp.hostinger.com:465`, SSL).
- **Templates** : Tout email hérite de `templates/emails/base_email.html` (logo officiel LAHAThèque, Playfair Display/Poppins, support mode sombre, zéro émoji).
- **Adresses Administratives Officielles (Triplé Consolidé)** :
  1. `lahaeditions1@gmail.com`
  2. `alhtdharry7@gmail.com` (correction formelle de `alhtd7@gmail.com`)
  3. `firinzegbenitodossou@gmail.com`
  Ces 3 adresses reçoivent systématiquement toutes les alertes de contact, partenariats, dépôts de manuscrits et alertes internes.

---

## 4. Liseuse 3D FlipBook & Traitement Lourd

- **Liseuse 3D** :
  - Mode double-page 3D immersive sur desktop / tablette (>= 768px).
  - Mode 1 page portrait fluide avec gestuelle tactile swipe sur mobile (< 768px).
  - Gestion mémoire : Fenêtre glissante LRU bornée à 10 pages avec libération explicite `URL.revokeObjectURL()`, maintenant la RAM sous 30 Mo même pour des livres de plus de 500 pages.
- **Cache Serveur Redis** : TTL de 2 heures (7200s) pour les dérivés de pages filigranées.
- **Celery & Cloudflare R2** : Tâche de synchronisation automatique au démarrage du worker (`@worker_ready.connect`) et planification périodique toutes les 3 heures.

---

## 5. État des Pages Publiques

- Toutes les pages publiques (`/`, `/about`, `/catalog`, `/catalog/[id]`, `/cart`, `/checkout`, `/contact`, etc.) sont 100% responsives, sans aucun défilement horizontal sur 375px, 390px et 430px.
- Build de production Next.js validé : 171/171 pages compilées sans erreur (exit code 0).

---

## 6. Formulaire Contact B2B & Tunnel d'Achat E-commerce (Feature 006 - Implémentée le 2026-09-10)

### A. Formulaire de Contact B2B (`/contact`)
- **Profils éligibles** : Alignés strictement sur les choix de rôles en base de données (`ROLE_CHOICES` dans `apps/accounts/models.py`) via `lahatheque-frontend/lib/types/contact.ts` :
  - `university` : Université / Établissement Partenaire
  - `publisher` : Éditeur Tiers / Maison d'édition
  - `wholesaler` : Grossiste / Distributeur
  - `author` : Auteur
  - `other` : Autre
- **Nature des besoins (Sélecteur enrichi B2B & Prestations)** :
  - Demande de partenariat institutionnel
  - Commande en gros (gros volumes)
  - Intégration API & Catalogue
  - Impression des ouvrages
  - Sécurisation des contenus éditoriaux
  - Analyse par un comité de lecture
  - Montage éditorial des ouvrages
  - Diffusion à l'échelle internationale
  - Distribution à l'échelle internationale
  - Production de livres audio
  - Réalisation d'illustrations
  - Logiciel anti-plagiat
  - Autre
- **Prise en charge de l'option "Autre" (Option B Validée)** :
  - Lorsqu'un utilisateur coche la case "Autre", une note contextuelle subtile s'affiche en temps réel pour l'inviter à expliciter son projet spécifique dans la zone "Message complémentaire", sans ajouter d'input parasite dynamique.
- **Backend & Notifications E-mail** :
  - Endpoint `submit_contact_view` (`lahatheque-backend/apps/communications/views.py`) enregistre dans `ContactMessage`.
  - Notification interne expédiée simultanément aux 3 adresses : `lahaeditions1@gmail.com`, `alhtdharry7@gmail.com`, `firinzegbenitodossou@gmail.com` via `templates/emails/support/internal_alert.html`.
  - Accusé de réception chic avec ticket_id transmis au demandeur via `templates/emails/support/contact_ack.html`.

### B. Tunnel d'Achat E-commerce & Gestion Compte Client
- **Persistance locale du Panier** :
  - Persistance dans `localStorage` sous la clé `laha_cart` via `cart-context.tsx`.
  - Tout visiteur anonyme peut parcourir le catalogue et ajouter des articles en mode invité sans être bloqué ni forcé de se connecter prématurément.
- **Identification au Checkout (Option A Validée)** :
  - Sur `/checkout`, si le client n'est pas authentifié (`!user`), la commande anonyme est bloquée et le panneau `CheckoutAuthPanel` (`components/checkout/checkout-auth-panel.tsx`) s'affiche directement sur la page.
  - Le panneau propose deux onglets :
    1. *Déjà client ? Se connecter* : Saisie directe email/mot de passe, sans OTP, connexion instantanée.
    2. *Nouveau client ? Créer mon compte* : Inscription rapide (nom, prénom, email, téléphone optionnel, mot de passe), rôle `student` attribué par défaut, vérification OTP à 6 chiffres via `OTPInput`, auto-connexion et rafraîchissement de la session sur place sans rechargement ni redirection.
  - **Préservation Intégrale du Panier** : Le récapitulatif de la commande reste en permanence affiché à droite. Dès la session active, le tunnel dévoile les options de livraison et de paiement sans perte du contenu du panier.
- **Gestion Étanche des 3 Formats de Livres** :
  - *Livre Papier (`paper`)* :
    - Formulaire dédié affiché conditionnellement si le panier contient au moins un livre papier.
    - Collecte de l'adresse de livraison complète, de la ville, du pays, ainsi que de la date souhaitée et du créneau horaire début/fin (`date_livraison_souhaitee`, `plage_horaire_debut`, `plage_horaire_fin`).
    - Enregistrement dans le modèle `PhysicalDelivery` lié à la commande (`Order`).
    - Notification automatique des gestionnaires logistiques (`role__in=['manager', 'admin', 'super_admin']`) avec lien direct vers `/manager/delivery`.
    - Réservation et décrémentation atomique des stocks dans `StockOuvrage` et `OuvrageLanguageVersion`.
  - *Livre Numérique (`digital`)* :
    - Déverrouillage automatique dans `ReadingProgress` (`apps/commerce/services.py`).
    - Accès immédiat dans l'espace client (`/student/books`) avec la liseuse sécurisée FlipBook.
  - *Livre Audio (`audio`)* :
    - Déverrouillage d'écoute audio strictement séparé du droit de lecture numérique.
    - Seul le format `audio` débloque la piste audio (`AudioStreamSessionView`) sans octroyer l'accès au flux de streaming PDF (`apps/protection/access_service.py`).
    - L'achat audio débloque la présence dans la bibliothèque avec le badge « Audio » et l'action « Écouter », sans fausse progression de lecture ni bouton « Lire ».
  - *Facturation Transactionnelle* :
    - Génération et envoi automatique de la facture PDF acquittée certifiée en pièce jointe via `templates/emails/orders/confirmation_client.html`.

---

## 7. Ségrégation Stricte des Droits Audio vs Numérique (Corrigé le 2026-09-11)

- **Contrôle d'accès (`apps/protection/access_service.py`)** :
  - `check_user_book_access` vérifie exclusivement les formats de lecture (`format_type__in=['digital', 'pdf', 'epub']`) ou les abonnements/bouquets actifs. Les achats `audio` purs ne confèrent plus l'accès au streaming de livre PDF.
- **Déverrouillage des commandes (`apps/commerce/services.py`)** :
  - Les lignes de format `digital` créent une progression de lecture initiale (`ReadingProgress`).
  - Les lignes de format `audio` créent l'enregistrement dans la bibliothèque sans fausse progression de lecture.
- **Bibliothèque Étudiant (`apps/student/views.py` & serializers)** :
  - `StudentBooksView` et `OuvrageBasicSerializer` gèrent `user_digital_ids` et `user_audio_ids` de manière totalement indépendante.
  - `is_owned` et `has_digital_access` sont `True` uniquement si le format numérique est possédé.
  - `is_audio_owned` et `has_audio_access` sont `True` uniquement si le format audio est possédé.
- **Composants Frontend (`book-card.tsx`, `book-list-item.tsx`, `student/page.tsx`)** :
  - Badge dynamique : « Numérique » (numérique seul), « Audio » (audio seul), « Num. & Audio » (les deux possédés).
  - Bouton « Lire » affiché uniquement si `isDigitalOwned === true`.
  - Bouton « Écouter » affiché uniquement si `isAudioOwned === true` (devient le bouton d'action principal si seul l'audio est possédé).
  - Clic sur la couverture d'un livre audio seul déclenche la lecture audio via le lecteur persistant.

### C. Fichiers Cibles de l'Implémentation 006
- **Types** :
  - `lahatheque-frontend/lib/types/contact.ts`
  - `lahatheque-frontend/lib/types/checkout.ts`
- **Frontend** :
  - `lahatheque-frontend/app/(public)/contact/page.tsx`
  - `lahatheque-frontend/components/checkout/checkout-auth-panel.tsx`
  - `lahatheque-frontend/app/(public)/checkout/page.tsx`
  - `lahatheque-frontend/context/cart-context.tsx`
- **Backend** :
  - `lahatheque-backend/apps/communications/views.py`
  - `lahatheque-backend/apps/commerce/views.py`
  - `lahatheque-backend/apps/commerce/serializers.py`
  - `lahatheque-backend/apps/commerce/services.py`
  - `lahatheque-backend/apps/protection/access_service.py`
- **Templates E-mails** :
  - `lahatheque-backend/templates/emails/support/internal_alert.html`
  - `lahatheque-backend/templates/emails/support/contact_ack.html`
  - `lahatheque-backend/templates/emails/orders/confirmation_client.html`
- **Observabilité & Télémétrie** :
  - Groupes DevTools : `[CONTACT FORM]`, `[CHECKOUT FLOW]`, `[CHECKOUT AUTH]`.
  - Logs serveur Django : `[CONTACT]`, `[ORDER]`, `[Commerce]`.

---

## 8. Détection Forensique de Fuites & Analyse de Captures d'Écran (Feature 007)

- **Objectif** : Doter l'administrateur d'une interface d'investigation médico-légale pour démasquer les fuites d'ouvrages à partir d'un fichier PDF fuité ou d'une capture d'écran / photo de smartphone.
- **Capacités clés** :
  - Extraction binaire automatique du tatouage invisible `LTQ:{...}` et des métadonnées `LTQ_SIG:`.
  - Prétraitement d'image (Pillow, réhaussement de contraste, binarisation) et analyse de vision haute précision pour extraire les filigranes transparents à 20% sur les photos/captures.
  - Corrélation croisée avec la base des traces d'accès (`TraceAcces`), comptes utilisateurs et commandes réelles.
  - Calcul d'un score de certitude et affichage de la fiche d'investigation complète dans l'espace administration (`/admin/security/forensic`).
- **Artefacts SpecKit générés** :
  - Spécification : `specs/007-forensic-leak-detection/spec.md`
  - Checklist qualité : `specs/007-forensic-leak-detection/checklists/requirements.md` (100% validée)
  - Plan d'implémentation : `specs/007-forensic-leak-detection/plan.md`
  - Recherche technique (Phase 0) : `specs/007-forensic-leak-detection/research.md`
  - Modèle de données (Phase 1) : `specs/007-forensic-leak-detection/data-model.md`
  - Guide de démarrage rapide : `specs/007-forensic-leak-detection/quickstart.md`
  - Contrats d'API : `specs/007-forensic-leak-detection/contracts/api-forensic.md`
- **Décisions d'Architecture Validées** :
  - Pipeline hybride : Pillow (contraste/binarisation) + OCR local par défaut, repli automatique sur vision multimodale (OpenAI) pour photos floues/inclinées.
  - Modèle Django dédié : `ForensicInvestigation` dans `apps/protection/models.py` assurant l'archivage légal complet (migration `0008_forensicinvestigation` appliquée).
  - Actions immédiates intégrées : Suspension de compte (`is_suspended=True`), révocation instantanée des sessions (`session_version += 1`), export de rapport certifié PDF (ReportLab).
  - Sécurité & Cloisonnement : Accès strictement et exclusivement réservé au tableau de bord administrateur (`role in ['admin', 'super_admin']`).
- **Fichiers Implémentés & Validés** :
  - Backend : `apps/protection/models.py` (`ForensicInvestigation`), `apps/protection/forensic_service.py` (`ForensicService`), `apps/protection/views.py` (`ForensicAnalyzeView`, `ForensicMitigateView`, `ForensicReportView`, `ForensicInvestigationViewSet`), `apps/protection/urls.py`, `apps/protection/tests/test_forensic.py`.
  - Frontend : `lahatheque-frontend/lib/services/protection.ts` (`analyzeForensicEvidence`, `mitigateForensicInfraction`, `getForensicReportDownloadUrl`), `lahatheque-frontend/app/(dashboard)/admin/security/forensic/page.tsx` (interface complète d'enquête forensique et d'actions directes), `lahatheque-frontend/app/(dashboard)/admin/security/traces/page.tsx` (navigation directe).
- **Validation** :
  - 100% des tâches `tasks.md` achevées (24/24).
  - Validation binaire PDF : 100% de détection du tatouage invisible et signature cryptographique.
  - Validation image/capture d'écran : 95% de score sur filigrane semi-transparent à 20% d'opacité.
  - Validation sanctions : suspension immédiate et révocation instantanée des sessions de lecture vérifiées.
---

## 9. Courriers Officiels de Redevances & Relances sur Papier à En-tête (Feature 008 - Spécifiée le 2026-09-17)

- **Objectif** : Remplacer l'action directe non tracée "Envoyer Relevé" sur les tableaux de bord redevances (universités, éditeurs) et relances (créances, auteurs) par l'action "Préparer le courrier". Centraliser la gestion dans une page dédiée sous forme de DataTable, exploitant le gabarit papier à en-tête officiel LAHAThèque (`Lahatheque-PapierEntete-SansNumero.pdf`).
- **Cycle de Vie & Statuts** :
  - **Brouillon** : Texte modifiable librement, prévisualisation PDF à tout moment dans le navigateur, sauvegarde en brouillon, action d'édition contextuelle via modale ("Corriger") pour le courrier spécifique.
  - **Validé** : Fige irrévocablement le texte, génère et scelle le PDF final officiel sur le gabarit institutionnel. L'action principale devient "Envoyer par email".
  - **Annulé** : Neutralise le courrier (depuis brouillon ou validé avant envoi) tout en conservant la traçabilité dans la table.
  - **Envoyé** : Transmet l'email avec le PDF scellé en pièce jointe au destinataire et horodate l'expédition.
- **Décisions de Cadrage Validées (/speckit-clarify & Cadrage Métier)** :
  1. *Corps de l'e-mail* : Reprend l'intégralité du texte rédigé du courrier et joint le PDF officiel scellé à en-tête.
  2. *Navigation* : Accès exclusif par redirection lors du clic sur "Préparer le courrier", avec fil d'Ariane de retour vers la page d'origine.
  3. *Action globale de période* : Bouton transformé en "Préparer les courriers de la période" (génération en lot des brouillons puis redirection).
  4. *Modale de correction* : Modification libre de l'Objet et du Corps du message ; destinataire, email officiel et montants calculés verrouillés en lecture seule.
  5. *Procédure d'annulation* : Modale d'avertissement simple sans saisie de motif textuel obligatoire.
  6. *Devise Unique* : Exclusivement **FCFA** (aucun affichage de XOF, EUR ou autre).
- **Ressource Graphique Client** : `lahatheque-backend/static/Lahatheque-PapierEntete-SansNumero.pdf` (logo + devise en en-tête, coordonnées postales et email en pied de page).
- **Artefacts SpecKit** :
  - Spécification : `specs/008-courrier-redevances-relances/spec.md`
  - Checklist qualité : `specs/008-courrier-redevances-relances/checklists/requirements.md` (100% validée)
  - Plan d'implémentation : `specs/008-courrier-redevances-relances/plan.md`
  - Recherche technique (Phase 0) : `specs/008-courrier-redevances-relances/research.md`
  - Modèle de données (Phase 1) : `specs/008-courrier-redevances-relances/data-model.md`
  - Guide de démarrage rapide (Phase 1) : `specs/008-courrier-redevances-relances/quickstart.md`
  - Contrats d'API (Phase 1) : `specs/008-courrier-redevances-relances/contracts/api-courriers.md`
  - Modèles de courriers types : `specs/008-courrier-redevances-relances/templates-courriers.md`
  - Tâches d'implémentation (Phase 2) : `specs/008-courrier-redevances-relances/tasks.md` (34 tâches ordonnées)

---

## 10. Distinction Étanche Universités Partenaires vs Universités Clientes (Feature 009 - Implémentée et Validée le 2026-09-17)

- **Objectif & Cadrage Métier** :
  - Séparation étanche en deux typologies d'établissements universitaires :
    1. **Universités Partenaires (Ayant droit)** : Les 4 universités fondatrices (UAC, UP, UNSTIM, UNA). Elles perçoivent des redevances conventionnées (taux standard 15%) sur les ventes et l'audience de leurs ouvrages. Elles ne souscrivent jamais de bouquets documentaires et ne voient aucune offre d'achat ou de souscription payante.
    2. **Universités Clientes (Souscriptrices)** : Tous les autres établissements et instituts supérieurs privés ou publics. Elles souscrivent des bouquets documentaires pour leurs campus et achètent des livres physiques en gros. Elles ont un taux de redevance forcé à 0% et n'ont aucun accès au portail des redevances (menu absent, accès direct bloqué avec redirection et code HTTP 403 Forbidden).
  - Désactivation des affiliations étudiantes conformément au CDC v3.2 (le client lecteur accède directement aux bouquets sans affiliation universitaire obligatoire).

- **Modèle de Données & Migrations** :
  - **Champ `institution_type`** : Ajouté sur le modèle `Institution` (`apps/partners/models.py`) avec choix `('partner', 'Université Partenaire (Ayant droit)')` et `('client', 'Université Cliente (Souscriptrice)')`, défaut `client`, indexé avec `is_active`.
  - **Migration Django** : `0008_institution_institution_type_and_data_migration.py` appliquant une opération `RunPython` certifiant rétroactivement le statut `partner` pour UAC, UP, UNSTIM et UNA, et `client` pour tous les autres établissements.
  - **Verrou d'Intégrité Inviolable (T018)** : Implémenté dans `Institution.clean()`, `Institution.save()` et `InstitutionViewSet` interdisant formellement par exception de validation / PermissionDenied de passer le statut d'une des 4 universités fondatrices en `client`.

- **Administration & Gestion des Comptes (T017 - T021)** :
  - **Création Administrative (`UserAdminViewSet.create`)** : Sélecteur Partenaire/Cliente, taux de redevance automatiquement forcé à 0.00% pour les clientes (15.00% pour partenaires), et contrôle d'unicité stricte du compte modérateur par institution (bloquage avec code HTTP 409 Conflict si un modérateur actif existe déjà).
  - **Modale de Création (`CreateAccountModal`)** : Sélecteur Partenaire/Cliente pour les nouvelles institutions, masquage de la mention du taux 15% pour les clientes, gestion ergonomique du retour 409 (toast explicatif avec email du modérateur existant).
  - **Modale d'Édition (`EditUniversityUserModal`)** : Affichage du badge `institution_type`, badge protecteur "Verrouillé" et désactivation du changement de type pour les 4 fondatrices, masquage du taux pour les clientes.
  - **Table Administration des Universités (`/admin/users/universities`)** : Badges visuels « Partenaire » ou « Cliente », masquage du taux pour les clientes (mention "Non applicable").

- **Tableaux de Bord & Expérience Utilisateur (T007 - T016)** :
  - **Accueil Espace Université (`/university`)** :
    - *Pour les Clientes* : 4 KPI campus (Bouquets souscrits, Ouvrages accessibles, Lectures campus, Commandes physiques), masquage complet du DonutChart de chiffre d'affaires et de toute mention de redevance, affichage des offres de bouquets à souscrire.
    - *Pour les Partenaires* : Badge officiel « Portail Université Partenaire », 4 KPI de valorisation des droits (Ouvrages catalogue, Part d'audience réelle, Lectures enregistrées, Redevances disponibles), DonutChart de répartition du chiffre d'affaires (15% établissement / 85% LAHAThèque), aucun bouton ni offre de souscription.
  - **Barre Latérale (`dashboard-sidebar.tsx`) & Navigation Mobile (`mobile-bottom-nav.tsx`)** :
    - Pour les Clientes : Lien « Redevances » strictement masqué.
    - Pour les Partenaires : Lien « Bouquets Documentaires » strictement masqué.
  - **Catalogue d'Abonnement Dédié (`UniversityClientCatalogView`)** :
    - Endpoint `/api/v1/partners/university/catalog/` renvoyant les ouvrages issus des bouquets actifs souscrits par l'établissement client.
  - **Deep Links & Gardes de Sécurité Front/Back** :
    - Accès direct à `/university/royalties` par une cliente : redirection immédiate vers `/university` côté React + HTTP 403 Forbidden sur `UniversityRoyaltiesView` et `UniversityRoyaltyWithdrawView`.
    - Accès direct à `/university/bouquets` par un partenaire : redirection automatique vers `/university/royalties` avec toast informatif + HTTP 403 Forbidden sur `UniversityBouquetSubscribeView`.

- **Reporting Financier & Reversements Globaux (T022 - T023)** :
  - Filtrage strict `institution_type='partner'` sur `AdminRoyaltiesPayoutViewSet.list`, `partner_configs`, `update_partner_rate` et `AdminPartnerRoyaltiesView`.
  - Blocage explicite des tentatives d'ajustement de taux sur des universités clientes.
  - Tableau de bord `/admin/royalties/universities` garanti 100% exempt de tout établissement client.

- **Télémétrie & Logs Structurés (T024)** :
  - Préfixes normalisés avec horodatage ISO : `[UNIV KPIS]`, `[UNIV ACCESS GUARD]`, `[ADMIN INSTITUTION]` insérés dans l'ensemble des composants frontend et endpoints backend.

- **Artefacts SpecKit associés** :
  - Spécification : `specs/009-university-partner-client-split/spec.md`
  - Checklist qualité : `specs/009-university-partner-client-split/checklists/requirements.md` (100% validée)
  - Plan d'implémentation : `specs/009-university-partner-client-split/plan.md`
  - Recherche technique : `specs/009-university-partner-client-split/research.md`
  - Modèle de données : `specs/009-university-partner-client-split/data-model.md`
  - Guide quickstart : `specs/009-university-partner-client-split/quickstart.md`
  - Contrats JSON Schema : `specs/009-university-partner-client-split/contracts/`
  - Tâches d'implémentation : `specs/009-university-partner-client-split/tasks.md` (25/25 complétées et cochées `[X]`)

---

## 11. Flux de Souscription Bouquet (Universités & Clients), Tarification Bipériodique et Délivrance de Clés API (Feature 010 - Implémentée, Livrée et Validée à 100% le 2026-09-17)

- **Statut Global** : 100% Achevée et Validée (35/35 tâches de `tasks.md` complétées).
- **Objectif & Cadrage Métier** :
  - **Gestion Administrative des Bouquets (`/admin/catalog/bouquets`)** :
    - Suppression définitive du type obsolète « Par Faculté » (`faculty`) des modèles, sérialiseurs, interfaces et filtres.
    - Pour le type « Intégral Université » (`university`) : sélection d'une université obligatoirement requise (champ obligatoire), calcul en temps réel du nombre d'ouvrages réels rattachés, et bouton « Voir le détail des livres » ouvrant la modale `BouquetBooksPreviewModal` affichant la liste complète des livres avec couvertures (`cover_url`), titres, auteurs et disciplines.
    - Tarification bipériodique obligatoire : ajout du Tarif Mensuel (`monthly_price`) aux côtés du Tarif Annuel (`annual_price`) en Francs CFA (XOF) dans le modèle `BouquetOffering`, la modale de création/édition, et ajout de la colonne « Tarif Mensuel » dans la DataTable principale d'administration.
    - Suivi des souscriptions par bouquet : volet/tiroir d'audit `BouquetSubscriptionsDrawer` répertoriant l'ensemble des souscripteurs (institutions et clients particuliers), leur formule (mensuelle/annuelle), leurs dates de début et d'expiration, et leur statut (actif/expiré).
  - **Souscription Institutionnelle (Universités Clientes B2B)** :
    - Choix entre abonnement Mensuel (30 jours) ou Annuel (365 jours) lors de la souscription d'un bouquet documentaire avec paiement sécurisé en ligne via Moneroo (Mobile Money et cartes bancaires).
    - Activation de la souscription dès confirmation irrévocable du paiement (webhook Moneroo et réconciliation) avec date d'expiration fixée à J+30 (mensuel) ou J+365 (annuel).
    - Création/mise à jour automatique de l'application partenaire unique (`PartnerApp`) par établissement avec nom = nom de l'université cliente, mode d'accès = `catalog_only` (Mode Catalogue Seul), restriction d'accès aux ouvrages des bouquets souscrits via la relation Many-to-Many `restricted_bouquets`, palier VIP illimité (`is_unlimited=True`), aucune obligation d'URL de retour (`return_url`).
    - Coupure automatique et granulaire des accès API (tokens, catalogue et liseuse) dès que la date d'expiration d'un bouquet est atteinte sans renouvellement (HTTP 403 Forbidden).
    - Redirection vers une page dédiée post-paiement (`/university/bouquets/success`) affichant la formule souscrite, la date d'expiration exacte (ex: « Vos accès API sont valables jusqu'au JJ/MM/AAAA »), l'identifiant client (`client_id`) et la clé secrète (`client_secret`) en clair pour la première et unique fois, avec bouton de copie en un clic et bouton de téléchargement pour sauvegarde sécurisée sous forme de fichier `.txt` avec variables `.env` prêtes à copier (`LAHATHEQUE_CLIENT_ID` et `LAHATHEQUE_CLIENT_SECRET`).
    - Mise à disposition d'un bouton de téléchargement du document officiel « Guide d'Intégration Partenaire — Mode Catalogue LAHAThèque Seul » généré au format PDF par PyMuPDF (`fitz`), habillé avec l'identité visuelle LAHAThèque (logo vectoriel, palette Navy & Or, typographie Playfair Display & Poppins) à partir de `GUIDE_INTEGRATION_CATALOGUE_SEUL.md`.
    - Envoi automatique d'un email de confirmation avec facture PDF acquittée certifiée en pièce jointe à l'université cliente mentionnant expressément la date d'expiration, et d'un email de notification à l'administrateur LAHAThèque.
    - Tâche Celery quotidienne de relance préventive (`check_bouquet_subscriptions_and_remind`) envoyant des préavis à J-7 (annuel) et J-3 (mensuel), et marquant comme `'expired'` les abonnements échus.
    - Enregistrement immédiat dans les écritures comptables et financières de la plateforme via `PaymentTransaction` pour mise à jour des métriques dans les dashboards d'administration des finances.
    - Visibilité et gestion de la clé API créée dans l'interface administrateur `/admin/api` (statut actif, multi-bouquets restreints, palier VIP, date d'échéance campus).
  - **Souscription Espace Client / Lecteur (B2C)** :
    - Page de souscription réactivée et modernisée sur `/student/bouquets` permettant aux lecteurs particuliers de souscrire à des bouquets en formule mensuelle ou annuelle via Moneroo.
    - Zéro clé API pour le client individuel : les livres du bouquet souscrit sont automatiquement injectés dans sa Bibliothèque personnelle (`/student/books`).
    - Ajout d'un 4ème onglet dédié « Bouquets en cours » dans `/student/books` regroupant l'ensemble des livres accessibles via ses bouquets actifs avec badge doré `[Nom Bouquet]` et date d'expiration exacte.
    - Règle inviolable de souveraineté des 12 mois : l'achat individuel d'un livre confère un accès souverain garanti de 12 mois (365 jours), strictement indépendant de l'état ou de l'expiration d'un bouquet documentaire.

- **Détail des 8 Phases d'Implémentation Réalisées** :

  1. **Phase 1 : Modèles Fondamentaux & Migrations (T001–T005)** :
     - Modèle `BouquetOffering` (`apps/partners/models.py`) : ajout de `monthly_price`, retrait de `'faculty'` dans `BOUQUET_TYPE_CHOICES`, méthode `get_real_monthly_price()` et obligation de `target_institution` si type `university`.
     - Modèles de souscriptions `UniversityBouquetSubscription` (`apps/partners/models.py`) et `ClientBouquetSubscription` (`apps/commerce/models.py`) : ajout de `subscription_period` (`monthly`/`annual`), `price_paid`, et calcul automatique de `end_date` avec prolongation cumulative (`end_date = max(today, current_end_date) + delta`).
     - Modèle `PartnerApp` (`apps/reader/models.py`) : ajout du champ Many-to-Many `restricted_bouquets` vers `BouquetOffering`, champ `access_mode` (`catalog_only`/`full_reader`), et méthode `get_active_bouquets()`.
     - Migrations Django appliquées : `apps/partners/migrations/0009_bouquetoffering_monthly_price_and_more.py`, `apps/commerce/migrations/0009_clientbouquetsubscription_subscription_period_and_more.py`, `apps/reader/migrations/0007_partnerapp_restricted_bouquets_and_access_mode.py`.
     - Types TypeScript synchronisés : `BouquetOfferingAdmin`, `PartnerApiKey`, `ClientBookAccess`, `BookAPI`.

  2. **Phase 2 : User Story 1 - Administration des Bouquets (T006–T011)** :
     - Endpoint `InstitutionBooksPreviewView` (`GET /api/v1/partners/institutions/<uuid:pk>/books-preview/`) dans `apps/partners/views.py`.
     - Service frontend `getInstitutionBooksPreview` dans `lahatheque-frontend/lib/services/admin.ts`.
     - Composant `BouquetBooksPreviewModal` (`components/features/bouquets/bouquet-books-preview-modal.tsx`) affichant la grille des livres réels avec couvertures.
     - Page `/admin/catalog/bouquets` mise à jour : double tarification (colonnes Tarif Mensuel et Tarif Annuel), sélecteur d'université obligatoire avec calcul dynamique d'ouvrages.
     - Tiroir `BouquetSubscriptionsDrawer` (`components/features/bouquets/bouquet-subscriptions-drawer.tsx`) pour le suivi des souscripteurs.

  3. **Phase 3 : User Story 2 - Souscription Université B2B & Moneroo (T012–T014)** :
     - Page `/university/bouquets` modernisée avec bascule Mensuel/Annuel et déclenchement Moneroo.
     - Endpoint `UniversityBouquetSubscribeView` (`apps/partners/university_views.py`) gérant les périodes 30j et 365j et l'URL de retour vers la page post-paiement.

  4. **Phase 4 : User Story 3 - Écran Post-Paiement, Clé Cumulative & Guide PDF (T015–T020)** :
     - Service `handle_bouquet_payment_success` (`apps/commerce/services.py`) : création/mise à jour de la `PartnerApp` unique cumulative pour l'institution, mise en cache sécurisé du secret brut pendant 15 minutes (`post_payment_credentials_{sub.id}`).
     - Endpoint `UniversityPostPaymentCredentialsView` (`GET /api/v1/partners/university/subscriptions/<uuid:pk>/credentials/`) dans `apps/partners/university_views.py`.
     - Service PDF `PartnerIntegrationGuidePdfService` (`apps/reporting/pdf_service.py`) générant un document officiel de 4 pages vectorielles à partir de `GUIDE_INTEGRATION_CATALOGUE_SEUL.md`.
     - Endpoint de téléchargement `PartnerGuidePdfDownloadView` (`GET /api/v1/partners/university/guides/catalog-only-pdf/`).
     - Page de succès `/university/bouquets/success` : date d'expiration grand format, boîte d'identifiants 1-clic, téléchargement `.txt` (`.env`), téléchargement direct du Guide PDF.
     - Contrôle d'accès granulaire dans `apps/reader/views.py` (`PartnerCatalogListView`, `PartnerCatalogDetailView`, `ReaderSessionViewSet.create`) bloquant l'accès avec code HTTP 403 Forbidden dès qu'un bouquet est expiré.

  5. **Phase 5 : User Story 4 - Facturation Acquittée & Notifications Transactionnelles (T021–T024)** :
     - Template HTML `templates/reports/bouquet_invoice.html` et service PDF `BouquetInvoicePdfService` (`apps/reporting/pdf_service.py`).
     - Tâche Celery `send_bouquet_subscription_emails` (`apps/reporting/tasks.py`) envoyant la confirmation avec facture PDF acquittée jointe à l'université et alerte à l'administrateur.
     - Tâche Celery quotidienne `check_bouquet_subscriptions_and_remind` (`apps/reporting/tasks.py`) : relances à J-7 (annuel) et J-3 (mensuel), et passage automatique à `'expired'`.
     - Écritures financières enregistrées via `PaymentTransaction` dans `handle_bouquet_payment_success`.

  6. **Phase 6 : User Story 5 - Souscription B2C Étudiant & Souveraineté 12 Mois (T025–T029)** :
     - Endpoint `ClientBouquetSubscribeView` (`apps/commerce/views.py`) avec sélection mensuel/annuel, prolongation cumulative et direct Moneroo sans clé API.
     - Moteur d'accès `AccessService` (`apps/protection/access_service.py`) vérifiant la souveraineté de 12 mois (365 jours) des achats unitaires et les bouquets actifs.
     - Endpoint `StudentBooksView` (`apps/student/views.py`) retournant les livres achetés et les livres de bouquets étiquetés avec `is_bouquet_book`, `bouquet_name`, `bouquet_end_date`.
     - Page `/student/bouquets` réactivée avec sélecteur Mensuel/Annuel et souscription directe.
     - Page `/student/books` enrichie avec le 4ème onglet « Bouquets en cours », compteurs dédiés, cartes `BookCard` et items `BookListItem` arborant le badge doré `[Nom Bouquet]` et la date d'expiration exacte.

  7. **Phase 7 : User Story 6 - Supervision Administrative des Clés API (T030–T031)** :
     - ViewSet `PartnerAppAdminViewSet` (`apps/partners/views.py`) sérialisant la liste `restricted_bouquets` (Many-to-Many) et l'échéance d'abonnement campus (`institutionExpirationDate`).
     - Tableau de bord `/admin/api` mis à jour en vue Grille et vue Liste pour afficher tous les bouquets restreints et l'échéance de l'établissement.
     - Modales de création et d'édition adaptées pour gérer la sélection de bouquets multiples.
     - Actions de suspension temporaire (`toggle-status`), révocation définitive (`destroy`) et rotation de secret client (`rotate-secret`) pleinement opérationnelles.

  8. **Phase 8 : Polish, Style, Typographie & Responsive (T032–T035)** :
     - Zéro émoji : 100% des visuels sont des icônes vectorielles Lucide React.
     - Zéro code hexadécimal en dur : Utilisation exclusive des tokens sémantiques Tailwind (`bg-navy`, `bg-gold`, `text-navy`, `border-border`, etc.).
     - Mobile-first garanti : Interfaces testées et certifiées sans défilement horizontal dès 375px.
     - Scénarios du guide de validation `quickstart.md` exécutés et certifiés de bout en bout.

- **Fichiers Clés Modifiés et Créés pour la Feature 010** :
  - Backend :
    - `lahatheque-backend/apps/partners/models.py` (BouquetOffering, UniversityBouquetSubscription)
    - `lahatheque-backend/apps/commerce/models.py` (ClientBouquetSubscription)
    - `lahatheque-backend/apps/reader/models.py` (PartnerApp multi-bouquets)
    - `lahatheque-backend/apps/protection/access_service.py` (Souveraineté 12 mois et bouquets actifs)
    - `lahatheque-backend/apps/commerce/services.py` (handle_bouquet_payment_success, cache credentials)
    - `lahatheque-backend/apps/partners/views.py` (InstitutionBooksPreviewView, PartnerAppAdminViewSet multi-bouquets)
    - `lahatheque-backend/apps/partners/university_views.py` (UniversityBouquetSubscribeView, UniversityPostPaymentCredentialsView, PartnerGuidePdfDownloadView)
    - `lahatheque-backend/apps/student/views.py` (StudentBooksView avec métadonnées de bouquet)
    - `lahatheque-backend/apps/reader/views.py` (Contrôle granulaire d'accès aux bouquets)
    - `lahatheque-backend/apps/reporting/pdf_service.py` (PartnerIntegrationGuidePdfService, BouquetInvoicePdfService)
    - `lahatheque-backend/apps/reporting/tasks.py` (send_bouquet_subscription_emails, check_bouquet_subscriptions_and_remind)
    - `lahatheque-backend/apps/reporting/templates/reports/partner_integration_guide.html`
    - `lahatheque-backend/apps/reporting/templates/reports/bouquet_invoice.html`
  - Frontend :
    - `lahatheque-frontend/lib/types/admin.ts` (BouquetOfferingAdmin, PartnerApiKey)
    - `lahatheque-frontend/lib/types/student.ts` (ClientBookAccess bouquets)
    - `lahatheque-frontend/lib/services/admin.ts` (getInstitutionBooksPreview)
    - `lahatheque-frontend/lib/services/student.ts` (BookAPI bouquets)
    - `lahatheque-frontend/components/features/bouquets/bouquet-books-preview-modal.tsx`
    - `lahatheque-frontend/components/features/bouquets/bouquet-subscriptions-drawer.tsx`
    - `lahatheque-frontend/components/features/student/book-card.tsx`
    - `lahatheque-frontend/components/features/student/book-list-item.tsx`
    - `lahatheque-frontend/app/(dashboard)/admin/catalog/bouquets/page.tsx`
    - `lahatheque-frontend/app/(dashboard)/admin/api/page.tsx`
    - `lahatheque-frontend/app/(dashboard)/university/bouquets/page.tsx`
    - `lahatheque-frontend/app/(dashboard)/university/bouquets/success/page.tsx`
    - `lahatheque-frontend/app/(dashboard)/student/bouquets/page.tsx`
    - `lahatheque-frontend/app/(dashboard)/student/books/page.tsx`
  - Documentation & Spécification :
    - `specs/010-university-bouquet-subscription-api-flow/spec.md`
    - `specs/010-university-bouquet-subscription-api-flow/plan.md`
    - `specs/010-university-bouquet-subscription-api-flow/research.md`
    - `specs/010-university-bouquet-subscription-api-flow/data-model.md`
    - `specs/010-university-bouquet-subscription-api-flow/quickstart.md`
    - `specs/010-university-bouquet-subscription-api-flow/tasks.md` (35/35 [X] Complétées)
