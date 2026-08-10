import { StudentOrder } from '../types/student-orders';

export const MOCK_STUDENT_ORDERS: StudentOrder[] = [
  {
    id: "ord-8f92a10b-2026",
    total_amount: 23500,
    currency: "XOF",
    statut_paiement: "paid",
    statut_commande: "processing",
    created_at: "2026-08-08T14:20:00Z",
    lignes: [
      {
        id: "lig-101",
        ouvrage: "b001-droit-const-2024",
        ouvrage_title: "Droit Constitutionnel des États d'Afrique Francophone",
        format_type: "paper",
        unit_price: 15000,
        quantity: 1
      },
      {
        id: "lig-102",
        ouvrage: "b002-economie-dev-benin",
        ouvrage_title: "Économie du Développement & Politiques Publiques au Bénin",
        format_type: "digital",
        unit_price: 8500,
        quantity: 1
      }
    ],
    livraison: {
      id: "del-401",
      shipping_address: "Campus Universitaire d'Abomey-Calavi, Faculté de Droit (FADESP)",
      city: "Abomey-Calavi",
      country: "BJ",
      tracking_number: "LH-BJ-982341",
      carrier_name: "Laha Express Bénin",
      statut: "expedie",
      updated_at: "2026-08-09T10:15:00Z"
    }
  },
  {
    id: "ord-3c41e98d-2026",
    total_amount: 12000,
    currency: "XOF",
    statut_paiement: "paid",
    statut_commande: "completed",
    created_at: "2026-07-28T09:45:00Z",
    lignes: [
      {
        id: "lig-103",
        ouvrage: "b003-procedure-civile-ohada",
        ouvrage_title: "Procédure Civile et Voies d'Exécution en Droit OHADA",
        format_type: "digital",
        unit_price: 12000,
        quantity: 1
      }
    ]
  },
  {
    id: "ord-7d12f34a-2026",
    total_amount: 18000,
    currency: "XOF",
    statut_paiement: "paid",
    statut_commande: "processing",
    created_at: "2026-08-05T16:30:00Z",
    lignes: [
      {
        id: "lig-104",
        ouvrage: "b004-finances-publiques-uemoa",
        ouvrage_title: "Manuel Pratique de Finances Publiques dans l'Espace UEMOA",
        format_type: "paper",
        unit_price: 18000,
        quantity: 1
      }
    ],
    livraison: {
      id: "del-402",
      shipping_address: "Quartier Haie Vive, Rue 412, Villa 18",
      city: "Cotonou",
      country: "BJ",
      tracking_number: "LH-BJ-771029",
      carrier_name: "DHL Express Bénin",
      statut: "en_preparation",
      updated_at: "2026-08-06T08:00:00Z"
    }
  },
  {
    id: "ord-1b99c45e-2026",
    total_amount: 9500,
    currency: "XOF",
    statut_paiement: "pending",
    statut_commande: "pending",
    created_at: "2026-08-10T07:12:00Z",
    lignes: [
      {
        id: "lig-105",
        ouvrage: "b005-guide-methodologique-memoire",
        ouvrage_title: "Guide de Rédaction du Mémoire de Master en Droit",
        format_type: "digital",
        unit_price: 9500,
        quantity: 1
      }
    ]
  },
  {
    id: "ord-9e11a22b-2026",
    total_amount: 14500,
    currency: "XOF",
    statut_paiement: "failed",
    statut_commande: "cancelled",
    created_at: "2026-07-15T11:05:00Z",
    lignes: [
      {
        id: "lig-106",
        ouvrage: "b006-histoire-institutions-afrique",
        ouvrage_title: "Histoire des Institutions Publiques de l'Afrique de l'Ouest",
        format_type: "digital",
        unit_price: 14500,
        quantity: 1
      }
    ]
  }
];
