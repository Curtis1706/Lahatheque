"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Search, 
  User, 
  ShoppingCart, 
  Globe, 
  BookOpen, 
  HelpCircle,
  Mail
} from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      
      {/* TopNavBar */}
      <header className="bg-background border-b border-border sticky top-0 z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-[1920px] mx-auto">
          
          {/* 1. Brand Logo (Left) */}
          <Link href="/" className="block w-36 md:w-44 shrink-0">
            <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
          </Link>
          
          {/* 2. Desktop Navigation (Centered) */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-8 px-4">
            <Link 
              href="/" 
              className={pathname === "/" 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Accueil
            </Link>
            
            <Link 
              href="/about" 
              className={pathname === "/about" 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              À propos
            </Link>

            <Link 
              href="/authors" 
              className={pathname.startsWith("/authors") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Auteur
            </Link>

            <Link 
              href="/partners" 
              className={pathname.startsWith("/partners") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Partenariat
            </Link>

            <Link 
              href="/subscriptions" 
              className={pathname.startsWith("/subscriptions") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Nos offres
            </Link>

            <Link 
              href="/catalog" 
              className={pathname.startsWith("/catalog") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Catalogue
            </Link>
          </nav>

          {/* 3. Actions & Search (Right) */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <input 
                className="w-48 xl:w-64 h-10 pl-4 pr-10 rounded-full border border-border bg-background-secondary focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 text-sm transition-all duration-200" 
                placeholder="Rechercher..." 
                type="text"
              />
              <button className="absolute right-1 top-1 w-8 h-8 rounded-full bg-navy hover:bg-navy-hover transition-colors flex items-center justify-center text-white" aria-label="Rechercher">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Connexion Link */}
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-foreground hover:text-navy font-medium text-sm whitespace-nowrap">
              <User className="w-5 h-5 text-gold" /> Connexion
            </Link>

            {/* Cart Icon */}
            <button className="relative p-2 text-foreground hover:text-navy transition-colors shrink-0" aria-label="Panier">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile Menu Burger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-foreground hover:text-navy transition-colors shrink-0"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-4 space-y-3 absolute top-full left-0 right-0 shadow-xl z-50">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname === "/" 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Accueil
            </Link>
            
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname === "/about" 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              À propos
            </Link>

            <Link 
              href="/authors" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/authors") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Auteur
            </Link>

            <Link 
              href="/partners" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/partners") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Partenariat
            </Link>

            <Link 
              href="/subscriptions" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/subscriptions") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Nos offres
            </Link>

            <Link 
              href="/catalog" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/catalog") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Catalogue
            </Link>

            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-medium py-2.5 text-sm text-navy pt-3 border-t border-border"
            >
              <User className="w-4 h-4 text-gold" /> Se connecter
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Component */}
      <footer className="bg-navy text-white border-t border-navy-hover">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 py-14">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            
            {/* Colonne 1 : Marque & Réseaux Sociaux */}
            <div className="lg:col-span-3 space-y-4">
              <Link href="/" className="inline-block bg-white p-2.5 rounded-xl">
                <img src="/logo.jpg" alt="LAHATHÈQUE" className="h-9 w-auto object-contain" />
              </Link>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
                Pas de nation prospère sans une éducation équitable. La première bibliothèque numérique panafricaine pour les étudiants, enseignants et chercheurs.
              </p>
              
              {/* Liens Réseaux Sociaux */}
              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold mb-2.5">
                  Suivez-nous
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/leaderlahaeditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-gold hover:text-navy text-white transition-colors flex items-center justify-center"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/laha_editions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-gold hover:text-navy text-white transition-colors flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@LAHA%C3%89DITIONS-e8o"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-gold hover:text-navy text-white transition-colors flex items-center justify-center"
                    aria-label="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.tiktok.com/@lahaeditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-gold hover:text-navy text-white transition-colors flex items-center justify-center"
                    aria-label="TikTok"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.03 3.29-1.46 3.42-3.26.07-1.37.03-2.75.04-4.13 0-4.48-.01-8.96 0-13.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Informations & Navigation */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Informations</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-gold transition-colors">À propos</Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-gold transition-colors">Catalogue</Link>
                </li>
                <li>
                  <Link href="/subscriptions" className="hover:text-gold transition-colors">Nos offres</Link>
                </li>
                <li>
                  <Link href="/authors" className="hover:text-gold transition-colors">Auteurs</Link>
                </li>
                <li>
                  <Link href="/partners" className="hover:text-gold transition-colors">Partenariat</Link>
                </li>
                <li>
                  <Link href="/submit" className="hover:text-gold transition-colors">Soumettre un manuscrit</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gold transition-colors">Aide &amp; Contact</Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Nos Autres Sites */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Nos autres sites</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <a href="https://lahacademia.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahacademia.com
                  </a>
                </li>
                <li>
                  <a href="https://lahakim.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahakim.com
                  </a>
                </li>
                <li>
                  <a href="https://gabonlivres.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    gabonlivres.com
                  </a>
                </li>
                <li>
                  <a href="https://lahatheque.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahatheque.com
                  </a>
                </li>
                <li>
                  <a href="https://lahalex.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahalex.com
                  </a>
                </li>
                <li>
                  <a href="https://kultutv.bj/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    kultutv.bj
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Contacts Bénin & Togo */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Contacts au Bénin et au Togo</h4>
              <div className="space-y-3 text-xs text-white/80">
                <div className="space-y-1">
                  <p className="font-bold text-white">Bénin</p>
                  <p className="text-white/70">Cotonou, Kouhounnou, Bénin</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 97 89 82 42</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 58 58 48 48</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 62 07 79 79</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <p className="font-bold text-white">LAHA EDITIONS TOGO</p>
                  <p className="text-white/70">12 BP 330 Lomé (BAGUIDA), TOGO</p>
                  <p className="font-mono text-[11px] text-gold-light">+228 90 54 20 44</p>
                  <p className="font-mono text-[11px] text-gold-light">+228 99 75 55 17</p>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <a href="mailto:lahaeditions1@gmail.com" className="text-gold hover:underline break-all">
                    lahaeditions1@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne 5 : Contacts dans les autres pays */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Autres pays</h4>
              <div className="space-y-3 text-xs text-white/80">
                <div className="space-y-1">
                  <p className="font-bold text-white">Gabon</p>
                  <p className="text-white/70 leading-tight">142 Av. Jean Léon MEGUIRE ME MBA, Nouvelle Cité NZENG AGNON, Libreville</p>
                  <p className="font-mono text-[11px] text-gold-light">+241 04 01 91 85</p>
                  <p className="font-mono text-[11px] text-gold-light">+241 02 18 31 00</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <p className="font-bold text-white">RDC</p>
                  <p className="text-white/70 leading-tight">Avenue Bocage 24 bis, Quartier Joli-Parc, Commune de Ngaliema</p>
                  <p className="font-mono text-[11px] text-gold-light">+243 846 823 491</p>
                  <p className="font-mono text-[11px] text-gold-light">+243 855 279 806</p>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright & Légal */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/60">
            <span>© 2026 LAHA ÉDITIONS — LAHAThèque. Tous droits réservés.</span>
            <div className="flex items-center gap-4">
              <Link href="/legal" className="hover:text-gold transition-colors">Mentions légales</Link>
              <span className="text-white/20">|</span>
              <Link href="/cgu" className="hover:text-gold transition-colors">CGU</Link>
              <span className="text-white/20">|</span>
              <Link href="/cgv" className="hover:text-gold transition-colors">CGV</Link>
              <span className="text-white/20">|</span>
              <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
