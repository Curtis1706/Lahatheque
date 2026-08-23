# FICHE DE CORRECTION — Achat Numérique Réel, Clarté UX Numérique/Papier, Erreurs Backend, Page Count

**4 fiches — Prompts Antigravity prêts à exécuter**

---

## Rappel du principe (conforme au Cahier des Charges)

Chaque ouvrage a **deux versions indépendantes, avec deux prix distincts** :
- **Numérique** (`price_digital`) → paiement = accès perpétuel immédiat à la liseuse, aucun stock impliqué.
- **Papier** (`price_paper`) → paiement = déclenche le circuit physique complet (stock, réservation, préparation par le Gestionnaire, livraison, notification).

Le problème actuel : le bouton d'achat numérique est un **stub visuel** qui n'appelle jamais le backend. Seul l'achat papier fonctionne réellement. L'UX ne distingue pas assez les deux prix ni les deux parcours.

---

## FICHE E1 — Rendre l'achat numérique réellement fonctionnel

### Le problème
Sur `student/catalog/[id]/page.tsx`, le bouton "Achat Numérique" :
```tsx
onClick={() => toast.info(`Achat numérique initié pour ${book.price_digital} XOF`)}
```
n'appelle jamais `createOrder()`. Aucun étudiant n'a jamais pu réellement acheter un livre numérique.

### Fichier concerné
- `lahatheque-frontend/app/(dashboard)/student/catalog/[id]/page.tsx`

### Prompt Antigravity

```
CONTEXTE :
Fichier `app/(dashboard)/student/catalog/[id]/page.tsx` du frontend Next.js 16 de LAHAThèque.
Le bouton "Achat Numérique" (ligne ~138) n'appelle jamais le backend — il affiche juste un
toast. Il faut le connecter à createOrder() du service commerce-orders.ts, avec format_type
"digital" (pas de livraison, pas d'adresse requise).

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans le composant StudentBookDetailPage, ajouter un état de chargement pour l'achat numérique

Après la ligne `const [showPaper, setShowPaper] = useState(false);`, AJOUTER :
```typescript
  const [buyingDigital, setBuyingDigital] = useState(false);
