import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Lecteur | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les lecteurs et étudiants.",
};

export default function StudentGuidePage() {
  return <RoleGuideView role="student" roleLabel="Lecteur & Étudiant" />;
}
