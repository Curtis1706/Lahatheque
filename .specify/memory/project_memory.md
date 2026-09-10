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
   - Côté frontend : `console.groupCollapsed` / `console.log` / `console.error` balisés par module (ex: `[AUTH REGISTER]`, `[PROFILE UPDATE]`) avec horodatage, données envoyées (mots de passe masqués), temps d'exécution en ms et détail précis des erreurs pour faciliter le débogage instantané dans les DevTools.
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
