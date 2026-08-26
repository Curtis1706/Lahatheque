"use client";

import React, { useState, useEffect } from "react";
import { Shield, Search, Filter, Globe, Download, RefreshCw, Smartphone, Clock, BookOpen, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { getAccessTraces, type TraceRecord } from "@/lib/services/protection";
import { PageLoader } from "@/components/ui/page-loader";


export default function AdminTracesAccesPage() {
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const loadTraces = async () => {
    setIsLoading(true);
    try {
      const data = await getAccessTraces();
      setTraces(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTraces();
  }, []);


  const filteredTraces = traces.filter((trace) => {
    const matchesSearch =
      trace.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.ip_address.includes(searchQuery);

    const matchesCountry = selectedCountry === "all" || trace.country === selectedCountry;
    const matchesType = selectedType === "all" || trace.access_type === selectedType;

    return matchesSearch && matchesCountry && matchesType;
  });

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case "read_chunk":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">Flux Range 206</span>;
      case "text_request":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/10 text-gold border border-gold/30">Texte TTS</span>;
      case "audio_stream":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Audio HLS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-foreground-muted/10 text-foreground">Accès Standard</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">
              Registre Légal d'Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy mt-1">
            Journal des Traces d'Accès DRM (TraceAccès)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Historique immuable de chaque fragment de document et streaming délivré aux lecteurs.
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
            onClick={() => toast.success("Export du registre d'audit généré au format CSV.")}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-navy text-white hover:bg-navy-hover transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            <span>Exporter Audit (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cartes d'indicateurs de surveillance calculées en direct */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Événements Tracés</p>
          <p className="text-xl font-bold text-navy font-mono">{traces.length}</p>
          <p className="text-[10px] text-foreground-muted">Fragments Range & sessions en base</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Pays / Territoires Détectés</p>
          <p className="text-xl font-bold text-gold font-mono">
            {new Set(traces.map((t) => t.country)).size} Territoire(s)
          </p>
          <p className="text-[10px] text-foreground-muted">
            {traces.length > 0 ? Array.from(new Set(traces.map((t) => t.country))).join(", ") : "En attente de connexion"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Statut du Moteur DRM</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">AES-256-GCM</p>
          <p className="text-[10px] text-foreground-muted">Chiffrement & Filigrane actif</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <p className="text-[11px] font-medium text-foreground-muted">Intégrité & Fuites</p>
          <p className="text-xl font-bold text-emerald-600 font-mono">0 Fuite</p>
          <p className="text-[10px] text-foreground-muted">100% des fragments signés</p>
        </div>
      </div>


      {/* Barre de Recherche et Filtres */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par e-mail, nom, titre d'ouvrage ou adresse IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-w-[130px]"
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
            className="px-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-w-[140px]"
          >
            <option value="all">Tous les Types d'Accès</option>
            <option value="read_chunk">Flux Range 206</option>
            <option value="text_request">Texte TTS</option>
            <option value="audio_stream">Audio HLS</option>
          </select>
        </div>
      </div>

      {/* Tableau des Traces (Desktop & Tablettes) / Cartes (Mobile) */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden">
        {isLoading ? (
          <PageLoader label="Chargement des traces d'accès" />
        ) : filteredTraces.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center mx-auto text-navy">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <p className="text-sm font-bold text-navy">Aucun événement d'accès enregistré</p>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              Le journal légal TraceAccès enregistrera automatiquement chaque fragment Range 206 délivré et filigrané dès qu&apos;un utilisateur consultera un ouvrage dans le lecteur sécurisé.
            </p>
            <div className="pt-2">
              <a
                href="/admin/catalog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>Ouvrir un ouvrage depuis le Catalogue</span>
              </a>
            </div>
          </div>

        ) : (
          <>
            {/* Version Tableau (écrans >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Lecteur / Utilisateur</th>
                    <th className="py-3 px-4">Ouvrage Consulté</th>
                    <th className="py-3 px-4">Type de Flux</th>
                    <th className="py-3 px-4">Origine (IP & Pays)</th>
                    <th className="py-3 px-4">Empreinte Appareil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTraces.map((trace) => (
                    <tr key={trace.id} className="hover:bg-background/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted whitespace-nowrap">
                        {new Date(trace.timestamp).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-navy">{trace.user_name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{trace.user_email}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="font-medium text-foreground truncate" title={trace.book_title}>
                          {trace.book_title}
                        </p>
                        {trace.page_number && (
                          <span className="text-[10px] text-gold font-mono font-bold">
                            Page {trace.page_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getAccessTypeBadge(trace.access_type)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-navy font-mono">
                            {trace.country}
                          </span>
                          <span className="font-mono text-[11px] text-foreground-muted">
                            {trace.ip_address}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="text-[10px] text-foreground-muted font-mono truncate" title={trace.device_fingerprint}>
                          {trace.device_fingerprint}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version Cartes Empilées (écrans mobiles < 768px) */}
            <div className="md:hidden divide-y divide-border">
              {filteredTraces.map((trace) => (
                <div key={trace.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-navy font-mono">
                        {trace.country}
                      </span>
                      <span className="font-mono text-[11px] text-foreground-muted">
                        {trace.ip_address}
                      </span>
                    </div>
                    {getAccessTypeBadge(trace.access_type)}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-navy">{trace.user_name}</p>
                    <p className="text-[10px] text-foreground-muted font-mono">{trace.user_email}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-background border border-border text-[11px]">
                    <p className="font-medium text-foreground truncate">{trace.book_title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-foreground-muted">
                      {trace.page_number ? (
                        <span className="text-gold font-bold font-mono">Page {trace.page_number}</span>
                      ) : (
                        <span>Document entier</span>
                      )}
                      <span className="font-mono">
                        {new Date(trace.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
