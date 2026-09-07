# Phase 0: Research & Architectural Decisions

**Feature**: `018-harmonisation-phone-input`
**Status**: Completed

---

## 1. Contexte et Objectifs

L'objectif de cette fonctionnalité est d'éradiquer tous les champs de saisie manuelle de numéros de téléphone `<input type="tel">` ou `<input type="text">` bruts résiduels et de généraliser l'utilisation du composant officiel `PhoneInput` ([`components/ui/phone-input.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/ui/phone-input.tsx)) sur l'ensemble de la plateforme LAHAThèque.

Le composant doit garantir :
1. L'alignement automatique avec les pays actifs configurés sur la plateforme via `getCountries(true)`.
2. L'affichage du drapeau du pays et du préfixe international (`+229`, `+225`, `+221`, `+228`, etc.).
3. Une résilience totale si le backend est temporairement déconnecté (fallback sur `AFRICAN_COUNTRIES_PRESET`).
4. L'élimination des bugs de rendu découverts sur `/legal-reviewer/contracts/new` (`Cannot read properties of undefined (reading 'toLowerCase')`).

---

## 2. Décisions Architecturales

### Décision 1 : API et Ergonomie du Composant `PhoneInput`

- **Décision** : Enrichir `PhoneInput` ([`components/ui/phone-input.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/ui/phone-input.tsx)) pour accepter les props de formulaire standard :
  - `id?: string`
  - `name?: string`
  - `placeholder?: string` (par défaut `"01 23 45 67"`)
  - `required?: boolean`
  - `disabled?: boolean`
  - `className?: string`
  - `value: string`
  - `onChange: (value: string) => void`
- **Détection intelligente** :
  - Au montage ou lors d'un changement de valeur externe, si la chaîne commence par un indicatif connu (ex: `+225`), le sélecteur bascule automatiquement sur le pays `CI` et isole le reste des chiffres dans le champ local.
  - Si l'utilisateur colle un numéro avec indicatif dans le champ de saisie locale, le composant détecte l'indicatif, sélectionne le pays et nettoie le champ local.
- **Alternatives évaluées** :
  - *Bibliothèque externe (`react-phone-number-input`)* : rejetée car ajoute des dépendances tierces lourdes et des styles CSS non conformes à nos tokens sémantiques.
  - *Maintien de champs simples avec texte indicatif en préfixe* : rejeté car ne permet pas le changement de pays ni l'adaptation dynamique aux pays actifs.

### Décision 2 : Source Dynamique des Pays Actifs

- **Décision** : Utiliser le service existant [`getCountries(true)`](file:///e:/Lahatheque/lahatheque-frontend/lib/services/countries.ts) branché sur `/api/v1/catalog/countries/?is_active=true`.
- **Mécanisme de repli (Fallback)** : En cas d'échec réseau ou d'environnement de mock hors ligne, utiliser immédiatement `AFRICAN_COUNTRIES_PRESET` (Bénin, Togo, Côte d'Ivoire, Sénégal, Niger, Burkina Faso, Mali, Guinée, Cameroun, Gabon, Congo, France).

### Décision 3 : Périmètre d'Harmonisation dans les Formulaires Métier

- **Écrans prioritaires audités et validés pour le remplacement** :
  1. [`app/(dashboard)/legal-reviewer/contracts/new/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx) : champ *Téléphone de la Partie Contractante* (ligne 860).
  2. [`components/features/contacts/add-edit-contact-modal.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/features/contacts/add-edit-contact-modal.tsx) : champ *Téléphone / WhatsApp* (ligne 219).
  3. [`components/features/admin/create-account-modal.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/features/admin/create-account-modal.tsx) : champ *Téléphone* (ligne 212).
  4. [`components/features/wholesaler/wholesale-order-modal.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/features/wholesaler/wholesale-order-modal.tsx) : champ *Numéro de téléphone du responsable logistique* (ligne 329).

### Décision 4 : Résolution du Bug `toLowerCase` sur la Page Nouveau Contrat

- **Constat** : Dans [`app/(dashboard)/legal-reviewer/contracts/new/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx), plusieurs appels à `.toLowerCase()` s'exécutent sur `a.label`, `a.name` ou `b.title` sans vérification préalable que la propriété est définie.
- **Solution** : Appliquer un chaînage sûr `(a.label || "").toLowerCase()` et `(a.name || "").toLowerCase()` pour garantir 0 crash console lors du chargement de la page avec un ouvrage ou un auteur rattaché.
