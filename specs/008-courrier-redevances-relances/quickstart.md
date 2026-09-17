# Guide de Démarrage Rapide & Validation : Courriers Officiels LAHAThèque

**Feature** : `008-courrier-redevances-relances`
**Date** : 2026-09-17

---

## 1. Prérequis

- Serveur backend Django démarré avec WhiteNoise et migrations appliquées.
- Serveur frontend Next.js démarré sur `http://localhost:3000` (ou port actif).
- Gabarit officiel présent : `lahatheque-backend/static/Lahatheque-PapierEntete-SansNumero.pdf`.
- Utilisateur connecté avec le rôle Juriste (`legal_reviewer`) ou Administrateur (`admin`).

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario A : Préparation d'un courrier de redevance université
1. Accéder à `/legal-reviewer/redevances`.
2. Sur la ligne d'une université (ex: *Université Nationale d'Agriculture*), observer le nouveau bouton **"Préparer le courrier"** (qui remplace "Envoyer Relevé").
3. Cliquer sur "Préparer le courrier".
4. **Résultat attendu** :
   - Redirection instantanée vers `/legal-reviewer/courriers`.
   - Le courrier préparé apparaît en tête de table avec le badge `Brouillon`.
   - Les boutons d'action visibles sont : `PDF`, `Corriger`, `Valider`, `Annuler`.

### Scénario B : Prévisualisation PDF dynamique du brouillon
1. Dans la table des courriers, cliquer sur le bouton **`PDF`** de la ligne en brouillon.
2. **Résultat attendu** :
   - Un nouvel onglet s'ouvre affichant le PDF généré en direct.
   - Le document présente l'en-tête graphique institutionnel de LAHAThèque en haut de page.
   - Le corps du courrier comprend l'objet, la date, les coordonnées de l'université et le texte pré-rempli.
   - Le pied de page officiel (coordonnées, mentions légales) est positionné en bas de page.

### Scénario C : Correction du texte du courrier via modale
1. Sur la ligne du brouillon, cliquer sur le bouton **`Corriger`**.
2. **Résultat attendu** :
   - Une modale s'ouvre affichant les informations du destinataire et le montant en lecture seule.
   - Deux champs sont modifiables : **Objet** et **Corps du message**.
3. Modifier l'objet et ajouter un paragraphe spécifique dans le corps du texte.
4. Cliquer sur **"Enregistrer les modifications"**.
5. **Résultat attendu** :
   - Toast de succès confirmant l'enregistrement du brouillon.
   - La modale se ferme.
   - Un nouveau clic sur `PDF` reflète immédiatement les modifications saisies.

### Scénario D : Validation formelle et scellement du PDF
1. Sur la ligne du courrier corrigé, cliquer sur **`Valider`**.
2. Une modale d'alerte demande confirmation : *"Cette action verrouillera définitivement le texte du courrier et générera le document PDF officiel."*.
3. Confirmer la validation.
4. **Résultat attendu** :
   - Le statut passe à `Validé` (badge vert/or).
   - Les actions `Corriger` et `Valider` disparaissent.
   - L'action principale devient **`Envoyer par email`**.
   - L'action `Annuler` reste accessible.
   - Le PDF généré est scellé et enregistré sur le stockage.

### Scénario E : Expédition de l'email officiel avec le PDF joint
1. Cliquer sur **`Envoyer par email`**.
2. Confirmer l'envoi dans la modale de validation d'expédition.
3. **Résultat attendu** :
   - L'email est expédié au destinataire avec le texte complet rédigé dans le corps du message et le PDF officiel scellé en pièce jointe.
   - Le statut passe à `Envoyé`.
   - L'horodatage d'expédition est consigné dans la table.
   - Plus aucune action d'annulation ou d'édition n'est permise.

### Scénario F : Préparation groupée de relances
1. Accéder à `/legal-reviewer/relances`.
2. Observer le bouton d'en-tête : **"Préparer les courriers de la période"**.
3. Cliquer dessus.
4. **Résultat attendu** :
   - Tous les courriers de la période sélectionnée sont initialisés en brouillons.
   - Redirection automatique vers `/legal-reviewer/courriers` affichant l'ensemble des courriers préparés.
