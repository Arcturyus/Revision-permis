"""Redimensionne/compresse les images retenues et les copie dans assets/img.
Script de migration ponctuel (non versionne) - a lancer depuis _work/img_staging.
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.normpath(os.path.join(ROOT, "..", "..", "assets", "img"))
os.makedirs(DEST, exist_ok=True)

MAX_W_PHOTO = 900
MAX_W_ICON = 320

# slug -> liste de fichiers source (relatifs a ROOT), dans l'ordre d'affichage souhaite.
# Les icones ISO (Wikimedia, .png) sont volontairement placees en premier quand
# elles existent : symbole net d'abord, photo contextuelle ensuite.
CONCEPTS = {
    "reglage-hauteur-feux": ["reglage_hauteur_feux/1.jpg"],
    "remplissage-laveglace": ["remplissage_laveglace/1.jpg", "remplissage_laveglace/2.jpg"],
    "niveau-liquide-frein": ["niveau_liquide_frein/1.jpg", "niveau_liquide_frein/2.jpg"],
    "indicateur-niveau-carburant": [
        "indicateur_niveau_carburant/1.jpg",
        "indicateur_niveau_carburant/2.jpg",
    ],
    "remplissage-liquide-refroidissement": [
        "remplissage_liquide_refroidissement/1.jpg",
        "remplissage_liquide_refroidissement/2.jpg",
    ],
    "degivrage-lunette-arriere": [
        "degivrage_lunette_arriere/1.png",
        "degivrage_lunette_arriere/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "voyant-pression-huile": [
        "voyant_pression_huile/1.png",
        "voyant_pression_huile/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "reglage-volant-commande": ["reglage_volant_commande/1.jpg"],
    "niveau-huile-moteur": ["niveau_huile_moteur/1.jpg", "niveau_huile_moteur/2.jpg"],
    "voyant-defaut-batterie": [
        "voyant_defaut_batterie/1.png",
        "voyant_defaut_batterie/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "emplacement-batterie": ["emplacement_batterie/1.jpg", "emplacement_batterie/2.jpg"],
    "voyant-temperature-liquide-refroidissement": [
        "voyant_temperature_liquide_refroidissement/1.png",
        "voyant_temperature_liquide_refroidissement/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "voyant-porte-ouverte": [
        "voyant_porte_ouverte/1.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "temoin-usure-pneu": ["temoin_usure_pneu/1.jpg"],
    "commande-regulateur-vitesse": [
        "commande_regulateur_vitesse/1.jpg",
        "commande_regulateur_vitesse/2.jpg",
    ],
    "commande-avertisseur-sonore": ["commande_avertisseur_sonore/1_enhanced.jpg"],
    "remplissage-huile-moteur": [
        "remplissage_huile_moteur/1.jpg",
        "remplissage_huile_moteur/2.jpg",
    ],
    "commande-airbag-passager": ["commande_airbag_passager/1.jpg"],
    "voyant-ceinture-securite": [
        "voyant_ceinture_securite/1.png",
        "voyant_ceinture_securite/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "securite-enfant-portiere": ["securite_enfant_portiere/1.jpg"],
    "voyant-feu-brouillard-arriere": [
        "voyant_feu_brouillard_arriere/1.png",
        "voyant_feu_brouillard_arriere/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "reglage-appuietete": ["reglage_appuietete/1.jpg"],
    "commande-recyclage-air": ["commande_recyclage_air/recirc_final.png"],
    "changement-ampoule-avant": ["changement_ampoule_avant/1.jpg"],
    "voyant-feux-route": [
        "voyant_feux_route/1.png",
        "voyant_feux_route/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "changement-ampoule-arriere": ["changement_ampoule_arriere/1.jpg"],
    "commande-limiteur-vitesse": [
        "commande_limiteur_vitesse/1.jpg",
        "commande_limiteur_vitesse/2.jpg",
    ],
    "attaches-isofix": ["attaches_isofix/1.jpg"],
    "voyant-pression-pneus": [
        "voyant_pression_pneus/1.png",
        "voyant_pression_pneus/2.jpg",
        "tableau_de_bord_general/1.jpg",
    ],
    "gicleurs-laveglace-avant": ["gicleurs_laveglace_avant/1.jpg"],
}

ICON_SOURCES = {"1.png"}  # nom de fichier source => c'est un pictogramme ISO, pas une photo


def process(src_path, dst_path, is_icon):
    im = Image.open(src_path)
    if is_icon:
        im = im.convert("RGBA")
        max_w = MAX_W_ICON
    else:
        im = im.convert("RGB")
        max_w = MAX_W_PHOTO
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    if is_icon:
        im.save(dst_path, "PNG", optimize=True)
    else:
        im.save(dst_path, "JPEG", quality=82, optimize=True)


mapping = {}  # slug -> [ "assets/img/xxx.ext", ... ]
for slug, files in CONCEPTS.items():
    out_files = []
    for i, rel in enumerate(files, start=1):
        src = os.path.join(ROOT, rel.replace("/", os.sep))
        base = os.path.basename(rel)
        is_icon = base.endswith(".png")
        ext = "png" if is_icon else "jpg"
        out_name = f"{slug}-{i}.{ext}"
        dst = os.path.join(DEST, out_name)
        process(src, dst, is_icon)
        out_files.append(f"assets/img/{out_name}")
    mapping[slug] = out_files
    print(slug, "->", out_files)

with open(os.path.join(ROOT, "final_mapping.json"), "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print("\nTermine. Mapping ecrit dans final_mapping.json")
