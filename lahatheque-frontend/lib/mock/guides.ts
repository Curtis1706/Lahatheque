export interface MockGuideArticle {
  id: string;
  target_role: string;
  category_label: string;
  title: string;
  summary: string;
  content: string;
  icon_name: string;
  order: number;
  is_published: boolean;
  created_at: string;
}

export const INITIAL_GUIDES: MockGuideArticle[] = [
  // --- ÉLÈVE / LECTEUR ---
  {
    id: "guide-student-1",
    target_role: "student",
    category_label: "Compte et connexion",
    title: "Comment créer un compte et accéder à mes ouvrages ?",
    summary: "Démarche pour activer son compte lecteur et ouvrir son premier livre numérique.",
    content: `<h2>Bienvenue sur votre espace LAHAThèque</h2><p>Pour commencer à lire sur la plateforme, accédez à votre tableau de bord puis cliquez sur <strong>Ma Bibliothèque</strong>.</p><p>Tous les livres achetés ou inclus dans l'abonnement de votre établissement y sont immédiatement disponibles avec protection DRM et filigrane sécurisé.</p>`,
    icon_name: "BookOpen",
    order: 0,
    is_published: true,
    created_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "guide-student-2",
    target_role: "student",
    category_label: "Compte et connexion",
    title: "Comment réinitialiser mon mot de passe en cas d'oubli ?",
    summary: "Procédure de sécurité pour recevoir un lien de réinitialisation par email.",
    content: `<p>Rendez-vous sur la page de connexion, cliquez sur <em>Mot de passe oublié</em>, puis saisissez votre adresse email universitaire ou personnelle.</p><p>Un lien sécurisé valide 30 minutes vous sera instantanément transmis.</p>`,
    icon_name: "Shield",
    order: 1,
    is_published: true,
    created_at: "2026-09-01T10:05:00Z",
  },
  {
    id: "guide-student-3",
    target_role: "student",
    category_label: "Lecture & Annotations",
    title: "Comment surligner et ajouter des notes sur un livre numérique ?",
    summary: "Utilisation des outils d'annotation intégrés dans la liseuse FlipBook sécurisée.",
    content: `<p>Pendant la lecture, sélectionnez n'importe quelle portion de texte pour faire apparaître le menu contextuel :</p><ul><li><strong>Surligner</strong> : Choisissez une couleur (or, bleu, émeraude).</li><li><strong>Ajouter une note</strong> : Rédigez votre commentaire d'étude. Vos notes sont synchronisées sur tous vos appareils.</li></ul>`,
    icon_name: "PenTool",
    order: 2,
    is_published: true,
    created_at: "2026-09-01T10:10:00Z",
  },

  // --- ADMINISTRATEUR ---
  {
    id: "guide-admin-1",
    target_role: "admin",
    category_label: "Gestion du catalogue",
    title: "Comment valider et publier un dépôt d'éditeur tiers ?",
    summary: "Étapes de conformité légale et technique avant mise en ligne sur le catalogue public.",
    content: `<h2>Contrôle de conformité des dépôts éditeurs</h2><p>Accédez à <strong>Catalogue &gt; Dépôts éditeurs</strong> pour examiner les métadonnées, le contrat signé et le fichier PDF chiffré avant approbation finale.</p>`,
    icon_name: "CheckCircle2",
    order: 0,
    is_published: true,
    created_at: "2026-09-01T09:00:00Z",
  },
  {
    id: "guide-admin-2",
    target_role: "admin",
    category_label: "Gestion du catalogue",
    title: "Comment configurer les taux de redevances et règles DRM ?",
    summary: "Paramétrage global de la protection des ouvrages et de la répartition financière.",
    content: `<p>Dans <strong>Paramètres &gt; Sécurité DRM</strong>, configurez la fréquence du filigrane dynamique et le nombre d'appareils autorisés par utilisateur.</p>`,
    icon_name: "ShieldCheck",
    order: 1,
    is_published: true,
    created_at: "2026-09-01T09:15:00Z",
  },

  // --- LIBRAIRE & GROSSISTE ---
  {
    id: "guide-wholesaler-1",
    target_role: "wholesaler",
    category_label: "Commandes & Remises",
    title: "Comment passer une commande groupée avec remise grossiste ?",
    summary: "Sélection des bouquets d'ouvrages et application des barèmes préférentiels.",
    content: `<p>Accédez à votre espace <strong>Commandes &gt; Nouvelle commande</strong> pour sélectionner les volumes d'ouvrages et générer votre bon de commande proforma.</p>`,
    icon_name: "ShoppingBag",
    order: 0,
    is_published: true,
    created_at: "2026-09-01T11:00:00Z",
  },
];
