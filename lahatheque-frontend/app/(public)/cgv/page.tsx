import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  RotateCcw, 
  Scale, 
  Phone, 
  Mail,
  Clock,
  ArrowRight,
  PackageCheck
} from "lucide-react";

export const metadata = {
  title: "Conditions Générales de Vente (CGV) — LAHAThèque",
  description: "Conditions Générales de Vente régissant la commande d'ouvrages et de services documentaires sur LAHAThèque.",
};

export default function CgvPage() {
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
            <Link
              href="/cgu"
              className="px-3 py-1 rounded-full bg-background-secondary text-foreground-muted hover:text-navy border border-border font-medium transition-colors"
            >
              Consulter les CGU
            </Link>
            <span className="px-3 py-1 rounded-full bg-gold/10 text-navy font-bold border border-gold/30">
              CGV en vigueur
            </span>
          </div>
        </div>

        {/* En-tête de page */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/10 text-navy border border-navy/20 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5 text-navy" />
            Relations Commerciales &amp; Ventes
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Conditions régissant la relation commerciale entre LAHATHÈQUE et les clients passant commande sur le site https://lahatheque.com.
          </p>
        </div>

        {/* Préambule */}
        <div className="bg-background-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-navy">
            Préambule &amp; Cadre Général
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Les présentes conditions générales de vente (les « CGV ») encadrent la relation commerciale entre <strong>LAHATHÈQUE</strong>, plateforme documentaire ayant son siège en République du Bénin (ci-après « LAHATHÈQUE » ou « l'Éditeur »), et toute personne physique ou morale inscrite ayant passé commande (ci-après le « Client », les deux étant désignés ensemble les « Parties ») depuis le site <strong className="text-navy">https://lahatheque.com</strong> (ci-après le « Site »).
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Ces CGV se lisent conjointement avec les Conditions d'utilisation du Site et la Charte relative aux données personnelles publiées sur le Site.
          </p>
          <div className="bg-background p-4 rounded-xl border border-border space-y-2 text-xs sm:text-sm">
            <span className="font-bold text-navy block">Le Site permet au Client :</span>
            <ul className="space-y-1.5 list-disc list-inside text-foreground/90 pl-1">
              <li>d'obtenir la mise à disposition d'un document correspondant à la discipline et au niveau concernés, à titre de documentation pédagogique, moyennant une contribution forfaitaire de mise à disposition — ces exemplaires spécimens ne pouvant en aucun cas être revendus ;</li>
              <li>d'acheter des ouvrages, à raison d'un exemplaire imprimé au maximum par titre et par année scolaire ;</li>
              <li>d'acquérir des compléments pédagogiques (supports audio, DVD, CD-Rom, fiches photocopiables, cartes flash, coffrets, transparents, etc.).</li>
            </ul>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Pour toute commande groupée d'ouvrages imprimés, le Client est invité à se rapprocher d'une librairie partenaire. Pour l'acquisition de documents numériques ou de ressources numériques payantes, le Client sera redirigé vers la plateforme numérique dédiée de LAHATHÈQUE ou vers les revendeurs en ligne agréés. L'accès aux documents numériques et aux supports audio ainsi acquis est valable pour une durée de douze (12) mois à compter de la date d'achat.
          </p>
        </div>

        {/* Corps des Articles CGV */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-foreground/90">
          
          {/* Article 1 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                1
              </span>
              Définitions
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Client :</strong> toute personne physique ou toute personne morale (établissement scolaire, structure, organisme, ou autre entité) inscrite sur le Site et passant commande auprès de LAHATHÈQUE.
              </p>
              <p>
                <strong>Articles :</strong> tout ouvrage, documentaire ou non, ainsi que tout support complémentaire (audio, DVD, CD-Rom, fiches photocopiables, cartes flash, coffrets, transparents, etc.).
              </p>
            </div>
          </section>

          {/* Article 2 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                2
              </span>
              Portée et évolution des CGV
            </h2>
            <p>
              Les présentes CGV fixent le cadre contractuel applicable à toute vente d'Articles proposée sur le Site. Toute commande passée sur le Site suppose que le Client dispose de la capacité juridique requise et qu'il accepte, pleinement et sans réserve, les présentes CGV, rédigées exclusivement en langue française. Cette acceptation sera systématiquement recueillie avant la finalisation de chaque commande.
            </p>
            <p>
              LAHATHÈQUE pouvant faire évoluer ces CGV, la version opposable au Client est celle publiée sur le Site à la date de sa commande. Il est recommandé au Client d'en conserver une copie imprimée ou numérique.
            </p>
            <p className="text-xs text-rose-700 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
              Les Articles acquis sur le Site sont réservés à un usage personnel ou à un usage collectif en classe ; toute autre forme de reproduction, de diffusion ou d'utilisation publique est interdite et expose son auteur aux sanctions prévues par la législation béninoise et les conventions internationales applicables en matière de propriété intellectuelle.
            </p>
          </section>

          {/* Article 3 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                3
              </span>
              Accessibilité et évolution de l'offre
            </h2>
            <p>
              Le Site est accessible en permanence, sauf cas de force majeure, incident indépendant de la volonté de LAHATHÈQUE, ou opération de maintenance programmée.
            </p>
            <p>
              La disponibilité d'un Article demeure conditionnée par les stocks existants. LAHATHÈQUE conserve la faculté de modifier, enrichir, suspendre ou interrompre tout ou partie de son offre, sans préavis ni compensation, et ne saurait être tenue responsable des conséquences pouvant en résulter pour le Client.
            </p>
          </section>

          {/* Article 4 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                4
              </span>
              Création et gestion du compte Client
            </h2>
            <p>
              L'accès à la commande d'Articles suppose la création préalable d'un compte, au moyen du formulaire d'inscription en ligne, dûment et sincèrement complété. Les données ainsi recueillies demeurent confidentielles et ne sont utilisées que pour la gestion des commandes, conformément à la Charte relative aux données personnelles.
            </p>
            <p>
              À l'issue de son inscription, le Client reçoit un courriel de bienvenue. Il peut, à tout moment depuis la rubrique « Mon compte », corriger ou actualiser ses informations, et choisir de recevoir ou non les communications d'information de LAHATHÈQUE.
            </p>
            <p>
              LAHATHÈQUE peut suspendre ou clôturer, sans préavis ni indemnité, le compte d'un Client ne respectant pas les présentes CGV.
            </p>
          </section>

          {/* Article 5 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                5
              </span>
              Protection des données personnelles
            </h2>
            <p>
              LAHATHÈQUE traite les données personnelles de ses Clients dans le respect de la législation béninoise applicable, notamment le Code du numérique en République du Bénin relatif à la protection des données à caractère personnel, ainsi que des standards internationaux en la matière. Pour toute précision, le Client est invité à consulter la Charte relative aux données personnelles publiée sur le Site.
            </p>
          </section>

          {/* Article 6 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                6
              </span>
              Prix
            </h2>
            <p>
              Les prix affichés, frais de livraison inclus, sont exprimés en euros (EUR), en francs CFA (XOF) ou en dollars américains (USD), selon la devise choisie par le Client au moment de la commande, toutes taxes comprises. Le Client est facturé et règle sa commande dans la devise sélectionnée lors de la validation de son panier.
            </p>
            <p>
              LAHATHÈQUE peut modifier ses tarifs à tout moment ; seul le prix en vigueur au moment de l'enregistrement de la commande s'applique, sous réserve de la disponibilité de l'Article concerné.
            </p>
            <p>
              Pour toute livraison en dehors du territoire béninois, le prix hors taxes sera calculé automatiquement sur la facture. Les Articles restent la propriété de LAHATHÈQUE jusqu'au paiement intégral du prix. Les frais liés à l'accès et à l'utilisation du Site (connexion internet, communication, etc.) restent à la charge exclusive du Client.
            </p>
          </section>

          {/* Article 7 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                7
              </span>
              Modalités de paiement
            </h2>
            <p>
              Le règlement des commandes peut s'effectuer par carte bancaire, par PayPal, ou via les solutions de paiement en ligne Moneroo, FedaPay et autres prestataires équivalents proposés sur le Site (y compris, le cas échéant, les services de mobile money). La transmission des données de paiement est protégée par un protocole de chiffrement sécurisé. En choisissant l'un de ces moyens de paiement, le Client reconnaît les risques propres au paiement en ligne et renonce à toute réclamation envers LAHATHÈQUE en cas d'interception ou d'utilisation frauduleuse de ses données par un tiers, LAHATHÈQUE ne traitant ni ne conservant elle-même aucune donnée bancaire, celles-ci étant gérées par les prestataires de paiement agréés.
            </p>
            <p>
              Une fois le paiement validé, le Client reçoit à l'adresse électronique renseignée lors de son inscription un courriel confirmant la prise en compte de sa commande, accompagné d'un justificatif d'achat. Il est invité à conserver son numéro de commande, requis en cas de réclamation ultérieure.
            </p>
          </section>

          {/* Article 8 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                8
              </span>
              Justificatifs et suivi de commande
            </h2>
            <p>
              Sauf preuve contraire apportée par le Client, les données enregistrées par le prestataire de paiement font foi de l'ensemble des transactions réalisées entre LAHATHÈQUE et ses Clients.
            </p>
            <p>
              La rubrique « Suivi de commande » permet au Client de consulter à tout moment les références, la date, le détail, le montant et le statut de ses commandes. Ces informations restent consultables en ligne pendant deux ans à compter de la validation de la commande.
            </p>
            <p>
              Le Client peut également solliciter le service clientèle de LAHATHÈQUE pour connaître le prix, la date de parution ou la disponibilité d'un Article, ou pour obtenir des précisions sur le traitement de sa commande. Ce service est joignable par courriel à l'adresse <strong className="text-navy">lahaeditions1@gmail.com</strong>, ou par téléphone aux numéros <strong>+229 01 97 89 82 42</strong>, <strong>01 58 58 48 48</strong> ou <strong>01 62 07 79 79</strong>, du lundi au vendredi de 8h30 à 17h30.
            </p>
          </section>

          {/* Article 9 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                9
              </span>
              Livraison
            </h2>
            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-navy">
                9.1 Adresse de livraison
              </h3>
              <p>
                Pour toute première commande, la livraison s'effectue obligatoirement à l'adresse renseignée par le Client lors de son inscription. À compter de la deuxième commande, le Client peut indiquer une autre adresse de livraison de son choix, dans la limite du territoire desservi.
              </p>
            </div>
            <div className="space-y-2 pt-3 border-t border-border">
              <h3 className="font-serif text-base font-bold text-navy">
                9.2 Délais et conditions de livraison
              </h3>
              <p>
                Le délai de livraison n'excède pas 20 jours ouvrés à compter de la commande. En cas de retard, le Client peut contacter le service clientèle dont les coordonnées figurent à l'article 8. Les Articles sont expédiés au fur et à mesure de leur disponibilité ; chaque livraison est réputée réalisée dès que l'Article est mis à disposition du Client.
              </p>
            </div>
          </section>

          {/* Article 10 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                10
              </span>
              Conformité des Articles livrés
            </h2>
            <p>
              Si un Article livré est endommagé ou ne correspond pas à la commande passée, le Client doit en informer sans délai le service clientèle et retourner l'Article à l'adresse qui lui sera communiquée. LAHATHÈQUE s'engage alors, sur présentation d'un justificatif, à rembourser ou remplacer l'Article concerné et à prendre en charge les frais de retour afférents.
            </p>
          </section>

          {/* Article 11 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                11
              </span>
              Taxes et droits à l'importation
            </h2>
            <p>
              Toute commande livrée en dehors de la République du Bénin peut être soumise à des taxes ou droits de douane appliqués à l'arrivée du colis dans le pays de destination. Ces frais, à la charge exclusive du Client agissant en qualité d'importateur, relèvent de sa seule responsabilité. LAHATHÈQUE ne vérifie pas les taxes applicables dans le pays de livraison ; il appartient au Client de se renseigner auprès des autorités douanières compétentes, y compris s'agissant des redevances liées à la copie privée ou à la propriété intellectuelle dans le pays concerné.
            </p>
          </section>

          {/* Article 12 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                12
              </span>
              Responsabilités et garanties
            </h2>
            <p>
              Le Client garantit l'exactitude des informations transmises lors de son inscription et demeure seul responsable de la confidentialité de ses identifiants de connexion. Toute commande passée avec des identifiants valides engage le Client. Les risques de perte ou de détérioration des Articles sont transférés au Client dès la livraison.
            </p>
            <p>
              LAHATHÈQUE ne saurait voir sa responsabilité engagée en cas de retard ou d'inexécution de ses obligations résultant d'un événement de force majeure, dûment établi conformément au droit béninois.
            </p>
          </section>

          {/* Article 13 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                13
              </span>
              Dispositions diverses
            </h2>
            <p>
              Le fait pour LAHATHÈQUE de ne pas se prévaloir, à un moment donné, d'une clause des présentes CGV ne saurait valoir renonciation à s'en prévaloir ultérieurement.
            </p>
            <p>
              Si l'une des clauses des présentes CGV venait à être jugée nulle ou inapplicable, elle serait réputée non écrite, sans que cela n'affecte la validité de l'ensemble des autres dispositions.
            </p>
          </section>

          {/* Article 14 */}
          <section className="bg-background p-6 sm:p-8 rounded-3xl border border-border space-y-4 shadow-sm">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gold/10 text-navy font-mono text-sm font-bold flex items-center justify-center border border-gold/30">
                14
              </span>
              Droit applicable et règlement des litiges
            </h2>
            <p>
              Les présentes CGV sont régies par le droit béninois. En cas de différend relatif à leur interprétation ou à leur exécution, les Parties s'engagent à rechercher de bonne foi une solution amiable. À défaut d'accord, le Client pourra recourir gratuitement à un médiateur externe. Si la médiation échoue, le litige sera porté devant les juridictions compétentes de la République du Bénin.
            </p>

            <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-2 mt-4">
              <p className="font-semibold text-navy">
                Service Relations Clients &amp; Suivi Commercial :
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

        </div>

        {/* Pied de page CGV */}
        <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-gold/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-lg font-bold">Consultez également nos CGU</h3>
            <p className="text-xs text-white/80">Règles d'utilisation de la plateforme et protection de la propriété intellectuelle.</p>
          </div>
          <Link
            href="/cgu"
            className="px-6 py-3 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs shrink-0 shadow transition-colors flex items-center gap-2"
          >
            Lire les CGU
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
