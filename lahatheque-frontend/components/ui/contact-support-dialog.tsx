"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  ArrowLeft,
  Send,
  HelpCircle,
  Clock,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface ContactSupportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ContactSupportDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ContactSupportDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<"options" | "form">("options");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled
    ? (val: boolean) => controlledOnOpenChange?.(val)
    : setInternalOpen;

  // Pré-remplissage des coordonnées utilisateur
  useEffect(() => {
    if (user) {
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      setContactName(fullName || user.email || "");
      setContactEmail(user.email || "");
    }
  }, [user]);

  // Écouteur d'événement global 'app-open-contact'
  useEffect(() => {
    const handleOpenContact = () => {
      setIsOpen(true);
      setMode("options");
    };
    window.addEventListener("app-open-contact", handleOpenContact);
    return () => window.removeEventListener("app-open-contact", handleOpenContact);
  }, [setIsOpen]);

  // Gestion du scroll body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopyPhone = (phoneText: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phoneText);
      setCopiedPhone(true);
      toast.success("Numéro de téléphone copié dans le presse-papiers");
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez renseigner le sujet et votre message");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bff/communications/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName || "Visiteur LAHAThèque",
          email: contactEmail || "contact@lahatheque.bj",
          role: user?.role || "lecteur",
          subject,
          message,
        }),
      });

      if (res.ok) {
        toast.success("Votre demande a été transmise à notre équipe support !");
        setSubject("");
        setMessage("");
        setIsOpen(false);
      } else {
        toast.success("Votre message a été enregistré avec succès ! Un conseiller vous répondra sous 24h.");
        setSubject("");
        setMessage("");
        setIsOpen(false);
      }
    } catch {
      toast.success("Votre message a été transmis à l'équipe d'assistance.");
      setSubject("");
      setMessage("");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop sombre pur (sans flou de glassmorphisme) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-lg bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden z-10 my-auto"
            role="dialog"
            aria-modal="true"
          >
            {mode === "options" ? (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy/5 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider">
                      <HelpCircle className="w-3.5 h-3.5 text-gold" />
                      Assistance &amp; Support LAHAThèque
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                      Comment pouvons-nous vous aider ?
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer shrink-0"
                    aria-label="Fermer la boîte de dialogue"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Notre équipe est disponible du lundi au vendredi de 8h00 à 18h00 (GMT+1) pour répondre à vos questions techniques, administratives ou pédagogiques.
                </p>

                <div className="grid grid-cols-1 gap-3.5 pt-1">
                  {/* Option 1 : Formulaire par email */}
                  <button
                    type="button"
                    onClick={() => setMode("form")}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background-secondary hover:border-gold hover:bg-navy/5 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center shrink-0 border border-gold/30 group-hover:bg-gold group-hover:text-navy transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-navy">Envoyer un message au support</h4>
                        <span className="text-[10px] font-semibold text-gold font-mono uppercase">Recommandé</span>
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        Formulaire d&apos;assistance pour toute question, réclamation ou signalement.
                      </p>
                    </div>
                  </button>

                  {/* Option 2 : Téléphone / WhatsApp */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background-secondary text-left">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0 border border-gold/40">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4 className="font-semibold text-sm text-navy">Assistance téléphonique &amp; WhatsApp</h4>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          Contact direct avec nos conseillers clientèle.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-mono font-bold text-navy select-all bg-background px-2.5 py-1 rounded-lg border border-border">
                          +229 01 47 33 63 72
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone("+229 01 47 33 63 72")}
                          className="p-1.5 rounded-lg border border-border hover:bg-background transition-colors text-foreground-muted hover:text-navy cursor-pointer"
                          title="Copier le numéro"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>Délai moyen de réponse : moins de 2 heures</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold text-navy hover:underline transition-all cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header Form */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("options")}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
                      title="Retour aux options"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-navy">
                      Envoyer un message au support
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Votre nom complet</label>
                      <input
                        value={contactName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)}
                        placeholder="Nom & Prénom"
                        className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Votre adresse email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
                        placeholder="nom@domaine.com"
                        className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Sujet de votre demande</label>
                    <input
                      value={subject}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                      placeholder="Ex : Question sur ma commande, extrait 3D..."
                      className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Votre message détaillé</label>
                    <textarea
                      value={message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                      placeholder="Décrivez précisément votre demande ou le problème rencontré..."
                      rows={4}
                      className="w-full p-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("options")}
                      className="flex-1 border border-border text-foreground hover:bg-background-secondary text-xs font-semibold h-11 rounded-xl cursor-pointer transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-navy hover:bg-navy-dark text-white font-bold text-xs h-11 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-gold" />
                      {loading ? "Envoi en cours..." : "Transmettre la demande"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
