// Passe 2 : ajoute les nouveaux concepts + reutilise les images existantes
// pour des questions liees (memes objets/elements), dans js/data.js.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(ROOT, 'js', 'data.js');

const mapping1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'img_staging', 'final_mapping.json'), 'utf8'));
const mapping2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'final_mapping2.json'), 'utf8'));
const mapping = Object.assign({}, mapping1, mapping2);

// [regex, slug] - premiere regle qui matche gagne. Plus specifique en premier.
const RULES = [
  // --- nouveaux concepts (passe 2) ---
  [/presence de l'ethylotest/i, 'ethylotest'],
  [/presence du triangle de presignalisation/i, 'triangle-presignalisation'],
  [/utilise-t-on le triangle de presignalisation/i, 'triangle-presignalisation'],
  [/ou doit etre place le triangle de presignalisation/i, 'triangle-presignalisation'],
  [/presence du gilet haute visibilite/i, 'gilet-haute-visibilite'],
  [/equipement de securite doit etre porte avant de quitter le vehicule/i, 'gilet-haute-visibilite'],
  [/feux de detresse/i, 'feux-detresse'],
  [/certificat d'immatriculation du vehicule/i, 'carte-grise'],
  [/attestation d'assurance du vehicule/i, 'vignette-assurance'],
  [/presence du constat amiable/i, 'constat-amiable'],
  [/delai doit-il etre transmis a l'assureur/i, 'constat-amiable'],
  [/etat et la proprete des plaques d'immatriculation/i, 'plaque-immatriculation'],
  [/etat et la proprete des dispositifs reflechissants/i, 'dispositifs-reflechissants'],
  [/etat de tous les balais d'essuie-glaces/i, 'balais-essuie-glace'],
  [/circuler avec des balais d'essuie-glaces defectueux/i, 'balais-essuie-glace'],
  [/eclairage de la plaque d'immatriculation a l'arriere/i, 'eclairage-plaque'],
  [/defaut d'eclairage de la plaque/i, 'eclairage-plaque'],
  [/proprete et le fonctionnement des feux de route\./i, 'feux-route-exterieur'],
  [/maintenir les feux de route lors d'un croisement/i, 'voyant-feux-route'],
  [/proprete et le fonctionnement du ou des feux de brouillard arriere/i, 'feux-brouillard-arriere-exterieur'],
  [/fonctionnement des feux stop\./i, 'feux-stop'],
  [/consequence en cas de panne des feux stop/i, 'feux-stop'],
  [/clignotants cote trottoir/i, 'clignotants'],
  [/mettez le retroviseur interieur en position/i, 'retroviseur-nuit'],
  [/essuie-glaces avant du vehicule sur la position la plus rapide/i, 'essuie-glace-avant'],
  [/essuie-glace arriere du vehicule/i, 'essuie-glace-arriere'],
  [/trappe a carburant et verifier la bonne fermeture/i, 'trappe-carburant'],
  [/commande pour diriger l'air vers le pare-brise/i, 'commande-air-parebrise'],
  [/defibrillateur automatise externe/i, 'defibrillateur'],
  [/presence d'une victime en arret cardiaque/i, 'defibrillateur'],
  [/utilisation d'un defibrillateur automatise sur une victime/i, 'defibrillateur'],
  [/positionner une victime en position laterale de securite/i, 'position-laterale-securite'],
  [/pressions preconisees pour les pneumatiques/i, 'plaque-pression-pneus'],
  [/plaque indicative, donnez la pression preconisee/i, 'plaque-pression-pneus'],
  [/frequence est-il preconise de verifier la pression des pne/i, 'plaque-pression-pneus'],

  // --- reutilisation d'images deja telechargees (passe 1) pour des questions liees ---
  [/consequences d'un mauvais reglage de ses feux/i, 'reglage-hauteur-feux'],
  [/risque de manque d'huile moteur/i, 'voyant-pression-huile'],
  [/consequence d'une temperature trop elevee de ce liquide/i, 'voyant-temperature-liquide-refroidissement'],
  [/provoquer la decharge de la batterie/i, 'voyant-defaut-batterie'],
  [/principal risque d'une absence de liquide lave-glace/i, 'remplissage-laveglace'],
  [/maintenir le recyclage de l'air de maniere prolongee/i, 'commande-recyclage-air'],
  [/sans actionner la commande du regulateur/i, 'commande-regulateur-vitesse'],
  [/utilite d'un limiteur de vitesse/i, 'commande-limiteur-vitesse'],
  [/niveau insuffisant du liquide de frein/i, 'niveau-liquide-frein'],
  [/complete le niveau du liquide lorsque le moteur est chaud/i, 'remplissage-liquide-refroidissement'],
  [/conditions a respecter pour controler le niveau d'huile/i, 'niveau-huile-moteur'],
  [/utiliser l'avertisseur sonore en agglomeration/i, 'commande-avertisseur-sonore'],
  [/flanc sur l'un des pneumatiques/i, 'temoin-usure-pneu'],
  [/detecter leur usure en circulation/i, 'temoin-usure-pneu'],
  [/fixer tous types de siege enfant sur des attaches de type isofix/i, 'attaches-isofix'],
  [/securite enfant est enclenchee, est-il possible d'ouvrir la portiere/i, 'securite-enfant-portiere'],
  [/enfants installes a l'arriere ne puissent pas ouvrir la portiere/i, 'securite-enfant-portiere'],
  [/utilite des dispositifs reflechissants/i, 'dispositifs-reflechissants'],
  [/solution en cas de panne de batterie pour demarrer/i, 'emplacement-batterie'],
  [/consequence d'une panne de degivrage de la lunette arriere/i, 'degivrage-lunette-arriere'],
  [/principale consequence d'un dispositif de lave-glace defaillant/i, 'remplissage-laveglace'],
  [/signification d'un clignotement plus rapide/i, 'clignotants'],
  [/deux autres documents obligatoires a presenter/i, 'vignette-assurance'],
  [/pourquoi doit-on regler la hauteur des feux/i, 'reglage-hauteur-feux'],
  [/couleur est le voyant qui indique aux conducteurs que le feu de brouillard arriere est allume/i, 'voyant-feu-brouillard-arriere'],
  [/important de bien regler son volant/i, 'reglage-volant-commande'],
  [/precautions a prendre lors du remplissage du reservoir/i, 'trappe-carburant'],
];

function normalize(s) {
  const MAP = {
    é: 'e', è: 'e', ê: 'e', ë: 'e',
    à: 'a', â: 'a',
    î: 'i', ï: 'i',
    ô: 'o', ö: 'o',
    û: 'u', ü: 'u', ù: 'u',
    ç: 'c',
    '‘': "'", '’': "'", '«': '"', '»': '"',
  };
  return s.replace(/[éèêëàâîïôöûüùç‘’«»]/g, (c) => MAP[c]);
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

let added = 0, alreadyHad = 0;
const perSlugCount = {};
data.forEach((fiche) => {
  fiche.items.forEach((it) => {
    const slug = slugFor(it.q);
    if (!slug || !mapping[slug]) return;
    perSlugCount[slug] = (perSlugCount[slug] || 0) + 1;
    if (it.img) { alreadyHad++; return; } // ne pas ecraser une image deja assignee (ex. passe 1)
    it.img = mapping[slug];
    added++;
  });
});

console.log('nouvelles images assignees:', added);
console.log('items deja pourvus (regle passe2 ignoree pour ne pas ecraser):', alreadyHad);
console.log('repartition par slug:', JSON.stringify(perSlugCount, null, 2));

const out = header + prefix + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(DATA_PATH, out, 'utf8');
console.log('data.js mis a jour.');
