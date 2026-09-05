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
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { getContractFormOptions, createLegalContract } from "@/lib/services/legal";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
import type {
  ContractType,
  ContractFormOptions,
  ContractRoyaltySplit,
} from "@/lib/types/legal";
import { toast } from "sonner";

function NewLegalContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const preEditionParamId = searchParams.get("pre_edition_id");
  const titleParam = searchParams.get("title");
  const authorNameParam = searchParams.get("author_name");

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

  // Grille de répartition des droits
  const [splits, setSplits] = useState<ContractRoyaltySplit[]>([
    {
      role_libelle: "Auteur Principal",
      pourcentage: 100.0,
      taux_papier: 10.0,
      taux_numerique: 15.0,
      taux_audio_tts: 8.0,
    },
  ]);

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
            const found = data.authors?.find(
              (a) =>
                a.name.toLowerCase().includes(authorNameParam.toLowerCase()) ||
                authorNameParam.toLowerCase().includes(a.name.toLowerCase())
            );

            if (found) {
              setSelectedAuthorId(found.id);
              setSplits([
                {
                  user_id: found.id,
                  name: found.name,
                  role_libelle: "Auteur Principal",
                  pourcentage: 100.0,
                  taux_papier: 10.0,
                  taux_numerique: 15.0,
                  taux_audio_tts: 8.0,
                },
              ]);
            } else {
              // Auteur externe ou du dossier
              const customVal = `custom:${authorNameParam}`;
              setSelectedAuthorId(customVal);
              setSplits([
                {
                  name: authorNameParam,
                  role_libelle: "Auteur Principal",
                  pourcentage: 100.0,
                  taux_papier: 10.0,
                  taux_numerique: 15.0,
                  taux_audio_tts: 8.0,
                },
              ]);
            }
          } else if (data.authors && data.authors.length > 0) {
            setSelectedAuthorId(data.authors[0].id);
            setSplits([
              {
                user_id: data.authors[0].id,
                name: data.authors[0].name,
                role_libelle: "Auteur Principal",
                pourcentage: 100.0,
                taux_papier: 10.0,
                taux_numerique: 15.0,
                taux_audio_tts: 8.0,
              },
            ]);
          }

          // Recherche d'un ouvrage existant ayant un titre similaire
          if (data.ouvrages && data.ouvrages.length > 0) {
            if (titleParam) {
              const foundBook = data.ouvrages.find(
                (b) =>
                  b.title.toLowerCase().includes(titleParam.toLowerCase()) ||
                  titleParam.toLowerCase().includes(b.title.toLowerCase())
              );
              if (foundBook) setSelectedBookId(foundBook.id);
              else setSelectedBookId(data.ouvrages[0].id);
            } else {
              setSelectedBookId(data.ouvrages[0].id);
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
            setSplits([
              {
                user_id: data.authors[0].id,
                name: data.authors[0].name,
                role_libelle: "Auteur Principal",
                pourcentage: 100.0,
                taux_papier: 10.0,
                taux_numerique: 15.0,
                taux_audio_tts: 8.0,
              },
            ]);
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
  }, [preEditionParamId, titleParam, authorNameParam]);

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

    if (authorNameParam && !list.some((a) => a.label.toLowerCase() === authorNameParam.toLowerCase())) {
      list.unshift({
        value: `custom:${authorNameParam}`,
        label: `${authorNameParam} (Auteur du dossier)`,
        subtitle: "Compte à rattacher ou externe",
        badge: "Dossier",
      });
    }

    return list;
  }, [options, authorNameParam]);

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
    }
  };

  const handleAuthorChange = (authorId: string) => {
    setSelectedAuthorId(authorId);
    const author = options?.authors.find((a) => a.id === authorId);
    if (author) {
      if (author.email) setContractingPartyEmail(author.email);
      if (author.phone) setContractingPartyPhone(author.phone);
      setSplits((prev) => {
        if (prev.length === 0) {
          return [
            {
              user_id: author.id,
              name: author.name,
              role_libelle: "Auteur Principal",
              pourcentage: 100.0,
              taux_papier: 10.0,
              taux_numerique: 15.0,
              taux_audio_tts: 8.0,
            },
          ];
        }
        const copy = [...prev];
        copy[0] = { ...copy[0], user_id: author.id, name: author.name };
        return copy;
      });
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

  // Gestion de la clé de répartition
  const totalPercentage = splits.reduce((acc, curr) => acc + (Number(curr.pourcentage) || 0), 0);
  const isPercentageValid = Math.abs(totalPercentage - 100.0) < 0.01;

  const addCoAuthorSplit = () => {
    if (!options?.authors || options.authors.length === 0) return;
    const available = options.authors.find((a) => !splits.some((s) => s.user_id === a.id)) || options.authors[0];
    setSplits([
      ...splits,
      {
        user_id: available.id,
        name: available.name,
        role_libelle: "Co-auteur",
        pourcentage: 0,
        taux_papier: 10.0,
        taux_numerique: 15.0,
        taux_audio_tts: 8.0,
      },
    ]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof ContractRoyaltySplit, value: any) => {
    const updated = [...splits];
    if (field === "user_id") {
      const author = options?.authors.find((a) => a.id === value);
      updated[index] = {
        ...updated[index],
        user_id: value,
        name: author ? author.name : "",
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setSplits(updated);
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAuthorType = contractType === "author_contract" || contractType === "pre_edition";

    if (isAuthorType && !isPercentageValid) {
      toast.error(`La somme de la clé de répartition doit être de 100.00% (Somme actuelle : ${totalPercentage.toFixed(2)}%).`);
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
          signataire_user_id: partyType === "author" ? selectedAuthorId : undefined,
          institution_id: contractType === "university_agreement" ? selectedInstitutionId : undefined,
          publisher_id: contractType === "publisher_partnership" ? selectedPublisherId : undefined,
          pre_edition_id: selectedPreEditionId || undefined,
          repartitions: isAuthorType ? splits : undefined,
        },
        file
      );

      toast.success("Contrat enregistré, lié à l'ouvrage et clés de répartition verrouillées avec succès !");
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
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
              <label htmlFor="contracting-party-email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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
              <label htmlFor="contracting-party-phone" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gold" />
                Téléphone de la Partie Contractante
              </label>
              <input
                id="contracting-party-phone"
                type="tel"
                value={contractingPartyPhone}
                onChange={(e) => setContractingPartyPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            {/* Sélecteur du Juriste responsable du dossier */}
            <div className="sm:col-span-2">
              <label htmlFor="juriste-responsable-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
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

        {/* Étape 3 : Grille de Répartition des Droits (Verrouillage 100%) */}
        {isAuthorContract && (
          <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gold" />
                  3. Clé de Répartition des Redevances Auteurs (Somme stricte 100%)
                </h3>
                <p className="text-2xs text-foreground-muted mt-0.5">
                  Définit la quote-part perçue par chaque ayant droit lors des ventes papier, numériques et écoutes audio.
                </p>
              </div>

              <button
                type="button"
                onClick={addCoAuthorSplit}
                className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-dark text-gold text-2xs font-bold transition-colors border border-gold/30 inline-flex items-center gap-1.5 min-h-[36px] self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                Ajouter un Co-Auteur
              </button>
            </div>

            {/* Jauge de conformité 100% */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
                isPercentageValid
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-error/10 border-error/30 text-error"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPercentageValid ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-error" />
                )}
                <span>
                  {isPercentageValid
                    ? "Clé de répartition 100.00% validée et conforme."
                    : `Attention : La somme des quotes-parts doit égaler 100.00% (Actuel : ${totalPercentage.toFixed(2)}%)`}
                </span>
              </div>
              <span className="font-mono text-sm">{totalPercentage.toFixed(2)}%</span>
            </div>

            {/* Liste des ayants droit avec SearchableSelect */}
            <div className="space-y-3">
              {splits.map((split, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-navy text-gold text-2xs font-bold flex items-center justify-center border border-gold/30">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-navy">
                        {split.role_libelle || "Ayant Droit"}
                      </span>
                    </div>

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSplit(index)}
                        className="p-1.5 text-foreground-muted hover:text-error transition-colors rounded-lg cursor-pointer"
                        title="Supprimer cet ayant droit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-2xs font-bold text-navy uppercase mb-1">
                        Bénéficiaire (Compte Auteur)
                      </label>
                      <SearchableSelect
                        options={authorOptions}
                        value={split.user_id || ""}
                        onChange={(val) => updateSplit(index, "user_id", val)}
                        placeholder="Choisir l'auteur..."
                        searchPlaceholder="Rechercher l'auteur..."
                        icon={<Users className="w-3.5 h-3.5" />}
                        disabled={loadingOptions}
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-navy uppercase mb-1">
                        Rôle Contractuel
                      </label>
                      <input
                        type="text"
                        value={split.role_libelle}
                        onChange={(e) => updateSplit(index, "role_libelle", e.target.value)}
                        placeholder="ex. Auteur, Co-auteur, Illustrateur"
                        className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-navy uppercase mb-1 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-gold" />
                        Quote-part (%) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={split.pourcentage}
                        onChange={(e) => updateSplit(index, "pourcentage", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-bold min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50 text-2xs text-foreground-muted">
                    <div>
                      <span className="block font-semibold text-navy">Taux Papier :</span>
                      <span>{split.taux_papier || 10}%</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-navy">Taux Numérique :</span>
                      <span>{split.taux_numerique || 15}%</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-navy">Taux Audio TTS :</span>
                      <span>{split.taux_audio_tts || 8}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            disabled={submitting || (isAuthorContract && !isPercentageValid)}
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
