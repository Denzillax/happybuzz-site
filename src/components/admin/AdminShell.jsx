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
import { ANNOUNCEMENT_PRESETS } from "@/lib/announcement";
import { buildDunningEmail } from "@/lib/dunning";
import { th, td, pill, bcFieldLabel, bcInput, chartCard, chartHead, chartLabel, chartBig, chartSub, sumSeries, axisLabels } from "@/components/admin/adminStyles";
import { ReportsTab } from "@/components/admin/tabs/ReportsTab";
import { ListingsTab } from "@/components/admin/tabs/ListingsTab";
import { EmailsTab } from "@/components/admin/tabs/EmailsTab";
import { AnalyticsTab } from "@/components/admin/tabs/AnalyticsTab";
import { AuditTab } from "@/components/admin/tabs/AuditTab";
import { OverviewTab } from "@/components/admin/tabs/OverviewTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { OrdersTab } from "@/components/admin/tabs/OrdersTab";
import { InvoicesTab } from "@/components/admin/tabs/InvoicesTab";
import { DunningTab } from "@/components/admin/tabs/DunningTab";

export function AdminShell({ admin }) {
  const {
    user, loading, toast, flash, tab, setTab, search, setSearch,
    stats, users, setUsers, listings, reports, setReports, orders, feeInvoices, reviews, setReviews, emailLog, setEmailLog,
    filteredUsers, visibleUsers, filteredListings, visibleListings, filteredOrders, filteredEmails, invoiceRows, beeInvoiceRows, feeInvoiceRows,
    overdueInvoices, overdueSum, openReports, flaggedUsers, bannedUsers, openFeeInvoices, analytics,
    gmv, avgOrder, nonCancelledOrders, topSellers,
    openUser, toggleUser, userTab, setUserTab, userListings, userFees, userInvoices, userMod, setUserMod,
    openInvoice, setOpenInvoice,
    openOrder, toggleOrder, orderDetail, orderStatusFilter, setOrderStatusFilter, orderDeposit, setOrderDeposit, orderStatusGroup, orderStatusPill, beeRefIncludes,
    invoiceType, setInvoiceType, openInvoiceKey, toggleInvoiceRow, feeLedger, feeSeller,
    mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton,
    nextStageInfo, dunningDue, dunningSoon, dunningPaused, bulkSendDue,
    broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, bcTargets, sendBroadcast,
    annOpen, setAnnOpen, ann, setAnn, openAnnouncement, saveAnnouncement,
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
          {tab === "overview" && <OverviewTab admin={admin} />}

          {/* ═══ BENUTZER ═══ */}
          {tab === "users" && <UsersTab admin={admin} />}

          {/* ═══ BESTELLUNGEN ═══ */}
          {tab === "orders" && <OrdersTab admin={admin} />}

          {/* ═══ RECHNUNGEN ═══ */}
          {tab === "invoices" && <InvoicesTab admin={admin} />}

          {/* ═══ E-MAILS ═══ */}
          {tab === "emails" && <EmailsTab admin={admin} />}

          {/* ═══ MAHNUNGEN ═══ */}
          {tab === "dunning" && <DunningTab admin={admin} />}

          {/* ═══ ANALYTIK ═══ */}
          {tab === "analytics" && <AnalyticsTab admin={admin} />}

          {/* ═══ INSERATE ═══ */}
          {tab === "listings" && <ListingsTab admin={admin} />}

          {/* ═══ MELDUNGEN ═══ */}
          {tab === "reports" && <ReportsTab admin={admin} />}

          {/* ═══ PROTOKOLL ═══ */}
          {tab === "audit" && <AuditTab admin={admin} />}

        </div>
      </div>

      {mahnModal && (
        <div onClick={() => setMahnModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#F3FAFA", padding: "13px 18px", borderBottom: "1px solid #E6F0F0", display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} color="#0A7170" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A7170" }}>{mahnModal.mode === "view" ? `Gesendet${mahnModal.sentAt ? ` am ${fmtDate(mahnModal.sentAt)}` : ""} an ${mahnModal.inv.sellerName || "Verkäufer"}` : `Vorschau · wird gesendet an ${mahnModal.inv.sellerName || "Verkäufer"}`}</span>
            </div>
            <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Betreff</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "3px 0 12px" }}>{mahnModal.subject}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Text</div>
              <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{mahnModal.body}</div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              {mahnModal.mode === "view" ? (
                <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Schliessen</button>
              ) : (
                <>
                  <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                  <button onClick={confirmMahn} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Senden</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {annOpen && (
        <div onClick={() => setAnnOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
              <Megaphone size={17} color={colors.yellow} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigungsbalken</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: colors.dark }}>
                <input type="checkbox" checked={ann.enabled} onChange={e => setAnn({ ...ann, enabled: e.target.checked })} /> Balken aktiv
              </label>
              <input value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder="Text des Balkens…" style={{ ...bcInput }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Farbe</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ANNOUNCEMENT_PRESETS.map(p => (
                    <button key={p.name} onClick={() => setAnn({ ...ann, bg_color: p.bg, text_color: p.text })} style={{ background: p.bg, color: p.text, border: `2px solid ${ann.bg_color === p.bg ? colors.dark : "transparent"}`, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{p.name}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>BG <input value={ann.bg_color} onChange={e => setAnn({ ...ann, bg_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
                  <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>Text <input value={ann.text_color} onChange={e => setAnn({ ...ann, text_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Animation</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["none", "Keine"], ["marquee", "Laufschrift"], ["slide", "Einfliegen"], ["pulse", "Pulsieren"]].map(([k, lbl]) => (
                    <button key={k} onClick={() => setAnn({ ...ann, effect: k })} style={{ background: ann.effect === k ? colors.dark : "#fff", color: ann.effect === k ? "#fff" : colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Vorschau</div>
                <div style={{ background: ann.bg_color, color: ann.text_color, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 8, textAlign: "center" }}>
                  <Megaphone size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{ann.message || "Vorschau-Text"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              <button onClick={() => setAnnOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={saveAnnouncement} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
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
