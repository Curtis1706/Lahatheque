"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Key,
  Copy,
  Check,
  Download,
  FileText,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Clock,
  Building2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  getBouquetCredentials,
  BouquetPostPaymentCredentials,
} from "@/lib/services/university";

export default function UniversityBouquetSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subscriptionId = searchParams.get("subscription_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BouquetPostPaymentCredentials | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!subscriptionId) {
      setError("Identifiant de souscription manquant dans l'URL.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadCredentials() {
      setLoading(true);
      try {
        const result = await getBouquetCredentials(subscriptionId as string);
        if (isMounted) {
          if (result) {
            setData(result);
          } else {
            setError("Impossible de charger les identifiants pour cette souscription.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Erreur lors de la récupération des identifiants.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCredentials();
    return () => {
      isMounted = false;
    };
  }, [subscriptionId]);

  const handleCopy = (textToCopy: string, keyName: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(textToCopy);
    if (keyName === "env") {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadEnvFile = () => {
    if (!data) return;
    const blob = new Blob([data.env_content || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.suggested_filename || "lahatheque-api-credentials.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdfGuide = () => {
    window.open("/api/bff/partners/university/guides/catalog-only-pdf/", "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="h-10 w-10 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-playfair font-bold text-navy">Finalisation de votre souscription...</h2>
        <p className="text-sm font-poppins text-muted-foreground mt-2">
          Validation de la transaction Moneroo et émission sécurisée de vos identifiants d'API.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 bg-card border border-border rounded-xl shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-playfair font-bold text-navy mb-2">Souscription Introuvable</h1>
        <p className="text-sm font-poppins text-muted-foreground mb-6">
          {error || "Nous n'avons pas pu retrouver les informations de votre souscription."}
        </p>
        <Link
          href="/university/bouquets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-primary-foreground font-poppins text-sm font-medium hover:bg-navy-hover transition-colors"
        >
          Retour aux bouquets
        </Link>
      </div>
    );
  }

  const isMonthly = data.subscription_period === "monthly";
  const periodLabel = isMonthly ? "Formule Mensuelle (30 jours)" : "Formule Annuelle (365 jours)";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 font-poppins space-y-8">
      {/* ── Bandeau de Succès ── */}
      <div className="bg-gradient-to-b from-card to-background-secondary border border-border rounded-2xl p-6 sm:p-8 text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4 text-gold">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold bg-gold/10 px-3 py-1 rounded-full mb-2">
          Paiement Confirmé &bull; Accès Activé
        </span>

        <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-navy mb-3">
          Félicitations pour votre souscription !
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6">
          Votre établissement <span className="font-semibold text-foreground">{data.institution_name}</span> bénéficie désormais de l'accès officiel au bouquet documentaire académique.
        </p>

        {/* Récapitulatif Clé */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto bg-card p-4 rounded-xl border border-border text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy/5 text-navy">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bouquet souscrit</p>
              <p className="text-sm font-semibold text-foreground truncate" title={data.offering_title}>
                {data.offering_title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy/5 text-navy">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Formule</p>
              <p className="text-sm font-semibold text-foreground">{periodLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validité de l'accès</p>
              <p className="text-sm font-semibold text-gold">
                {data.end_date ? `Jusqu'au ${data.end_date}` : "Actif"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Boîte des Identifiants d'API ── */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-navy text-gold">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-playfair font-bold text-navy">
                Identifiants API &bull; Mode Catalogue Seul
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Clé unique cumulée Machine-to-Machine pour votre portail étudiant ou LMS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadEnvFile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-gold/50 text-foreground text-xs sm:text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4 text-gold" />
              Télécharger .env (.txt)
            </button>
            <button
              onClick={handleDownloadPdfGuide}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-primary-foreground hover:bg-navy-hover text-xs sm:text-sm font-medium transition-colors"
            >
              <FileText className="h-4 w-4 text-gold" />
              Guide PDF
            </button>
          </div>
        </div>

        {/* Message d'avertissement de sécurité si nouvelle clé */}
        {data.is_new && data.client_secret && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Attention : ce secret ne sera affiché qu'une seule fois.</p>
              <p className="mt-0.5 text-muted-foreground">
                Copiez immédiatement votre clé secrète ou téléchargez le fichier texte avant de quitter cette page. Conformément aux normes de sécurité, nous ne conservons que son empreinte SHA-256 hachée.
              </p>
            </div>
          </div>
        )}

        {!data.is_new && (
          <div className="p-4 rounded-xl bg-navy/5 border border-navy/20 flex items-start gap-3 text-foreground text-xs sm:text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-gold mt-0.5" />
            <div>
              <p className="font-semibold text-navy">Application Partenaire existante mise à jour</p>
              <p className="mt-0.5 text-muted-foreground">
                Votre établissement dispose déjà d'une clé API active. Le périmètre du nouveau bouquet y a été rattaché automatiquement sans modification de vos identifiants actuels.
              </p>
            </div>
          </div>
        )}

        {/* Champs Clé Client */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Client ID
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background-secondary border border-border px-4 py-2.5 rounded-lg font-mono text-xs sm:text-sm text-foreground overflow-x-auto select-all">
                {data.client_id || "Non disponible"}
              </div>
              {data.client_id && (
                <button
                  onClick={() => handleCopy(data.client_id!, "client_id")}
                  className="px-3 py-2.5 rounded-lg border border-border hover:bg-background-secondary text-foreground text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  title="Copier le Client ID"
                >
                  {copiedKey === "client_id" ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Client Secret {data.is_new ? "(en clair)" : "(sécurisé)"}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background-secondary border border-border px-4 py-2.5 rounded-lg font-mono text-xs sm:text-sm text-foreground overflow-x-auto select-all">
                {data.client_secret || (data.client_secret_last4 ? `••••••••••••••••••••••••••••••••${data.client_secret_last4}` : "Secret déjà configuré sur votre serveur")}
              </div>
              {data.client_secret && (
                <button
                  onClick={() => handleCopy(data.client_secret!, "client_secret")}
                  className="px-3 py-2.5 rounded-lg border border-border hover:bg-background-secondary text-foreground text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  title="Copier le Client Secret"
                >
                  {copiedKey === "client_secret" ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bloc .env formaté */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bloc de configuration .env prêt à l'emploi
            </label>
            <button
              onClick={() => handleCopy(data.env_content, "env")}
              className="text-xs text-gold hover:underline flex items-center gap-1"
            >
              {copiedEnv ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Bloc copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copier le bloc complet</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-navy-dark text-slate-200 font-mono text-xs border border-border overflow-x-auto leading-relaxed">
            {data.env_content}
          </pre>
        </div>
      </div>

      {/* ── Prochaines Étapes & Liens Rapides ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-navy/5 text-navy flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-playfair font-bold text-navy text-base">Consulter le Guide d'Intégration</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Découvrez comment interroger l'API du catalogue, instancier des sessions de lecture éphémères et personnaliser l'habillage graphique de la liseuse.
          </p>
          <button
            onClick={handleDownloadPdfGuide}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline pt-1"
          >
            Télécharger le guide PDF officiel <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-playfair font-bold text-navy text-base">Explorer le Catalogue Campus</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Vérifiez immédiatement les ouvrages désormais ouverts à votre établissement dans votre catalogue connecté.
          </p>
          <Link
            href="/university/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline pt-1"
          >
            Accéder au catalogue partenaire <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Pied de page action */}
      <div className="text-center pt-4">
        <Link
          href="/university/bouquets"
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground font-medium underline"
        >
          Retour à la gestion des bouquets documentaires
        </Link>
      </div>
    </div>
  );
}
