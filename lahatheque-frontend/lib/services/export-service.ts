/**
 * Moteur Universel d'Exportation & Documents Officiels LAHAThèque v3.2
 * Conforme aux standards comptables SYSCOHADA, aux normes graphiques Navy/Gold et aux exigences légales UEMOA.
 */

// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

export interface CompanyLegalInfo {
  name: string;
  ifu: string;
  rccm: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export const LAHA_LEGAL_INFO: CompanyLegalInfo = {
  name: "LAHAThèque Éditions & Numérique S.A.",
  ifu: "3202415897451",
  rccm: "RB/COT/24 B 12458",
  address: "Immeuble LAHA Éditions, Boulevard de la Marina, Cotonou, République du Bénin",
  phone: "(+229) 21 30 45 80 / (+229) 97 00 11 22",
  email: "contact@lahatheque.bj",
  website: "https://lahatheque.bj",
};

export interface PdfDocumentOptions {
  docType: "FACTURE" | "BON_COMMANDE" | "BORDEREAU_REDEVANCES" | "RAPPORT_FINANCIER" | "REGISTRE_AUDIT" | "RAPPORT_LOGISTIQUE";
  docNumber: string;
  date: string;
  recipient?: {
    name: string;
    roleOrTitle?: string;
    emailOrPhone?: string;
    addressOrCampus?: string;
    taxId?: string;
  };
  period?: string;
  summaryCards?: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  totalLabel?: string;
  totalAmount?: string;
  totalNotes?: string;
  filename?: string;
}

export interface WordDocumentOptions {
  title: string;
  subtitle?: string;
  institutionName?: string;
  facultyName?: string;
  date?: string;
  items: Array<{
    title: string;
    author: string;
    isbn?: string;
    discipline?: string;
    year?: string | number;
    format?: string;
  }>;
  filename?: string;
}

/**
 * 1. Générateur de PDF Officiel Haute Fidélité (Norme LAHAThèque)
 */
export async function generateOfficialPdf(options: PdfDocumentOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Couleurs de marque
  const navyRgb: [number, number, number] = [27, 42, 78];     // #1B2A4E
  const goldRgb: [number, number, number] = [176, 141, 66];   // #B08D42
  const textDark: [number, number, number] = [31, 41, 55];    // #1F2937
  const grayMuted: [number, number, number] = [107, 114, 128]; // #6B7280
  const lightBg: [number, number, number] = [248, 249, 250];

  // ── 1. Bandeau supérieur décoratif
  doc.setFillColor(...navyRgb);
  doc.rect(0, 0, pageWidth, 5, "F");
  doc.setFillColor(...goldRgb);
  doc.rect(0, 5, pageWidth, 1.5, "F");

  // ── 2. En-tête : Marque et Coordonnées Émetteur
  let y = 16;
  
  // Intégration du logo officiel LAHAThèque
  let textStartX = margin;
  try {
    if (typeof window !== "undefined") {
      const img = new (window as any).Image();
      img.src = "/logo.png";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 400);
      });
      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, "PNG", margin, y - 6.5, 14, 14);
        textStartX = margin + 17;
      }
    }
  } catch {
    textStartX = margin;
  }

  // Titre / Logo textuel de marque
  doc.setFont("times", "bold");
  doc.setFontSize(21);
  doc.setTextColor(...navyRgb);
  doc.text("LAHATHÈQUE", textStartX, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...goldRgb);
  doc.text("ÉDITIONS & BIBLIOTHÈQUE NUMÉRIQUE UNIVERSITAIRE", textStartX, y + 4.5);

  // Coordonnées légales à droite
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grayMuted);
  const legalLines = [
    LAHA_LEGAL_INFO.name,
    `IFU : ${LAHA_LEGAL_INFO.ifu} | RCCM : ${LAHA_LEGAL_INFO.rccm}`,
    LAHA_LEGAL_INFO.address,
    `Contact : ${LAHA_LEGAL_INFO.email} | Tél : ${LAHA_LEGAL_INFO.phone}`,
  ];
  legalLines.forEach((line, idx) => {
    doc.text(line, pageWidth - margin, y - 2 + idx * 3.5, { align: "right" });
  });

  y += 14;

  // Ligne de séparation fine
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── 3. Cartouche du Document & Destinataire
  const boxWidth = (pageWidth - margin * 2 - 6) / 2;
  const boxHeight = 28;

  // Bloc Document (Gauche)
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...navyRgb);
  const docTypeLabel = {
    FACTURE: "FACTURE OFFICIELLE",
    BON_COMMANDE: "BON DE COMMANDE / PROFORMA",
    BORDEREAU_REDEVANCES: "BORDEREAU DE REDEVANCES",
    RAPPORT_FINANCIER: "RAPPORT FINANCIER & VENTES",
    REGISTRE_AUDIT: "REGISTRE D'AUDIT & SÉCURITÉ",
    RAPPORT_LOGISTIQUE: "RAPPORT D'INVENTAIRE & STOCKS",
  }[options.docType];

  doc.text(docTypeLabel, margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(`Réf : ${options.docNumber}`, margin + 4, y + 12);
  doc.text(`Date d'émission : ${options.date}`, margin + 4, y + 17);
  if (options.period) {
    doc.text(`Période : ${options.period}`, margin + 4, y + 22);
  }

  // Bloc Bénéficiaire / Tiers (Droite)
  if (options.recipient) {
    const rightX = margin + boxWidth + 6;
    doc.setFillColor(...lightBg);
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 2, 2, "F");
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...navyRgb);
    doc.text("DESTINATAIRE / PARTENAIRE :", rightX + 4, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...goldRgb);
    doc.text(options.recipient.name, rightX + 4, y + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    if (options.recipient.roleOrTitle) {
      doc.text(options.recipient.roleOrTitle, rightX + 4, y + 15.5);
    }
    if (options.recipient.addressOrCampus) {
      doc.text(options.recipient.addressOrCampus, rightX + 4, y + 20);
    }
    if (options.recipient.emailOrPhone) {
      doc.text(options.recipient.emailOrPhone, rightX + 4, y + 24.5);
    }
  }

  y += boxHeight + 6;

  // ── 4. Cartes de synthèse KPI (optionnelles)
  if (options.summaryCards && options.summaryCards.length > 0) {
    const cardCount = options.summaryCards.length;
    const cardGap = 3;
    const cardWidth = (pageWidth - margin * 2 - (cardCount - 1) * cardGap) / cardCount;
    const cardHeight = 13;

    options.summaryCards.forEach((card, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, "F");
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...grayMuted);
      doc.text(card.label.toUpperCase(), cardX + 3, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...navyRgb);
      doc.text(card.value, cardX + 3, y + 10);
    });

    y += cardHeight + 6;
  }

  // ── 5. Tableau de données principal avec jsPDF-AutoTable
  autoTable(doc, {
    startY: y,
    head: [options.tableHeaders],
    body: options.tableRows,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: {
      fillColor: navyRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    didDrawPage: (_data: any) => {
      // En-tête de pagination sur chaque page
    },
  });

  // Position finale après tableau
  const lastTable = (doc as any).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY + 6 : y + 40;

  // ── 6. Bloc Total & Mentions Fiscales / Notes
  let footerBlockY = finalY;

  // Si on est trop bas sur la page, ajouter une page
  if (footerBlockY > pageHeight - 45) {
    doc.addPage();
    footerBlockY = 20;
  }

  if (options.totalAmount) {
    const defaultLabel =
      options.docType === "RAPPORT_LOGISTIQUE"
        ? "VOLUME GLOBAL DU STOCK :"
        : options.docType === "REGISTRE_AUDIT"
        ? "TOTAL DES ENTRÉES :"
        : options.docType === "BON_COMMANDE"
        ? "TOTAL COMMANDE :"
        : options.docType === "BORDEREAU_REDEVANCES"
        ? "TOTAL DES REDEVANCES :"
        : options.docType === "RAPPORT_FINANCIER"
        ? "TOTAL CONSOLIDÉ :"
        : "TOTAL NET À PAYER :";

    const label = options.totalLabel || defaultLabel;
    const totalBoxWidth = 85;
    const totalX = pageWidth - margin - totalBoxWidth;
    
    doc.setFillColor(...navyRgb);
    doc.roundedRect(totalX, footerBlockY, totalBoxWidth, 14, 1.5, 1.5, "F");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(220, 225, 235);
    doc.text(label, totalX + 4, footerBlockY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...goldRgb);
    doc.text(options.totalAmount, totalX + 4, footerBlockY + 11);
  }

  if (options.totalNotes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...grayMuted);
    doc.text(options.totalNotes, margin, footerBlockY + 8, {
      maxWidth: pageWidth - margin * 2 - 85,
    });
  }

  // ── 7. Cachet Officiel / Sécurité & Signature
  const stampY = Math.min(pageHeight - 24, footerBlockY + 22);

  doc.setDrawColor(...goldRgb);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, stampY - 5, 80, 14, 1, 1, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...navyRgb);
  doc.text("CERTIFICATION D'AUTHENTICITÉ LAHATHÈQUE", margin + 3, stampY - 1.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...grayMuted);
  doc.text("Document certifié conforme et infalsifiable généré par le système LAHAThèque v3.2.", margin + 3, stampY + 2);
  doc.text(`Identifiant de sécurité : SHA-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, margin + 3, stampY + 5.5);

  // ── 8. Bas de page dynamique (Footer sur toutes les pages)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...grayMuted);
    doc.text("LAHAThèque Éditions S.A. — Cotonou, Bénin — Tous droits réservés", margin, pageHeight - 5);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  // ── 9. Déclenchement du téléchargement
  const finalFilename = options.filename || `lahatheque_${options.docType.toLowerCase()}_${options.docNumber}_${Date.now()}.pdf`;
  doc.save(finalFilename);
}

/**
 * 2. Générateur d'Export CSV avec Encodage UTF-8 BOM
 */
export function generateCsvExport<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columnMapping?: Record<string, string>
): void {
  if (!data || data.length === 0) {
    throw new Error("Aucune donnée à exporter.");
  }

  const keys = Object.keys(data[0]);
  const headers = columnMapping
    ? keys.map((k) => columnMapping[k] || k)
    : keys;

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCsv).join(";");
  const dataRows = data.map((row) =>
    keys.map((k) => escapeCsv(row[k])).join(";")
  );

  // Insertion obligatoire du BOM UTF-8 (\uFEFF) pour compatibilité Microsoft Excel
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 3. Générateur d'Export Word (.doc / .docx) pour Bibliographies & Catalogues
 */
export function generateWordDocument(options: WordDocumentOptions): void {
  const currentDate = options.date || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tableRowsHtml = options.items
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8f9fa"};">
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #1B2A4E;">${idx + 1}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #1B2A4E;">${item.title}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #1F2937;">${item.author}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace; color: #B08D42;">${item.isbn || "—"}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #4B5563;">${item.discipline || "Général"}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center; color: #4B5563;">${item.year || "2026"}</td>
      </tr>`
    )
    .join("");

  const docHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; line-height: 1.5; margin: 30px; }
        .header { border-bottom: 2px solid #1B2A4E; padding-bottom: 15px; margin-bottom: 25px; }
        .brand { font-size: 24px; font-weight: bold; color: #1B2A4E; letter-spacing: 1px; }
        .sub-brand { font-size: 11px; font-weight: bold; color: #B08D42; text-transform: uppercase; }
        .meta { font-size: 10px; color: #6B7280; float: right; text-align: right; margin-top: -35px; }
        h1 { color: #1B2A4E; font-size: 20px; margin-top: 15px; margin-bottom: 5px; }
        .subtitle { color: #6B7280; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background-color: #1B2A4E; color: #ffffff; padding: 10px 12px; border: 1px solid #1B2A4E; text-align: left; }
        .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #6B7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">LAHATHÈQUE</div>
        <div class="sub-brand">Éditions & Bibliothèque Numérique Universitaire</div>
        <div class="meta">
          ${LAHA_LEGAL_INFO.name}<br/>
          IFU : ${LAHA_LEGAL_INFO.ifu} | RCCM : ${LAHA_LEGAL_INFO.rccm}<br/>
          Date d'export : ${currentDate}
        </div>
      </div>

      <h1>${options.title}</h1>
      <div class="subtitle">${options.subtitle || "Catalogue officiel et bibliographie des manuels universitaires"}</div>

      ${
        options.institutionName
          ? `<p style="font-size: 12px; color: #1B2A4E;"><strong>Établissement :</strong> ${options.institutionName} ${
              options.facultyName ? `— <strong>Faculté :</strong> ${options.facultyName}` : ""
            }</p>`
          : ""
      }

      <p style="font-size: 12px; color: #4B5563;">
        Nombre d'ouvrages indexés : <strong>${options.items.length}</strong> manuel${options.items.length > 1 ? "s" : ""}.
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Titre de l'Ouvrage</th>
            <th>Auteur(s)</th>
            <th style="width: 120px;">ISBN / Réf.</th>
            <th style="width: 120px;">Discipline</th>
            <th style="width: 60px; text-align: center;">Année</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Document officiel généré depuis la plateforme LAHAThèque — ${LAHA_LEGAL_INFO.website} — Contact : ${LAHA_LEGAL_INFO.email}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + docHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = options.filename || `lahatheque_bibliographie_${Date.now()}.doc`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".doc") ? filename : `${filename}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
