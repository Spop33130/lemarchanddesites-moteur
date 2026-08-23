# Le moteur de sites — Le Marchand de Sites

Outil de production interne du **Marchand de Sites**. Il fabrique les sites
clients à partir d'un seul fichier de contenu, sans écrire de code par client.

C'est lui qui rend l'offre tenable : un site une page est livré en 3 jours parce
qu'il n'est pas codé à la main, mais rempli.

**En ligne :** [demos.lemarchanddesites.fr](https://demos.lemarchanddesites.fr) —
outil interne, pas une marque montrée aux clients.

```
config.json  ──▶  moteur  ──▶  site autonome (repo + Vercel + domaine)
```

---

## Le parcours complet, dans l'ordre

Du rendez-vous au site en ligne. Chaque étape renvoie à un fichier ou une
commande qui existe vraiment — rien d'aspirationnel.

### 1 — Le rendez-vous

Le client réserve sur [`/rendez-vous/`](https://lemarchanddesites.fr/rendez-vous/)
(Cal.com, 15 min, appel téléphonique). La réservation apparaît dans l'agenda —
aucune action de suivi nécessaire.

Ce qui est annoncé au téléphone (formule, prix, date) doit rester vrai jusqu'à
la facture — c'est la promesse du site : *« Le prix est écrit et il ne bouge
pas. »*

### 2 — Le client remplit ses informations

Après l'appel, envoyer ce lien au client :
[`lemarchanddesites.fr/vos-informations/`](https://lemarchanddesites.fr/vos-informations/)

Il y saisit lui-même (cinq minutes, depuis son téléphone) : nom du commerce,
description, ville, ses prestations, ses coordonnées. À la validation, un
e-mail arrive directement sur `contact@lemarchanddesites.fr` avec un résumé
lisible et un bloc de données prêt à coller dans le configurateur.

La page rappelle aussi d'envoyer les photos séparément par WhatsApp (lien
pré-rempli fourni sur la page) — il n'y a pas d'envoi de fichiers intégré au
formulaire.

> Reste à la charge de Théo : les avis clients, les questions fréquentes, les
> mentions légales (SIRET) et le choix de l'ambiance — le client ne les
> renseigne pas lui-même.

### 3 — Le paiement (moitié à la commande)

Facture + virement, en dehors du site. Moitié à la commande, moitié le jour
de la mise en ligne.

### 4 — Remplir le configurateur

Ouvrir [`/configurateur/`](https://demos.lemarchanddesites.fr/configurateur/).

- **« Coller depuis un mail »** — coller le bloc reçu à l'étape 2 : les champs
  déjà remplis (couleurs, ambiance…) sont conservés, seuls ceux du client sont
  complétés.
- Ou **« Ouvrir un site existant »** pour reprendre un `config.json` déjà
  enregistré.

Compléter ce que le client n'a pas rempli : couleurs, **ambiance de métier**
(`artisan` / `restaurant` / `salon` / `commerce` — change polices et formes
pour que le site ne ressemble pas aux autres sites du même moteur), pages
secondaires pour le forfait cinq pages, noms des fichiers photo, avis,
questions, mentions légales.

Cliquer sur **Enregistrer le fichier** : un `config-nom-du-client.json` part
dans `~/Downloads`. Rien n'est sauvegardé avant ce clic.

### 5 — Le domaine (si le client n'en a pas)

Achat à l'année chez o2switch (registrar déjà utilisé pour les autres
domaines) — inclus dans le prix la première année.

### 6 — Générer le site

Dans l'app **Terminal** :

```bash
cd ~/Developer/lemarchanddesites-moteur
scripts/new-site.sh couverture-lefevre ~/Downloads/config-couverture-lefevre.json ~/Desktop/photos-client couverture-lefevre.fr
```

Les quatre mots après `new-site.sh` sont à adapter à chaque fois :
1. **le nom du dossier/projet**, choisi par vous (souvent le nom du client)
2. **le chemin du `.json`** téléchargé à l'étape 4
3. **le dossier des photos** sur l'ordinateur (`-` si pas encore reçues)
4. **le nom de domaine**, si déjà connu

Ça crée `~/Developer/couverture-lefevre/` : site complet, pages secondaires
générées s'il y en a, dépôt git initialisé.

Vérifier avant de publier :

```bash
cd ~/Developer/couverture-lefevre && python3 -m http.server 8080
```

puis ouvrir `localhost:8080` — sur téléphone et sur ordinateur.

### 7 — Mettre en ligne

Toujours dans le même dossier :

```bash
gh repo create couverture-lefevre --private --source=. --push
vercel --prod
```

La première commande crée le dépôt GitHub et y envoie le code. La seconde
déploie sur Vercel (pose 2-3 questions la première fois — valider les
propositions par défaut) et donne une adresse `.vercel.app` qui fonctionne
tout de suite.

Sur **vercel.com** → le projet → *Settings → Domains* → ajouter le vrai
domaine du client : Vercel indique l'enregistrement DNS à poser. Le poser
dans le cPanel o2switch (*Zone Editor*).

> ⚠️ **Piège déjà rencontré plusieurs fois** : cPanel affiche l'enregistrement
> immédiatement, mais sa propagation vers les serveurs publics d'o2switch
> peut prendre de quelques minutes à plusieurs heures. Vérifier l'état réel
> avec `dig +short <domaine> A @ns1.o2switch.net` (ou `CNAME` selon le cas) —
> pas avec `dig` en local, qui reste sur une réponse mise en cache.

### 8 — Vérifier et livrer

```bash
curl -sI https://<domaine>/
```

doit répondre `200`. Vérifier aussi une page secondaire s'il y en a, et le
formulaire de contact depuis un vrai téléphone.

Puis : envoyer le lien au client, facturer la seconde moitié, rappeler
l'entretien optionnel (30 €/mois, modifications illimitées, domaine et
hébergement compris — sinon le client gère lui-même le renouvellement
d'environ 60 €/an à partir de la deuxième année).

---

## Ce que ça produit

**Un site une page** — hero, à propos, prestations, galerie avec agrandissement,
avis en carrousel, avis Google, questions, horaires avec statut ouvert/fermé en
direct, formulaire de contact, carte, barre d'appel sur mobile.

**Ou un site multi-pages** — la même page d'accueil, plus **une page par
prestation**. Ces pages sont l'intérêt du forfait cinq pages : quelqu'un qui
cherche « couvreur Bordeaux » doit tomber sur la page *Couverture*, pas sur
l'accueil.

> Les pages secondaires sont **pré-générées en HTML**, contenu écrit dans le
> fichier. C'est délibéré : elles existent pour être indexées, et un moteur de
> recherche ne doit rien avoir à exécuter pour les lire. Chacune porte son titre,
> sa description, ses données structurées `Service` avec les villes couvertes,
> et sa `FAQPage`.

---

## Les ambiances

Sans ambiance, tous les sites produits se ressemblent — et un client qui
reconnaît le site de son concurrent dans le sien ne signe pas.

Une ambiance est une feuille de style posée **par-dessus** le socle. Elle
redéfinit polices, angles et matières, sans toucher au moteur.

| Ambiance | Pour qui | Ce qui change |
|---|---|---|
| `artisan` | Bâtiment, mécanique, métiers manuels | Bricolage Grotesque, angles courts, filets francs |
| `restaurant` | Bistrot, traiteur, cave | Fraunces serif, accroche en italique, crème le jour / espresso la nuit |
| `salon` | Coiffure, esthétique, bien-être | Graisses fines, capitales espacées, beaucoup d'air |
| `commerce` | Épicerie, boutique, métiers de bouche | Fraunces serrée, crème, surtitres encadrés comme des étiquettes |

Absente du config, le site garde le socle neutre.

⚠️ **Une ambiance ne doit jamais reprendre la charte du Marchand de Sites.** Le
site d'un couvreur doit ressembler à un couvreur, pas à son prestataire web.

### Les polices

Hébergées **en local** dans `vendor/fonts/`, jamais chargées depuis Google.
Charger une police depuis le CDN de Google transmet l'adresse IP du visiteur à un
serveur américain — condamné plusieurs fois en Europe, et inutile à risquer sur
des sites français qui affichent une page « Confidentialité ».

---

## Ce que le client ne remplit pas lui-même

`/vos-informations/` ne couvre que le texte de base. Reste à la charge de
Théo, dans le configurateur :

| Élément | Détail |
|---|---|
| SIRET | Sur le Kbis ou l'avis Insee du client |
| 2 ou 3 avis clients | Texte, prénom, ville |
| 8 photos | `hero.jpg`, `about.jpg`, `gallery-1.jpg` … `gallery-6.jpg` — reçues par WhatsApp |
| Couleurs et ambiance | Choisies en fonction du métier |

Des photos de téléphone suffisent si elles sont nettes et prises de jour. Trois
bonnes photos valent mieux que huit mauvaises : la galerie s'adapte.

> Ne jamais rouvrir un `.json` dans Word, Excel ou le Bloc-notes pour le
> corriger : ces logiciels cassent les accents et le fichier devient
> inutilisable. Pour le modifier, le rouvrir dans le configurateur.

---

## Modifier un site déjà en ligne

1. Ouvrir son `config.json` dans le configurateur, modifier, enregistrer.
2. Remplacer le `config.json` du dossier du site.
3. Si le site a des pages secondaires, les régénérer :

```bash
python3 ~/Developer/lemarchanddesites-moteur/scripts/build-pages.py ~/Developer/couverture-lefevre
```

4. Publier :

```bash
git add -A && git commit -m "maj contenu" && git push
```

La mise en ligne est automatique après le `git push`.

---

## Contrôler avant de livrer

```bash
python3 scripts/verif-demos.py
```

Vérifie que chaque ambiance reste lisible dans les **quatre** situations
d'affichage : clair par défaut, sombre selon l'appareil, et les deux thèmes
forcés par le config.

Ce contrôle existe à cause d'une régression réelle : une ambiance ne redéfinissait
les couleurs que pour le mode clair, et sur un appareil en mode sombre les titres
devenaient blancs sur fond crème. **Le bug était invisible tant qu'on ne testait
qu'en mode clair.**

---

## Les démos

| Adresse | Métier | Ambiance |
|---|---|---|
| `/demos/artisan/` | Couvreur-zingueur | artisan |
| `/demos/artisan-multipages/` | Le même en forfait cinq pages | artisan |
| `/demos/restaurant/` | Bistrot | restaurant |
| `/demos/salon/` | Coiffure & beauté | salon |
| `/demos/commerce/` | Épicerie fine | commerce |

Montrer la démo une page, puis la multi-pages : la différence entre les deux
forfaits se voit immédiatement.

---

## Le dépôt

```
index.html          page d'accueil (rendue depuis config.json)
app.js              moteur de la page d'accueil
page.js             pages secondaires : menu et apparitions seulement
style.css           socle commun
themes/             une ambiance par métier
configurateur/      remplir un config.json sans écrire de code
demos/              cinq démos à montrer aux clients
scripts/
  new-site.sh       crée un site autonome depuis un config
  build-pages.py    génère les pages secondaires et la navigation
  verif-demos.py    contrôle la lisibilité des ambiances
vendor/fonts/       polices hébergées localement
```

`scripts/` ne part pas en ligne (`.vercelignore`).

---

## Ce qu'il faut savoir avant de toucher au code

- **Le config est la seule source.** Pour changer un site, on modifie son
  `config.json`, pas son HTML.
- **`build-pages.py` est idempotent.** Il réécrit les pages, la navigation de
  toutes les pages et le `sitemap.xml`. On peut le relancer sans risque.
- **Une modification du socle ne touche pas les sites déjà livrés** : chaque site
  généré embarque sa propre copie de `style.css` et `app.js`.
- **Cinq pages est le maximum.** Au-delà, ce n'est plus le forfait, c'est un devis.
