"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAuthorSubmissions } from "@/lib/services/author";
import { AuthorSubmission } from "@/lib/types/author";
import { 
  ArrowLeft, 
  PenTool, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Upload, 
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function SubmissionDetailPage() {
  const params = useParams();
  const [submission, setSubmission] = useState<AuthorSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmission() {
      try {
        setLoading(true);
        const subs = await getAuthorSubmissions();
        const found = subs.find((s) => s.id === params.id) || subs[0];
        setSubmission(found);
      } catch (err) {
        console.error("Erreur de chargement du dépôt", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmission();
  }, [params.id]);

  if (loading || !submission) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-lg" />
        <div className="h-64 bg-background-secondary rounded-2xl border border-border" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-4">
        <Link href="/author/submissions" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la liste des dépôts
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} />
          <span className="text-xs font-bold text-gold uppercase tracking-wider bg-navy/5 px-2 py-0.5 rounded border border-gold/20">
            {submission.version_type}
          </span>
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy pt-1">
          {submission.title}
        </h1>
      </div>

      {/* 1. Suivi du Workflow de Validation (Section 5.5 & 3.3.2) */}
      <div className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs">
        <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          Étapes de Validation Éditoriale
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-navy text-white space-y-1">
            <span className="text-[10px] text-gold font-bold block uppercase">Étape 1</span>
            <strong className="block">Dépôt Réceptionné</strong>
            <p className="text-[10px] text-white/70">Fichier : {submission.file_name}</p>
          </div>

          <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1">
            <span className="text-[10px] text-foreground-muted font-bold block uppercase">Étape 2</span>
            <strong className="block text-navy">Contrôle Automatique IA</strong>
            <p className="text-[10px] text-foreground-muted">Vérification de format & plagiat</p>
          </div>

          <div className={submission.status === "changes_requested" ? "p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning space-y-1" : "p-3 rounded-xl bg-background-secondary border border-border space-y-1"}>
            <span className="text-[10px] font-bold block uppercase">Étape 3</span>
            <strong className="block">Comité de Lecture</strong>
            <p className="text-[10px]">Examen par le Chef Maquettiste</p>
          </div>

          <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1 opacity-60">
            <span className="text-[10px] text-foreground-muted font-bold block uppercase">Étape 4</span>
            <strong className="block text-navy">Publication Catalogue</strong>
            <p className="text-[10px] text-foreground-muted">Mise en ligne académique</p>
          </div>
        </div>
      </div>

      {/* 2. Historique des Commentaires Éditoriaux */}
      {submission.feedback_history && submission.feedback_history.length > 0 && (
        <div className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs">
          <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold" />
            Remarques du Comité Éditiorial LAHA Éditions
          </h2>

          <div className="space-y-3">
            {submission.feedback_history.map((fb, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-warning font-bold">
                  <span>{fb.author_role}</span>
                  <span className="text-[10px] font-medium">{fb.date}</span>
                </div>
                <p className="text-foreground leading-relaxed">
                  &ldquo;{fb.message}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Soumission d'une nouvelle version corrigée */}
      <div className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs">
        <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
          <Upload className="w-5 h-5 text-gold" />
          Soumettre une Version Corrigée
        </h2>
        <p className="text-xs text-foreground-muted">
          Si l&apos;équipe éditoriale a demandé des ajustements sur votre manuscrit, vous pouvez téléverser un fichier révisé ci-dessous.
        </p>

        <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-gold transition-colors bg-background-secondary">
          <Upload className="w-6 h-6 text-gold mx-auto mb-2" />
          <p className="text-xs font-semibold text-navy">Glisser-déposer la version révisée (PDF/EPUB/DOCX)</p>
        </div>
      </div>
    </div>
  );
}
