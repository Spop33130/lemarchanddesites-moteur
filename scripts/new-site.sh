#!/usr/bin/env bash
#
# new-site.sh — Génère un site client AUTONOME à partir d'un config.json généré
# par la fiche client, dans son propre dossier + repo git (prêt pour Vercel).
#
# Usage :
#   scripts/new-site.sh <slug> <config.json> [dossier-images | -] [domaine]
#
#   <slug>          nom du dossier/repo, ex : boulangerie-martin
#   <config.json>   chemin du config.json téléchargé depuis la fiche client
#   [images]        dossier contenant hero.jpg, about.jpg, gallery-1..6.jpg
#                   ("-" ou omis → images placeholder à remplacer plus tard)
#   [domaine]       ex : boulangerie-martin.fr (pour sitemap.xml / robots.txt)
#
# Exemple :
#   scripts/new-site.sh boulangerie-martin ~/Downloads/config-boulangerie-martin.json ~/Desktop/photos boulangerie-martin.fr
#
# Le site est créé dans  ${GYS_DEV_DIR:-$HOME/Developer}/<slug>
#
set -euo pipefail

# --- Emplacements -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"          # racine du repo lemarchanddesites-moteur
DEV_DIR="${GYS_DEV_DIR:-$HOME/Developer}"

# --- Arguments --------------------------------------------------------------
SLUG="${1:-}"; CONFIG="${2:-}"; IMAGES="${3:-}"; DOMAIN="${4:-}"
if [[ -z "$SLUG" || -z "$CONFIG" ]]; then
  grep -E '^#( |$)' "$0" | sed -E 's/^# ?//'; exit 1
fi
[[ -f "$CONFIG" ]] || { echo "❌ config introuvable : $CONFIG"; exit 1; }

DEST="$DEV_DIR/$SLUG"
[[ -e "$DEST" ]] && { echo "❌ $DEST existe déjà — choisis un autre slug."; exit 1; }

# --- Validation du config.json (JSON valide + garde-fou encodage) -----------
STATUS="$(python3 - "$CONFIG" <<'PY'
import json, sys
raw = open(sys.argv[1], 'rb').read()
try:
    txt = raw.decode('utf-8')
except UnicodeDecodeError:
    print("ENCODING"); sys.exit(0)
try:
    json.loads(txt)
except Exception as e:
    print("JSON:" + str(e)[:80]); sys.exit(0)
print("MOJIBAKE" if 'Ã' in txt else "OK")
PY
)"
case "$STATUS" in
  OK) : ;;
  ENCODING) echo "❌ Le fichier n'est pas en UTF-8. Re-télécharge-le sans l'ouvrir dans Notepad/Excel."; exit 1 ;;
  MOJIBAKE) echo "❌ Accents cassés (mojibake) détectés dans le config — il a été ré-enregistré en Latin-1/ANSI."; echo "   Re-télécharge le fichier BRUT depuis la fiche, sans l'ouvrir/ré-enregistrer dans un éditeur."; exit 1 ;;
  JSON:*)   echo "❌ config.json invalide → ${STATUS#JSON:}"; exit 1 ;;
  *)        echo "❌ Validation impossible : $STATUS"; exit 1 ;;
esac

# --- Création du site -------------------------------------------------------
echo "→ Création de $DEST"
mkdir -p "$DEST/images"

# Squelette autonome (liste blanche : on ne copie QUE le site vitrine)
for f in index.html app.js style.css favicon.svg robots.txt sitemap.xml vercel.json; do
  cp "$TEMPLATE_DIR/$f" "$DEST/$f"
done
cp -R "$TEMPLATE_DIR/vendor"   "$DEST/vendor"
cp -R "$TEMPLATE_DIR/mentions" "$DEST/mentions"

# Config client
cp "$CONFIG" "$DEST/config.json"

# Thème : inscrit data-theme dans index.html (anti-flash), depuis le config (défaut dark)
THEME="$(python3 -c "import json;print(json.load(open('$DEST/config.json')).get('theme') or 'dark')" 2>/dev/null || echo dark)"
if [[ "$THEME" == "dark" || "$THEME" == "light" ]]; then
  sed -i.bak "s#<html lang=\"fr\">#<html lang=\"fr\" data-theme=\"$THEME\">#" "$DEST/index.html" && rm -f "$DEST/index.html.bak"
  echo "  thème : $THEME"
