# Tasks — Authentification, Inscription OTP & Règles de Vérification

**Périmètre Réel** : Moteur d'authentification, tunnel d'inscription OTP résilient, exemption stricte d'OTP pour la connexion et vérification automatique sans OTP pour les comptes créés par l'administrateur.

---

## Phase 1 : Comptes Créés par l'Administrateur (Vérifiés d'Office, Zéro OTP)

**Objectif** : Garantir que tout compte créé par un administrateur (via le dashboard admin, l'assistant wizard ou l'API d'administration) est automatiquement considéré comme vérifié (`is_verified = True`) et ne déclenche ni n'exige jamais de code OTP.

- [x] T001 Vérifier que `admin_create_user_wizard` initialise explicitement `is_verified = True` et n'appelle pas `send_otp` dans `lahatheque-backend/apps/accounts/services.py`
- [x] T002 Vérifier que l'endpoint d'administration de création d'utilisateurs crée les comptes avec `is_verified = True` et transmet uniquement les identifiants temporaires sans OTP dans `lahatheque-backend/apps/accounts/admin_views.py`
- [x] T003 Vérifier que la création d'utilisateur client sous gestion des droits initialise `is_verified = True` dans `lahatheque-backend/apps/rights/views.py`
- [ ] T004 Tester la première connexion d'un compte créé par l'administrateur avec ses identifiants temporaires pour confirmer qu'aucun OTP ne lui est demandé

---

## Phase 2 : Connexion Classique Directe (`/login` sans OTP)

**Objectif** : Garantir que la connexion standard (`LoginView` / `login()`) fonctionne en direct avec mot de passe et génération de tokens JWT, sans aucune invite ni blocage OTP.

- [x] T005 Vérifier que `LoginView` dans `lahatheque-backend/apps/accounts/views.py` ne contient aucun contrôle ni redirection vers un flux OTP
- [x] T006 Vérifier que la fonction `login` dans `lahatheque-backend/apps/accounts/services.py` ne bloque pas sur `is_verified` et délivre immédiatement les jetons JWT
- [ ] T007 Tester un appel POST `/api/v1/accounts/login/` pour attester de la restitution directe des tokens de session sans étape intermédiaire

---

## Phase 3 : Comptes Déjà Existants en Base de Données

**Objectif** : S'assurer qu'aucun utilisateur pré-existant en base de données n'est pénalisé ou bloqué par le nouveau système OTP.

- [x] T008 Créer et appliquer la migration de données `0010_mark_existing_users_verified.py` dans `lahatheque-backend/apps/accounts/migrations/0010_mark_existing_users_verified.py`
- [x] T009 Vérifier en base de données que 100% des comptes pré-existants possèdent `is_verified = True`

---

## Phase 4 : Inscription Publique (`/register`) & OTP Résilient sans Échec au 1er Coup

**Objectif** : Sécuriser la création de compte publique via formulaire multi-step et validation OTP résiliente.

- [x] T010 Intégrer le composant 21st.dev `OTPInput` avec gestion du focus automatique, retour arrière et collage presse-papier dans `lahatheque-frontend/components/ui/otp-input.tsx`
- [x] T011 Intégrer l'étape 4 de vérification OTP dans le formulaire multi-step de `lahatheque-frontend/app/(auth)/register/page.tsx`
- [x] T012 Configurer la redirection automatique directe vers le dashboard (`/student` ou `/author`) dès validation du code sans étape `/login` dans `lahatheque-frontend/app/(auth)/register/page.tsx`
- [x] T013 Normaliser les identifiants (espaces, casse email, format téléphone) dans `_find_user` dans `lahatheque-backend/apps/accounts/services.py`
- [x] T014 Éliminer la suppression destructive des codes en cas de renvoi et étendre la validité à 15 minutes dans `lahatheque-backend/apps/accounts/services.py`
- [x] T015 Rendre la consommation des codes atomique (`OTP.objects.filter(user=user).update(is_verified=True)`) dans `lahatheque-backend/apps/accounts/services.py`
- [x] T016 Vérifier la conformité visuelle du template d'email d'OTP avec `base_email.html` (logo officiel, typographie Playfair/Poppins, mode sombre) dans `lahatheque-backend/templates/emails/accounts/verification_otp.html`
- [x] T017 Ajouter la télémétrie et journalisation détaillée des requêtes d'inscription et de vérification OTP dans `lahatheque-backend/apps/accounts/views.py` et `lahatheque-frontend/lib/services/auth.ts`

---

## Phase 5 : Tests de Validation Finale

- [x] T018 Vérifier l'absence d'erreurs de compilation Python (`python -m py_compile`)
- [x] T019 Vérifier l'absence d'erreurs TypeScript et de build de production Next.js (`pnpm run build`)
- [ ] T020 Effectuer un test de création de compte via `/register` et valider le premier code reçu
