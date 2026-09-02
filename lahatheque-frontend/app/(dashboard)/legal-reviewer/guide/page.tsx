import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Juriste | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour le relecteur juridique et contrats.",
};

export default function LegalReviewerGuidePage() {
  return <RoleGuideView role="legal_reviewer" roleLabel="Juriste & Relecteur" />;
}
