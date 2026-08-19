"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Circle, AlertTriangle, Send, Smartphone, Monitor, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";
import { REP_LOG, melderRanking } from "@/lib/replog";

const TESTS = [
  {
    id: "nav", title: "Navigation & Header", icon: Monitor,
    items: [
      { id: "ann_bar_admin", label: "Admin 'Banner': Text/Farbe (Presets+Hex)/An-Aus mit Live-Vorschau, Speichern wirkt" },
      { id: "ann_bar_public", label: "Balken über dem Header sichtbar (auch ausgeloggt); X blendet aus + bleibt nach Reload; neuer Text bringt ihn zurück" },
      { id: "nav_logo", label: "Logo klicken → Homepage" },
      { id: "nav_search_auto", label: "Suchfeld: Autocomplete-Vorschläge erscheinen" },
      { id: "nav_search_submit", label: "Suche absenden → /search mit Ergebnissen" },
      { id: "nav_megamenu", label: "Kategorien-Menü öffnen & Kategorie wählen" },
      { id: "nav_stoebern", label: "Stöbern → Suchseite öffnet" },
      { id: "nav_inserieren", label: "Inserieren-Button → Inserat erstellen" },
      { id: "nav_favorites", label: "Herz-Icon → Favoriten" },
      { id: "nav_notifications", label: "Glocke → Benachrichtigungen, ungelesen-Zähler stimmt" },
      { id: "nav_profile_menu", label: "Profil-Avatar → Dropdown mit allen Links" },
      { id: "nav_logout", label: "Abmelden aus dem Profil-Menü" },
    ],
  },
  {
    id: "auth", title: "Registrierung & Login", icon: Monitor,
    items: [
      { id: "auth_register", label: "Neues Konto erstellen (Vorname + Nachname getrennt, beide Pflicht, landen im Profil wie in den Einstellungen)" },
      { id: "auth_agb_links", label: "AGB- und Datenschutz-Links bei der Registrierung öffnen /terms und /privacy in neuem Tab" },
      { id: "auth_email_confirm", label: "Bestätigungsmail erhalten & Konto aktiviert (Absender noreply@beedaro.ch, BEEDARO-Design, sobald SMTP eingerichtet)" },
      { id: "auth_login", label: "Login mit E-Mail + Passwort" },
      { id: "auth_social", label: "Login mit Google / Apple (falls aktiviert)" },
      { id: "auth_pw_reset", label: "Passwort vergessen → Reset-Mail erhalten" },
      { id: "auth_logout", label: "Abmelden beendet die Session" },
      { id: "auth_protected", label: "Geschützte Seite ohne Login → Weiterleitung zu Login" },
    ],
  },
  {
    id: "search", title: "Suche & Filter", icon: Monitor,
    items: [
      { id: "sr_text", label: "Textsuche findet passende Inserate" },
      { id: "sr_category", label: "Kategorie-Filter funktioniert" },
      { id: "sr_price", label: "Preis-Range Filter funktioniert" },
      { id: "sr_condition", label: "Zustand-Filter funktioniert" },
      { id: "sr_type", label: "Typ-Filter (Festpreis/Auktion/Miete/Gratis/Service)" },
      { id: "sr_sort", label: "Sortierung: Relevanz, Neueste, Preis, Endet bald, Gebote" },
      { id: "sr_fee_ranking", label: "Gebühren-Ranking: bei 'Relevanz' stehen Inserate mit höherer Bee-Rate weiter oben, aber ein frisches 3%-Inserat schlägt ein altes 10%-Inserat (Bonus: 5%=3, 7%=7, 10%=14 Tage)" },
      { id: "sr_fee_ranking_hinweis", label: "Transparenzhinweis 'Relevanz berücksichtigt Aktualität und Bee-Rate' erscheint nur bei Sortierung Relevanz, nicht bei Neueste/Preis" },
      { id: "sr_cards", label: "Ergebnis-Cards: Bild, Preis, Verkäufer korrekt" },
      { id: "trust_verified_badge", label: "'Verifiziert'-Abzeichen (grüner Haken) erscheint bei verifizierten Verkäufern (Ausweis geprüft + E-Mail) auf Karte, Inserat-Detail, Profil und Bestellung; nicht-verifizierte zeigen es nicht" },
      { id: "trust_verified_filter", label: "Suchfilter 'Verifiziert' zeigt nur Inserate von verifizierten Verkäufern; Ergebniszahl sinkt; 'Alle Filter zurücksetzen' schaltet ihn aus" },
      { id: "trust_founder_badge", label: "'Gründungsmitglied Nr. X'-Abzeichen erscheint auf öffentlichem Profil und Inserat-Detail bei den ersten 500 Verkäufern; Verkäufer ohne Verkauf zeigen es nicht" },
      { id: "sr_no_results", label: "Keine Ergebnisse → sinnvolle Meldung" },
      { id: "sr_url_params", label: "Filter bleiben nach Reload in der URL erhalten" },
      { id: "sr_recent", label: "Letzte Suchen als Chips: klickbar, neueste zuerst, löschbar" },
      { id: "sr_seasonal", label: "Startseite: saisonale Empfehlungen (Chips passend zur Jahreszeit) führen zur Suche" },
      { id: "sr_boost", label: "Boost-Badges auf Karten: 'Gesponsert' (gelber Rahmen) + 'Featured' (gold)" },
    ],
  },
  {
    id: "listing_create", title: "Inserat erstellen", icon: Monitor,
    items: [
      { id: "lc_photos", label: "Fotos hochladen (Drag & Drop)" },
      { id: "lc_photos_reorder", label: "Fotos per Drag sortieren" },
      { id: "lc_photos_delete", label: "Fotos einzeln löschen" },
      { id: "lc_title", label: "Titel eingeben (max 60 Zeichen, Counter)" },
      { id: "lc_condition", label: "Zustand wählen (5 Stufen)" },
      { id: "lc_description", label: "Beschreibung eingeben" },
      { id: "lc_category_auto", label: "Kategorie-Autocomplete findet Kategorie" },
      { id: "lc_category_dropdown", label: "Kategorie-Dropdown (Haupt/Unter/Sub)" },
      { id: "lc_category_tierbedarf", label: "Neue Kategorie 'Tierbedarf & Haustiere' mit 10 Unterkategorien wählbar (auch im Kategorien-Menü und im Suchfilter sichtbar); Dienstleistungen haben neu Tierbetreuung und Garten & Aussenbereich" },
      { id: "lc_type_festpreis", label: "Festpreis: Preis eingeben" },
      { id: "lc_type_auktion", label: "Auktion: Startpreis + Dauer wählen" },
      { id: "lc_auktion_vergleich", label: "Auktion: Hinweisbox mit Gebührenvergleich (Ricardo 8-12% Basissatz) erscheint nur beim Typ Auktion, nicht bei Festpreis/Miete/Service/Gratis" },
      { id: "lc_import_helfer_setup", label: "Import-Helfer: /import-helfer zeigt 3 Schritte; Button '🐝 BEEDARO Import' lässt sich in die Lesezeichenleiste ziehen (Klick tut nichts)" },
      { id: "lc_import_helfer_run", label: "Import-Helfer: Klick auf dem eigenen Inserat (Ricardo/Tutti/eBay/FB) öffnet BEEDARO mit gefülltem Titel, Beschreibung, Preis und den EIGENEN Bildern" },
      { id: "lc_import_hash", label: "Import: nach der Übernahme verschwindet #import aus der URL; ein Reload importiert NICHT erneut" },
      { id: "lc_import_guard", label: "Import-Hinweis nur beim Erstellen sichtbar, nicht beim Bearbeiten eines bestehenden Inserats" },
      { id: "lc_type_mieten", label: "Vermieten: Mietpreis + Periode wählen" },
      { id: "lc_type_gratis", label: "Gratis verschenken (Preis 0)" },
      { id: "lc_type_service", label: "Service-Inserat erstellen" },
      { id: "lc_service_edit_preis", label: "Service-Inserat bearbeiten: Preis + Einheit (z.B. 120/Std) bleiben nach dem Speichern erhalten und stimmen auf der Detailseite" },
      { id: "lc_pflicht_rot", label: "Veröffentlichen mit fehlenden Angaben: Pflichtfelder rot umrandet mit Meldung direkt am Feld, Seite scrollt zum ersten Fehler, Korrektur entfernt die Markierung sofort" },
      { id: "lc_owner_leiste", label: "Eigenes Inserat öffnen: honiggelbe Leiste 'Das ist dein Inserat' mit Bearbeiten + Meine Inserate; bei fremden Inseraten nicht sichtbar" },
      { id: "lc_richtext", label: "Beschreibung formatieren: Fett/Kursiv/Aufzählung/Zwischentitel über die Knopfleiste, Anzeige auf der Detailseite formatiert; eingefügter Text aus Word/Websites wird bereinigt (nur erlaubte Formate bleiben)" },
      { id: "lc_richtext_import", label: "Ricardo/Tutti-Import übernimmt Fett und Listen aus der Quelle in den Editor" },
      { id: "lc_preis_pro_typ", label: "Preis pro Inserat-Typ korrekt: Auktion ohne Gebote zeigt 'Startpreis' (nie einen fremden Restwert, auch nicht nach Import), mit Geboten 'Aktuelles Gebot'; Festpreis/Miete/Service/Gratis je richtig; Typwechsel beim Bearbeiten hinterlässt keine alten Preisfelder" },
      { id: "auk_enddatum", label: "Neue Auktion hat sofort ein Enddatum (aus der Dauer berechnet) mit Countdown; Bearbeiten dreht eine laufende Uhr NICHT zurück" },
      { id: "auk_gebotsschritt", label: "Gebotsschritt beim Inserieren wählbar (0.10/1.00/5.00, Standard 1.00); andere Werte sind auch per manipuliertem Client unmöglich (DB-CHECK)" },
      { id: "auk_maske_regeln", label: "Gebotsmaske folgt den Serverregeln: erstes Gebot ab Startpreis möglich, Zeile 'Nächstes Gebot', Limit-Erhöhen korrekt vorbelegt (Limit + Schritt), Senken bis zum eigenen aktuellen Gebot" },
      { id: "auk_verlauf_sortierung", label: "Gebotsverlauf: bei identischem Zeitstempel (Auto-Gegengebot) steht der Höchstbietende zuoberst" },
      { id: "auk_verkaeufer_push", label: "Verkäufer bekommt bei jedem Gebot Glocke + E-Mail + Push (Einstellung 'Neues Gebot'), serverseitig ausgelöst" },
      { id: "lc_service_block", label: "Service-Inserat blockiert, solange früherer Auftrag nicht in Rechnung gestellt" },
      { id: "lc_ship_toggle", label: "Versand-Schalter ein/aus" },
      { id: "lc_ship_modal", label: "Versand bearbeiten → Modal öffnet" },
      { id: "lc_ship_method", label: "Versandart wählen (Paket/Brief/Kurier/...)" },
      { id: "lc_ship_weight", label: "Gewicht + Geschwindigkeit → Preis berechnet" },
      { id: "lc_ship_free", label: "Kostenloser Versand Toggle" },
      { id: "lc_ship_limit", label: "Versandkosten max +5 CHF über Tarif" },
      { id: "lc_pickup", label: "Abholung: Adresse aus Profil angezeigt" },
      { id: "lc_pay", label: "Zahlungsarten: TWINT / Bank / Bar" },
      { id: "lc_bee_rate", label: "Bee-Rate zeigt Settings-Default ('Dein Standard')" },
      { id: "lc_publish_check", label: "Veröffentlichen: Profil-Check (IBAN/Adresse) greift" },
      { id: "lc_publish", label: "Veröffentlichen erstellt das Inserat" },
      { id: "lc_draft", label: "Als Entwurf speichern" },
      { id: "lc_type_first", label: "Inserattyp steht zuoberst, Preis-Felder passen sich an" },
      { id: "lc_expiry", label: "Laufzeit-Hinweis: 60 Tage (Auktion = Auktionsdauer)" },
      { id: "lc_expired_badge", label: "Meine Inserate: abgelaufene Inserate zeigen 'Abgelaufen' (orange) statt 'Aktiv', eigener Filter-Chip 'Abgelaufen (n)', Aktiv-Zähler zählt sie nicht mehr mit" },
      { id: "lc_expired_renew", label: "Verlängern-Button bei abgelaufenen Inseraten (nicht bei Auktionen): setzt 60 Tage neue Laufzeit, Inserat erscheint wieder in der Suche" },
      { id: "lc_sticky_bar", label: "Aktions-Bar bleibt beim Scrollen unten sichtbar" },
      { id: "lc_duplicate", label: "Ähnliches erstellen / Letztes als Vorlage: Felder übernommen (ausser Titel + Fotos)" },
    ],
  },
  {
    id: "listing_view", title: "Inserat ansehen", icon: Monitor,
    items: [
      { id: "lv_images", label: "Bilder werden geladen" },
      { id: "lv_lightbox", label: "Klick auf Bild → Lightbox (Fullscreen)" },
      { id: "lv_lightbox_keys", label: "Lightbox: ESC schliesst, Pfeiltasten navigieren" },
      { id: "lv_hover_zoom", label: "Hover-Zoom auf Hauptbild" },
      { id: "lv_thumbnails", label: "Thumbnails anklickbar" },
      { id: "lv_favorite", label: "Herz-Button → Favorit speichern/entfernen" },
      { id: "lv_share", label: "Teilen: WhatsApp / E-Mail / Link kopieren (bzw. native Share auf Mobile)" },
      { id: "lv_report", label: "Melden → Report-Modal & Absenden" },
      { id: "lv_report_ratelimit", label: "Melde-Spam-Schutz: sehr viele Meldungen in kurzer Zeit (10/Stunde) werden serverseitig blockiert mit Hinweis 'Zu viele Meldungen in kurzer Zeit'" },
      { id: "lv_chat_public", label: "Fragen zum Inserat: öffentliche Q&A (kein Privat-Umschalter mehr)" },
      { id: "lv_chat_private", label: "'Nachricht an Verkäufer' öffnet privaten Chat-Thread" },
      { id: "lv_seller", label: "Verkäufer-Info: Name, Trust-Badge, Bewertung" },
      { id: "lv_business", label: "Unternehmen-Badge + Firmenname beim Verkäufer (falls gewerblich)" },
      { id: "lv_map", label: "Standort-Karte wird angezeigt" },
      { id: "lv_similar", label: "Ähnliche Inserate werden angezeigt" },
      { id: "lv_recent", label: "Zuletzt angesehen: besuchte Inserate erscheinen auf der Startseite" },
      { id: "lv_qr", label: "QR-Code: Modal zeigt scanbaren Code zum Inserat + Drucken" },
      { id: "lv_live", label: "Live-Zähler: 'X schauen gerade' bei >2 aktiven Betrachtern (Realtime)" },
      { id: "lv_sofortkauf", label: "Sofortkauf → Bestätigung → Bestellseite" },
      { id: "lv_offer", label: "Preis vorschlagen (verhandelbar): Vorschlag → Chat; Annehmen/Ablehnen/Gegenvorschlag, max 3 Runden" },
      { id: "lv_auction_bid", label: "Auktion: Gebot abgeben" },
      { id: "lv_bid_ratelimit", label: "Gebots-Spam-Schutz: sehr viele Gebote in kurzer Zeit (20/Minute) werden serverseitig blockiert mit Hinweis 'Zu viele Gebote in kurzer Zeit'" },
      { id: "lv_auction_board", label: "Auktion: Gebote-Leaderboard & Countdown" },
      { id: "lv_bidder_anon", label: "Gebotsverlauf maskiert Bieter (z.B. 'Ze****', eigene = 'Du'), kein voller Name" },
      { id: "lv_auction_end", label: "Auktion: Auto-Finalisierung nach Ablauf" },
      { id: "lv_rental_book", label: "Mieten: Zeitraum wählen & buchen" },
    ],
  },
  {
    id: "buy_flow", title: "Kaufen, Bezahlen & Abschluss", icon: Monitor,
    items: [
      { id: "bf_order_page", label: "Bestellseite öffnet nach Kauf" },
      { id: "bf_timeline", label: "Order-Timeline zeigt korrekten Status" },
      { id: "bf_invoice", label: "QR-Rechnung wird generiert (scanbar)" },
      { id: "bf_invoice_name", label: "Rechnung zeigt echten Namen (nicht Profilname)" },
      { id: "bf_invoice_address", label: "Rechnung zeigt korrekte Adresse" },
      { id: "bf_invoice_business", label: "Rechnung: Firmenname + UID bei gewerblichem Verkäufer" },
      { id: "bf_invoice_page", label: "Rechnungs-Seite /order/[id]/invoice druckbar" },
      { id: "bf_pay_mark", label: "Zahlung als getätigt markieren" },
      { id: "bf_confirm_receipt", label: "Empfang bestätigen funktioniert" },
      { id: "bf_rating", label: "Bewertung nach Empfang abgeben" },
      { id: "bf_rating_tags", label: "Bewertungs-Tags wählbar; auf Profil aggregiert (z.B. '3× Schneller Versand')" },
      { id: "bf_sale_popup", label: "Verkauf abgeschlossen → Popup mit Pollen/Nektar + 'Belohnungen einlösen' (einmalig)" },
      { id: "bf_return", label: "Rückgabe / Schaden melden" },
      { id: "bf_service_invoice", label: "Service-Rechnung mit Positionen (falls Service)" },
    ],
  },
  {
    id: "my_listings", title: "Meine Inserate", icon: Monitor,
    items: [
      { id: "ml_list", label: "Inserate-Liste wird angezeigt" },
      { id: "ml_stats", label: "Statistik je Inserat: Aufrufe/Favoriten/Chats, 7-Tage-Chart, Quellen" },
      { id: "ml_boost", label: "Aktiver Boost je Inserat (z.B. 'Featured · noch 2d') sichtbar" },
      { id: "ml_boost_redeem", label: "Raketen-Icon: Spotlight/Goldener Stempel direkt am Inserat einlösen (One-Click)" },
      { id: "ml_filter", label: "Filter/Tabs: Alle, Aktiv, Pausiert, Verkauft" },
      { id: "ml_counters", label: "Views + Favoriten-Zähler korrekt" },
      { id: "ml_edit", label: "Bearbeiten → /listings/[id] lädt die Daten" },
      { id: "ml_pause", label: "Inserat pausieren" },
      { id: "ml_reactivate", label: "Pausiertes Inserat reaktivieren" },
      { id: "ml_sold", label: "Als verkauft markieren" },
      { id: "ml_delete", label: "Löschen (Soft Delete, verkauft ist gesperrt)" },
      { id: "ml_mobile_cards", label: "Mobile: Karten-Liste statt Tabelle (Aktionen als Buttons, Boost-Menü)" },
    ],
  },
  {
    id: "bids_bookings", title: "Gebote & Buchungen", icon: Monitor,
    items: [
      { id: "bb_bids_list", label: "Meine Gebote: Liste mit Status (Führend/Überboten)" },
      { id: "bb_bids_link", label: "Gebot → Inserat öffnen" },
      { id: "bb_book_tabs", label: "Buchungen: Eingehende Anfragen vs. Meine Buchungen" },
      { id: "bb_book_action", label: "Mietanfrage bestätigen / ablehnen" },
      { id: "bb_book_status", label: "Buchungs-Status korrekt (Angefragt/Laufend/Zurück)" },
      { id: "bb_book_returned", label: "Als zurückgegeben markieren" },
    ],
  },
  {
    id: "orders_mgmt", title: "Käufe & Verkäufe", icon: Monitor,
    items: [
      { id: "om_purchases", label: "Meine Käufe: Liste + Status-Filter" },
      { id: "om_sales", label: "Meine Verkäufe: Liste + Status-Filter" },
      { id: "om_links", label: "Links zu Inserat, Gegenpartei und Bestellseite" },
      { id: "om_status_sync", label: "Status zwischen Käufer- und Verkäufer-Sicht konsistent" },
    ],
  },
  {
    id: "chat", title: "Chat & Nachrichten", icon: Monitor,
    items: [
      { id: "ch_list", label: "Chat-Übersicht: Unterhaltungen als Liste, Klick öffnet den Thread" },
      { id: "ch_unread", label: "Ungelesen-Markierung & Sortierung" },
      { id: "ch_public", label: "Öffentliche Q&A: Frage & Antwort des Verkäufers" },
      { id: "ch_private", label: "Private Nachrichten senden/empfangen" },
      { id: "ch_thread", label: "Einzel-Chat /chat/[id]: Verlauf korrekt" },
      { id: "ch_quick", label: "Schnell-Antworten: vordefinierte Chips senden, eigene anlegen/löschen" },
      { id: "ch_context", label: "Thread zeigt Inserat-Kontext (Bild, Titel, Preis, 'Zum Inserat') + Datums-Trenner" },
      { id: "ch_images", label: "Bild im Chat senden (Upload) + Anzeige + Lightbox" },
      { id: "ch_layout", label: "Desktop: Liste │ Chat │ Inserat-Info (3 Spalten); Mobile einspaltig (Liste ↔ Thread mit Zurück)" },
      { id: "ch_contactmask", label: "Kontaktdaten (Telefon/E-Mail/WhatsApp/Link) werden VOR Kaufabschluss ausgeblendet (•••) + Hinweis; nach Kauf erlaubt" },
      { id: "ch_contactescalate", label: "Wiederholte Kontaktversuche: nach mehreren Malen rote AGB-Warnung im Chat (Versuche werden pro Konto gezählt)" },
      { id: "ch_ban", label: "Admin (Users-Tab): Konto sperren/entsperren; gesperrtes Konto sieht 'Konto gesperrt'-Overlay + kann nicht mehr chatten" },
      { id: "ch_ratelimit", label: "Spam-Schutz: sehr viele Nachrichten in kurzer Zeit (30/Minute) werden serverseitig blockiert mit Hinweis 'Zu viele Nachrichten in kurzer Zeit'" },
    ],
  },
  {
    id: "favorites", title: "Favoriten", icon: Monitor,
    items: [
      { id: "fav_items", label: "Tab Artikel: gespeicherte Inserate, entfernen, öffnen" },
      { id: "fav_inactive_section", label: "Verkaufte/beendete Favoriten liegen in der eigenen Sektion 'Nicht mehr verfügbar' (einklappbar), Karten ausgegraut; Herz entfernt sie weiterhin" },
      { id: "fav_deleted_weg", label: "Gelöschte Inserate erscheinen gar nicht mehr in den Favoriten" },
      { id: "card_stamp_ueberall", label: "Verkaufte/beendete Inserate sind auf JEDER Karte automatisch ausgegraut und zeigen unten Verkauft bzw. Beendet statt Countdown (auch bei Ähnliche Artikel, Profil, Schaufenster)" },
      { id: "fav_heart_farbe", label: "Favoriten-Herz ist überall HONEY-gelb (Karte, Inserat-Detail, Header, Verkäufer merken); nirgends mehr rot" },
      { id: "fav_sellers", label: "Tab Verkäufer: gemerkte Verkäufer" },
      { id: "fav_searches", label: "Tab Suchen: gespeicherte Suche wieder ausführen" },
    ],
  },
  {
    id: "fees", title: "Gebühren & Bee-Impact", icon: Monitor,
    items: [
      { id: "fee_overview", label: "Gebühren-Seite: Bee-Rate Stufen erklärt" },
      { id: "fee_invoices", label: "Gebühren-Rechnungen werden aufgelistet" },
      { id: "fee_invoice_detail", label: "Gebühren-Rechnung /fees/invoice/[id] mit Aufstellung" },
      { id: "fee_impact", label: "Bee-Impact Anteil (20%) korrekt berechnet" },
      { id: "fee_bagatell_form", label: "Bagatellgrenze im Inserat-Formular: Preis unter CHF 20 zeigt 'Gebührenfrei' statt Gebührenaufstellung; ab CHF 20 erscheint die Aufstellung wieder" },
      { id: "fee_bagatell_ledger", label: "Bagatellgrenze beim echten Verkauf: Verkauf unter CHF 20 erzeugt Gebühr 0.00 und Bee-Impact 0.00 in der Gebührenübersicht; Verkauf ab CHF 20 wird normal verrechnet" },
      { id: "fee_default_impact", label: "Standard-Bee-Rate ist überall 7% (Impact): Formular vorausgewählt, how-it-works als 'Empfohlen' markiert, Rechnung rechnet mit 7%" },
      { id: "impact_canonical", label: "Bee-Impact zählt app-weit nur bezahlte Gebühren (Startseite/Impact/Hive/Profil identisch, keine Doppelzählung)" },
      { id: "impact_milestone", label: "Startseite zeigt Meilenstein-Fortschritt zum nächsten Projekt (geflossen + unterwegs) plus Artikel/CO2" },
      { id: "fee_min_invoice", label: "Mindest-Rechnungsbetrag: offener Saldo unter CHF 10 erzeugt KEINE Monatsrechnung (Hinweis 'wird in den Folgemonat übertragen' auf /fees); ab CHF 10 kommt EINE Rechnung inkl. übertragener Vormonate" },
    ],
  },
  {
    id: "admin", title: "Admin-Bereich", icon: Monitor,
    items: [
      { id: "adm_access", label: "Nur das Admin-Konto sieht /admin (andere werden auf die Startseite umgeleitet)" },
      { id: "adm_shell", label: "Navigations-Sidebar (Übersicht/Benutzer/Inserate/Gebühren/Meldungen): Tab-Wechsel funktioniert, mobil als Top-Leiste" },
      { id: "adm_sitemode", label: "Betriebsmodus (Übersicht): Live/Beta/Wartung umschalten mit Bestätigung; Beta sperrt Besucher ohne Freigabe aus (Sperrseite mit Anmelden), Wartung sperrt alle ausser Staff; Protokoll-Eintrag" },
      { id: "adm_beta_access", label: "Benutzer-Profil: 'Beta-Zugang erteilen/entziehen' wirkt sofort auf das Gate; Badge 'Beta-Zugang' im Profilkopf; /login bleibt immer erreichbar" },
      { id: "adm_overview", label: "Übersicht: Stat-Karten + 'Zu prüfen'-Karten (Geflaggt/Gesperrt/Offene Meldungen) springen gefiltert in den passenden Tab" },
      { id: "adm_users_filter", label: "Benutzer: Filter Alle/Geflaggt/Gesperrt mit Live-Zähler; Suche; Zeile aufklappbar (Inserate/Bestellungen/Rechnungen/Bewertungen)" },
      { id: "adm_users_mod", label: "Benutzer: Sperren/Entsperren direkt in der Zeile sichtbar (ohne Aufklappen); Verstoss- und GESPERRT-Badge; markierte Zeilen für geflaggt/gesperrt" },
      { id: "adm_id", label: "Benutzer: ID-Dokument prüfen (Ansehen / Bestätigen / Ablehnen)" },
      { id: "adm_listings", label: "Inserate: Liste mit Pause/Aktiv-Schalter + Ansehen" },
      { id: "adm_fees", label: "Gebühren: Rechnungs-Tabelle filterbar; Bestätigen reaktiviert Inserate; Mahnstufen 1-3" },
      { id: "adm_reports", label: "Meldungen: offene Meldungen mit Zähler-Badge in der Nav; Erledigt / Inserat pausieren / Ansehen" },
      { id: "adm_orders", label: "Bestellungen-Tab: alle Käufe, Suche per BEE-Nummer/Name, Status-Filter; Detail mit QR-Vorschau + 'Volle Rechnung öffnen' + Stornieren" },
      { id: "adm_orders_rent", label: "Miet-Bestellung: Umschalter Rechnung/Kaution zeigt den korrekten zweiten QR" },
      { id: "adm_invoices", label: "Rechnungen-Tab: Typ-Filter Alle/BEE/FEE, Nummernsuche über beide, Inline-QR + Öffnen" },
      { id: "adm_invoices_dunning", label: "Gebühren-Rechnungen (FEE) behalten das Mahnwesen (Stufen 1-3, Bezahlt+reaktivieren)" },
      { id: "adm_overview_openinv", label: "Übersicht-Karte 'Offene Rechnungen' springt gefiltert in den Rechnungen-Tab" },
      { id: "adm_fee_ref_unique", label: "Neue FEE-Rechnung erhält eindeutige Nr (FEE-JJJJ-MM-XXXXXX); bestehende unverändert" },
      { id: "adm_fee_bee_pos", label: "FEE-Monatsrechnung (Seite + Admin) zeigt BEE-Nr je Position" },
      { id: "adm_csv", label: "CSV-Export für Bestellungen/Rechnungen/Benutzer exportiert die gefilterte Ansicht; Umlaute korrekt" },
      { id: "adm_emaillog", label: "E-Mails-Tab listet email_log, Suche + aufklappbarer Context funktionieren" },
      { id: "adm_ladezeit", label: "Admin lädt in wenigen Sekunden (gebündelte Abfragen), während des Ladens Beedaro-Logo mit Honig-Ladebalken" },
      { id: "adm_tabellen_sort", label: "Admin-Tabellen (Inserate/Bestellungen/Rechnungen/Challenges): Spaltenköpfe sortieren per Klick (Pfeil zeigt Richtung), Preis pro Inserat-Typ korrekt (ab Startpreis, /Std, Gratis, — statt 0.00), Auge/Detail in fester Flucht" },
      { id: "adm_tabellen_mobil", label: "Admin-Tabellen auf dem Handy als Karten ohne Seitwärts-Scrollen; Bestellungen/Rechnungen klappen ihre Details auch als Karte auf (inkl. Mahn-Knöpfe)" },
      { id: "adm_chal_kategorie", label: "Challenge mit Kategorie: bei 'Inserate erstellen' Kategorie wählbar, Zählung nur in dieser Kategorie inkl. Unterkategorien (Hive-Fortschritt UND Einlösen), Kategorie steht auf der Challenge-Karte" },
      { id: "adm_chal_neue_arten", label: "Neue Challenge-Arten funktionieren: Käufe tätigen, Bewertungen abgeben, Inserate in verschiedenen Kategorien" },
      { id: "adm_chal_featured", label: "Häkchen 'Auf Startseite zeigen': Challenge erscheint als Banner unter dem Hero (Titel, Pollen, Countdown, Fortschritt wenn eingeloggt, CTA); ohne featured Challenge keine Sektion" },
      { id: "adm_chal_loeschen", label: "Challenge löschen: roter Löschen-Knopf mit Rückfrage; Teilnahmen werden mitgelöscht, bereits gutgeschriebene Pollen bleiben; Vorlagen löschen lässt vergangene Wochen-Instanzen bestehen" },
      { id: "adm_status_deutsch", label: "Benutzer-Detail: Bestell-Status überall deutsch übersetzt (kein payment_marked/shipped roh)" },
      { id: "adm_mini_analytics", label: "Übersicht zeigt GMV, Ø Bestellwert und Top-5-Verkäufer (nicht-storniert)" },
      { id: "adm_dunning_tab", label: "Mahnungen-Tab listet überfällige FEE-Rechnungen mit Eskalations-Timeline + Fälligkeit; Nav-Badge stimmt" },
      { id: "adm_dunning_preview", label: "Stufen-Button öffnet E-Mail-Vorschau; 'Senden' erhöht Stufe + protokolliert lesbaren Text" },
      { id: "adm_dunning_escalation", label: "Stufe 3 pausiert Inserate; 'Bezahlt' reaktiviert" },
      { id: "adm_email_readable", label: "E-Mails-Tab zeigt An/Betreff/Text lesbar (kein JSON)" },
      { id: "adm_user_emails", label: "Benutzer-Detail 'E-Mails'-Sub-Tab zeigt die Mails dieses Nutzers" },
      { id: "adm_analytics_tab", label: "Analytik-Tab zeigt 4 Diagramme (Neue Nutzer, GMV, Neue Inserate, Inserate nach Typ)" },
      { id: "adm_analytics_range", label: "Zeitraum 7/30/90 Tage umschalten lädt die Reihen neu" },
      { id: "adm_analytics_empty", label: "Leerer Zeitraum zeigt 0-Linien statt Fehler" },
      { id: "adm_broadcast_open", label: "'Ankündigung senden'-Button auf der Übersicht öffnet den Composer" },
      { id: "adm_broadcast_segment", label: "Zielgruppe Alle/Privat/Unternehmen ändert die Live-Empfängerzahl" },
      { id: "adm_broadcast_single", label: "Zielgruppe 'Einzelne': Nutzer-Suche + Mehrfachauswahl, sendet nur an die Gewählten" },
      { id: "adm_broadcast_send", label: "Senden legt In-App-Notifications an; Empfänger sehen sie in der Glocke (Megafon-Icon)" },
      { id: "adm_broadcast_validate", label: "Leeres Titel-/Nachricht-Feld lässt sich nicht senden" },
      { id: "adm_audit_tab", label: "Protokoll-Tab zeigt Admin-Aktionen als tages-gruppierte Timeline (Icon, Ziel, Zeit, Admin)" },
      { id: "adm_audit_logging", label: "Jede Admin-Aktion (Sperren/Meldung/Mahnung/Storno/Ankündigung/...) erzeugt einen Protokoll-Eintrag" },
      { id: "adm_audit_search", label: "Protokoll-Suche filtert nach Aktion/Ziel" },
      { id: "adm_freigabe_queue", label: "Inserate-Tab: Filter 'Wartet auf Freigabe' + Nav-Badge + 'Zu prüfen'-Karte zeigen neue Inserate (status pending_review)" },
      { id: "adm_freigabe_approve", label: "Freigeben macht das Inserat live (active) + Protokoll-Eintrag 'Inserat freigegeben'" },
      { id: "adm_freigabe_reject", label: "Ablehnen (mit Pflicht-Grund) setzt zurück auf Entwurf + Benachrichtigung an den Verkäufer + Protokoll" },
      { id: "adm_freigabe_gate", label: "Nicht-Admin kann ein Inserat nicht selbst aktivieren (Guard greift); Verlängern/Entpausieren eigener Inserate funktioniert weiter" },
      { id: "vk_inserat_in_pruefung", label: "Verkäufer: publiziertes Inserat zeigt 'In Prüfung'-Badge; abgelehntes zeigt 'Abgelehnt: <Grund>'" },
      { id: "adm_profile_open", label: "Benutzer: Zeilen-Klick öffnet die 360°-Profil-Ansicht; 'Zurück' führt zur Liste" },
      { id: "adm_profile_header", label: "Profil: Kennzahlen-Kopf (Mitglied seit/Level/Käufe-Verkäufe/Umsatz/offene Gebühren/Verstösse) + Status-Badges + Risiko-Ampel stimmen" },
      { id: "adm_profile_note", label: "Profil: private Admin-Notiz speichern, bleibt nach Reload + erneutem Öffnen" },
      { id: "adm_profile_history", label: "Profil: Aktions-/Sperrhistorie zeigt Audit-Einträge zu diesem Nutzer" },
      { id: "adm_profile_actions", label: "Profil: Sperren/Entsperren + ID-Prüfung funktionieren; Sub-Tabs zeigen die Per-Nutzer-Daten" },
      { id: "adm_company_tab", label: "Firma-Tab: Firmendaten (Name/Adresse/IBAN/UID/Kontakt) bearbeiten + speichern, bleibt nach Reload" },
      { id: "adm_company_qr", label: "FEE-QR-Rechnung: Empfänger/IBAN/Fuss + QR-Code nutzen die konfigurierten Firmendaten; IBAN-Änderung im Admin erscheint sofort auf ALLEN QR-Rechnungen (auch /fees-Karten)" },
      { id: "qr_strukturiert", label: "Alle QR-Zahlteile (Bestellung/Kaution/Service/Gebühren) sind STRUKTURIERT (Typ S, Strasse/Nr/PLZ/Ort getrennt): Banking-App scannt ohne 'unstrukturiert bis 30.09.2026'-Warnung" },
      { id: "adm_company_invoice_extra", label: "FEE-Rechnung: UID/MwSt + Kontakt erscheinen im Rechnungsfuss" },
      { id: "adm_staff_assign", label: "Mitarbeiter-Tab (nur Owner): Rolle zuweisen/ändern/entfernen, Audit-Eintrag" },
      { id: "adm_staff_nav", label: "Mitarbeiter sehen nur die Tabs ihrer Rolle; Firma + Mitarbeiter nie" },
      { id: "adm_staff_gate", label: "Nutzer ohne Rolle wird vom Admin weggeleitet; Rolle entziehen sperrt wieder aus" },
      { id: "adm_staff_no_escalation", label: "Nicht-Owner kann keine Rolle setzen (RPC verweigert)" },
      { id: "adm_no_qr", label: "Bestellungen/Rechnungen-Detail zeigt keinen QR mehr, nur 'Volle Rechnung öffnen' (+ bei Miete Rechnung/Kaution-Umschalter)" },
      { id: "art_ref_visible", label: "ART-Nr (ART-XXXXXXXX) erscheint auf Inserat-Detail, Admin-Inserate, Bestell-Rechnung und FEE-Rechnung je Position" },
      { id: "adm_status_de", label: "Alle Bestell-/Rechnungs-Status im Admin sind deutsch (kein payment_marked/disputed o.ä.)" },
      { id: "art_ref_search_admin", label: "Admin-Inserate-Suche findet ein Inserat per ART-Nr, auch wenn beendet/alt" },
      { id: "art_ref_search_public", label: "Öffentliche Suche findet ein Inserat per ART-Nr (auch nicht-aktiv, ausser gelöscht)" },
      { id: "adm_mahn_groups", label: "Mahnungen-Cockpit gruppiert nach Jetzt fällig / Bald fällig / Pausiert; je Fall 'nächste Stufe heute/in N Tagen'" },
      { id: "adm_mahn_stepper_click", label: "Mahn-Stepper klickbar: erledigte Stufe öffnet die gesendete Mail (Text), fällige Stufe öffnet die Senden-Vorschau" },
      { id: "adm_mahn_bulk", label: "'Alle fälligen senden (N)' verschickt die fälligen Mahnungen gebündelt" },
      { id: "adm_fee_switch", label: "Übersicht-Gebühren-Karte (breit) hat Switch Bezahlt/Offen/Aufgelaufen/Gesamt; Hauptzahl + 'davon Bee-Impact' folgen der Auswahl; keine separate Bee-Impact-Karte; Switch overflowt nicht auf Mobile" },
      { id: "adm_cat_tree", label: "Kategorien-Tab: Baum auf-/zuklappbar (Chevron), Zustand bleibt nach Reload gemerkt; Alles auf/Alles zu" },
      { id: "adm_cat_search", label: "Kategorien-Suche filtert den Baum live + klappt Treffer-Äste auf; Leeren stellt den vorherigen Handzustand wieder her" },
      { id: "adm_cat_create", label: "Kategorie anlegen: Icon per Picker wählen (Haupt), Unterkategorie klappt Elternteil auf; bestehendes Haupt-Icon per Klick änderbar" },
      { id: "adm_cat_delete", label: "Kategorie löschen (Papierkorb + Bestätigung); blockt mit Meldung, wenn Unterkategorien oder Inserate hängen (Protokoll-Eintrag 'Kategorie gelöscht')" },
    ],
  },
  {
    id: "hive", title: "Hive & Gamification", icon: Monitor,
    items: [
      { id: "hive_menu", label: "'Mein Hive' im Profil-Menü erreichbar" },
      { id: "hive_loads", label: "Hive-Seite lädt: Level + Pollen-Fortschrittsbalken" },
      { id: "hive_next", label: "'Noch X Pollen bis [nächstes Level]' stimmt" },
      { id: "hive_streak", label: "Streak wird angezeigt + steigt bei täglichem Besuch" },
      { id: "hive_challenges", label: "Wöchentliche Challenges mit Live-Fortschritt" },
      { id: "chal_rotation", label: "Challenges: Hive zeigt jede Woche automatisch die Wochen-Challenges (nie mehr 'keine aktiven Challenges'); erster Besuch der Woche legt sie an" },
      { id: "chal_claim", label: "Challenge geschafft: Pollen werden automatisch einmalig gutgeschrieben, Glocke zeigt 'Challenge geschafft', Anzeige wechselt auf 'gutgeschrieben'" },
      { id: "chal_admin", label: "Admin → Challenges: Vorlagen und Sonder-Challenges anlegen, Vorlagen bearbeiten, deaktivieren; Protokoll-Einträge vorhanden" },
      { id: "hive_achievements", label: "Achievements: gesperrt/freigeschaltet korrekt" },
      { id: "hive_leaderboard", label: "Wochen-Leaderboard zeigt eigene Position" },
      { id: "hive_community", label: "Community-Hive: Impact, Mitglieder, Wochen-Pollen" },
      { id: "hive_xp_award", label: "Pollen steigt nach Interaktion (Inserat, Bewertung, Streak)" },
      { id: "hive_blueten_balance", label: "Blüten-Guthaben im Hero (Transaktion gibt Blüten = Bee-Impact ×100, Käufer + Verkäufer)" },
      { id: "hive_blueten_convert", label: "'In Pollen umwandeln' (100 Blüten = 1 Pollen): Blüten runter, Pollen rauf" },
      { id: "hive_nektar_balance", label: "Nektar-Balance wird im Hero angezeigt" },
      { id: "hive_nektar_catalog", label: "Belohnungs-Katalog (Spotlight, Patenschaften, ...) sichtbar" },
      { id: "hive_nektar_redeem", label: "Belohnung einlösen: Bestätigung, Inserat-Picker (Spotlight/Stempel), Nektar abgezogen" },
      { id: "hive_header_badge", label: "Header (Desktop): Level + Nektar-Badge mit Dropdown; Mobile: Nektar im Profil/Settings" },
      { id: "hive_nektar_toast", label: "Nektar-Toast erscheint nach Meilenstein (z.B. 5-Sterne, Level-Up)" },
    ],
  },
  {
    id: "profile", title: "Profil & Verkäufer-Ansicht", icon: Monitor,
    items: [
      { id: "pf_public", label: "Öffentliches Verkäufer-Profil lädt (Inserate, Bewertungen)" },
      { id: "pf_rating", label: "Verkäufer-Bewertung & Trust-Level sichtbar" },
      { id: "pf_business", label: "Unternehmen-Badge + Firmenname (falls gewerblich)" },
      { id: "pf_fav_seller", label: "Verkäufer als Favorit speichern" },
      { id: "pf_note", label: "Private Notiz zum Verkäufer speichern (nur für dich, bleibt nach Reload)" },
      { id: "pf_stats", label: "Verkäufer-Statistiken: Verkäufe, Verkaufsrate, Ø Antwortzeit" },
    ],
  },
  {
    id: "settings", title: "Einstellungen", icon: Monitor,
    items: [
      { id: "set_tabs", label: "Tab-Navigation funktioniert" },
      { id: "set_name", label: "Anzeigename ändern + speichern" },
      { id: "set_avatar", label: "Profilbild hochladen funktioniert (kein Fehler mehr) und erscheint auf Profil + Inserat-Detail" },
      { id: "set_account_type", label: "Kontotyp Privat/Unternehmen + Firmenname/UID speichern" },
      { id: "set_bio", label: "Über mich (Bio) ändern + speichern" },
      { id: "set_bee_rate", label: "Bee-Rate Default wählen + speichern" },
      { id: "set_verify_email", label: "E-Mail-Verifizierung Status korrekt" },
      { id: "set_verify_phone", label: "Telefon verifizieren" },
      { id: "set_verify_address", label: "Adresse verifizieren" },
      { id: "set_verify_id", label: "ID hochladen funktioniert" },
      { id: "set_verify_xp", label: "Vollständige Verifizierung → Pollen + 'Vollständig'-Achievement" },
      { id: "set_iban", label: "IBAN eingeben + speichern: formatiert live in 4er-Blöcke, kappt hart bei 21 Zeichen (langer Müll wird abgeschnitten), nur CH/LI mit gültiger Prüfsumme speicherbar; gleiche Regeln im Admin-Firma-Tab" },
      { id: "set_address_auto", label: "Strassen-Autocomplete (geo.admin.ch)" },
      { id: "set_address_save", label: "Hauptadresse speichern" },
      { id: "set_extra_addr", label: "Lieferadresse anlegen + bearbeiten + löschen" },
      { id: "order_addr_pick", label: "Bestellseite (Kauf ODER gewonnene Auktion, Versandartikel): Käufer kann bei 'Lieferadresse' über 'Ändern' zwischen Hauptadresse und Lieferadressen wählen; Verkäufer sieht die gewählte Adresse im Versandblock" },
      { id: "order_addr_lock", label: "Nach 'versendet' verschwindet der Ändern-Knopf; späteres Bearbeiten/Löschen der Adresse in den Einstellungen ändert die Bestellung NICHT (Schnappschuss)" },
      { id: "set_notifications", label: "Benachrichtigungs-Einstellungen speichern" },
      { id: "set_noti_wirkung", label: "E-Mail-Häkchen wirken: bei AN kommt die Mail wirklich an (Absender noreply@beedaro.ch, Beedaro-Design mit Logo), bei AUS nicht; Glocke kommt unabhängig davon immer" },
      { id: "set_noti_worker", label: "Versand-Worker: pending-Mails in Admin → E-Mails wechseln innert ~1 Minute auf 'sent' (auch Mahnungen aus dem Mahnwesen)" },
      { id: "set_push_enable", label: "Push auf diesem Gerät aktivieren: Knopf in Einstellungen → Benachrichtigungen fragt Browser-Berechtigung, danach Badge AKTIV; Deaktivieren entfernt das Gerät" },
      { id: "set_push_receive", label: "Push kommt an: Benachrichtigung (z.B. neues Gebot / neue Nachricht) erscheint als System-Push auf dem Gerät, Klick öffnet die richtige Seite; Häkchen AUS = kein Push" },
      { id: "set_push_ios", label: "iPhone: Push funktioniert NUR in der installierten App (Zum Home-Bildschirm); Einstellungs-Box erklärt das, wenn im Safari-Tab geöffnet" },
      { id: "set_noti_auction_lead", label: "Auktion endet bald: Vorlauf wählbar (5/10/30 Min vorher), Erinnerung kommt für Auktionen, auf die man geboten oder die man favorisiert hat" },
      { id: "set_noti_alle_features", label: "Benachrichtigungs-Schalter wirken: Bewertung erhalten, neue Nachricht, Inserat-Frage, Inserat läuft ab (24h vorher), Bewertungs-Erinnerung (nach 3 Tagen), Favorit-Preisänderung und Favorit verkauft (beide Opt-in)" },
      { id: "such_speichern", label: "Suche speichern: Knopf auf der Suchseite (bei Begriff oder Kategorie), gespeicherte Suchen unter Favoriten → Suchen mit Löschen; neue Treffer kommen als Benachrichtigung mit Direktlink" },
      { id: "adm_broadcast_kanaele", label: "Admin-Rundruf: Art wählbar (Wichtige Mitteilung an alle / Newsletter nur an Abonnenten), Kanäle Glocke + optional E-Mail und Push; Newsletter zeigt übersprungene Nutzer an" },
      { id: "adm_kommunikation_tab", label: "Admin-Tab Kommunikation: Banner-Editor, Rundruf-Formular und Versand-Historie an einem Ort; Banner lädt den aktuellen Zustand, Historie zeigt Rundrufe (mit Zahlen) und Banner-Änderungen" },
      { id: "adm_ticker", label: "Grosse Laufschrift (Kommunikation): eigener Text/Farbe/Platzierung, Live-Vorschau läuft; erscheint gross auf der Startseite unter dem Hero oder auf allen Seiten unter dem Header; Header-Banner grösser ohne Megafon" },
      { id: "chat_oeffentliche_fragen", label: "Nachrichten-Tab zeigt auch öffentliche Inserat-Fragen (Chip 'Öffentlich', Inserat-Bild); Fragen-Bereich unterm Inserat mit Namen an JEDER Nachricht ('Du · Name'), Senden-Knopf, Chat-Nachrichten lösen Mail/Push aus" },
      { id: "badge_404", label: "Falsche URL aufrufen (z.B. beedaro.ch/gibtsnicht): 404-Seite mit Bienen-Badge 'Diese Seite wurde weggeschnitten'; auf 'So funktioniert's' klebt der Badge als Stempel auf der Bee-Rate-Box (nur Desktop)" },
      { id: "easter_egg_biene", label: "Geduldsprobe: Ein paar Minuten auf der Seite bleiben. Irgendwann fliegt etwas durchs Bild. Anklicken, bevor es weg ist" },
      { id: "ins_kamera_mobil", label: "Inserieren am Handy: Fotografieren-Knopf öffnet direkt die Kamera; Aufnahme landet in der Bilderliste" },
      { id: "ins_abholadresse", label: "Inserat mit Abholung erstellen: Abholadresse wählbar (Hauptadresse = Standard, oder Lieferadresse aus Einstellungen); nach Kauf sieht der Käufer die gewählte Adresse auf der Bestellseite" },
      { id: "reg_anzeigename", label: "Neu registrieren: Feld 'Anzeigename (optional)' ausfüllen; Profil zeigt danach diesen Namen (leer gelassen: Vorname)" },
      { id: "ins_katalog_stil", label: "Inserieren-Seite: neuer Katalog-Stil (eckige Karten, Ink-Rahmen, Mono-Labels, gelber Veröffentlichen-Knopf); alles wie gewohnt bedienbar, nichts abgeschnitten" },
      { id: "chat_loeschen", label: "Nachrichten-Tab: Gespräch entfernen (Desktop: Papierkorb beim Drüberfahren, Handy: nach links wischen); landet im Archiv-Pill und ist dort wiederherstellbar; Gespräch zu verkauftem Inserat ist ausgegraut mit Chip 'Verkauft'" },
      { id: "chat_pills_suche", label: "Nachrichten-Tab: Pills Alle/Aktiv/Ungelesen/Archiv durchklicken; Lupe öffnen und nach einem Wort aus einer alten Nachricht suchen: Gespräch erscheint mit der Fundstelle in der Vorschauzeile" },
      { id: "home_neuerungen", label: "Startseite: Zahlen-Leiste unterm Hero, fünf Format-Kacheln (führen in die vorgefilterte Suche), Sektion 'Endet bald' mit laufendem Countdown (unter 1 Std. wird der Chip gelb), Neu-Chip auf Tierbedarf, Beta-Band 'Gründungsmitglied' unten" },
      { id: "ins_geplant", label: "Inserat mit 'Später veröffentlichen' erstellen (Schalter über der Aktionsleiste, Zeitpunkt z.B. in 5 Min.): nach der Admin-Freigabe erscheint es in Meine Inserate als 'Geplant' und geht zur gewählten Zeit automatisch live (Glocke/Push 'Dein Inserat ist jetzt live')" },
      { id: "ins_ki", label: "Foto hochladen und 'Mit KI ausfüllen' drücken: Titel, Beschreibung, Zustand und Kategorie werden aus dem Bild erkannt, darunter eine Preisschätzung; eigene Texte bleiben unangetastet (Felder vorher mal absichtlich füllen und prüfen)" },
      { id: "ins_ki_streng", label: "KI-Ehrlichkeit prüfen: Foto mit sichtbaren Mängeln (Kratzer, Vergilbung) hochladen; die Beschreibung nennt die Mängel konkret, der Zustand fällt entsprechend streng aus und es wird kein Zubehör erwähnt, das nicht im Bild ist" },
      { id: "ins_ki_variante", label: "KI-Titel bzw. KI-Text mehrfach drücken: es kommt jedes Mal eine neue, anders formulierte Variante, auch wenn schon Text dasteht" },
      { id: "ins_geplant_tab", label: "Geplante Inserate: eigener 'Geplant'-Tab in Meine Inserate und im Admin-Inserate-Tab, mit sichtbarer Startzeit ('Geht live am ...') und 'Jetzt veröffentlichen'-Knopf, auch am Handy" },
      { id: "mieten_periodenpreis", label: "Mieten: Wochen-/Monatspreis wird pro Periode gerechnet (11 Tage à 50/Woche = 2 Wochen = CHF 100), Vorschau-Box zeigt 'X Tage = Y Wochen'" },
      { id: "kauf_adresse_pflicht", label: "Sofortkauf und Gebot ohne Lieferadresse blockiert mit Hinweis aufs Profil (auch im Auktions-Modal)" },
      { id: "ord_rechnung_beide", label: "QR-Rechnung auf der Bestellseite für Käufer UND Verkäufer sichtbar (Verkäufer: eigene Rechnung-Box rechts)" },
      { id: "ord_rechnung_detail", label: "Rechnung ausgeschrieben: Versandart konkret (Paket B-Post etc.), bei Miete Mietdauer + Kaution als eigene Position, Total = Miete + Versand + Kaution (identisch mit QR-Betrag)" },
      { id: "lc_abholung_zahlung", label: "Nur Abholung: Zahlungs-Schalter (Barzahlung/TWINT/Überweisung) erscheinen im Abhol-Block, Barzahlung vorausgewählt, Veröffentlichen ohne Sackgasse" },
    ],
  },
  {
    id: "pages", title: "Seiten & Inhalte", icon: Monitor,
    items: [
      { id: "pg_home", label: "Homepage lädt korrekt" },
      { id: "pg_showcase", label: "Schaufenster: Verkäufer mit aktivem Showcase + Inserate-Grid sichtbar (Nektar-Einlösung)" },
      { id: "pg_hero_search", label: "Hero: Suchfeld (Enter -> /search?q=) + 'Gratis inserieren'-CTA -> /listings/new" },
      { id: "pg_hero_2lines", label: "Hero: jede Headline exakt 2 Zeilen (auch mobil), Highlight-Wisch + Effekte auf allen Slides" },
      { id: "pg_hero_beta_dwell", label: "Beta-Willkommens-Slide steht ~12s (andere ~6.5s), CTAs 'So funktioniert die Beta' -> /beta und 'Mitarbeiter werden' -> /bewerben" },
      { id: "pg_beta_intro", label: "/beta: 'Kurz erklärt'-Sektion oben in einfachen Worten (jeder mit Konto ist automatisch Tester, Feedback-Knopf, Checkliste freiwillig, Link Mitarbeiter werden)" },
      { id: "pg_beta_verstaerkung", label: "Nach dem Testen: 5 Kollegen auf die Plattform geholt, jeder mit ~10 Inseraten in verschiedenen Kategorien (Marktplatz füllen)" },
      { id: "pg_bewerben_hinweis", label: "/bewerben: Hinweisbox erklärt, dass es KEINE Tester-Bewerbung gibt (jedes Konto testet automatisch mit), Link zu /beta" },
      { id: "pg_bewerben_mitarbeiter", label: "/bewerben: Mitarbeiter-Funktionen (Support/Moderation/Finanzen/Manager) je mit Erklärung + sichtbaren Admin-Bereichen; nur EINE Stelle pro Person, nach dem Klick sind die anderen Karten gesperrt" },
      { id: "pg_bewerben_manual", label: "Bewerbung schaltet NIE selbst eine Rolle frei; Owner-Glocke 'Neue Bewerbung'; Admin-Übersicht: 'Rolle vergeben' springt in den Mitarbeiter-Tab, 'Erledigt' und 'Absagen' räumen die Karte" },
      { id: "pg_bewerben_absage", label: "Absagen: Bewerber-Glocke 'Leider müssen wir dir mitteilen...', /bewerben zeigt die Karte als 'Abgesagt' (gesperrt), eine ANDERE Stelle wird wieder wählbar" },
      { id: "pg_empty_ctas", label: "Leere Zustände mit CTA (Verkäufe, Suche, Bestellung-404 -> Käufe/Verkäufe)" },
      { id: "pg_help", label: "Hilfe: FAQ-Suche & aufklappbare Antworten" },
      { id: "pg_how", label: "So funktionierts-Seite" },
      { id: "pg_impact", label: "Bee-Impact-Seite mit Live-Counter" },
      { id: "pg_about", label: "Über BEEDARO-Seite" },
      { id: "pg_contact", label: "Kontakt-Formular absenden" },
      { id: "pg_terms", label: "AGB-Seite" },
      { id: "pg_privacy", label: "Datenschutz-Seite" },
      { id: "pg_imprint", label: "Impressum-Seite" },
      { id: "pg_footer_links", label: "Alle Footer-Links funktionieren" },
      { id: "pg_seo_basics", label: "SEO: Inserat teilen zeigt Titel + Bild-Vorschau (WhatsApp/Chat); neu freigegebene Inserate zeigen sofort den richtigen Seitentitel (kein 'nicht gefunden' im Tab)" },
    ],
  },
  {
    id: "mobile", title: "MOBILE (auf Handy testen!)", icon: Smartphone, highlight: true,
    items: [
      { id: "mob_header", label: "Header: Hamburger-Menü öffnet; Logo gut lesbar (140px); Header klebt beim Scrollen oben (auch Desktop)" },
      { id: "mob_seller_card", label: "Inserat-Detail Verkäuferkarte: Bewertung bricht nicht mitten in der Klammer um ('1 Bewertung' Singular), 'ALLE ARTIKEL' ragt nicht rechts raus" },
      { id: "mob_menu_links", label: "Mobile Menü: alle Links funktionieren, inkl. 'Gebühren & Beiträge' (und Admin Dashboard für Staff)" },
      { id: "mob_kaeufe_verkaeufe", label: "Meine Käufe / Meine Verkäufe (Handy): Karten-Liste statt seitlich scrollender Tabelle, alles lesbar (Titel, Referenz, Gegenpartei, Preis, Status), Tipp öffnet die Bestellung" },
      { id: "mob_search", label: "Suche-Tab (Bottom-Nav) zeigt das Suchfeld OBEN auf der Suchseite (Tastatur geht auf); im Hamburger-Menü gibt es KEIN Suchfeld mehr" },
      { id: "mob_home_hero", label: "Homepage Hero: kein leerer Platz, Bilder korrekt" },
      { id: "mob_home_cats", label: "Kategorien-Grid: nicht abgeschnitten, immer ganz sichtbar" },
      { id: "mob_hero_swipe", label: "Hero: Wischen nach links/rechts wechselt die Slide (vertikales Scrollen funktioniert weiter)" },
      { id: "mob_glocke", label: "Glocke im Handy-Header: öffnet Benachrichtigungen über die volle Breite, Ankündigungen mit ganzem Text und Öffnen-Link" },
      { id: "mob_plus_gross", label: "Gelber Inserieren-Knopf in der unteren Leiste: gross, gut zu treffen, führt zu Inserat erstellen" },
      { id: "mob_listing_card", label: "Listing-Cards: sauberes Layout" },
      { id: "mob_listing_detail", label: "Inserat-Detail: Bilder, Chat, Buttons sichtbar; einspaltig, KEIN seitliches Scrollen oder abgeschnittener Header (auf echtem Handy testen)" },
      { id: "mob_my_listings_actions", label: "Meine Inserate (Handy): Aktions-Knöpfe (Bearbeiten/Ähnliches/Statistik/...) als sauberes 3er-Raster, alle gleich breit, nichts zerfleddert" },
      { id: "mob_lightbox", label: "Lightbox: Bild & X-Button erreichbar" },
      { id: "mob_gallery_swipe", label: "Inserat-Bilder mit dem Finger wischbar (links/rechts); Tipp aufs Bild öffnet weiterhin die Lightbox, ein Wisch nicht; AUCH in der Lightbox wischbar (Wisch schliesst sie nicht)" },
      { id: "mob_buybox_order", label: "Inserat-Detail mobil: Reihenfolge Bilder -> Titel/Preis/Kaufbox -> Rest (Desktop unverändert 2-spaltig); Bee-Impact-Box hat schwarzen Rahmen" },
      { id: "mob_cta_bar", label: "Kauf-Leiste (Preis + Jetzt kaufen/Jetzt bieten/Anfragen) klebt über der Bottom-Nav, sobald die Kaufbox aus dem Bild ist; nie beim eigenen Inserat; Tipp springt zur Kaufbox" },
      { id: "mob_map_hidden", label: "Standort-Karte mobil ausgeblendet, Ort + 'Route planen' bleiben" },
      { id: "mob_listing_form", label: "Inserieren-Formular: alle Felder nutzbar; Bee-Impact-Kacheln kompakt und vollständig lesbar (nichts abgeschnitten, Texte bündig)" },
      { id: "mob_ship_modal", label: "Versand-Modal passt auf den Bildschirm" },
      { id: "mob_settings", label: "Einstellungen: Tabs als Leiste nutzbar" },
      { id: "mob_order", label: "Bestellseite & QR-Rechnung lesbar" },
      { id: "mob_chat", label: "Chat bedienbar" },
      { id: "mob_footer", label: "Footer: Links erreichbar, kein Overlap" },
      { id: "mob_feedback_btn", label: "Feedback-Button erreichbar (nicht im Weg)" },
      { id: "mob_tap_targets", label: "Buttons gross genug zum Tippen (min 44px)" },
      { id: "mob_no_hscroll", label: "Kein horizontales Scrollen auf keiner Seite" },
      { id: "mob_landscape", label: "Landscape-Modus: kein Layout-Bruch" },
      { id: "mob_pwa_install", label: "Als App installieren: Android/Chrome bietet 'App installieren' an (Menü), iPhone über Teilen -> 'Zum Home-Bildschirm'; heisst 'Beedaro' (nicht BEEDARO), startet im eigenen Fenster ohne Browserleiste" },
      { id: "mob_pwa_splash", label: "App-Start zeigt kurze Beedaro-Animation (Logo + Honig-Balken + Claim, ~1.5s), nur in der installierten App, einmal pro Start; im Browser testbar über /?splash=1" },
    ],
  },
  {
    id: "design", title: "Design, Stabilität & Performance", icon: Monitor,
    items: [
      { id: "ds_load", label: "Seiten laden in < 3 Sekunden" },
      { id: "ds_fonts", label: "Schriften korrekt (General Sans + Manrope)" },
      { id: "ds_colors", label: "Farben konsistent (Gelb = Marke, Teal = Buttons)" },
      { id: "ds_buttons_pill", label: "Buttons als Pillen (Hero-CTAs, Kaufen/Gebot/Miete, Favoriten) durchgehend rund" },
      { id: "ds_cards_round", label: "Inserat-Karten: runde Ecken, dezenter Schatten, Pill-Badges (überall gleich)" },
      { id: "ds_console", label: "Keine Fehler in der Browser-Konsole" },
      { id: "ds_typos", label: "Keine Tippfehler in Texten" },
      { id: "ds_links", label: "Keine toten Links" },
      { id: "ds_images", label: "Keine fehlenden Bilder/Icons" },
      { id: "ds_print", label: "Drucken: Header/Footer ausgeblendet" },
    ],
  },
];

