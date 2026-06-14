"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Bug, Lightbulb, HelpCircle, Send, CheckCircle, MessageCircle, Circle, AlertTriangle, ClipboardCheck, ChevronDown, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";

// ─── Page-to-Tests Mapping ─────────────────────────────────
const PAGE_TESTS = {
  "/": [
    { id: "pg_home", label: "Homepage lädt korrekt" },
    { id: "pg_hero", label: "Hero-Carousel funktioniert" },
    { id: "pg_cats", label: "Kategorien-Grid anklickbar" },
    { id: "pg_howit", label: "So funktionierts Sektion" },
    { id: "pg_impact_counter", label: "Bee-Impact Counter sichtbar" },
    { id: "pg_showcase", label: "Schaufenster: eingelöste Verkäufer mit Inseraten" },
    { id: "pg_hero_search", label: "Hero: Suchfeld führt zu /search, 'Gratis inserieren' zu /listings/new" },
  ],
  "/search": [
    { id: "sr_text", label: "Textsuche findet Inserate" },
    { id: "sr_category", label: "Kategorie-Filter" },
    { id: "sr_price", label: "Preis-Filter" },
    { id: "sr_condition", label: "Zustand-Filter" },
    { id: "sr_sort", label: "Sortierung funktioniert" },
    { id: "sr_cards", label: "Listing-Cards korrekt" },
  ],
  "/listings/new": [
    { id: "lc_photos", label: "Fotos hochladen" },
    { id: "lc_photos_sort", label: "Fotos sortieren/löschen" },
    { id: "lc_title", label: "Titel eingeben" },
    { id: "lc_zustand", label: "Zustand wählen" },
    { id: "lc_description", label: "Beschreibung eingeben" },
    { id: "lc_category", label: "Kategorie wählen (Autocomplete + Dropdown)" },
    { id: "lc_festpreis", label: "Festpreis: Preis eingeben" },
    { id: "lc_auktion", label: "Auktion: Startpreis + Dauer" },
    { id: "lc_mieten", label: "Vermieten: Mietpreis + Zeitraum" },
    { id: "lc_gratis", label: "Gratis verschenken" },
    { id: "lc_versand", label: "Versand-Toggle + Modal + Paketauswahl" },
    { id: "lc_versand_preis", label: "Versandkosten max +5 CHF" },
    { id: "lc_twint", label: "TWINT-Schalter" },
    { id: "lc_abholung", label: "Abholung: Adresse wird angezeigt" },
    { id: "lc_bee_rate", label: "Bee-Rate: Dein Standard vorausgewählt" },
    { id: "lc_publish", label: "Veröffentlichen funktioniert" },
    { id: "lc_service_block", label: "Service-Inserat blockiert, solange früherer Auftrag nicht in Rechnung gestellt" },
  ],
  "/listing/": [
    { id: "lv_images", label: "Bilder laden korrekt" },
    { id: "lv_lightbox", label: "Klick → Lightbox (Fullscreen)" },
    { id: "lv_hover_zoom", label: "Hover-Zoom auf Hauptbild" },
    { id: "lv_keys", label: "ESC/Pfeiltasten in Lightbox" },
    { id: "lv_favorite", label: "Herz-Button → Favorit" },
    { id: "lv_share", label: "Teilen-Button" },
    { id: "lv_report", label: "Melden → Modal" },
    { id: "lv_chat", label: "Chat (öffentlich/privat)" },
    { id: "lv_sofortkauf", label: "Sofortkauf" },
    { id: "lv_bid", label: "Gebot abgeben" },
    { id: "lv_similar", label: "Ähnliche Inserate" },
    { id: "lv_seller", label: "Verkäufer-Info + Bewertung" },
  ],
  "/settings": [
    { id: "set_sidebar", label: "Sidebar-Navigation" },
    { id: "set_name", label: "Anzeigename ändern" },
    { id: "set_account_type", label: "Kontotyp Privat/Unternehmen + Firma" },
    { id: "set_bee_rate", label: "Bee-Rate Default wählen" },
    { id: "set_verify", label: "Verifizierungen: Status + Aktionen" },
    { id: "set_iban", label: "IBAN speichern" },
    { id: "set_addr_auto", label: "Strasse-Autocomplete" },
    { id: "set_addr_save", label: "Adresse speichern" },
    { id: "set_extra_addr", label: "Lieferadressen anlegen/bearbeiten" },
    { id: "set_notif", label: "Benachrichtigungen" },
  ],
  "/listings": [
    { id: "ml_list", label: "Inserate werden angezeigt" },
    { id: "ml_views", label: "Views/Favoriten-Zähler" },
    { id: "ml_edit", label: "Bearbeiten funktioniert" },
    { id: "ml_pause", label: "Pausieren funktioniert" },
    { id: "ml_delete", label: "Löschen (Soft Delete)" },
    { id: "ml_sold", label: "Verkauft markieren" },
    { id: "ml_boost", label: "Boosten (Nektar) öffnet Menü" },
    { id: "ml_mobile_cards", label: "Mobile: Karten-Liste statt Tabelle" },
  ],
  "/order/": [
    { id: "bf_order", label: "Bestellseite lädt" },
    { id: "bf_invoice", label: "QR-Rechnung korrekt" },
    { id: "bf_name", label: "Echter Name auf Rechnung" },
    { id: "bf_business", label: "Firmenname + UID auf Rechnung (gewerblich)" },
    { id: "bf_address", label: "Adresse korrekt" },
    { id: "bf_confirm", label: "Empfang bestätigen" },
    { id: "bf_rating", label: "Bewertung abgeben" },
  ],
  "/favorites": [
    { id: "fav_list", label: "Favoriten werden angezeigt" },
    { id: "fav_remove", label: "Favorit entfernen" },
    { id: "fav_click", label: "Klick öffnet Inserat" },
  ],
  "/bids": [
    { id: "bd_list", label: "Gebote-Liste lädt" },
    { id: "bd_status", label: "Status korrekt (Führend/Überboten/Beendet)" },
    { id: "bd_link", label: "Klick öffnet Inserat" },
  ],
  "/bookings": [
    { id: "bk_tabs", label: "Anfragen vs. Meine Buchungen" },
    { id: "bk_action", label: "Bestätigen / Ablehnen funktioniert" },
    { id: "bk_status", label: "Buchungs-Status korrekt" },
    { id: "bk_returned", label: "Als zurückgegeben markieren" },
  ],
  "/purchases": [
    { id: "pu_list", label: "Käufe-Liste lädt" },
    { id: "pu_filter", label: "Status-Filter funktioniert" },
    { id: "pu_order", label: "Link zur Bestellseite" },
  ],
  "/sales": [
    { id: "sa_list", label: "Verkäufe-Liste lädt" },
    { id: "sa_filter", label: "Status-Filter funktioniert" },
    { id: "sa_order", label: "Link zur Bestellseite" },
  ],
  "/chat": [
    { id: "cht_list", label: "Liste: Inserat-Anker + Rollen-Chip (Kaufen/Verkaufen)" },
    { id: "cht_filter", label: "Filter Alle/Ungelesen funktioniert" },
    { id: "cht_thread_bar", label: "Thread: eine Leiste (Inserat + Profil-Link), eigene Bubbles teal" },
    { id: "cht_unread", label: "Ungelesen-Markierung" },
    { id: "cht_send", label: "Nachricht senden/empfangen" },
    { id: "cht_toggle", label: "Öffentlich ↔ Privat umschalten" },
  ],
  "/fees": [
    { id: "fe_overview", label: "Gebühren-Stufen erklärt" },
    { id: "fe_invoices", label: "Gebühren-Rechnungen aufgelistet" },
    { id: "fe_detail", label: "Rechnungs-Detail öffnet" },
  ],
  "/profile/": [
    { id: "prf_load", label: "Verkäufer-Profil lädt (Inserate, Bewertung)" },
    { id: "prf_fav", label: "Verkäufer als Favorit speichern" },
  ],
  "/user/": [
    { id: "usr_load", label: "Nutzer-Profil lädt korrekt" },
    { id: "usr_listings", label: "Inserate des Nutzers sichtbar" },
  ],
  "/hive": [
    { id: "hv_level", label: "Level + Pollen-Balken korrekt" },
    { id: "hv_blueten", label: "Blüten-Guthaben + 'In Pollen umwandeln' (100:1)" },
    { id: "hv_streak", label: "Streak angezeigt" },
    { id: "hv_challenges", label: "Challenges mit Fortschritt" },
    { id: "hv_achievements", label: "Achievements gesperrt/offen" },
    { id: "hv_leaderboard", label: "Leaderboard zeigt eigene Position" },
  ],
  "_default": [
    { id: "pg_loads", label: "Seite lädt korrekt" },
    { id: "pg_links", label: "Alle Links funktionieren" },
    { id: "pg_text", label: "Texte korrekt (keine Fehler)" },
  ],
};

