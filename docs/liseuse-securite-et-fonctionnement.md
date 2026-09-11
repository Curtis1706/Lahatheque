# Fonctionnement et Sécurité de la Liseuse LAHAThèque

Ce document présente une vue d'ensemble claire, accessible et complète du fonctionnement de la liseuse numérique de LAHAThèque ainsi que de tous les dispositifs de sécurité mis en œuvre pour protéger les ouvrages contre le vol, le piratage et la fuite.

---

## 1. Principe Général : Comment Fonctionne la Liseuse ?

La liseuse LAHAThèque permet de lire les ouvrages universitaires et scientifiques directement dans le navigateur web, sans installer d'application externe.

Deux modes d'utilisation existent :

1. **Le Lecteur Intégré (Espace Client / Étudiant)** : accessible après connexion sur la plateforme lorsque l'étudiant consulte ses livres achetés ou les ouvrages inclus dans les bouquets de son université.
2. **Le Lecteur Hébergé Partenaire (B2B / Universités externes)** : une université ou une bibliothèque partenaire peut intégrer la liseuse dans son propre portail via notre API de lecture (`/api/v1/reader/sessions/`). L'étudiant accède alors à une session de lecture sécurisée temporaire (`/read/[token]`).

Dans les deux cas, **le fichier original du livre n'est jamais envoyé au lecteur**. Le document passe par un moteur de sécurisation qui le transforme et le diffuse par petits morceaux.

---

## 2. Les 7 Piliers de Sécurité de la Liseuse

### 1. Zéro Lien Direct vers le Fichier Source

Dans une architecture classique, le serveur transmet souvent au navigateur un lien vers le fichier complet (par exemple `https://.../mon_livre.pdf`). Cette approche est dangereuse car n'importe quel utilisateur averti peut ouvrir l'inspecteur web et télécharger le document complet en un clic.

**Sur LAHAThèque :**

- L'URL de stockage brut (Cloudflare R2 ou disque) est totalement masquée et inaccessible depuis l'extérieur.
- Le document est servi exclusivement par un point d'accès sécurisé (`/api/v1/reader/sessions/stream/`).
- Sans un jeton de session valide, vérifié en temps réel, le serveur rejette toute tentative de lecture avec un refus d'accès (Erreur 401 ou 403).

---

### 2. Le Filigrane Dynamique et Nominatif (Watermark Visible)

Chaque document consulté porte un filigrane incrusté directement dans les octets du fichier PDF :

- **Informations affichées** : Nom complet du lecteur, son adresse e-mail, son adresse IP et la date de consultation.
- **Positionnement personnalisable** : Le texte est placé en en-tête, en pied de page ou en diagonale au centre de chaque page.
- **Effet dissuasif** : Si une personne photographie son écran ou tente de partager le document, son identité et son adresse IP apparaissent clairement sur chaque page, rendant la source de la fuite immédiatement identifiable.

---

### 3. Le Tatouage Invisible (Stéganographie Cryptographique)

Même si un pirate tente de rogner les bords ou de gommer le filigrane visible :

- Une marque invisible est insérée dans la structure profonde du document.
- Cette marque contient un identifiant chiffré unique et une empreinte cryptographique (SHA-256) reliant ce fichier précis au compte du lecteur et à sa session.
- Les métadonnées internes du document sont également signées.
- Grâce à cette signature invisible, l'équipe LAHAThèque peut analyser n'importe quel extrait retrouvé sur Internet et identifier formellement le compte d'origine.

---

### 4. La Diffusion en Flux Fractionné (Streaming HTTP Range)

Le document complet n'est pas envoyé d'un bloc sur l'appareil du lecteur :

- Le serveur découpe le flux en petits fragments (par exemple 256 Ko à la fois).
- Seules les pages actuellement visualisées par l'utilisateur sont chargées en mémoire temporaire dans le navigateur.
- Cela offre deux avantages majeurs :
  1. **Performance** : un livre de 500 pages s'ouvre en une fraction de seconde, car le navigateur n'a pas besoin d'attendre la fin du téléchargement complet.
  2. **Sécurité** : le fichier complet n'est jamais présent sous forme de fichier téléchargeable sur le disque dur de l'utilisateur.

---

### 5. Protection Anti-Copie et Anti-Capture dans le Navigateur

L'interface de la liseuse met en place des barrières actives côté navigateur :

- **Désactivation de la copie de texte** : La sélection et la copie (`Ctrl + C` ou `Cmd + C`) de texte sont bloquées dans la zone de lecture.
- **Blocage de l'enregistrement** : Le raccourci de sauvegarde du navigateur (`Ctrl + S` ou `Cmd + S`) est intercepté et neutralisé.
- **Blocage de l'impression** : La commande d'impression (`Ctrl + P` ou `Cmd + P`) est désactivée.
- **Protection contre la capture** : Lorsque la liseuse détecte une tentative d'outil de capture ou une perte de focus suspecte, la zone de lecture est temporairement masquée ou floutée.

---

### 6. Mode Haute Sécurité (Anti-Extraction de Texte)

