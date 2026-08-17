# Tierbedarf & Haustiere: neue Kategorie — Design

Datum: 17.08.2026 · Status: vom Owner freigegeben

## Ziel

Der Kategoriebaum (25 Hauptkategorien, DB-getrieben via `categories`-Tabelle) hat keine
Tier-Kategorie. Es kommt eine Hauptkategorie **Tierbedarf & Haustiere** dazu, plus zwei
neue Unterkategorien unter Dienstleistungen.

**Entscheid Owner:** Nur Tierbedarf, KEINE lebenden Tiere (rechtlich unkompliziert,
wie Ricardo; Tiervermittlung hätte Auflagen nach Tierschutzverordnung).

## Struktur

Hauptkategorie `c0260000-0000-0000-0000-000000000001`, Slug `tierbedarf-haustiere`,
`sort_order = 24` (frei zwischen Tickets 23 und Dienstleistungen 25), Icon `PawPrint`.

Unterkategorien (`c0260001` … `c0260010`, sort 1-10):

| Nr | Name | Slug |
|---|---|---|
| 1 | Hunde | hunde |
| 2 | Katzen | katzen |
| 3 | Nagetiere & Kleintiere | nagetiere-kleintiere |
| 4 | Vögel | voegel |
| 5 | Aquaristik | aquaristik |
| 6 | Terraristik | terraristik |
| 7 | Pferdebedarf | pferdebedarf |
| 8 | Tierfutter | tierfutter |
| 9 | Tiertransport | tiertransport |
| 10 | Sonstiger Tierbedarf | sonstiger-tierbedarf |

Abgrenzung: Reitsport (Sport, `c0080008`) bleibt für Reiter-Ausrüstung (Sättel, Helme);
Pferdebedarf ist fürs Tier (Decken, Halfter, Stallbedarf).

Neue Unterkategorien unter Dienstleistungen (`c0250000`):

| ID | Name | Slug | sort |
|---|---|---|---|
| c0250008 | Tierbetreuung | tierbetreuung | 8 |
| c0250009 | Garten & Aussenbereich | garten-aussenbereich | 9 |

## Umsetzung

1. Migration `supabase/migrations/20260817_tierbedarf_kategorien.sql` (INSERTs, idempotent
   via ON CONFLICT DO NOTHING) + live ausführen.
2. `PawPrint` in die ICON_MAP von `src/components/shared/CategoryIcon.jsx` (sonst Fallback Package).
3. Beta-Checkpunkt + Reparatur-Log-Zeile.
4. Verifikation im Preview: Kategorie erscheint auf Startseite/Kategorien, im
   Inserat-Formular wählbar, Suchfilter zeigt sie.

Kein weiterer Code nötig: Suche, Filter, Formular und Homepage lesen den Baum aus der DB.
`category_attributes` bekommt vorerst nichts (kann später ergänzt werden).
