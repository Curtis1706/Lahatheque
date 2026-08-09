import { StudentBookAccess } from "../types/student";

export const mockBorrowedBooks: StudentBookAccess[] = [
  {
    id: "book-001",
    title: "Droit Constitutionnel des États d'Afrique Francophone",
    author: "Prof. Jean-Marc Agossou",
    discipline: "Droit & Sciences Politiques",
    institution: "Université d'Abomey-Calavi (UAC)",
    expiresInDays: 14,
    format: "PDF",
  },
  {
    id: "book-002",
    title: "Économie du Développement et Politiques Publiques",
    author: "Dr. Amina Diallo",
    discipline: "Économie & Gestion",
    institution: "Université Cheikh Anta Diop (UCAD)",
    expiresInDays: 28,
    format: "EPUB",
  }
];

export const mockFavoriteBooks: StudentBookAccess[] = [
  {
    id: "book-003",
    title: "Précis de Pathologie Médicale et Thérapeutique",
    author: "Dr. Koffi Mensah",
    discipline: "Médecine & Santé",
    institution: "Université de Lomé",
    format: "Audio",
  }
];
