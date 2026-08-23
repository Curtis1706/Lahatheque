# FICHES CORRIGÉES — Disponibilité Papier & Commande Unifiée

**10 fiches — Corrige les 3 erreurs du plan original (mauvais fichier ciblé, pas de contrôle serveur, page détail oubliée)**

> Ces fiches REMPLACENT tout bouton d'achat existant (qu'il s'agisse de l'ancien stub ou des corrections précédentes E1-E4) par le nouveau flux unifié.

---

## FICHE F1 — Backend : champ `is_paper_available` sur le modèle

### Fichier concerné
- `lahatheque-backend/apps/catalog/models.py`

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. Le modèle Ouvrage n'a pas de champ pour distinguer "un prix papier
existe en base" de "le Chef Maquettiste a validé la disponibilité papier de cet ouvrage".

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/catalog/models.py, classe Ouvrage, TROUVER :
    price_paper = models.DecimalField(max_digits=10, decimal_places=2, default=7500.00)

AJOUTER juste après :
    is_paper_available = models.BooleanField(
        default=False,
        verbose_name="Disponible en version papier",
        help_text="Décision éditoriale du Chef Maquettiste — distincte du prix papier renseigné."
    )

Générer la migration :
python manage.py makemigrations catalog
```

---

## FICHE F2 — Backend : exposer le champ dans les serializers

### Fichiers concernés
- `lahatheque-backend/apps/student/serializers.py`

### Prompt Antigravity

```
CONTEXTE :
Le champ is_paper_available doit être visible dans le catalogue étudiant. OuvrageReadSerializer
(apps/catalog/serializers.py) utilise déjà fields='__all__' donc rien à faire côté admin.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/student/serializers.py, classe OuvrageBasicSerializer, TROUVER :
    class Meta:
        model = Ouvrage
        fields = [
            'id', 'isbn', 'title', 'subtitle', 'authors',
            'discipline_name', 'publisher_name', 'institution_name',
            'country', 'format_type', 'page_count', 'publication_date',
            'language', 'summary', 'status', 'price_digital', 'price_paper',
            'cover_url',

REMPLACER par (ajout de is_paper_available) :
    class Meta:
        model = Ouvrage
        fields = [
            'id', 'isbn', 'title', 'subtitle', 'authors',
            'discipline_name', 'publisher_name', 'institution_name',
            'country', 'format_type', 'page_count', 'publication_date',
            'language', 'summary', 'status', 'price_digital', 'price_paper',
            'is_paper_available', 'cover_url',

NE PAS MODIFIER le reste des champs de la liste après cover_url.
```

---

## FICHE F3 — Backend : le Chef Maquettiste fixe la disponibilité papier à la validation

### Fichier concerné
- `lahatheque-backend/apps/catalog/views.py` (ChiefLayoutValidationViewSet.validate_deposit)

### Prompt Antigravity

```
CONTEXTE :
validate_deposit (apps/catalog/views.py) initialise inconditionnellement une fiche de stock
pour CHAQUE ouvrage validé. Il faut récupérer is_paper_available depuis request.data, l'enregistrer,
et ne créer la fiche de stock QUE si is_paper_available est vrai.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/catalog/views.py, méthode validate_deposit, TROUVER :

        if 'price_paper' in request.data and request.data['price_paper'] is not None:
            try:
                ouvrage.price_paper = float(request.data['price_paper'])
            except (ValueError, TypeError):
                pass

        ouvrage.status = 'published'
        ouvrage.save()

REMPLACER par :

        if 'price_paper' in request.data and request.data['price_paper'] is not None:
            try:
                ouvrage.price_paper = float(request.data['price_paper'])
            except (ValueError, TypeError):
                pass

        ouvrage.is_paper_available = bool(request.data.get('is_paper_available', False))

        ouvrage.status = 'published'
        ouvrage.save()

TROUVER ensuite le bloc d'initialisation du stock (commence par
"# Initialisation automatique du stock physique") et ENTOURER tout ce bloc try/except d'une
condition :

        if ouvrage.is_paper_available:
            try:
                from apps.commerce.models import Entrepot, StockOuvrage
                entrepot = Entrepot.objects.first()
                if not entrepot:
                    entrepot = Entrepot.objects.create(
                        nom="Entrepôt Principal LAHA Cotonou",
                        code="WAR-CTN-01",
                        pays="Bénin",
                        ville="Cotonou",
                        adresse="Siège LAHA Éditions, Cotonou",
                        is_active=True
                    )
                StockOuvrage.objects.get_or_create(
                    ouvrage=ouvrage,
                    entrepot=entrepot,
                    defaults={
                        'quantite_reelle': 0,
                        'quantite_reservee': 0,
                        'seuil_alerte': 10
                    }
                )
            except Exception as stock_err:
                logger.warning(f"Impossible d'initialiser le stock pour l'ouvrage {ouvrage.id}: {stock_err}")

(indentation du bloc existant augmentée d'un niveau pour rentrer dans le if)

NE PAS MODIFIER reject_deposit ni les autres actions du ViewSet.
```

---

## FICHE F4 — Backend : contrôle serveur obligatoire (manquant dans le plan original)

### Fichier concerné
- `lahatheque-backend/apps/commerce/views.py` (CreateOrderView)

### Prompt Antigravity

```
CONTEXTE :
CreateOrderView.post vérifie déjà le stock disponible pour le format papier, mais ne vérifie
jamais si l'ouvrage est autorisé à la vente papier (is_paper_available). Un appel API direct
pourrait forcer format_type "paper" pour un ouvrage où le Chef a désactivé cette option — le
contrôle ne doit pas être seulement côté interface.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/commerce/views.py, méthode CreateOrderView.post, TROUVER :

            format_type = item['format_type']
            quantity = item['quantity']

            if format_type == 'paper':
                has_paper = True
                from django.db.models import Sum, F

REMPLACER par :

            format_type = item['format_type']
            quantity = item['quantity']

            if format_type == 'paper':
                has_paper = True

                if not getattr(ouvrage, 'is_paper_available', False):
                    return Response({
                        'error': f"« {ouvrage.title} » n'est pas disponible en version papier."
                    }, status=status.HTTP_400_BAD_REQUEST)

                from django.db.models import Sum, F

NE PAS MODIFIER le reste de la méthode.
```

---

## FICHE F5 — Frontend : mise à jour des types

### Fichiers concernés
- `lahatheque-frontend/lib/types/layout-artist.ts`
- `lahatheque-frontend/lib/services/student.ts` (interface BookAPI)

### Prompt Antigravity

```
CONTEXTE :
Ajouter is_paper_available aux types TypeScript concernés.

CE QU'IL FAUT FAIRE :

1. Dans lib/types/layout-artist.ts, interface LayoutDeposit, AJOUTER au niveau racine, à côté
   de default_price :
   is_paper_available?: boolean;

2. Dans lib/services/student.ts, interface BookAPI, AJOUTER à côté de price_paper :
   is_paper_available?: boolean;

Vérifier l'emplacement exact de ces interfaces avant modification.
```

---

## FICHE F6 — Frontend : validateDeposit transmet is_paper_available

### Fichier concerné
- `lahatheque-frontend/lib/services/layout-artist.ts`

### Prompt Antigravity

```
CONTEXTE :
La fonction validateDeposit envoie déjà comment/price_digital/price_paper. Ajouter
is_paper_available comme 5ème paramètre.

CE QU'IL FAUT FAIRE — EXACTEMENT :

TROUVER :
export async function validateDeposit(
  id: string,
  comment?: string,
  price_digital?: number,
  price_paper?: number
): Promise<boolean> {
  const res = await fetch(`/api/bff/catalog/deposits/${id}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comment, price_digital, price_paper }),
  });
  return res.ok;
}

REMPLACER par :
export async function validateDeposit(
  id: string,
  comment?: string,
  price_digital?: number,
  price_paper?: number,
  is_paper_available?: boolean
): Promise<boolean> {
  const res = await fetch(`/api/bff/catalog/deposits/${id}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comment, price_digital, price_paper, is_paper_available }),
  });
  return res.ok;
}
```

---

## FICHE F7 — Frontend : toggle "Disponible en papier" côté Chef Maquettiste

### Fichiers concernés
- `lahatheque-frontend/app/(dashboard)/chief-layout/validation/[id]/page.tsx`
- `lahatheque-frontend/components/features/chief-layout/chief-examination-modal.tsx` (selon lequel contient réellement les champs de prix)

### Prompt Antigravity

```
CONTEXTE :
Ajouter un toggle Oui/Non "Disponible en version papier physique" dans le bloc de décision de
validation du Chef Maquettiste. Quand désactivé, le champ prix papier est grisé.