```

### 2. Ajouter la fonction handleBuyDigital, juste après handleConfirmPaper :

```typescript
  const handleBuyDigital = async () => {
    if (!book) return;
    setBuyingDigital(true);
    try {
      const result = await createOrder({
        items: [{ ouvrage_id: book.id, format_type: "digital", quantity: 1 }],
        type_commande: "personnel",
        mode_paiement: "mobile_money",
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      toast.success("Achat numérique confirmé ! Vous avez maintenant accès à cet ouvrage.");
      // Recharge l'accès pour afficher immédiatement le bouton "Ouvrir la liseuse"
      const refreshed = await getStudentBookDetail(bookId);
      setBook(refreshed.ouvrage);
      setAccess(refreshed.access);
      setProgress(refreshed.reading_progress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'achat numérique.";
      toast.error(msg);
    } finally {
      setBuyingDigital(false);
    }
  };
```

### 3. Passer cette fonction et l'état de chargement au composant AccessBlock

TROUVER l'appel du composant `<AccessBlock ... />` dans le JSX principal (généralement dans le
`return` final de `StudentBookDetailPage`) et AJOUTER les deux props :
```tsx
onBuyDigital={handleBuyDigital}
buyingDigital={buyingDigital}
```

### 4. Modifier la signature du composant AccessBlock

TROUVER :
```typescript
function AccessBlock({
  access,
  book,
  onOpenSample,
  onOpenPaper,
}: {
  access: { access_granted: boolean; reason: string; stream_url?: string; error?: string };
  book: BookAPI;
  onOpenSample: () => void;
  onOpenPaper: () => void;
}) {
```

REMPLACER par :
```typescript
function AccessBlock({
  access,
  book,
  onOpenSample,
  onOpenPaper,
  onBuyDigital,
  buyingDigital,
}: {
  access: { access_granted: boolean; reason: string; stream_url?: string; error?: string };
  book: BookAPI;
  onOpenSample: () => void;
  onOpenPaper: () => void;
  onBuyDigital: () => void;
  buyingDigital: boolean;
}) {
```

### 5. Remplacer le bouton "Achat Numérique" factice

TROUVER :
```tsx
        {/* Achat numérique */}
        {book.price_digital > 0 && (
          <button
            type="button"
            onClick={() => toast.info(`Achat numérique initié pour ${book.price_digital} XOF`)}
            className="p-4 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left space-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                Achat Numérique
              </span>
              <span className="text-xs font-bold font-mono text-gold">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Accès perpétuel sur liseuse et applications mobiles.
            </p>
          </button>
        )}
```

REMPLACER par :
```tsx
        {/* Achat numérique — RÉELLEMENT fonctionnel */}
        {book.price_digital > 0 && (
          <button
            type="button"
            onClick={onBuyDigital}
            disabled={buyingDigital}
            className="p-4 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left space-y-1 transition-all disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                {buyingDigital ? "Traitement en cours..." : "Acheter la Version Numérique"}
              </span>
              <span className="text-xs font-bold font-mono text-gold">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Accès perpétuel immédiat sur la liseuse sécurisée — aucune expédition.
            </p>
          </button>
        )}
```

NE PAS MODIFIER le bouton "Livre Papier Physique" ni le bloc "Bouquet campus" dans cette fiche.
```

---

## FICHE E2 — Clarté visuelle : afficher les deux prix, libeller le bouton papier en clair

### Le problème
1. La carte catalogue (`student/catalog/page.tsx`) n'affiche QUE `price_digital`, jamais `price_paper` — l'étudiant ne voit qu'un seul prix alors que deux existent.
2. Le bouton de commande papier sur cette même carte n'est qu'une icône sans texte (juste un `title` HTML invisible).

### Fichier concerné
- `lahatheque-frontend/app/(dashboard)/student/catalog/page.tsx`

### Prompt Antigravity

```
CONTEXTE :
Fichier `app/(dashboard)/student/catalog/page.tsx`. La carte de chaque livre du catalogue
n'affiche que le prix numérique (price_digital), jamais le prix papier (price_paper), et le
bouton pour commander en papier n'est qu'une icône sans libellé visible.

CE QU'IL FAUT FAIRE — EXACTEMENT :

TROUVER le bloc (lignes ~95-125) :
```tsx
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
        <div>
          {book.price_digital > 0 ? (
            <p className="font-mono font-bold text-gold text-xs sm:text-sm">
              {book.price_digital.toLocaleString("fr-FR")} XOF
            </p>
          ) : (
            <span className="text-xs font-bold text-success">Accès libre</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => onOpenSample(book)}
            className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-navy"
            title="Consulter l'extrait gratuit (15 pages)"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
          </button>

          {book.price_paper > 0 && (
            <button
              type="button"
              onClick={() => onOpenPaperOrder(book)}
              className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-navy"
              title="Commander la version papier physique"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            </button>
          )}

          <Link
            href={`/student/catalog/${book.id}`}
            className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[38px] shadow-xs"
          >
            <Play className="w-3 h-3 text-gold fill-gold" />
            Détail
          </Link>
        </div>
      </div>
```

REMPLACER par :
```tsx
      <div className="flex flex-col gap-3 pt-3 border-t border-border">
        {/* Double affichage des prix — numérique ET papier, clairement labellisés */}
        <div className="flex items-center gap-4 flex-wrap">
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

          {book.price_paper > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-foreground-muted">Papier</span>
              <span className="font-mono font-bold text-navy text-xs sm:text-sm">
                {book.price_paper.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenSample(book)}
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-navy text-[11px] font-semibold flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            Extrait
          </button>

          {book.price_paper > 0 && (
            <button
              type="button"
              onClick={() => onOpenPaperOrder(book)}
              className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-navy text-[11px] font-semibold flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
              Commander (Papier)
            </button>
          )}

          <Link
            href={`/student/catalog/${book.id}`}
            className="ml-auto px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[38px] shadow-xs"
          >
            <Play className="w-3 h-3 text-gold fill-gold" />
            Détail &amp; Achat
          </Link>
        </div>
      </div>
```

NE PAS MODIFIER le reste de la carte (couverture, titre, résumé, discipline).
```

---

## FICHE E3 — Afficher le vrai message d'erreur backend (stock insuffisant, etc.)

### Le problème
`PaperOrderModal` avale le message d'erreur réel renvoyé par le backend (ex: "Stock insuffisant pour...") et affiche systématiquement un texte générique "Une erreur est survenue lors de l'enregistrement de votre commande." L'utilisateur ne comprend jamais pourquoi sa commande échoue.

### Fichier concerné
- `lahatheque-frontend/components/features/student/paper-order-modal.tsx`

### Prompt Antigravity

```
CONTEXTE :
Fichier `components/features/student/paper-order-modal.tsx`. Le catch de handleConfirm affiche
un message générique au lieu du message d'erreur réel renvoyé par onConfirmOrder (qui vient
lui-même du backend via createOrder()).

CE QU'IL FAUT FAIRE — EXACTEMENT :

TROUVER :
```typescript
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison complète.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmOrder(book.id, book.title, unitPrice, shippingAddress, quantity);
      toast.success(`Commande de ${quantity} exemplaire(s) enregistrée avec succès !`);
      onClose();
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement de votre commande.");
    } finally {
      setSubmitting(false);
    }
  };
```

REMPLACER par :
```typescript
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison complète.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmOrder(book.id, book.title, unitPrice, shippingAddress, quantity);
      toast.success(`Commande de ${quantity} exemplaire(s) enregistrée avec succès !`);
      onClose();
    } catch (err: unknown) {
      // Le message réel (ex: "Stock insuffisant pour...") vient du backend via onConfirmOrder.
      // On ne le réaffiche pas ici pour éviter un double toast — onConfirmOrder l'affiche déjà.
      // On garde seulement un filet de sécurité si aucun message n'a été fourni.
      if (!(err instanceof Error) || !err.message) {
        toast.error("Une erreur est survenue lors de l'enregistrement de votre commande.");
      }
    } finally {
      setSubmitting(false);
    }
  };
```

Dans `app/(dashboard)/student/catalog/page.tsx` ET `app/(dashboard)/student/catalog/[id]/page.tsx`,
vérifier que `handleConfirmPaper` affiche bien déjà le message réel via `toast.error(msg)` avant
de relancer l'erreur (`throw err`) — c'est déjà le cas dans le code actuel, aucune modification
nécessaire dans ces deux fichiers pour cette fiche.
```

---

## FICHE E4 — Calculer et enregistrer le nombre de pages à l'upload

### Le problème
`OuvrageCreateSerializer.create()` (flux de dépôt maquettiste) ne renseigne jamais `page_count`. Chaque nouvel ouvrage affiche "Page X / 0" dans la liseuse.

### Fichier concerné
- `lahatheque-backend/apps/catalog/serializers.py`

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. `OuvrageCreateSerializer.create()` (apps/catalog/serializers.py)
crée l'Ouvrage mais ne calcule jamais `page_count`. Il faut extraire le nombre de pages du
fichier PDF déposé et l'enregistrer, en utilisant PyMuPDF (fitz) qui est déjà une dépendance
du projet (utilisé par le moteur de filigrane).

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans `apps/catalog/serializers.py`, méthode `OuvrageCreateSerializer.create()`, TROUVER :

```python
        if book_file:
            ouvrage.file = book_file
            ouvrage.file_size_bytes = book_file.size
            ouvrage.save(update_fields=['file', 'file_size_bytes'])
```

REMPLACER par :

```python
        if book_file:
            ouvrage.file = book_file
            ouvrage.file_size_bytes = book_file.size

            # Calcul du nombre de pages réel pour les fichiers PDF
            page_count = 0
            try:
                if book_file.name.lower().endswith('.pdf'):
                    import fitz  # PyMuPDF
                    book_file.seek(0)
                    file_bytes = book_file.read()
                    book_file.seek(0)
                    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                        page_count = doc.page_count
            except Exception:
                page_count = 0  # Ne bloque jamais la création si l'extraction échoue

            ouvrage.page_count = page_count
            ouvrage.save(update_fields=['file', 'file_size_bytes', 'page_count'])
```

NE PAS MODIFIER le reste de la méthode `create()` (résolution discipline/institution, création
des BookAuthor, etc.).

Note : cette correction s'applique uniquement aux NOUVEAUX dépôts. Pour corriger les ouvrages
déjà créés avec page_count=0, un script de rattrapage ponctuel sera nécessaire — à faire
séparément si besoin (peut être exécuté une fois via `python manage.py shell`).
```

---

# RÉSUMÉ

| Fiche | Résumé | Impact |
|---|---|---|
| E1 | Achat numérique réellement fonctionnel (était un stub complet) | Débloque le cas d'usage principal du CDC |
| E2 | Les deux prix affichés et labellisés sur chaque carte catalogue, bouton papier en texte clair | Fin de la confusion 5000 vs 10000 |
| E3 | Le vrai message d'erreur backend s'affiche (ex: "Stock insuffisant") au lieu d'un message générique | L'utilisateur comprend pourquoi ça échoue |
| E4 | `page_count` calculé automatiquement à l'upload PDF | Fin du "Page X / 0" |

Après application : le parcours numérique (paiement → accès immédiat, zéro stock) et le parcours papier (paiement → réservation stock → préparation Gestionnaire → livraison → notification) sont enfin **tous les deux** réellement fonctionnels et clairement distingués pour l'utilisateur, conformément au cahier des charges.
