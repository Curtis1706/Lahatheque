import { Metadata } from "next";
import { ContactsManager } from "@/components/features/contacts/contacts-manager";

export const metadata: Metadata = {
  title: "Mes Contacts • Espace Juridique LAHAThèque",
  description: "Annuaire des correspondants juridiques, universitaires et expédition de communications officielles.",
};

export default function LegalReviewerContactsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ContactsManager userRole="legal_reviewer" title="Mes Contacts" />
    </div>
  );
}
