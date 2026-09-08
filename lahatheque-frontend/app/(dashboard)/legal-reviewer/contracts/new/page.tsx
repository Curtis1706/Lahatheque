"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  Save,
  BookOpen,
  Users,
  Building2,
  Scale,
  Percent,
  FileSpreadsheet,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { PhoneInput } from "@/components/ui/phone-input";
import { getContractFormOptions, createLegalContract } from "@/lib/services/legal";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
import type {
  ContractType,
  ContractFormOptions,
} from "@/lib/types/legal";
import { toast } from "sonner";

function NewLegalContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const preEditionParamId = searchParams.get("pre_edition_id");
  const titleParam = searchParams.get("title");
  const authorNameParam = searchParams.get("author_name");
  const bookIdParam = searchParams.get("book_id");

  // Chargement des données réelles
  const [options, setOptions] = useState<ContractFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // État du formulaire
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(titleParam ? `Contrat d'Édition — ${titleParam}` : "");
  const [contractType, setContractType] = useState<ContractType>("author_contract");
  const [partyType, setPartyType] = useState<"author" | "university" | "publisher">("author");

  // Coordonnées & Juriste responsable
  const [contractingPartyEmail, setContractingPartyEmail] = useState("");
  const [contractingPartyPhone, setContractingPartyPhone] = useState("");
  const [juristeResponsableId, setJuristeResponsableId] = useState<string>(currentUser?.id ? String(currentUser.id) : "");

  useEffect(() => {
    if (currentUser?.id && !juristeResponsableId) {
      setJuristeResponsableId(String(currentUser.id));
    }
  }, [currentUser?.id, juristeResponsableId]);

  // Entités sélectionnées
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [selectedPreEditionId, setSelectedPreEditionId] = useState<string>(preEditionParamId || "");
  const [contractingPartyCustom, setContractingPartyCustom] = useState(authorNameParam || "");

  // Dates et notes
  const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("contrat, édition, redevance");

  // Taux de droits d'auteur par format (Fiche R3 - Bénéficiaire unique, défaut 5%)
  const [tauxPapier, setTauxPapier] = useState<number>(5);
  const [tauxNumerique, setTauxNumerique] = useState<number>(5);
  const [tauxAudio, setTauxAudio] = useState<number>(5);

  const [submitting, setSubmitting] = useState(false);

  // 1. Chargement des options réelles
  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const data = await getContractFormOptions();
        setOptions(data);

        // Si venant d'une pré-édition
        if (preEditionParamId) {
          setSelectedPreEditionId(preEditionParamId);
          setContractType("author_contract");
          setPartyType("author");
          if (titleParam) setTitle(`Contrat d'Édition — ${titleParam}`);

          // Recherche de l'auteur correspondant dans la base
          if (authorNameParam) {
            const authorParamNorm = (authorNameParam || "").toLowerCase();
            const found = data.authors?.find((a) => {
              const aNameNorm = (a?.name || "").toLowerCase();
              return (
                (aNameNorm && aNameNorm.includes(authorParamNorm)) ||
                (authorParamNorm && authorParamNorm.includes(aNameNorm))
              );
            });

            if (found) {
              setSelectedAuthorId(found.id);
            } else {
              setSelectedAuthorId(`custom:${authorNameParam}`);
            }
          } else if (data.authors && data.authors.length > 0) {
            setSelectedAuthorId(data.authors[0].id);
          }

          // Recherche d'un ouvrage existant ayant un titre similaire
          if (data.ouvrages && data.ouvrages.length > 0) {
            if (titleParam) {
              const titleParamNorm = (titleParam || "").toLowerCase();
              const foundBook = data.ouvrages.find((b) => {
                const bTitleNorm = (b?.title || "").toLowerCase();
                return (
                  (bTitleNorm && bTitleNorm.includes(titleParamNorm)) ||
                  (titleParamNorm && titleParamNorm.includes(bTitleNorm))
                );
              });
              if (foundBook) setSelectedBookId(foundBook.id);
              else setSelectedBookId(data.ouvrages[0].id);
            } else {
              setSelectedBookId(data.ouvrages[0].id);
            }
          }
        } else if (bookIdParam && data.ouvrages) {
          const matchedBook = data.ouvrages.find((b) => b.id === bookIdParam);

          if (matchedBook) {
            setSelectedBookId(matchedBook.id);
            setContractType("author_contract");
            setPartyType("author");
            setTitle(`Contrat d'Édition — ${matchedBook.title}`);

            const authorIds = matchedBook.author_user_ids || [];
            const authorNames = matchedBook.authors || [];

            if (authorIds.length > 0) {
              setSelectedAuthorId(authorIds[0]);
              const mainAuthor = data.authors?.find((a) => a.id === authorIds[0]);
              if (mainAuthor) {
                if (mainAuthor.email) setContractingPartyEmail(mainAuthor.email);
                if (mainAuthor.phone) setContractingPartyPhone(mainAuthor.phone);
              }
            } else if (authorNames.length > 0) {
              const matchedAuthor = data.authors?.find((a) => {
                const aNameNorm = (a?.name || "").toLowerCase();
                return authorNames.some((name) => {
                  const nameNorm = (name || "").toLowerCase();
                  return (
                    (aNameNorm && aNameNorm.includes(nameNorm)) ||
                    (nameNorm && nameNorm.includes(aNameNorm))
                  );
                });
              });
              if (matchedAuthor) {
                setSelectedAuthorId(matchedAuthor.id);
                if (matchedAuthor.email) setContractingPartyEmail(matchedAuthor.email);
                if (matchedAuthor.phone) setContractingPartyPhone(matchedAuthor.phone);
              } else {
                setSelectedAuthorId(`custom:${authorNames[0]}`);
              }
            }
          }
        } else {
          // Auto-sélection par défaut si disponibles
          if (data.ouvrages && data.ouvrages.length > 0) {
            setSelectedBookId(data.ouvrages[0].id);
            if (!title) setTitle(`Contrat d'Édition — ${data.ouvrages[0].title}`);
          }
          if (data.authors && data.authors.length > 0) {
            setSelectedAuthorId(data.authors[0].id);
          }
        }

        if (data.publishers && data.publishers.length > 0) {
          setSelectedPublisherId(data.publishers[0].id);
        }
        if (data.institutions && data.institutions.length > 0) {
          setSelectedInstitutionId(data.institutions[0].id);
        }
        if (data.juristes_disponibles && data.juristes_disponibles.length > 0) {
          setJuristeResponsableId((prev) => {
            if (prev) return prev;
            const currentMatch = currentUser?.id
              ? data.juristes_disponibles?.find((j) => String(j.id) === String(currentUser.id))
              : null;
            return currentMatch ? String(currentMatch.id) : String(data.juristes_disponibles![0].id);
          });
        }
      } catch (err) {
        toast.error("Impossible de charger les données du catalogue.");
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, [preEditionParamId, titleParam, authorNameParam, bookIdParam]);

  // Formatage des listes pour les SearchableSelect
  const bookOptions = useMemo(() => {
    if (!options?.ouvrages) return [];
    return options.ouvrages.map((b) => ({
      value: b.id,
      label: b.title,
      subtitle: b.isbn ? `ISBN: ${b.isbn}` : (b.authors?.join(", ") || "Ouvrage LAHA"),
      badge: b.status === "validated" ? "Validé" : (b.status || "Catalogue"),
    }));
  }, [options]);

  const authorOptions = useMemo(() => {
    const list = (options?.authors || []).map((a) => ({
      value: a.id,
      label: a.name,
      subtitle: a.email,
      badge: a.phone || "Auteur",
    }));

    const authorParamNorm = (authorNameParam || "").toLowerCase();
    if (
      authorParamNorm &&
      !list.some((a) => (a?.label || "").toLowerCase() === authorParamNorm)
    ) {
      list.unshift({
        value: `custom:${authorNameParam}`,
        label: `${authorNameParam} (Auteur du dossier)`,
        subtitle: "Compte à rattacher ou externe",
        badge: "Dossier",
      });
    }

    if (selectedAuthorId && selectedAuthorId.startsWith("custom:") && !list.some((a) => a.value === selectedAuthorId)) {
      const customName = selectedAuthorId.replace("custom:", "");
      list.unshift({
        value: selectedAuthorId,
        label: `${customName} (Auteur de l'ouvrage)`,
        subtitle: "Compte à rattacher ou externe",
        badge: "Ouvrage",
      });
    }

    return list;
  }, [options, authorNameParam, selectedAuthorId]);

  const institutionOptions = useMemo(() => {
    if (!options?.institutions) return [];
    return options.institutions.map((i) => ({
      value: i.id,
      label: i.name,
      subtitle: `Pays: ${i.country}`,
      badge: `Redevance: ${i.rate}%`,
    }));
  }, [options]);

  const publisherOptions = useMemo(() => {
    if (!options?.publishers) return [];
    return options.publishers.map((p) => ({
      value: p.id,
      label: p.name,
      subtitle: p.email || "Éditeur Tiers",
      badge: `Taux: ${p.rate}%`,
    }));
  }, [options]);

  const preEditionOptions = useMemo(() => {
    const list = options?.pre_editions || [];
    const base = list.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.title}`,
      subtitle: `Auteur: ${p.author_name}`,
      badge: p.code,
    }));
    return [{ value: "", label: "Aucun (Création directe sans pré-édition)", subtitle: "Contrat direct pour nouvel ouvrage" }, ...base];
  }, [options]);

  // Informations sur la pré-édition sélectionnée
  const selectedPreEditionDetails = useMemo(() => {
    if (!selectedPreEditionId || !options?.pre_editions) return null;
    return options.pre_editions.find((p) => p.id === selectedPreEditionId) || null;
  }, [selectedPreEditionId, options]);

  // Synchronisation automatique selon le type de contrat
  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    const book = options?.ouvrages.find((b) => b.id === bookId);
    if (book) {
      setTitle(`Contrat d'Édition — ${book.title}`);

      const authorIds = book.author_user_ids || [];
      const authorNames = book.authors || [];

      if (authorIds.length > 0) {
        const equalShare = parseFloat((100 / authorIds.length).toFixed(2));
        const newSplits = authorIds.map((uid, idx) => ({
          user_id: uid,
          name: authorNames[idx] || "Auteur",
          role_libelle: idx === 0 ? "Auteur Principal" : "Co-Auteur",
          pourcentage: idx === authorIds.length - 1
            ? parseFloat((100 - equalShare * (authorIds.length - 1)).toFixed(2))
            : equalShare,
          taux_papier: book.is_paper_available ? equalShare : 0,
          taux_numerique: equalShare,
          taux_audio_tts: book.has_audio_tracks ? equalShare : 0,
        }));
        setSelectedAuthorId(authorIds[0]);
        const mainAuthor = options?.authors?.find((a) => a.id === authorIds[0]);
        if (mainAuthor) {
          if (mainAuthor.email) setContractingPartyEmail(mainAuthor.email);
          if (mainAuthor.phone) setContractingPartyPhone(mainAuthor.phone);
        }
      } else if (authorNames.length > 0) {
        const matchedAuthor = options?.authors?.find((a) => {
          const aNameNorm = (a?.name || "").toLowerCase();
          return authorNames.some((name) => {
            const nameNorm = (name || "").toLowerCase();
            return (
              (aNameNorm && aNameNorm.includes(nameNorm)) ||
              (nameNorm && nameNorm.includes(aNameNorm))
            );
          });
        });
        if (matchedAuthor) {
          setSelectedAuthorId(matchedAuthor.id);
          if (matchedAuthor.email) setContractingPartyEmail(matchedAuthor.email);
          if (matchedAuthor.phone) setContractingPartyPhone(matchedAuthor.phone);
        } else {
          setSelectedAuthorId(`custom:${authorNames[0]}`);
        }
      }
    }
  };

  const handleAuthorChange = (authorId: string) => {
    setSelectedAuthorId(authorId);
    const author = options?.authors.find((a) => a.id === authorId);
    if (author) {
      if (author.email) setContractingPartyEmail(author.email);
      if (author.phone) setContractingPartyPhone(author.phone);
    }
  };

  const handleContractTypeChange = (newType: ContractType) => {
    setContractType(newType);
    if (newType === "author_contract" || newType === "pre_edition") {
      setPartyType("author");
      const book = options?.ouvrages.find((b) => b.id === selectedBookId);
      if (book) setTitle(`Contrat d'Édition — ${book.title}`);
    } else if (newType === "university_agreement") {
      setPartyType("university");
      const inst = options?.institutions.find((i) => i.id === selectedInstitutionId);
      if (inst) setTitle(`Convention Partenariat — ${inst.name}`);
    } else if (newType === "publisher_partnership") {
      setPartyType("publisher");
      const pub = options?.publishers.find((p) => p.id === selectedPublisherId);
      if (pub) {
        setTitle(`Contrat de Distribution — ${pub.name}`);
        if (pub.email) setContractingPartyEmail(pub.email);
      }
    }
  };

  // Gestion de la clé de répartition et validation conditionnelle des taux par format
  const selectedBook = useMemo(() => {
    if (!selectedBookId || !options?.ouvrages) return null;
    return options.ouvrages.find((b) => b.id === selectedBookId) || null;
  }, [selectedBookId, options]);

  const bookHasPaper = selectedBook?.is_paper_available ?? false;
  const bookHasAudio = selectedBook?.has_audio_tracks ?? false;

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAuthorType = contractType === "author_contract" || contractType === "pre_edition";

    if (isAuthorType && !selectedAuthorId) {
      toast.error("Veuillez sélectionner un bénéficiaire (compte auteur).");
      return;
    }

    setSubmitting(true);
    try {
      let contractingPartyName = contractingPartyCustom;
      if (isAuthorType) {
        const auth = options?.authors.find((a) => a.id === selectedAuthorId);
        if (auth) contractingPartyName = auth.name;
      } else if (contractType === "university_agreement") {
        const inst = options?.institutions.find((i) => i.id === selectedInstitutionId);
        if (inst) contractingPartyName = inst.name;
      } else if (contractType === "publisher_partnership") {
        const pub = options?.publishers.find((p) => p.id === selectedPublisherId);
        if (pub) contractingPartyName = pub.name;
      }

      const realBeneficiaryId = selectedAuthorId && !selectedAuthorId.startsWith("custom:")
        ? selectedAuthorId
        : undefined;

      await createLegalContract(
        {
          title,
          contracting_party: contractingPartyName || "Partie Contractante",
          contracting_party_email: contractingPartyEmail.trim(),
          contracting_party_phone: contractingPartyPhone.trim(),
          juriste_responsable_id: juristeResponsableId || (currentUser?.id ? String(currentUser.id) : undefined),
          party_type: partyType,
          type: contractType,
          signed_at: signedAt,
          expires_at: expiresAt || undefined,
          notes,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          ouvrage_id: isAuthorType ? selectedBookId : undefined,
          signataire_user_id: partyType === "author" ? realBeneficiaryId : undefined,
          beneficiary_user_id: partyType === "author" ? realBeneficiaryId : undefined,
          taux_papier: bookHasPaper ? tauxPapier : 0,
          taux_numerique: tauxNumerique,
          taux_audio_tts: bookHasAudio ? tauxAudio : 0,
          author_royalty_rate: tauxNumerique,
          institution_id: contractType === "university_agreement" ? selectedInstitutionId : undefined,
          publisher_id: contractType === "publisher_partnership" ? selectedPublisherId : undefined,
          pre_edition_id: selectedPreEditionId || undefined,
        },
        file
      );

      toast.success("Contrat enregistré, lié à l'ouvrage et droits verrouillés avec succès !");
      router.push("/legal-reviewer/contracts");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement du contrat.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorContract = contractType === "author_contract" || contractType === "pre_edition";

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <Link href="/legal-reviewer/contracts" className="hover:text-navy">
          Contrats
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Contrat</span>
      </div>

      {/* En-tête */}
      <div>
        <Link
          href="/legal-reviewer/contracts"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux Contrats
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Enregistrer un Contrat d&apos;Édition &amp; Verrouiller les Droits
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Rattachement automatique aux entités de la base (Ouvrages, Auteurs, Universités, Pré-éditions) et configuration de la clé de redevance (100%).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Étape 1 : Document PDF */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-gold" />
              1. Document Scanné ou Numérique (PDF / DOCX)
            </h3>
            <span className="text-2xs text-foreground-muted bg-background-secondary px-2.5 py-1 rounded-full border border-border">
              Jusqu&apos;à 800 Mo
            </span>
          </div>

          <FileDropzone
            acceptTypes={[".pdf", ".docx"]}
            label="Téléversement sécurisé du fichier officiel (PDF ou DOCX signé) *"
            onFileSelect={(f) => setFile(f)}
            onFileRemove={() => setFile(null)}
            selectedFileName={file?.name}
            selectedFileSize={file?.size}
          />
        </div>

        {/* Étape 2 : Rattachement Métier & Recherche */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            2. Rattachement Métier &amp; Sélection Recherchable en Base
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type de contrat */}
            <div>
              <label htmlFor="contract-type-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Type de Contrat *
              </label>
              <select
                id="contract-type-select"
                value={contractType}
                onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
              >
                <option value="author_contract">Contrat d&apos;Édition Auteur</option>
                <option value="university_agreement">Convention Cadre Université</option>
                <option value="publisher_partnership">Partenariat Éditeur Tiers</option>
              </select>
            </div>

            {/* Titre du contrat */}
            <div>
              <label htmlFor="contract-title-input" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Intitulé Officiel du Contrat *
              </label>
              <input
                id="contract-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Contrat d'Édition Exclusive — Titre de l'ouvrage"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required
              />
            </div>

            {/* Cas Contrat d'édition auteur -> Ouvrage, Auteur & Pré-édition liée */}
            {isAuthorContract && (
              <>
                <div>
                  <label className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                    Ouvrage Rattaché dans le Catalogue *
                  </label>
                  <SearchableSelect
                    options={bookOptions}
                    value={selectedBookId}
                    onChange={handleBookChange}
                    placeholder="Rechercher un ouvrage par titre ou ISBN..."
                    searchPlaceholder="Taper le titre ou l'ISBN..."
                    icon={<BookOpen className="w-4 h-4" />}
                    disabled={loadingOptions}
                  />

                  {selectedBook && (
                    <div className="mt-2 p-3 rounded-xl bg-background border border-border flex flex-wrap gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-foreground-muted uppercase block">Prix Numérique</span>
                        <span className="text-sm font-semibold text-navy">
                          {selectedBook.price_digital != null ? `${selectedBook.price_digital.toLocaleString("fr-FR")} FCFA` : "Non défini"}
                        </span>
                      </div>
                      {selectedBook.is_paper_available && (
                        <div>
                          <span className="text-[10px] font-bold text-foreground-muted uppercase block">Prix Papier</span>
                          <span className="text-sm font-semibold text-navy">
                            {selectedBook.price_paper != null ? `${selectedBook.price_paper.toLocaleString("fr-FR")} FCFA` : "Non défini"}
                          </span>
                        </div>
                      )}
                      {selectedBook.has_audio_tracks && (
                        <div>
                          <span className="text-[10px] font-bold text-foreground-muted uppercase block">Prix Livre Audio</span>
                          <span className="text-sm font-semibold text-navy">
                            {selectedBook.price_audio != null ? `${selectedBook.price_audio.toLocaleString("fr-FR")} FCFA` : "Non défini"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    Auteur Signataire Principal *
                  </label>
                  <SearchableSelect
                    options={authorOptions}
                    value={selectedAuthorId}
                    onChange={handleAuthorChange}
                    placeholder="Rechercher un auteur par nom ou email..."
                    searchPlaceholder="Taper le nom ou l'email..."
                    icon={<Users className="w-4 h-4" />}
                    disabled={loadingOptions}
                  />
                </div>

                {/* Sélecteur de Dossier de Pré-Édition Lié */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
                    Dossier de Pré-Édition Lié (Optionnel)
                  </label>
                  <SearchableSelect
                    options={preEditionOptions}
                    value={selectedPreEditionId}
                    onChange={(val) => setSelectedPreEditionId(val)}
                    placeholder="Lier à un dossier de pré-édition existant..."
                    searchPlaceholder="Taper le code dossier ou titre prévisionnel..."
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    disabled={loadingOptions}
                  />
                </div>

                {/* Encart récapitulatif du dossier de pré-édition lié */}
                {selectedPreEditionDetails && (
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[10px] text-gold uppercase px-1.5 py-0.5 rounded bg-navy border border-gold/30">
                          {selectedPreEditionDetails.code}
                        </span>
                        <span className="font-bold text-navy">{selectedPreEditionDetails.title}</span>
                      </div>
                      <p className="text-[11px] text-foreground-muted">
                        Auteur bénéficiaire : <strong className="text-navy">{selectedPreEditionDetails.author_name}</strong> {selectedPreEditionDetails.author_email && `(${selectedPreEditionDetails.author_email})`}
                      </p>
                    </div>
                    <span className="text-2xs font-semibold text-gold bg-navy px-3 py-1.5 rounded-xl border border-gold/30 shrink-0 self-start sm:self-auto">
                      Pré-édition rattachée
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Cas 2: Convention Université -> Searchable Select Université */}
            {contractType === "university_agreement" && (
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gold" />
                  Université / Institution Partenaire *
                </label>
                <SearchableSelect
                  options={institutionOptions}
                  value={selectedInstitutionId}
                  onChange={(val) => {
                    setSelectedInstitutionId(val);
                    const inst = options?.institutions.find((i) => i.id === val);
                    if (inst) setTitle(`Convention Partenariat — ${inst.name}`);
                  }}
                  placeholder="Rechercher une université par nom ou pays..."
                  searchPlaceholder="Taper le nom de l'université..."
                  icon={<Building2 className="w-4 h-4" />}
                  disabled={loadingOptions}
                />
              </div>
            )}

            {/* Cas 3: Éditeur Tiers -> Searchable Select Éditeur */}
            {contractType === "publisher_partnership" && (
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gold" />
                  Éditeur Tiers Enregistré *
                </label>
                <SearchableSelect
                  options={publisherOptions}
                  value={selectedPublisherId}
                  onChange={(val) => {
                    setSelectedPublisherId(val);
                    const pub = options?.publishers.find((p) => p.id === val);
                    if (pub) setTitle(`Contrat de Distribution — ${pub.name}`);
                  }}
                  placeholder="Rechercher un éditeur partenaire..."
                  searchPlaceholder="Taper le nom de l'éditeur..."
                  icon={<Building2 className="w-4 h-4" />}
                  disabled={loadingOptions}
                />
              </div>
            )}

            {/* Coordonnées de la partie contractante */}
            <div>
              <label htmlFor="contracting-party-email" className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gold" />
                Email de la Partie Contractante
              </label>
              <input
                id="contracting-party-email"
                type="email"
                value={contractingPartyEmail}
                onChange={(e) => setContractingPartyEmail(e.target.value)}
                placeholder="contact@auteur-ou-partenaire.bj"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="contracting-party-phone" className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gold" />
                Téléphone de la Partie Contractante
              </label>
              <PhoneInput
                id="contracting-party-phone"
                value={contractingPartyPhone}
                onChange={setContractingPartyPhone}
                placeholder="97 00 00 00"
                className="bg-background-secondary min-h-[44px]"
              />
            </div>

            {/* Sélecteur du Juriste responsable du dossier */}
            <div className="sm:col-span-2">
              <label htmlFor="juriste-responsable-select" className="text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-gold" />
                Juriste Responsable du Dossier *
              </label>
              <select
                id="juriste-responsable-select"
                value={juristeResponsableId}
                onChange={(e) => setJuristeResponsableId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
              >
                {options?.juristes_disponibles && options.juristes_disponibles.length > 0 ? (
                  options.juristes_disponibles.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name || `${j.first_name || ""} ${j.last_name || ""}`.trim() || "Juriste"}
                    </option>
                  ))
                ) : (
                  <option value={currentUser?.id || ""}>
                    {currentUser ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email : "Moi-même (Juriste connecté)"}
                  </option>
                )}
              </select>
            </div>

            {/* Dates avec DatePicker chic */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date de Signature / Entrée en Vigueur *
              </label>
              <DatePicker
                value={signedAt}
                onChange={setSignedAt}
                placeholder="Sélectionner la date de signature..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date d&apos;Échéance (Optionnelle)
              </label>
              <DatePicker
                value={expiresAt}
                onChange={setExpiresAt}
                placeholder="Sélectionner la date d'échéance..."
                presets={[
                  { label: "+1 an", offsetYears: 1 },
                  { label: "+3 ans", offsetYears: 3 },
                  { label: "+5 ans", offsetYears: 5 },
                  { label: "+10 ans", offsetYears: 10 },
                ]}
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="contract-notes-input" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Notes &amp; Particularités Juridiques
              </label>
              <textarea
                id="contract-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Clauses d'exclusivité, dérogations de taux, territoires concédés..."
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[70px]"
              />
            </div>
          </div>
        </div>

        {/* Étape 3 : Bénéficiaire & Taux de Droits d'Auteur par Format (Fiche R3) */}
        {isAuthorContract && (
          <div className="p-4 sm:p-6 rounded-3xl border border-border bg-background-secondary space-y-4 shadow-xs">
            {selectedAuthorId?.startsWith("custom:") && (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning-dark">
                Cet auteur ne correspond à aucun compte réel sur la plateforme. Le contrat sera créé, mais
                les taux par format ne pourront être enregistrés qu&apos;une fois un compte auteur rattaché.
              </div>
            )}
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
              Bénéficiaire &amp; Taux de Droits d&apos;Auteur par Format
            </h3>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Bénéficiaire (Compte Auteur) *
              </label>
              <SearchableSelect
                options={authorOptions}
                value={selectedAuthorId}
                onChange={handleAuthorChange}
                placeholder="Sélectionner l'auteur ayant droit unique..."
                searchPlaceholder="Rechercher l'auteur..."
                icon={<Users className="w-3.5 h-3.5" />}
                disabled={loadingOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bookHasPaper && (
                <div>
                  <label htmlFor="taux-papier-input" className="block text-[11px] font-bold text-navy uppercase mb-1">
                    Taux Papier (%)
                  </label>
                  <input
                    id="taux-papier-input"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={tauxPapier}
                    onChange={(e) => setTauxPapier(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
                  />
                </div>
              )}
              <div>
                <label htmlFor="taux-numerique-input" className="block text-[11px] font-bold text-navy uppercase mb-1">
                  Taux Numérique (%)
                </label>
                <input
                  id="taux-numerique-input"
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={tauxNumerique}
                  onChange={(e) => setTauxNumerique(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
                />
              </div>
              {bookHasAudio && (
                <div>
                  <label htmlFor="taux-audio-input" className="block text-[11px] font-bold text-navy uppercase mb-1">
                    Taux Livre Audio (%)
                  </label>
                  <input
                    id="taux-audio-input"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={tauxAudio}
                    onChange={(e) => setTauxAudio(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-foreground-muted">
              Chaque taux représente le pourcentage du prix de vente de ce format précis qui revient à
              l&apos;auteur. Le reste reste à LAHA Éditions en tant qu&apos;éditeur. Taux par défaut : 5%.
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/legal-reviewer/contracts"
            className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting || (isAuthorContract && !selectedAuthorId)}
            className="px-6 py-2.5 rounded-xl bg-navy text-gold text-xs font-bold hover:bg-navy-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] border border-gold/30 shadow-xs cursor-pointer"
          >
            {submitting ? (
              <InlineLoader size={16} />
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                Enregistrer &amp; Verrouiller le Contrat
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewLegalContractPage() {
  return (
    <Suspense fallback={<PageLoader label="Chargement du formulaire de contrat" />}>
      <NewLegalContractContent />
    </Suspense>
  );
}
