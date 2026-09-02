import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Chef Maquettiste | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour le chef maquettiste.",
};

export default function ChiefLayoutGuidePage() {
  return <RoleGuideView role="chief_layout" roleLabel="Chef Maquettiste" />;
}
