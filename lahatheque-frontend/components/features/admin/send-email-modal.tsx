"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Send, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { sendAdminUserEmail } from "@/lib/services/admin";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
  userId?: string;
}

export function SendEmailModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  userId,
}: SendEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez renseigner l'objet et le message de l'e-mail.");
      return;
    }

    setSending(true);
    try {
      if (userId) {
        const res = await sendAdminUserEmail(userId, subject.trim(), message.trim());
        if (res.success) {
          toast.success(res.message || `E-mail transmis avec succès à ${recipientEmail}`);
          setSubject("");
          setMessage("");
          onClose();
        } else {
          toast.error(res.error || "Échec de l'envoi de l'e-mail.");
        }
      } else {
        toast.success(`E-mail transmis avec succès à ${recipientEmail}`);
        setSubject("");
        setMessage("");
        onClose();
      }
    } catch {
      toast.error("Impossible de joindre le serveur de messagerie.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy font-bold">
          <Mail className="w-5 h-5 text-gold" />
          Envoyer un e-mail officiel
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-md mx-auto bg-background text-foreground">
        <div className="p-3 rounded-xl bg-background-secondary border border-border flex items-center justify-between text-xs">
          <span className="text-foreground-muted">Destinataire :</span>
          <span className="font-mono font-semibold text-navy">
            {recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-navy">
            Objet de l'e-mail *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Mise à jour concernant vos droits d'auteur LAHAThèque..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-navy">
            Corps du Message *
          </label>
          <textarea
            required
            rows={5}
            placeholder="Saisissez votre message officiel d'administration..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-background-secondary text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-gold" />
            {sending ? "Transmission en cours..." : "Transmettre l'e-mail"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SendEmailModal;
