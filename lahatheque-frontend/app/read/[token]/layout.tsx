import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lecteur Sécurisé LAHAThèque",
  description: "Portail de lecture sécurisé hébergé multi-tenant LAHAThèque",
};

export default function HostedReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen overflow-hidden select-none bg-navy-dark text-white font-sans flex flex-col">
      {children}
    </div>
  );
}
