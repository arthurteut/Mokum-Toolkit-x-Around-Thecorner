#!/usr/bin/env python3
"""Construiește businesstool/index.html din sursele din businesstool/src/.

Sursele paginii (part1.html = stil și schelet, part2.js = structura planului și instrumentele,
part3.js = logica) sunt aceleași cu versiunea de pagină Claude; aici se adaugă documentul HTML
complet, login-ul și adaptorul Supabase (adapter.js), iar câteva texte care pomeneau Claude
se înlocuiesc. Rulează: python3 businesstool/src/build.py
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "index.html")
SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.min.js"

def rd(name):
    return io.open(os.path.join(HERE, name), encoding="utf-8").read()

def rep(s, old, new, count=None):
    n = s.count(old)
    assert n > 0, "lipsește: " + old[:70]
    if count is not None:
        assert n == count, (old[:70], n)
    return s.replace(old, new)

p1, p2, p3 = rd("part1.html"), rd("part2.js"), rd("part3.js")
adapter, login_html, login_css = rd("adapter.js"), rd("login.html"), rd("login.css")

# ── capul documentului: titlu, fonturi, stil (din part1), plus stilul de login ──
head, body = p1.split("</style>", 1)
head = rep(head, '<meta name="claude:viewport-fit-sides" content="cover">\n', "", 1)
head = head.strip() + "\n" + login_css.rstrip() + "\n</style>"

# ── antetul: cine e conectat, echipa (admin), ieșire ──
body = rep(body, '      <div class="progress" role="img"',
           '      <span class="who" id="who"></span>\n      <button type="button" class="hdr-link" id="team-btn" hidden>Echipa</button>\n      <button type="button" class="hdr-link" id="logout" hidden>Ieși</button>\n      <div class="progress" role="img"', 1)

# ── texte care pomeneau pagina Claude ──
p3 = rep(p3, "Deschide pagina din Claude ca să vezi și să completezi planul.", "Pagina nu e legată de Supabase: completează config.js.", 1)
p3 = rep(p3, "Conținutul planului nu e disponibil în această vizualizare (fără acces la datele paginii).", "Nu am acces la datele planului.", 1)
p3 = rep(p3, "Conținutul planului se vede doar din Claude.", "Intră cu emailul echipei ca să vezi planul.", 1)
p3 = rep(p3, "Disponibil doar din Claude.", "Intră cu emailul echipei.")
p3 = rep(p3, "Vezi planul, dar nu îl poți modifica: cere drepturi de contribuitor.", "Vezi planul, dar nu îl poți modifica.", 1)
p3 = rep(p3, "Ca să ai un spațiu privat, pagina trebuie deschisă cu contul tău.", "Spațiul privat apare după ce intri cu emailul tău.", 1)

p2 = re.sub(r"</script>\s*$", "", p2)
assert p2.lstrip().startswith("<script>") and p3.rstrip().endswith("</script>")

html = ("<!doctype html>\n<html lang=\"ro\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        "<link rel=\"icon\" href=\"assets/heat/favicon.png\">\n"
        + head + "\n</head>\n<body>\n" + body.strip() + "\n" + login_html.strip() + "\n"
        + "<script src=\"" + SUPABASE_JS + "\"></script>\n<script src=\"config.js\"></script>\n"
        + "<script>\n" + adapter.strip() + "\n</script>\n" + p2 + p3.rstrip() + "\n</body>\n</html>\n")
io.open(OUT, "w", encoding="utf-8").write(html)
print("scris", os.path.normpath(OUT), len(html), "bytes")
