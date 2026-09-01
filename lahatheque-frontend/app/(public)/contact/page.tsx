"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

function ContactFormContent() {
  const searchParams = useSearchParams();
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const needParam = searchParams.get("need");
    if (needParam) {
      const match = needsList.find(n => n.toLowerCase().includes(needParam.toLowerCase()) || needParam.toLowerCase().includes(n.toLowerCase()));
      if (match && !selectedNeeds.includes(match)) {
        setSelectedNeeds([match]);
      }
    }
  }, [searchParams]);

  const handleCheckboxChange = (need: string) => {
    setSelectedNeeds((prev) => 
      prev.includes(need) 
        ? prev.filter((item) => item !== need) 
        : [...prev, need]
    );
  };

  const needsList = [
    "Impression des ouvrages",
    "Sécurisation des contenus éditoriaux",
    "Analyse par un comité de lecture",
    "Montage éditorial des ouvrages",
    "Diffusion à l'échelle internationale",
    "Distribution à l'échelle internationale",
    "Production de livres audio",
    "Réalisation d'illustrations",
    "Logiciel anti-plagiat",
    "Autre"
  ];

  return (
    <div className="w-full">
      
      {/* Header Section with Pattern */}
      <section className="relative bg-background-secondary border-b border-border py-16 md:py-24 overflow-hidden">
        {/* Subtle grid pattern using CSS instead of image */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(var(--navy) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
        
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">
            Contactez-nous
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-navy font-bold max-w-4xl mx-auto leading-tight">
            Suivez-nous, contactez-nous pour plus d'informations
          </h1>
        </div>
      </section>

      {/* Split Layout Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Info Block */}
          <div className="lg:col-span-5 flex flex-col gap-8 lg:sticky lg:top-32">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy mb-6">
                Comment pouvons-nous vous aider ?
              </h2>
              <div className="w-12 h-1 bg-gold mb-6" />
              <p className="text-base text-foreground-muted mb-6 leading-relaxed">
                Que vous soyez auteur, éditeur, diffuseur ou établissement scolaire, notre équipe est à votre écoute pour répondre à vos questions et vous accompagner dans vos démarches.
              </p>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Remplissez le formulaire ci-contre en précisant votre profil et vos besoins : nous reviendrons vers vous sous 48h ouvrées.
              </p>
            </div>
            
            <div className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-background-secondary border border-border flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground-muted mb-1 uppercase tracking-wider">
                    E-mail
                  </p>
                  <a 
                    className="text-base md:text-lg font-bold text-navy hover:text-gold transition-colors duration-200" 
                    href="mailto:contact@lahatheque.com"
                  >
                    contact@lahatheque.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Elevated Form (Without gradient banner) */}
          <div className="lg:col-span-7 bg-background p-6 md:p-10 rounded-2xl shadow-lg border border-border relative">
            <h3 className="font-serif text-lg md:text-xl font-bold text-navy mb-8">
              N'hésitez pas à remplir le formulaire de contact ci-dessous.
            </h3>
            
            <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
              
              {/* Profil */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy" htmlFor="profil">
                  Profil du demandeur *
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-colors appearance-none pr-10 cursor-pointer" 
                    id="profil"
                    required
                  >
                    <option value="" disabled selected>Sélectionner un profil</option>
                    <option value="auteur">Auteur</option>
                    <option value="editeur">Éditeur</option>
                    <option value="diffuseur">Diffuseur</option>
                    <option value="etablissement_public">Établissement public</option>
                    <option value="etablissement_prive">Établissement privé</option>
                    <option value="autre">Autre</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-foreground-muted">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Besoins (Checkboxes) in Grid */}
              <div className="mt-2">
                <label className="block text-sm font-bold text-navy mb-4 border-b border-border pb-2">
                  Nature de vos besoins
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needsList.map((need, idx) => (
                    <label 
                      key={idx} 
                      className={`flex items-center gap-3 cursor-pointer group p-2 rounded-lg transition-colors border ${
                        selectedNeeds.includes(need) 
                          ? "bg-gold/5 border-gold/30 text-navy" 
                          : "border-transparent hover:bg-background-secondary"
                      }`}
                    >
                      <input 
                        className="w-4 h-4 border-border text-gold focus:ring-gold/30 rounded" 
                        type="checkbox"
                        checked={selectedNeeds.includes(need)}
                        onChange={() => handleCheckboxChange(need)}
                      />
                      <span className="text-xs md:text-sm font-medium transition-colors">
                        {need}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">
                  Numéro de téléphone *
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="bg-background min-h-[46px]"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy" htmlFor="email">
                  E-mail *
                </label>
                <input 
                  className="w-full bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all" 
                  id="email" 
                  placeholder="votre@email.com" 
                  required 
                  type="email"
                />
              </div>

              {/* Submit Button */}
              <button 
                className="mt-6 bg-primary hover:bg-navy-hover text-white font-bold text-sm py-4 px-8 rounded flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg w-full md:w-auto md:self-start" 
                type="submit"
              >
                Contactez-nous dès maintenant 
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>

        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-background-secondary border-t border-border py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h3 className="font-serif text-2xl font-bold text-navy mb-2">
              Abonnez-vous à notre newsletter
            </h3>
            <p className="text-sm text-foreground-muted">
              Restez informé de nos dernières publications et actualités.
            </p>
          </div>
          <div className="w-full md:w-1/2 flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="flex-grow bg-background border border-border rounded-md py-3 px-4 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none text-sm" 
              placeholder="Votre adresse e-mail" 
              type="email"
            />
            <button className="bg-gold hover:bg-gold-dark text-white font-bold text-sm px-8 py-3 rounded-md transition-colors whitespace-nowrap shadow-sm">
              S'abonner
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-20 text-center text-sm text-foreground-muted">Chargement du formulaire...</div>}>
      <ContactFormContent />
    </Suspense>
  );
}
