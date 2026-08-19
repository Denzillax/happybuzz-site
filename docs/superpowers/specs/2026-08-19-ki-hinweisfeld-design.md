# KI-Hinweisfeld beim Inserieren — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Problem
Die KI-Erkennung kann schwer sichtbare Eigenschaften nicht wissen (Material,
Marke, Funktionszustand): ein Aktenschrank aus MDF wurde als Metall erkannt.

## Umsetzung
- ListingForm: optionales einzeiliges Textfeld "Hinweis für die KI (optional)"
  ueber dem "Mit KI ausfüllen"-Knopf (sichtbar sobald 1 Foto da ist), Platzhalter
  "z.B. Aktenschrank aus MDF, Marke Lista, Schublade klemmt". Wird bei ALLEN
  KI-Aufrufen mitgeschickt (Voll-Ausfuellen und KI-Titel/KI-Text-Varianten).
- Route /api/ai-listing: neues optionales Feld `hint` (Text, max 300 Zeichen).
  Prompt-Zusatz: Verkaeufer-Angaben bei schwer erkennbaren Dingen uebernehmen
  (Material/Marke/Modell/Funktionszustand), ausser das Bild widerspricht
  offensichtlich; Ehrlichkeits-Regeln bleiben.
- Keine DB-Aenderung.

## Verifikation
Route mit echtem Foto einmal ohne und einmal mit Hinweis aufrufen; der
Hinweis-Inhalt muss in Titel/Beschreibung ankommen. RepLog + Beta-Checkliste.
