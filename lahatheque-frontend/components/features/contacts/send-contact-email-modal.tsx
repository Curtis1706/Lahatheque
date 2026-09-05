"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { ProfessionalContact } from "@/lib/types/contacts";
import { sendContactEmail } from "@/lib/services/contacts";
import { Mail, Send, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface SendContactEmailModalProps {
  open: boolean;
  onClose: () => void;
  contacts: ProfessionalContact[];
  onSentSuccess?: (sentCount: number) => void;
}

export function SendContactEmailModal({
  open,
  onClose,
  contacts,
  onSentSuccess,
}: SendContactEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(
    "Nous avons le plaisir de vous contacter au sujet de nos activités éditoriales et académiques au sein de LAHAThèque.\n\nRestant à votre entière disposition pour tout échange complémentaire."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetState = () => {
    setSubject("");
    setError(null);
    setSentSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const insertVariable = (variableTag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message;
    const newText = text.substring(0, start) + variableTag + text.substring(end);
    setMessage(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableTag.length, start + variableTag.length);
    }, 10);
  };

  const handleSend = async () => {
    setError(null);
    if (!contacts.length) {
      setError("Aucun destinataire sélectionné.");
      return;
    }
    if (!subject.trim()) {
      setError("Veuillez renseigner l'objet du message.");
      return;
    }
    if (!message.trim()) {
      setError("Le corps du message ne peut pas être vide.");
      return;
    }

    setLoading(true);
    try {
      const contactIds = contacts.map((c) => c.id);
      const res = await sendContactEmail({
        contact_ids: contactIds,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSentSuccess(true);
      onSentSuccess?.(res.sent_count);
    } catch (err: any) {
      setError(err.message || "Échec de l'envoi de l'e-mail officiel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Envoyer un E-mail Officiel"
      description="Rédigez et expédiez une communication officielle avec l'adresse certifiée de LAHAThèque."
      maxWidth={620}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary rounded-xl transition-colors"
          >
            {sentSuccess ? "Fermer" : "Annuler"}
          </button>
          {!sentSuccess && (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !contacts.length}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-hover rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Expédition en cours...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>
                    Envoyer à {contacts.length} destinataire{contacts.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sentSuccess ? (
          <div className="p-6 text-center space-y-3 bg-background-secondary/50 rounded-2xl border border-border">
            <div className="size-12 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-serif font-bold text-navy dark:text-white text-base">
              E-mail officiel expédié avec succès
            </h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              Le message a été transmis à {contacts.length} contact{contacts.length > 1 ? "s" : ""}.
              Les réponses éventuelles vous parviendront directement par retour de mail.
            </p>
          </div>
        ) : (
          <>
            {/* Destinataires cibles */}
            <div className="p-3 rounded-xl bg-background-secondary/50 border border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="size-4 text-gold shrink-0" />
                <span className="text-xs font-medium text-foreground-muted">Destinataire(s) :</span>
                {contacts.length === 1 ? (
                  <span className="text-xs font-bold text-navy dark:text-white truncate">
                    {contacts[0].first_name} {contacts[0].last_name} &lt;{contacts[0].email}&gt;
                  </span>
                ) : (
                  <span className="text-xs font-bold text-navy dark:text-white">
                    {contacts.length} contacts sélectionnés
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full shrink-0">
                Email Pro Certifié
              </span>
            </div>

            {/* Objet */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-navy dark:text-white">
                Objet du message <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Partenariat académique et accès documentaire • LAHAThèque"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>

            {/* Variables dynamiques d'insertion */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-navy dark:text-white">
                  Corps du message <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                    <Sparkles className="size-3 text-gold" />
                    Insérer :
                  </span>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{prenom}}")}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-background-secondary border border-border hover:border-gold text-foreground transition-colors"
                    title="Prénom du destinataire"
                  >
                    {"{{prenom}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{nom}}")}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-background-secondary border border-border hover:border-gold text-foreground transition-colors"
                    title="Nom du destinataire"
                  >
                    {"{{nom}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{organisation}}")}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-background-secondary border border-border hover:border-gold text-foreground transition-colors"
                    title="Organisation du destinataire"
                  >
                    {"{{organisation}}"}
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={7}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre message officiel..."
                className="w-full p-3 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none font-sans leading-relaxed"
              />
            </div>

            {/* Note sur la traçabilité */}
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              Le message sera mis en page avec l'en-tête officiel LAHAThèque et transmis via l'adresse{" "}
              <strong className="text-foreground">contact@mail.lahalex.com</strong>. L'adresse de réponse (<em>reply-to</em>) sera configurée avec votre adresse e-mail personnelle afin que les réponses vous parviennent directement.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

export default SendContactEmailModal;
