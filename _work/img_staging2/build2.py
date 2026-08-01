"""Redimensionne/compresse les images retenues (passe 2) et les copie dans assets/img.
Script de migration ponctuel (non versionne).
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.normpath(os.path.join(ROOT, "..", "..", "assets", "img"))
os.makedirs(DEST, exist_ok=True)

MAX_W_PHOTO = 900

# Concepts retenus apres verification visuelle. Ecartes (image trompeuse/ambigue) :
# feux-croisement, feux-diurnes, feux-position, feux-recul (visuellement quasi
# identiques entre elles ou lumiere non visible - risque d'enseigner une
# mauvaise association visuelle).
CONCEPTS = {
    "ethylotest": ["ethylotest/1.jpg"],
    "triangle-presignalisation": ["triangle-presignalisation/1.jpg"],
    "gilet-haute-visibilite": ["gilet-haute-visibilite/1.jpg"],
    "feux-detresse": ["feux-detresse-commande/1.jpg", "feux-detresse-exterieur/1.jpg"],
    "carte-grise": ["carte-grise/1.jpg"],
    "vignette-assurance": ["vignette-assurance/1.jpg"],
    "constat-amiable": ["constat-amiable/1.jpg"],
    "plaque-immatriculation": ["plaque-immatriculation/1.jpg"],
    "dispositifs-reflechissants": ["dispositifs-reflechissants/1.jpg"],
    "balais-essuie-glace": ["balais-essuie-glace/1.jpg"],
    "eclairage-plaque": ["eclairage-plaque/1.jpg"],
    "feux-route-exterieur": ["feux-route-exterieur/1.jpg"],
    "feux-brouillard-arriere-exterieur": ["feux-brouillard-arriere-exterieur/1.jpg"],
    "feux-stop": ["feux-stop/1.jpg"],
    "clignotants": ["clignotants/1.jpg"],
    "retroviseur-nuit": ["retroviseur-nuit/1.jpg"],
    "essuie-glace-avant": ["essuie-glace-avant/1.jpg"],
    "essuie-glace-arriere": ["essuie-glace-arriere/1.jpg"],
    "trappe-carburant": ["trappe-carburant/1.jpg"],
    "commande-air-parebrise": ["commande-air-parebrise/1.jpg"],
    "defibrillateur": ["defibrillateur/1.jpg"],
    "position-laterale-securite": ["position-laterale-securite/1.jpg"],
    "plaque-pression-pneus": ["plaque-pression-pneus/1.jpg"],
}


def process(src_path, dst_path):
    im = Image.open(src_path).convert("RGB")
    if im.width > MAX_W_PHOTO:
        h = round(im.height * MAX_W_PHOTO / im.width)
        im = im.resize((MAX_W_PHOTO, h), Image.LANCZOS)
    im.save(dst_path, "JPEG", quality=82, optimize=True)


mapping = {}
for slug, files in CONCEPTS.items():
    out_files = []
    for i, rel in enumerate(files, start=1):
        src = os.path.join(ROOT, rel.replace("/", os.sep))
        out_name = f"{slug}-{i}.jpg"
        dst = os.path.join(DEST, out_name)
        process(src, dst)
        out_files.append(f"assets/img/{out_name}")
    mapping[slug] = out_files
    print(slug, "->", out_files)

with open(os.path.join(ROOT, "final_mapping2.json"), "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print("\nTermine. Mapping ecrit dans final_mapping2.json")
