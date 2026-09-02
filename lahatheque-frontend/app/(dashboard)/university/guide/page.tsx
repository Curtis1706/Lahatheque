import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Université | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les universités et partenaires académiques.",
};

export default function UniversityGuidePage() {
  return <RoleGuideView role="university" roleLabel="Université & Partenaire" />;
}
