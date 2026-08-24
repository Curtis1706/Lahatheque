import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAHAThèque — Bibliothèque Numérique Universitaire",
  description: "Plateforme de distribution et de gestion des droits d'ouvrages scientifiques et universitaires.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