fi

# Ambiance de métier : le site la référence en /themes/<nom>.css, il doit donc
# l'embarquer. Sans ça, le site part en ligne sans son identité visuelle.
AMBIANCE="$(python3 -c "import json;print(json.load(open('$DEST/config.json')).get('ambiance') or '')" 2>/dev/null || echo '')"
if [[ -n "$AMBIANCE" ]]; then
  if [[ -f "$TEMPLATE_DIR/themes/$AMBIANCE.css" ]]; then
    mkdir -p "$DEST/themes"
    cp "$TEMPLATE_DIR/themes/$AMBIANCE.css" "$DEST/themes/"
    echo "  ambiance : $AMBIANCE"
  else
    echo "  ⚠ ambiance « $AMBIANCE » inconnue — le site gardera le socle neutre"
  fi
fi

# Images : fournies, sinon placeholders
if [[ -n "$IMAGES" && "$IMAGES" != "-" && -d "$IMAGES" ]]; then
  cp "$IMAGES"/hero.jpg "$IMAGES"/about.jpg "$IMAGES"/gallery-*.jpg "$DEST/images/" 2>/dev/null || true
  echo "  images copiées depuis $IMAGES"
else
  cp "$TEMPLATE_DIR/scripts/placeholders/"*.jpg "$DEST/images/"
  echo "  images placeholder posées (à remplacer : hero.jpg, about.jpg, gallery-1..6.jpg)"
fi

# Domaine dans sitemap.xml / robots.txt
NEWDOM="${DOMAIN:+https://$DOMAIN}"; NEWDOM="${NEWDOM:-https://A-DEFINIR.fr}"
for f in sitemap.xml robots.txt; do
  sed -i.bak "s#https://demos\.lemarchanddesites\.fr#$NEWDOM#g" "$DEST/$f" && rm -f "$DEST/$f.bak"
done
[[ -z "$DOMAIN" ]] && echo "  ⚠ domaine non fourni → sitemap.xml/robots.txt pointent sur A-DEFINIR.fr (à éditer)"

# --- Pages secondaires (forfait multi-pages) --------------------------------
# Pré-générées en HTML : ces pages servent à être trouvées sur Google, elles ne
# doivent pas dépendre de JavaScript pour afficher leur contenu.
cp "$TEMPLATE_DIR/page.js" "$DEST/page.js"
NB_PAGES="$(python3 -c "import json;print(len(json.load(open('$DEST/config.json')).get('pages') or []))" 2>/dev/null || echo 0)"
if [[ "$NB_PAGES" -gt 0 ]]; then
  echo "→ Génération de $NB_PAGES page(s) secondaire(s)"
  python3 "$TEMPLATE_DIR/scripts/build-pages.py" "$DEST"
else
  echo "  (site une page — aucune page secondaire dans le config)"
fi

# --- Git --------------------------------------------------------------------
( cd "$DEST"
  git init -q
  printf '.DS_Store\nnode_modules/\n.vercel/\n' > .gitignore
  git add -A
  git -c user.name="${GIT_AUTHOR_NAME:-$(git config user.name || echo "Le Marchand de Sites")}" \
      -c user.email="${GIT_AUTHOR_EMAIL:-$(git config user.email || echo noreply@example.com)}" \
      commit -q -m "init: site $SLUG depuis le moteur du Marchand de Sites"
)

# --- Récap ------------------------------------------------------------------
SITE_NAME="$(python3 -c "import json;print(json.load(open('$DEST/config.json')).get('siteName',''))" 2>/dev/null || true)"
cat <<EOF

✅ Site « ${SITE_NAME:-$SLUG} » créé : $DEST

Aperçu local :
  cd "$DEST" && python3 -m http.server 8080   # puis http://localhost:8080

Après une modification du config.json (textes, pages, couleurs) :
  python3 "$TEMPLATE_DIR/scripts/build-pages.py" "$DEST"

Mettre en ligne (repo + Vercel) :
  cd "$DEST"
  gh repo create "$SLUG" --private --source=. --push
  vercel --prod                                # suivre l'assistant, puis relier le domaine

À finir :
  • Remplacer les 8 images dans images/ si placeholders
  • Vérifier config.json (adresse, tél, email, couleurs)
EOF