CE QU'IL FAUT FAIRE :

1. Localiser lequel des deux fichiers contient réellement les champs price_digital/price_paper
   actuels — ajouter le toggle dans ce fichier-là.

2. Ajouter un état :
const [isPaperAvailable, setIsPaperAvailable] = useState(false);

3. Ajouter le toggle dans le JSX, avant ou après le champ prix papier :

<div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background-secondary">
  <div>
    <p className="text-xs font-bold text-navy">Disponible en version papier physique</p>
    <p className="text-[11px] text-foreground-muted">
      Active le prix papier et l'entrée en stock pour le Gestionnaire.
    </p>
  </div>
  <button
    type="button"
    onClick={() => setIsPaperAvailable((v) => !v)}
    className={`relative w-11 h-6 rounded-full transition-colors ${isPaperAvailable ? "bg-gold" : "bg-border"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPaperAvailable ? "translate-x-5" : ""}`} />
  </button>
</div>

4. Griser le champ prix papier existant avec disabled={!isPaperAvailable} et une opacité réduite
   conditionnelle.

5. Dans l'appel à validateDeposit(...), ajouter le 5ème argument :
await validateDeposit(deposit.id, comment, priceDigital, isPaperAvailable ? pricePaper : 0, isPaperAvailable);

(adapter les noms exacts des variables comment/priceDigital/pricePaper à ceux réellement
utilisés dans le fichier — les vérifier avant application).
```

---

## FICHE F8 — Frontend : la modale de commande unifiée (nouveau composant)

### Fichier concerné
- `lahatheque-frontend/components/features/student/unified-book-order-modal.tsx` (nouveau)

### Prompt Antigravity

```
CONTEXTE :
Nouvelle modale de commande unifiée LAHAThèque. Gère la sélection Numérique/Papier (papier
grisé si is_paper_available=false), le mode de paiement, l'adresse de livraison si papier,
l'appel à createOrder(), et la redirection immédiate vers la liseuse en cas d'achat numérique
réussi.

