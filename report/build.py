import os, re, json, sys
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import content as C

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(ROOT, 'figures')
OUT = sys.argv[1]
FONT = 'Calibri'
NAVY = RGBColor(0x1F, 0x38, 0x64)

# ---------------- similarity self-check (8-word shingles vs cited abstracts) ----------------
def words(t):
    t = re.sub(r'\*\*|\[[0-9, ]+\]', '', t)
    return re.findall(r"[a-z0-9]+", t.lower())
def shingles(w, n=8):
    return {' '.join(w[i:i + n]) for i in range(len(w) - n + 1)}
def longest_run(a, b):
    best = 0; bset = {}
    for n in range(3, 30):
        sb = shingles(b, n)
        if any(x in sb for x in shingles(a, n)): best = n
        else: break
    return best
prose = [x for blk in C.ABSTRACT for x in [blk[1]]]
for blk in C.BODY:
    if blk[0] == 'P': prose.append(blk[1])
    elif blk[0] in ('B', 'N'): prose.extend(blk[1])
rw = words(' '.join(prose)); rs = shingles(rw)
abstracts = json.load(open(os.path.join(ROOT, 'data', 'raw', 'literature-abstracts.json'), encoding='utf8'))
sim_rows = []; union = set()
for name, txt in abstracts.items():
    m = rs & shingles(words(txt)); union |= m
    sim_rows.append([name, f'{len(m)}', f'{100 * len(m) / len(rs):.2f}%', str(longest_run(rw, words(txt)))])
overall = 100 * len(union) / len(rs)
SIM = dict(n_words=len(rw), n_sh=len(rs), overall=overall, rows=sim_rows)
print('similarity', SIM['overall'], SIM['n_words'])

# ---------------- document setup ----------------
doc = Document()
st = doc.styles
def set_font(style, size=None, bold=None, color=None, italic=None):
    style.font.name = FONT
    rpr = style.element.get_or_add_rPr(); rf = rpr.find(qn('w:rFonts'))
    if rf is None: rf = OxmlElement('w:rFonts'); rpr.append(rf)
    for a in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'): rf.set(qn(a), FONT)
    for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
        if rf.get(qn(a)) is not None: del rf.attrib[qn(a)]
    if size: style.font.size = Pt(size)
    if bold is not None: style.font.bold = bold
    if italic is not None: style.font.italic = italic
    if color is not None: style.font.color.rgb = color
set_font(st['Normal'], 11)
for rf in doc.styles.element.iter(qn('w:rFonts')):
    for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
        if rf.get(qn(a)) is not None: del rf.attrib[qn(a)]
    for a in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'): rf.set(qn(a), FONT)
pf = st['Normal'].paragraph_format; pf.space_after = Pt(6); pf.line_spacing = 1.15
for name, size in [('Heading 1', 18), ('Heading 2', 14), ('Heading 3', 12), ('Title', 30)]:
    set_font(st[name], size, True, NAVY)
st['Heading 1'].paragraph_format.space_before = Pt(0); st['Heading 1'].paragraph_format.space_after = Pt(14)
st['Heading 2'].paragraph_format.space_before = Pt(14); st['Heading 2'].paragraph_format.space_after = Pt(6)
set_font(st['Caption'], 10, False, RGBColor(0x40, 0x40, 0x40), italic=True)
for n in ('List Bullet', 'List Number', 'TOC Heading'):
    set_font(st[n], 11)
for i in (1, 2, 3):
    try: set_font(st[f'TOC {i}'], 11)
    except KeyError: pass
try: set_font(st['Table of Figures'], 11)
except KeyError: pass

sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
for side in ('left_margin', 'right_margin'): setattr(sec, side, Cm(2.54))
sec.top_margin = Cm(2.3); sec.bottom_margin = Cm(2.3)

def field(par, instr, placeholder=''):
    r = par.add_run(); f1 = OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'), 'begin'); r._r.append(f1)
    r2 = par.add_run(); it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = f' {instr} '; r2._r.append(it)
    r3 = par.add_run(); f2 = OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'), 'separate'); r3._r.append(f2)
    r4 = par.add_run(placeholder)
    r5 = par.add_run(); f3 = OxmlElement('w:fldChar'); f3.set(qn('w:fldCharType'), 'end'); r5._r.append(f3)
    return r4

def runs(par, text, size=None, color=None):
    for part in re.split(r'(\*\*[^*]+\*\*)', text):
        if not part: continue
        b = part.startswith('**')
        r = par.add_run(part[2:-2] if b else part); r.bold = b or None
        if size: r.font.size = Pt(size)
        if color: r.font.color.rgb = color
    return par

def para(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, style=None):
    p = doc.add_paragraph(style=style); p.alignment = align; runs(p, text); return p

def shade(cell, hexfill):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), hexfill); tcPr.append(sh)