Pour les ouvrages hautement confidentiels ou les catalogues les plus sensibles, la plateforme dispose d'un profil de protection renforcé :

- Les pages du PDF sont converties en images haute définition protégées, supprimant totalement la couche texte brute.
- Aucun robot ou outil d'extraction automatique ne peut aspirer le texte textuel de l'ouvrage.

---

### 7. Gestion Stricte des Extraits et Droits d'Accès

Avant de transmettre le moindre fragment de page, le serveur vérifie systématiquement les droits réels du lecteur :

- **Ouvrage acheté ou abonnement actif** : L'accès à l'intégralité du document est accordé.
- **Mode Extrait gratuit** : Si l'utilisateur n'a pas acquis l'ouvrage, le serveur applique une coupure stricte. Seules les premières pages (par exemple les 15 premières pages) sont délivrées. Toutes les pages suivantes sont bloquées côté serveur par un mur d'accès infranchissable, garantissant qu'aucune manipulation dans le navigateur ne peut dévoiler le reste du livre.

---

## 3. Traçabilité et Audit Légal

Toute activité sur la liseuse est consignée de manière immuable dans une table de traçabilité (`TraceAcces`) :

- Qui a lu quel livre ?
- À quelle date et à quelle heure précise ?
- Depuis quelle adresse IP ?
- Combien de pages ont été lues et quel a été le temps d'étude ?

Ces journaux servent à la fois à alimenter le tableau de bord d'apprentissage de l'étudiant (progression de lecture, statistiques) et à fournir les éléments de preuve nécessaires aux éditeurs et ayants droit en cas de contentieux.

---

## 4. Comment s'effectue concrètement l'analyse en cas de fuite ?

Si un livre de LAHAThèque est retrouvé illégalement sur un canal Telegram, un groupe WhatsApp ou un site pirate, voici la procédure exacte utilisée pour remonter jusqu'au coupable :

### Cas 1 : Le pirate a partagé le fichier PDF
Même si le pirate a renommé le fichier, modifié son titre apparent ou tenté d'effacer les pages de garde, la marque reste incrustée dans le code du document :
1. **Extraction automatique de la marque cachée** :
   Un script d'analyse inspecte la structure interne du PDF. Il recherche le marqueur secret `LTQ:` qui a été injecté sur chaque page lors de la lecture.
2. **Décodage de la charge utile (JSON)** :
   Ce marqueur contient un bloc d'informations :
   ```json
   {
     "uid": "ID_COMPTE_UTILISATEUR",
     "em": "etudiant@exemple.com",
     "ip": "154.68.22.10",
     "sig": "a7b8c9d0e1f2..."
   }
   ```
   Ces informations étaient invisibles pour le lecteur (taille 1 point, couleur blanche, quasi 100% transparente), mais restent parfaitement lisibles pour un programme d'analyse.
3. **Vérification de la signature cryptographique (`sig`)** :
   L'empreinte SHA-256 prouve mathématiquement que ces données n'ont pas été falsifiées et qu'elles proviennent bien des serveurs officiels de LAHAThèque.

### Cas 2 : Le pirate a pris des captures d'écran ou des photos
Si le pirate n'a pas pu exporter le fichier PDF mais a pris des captures d'écran :
1. **Lecture du filigrane visible** :
   Le nom complet, l'e-mail et l'adresse IP de l'acheteur sont imprimés en transparence sur les pages.
2. **Protection contre le rognage (position diagonale)** :
   Si le document utilise le mode en diagonale, le filigrane traverse le texte en plein milieu de la page. Couper les bords de l'image ne sert à rien : effacer le filigrane détruirait le texte de l'auteur lui-même.

### Cas 3 : Confirmation finale dans les journaux d'accès (`TraceAcces`)
Une fois l'e-mail ou l'adresse IP obtenus (via le Cas 1 ou le Cas 2) :
- L'équipe technique interroge la table d'audit `TraceAcces` de la base de données.
- On retrouve la preuve formelle : le jour exact, la seconde précise où l'utilisateur a ouvert le livre, son numéro de commande de paiement, son compte bancaire ou mobile money, et son établissement universitaire.
- Le dossier de preuve est complet et incontestable pour engager des poursuites ou révoquer le compte.

---

## 5. Synthèse du Parcours d'une Requête de Lecture

```
1. L'étudiant clique sur "Lire" ou ouvre un lien partenaire.
   │
2. Le backend LAHAThèque contrôle les droits d'accès (Achat, Bouquet ou Extrait).
   │
3. Une session de lecture éphémère est validée avec un jeton cryptographique.
   │
4. Le moteur PyMuPDF récupère le PDF original et applique à la volée :
   ├── Le filigrane visible nominatif (Nom, E-mail, IP)
   ├── Le tatouage invisible indélébile (Signature SHA-256)
   └── Le bridage des pages si c'est un extrait
   │
5. Le flux protégé est envoyé par morceaux Range HTTP au navigateur.
   │
6. L'interface frontend affiche les pages tout en bloquant l'impression, la copie et le clic droit.
```
