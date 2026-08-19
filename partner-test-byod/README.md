# Partenaire Test BYOD VIP (LAHALEX) — Démo Locale

Ce dossier contient une application partenaire autonome et prête à l'emploi qui simule l'intégration de la liseuse **LAHAThèque** par un tiers (ici **LAHALEX**, profil VIP Illimité).

Elle utilise le fichier PDF local existant dans `lahatheque-frontend/public/PromptBreeder_Original_Paper-2309.16797v1.pdf`.

---

## 1. Démarrage Rapide en 1 Commande

Aucune installation de dépendance (`npm install`) n'est requise : le serveur fonctionne avec **Node.js natif**.

Ouvrez un terminal dans ce dossier et lancez :

```bash
node server.js
```

---

## 2. Accès à l'Application

* **Portail Web Partenaire LAHALEX :** [http://localhost:4000](http://localhost:4000)
* **Déclenchement Direct de la Liseuse :** [http://localhost:4000/read](http://localhost:4000/read)
* **Endpoint du PDF Test Distribué :** [http://localhost:4000/documents/prompt-breeder.pdf](http://localhost:4000/documents/prompt-breeder.pdf)

---

## 3. Ce que Fait ce Code de Test

1. **Authentification OAuth2 Machine-to-Machine :**
   - Émet un `POST /api/v1/oauth2/token/` vers le backend avec `client_id: laha_client_5e5c3e06` et `client_secret: sec_live_xng70u4wnknofh020br`.
2. **Création de la Session de Lecture Sécurisée (BYOD) :**
   - Émet un `POST /api/v1/reader/sessions/` avec l'URL du PDF local, l'identité du juriste (*Maître Jean Dupont*), l'adresse IP et la charte graphique LAHALEX (`#770D28` et `#B4AB6B`).
3. **Ouverture de la Liseuse LAHAThèque :**
   - Redirige automatiquement le juriste vers le lecteur sécurisé [http://localhost:3000/read/{token}](http://localhost:3000).
   - Le PDF s'affiche avec le filigrane dynamique, la synthèse vocale et les contrôles personnalisés.
