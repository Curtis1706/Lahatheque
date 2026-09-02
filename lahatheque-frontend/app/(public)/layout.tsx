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
import { HeaderSearchBar } from "@/components/features/search/header-search-bar";
import { useCart } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { totalCount, toggleDrawer } = useCart();

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
              href="/prestations" 
              className={pathname.startsWith("/prestations") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Nos prestations
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
            {/* Search Bar avec autocomplétion et aperçu direct */}
            <div className="hidden md:block w-48 xl:w-72">
              <HeaderSearchBar placeholder="Rechercher..." />
            </div>

            {/* Connexion Link */}
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-foreground hover:text-navy font-medium text-sm whitespace-nowrap">
              <User className="w-5 h-5 text-gold" /> Connexion
            </Link>

            {/* Cart Icon & Trigger */}
            <button 
              type="button"
              onClick={toggleDrawer}
              className="relative p-2 text-foreground hover:text-navy transition-colors shrink-0 cursor-pointer" 
              aria-label="Panier d'achat"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-navy text-[11px] font-bold font-mono min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-md">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Burger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-foreground hover:text-navy transition-colors shrink-0 cursor-pointer"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-4 space-y-4 absolute top-full left-0 right-0 shadow-xl z-50">
            {/* Mobile Search Bar */}
            <div className="pt-1">
              <HeaderSearchBar 
                placeholder="Rechercher un ouvrage, auteur..." 
                onSelectResult={() => setMobileMenuOpen(false)}
              />
            </div>

            <div className="space-y-2 pt-2">
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
                href="/prestations" 
                onClick={() => setMobileMenuOpen(false)}
                className={pathname.startsWith("/prestations") 
                  ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                  : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
                }
              >
                Nos prestations
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
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Cart Slide-Over Drawer Global */}
      <CartDrawer />

      {/* Footer Component */}
      <footer className="bg-navy text-white border-t border-navy-hover">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 py-14">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            
            {/* Colonne 1 : Marque */}
            <div className="lg:col-span-3 space-y-4">
              <Link href="/" className="inline-block bg-white p-2.5 rounded-xl">
                <img src="/logo.jpg" alt="LAHATHÈQUE" className="h-9 w-auto object-contain" />
              </Link>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
                La première bibliothèque numérique panafricaine pour les étudiants, enseignants et chercheurs.
              </p>
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
                  <Link href="/prestations" className="hover:text-gold transition-colors">Nos prestations</Link>
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
                  <a href="https://lahaeditions.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahaeditions.com
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
