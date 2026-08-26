"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/services/auth";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { InlineLoader } from "@/components/ui/page-loader";

interface ProfileAvatarCardProps {
  currentAvatarUrl?: string | null;
  userFullName?: string;
  userRole?: string;
  onAvatarUpdated?: (newUrl: string | null) => void;
}

export function ProfileAvatarCard({
  currentAvatarUrl,
  userFullName = "Utilisateur",
  userRole,
  onAvatarUpdated,
}: ProfileAvatarCardProps) {
  const { user, refreshUser, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialAvatar = currentAvatarUrl || user?.avatar_url || user?.avatar || user?.profile_photo || null;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar);
  const [isUploading, setIsUploading] = useState(false);

  // Synchroniser avec currentAvatarUrl ou le user auth
  useEffect(() => {
    if (currentAvatarUrl !== undefined) {
      setAvatarPreview(currentAvatarUrl);
    } else {
      setAvatarPreview(user?.avatar_url || user?.avatar || user?.profile_photo || null);
    }
  }, [currentAvatarUrl, user?.avatar_url, user?.avatar, user?.profile_photo]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du format
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format de fichier non supporté. Veuillez choisir une image JPG, PNG ou WEBP.");
      return;
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse. La taille maximale autorisée est de 5 Mo.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await updateProfile(formData);
      if (res.success) {
        toast.success("Photo de profil mise à jour avec succès.");
        const serverUrl = res.data?.avatar_url || res.data?.avatar || localPreviewUrl;
        setAvatarPreview(serverUrl);
        if (updateUser) {
          updateUser({ avatar: serverUrl, avatar_url: serverUrl, profile_photo: serverUrl });
        }
        if (refreshUser) await refreshUser();
        if (onAvatarUpdated) {
          onAvatarUpdated(serverUrl);
        }
      } else {
        toast.error(res.error || "Échec de la mise à jour de la photo de profil.");
        setAvatarPreview(initialAvatar);
      }
    } catch {
      toast.error("Impossible de joindre le serveur pour mettre à jour la photo.");
      setAvatarPreview(initialAvatar);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", "");

      const res = await updateProfile(formData);
      if (res.success) {
        setAvatarPreview(null);
        toast.success("Photo de profil supprimée.");
        if (updateUser) {
          updateUser({ avatar: undefined, avatar_url: undefined, profile_photo: null });
        }
        if (refreshUser) await refreshUser();
        if (onAvatarUpdated) onAvatarUpdated(null);
      } else {
        toast.error(res.error || "Impossible de supprimer la photo.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsUploading(false);
    }
  };

  const hasAvatar = Boolean(
    avatarPreview &&
    avatarPreview.trim() !== "" &&
    avatarPreview !== "null" &&
    avatarPreview !== "undefined" &&
    avatarPreview !== "None"
  );

  return (
    <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar avec cercle photo ou initiales impeccables */}
        <div className="relative shrink-0 group">
          <UserAvatar
            src={avatarPreview}
            name={userFullName}
            size="xl"
            className="border-2 border-gold/40 shadow-inner bg-navy/5"
          />

          {/* Overlay lors de l'upload */}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-navy/70 flex items-center justify-center text-gold z-10">
              <InlineLoader size={20} />
            </div>
          )}

          {/* Bouton déclencheur Camera */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Changer la photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-gold text-navy hover:bg-gold-light border-2 border-background shadow-md transition-transform hover:scale-105 disabled:opacity-50 cursor-pointer z-20"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Informations & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3 className="font-serif font-bold text-navy text-base sm:text-lg">
              Photo de Profil
            </h3>
            <p className="text-xs text-foreground-muted">
              Formats acceptés : JPG, PNG ou WEBP. Taille maximale : 5 Mo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[38px] disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <InlineLoader size={14} />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-gold" />
                  <span>Changer la photo</span>
                </>
              )}
            </button>

            {hasAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-bold transition-colors min-h-[38px] disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
