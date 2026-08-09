#!/bin/bash

# -----------------------------------------------------------------------------
# Script de validation déterministe des règles Frontend LAHAThèque
# -----------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

echo -e "${YELLOW}=== Lancement de la validation des règles de style LAHAThèque ===${NC}\n"

# 1. Vérification des couleurs hexadécimales en dur (bg-[#...], text-[#...], border-[#...], etc.)
echo "1. Recherche de couleurs hexadécimales codées en dur..."
# Exclure le dossier .next, node_modules, app/globals.css, tailwind.config.js
hardcoded_colors=$(grep -rnE "bg-\[#|text-\[#|border-\[#|from-\[#|to-\[#|via-\[#|decoration-\[#|ring-\[#|outline-\[#|fill-\[#|stroke-\[#" \
  --exclude-dir={.next,node_modules,out,dist,.git,.agents} \
  --exclude={globals.css,tailwind.config.js,postcss.config.js,check-lahatheque-rules.sh} \
  e:/Lahatheque/lahatheque-frontend/ 2>/dev/null)

if [ ! -z "$hardcoded_colors" ]; then
  echo -e "${RED}[ERREUR] Couleurs hexadécimales en dur trouvées :${NC}"
  echo "$hardcoded_colors"
  errors=$((errors + 1))
else
  echo -e "${GREEN}[OK] Aucune couleur hexadécimale en dur détectée.${NC}"
fi

echo ""

# 2. Vérification des appels réseau en dur (fetch ou axios) dans les composants/pages
echo "2. Recherche d'appels réseau en dur (fetch/axios) hors de lib/services..."
network_calls=$(grep -rnE "\bfetch\(|axios\." \
  --exclude-dir={.next,node_modules,out,dist,.git,.agents,lib} \
  --exclude={check-lahatheque-rules.sh} \
  e:/Lahatheque/lahatheque-frontend/app/ 2>/dev/null)

if [ ! -z "$network_calls" ]; then
  echo -e "${RED}[ERREUR] Appels réseau directs (fetch/axios) détectés dans le dossier app/ :${NC}"
  echo "$network_calls"
  errors=$((errors + 1))
else
  echo -e "${GREEN}[OK] Aucun appel réseau direct détecté dans le dossier app/.${NC}"
fi

echo ""

# 3. Vérification de la présence de squelettes de chargement (skeletons) si des chargements sont simulés
echo "3. Recherche de composants de chargement ad-hoc (Spinners bruts)..."
# Avertissement si un fichier contient un chargement simulé mais pas d'import de squelette
ad_hoc_loaders=$(grep -rnE "loading|spinner" \
  --exclude-dir={.next,node_modules,out,dist,.git,.agents,lib} \
  --exclude={check-lahatheque-rules.sh} \
  e:/Lahatheque/lahatheque-frontend/app/ 2>/dev/null | grep -vE "skeleton|Skeleton")

if [ ! -z "$ad_hoc_loaders" ]; then
  echo -e "${YELLOW}[ATTENTION] Des loaders ad-hoc ou mentions de spinners ont été trouvés hors-squelette :${NC}"
  echo "$ad_hoc_loaders"
  warnings=$((warnings + 1))
else
  echo -e "${GREEN}[OK] Utilisation correcte du système de chargement global.${NC}"
fi

echo ""

# Synthèse finale
echo "=== SYNTHÈSE ==="
if [ $errors -gt 0 ]; then
  echo -e "${RED}Validation ÉCHOUÉE : $errors erreur(s) critique(s) trouvée(s). Veuillez corriger.${NC}"
  exit 1
else
  if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}Validation réussie avec $warnings avertissement(s).${NC}"
  else
    echo -e "${GREEN}Validation REUSSIE ! Le code respecte 100% des règles du projet.${NC}"
  fi
  exit 0
fi
