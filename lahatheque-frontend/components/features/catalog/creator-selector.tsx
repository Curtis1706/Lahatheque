"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Building2,
  Search,
  Check,
  GraduationCap,
  Scale,
  Sparkles,
  X,
  Plus,
  PenTool,
  Info,
} from "lucide-react";
import { getCreatorOptions, type CreatorOption, type CreatorOptionsResponse } from "@/lib/services/creators";

interface CreatorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedAuthorId?: string;
  selectedAuthorUserId?: string;
  selectedPublisherId?: string;
  onSelectCreator?: (creator: CreatorOption | null) => void;
}

export function CreatorSelector({
  value,
  onChange,
  onSelectCreator,
}: CreatorSelectorProps) {
  const [mode, setMode] = useState<"registered" | "manual">("registered");
  const [tab, setTab] = useState<"author" | "publisher">("author");
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<CreatorOptionsResponse>({ authors: [], publishers: [] });
  const [loading, setLoading] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorOption | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getCreatorOptions();
      setOptions(data);
      setLoading(false);

      // Si valeur initiale = LAHA Éditions par défaut
      if (value && value.toLowerCase().includes("laha")) {
        const found = data.publishers.find((p) => p.name.toLowerCase().includes("laha"));
        if (found) {
          setSelectedCreator(found);
          onSelectCreator?.(found);
        }
      }
    }
    load();
  }, []);

  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) return options.authors;
    const q = searchQuery.toLowerCase();
    return options.authors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.institution && a.institution.toLowerCase().includes(q))
    );
  }, [options.authors, searchQuery]);

  const filteredPublishers = useMemo(() => {
    if (!searchQuery.trim()) return options.publishers;
    const q = searchQuery.toLowerCase();
    return options.publishers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.company_name && p.company_name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q))
    );
  }, [options.publishers, searchQuery]);

  const handleSelect = (creator: CreatorOption) => {
    setSelectedCreator(creator);
    onChange(creator.name);
    onSelectCreator?.(creator);
  };

  const handleClearSelection = () => {
    setSelectedCreator(null);
    onSelectCreator?.(null);
  };

  const handleManualInput = (val: string) => {
    onChange(val);
    setSelectedCreator(null);
    onSelectCreator?.(null);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Sélecteur de Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-navy flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-gold" />
          <span>Auteur / Éditeur &amp; Attribution des Droits *</span>
        </label>

        <div className="inline-flex rounded-xl bg-background-secondary p-0.5 border border-border text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("registered")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mode === "registered"
                ? "bg-navy text-white shadow-2xs font-bold"
                : "text-foreground-muted hover:text-navy"
            }`}
          >
            Sélectionner un compte
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              handleClearSelection();
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mode === "manual"
                ? "bg-navy text-white shadow-2xs font-bold"
                : "text-foreground-muted hover:text-navy"
            }`}
          >
            Saisie libre (non inscrit)
          </button>
        </div>
      </div>

      {/* ─── MODE 1 : SÉLECTION D'UN COMPTE INSCRIT ─── */}
      {mode === "registered" && (
        <div className="p-4 rounded-2xl bg-background border border-border space-y-3 shadow-2xs">
          {/* Si un créateur est déjà sélectionné */}
          {selectedCreator ? (
            <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-navy text-gold flex items-center justify-center shrink-0">
                  {selectedCreator.type === "author" ? (
                    <User className="w-4 h-4 text-gold" />
                  ) : (
                    <Building2 className="w-4 h-4 text-gold" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-navy truncate">
                      {selectedCreator.name}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold uppercase font-mono">
                      {selectedCreator.role_label}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted truncate">
                    {selectedCreator.email ? `${selectedCreator.email} • ` : ""}
                    {selectedCreator.institution || selectedCreator.company_name || selectedCreator.country || "LAHAThèque"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-500/15 px-2 py-1 rounded-lg font-bold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Droits associés
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1.5 rounded-lg border border-border hover:bg-background text-foreground-muted hover:text-rose-500 transition-colors cursor-pointer"
                  title="Changer de créateur"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Onglets Auteurs vs Éditeurs */}
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <button
                  type="button"
                  onClick={() => setTab("author")}
                  className={`pb-1 px-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                    tab === "author"
                      ? "border-gold text-navy"
                      : "border-transparent text-foreground-muted hover:text-navy"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>Auteurs ({options.authors.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab("publisher")}
                  className={`pb-1 px-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                    tab === "publisher"
                      ? "border-gold text-navy"
                      : "border-transparent text-foreground-muted hover:text-navy"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-gold" />
                  <span>Éditeurs Partenaires ({options.publishers.length})</span>
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    tab === "author"
                      ? "Rechercher un auteur par nom, email, université..."
                      : "Rechercher une maison d'édition par nom, pays..."
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                />
              </div>

              {/* Liste défilante */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {tab === "author" && (
                  <>
                    {filteredAuthors.length === 0 ? (
                      <p className="text-xs text-foreground-muted py-4 text-center">
                        Aucun auteur trouvé. Utilisez la saisie libre pour renseigner un auteur non inscrit.
                      </p>
                    ) : (
                      filteredAuthors.map((author) => (
                        <button
                          key={author.id}
                          type="button"
                          onClick={() => handleSelect(author)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-background-secondary flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-navy truncate group-hover:text-gold transition-colors">
                                {author.name}
                              </p>
                              <p className="text-[10px] text-foreground-muted truncate">
                                {author.institution || author.email || author.role_label}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-gold font-bold px-2 py-1 rounded-lg bg-gold/10 shrink-0">
                            Associer
                          </span>
                        </button>
                      ))
                    )}
                  </>
                )}

                {tab === "publisher" && (
                  <>
                    {filteredPublishers.length === 0 ? (
                      <p className="text-xs text-foreground-muted py-4 text-center">
                        Aucun éditeur trouvé. Utilisez la saisie libre pour renseigner un éditeur non inscrit.
                      </p>
                    ) : (
                      filteredPublishers.map((pub) => (
                        <button
                          key={pub.id}
                          type="button"
                          onClick={() => handleSelect(pub)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-background-secondary flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-navy truncate group-hover:text-gold transition-colors">
                                {pub.name}
                              </p>
                              <p className="text-[10px] text-foreground-muted truncate">
                                {pub.company_name || pub.country || pub.email || "Éditeur"}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-gold font-bold px-2 py-1 rounded-lg bg-gold/10 shrink-0">
                            Associer
                          </span>
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Bandeau d'information légale */}
          <div className="p-2.5 rounded-xl bg-background-secondary text-[11px] text-foreground-muted flex items-start gap-2 border border-border">
            <Info className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
            <p>
              {selectedCreator ? (
                <span>
                  Les redevances de ventes et droits d&apos;auteur seront directement versés et comptabilisés sur le compte de{" "}
                  <strong className="text-navy font-semibold">{selectedCreator.name}</strong>.
                </span>
              ) : (
                <span>
                  Sélectionnez l&apos;auteur ou la maison d&apos;édition pour automatiser le calcul et le versement des droits sur chaque vente d&apos;exemplaire ou lecture streaming.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ─── MODE 2 : SAISIE LIBRE ─── */}
      {mode === "manual" && (
        <div className="space-y-2 animate-in fade-in">
          <input
            type="text"
            required
            value={value}
            onChange={(e) => handleManualInput(e.target.value)}
            placeholder="Ex : LAHA Éditions ou Nom de l'Auteur non inscrit"
            className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
          />
          <p className="text-[11px] text-foreground-muted italic">
            L&apos;auteur pourra être rattaché a posteriori via un contrat légal ou la gestion des utilisateurs.
          </p>
        </div>
      )}
    </div>
  );
}