const STATUS_ICON = {
  0: { icon: Circle, color: "#aaa", label: "Nicht getestet" },
  1: { icon: CheckCircle, color: "#5B8C5A", label: "OK" },
  2: { icon: AlertTriangle, color: "#F4A100", label: "Teilweise" },
  3: { icon: AlertTriangle, color: "#c62828", label: "Kaputt" },
};

export default function BetaTestPage() {
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState({});
  const [openSections, setOpenSections] = useState({ mobile: true });
  // "Kurz erklaert"-Box: offen als Standard, Zustand bleibt via localStorage
  const [introOpen, setIntroOpen] = useState(true);
  const [repOpen, setRepOpen] = useState(false);
  // Top-Melder: gezaehlt werden die melder-Eintraege im REP_LOG selbst, also
  // nur Meldungen, die zu einem Fix/Feature gefuehrt haben (Checklisten-Klicks
  // und Meldungen ohne Substanz zaehlen nicht; muendliche Meldungen schon).
  const topMelder = melderRanking();
  useEffect(() => {
    try { const v = localStorage.getItem("beta_intro_open"); if (v !== null) setIntroOpen(v === "1"); } catch {}
  }, []);
  const toggleIntro = () => setIntroOpen(o => {
    try { localStorage.setItem("beta_intro_open", o ? "0" : "1"); } catch {}
    return !o;
  });
  const [submitted, setSubmitted] = useState(false);
  const [testerName, setTesterName] = useState("");
  const [userId, setUserId] = useState(null);
  const [submittedLabels, setSubmittedLabels] = useState(() => new Set());

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (data) setTesterName(data.display_name || "");
        loadSubmitted(user.id);
      }
    }
    loadUser();
  }, []);

  // Bereits abgeschickte Test-Punkte dieses Users (page_url '/beta') →
  // bleiben über Refresh gesperrt, kein Doppel-Absenden.
  const loadSubmitted = async (uid) => {
    if (!uid) return;
    const { data } = await supabase
      .from("beta_feedback")
      .select("title")
      .eq("user_id", uid)
      .eq("page_url", "/beta");
    const set = new Set();
    (data || []).forEach(r => {
      const m = /^\[(OK|PARTIAL|BROKEN)\]\s+(.*)$/.exec(r.title || "");
      if (m) set.add(m[2]);
    });
    setSubmittedLabels(set);
  };
  const isLocked = (item) => submittedLabels.has(item.label);

  const toggle = (id) => {
    setResults(p => ({ ...p, [id]: ((p[id] || 0) + 1) % 4 }));
  };

  const totalItems = TESTS.reduce((n, t) => n + t.items.length, 0);
  const tested = Object.values(results).filter(v => v > 0).length;
  const okCount = Object.values(results).filter(v => v === 1).length;
  const partialCount = Object.values(results).filter(v => v === 2).length;
  const brokenCount = Object.values(results).filter(v => v === 3).length;

  const submitAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    for (const test of TESTS) {
      for (const item of test.items) {
        if (isLocked(item)) continue;
        const s = results[item.id] || 0;
        if (s > 0) {
          await supabase.from("beta_feedback").insert({
            user_id: user?.id || null,
            display_name: testerName,
            page_url: "/beta",
            feedback_type: s === 3 ? "bug" : "feedback",
            title: `[${s === 1 ? "OK" : s === 2 ? "PARTIAL" : "BROKEN"}] ${item.label}`,
            description: notes[item.id] || null,
            browser_info: navigator.userAgent.slice(0, 200),
            screen_size: `${window.innerWidth}x${window.innerHeight}`,
          });
        }
      }
    }
    if (user) await loadSubmitted(user.id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <CheckCircle size={60} color="#5B8C5A" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, fontFamily: fonts.head }}>Danke, {testerName || "Tester"}!</h2>
          <p style={{ fontSize: 15, color: colors.muted, marginTop: 8 }}>{tested} Features getestet: {okCount} OK, {partialCount} teilweise, {brokenCount} kaputt</p>
          <p style={{ fontSize: 13, color: colors.muted, marginTop: 12 }}>Deine Ergebnisse wurden gespeichert.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{
        background: `linear-gradient(135deg, ${colors.dark} 0%, #2a2520 100%)`,
        padding: "40px 20px 44px", textAlign: "center", color: "#fff",
      }}>
        <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 0, background: colors.yellow, color: colors.dark, fontSize: 11, fontWeight: 800, marginBottom: 12, letterSpacing: ".06em" }}>BETA TEST</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: fonts.head, margin: "0 0 8px" }}>BEEDARO Funktionstest</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", maxWidth: 500, margin: "0 auto" }}>
          Gehe jede Funktion durch und klicke zum Bewerten. Grau → Grün (OK) → Gelb (Teilweise) → Rot (Kaputt).
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Kurz erklaert: die Beta in menschlichen Worten (Tester = alle Konten) */}
        <div style={{ background: "#fff", border: `1px solid ${colors.dark}`, boxShadow: "4px 4px 0 rgba(20,17,13,.12)", padding: introOpen ? "20px 22px 18px" : "14px 22px", marginBottom: 20 }}>
          <div onClick={toggleIntro} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: introOpen ? 12 : 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "#0B5E5C", fontFamily: "'Space Mono', ui-monospace, monospace" }}>
              Kurz erklärt
            </p>
            <ChevronDown size={16} color={colors.muted} style={{ transform: introOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </div>
          {introOpen && (
          <div style={{ display: "grid", gap: 12, fontSize: 13.5, lineHeight: 1.65, color: colors.dark }}>
            <p style={{ margin: 0 }}>
              <strong>Was hier läuft.</strong> BEEDARO ist noch nicht offen für alle.
              Du gehörst zu den wenigen, die schon drin sind. Betrachte es als
              Baustellenbesichtigung, nur dass du den Helm behalten darfst.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Du bist schon Tester.</strong> Kein Formular, kein Casting:
              wer ein Konto hat, testet mit. Das war die ganze Aufnahmeprüfung.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Was du tun sollst.</strong> Benutz die Seite wie ein ganz
              normaler Kunde: stöbern, kaufen, verkaufen, bieten, mieten. Läuft
              alles, gut. Klemmt etwas, sag es uns. Auch Kleinigkeiten. Gerade
              Kleinigkeiten.
            </p>
            <p style={{ margin: 0 }}>
              <strong>So meldest du was.</strong> Unten rechts schwebt auf jeder
              Seite ein Knopf mit Sprechblase. Ein Tipp darauf, und du kannst die
              Punkte der Seite abhaken oder frei schreiben: Bug, Idee oder Frage.
              Alles landet ungefiltert bei Denis. Kein Ticket-System, keine
              Warteschleife.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Die Liste da unten.</strong> Für Gründliche. Wer mag, hakt
              Punkt für Punkt ab. Pflicht ist sie nicht, Ruhm gibt es trotzdem.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Danach: hol Verstärkung.</strong> Ein Marktplatz mit leeren
              Regalen ist nur ein Regal. Wenn du durch bist, schnapp dir fünf
              Kollegen und hol sie auf die Plattform. Jeder stellt zehn Inserate
              ein, quer durch die Kategorien: dein Keller hat genug Inventar,
              ihrer auch. So ist der Marktplatz gefüllt, bevor die Türen richtig
              aufgehen.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Lust auf mehr?</strong> Wir suchen Mitarbeiter für Support,
              Moderation, Finanzen und Manager. Eine Stelle pro Person, Denis
              meldet sich persönlich.{" "}
              <a href="/bewerben" style={{ color: "#0B5E5C", fontWeight: 700, textDecoration: "none" }}>Mitarbeiter werden</a>
            </p>
            <p style={{ margin: 0, paddingTop: 12, borderTop: "1px solid rgba(20,17,13,0.12)" }}>
              Hier entsteht gerade etwas, das es in der Schweiz so noch nicht
              gibt. Kein Konzern, kein Investorengeld, nur eine Idee und Leute
              wie du. Jedes Inserat, jede Meldung, jeder Kollege zählt.{" "}
              <strong style={{ background: "#F4C03F", padding: "0 4px" }}>Machen wir BEEDARO gross.</strong>
            </p>
            <p style={{ margin: 0, fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 12, letterSpacing: ".04em", color: "rgba(20,17,13,0.55)" }}>
              PS: Verchauf din Scheiss. ;)
            </p>
          </div>
          )}
        </div>

        {/* ── REPARATUR-LOG: was seit Beta-Start gefixt wurde ── */}
        <div style={{ background: "#fff", border: `1px solid ${colors.dark}`, boxShadow: "4px 4px 0 rgba(20,17,13,.12)", padding: repOpen ? "20px 22px 18px" : "14px 22px", marginBottom: 20 }}>
          <div onClick={() => setRepOpen(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: repOpen ? 12 : 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "#0B5E5C", fontFamily: "'Space Mono', ui-monospace, monospace" }}>
              Reparatur-Log · {REP_LOG.reduce((s, t) => s + t.punkte.length, 0)} Einträge
            </p>
            <ChevronDown size={16} color={colors.muted} style={{ transform: repOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </div>
          {repOpen && (
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: colors.dark }}>
              <p style={{ margin: "0 0 14px", color: colors.muted, fontSize: 12.5 }}>
                Eure Meldungen wirken. Das hier wurde seit Beta-Start gefixt oder neu gebaut, neuste zuerst.
              </p>

              {/* Top-Melder: zaehlt Log-Eintraege mit melder (= Meldungen, die
                  zu einem Fix/Feature gefuehrt haben), egal ueber welchen Kanal */}
              {topMelder.length > 0 && (
                <div style={{ border: `1px solid ${colors.dark}`, padding: "12px 14px", marginBottom: 18, background: "#FBF8F2" }}>
                  <p style={{ margin: "0 0 2px", fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#0B5E5C" }}>
                    Top-Melder · wer meldet, steigt
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 11.5, color: colors.muted }}>
                    Zählt Meldungen, die zu einem Fix oder Feature geführt haben.
                  </p>
                  {topMelder.slice(0, 5).map((r, i) => (
                    <div key={r.melder} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: i < Math.min(topMelder.length, 5) - 1 ? "1px solid rgba(20,17,13,.08)" : "none" }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11, fontWeight: 700,
                        background: i === 0 ? colors.yellow : i === 1 ? "#F9F4EC" : "transparent",
                        border: `1px solid ${i <= 1 ? colors.dark : "rgba(20,17,13,.3)"}`,
                        color: colors.dark,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 13.5, fontWeight: i === 0 ? 700 : 600, color: colors.dark, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.melder}</span>
                      <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11.5, color: colors.muted, flexShrink: 0 }}>
                        {r.meldungen} {Number(r.meldungen) === 1 ? "Meldung" : "Meldungen"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {REP_LOG.map(tag => (
                <div key={tag.datum} style={{ marginBottom: 18 }}>
                  <p style={{ margin: "0 0 8px", fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: colors.dark, borderBottom: `1px solid ${colors.dark}`, paddingBottom: 5 }}>
                    {tag.datum} <span style={{ color: colors.muted, fontWeight: 400 }}>· {tag.punkte.length} Einträge</span>
                  </p>
                  {/* Festes Raster: Typ- und Bereichs-Spalte stehen ueber alle
                      Zeilen exakt untereinander, der Text beginnt auf einer Linie */}
                  <div>
                    {tag.punkte.map((p, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 92px 1fr", alignItems: "start", columnGap: 8, padding: "6px 0", borderBottom: i < tag.punkte.length - 1 ? "1px solid rgba(20,17,13,.08)" : "none" }}>
                        <span style={{
                          marginTop: 2, fontFamily: "'Space Mono', ui-monospace, monospace",
                          fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", padding: "2px 0",
                          textAlign: "center",
                          background: p.typ === "neu" ? "#0E9493" : colors.yellow,
                          color: p.typ === "neu" ? "#fff" : colors.dark,
                        }}>
                          {p.typ === "neu" ? "NEU" : "FIX"}
                        </span>
                        <span style={{
                          marginTop: 2, fontFamily: "'Space Mono', ui-monospace, monospace",
                          fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", padding: "2px 3px",
                          border: "1px solid rgba(20,17,13,.35)", color: colors.muted, textTransform: "uppercase",
                          textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {p.bereich}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          {p.text}
                          {p.melder && (
                            <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10.5, color: "#0B5E5C" }}> · gemeldet von {p.melder}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16, fontSize: 12 }}>
          {[0, 1, 2, 3].map(s => {
            const { icon: Icon, color, label } = STATUS_ICON[s];
            return <span key={s} style={{ display: "flex", alignItems: "center", gap: 4, color }}><Icon size={14} /> {label}</span>;
          })}
        </div>

        {/* Progress */}
        <div style={{ background: "#fff", borderRadius: 0, padding: "14px 16px", border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Fortschritt</span>
            <span style={{ fontSize: 12, color: colors.muted }}>{tested}/{totalItems}</span>
          </div>
          <div style={{ height: 6, borderRadius: 0, background: colors.border }}>
            <div style={{ height: "100%", borderRadius: 0, background: colors.yellow, width: `${(tested / totalItems) * 100}%`, transition: "width .3s" }} />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12 }}>
            <span style={{ color: "#5B8C5A", fontWeight: 600 }}>{okCount} OK</span>
            <span style={{ color: "#F4A100", fontWeight: 600 }}>{partialCount} teilweise</span>
            <span style={{ color: "#c62828", fontWeight: 600 }}>{brokenCount} kaputt</span>
          </div>
        </div>

        {/* Sections */}
        {TESTS.map(section => {
          const Icon = section.icon;
          const isOpen = openSections[section.id] !== false;
          const sOk = section.items.filter(i => results[i.id] === 1).length;
          const sTotal = section.items.length;
          return (
            <div key={section.id} style={{
              marginBottom: 10, borderRadius: 0, overflow: "hidden",
              border: `1.5px solid ${section.highlight ? colors.yellow : colors.border}`,
              background: section.highlight ? colors.yellowSoft : "#fff",
            }}>
              <div onClick={() => setOpenSections(p => ({ ...p, [section.id]: !isOpen }))} style={{
                padding: "12px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Icon size={18} color={section.highlight ? colors.dark : colors.muted} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{section.title}</span>
                <span style={{ fontSize: 11, color: sOk === sTotal && sTotal > 0 ? "#5B8C5A" : colors.muted, fontWeight: 600 }}>{sOk}/{sTotal}</span>
                {isOpen ? <ChevronDown size={16} color={colors.muted} /> : <ChevronRight size={16} color={colors.muted} />}
              </div>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${section.highlight ? colors.yellow + "40" : colors.borderLt}` }}>
                  {section.items.map(item => {
                    if (isLocked(item)) {
                      return (
                        <div key={item.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, opacity: 0.55 }}>
                            <CheckCircle size={18} color={colors.muted} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, color: colors.muted, textDecoration: "line-through" }}>{item.label}</span>
                            <span style={{ fontSize: 10, color: colors.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", whiteSpace: "nowrap" }}>bereits abgeschickt</span>
                          </div>
                        </div>
                      );
                    }
                    const s = results[item.id] || 0;
                    const { icon: SI, color } = STATUS_ICON[s];
                    return (
                      <div key={item.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                        <div onClick={() => toggle(item.id)} style={{
                          padding: "10px 16px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 10,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fafaf8"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <SI size={18} color={color} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: s === 1 ? "#5B8C5A" : colors.dark, textDecoration: s === 1 ? "line-through" : "none" }}>{item.label}</span>
                        </div>
                        {(s === 2 || s === 3) && (
                          <div style={{ padding: "0 16px 10px 44px" }}>
                            <input value={notes[item.id] || ""} onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))}
                              placeholder="Was genau ist das Problem?" onClick={e => e.stopPropagation()}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 0, fontSize: 12, border: `1px solid ${colors.border}`, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={submitAll} disabled={tested === 0} style={{
          width: "100%", padding: "16px", borderRadius: 0, border: "none", marginTop: 20,
          background: tested > 0 ? colors.yellow : "#ddd", color: colors.dark,
          fontSize: 15, fontWeight: 800, cursor: tested > 0 ? "pointer" : "default",
          fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Send size={18} /> Ergebnisse absenden ({tested} Features)
        </button>
      </div>
    </div>
  );
}