Le service createOrder() existe déjà dans lib/services/commerce-orders.ts et accepte :
{ items: [{ouvrage_id, format_type, quantity}], type_commande, mode_paiement,
  shipping_address?, city?, country? } et retourne { id, payment_url? }.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Créer components/features/student/unified-book-order-modal.tsx :

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, BookOpen, Truck, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";

type Format = "digital" | "paper";

export function UnifiedBookOrderModal({
  book,
  onClose,
  onOpenSample,
  onDigitalPurchaseSuccess,
}: {
  book: BookAPI;
  onClose: () => void;
  onOpenSample?: () => void;
  onDigitalPurchaseSuccess?: () => void;
}) {
  const router = useRouter();
  const paperAvailable = Boolean(book.is_paper_available) && (book.price_paper ?? 0) > 0;

  const [format, setFormat] = useState<Format>("digital");
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [modePaiement, setModePaiement] = useState<"mobile_money" | "virement" | "especes" | "carte">("mobile_money");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const unitPrice = format === "digital" ? book.price_digital : book.price_paper;
  const shippingFee = format === "paper" ? 2500 : 0;
  const total = (unitPrice ?? 0) * quantity + shippingFee;

  async function handleSubmit() {
    if (format === "paper" && !shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        items: [{ ouvrage_id: book.id, format_type: format, quantity }],
        type_commande: "personnel",
        mode_paiement: modePaiement,
        shipping_address: format === "paper" ? shippingAddress : undefined,
        city: "Cotonou",
        country: "BJ",
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      if (format === "digital") {
        setSuccess(true);
        onDigitalPurchaseSuccess?.();
      } else {
        toast.success(`Commande papier enregistrée (${quantity} exemplaire${quantity > 1 ? "s" : ""}).`);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la commande.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h3 className="font-serif text-lg font-bold text-navy">Achat confirmé !</h3>
          <p className="text-xs text-foreground-muted">
            « {book.title} » est maintenant disponible dans votre bibliothèque.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => router.push(`/catalog/reader/${book.id}`)}
              className="w-full px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover"
            >
              Ouvrir la liseuse maintenant
            </button>
            <button
              onClick={() => router.push("/student/books")}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary"
            >
              Aller à Ma Bibliothèque
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">{book.title}</h2>
            <p className="text-xs text-foreground-muted">
              {book.authors?.map((a) => `${a.first_name} ${a.last_name}`).join(", ") || "Auteur LAHA"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-background-secondary">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        {onOpenSample && (
          <button
            type="button"
            onClick={onOpenSample}
            className="text-[11px] text-gold font-semibold flex items-center gap-1.5 hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            Feuilleter l'extrait gratuit avant d'acheter
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat("digital")}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${format === "digital" ? "border-gold bg-gold/10" : "border-border bg-background-secondary"}`}
          >
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gold" />
              Numérique
            </span>
            <span className="block text-sm font-mono font-bold text-gold">
              {(book.price_digital ?? 0).toLocaleString("fr-FR")} XOF
            </span>
            <p className="text-[10px] text-foreground-muted">Accès immédiat dans votre bibliothèque.</p>
          </button>

          <button
            type="button"
            onClick={() => paperAvailable && setFormat("paper")}
            disabled={!paperAvailable}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all relative ${!paperAvailable ? "border-border bg-background-secondary opacity-50 cursor-not-allowed" : format === "paper" ? "border-gold bg-gold/10" : "border-border bg-background-secondary"}`}
          >
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-navy" />
              Papier
            </span>
            {paperAvailable ? (
              <>
                <span className="block text-sm font-mono font-bold text-navy">
                  {(book.price_paper ?? 0).toLocaleString("fr-FR")} XOF
                </span>
                <p className="text-[10px] text-foreground-muted">Livraison sous 24-48h.</p>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-error">
                Non disponible en version papier
              </span>
            )}
          </button>
        </div>

        {format === "paper" && (
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Quantité
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-navy font-bold">-</button>
              <span className="w-8 text-center font-mono font-bold">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-navy font-bold">+</button>
            </div>
          </div>
        )}

        {format === "paper" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Adresse de livraison complète
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
              placeholder="Quartier, rue, repère, ville..."
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary resize-none"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
            Mode de règlement
          </label>
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value as any)}
            className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary"
          >
            <option value="mobile_money">Mobile Money</option>
            <option value="virement">Virement bancaire</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte bancaire</option>
          </select>
        </div>

        <div className="p-3 rounded-xl bg-navy/5 border border-navy/20 space-y-1 text-right">
          {format === "paper" && (
            <p className="text-[11px] text-foreground-muted">
              Frais de livraison : {shippingFee.toLocaleString("fr-FR")} XOF
            </p>
          )}
          <p className="text-sm font-bold text-gold">Total : {total.toLocaleString("fr-FR")} XOF</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          {format === "digital" ? "Acheter maintenant" : "Confirmer la commande"}
        </button>
      </div>
    </div>
  );
}

