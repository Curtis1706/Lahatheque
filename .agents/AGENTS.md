# 🎨 Règles de Design et Intégration Visuelle (Lahathèque)

Ce document rassemble les règles de style et d'intégration visuelle obligatoires pour le projet Lahathèque.

---

## 🚫 1. Interdiction des Couleurs Hexadécimales en Dur (Hex Codes)

Il est **strictement interdit** d'utiliser des codes couleur hexadécimaux directement dans les classes CSS ou les composants React/Next.js (ex: `bg-[#1B2A4E]`, `text-[#B08D42]`, `border-[#2E3F66]`).

### Pourquoi ?
* **Évolutivité** : Permet de changer la charte graphique en éditant uniquement les variables CSS dans `app/globals.css` ou `tailwind.config.js`.
* **Mode Sombre** : Permet au site de s'adapter automatiquement au thème clair/sombre grâce aux variables sémantiques.

### Ce qu'il faut faire à la place :
Utiliser exclusivement les classes de variables sémantiques configurées dans notre système de design :
* Pour la couleur Navy principale : `bg-navy`, `text-navy`, `border-navy` (correspond à `#1B2A4E`)
* Pour la couleur Navy sombre : `bg-navy-dark` (correspond à `#0F1A33`)
* Pour la couleur Navy de survol : `bg-navy-hover`, `border-navy-hover` (correspond à `#2E3F66`)
* Pour la couleur Or : `bg-gold`, `text-gold`, `border-gold` (correspond à `#B08D42`)
* Pour l'arrière-plan principal : `bg-background`
* Pour l'arrière-plan secondaire : `bg-background-secondary`
* Pour les bordures globales : `border-border`
