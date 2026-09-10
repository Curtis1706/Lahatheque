# Checklist Qualité des Exigences : Formulaire Contact B2B & Tunnel d'Achat E-commerce

**Objectif** : Tests unitaires pour la rédaction des exigences — valider l'exhaustivité, la clarté, la cohérence et la couverture des spécifications du formulaire de contact B2B et du tunnel de commande e-commerce
**Date de création** : 2026-09-10
**Fonctionnalité** : [spec.md](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/spec.md) | [plan.md](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/plan.md)

**Note** : Cette checklist personnalisée est générée par la commande `/speckit-checklist` sur la base du contexte et des exigences de la fonctionnalité.
**Propriété de la revue** : Cette checklist est un artefact de revue de la qualité des exigences appartenant au relecteur. Cocher `[x]` uniquement lorsque le relecteur détermine que le critère de qualité de rédaction est pleinement satisfait.
**Sémantique des cases** : `[x]` signifie que l'exigence a été relue, clarifiée et validée pour sa qualité de spécification. Cela ne signifie pas que le code est déjà terminé.

---

## 1. Exhaustivité des Exigences

- [ ]  CHK001 Les profils demandeurs officiels sont-ils explicitement spécifiés et calqués sur les choix de rôles en base de données ? [Exhaustivité, Spec §FR-001]
- [ ]  CHK002 Les besoins de partenariat institutionnel et de commande en gros sont-ils explicitement listés aux côtés des prestations éditoriales ? [Exhaustivité, Spec §FR-002]
- [ ]  CHK003 Les trois adresses e-mails administratives exactes de notification sont-elles formellement documentées ? [Exhaustivité, Spec §FR-003]
- [ ]  CHK004 Les options d'identification invité au checkout (connexion directe vs inscription rapide) sont-elles intégralement spécifiées ? [Exhaustivité, Spec §FR-007]
- [ ]  CHK005 Le rôle utilisateur attribué aux nouveaux clients e-commerce est-il formellement défini comme étant 'student' ? [Exhaustivité, Spec §FR-008]
- [ ]  CHK006 Les informations requises pour la livraison physique (adresse, ville, pays, créneau horaire) sont-elles spécifiées pour les livres papier ? [Exhaustivité, Spec §FR-009]
- [ ]  CHK007 Les conditions d'activation et d'accès sont-elles définies pour les formats numérique et audio ? [Exhaustivité, Spec §User Story 2]

---

## 2. Clarté & Non-Ambiguïté

- [X]  CHK008 Le traitement de l'option de besoin 'Autre' est-il défini de manière limpide sans champ d'input dynamique spéculatif ? [Clarté, Clarifications §Session 2026-09-10]
- [X]  CHK009 La disposition de l'Option A au checkout (panneau à deux onglets avec récapitulatif permanent du panier) est-elle précisément décrite ? [Clarté, Spec §Scénario 2.2]
- [X]  CHK010 Le comportement de validation OTP lors de l'inscription au checkout est-il spécifié comme étant auto-connectant sans redirection vers login ? [Clarté, Spec §FR-008]
- [X]  CHK011 Les règles de réservation et de décrémentation du stock papier sont-elles nettement distinguées de l'attribution des droits numériques ? [Clarté, Plan §Résumé]
- [X]  CHK012 La transmission de la facture transactionnelle acquittée en PDF est-elle formellement requise dès validation du paiement ? [Clarté, Spec §Scénario 2.5]

---

## 3. Cohérence & Alignement

- [X]  CHK013 Les rôles demandeurs du formulaire de contact s'alignent-ils strictement avec `ROLE_CHOICES` dans `apps/accounts/models.py` ? [Cohérence, Spec §FR-001]
- [X]  CHK014 Les adresses e-mails administratives sont-elles rigoureusement identiques entre la spec, le plan et les fichiers de recherche ? [Cohérence, Traçabilité]
- [X]  CHK015 Le comportement de persistance du panier invité est-il cohérent entre l'exploration du catalogue et la soumission du checkout ? [Cohérence, Spec §FR-005, §FR-009]
- [X]  CHK016 Les formats de ligne de commande (`digital`, `paper`, `audio`) sont-ils uniformes entre les contrats de données et les modèles backend ? [Cohérence, Contrat §checkout-order-payload]

---

## 4. Couverture des Scénarios & Cas Limites

- [ ]  CHK017 La spécification définit-elle le comportement lorsqu'un utilisateur tente de s'inscrire au checkout avec une adresse e-mail déjà existante ? [Cas Limite, Spec §Cas Limites]
- [ ]  CHK018 Les exigences pour les paniers mixtes (papier + numérique) sont-elles précisées quant à la nécessité de l'adresse de livraison ? [Cas Limite, Spec §Cas Limites]
- [ ]  CHK019 La gestion d'une expiration de session ou d'une interruption réseau lors de l'initiation du paiement est-elle documentée ? [Cas Limite, Spec §Cas Limites]
- [ ]  CHK020 La saisie de numéros de téléphone internationaux non standards est-elle prise en compte pour le formulaire de contact ? [Cas Limite, Spec §Cas Limites]
- [ ]  CHK021 Le comportement en cas de panier vide accédant directement à `/checkout` est-il spécifié ? [Couverture, Spec §Scénario 2.1]

---

## 5. Exigences Non-Fonctionnelles & Gouvernance Constitutionnelle

- [X]  CHK022 Les exigences visuelles sont-elles strictement limitées aux tokens sémantiques CSS avec zéro code hexadécimal en dur ? [Gouvernance, Constitution §VIII]
- [X]  CHK023 L'interdiction absolue de tout émoji est-elle respectée dans l'ensemble des libellés UI, modales et e-mails transactionnels ? [Gouvernance, Constitution §VIII]
- [X]  CHK024 Les exigences typographiques sont-elles exclusivement liées à Playfair Display et Poppins ? [Gouvernance, Constitution §VIII]
- [X]  CHK025 Les exigences de télémétrie DevTools (`console.log` balisés avec horodatage et données sanitisées) sont-elles spécifiées ? [Observabilité, Constitution §XI, Spec §FR-010]
- [X]  CHK026 Les exigences de sécurité (cookies HttpOnly, zéro fuite de jetons dans le corps JSON) sont-elles documentées pour l'authentification au checkout ? [Sécurité, Constitution §VI]

---

## Notes de Revue

- Cocher les éléments `[x]` uniquement après confirmation par la revue que le critère de qualité de rédaction est respecté.
- Laisser les éléments décochés (`[ ]`) tant que la revue formelle est en cours.
- `/speckit-implement` consulte l'état des cases à cocher en tant que point de contrôle et ne modifie pas les marqueurs.
- `checklists/requirements.md` est maintenu séparément en tant que checklist générale de la spécification.
