import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Administrateur | LAHAThèque",
  description: "Centre d'aide et documentation officielle pour les administrateurs de la plateforme.",
};

export default function AdminPersonalGuidePage() {
  return <RoleGuideView role="admin" roleLabel="Administrateur" />;
}
