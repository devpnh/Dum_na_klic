#!/usr/bin/env python3
"""Sestaví podstránky: sdílená hlavička/patička z index.html + <main> z partials/."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).parent
index = (ROOT / "index.html").read_text(encoding="utf-8")

# --- Extrahuj sdílené bloky z index.html (zaručeně identické) ---
# HEADER: vše mezi <body ...> a <main>
m_head_start = index.index('<body class="has-callbar">') + len('<body class="has-callbar">')
m_main = index.index('<main>')
HEADER = index[m_head_start:m_main].strip("\n")

# FOOTER: vše mezi </main> a </body>
m_main_end = index.index('</main>') + len('</main>')
m_body_end = index.index('</body>')
FOOTER = index[m_main_end:m_body_end].strip("\n")

HEAD_TMPL = '''  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{ogimg}">
  <meta name="theme-color" content="#008000">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css?v=6">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23008000'/%3E%3Cpath d='M16 6l8 6.2v1.6h-2V24h-4.6v-5.6h-2.8V24H8V13.8H6v-1.6z' fill='%23fff'/%3E%3C/svg%3E">'''

PAGE_TMPL = '''<!DOCTYPE html>
<html lang="cs">
<head>
{head}
</head>
<body class="has-callbar">

{header}

<main>
{main}
</main>

{footer}
</body>
</html>
'''

PAGES = {
  "projekty-typove": dict(
    title="Domy na klíč · katalog zděných rodinných domů | Plzeň a okolí",
    desc="Katalog typových zděných domů na klíč s pevnou cenou vč. DPH. Bungalovy i patrové domy, kompletní specifikace toho, co je v ceně. Plzeň a okolí.",
    canonical="https://www.dumnaklic.eu/projekty-typove/",
    ogimg="https://www.dumnaklic.eu/wp-content/uploads/2023/03/pohled-ALFA.jpg"),
  "projekty-individualni": dict(
    title="Už mám projekt · postavíme dům podle vašich představ | Plzeň",
    desc="Máte vlastní projekt nebo jen nápad? Zrealizujeme zděný dům na klíč podle vašich představ. Nejlepší poměr cena/kvalita, Plzeň a okolí.",
    canonical="https://www.dumnaklic.eu/projekty-individualni/",
    ogimg="https://www.dumnaklic.eu/wp-content/uploads/2025/07/IMG_8949.jpg"),
  "realizace": dict(
    title="Naše realizace · fotogalerie postavených domů na klíč | Plzeň a okolí",
    desc="Prohlédněte si fotogalerii našich realizovaných zděných rodinných domů na klíč včetně dispozic a ploch. Hodnocení 5,0 na Firmy.cz.",
    canonical="https://www.dumnaklic.eu/realizace/",
    ogimg="https://www.dumnaklic.eu/wp-content/uploads/2026/05/DJI_20260421101617_0005_D-2.jpg"),
  "kontakty": dict(
    title="Kontakt · Dům na klíč s. r. o. | Zděné domy na klíč, Plzeň",
    desc="Kontaktujte nás, telefon, e-mail i fakturační údaje. Domy na klíč v Plzeňském kraji s individuálním a přátelským přístupem za férové ceny.",
    canonical="https://www.dumnaklic.eu/kontakty/",
    ogimg="https://www.dumnaklic.eu/wp-content/uploads/2025/07/IMG_8949.jpg"),
  "clanky": dict(
    title="Články a rady o stavbě domů na klíč | Dům na klíč",
    desc="Novinky ze staveb, nízkoenergetické domy a praktické rady pro stavebníky. Přečtěte si články z oblasti zděných rodinných domů na klíč.",
    canonical="https://www.dumnaklic.eu/clanky/",
    ogimg="https://www.dumnaklic.eu/wp-content/uploads/2026/05/LUH8ee681_shutterstock_440245672.jpg"),
}

def build(only=None):
    made = []
    for slug, cfg in PAGES.items():
        if only and slug not in only:
            continue
        main_path = ROOT / "partials" / f"main-{slug}.html"
        if not main_path.exists():
            print(f"!! chybí {main_path}")
            continue
        main = main_path.read_text(encoding="utf-8").strip("\n")
        head = HEAD_TMPL.format(**cfg)
        html = PAGE_TMPL.format(head=head, header=HEADER, main=main, footer=FOOTER)
        out = ROOT / f"{slug}.html"
        out.write_text(html, encoding="utf-8")
        made.append(out.name)
        print(f"OK {out.name}  ({len(html):,} B, main {len(main):,} B)")
    return made

if __name__ == "__main__":
    build(sys.argv[1:] or None)
