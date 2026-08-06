"use client";

import { 
  Gavel, 
  TrendingUp, 
  Compass, 
  Stethoscope, 
  BarChart3, 
  Code, 
  BookOpen, 
  GraduationCap, 
  Landmark,
  Sparkles,
  Book,
  Sun
} from "lucide-react";

const domains = [
  {
    id: "01",
    name: "Droit",
    description: "Ouvrages juridiques, législation, droit public, privé et international.",
    icon: Gavel,
  },
  {
    id: "02",
    name: "Économie",
    description: "Analyses économiques, finance, développement et politiques publiques.",
    icon: TrendingUp,
  },
  {
    id: "03",
    name: "Sciences humaines",
    description: "Ressources en sociologie, philosophie, histoire et culture africaine.",
    icon: Compass,
  },
  {
    id: "04",
    name: "Médecine",
    description: "Références médicales, santé publique et sciences biomédicales.",
    icon: Stethoscope,
  },
  {
    id: "05",
    name: "Gestion",
    description: "Management, comptabilité, entrepreneuriat et administration.",
    icon: BarChart3,
  },
  {
    id: "06",
    name: "Informatique",
    description: "Programmation, intelligence artificielle, réseaux et technologies numériques.",
    icon: Code,
  },
  {
    id: "07",
    name: "Littérature",
    description: "Œuvres littéraires, analyses de textes et expressions culturelles.",
    icon: BookOpen,
  },
  {
    id: "08",
    name: "Éducation",
    description: "Pédagogie, sciences de l'éducation et méthodes d'apprentissage.",
    icon: GraduationCap,
  },
  {
    id: "09",
    name: "Sciences politiques",
    description: "Institutions, gouvernance, relations internationales et citoyenneté.",
    icon: Landmark,
  },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-4 text-center lg:text-left">
          <span className="text-sm font-bold text-gold uppercase tracking-widest">
            Qui sommes-nous ?
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-navy font-bold leading-tight">
            Lahathèque : la connaissance sans frontières
          </h1>
          <p className="text-base md:text-lg text-foreground-muted max-w-xl mt-4 mx-auto lg:mx-0 leading-relaxed">
            Une bibliothèque moderne pour l'Afrique, ouverte sur le monde, où chaque livre transforme des vies.
          </p>
        </div>
        
        <div className="h-80 md:h-96 w-full rounded-xl overflow-hidden relative shadow-md bg-background-secondary border border-border">
          {/* Simulated preview showing warm editorial branding illustration */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-gold/5 flex flex-col items-center justify-center p-8 text-center">
            <BookOpen className="w-16 h-16 text-gold mb-4 opacity-80" />
            <span className="font-serif text-xl font-bold text-navy">L'excellence académique africaine</span>
            <p className="text-sm text-foreground-muted mt-2 max-w-sm">
              Un espace d'étude moderne et inspirant favorisant l'égalité des chances d'apprentissage.
            </p>
          </div>
        </div>
      </section>

      {/* Storytelling Section (PAS) */}
      <section className="bg-background-secondary border-y border-border py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Problem & Agitation */}
            <div className="space-y-6 text-foreground/90">
              <h2 className="text-xs font-bold text-gold uppercase tracking-widest">Le défi de l'accès au savoir</h2>
              <p className="text-base md:text-lg leading-relaxed">
                Dans de nombreuses régions d'Afrique, des millions d'étudiants, de chercheurs, d'enseignants et de passionnés de savoir partagent le même combat silencieux : accéder aux ouvrages dont ils ont besoin pour apprendre, réussir et transmettre.
              </p>
              <p className="text-base md:text-lg leading-relaxed">
                Pendant longtemps, trouver un manuel universitaire, une revue scientifique ou un ouvrage spécialisé relevait du parcours du combattant. Les bibliothèques étaient insuffisamment fournies, les livres importés coûtaient trop cher, et certains étudiants devaient parcourir plusieurs villes simplement pour consulter un document essentiel à leurs études.
              </p>
              <p className="text-base md:text-lg font-semibold text-navy leading-relaxed">
                C'est de cette réalité qu'est née Lahathèque.
              </p>
            </div>

            {/* Solution & Vision */}
            <div className="py-2 space-y-4 my-8 bg-background p-6 rounded-r-md border border-border border-l-4 border-l-gold shadow-sm">
              <p className="text-base md:text-lg text-navy font-bold leading-relaxed">
                Lahathèque est bien plus qu'un diffuseur d'ouvrages numériques. C'est une réponse à une injustice intellectuelle. Une passerelle entre le savoir et celles et ceux qui en sont privés. Une bibliothèque moderne pensée pour l'Afrique, ouverte sur le monde.
              </p>
            </div>

            <div className="space-y-6 text-foreground/95">
              <p className="text-base md:text-lg leading-relaxed">
                Notre histoire commence avec une conviction simple mais puissante : <br />
                <strong className="text-navy font-bold">le savoir ne doit pas dépendre du lieu où l'on naît.</strong>
              </p>
              
              <h2 className="text-xs font-bold text-gold uppercase tracking-widest pt-4">Notre Vision</h2>
              <p className="text-base md:text-lg leading-relaxed">
                Animés par cette vision, nous avons décidé de bâtir une plateforme capable de rendre accessibles des milliers d'ouvrages universitaires, scientifiques, professionnels et éducatifs aux étudiants africains comme internationaux. Nous avons voulu créer un espace où un étudiant à Cotonou, Dakar, Lomé, Abidjan, Paris ou Montréal peut accéder aux mêmes ressources, aux mêmes opportunités d'apprentissage et à la même richesse intellectuelle.
              </p>
              
              <h2 className="text-xs font-bold text-gold uppercase tracking-widest pt-4">Notre Mission</h2>
              <p className="text-base md:text-lg leading-relaxed">
                Chaque livre diffusé par Lahathèque porte une mission : former, élever, inspirer et transformer des vies.
              </p>
              <p className="text-base md:text-lg leading-relaxed">
                Nous croyons profondément que derrière chaque ouvrage téléchargé se cache peut-être :
              </p>

              <div className="flex flex-wrap gap-2.5 mt-6">
                {["un futur avocat", "une future médecin", "un ingénieur", "un enseignant", "un chercheur", "ou encore un jeune entrepreneur africain qui changera demain son pays"].map((val, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 bg-navy border border-navy text-white rounded-full text-xs font-bold tracking-wide"
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Content Domains Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-gold uppercase tracking-widest block mb-4">
            Spécialisée dans les ouvrages universitaires et académiques,
          </span>
          <h2 className="font-serif text-3xl font-bold text-navy">
            Lahathèque propose des contenus dans plusieurs domaines
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((dom) => {
            const IconComponent = dom.icon;
            return (
              <div 
                key={dom.id} 
                className="border border-border rounded p-6 bg-background hover:shadow-[0_8px_30px_rgba(27,42,78,0.04)] hover:border-neutral-warm-500/30 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gold opacity-80 uppercase tracking-widest">{dom.id}</span>
                  <h3 className="font-serif text-xl font-bold text-navy mb-2 mt-1">{dom.name}</h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">{dom.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing Statement */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center space-y-10">
          <p className="font-serif text-xl md:text-2xl font-bold leading-relaxed max-w-2xl mx-auto">
            "Notre ambition est claire : faire de la lecture numérique un levier d'égalité, de réussite et de développement intellectuel."
          </p>
          
          <div className="pt-8 border-t border-white/10 max-w-2xl mx-auto">
            <p className="text-sm text-white/80 leading-relaxed mb-8">
              À travers la technologie, nous rapprochons les auteurs, les éditeurs et les lecteurs. Nous contribuons à faire voyager les idées au-delà des frontières, des océans et des barrières économiques.
            </p>
            <p className="text-base font-bold text-gold uppercase tracking-wider mb-6">
              Chez Lahathèque, nous ne diffusons pas simplement des livres.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="flex flex-col items-center gap-2 bg-navy-dark border border-navy-hover p-6 rounded-lg">
              <Sparkles className="w-8 h-8 text-gold" />
              <p className="text-xs font-bold text-gold uppercase tracking-widest mt-1">Nous diffusons des rêves</p>
            </div>
            <div className="flex flex-col items-center gap-2 bg-navy-dark border border-navy-hover p-6 rounded-lg">
              <Book className="w-8 h-8 text-gold" />
              <p className="text-xs font-bold text-gold uppercase tracking-widest mt-1">Nous diffusons des savoirs</p>
            </div>
            <div className="flex flex-col items-center gap-2 bg-navy-dark border border-navy-hover p-6 rounded-lg">
              <Sun className="w-8 h-8 text-gold" />
              <p className="text-xs font-bold text-gold uppercase tracking-widest mt-1">Nous diffusons l'avenir</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-navy text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-6 md:px-12">
          <div>
            <h3 className="font-serif text-xl font-bold mb-2">Abonnez-vous à notre newsletter</h3>
            <p className="text-sm text-white/70">Inscrivez-vous à notre newsletter pour recevoir les dernières parutions et actualités académiques.</p>
          </div>
          <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="w-full md:w-80 h-12 px-4 rounded bg-navy-hover border border-border text-white placeholder:text-white/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm" 
              placeholder="Adresse email" 
              type="email"
              required
            />
            <button 
              className="h-12 px-6 rounded bg-gold text-white font-bold text-sm hover:bg-gold-dark transition-colors whitespace-nowrap" 
              type="submit"
            >
              Abonnez-vous maintenant &rarr;
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
