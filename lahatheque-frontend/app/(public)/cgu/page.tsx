import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  BookOpen, 
  Lock, 
  Server, 
  AlertCircle, 
  Scale, 
  Phone, 
  Mail,
  Clock,
  ArrowRight
} from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) — LAHAThèque",
  description: "Conditions Générales d'Utilisation de la plateforme documentaire académique LAHAThèque.",
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation / Retour */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground-muted hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-gold/10 text-navy font-bold border border-gold/30">
              CGU en vigueur
            </span>
            <Link
              href="/cgv"
              className="px-3 py-1 rounded-full bg-background-secondary text-foreground-muted hover:text-navy border border-border font-medium transition-colors"
            >
              Consulter les CGV
            </Link>
          </div>
        </div>

        {/* En-tête de page */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/10 text-navy border border-navy/20 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-navy" />
            Cadre Réglementaire &amp; Légal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Conditions Générales d'Utilisation (CGU)
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Règles et conditions applicables à l'accès et à l'utilisation de la plateforme documentaire académique LAHAThèque (https://lahatheque.com).
          </p>
        </div>

        {/* Préambule */}
        <div className="bg-background-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-navy">
            Préambule &amp; Champ d'application
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Les présentes Conditions Générales d'Utilisation (ci-après les « CGU ») ont pour objet de préciser les règles applicables à l'utilisation du site <strong className="text-navy">https://lahatheque.com</strong> (ci-après le « Site »), ainsi que des services qui y sont éventuellement proposés. Le Site est exploité par <strong>LAHATHÈQUE</strong>, plateforme documentaire ayant son siège en République du Bénin (ci-après « LAHATHÈQUE » ou « l'Éditeur »).
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Les présentes CGU s'appliquent à toute personne, physique ou morale, se connectant au Site (ci-après « l'Utilisateur » ou les « Utilisateurs »). Le simple fait d'accéder au Site et de le consulter emporte acceptation pleine et entière des présentes CGU, sans réserve.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Les présentes CGU sont complétées par la Charte relative aux données personnelles publiée sur le Site.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground-muted italic bg-background p-4 rounded-xl border border-border">
            LAHATHÈQUE peut modifier les présentes CGU à tout moment et sans préavis. Toute modification prend effet dès sa mise en ligne. Il appartient à l'Utilisateur de consulter régulièrement la version des CGU en vigueur, disponible en permanence sur le Site.
          </p>
        </div>

        {/* Corps des Articles */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-foreground/90">
          
          {/* Article 1 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                1
              </span>
              Accès au Site
            </h2>
            <p>
              Le Site s'adresse à toute personne physique ou morale intéressée par les ressources et services qu'il propose.
            </p>
            <p>
              L'accès au Site suppose que l'Utilisateur dispose d'une connexion internet et d'un équipement informatique adapté, dont le coût, comme celui de la navigation sur le Site, reste entièrement à sa charge.
            </p>
            <p>
              Le Site est conçu pour être consulté aussi bien depuis un ordinateur que depuis un smartphone ou une tablette.
            </p>
            <p>
              L'Utilisateur reconnaît connaître les caractéristiques et limites propres au réseau internet, notamment le fait que la transmission de données ne présente qu'une fiabilité technique relative, les réseaux empruntés étant hétérogènes et pouvant, à certaines périodes, perturber ou empêcher l'accès au Site.
            </p>
          </section>

          {/* Article 2 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-6 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                2
              </span>
              Services proposés sur le Site
            </h2>
            <p>
              L'accès au Site et son utilisation sont réservés à un usage strictement personnel, ou collectif dans un cadre pédagogique en classe.
            </p>
            <p>
              La consultation en ligne ainsi que les extraits et compléments proposés en téléchargement permettent à l'Utilisateur de découvrir un document avant de le consulter intégralement, ou d'accéder à des compléments liés à un document déjà référencé. Ces compléments demeurent la propriété de LAHATHÈQUE et sont réservés à un usage strictement personnel de l'Utilisateur.
            </p>
            <p>
              L'accès à certaines ressources téléchargeables peut être subordonné à l'inscription préalable de l'Utilisateur sur le Site, voire à la certification de son compte.
            </p>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                2.1. Création de compte
              </h3>
              <p>
                Pour accéder aux services du Site, l'Utilisateur doit renseigner l'ensemble des informations requises sur le formulaire d'inscription en ligne. Ces informations demeurent confidentielles et sont traitées conformément à la Charte relative aux données personnelles. Selon les choix effectués lors de la création de son compte, l'Utilisateur peut recevoir les communications d'information de LAHATHÈQUE et revenir sur ce choix à tout moment.
              </p>
              <p>
                Une fois son inscription achevée, l'Utilisateur reçoit un courriel confirmant la création de son compte.
              </p>
              <p>
                LAHATHÈQUE peut, sans préavis ni indemnité, désactiver le compte d'un Utilisateur ne respectant pas les présentes CGU.
              </p>
              <p>
                Lorsque le téléchargement d'une ressource est conditionné à la certification du compte, l'Utilisateur doit compléter le formulaire de certification en ligne. S'il dispose d'une adresse électronique permettant cette certification, il reçoit un courriel contenant un lien de confirmation. À défaut, un justificatif lui est demandé pour validation par LAHATHÈQUE ; une fois ce justificatif vérifié, un courriel de certification lui est adressé. Ces informations, traitées uniquement aux fins de certification, sont supprimées au plus tard un an après l'accomplissement de cette finalité. LAHATHÈQUE peut, sans préavis ni indemnité, retirer la certification d'un compte en cas de non-respect des présentes CGU.
              </p>
              <p>
                Si un Compte Unique est créé, les conditions qui lui sont propres s'appliquent à l'Utilisateur en complément des présentes CGU.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                2.2. Consultation en ligne
              </h3>
              <p>
                La fonction de consultation en ligne permet à l'Utilisateur de visualiser tout ou partie d'un document, page après page, sans possibilité de télécharger les pages consultées. Pour utiliser cette fonctionnalité dans de bonnes conditions, l'Utilisateur doit disposer d'un écran affichant une résolution courante (1920x1080 recommandée) et de la version la plus récente de l'un des navigateurs suivants : Edge, Mozilla Firefox, Google Chrome ou Safari.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                2.3. Téléchargements
              </h3>
              <p>
                Le Site propose également le téléchargement gratuit de diverses ressources complémentaires (guides, questionnaires, corrigés, fichiers audio, etc.).
              </p>
              <p>
                Ces ressources restent téléchargeables sans limite de durée. LAHATHÈQUE ne s'engage toutefois pas à les mettre à jour et ne garantit pas leur compatibilité informatique dans le temps, ni leur bon fonctionnement sur l'ensemble des configurations informatiques existantes.
              </p>
            </div>
          </section>

          {/* Article 3 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-6 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                3
              </span>
              Obligations et responsabilités de l'Utilisateur
            </h2>

            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-navy">
                3.1. Obligations de l'Utilisateur
              </h3>
              
              <h4 className="font-semibold text-navy text-xs uppercase tracking-wider">
                3.1.1. Obligations générales
              </h4>
              <p>
                Dans le cadre de son utilisation du Site, chaque Utilisateur s'engage à respecter les présentes CGU ainsi que toute autre charte ou politique en vigueur sur le Site, et notamment à :
              </p>
              <ul className="space-y-2 list-disc list-inside text-foreground/90 pl-2">
                <li>utiliser le Site conformément à sa destination, telle que définie par les présentes CGU ;</li>
                <li>réserver son utilisation à des fins strictement personnelles, sans revendre, reproduire, diffuser ou mettre à disposition d'un tiers ou d'un autre Utilisateur, à titre gratuit ou onéreux, tout ou partie du contenu du Site — hormis dans le cadre d'un usage collectif en classe ;</li>
                <li>ne pas porter atteinte, ni tenter de porter atteinte, à la sécurité ou à l'intégrité du Site ;</li>
                <li>respecter les droits de propriété intellectuelle de LAHATHÈQUE, de ses partenaires et de tout tiers (droit d'auteur, droits voisins, droit des marques, droit sui generis sur les bases de données, etc.) ;</li>
                <li>s'abstenir de toute atteinte aux systèmes de traitement automatisé de données utilisés pour le fonctionnement du Site, au sens de la législation applicable en la matière.</li>
              </ul>
              <p className="text-xs text-rose-700 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                Tout manquement à ces obligations expose l'Utilisateur à des poursuites judiciaires et aux sanctions correspondantes.
              </p>

              <h4 className="font-semibold text-navy text-xs uppercase tracking-wider pt-3">
                3.1.2. Obligations et contraintes techniques
              </h4>
              <p>
                Le bon fonctionnement du Site suppose le respect, par les Utilisateurs, de certains prérequis techniques, susceptibles d'évoluer avec les technologies internet.
              </p>
              <p>
                L'Utilisateur s'engage à suivre les indications techniques figurant dans les présentes CGU afin d'accéder au Site et d'utiliser ses services dans de bonnes conditions. Il reconnaît disposer des compétences et des moyens nécessaires à cet effet, avoir vérifié que son équipement informatique est exempt de tout virus et en parfait état de fonctionnement, et avoir pris connaissance du présent article. L'Utilisateur s'interdit toute action susceptible de perturber ou d'entraver le fonctionnement du Site, notamment du fait de sa propre configuration informatique.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                3.2. Responsabilité de l'Utilisateur
              </h3>
              <p>
                L'Utilisateur s'engage à respecter, dans le cadre de l'utilisation du Site, la réglementation applicable ainsi que les présentes CGU. Tout manquement l'expose à des poursuites judiciaires et/ou à des sanctions.
              </p>
              <p>
                L'Utilisateur garantit l'exactitude des informations communiquées lors de son inscription, visée à l'article 2.1 des présentes CGU, et demeure seul responsable de la confidentialité de ses identifiants de connexion (pseudonyme, courriel, mot de passe).
              </p>
              <p>
                L'Utilisateur reconnaît que tout contenu téléchargé ou obtenu par quelque moyen que ce soit à partir du Site l'est à ses risques et périls.
              </p>
              <p>
                L'Utilisateur s'engage, de manière irrévocable et sans réserve, à garantir et indemniser LAHATHÈQUE de toute action, réclamation ou recours résultant d'un manquement de sa part aux présentes CGU ou à la réglementation applicable, cette garantie couvrant tant les éventuels dommages et intérêts que les frais de défense engagés (honoraires d'avocat, frais d'expertise ou de justice). L'Utilisateur demeure ainsi responsable, envers LAHATHÈQUE comme envers les tiers, de tout préjudice matériel ou immatériel résultant d'une utilisation du Site non conforme aux présentes CGU.
              </p>
            </div>
          </section>

          {/* Article 4 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-6 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                4
              </span>
              Obligations et responsabilités de l'Éditeur
            </h2>

            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-navy">
                4.1. Obligations de l'Éditeur
              </h3>
              
              <h4 className="font-semibold text-navy text-xs uppercase tracking-wider">
                4.1.1. Disponibilité du Site et des services
              </h4>
              <p>
                Le Site est accessible en permanence, sauf cas de force majeure ou événement indépendant de la volonté de LAHATHÈQUE.
              </p>
              <p>
                L'obligation de LAHATHÈQUE au titre de l'exploitation du Site est une obligation de moyens ; les Utilisateurs reconnaissent qu'aucune obligation de résultat ne pèse sur LAHATHÈQUE à ce titre.
              </p>
              <p>
                LAHATHÈQUE peut, à tout moment et sans préavis, suspendre, interrompre, modifier ou restreindre l'accès à tout ou partie du Site et de ses services, notamment pour des besoins de maintenance ou de mise à niveau, ou pour toute autre raison, sans que l'Utilisateur puisse s'en prévaloir à son encontre.
              </p>

              <h4 className="font-semibold text-navy text-xs uppercase tracking-wider pt-2">
                4.1.2. Garanties techniques
              </h4>
              <p>
                LAHATHÈQUE ne garantit pas que le Site et le serveur qui l'héberge soient exempts de virus ou d'autres éléments potentiellement nuisibles. Il incombe à chaque Utilisateur de prendre les mesures nécessaires pour protéger ses propres données et logiciels.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                4.2. Responsabilité de l'Éditeur
              </h3>
              <p>
                La responsabilité de LAHATHÈQUE ne saurait être engagée en cas :
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-foreground/90 pl-2">
                <li>d'interruption liée aux limites habituelles du réseau internet et de ses conséquences pour l'Utilisateur ou tout tiers ;</li>
                <li>d'indisponibilité du Site ou de modifications décidées par LAHATHÈQUE conformément à l'article 4.1.1, ainsi que de leurs conséquences ;</li>
                <li>d'attaque virale, notamment d'intrusion dans ses systèmes d'information ou de vol de données ;</li>
                <li>d'utilisation anormale ou illicite du Site ;</li>
                <li>de manquement d'un Utilisateur aux présentes CGU ou à tout autre document contractuel applicable ;</li>
                <li>de dommages matériels ou immatériels, directs ou indirects, résultant de l'accès ou de l'utilisation du Site, y compris en cas de téléchargement de contenu (inaccessibilité, perte de données, détérioration, virus, etc. affectant l'équipement de l'Utilisateur).</li>
              </ul>
              <p>
                LAHATHÈQUE ne saurait davantage être tenue responsable des contenus, publicités, produits ou services disponibles sur les sites tiers accessibles par des liens hypertextes figurant sur le Site.
              </p>
              <p>
                LAHATHÈQUE veille à la qualité du contenu du Site, sans pouvoir toutefois garantir l'exactitude, l'actualité ou l'exhaustivité des informations qui y figurent, ni être tenue pour responsable des erreurs ou omissions éventuelles.
              </p>
              <p className="font-semibold text-navy">
                En tout état de cause, la responsabilité de LAHATHÈQUE ne pourra être recherchée qu'en cas de faute prouvée.
              </p>
            </div>
          </section>

          {/* Article 5 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-6 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                5
              </span>
              Propriété intellectuelle
            </h2>
            <p className="text-xs text-rose-700 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
              Toute violation des dispositions du présent article expose l'Utilisateur à des poursuites judiciaires, civiles et/ou pénales.
            </p>

            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-navy">
                5.1. Dispositions générales
              </h3>
              <p>
                Le Site constitue une œuvre protégée.
              </p>
              <p>
                LAHATHÈQUE et, le cas échéant, ses partenaires, détiennent l'ensemble des droits d'exploitation afférents aux contenus de chaque page composant le Site, ainsi qu'à son arborescence.
              </p>
              <p>
                L'accès, la consultation et l'utilisation du Site par les Utilisateurs se font exclusivement à des fins pédagogiques et éducatives, non commerciales et non lucratives, ce que les Utilisateurs acceptent expressément et sans réserve.
              </p>
              <p>
                Les marques, dénominations, logos, titres, noms de collection, visuels, illustrations, textes et extraits de documents publiés sur le Site (ci-après les « Contenus ») appartiennent à LAHATHÈQUE et, le cas échéant, à ses partenaires. Ils ne peuvent, sans autorisation préalable de LAHATHÈQUE, être reproduits, représentés, adaptés, copiés, extraits, modifiés, traduits ou exploités, en tout ou partie, par quelque moyen ou sous quelque forme que ce soit, sous peine de poursuites, sauf dans les limites des exceptions légales au droit d'auteur.
              </p>
              <p>
                Il en va de même pour les développements informatiques et technologiques sous-jacents au Site, qui ne peuvent être reproduits, décompilés ou désassemblés sans l'autorisation expresse et préalable de LAHATHÈQUE, sous peine de poursuites.
              </p>
              <p>
                De manière générale, les Utilisateurs s'interdisent toute atteinte aux droits de propriété intellectuelle de LAHATHÈQUE ou de ses partenaires (droit d'auteur, droits voisins, droit sui generis des producteurs de bases de données, droit des marques, noms de domaine, etc.). Il est rappelé que toute atteinte à un système de traitement automatisé de données, ou plus largement toute action perturbant le fonctionnement du Site, engage la responsabilité de son auteur.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                5.2. Politique relative à la fouille de textes et de données
              </h3>
              <p>
                LAHATHÈQUE s'oppose à toute opération de moissonnage ou de fouille de textes et de données visant le Site et l'ensemble des Contenus auxquels il donne accès.
              </p>
              <p>
                Toute opération de cette nature, y compris au moyen de dispositifs de collecte automatisée, constitue un acte de contrefaçon en l'absence d'accord préalable et exprès de LAHATHÈQUE.
              </p>
              <p>
                Cette opposition est exprimée par les présentes CGU, indépendamment de la présence ou non de métadonnées associées au Site ou à ses Contenus. Sauf autorisation de LAHATHÈQUE, l'utilisation de systèmes ou logiciels automatisés pour extraire ou collecter tout ou partie des Contenus du Site, quelle qu'en soit la finalité (capture d'écran, exploration ou extraction de données ou de textes, etc.), est interdite.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                5.3. Lien hypertexte vers le Site
              </h3>
              <p>
                Un Utilisateur peut créer, depuis son propre site, un lien hypertexte simple pointant vers le Site, à l'exception des sites diffusant des contenus illicites, politiques, religieux ou pornographiques. LAHATHÈQUE se réserve un droit d'opposition à tout lien de ce type et décline toute responsabilité quant aux informations publiées sur les sites qui renverraient ainsi vers le Site.
              </p>
            </div>
          </section>

          {/* Article 6 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                6
              </span>
              Données personnelles
            </h2>
            <p>
              Les données à caractère personnel des Utilisateurs sont traitées conformément à la Charte relative aux données personnelles publiée sur le Site, ainsi qu'à la législation béninoise applicable en la matière, notamment le Code du numérique en République du Bénin.
            </p>
            <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-2 mt-4">
              <p className="font-semibold text-navy">
                Contact pour toute question relative aux présentes CGU :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-foreground/80 pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <span>lahaeditions1@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  <span>+229 01 97 89 82 42</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  <span>Lun-Ven : 8h30 - 17h30</span>
                </div>
              </div>
            </div>
          </section>

          {/* Article 7 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-6 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                7
              </span>
              Dispositions diverses
            </h2>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-navy">
                7.1. Non-renonciation
              </h3>
              <p>
                Le fait pour LAHATHÈQUE de ne pas exercer, à un moment donné, l'un quelconque de ses droits ne saurait être interprété comme une renonciation à s'en prévaloir ultérieurement.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                7.2. Nullité partielle
              </h3>
              <p>
                Si l'une des dispositions des présentes CGU venait à être déclarée nulle, en tout ou partie, en application d'une règle de droit ou d'une décision de justice devenue définitive, les autres dispositions, ou la partie non affectée, resteraient pleinement applicables.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                7.3. Droit applicable et règlement des litiges
              </h3>
              <p>
                Les présentes CGU sont régies par le droit béninois. En cas de litige portant sur l'utilisation du Site ou sur l'interprétation ou l'exécution des présentes CGU, les Utilisateurs et LAHATHÈQUE s'engagent à rechercher de bonne foi une solution amiable. À défaut d'accord amiable, tout litige relatif à l'utilisation du Site relèvera de la compétence exclusive des juridictions de la République du Bénin.
              </p>
            </div>
          </section>

        </div>

        {/* Pied de page de consultation CGU */}
        <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-gold/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-lg font-bold">Consultez également nos CGV</h3>
            <p className="text-xs text-white/80">Découvrez les conditions générales régissant la vente de livres et d'abonnements.</p>
          </div>
          <Link
            href="/cgv"
            className="px-6 py-3 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs shrink-0 shadow transition-colors flex items-center gap-2"
          >
            Lire les CGV
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