counters = {'Figure': 0, 'Table': 0}
def caption(kind, text):
    counters[kind] += 1
    p = doc.add_paragraph(style='Caption'); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f'{kind} '); r.bold = True; r.italic = False
    nr = field(p, f'SEQ {kind} \\* ARABIC', str(counters[kind])); nr.bold = True; nr.italic = False
    r2 = p.add_run(': '); r2.bold = True; r2.italic = False
    p.add_run(text)
    if kind == 'Table': p.paragraph_format.keep_with_next = True; p.paragraph_format.space_before = Pt(8)
    return p

def table(cap, header, rows, widths=None, size=9.5):
    caption('Table', cap)
    t = doc.add_table(rows=1 + len(rows), cols=len(header)); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, h in enumerate(header):
        c = t.rows[0].cells[j]; c.text = ''; p = c.paragraphs[0]; r = p.add_run(h); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = RGBColor(255, 255, 255); shade(c, '1F3864')
    trh = t.rows[0]._tr.get_or_add_trPr(); th = OxmlElement('w:tblHeader'); th.set(qn('w:val'), 'true'); trh.append(th)
    for i, row in enumerate(rows):
        for j, v in enumerate(row):
            c = t.rows[i + 1].cells[j]; c.text = ''; p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
            runs(p, v, size=size)
            if i % 2 == 1: shade(c, 'EEF2F8')
    if widths:
        for row in t.rows:
            for j, w in enumerate(widths): row.cells[j].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def figure(fn, cap, w=6.3):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(os.path.join(FIG, fn), width=Inches(w))
    caption('Figure', cap)

def code(text):
    t = doc.add_table(rows=1, cols=1); t.style = 'Table Grid'; c = t.rows[0].cells[0]; shade(c, 'F4F4F2'); c.text = ''
    p = c.paragraphs[0]; p.paragraph_format.line_spacing = 1.0
    for k, line in enumerate(text.split('\n')):
        r = p.add_run(line); r.font.name = 'Consolas'; r.font.size = Pt(8.5)
        if k < len(text.split('\n')) - 1: r.add_break()
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def bullets(items, numbered=False):
    for k, it in enumerate(items):
        if numbered:
            p = doc.add_paragraph(); pf_ = p.paragraph_format; pf_.left_indent = Inches(0.35); pf_.first_line_indent = Inches(-0.3)
            pf_.tab_stops.add_tab_stop(Inches(0.35)); p.add_run(f'{k + 1}.	')
        else:
            p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY; p.paragraph_format.space_after = Pt(3); runs(p, it)

def heading(text, level):
    h = doc.add_heading(level=level); h.add_run(text)
    if level == 1: h.paragraph_format.page_break_before = True
    return h

def page_break(): doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def unnumbered_heading(text):
    # front-matter headings: styled like H1 but kept out of the TOC
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(14); r = p.add_run(text); r.bold = True; r.font.size = Pt(18); r.font.color.rgb = NAVY
    return p

# ---------------- front matter (roman numerals) ----------------
fm = doc.sections[0]
def pagenum(section, fmt):
    sp = section._sectPr; pg = OxmlElement('w:pgNumType'); pg.set(qn('w:fmt'), fmt); pg.set(qn('w:start'), '1'); sp.append(pg)
    ft = section.footer; ft.is_linked_to_previous = False
    fp = ft.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER; fp.text = ''; rr = field(fp, 'PAGE', '1'); rr.font.size = Pt(10)
pagenum(fm, 'lowerRoman')

unnumbered_heading('Abstract')
for kind, txt in C.ABSTRACT: para(txt)
page_break()
unnumbered_heading('Key Findings at a Glance')
kt = doc.add_table(rows=len(C.KEYFINDINGS), cols=2); kt.style = 'Table Grid'
for i, f in enumerate(C.KEYFINDINGS):
    a, b2 = kt.rows[i].cells; a.width = Inches(0.45); b2.width = Inches(5.8); shade(a, '1F3864'); shade(b2, 'EEF2F8' if i % 2 == 0 else 'FFFFFF')
    ra = a.paragraphs[0].add_run(str(i + 1)); ra.bold = True; ra.font.color.rgb = RGBColor(255, 255, 255); a.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    b2.paragraphs[0].add_run(f)
doc.add_paragraph()
table('Document control', ['Version', 'Date', 'Description'],
      [['1.0', '25 October 2026', 'Online research document with interactive charts'], ['2.0', '30 October 2026', 'Formal report: Calibri typography, front matter, numbered figures and tables, IEEE references, similarity self-check']],
      [0.8, 1.4, 4.1])
