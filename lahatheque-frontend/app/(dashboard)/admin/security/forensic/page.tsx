"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  UploadCloud,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Ban,
  RefreshCw,
  Clock,
  User,
  BookOpen,
  CreditCard,
  Building,
  FileText,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeForensicEvidence,
  mitigateForensicInfraction,
  getForensicReportDownloadUrl,
  getForensicInvestigationsHistory,
  type ForensicAnalysisResult,
} from "@/lib/services/protection";

export default function AdminForensicPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ForensicAnalysisResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modale de confirmation pour action de suspension
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isMitigating, setIsMitigating] = useState(false);

  // Glisser-déposer
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getForensicInvestigationsHistory();
      setHistory(data);
    } catch {
      // Échec silencieux pour l'historique
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const [analysisStep, setAnalysisStep] = useState<string>("");

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier PDF ou une image suspecte.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep("Transmission du fichier sécurisé vers le serveur backend...");
    const timer1 = setTimeout(() => {
      setAnalysisStep("Traitement de l'image & extraction OCR Tesseract en cours...");
    }, 1500);
    const timer2 = setTimeout(() => {
      setAnalysisStep("Analyse approfondie par vision et décodage de filigrane...");
    }, 5000);
    const timer3 = setTimeout(() => {
      setAnalysisStep("Corrélation croisée avec la base des comptes et traces de lecture...");
    }, 14000);

    try {
      const res = await analyzeForensicEvidence(selectedFile, notes);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setAnalysisResult(res);
      if (res.status === "identified") {
        toast.success("Analyse terminée : Lecteur source formellement identifié.");
      } else if (res.status === "inconclusive") {
        toast.warning("Analyse terminée : Empreintes partielles détectées.");
      } else {
        toast.info("Analyse terminée : Aucune trace LAHAThèque trouvée.");
      }
      loadHistory();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      toast.error(err.message || "Échec de l'analyse forensique.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleConfirmSuspension = async () => {
    if (!analysisResult) return;
    setIsMitigating(true);
    try {
      const res = await mitigateForensicInfraction(
        analysisResult.investigation_id,
        "suspend_user",
        suspendReason || "Fuite avérée détectée lors de l'investigation forensique."
      );
      toast.success(res.message);
      setShowSuspendModal(false);
      // Mettre à jour l'affichage local
      if (analysisResult.suspect_profile) {
        setAnalysisResult({
          ...analysisResult,
          suspect_profile: {
            ...analysisResult.suspect_profile,
            is_suspended: true,
            suspension_reason: suspendReason,
          },
          available_actions: {
            ...analysisResult.available_actions,
            can_suspend: false,
          },
        });
      }
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suspension du compte.");
    } finally {
      setIsMitigating(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!analysisResult) return;
    setIsMitigating(true);
    try {
      const res = await mitigateForensicInfraction(
        analysisResult.investigation_id,
        "revoke_sessions",
        "Révocation d'urgence suite à détection de fuite documentaire."
      );
      toast.success(res.message);
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la révocation des sessions.");
    } finally {
      setIsMitigating(false);
    }
  };

  const getCertaintyBadge = (score: number, status: string) => {
    if (status === "identified") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Identification Formelle ({score}%)</span>
        </div>
      );
    }
    if (status === "inconclusive") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Indices Partiels ({score}%)</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" />
        <span>Aucun Filigrane Valide (0%)</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* En-tête de section */}
      <div className="border-b border-border bg-background-secondary/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-1">
                <Link href="/admin/security/traces" className="hover:text-gold transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Traces d'Accès DRM</span>
                </Link>
                <span>/</span>
                <span className="text-gold font-semibold">Investigation Forensique</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-navy tracking-tight">
                Atelier Forensique & Détection de Fuites
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
                Extraction automatisée de tatouages invisibles, décodage de filigranes sur captures d'écran et traçabilité légale.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-navy text-white tracking-wide uppercase">
                Réservé Administration
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Zone de Dépôt de Fichier */}
        <div className="bg-background-secondary rounded-xl border border-border p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-gold/10 text-gold mb-1">
              <FileSearch className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Déposer le document ou l'extrait suspect
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-xl mx-auto">
              Glissez-déposez le fichier PDF fuité récupéré sur Internet, ou téléversez une capture d'écran / photo de smartphone d'une page de liseuse.
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                isDragging
                  ? "border-gold bg-gold/5 scale-[1.01]"
                  : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-gold/50 bg-background hover:bg-gold/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <UploadCloud
                  className={`w-10 h-10 ${
                    selectedFile ? "text-emerald-600" : isDragging ? "text-gold" : "text-foreground-muted"
                  }`}
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Fichier prêt : <span className="text-navy font-mono">{selectedFile.name}</span>
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Taille : {(selectedFile.size / 1024).toFixed(1)} Ko • Type : {selectedFile.type || "Binaire"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Cliquez pour parcourir ou déposez votre fichier ici
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Formats acceptés : PDF sécurisés, captures PNG/JPG, photographies smartphone (max 50 Mo)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Note contextuelle facultative */}
            <div className="text-left pt-2">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1">
                Contexte d'investigation (Facultatif)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Signalement Telegram, groupe étudiant UNSTIM, fuite sur forum public..."
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-gold"
              />
            </div>

            {/* Bouton d'action principal et statut temps réel */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!selectedFile || isAnalyzing}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-navy hover:bg-navy-hover text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                    <span>Inspection forensique en cours...</span>
                  </>
                ) : (
                  <>
                    <FileSearch className="w-4 h-4 text-gold" />
                    <span>Lancer l'analyse forensique</span>
                  </>
                )}
              </button>

              {isAnalyzing && analysisStep && (
                <div className="w-full max-w-md p-2.5 rounded-lg bg-navy/5 border border-gold/30 text-center animate-in fade-in duration-300">
                  <p className="text-xs font-medium text-navy flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-ping inline-block" />
                    <span>{analysisStep}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fiche de Résultat d'Enquête */}
        {analysisResult && (
          <div className="bg-background-secondary rounded-xl border border-border overflow-hidden shadow-sm animate-in fade-in duration-300">
            {/* Header Résultat */}
            <div className="border-b border-border bg-background p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold font-serif text-navy">
                    Résultats de l'Investigation Forensique
                  </h3>
                  {getCertaintyBadge(analysisResult.certainty_score, analysisResult.status)}
                </div>
                <p className="text-xs text-foreground-muted font-mono">
                  Dossier Réf: {analysisResult.investigation_id} • SHA-256: {analysisResult.file_hash.substring(0, 16)}...
                </p>
              </div>

              {/* Boutons d'Action Rapides */}
              <div className="flex flex-wrap items-center gap-2">
                {analysisResult.available_actions.can_download_report && (
                  <a
                    href={getForensicReportDownloadUrl(analysisResult.investigation_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-gold/10 hover:border-gold/40 text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Télécharger le Rapport Certifié (PDF)</span>
                  </a>
                )}

                {analysisResult.suspect_profile && (
                  <>
                    <button
                      type="button"
                      onClick={handleRevokeSessions}
                      disabled={isMitigating}
                      className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:border-red-500/30 text-xs font-medium text-red-600 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isMitigating ? "animate-spin" : ""}`} />
                      <span>Révoquer Sessions Actives</span>
                    </button>

                    {analysisResult.available_actions.can_suspend && (
                      <button
                        type="button"
                        onClick={() => setShowSuspendModal(true)}
                        disabled={isMitigating}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspendre le Compte du Lecteur</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Corps du Résultat : Grille 3 Colonnes */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Colonne 1 : Données Brutes Extraites */}
              <div className="bg-background rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider border-b border-border pb-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <span>Empreinte & Tatouage Détecté</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-foreground-muted block">Méthode de Détection :</span>
                    <span className="font-semibold text-foreground">
                      {analysisResult.analysis_mode === "pdf_steganography"
                        ? "Stéganographie Binaire PDF PyMuPDF"
                        : analysisResult.analysis_mode === "local_ocr"
                        ? "Prétraitement d'Image & OCR Local"
                        : analysisResult.analysis_mode === "multimodal_vision"
                        ? "Vision Multimodale Haute Précision"
                        : "Non Concluant"}
                    </span>
                  </div>

                  <div>
                    <span className="text-foreground-muted block">Signature Cryptographique :</span>
                    <span
                      className={`font-semibold ${
                        analysisResult.extracted_data.signature_valid
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {analysisResult.extracted_data.signature_valid
                        ? "Valide & Conforme (SHA-256)"
                        : "Absente ou Altérée"}
                    </span>
                  </div>

                  <div>
                    <span className="text-foreground-muted block">Adresse E-mail Détectée :</span>
                    <span className="font-mono text-navy font-medium">
                      {analysisResult.extracted_data.email || "Non extraite"}
                    </span>
                  </div>

                  <div>
                    <span className="text-foreground-muted block">Adresse IP Enregistrée :</span>
                    <span className="font-mono text-foreground font-medium">
                      {analysisResult.extracted_data.ip_address || "Non extraite"}
                    </span>
                  </div>

                  {analysisResult.extracted_data.raw_text_detected && (
                    <div>
                      <span className="text-foreground-muted block mb-1">Extrait Brut Lu :</span>
                      <pre className="p-2 rounded bg-background-secondary border border-border text-[11px] font-mono whitespace-pre-wrap break-all text-foreground-muted max-h-24 overflow-y-auto">
                        {analysisResult.extracted_data.raw_text_detected}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne 2 : Profil de l'Acheteur / Lecteur Suspect */}
              <div className="bg-background rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider border-b border-border pb-2">
                  <User className="w-4 h-4 text-gold" />
                  <span>Lecteur Identifié en Base</span>
                </div>

                {analysisResult.suspect_profile ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-foreground-muted block">Nom Complet :</span>
                      <span className="font-bold text-navy text-sm">
                        {analysisResult.suspect_profile.full_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-foreground-muted block">Adresse E-mail :</span>
                      <span className="font-mono text-foreground">
                        {analysisResult.suspect_profile.email}
                      </span>
                    </div>

                    <div>
                      <span className="text-foreground-muted block">Statut du Compte :</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          analysisResult.suspect_profile.is_suspended
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {analysisResult.suspect_profile.is_suspended
                          ? "COMPTE ACTUELLEMENT SUSPENDU"
                          : "Compte Actif"}
                      </span>
                    </div>

                    <div>
                      <span className="text-foreground-muted block">Rôle / Profil :</span>
                      <span className="font-medium capitalize text-foreground">
                        {analysisResult.suspect_profile.role}
                      </span>
                    </div>

                    {analysisResult.suspect_profile.university_affiliation && (
                      <div>
                        <span className="text-foreground-muted block">Établissement / Affiliation :</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Building className="w-3 h-3 text-gold" />
                          {analysisResult.suspect_profile.university_affiliation}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-foreground-muted block">Pays & Téléphone :</span>
                      <span className="text-foreground">
                        {analysisResult.suspect_profile.country} • {analysisResult.suspect_profile.phone || "Non renseigné"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-foreground-muted text-xs space-y-2">
                    <HelpCircle className="w-8 h-8 mx-auto opacity-40" />
                    <p>Aucun profil utilisateur ne correspond exactement à ces paramètres.</p>
                  </div>
                )}
              </div>

              {/* Colonne 3 : Ouvrage & Contexte Commercial */}
              <div className="bg-background rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider border-b border-border pb-2">
                  <CreditCard className="w-4 h-4 text-gold" />
                  <span>Contexte Commercial & Ouvrage</span>
                </div>

                {analysisResult.book_details ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-foreground-muted block">Titre de l'Ouvrage :</span>
                      <span className="font-bold text-navy">
                        {analysisResult.book_details.title}
                      </span>
                    </div>

                    <div>
                      <span className="text-foreground-muted block">Auteur :</span>
                      <span className="text-foreground">
                        {analysisResult.book_details.author}
                      </span>
                    </div>

                    {analysisResult.purchase_details && (
                      <>
                        <div className="pt-2 border-t border-border">
                          <span className="text-foreground-muted block">Commande Réf :</span>
                          <span className="font-mono font-medium text-foreground">
                            {analysisResult.purchase_details.reference}
                          </span>
                        </div>

                        <div>
                          <span className="text-foreground-muted block">Moyen de Paiement :</span>
                          <span className="text-foreground">
                            {analysisResult.purchase_details.payment_method}
                          </span>
                        </div>

                        <div>
                          <span className="text-foreground-muted block">Montant Réglé :</span>
                          <span className="font-bold text-gold">
                            {analysisResult.purchase_details.amount.toLocaleString()} {analysisResult.purchase_details.currency}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-foreground-muted text-xs space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                    <p>Contexte commercial et ouvrage non résolus pour cet échantillon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Traces d'accès correspondantes */}
            {analysisResult.matched_traces && analysisResult.matched_traces.length > 0 && (
              <div className="border-t border-border p-6 bg-background">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>Historique des Traces de Lecture Correspondantes ({analysisResult.matched_traces.length})</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-foreground-muted font-medium">
                        <th className="py-2 pr-4">Horodatage (UTC)</th>
                        <th className="py-2 pr-4">Adresse IP</th>
                        <th className="py-2 pr-4">Pays</th>
                        <th className="py-2 pr-4">Empreinte Navigateur</th>
                        <th className="py-2">Type d'Accès</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {analysisResult.matched_traces.map((trace) => (
                        <tr key={trace.id} className="hover:bg-background-secondary/50">
                          <td className="py-2 pr-4 font-mono text-foreground-muted">
                            {new Date(trace.timestamp).toLocaleString("fr-FR")}
                          </td>
                          <td className="py-2 pr-4 font-mono font-medium text-navy">
                            {trace.ip_address}
                          </td>
                          <td className="py-2 pr-4 font-medium text-foreground">
                            {trace.country}
                          </td>
                          <td className="py-2 pr-4 text-foreground-muted truncate max-w-xs">
                            {trace.device_fingerprint}
                          </td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-navy/10 text-navy">
                              {trace.access_type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historique des Investigations Récentes */}
        <div className="bg-background-secondary rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="text-base font-bold font-serif text-navy flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-gold" />
              <span>Historique Récent des Investigations Forensiques</span>
            </h3>
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="text-xs text-foreground-muted hover:text-gold transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-8 text-center text-xs text-foreground-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gold mb-2" />
              <span>Chargement du registre forensique...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-foreground-muted">
              <span>Aucune investigation forensique enregistrée pour le moment.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-foreground-muted font-medium">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Fichier</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Certitude</th>
                    <th className="py-2 pr-4">Suspect Identifié</th>
                    <th className="py-2 pr-4">Enquêteur</th>
                    <th className="py-2 text-right">Rapport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-background/60 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-foreground-muted whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-navy max-w-xs truncate" title={item.file_name}>
                        {item.file_name}
                      </td>
                      <td className="py-2.5 pr-4 uppercase text-[10px] font-bold text-foreground-muted">
                        {item.file_type}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === "identified"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : item.status === "inconclusive"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-slate-500/10 text-slate-600"
                          }`}
                        >
                          {item.status === "identified" ? "Identifié" : item.status === "inconclusive" ? "Partiel" : "Aucune trace"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-bold font-mono text-navy">
                        {item.certainty_score}%
                      </td>
                      <td className="py-2.5 pr-4 text-foreground">
                        {item.suspect_name || item.suspect_email || "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-foreground-muted">
                        {item.admin_name}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={getForensicReportDownloadUrl(item.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-gold/10 text-foreground-muted hover:text-gold inline-flex transition-colors"
                          title="Télécharger rapport PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modale de Confirmation de Suspension de Compte */}
      {showSuspendModal && analysisResult?.suspect_profile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border border-border max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 border-b border-border pb-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-navy">
                  Confirmer la suspension immédiate du compte
                </h3>
                <p className="text-xs text-foreground-muted">
                  Action disciplinaire et révocation de session
                </p>
              </div>
            </div>

            <div className="text-xs text-foreground space-y-2 bg-background-secondary p-3 rounded-lg border border-border">
              <p>
                Vous êtes sur le point de suspendre définitivement l'accès du lecteur :
              </p>
              <p className="font-bold text-navy">
                {analysisResult.suspect_profile.full_name} ({analysisResult.suspect_profile.email})
              </p>
              <p className="text-foreground-muted">
                Cette action invalidera immédiatement toutes ses sessions actives de lecture sur tous ses appareils et lui interdira tout nouvel accès à la liseuse.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider">
                Motif officiel de la suspension
              </label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Indiquez les détails de l'infraction (ex: diffusion non autorisée sur Telegram de l'ouvrage OHADA)..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                disabled={isMitigating}
                className="px-4 py-2 rounded-lg border border-border hover:bg-background-secondary text-xs font-medium text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                disabled={isMitigating}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isMitigating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Application...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirmer la Suspension</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
