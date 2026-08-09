import { Course, SpecimenRequest } from "../types/teacher";

export const mockCourses: Course[] = [
  {
    id: "course-101",
    name: "Droit Constitutionnel Général",
    code: "DRT-1010",
    student_count: 120,
    recommended_books: [
      {
        id: "book-001",
        title: "Droit Constitutionnel des États d'Afrique Francophone",
        author: "Jean-Marc Agossou"
      }
    ]
  },
  {
    id: "course-102",
    name: "Introduction générale à l'étude de l'Économie",
    code: "ECO-1100",
    student_count: 85,
    recommended_books: [
      {
        id: "book-002",
        title: "Économie du Développement et Politiques Publiques",
        author: "Amina Diallo"
      }
    ]
  }
];

export const mockSpecimenRequests: SpecimenRequest[] = [
  {
    id: "spec-001",
    book_title: "Précis de Pathologie Médicale et Thérapeutique",
    book_id: "book-003",
    author: "Koffi Mensah",
    requested_at: "2026-08-01T10:00:00Z",
    status: "approved"
  },
  {
    id: "spec-002",
    book_title: "Histoire Générale du Niger",
    book_id: "book-004",
    author: "Mamane Oumarou",
    requested_at: "2026-08-08T14:30:00Z",
    status: "pending"
  }
];
