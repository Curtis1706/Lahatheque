"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Building2,
  Send,
  Plus,
  Trash2,
  BookOpen,
  AlertCircle,
  Truck,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  getUniversityCatalog,
  createUniversityPaperOrder,
} from "@/lib/services/university";
import type { UniversityBookCatalogItem } from "@/lib/types/university";
import { toast } from "sonner";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";

interface UniversityCartItem {
  book_id: string;
  book: UniversityBookCatalogItem;
  quantity: number;
}

export default function NewUniversityPaperOrderPage() {
  const router = useRouter();
  const [catalogBooks, setCatalogBooks] = useState<UniversityBookCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [cartItems, setCartItems] = useState<UniversityCartItem[]>([]);

  const [deliveryCampus, setDeliveryCampus] = useState(
    "Bibliothèque Centrale — Campus Universitaire d'Abomey-Calavi"
  );
  const [contactPerson, setContactPerson] = useState(
    "M. SOSSOU Théophile (Conservateur en Chef)"
  );
  const [contactPhone, setContactPhone] = useState("+229 97 33 44 55");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError(null);
      try {
        const books = await getUniversityCatalog();
        setCatalogBooks(books);
        if (books.length > 0) {
          setSelectedBookId(books[0].id);
        }
      } catch {
        setCatalogError("Impossible de charger le catalogue académique. Veuillez réessayer.");
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
      toast.info(`« ${targetBook.title} » est déjà présent dans la commande.`);
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        book_id: targetBook.id,
        book: targetBook,
        quantity: 10,
      },
    ]);
    toast.success(`« ${targetBook.title} » ajouté à la commande.`);
  };

  const handleUpdateQty = (bookId: string, val: number) => {
    const qty = Math.max(1, val);
    setCartItems((prev) =>
      prev.map((ci) => (ci.book_id === bookId ? { ...ci, quantity: qty } : ci))
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.book_id !== bookId));
    toast.info("Article retiré de la commande.");
  };

  const totalCopies = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const totalAmount = cartItems.reduce(
    (acc, ci) => acc + ci.quantity * (ci.book.price_paper || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Veuillez ajouter au moins un ouvrage à la commande.");
      return;
    }
    if (!deliveryCampus.trim() || !contactPerson.trim() || !contactPhone.trim()) {
      toast.error("Veuillez renseigner le campus de livraison, le réceptionnaire et le téléphone.");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        items: cartItems.map((ci) => ({
          book_id: ci.book_id,
          quantity: ci.quantity,
          title: ci.book.title,
          unit_price: ci.book.price_paper,
        })),
        delivery_campus: deliveryCampus.trim(),
        contact_person: contactPerson.trim(),
        contact_phone: contactPhone.trim(),
      };

      const newOrder = await createUniversityPaperOrder(orderPayload);
      toast.success(
        `Bon de commande ${newOrder.order_number || newOrder.id} enregistré avec succès !`
      );
      router.push("/university/purchases");
    } catch {
      toast.error("Une erreur est survenue lors de la transmission du bon de commande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/university/purchases" className="hover:text-navy">Commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouvelle Commande</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link
          href="/university/purchases"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux Commandes
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">
          Passation de Commande pour l&apos;Établissement
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Sélectionnez les ouvrages du catalogue académique, ajustez les volumes souhaités et vos coordonnées de livraison sur le campus.
        </p>
      </div>

      {loadingCatalog ? (
        <div className="p-12 text-center rounded-3xl bg-background border border-border">
          <PageLoader label="Chargement du catalogue académique" />
        </div>
      ) : catalogError ? (
        <div className="p-6 rounded-3xl bg-background border border-border flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{catalogError}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélecteur d'ouvrages du catalogue réel (même design que chez le grossiste) */}
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
                    {b.title} — {b.discipline} ({b.price_paper.toLocaleString("fr-FR")} XOF / ex. papier)
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
                <p>Utilisez le sélecteur ci-dessus pour ajouter des ouvrages du catalogue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((ci) => (
                  <div
                    key={ci.book_id}
                    className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BookCover3D
                        title={ci.book.title}
                        authors={ci.book.authors}
                        discipline={ci.book.discipline}
                        coverUrl={ci.book.cover_url}
                        size="xs"
                        interactive={false}
                      />
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-serif font-bold text-navy line-clamp-1">{ci.book.title}</p>
                        <p className="text-[10px] text-foreground-muted">
                          {Array.isArray(ci.book.authors) ? ci.book.authors.join(", ") : (ci.book.authors || "Auteur")} — <span className="font-semibold text-navy">{ci.book.discipline}</span>
                        </p>
                        <p className="text-[9px] text-foreground-muted font-mono">ISBN : {ci.book.isbn_print || ci.book.isbn_digital}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div>
                        <label className="text-[10px] text-foreground-muted block font-bold mb-0.5">
                          Exemplaires Papier
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={ci.quantity}
                          onChange={(e) =>
                            handleUpdateQty(ci.book_id, parseInt(e.target.value) || 1)
                          }
                          className="w-24 px-2.5 py-1.5 bg-background border border-border rounded-lg text-center font-mono font-bold text-navy text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-foreground-muted block font-bold mb-0.5">
                          Sous-Total
                        </label>
                        <span className="font-mono font-bold text-navy text-xs inline-block pt-1">
                          {(ci.quantity * ci.book.price_paper).toLocaleString("fr-FR")} XOF
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(ci.book_id)}
                        className="p-2 text-foreground-muted hover:text-rose-600 transition-colors cursor-pointer"
                        title="Retirer de la commande"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 space-y-2 text-xs text-navy">
                <div className="flex justify-between">
                  <span>Volume Total Exemplaires Papier :</span>
                  <span className="font-mono font-bold">{totalCopies} ex.</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-navy/20">
                  <span className="text-navy">Montant Total du Bon de Commande :</span>
                  <span className="font-mono text-gold text-base">
                    {totalAmount.toLocaleString("fr-FR")} XOF
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Coordonnées de Livraison & Réception sur Campus */}
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              Lieu de Livraison &amp; Réception sur le Campus
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Campus, Bâtiment &amp; Bibliothèque Destinataire *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryCampus}
                  onChange={(e) => setDeliveryCampus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Nom du Réceptionnaire / Responsable Bibliothèque *
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Téléphone Direct Réceptionnaire *
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
                    <span>Transmettre le Bon de Commande</span>
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
