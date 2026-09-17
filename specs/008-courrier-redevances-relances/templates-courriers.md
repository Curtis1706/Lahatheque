# Modèles Officiels des Courriers et E-mails Types LAHAThèque

**Feature** : `008-courrier-redevances-relances`
**Devise Officielle** : **FCFA** (exclusivement)
**Date** : 2026-09-17 (Mis à jour selon retours)

Règles de rédaction appliquées :
1. Les auteurs n'ont pas de mention de consultations : uniquement le volume d'exemplaires vendus.
2. Pas de bloc de signature redondant en fin de texte (pas de mention "Service Juridique", "Service Contentieux", "Direction Juridique", numéros de téléphone ou adresses) : le gabarit papier à en-tête intègre déjà l'ensemble des coordonnées et mentions légales en pied de page.
3. Le texte se termine proprement sur la formule de politesse d'usage.

---

## Modèle 1 : Redevance Auteur — Relevé Officiel des Droits d'Auteur

- **Catégorie** : `royalty_author`
- **Déclenchement** : Page Relances & Communication (Onglet Rapports Auteurs) ou Droits d'Auteur.
- **Destinataire** : Auteur ayant droit.
- **Objet par défaut** :
  `Bordereau officiel des droits d'auteur et relevé de ventes — {periode}`

- **Corps du courrier / e-mail type** :
```text
Cher(e) {nom_auteur},

Nous avons le plaisir de vous transmettre votre bordereau officiel de décompte de droits d'auteur pour la période : {periode}.

Conformément aux stipulations de votre contrat d'édition conclu avec LAHA Éditions, vous trouverez ci-après la synthèse des ventes de vos œuvres sur la plateforme LAHAThèque :

• Nombre d'exemplaires vendus : {volume_ventes}
• Assiette brute des ventes générées : {assiette_brute} FCFA
• Montant net des droits d'auteur vous revenant : {montant_net} FCFA

Le document officiel scellé reprenant le détail livre par livre est joint au présent message au format PDF.

Si vous souhaitez déclencher le versement de vos droits disponibles, vous pouvez vous connecter directement à votre espace auteur sur la plateforme ou répondre à ce message en nous communiquant votre Relevé d'Identité Bancaire (RIB) ou votre numéro de compte Mobile Money certifié.

Nous vous remercions pour votre précieuse collaboration et votre confiance continue dans la diffusion du savoir africain.

Veuillez agréer, Cher(e) {nom_auteur}, l'assurance de notre considération distinguée.
```

---

## Modèle 2 : Redevance Université — Décompte Conventionné (15%)

- **Catégorie** : `royalty_university`
- **Déclenchement** : Page Redevances (Section 1 : Redevances Universités).
- **Destinataire** : Direction Rectorale / Agence Comptable de l'Université Partenaire.
- **Objet par défaut** :
  `Bordereau officiel de redevances institutionnelles conventionnées (15%) — {periode}`

- **Corps du courrier / e-mail type** :
```text
À l'attention de Monsieur le Recteur / Madame la Directrice,
Agence Comptable et Direction de la Coopération Universitaire
{nom_universite}

Réf. Convention-Cadre : {reference_contrat}
Période comptable : {periode}

Monsieur le Recteur, Madame la Directrice,

En application de la Convention-Cadre de partenariat conclue entre votre illustre Établissement et LAHA Éditions, nous avons l'honneur de vous transmettre le bordereau officiel de redevances universitaires arrêté pour la période : {periode}.

Conformément au barème conventionné (taux fixe institutionnel de 15% sur les acquisitions et abonnements réalisés au sein de votre établissement), les données consolidées s'établissent comme suit :

• Volume global des acquisitions enregistrées : {volume_ventes}
• Assiette brute de référence : {assiette_brute} FCFA
• Redevance conventionnelle due (15%) : {montant_net} FCFA

Le bordereau financier officiel, portant visa certifié et récapitulatif détaillé, est annexé au présent courrier au format PDF.

Ce montant est à votre disposition et fera l'objet d'un virement sur le compte bancaire officiel de votre Établissement dès réception de votre avis de confirmation.

Nous vous prions d'agréer, Monsieur le Recteur, Madame la Directrice, l'expression de notre haute et respectueuse considération.
```

---

## Modèle 3 : Redevance Éditeur Tiers — Décompte Contractuel Négocié

- **Catégorie** : `royalty_publisher`
- **Déclenchement** : Page Redevances (Section 2 : Redevances Éditeurs Tiers).
- **Destinataire** : Direction Générale de la Maison d'Édition Partenaire.
- **Objet par défaut** :
  `Relevé officiel des redevances de diffusion et co-édition — {periode}`

- **Corps du courrier / e-mail type** :
```text
À l'attention de la Direction Générale,
{nom_editeur}

Réf. Partenariat Commercial : {reference_contrat}
Période : {periode}

Chers Confrères,

Nous avons le plaisir de vous faire parvenir le décompte contractuel officiel des ventes et diffusions de votre catalogue sur la plateforme LAHAThèque pour la période : {periode}.

Suivant les stipulations particulières de notre accord de co-édition et distribution, le décompte des ventes pour votre maison d'édition se présente ainsi :

• Taux contractuel négocié appliqué : {taux_contractuel}%
• Ventes brutes enregistrées sur la période : {assiette_brute} FCFA
• Montant net des redevances revenant à votre maison : {montant_net} FCFA

Le bordereau de décompte officiel scellé, présentant la ventilation exacte titre par titre et le détail des transactions certifiées, est joint au présent courriel en pièce jointe PDF.

Nous vous invitons à nous adresser votre facture correspondante afin que le règlement puisse être effectué par virement bancaire dans les meilleurs délais.

Dans l'attente de la poursuite fructueuse de notre coopération éditoriale, nous vous prions d'agréer, Chers Confrères, nos salutations les plus cordiales.
```

---

## Modèle 4 : Relance d'Impayé & Recouvrement de Créance

- **Catégorie** : `debt_reminder`
- **Déclenchement** : Page Relances & Communication (Onglet Relances Dettes Clients / Grossistes).
- **Destinataire** : Débiteur (Grossiste, Partenaire, Client B2B).
- **Objet par défaut** :
  `Rappel d'échéance et relance officielle pour facture en impayé — Dossier {reference_dette}`

- **Corps du courrier / e-mail type** :
```text
À l'attention de : {nom_client}
{qualite_client}

Réf. Dossier : {reference_dette}
Date d'exigibilité initiale : {date_echeance}

Madame, Monsieur,

Sauf erreur ou omission de notre part, l'examen de nos écritures comptables fait apparaître que le règlement de la créance visée en référence demeure en souffrance à ce jour.

Le détail de la créance échue est récapitulé ci-après :

• Référence de la commande / facture : {reference_facture}
• Montant principal exigible : {montant_du} FCFA
• Nombre de relances administratives déjà émises : {nombre_relances}

Nous vous prions de trouver en pièce jointe au présent courriel le courrier officiel de relance, dûment scellé sur papier à en-tête institutionnel de LAHA Éditions.

Nous vous invitons à régulariser cette situation dans un délai de huit (08) jours ouvrés à compter de la réception du présent message, par virement bancaire sur le compte officiel de LAHA Éditions ou par règlement direct auprès de notre agence comptable.

Si votre règlement a été effectué entre-temps, nous vous saurions gré de ne pas tenir compte de ce rappel et de bien vouloir nous transmettre votre bordereau de versement pour mise à jour immédiate de votre dossier.

Restant à votre entière disposition pour tout renseignement d'ordre comptable, nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées.
```
