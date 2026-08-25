"use client";

import { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Globe, 
  UploadCloud, 
  Headphones, 
  ArrowRight 
} from "lucide-react";

export default function SubmitManuscriptPage() {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

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
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="w-full">
      
      {/* Header Section */}
      <header className="w-full bg-background-secondary border-b border-border py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-navy font-bold leading-tight">
              Soumettre un manuscrit
            </h1>
          </div>
          <div className="md:col-span-5 border-l-4 border-gold pl-6">
            <p className="text-base md:text-lg text-foreground-muted leading-relaxed">
              Notre équipe éditoriale et notre comité de lecture examinent rigoureusement chaque proposition afin de garantir la qualité, la pertinence et l'originalité des travaux publiés.
            </p>
          </div>
        </div>
      </header>

      {/* Intro Section */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3">
              Soumettez un manuscrit à Lahathèque
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-navy mb-6 leading-tight">
              Soumettez votre manuscrit à une équipe éditoriale professionnelle spécialisée dans l'évaluation, la protection et la publication internationale des manuscrits.
            </h2>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-background p-6 rounded border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Évaluation par les pairs</h3>
            </div>

            {/* Pillar 2 */}
            <div className="bg-background p-6 rounded border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Protection du contenu</h3>
            </div>

            {/* Pillar 3 */}
            <div className="bg-background p-6 rounded border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Publication imprimée et numérique</h3>
            </div>

            {/* Pillar 4 */}
            <div className="bg-background p-6 rounded border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Distribution internationale</h3>
            </div>

          </div>

        </div>
      </section>

      {/* Manuscript Submission Form Section */}
      <section className="bg-background-secondary py-16 px-6 md:px-12 border-y border-border">
        <div className="max-w-[800px] mx-auto bg-background p-6 md:p-10 rounded-xl border border-border shadow-[0_12px_40px_rgba(27,42,78,0.06)]">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nom et prénom */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">Nom et prénom</label>
                <input 
                  className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200" 
                  type="text"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">Email</label>
                <input 
                  className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200" 
                  placeholder="Adresse email" 
                  type="email"
                  required
                />
              </div>

              {/* Pays */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">Pays</label>
                <input 
                  className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200" 
                  type="text"
                  required
                />
              </div>

              {/* Tél */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">Tél</label>
                <input 
                  className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200" 
                  placeholder="Numéro de téléphone" 
                  type="tel"
                  required
                />
              </div>

            </div>

            {/* Titre du manuscrit */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy">Titre du manuscrit</label>
              <input 
                className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200 w-full" 
                type="text"
                required
              />
            </div>

            {/* Langue manuscrite */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy">Langue manuscrite</label>
              <div className="relative">
                <select 
                  className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200 w-full appearance-none pr-10"
                  required
                >
                  <option value="">Sélectionner une langue</option>
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="ar">Arabe</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-foreground-muted">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Résumé du manuscrit */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy">Résumé du manuscrit</label>
              <textarea 
                className="bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all duration-200 w-full resize-none" 
                placeholder="Présentez brièvement votre manuscrit..." 
                rows={4}
                required
              />
            </div>

            {/* Fichier du manuscrit */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-navy">Fichier du manuscrit</label>
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer group relative ${
                  dragActive 
                    ? "border-gold bg-gold/5" 
                    : "border-border hover:border-navy hover:bg-background-secondary"
                }`}
              >
                <input 
                  accept=".pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  type="file"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-foreground-muted group-hover:text-navy mx-auto mb-2 transition-colors duration-200" />
                <p className="text-sm font-bold text-navy mb-1">
                  Cliquez pour parcourir ou glissez-déposez
                </p>
                <p className="text-xs text-foreground-muted mb-4">
                  Format accepté : PDF uniquement (20 Mo max.)
                </p>
                {fileName ? (
                  <p className="text-xs font-bold text-success">
                    Fichier sélectionné : {fileName}
                  </p>
                ) : (
                  <p className="text-xs text-error font-medium">
                    Aucun fichier n'a été sélectionné
                  </p>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex justify-end">
              <button 
                className="bg-primary hover:bg-navy-hover text-white text-sm font-bold px-8 py-4 rounded flex items-center gap-2 transition-colors duration-200 shadow-md" 
                type="submit"
              >
                Soumettre un manuscrit 
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>
      </section>

      {/* Support Banner */}
      <section className="bg-[#FDF3F1] py-8 px-6 md:px-12 border-b border-[#F7E1DE] text-[#5A2C26]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm hidden sm:flex shrink-0">
              <Headphones className="w-6 h-6 text-[#B84B3D]" />
            </div>
            <p className="text-base md:text-lg font-medium">
              Notre équipe éditoriale reste à votre disposition pour vous accompagner tout au long du processus de soumission et de publication.
            </p>
          </div>
          
          <button className="bg-[#B84B3D] hover:bg-[#963C31] text-white text-sm font-bold px-6 py-3.5 rounded whitespace-nowrap flex items-center gap-2 transition-colors shadow-sm shrink-0">
            Contactez-nous
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto text-center">
        <h3 className="font-serif text-2xl font-bold text-navy mb-4">Restez informé de nos publications</h3>
        <p className="text-sm text-foreground-muted max-w-2xl mx-auto mb-8">
          Abonnez-vous à notre newsletter pour recevoir nos dernières actualités éditoriales.
        </p>
        <form className="max-w-md mx-auto flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input 
            className="flex-grow bg-background border border-border rounded text-sm p-3 focus:border-navy focus:ring-2 focus:ring-gold/30 outline-none transition-all" 
            placeholder="Votre adresse email" 
            type="email"
            required
          />
          <button 
            className="bg-gold hover:bg-gold-dark text-white text-sm font-bold px-6 py-3 rounded transition-colors whitespace-nowrap" 
            type="submit"
          >
            S'abonner
          </button>
        </form>
      </section>

    </div>
  );
}
