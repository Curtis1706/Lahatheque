# Data Model: Harmonisation du PhoneInput

**Feature**: `018-harmonisation-phone-input`

---

## 1. Entités et Interfaces TypeScript

### PhoneInputProps (`components/ui/phone-input.tsx`)

```typescript
export interface PhoneInputProps {
  /** Valeur complète du numéro incluant l'indicatif (ex: "+229 97000000") */
  value: string;
  /** Callback de modification transmettant la valeur normalisée */
  onChange: (value: string) => void;
  /** Identifiant HTML pour accessibilité et label */
  id?: string;
  /** Nom de champ pour formulaire natif */
  name?: string;
  /** Texte indicatif dans le champ de saisie du numéro national */
  placeholder?: string;
  /** Classes CSS supplémentaires pour le conteneur */
  className?: string;
  /** Désactivation du composant */
  disabled?: boolean;
  /** Champ requis */
  required?: boolean;
}
```

### CountryItem (`lib/services/countries.ts`)

```typescript
export interface CountryItem {
  code: string;       // Code ISO 3166-1 alpha-2 (ex: "BJ", "CI", "SN")
  name: string;       // Libellé officiel en français (ex: "Bénin", "Côte d'Ivoire")
  phone_code: string; // Indicatif téléphonique international (ex: "+229", "+225")
  currency: string;   // Devise officielle (ex: "FCFA")
  is_active: boolean; // État d'activation sur la plateforme
}
```

---

## 2. Modèles de Données des Formulaires Métier

### Formulaire de Nouveau Contrat (`app/(dashboard)/legal-reviewer/contracts/new/page.tsx`)

| Champ | Type | Validation | Description |
|---|---|---|---|
| `contractingPartyPhone` | `string` | Format international E.164 (`+<indicatif> <chiffres>`) | Téléphone officiel de l'auteur ou du partenaire contractant |

### Modale d'Édition de Contact (`components/features/contacts/add-edit-contact-modal.tsx`)

| Champ | Type | Validation | Description |
|---|---|---|---|
| `phone` | `string` | Format international E.164 | Numéro de téléphone ou WhatsApp du contact institutionnel |

### Modale de Création de Compte (`components/features/admin/create-account-modal.tsx`)

| Champ | Type | Validation | Description |
|---|---|---|---|
| `formData.phone` | `string` | Format international E.164 | Téléphone du nouvel utilisateur plateforme |

### Modale de Commande Grossiste (`components/features/wholesaler/wholesale-order-modal.tsx`)

| Champ | Type | Validation | Description |
|---|---|---|---|
| `contactPhone` | `string` | Format international E.164 | Contact téléphonique du responsable de réception logistique |
