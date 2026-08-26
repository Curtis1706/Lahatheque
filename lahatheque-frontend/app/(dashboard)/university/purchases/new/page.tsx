"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Plus,
  Minus,
  Trash2,
  Truck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getUniversityCatalog,
  createUniversityPaperOrder,
} from "@/lib/services/university";
import type { UniversityBookCatalogItem } from "@/lib/types/university";

interface SelectedItem {
  book: UniversityBookCatalogItem;
  quantity: number;
}

export default function NewUniversityPaperOrderPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<UniversityBookCatalogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [deliveryCampus, setDeliveryCampus] = useState("Bibliothèque Centrale — Campus Universitaire d'Abomey-Calavi");
  const [contactPerson, setContactPerson] = useState("M. SOSSOU Théophile (Conservateur en Chef)");
  const [contactPhone, setContactPhone] = useState("+229 97 33 44 55");
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoadingCatalog(true);
      const data = await getUniversityCatalog();
      setCatalog(data);
      if (data.length > 0) {
        setSelectedItems([
          { book: data[0], quantity: 20 },
          ...(data[1] ? [{ book: data[1], quantity: 15 }] : []),
        ]);
      }
      setLoadingCatalog(false);
    }
    loadData();
  }, []);

  const handleAddBook = (book: UniversityBookCatalogItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.book.id === book.id);
      if (existing) {
        return prev.map((it) =>
          it.book.id === book.id ? { ...it, quantity: it.quantity + 5 } : it
        );
      }
      return [...prev, { book, quantity: 10 }];
    });
    toast.success(`Ajouté : ${book.title}`);
  };

  const handleUpdateQuantity = (bookId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((it) =>
          it.book.id === bookId
            ? { ...it, quantity: Math.max(1, it.quantity + delta) }
            : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemove = (bookId: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.book.id !== bookId));
  };

  const totalAmount = selectedItems.reduce(
    (sum, it) => sum + it.book.price_paper * it.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Veuillez sélectionner au moins un ouvrage.");
      return;
    }

    setLoading(true);
    try {
      const order = await createUniversityPaperOrder({
        delivery_campus: deliveryCampus,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        items: selectedItems.map((it) => ({
          book_id: it.book.id,
          title: it.book.title,
          quantity: it.quantity,
          unit_price: it.book.price_paper,
        })),
        total_amount: totalAmount,
      });

      toast.success(`Commande ${order.order_number} transmise au service logistique.`);
      router.push("/university/purchases");
    } catch {
      toast.error("Erreur lors de la validation de la commande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/university/purchases" className="hover:text-navy">Commandes Papier</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouvelle Commande</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/university/purchases" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux Commandes
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <ShoppingBag className="w-4 h-4 text-gold" />
          Bon de Commande Institutionnel (Section 4.1.6)
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Passation de Commande de Livres Papier
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Sélectionnez les volumes et indiquez le lieu de livraison pour équiper les bibliothèques de vos facultés.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paramètres de Livraison */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <Truck className="w-4 h-4 text-gold" />
            Lieu de Livraison &amp; Réceptionnaire sur le Campus
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Campus, Bâtiment &amp; Bibliothèque Destinataire <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deliveryCampus}
                onChange={(e) => setDeliveryCampus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Téléphone Contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Nom du Réceptionnaire / Responsable Bibliothèque
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Liste des Ouvrages Sélectionnés */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base">
              Articles Sélectionnés ({selectedItems.length})
            </h3>
            <span className="font-mono text-sm font-bold text-navy">
              Total HT : {totalAmount.toLocaleString("fr-FR")} XOF
            </span>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-xs text-foreground-muted py-4 text-center">
              Aucun ouvrage sélectionné. Choisissez des titres dans le catalogue ci-dessous.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((it) => (
                <div
                  key={it.book.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-background-secondary border border-border gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-14 rounded bg-navy/10 overflow-hidden shrink-0 border border-border">
                      {it.book.cover_url ? (
                        <Image src={it.book.cover_url} alt={it.book.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-serif font-bold text-xs text-navy leading-snug">{it.book.title}</p>
                      <p className="text-[10px] text-foreground-muted">{it.book.faculty_code} — {it.book.price_paper.toLocaleString("fr-FR")} XOF / unité</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(it.book.id, -5)}
                        className="p-1 text-foreground-muted hover:text-navy"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold px-2 text-navy">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(it.book.id, 5)}
                        className="p-1 text-foreground-muted hover:text-navy"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-bold text-navy w-24 text-right">
                      {(it.book.price_paper * it.quantity).toLocaleString("fr-FR")} XOF
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(it.book.id)}
                      className="p-1 text-foreground-muted hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sélection depuis le Catalogue */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-base border-b border-border pb-3">
            Ajouter d&apos;autres Titres du Catalogue
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalog.map((book) => (
              <div
                key={book.id}
                className="p-3 rounded-2xl bg-background-secondary border border-border flex items-center justify-between gap-3 hover:border-gold transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="relative w-8 h-11 rounded bg-navy/10 overflow-hidden shrink-0 border border-border">
                    {book.cover_url ? <Image src={book.cover_url} alt={book.title} fill className="object-cover" /> : null}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-serif font-bold text-xs text-navy truncate">{book.title}</p>
                    <p className="text-[10px] text-foreground-muted">{book.price_paper.toLocaleString("fr-FR")} XOF</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddBook(book)}
                  className="px-2.5 py-1.5 rounded-xl bg-navy text-white text-[11px] font-bold hover:bg-navy-hover transition-colors shrink-0"
                >
                  + Ajouter
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-navy text-white">
          <div>
            <p className="text-xs text-slate-300">Total de la Commande Campus</p>
            <p className="text-xl font-serif font-bold text-gold">
              {totalAmount.toLocaleString("fr-FR")} XOF
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || selectedItems.length === 0}
            className="px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
          >
            {loading ? (
              <InlineLoader size={16} />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Transmettre le Bon de Commande</span>
          </button>
        </div>
      </form>
    </div>
  );
}
