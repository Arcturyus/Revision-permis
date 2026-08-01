import json

with open('manifest.json', encoding='utf-8') as f:
    manifest = json.load(f)
with open('final_mapping2.json', encoding='utf-8') as f:
    final = json.load(f)

# concepts abandonnes apres verification visuelle (image trompeuse/ambigue)
DROPPED = {'feux-croisement', 'feux-diurnes', 'feux-position', 'feux-recul'}

# concept manifest -> slug final (les deux feux-detresse-* fusionnent vers "feux-detresse")
CONCEPT_TO_FINAL = {
    'feux-detresse-commande': ('feux-detresse', 0),
    'feux-detresse-exterieur': ('feux-detresse', 1),
}

lines = []
lines.append('')
lines.append('## Passe 2 (ethylotest, feux de detresse, documents, feux exterieurs, secours...)')
lines.append('')
lines.append('| Fichier final | Source | Licence | Credit |')
lines.append('|---|---|---|---|')

for concept, entries in manifest.items():
    if concept in DROPPED:
        continue
    if concept in CONCEPT_TO_FINAL:
        slug, idx = CONCEPT_TO_FINAL[concept]
    else:
        slug, idx = concept, 0
    if slug not in final or idx >= len(final[slug]):
        continue
    fname = final[slug][idx].split('/')[-1]
    entry = entries[0]
    lines.append(f"| `{fname}` | {entry['source_url']} | {entry['license']} | {entry['credit']} |")

lines.append('| `balais-essuie-glace-1.jpg` (remplace la photo Ornikar initiale, hors-sujet) | '
              'https://upload.wikimedia.org/wikipedia/commons/f/f0/Used_Michelin_8019_windshield_wiper_blade_tip.jpg | '
              'CC BY-SA 4.0 | Jacek Rużyczka (Jacek79, Wikimedia Commons) |')

lines.append('')
lines.append(
    "**Concepts recherches puis ecartes** (image trouvee mais trop ambigue/trompeuse pour "
    "etre utile a l'apprentissage - a defaut de mieux, non integres) : feux de croisement, "
    "feux diurnes, feux de position, feux de recul. Les photos disponibles (Ornikar) etaient "
    "soit quasi identiques entre elles (meme vehicule, impossible de distinguer croisement / "
    "route / diurnes sur une photo statique), soit ne montraient pas le feu reellement allume."
)
lines.append('')

with open('../../assets/img/CREDITS.md', 'a', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print('CREDITS.md complete avec la passe 2')
