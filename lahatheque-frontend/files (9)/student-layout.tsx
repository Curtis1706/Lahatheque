import { Fraunces, IBM_Plex_Mono } from "next/font/google";

// Typographie dédiée à l'Espace Lecteur uniquement — n'affecte aucun autre
// dashboard (admin, auteur, université, etc.) grâce au scope `.student-scope`
// défini dans app/globals.css. Fraunces : serif éditoriale pour les titres et
// gros chiffres (registre "livre imprimé"). IBM Plex Mono : registre de
// données pour les statistiques (registre "fiche de bibliothèque").
const displaySerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-student-display",
  display: "swap",
});

const dataMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-student-mono",
  display: "swap",
});

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${displaySerif.variable} ${dataMono.variable} student-scope`}>
      {children}
    </div>
  );
}
