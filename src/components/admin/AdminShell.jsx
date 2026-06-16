"use client";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, Shield, Users, Package, Receipt, ReceiptText, ShoppingBag, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star, ArrowLeft, Download, Mail, BellRing, LineChart, Megaphone } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { TrendChart } from "@/components/admin/TrendChart";
import { bucketDaily, countByType } from "@/lib/adminAnalytics";
import BeeIcon from "@/components/shared/BeeIcon";
import { TypeBadge } from "@/components/shared/Badge";
import { colors, fonts, radius } from "@/lib/theme";
import { makeBeeRef, makeArtRef } from "@/lib/fees";
import { buildDunningEmail } from "@/lib/dunning";
import { th, td, pill, bcFieldLabel, bcInput, chartCard, chartHead, chartLabel, chartBig, chartSub, sumSeries, axisLabels } from "@/components/admin/adminStyles";

const AUDIT_META = {
  ban:                  { label: "Konto gesperrt",        Icon: Ban,         color: "#EB5E55", bg: "#FFEBEB" },
  unban:                { label: "Konto entsperrt",       Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_resolve:       { label: "Meldung erledigt",      Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_pause_listing: { label: "Inserat pausiert (Meldung)", Icon: Pause,  color: "#E65100", bg: "#FFF3E0" },
  listing_pause:        { label: "Inserat pausiert",      Icon: Pause,       color: "#E65100", bg: "#FFF3E0" },
  listing_activate:     { label: "Inserat aktiviert",     Icon: Play,        color: "#2E7D32", bg: "#E8F5E9" },
  reminder:             { label: "Mahnung gesendet",      Icon: BellRing,    color: "#E65100", bg: "#FFF3E0" },
  fee_paid:             { label: "Bezahlt + reaktiviert", Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  order_cancel:         { label: "Bestellung storniert",  Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  id_verify:            { label: "ID verifiziert",        Icon: ShieldCheck, color: "#0A7170", bg: "#E6F5F5" },
  id_reject:            { label: "ID abgelehnt",          Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  review_delete:        { label: "Bewertung gelöscht",    Icon: Star,        color: "#c62828", bg: "#FFEBEE" },
  broadcast:            { label: "Ankündigung gesendet",  Icon: Megaphone,   color: "#0E9493", bg: "#E6F5F5" },
};
const dayLabel = (ds) => {
  const d = new Date(ds), now = new Date(), DAY = 86400000;
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === t0) return "Heute";
  if (t === t0 - DAY) return "Gestern";
  return d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long" });
};

export function AdminShell({ admin }) {
  const {
    user, loading, toast, flash, tab, setTab, search, setSearch,
    stats, users, setUsers, listings, reports, setReports, orders, feeInvoices, reviews, setReviews, emailLog, setEmailLog,
    filteredUsers, visibleUsers, filteredListings, filteredOrders, filteredEmails, invoiceRows, beeInvoiceRows, feeInvoiceRows,
    overdueInvoices, overdueSum, openReports, flaggedUsers, bannedUsers, openFeeInvoices, analytics,
    gmv, avgOrder, nonCancelledOrders, topSellers,
    openUser, toggleUser, userTab, setUserTab, userListings, userFees, userInvoices, userMod, setUserMod,
    openInvoice, setOpenInvoice,
    openOrder, toggleOrder, orderDetail, orderStatusFilter, setOrderStatusFilter, orderDeposit, setOrderDeposit, orderStatusGroup, orderStatusPill, beeRefIncludes,
    invoiceType, setInvoiceType, openInvoiceKey, toggleInvoiceRow, feeLedger, feeSeller,
    mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton,
    broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, bcTargets, sendBroadcast,
    analyticsRange, setAnalyticsRange, analyticsLoading,
    auditLog, auditLoading,
    toggleBan, toggleListingStatus, cancelOrder, deleteReview, resolveReport, pauseReportedListing, statusPill, modPill, emailCard,
    NAV, pageTitle, exportCurrent, STAT_CARDS, ATTENTION, sc,
  } = admin;

  return (
    <div className="admin-shell" style={{ fontFamily: fonts.body, background: "#fff", color: colors.dark, minHeight: "100vh" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="admin-sidebar" style={{ background: "#1a1a1a", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: 11, padding: "20px 20px 18px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: colors.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BeeIcon size={18} color="#1a1a1a" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1 }}>BEEDARO</div>
            <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginTop: 3 }}>Admin</div>
          </div>
        </div>

        <nav className="admin-nav" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 10px" }}>
          {NAV.map(n => {
            const on = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setTab(n.key); setSearch(""); }} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: fonts.body, fontSize: 13, fontWeight: on ? 700 : 500, textAlign: "left",
                background: on ? "rgba(255,255,255,.08)" : "transparent",
                color: on ? "#fff" : "rgba(255,255,255,.6)",
                borderLeft: on ? `3px solid ${colors.yellow}` : "3px solid transparent",
                transition: "background .12s",
              }}>
                <n.Icon size={17} strokeWidth={2} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && <span style={{ background: "#EB5E55", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>{n.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="admin-back" style={{ marginTop: "auto", padding: "16px 18px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Zurück zur Seite
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="admin-main">

        {/* Top-Leiste */}
        <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", borderBottom: `1px solid ${colors.borderLt}`, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.head, margin: 0 }}>{pageTitle}</h1>
          <div style={{ flex: 1 }} />
          {(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices" || tab === "emails" || tab === "audit") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.cream, borderRadius: 999, padding: "8px 15px", minWidth: 220 }}>
              <Search size={15} color={colors.muted} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "users" ? "Benutzer suchen..." : tab === "listings" ? "Inserate suchen..." : tab === "orders" ? "BEE-Nummer, Artikel oder Name..." : tab === "emails" ? "Empfänger, Betreff oder Template..." : tab === "audit" ? "Aktion oder Ziel suchen..." : "Nummer (BEE/FEE) oder Name..."}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: fonts.body, color: colors.dark }} />
            </div>
          )}
          {(tab === "orders" || tab === "invoices" || tab === "users") && (
            <button onClick={exportCurrent} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.cream, color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
              <Download size={14} /> CSV
            </button>
          )}
        </header>

        <div style={{ padding: "26px 28px 90px", maxWidth: 1180 }}>

          {/* ═══ ÜBERSICHT ═══ */}
          {tab === "overview" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button onClick={() => setBroadcastOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.dark, color: "#fff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                  <Megaphone size={15} /> Ankündigung senden
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 32 }}>
                {STAT_CARDS.map((s, i) => (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: s.tint + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {s.Bee ? <BeeIcon size={17} color={s.tint} /> : <s.Icon size={17} color={s.tint} />}
                    </span>
                    <div style={{ fontSize: 27, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1.05, marginTop: 13, color: s.danger ? "#EB5E55" : colors.dark }}>
                      {s.value}{s.sub && <span style={{ fontSize: 13, fontWeight: 600, color: colors.muted }}> {s.sub}</span>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 32 }}>
                <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted }}>Umsatz (GMV)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: fonts.head, marginTop: 8 }}>CHF {fmtCHF(gmv)}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Ø Bestellwert: {avgOrder ? `CHF ${fmtCHF(avgOrder)}` : "—"} · {nonCancelledOrders.length} Käufe</div>
                </div>
                <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 10 }}>Top-Verkäufer</div>
                  {topSellers.length === 0 ? <div style={{ fontSize: 12, color: colors.muted }}>Noch keine Verkäufe.</div> : topSellers.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {s.name}</span>
                      <span style={{ color: colors.muted, flexShrink: 0, marginLeft: 8 }}>{s.count} · CHF {fmtCHF(s.sum)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: colors.muted, margin: "0 0 13px" }}>Zu prüfen</h2>
              {ATTENTION.every(a => a.n === 0) ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
                  <CheckCircle size={22} color={colors.green} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Alles ruhig</div>
                    <div style={{ fontSize: 12, color: colors.muted }}>Keine geflaggten Konten, Sperren oder offenen Meldungen.</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
                  {ATTENTION.map((a, i) => (
                    <button key={i} onClick={a.onClick} style={{
                      display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", fontFamily: fonts.body,
                      background: "#fff", border: `1px solid ${a.n > 0 ? a.color + "55" : colors.border}`, borderRadius: radius.lg, padding: "16px 18px",
                    }}>
                      <span style={{ width: 44, height: 44, borderRadius: 13, background: (a.n > 0 ? a.color : "#999") + "18", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <a.Icon size={21} color={a.n > 0 ? a.color : "#999"} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 23, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1, color: a.n > 0 ? a.color : colors.dark }}>{a.n}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ BENUTZER ═══ */}
          {tab === "users" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ k: "all", l: `Alle (${filteredUsers.length})` }, { k: "flagged", l: `Geflaggt (${flaggedUsers.length})` }, { k: "banned", l: `Gesperrt (${bannedUsers.length})` }].map(f => (
                  <button key={f.k} onClick={() => setUserMod(f.k)} style={modPill(userMod === f.k)}>{f.l}</button>
                ))}
              </div>

              {visibleUsers.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>
                  {userMod === "flagged" ? "Keine geflaggten Konten." : userMod === "banned" ? "Keine gesperrten Konten." : "Keine Benutzer gefunden."}
                </div>
              )}

              {visibleUsers.map(u => {
                const isOpen = openUser === u.id;
                const uLst = userListings[u.id] || [];
                const uFee = userFees[u.id] || [];
                const totalUserFees = uFee.reduce((s, f) => s + parseFloat(f.fee_amount), 0);
                const totalUserImpact = uFee.reduce((s, f) => s + parseFloat(f.bee_impact), 0);
                const rowTint = u.is_banned ? "#FFF6F6" : ((u.contact_violations || 0) > 0 ? "#FFFBF4" : "transparent");
                return (
                  <div key={u.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${u.is_banned ? "#f0c9c9" : colors.border}`, overflow: "hidden" }}>
                    {/* User Row */}
                    <div onClick={() => toggleUser(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: rowTint }}
                      onMouseEnter={e => { if (rowTint === "transparent") e.currentTarget.style.background = "#FAFAF8"; }}
                      onMouseLeave={e => { if (rowTint === "transparent") e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.is_banned ? "#EDEDEA" : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: u.is_banned ? "#999" : colors.dark }}>
                        {(u.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span>
                          {u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#E6F5F5", color: "#0A7170", fontWeight: 700 }}>ID</span>}
                          {u.id_document_url && !u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#FFF8E1", color: "#E65100", fontWeight: 700 }}>ID?</span>}
                          {u.is_banned && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#EB5E55", color: "#fff", fontWeight: 700 }}>GESPERRT</span>}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{u.city || "—"} · {u.created_at ? fmtDate(u.created_at) : ""}</p>
                      </div>
                      {(u.contact_violations || 0) > 0 && !u.is_banned && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#c0392b", background: "#FFEBEB", padding: "4px 10px", borderRadius: 999 }}>{u.contact_violations}× Kontakt</span>
                      )}
                      <span className="admin-hide-narrow" style={{ flexShrink: 0 }}>{pill(colors.yellowSoft, colors.dark, u.bee_level || "starter")}</span>
                      <span className="admin-hide-narrow" style={{ fontSize: 11, color: "#5B8C5A", fontWeight: 600, minWidth: 64, textAlign: "right" }}>{(u.blueten || 0).toLocaleString("de-CH")}</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleBan(u); }} style={{
                        flexShrink: 0, padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff",
                        border: `1px solid ${u.is_banned ? "#aed8b0" : "#e6a6a6"}`, color: u.is_banned ? "#2E7D32" : "#c0392b",
                      }}>{u.is_banned ? "Entsperren" : "Sperren"}</button>
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>

                    {/* User Details — aufgeklappt */}
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${colors.borderLt}` }}>

                        {/* ID-Verifizierung Bar */}
                        {(u.id_document_url || u.id_verified) && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                            background: u.id_verified ? "#E8F5E9" : "#FFF8E1",
                            borderBottom: `1px solid ${colors.borderLt}`,
                          }}>
                            <Shield size={16} color={u.id_verified ? "#2E7D32" : "#F4A100"} />
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: u.id_verified ? "#2E7D32" : "#E65100" }}>
                              {u.id_verified ? "ID verifiziert" : "ID hochgeladen — Prüfung ausstehend"}
                            </span>
                            {u.id_document_url && (
                              <a href={u.id_document_url} target="_blank" rel="noopener noreferrer"
                                style={{ padding: "4px 11px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 700, color: colors.dark, textDecoration: "none", cursor: "pointer" }}>
                                Dokument ansehen
                              </a>
                            )}
                            {u.id_document_url && !u.id_verified && (
                              <>
                                <button onClick={async () => {
                                  await supabase.from("profiles").update({ id_verified: true }).eq("id", u.id);
                                  setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_verified: true } : x));
                                  flash("ID verifiziert");
                                  admin.logAdmin("id_verify", "user", u.display_name);
                                }} style={{ padding: "4px 11px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                  Bestätigen
                                </button>
                                <button onClick={async () => {
                                  // Datei aus Storage löschen
                                  const path = `${u.id}/id-document`;
                                  const { data: files } = await supabase.storage.from("id-documents").list(u.id);
                                  if (files?.length) await supabase.storage.from("id-documents").remove(files.map(f => `${u.id}/${f.name}`));
                                  // Profil zurücksetzen
                                  await supabase.from("profiles").update({ id_document_url: null, id_verified: false }).eq("id", u.id);
                                  setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_document_url: null, id_verified: false } : x));
                                  flash("ID abgelehnt — Dokument gelöscht");
                                  admin.logAdmin("id_reject", "user", u.display_name);
                                }} style={{ padding: "4px 11px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                  Ablehnen
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Moderation: Kontaktverstösse + Sperre */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: u.is_banned ? "#FFF6F6" : "#FAFAF8", borderBottom: `1px solid ${colors.borderLt}` }}>
                          <Flag size={16} color={u.is_banned ? "#c62828" : ((u.contact_violations || 0) > 0 ? "#E65100" : colors.muted)} />
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: u.is_banned ? "#c62828" : colors.dark }}>
                            {u.is_banned ? "Konto gesperrt — kann nicht handeln oder schreiben" : `${u.contact_violations || 0} Kontaktversuch(e) ausserhalb BEEDARO`}
                          </span>
                          <button onClick={() => toggleBan(u)} style={{ padding: "5px 14px", borderRadius: 999, border: "none", background: u.is_banned ? "#E8F5E9" : "#FFEBEE", color: u.is_banned ? "#2E7D32" : "#c62828", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
                            {u.is_banned ? "Entsperren" : "Konto sperren"}
                          </button>
                        </div>

                        {/* Tabs: Inserate | Bestellungen | Rechnungen | Bewertungen */}
                        <div style={{ display: "flex", borderBottom: `1px solid ${colors.borderLt}` }}>
                          {[{ key: "inserate", label: `Inserate (${uLst.length})` }, { key: "bestellungen", label: "Bestellungen" }, { key: "rechnungen", label: `Rechnungen (${(userInvoices[u.id] || []).length})` }, { key: "bewertungen", label: "Bewertungen" }, { key: "emails", label: "E-Mails" }].map(t => (
                            <button key={t.key} onClick={() => setUserTab(prev => ({ ...prev, [u.id]: t.key }))} style={{
                              flex: 1, padding: "9px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                              fontFamily: fonts.body, background: (userTab[u.id] || "inserate") === t.key ? colors.yellowSoft : "transparent",
                              color: colors.dark, borderBottom: (userTab[u.id] || "inserate") === t.key ? `2px solid ${colors.yellow}` : "2px solid transparent",
                            }}>{t.label}</button>
                          ))}
                        </div>

                        {/* Tab: Inserate */}
                        {(userTab[u.id] || "inserate") === "inserate" && (
                          <div style={{ padding: "10px 16px" }}>
                            {uLst.length > 0 ? uLst.map(l => (
                              <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 80px 80px", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <Link href={`/listing/${l.id}`} style={{ fontSize: 12, fontWeight: 600, color: colors.dark, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</Link>
                                <div><TypeBadge type={l.listing_type} /></div>
                                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right" }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</span>
                                <div style={{ textAlign: "center" }}>{statusPill(l.status)}</div>
                                <div style={{ textAlign: "center" }}>
                                  {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Pause</button>}
                                  {(l.status === "paused" || l.status === "draft" || l.status === "pending_pause") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Aktiv</button>}
                                </div>
                              </div>
                            )) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Inserate</p>}
                          </div>
                        )}

                        {/* Tab: Rechnungen */}
                        {(userTab[u.id] || "inserate") === "rechnungen" && (
                          <div style={{ padding: "10px 16px" }}>
                            {/* Gebühren-Summary */}
                            {uFee.length > 0 && (
                              <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "8px 10px", background: colors.cream, borderRadius: 8, fontSize: 11 }}>
                                <span>Gebühren: <strong>CHF {fmtCHF(totalUserFees)}</strong></span>
                                <span style={{ color: "#5B8C5A" }}>Bee-Impact: <strong>CHF {fmtCHF(totalUserImpact)}</strong></span>
                                <span style={{ color: colors.muted }}>{uFee.length} Einträge</span>
                              </div>
                            )}

                            {/* Rechnungen als Dropdowns */}
                            {(userInvoices[u.id] || []).length > 0 ? (userInvoices[u.id] || []).map(inv => {
                              const s = sc[inv.status] || sc.open;
                              const rl = inv.reminder_level || 0;
                              const isInvOpen = openInvoice === inv.id;
                              const invFees = uFee.filter(f => f.fee_invoice_id === inv.id);
                              return (
                                <div key={inv.id} style={{ marginBottom: 6, borderRadius: 8, border: `1px solid ${rl >= 2 ? "#FFCDD2" : colors.borderLt}`, overflow: "hidden", background: rl >= 3 ? "#FFF5F5" : "transparent" }}>
                                  {/* Invoice Header — klickbar */}
                                  <div onClick={() => setOpenInvoice(isInvOpen ? null : inv.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{inv.invoice_ref}</span>
                                    {pill(s.bg, s.color, s.label)}
                                    {rl > 0 && pill(rl >= 3 ? "#FFEBEE" : "#FFF3E0", rl >= 3 ? "#c62828" : "#E65100", `Stufe ${rl}`)}
                                    {inv.listings_paused && pill("#FFEBEE", "#c62828", "Pausiert")}
                                    <span style={{ fontSize: 12, fontWeight: 800 }}>CHF {fmtCHF(inv.total_fees)}</span>
                                    {isInvOpen ? <ChevronUp size={12} color={colors.muted} /> : <ChevronDown size={12} color={colors.muted} />}
                                  </div>

                                  {/* Invoice Detail — aufgeklappt */}
                                  {isInvOpen && (
                                    <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: "8px 10px" }}>
                                      {/* Positionen */}
                                      {invFees.map(f => (
                                        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: `1px solid ${colors.borderLt}` }}>
                                          <span>{fmtDate(f.created_at)} · {f.listing_title}</span>
                                          <span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                                        </div>
                                      ))}
                                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, color: "#5B8C5A" }}>
                                        <span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span>
                                      </div>

                                      {/* Aktionen */}
                                        {dunningTimeline(inv)}
                                        {inv.status !== "paid" ? (
                                          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                            {mahnButton({ ...inv, sellerName: u.display_name })}
                                            <button onClick={() => confirmAndReactivate(inv.id, u.id)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                                          </div>
                                        ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                                    </div>
                                  )}
                                </div>
                              );
                            }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Rechnungen</p>}
                          </div>
                        )}

                        {/* Sub-Tab: Bestellungen */}
                        {(userTab[u.id] || "inserate") === "bestellungen" && (
                          <div style={{ padding: "10px 16px" }}>
                            {orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id).length > 0 ? orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id).map(o => {
                              const ref = `BEE-${(o.id || "").substring(0, 8).toUpperCase()}`;
                              const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
                              const role = o.seller_id === u.id ? "Verkäufer" : "Käufer";
                              const other = o.seller_id === u.id ? o.buyerName : o.sellerName;
                              const st = o.status === "confirmed" ? pill("#E8F5E9", "#2E7D32", "Bestätigt") : o.status === "cancelled" ? pill("#FFEBEE", "#c62828", "Storniert") : pill("#f5f5f5", "#666", o.status || "—");
                              return (
                                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 80px 70px", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: `1px solid ${colors.borderLt}`, opacity: o.status === "cancelled" ? 0.5 : 1 }}>
                                  <span style={{ fontSize: 10, color: colors.muted }}>{ref}</span>
                                  <span style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle} <span style={{ fontWeight: 400, color: colors.muted }}>({role} → {other})</span></span>
                                  <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right" }}>CHF {fmtCHF(total)}</span>
                                  <div style={{ textAlign: "center" }}>{st}</div>
                                  <div style={{ textAlign: "center" }}>
                                    {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Storno</button>}
                                  </div>
                                </div>
                              );
                            }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bestellungen</p>}
                          </div>
                        )}

                        {/* Sub-Tab: Bewertungen */}
                        {(userTab[u.id] || "inserate") === "bewertungen" && (
                          <div style={{ padding: "10px 16px" }}>
                            {reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).length > 0 ? reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).map(r => {
                              const dir = r.rater_id === u.id ? `an ${r.revieweeName}` : `von ${r.reviewerName}`;
                              return (
                                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                  <span style={{ display: "inline-flex", gap: 1, minWidth: 70 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} color="#F4C03F" fill={n <= (r.rating || 0) ? "#F4C03F" : "none"} />)}</span>
                                  <span style={{ fontSize: 11, color: colors.muted, minWidth: 80 }}>{dir}</span>
                                  <span style={{ flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment || r.text || "—"}</span>
                                  <span style={{ fontSize: 10, color: colors.muted }}>{fmtDate(r.created_at)}</span>
                                  <button onClick={() => { if (confirm("Bewertung löschen?")) deleteReview(r.id); }} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Löschen</button>
                                </div>
                              );
                            }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bewertungen</p>}
                          </div>
                        )}

                        {/* Sub-Tab: E-Mails */}
                        {(userTab[u.id] || "inserate") === "emails" && (
                          <div style={{ padding: "10px 16px" }}>
                            {emailLog.filter(e => e.recipient_id === u.id).length > 0
                              ? emailLog.filter(e => e.recipient_id === u.id).map(e => emailCard(e))
                              : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine E-Mails an diesen Nutzer</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ BESTELLUNGEN ═══ */}
          {tab === "orders" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ k: "all", l: "Alle" }, { k: "open", l: "Offen" }, { k: "done", l: "Abgeschlossen" }, { k: "cancelled", l: "Storniert" }].map(f => (
                  <button key={f.k} onClick={() => setOrderStatusFilter(f.k)} style={modPill(orderStatusFilter === f.k)}>{f.l}</button>
                ))}
              </div>

              {filteredOrders.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine Bestellungen gefunden.</div>
              )}

              {filteredOrders.map(o => {
                const ref = makeBeeRef(o.id);
                const isOpen = openOrder === o.id;
                const det = orderDetail[o.id];
                const deposit = !!orderDeposit[o.id];
                const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
                const canDeposit = det?.listing?.listing_type === "rent" && parseFloat(det?.listing?.deposit_amount || 0) > 0;
                const invoiceHref = `/order/${o.id}/invoice${deposit ? "?type=deposit" : ""}`;
                return (
                  <div key={o.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden", opacity: o.status === "cancelled" ? 0.7 : 1 }}>
                    <div onClick={() => toggleOrder(o.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, minWidth: 90 }}>{ref}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle} <span style={{ fontWeight: 400, color: colors.muted }}>· {o.buyerName} → {o.sellerName}</span></span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>CHF {fmtCHF(total)}</span>
                      {orderStatusPill(o.status)}
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>
                    {isOpen && (
                      <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}` }}>
                        <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                          {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`], ["Bee-Rate", det?.listing?.fee_percentage != null ? `${det.listing.fee_percentage}%` : "…"]].map(([k, v], i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                            {canDeposit && (
                              <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
                                {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                                  <button key={lbl} onClick={() => setOrderDeposit(prev => ({ ...prev, [o.id]: val }))} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                                ))}
                              </div>
                            )}
                            <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                            {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ RECHNUNGEN ═══ */}
          {tab === "invoices" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ k: "all", l: "Alle" }, { k: "bee", l: "Bestell-Rechnungen (BEE)" }, { k: "fee", l: "Gebühren-Rechnungen (FEE)" }].map(f => (
                  <button key={f.k} onClick={() => setInvoiceType(f.k)} style={modPill(invoiceType === f.k)}>{f.l}</button>
                ))}
              </div>

              {invoiceRows.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine Rechnungen gefunden.</div>
              )}

              {invoiceRows.map(r => {
                const key = `${r.kind}:${r.id}`;
                const isOpen = openInvoiceKey === key;
                const typeBadge = r.kind === "bee" ? pill("#E6F5F5", "#0A7170", "BEE") : pill("#FFF5D8", "#5c4708", "FEE");
                const sc2 = sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: "Offen" });
                return (
                  <div key={key} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden" }}>
                    <div onClick={() => toggleInvoiceRow(r.kind, r.kind === "bee" ? r.id : r.inv)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, minWidth: 110 }}>{r.ref}</span>
                      {typeBadge}
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.payer} → {r.payee}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span>
                      {pill(sc2.bg, sc2.color, sc2.label)}
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>
                    {isOpen && r.kind === "bee" && (() => {
                      return (
                        <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}`, fontSize: 12, lineHeight: 1.9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
                          <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                        </div>
                      );
                    })()}
                    {isOpen && r.kind === "fee" && (() => {
                      const inv = r.inv;
                      const ledger = feeLedger[inv.id] || [];
                      const rl = inv.reminder_level || 0;
                      return (
                        <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}` }}>
                          <div style={{ flex: 1, minWidth: 220, fontSize: 12 }}>
                            {ledger.map(f => (
                              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <span>{fmtDate(f.created_at)} · {f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""}{f.listing_id ? makeArtRef(f.listing_id) + " · " : ""}{f.listing_title}</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#5B8C5A" }}><span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span></div>
                            {dunningTimeline(inv)}
                            {inv.status !== "paid" ? (
                              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                {mahnButton(inv)}
                                <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                              </div>
                            ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                            <a href={`/fees/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 12, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ E-MAILS ═══ */}
          {tab === "emails" && (
            <div>
              {filteredEmails.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine E-Mails protokolliert.</div>
              )}
              {filteredEmails.map(e => emailCard(e))}
            </div>
          )}

          {/* ═══ MAHNUNGEN ═══ */}
          {tab === "dunning" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: overdueInvoices.length ? "#c0392b" : colors.muted, background: overdueInvoices.length ? "#FFEBEB" : colors.cream, padding: "5px 12px", borderRadius: 999 }}>
                  {overdueInvoices.length} überfällig · CHF {fmtCHF(overdueSum)} offen
                </span>
              </div>
              {overdueInvoices.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
                  <CheckCircle size={22} color={colors.green} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Keine überfälligen Rechnungen</div>
                    <div style={{ fontSize: 12, color: colors.muted }}>Alles bezahlt oder noch nicht fällig.</div>
                  </div>
                </div>
              ) : overdueInvoices.map(inv => (
                <div key={inv.id} style={{ marginBottom: 10, borderRadius: radius.lg, border: "1px solid #f0c9c9", overflow: "hidden", padding: "14px 16px", background: "#FFF8F8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.dark }}>{(inv.sellerName || "?")[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}><span onClick={() => { setTab("users"); setSearch(inv.sellerName || ""); }} style={{ cursor: "pointer", textDecoration: "underline", textDecorationColor: "#d8b8b8" }}>{inv.sellerName}</span> <span style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, fontWeight: 400 }}>· {inv.invoice_ref}</span></div>
                      <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>CHF {fmtCHF(inv.total_fees)} · fällig seit {daysOverdue(inv)} Tagen</div>
                    </div>
                    {mahnButton(inv)}
                    <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#2E7D32", background: "#E8F5E9", border: "none", borderRadius: 999, padding: "7px 12px", cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                  </div>
                  {dunningTimeline(inv)}
                </div>
              ))}
            </div>
          )}

          {/* ═══ ANALYTIK ═══ */}
          {tab === "analytics" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
                  {[7, 30, 90].map(d => (
                    <button key={d} onClick={() => setAnalyticsRange(d)} style={{ fontSize: 11, fontWeight: analyticsRange === d ? 700 : 500, padding: "6px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: analyticsRange === d ? colors.dark : "transparent", color: analyticsRange === d ? "#fff" : colors.muted }}>{d} Tage</button>
                  ))}
                </div>
              </div>
              {(!analytics || analyticsLoading) ? (
                <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Analytik…</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Neue Nutzer</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.users)}</span></div>
                    <div style={chartBig}>{sumSeries(analytics.users)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
                    <TrendChart data={analytics.users} color="#0E9493" type="area" />
                    {axisLabels(analytics.users)}
                  </div>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Umsatz (GMV)</span><span style={{ fontSize: 11, color: colors.muted }}>{analytics.sales} Verkäufe</span></div>
                    <div style={chartBig}>CHF {fmtCHF(analytics.gmv.reduce((a, d) => a + d.value, 0))}</div>
                    <TrendChart data={analytics.gmv} color="#D9A005" type="bar" />
                    {axisLabels(analytics.gmv)}
                  </div>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Neue Inserate</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.listings)}</span></div>
                    <div style={chartBig}>{sumSeries(analytics.listings)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
                    <TrendChart data={analytics.listings} color="#5B8C5A" type="line" />
                    {axisLabels(analytics.listings)}
                  </div>
                  <div style={chartCard}>
                    <span style={chartLabel}>Inserate nach Typ</span>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                      {(() => {
                        const maxT = Math.max(1, ...analytics.byType.map(t => t.count));
                        const lbl = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
                        const col = { sell: "#F4C03F", auction: "#94B9C9", rent: "#8B6DB0", free: "#5B8C5A", service: "#E67E22" };
                        return analytics.byType.map(t => (
                          <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                            <span style={{ width: 62, color: "#3a3a3a" }}>{lbl[t.type]}</span>
                            <div style={{ flex: 1, background: colors.cream, borderRadius: 999, height: 10 }}><div style={{ width: `${(t.count / maxT) * 100}%`, height: 10, borderRadius: 999, background: col[t.type] }} /></div>
                            <span style={{ color: colors.muted, width: 22, textAlign: "right" }}>{t.count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ INSERATE ═══ */}
          {tab === "listings" && (
            <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
                  <th style={th}>Titel</th><th style={th}>Verkäufer</th><th style={th}>Typ</th>
                  <th style={{ ...th, textAlign: "right" }}>Preis</th><th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, textAlign: "center" }}>Aktionen</th>
                </tr></thead>
                <tbody>
                  {filteredListings.map(l => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                        <span style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: colors.muted, fontWeight: 500 }}>{makeArtRef(l.id)}</span>
                      </td>
                      <td style={{ ...td, color: colors.muted }}>{l.sellerName}</td>
                      <td style={td}><TypeBadge type={l.listing_type} /></td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</td>
                      <td style={{ ...td, textAlign: "center" }}>{statusPill(l.status)}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Pause size={10} /> Pause</button>}
                          {(l.status === "paused" || l.status === "draft") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Play size={10} /> Aktiv</button>}
                          <Link href={`/listing/${l.id}`} style={{ padding: "4px 10px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center" }}><Eye size={10} /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ MELDUNGEN ═══ */}
          {tab === "reports" && (
            <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {reports.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <CheckCircle size={32} color={colors.green} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Keine Meldungen</p>
                  <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>Alles sauber!</p>
                </div>
              ) : reports.map(r => (
                <div key={r.id} style={{ padding: "13px 16px", borderBottom: `1px solid ${colors.borderLt}`, background: r.is_resolved ? "#fafafa" : "transparent", opacity: r.is_resolved ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Flag size={16} color={r.is_resolved ? colors.muted : "#c62828"} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      {/* Inserat */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ fontSize: 13, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>{r.listingTitle}</Link>}
                        {pill("#FFF3E0", "#E65100", r.reason || "—")}
                        {pill(r.is_resolved ? "#E8F5E9" : "#FFEBEE", r.is_resolved ? "#2E7D32" : "#c62828", r.is_resolved ? "Erledigt" : "Offen")}
                      </div>
                      {/* Details */}
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: colors.muted }}>
                        Gemeldet von <strong>{r.reporterName}</strong> · Besitzer: <strong>{r.ownerName}</strong> · {fmtDate(r.created_at)}
                      </p>
                      {r.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#666" }}>{r.description}</p>}
                      {/* Aktionen */}
                      {!r.is_resolved && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => resolveReport(r.id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Erledigt</button>
                          {r.listing_id && <button onClick={() => pauseReportedListing(r.id, r.listing_id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Inserat pausieren</button>}
                          {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ padding: "4px 12px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>Ansehen</Link>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ PROTOKOLL ═══ */}
          {tab === "audit" && (
            <div>
              {(() => {
                const filtered = auditLog.filter(a => !search || (a.target_label || "").toLowerCase().includes(search.toLowerCase()) || ((AUDIT_META[a.action]?.label) || a.action).toLowerCase().includes(search.toLowerCase()));
                if (auditLoading && filtered.length === 0) return <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Protokoll…</div>;
                if (filtered.length === 0) return <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Noch keine protokollierten Aktionen.</div>;
                return filtered.map((a, i) => {
                  const meta = AUDIT_META[a.action] || { label: a.action, Icon: Clock, color: colors.muted, bg: colors.cream };
                  const Icon = meta.Icon;
                  const day = dayLabel(a.created_at);
                  const showHeader = i === 0 || day !== dayLabel(filtered[i - 1].created_at);
                  const adminName = users.find(u => u.id === a.admin_id)?.display_name || "Admin";
                  const time = a.created_at ? new Date(a.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={a.id}>
                      {showHeader && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", color: "#9E9E9E", textTransform: "uppercase", padding: "14px 0 4px" }}>{day}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} color={meta.color} /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{meta.label}{a.action === "reminder" && a.detail?.level ? <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "1px 7px", borderRadius: 999, marginLeft: 6 }}>Stufe {a.detail.level}</span> : null}</div>
                          <div style={{ fontSize: 11.5, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.target_label || "—"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 11, color: colors.muted }}>{time}</div><div style={{ fontSize: 10, color: "#bbb" }}>{adminName}</div></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

        </div>
      </div>

      {mahnModal && (
        <div onClick={() => setMahnModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#F3FAFA", padding: "13px 18px", borderBottom: "1px solid #E6F0F0", display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} color="#0A7170" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A7170" }}>Vorschau · wird gesendet an {mahnModal.inv.sellerName || "Verkäufer"}</span>
            </div>
            <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Betreff</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "3px 0 12px" }}>{mahnModal.subject}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Text</div>
              <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{mahnModal.body}</div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={confirmMahn} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Senden</button>
            </div>
          </div>
        </div>
      )}

      {broadcastOpen && (
        <div onClick={() => setBroadcastOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
              <Megaphone size={17} color={colors.yellow} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigung senden</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              <div>
                <div style={bcFieldLabel}>Zielgruppe</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
                    {[["all", "Alle"], ["private", "Privat"], ["business", "Unternehmen"], ["selected", "Einzelne"]].map(([k, l]) => (
                      <button key={k} onClick={() => setBcSegment(k)} style={{ fontSize: 11, fontWeight: bcSegment === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: bcSegment === k ? colors.dark : "transparent", color: bcSegment === k ? "#fff" : colors.muted }}>{l}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#0A7170", fontWeight: 600 }}>geht an {bcTargets.length} Nutzer</span>
                </div>
                {bcSegment === "selected" && (
                  <div style={{ marginTop: 8 }}>
                    <input value={bcUserQuery} onChange={e => setBcUserQuery(e.target.value)} placeholder="Nutzer suchen…" style={{ ...bcInput, marginBottom: 6 }} />
                    <div style={{ maxHeight: 160, overflowY: "auto", border: `1px solid ${colors.border}`, borderRadius: 10 }}>
                      {users.filter(u => { const q = bcUserQuery.toLowerCase().trim(); return !q || (u.display_name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q); }).slice(0, 30).map(u => {
                        const on = bcUserIds.includes(u.id);
                        return (
                          <div key={u.id} onClick={() => setBcUserIds(prev => on ? prev.filter(id => id !== u.id) : [...prev, u.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", cursor: "pointer", borderBottom: `1px solid ${colors.borderLt}`, background: on ? "#F3FAFA" : "transparent" }}>
                            {on ? <CheckCircle size={16} color={colors.teal} /> : <span style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid #ccc", flexShrink: 0 }} />}
                            <span style={{ fontSize: 12, color: colors.dark }}>{u.display_name || "—"} <span style={{ color: colors.muted }}>@{u.username || "—"}</span></span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>{bcUserIds.length} ausgewählt</div>
                  </div>
                )}
              </div>
              <div>
                <div style={bcFieldLabel}>Titel</div>
                <input value={bcTitle} onChange={e => setBcTitle(e.target.value)} placeholder="z.B. Neue Funktion" style={bcInput} />
              </div>
              <div>
                <div style={bcFieldLabel}>Nachricht</div>
                <textarea value={bcMessage} onChange={e => setBcMessage(e.target.value)} rows={3} placeholder="Deine Ankündigung…" style={{ ...bcInput, resize: "vertical", lineHeight: 1.5 }} />
              </div>
              <div>
                <div style={bcFieldLabel}>Link (optional)</div>
                <input value={bcLink} onChange={e => setBcLink(e.target.value)} placeholder="/listings/new" style={bcInput} />
              </div>
              <div style={{ border: "1px dashed #cfd8d8", borderRadius: 10, padding: "11px 12px", background: "#F7FBFB" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#0A7170", marginBottom: 7 }}>Vorschau in der Glocke</div>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Megaphone size={15} color={colors.dark} /></div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.dark }}>{bcTitle || "Titel der Ankündigung"}</div>
                    <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.45 }}>{bcMessage || "Text der Ankündigung…"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "13px 18px", borderTop: `1px solid ${colors.borderLt}` }}>
              <button onClick={() => setBroadcastOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={sendBroadcast} disabled={!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) ? "default" : "pointer", fontFamily: fonts.body, opacity: (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) ? 0.5 : 1 }}>{bcSending ? "Sende…" : `An ${bcTargets.length} senden`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "9px 22px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}
    </div>
  );
}
