---
name: build-lahatheque-screen
description: Procédure pas-à-pas obligatoire pour concevoir, prototyper, intégrer et valider un écran ou un dashboard sur LAHAThèque en utilisant les mockups et 21st.dev.
---
# Workflow: build-lahatheque-screen

"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-[60vh]" // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10"></sidebarbody>
          


            {open ?  : }
            
          
  );
}

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      

Procédure à suivre INTÉGRALEMENT, dans l'ordre, pour construire un écran/sous-page/modale de LAHAThèque. Ne saute aucune étape. Si une étape ne peut pas être complétée (info manquante), annonce l'hypothèse retenue en une ligne et continue — ne t'arrête jamais sur un détail mineur.

Les Rules `AGENTS.md` s'appliquent en permanence pendant tout ce workflow (couleurs, mobile-first, réutilisation).

## Étape 1 — Lecture des specs (obligatoire, avant tout code)

1. Identifie le rôle concerné par l'écran (`student`, `teacher`, `librarian`, `publisher`, `author`, `legal_reviewer`, `layout_artist`, `partner_api`, `admin`, `super_admin`).
2. Relis la section correspondante du plan de specs techniques (modèle Django exact : champs, types, statuts).
3. Relis la section correspondante du cahier des charges métier (intention fonctionnelle, libellés attendus).
4. Vérifie la matrice des rôles pour savoir précisément ce que ce rôle peut voir/faire sur cet écran.
5. Si un backend réel est accessible dans le repo, vérifie ce qui est déjà implémenté sur le module concerné — sinon, base-toi uniquement sur le plan de specs.

**Ne passe pas à l'étape 2 sans avoir listé : les champs de données affichés, les actions possibles, les statuts/états de l'écran.**

## Étape 2 — Arborescence de l'écran

Liste explicitement :

- La page racine et son URL (`app/(dashboard)/<role>/<section>/page.tsx`)
- Les sous-pages liées
- Les modales déclenchées depuis cet écran (confirmation, détail rapide, upload, aperçu…)
- Le layout partagé utilisé (sidebar/topbar/breadcrumb du shell dashboard)

## Étape 3 — Données mockées typées