page_break()
unnumbered_heading('Table of Contents')
p = doc.add_paragraph(); field(p, 'TOC \\o "1-2" \\h \\z \\u', 'Right-click and choose Update Field to build the table of contents.')
page_break()
unnumbered_heading('List of Figures')
p = doc.add_paragraph(); field(p, 'TOC \\h \\z \\c "Figure"', 'Update field to build the list of figures.')
doc.add_paragraph()
unnumbered_heading('List of Tables')
p = doc.add_paragraph(); field(p, 'TOC \\h \\z \\c "Table"', 'Update field to build the list of tables.')
page_break()
unnumbered_heading('List of Abbreviations')
at = doc.add_table(rows=len(C.ABBREV), cols=2); at.style = 'Table Grid'
for i, (k, v) in enumerate(C.ABBREV):
    a, b2 = at.rows[i].cells; a.width = Inches(1.3); b2.width = Inches(4.9)
    ra = a.paragraphs[0].add_run(k); ra.bold = True; b2.paragraphs[0].add_run(v)
    for c in (a, b2): c.paragraphs[0].paragraph_format.space_after = Pt(0)
    if i % 2 == 0: shade(a, 'EEF2F8'); shade(b2, 'EEF2F8')

# ---------------- main body (arabic numerals, running header) ----------------
body = doc.add_section(WD_SECTION.NEW_PAGE)
pagenum(body, 'decimal')
hd = body.header; hd.is_linked_to_previous = False
hp = hd.paragraphs[0]; hp.text = ''; hr = hp.add_run(C.TITLE); hr.font.size = Pt(9); hr.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
hpPr = hp._p.get_or_add_pPr(); hb = OxmlElement('w:pBdr'); bb = OxmlElement('w:bottom')
for k, v in (('w:val', 'single'), ('w:sz', '4'), ('w:space', '1'), ('w:color', 'A0A0A0')): bb.set(qn(k), v)
hb.append(bb); hpPr.append(hb)
first = True
for blk in C.BODY:
    k = blk[0]
    if k == 'H1':
        h = heading(blk[1], 1)
        if first: h.paragraph_format.page_break_before = False; first = False
    elif k == 'H2': heading(blk[1], 2)
    elif k == 'H3': heading(blk[1], 3)
    elif k == 'P': para(blk[1])
    elif k == 'B': bullets(blk[1])
    elif k == 'N': bullets(blk[1], True)
    elif k == 'T': table(blk[1], blk[2], blk[3], blk[4] if len(blk) > 4 else None)
    elif k == 'F': figure(blk[1], blk[2], blk[3] if len(blk) > 3 else 6.3)
    elif k == 'CODE': code(blk[1])

heading('References', 1)
for i, r in enumerate(C.REFS):
    p = doc.add_paragraph(); p.paragraph_format.left_indent = Inches(0.45); p.paragraph_format.first_line_indent = Inches(-0.45)
    p.paragraph_format.space_after = Pt(4); rr = p.add_run(f'[{i + 1}]\t'); rr.bold = True; p.add_run(r).font.size = Pt(10)

heading('Appendix A. Glossary', 1)
table('Glossary of terms used in the report', ['Term', 'Meaning'],
      [['DV Score', 'DhanVeda composite of five 20-point categories (profitability, valuation, financial health, growth, technical and governance) less mandatory deductions; range 5-95'],
       ['BPE', 'Byte-pair encoding, the tokenization family used by GPT-style and Llama-3 models'],
       ['cl100k / o200k', 'tiktoken vocabularies of approximately 100,000 and 200,000 tokens'],
       ['eta-squared', 'Share of total variance explained by group membership (here, sector)'],
       ['Promoter pledge', 'Share of promoter-held shares pledged as loan collateral; SEBI monitors levels above 20%'],
       ['Band flip', 'A change of verdict band (Avoid, Weak, Neutral, Moderate, Good, Exceptional) between runs']], [1.5, 4.8])
heading('Appendix B. Raw Tokenization Data', 1)
para('Table below lists every production prompt measured in experiment E1. Estimator error is (characters / 4 - cl100k) / cl100k.')
table(*C.APPENDIX_B, size=9)
heading('Appendix C. Originality and Similarity Self-Check', 1)
para('Similarity checkers such as Turnitin report the share of a document that overlaps with existing sources, usually as a similarity index together with a ranked list of matching sources; scores below about 15-20% are generally regarded as acceptable when all sources are cited. Institutional databases are not accessible from this project, so a transparent self-check was performed instead and is reported here.')
para(f'**Method.** All running prose of this report (abstract, paragraphs and list items; tables, figures, code and references excluded) was normalised to lower-case words, giving {SIM["n_words"]:,} words and {SIM["n_sh"]:,} overlapping eight-word sequences (shingles). These were compared with the full abstracts of the eight cited arXiv papers, retrieved from the arXiv API. An eight-word shared sequence is the usual threshold at which overlap begins to indicate copied rather than coincidental wording.')
table('Eight-word shingle overlap between this report and the abstracts of cited papers',
      ['Source abstract', 'Shared 8-word shingles', 'Share of report shingles', 'Longest shared run (words)'],
      SIM['rows'], [1.6, 1.5, 1.6, 1.6])
para(f'**Result.** The combined overlap with all eight sources is {SIM["overall"]:.2f}% of the report\'s eight-word sequences. Findings from the literature are restated in the author\'s own words and attributed with numbered citations. This self-check covers only the cited research abstracts; it does not replace an institutional similarity scan, which should be run on the final document before submission.')
doc.save(OUT)
print('saved', OUT, counters)
