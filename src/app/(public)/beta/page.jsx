"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Circle, AlertTriangle, Send, Smartphone, Monitor, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";

const TESTS = [
  {
    id: "nav", title: "Navigation & Header", icon: Monitor,
    items: [
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
      { id: "auth_register", label: "Neues Konto erstellen" },
      { id: "auth_email_confirm", label: "Bestätigungsmail erhalten & Konto aktiviert" },
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
      { id: "sr_cards", label: "Ergebnis-Cards: Bild, Preis, Verkäufer korrekt" },
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
      { id: "lc_type_festpreis", label: "Festpreis: Preis eingeben" },
      { id: "lc_type_auktion", label: "Auktion: Startpreis + Dauer wählen" },
      { id: "lc_type_mieten", label: "Vermieten: Mietpreis + Periode wählen" },
      { id: "lc_type_gratis", label: "Gratis verschenken (Preis 0)" },
      { id: "lc_type_service", label: "Service-Inserat erstellen" },
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
    ],
  },
  {
    id: "favorites", title: "Favoriten", icon: Monitor,
    items: [
      { id: "fav_items", label: "Tab Artikel: gespeicherte Inserate, entfernen, öffnen" },
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
    ],
  },
  {
    id: "admin", title: "Admin-Bereich", icon: Monitor,
    items: [
      { id: "adm_access", label: "Nur das Admin-Konto sieht /admin (andere werden auf die Startseite umgeleitet)" },
      { id: "adm_shell", label: "Navigations-Sidebar (Übersicht/Benutzer/Inserate/Gebühren/Meldungen): Tab-Wechsel funktioniert, mobil als Top-Leiste" },
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
      { id: "set_account_type", label: "Kontotyp Privat/Unternehmen + Firmenname/UID speichern" },
      { id: "set_bio", label: "Über mich (Bio) ändern + speichern" },
      { id: "set_bee_rate", label: "Bee-Rate Default wählen + speichern" },
      { id: "set_verify_email", label: "E-Mail-Verifizierung Status korrekt" },
      { id: "set_verify_phone", label: "Telefon verifizieren" },
      { id: "set_verify_address", label: "Adresse verifizieren" },
      { id: "set_verify_id", label: "ID hochladen funktioniert" },
      { id: "set_verify_xp", label: "Vollständige Verifizierung → Pollen + 'Vollständig'-Achievement" },
      { id: "set_iban", label: "IBAN eingeben + speichern" },
      { id: "set_address_auto", label: "Strassen-Autocomplete (geo.admin.ch)" },
      { id: "set_address_save", label: "Hauptadresse speichern" },
      { id: "set_extra_addr", label: "Lieferadresse anlegen + bearbeiten + löschen" },
      { id: "set_notifications", label: "Benachrichtigungs-Einstellungen speichern" },
    ],
  },
  {
    id: "pages", title: "Seiten & Inhalte", icon: Monitor,
    items: [
      { id: "pg_home", label: "Homepage lädt korrekt" },
      { id: "pg_showcase", label: "Schaufenster: Verkäufer mit aktivem Showcase + Inserate-Grid sichtbar (Nektar-Einlösung)" },
      { id: "pg_hero_search", label: "Hero: Suchfeld (Enter -> /search?q=) + 'Gratis inserieren'-CTA -> /listings/new" },
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
    ],
  },
  {
    id: "mobile", title: "MOBILE (auf Handy testen!)", icon: Smartphone, highlight: true,
    items: [
      { id: "mob_header", label: "Header: Hamburger-Menü öffnet" },
      { id: "mob_menu_links", label: "Mobile Menü: alle Links funktionieren" },
      { id: "mob_search", label: "Suche auf kleinem Bildschirm nutzbar" },
      { id: "mob_home_hero", label: "Homepage Hero: kein leerer Platz, Bilder korrekt" },
      { id: "mob_home_cats", label: "Kategorien-Grid: nicht abgeschnitten, immer ganz sichtbar" },
      { id: "mob_listing_card", label: "Listing-Cards: sauberes Layout" },
      { id: "mob_listing_detail", label: "Inserat-Detail: Bilder, Chat, Buttons sichtbar" },
      { id: "mob_lightbox", label: "Lightbox: Bild & X-Button erreichbar" },
      { id: "mob_listing_form", label: "Inserieren-Formular: alle Felder nutzbar" },
      { id: "mob_ship_modal", label: "Versand-Modal passt auf den Bildschirm" },
      { id: "mob_settings", label: "Einstellungen: Tabs als Leiste nutzbar" },
      { id: "mob_order", label: "Bestellseite & QR-Rechnung lesbar" },
      { id: "mob_chat", label: "Chat bedienbar" },
      { id: "mob_footer", label: "Footer: Links erreichbar, kein Overlap" },
      { id: "mob_feedback_btn", label: "Feedback-Button erreichbar (nicht im Weg)" },
      { id: "mob_tap_targets", label: "Buttons gross genug zum Tippen (min 44px)" },
      { id: "mob_no_hscroll", label: "Kein horizontales Scrollen auf keiner Seite" },
      { id: "mob_landscape", label: "Landscape-Modus: kein Layout-Bruch" },
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
        <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 6, background: colors.yellow, color: colors.dark, fontSize: 11, fontWeight: 800, marginBottom: 12, letterSpacing: ".06em" }}>BETA TEST</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: fonts.head, margin: "0 0 8px" }}>BEEDARO Funktionstest</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", maxWidth: 500, margin: "0 auto" }}>
          Gehe jede Funktion durch und klicke zum Bewerten. Grau → Grün (OK) → Gelb (Teilweise) → Rot (Kaputt).
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16, fontSize: 12 }}>
          {[0, 1, 2, 3].map(s => {
            const { icon: Icon, color, label } = STATUS_ICON[s];
            return <span key={s} style={{ display: "flex", alignItems: "center", gap: 4, color }}><Icon size={14} /> {label}</span>;
          })}
        </div>

        {/* Progress */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Fortschritt</span>
            <span style={{ fontSize: 12, color: colors.muted }}>{tested}/{totalItems}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: colors.border }}>
            <div style={{ height: "100%", borderRadius: 3, background: colors.yellow, width: `${(tested / totalItems) * 100}%`, transition: "width .3s" }} />
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
              marginBottom: 10, borderRadius: 12, overflow: "hidden",
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
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 12, border: `1px solid ${colors.border}`, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
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
          width: "100%", padding: "16px", borderRadius: 10, border: "none", marginTop: 20,
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