1. Crée/complète l'interface TypeScript dans `lib/types/<module>.ts`, alignée champ pour champ sur le modèle Django (Étape 1).
2. Crée/complète `lib/mock/<module>.ts` avec 3 à 8 objets réalistes (vrais noms d'universités/pays du cahier des charges : UAC, UNA, Université de Parakou, BJ/SN/NE/TG/CI/GA/CD).
3. Crée/complète `lib/services/<module>.ts` : fonctions async avec délai simulé, jamais de fetch en dur dans un composant.

## Étape 4 — Recherche de composants 21st.dev (CHECKPOINT NON-SKIPPABLE, effort obligatoire)

**Objectif : trouver systématiquement un composant adapté. "Rien de pertinent" est un dernier recours, jamais une première réponse.**

Pour chaque composant UI non-trivial de l'écran (table, carte, stepper, drawer, dropzone, badge de statut, formulaire multi-étapes, stats card, timeline de validation, sidebar, topbar) :

1. **Appelle `get_inspiration`** en premier avec une description du besoin — ce tool reranke les résultats contre le Design Context du projet (stack Next.js/Tailwind/TS, tokens `globals.css`), donc il priorise déjà les candidats les plus compatibles. Gratuit, sans limite.
2. **Complète avec `search`** (gratuit, illimité) en reformulant au moins 2 fois avec des angles différents (synonymes, terme plus générique, terme plus spécifique — ex: "data grid", "table with filters", "sortable table card view") si `get_inspiration` n'a pas suffi.
3. Présélectionne 1 à 2 candidats sur la base des métadonnées (nom, description, preview image) avant d'aller plus loin — ne pas appeler `get_component` sur tous les résultats.
4. **Appelle `get_component`** uniquement sur le(s) candidat(s) présélectionné(s) pour lire le code réel. Si la réponse indique `locked=true` (quota atteint), appelle `get_usage` pour vérifier le quota restant avant de retenter ou de passer à l'option suivante.
5. Si un résultat est proche mais pas parfait, **adapte-le plutôt que de l'écarter** : un composant 21st.dev modifié reste préférable à un composant écrit intégralement à la main.
6. Adaptation obligatoire de tout composant retenu : couleurs → tokens `globals.css`, comportement mobile-first, props renommées pour marcher les types TS du projet, ajout des états manquants (loading/empty/error — voir Rules).
7. Si aucun résultat de `get_inspiration`/`search` n'est adaptable, essaie `generate` (mode `code`) avant d'écrire intégralement à la main — c'est un filet de sécurité intelligent, aussi metered donc à utiliser une fois la recherche épuisée.
8. Seulement après avoir éradiqué `get_inspiration`, `search` (au moins 3 requêtes au total) et `generate`, tu peux écrire "recherche 21st.dev effectuée ([liste des requêtes/tools tentés]), rien d'adaptable trouvé, composant codé à la main" — et coder à la main en respectant les Rules.

**Tu ne dois JAMAIS écrire un composant UI générique sans avoir documenté cette chaîne d'essais (`get_inspiration` → `search` reformulé → `get_component` sur candidats → `generate` en dernier recours). Une déclaration "rien de pertinent" sans cette chaîne documentée est un échec du workflow — reviens en arrière.**

## Étape 5 — UI mobile-first, intuitivité & loading

Applique les Rules (couleurs, breakpoints, zones tactiles, système de loading global, règles d'intuitivité). Conçois explicitement tous les états du composant : default, hover, focus, **loading (via le système global, jamais un spinner ad hoc)**, empty (avec CTA), error (avec message actionnable), disabled. Vérifie que toute action destructrice a sa modale de confirmation et que les icônes seules ont un tooltip/label.

## Étape 6 — UX writing

Rédige tous les textes d'interface en français, ton direct et fonctionnel (voir Rules). Traduis les statuts de workflow en français humain.

## Étape 7 — Implémentation

1. Écris le composant/page en TypeScript strict, accessible (ARIA, HTML sémantique).
2. Compose la page à partir de composants fins ; la logique vit dans les composants/hooks, pas dans la page.
3. Vérifie qu'aucun appel réseau réel n'a été introduit — uniquement les services mockés de l'étape 3.

## Étape 8 — Checklist finale avant de considérer l'écran terminé

Réponds explicitement à chaque point :

- [ ]  Lisible et fonctionnel sous 400px de large ?
- [ ]  Chaque champ affiché correspond à un champ réel du modèle Django ?
- [ ]  Statuts traduits en français, jamais en snake_case brut ?
- [ ]  Tous les états (loading/empty/error) conçus, pas juste le happy path ?
- [ ]  Zéro couleur codée en dur — uniquement des tokens `globals.css` ?
- [ ]  Étape 4 (21st.dev) documentée avec au moins 3 requêtes par composant non-trivial ?
- [ ]  Composant réutilisable entre rôles proches identifié comme tel (pas dupliqué inutilement) ?
- [ ]  Loading géré via le système global (skeleton qui épouse la forme du contenu final), pas un spinner réinventé ?
- [ ]  Toute action destructrice a sa modale de confirmation ?
- [ ]  Toute icône seule a un tooltip/label accessible ?
- [ ]  États "chargement" / "vide" / "aucun résultat" bien distincts et non confondus ?
- [ ]  Breadcrumb présent si l'écran est à plus d'un niveau de profondeur ?

Si un point de la checklist échoue, corrige avant de considérer la tâche terminée — ne close pas l'écran avec une checklist partiellement cochée sans le signaler explicitement.

"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean></boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean></boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;  animate?: boolean;}) => {  return (    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>      {children}    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div></typeof>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div></typeof>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        


        <AnimatePresence>                    {children}            </motion.div>          )}                  {open && (            <motion.div              initial={{ x: "-100%", opacity: 0 }}              animate={{ x: 0, opacity: 1 }}              exit={{ x: "-100%", opacity: 0 }}              transition={{                duration: 0.3,                ease: "easeInOut",              }}              className={cn(                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",                className              )}            >              <div                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"                onClick={() => setOpen(!open)}              >                              </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    
  );
};