const MOBILE_TESTS = [
  { id: "mob_menu", label: "Hamburger-Menu öffnet" },
  { id: "mob_scroll", label: "Kein horizontales Scrollen" },
  { id: "mob_text", label: "Texte lesbar" },
  { id: "mob_buttons", label: "Buttons gross genug zum Tippen" },
  { id: "mob_forms", label: "Formulare bedienbar" },
  { id: "mob_layout", label: "Layout bricht nicht" },
  { id: "mob_images", label: "Bilder korrekt skaliert" },
];

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug", icon: Bug, color: "#c62828" },
  { value: "feedback", label: "Feedback", icon: MessageCircle, color: "#F4C03F" },
  { value: "idea", label: "Idee", icon: Lightbulb, color: "#5B8C5A" },
  { value: "frage", label: "Frage", icon: HelpCircle, color: "#94B9C9" },
];

const STATUS_COLORS = { 0: "#bbb", 1: "#5B8C5A", 2: "#F4A100", 3: "#c62828" };
const STATUS_ICONS = { 0: Circle, 1: CheckCircle, 2: AlertTriangle, 3: AlertTriangle };
const STATUS_LABELS = { 0: "Nicht getestet", 1: "OK", 2: "Teilweise", 3: "Kaputt" };

export default function BetaFeedback() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("checklist"); // checklist | feedback
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ type: "bug", title: "", description: "" });
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState({});
  const pagePath = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [submittedLabels, setSubmittedLabels] = useState(() => new Set());

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (data) setUserName(data.display_name || "");
      }
    }
    loadUser();
  }, []);

  // Checklisten-Punkte, die dieser User für die aktuelle Seite bereits
  // abgeschickt hat → bleiben über Refresh gesperrt, kein Doppel-Absenden.
  const loadSubmitted = async (uid, path) => {
    if (!uid) { setSubmittedLabels(new Set()); return; }
    const { data } = await supabase
      .from("beta_feedback")
      .select("title")
      .eq("user_id", uid)
      .eq("page_url", path);
    const set = new Set();
    (data || []).forEach(r => {
      const m = /^\[(OK|PARTIAL|BROKEN)\]\s+(.*)$/.exec(r.title || "");
      if (m) set.add(m[2]);
    });
    setSubmittedLabels(set);
  };

  useEffect(() => {
    if (userId) loadSubmitted(userId, pagePath);
  }, [userId, pagePath, open]);

  // Get relevant tests for current page
  const getPageTests = () => {
    const path = pagePath;
    if (path === "/") return PAGE_TESTS["/"];
    for (const key of Object.keys(PAGE_TESTS)) {
      if (key !== "/" && key !== "_default" && path.startsWith(key)) return PAGE_TESTS[key];
    }
    return PAGE_TESTS["_default"];
  };

  const pageTests = getPageTests();
  const pageName = pagePath === "/" ? "Homepage" : pagePath.split("/").filter(Boolean)[0] || "Seite";
  const testedCount = [...pageTests, ...(isMobile ? MOBILE_TESTS : [])].filter(t => checks[t.id] > 0).length;
  const totalCount = pageTests.length + (isMobile ? MOBILE_TESTS.length : 0);

  const toggleCheck = (id) => setChecks(p => ({ ...p, [id]: ((p[id] || 0) + 1) % 4 }));
  const isLocked = (item) => submittedLabels.has(item.label);

  const submitChecks = async () => {
    const allTests = [...pageTests, ...(isMobile ? MOBILE_TESTS : [])];
    for (const item of allTests) {
      if (isLocked(item)) continue;
      const s = checks[item.id] || 0;
      if (s > 0) {
        await supabase.from("beta_feedback").insert({
          user_id: userId, display_name: userName, page_url: pagePath,
          feedback_type: s === 3 ? "bug" : "feedback",
          title: `[${s === 1 ? "OK" : s === 2 ? "PARTIAL" : "BROKEN"}] ${item.label}`,
          description: notes[item.id] || null,
          browser_info: navigator.userAgent.slice(0, 200),
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
        });
      }
    }
    await loadSubmitted(userId, pagePath);
    setSent(true);
    setTimeout(() => { setSent(false); setChecks({}); setNotes({}); }, 2500);
  };

  const submitFeedback = async () => {
    if (!form.title.trim()) return;
    await supabase.from("beta_feedback").insert({
      user_id: userId, display_name: userName, page_url: pagePath,
      feedback_type: form.type, title: form.title.trim(),
      description: form.description.trim() || null,
      browser_info: navigator.userAgent.slice(0, 200),
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
    });
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ type: "bug", title: "", description: "" }); }, 2000);
  };

  // Floating Button
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} title="Beta Feedback" style={{
        position: "fixed", bottom: 96, right: 32, zIndex: 9990,
        width: 48, height: 48, borderRadius: "50%",
        background: colors.teal, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(14,148,147,.4)", transition: "transform .2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <MessageSquarePlus size={22} color="#fff" />
      </button>
    );
  }

  const renderCheckItem = (item) => {
    if (isLocked(item)) {
      return (
        <div key={item.id} style={{
          padding: "8px 0", display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${colors.borderLt || "#f0f0f0"}`, opacity: 0.55,
        }}>
          <CheckCircle size={16} color={colors.muted} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: colors.muted, textDecoration: "line-through" }}>{item.label}</span>
          <span style={{ fontSize: 9, color: colors.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", whiteSpace: "nowrap" }}>bereits abgeschickt</span>
        </div>
      );
    }
    const s = checks[item.id] || 0;
    const Icon = STATUS_ICONS[s];
    return (
      <div key={item.id}>
        <div onClick={() => toggleCheck(item.id)} style={{
          padding: "8px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${colors.borderLt || "#f0f0f0"}`,
        }}>
          <Icon size={16} color={STATUS_COLORS[s]} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: s === 1 ? "#5B8C5A" : colors.dark, textDecoration: s === 1 ? "line-through" : "none" }}>{item.label}</span>
        </div>
        {(s === 2 || s === 3) && (
          <input value={notes[item.id] || ""} onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))}
            placeholder="Was genau?" onClick={e => e.stopPropagation()}
            style={{ width: "100%", padding: "4px 8px", fontSize: 11, border: `1px solid ${colors.border}`, borderRadius: 4, marginBottom: 6, boxSizing: "border-box", fontFamily: fonts.body, outline: "none" }} />
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed", bottom: 96, right: 20, zIndex: 9990,
      width: 380, maxHeight: "75vh", borderRadius: 16, overflow: "hidden",
      background: "#fff", border: `1px solid ${colors.border}`,
      boxShadow: "0 8px 32px rgba(0,0,0,.18)", fontFamily: fonts.body,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.dark, color: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MessageSquarePlus size={16} color={colors.yellow} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Beta Cockpit</span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: colors.yellow, color: colors.dark, fontWeight: 800 }}>BETA</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}><X size={16} /></button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <button onClick={() => setTab("checklist")} style={{
          flex: 1, padding: "10px", border: "none", cursor: "pointer",
          background: tab === "checklist" ? colors.yellowSoft : "transparent",
          borderBottom: tab === "checklist" ? `2px solid ${colors.yellow}` : "2px solid transparent",
          fontSize: 12, fontWeight: 700, fontFamily: fonts.body, color: colors.dark,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <ClipboardCheck size={14} /> Checkliste
          {testedCount > 0 && <span style={{ fontSize: 10, background: colors.yellow, padding: "1px 5px", borderRadius: 8, fontWeight: 800 }}>{testedCount}/{totalCount}</span>}
        </button>
        <button onClick={() => setTab("feedback")} style={{
          flex: 1, padding: "10px", border: "none", cursor: "pointer",
          background: tab === "feedback" ? colors.yellowSoft : "transparent",
          borderBottom: tab === "feedback" ? `2px solid ${colors.yellow}` : "2px solid transparent",
          fontSize: 12, fontWeight: 700, fontFamily: fonts.body, color: colors.dark,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <Bug size={14} /> Feedback
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <CheckCircle size={36} color="#5B8C5A" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Danke!</p>
            <p style={{ fontSize: 12, color: colors.muted }}>Gespeichert.</p>
          </div>
        ) : tab === "checklist" ? (
          <>
            {/* Current Page Context */}
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Seite: <strong style={{ color: colors.dark }}>{pagePath}</strong></span>
              {isMobile && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Smartphone size={10} /> Mobile</span>}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12, fontSize: 10 }}>
              {[0, 1, 2, 3].map(s => {
                const Icon = STATUS_ICONS[s];
                return <span key={s} style={{ display: "flex", alignItems: "center", gap: 2, color: STATUS_COLORS[s] }}><Icon size={10} /> {STATUS_LABELS[s]}</span>;
              })}
            </div>

            {/* Page-specific Tests */}
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
              {pageName} ({pageTests.filter(t => checks[t.id] > 0).length}/{pageTests.length})
            </div>
            {pageTests.map(renderCheckItem)}

            {/* Mobile Tests (auto-detected) */}
            {isMobile && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.dark, marginTop: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 4, background: colors.yellowSoft, padding: "6px 8px", borderRadius: 6 }}>
                  <Smartphone size={12} color={colors.yellow} /> Mobile Tests ({MOBILE_TESTS.filter(t => checks[t.id] > 0).length}/{MOBILE_TESTS.length})
                </div>
                {MOBILE_TESTS.map(renderCheckItem)}
              </>
            )}

            {/* Submit */}
            <button onClick={submitChecks} disabled={testedCount === 0} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "none", marginTop: 14,
              background: testedCount > 0 ? colors.yellow : "#ddd", color: colors.dark,
              fontSize: 13, fontWeight: 700, cursor: testedCount > 0 ? "pointer" : "default",
              fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Send size={14} /> Absenden ({testedCount})
            </button>

            <a href="/beta" style={{ display: "block", textAlign: "center", fontSize: 11, color: colors.muted, marginTop: 10, textDecoration: "none" }}>
              Alle Tests ansehen →
            </a>
          </>
        ) : (
          <>
            {/* Feedback Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 12 }}>
              {FEEDBACK_TYPES.map(t => (
                <button key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))} style={{
                  padding: "6px 2px", borderRadius: 6, border: `1.5px solid ${form.type === t.value ? t.color : colors.border}`,
                  background: form.type === t.value ? `${t.color}12` : "transparent",
                  cursor: "pointer", textAlign: "center", fontSize: 9, fontWeight: 700,
                  fontFamily: fonts.body, color: form.type === t.value ? t.color : colors.muted,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <t.icon size={14} />{t.label}
                </button>
              ))}
            </div>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Kurzbeschreibung *" maxLength={100}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              onFocus={e => e.target.style.borderColor = colors.yellow}
              onBlur={e => e.target.style.borderColor = colors.border} />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Details (optional)" maxLength={1000}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${colors.border}`, fontSize: 12, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", minHeight: 60, resize: "vertical", marginBottom: 8 }}
              onFocus={e => e.target.style.borderColor = colors.yellow}
              onBlur={e => e.target.style.borderColor = colors.border} />
            <div style={{ fontSize: 10, color: colors.muted, marginBottom: 10 }}>Seite: {pagePath}</div>
            <button onClick={submitFeedback} disabled={!form.title.trim()} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "none",
              background: form.title.trim() ? colors.yellow : "#ddd", color: colors.dark,
              fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "default",
              fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Send size={14} /> Absenden
            </button>
          </>
        )}
      </div>
    </div>
  );
}
