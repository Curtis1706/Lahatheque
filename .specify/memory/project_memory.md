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
