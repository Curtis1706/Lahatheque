# Checklist: Module 13 - Espace Client, Lecteur & Étudiant (LAHAThèque v3.2)

## 1. Exigences Fonctionnelles (Cahier des Charges v3.2)
- [x] L'étudiant peut créer son compte et l'utiliser de manière autonome sans rattachement universitaire obligatoire.
- [x] L'étudiant peut rattacher son université partenaire par Numéro de Matricule Académique et justificatif de scolarité sans email .edu.
- [x] Lecture en ligne sous DRM LCP Readium via visionneuse sécurisée avec filigrane dynamique et blocage de copie.
- [x] Extraits gratuits lisibles immédiatement en 1 clic sans friction.
- [x] Achat à l'unité (numérique, audio, livre physique papier avec expédition).
- [x] Souscription aux formules Pass Lecteur (Mensuel / Annuel avec 2 mois offerts / Famille).
- [x] Lecteur audio streaming avec vitesse adaptative (0.75x à 2x) et reprise au timecode.
- [x] Suivi des expéditions de commandes physiques papier avec transporteur et numéro de tracking.

## 2. Règles UX/UI & Finitions Visuelles (LAHAThèque)
- [x] **Zéro emoji** dans toute l'interface, le code, les modales et les messages.
- [x] **Zéro couleur hexadécimale en dur** : utilisation exclusive des tokens sémantiques `globals.css` (`bg-navy`, `bg-gold`, `border-border`, `bg-background`).
- [x] **Mobile-first strict** : entièrement testé et lisible sous 400px de large (boutons >= 44px).
- [x] **Composants 21st.dev** recherchés et adaptés (`DonutChart`, `AudioPlayer`, `DataTable`).
- [x] **Système de loading unifié** : skeletons épousant la structure finale pour éviter tout layout shift.
- [x] **UX writing en français** : ton direct, fonctionnel, boutons 1-3 mots.

## 3. Qualité Technique & Performance
- [x] TypeScript strict sans `any` non justifié.
- [x] Zéro appel réseau non simulé dans les composants (tous via `lib/services/student.ts`).
- [x] 0 erreur TypeScript (`npx tsc --noEmit --skipLibCheck`).
- [x] Build de production Next.js à 100% de succès.
