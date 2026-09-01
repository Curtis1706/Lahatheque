import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});

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
    <html lang="fr" className={`${playfair.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'var(--navy)',
              color: '#FFFFFF',
              border: '1px solid rgba(176, 141, 66, 0.4)',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px -5px rgba(15, 26, 51, 0.3)',
              fontFamily: 'var(--font-poppins)',
              fontSize: '0.8125rem',
            },
            classNames: {
              toast: 'bg-navy text-white border border-gold/40 shadow-xl',
              title: 'text-white font-semibold',
              description: 'text-white/80',
              info: '!bg-navy !text-white !border-gold/40',
              success: '!bg-navy !text-white !border-success/60',
              error: '!bg-navy !text-white !border-error/60',
              warning: '!bg-navy !text-white !border-gold/60',
            }
          }}
        />
      </body>
    </html>
  );
}
