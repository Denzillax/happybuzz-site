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
      { id: "nav_search", label: "Suchfeld → Ergebnisse anzeigen" },
      { id: "nav_categories", label: "Kategorien-Dropdown öffnen & navigieren" },
      { id: "nav_stoebern", label: "Stöbern → Suchseite öffnen" },
      { id: "nav_inserieren", label: "Inserieren-Button → ListingForm" },
      { id: "nav_favorites", label: "Herz-Icon → Favoriten-Seite" },
      { id: "nav_notifications", label: "Glocke → Benachrichtigungen" },
      { id: "nav_profile_menu", label: "Profil-Avatar → Dropdown-Menü" },
    ],
  },
  {
    id: "auth", title: "Registrierung & Login", icon: Monitor,
    items: [
      { id: "auth_register", label: "Neues Konto erstellen" },
      { id: "auth_email_confirm", label: "Bestätigungsmail erhalten" },
      { id: "auth_login", label: "Login mit E-Mail + Passwort" },
      { id: "auth_logout", label: "Abmelden funktioniert" },
      { id: "auth_pw_reset", label: "Passwort vergessen → E-Mail erhalten" },
    ],
  },
  {
    id: "settings", title: "Einstellungen", icon: Monitor,
    items: [
      { id: "set_sidebar", label: "Sidebar-Navigation funktioniert" },
      { id: "set_name", label: "Anzeigename ändern + speichern" },
      { id: "set_bio", label: "Über mich Text ändern" },
      { id: "set_bee_rate", label: "Bee-Rate Default wählen + speichern" },
      { id: "set_verify_email", label: "E-Mail Verifizierung Status korrekt" },
      { id: "set_verify_phone", label: "Telefon → Link zu Adresse-Tab" },
      { id: "set_verify_address", label: "Postadresse → Link zu Adresse-Tab" },
      { id: "set_verify_id", label: "ID hochladen funktioniert" },
      { id: "set_iban", label: "IBAN eingeben + speichern" },
      { id: "set_address_auto", label: "Strasse-Autocomplete (geo.admin.ch)" },
      { id: "set_address_save", label: "Hauptadresse speichern" },
      { id: "set_extra_addr", label: "Weitere Lieferadresse anlegen + bearbeiten + löschen" },
      { id: "set_notifications", label: "Benachrichtigungs-Einstellungen" },
    ],
  },
  {
    id: "listing_create", title: "Inserat erstellen", icon: Monitor,
    items: [
      { id: "lc_photos", label: "Fotos hochladen (Drag & Drop)" },
      { id: "lc_photos_reorder", label: "Fotos sortieren per Drag" },
      { id: "lc_photos_delete", label: "Fotos einzeln löschen" },
      { id: "lc_title", label: "Titel eingeben (max 60 Zeichen)" },
      { id: "lc_zustand", label: "Zustand wählen (5 Stufen)" },
      { id: "lc_description", label: "Beschreibung eingeben" },
      { id: "lc_category_auto", label: "Kategorie-Autocomplete funktioniert" },
      { id: "lc_category_dropdown", label: "Kategorie-Dropdowns (Haupt/Unter/Sub)" },
      { id: "lc_type_festpreis", label: "Festpreis wählen + Preis eingeben" },
      { id: "lc_type_auktion", label: "Auktion wählen + Startpreis/Dauer" },
      { id: "lc_type_mieten", label: "Vermieten wählen + Mietpreis/Zeitraum" },
      { id: "lc_type_gratis", label: "Gratis verschenken" },
      { id: "lc_ship_toggle", label: "Versand-Slider ein/aus" },
      { id: "lc_ship_modal", label: "Versand bearbeiten → Modal öffnet" },
      { id: "lc_ship_paket", label: "Paket wählen → Gewicht → Lieferzeit → Preis" },
      { id: "lc_ship_brief", label: "Brief wählen → Format → Preis" },
      { id: "lc_ship_other", label: "Andere Versandarten → Dropdown" },
      { id: "lc_ship_free", label: "Kostenloser Versand Toggle" },
      { id: "lc_ship_price_limit", label: "Versandkosten max +CHF 5 über Tarif" },
      { id: "lc_twint", label: "TWINT-Schalter" },
      { id: "lc_pickup_toggle", label: "Abholung-Slider ein/aus" },
      { id: "lc_pickup_addr", label: "Abholadresse wird korrekt angezeigt" },
      { id: "lc_bee_rate", label: "Bee-Rate zeigt Settings-Default mit 'Dein Standard'" },
      { id: "lc_publish", label: "Veröffentlichen funktioniert" },
      { id: "lc_draft", label: "Als Entwurf speichern" },
    ],
  },
  {
    id: "listing_view", title: "Inserat ansehen", icon: Monitor,
    items: [
      { id: "lv_images", label: "Bilder werden geladen" },
      { id: "lv_lightbox", label: "Klick auf Bild → Lightbox (Fullscreen)" },
      { id: "lv_lightbox_keys", label: "ESC schliesst, Pfeiltasten navigieren" },
      { id: "lv_hover_zoom", label: "Hover-Zoom auf Hauptbild" },
      { id: "lv_thumbnails", label: "Thumbnails in Lightbox anklickbar" },
      { id: "lv_favorite", label: "Herz-Button → Favorit speichern" },
      { id: "lv_share", label: "Teilen-Button → Link kopieren" },
      { id: "lv_report", label: "Melden → Report-Modal" },
      { id: "lv_chat", label: "Chat-Nachrichten senden (öffentlich/privat)" },
      { id: "lv_sofortkauf", label: "Sofortkauf funktioniert" },
      { id: "lv_auction_bid", label: "Gebot abgeben bei Auktion" },
      { id: "lv_rental_book", label: "Mieten buchen" },
      { id: "lv_similar", label: "Ähnliche Inserate werden angezeigt" },
      { id: "lv_seller_rating", label: "Verkäufer-Bewertung sichtbar" },
    ],
  },
  {
    id: "buy_flow", title: "Kaufen & Bezahlen", icon: Monitor,
    items: [
      { id: "bf_order_page", label: "Bestellungs-Seite öffnet nach Kauf" },
      { id: "bf_invoice", label: "QR-Rechnung wird generiert" },
      { id: "bf_invoice_name", label: "Rechnung zeigt echten Namen (nicht Profilname)" },
      { id: "bf_invoice_address", label: "Rechnung zeigt Adresse korrekt" },
      { id: "bf_fee_invoice", label: "Gebühren-Rechnung wird generiert" },
      { id: "bf_confirm_receipt", label: "Empfang bestätigen funktioniert" },
      { id: "bf_rating", label: "Bewertung nach Empfang abgeben" },
    ],
  },
  {
    id: "my_listings", title: "Meine Inserate", icon: Monitor,
    items: [
      { id: "ml_list", label: "Inserate-Liste wird angezeigt" },
      { id: "ml_views_favs", label: "Views + Favoriten-Zähler korrekt" },
      { id: "ml_edit", label: "Inserat bearbeiten" },
      { id: "ml_pause", label: "Inserat pausieren" },
      { id: "ml_delete", label: "Inserat löschen (Soft Delete)" },
      { id: "ml_sold", label: "Als Verkauft markieren" },
      { id: "ml_reactivate", label: "Reaktivieren funktioniert" },
    ],
  },
  {
    id: "search", title: "Suche & Filter", icon: Monitor,
    items: [
      { id: "sr_text", label: "Textsuche findet Inserate" },
      { id: "sr_category", label: "Kategorie-Filter funktioniert" },
      { id: "sr_price", label: "Preis-Filter funktioniert" },
      { id: "sr_condition", label: "Zustand-Filter funktioniert" },
      { id: "sr_sort", label: "Sortierung (Preis, Datum, Relevanz)" },
      { id: "sr_no_results", label: "Keine Ergebnisse → sinnvolle Meldung" },
    ],
  },
  {
    id: "pages", title: "Seiten & Inhalte", icon: Monitor,
    items: [
      { id: "pg_home", label: "Homepage lädt korrekt" },
      { id: "pg_help", label: "Hilfe-Seite: Suche + FAQs" },
      { id: "pg_how", label: "So funktionierts-Seite" },
      { id: "pg_impact", label: "Bee-Impact-Seite mit Live-Counter" },
      { id: "pg_about", label: "Über BEEDARO-Seite" },
      { id: "pg_terms", label: "AGB-Seite" },
      { id: "pg_privacy", label: "Datenschutz-Seite" },
      { id: "pg_imprint", label: "Impressum-Seite" },
      { id: "pg_contact", label: "Kontakt-Formular" },
    ],
  },
  {
    id: "mobile", title: "MOBILE (auf Handy testen!)", icon: Smartphone, highlight: true,
    items: [
      { id: "mob_header", label: "Header: Hamburger-Menu öffnet Sliding-Menu" },
      { id: "mob_menu_links", label: "Mobile Menu: Alle Links funktionieren" },
      { id: "mob_search", label: "Suchfeld nutzbar auf kleinem Bildschirm" },
      { id: "mob_home_hero", label: "Homepage Hero: kein leerer Platz, Bilder korrekt" },
      { id: "mob_home_cats", label: "Kategorien-Grid: scrollbar, nicht abgeschnitten" },
      { id: "mob_listing_card", label: "Listing-Cards: sauberes Layout, Bild + Preis" },
      { id: "mob_listing_detail", label: "Inserat-Detail: Bilder, Chat, Buttons alles sichtbar" },
      { id: "mob_lightbox", label: "Lightbox: Bild wird richtig angezeigt, X-Button erreichbar" },
      { id: "mob_listing_form", label: "Inserieren-Formular: alle Felder nutzbar" },
      { id: "mob_ship_modal", label: "Versand-Modal: passt auf kleinen Bildschirm" },
      { id: "mob_settings", label: "Settings: Tabs als horizontale Leiste" },
      { id: "mob_settings_forms", label: "Settings: Alle Formulare bedienbar" },
      { id: "mob_search_filter", label: "Suche: Filter nutzbar auf Mobile" },
      { id: "mob_order_page", label: "Bestell-Seite: Layout korrekt" },
      { id: "mob_invoice", label: "Rechnung: lesbar (QR-Code sichtbar)" },
      { id: "mob_footer", label: "Footer: Links erreichbar, kein Overlap" },
      { id: "mob_feedback_btn", label: "Feedback-Button erreichbar (nicht im Weg)" },
      { id: "mob_text_size", label: "Texte: lesbar, nicht zu klein" },
      { id: "mob_tap_targets", label: "Buttons/Links: gross genug zum Tippen (min 44px)" },
      { id: "mob_scroll", label: "Kein horizontales Scrollen auf keiner Seite" },
      { id: "mob_orientation", label: "Landscape-Modus: kein Layout-Bruch" },
    ],
  },
  {
    id: "design", title: "Design & Performance", icon: Monitor,
    items: [
      { id: "ds_load_time", label: "Seiten laden in < 3 Sekunden" },
      { id: "ds_fonts", label: "Schriften laden korrekt (Manrope + Staatliches)" },
      { id: "ds_colors", label: "Farben konsistent (Gelb, Dunkel, Creme)" },
      { id: "ds_typos", label: "Keine Tippfehler in Texten" },
      { id: "ds_broken_links", label: "Keine toten Links" },
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

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (data) setTesterName(data.display_name || "");
      }
    }
    loadUser();
  }, []);

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
