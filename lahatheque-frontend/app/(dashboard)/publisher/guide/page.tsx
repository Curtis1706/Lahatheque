import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Éditeur | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les éditeurs tiers partenaires.",
};

export default function PublisherGuidePage() {
  return <RoleGuideView role="publisher" roleLabel="Éditeur Tiers" />;
}
