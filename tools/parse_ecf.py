# -*- coding: utf-8 -*-
"""Parse questions-permis-ecf.pdf into 100 fiches x 3 (question, answer) pairs.

Robust split: in this PDF, QUESTIONS are typeset in the 'FrontageCondensed' font
and ANSWERS in the 'Affogato' font. We group consecutive text chunks by font.
"""
import io, json, re
import pypdf

SRC = 'questions-permis-ecf.pdf'
Q_FONT = 'Frontage'   # FrontageCondensed -> question
A_FONT = 'Affogato'   # Affogato-Regular  -> answer

ACRONYMS = {"SAIP", "SNA", "SAMU", "PLS", "ABS", "ESP", "DAE", "SNA", "GPS", "PLS",
            "SAIP", "SMS", "OK", "TIR"}


def fix_caps(word):
    core = word.strip('.,;:!?()«»“”\'’"-•')
    if not core or core in ACRONYMS or core.isdigit():
        return word
    # camelCase stray caps: a lowercase letter then an uppercase run -> lowercase run
    w = re.sub(r'([a-zà-ÿ])([A-ZÀ-ß]+)', lambda m: m.group(1) + m.group(2).lower(), word)
    stripped = w.strip('.,;:!?()«»“”\'’"-•')
    if len(stripped) > 1 and stripped.isupper() and any(c.isalpha() for c in stripped):
        if stripped not in ACRONYMS:
            w = w[:1] + w[1:].lower()
    return w


def normalize(text):
    text = (text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff')
                .replace('ﬃ', 'ffi').replace('ﬄ', 'ffl').replace('ﬅ', 'ft'))
    text = text.replace('๏', '•')
    return text


def cleanup(text):
    """Reflow wrapped lines, keep bullet items, normalize casing/whitespace."""
    text = normalize(text)
    lines = [re.sub(r'[ \t]+', ' ', ln).strip() for ln in text.split('\n')]
    lines = [ln for ln in lines if ln]
    out = []
    for ln in lines:
        # a line that doesn't start a new bullet item is a wrapped continuation
        if out and not ln.startswith('•'):
            sep = '' if out[-1].endswith('-') else ' '  # close hyphenated words
            out[-1] = (out[-1] + sep + ln).strip()
        else:
            out.append(ln)
    out = [' '.join(fix_caps(w) for w in ln.split(' ')) for ln in out]
    s = '\n'.join(out).strip()
    # tidy guillemet spacing
    s = re.sub(r'«\s+', '« ', s)
    s = re.sub(r'\s+»', ' »', s)
    return s.strip()


def page_chunks(page):
    """Return list of (font_class, text) chunks in reading order."""
    chunks = []

    def visit(text, cm, tm, font_dict, font_size):
        if not text:
            return
        text = normalize(text)  # fix ligatures (ﬁ->fi) and bullets (๏->•) at source
        base = (font_dict or {}).get('/BaseFont', '') or ''
        if Q_FONT in base:
            cls = 'Q'
        elif A_FONT in base:
            cls = 'A'
        else:
            cls = '?'
        chunks.append((cls, text))

    page.extract_text(visitor_text=visit)
    return chunks


def parse_page(page):
    chunks = page_chunks(page)
    # group consecutive chunks by class into blocks
    blocks = []  # (cls, text)
    pending = ''  # bullet prefix to attach to the NEXT real text chunk (its item)
    for cls, text in chunks:
        st = text.strip()
        # bullet glyph (Thonburi ๏ -> •): belongs to the following list item
        if st and all(ch in '•●◦‣▪·∙*✓✦' for ch in st):
            pending = '\n• '
            continue
        # punctuation-only chunks (guillemets «», '?') must never start/switch a
        # block — attach them to the current block.
        if cls == '?' or not re.search(r'[0-9A-Za-zÀ-ÿ]', text):
            if blocks:
                blocks[-1] = (blocks[-1][0], blocks[-1][1] + text)
            continue
        text = pending + text
        pending = ''
        if blocks and blocks[-1][0] == cls:
            blocks[-1] = (cls, blocks[-1][1] + text)
        else:
            blocks.append((cls, text))

    # first Q block usually starts with the page number -> strip it
    num = None
    if blocks and blocks[0][0] == 'Q':
        m = re.match(r'\s*(\d{1,3})\s+', blocks[0][1])
        if m:
            num = int(m.group(1))
            blocks[0] = ('Q', blocks[0][1][m.end():])

    # A question-without-written-answer merges with the next question into one
    # Frontage run. Split each Q block into individual question sentences.
    expanded = []
    for cls, text in blocks:
        if cls == 'A':
            expanded.append(('A', text))
            continue
        flat = normalize(text).replace('\n', ' ')
        # A question-without-answer (always an imperative manipulation ending in '.')
        # merges with the next question. Split only after a period (NOT after '?'),
        # so genuine two-sentence questions ("Pourquoi ... ? Citez ...") stay whole.
        parts = re.split(r'(?<=\.)\s+(?=[A-ZÀ-Ÿ])', flat)
        for part in parts:
            if part.strip():
                expanded.append(('Q', part))

    # pair up Q followed by A
    pairs = []
    i = 0
    while i < len(expanded):
        cls, text = expanded[i]
        if cls == 'Q':
            q = cleanup(text)
            a = ''
            if i + 1 < len(expanded) and expanded[i + 1][0] == 'A':
                a = cleanup(expanded[i + 1][1])
                i += 2
            else:
                i += 1
            # a quote opener stranded at the end of a question belongs to its answer
            if q.endswith('«'):
                q = q[:-1].strip()
                a = ('« ' + a).strip()
            pairs.append({'q': q, 'a': a})
        else:
            if pairs:
                pairs[-1]['a'] = (pairs[-1]['a'] + '\n' + cleanup(text)).strip()
            i += 1
    return num, pairs


def classify(pair_index, q):
    if pair_index == 0:
        return 'verification'
    if pair_index == 1:
        return 'manipulation'
    return 'securite_secours'


def main():
    r = pypdf.PdfReader(SRC)
    fiches = []
    problems = []
    for pi in range(1, len(r.pages)):
        num, pairs = parse_page(r.pages[pi])
        for k, p in enumerate(pairs):
            p['type'] = classify(k, p['q'])
        fiches.append({'page': pi, 'num': num, 'pairs': pairs})
        if len(pairs) != 3:
            problems.append((pi, num, len(pairs)))
    with io.open('_work/ecf_parsed.json', 'w', encoding='utf-8') as f:
        json.dump(fiches, f, ensure_ascii=False, indent=2)
    with io.open('_work/ecf_review.txt', 'w', encoding='utf-8') as f:
        for fi in fiches:
            f.write(f"\n##### FICHE {fi['num']} (page {fi['page']}) — {len(fi['pairs'])} paires\n")
            for k, p in enumerate(fi['pairs'], 1):
                f.write(f"  Q{k} [{p['type']}]: {p['q']}\n")
                f.write(f"  A{k}: {p['a']}\n")
    print('fiches:', len(fiches))
    print('problem pages (pairs != 3):', len(problems))
    for p in problems:
        print('  page', p[0], 'num', p[1], 'pairs', p[2])


if __name__ == '__main__':
    main()
