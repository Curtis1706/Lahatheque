"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { getStudentCatalog } from "@/lib/services/student";
import { createOrder, type OrderItemPayload } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";
import { InlineLoader } from "@/components/ui/page-loader";

interface CartItem {
  ouvrage_id: string;
  title: string;
  cover_url?: string;
  unit_price: number;
  quantity: number;
  format_type: "digital" | "paper";
}

const SHIPPING_FEE = 2500; // XOF — frais de livraison forfaitaires livre papier

export default function OrderCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [books, setBooks] = useState<BookAPI[]>([]);
  const [disciplines, setDisciplines] = useState<{ id: string; name: string }[]>([]);
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
  const shippingTotal = hasPaperItem ? SHIPPING_FEE : 0;
  const total = subtotal + shippingTotal;

  function handleAddToCart() {
    const book = books.find((b) => b.id === selectedBookId);
    if (!book) {
      toast.error("Sélectionnez un ouvrage.");
      return;
    }
    // price_paper pour le papier, price_digital (ou price) pour le numérique
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
          unit_price: unitPrice,
          quantity,
          format_type: selectedFormat,
        },
      ];
    });
    setSelectedBookId("");
    setQuantity(1);
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
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

      // Mobile Money → rediriger vers Moneroo
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      toast.success("Commande créée. Un agent LAHA Éditions vous contactera pour finaliser le règlement.");
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
      className="bg-background border border-border rounded-2xl p-5 sm:p-6 space-y-6"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gold" aria-hidden="true" />
          Création de nouvelle commande
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl hover:bg-background-secondary transition-colors"
          title="Fermer le formulaire"
          aria-label="Fermer le formulaire"
        >
          <X className="w-4 h-4 text-foreground-muted" />
        </button>
      </div>

      {/* ── Section 1 — Sélection des articles ─────────────────────────── */}
      <section aria-labelledby="section-articles" className="space-y-4">
        <h3
          id="section-articles"
          className="text-xs font-bold text-foreground-muted uppercase tracking-wider"
        >
          Sélection des articles
        </h3>

        {/* Filtres + sélecteur */}
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          {/* Filtre discipline */}
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-foreground flex-1 min-w-[140px]"
            aria-label="Filtrer par matière"
          >
            <option value="all">Toutes matières</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Sélecteur ouvrage */}
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-foreground flex-[2] min-w-[200px]"
            disabled={loading}
            aria-label="Choisir un ouvrage"
          >
            <option value="">
              {loading ? "Chargement…" : "-- Choisir un ouvrage --"}
            </option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          {/* Format */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as "digital" | "paper")}
            className="px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-foreground"
            aria-label="Format"
          >
            <option value="paper">Papier</option>
            <option value="digital">Numérique</option>
          </select>

          {/* Quantité */}
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary font-mono text-foreground"
            aria-label="Quantité"
          />

          {/* Bouton Ajouter */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="px-4 py-2.5 rounded-xl bg-gold text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 justify-center min-h-[44px]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Ajouter
          </button>
        </div>

        {/* Tableau panier */}
        <div className="border border-border rounded-xl overflow-hidden">
          {cart.length === 0 ? (
            <p className="text-xs text-foreground-muted text-center py-6">
              Aucun article dans le panier
            </p>
          ) : (
            <>
              {/* Desktop — table */}
              <table className="w-full text-xs hidden lg:table">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold text-foreground-muted">Livre</th>
                    <th className="text-right px-3 py-2 font-bold text-foreground-muted">Prix</th>
                    <th className="text-right px-3 py-2 font-bold text-foreground-muted">Quantité</th>
                    <th className="text-right px-3 py-2 font-bold text-foreground-muted">Montant</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-navy font-semibold">
                        {item.title}
                        <span className="ml-1.5 text-[10px] text-foreground-muted font-normal">
                          ({item.format_type === "paper" ? "Papier" : "Numérique"})
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground-muted">
                        {item.unit_price.toLocaleString("fr-FR")} XOF
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-navy">
                        {(item.unit_price * item.quantity).toLocaleString("fr-FR")} XOF
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          title="Supprimer cet article"
                          aria-label={`Supprimer ${item.title}`}
                          className="p-1 rounded hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-error" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile — cartes empilées */}
              <div className="lg:hidden divide-y divide-border">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{item.title}</p>
                      <p className="text-[11px] text-foreground-muted">
                        {item.format_type === "paper" ? "Papier" : "Numérique"} ·{" "}
                        {item.quantity} × {item.unit_price.toLocaleString("fr-FR")} XOF
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold font-mono text-navy">
                        {(item.unit_price * item.quantity).toLocaleString("fr-FR")} XOF
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        title="Supprimer cet article"
                        aria-label={`Supprimer ${item.title}`}
                        className="p-1 rounded hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Récapitulatif — SANS TVA */}
        {cart.length > 0 && (
          <div className="space-y-1 text-right pt-1">
            <p className="text-xs text-foreground-muted">
              Sous-total :{" "}
              <span className="font-mono">{subtotal.toLocaleString("fr-FR")} XOF</span>
            </p>
            {hasPaperItem && (
              <p className="text-xs text-foreground-muted">
                Frais de livraison :{" "}
                <span className="font-mono">{shippingTotal.toLocaleString("fr-FR")} XOF</span>
              </p>
            )}
            <p className="text-sm font-bold text-gold">
              Total : {total.toLocaleString("fr-FR")} XOF
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2 — Détails de la commande ─────────────────────────── */}
      <section aria-labelledby="section-details" className="space-y-3">
        <h3
          id="section-details"
          className="text-xs font-bold text-foreground-muted uppercase tracking-wider"
        >
          Détails de la commande
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="type-commande"
              className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block mb-1"
            >
              Type de commande
            </label>
            <select
              id="type-commande"
              value={typeCommande}
              onChange={(e) => setTypeCommande(e.target.value as typeof typeCommande)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-foreground"
            >
              <option value="rentree_scolaire">Rentrée scolaire</option>
              <option value="personnel">Personnel</option>
              <option value="institutionnel">Institutionnel</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mode-paiement"
              className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block mb-1"
            >
              Mode de règlement
            </label>
            <select
              id="mode-paiement"
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as typeof modePaiement)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary text-foreground"
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="virement">Virement bancaire</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
            </select>
            {modePaiement !== "mobile_money" && (
              <p className="text-[10px] text-gold mt-1.5">
                Règlement hors ligne — un agent LAHA Éditions vous contactera pour finaliser.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3 — Coordonnées de Livraison (bandeau navy) ─────────── */}
      {hasPaperItem && (
        <section
          aria-labelledby="section-livraison"
          className="bg-navy text-white rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <h3
            id="section-livraison"
            className="text-xs font-bold uppercase tracking-wider text-gold"
          >
            Coordonnées de Livraison
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="date-livraison"
                className="text-[11px] font-semibold block mb-1"
              >
                Date souhaitée
              </label>
              <input
                id="date-livraison"
                type="date"
                value={dateLivraison}
                onChange={(e) => setDateLivraison(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="heure-debut"
                className="text-[11px] font-semibold block mb-1"
              >
                De
              </label>
              <input
                id="heure-debut"
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="heure-fin"
                className="text-[11px] font-semibold block mb-1"
              >
                À
              </label>
              <input
                id="heure-fin"
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="shipping-address"
              className="text-[11px] font-semibold block mb-1"
            >
              Adresse de livraison
            </label>
            <textarea
              id="shipping-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              placeholder="Quartier, rue, repère..."
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 resize-none"
            />
          </div>
        </section>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[44px]"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting || cart.length === 0}
          className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-h-[44px]"
        >
          {submitting ? (
            <InlineLoader size={16} />
          ) : null}
          {submitting ? "Création en cours…" : "Créer la commande"}
        </button>
      </div>
    </form>
  );
}
