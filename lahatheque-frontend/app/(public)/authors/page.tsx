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
  ArrowRight, 
  Clock, 
  FileSearch, 
  UploadCloud, 
  ShieldCheck, 
  PenTool,
  AlertCircle,
  FileCheck2,
  Check,
  Plus,
  Minus,
  Mail,
  Send
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

export default function AuthorsPublicPage() {
  // Stepper state
  const [step, setStep] = useState<number>(1);
  const formRef = useRef<HTMLDivElement>(null);

  // Form inputs state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("");
  const [summary, setSummary] = useState("");
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Accordion FAQ state (open questions)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

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
    if (step === 1 && firstName && lastName && email && bookTitle) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !bookTitle.trim() || !phone.trim() || !country || !genre) {
      setSubmitError("Ce champ est requis.");
      return;
    }

    if (!manuscriptFile) {
      setSubmitError("Merci de joindre le fichier de votre manuscrit avant d'envoyer.");
      return;
    }

    if (!acceptTerms) {
      setSubmitError("Merci d'accepter les conditions générales pour continuer.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulation d'envoi vers le comité éditorial
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
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-16">
        
        {/* 1. HERO BANNER PRINCIPALE (Image + Navy Fade) */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl bg-navy border border-navy-hover">
          
          {/* Photo de fond sur la droite */}
          <div className="absolute inset-0 z-0 flex justify-end">
            <div className="w-full lg:w-3/5 h-full relative">
              <img
                src="/authors-hero.jpg"
                alt="Comité de lecture et auteurs LAHAThèque"
                className="w-full h-full object-cover object-center"
              />
              {/* Dégradé de fondu de gauche (Navy vers transparent) */}
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent hidden lg:block" />
              {/* Overlay mobile */}
              <div className="absolute inset-0 bg-navy/85 lg:hidden" />
            </div>
          </div>

          {/* Badges de confiance flottants en haut à droite */}
          <div className="absolute top-6 right-6 z-20 hidden md:flex flex-col gap-2.5">
            <div className="flex items-center gap-2 bg-navy/90 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg">
              <Lock className="w-4 h-4 text-gold" />
              <span>Confidentiel</span>
            </div>
            <div className="flex items-center gap-2 bg-navy/90 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg">
              <Users className="w-4 h-4 text-gold" />
              <span>Suivi personnalisé</span>
            </div>
          </div>

          {/* Contenu Textuel du Hero (Gauche) */}
          <div className="relative z-10 max-w-2xl p-8 sm:p-12 lg:p-14 space-y-6 text-white">
            
            <div className="text-xs font-bold uppercase tracking-widest text-gold">
              Espace auteurs
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Votre histoire mérite d'être <span className="text-gold">publiée.</span>
            </h1>

            <p className="font-sans text-xs sm:text-sm md:text-base text-white/85 leading-relaxed max-w-xl">
              Soumettez votre manuscrit à LAHAThèque. Notre comité de lecture analyse votre œuvre et vous accompagne à chaque étape du parcours éditorial.
            </p>

            {/* Checklist 4 points avec icônes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <Users className="w-4 h-4 text-gold shrink-0" />
                <span>Comité de lecture professionnel</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <PenTool className="w-4 h-4 text-gold shrink-0" />
                <span>Accompagnement éditorial</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <span>Suivi clair de votre dossier</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span>Données protégées</span>
              </div>
            </div>

            {/* CTA Bouton */}
            <div className="pt-3">
              <button
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              >
                <span>Soumettre mon manuscrit</span>
                <ArrowRight className="w-4 h-4 text-navy group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </section>

        {/* 2. LAYOUT EN 2 COLONNES (Gauche: Étapes & Formules / Droite: Formulaire Sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLONNE GAUCHE (7/12) */}
          <div className="lg:col-span-7 space-y-14 lg:space-y-16">
            
            {/* SECTION 2 : COMMENT ÇA MARCHE */}
            <div className="space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  Comment ça marche ?
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                  Un parcours éditorial clair
                </h2>
              </div>

              {/* 4 Étapes Horizontales Empilées */}
              <div className="space-y-4">
                
                {/* Étape 1 */}
                <div className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:border-gold transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    1
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-navy text-sm sm:text-base">
                      1. Déposez votre manuscrit
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Complétez le formulaire et joignez votre œuvre pour étude éditoriale.
                    </p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:border-gold transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    2
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-navy text-sm sm:text-base">
                      2. Analyse éditoriale
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Notre comité étudie votre texte et vous transmet une réponse éditoriale.
                    </p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:border-gold transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    3
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-navy text-sm sm:text-base">
                      3. Définition du cadre éditorial
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Après l'analyse, notre équipe vous propose le cadre éditorial le plus adapté.
                    </p>
                  </div>
                </div>

                {/* Étape 4 */}
                <div className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:border-gold transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    4
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-navy text-sm sm:text-base">
                      4. Publication et diffusion
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Votre ouvrage est préparé pour sa publication et sa diffusion sur les canaux retenus.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* SECTION 3 : FORMULES D'ÉDITION */}
            <div className="space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  Formules d'édition
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                  Les cadres éditoriaux possibles
                </h2>
                <p className="text-xs text-foreground-muted">
                  Le cadre adapté est proposé par notre équipe après l'analyse de votre manuscrit.
                </p>
              </div>

              {/* 3 Cartes Verticales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                
                {/* Bloc 1 — Compte d'auteur */}
                <div className="bg-background p-5 rounded-2xl border border-border hover:border-gold shadow-sm flex flex-col justify-between space-y-5 transition-all">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 inline-block">
                      Vous maîtrisez
                    </span>
                    <h3 className="font-serif text-lg font-bold text-navy">
                      Compte d'auteur
                    </h3>
                    <ul className="space-y-2 text-[11px] text-foreground-muted">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Vous gardez le contrôle de votre œuvre</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Accompagnement éditorial personnalisé</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Diffusion nationale et internationale</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Suivi du projet après publication</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <BookOpen className="w-10 h-10 text-navy/30" />
                  </div>
                </div>

                {/* Bloc 2 — Compte d'éditeur */}
                <div className="bg-[#fef9f5] p-5 rounded-2xl border border-gold/40 shadow-sm flex flex-col justify-between space-y-5 transition-all">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 inline-block">
                      Laha accompagne
                    </span>
                    <h3 className="font-serif text-lg font-bold text-navy">
                      Compte d'éditeur
                    </h3>
                    <ul className="space-y-2 text-[11px] text-foreground-muted">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Prise en charge éditoriale complète</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Conception et préparation du livre</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Communication et promotion incluses</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Redevances définies par contrat</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <FileCheck2 className="w-10 h-10 text-gold" />
                  </div>
                </div>

                {/* Bloc 3 — Coproduction */}
                <div className="bg-[#f8f9fe] p-5 rounded-2xl border border-border hover:border-gold shadow-sm flex flex-col justify-between space-y-5 transition-all">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 inline-block">
                      Projet partagé
                    </span>
                    <h3 className="font-serif text-lg font-bold text-navy">
                      Coproduction
                    </h3>
                    <ul className="space-y-2 text-[11px] text-foreground-muted">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Investissement partagé selon le projet</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Responsabilités définies par contrat</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Production et promotion conjointes</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <span>Répartition transparente des revenus</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <Handshake className="w-10 h-10 text-navy/30" />
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* COLONNE DROITE (5/12) : WIDGET FORMULAIRE STICKY */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            
            <div ref={formRef} id="submit-form" className="rounded-3xl overflow-hidden shadow-xl border border-border bg-background">
              
              {/* Header Bleu Nuit du Formulaire */}
              <div className="bg-navy text-white p-6 space-y-4">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white text-center">
                  Soumettre mon manuscrit
                </h3>

                {/* Stepper avec ligne de connexion */}
                <div className="relative flex items-center justify-between max-w-xs mx-auto px-4">
                  {/* Ligne horizontale */}
                  <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-white/20 z-0" />
                  
                  {/* Étape 1 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step >= 1 ? "bg-gold text-navy font-bold" : "bg-white/20 text-white"
                    }`}>
                      1
                    </div>
                    <span className="text-[10px] text-white/80">Informations</span>
                  </div>

                  {/* Étape 2 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step >= 2 ? "bg-gold text-navy font-bold" : "bg-white/20 text-white"
                    }`}>
                      2
                    </div>
                    <span className="text-[10px] text-white/80">Fichier prêt</span>
                  </div>

                  {/* Étape 3 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step >= 3 ? "bg-gold text-navy font-bold" : "bg-white/20 text-white"
                    }`}>
                      3
                    </div>
                    <span className="text-[10px] text-white/80">Envoi confirmé</span>
                  </div>
                </div>
              </div>

              {/* Corps du Formulaire */}
              <div className="p-6 sm:p-7">
                
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
                        setFirstName("");
                        setLastName("");
                        setEmail("");
                        setPhone("");
                        setBookTitle("");
                        setGenre("");
                        setCountry("");
                        setSummary("");
                        setManuscriptFile(null);
                        setAcceptTerms(false);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-navy text-white font-sans font-bold text-xs hover:bg-navy-hover transition-colors cursor-pointer"
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

                    {/* Prénom & Nom */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-foreground mb-1">
                          Prénom <span className="text-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Votre prénom"
                          className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-foreground mb-1">
                          Nom <span className="text-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Votre nom"
                          className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Adresse e-mail */}
                    <div>
                      <label className="block font-medium text-foreground mb-1">
                        Adresse e-mail <span className="text-gold">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemple@domaine.com"
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                      />
                    </div>

                    {/* Téléphone avec indicatif pays */}
                    <div>
                      <label className="block font-medium text-foreground mb-1">
                        Téléphone <span className="text-gold">*</span>
                      </label>
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                      />
                    </div>

                    {/* Titre du manuscrit */}
                    <div>
                      <label className="block font-medium text-foreground mb-1">
                        Titre du manuscrit <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                        placeholder="Titre de votre ouvrage"
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none"
                      />
                    </div>

                    {/* Genre littéraire & Pays */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-foreground mb-1">
                          Genre littéraire <span className="text-gold">*</span>
                        </label>
                        <select
                          required
                          name="workType"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Scolaires">Scolaires</option>
                          <option value="Romans">Romans</option>
                          <option value="Bandes dessinées">Bandes dessinées</option>
                          <option value="Poésie">Poésie</option>
                          <option value="Nouvelles">Nouvelles</option>
                          <option value="Contes">Contes</option>
                          <option value="Essais">Essais</option>
                          <option value="Biographie">Biographie</option>
                          <option value="Théâtre">Théâtre</option>
                          <option value="Devellopement personnel">Devellopement personnel</option>
                          <option value="Autre">Autre / Hors catégorie</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-foreground mb-1">
                          Pays <span className="text-gold">*</span>
                        </label>
                        <select
                          required
                          name="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Afghanistan">Afghanistan</option>
                          <option value="Afrique du Sud">Afrique du Sud</option>
                          <option value="Albanie">Albanie</option>
                          <option value="Algérie">Algérie</option>
                          <option value="Allemagne">Allemagne</option>
                          <option value="Andorre">Andorre</option>
                          <option value="Angola">Angola</option>
                          <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
                          <option value="Arabie saoudite">Arabie saoudite</option>
                          <option value="Argentine">Argentine</option>
                          <option value="Arménie">Arménie</option>
                          <option value="Australie">Australie</option>
                          <option value="Autriche">Autriche</option>
                          <option value="Azerbaïdjan">Azerbaïdjan</option>
                          <option value="Bahamas">Bahamas</option>
                          <option value="Bahreïn">Bahreïn</option>
                          <option value="Bangladesh">Bangladesh</option>
                          <option value="Barbade">Barbade</option>
                          <option value="Belgique">Belgique</option>
                          <option value="Belize">Belize</option>
                          <option value="Bénin">Bénin</option>
                          <option value="Bhoutan">Bhoutan</option>
                          <option value="Biélorussie">Biélorussie</option>
                          <option value="Birmanie">Birmanie</option>
                          <option value="Bolivie">Bolivie</option>
                          <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
                          <option value="Botswana">Botswana</option>
                          <option value="Brésil">Brésil</option>
                          <option value="Brunei">Brunei</option>
                          <option value="Bulgarie">Bulgarie</option>
                          <option value="Burkina Faso">Burkina Faso</option>
                          <option value="Burundi">Burundi</option>
                          <option value="Cambodge">Cambodge</option>
                          <option value="Cameroun">Cameroun</option>
                          <option value="Canada">Canada</option>
                          <option value="Cap-Vert">Cap-Vert</option>
                          <option value="Chili">Chili</option>
                          <option value="Chine">Chine</option>
                          <option value="Chypre">Chypre</option>
                          <option value="Colombie">Colombie</option>
                          <option value="Comores">Comores</option>
                          <option value="Corée du Nord">Corée du Nord</option>
                          <option value="Corée du Sud">Corée du Sud</option>
                          <option value="Costa Rica">Costa Rica</option>
                          <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                          <option value="Croatie">Croatie</option>
                          <option value="Cuba">Cuba</option>
                          <option value="Danemark">Danemark</option>
                          <option value="Djibouti">Djibouti</option>
                          <option value="Dominique">Dominique</option>
                          <option value="Égypte">Égypte</option>
                          <option value="Émirats arabes unis">Émirats arabes unis</option>
                          <option value="Équateur">Équateur</option>
                          <option value="Érythrée">Érythrée</option>
                          <option value="Espagne">Espagne</option>
                          <option value="Estonie">Estonie</option>
                          <option value="Eswatini">Eswatini</option>
                          <option value="États-Unis">États-Unis</option>
                          <option value="Éthiopie">Éthiopie</option>
                          <option value="Fidji">Fidji</option>
                          <option value="Finlande">Finlande</option>
                          <option value="France">France</option>
                          <option value="Gabon">Gabon</option>
                          <option value="Gambie">Gambie</option>
                          <option value="Géorgie">Géorgie</option>
                          <option value="Ghana">Ghana</option>
                          <option value="Grèce">Grèce</option>
                          <option value="Grenade">Grenade</option>
                          <option value="Guatemala">Guatemala</option>
                          <option value="Guinée">Guinée</option>
                          <option value="Guinée équatoriale">Guinée équatoriale</option>
                          <option value="Guinée-Bissau">Guinée-Bissau</option>
                          <option value="Guyana">Guyana</option>
                          <option value="Haïti">Haïti</option>
                          <option value="Honduras">Honduras</option>
                          <option value="Hongrie">Hongrie</option>
                          <option value="Îles Marshall">Îles Marshall</option>
                          <option value="Îles Salomon">Îles Salomon</option>
                          <option value="Inde">Inde</option>
                          <option value="Indonésie">Indonésie</option>
                          <option value="Irak">Irak</option>
                          <option value="Iran">Iran</option>
                          <option value="Irlande">Irlande</option>
                          <option value="Islande">Islande</option>
                          <option value="Israël">Israël</option>
                          <option value="Italie">Italie</option>
                          <option value="Jamaïque">Jamaïque</option>
                          <option value="Japon">Japon</option>
                          <option value="Jordanie">Jordanie</option>
                          <option value="Kazakhstan">Kazakhstan</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Kirghizistan">Kirghizistan</option>
                          <option value="Kiribati">Kiribati</option>
                          <option value="Koweït">Koweït</option>
                          <option value="Laos">Laos</option>
                          <option value="Lesotho">Lesotho</option>
                          <option value="Lettonie">Lettonie</option>
                          <option value="Liban">Liban</option>
                          <option value="Liberia">Liberia</option>
                          <option value="Libye">Libye</option>
                          <option value="Liechtenstein">Liechtenstein</option>
                          <option value="Lituanie">Lituanie</option>
                          <option value="Luxembourg">Luxembourg</option>
                          <option value="Macédoine du Nord">Macédoine du Nord</option>
                          <option value="Madagascar">Madagascar</option>
                          <option value="Malaisie">Malaisie</option>
                          <option value="Malawi">Malawi</option>
                          <option value="Maldives">Maldives</option>
                          <option value="Mali">Mali</option>
                          <option value="Malte">Malte</option>
                          <option value="Maroc">Maroc</option>
                          <option value="Maurice">Maurice</option>
                          <option value="Mauritanie">Mauritanie</option>
                          <option value="Mexique">Mexique</option>
                          <option value="Micronésie">Micronésie</option>
                          <option value="Moldavie">Moldavie</option>
                          <option value="Monaco">Monaco</option>
                          <option value="Mongolie">Mongolie</option>
                          <option value="Monténégro">Monténégro</option>
                          <option value="Mozambique">Mozambique</option>
                          <option value="Namibie">Namibie</option>
                          <option value="Nauru">Nauru</option>
                          <option value="Népal">Népal</option>
                          <option value="Nicaragua">Nicaragua</option>
                          <option value="Niger">Niger</option>
                          <option value="Nigeria">Nigeria</option>
                          <option value="Norvège">Norvège</option>
                          <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
                          <option value="Oman">Oman</option>
                          <option value="Ouganda">Ouganda</option>
                          <option value="Ouzbékistan">Ouzbékistan</option>
                          <option value="Pakistan">Pakistan</option>
                          <option value="Palaos">Palaos</option>
                          <option value="Palestine">Palestine</option>
                          <option value="Panama">Panama</option>
                          <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
                          <option value="Paraguay">Paraguay</option>
                          <option value="Pays-Bas">Pays-Bas</option>
                          <option value="Pérou">Pérou</option>
                          <option value="Philippines">Philippines</option>
                          <option value="Pologne">Pologne</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Qatar">Qatar</option>
                          <option value="République centrafricaine">République centrafricaine</option>
                          <option value="République démocratique du Congo">République démocratique du Congo</option>
                          <option value="République dominicaine">République dominicaine</option>
                          <option value="République du Congo">République du Congo</option>
                          <option value="Roumanie">Roumanie</option>
                          <option value="Royaume-Uni">Royaume-Uni</option>
                          <option value="Russie">Russie</option>
                          <option value="Rwanda">Rwanda</option>
                          <option value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</option>
                          <option value="Saint-Marin">Saint-Marin</option>
                          <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>
                          <option value="Sainte-Lucie">Sainte-Lucie</option>
                          <option value="Salvador">Salvador</option>
                          <option value="Samoa">Samoa</option>
                          <option value="São Tomé-et-Príncipe">São Tomé-et-Príncipe</option>
                          <option value="Sénégal">Sénégal</option>
                          <option value="Serbie">Serbie</option>
                          <option value="Seychelles">Seychelles</option>
                          <option value="Sierra Leone">Sierra Leone</option>
                          <option value="Singapour">Singapour</option>
                          <option value="Slovaquie">Slovaquie</option>
                          <option value="Slovénie">Slovénie</option>
                          <option value="Somalie">Somalie</option>
                          <option value="Soudan">Soudan</option>
                          <option value="Soudan du Sud">Soudan du Sud</option>
                          <option value="Sri Lanka">Sri Lanka</option>
                          <option value="Suède">Suède</option>
                          <option value="Suisse">Suisse</option>
                          <option value="Suriname">Suriname</option>
                          <option value="Syrie">Syrie</option>
                          <option value="Tadjikistan">Tadjikistan</option>
                          <option value="Tanzanie">Tanzanie</option>
                          <option value="Tchad">Tchad</option>
                          <option value="Tchéquie">Tchéquie</option>
                          <option value="Thaïlande">Thaïlande</option>
                          <option value="Timor oriental">Timor oriental</option>
                          <option value="Togo">Togo</option>
                          <option value="Tonga">Tonga</option>
                          <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
                          <option value="Tunisie">Tunisie</option>
                          <option value="Turkménistan">Turkménistan</option>
                          <option value="Turquie">Turquie</option>
                          <option value="Tuvalu">Tuvalu</option>
                          <option value="Ukraine">Ukraine</option>
                          <option value="Uruguay">Uruguay</option>
                          <option value="Vanuatu">Vanuatu</option>
                          <option value="Vatican">Vatican</option>
                          <option value="Venezuela">Venezuela</option>
                          <option value="Viêt Nam">Viêt Nam</option>
                          <option value="Yémen">Yémen</option>
                          <option value="Zambie">Zambie</option>
                          <option value="Zimbabwe">Zimbabwe</option>
                        </select>
                      </div>
                    </div>

                    {/* Description / Résumé */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium text-foreground">
                          Description / Résumé <span className="text-gold">*</span>
                        </label>
                        <span className="text-[10px] text-foreground-muted">
                          {summary.length} / 1000
                        </span>
                      </div>
                      <textarea
                        required
                        rows={3}
                        maxLength={1000}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Présentez brièvement le thème et l'intérêt pédagogique ou littéraire de votre œuvre..."
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy focus:outline-none resize-none"
                      />
                    </div>

                    {/* Dropzone Fichier */}
                    <div>
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer relative ${
                          dragActive ? "border-gold bg-gold/5" : "border-border bg-background hover:border-navy"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <UploadCloud className="w-7 h-7 text-gold mx-auto" />
                          {manuscriptFile ? (
                            <p className="font-bold text-navy text-xs">
                              {manuscriptFile.name} ({(manuscriptFile.size / (1024 * 1024)).toFixed(2)} Mo)
                            </p>
                          ) : (
                            <>
                              <p className="font-bold text-navy text-xs">
                                Déposez votre manuscrit ici
                              </p>
                              <p className="text-[10px] text-foreground-muted">
                                PDF, DOC ou DOCX
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
                          J'accepte les <Link href="/cgu" className="text-gold font-semibold underline">conditions générales</Link> et la <Link href="/legal" className="text-gold font-semibold underline">politique de confidentialité</Link>.
                        </span>
                      </label>
                    </div>

                    {/* Champ Honeypot invisible anti-spam */}
                    <div className="hidden" aria-hidden="true">
                      <label>
                        Site web
                        <input tabIndex={-1} autoComplete="off" name="website" />
                      </label>
                    </div>

                    {/* Bouton d'Envoi Orange/Gold */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <span>Envoi en cours...</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-navy" />
                            <span>Envoyer mon manuscrit</span>
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

        {/* 3. SECTION "NOS ENGAGEMENTS" (Bandeau Fond Bleu Très Doux) */}
        <section className="bg-[#f0f7fc] rounded-3xl p-8 sm:p-12 space-y-8 border border-border">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Nos engagements
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Votre projet est traité avec attention
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Engagement 1 */}
            <div className="bg-background p-6 rounded-2xl border border-border space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">
                Confidentialité
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Vos fichiers restent privés et réservés à l'étude éditoriale.
              </p>
            </div>

            {/* Engagement 2 */}
            <div className="bg-background p-6 rounded-2xl border border-border space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">
                Étude structurée
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Chaque projet est examiné selon des critères éditoriaux précis.
              </p>
            </div>

            {/* Engagement 3 */}
            <div className="bg-background p-6 rounded-2xl border border-border space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">
                Échange humain
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Notre équipe vous accompagne dans la compréhension des prochaines étapes.
              </p>
            </div>

          </div>

        </section>

        {/* 4. SECTION "QUESTIONS FRÉQUENTES" (Accordéon Épuré) */}
        <section className="max-w-4xl mx-auto space-y-8 pt-4">
          
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
              Questions <span className="text-gold">fréquentes</span>
            </h2>
          </div>

          <div className="space-y-3 divide-y divide-border">
            {faqs.map((faq, idx) => (
              <div key={idx} className="pt-3">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4 text-left flex items-center justify-between gap-4 font-serif font-bold text-navy text-sm sm:text-base cursor-pointer hover:text-gold transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <Minus className="w-4 h-4 text-gold shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-gold shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="pb-4 text-xs sm:text-sm text-foreground-muted leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </section>

        {/* 5. BANDEAU "DÉJÀ UN COMPTE" */}
        <section className="bg-navy text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-navy-hover">
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
            <ArrowRight className="w-4 h-4 text-navy" />
          </Link>
        </section>

        {/* 6. NEWSLETTER */}
        <section className="bg-background-secondary rounded-2xl border border-border py-8 px-6 sm:px-10">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Mail className="w-6 h-6 text-gold shrink-0 hidden sm:block" />
              <div>
                <h3 className="font-serif text-lg font-bold text-navy">
                  Restez informé·e
                </h3>
                <p className="text-xs text-foreground-muted">
                  de nos nouveautés et offres exclusives.
                </p>
              </div>
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
    </div>
  );
}
