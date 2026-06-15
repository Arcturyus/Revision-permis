# Permis B — 100 fiches (cartes mémoire + répétition espacée)

Web-app mobile-first pour réviser les **100 fiches d'interrogation orale** du permis B
(vérifications, sécurité routière, premiers secours), en **cartes mémoire à la Anki**
avec **répétition espacée** et sauvegarde locale.

## Utilisation
Ouvrir **`index.html`** dans un navigateur (PC ou téléphone). Aucune installation,
aucun serveur. Sur mobile : « Ajouter à l'écran d'accueil » pour un rendu plein écran.

- **Révision du jour** : les fiches dues selon la répétition espacée.
- **Toutes les fiches** : les 100 en ordre aléatoire.
- **Par thème** : vérifications / sécurité routière / premiers secours.
- Sur chaque carte : lire les questions → **Voir les réponses** → s'auto-noter
  (**À revoir** / **Difficile** / **Je savais**). La progression est mémorisée
  (localStorage, par appareil — pas de synchro PC ↔ téléphone).

## Structure
```
index.html              coquille de l'app
css/styles.css          design mobile-first
js/data.js              les 100 fiches (window.QUESTIONS) — ÉDITABLE À LA MAIN
js/srs.js               répétition espacée (Leitner) + localStorage
js/app.js               navigation, sessions, rendu des cartes
manifest.webmanifest    installable (PWA)
tools/parse_ecf.py      extraction du texte depuis questions-permis-ecf.pdf
tools/build_data.py     génération de js/data.js depuis l'extraction
permis_quizz.html       ANCIEN brouillon QCM — conservé tel quel, non utilisé
```

## À savoir
- **Texte** : extrait automatiquement de `questions-permis-ecf.pdf`. **À relire** :
  quelques coquilles du PDF source subsistent (ex. fiche 81 « endroitdangereux »,
  fiche 84 « de usure »). Corriger directement dans `js/data.js` (ne pas régénérer
  pour ne pas écraser les corrections).
- **Répétitions** : le deck ECF répète volontairement certaines fiches (65≈1, 67≈3…).
  C'est fidèle au support officiel, ce n'est pas un bug.
- **Photos** : pas encore intégrées. Le champ `image` de chaque fiche vaut `null` et
  peut recevoir un chemin (`assets/img/…`). Voir la note ci-dessous.

## Photos — statut
Les images de `questions-permis-ecf.pdf` ne sont que du **branding** (logo ECF, formes
décoratives), pas des photos de vérification. Les vraies photos (témoins de tableau de
bord, commodos, moteur…) sont dans **`questions permis.pdf`** (89 photos), mais leur
ordre ne correspond pas aux numéros de fiche → le rattachement fiche ↔ photo demande un
appariement manuel, à faire dans un second temps.
