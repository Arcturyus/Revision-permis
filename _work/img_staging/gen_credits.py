import json

with open('manifest.json', encoding='utf-8') as f:
    manifest = json.load(f)
with open('final_mapping.json', encoding='utf-8') as f:
    final = json.load(f)

# concept slug (avec underscores, dossier staging) -> slug final (avec tirets)
CONCEPT_TO_FINAL = {
    "reglage_hauteur_feux": "reglage-hauteur-feux",
    "remplissage_laveglace": "remplissage-laveglace",
    "orifice_laveglace": "remplissage-laveglace",
    "niveau_liquide_frein": "niveau-liquide-frein",
    "indicateur_niveau_carburant": "indicateur-niveau-carburant",
    "remplissage_liquide_refroidissement": "remplissage-liquide-refroidissement",
    "degivrage_lunette_arriere": "degivrage-lunette-arriere",
    "voyant_pression_huile": "voyant-pression-huile",
    "reglage_volant_commande": "reglage-volant-commande",
    "niveau_huile_moteur": "niveau-huile-moteur",
    "voyant_defaut_batterie": "voyant-defaut-batterie",
    "emplacement_batterie": "emplacement-batterie",
    "voyant_temperature_liquide_refroidissement": "voyant-temperature-liquide-refroidissement",
    "voyant_porte_ouverte": "voyant-porte-ouverte",
    "temoin_usure_pneu": "temoin-usure-pneu",
    "commande_regulateur_vitesse": "commande-regulateur-vitesse",
    "remplissage_huile_moteur": "remplissage-huile-moteur",
    "commande_airbag_passager": "commande-airbag-passager",
    "voyant_ceinture_securite": "voyant-ceinture-securite",
    "securite_enfant_portiere": "securite-enfant-portiere",
    "voyant_feu_brouillard_arriere": "voyant-feu-brouillard-arriere",
    "reglage_appuietete": "reglage-appuietete",
    "changement_ampoule_avant": "changement-ampoule-avant",
    "voyant_feux_route": "voyant-feux-route",
    "changement_ampoule_arriere": "changement-ampoule-arriere",
    "commande_limiteur_vitesse": "commande-limiteur-vitesse",
    "attaches_isofix": "attaches-isofix",
    "voyant_pression_pneus": "voyant-pression-pneus",
    "gicleurs_laveglace_avant": "gicleurs-laveglace-avant",
}

lines = []
lines.append("# Credits des images (assets/img)")
lines.append("")
lines.append("Genere lors de l'ajout des illustrations pour les questions de type")
lines.append("« montrez / localisez » (voyants, commandes, emplacements sous le capot).")
lines.append("")
lines.append("| Fichier final | Source | Licence | Credit |")
lines.append("|---|---|---|---|")

seen_final = set()
for concept, entries in manifest.items():
    final_slug = CONCEPT_TO_FINAL.get(concept)
    if not final_slug or final_slug not in final:
        continue
    final_files = final[final_slug]
    for i, entry in enumerate(entries):
        if i >= len(final_files):
            break
        fname = final_files[i].split('/')[-1]
        if fname in seen_final:
            continue
        seen_final.add(fname)
        lines.append(f"| `{fname}` | {entry['source_url']} | {entry['license']} | {entry['credit']} |")

# ajouts manuels (pas issus du manifest agent)
lines.append("| `tableau-de-bord-general` (utilisee comme derniere image des voyants) | "
              "https://www.pexels.com/photo/black-car-instrument-cluster-panel-945443/ | "
              "Pexels License (gratuite, usage commercial autorise) | Mike Bird (Pexels) |")
lines.append("| `commande-avertisseur-sonore-1.jpg` | "
              "https://cdn.prod.website-files.com/6864d666097819db1fc2600f/68d0f67926394e0813b2795a_642ec5b6609b194736c5aaed_a020cad4543fb4f5ec83898719dfb59b5b4aca63_commande-klaxon-petit.jpeg | "
              "incertain (Ornikar) | Ornikar - photo eclaircie/recadree localement (contraste + luminosite) pour rendre le symbole lisible |")
lines.append("| `commande-recyclage-air-1.png` | "
              "aucune (illustration originale) | Original / CC0 | "
              "Pictogramme redessine a la main par l'assistant (voiture + fleche de recyclage), "
              "car la photo Ornikar correspondante montrait en realite un autre bouton (ouverture du coffre) |")

lines.append("")
lines.append("## Note sur la licence")
lines.append("")
lines.append(
    "Les fichiers marques « CC BY-SA 3.0 » / « CC BY 3.0 » proviennent de Wikimedia Commons "
    "(pictogrammes ISO de tableau de bord, categorie *Dashboard icons*) et sont utilisables "
    "librement avec attribution. Les fichiers marques « incertain (Ornikar) » proviennent du "
    "site commercial ornikar.com (fiches illustrees des verifications ECF) sans autorisation "
    "de reproduction explicite : ils sont utilises ici a des fins pedagogiques (reviser les "
    "questions officielles du permis B), decision prise en connaissance de cause malgre le "
    "depot GitHub public du projet."
)
lines.append("")

with open('../../assets/img/CREDITS.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print('CREDITS.md ecrit, ', len(seen_final), 'entrees issues du manifest + 3 manuelles')
