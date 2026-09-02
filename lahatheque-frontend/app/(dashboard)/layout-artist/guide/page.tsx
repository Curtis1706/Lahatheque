import { RoleGuideView } from "@/components/features/guides/role-guide-view";

export const metadata = {
  title: "Guide d'utilisation Maquettiste | LAHAThèque",
  description: "Centre d'aide et guides d'utilisation pour les maquettistes.",
};

export default function LayoutArtistGuidePage() {
  return <RoleGuideView role="layout_artist" roleLabel="Maquettiste" />;
}
