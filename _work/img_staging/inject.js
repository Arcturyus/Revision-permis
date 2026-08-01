// Injecte le champ "img" dans js/data.js a partir de final_mapping.json.
// Script de migration ponctuel (non destine a rester dans tools/).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(ROOT, 'js', 'data.js');
const MAPPING_PATH = path.join(__dirname, 'final_mapping.json');

const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));

const RULES = [
  [/commande de r[ée]glage de hauteur des feux/i, 'reglage-hauteur-feux'],
  [/remplissage du produit lave-glace/i, 'remplissage-laveglace'],
  [/niveau du liquide de frein/i, 'niveau-liquide-frein'],
  [/indicateur de niveau de carburant/i, 'indicateur-niveau-carburant'],
  [/remplissage du liquide de refroidissement/i, 'remplissage-liquide-refroidissement'],
  [/actionnez le degivrage de la lunette arriere/i, 'degivrage-lunette-arriere'],
  [/pression insuffisante d'huile/i, 'voyant-pression-huile'],
  [/commande de reglage du volant/i, 'reglage-volant-commande'],
  [/controle du niveau d'huile moteur/i, 'niveau-huile-moteur'],
  [/defaut de batterie/i, 'voyant-defaut-batterie'],
  [/emplacement de la batterie/i, 'emplacement-batterie'],
  [/temperature trop elevee du liquide de refroidissement/i, 'voyant-temperature-liquide-refroidissement'],
  [/mauvaise fermeture d'une portiere/i, 'voyant-porte-ouverte'],
  [/temoin d'usure de la bande de roulement/i, 'temoin-usure-pneu'],
  [/actionner le regulateur de vitesse/i, 'commande-regulateur-vitesse'],
  [/commande de l'avertisseur sonore/i, 'commande-avertisseur-sonore'],
  [/remplissage de l'huile moteur/i, 'remplissage-huile-moteur'],
  [/desactiver l'airbag du passager/i, 'commande-airbag-passager'],
  [/bouclage de la ceinture de securite/i, 'voyant-ceinture-securite'],
  [/ou se situe la securite enfant/i, 'securite-enfant-portiere'],
  [/brouillard arriere et montrez/i, 'voyant-feu-brouillard-arriere'],
  [/hauteur de l.appui-tete/i, 'reglage-appuietete'],
  [/commande de recyclage de l'air/i, 'commande-recyclage-air'],
  [/changement d'une ampoule a l'avant/i, 'changement-ampoule-avant'],
  [/feux de route et montrez le voyant/i, 'voyant-feux-route'],
  [/changement d'une ampoule a l'arriere/i, 'changement-ampoule-arriere'],
  [/commande du limiteur de vitesse/i, 'commande-limiteur-vitesse'],
  [/ou se situent les attaches de type isofix/i, 'attaches-isofix'],
  [/baisse de pression d'air de pneumatiques/i, 'voyant-pression-pneus'],
  [/gicleurs de lave-glace avant/i, 'gicleurs-laveglace-avant'],
];

function normalize(s) {
  const MAP = {
    é: 'e', è: 'e', ê: 'e', ë: 'e',
    à: 'a', â: 'a',
    î: 'i', ï: 'i',
    ô: 'o', ö: 'o',
    û: 'u', ü: 'u', ù: 'u',
    ç: 'c',
    '‘': "'", '’': "'",
  };
  return s.replace(/[éèêëàâîïôöûüùç‘’]/g, (c) => MAP[c]);
}

function slugFor(q) {
  const n = normalize(q);
  for (const [re, slug] of RULES) {
    if (re.test(n)) return slug;
  }
  return null;
}

const raw = fs.readFileSync(DATA_PATH, 'utf8');
const prefix = 'window.QUESTIONS = ';
const prefixIdx = raw.indexOf(prefix);
if (prefixIdx === -1 || !raw.trim().endsWith(';')) {
  throw new Error('Format de data.js inattendu, abandon.');
}
const header = raw.slice(0, prefixIdx);
const jsonPart = raw.slice(prefixIdx + prefix.length, raw.lastIndexOf(';'));
const data = JSON.parse(jsonPart);

let matched = 0, unmatched = new Set();
data.forEach((fiche) => {
  fiche.items.forEach((it) => {
    const slug = slugFor(it.q);
    if (slug && mapping[slug]) {
      it.img = mapping[slug];
      matched++;
    } else if (/montrez|d[ée]signez|indiquez|montrer|rep[èe]re|emplacement/i.test(it.q)) {
      unmatched.add(it.q);
    }
  });
});

console.log('items avec image assignee:', matched);
if (unmatched.size) {
  console.log('questions de type localisation SANS image assignee:');
  unmatched.forEach((q) => console.log(' -', q));
}

const out = header + prefix + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(DATA_PATH, out, 'utf8');
console.log('data.js mis a jour.');
