"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Loader } from "@/components/ui/loader";
import { searchClients } from "@/lib/services/admin";

export interface ClientItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
}

interface ClientComboboxProps {
  onSelect: (client: ClientItem) => void;
  selectedClient?: ClientItem | null;
  onClear?: () => void;
  placeholder?: string;
}

export function ClientCombobox({
  onSelect,
  selectedClient,
  onClear,
  placeholder = "Rechercher par nom, e-mail ou téléphone...",
}: ClientComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [results, setResults] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchClients(query.trim(), roleFilter === "all" ? undefined : roleFilter);
        setResults(Array.isArray(res) ? res : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, roleFilter, isOpen]);

  const handleSelectClient = (client: ClientItem) => {
    onSelect(client);
    setIsOpen(false);
    setQuery("");
  };

  if (selectedClient) {
    const fullName = `${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() || selectedClient.email;
    return (
      <div className="p-3.5 rounded-2xl bg-background border border-gold/40 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            src={selectedClient.avatar_url}
            name={fullName}
            size="sm"
            className="border border-gold/40 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-serif font-bold text-navy text-xs sm:text-sm truncate">
                {fullName}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark border border-gold/20 capitalize shrink-0">
                {selectedClient.role || "Client"}
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted truncate">
              {selectedClient.email}
              {selectedClient.phone ? ` • ${selectedClient.phone}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold text-navy transition-colors shrink-0 cursor-pointer"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Champ de recherche principal */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:border-gold focus:ring-1 focus:ring-gold outline-hidden min-h-[44px] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-navy cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sélecteur de rôle */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setIsOpen(true);
          }}
          className="px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-hidden min-h-[44px] font-medium transition-colors sm:w-48"
          aria-label="Filtrer les clients par profil"
        >
          <option value="all">Tous les profils</option>
          <option value="student">Lecteurs / Étudiants</option>
          <option value="author">Auteurs</option>
          <option value="university">Universités</option>
          <option value="wholesaler">Grossistes</option>
        </select>
      </div>

      {/* Menu Déroulant Flottant */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-border animate-in fade-in duration-150">
          {loading ? (
            <div className="p-5 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
              <Loader variant="spinner" size={14} className="text-gold" />
              <span>Recherche des comptes clients en cours...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-5 text-center text-xs text-foreground-muted italic">
              {query.trim()
                ? `Aucun compte trouvé pour « ${query} »`
                : "Commencez à taper un nom, email ou numéro pour afficher les résultats"}
            </div>
          ) : (
            results.map((client) => {
              const fullName = `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.email;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-background-secondary transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar
                      src={client.avatar_url}
                      name={fullName}
                      size="sm"
                      className="border border-border group-hover:border-gold shrink-0 transition-colors"
                    />
                    <div className="min-w-0">
                      <p className="font-serif font-bold text-navy text-xs truncate group-hover:text-gold-dark transition-colors">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-foreground-muted truncate">
                        {client.email}
                        {client.phone ? ` • ${client.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/5 text-navy border border-border capitalize">
                      {client.role || "Lecteur"}
                    </span>
                    <span className="p-1.5 rounded-lg bg-navy text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-3.5 h-3.5 text-gold" />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
