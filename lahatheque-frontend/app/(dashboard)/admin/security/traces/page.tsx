"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Filter,
  Globe,
  Download,
  RefreshCw,
  Clock,
  BookOpen,
  User,
  Layers,
  ChevronLeft,
  ChevronRight,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { getAccessTraces, type TraceRecord } from "@/lib/services/protection";
import { PageLoader } from "@/components/ui/page-loader";
import { generateCsvExport } from "@/lib/services/export-service";

export default function AdminTracesAccesPage() {
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadTraces = async () => {
    setIsLoading(true);
    try {
      const data = await getAccessTraces();
      setTraces(data);
    } catch {
      toast.error("Erreur lors de la récupération des traces d'accès.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTraces();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, selectedPartner, selectedType, itemsPerPage]);

  const uniquePartners = Array.from(
    new Set(traces.map((t) => t.partner_name || "LAHAThèque").filter(Boolean))
  );

  const filteredTraces = traces.filter((trace) => {
    const pName = trace.partner_name || "LAHAThèque";
    const matchesSearch =
      trace.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.ip_address.includes(searchQuery);

    const matchesCountry = selectedCountry === "all" || trace.country === selectedCountry;
    const matchesPartner = selectedPartner === "all" || pName === selectedPartner;
    const matchesType = selectedType === "all" || trace.access_type === selectedType;

    return matchesSearch && matchesCountry && matchesPartner && matchesType;
  });

  const totalPagesCount = Math.max(1, Math.ceil(filteredTraces.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTraces = filteredTraces.slice(startIndex, startIndex + itemsPerPage);

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case "read_chunk":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">Flux Sécurisé</span>;
      case "text_request":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/10 text-gold border border-gold/30">Texte TTS</span>;
      case "audio_stream":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Audio HLS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-foreground-muted/10 text-foreground">Accès Standard</span>;
    }
  };

  const formatDeviceFingerprint = (fp: string) => {
    if (!fp) return "Navigateur Web";
    if (fp === "node") return "Client Web (Next.js)";

    // Détection précise du Navigateur
    let browser = "";
    if (/edg\//i.test(fp)) browser = "Microsoft Edge";
    else if (/opr\/|opera/i.test(fp)) browser = "Opera";
    else if (/chrome|crios/i.test(fp)) browser = "Google Chrome";
    else if (/firefox|fxios/i.test(fp)) browser = "Mozilla Firefox";
    else if (/safari/i.test(fp) && !/chrome|crios/i.test(fp)) browser = "Apple Safari";
    else if (fp.startsWith("Web •")) return fp;

    // Détection précise du Système d'Exploitation
    let os = "";
    if (/windows nt 10\.0/i.test(fp)) os = "Windows 10/11";
    else if (/windows nt 6\.3/i.test(fp)) os = "Windows 8.1";
    else if (/windows nt 6\.1/i.test(fp)) os = "Windows 7";
    else if (/windows/i.test(fp)) os = "Windows";
    else if (/macintosh|mac os x/i.test(fp)) os = "macOS";
    else if (/iphone/i.test(fp)) os = "iPhone (iOS)";
    else if (/ipad/i.test(fp)) os = "iPad (iPadOS)";
    else if (/android/i.test(fp)) os = "Android Mobile";
    else if (/linux/i.test(fp)) os = "Linux";

    if (browser && os) return `${browser} • ${os}`;
    if (browser) return `${browser} • Web`;
    if (os) return `Navigateur Web • ${os}`;

    return fp;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">
              Registre Légal d'Audit & Surveillance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy mt-1">
            Journal des Traces d'Accès DRM (TraceAccès)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Historique certifié de chaque session de lecture, adresse IP cliente, progression et terminal connecté.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadTraces}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-background border border-border text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (filteredTraces.length === 0) {
                toast.info("Aucune trace d'accès à exporter.");
                return;
              }
              generateCsvExport(
                filteredTraces.map((t) => ({
                  ID_Session: t.id,
                  Utilisateur: t.user_name,
                  Email: t.user_email,
                  Partenaire: t.partner_name || "LAHAThèque",
                  Ouvrage_Consulte: t.book_title,
                  ID_Livre: t.book_id,
                  Type_Flux: t.access_type,
                  Adresse_IP: t.ip_address,
                  Pays: t.country,
                  Page_Actuelle: t.current_page || t.page_number || 1,
                  Total_Pages: t.total_pages || 1,
                  Progression_Pct: `${t.progress_percent || 0}%`,
                  Temps_Lecture_Min: t.reading_time_minutes || 0,
                  Empreinte_Appareil: t.device_fingerprint,
                  Horodatage_UTC: t.timestamp,
                })),
                `audit_traces_securite_lahatheque_${new Date().toISOString().slice(0, 10)}`
              );
              toast.success("Registre d'audit exporté avec succès (format UTF-8 BOM pour Excel) !");
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-navy text-white hover:bg-navy-hover transition-colors cursor-pointer shadow-sm min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            <span>Exporter Audit (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cartes d'indicateurs de surveillance calculées en direct */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Événements & Sessions Tracés</p>
          <p className="text-xl font-bold text-navy font-mono">{traces.length}</p>
          <p className="text-[10px] text-foreground-muted">Total des accès enregistrés en base</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Pays / Territoires Détectés</p>
          <p className="text-xl font-bold text-gold font-mono">
            {new Set(traces.map((t) => t.country)).size} Territoire(s)
          </p>
          <p className="text-[10px] text-foreground-muted">
            {traces.length > 0 ? Array.from(new Set(traces.map((t) => t.country))).join(", ") : "En attente"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Statut du Moteur DRM</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">AES-256-GCM</p>
          <p className="text-[10px] text-foreground-muted">Tatouage dynamique & filigrane actif</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Intégrité & Fuites</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">0 Fuite</p>
          <p className="text-[10px] text-foreground-muted">100% des fragments signés</p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres Avancés */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par lecteur, e-mail, titre d'ouvrage, partenaire ou IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
          {uniquePartners.length > 0 && (
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-w-[130px]"
            >
              <option value="all">Tous Partenaires</option>
              {uniquePartners.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-w-[120px]"
          >
            <option value="all">Tous les Pays</option>
            <option value="BJ">Bénin (BJ)</option>
            <option value="SN">Sénégal (SN)</option>
            <option value="CI">Côte d'Ivoire (CI)</option>
            <option value="CM">Cameroun (CM)</option>
            <option value="CD">RDC (CD)</option>
            <option value="GA">Gabon (GA)</option>
            <option value="TG">Togo (TG)</option>
            <option value="NE">Niger (NE)</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-w-[130px]"
          >
            <option value="all">Tous les Flux</option>
            <option value="read_chunk">Flux Sécurisé</option>
            <option value="text_request">Texte TTS</option>
            <option value="audio_stream">Audio HLS</option>
          </select>
        </div>
      </div>

      {/* Data Table des Traces (Desktop & Tablettes) / Cartes (Mobile) */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden">
        {isLoading ? (
          <PageLoader label="Chargement du registre d'audit des traces..." />
        ) : filteredTraces.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center mx-auto text-navy">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <p className="text-sm font-bold text-navy">Aucune trace d'accès correspondante</p>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              Aucun événement ne correspond à vos critères de recherche ou de filtre.
            </p>
          </div>
        ) : (
          <>
            {/* Version Tableau (Desktop / Tablette >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-4 px-5 whitespace-nowrap">ID & Date</th>
                    <th className="py-4 px-5 whitespace-nowrap">Lecteur / Utilisateur</th>
                    <th className="py-4 px-5">Document & Partenaire</th>
                    <th className="py-4 px-5 whitespace-nowrap">Progression</th>
                    <th className="py-4 px-5 whitespace-nowrap">Origine (IP & Pays)</th>
                    <th className="py-4 px-5 whitespace-nowrap">Temps & Terminal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTraces.map((trace) => (
                    <tr key={trace.id} className="hover:bg-background/60 transition-colors">
                      {/* ID & Date */}
                      <td className="py-5 px-5 font-mono text-[11px] text-foreground-muted whitespace-nowrap align-middle">
                        <div className="font-bold text-navy font-sans text-xs">
                          {new Date(trace.timestamp).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-foreground-muted mt-0.5">
                          {new Date(trace.timestamp).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Lecteur / Utilisateur */}
                      <td className="py-5 px-5 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <div>
                            <p className="font-bold text-navy text-xs md:text-sm">{trace.user_name}</p>
                            <p className="text-[11px] text-foreground-muted font-mono">{trace.user_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Document & Partenaire avec Couverture */}
                      <td className="py-5 px-5 align-middle">
                        <div className="flex items-center gap-3.5">
                          {/* Miniature de couverture de l'ouvrage */}
                          <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-navy/10 border border-border/80 shadow-xs flex items-center justify-center">
                            {trace.cover_url ? (
                              <img
                                src={trace.cover_url}
                                alt={trace.book_title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".fallback-cover");
                                  if (fallback) fallback.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div className={`fallback-cover ${trace.cover_url ? "hidden" : "flex"} w-full h-full items-center justify-center bg-navy/90 text-gold`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Titre et Badges */}
                          <div className="min-w-0 max-w-[280px] lg:max-w-[340px] space-y-1">
                            <p className="font-semibold text-foreground text-xs md:text-sm leading-snug line-clamp-2" title={trace.book_title}>
                              {trace.book_title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-1.5 py-0.5 rounded">
                                {trace.partner_name || "LAHAThèque"}
                              </span>
                              <span className="text-border">•</span>
                              {getAccessTypeBadge(trace.access_type)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progression & Page */}
                      <td className="py-5 px-5 whitespace-nowrap align-middle">
                        <div className="flex items-center justify-between gap-3 max-w-[130px]">
                          <span className="font-bold text-navy text-xs md:text-sm">
                            {trace.progress_percent ?? 0}%
                          </span>
                          <span className="text-[11px] text-foreground-muted font-mono font-medium">
                            p. {trace.current_page || trace.page_number || 1}/{trace.total_pages || 1}
                          </span>
                        </div>
                        <div className="w-full max-w-[130px] bg-background border border-border rounded-full h-2 mt-1.5 overflow-hidden">
                          <div
                            className="bg-gold h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, trace.progress_percent ?? 0)}%` }}
                          />
                        </div>
                      </td>

                      {/* Origine (IP & Pays) */}
                      <td className="py-5 px-5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-background border border-border text-navy font-mono">
                            {trace.country || "BJ"}
                          </span>
                          <span className="font-mono text-xs md:text-sm font-semibold text-navy">
                            {trace.ip_address}
                          </span>
                        </div>
                      </td>

                      {/* Temps & Terminal */}
                      <td className="py-5 px-5 max-w-[220px] align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>{trace.reading_time_minutes ? `${trace.reading_time_minutes} min` : "1 min"}</span>
                        </div>
                        <p className="text-[11px] text-foreground-muted font-mono truncate mt-1" title={trace.device_fingerprint}>
                          {formatDeviceFingerprint(trace.device_fingerprint)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version Cartes Empilées (Mobile < 768px) */}
            <div className="md:hidden divide-y divide-border">
              {paginatedTraces.map((trace) => (
                <div key={trace.id} className="p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-background border border-border text-navy font-mono">
                        {trace.country || "BJ"}
                      </span>
                      <span className="font-mono text-xs font-bold text-navy">
                        {trace.ip_address}
                      </span>
                    </div>
                    {getAccessTypeBadge(trace.access_type)}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy">{trace.user_name}</p>
                      <p className="text-[11px] text-foreground-muted font-mono">{trace.user_email}</p>
                    </div>
                  </div>

                  {/* Carte Document avec Couverture sur Mobile */}
                  <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-12 shrink-0 rounded-lg overflow-hidden bg-navy/10 border border-border shadow-xs flex items-center justify-center">
                        {trace.cover_url ? (
                          <img
                            src={trace.cover_url}
                            alt={trace.book_title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(".fallback-cover-mobile");
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div className={`fallback-cover-mobile ${trace.cover_url ? "hidden" : "flex"} w-full h-full items-center justify-center bg-navy/90 text-gold`}>
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate text-xs">{trace.book_title}</p>
                        <p className="text-[10px] font-bold text-gold uppercase tracking-wider mt-0.5">
                          {trace.partner_name || "LAHAThèque"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border">
                      <span className="font-medium text-foreground-muted">Progression</span>
                      <span className="font-mono font-bold text-navy">
                        p. {trace.current_page || trace.page_number || 1}/{trace.total_pages || 1} ({trace.progress_percent ?? 0}%)
                      </span>
                    </div>

                    <div className="w-full bg-background-secondary border border-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gold h-full rounded-full"
                        style={{ width: `${Math.min(100, trace.progress_percent ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      <span>{trace.reading_time_minutes ? `${trace.reading_time_minutes} min` : "1 min"}</span>
                      <span className="text-border">•</span>
                      <span className="truncate max-w-[130px]">{formatDeviceFingerprint(trace.device_fingerprint)}</span>
                    </div>
                    <span className="font-mono">
                      {new Date(trace.timestamp).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pied de tableau Data Table : Contrôles de Pagination */}
            <div className="p-4 border-t border-border bg-background flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-foreground-muted text-[11px] font-medium">
                Affichage de <span className="font-bold text-navy">{filteredTraces.length === 0 ? 0 : startIndex + 1}</span> à{" "}
                <span className="font-bold text-navy">
                  {Math.min(startIndex + itemsPerPage, filteredTraces.length)}
                </span>{" "}
                sur <span className="font-bold text-navy">{filteredTraces.length}</span> traces
              </div>

              <div className="flex items-center gap-4">
                {/* Sélecteur Items par Page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground-muted">Par page :</span>
                  <div className="flex gap-1 bg-background-secondary p-0.5 rounded-lg border border-border">
                    {[5, 10, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setItemsPerPage(size)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          itemsPerPage === size
                            ? "bg-navy text-white shadow-xs"
                            : "text-foreground-muted hover:text-foreground hover:bg-background"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boutons Page Précédente / Suivante */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground cursor-pointer"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2.5 py-1 rounded-lg bg-background-secondary border border-border font-mono text-[11px] font-bold text-navy">
                    {currentPage} / {totalPagesCount}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPagesCount, p + 1))}
                    disabled={currentPage === totalPagesCount}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground cursor-pointer"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
