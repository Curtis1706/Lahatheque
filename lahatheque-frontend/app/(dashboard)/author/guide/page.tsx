import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Auteur | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les auteurs et chercheurs.",
};

export default function AuthorGuidePage() {
  return <RoleGuideView role="author" roleLabel="Auteur" />;
}
