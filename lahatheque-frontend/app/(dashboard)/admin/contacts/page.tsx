import { Metadata } from "next";
import { ContactsManager } from "@/components/features/contacts/contacts-manager";

export const metadata: Metadata = {
  title: "Nos Contacts • Administration LAHAThèque",
  description: "Annuaire des contacts professionnels, partenaires universitaires et expédition d'e-mails officiels.",
};

export default function AdminContactsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ContactsManager userRole="admin" title="Nos Contacts" />
    </div>
  );
}
