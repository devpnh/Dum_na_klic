# Dům na klíč — redesign webu

Kompletný redesign webu stavebnej firmy **Dům na klíč s. r. o.** (zděné nízkoenergetické
rodinné domy, Plzeňský kraj). Statický web (HTML/CSS/JS, bez frameworku), mobile-first.
Všetok obsah je **reálny** — stiahnutý z živého webu `dumnaklic.eu`, Firmy.cz a firemného
grafického manuálu / e-mailu.

## Stránky (zachované SEO slugy)
| Súbor | URL slug | Obsah |
|-------|----------|-------|
| `index.html` | `/` | Hero s video pozadím, benefity, štatistiky, typové vs. individuálne, katalóg (náhľad), den/večer slider, timeline procesu, **video recenzie (placeholder sekcia)**, recenzie Firmy.cz, články, formulár |
| `projekty-typove.html` | `/projekty-typove/` | Katalóg 5 typových domov (reálne ceny vč. DPH) + kompletná **souhrnná specifika** (19 položiek) + formulár |
| `projekty-individualni.html` | `/projekty-individualni/` | Vlastné projekty, video, 6-krokový proces, kontakt CEO |
| `realizace.html` | `/realizace/` | Galéria **16 realizácií** (lightbox), **reklamná/promo sekcia (placeholder)**, recenzie |
| `kontakty.html` | `/kontakty/` | Formulár, 2 kontaktné osoby, fakturačné údaje, otváracia doba |
| `clanky.html` | `/clanky/` | 13 reálnych článkov (blog/magazín) |

## Ako zobraziť / nasadiť
- **Lokálne:** otvor `index.html` v prehliadači (dvojklik). Video na pozadí hero sa spustí
  len cez `http(s)://`, nie cez `file://` — lokálne uvidíš pekný fallback obrázok, čo je zámer.
- **Nasadenie:** nahraj celý priečinok na hosting (funguje ako statický web na Apache/nginx/
  Netlify/Vercel…). Odporúčam nasadiť na doménu `dumnaklic.eu`, kde sú hostované aj obrázky.

## Branding a dizajn
- **Primárna farba `#008000`** (zelená) — kľúčová požiadavka klienta, použitá prominentne
  (CTA, akcenty, odkazy, aktívne stavy). Doplnená tmavou „pine" zelenou pre tmavé sekcie,
  aby #008000 vynikla ako akcent, nie ako plocha.
- **Sekundárna `#3C3C3B`** (antracit) — text, pätička, tmavé pruhy. Zhodné so značkou.
- **Typografia:** Bricolage Grotesque (nadpisy) · Inter (text) · Spline Sans Mono (štítky,
  ceny, špecifikácie) — cez Google Fonts.
- **Signatúra:** katalógové karty v štýle technického výkresu („titleblock" s dátovým prúžkom
  dispozícia/plocha/cena) + motív klíča/klíčovej dierky (favicon, timeline „předání klíčů").
  Inšpirácia layoutom: celet.cz (prehľadný katalóg, veľa bieleho priestoru).
- CSS premenné (farby, fonty, medzery) sú na začiatku `assets/css/style.css` → jednoduchá úprava.

## Placeholdery (na budúce marketingové kampane)
Všetky sú vizuálne hotové a **jasne označené** štítkom `placeholder-tag` + HTML komentárom:
- **Video recenzie** (homepage) — 3 reálne YouTube videá + 1 voľný slot na ďalší testimonial.
- **Karta domu / Karta realizace** — vzorové karty (označené) na kopírovanie pri pridávaní.
- **Reklamní/promo sekcia** (realizace) — priestor pre banner / akčnú ponuku.

## Čo ešte dotiahnuť (pred ostrým spustením)
1. **Formulár** — teraz je to demo (`data-demo`, len potvrdenie v prehliadači). Napojiť na
   e-mail/CRM (napr. Formspree, vlastný PHP `mail()`, alebo API). Hľadaj `<form data-demo`.
2. **Obrázky** — načítavané zo živého CDN `dumnaklic.eu` (klientove vlastné fotky). Pri
   prípadnej migrácii mimo doménu ich stiahnuť do `assets/img/`. Jeden pôvodný obrázok
   (Bungalov 4kk 108) bol na serveri už 404 — nahradený inou reálnou fotkou.
3. **Overiť s klientom:** mená a fotky kontaktných osôb (na živom webe sú mená len v obrázkoch;
   z Firmy.cz vyplýva **Loukota** + **Velich**), a priradenie ilustračných fotiek k článkom
   bez vlastného náhľadu.
4. **Recenzie** — zobrazené 3 reálne z Firmy.cz (hodnotenie 5,0/12). Voliteľne napojiť živý
   Firmy.cz widget alebo doplniť ďalšie.
5. **Hero video** — používa reálne YouTube video `AIM_OCG9FKY`. V produkcii sa spustí ako
   stlmené slučkové pozadie.

## Štruktúra súborov
```
index.html, projekty-typove.html, … (6 finálnych stránok)
assets/css/style.css   — kompletný dizajn systém
assets/js/main.js      — sticky nav, mobilné menu, počítadlá, reveal, hero video,
                         lightbox, den/večer slider, formulár
assets/img/logo.png    — logo klienta
partials/main-*.html   — [DEV] obsah <main> jednotlivých podstránok
build.py               — [DEV] zloží podstránky (spoločná hlavička/pätička z index.html + partial)
DATA.md                — [DEV] jediný zdroj pravdy (reálny obsah)
```
> `partials/`, `build.py` a `DATA.md` sú **vývojové artefakty** — na hosting ich netreba nahrávať.
> Úprava obsahu podstránky: uprav `partials/main-<slug>.html` a spusti `python3 build.py`.
