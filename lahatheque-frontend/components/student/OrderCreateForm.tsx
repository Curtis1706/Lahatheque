"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, X, ShoppingCart, Search, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getStudentCatalog } from "@/lib/services/student";
import { createOrder, type OrderItemPayload } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";
import { Loader } from "@/components/ui/loader";
import { BookCover } from "@/components/features/student/book-cover";
import { useDisciplines } from "@/lib/hooks/use-disciplines";

interface CartItem {
  ouvrage_id: string;
  title: string;
  cover_url?: string;
  author_name?: string;
  discipline_name?: string;
  unit_price: number;
  quantity: number;
  format_type: "digital" | "paper";
}

// Les frais de livraison sont définis par le Gestionnaire selon le service choisi,
// communiqués après traitement de la commande — jamais un montant inventé côté client.
const SHIPPING_FEE = 0;

// ─── Searchable Book Combobox Component ────────────────────────────────────────

interface BookComboboxProps {
  books: BookAPI[];
  selectedBookId: string;
  onSelect: (book: BookAPI) => void;
  selectedFormat: "digital" | "paper";
  loading: boolean;
}

function BookCombobox({
  books,
  selectedBookId,
  onSelect,
  selectedFormat,
  loading,
}: BookComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId),
    [books, selectedBookId]
  );

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return books;
    const q = searchTerm.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authors?.some(
          (a) =>
            a.full_name?.toLowerCase().includes(q) ||
            a.first_name?.toLowerCase().includes(q) ||
            a.last_name?.toLowerCase().includes(q)
        ) ||
        b.discipline_name?.toLowerCase().includes(q)
    );
  }, [books, searchTerm]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-[3] min-w-[280px]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className={`w-full px-3.5 py-2 text-xs border rounded-xl flex items-center justify-between gap-2.5 transition-all text-left min-h-[44px] ${
          loading
            ? "bg-background-secondary/80 border-border text-foreground-muted cursor-not-allowed animate-pulse"
            : "bg-background-secondary border-border text-navy hover:border-gold/50 cursor-pointer"
        }`}
        aria-expanded={isOpen}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 text-xs text-foreground-muted">
            <Loader variant="spinner" size={14} className="text-gold" />
            <span className="font-medium">Chargement des ouvrages du catalogue...</span>
          </div>
        ) : selectedBook ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">
              <BookCover book={selectedBook} size="xs" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif font-bold text-navy text-xs truncate">
                {selectedBook.title}
              </p>
              <p className="text-[10px] text-foreground-muted truncate">
                {selectedBook.authors?.map((a) => a.full_name).join(", ") ||
                  "Auteur LAHA"}{" "}
                &bull;{" "}
                <strong className="text-gold font-mono">
                  {(selectedFormat === "paper"
                    ? selectedBook.price_paper ?? selectedBook.price_digital ?? 0
                    : selectedBook.price_digital ?? 0
                  ).toLocaleString("fr-FR")}{" "}
                  XOF
                </strong>
              </p>
            </div>
          </div>
        ) : (
          <span className="text-foreground-muted text-xs">
            Rechercher et sélectionner un ouvrage…
          </span>
        )}

        {loading ? (
          <Loader variant="dots" size={16} className="text-gold shrink-0" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-foreground-muted shrink-0 transition-transform ${
              isOpen ? "rotate-180 text-gold" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-border bg-background-secondary flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Taper un titre, auteur ou matière..."
              className="w-full text-xs bg-transparent text-navy placeholder:text-foreground-muted focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-foreground-muted hover:text-navy p-1 cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Book Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {filteredBooks.length === 0 ? (
              <div className="p-4 text-center text-xs text-foreground-muted">
                Aucun ouvrage trouvé pour « {searchTerm} »
              </div>
            ) : (
              filteredBooks.map((b) => {
                const isSelected = b.id === selectedBookId;
                const price =
                  selectedFormat === "paper"
                    ? b.price_paper ?? b.price_digital ?? 0
                    : b.price_digital ?? 0;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelect(b);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full p-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-gold/15 text-navy font-semibold"
                        : "hover:bg-background-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0">
                        <BookCover book={b} size="xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">
                          {b.discipline_name || "Académique"}
                        </span>
                        <p className="font-serif font-bold text-navy text-xs truncate">
                          {b.title}
                        </p>
                        <p className="text-[10px] text-foreground-muted truncate">
                          {b.authors?.map((a) => a.full_name).join(", ") || "Auteur LAHA"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-gold">
                        {price.toLocaleString("fr-FR")} XOF
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-gold shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Order Create Form ───────────────────────────────────────────────────

export default function OrderCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { disciplines: dbDisciplines } = useDisciplines();
  const [books, setBooks] = useState<BookAPI[]>([]);
  const [disciplines, setDisciplines] = useState<{ id: string | number; name: string }[]>([]);
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"digital" | "paper">("paper");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [typeCommande, setTypeCommande] = useState<"rentree_scolaire" | "personnel" | "institutionnel">("personnel");
  const [modePaiement, setModePaiement] = useState<"mobile_money" | "virement" | "especes" | "carte">("mobile_money");

  const [dateLivraison, setDateLivraison] = useState("");
  const [heureDebut, setHeureDebut] = useState("07:00");
  const [heureFin, setHeureFin] = useState("19:00");
  const [shippingAddress, setShippingAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getStudentCatalog(undefined, disciplineFilter === "all" ? undefined : disciplineFilter);
        setBooks(Array.isArray(data.books) ? data.books : []);
        setDisciplines(Array.isArray(data.disciplines) ? data.disciplines : []);
      } catch {
        toast.error("Impossible de charger le catalogue.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [disciplineFilter]);

  const hasPaperItem = cart.some((i) => i.format_type === "paper");

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart]
  );
  const shippingTotal = 0;
  const total = subtotal + shippingTotal;
  const shippingFeeUnknown = hasPaperItem;

  function handleAddToCart() {
    const book = books.find((b) => b.id === selectedBookId);
    if (!book) {
      toast.error("Veuillez sélectionner un ouvrage dans la liste.");
      return;
    }
    const unitPrice =
      selectedFormat === "paper"
        ? (book.price_paper ?? book.price_digital ?? 0)
        : (book.price_digital ?? 0);

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.ouvrage_id === book.id && i.format_type === selectedFormat
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          ouvrage_id: book.id,
          title: book.title,
          cover_url: book.cover_url,
          author_name: book.authors?.map((a) => a.full_name).join(", "),
          discipline_name: book.discipline_name,
          unit_price: unitPrice,
          quantity,
          format_type: selectedFormat,
        },
      ];
    });
    setSelectedBookId("");
    setQuantity(1);
    toast.success(`« ${book.title} » (${selectedFormat === "paper" ? "Papier" : "Numérique"}) ajouté au panier`);
  }

  function handleRemoveFromCart(index: number) {
    const item = cart[index];
    setCart((prev) => prev.filter((_, i) => i !== index));
    if (item) {
      toast.info(`« ${item.title} » retiré du panier`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Ajoutez au moins un article au panier.");
      return;
    }
    if (hasPaperItem && !shippingAddress.trim()) {
      toast.error("L'adresse de livraison est requise pour un livre papier.");
      return;
    }

    setSubmitting(true);
    try {
      const items: OrderItemPayload[] = cart.map((i) => ({
        ouvrage_id: i.ouvrage_id,
        format_type: i.format_type,
        quantity: i.quantity,
      }));

      const result = await createOrder({
        items,
        type_commande: typeCommande,
        mode_paiement: modePaiement,
        shipping_address: shippingAddress || undefined,
        date_livraison_souhaitee: dateLivraison || undefined,
        plage_horaire_debut: heureDebut || undefined,
        plage_horaire_fin: heureFin || undefined,
      });

      // Mobile Money → redirection Moneroo
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      toast.success("Commande créée avec succès. Un agent LAHA Éditions vous contactera.");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création de la commande.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background border border-border rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm animate-in fade-in duration-200"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="space-y-0.5">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gold" aria-hidden="true" />
            <span>Nouvelle Commande d&apos;Ouvrages</span>
          </h2>
          <p className="text-xs text-foreground-muted">
            Sélectionnez les livres avec aperçu visuel et choisissez vos modalités de paiement.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl border border-border hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
          title="Fermer le formulaire"
          aria-label="Fermer le formulaire"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Section 1 — Sélection des articles ─────────────────────────── */}
      <section aria-labelledby="section-articles" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3
            id="section-articles"
            className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2"
          >
            <span>1. Sélection des articles</span>
          </h3>

          {loading && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full animate-pulse">
              <Loader variant="spinner" size={12} />
              <span>Chargement du catalogue en cours...</span>
            </div>
          )}
        </div>

        {/* Filtres + sélecteur avec aperçu couverture */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center flex-wrap">
          {/* Filtre discipline */}
          <select
            value={disciplineFilter}
            disabled={loading}
            onChange={(e) => {
              setDisciplineFilter(e.target.value);
              setSelectedBookId("");
            }}
            className="px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-navy focus:border-gold outline-none flex-1 min-w-[150px] min-h-[44px] disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Filtrer par matière"
          >
            <option value="all">Toutes disciplines</option>
            {(dbDisciplines && dbDisciplines.length > 0 ? dbDisciplines : disciplines).map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Sélecteur d'ouvrage avec recherche, loader explicite et couverture miniature */}
          <BookCombobox
            books={books}
            selectedBookId={selectedBookId}
            onSelect={(b) => setSelectedBookId(b.id)}
            selectedFormat={selectedFormat}
            loading={loading}
          />

          {/* Format */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as "digital" | "paper")}
            className="px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-navy font-semibold focus:border-gold outline-none min-h-[44px]"
            aria-label="Format"
          >
            <option value="paper">Livre Papier</option>
            <option value="digital">Numérique</option>
          </select>

          {/* Quantité */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-foreground-muted hidden sm:inline">Qté</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary font-mono font-bold text-navy focus:border-gold outline-none min-h-[44px] text-center"
              aria-label="Quantité"
            />
          </div>

          {/* Bouton Ajouter */}
          <button
            type="button"
            disabled={loading || !selectedBookId}
            onClick={handleAddToCart}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-2 justify-center min-h-[44px] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 text-gold" aria-hidden="true" />
            <span>Ajouter au panier</span>
          </button>
        </div>

        {/* Tableau / Panier des articles choisis */}
        <div className="border border-border rounded-2xl overflow-hidden bg-background-secondary/40">
          {cart.length === 0 ? (
            <p className="text-xs text-foreground-muted text-center py-8 italic">
              Aucun article ajouté. Sélectionnez un ouvrage ci-dessus pour composer votre commande.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap bg-background">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="shrink-0">
                      <BookCover
                        book={{
                          id: item.ouvrage_id,
                          title: item.title,
                          cover_url: item.cover_url,
                        }}
                        size="xs"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-navy text-xs sm:text-sm truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        Format : <strong className="text-navy">{item.format_type === "paper" ? "Papier" : "Numérique"}</strong> &bull; Qté : <strong className="font-mono text-navy">{item.quantity}</strong> &times; {item.unit_price.toLocaleString("fr-FR")} XOF
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                    <span className="font-mono font-bold text-navy text-xs sm:text-sm">
                      {(item.unit_price * item.quantity).toLocaleString("fr-FR")} XOF
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      title="Supprimer cet article"
                      aria-label={`Supprimer ${item.title}`}
                      className="p-2 rounded-xl text-error hover:bg-error/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Récapitulatif financier */}
        {cart.length > 0 && (
          <div className="space-y-1 text-right pt-2 border-t border-border">
            <p className="text-xs text-foreground-muted">
              Sous-total articles :{" "}
              <span className="font-mono font-semibold text-navy">{subtotal.toLocaleString("fr-FR")} XOF</span>
            </p>
            {hasPaperItem && (
              <p className="text-xs text-foreground-muted">
                {shippingFeeUnknown ? (
                  <span className="text-[11px] text-foreground-muted italic">
                    Frais de livraison à confirmer — communiqués après traitement de votre commande par notre équipe logistique.
                  </span>
                ) : (
                  <>
                    Frais d&apos;expédition forfaitaires (livres papier) :{" "}
                    <span className="font-mono font-semibold text-navy">{shippingTotal.toLocaleString("fr-FR")} XOF</span>
                  </>
                )}
              </p>
            )}
            <p className="font-serif font-bold text-navy text-base sm:text-lg pt-1">
              Total à régler : <span className="text-gold font-mono">{total.toLocaleString("fr-FR")} XOF</span>
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2 — Détails de la commande ─────────────────────────── */}
      <section aria-labelledby="section-details" className="space-y-3 pt-4 border-t border-border">
        <h3
          id="section-details"
          className="text-xs font-bold text-navy uppercase tracking-wider"
        >
          2. Modalités de règlement &amp; type de commande
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="type-commande"
              className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block mb-1.5"
            >
              Type de commande
            </label>
            <select
              id="type-commande"
              value={typeCommande}
              onChange={(e) => setTypeCommande(e.target.value as typeof typeCommande)}
              className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-navy focus:border-gold outline-none min-h-[44px]"
            >
              <option value="personnel">Personnel</option>
              <option value="rentree_scolaire">Rentrée universitaire</option>
              <option value="institutionnel">Institutionnel</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mode-paiement"
              className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block mb-1.5"
            >
              Mode de règlement
            </label>
            <select
              id="mode-paiement"
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as typeof modePaiement)}
              className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-navy focus:border-gold outline-none min-h-[44px]"
            >
              <option value="mobile_money">Mobile Money (MTN / Moov / Celtiis)</option>
              <option value="carte">Carte bancaire (Visa / Mastercard)</option>
              <option value="virement">Virement bancaire</option>
              <option value="especes">Espèces à la livraison</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Coordonnées de Livraison ─────────────────────────── */}
      {hasPaperItem && (
        <section
          aria-labelledby="section-livraison"
          className="bg-navy text-white rounded-3xl p-5 sm:p-6 space-y-4"
        >
          <h3
            id="section-livraison"
            className="text-xs font-bold uppercase tracking-wider text-gold"
          >
            3. Coordonnées de Livraison Physique
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="date-livraison"
                className="text-[11px] font-semibold block mb-1 text-white/80"
              >
                Date souhaitée
              </label>
              <input
                id="date-livraison"
                type="date"
                value={dateLivraison}
                onChange={(e) => setDateLivraison(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-dark border border-navy-hover text-white focus:border-gold outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="heure-debut"
                className="text-[11px] font-semibold block mb-1 text-white/80"
              >
                Créneau de
              </label>
              <input
                id="heure-debut"
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-dark border border-navy-hover text-white focus:border-gold outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="heure-fin"
                className="text-[11px] font-semibold block mb-1 text-white/80"
              >
                À
              </label>
              <input
                id="heure-fin"
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-dark border border-navy-hover text-white focus:border-gold outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="shipping-address"
              className="text-[11px] font-semibold block mb-1 text-white/80"
            >
              Adresse précise de livraison (Quartier, ville, repère)
            </label>
            <textarea
              id="shipping-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              placeholder="Ex: Cotonou, Quartier Cadjèhoun, Rue 123..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-navy-dark border border-navy-hover text-white placeholder:text-white/40 focus:border-gold outline-none resize-none"
            />
          </div>
        </section>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3 rounded-2xl border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors min-h-[48px] cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting || cart.length === 0}
          className="flex-1 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer shadow-md"
        >
          {submitting ? <Loader variant="spinner" size={16} /> : <ShoppingCart className="w-4 h-4 text-gold" />}
          <span>{submitting ? "Création de la commande…" : "Valider et créer la commande"}</span>
        </button>
      </div>
    </form>
  );
}

export { OrderCreateForm };
