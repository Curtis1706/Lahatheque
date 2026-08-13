# 📖 Guide Complet des Dashboards & Identifiants d'Accès Démo — LAHAThèque v3.2

Ce document est le **référentiel officiel d'accès et de documentation des 10 Dashboards (9 Rôles Métier)** de la plateforme **LAHAThèque**, lisible par toute l'équipe sur le repository GitHub.

---

## 🔑 Identifiants d'Accès Démo (Mots de Passe & Numéros Béninois)

Tous les comptes démo ci-dessous sont enregistrés en base de données avec le mot de passe unique **`123456`** et des numéros de téléphone béninois au format international.

| Rôle Métier | Email Démo | Mot de Passe | Numéro Béninois | URL Dashboard |
|---|---|---|---|---|
| **1. Administrateur** | `admin@lahatheque.com` | *(Votre MDP)* | `+229 01 95 00 00 00` | [`/admin`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin) |
| **2. Maquettiste** | `maquettiste@lahatheque.com` | `123456` | `+229 01 91 22 33 44` | [`/layout-artist`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/layout-artist) |
| **3. Chef Maquettiste** | `chefmaquettiste@lahatheque.com` | `123456` | `+229 01 92 33 44 55` | [`/chief-layout`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/chief-layout) |
| **4. Gestionnaire Stock** | `gestionnaire@lahatheque.com` | `123456` | `+229 01 93 44 55 66` | [`/manager`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/manager) |
| **5. Juriste** | `juriste@lahatheque.com` | `123456` | `+229 01 94 55 66 77` | [`/legal-reviewer`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/legal-reviewer) |
| **6. Auteur** | `auteur@lahatheque.com` | `123456` | `+229 01 97 00 11 22` | [`/author`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/author) |
| **7. Université** | `universite@lahatheque.com` | `123456` | `+229 01 99 55 66 77` | [`/librarian`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/librarian) |
| **8. Éditeur Tiers** | `editeur@lahatheque.com` | `123456` | `+229 01 98 33 44 55` | [`/publisher`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/publisher) |
| **9. Client (Lecteur)** | `client@lahatheque.com` | `123456` | `+229 01 96 12 34 56` | [`/student`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/student) |
| **10. Grossiste** | `grossiste@lahatheque.com` | `123456` | `+229 01 95 56 78 90` | [`/wholesaler`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/wholesaler) |

---

## 🏛️ Détail & Fonctionnalités par Dashboard

---

### 1. Dashboard Administrateur (`/admin`) — *Rôle Internes*
**Accès** : `admin@lahatheque.com`  
**Périmètre** : Vue globale de la plateforme, pilotage commercial, gouvernance et sécurité.
- **Gestion des Utilisateurs** : Assistant de création et gestion détaillée des 11 rôles (`/admin/users`).
- **Catalogue & Tarification** : Validation des prix et historique de tarification (`/admin/catalog`).
- **Redevances & Reporting** : États de versement Auteurs, Éditeurs et Universités (`/admin/royalties`).
- **Relances d'Impayés & Dépôts** : Alertes et relances automatiques (`/admin/reminders`).
- **Clés API & Traçabilité** : Journal des accès et intégrations partenaires (`/admin/api`, `/admin/logs`).

---

### 2. Dashboard Maquettiste (`/layout-artist`) — *Rôle Internes*
**Accès** : `maquettiste@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Préparation technique et éditoriale des ouvrages avant publication.
- **Gestion des Dépôts** : Téléversement des fichiers épreuves PDF/EPUB (`/layout-artist/deposits`).
- **Métadonnées & Classification** : Saisie de la discipline, faculté, pays et de la version audio.
- **Soumission pour Validation** : Envoi du dossier final au Chef Maquettiste.

---

### 3. Dashboard Chef Maquettiste (`/chief-layout`) — *Rôle Internes*
**Accès** : `chefmaquettiste@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Validation finale et contrôle de qualité des dépôts épreuves.
- **File de Validation** : Examen des maquettes transmises (`/chief-layout/validation`).
- **Vitrine Preview** : Contrôle du rendu liseuse/audio avant mise en ligne.
- **Historique & Publication** : Validation finale et publication automatique au catalogue public.

---

