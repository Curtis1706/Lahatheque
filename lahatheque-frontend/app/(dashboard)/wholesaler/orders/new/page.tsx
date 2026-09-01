"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Building2, Send, Plus, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { PhoneInput } from "@/components/ui/phone-input";
import { getWholesalerBooks, createWholesalerOrder } from "@/lib/services/wholesaler";
import type { WholesalerBookItem, WholesalerCartItem } from "@/lib/types/wholesaler";
import { toast } from "sonner";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";

export default function NewWholesalerOrderPage() {
  const router = useRouter();
  const [catalogBooks, setCatalogBooks] = useState<WholesalerBookItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [cartItems, setCartItems] = useState<WholesalerCartItem[]>([]);

  const [deliveryAddress, setDeliveryAddress] = useState("Avenue Steinmetz, Carré 122, Cotonou, Bénin");
  const [contactPhone, setContactPhone] = useState("+229 97 00 11 22");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError(null);
      try {
        const books = await getWholesalerBooks();
        setCatalogBooks(books);
        if (books.length > 0) {
          setSelectedBookId(books[0].id);
        }
      } catch {
        setCatalogError("Impossible de charger le catalogue grossiste. Veuillez réessayer.");
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  const handleAddBookToCart = () => {
    if (!selectedBookId) return;
    const targetBook = catalogBooks.find((b) => b.id === selectedBookId);
    if (!targetBook) return;

    if (cartItems.some((ci) => ci.book_id === targetBook.id)) {
      toast.info(`"${targetBook.title}" est déjà présent dans la commande.`);
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        book_id: targetBook.id,
        book: targetBook,
        digital_licenses_qty: 1,
        print_copies_qty: 5,
      },
    ]);
    toast.success(`"${targetBook.title}" ajouté à la commande.`);
  };

  const handleUpdateQty = (bookId: string, field: "digital_licenses_qty" | "print_copies_qty", val: number) => {
    const qty = Math.max(0, val);
    setCartItems((prev) =>
      prev.map((ci) => (ci.book_id === bookId ? { ...ci, [field]: qty } : ci))
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.book_id !== bookId));
    toast.info("Article retiré de la commande.");
  };

  const totalDigitalSubtotal = cartItems.reduce(
    (acc, ci) => acc + ci.digital_licenses_qty * (ci.book.digital_wholesale_price || 0),
    0
  );
  const totalPrintSubtotal = cartItems.reduce(
    (acc, ci) => acc + ci.print_copies_qty * (ci.book.print_wholesale_price || 0),
    0
  );
  const totalAmount = totalDigitalSubtotal + totalPrintSubtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Veuillez ajouter au moins un ouvrage à la commande.");
      return;
    }
    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      toast.error("Veuillez renseigner l'adresse de livraison et le téléphone.");
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = await createWholesalerOrder(cartItems, deliveryAddress, contactPhone);
      toast.success(`Commande groupée ${newOrder.reference || newOrder.id} transmise avec succès !`);
      router.push(`/wholesaler/orders/${newOrder.id}`);
    } catch {
      toast.error("Une erreur est survenue lors de la transmission de la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/wholesaler/orders" className="hover:text-navy">Commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouvelle Commande</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link href="/wholesaler/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Catalogue Grossiste
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">
          Validation &amp; Soumission de Commande Groupée
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Sélectionnez les ouvrages du catalogue réel, ajustez les quantités (licences numériques + papier) et vos coordonnées de livraison.
        </p>
      </div>

      {loadingCatalog ? (
        <div className="p-12 text-center rounded-3xl bg-background border border-border">
          <PageLoader label="Chargement du catalogue grossiste" />
        </div>
      ) : catalogError ? (
        <div className="p-6 rounded-3xl bg-background border border-border flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{catalogError}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélecteur d'ouvrages du catalogue réel */}
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              Sélectionner un Ouvrage du Catalogue
            </h3>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
              >
                {catalogBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — ({b.digital_wholesale_price.toLocaleString("fr-FR")} XOF / num. | {b.print_wholesale_price.toLocaleString("fr-FR")} XOF / papier)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddBookToCart}
                disabled={!selectedBookId}
                className="px-4 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 min-h-[44px] shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Ajouter à la commande
              </button>
            </div>
          </div>

          {/* Récapitulatif des articles sélectionnés */}
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gold" />
              Récapitulatif des Articles de la Commande ({cartItems.length})
            </h3>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-2xl text-xs text-foreground-muted space-y-1">
                <p className="font-semibold text-navy">Aucun ouvrage sélectionné pour l&apos;instant.</p>
                <p>Utilisez le sélecteur ci-dessus pour ajouter des ouvrages du catalogue réel.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((ci) => (
                  <div key={ci.book_id} className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <BookCover3D
                        title={ci.book.title}
                        authors={ci.book.authors}
                        discipline={ci.book.discipline}
                        coverUrl={ci.book.cover_url}
                        size="xs"
                        interactive={false}
                      />
                      <div>
                        <p className="font-serif font-bold text-navy line-clamp-1">{ci.book.title}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{ci.book.isbn_digital}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-right">
                      <div>
                        <label className="text-[10px] text-foreground-muted block font-bold">Licence Numérique</label>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(ci.book_id, "digital_licenses_qty", ci.digital_licenses_qty > 0 ? 0 : 1)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            ci.digital_licenses_qty > 0
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-background text-foreground-muted border-border hover:text-navy"
                          }`}
                        >
                          {ci.digital_licenses_qty > 0 ? "✓ 1 unité" : "Non incluse"}
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] text-foreground-muted block font-bold">Exemplaires Papier</label>
                        <input
                          type="number"
                          min="0"
                          value={ci.print_copies_qty}
                          onChange={(e) => handleUpdateQty(ci.book_id, "print_copies_qty", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-mono font-bold text-navy text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(ci.book_id)}
                        className="p-2 text-foreground-muted hover:text-error transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 space-y-1.5 text-xs text-navy">
                <div className="flex justify-between">
                  <span>Sous-total Licences Numériques :</span>
                  <span className="font-mono font-bold">{totalDigitalSubtotal.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span>Sous-total Exemplaires Papier :</span>
                  <span className="font-mono font-bold">{totalPrintSubtotal.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-navy/20">
                  <span className="text-navy">Total Général Commande Groupée :</span>
                  <span className="font-mono text-gold text-base">{totalAmount.toLocaleString("fr-FR")} XOF</span>
                </div>
              </div>
            )}
          </div>

          {/* Coordonnées de Livraison & Facturation */}
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              Coordonnées de Livraison &amp; Facturation Entreprise
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label htmlFor="deliv-addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Adresse de Livraison Physique (pour les exemplaires papier) *
                </label>
                <input
                  id="deliv-addr"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Téléphone Direct Responsable Achats *
                </label>
                <PhoneInput
                  value={contactPhone}
                  onChange={setContactPhone}
                  className="bg-background-secondary min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold" />
                    Soumettre la Commande Groupée
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
