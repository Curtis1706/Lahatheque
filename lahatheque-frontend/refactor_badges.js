const fs = require('fs');
const path = require('path');

const files = [
  "app/(dashboard)/author/submissions/page.tsx",
  "app/(dashboard)/publisher/submissions/page.tsx",
  "app/(dashboard)/publisher/page.tsx",
  "app/(dashboard)/librarian/affiliations/page.tsx",
  "app/(dashboard)/teacher/page.tsx",
  "app/(dashboard)/teacher/specimens/page.tsx",
  "app/(dashboard)/layout-artist/page.tsx",
];

const basePath = "e:/Lahatheque/lahatheque-frontend";

for (const file of files) {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not exists
  if (!content.includes('import { StatusBadge } from "@/components/ui/status-badge"')) {
    // Find the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + 'import { StatusBadge } from "@/components/ui/status-badge";\n' + content.slice(endOfLastImport + 1);
  }

  // Define regex to match getStatusBadge
  // We'll replace the body of the switch statement
  content = content.replace(/case "approved":[\s\S]*?(?=case "pending"|case "under_review"|case "rejected"|case "draft"|\})/g, (match) => {
    if (match.includes("Approuvé / Publié") || match.includes("Approuvé")) {
      return `case "approved": return <StatusBadge status="success" leftIcon={CheckCircle2 || CheckCircle || Check} leftLabel="Approuvé" />;\n      `;
    }
    if (match.includes("Accordé (Actif)")) {
      return `case "approved": return <StatusBadge status="success" leftIcon={CheckCircle2} leftLabel="Accordé (Actif)" />;\n      `;
    }
    if (match.includes("Actif")) {
      return `case "approved": return <StatusBadge status="success" leftIcon={CheckCircle2} leftLabel="Actif" />;\n      `;
    }
    return `case "approved": return <StatusBadge status="success" leftLabel="Approuvé" />;\n      `;
  });

  content = content.replace(/case "pending":[\s\S]*?(?=case "under_review"|case "rejected"|case "draft"|\})/g, () => {
    return `case "pending": return <StatusBadge status="warning" leftIcon={Clock} leftLabel="En attente" />;\n      `;
  });

  content = content.replace(/case "under_review":[\s\S]*?(?=case "rejected"|case "draft"|\})/g, () => {
    return `case "under_review": return <StatusBadge status="warning" leftIcon={Clock} leftLabel="En relecture" />;\n      `;
  });

  content = content.replace(/case "rejected":[\s\S]*?(?=case "draft"|\})/g, () => {
    return `case "rejected": return <StatusBadge status="error" leftIcon={XCircle} leftLabel="Refusé" />;\n      `;
  });

  content = content.replace(/case "draft":[\s\S]*?(?=\})/g, () => {
    return `case "draft": return <StatusBadge status="default" leftLabel="Brouillon" />;\n    `;
  });

  // Manual fixes for specific icons that might not be imported
  // I will just let the compiler complain and fix them manually if needed, or better, not use icons in the generic replace and let it be simple.
  // Actually replacing exactly the whole switch block is safer.

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
