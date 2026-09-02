import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Gestionnaire | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les gestionnaires logistiques et stocks.",
};

export default function ManagerGuidePage() {
  return <RoleGuideView role="manager" roleLabel="Gestionnaire Logistique" />;
}
