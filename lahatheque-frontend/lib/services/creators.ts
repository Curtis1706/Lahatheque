/**
 * Service pour la sélection et l'association des Auteurs et Éditeurs
 * Permet le rattachement automatique des droits de vente et redevances.
 */

export interface CreatorOption {
  id: string;
  user_id?: string;
  type: "author" | "publisher";
  name: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  role_label: string;
  institution?: string;
  country?: string;
  phone?: string;
}

export interface CreatorOptionsResponse {
  authors: CreatorOption[];
  publishers: CreatorOption[];
}

export const FALLBACK_CREATOR_OPTIONS: CreatorOptionsResponse = {
  authors: [
    {
      id: "usr-auth-01",
      user_id: "",
      type: "author",
      name: "Prof. Augustin CHAKIROU",
      email: "augustin.chakirou@uac.bj",
      role_label: "Auteur Certifié",
      institution: "Université d'Abomey-Calavi (UAC)",
      phone: "+229 97 00 11 22",
    },
    {
      id: "usr-auth-02",
      user_id: "",
      type: "author",
      name: "Dr. Aminata SOW",
      email: "aminata.sow@ucad.edu.sn",
      role_label: "Auteur Enseignant",
      institution: "Université Cheikh Anta Diop (UCAD)",
      phone: "+221 77 123 45 67",
    },
    {
      id: "usr-auth-03",
      user_id: "",
      type: "author",
      name: "Prof. Jean KOUADIO",
      email: "jean.kouadio@inphb.ci",
      role_label: "Auteur Titulaire",
      institution: "INP-HB Yamoussoukro",
      phone: "+225 07 88 99 00",
    },
  ],
  publishers: [
    {
      id: "laha-editions-main",
      user_id: "",
      type: "publisher",
      name: "LAHA Éditions",
      company_name: "LAHA Éditions SARL",
      email: "contact@lahaeditions.com",
      country: "Bénin",
      role_label: "Maison d'Édition Principale",
    },
  ],
};

export async function getCreatorOptions(searchQuery?: string): Promise<CreatorOptionsResponse> {
  try {
    const url = searchQuery
      ? `/api/bff/catalog/creators/options/?q=${encodeURIComponent(searchQuery)}`
      : `/api/bff/catalog/creators/options/`;
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && (json.data.authors || json.data.publishers)) {
        return json.data;
      }
      if (json.authors || json.publishers) {
        return json;
      }
    }
  } catch (err) {
    console.error("Erreur récupération créateurs:", err);
  }
  return FALLBACK_CREATOR_OPTIONS;
}
