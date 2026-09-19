# Le moteur de sites

Outil de production interne du Marchand de Sites : un `config.json` par client,
le moteur fabrique le site. Mode d'emploi complet et à jour dans
[`README.md`](README.md) — le suivre plutôt que de réinventer un parcours.

## Les pièges

**Le config est la seule source.** Pour changer un site, on modifie son
`config.json` et on régénère. Éditer le HTML produit crée une divergence
silencieuse qui saute à la prochaine génération.

**Une ambiance doit être lisible dans les quatre situations d'affichage** :
clair par défaut, sombre selon l'appareil, et les deux thèmes forcés par le
config. Une ambiance qui ne redéfinit que `:root` produit du texte blanc sur
fond crème chez un visiteur en mode sombre — c'est arrivé, et c'était invisible
tant qu'on ne testait qu'en mode clair. `python3 scripts/verif-demos.py` avant
de livrer.

**Un site généré doit être autonome.** Il embarque sa propre copie de
`style.css`, `app.js` et de son ambiance. Si `new-site.sh` oublie un fichier,
le site part sans son identité et personne ne le voit avant le client —
vérifier en servant le dossier généré isolément, pas depuis le dépôt du moteur.

**Les polices sont hébergées dans `vendor/fonts/`.** Jamais de CDN Google : ça
transmet l'IP du visiteur à un serveur américain, sur des sites français qui
affichent une page « Confidentialité ».

**Une ambiance ne reprend jamais la charte du Marchand de Sites.** Le site d'un
couvreur doit ressembler à un couvreur, pas à son prestataire.

## Skills

Liste complète et méthode d'audit dans `~/Developer/CLAUDE.md`. Vaut aussi
bien pour ce moteur que pour les sites qu'il génère (dont meynard-couverture) :

- **Jamais l'import Google Fonts que `hallmark` propose par défaut.** Le repo
  interdit tout CDN Google pour les polices (fuite d'IP vers un serveur
  américain, cf. « Les pièges » ci-dessus) — rediriger systématiquement vers
  `vendor/fonts/`, ne jamais coller l'`@import url('fonts.googleapis.com/...')`
  généré par défaut.
- **Toute ambiance produite doit redéfinir le mode sombre, pas seulement
  `:root`.** Un skill qui génère des tokens CSS sans variante `prefers-color-scheme:
  dark` ou thème forcé reproduit exactement le bug déjà rencontré et invisible
  en mode clair — `python3 scripts/verif-demos.py` reste le filet, pas une
  formalité.

## La ligne de conduite

Ce dépôt sert à livrer un site une page en trois jours. Toute complexité
ajoutée doit se payer en temps gagné sur une vraie livraison — sinon elle est à
refuser, même si elle est élégante.