### 4. Dashboard Gestionnaire (`/manager`) — *Rôle Internes*
**Accès** : `gestionnaire@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Logistique, stock physique des livres papier et suivi des livraisons.
- **Gestion des Stocks** : Mouvements de stock papier et alertes de rupture (`/manager/stock`).
- **Suivi des Expéditions** : Commandes à préparer, en transit et livrées (`/manager/delivery`).
- **Coordination Admin** : Signalement des besoins de réimpression et exports logistiques (`/manager/coordination`).

---

### 5. Dashboard Juriste (`/legal-reviewer`) — *Rôle Internes*
**Accès** : `juriste@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Contrats d'édition, répartition financière des droits et relances légales.
- **Indexation des Contrats** : Stockage sécurisé et recherche juridique (`/legal-reviewer/contracts`).
- **Pourcentages & Droits** : Configuration des taux de droits Auteurs/Éditeurs (`/legal-reviewer/royalties`).
- **Relances & Impayés** : Gestion des relances automatiques et pré-éditions (`/legal-reviewer/relances`).

---

### 6. Dashboard Auteur (`/author`) — *Rôle Externes / Partenaires*
**Accès** : `auteur@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Suivi commercial autonome des ouvrages publiés et dépôts de manuscrits.
- **Mes Livres Publiés** : Ventes, téléchargements DRM et ventilations par format/pays (`/author/books`).
- **Mes Dépôts Manuscrit (2 Étapes)** : Suivi de l'Étape 1 (Étude éditoriale avec suggestion IA) à l'Étape 2 (`/author/submissions`).
- **Droits & Paiements Rétribués** : Consultation **exclusive de la part propre** et relevés PDF (`/author/royalties`).
- **Délégation d'Accès** : Invitation par e-mail de co-auteurs et assistants (`/author/profile`).
- **Mes Achats** : Consultation des livres achetés en tant que client (`/author/purchases`).

---

### 7. Dashboard Université (`/librarian`) — *Rôle Externes / Partenaires*
**Accès** : `universite@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Pilotage du catalogue universitaire et suivi des bouquets institutionnels.
- **Statistiques d'Utilisation** : Consultations numériques et écoutes audio par faculté (`/librarian/stats`).
- **Gestion des Bouquets** : Souscription aux bouquets documentaires et part d'usage (`/librarian/bouquets`).
- **Redevances Établissement** : Suivi des versements 15% et RIB de paiement (`/librarian/redevances`).
- **Achats Papier** : Commandes d'exemplaires papier physiques pour les bibliothèques (`/librarian/purchases`).

---

### 8. Dashboard Éditeur Tiers (`/publisher`) — *Rôle Externes / Partenaires*
**Accès** : `editeur@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Gestion du catalogue partenaire sur LAHAThèque.
- **Dépôt 3 Modes** : Formulaire web, import en masse ONIX 3.0 et clés API (`/publisher/catalog`).
- **Suivi des Revenus** : Redevances éditeur et tableaux de bord financiers (`/publisher/royalties`).
- **Statistiques & Protection** : Consultations et paramétrage des filigranes LCP (`/publisher/stats`).

---

### 9. Dashboard Client (Lecteur) (`/student`) — *Rôle Externes / Grand Public*
**Accès** : `client@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Consommation grand public du catalogue numérique et audio.
- **Mon Espace Lecteur** : Reprise de lecture instantanée du dernier ouvrage (`/student`).
- **Catalogue & Extraits** : Extraits gratuits lisibles en 1 clic sans friction (`/student/catalog`).
- **Ma Bibliothèque & Audio** : Lecteur audio adaptatif 21st.dev avec vitesse réglable (`/student/books`).
- **Achats & Livraisons Papier** : Suivi d'expédition des livres physiques papier (`/student/orders`).
- **Pass & Affiliation Optionnelle** : Pass mensuel/annuel et rattachement optionnel d'une université (`/student/profile`).
- **Mon Université (Conditionnel)** : Section rattachée visible uniquement si l'affiliation est validée (`/student/university`).

---

### 10. Dashboard Grossiste (`/wholesaler`) — *Rôle Externes / Partenaires*
**Accès** : `grossiste@lahatheque.com` | **MDP** : `123456`  
**Périmètre** : Achats en grande quantité pour revente.
- **Catalogue Grossiste** : Consultation des ouvrages avec grilles de prix dégressifs (`/wholesaler/catalog`).
- **Commandes Groupées** : Saisie rapide de commandes en volume (`/wholesaler/orders/new`).
- **Suivi des Livraisons** : Statut des expéditions papier physiques (`/wholesaler/orders`).
- **Notifications & Profil** : Alertes de réapprovisionnement et coordonnées de facturation (`/wholesaler/profile`).

---

## 🛠️ Validation de Conformité
- **TypeScript & Build Next.js** : `pnpm build` **Exit Code 0** (100 static routes).
- **Règles de Style & Design** : `bash ./check-lahatheque-rules.sh` **Exit Code 0** (0 couleur hexadécimale en dur, 100% tokens CSS).
