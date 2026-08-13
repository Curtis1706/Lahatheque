"use client";

import React, { useState } from "react";
import { Users, UserPlus, Trash2, Mail, ShieldCheck, UserCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { AuthorDelegateAccess } from "@/lib/types/author";

interface AuthorTeamAccessCardProps {
  delegates: AuthorDelegateAccess[];
  onInviteDelegate: (name: string, email: string, role: "co_author" | "assistant") => Promise<void>;
  onRemoveDelegate: (id: string) => Promise<void>;
  className?: string;
}

export function AuthorTeamAccessCard({
  delegates,
  onInviteDelegate,
  onRemoveDelegate,
  className,
}: AuthorTeamAccessCardProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"co_author" | "assistant">("co_author");
  const [submitting, setSubmitting] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      await onInviteDelegate(name, email, role);
      setShowInviteModal(false);
      setName("");
      setEmail("");
      alert(`Invitation d'accès envoyée avec succès à ${email} !`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs ${className}`}>
      {/* 21st.dev TeamAccessCard id: 8618 */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-navy font-serif font-bold text-base">
            <Users className="w-5 h-5 text-gold" />
            Délégation d&apos;Accès &amp; Co-Auteurs
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Autorisez des co-auteurs ou assistants à consulter et suivre votre espace auteur.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[40px] shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4 text-gold" />
          Inviter un Déclaré
        </button>
      </div>

      {/* Liste des personnes ayant accès */}
      <div className="space-y-3">
        {delegates.map((del) => (
          <div
            key={del.id}
            className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-navy text-gold font-serif font-bold flex items-center justify-center text-sm shrink-0 border border-gold/30">
                {del.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-navy text-xs truncate">{del.name}</p>
                <p className="text-[11px] text-foreground-muted font-mono truncate">{del.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-navy/10 text-navy font-mono font-bold text-[10px] uppercase">
                {del.role === "co_author" ? "Co-Auteur" : "Assistant"}
              </span>
              <button
                type="button"
                onClick={() => onRemoveDelegate(del.id)}
                className="p-2 rounded-xl text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                title="Révoquer l'accès"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modale d'invitation 21st.dev Team Access */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={
          <div className="flex items-center gap-2 text-navy font-serif font-bold text-base">
            <UserPlus className="w-5 h-5 text-gold" />
            Inviter un Co-Auteur ou Assistant
          </div>
        }
        maxWidth={500}
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2 text-xs">
          <div>
            <label htmlFor="del-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Nom &amp; Prénom du Délégué *
            </label>
            <input
              id="del-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Dr. Honoré ZINSOU"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="del-email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Adresse E-mail *
            </label>
            <input
              id="del-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex. honore.zinsou@uac.bj"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="del-role" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Rôle &amp; Permissions d&apos;Accès *
            </label>
            <select
              id="del-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "co_author" | "assistant")}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            >
              <option value="co_author">Co-Auteur (Accès aux statistiques de ventes et droits propres)</option>
              <option value="assistant">Assistant (Lecture seule du suivi des dépôts)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  Envoyer l&apos;Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
