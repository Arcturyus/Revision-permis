# -*- coding: utf-8 -*-
"""Build js/data.js (window.QUESTIONS) from _work/ecf_parsed.json.

Classifies each sub-question by CONTENT (not position):
  - verification        : knowledge question about a check
  - manipulation        : examiner instruction ("Montrez…", "Contrôlez…")
  - securite_routiere   : road-safety question (SAIP, n° urgence, triangle…)
  - premiers_secours    : first-aid question (victime, hémorragie, PLS…)
"""
import io, json, re

IMPER = {
    "Montrez", "Montrer", "Faites", "Contrôlez", "Vérifiez", "Citez", "Citer",
    "Mettez", "Actionnez", "Présentez", "Allumez", "Indiquez", "Effectuez",
    "Réglez", "Ouvrez", "Positionnez", "Donnez", "Désignez", "Procédez",
}
SECOURS = ["victime", "hémorragie", "cardiaque", "réanimation", "pls",
           "position latérale", "défibrillateur", "dae", "respiration",
           "perte de connaissance", "connaissance", "étouffement", "conscience",
           "saigne", "masser", "déplacer", "dégagement d'urgence", "brûlure",
           "blessure", "premiers secours", "respire", "secourisme", "anormale"]
SECURITE = ["saip", "sirène", "signal d'alerte", "signal national", "numéro",
            "112", " 18", " 15", "triangle", "gilet", "autoroute",
            "kilométrique", "raccrocher", "alerte", "correspondant",
            "services de secours", "borne d'appel"]


def is_imper(q):
    first = re.sub(r'[^\wÀ-ÿ]', '', q.split(' ', 1)[0])
    if first in IMPER:
        return True
    return any(v in q for v in IMPER)


def role(idx, q, a):
    text = (q + ' ' + a).lower()
    if idx <= 1:
        return 'manipulation' if is_imper(q) else 'verification'
    if any(k in text for k in SECOURS):
        return 'premiers_secours'
    if any(k in text for k in SECURITE):
        return 'securite_routiere'
    return 'premiers_secours'


def main():
    fiches = json.load(io.open('_work/ecf_parsed.json', encoding='utf-8'))
    out = []
    for fi in fiches:
        items = []
        for idx, p in enumerate(fi['pairs']):
            items.append({'role': role(idx, p['q'], p['a']),
                          'q': p['q'], 'a': p['a']})
        out.append({'id': fi['num'], 'items': items, 'image': None})

    header = (
        "/* ====================================================================\n"
        "   DONNÉES DES 100 FICHES — Examen pratique du permis B (deck ECF)\n"
        "   Généré automatiquement depuis « questions-permis-ecf.pdf ».\n"
        "   ⚠️  À RELIRE : extraction automatique d'un PDF. Quelques coquilles du\n"
        "       PDF source subsistent (ex. fiche 81 « endroitdangereux »,\n"
        "       fiche 84 « de usure »). Ce fichier est désormais ÉDITABLE À LA MAIN :\n"
        "       ne pas le régénérer sous peine d'écraser les corrections.\n"
        "   NB : le deck ECF répète volontairement certaines fiches (65≈1, 67≈3…).\n"
        "   image: chemin d'une photo (assets/img/…) ou null si aucune.\n"
        "   ==================================================================== */\n"
        "window.QUESTIONS = "
    )
    body = json.dumps(out, ensure_ascii=False, indent=2)
    with io.open('js/data.js', 'w', encoding='utf-8') as f:
        f.write(header + body + ";\n")
    # quick stats
    from collections import Counter
    c = Counter(it['role'] for fi in out for it in fi['items'])
    print('fiches:', len(out), '| total items:', sum(len(f['items']) for f in out))
    print('roles:', dict(c))


if __name__ == '__main__':
    main()
