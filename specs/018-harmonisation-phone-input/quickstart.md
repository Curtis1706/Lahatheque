# Quickstart: Validation de l'Harmonisation du PhoneInput

Ce guide décrit les scénarios de test pas-à-pas pour valider l'harmonisation de la saisie téléphonique et la correction de la page de contrat.

---

## Scénario 1 : Validation sur la Page Nouveau Contrat Juriste

1. Ouvrir l'URL suivante dans le navigateur :
   `http://localhost:3000/legal-reviewer/contracts/new?book_id=0436ccc1-3c14-4550-a572-3defb6c60740`
2. **Vérification console** : Ouvrir les outils de développement (F12 / Console).
   - **Résultat attendu** : Zéro erreur `Cannot read properties of undefined (reading 'toLowerCase')`.
3. **Vérification du champ téléphone** :
   - Observer le champ *Téléphone de la Partie Contractante*.
   - **Résultat attendu** : Présence du composant `PhoneInput` avec le drapeau national et le sélecteur d'indicatif (Bénin `BJ (+229)` sélectionné par défaut ou selon le numéro rattaché).
4. Changer le pays pour la Côte d'Ivoire (`CI (+225)`), saisir `07 12 34 56`.
   - **Résultat attendu** : Le drapeau ivoirien s'affiche et la valeur complète transmise est `+225 07 12 34 56`.

---

## Scénario 2 : Validation dans la Modale d'Administration de Création de Compte

1. Naviguer sur `http://localhost:3000/admin/users`.
2. Cliquer sur « Créer un compte » pour ouvrir la modale.
3. Observer le champ *Téléphone*.
   - **Résultat attendu** : Composant `PhoneInput` avec drapeau et indicatif, parfaitement aligné dans la grille avec le champ de sélection du pays.

---

## Scénario 3 : Validation dans l'Annuaire des Contacts

1. Naviguer sur `http://localhost:3000/admin/contacts` ou `/legal-reviewer/contacts`.
2. Cliquer sur « Ajouter un contact » ou modifier un contact existant.
3. Observer le champ *Téléphone / WhatsApp*.
   - **Résultat attendu** : Le composant `PhoneInput` est affiché et pré-rempli correctement si le contact possède déjà un numéro.

---

## Scénario 4 : Validation dans la Commande Grossiste

1. Naviguer sur `http://localhost:3000/wholesaler/catalog`.
2. Cliquer sur « Commander » en version papier pour ouvrir la modale.
3. Observer l'étape de livraison.
   - **Résultat attendu** : Le champ *Numéro de téléphone du responsable logistique* utilise `PhoneInput`.

---

## Scénario 5 : Validation TypeScript & Build

Exécuter dans le terminal :
```bash
cd E:\Lahatheque\lahatheque-frontend
pnpm tsc --noEmit
```
- **Résultat attendu** : Code 0 (Zéro erreur de typage).