Adapter le type book.authors selon la forme exacte retournée par BookAPI (vérifier avant
application si c'est un tableau d'objets {first_name, last_name} ou une chaîne déjà formatée).
```

---

## FICHE F9 — Frontend : bouton unique sur la carte catalogue (CORRIGE LE FICHIER CIBLE DU PLAN ORIGINAL)

### Fichier concerné
- `lahatheque-frontend/app/(dashboard)/student/catalog/page.tsx`

**Important : le plan original ciblait `components/features/student/book-card.tsx` et `book-list-item.tsx` — ces fichiers appartiennent à `/student/books` ("Ma Bibliothèque"), pas au catalogue. Le catalogue définit sa propre carte (`CatalogBookCard`) directement dans `student/catalog/page.tsx`. C'est ce fichier qu'il faut modifier.**

### Prompt Antigravity

```
CONTEXTE :
Remplacer tous les boutons de la carte catalogue (Extrait / Commander Papier / Détail) par un
bouton unique "Commander" ouvrant UnifiedBookOrderModal (Fiche F8), dans le composant
CatalogBookCard défini DIRECTEMENT dans app/(dashboard)/student/catalog/page.tsx.

CE QU'IL FAUT FAIRE :

1. Ajouter l'import :
import { UnifiedBookOrderModal } from "@/components/features/student/unified-book-order-modal";

2. Dans le composant parent qui liste les CatalogBookCard, ajouter un état :
const [orderModalBook, setOrderModalBook] = useState<BookAPI | null>(null);

