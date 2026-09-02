import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Grossiste | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les libraires et grossistes partenaires.",
};

export default function WholesalerGuidePage() {
  return <RoleGuideView role="wholesaler" roleLabel="Libraire & Grossiste" />;
}
