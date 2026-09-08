"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Book, 
  BookOpen, 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus, 
  Truck, 
  Store, 
  Globe, 
  Heart, 
  Laptop,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Languages
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatEur } from "@/components/cart/cart-drawer";
import { SampleChoiceModal } from "@/components/features/catalog/sample-choice-modal";

interface BookActionButtonsProps {
  book: {
    id: string;
    title: string;
    author?: string;
    authors?: any;
    authors_details?: { first_name: string; last_name: string }[];
    discipline_detail?: { id: number; name: string };
    country?: string;
    level?: string;
    price?: number;
    price_paper?: number;
    price_audio?: number;
    price_audio_eur?: number;
    has_audio_version?: boolean;
    has_audio?: boolean;
    format_type?: string;
    cover_image?: string;
    cover_url?: string;
    stock_disponible?: number;
    is_paper_available?: boolean;
    is_digital_available?: boolean;
    available_languages?: string[];
    languages?: {
      id: string;
      language: string;
      is_original: boolean;
      is_paper_available: boolean;
      paper_stock: number;
      title?: string;
    }[];
  };
}

export function BookActionButtons({ book }: BookActionButtonsProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const availableLangs = (
    book.available_languages && book.available_languages.length > 0
      ? book.available_languages
      : book.languages && book.languages.length > 0
      ? book.languages.map((l) => l.language)
      : ["fr"]
  );

  const [paperLanguage, setPaperLanguage] = useState<string>(() => {
    if (availableLangs.includes("fr")) return "fr";
    return availableLangs[0] || "fr";
  });

  const currentLangVer = book.languages?.find(
    (l) => l.language.toLowerCase() === paperLanguage.toLowerCase()
  );
  const stockPaper = currentLangVer != null ? currentLangVer.paper_stock : (book.stock_disponible ?? 15);
  const isPaperAvailable = currentLangVer != null 
    ? (currentLangVer.is_paper_available && book.is_paper_available !== false) 
    : (book.is_paper_available !== false);

  const isAudioAvailable = Boolean(book.has_audio_version || book.has_audio || book.format_type === "audio");
  const isDigitalAvailable = book.is_digital_available !== false && book.format_type !== "audio";

  // Sélection multiple : chaque format peut être coché indépendamment
  const [selectedPaper, setSelectedPaper] = useState<boolean>(isPaperAvailable && stockPaper > 0);
  const [selectedDigital, setSelectedDigital] = useState<boolean>(isDigitalAvailable && (!isPaperAvailable || stockPaper <= 0));
  const [selectedAudio, setSelectedAudio] = useState<boolean>(isAudioAvailable && !isDigitalAvailable && !isPaperAvailable);

  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [showSampleModal, setShowSampleModal] = useState<boolean>(false);

  const priceDigital = book.price || 2500;
  const pricePaper = book.price_paper || (book.price ? Math.round(book.price * 1.3) : 3500);
  const priceAudio = book.price_audio || 2500;

  // Calcul du montant total cumulé
  const totalAmount = 
    (selectedPaper ? pricePaper * quantity : 0) +
    (selectedDigital ? priceDigital : 0) +
    (selectedAudio ? priceAudio : 0);

  const totalSelectedCount = 
    (selectedPaper ? 1 : 0) + 
    (selectedDigital ? 1 : 0) + 
    (selectedAudio ? 1 : 0);

  const authorName = book.author || 
    (book.authors_details ? book.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ") : 
    (typeof book.authors === "string" ? book.authors : "Auteur LAHA"));

  const handleAddToCart = (autoRedirectToCheckout = false) => {
    if (totalSelectedCount === 0) return;

    const coverUrl = book.cover_url || book.cover_image || (book.id ? `/api/bff/catalog/books/${book.id}/cover/` : "");
    const baseItem = {
      bookId: book.id,
      title: book.title,
      author: authorName,
      cover: coverUrl,
      category: book.discipline_detail?.name || "Scolaires",
      country: book.country || "Bénin",
      level: book.level || "Tous niveaux",
    };

    // 1. Ajouter le format papier si coché
    if (selectedPaper) {
      addItem({
        ...baseItem,
        format: "paper",
        price: pricePaper,
        quantity: quantity,
        maxStockPaper: stockPaper,
        selectedLanguage: paperLanguage,
      }, false);
    }

    // 2. Ajouter le format numérique si coché
    if (selectedDigital) {
      addItem({
        ...baseItem,
        format: "digital",
        price: priceDigital,
        quantity: 1,
      }, false);
    }

    // 3. Ajouter le format audio si coché
    if (selectedAudio) {
      addItem({
        ...baseItem,
        format: "audio",
        price: priceAudio,
        quantity: 1,
      }, !autoRedirectToCheckout);
    } else if (!autoRedirectToCheckout) {
      // Si au moins un format a été ajouté et qu'on ne redirige pas, ouvrir le tiroir
      useCart;
    }

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);

    if (autoRedirectToCheckout) {
      router.push("/checkout");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Sélection Multi-Formats Combinable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block font-mono">
            Choisir un ou plusieurs formats
          </label>
          <span className="text-[10px] text-gold font-semibold">
            {totalSelectedCount} format{totalSelectedCount > 1 ? "s" : ""} sélectionné{totalSelectedCount > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option Format Papier */}
          {isPaperAvailable && (
            <button
              type="button"
              disabled={stockPaper <= 0}
              onClick={() => {
                // Empêcher de tout décocher si c'est le seul sélectionné
                if (selectedPaper && totalSelectedCount === 1) return;
                setSelectedPaper(!selectedPaper);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                selectedPaper
                  ? "border-2 border-navy bg-navy/5 shadow-xs"
                  : "border-border bg-background hover:border-gold/60"
              } ${stockPaper <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedPaper ? "bg-navy text-white" : "bg-background-secondary text-navy"}`}>
                    <Book className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy">
                    Livre papier
                  </span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  selectedPaper ? "bg-navy border-navy text-white" : "border-border bg-background"
                }`}>
                  {selectedPaper && <Check className="w-3 h-3" />}
                </div>
              </div>

              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-navy">
                  {pricePaper.toLocaleString("fr-FR")} F CFA
                </div>
                <div className="text-[10px] text-foreground-muted font-mono">
                  ≈ {formatEur(pricePaper)} €
                </div>
              </div>

              <div className="text-[10px] text-foreground-muted border-t border-border/50 pt-1.5 flex items-center justify-between">
                <span>{stockPaper > 0 ? "Livraison / Retrait" : "Rupture"}</span>
                {stockPaper > 0 && stockPaper <= 5 && (
                  <span className="text-amber-600 font-semibold font-mono">Reste {stockPaper}</span>
                )}
              </div>
            </button>
          )}

          {/* Option Format Numérique */}
          {isDigitalAvailable && (
            <button
              type="button"
              onClick={() => {
                if (selectedDigital && totalSelectedCount === 1) return;
                setSelectedDigital(!selectedDigital);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                selectedDigital
                  ? "border-2 border-navy bg-navy/5 shadow-xs"
                  : "border-border bg-background hover:border-gold/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedDigital ? "bg-navy text-white" : "bg-background-secondary text-navy"}`}>
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy">
                    Livre numérique
                  </span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  selectedDigital ? "bg-navy border-navy text-white" : "border-border bg-background"
                }`}>
                  {selectedDigital && <Check className="w-3 h-3" />}
                </div>
              </div>

              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-navy">
                  {priceDigital.toLocaleString("fr-FR")} F CFA
                </div>
                <div className="text-[10px] text-foreground-muted font-mono">
                  ≈ {formatEur(priceDigital)} €
                </div>
              </div>

              <div className="text-[10px] text-foreground-muted border-t border-border/50 pt-1.5">
                Lecture immédiate
              </div>
            </button>
          )}

          {/* Option Format Audio */}
          {isAudioAvailable && (
            <button
              type="button"
              onClick={() => {
                if (selectedAudio && totalSelectedCount === 1) return;
                setSelectedAudio(!selectedAudio);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                selectedAudio
                  ? "border-2 border-gold bg-gold/10 shadow-xs"
                  : "border-border bg-background hover:border-gold/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedAudio ? "bg-gold text-navy" : "bg-background-secondary text-navy"}`}>
                    <Headphones className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy">
                    Livre audio
                  </span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  selectedAudio ? "bg-gold border-gold text-navy" : "border-border bg-background"
                }`}>
                  {selectedAudio && <Check className="w-3 h-3" />}
                </div>
              </div>

              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-navy">
                  {priceAudio.toLocaleString("fr-FR")} F CFA
                </div>
                <div className="text-[10px] text-foreground-muted font-mono">
                  ≈ {formatEur(priceAudio)} €
                </div>
              </div>

              <div className="text-[10px] text-foreground-muted border-t border-border/50 pt-1.5">
                Écoute streaming HD
              </div>
            </button>
          )}
        </div>

        {/* Sélecteur obligatoire de langue pour le format papier si plusieurs langues */}
        {selectedPaper && availableLangs.length > 1 && (
          <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-gold" />
                Langue de l'exemplaire papier
              </span>
              <span className="text-[10px] text-foreground-muted font-mono">
                Stock dédié par langue
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableLangs.map((lang) => {
                const langVer = book.languages?.find((l) => l.language.toLowerCase() === lang.toLowerCase());
                const langStock = langVer ? langVer.paper_stock : stockPaper;
                const isLangAvailable = langVer ? (langVer.is_paper_available && langStock > 0) : stockPaper > 0;
                const isSelected = paperLanguage.toLowerCase() === lang.toLowerCase();
                const label = lang.toUpperCase() === "FR" ? "Français" : lang.toUpperCase() === "EN" ? "Anglais" : lang.toUpperCase();

                return (
                  <button
                    key={lang}
                    type="button"
                    disabled={!isLangAvailable}
                    onClick={() => setPaperLanguage(lang.toLowerCase())}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-navy text-white border-navy shadow-xs"
                        : isLangAvailable
                        ? "bg-background-secondary text-foreground hover:border-gold/60 border-border"
                        : "opacity-40 cursor-not-allowed border-border bg-background"
                    }`}
                  >
                    <span className="font-mono font-bold">[{lang.toUpperCase()}]</span>
                    <span>{label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected ? "bg-white/20 text-white" : "bg-background text-foreground-muted border border-border"
                    }`}>
                      {isLangAvailable ? `Stock : ${langStock}` : "Rupture"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Récapitulatif du Total & Ligne d'Actions */}
      <div className="space-y-4">
        {/* Affichage du prix total consolidé */}
        <div className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-foreground-muted font-semibold">Total sélectionné :</span>
            <div className="text-xs font-bold text-navy">
              {[
                selectedPaper && `Papier [${paperLanguage.toUpperCase()}] (x${quantity})`,
                selectedDigital && "Numérique",
                selectedAudio && "Audio",
              ].filter(Boolean).join(" + ") || "Aucun format sélectionné"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-base sm:text-lg font-bold text-navy">
              {totalAmount.toLocaleString("fr-FR")} F CFA
            </div>
            <div className="text-[10px] text-foreground-muted font-mono">
              ≈ {formatEur(totalAmount)} €
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Sélecteur de Quantité (pour livre papier uniquement) */}
          {selectedPaper && (
            <div className="flex items-center border border-border rounded-xl bg-background p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                aria-label="Diminuer la quantité"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold font-mono text-navy">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stockPaper, q + 1))}
                disabled={quantity >= stockPaper}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bouton Ajouter au Panier */}
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={totalSelectedCount === 0}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-navy bg-background hover:bg-navy/5 text-navy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {addedAnimation ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{addedAnimation ? "Ajouté !" : "Ajouter au panier"}</span>
          </button>

          {/* Bouton Acheter Maintenant */}
          <button
            type="button"
            onClick={() => handleAddToCart(true)}
            disabled={totalSelectedCount === 0}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <span>Acheter maintenant</span>
          </button>

          {/* Bouton Wishlist */}
          <button
            type="button"
            onClick={() => setIsWishlist(!isWishlist)}
            title={isWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isWishlist 
                ? "bg-red-50 border-red-200 text-red-500" 
                : "border-border bg-background hover:bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${isWishlist ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Bouton Extrait Intelligent (Liseuse vs Audio) */}
        {isAudioAvailable ? (
          <button
            type="button"
            onClick={() => setShowSampleModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gold/10 hover:bg-gold/20 text-navy font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-gold/40 cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-gold" />
            <span>Découvrir l'extrait gratuit (Lecture ou Écoute audio)</span>
          </button>
        ) : (
          <Link
            href={`/catalog/reader/${book.id}?mode=sample`}
            className="w-full py-2.5 px-4 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-border cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Feuilleter l'extrait gratuit en immersion 3D</span>
          </Link>
        )}
      </div>

      {/* 3. Avantages & Modes de Livraison */}
      <div className="p-4 rounded-2xl bg-background border border-border/80 space-y-2.5 text-xs text-foreground-secondary">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-navy shrink-0" />
          <span><strong>Livraison à domicile</strong> partout en Afrique de l'Ouest et à l'international.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Store className="w-4 h-4 text-gold shrink-0" />
          <span><strong>Click &amp; Collect gratuit</strong> — retrait en librairie partenaire sous 24h.</span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] pt-1 border-t border-border/50 text-foreground-muted">
          <Globe className="w-3.5 h-3.5 text-navy shrink-0" />
          <span>Client en France ou Europe ? Titre également distribué par notre réseau partenaire <strong>Africa Vivre</strong>.</span>
        </div>
      </div>

      {/* Modale de Choix d'Extrait */}
      {showSampleModal && (
        <SampleChoiceModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          book={book as any}
        />
      )}
    </div>
  );
}
