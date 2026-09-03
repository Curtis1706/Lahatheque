"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Globe, 
  UploadCloud, 
  Headphones, 
  ArrowRight,
  Send,
  Lock,
  AlertCircle,
  FileCheck,
  Check
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { useDisciplines } from "@/lib/hooks/use-disciplines";
import { uploadPublicManuscriptToR2 } from "@/lib/services/storage";

export default function SubmitManuscriptPage() {
  const { disciplineNames } = useDisciplines();
  const [dragActive, setDragActive] = useState(false);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("");
  const [summary, setSummary] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !bookTitle.trim() || !phone.trim() || !country || !genre) {
      setSubmitError("Merci de renseigner tous les champs obligatoires.");
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
      const uploadResult = await uploadPublicManuscriptToR2(manuscriptFile as File);

      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("book_title", bookTitle.trim());
      formData.append("genre", genre.trim());
      formData.append("country", country.trim());
      formData.append("summary", summary.trim());

      if (uploadResult.directToR2 && uploadResult.fileKey) {
        formData.append("manuscript_file_key", uploadResult.fileKey);
      } else {
        formData.append("manuscript_file", manuscriptFile as File);
      }

      const res = await fetch("/api/bff/rights/public/manuscript-submit/", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        setSubmitError(json.error || "Une erreur est survenue lors de l'envoi.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
    } catch {
      setIsSubmitting(false);
      setSubmitError("Une erreur est survenue. Vérifiez votre connexion et réessayez, ou contactez-nous à contact@lahatheque.com.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      
      {/* Header Section */}
      <header className="w-full bg-background-secondary border-b border-border py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-navy font-bold leading-tight">
              Soumettre un manuscrit
            </h1>
          </div>
          <div className="md:col-span-5 pl-0 md:pl-4">
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
            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Évaluation par les pairs</h3>
            </div>

            {/* Pillar 2 */}
            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Protection du contenu</h3>
            </div>

            {/* Pillar 3 */}
            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Publication imprimée et numérique</h3>
            </div>

            {/* Pillar 4 */}
            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] transition-all duration-300 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy">Distribution internationale</h3>
            </div>

          </div>

        </div>
      </section>

      {/* Manuscript Submission Form Section */}
      <section className="bg-background-secondary py-16 px-6 md:px-12 border-y border-border">
        <div className="max-w-[800px] mx-auto bg-background p-6 md:p-10 rounded-3xl border border-border shadow-[0_12px_40px_rgba(27,42,78,0.06)]">
          
          {submitSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto border border-gold/30">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-navy">
                Manuscrit bien reçu !
              </h4>
              <p className="text-sm text-foreground-muted leading-relaxed max-w-md mx-auto">
                Notre comité de lecture reviendra vers vous sous <strong>10 jours ouvrés</strong> à l'adresse <strong>{email}</strong>.
              </p>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
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
                className="px-8 py-3.5 rounded-xl bg-navy text-white font-sans font-bold text-sm hover:bg-navy-hover transition-colors cursor-pointer"
              >
                Soumettre un autre manuscrit
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Alerte Erreur */}
              {submitError && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Prénom & Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Prénom <span className="text-gold">*</span>
                  </label>
                  <input 
                    className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200" 
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Nom <span className="text-gold">*</span>
                  </label>
                  <input 
                    className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200" 
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              {/* Email & Téléphone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Adresse e-mail <span className="text-gold">*</span>
                  </label>
                  <input 
                    className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200" 
                    placeholder="exemple@domaine.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Téléphone <span className="text-gold">*</span>
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                  />
                </div>
              </div>

              {/* Titre du manuscrit */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">
                  Titre du manuscrit <span className="text-gold">*</span>
                </label>
                <input 
                  className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200 w-full" 
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Titre de votre ouvrage"
                />
              </div>

              {/* Discipline scientifique & Pays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Discipline scientifique */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Discipline / Domaine <span className="text-gold">*</span>
                  </label>
                  <select 
                    name="workType"
                    className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200 w-full cursor-pointer"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    <option value="">Sélectionner une discipline</option>
                    {disciplineNames.map((disc) => (
                      <option key={disc} value={disc}>
                        {disc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pays */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy">
                    Pays <span className="text-gold">*</span>
                  </label>
                  <select 
                    name="country"
                    className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200 w-full cursor-pointer"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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

              {/* Description / Résumé du manuscrit */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-navy">
                    Description / Résumé <span className="text-gold">*</span>
                  </label>
                  <span className="text-xs text-foreground-muted">
                    {summary.length} / 1000
                  </span>
                </div>
                <textarea 
                  className="bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all duration-200 w-full resize-none" 
                  placeholder="Présentez brièvement le thème et l'intérêt pédagogique ou littéraire de votre œuvre..." 
                  rows={4}
                  maxLength={1000}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              {/* Fichier du manuscrit */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-navy">
                  Fichier du manuscrit (PDF, DOC, DOCX) <span className="text-gold">*</span>
                </label>
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer group relative ${
                    dragActive 
                      ? "border-gold bg-gold/5" 
                      : "border-border hover:border-navy hover:bg-background-secondary"
                  }`}
                >
                  <input 
                    accept=".pdf,.doc,.docx" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    type="file"
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="w-10 h-10 text-gold mx-auto mb-2 transition-colors duration-200" />
                  {manuscriptFile ? (
                    <p className="text-sm font-bold text-navy flex items-center justify-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-gold" />
                      {manuscriptFile.name} ({(manuscriptFile.size / (1024 * 1024)).toFixed(2)} Mo)
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-navy mb-1">
                        Cliquez pour parcourir ou glissez-déposez
                      </p>
                      <p className="text-xs text-foreground-muted">
                        PDF, DOC ou DOCX (50 Mo max.)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Case à cocher CGU */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground-muted">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-navy focus:ring-navy mt-0.5"
                  />
                  <span>
                    J'accepte les <Link href="/cgu" className="text-gold font-semibold underline">conditions générales</Link> et la <Link href="/legal" className="text-gold font-semibold underline">politique de confidentialité</Link>.
                  </span>
                </label>
              </div>

              {/* Honeypot invisible anti-spam */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Site web
                  <input tabIndex={-1} autoComplete="off" name="website" />
                </label>
              </div>

              {/* Submit Action */}
              <div className="pt-4 space-y-3">
                <button 
                  className="w-full bg-gold hover:bg-gold-light text-navy text-sm sm:text-base font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer disabled:opacity-70" 
                  type="submit"
                  disabled={isSubmitting}
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

                <p className="text-xs text-center text-foreground-muted flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gold" />
                  Dossier transmis directement au comité, sans stockage sur le site.
                </p>
              </div>

            </form>
          )}

        </div>
      </section>

      {/* Support Banner */}
      <section className="bg-background-secondary py-8 px-6 md:px-12 border-b border-border text-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-4">
            <div className="bg-background p-3 rounded-2xl shadow-sm hidden sm:flex shrink-0 border border-border">
              <Headphones className="w-6 h-6 text-gold" />
            </div>
            <p className="text-base md:text-lg font-medium text-navy">
              Notre équipe éditoriale reste à votre disposition pour vous accompagner tout au long du processus de soumission et de publication.
            </p>
          </div>
          
          <Link 
            href="/contact"
            className="bg-navy hover:bg-navy-hover text-white text-sm font-bold px-6 py-3.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            Contactez-nous
            <ArrowRight className="w-4 h-4 text-gold" />
          </Link>

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
            className="flex-grow bg-background border border-border rounded-xl text-sm p-3 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all" 
            placeholder="Votre adresse email" 
            type="email"
            required
          />
          <button 
            className="bg-gold hover:bg-gold-light text-navy text-sm font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-sm" 
            type="submit"
          >
            S'abonner
          </button>
        </form>
      </section>

    </div>
  );
}
