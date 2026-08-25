"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Trash2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  isDestructive = true,
  loading = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth={460}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs ${
              isDestructive
                ? "bg-error text-white hover:opacity-90 border border-error"
                : "bg-navy text-gold hover:bg-navy-dark border border-gold/30"
            }`}
          >
            {isDestructive && <Trash2 className="w-4 h-4" />}
            {loading ? "Traitement..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-xs text-foreground-muted leading-relaxed">
          Cette opération modifiera immédiatement l&apos;état de l&apos;élément dans votre registre.
        </p>
      </div>
    </Modal>
  );
}