3. Remplacer le bloc entier des boutons d'action de CatalogBookCard par :

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 flex-wrap">
          {book.price_digital > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-foreground-muted">Numérique</span>
              <span className="font-mono font-bold text-gold text-xs sm:text-sm">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-success">Accès libre</span>
          )}
          {book.is_paper_available && book.price_paper > 0 && (
            <span className="text-[10px] font-bold text-navy bg-navy/10 px-2 py-0.5 rounded-full">
              Disponible en papier
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenOrderModal(book)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[40px] shadow-xs"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-gold" />
          Commander
        </button>
      </div>

4. Passer onOpenOrderModal={(b) => setOrderModalBook(b)} en prop à CatalogBookCard (ajouter ce
   prop à sa signature si absent).

5. Rendre la modale conditionnellement, à la fin du JSX de la page :

      {orderModalBook && (
        <UnifiedBookOrderModal
          book={orderModalBook}
          onClose={() => setOrderModalBook(null)}
          onOpenSample={() => {
            setOrderModalBook(null);
            onOpenSample(orderModalBook);
          }}
        />
      )}

Le bouton "Détail" séparé peut être conservé à côté du bouton "Commander" si vous voulez garder
l'accès à la fiche complète — les deux sont compatibles.
```

---

## FICHE F10 — Frontend : aligner la page détail sur la même modale (ABSENT DU PLAN ORIGINAL)

### Fichier concerné
- `lahatheque-frontend/app/(dashboard)/student/catalog/[id]/page.tsx`

### Prompt Antigravity

```
CONTEXTE :
Sans cette fiche, la page détail garderait ses propres boutons séparés (Achat Numérique /
Commander en Papier) pendant que la liste catalogue (Fiche F9) utiliserait la modale unifiée —
incohérence entre les deux pages. Il faut aligner la page détail sur le même flux.

CE QU'IL FAUT FAIRE :

1. Ajouter l'import :
import { UnifiedBookOrderModal } from "@/components/features/student/unified-book-order-modal";

2. Ajouter un état dans StudentBookDetailPage :
const [showOrderModal, setShowOrderModal] = useState(false);

3. Dans le composant AccessBlock, remplacer la section des boutons d'achat (Achat Numérique +
   Livre Papier Physique) par un bouton unique :

        <button
          type="button"
          onClick={onOpenOrder}
          className="p-4 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left space-y-1 transition-all sm:col-span-2"
        >
          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Commander cet Ouvrage
          </span>
          <p className="text-[11px] text-foreground-muted">
            Choisissez le format numérique (accès immédiat) ou papier (si disponible).
          </p>
        </button>

4. Ajouter onOpenOrder: () => void à la signature du composant AccessBlock, et le passer depuis
   le parent : onOpenOrder={() => setShowOrderModal(true)}.

5. Rendre la modale à la fin du JSX principal :

      {showOrderModal && book && (
        <UnifiedBookOrderModal
          book={book}
          onClose={() => setShowOrderModal(false)}
          onOpenSample={() => {
            setShowOrderModal(false);
            setShowSample(true);
          }}
          onDigitalPurchaseSuccess={async () => {
            const refreshed = await getStudentBookDetail(bookId);
            setBook(refreshed.ouvrage);
            setAccess(refreshed.access);
            setProgress(refreshed.reading_progress);
          }}
        />
      )}

6. L'ancien PaperOrderModal et sa logique associée (showPaper, handleConfirmPaper) peuvent être
   retirés de ce fichier puisque UnifiedBookOrderModal les remplace entièrement — vérifier
   qu'aucune autre partie du fichier n'en dépend avant suppression.

NE PAS MODIFIER le bloc affiché quand access.access_granted === true (bouton "Ouvrir la
Liseuse Sécurisée") — celui qui possède déjà l'ouvrage n'a pas besoin de repasser par la modale.
```

---

# RÉSUMÉ — ORDRE D'EXÉCUTION

| Ordre | Fiche | Corrige quoi |
|---|---|---|
| 1 | F1 | Champ is_paper_available en base |
| 2 | F2 | Exposition dans le serializer catalogue étudiant |
| 3 | F3 | Chef Maquettiste fixe la disponibilité papier, stock créé seulement si activé |
| 4 | F4 | AJOUT — contrôle serveur, pas seulement l'UI |
| 5 | F5 | Types TypeScript |
| 6 | F6 | validateDeposit transmet le nouveau champ |
| 7 | F7 | Toggle visuel côté Chef Maquettiste |
| 8 | F8 | Modale de commande unifiée (nouveau composant) |
| 9 | F9 | CORRIGÉ — cible student/catalog/page.tsx, pas book-card.tsx |
| 10 | F10 | AJOUT — page détail alignée sur la même modale |

**Les 3 corrections apportées au plan original :** F9 cible le bon fichier ; F4 ajoute le contrôle serveur manquant ; F10 aligne la page détail, absente du plan original.
