"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  Lock, 
  Users, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Handshake, 
  BookOpen, 
  Send, 
  ArrowRight, 
  Clock, 
  FileSearch, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  UploadCloud, 
  ShieldCheck, 
  Sparkles, 
  PenTool,
  AlertCircle,
  FileCheck,
  Check
} from "lucide-react";

export default function AuthorsPublicPage() {
  // Stepper state (1: Informations, 2: Fichier prêt, 3: Envoi confirmé)
  const [step, setStep] = useState<number>(1);
  const formRef = useRef<HTMLDivElement>(null);

  // Form inputs state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("Bénin");
  const [summary, setSummary] = useState("");
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // FAQ state (open questions)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setSubmitError(null);
    const validExtensions = [".pdf", ".doc", ".docx"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setSubmitError("Format non pris en charge. Envoyez votre manuscrit en PDF, DOC ou DOCX.");
      return;
    }
    setManuscriptFile(file);
    if (step === 1 && fullName && email && bookTitle) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim() || !email.trim() || !bookTitle.trim()) {
      setSubmitError("Ce champ est requis (Nom, E-mail, Titre).");
      setStep(1);
      return;
    }

    if (!manuscriptFile) {
      setSubmitError("Merci de joindre le fichier de votre manuscrit avant d'envoyer.");
      setStep(2);
      return;
    }

    if (!acceptTerms) {
      setSubmitError("Merci d'accepter les conditions générales pour continuer.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate submission to editorial board
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setStep(3);
    } catch {
      setIsSubmitting(false);
      setSubmitError("Une erreur est survenue. Vérifiez votre connexion et réessayez, ou contactez-nous à contact@lahatheque.com.");
    }
  };

  const faqs = [
    {
      q: "Quels types de manuscrits acceptez-vous ?",
      a: "Nous étudions notamment les ouvrages universitaires, scolaires, essais et projets pédagogiques. Chaque texte est évalué selon sa qualité et sa cohérence avec notre ligne éditoriale."
    },
    {
      q: "Puis-je soumettre un manuscrit déjà publié ailleurs ?",
      a: "Oui, à condition de disposer des droits nécessaires. Précisez la situation du livre dans le résumé afin que notre équipe puisse l'évaluer correctement."
    },
    {
      q: "Quels fichiers puis-je envoyer ?",
      a: "Le manuscrit doit être transmis au format PDF, DOC ou DOCX."
    },
    {
      q: "Comment serai-je informé de la suite ?",
      a: "Un accusé de réception est envoyé immédiatement par e-mail. L'équipe éditoriale reprend ensuite contact avec vous à l'adresse indiquée."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* 1. HERO SECTION & WIDGET FORMULAIRE D'ACCUEIL */}
      <section className="relative bg-navy text-white overflow-hidden py-12 lg:py-20 border-b border-navy-hover">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* Colonne Gauche : Pitch Éditorial & Badges */}
            <div className="lg:col-span-7 space-y-6 lg:space-y-8">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider">
                <PenTool className="w-4 h-4 text-gold" />
                Espace auteurs
              </div>

              <div className="space-y-4">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Votre histoire mérite d'être <span className="text-gold">publiée.</span>
                </h1>
                <p className="font-sans text-sm sm:text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
                  Soumettez votre manuscrit à Lahathèque. Notre comité de lecture analyse votre œuvre et vous accompagne à chaque étape du parcours éditorial.
                </p>
              </div>

              {/* Liste à puces avec icônes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Comité de lecture professionnel</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Accompagnement éditorial</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Suivi clair de votre dossier</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Données protégées</span>
                </div>
              </div>

              {/* CTA Principal Hero */}
              <div className="pt-2">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                >
                  <span>Soumettre mon manuscrit</span>
                  <ArrowRight className="w-4 h-4 text-navy group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Badges de Confiance Flottants */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-white/90">
                  <Lock className="w-4 h-4 text-gold" />
                  <span>Confidentiel</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-white/90">
                  <Users className="w-4 h-4 text-gold" />
                  <span>Suivi personnalisé</span>
                </div>
              </div>

            </div>

            {/* Colonne Droite : Formulaire Embarqué (Widget Multi-étapes) */}
            <div ref={formRef} id="submit-form" className="lg:col-span-5 bg-background text-foreground rounded-3xl p-6 sm:p-8 shadow-2xl border border-border">
              
              <div className="space-y-4">
                
                {/* Header Widget */}
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                    Soumettre mon manuscrit
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1">
                    Remplissez ce formulaire pour transmettre votre manuscrit à notre comité.
                  </p>
                </div>

                {/* Stepper (3 étapes) */}
                <div className="grid grid-cols-3 gap-2 pb-2">
                  <div className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                    step >= 1 ? "bg-navy text-white border-navy" : "bg-background-secondary text-foreground-muted border-border"
                  }`}>
                    <span className="block font-serif text-xs">1</span>
                    <span className="truncate block">Informations</span>
                  </div>
                  <div className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                    step >= 2 ? "bg-navy text-white border-navy" : "bg-background-secondary text-foreground-muted border-border"
                  }`}>
                    <span className="block font-serif text-xs">2</span>
                    <span className="truncate block">Fichier prêt</span>
                  </div>
                  <div className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                    step >= 3 ? "bg-navy text-white border-navy" : "bg-background-secondary text-foreground-muted border-border"
                  }`}>
                    <span className="block font-serif text-xs">3</span>
                    <span className="truncate block">Confirmé</span>
                  </div>
                </div>

                {/* Message de Succès */}
                {submitSuccess ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto border border-gold/30">
                      <Check className="w-7 h-7" />
                    </div>
                    <h4 className="font-serif text-lg font-bold text-navy">
                      Manuscrit bien reçu !
                    </h4>
                    <p className="text-xs text-foreground-muted leading-relaxed max-w-sm mx-auto">
                      Notre comité de lecture reviendra vers vous sous <strong>10 jours ouvrés</strong> à l'adresse <strong>{email}</strong>.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setStep(1);
                        setFullName("");
                        setEmail("");
                        setPhone("");
                        setBookTitle("");
                        setSummary("");
                        setManuscriptFile(null);
                        setAcceptTerms(false);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-navy text-white font-sans font-bold text-xs hover:bg-navy-hover transition-colors"
                    >
                      Soumettre un autre manuscrit
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    
                    {/* Alerte Erreur */}
                    {submitError && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Step 1 & 2 Champs */}
                    <div className="space-y-3">
                      
                      {/* Nom & Prénom */}
                      <div>
                        <label className="block font-bold text-navy mb-1">
                          Nom et prénom *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: Pr. Kossi Amouzou"
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                        />
                      </div>

                      {/* Email & Téléphone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-navy mb-1">
                            Adresse e-mail *
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="auteur@email.com"
                            className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy mb-1">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+229 01 23 45 67"
                            className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Titre de l'ouvrage */}
                      <div>
                        <label className="block font-bold text-navy mb-1">
                          Titre du manuscrit *
                        </label>
                        <input
                          type="text"
                          required
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          placeholder="Ex: Traité de Droit Commercial OHADA"
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                        />
                      </div>

                      {/* Genre / Matière & Pays */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-navy mb-1">
                            Genre / Discipline
                          </label>
                          <select
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
                          >
                            <option value="">Sélectionner</option>
                            <option value="Droit">Droit &amp; Sciences Politiques</option>
                            <option value="Économie">Économie &amp; Gestion</option>
                            <option value="Médecine">Médecine &amp; Santé</option>
                            <option value="Sciences Exactes">Sciences &amp; Technologies</option>
                            <option value="Agriculture">Agriculture &amp; Agronomie</option>
                            <option value="Scolaire">Manuel Scolaire</option>
                            <option value="Littérature">Littérature Africaine &amp; Roman</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-navy mb-1">
                            Pays
                          </label>
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
                          >
                            <option value="Bénin">Bénin</option>
                            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                            <option value="Sénégal">Sénégal</option>
                            <option value="Togo">Togo</option>
                            <option value="Guinée">Guinée</option>
                            <option value="Niger">Niger</option>
                            <option value="Autre">Autre pays</option>
                          </select>
                        </div>
                      </div>

                      {/* Description / Résumé avec compteur max 1000 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-navy">
                            Description / Résumé
                          </label>
                          <span className="text-[10px] text-foreground-muted">
                            {summary.length} / 1000
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Présentez brièvement le contenu et le public cible de votre ouvrage..."
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none resize-none"
                        />
                      </div>

                      {/* Zone Drag & Drop Fichier */}
                      <div>
                        <label className="block font-bold text-navy mb-1">
                          Fichier du manuscrit (PDF, DOC, DOCX) *
                        </label>
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-colors cursor-pointer ${
                            dragActive ? "border-gold bg-gold/5" : "border-border bg-background-secondary hover:border-navy"
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <UploadCloud className="w-6 h-6 text-gold mx-auto" />
                            {manuscriptFile ? (
                              <p className="font-bold text-navy text-xs flex items-center justify-center gap-1">
                                <FileCheck className="w-3.5 h-3.5 text-gold" />
                                {manuscriptFile.name} ({(manuscriptFile.size / (1024 * 1024)).toFixed(2)} Mo)
                              </p>
                            ) : (
                              <>
                                <p className="font-bold text-navy text-xs">
                                  Déposez votre manuscrit ici
                                </p>
                                <p className="text-[10px] text-foreground-muted">
                                  PDF, DOC ou DOCX (Max 50 Mo)
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Case à cocher CGU */}
                      <div className="pt-1">
                        <label className="flex items-start gap-2 cursor-pointer text-[11px] text-foreground-muted">
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-navy focus:ring-navy mt-0.5"
                          />
                          <span>
                            J'accepte les <Link href="/cgu" className="text-navy font-semibold underline">conditions générales</Link> et la <Link href="/legal" className="text-navy font-semibold underline">politique de confidentialité</Link>.
                          </span>
                        </label>
                      </div>

                    </div>

                    {/* Bouton d'Envoi */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <span>Envoi en cours...</span>
                        ) : (
                          <>
                            <span>Envoyer mon manuscrit</span>
                            <ArrowRight className="w-4 h-4 text-gold" />
                          </>
                        )}
                      </button>

                      {/* Micro-copy sécurité */}
                      <p className="text-[10px] text-center text-foreground-muted flex items-center justify-center gap-1.5">
                        <Lock className="w-3 h-3 text-gold" />
                        Dossier transmis directement au comité, sans stockage sur le site.
                      </p>
                    </div>

                  </form>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Comment ça marche ?
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
            Un parcours éditorial clair
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Un processus transparent en 4 étapes de la soumission de votre manuscrit jusqu'à sa diffusion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Étape 1 */}
          <div className="bg-background-secondary p-6 rounded-3xl border border-border space-y-4 hover:border-gold transition-colors">
            <div className="w-10 h-10 rounded-full bg-gold text-navy font-serif font-bold text-base flex items-center justify-center">
              1
            </div>
            <h3 className="font-serif font-bold text-navy text-base">
              Déposez votre manuscrit
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Complétez le formulaire et joignez votre œuvre pour étude éditoriale.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="bg-background-secondary p-6 rounded-3xl border border-border space-y-4 hover:border-gold transition-colors">
            <div className="w-10 h-10 rounded-full bg-gold text-navy font-serif font-bold text-base flex items-center justify-center">
              2
            </div>
            <h3 className="font-serif font-bold text-navy text-base">
              Analyse éditoriale
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Notre comité étudie votre texte et vous transmet une réponse éditoriale.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="bg-background-secondary p-6 rounded-3xl border border-border space-y-4 hover:border-gold transition-colors">
            <div className="w-10 h-10 rounded-full bg-gold text-navy font-serif font-bold text-base flex items-center justify-center">
              3
            </div>
            <h3 className="font-serif font-bold text-navy text-base">
              Définition du cadre éditorial
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Après l'analyse, notre équipe vous propose le cadre éditorial le plus adapté.
            </p>
          </div>

          {/* Étape 4 */}
          <div className="bg-background-secondary p-6 rounded-3xl border border-border space-y-4 hover:border-gold transition-colors">
            <div className="w-10 h-10 rounded-full bg-gold text-navy font-serif font-bold text-base flex items-center justify-center">
              4
            </div>
            <h3 className="font-serif font-bold text-navy text-base">
              Publication et diffusion
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Votre ouvrage est préparé pour sa publication et sa diffusion sur les canaux retenus.
            </p>
          </div>

        </div>

      </section>

      {/* 3. FORMULES D'ÉDITION */}
      <section className="bg-background-secondary border-t border-b border-border py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Formules d'édition
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
              Les cadres éditoriaux possibles
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Le cadre adapté est proposé par notre équipe après l'analyse de votre manuscrit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Bloc 1 — Compte d'auteur */}
            <div className="bg-background p-8 rounded-3xl border border-border hover:border-gold shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 inline-block">
                  Vous maîtrisez
                </span>
                <h3 className="font-serif text-2xl font-bold text-navy">
                  Compte d'auteur
                </h3>
                <ul className="space-y-3 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Vous gardez le contrôle de votre œuvre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Accompagnement éditorial personnalisé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Diffusion nationale et internationale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Suivi du projet après publication</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-border">
                <BookOpen className="w-8 h-8 text-navy/40" />
              </div>
            </div>

            {/* Bloc 2 — Compte d'éditeur */}
            <div className="bg-background p-8 rounded-3xl border-2 border-gold shadow-md flex flex-col justify-between space-y-6 relative">
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy px-3 py-1 rounded-full bg-gold text-white inline-block">
                  Lahathèque accompagne
                </span>
                <h3 className="font-serif text-2xl font-bold text-navy">
                  Compte d'éditeur
                </h3>
                <ul className="space-y-3 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Prise en charge éditoriale complète</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Conception et préparation du livre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Communication et promotion incluses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Redevances définies par contrat</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-border">
                <FileText className="w-8 h-8 text-gold" />
              </div>
            </div>

            {/* Bloc 3 — Coproduction */}
            <div className="bg-background p-8 rounded-3xl border border-border hover:border-gold shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 inline-block">
                  Projet partagé
                </span>
                <h3 className="font-serif text-2xl font-bold text-navy">
                  Coproduction
                </h3>
                <ul className="space-y-3 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Investissement partagé selon le projet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Responsabilités définies par contrat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Production et promotion conjointes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Répartition transparente des revenus</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-border">
                <Handshake className="w-8 h-8 text-navy/40" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. NOS ENGAGEMENTS */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Nos engagements
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
            Votre projet est traité avec attention
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-background-secondary p-8 rounded-3xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-navy text-lg">
              Confidentialité
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Vos fichiers restent strictement privés et réservés à l'étude éditoriale par notre comité.
            </p>
          </div>

          <div className="bg-background-secondary p-8 rounded-3xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-navy text-lg">
              Étude structurée
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Chaque projet est examiné selon des critères éditoriaux et académiques précis.
            </p>
          </div>

          <div className="bg-background-secondary p-8 rounded-3xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-navy text-lg">
              Échange humain
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Notre équipe vous accompagne dans la compréhension des prochaines étapes de publication.
            </p>
          </div>

        </div>

      </section>

      {/* 6. QUESTIONS FRÉQUENTES (ACCORDÉON) */}
      <section className="bg-background-secondary border-t border-border py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
              Questions <span className="text-gold">fréquentes</span>
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Tout ce que vous devez savoir avant de nous transmettre votre manuscrit.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-background rounded-2xl border border-border overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-serif font-bold text-navy text-sm sm:text-base cursor-pointer hover:text-gold transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-gold shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground-muted shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-foreground-muted leading-relaxed border-t border-border/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. BANDEAU "DÉJÀ UN COMPTE" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="bg-navy text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-navy-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Vous avez déjà un compte ?
              </h3>
              <p className="text-xs sm:text-sm text-white/80">
                Retrouvez vos commandes et votre bibliothèque numérique.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm transition-colors shrink-0"
          >
            <span>Accéder à mon espace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="bg-background-secondary border-t border-border py-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
              Restez informé·e
            </h3>
            <p className="text-xs text-foreground-muted">
              de nos nouveautés et offres exclusives.
            </p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex w-full sm:w-auto gap-2">
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
