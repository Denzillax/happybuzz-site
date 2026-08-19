# Shop-Banner für Unternehmenskonten — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Entscheidungen
- Banner nur fuer account_type 'business', Anzeige NUR auf dem oeffentlichen
  Profil (/user/[id]) — nicht auf Inserat-Karten oder -Seiten.
- Klaerung dokumentiert: Neuware-Varianten/Stueckzahl/Lieferfrist gelten fuer
  ALLE Kategorien (Chips ueberall, wo Auswahl-Eigenschaften existieren; 15
  (Sub-)Kategorien haben welche).

## Umsetzung
- DB: profiles.shop_banner_url text (Migration shop_banner_url, live).
- Upload: Einstellungen -> Profil, sichtbar bei Konto-Typ Unternehmen.
  Clientseitig auf max 2000px verkleinert (JPEG 0.85), max 4 MB Eingabe.
  Pfad avatars/{uid}.banner.jpg — passt in die bestehende Storage-Policy
  (avatars/{uid}.%), keine neue Policy. Cache-Buster ?v= an der URL.
  Ersetzen + Entfernen (Entfernen loescht Datei und nullt die Spalte).
- Anzeige: /user/[id] ueber der Profilkarte, Ink-Rahmen + Katalog-Schatten,
  4:1 beschnitten (mobil 5:2), nur wenn business UND Banner vorhanden.
- getPublicProfile laedt shop_banner_url mit.

## Verifikation
Anzeige mit Wegwerf-Firmenprofil geprueft (Banner 4:1 geladen, Firmenname,
Unternehmen-Badge), Profil danach geloescht. Upload-Pfad gegen die Storage-
Policy verifiziert (Pattern-Match); der Upload-Klickweg selbst braucht ein
Unternehmenskonto und wird von Denis beim Umschalten getestet.
