"use client";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Shield, Users, Package, Receipt, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { TypeBadge } from "@/components/shared/Badge";
import { colors, fonts, radius } from "@/lib/theme";

const ADMIN_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";
const th = { padding: "10px 12px", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left", fontFamily: fonts.body };
const td = { padding: "10px 12px", fontSize: 12, fontFamily: fonts.body };
const pill = (bg, color, label) => <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color }}>{label}</span>;

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [feeInvoices, setFeeInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [openUser, setOpenUser] = useState(null);
  const [openInvoice, setOpenInvoice] = useState(null);
  const [userListings, setUserListings] = useState({});
  const [userFees, setUserFees] = useState({});
  const [feeFilter, setFeeFilter] = useState("all");

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u || u.id !== ADMIN_ID) { window.location.href = "/"; return; }
      setUser(u);

      // Stats
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: listingCount } = await supabase.from("listings").select("*", { count: "exact", head: true });
      const { count: activeCount } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: purchaseCount } = await supabase.from("purchases").select("*", { count: "exact", head: true });
      const { data: feeData } = await supabase.from("fee_ledger").select("fee_amount, bee_impact");
      const { data: invData } = await supabase.from("fee_invoices").select("total_fees, total_bee_impact");
      const ledgerFees = (feeData || []).reduce((s, f) => s + parseFloat(f.fee_amount), 0);
      const invoiceFees = (invData || []).reduce((s, f) => s + parseFloat(f.total_fees), 0);
      const ledgerImpact = (feeData || []).reduce((s, f) => s + parseFloat(f.bee_impact), 0);
      const invoiceImpact = (invData || []).reduce((s, f) => s + parseFloat(f.total_bee_impact), 0);
      const totalFees = Math.max(ledgerFees, invoiceFees);
      const totalImpact = Math.max(ledgerImpact, invoiceImpact);
      const { count: reportCount } = await supabase.from("reports").select("*", { count: "exact", head: true });
      setStats({ users: userCount, listings: listingCount, active: activeCount, purchases: purchaseCount, totalFees, totalImpact, reports: reportCount || 0 });

      // Fee invoices with seller names
      const { data: invs } = await supabase.from("fee_invoices").select("*").order("created_at", { ascending: false });
      const invWithSellers = [];
      for (const inv of (invs || [])) {
        const { data: seller } = await supabase.from("profiles").select("display_name").eq("id", inv.seller_id).single();
        invWithSellers.push({ ...inv, sellerName: seller?.display_name || "—" });
      }
      setFeeInvoices(invWithSellers);

      // Users
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(profs || []);

      // Listings with seller names (cached)
      const { data: lsts } = await supabase.from("listings").select("*").order("created_at", { ascending: false }).limit(100);
      const cache = {};
      const lstsWithSellers = [];
      for (const l of (lsts || [])) {
        if (!cache[l.user_id]) {
          const { data: s } = await supabase.from("profiles").select("display_name").eq("id", l.user_id).single();
          cache[l.user_id] = s?.display_name || "—";
        }
        lstsWithSellers.push({ ...l, sellerName: cache[l.user_id] });
      }
      setListings(lstsWithSellers);

      // Reports with listing + reporter + owner names
      const { data: reps } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      const enrichedReps = [];
      for (const r of (reps || [])) {
        let listingTitle = "—", ownerName = "—", reporterName = "—", ownerId = null;
        if (r.listing_id) {
          const { data: lst } = await supabase.from("listings").select("title, user_id").eq("id", r.listing_id).single();
          listingTitle = lst?.title || "—";
          ownerId = lst?.user_id;
          if (ownerId) {
            const cached = cache[ownerId];
            ownerName = cached || (await supabase.from("profiles").select("display_name").eq("id", ownerId).single()).data?.display_name || "—";
            cache[ownerId] = ownerName;
          }
        }
        if (r.reporter_id) {
          const cached = cache[r.reporter_id];
          reporterName = cached || (await supabase.from("profiles").select("display_name").eq("id", r.reporter_id).single()).data?.display_name || "—";
          cache[r.reporter_id] = reporterName;
        }
        enrichedReps.push({ ...r, listingTitle, ownerName, reporterName, ownerId });
      }
      setReports(enrichedReps);

      // Orders (purchases) with buyer/seller names
      const { data: ords } = await supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(50);
      const ordsWithNames = [];
      for (const o of (ords || [])) {
        const buyerName = cache[o.buyer_id] || (await supabase.from("profiles").select("display_name").eq("id", o.buyer_id).single()).data?.display_name || "—";
        const sellerName = cache[o.seller_id] || (await supabase.from("profiles").select("display_name").eq("id", o.seller_id).single()).data?.display_name || "—";
        cache[o.buyer_id] = buyerName; cache[o.seller_id] = sellerName;
        const { data: lst } = await supabase.from("listings").select("title").eq("id", o.listing_id).single();
        ordsWithNames.push({ ...o, buyerName, sellerName, listingTitle: lst?.title || "—" });
      }
      setOrders(ordsWithNames);

      // Reviews (from ratings table - used by order flow)
      const { data: revs } = await supabase.from("ratings").select("*").order("created_at", { ascending: false });
      const revsWithNames = [];
      for (const r of (revs || [])) {
        const reviewerName = cache[r.rater_id] || (await supabase.from("profiles").select("display_name").eq("id", r.rater_id).single()).data?.display_name || "—";
        const revieweeName = cache[r.rated_id] || (await supabase.from("profiles").select("display_name").eq("id", r.rated_id).single()).data?.display_name || "—";
        cache[r.rater_id] = reviewerName; cache[r.rated_id] = revieweeName;
        revsWithNames.push({ ...r, reviewerName, revieweeName, reviewer_id: r.rater_id, reviewed_id: r.rated_id });
      }
      setReviews(revsWithNames);

      setLoading(false);
    }
    load();
  }, []);

  const [userTab, setUserTab] = useState({});
  const [userInvoices, setUserInvoices] = useState({});

  // User aufklappen
  const toggleUser = async (userId) => {
    if (openUser === userId) { setOpenUser(null); return; }
    setOpenUser(userId);
    if (!userTab[userId]) setUserTab(prev => ({ ...prev, [userId]: "inserate" }));
    if (!userListings[userId]) {
      const { data } = await supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      setUserListings(prev => ({ ...prev, [userId]: data || [] }));
    }
    if (!userFees[userId]) {
      const { data } = await supabase.from("fee_ledger").select("*").eq("seller_id", userId).order("created_at", { ascending: false });
      setUserFees(prev => ({ ...prev, [userId]: data || [] }));
    }
    if (!userInvoices[userId]) {
      const { data } = await supabase.from("fee_invoices").select("*").eq("seller_id", userId).order("created_at", { ascending: false });
      setUserInvoices(prev => ({ ...prev, [userId]: data || [] }));
    }
  };

  const confirmPayment = async (invId) => {
    await supabase.from("fee_invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invId);
    await supabase.from("fee_ledger").update({ status: "paid" }).eq("fee_invoice_id", invId);
    setFeeInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: "paid", paid_at: new Date().toISOString() } : i));
    flash("Zahlung bestätigt");
  };

  const toggleListingStatus = async (listingId, newStatus) => {
    await supabase.from("listings").update({ status: newStatus }).eq("id", listingId);
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    // Update in user listings too
    setUserListings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(uid => {
        updated[uid] = updated[uid].map(l => l.id === listingId ? { ...l, status: newStatus } : l);
      });
      return updated;
    });
    flash(`Status → ${newStatus}`);
  };

  // Mahnung senden (3 Eskalationsstufen)
  const sendReminder = async (invId, sellerId, level) => {
    const templates = {
      1: { subject: "Erinnerung: Offene Gebührenrechnung", template: "reminder_1" },
      2: { subject: "2. Mahnung: Inserate werden bald pausiert", template: "reminder_2" },
      3: { subject: "Letzte Mahnung: Inserate pausiert", template: "reminder_3" },
    };
    const t = templates[level];

    // Invoice updaten
    await supabase.from("fee_invoices").update({
      reminder_level: level,
      reminder_sent_at: new Date().toISOString(),
      status: "overdue",
      ...(level >= 3 ? { listings_paused: true } : {}),
    }).eq("id", invId);

    // Bei Stufe 3: Inserate smart pausieren
    if (level >= 3) {
      const { data: result } = await supabase.rpc("pause_seller_listings", { p_seller_id: sellerId });
      const paused = result?.paused || 0;
      const prot = result?.protected || 0;
      if (prot > 0) flash(`Stufe 3: ${paused} pausiert, ${prot} geschützt (aktive Gebote/Buchungen)`);
      else flash(`Stufe 3: ${paused} Inserate pausiert`);
    } else {
      flash(`Mahnung Stufe ${level} gesendet`);
    }

    // Email loggen
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", sellerId).single();
    await supabase.from("email_log").insert({
      recipient_id: sellerId, recipient_email: "noreply@beedaro.ch",
      subject: t.subject, template: t.template,
      context: { seller_name: profile?.display_name, invoice_id: invId, level },
    });

    // State updaten
    setUserInvoices(prev => {
      const u = { ...prev };
      if (u[sellerId]) u[sellerId] = u[sellerId].map(i => i.id === invId ? { ...i, reminder_level: level, status: "overdue", listings_paused: level >= 3 } : i);
      return u;
    });
    setFeeInvoices(prev => prev.map(i => i.id === invId ? { ...i, reminder_level: level, status: "overdue", listings_paused: level >= 3 } : i));
  };

  // Zahlung bestätigen + Inserate reaktivieren
  const confirmAndReactivate = async (invId, sellerId) => {
    await supabase.from("fee_invoices").update({
      status: "paid", paid_at: new Date().toISOString(),
      listings_paused: false, account_suspended: false,
    }).eq("id", invId);
    await supabase.from("fee_ledger").update({ status: "paid" }).eq("fee_invoice_id", invId);
    await supabase.rpc("reactivate_seller_listings", { p_seller_id: sellerId });

    setFeeInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: "paid", paid_at: new Date().toISOString(), listings_paused: false } : i));
    setUserInvoices(prev => {
      const updated = { ...prev };
      if (updated[sellerId]) {
        updated[sellerId] = updated[sellerId].map(i => i.id === invId ? { ...i, status: "paid", paid_at: new Date().toISOString(), listings_paused: false } : i);
      }
      return updated;
    });
    flash("Bezahlt + Inserate reaktiviert");
  };

  // Bestellung stornieren
  const cancelOrder = async (orderId, listingId) => {
    await supabase.from("purchases").update({ status: "cancelled" }).eq("id", orderId);
    await supabase.from("fee_ledger").update({ status: "cancelled" }).eq("purchase_id", orderId);
    if (listingId) await supabase.from("listings").update({ status: "active" }).eq("id", listingId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    flash("Bestellung storniert — Gebühr entfernt, Artikel reaktiviert");
  };

  // Bewertung löschen
  const deleteReview = async (reviewId) => {
    await supabase.from("ratings").delete().eq("id", reviewId);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    flash("Bewertung gelöscht");
  };

  // Report erledigen
  const resolveReport = async (reportId) => {
    await supabase.from("reports").update({ is_resolved: true }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
    flash("Meldung als erledigt markiert");
  };

  // Gemeldetes Inserat pausieren
  const pauseReportedListing = async (reportId, listingId) => {
    await supabase.from("listings").update({ status: "paused" }).eq("id", listingId);
    await supabase.from("reports").update({ is_resolved: true }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
    flash("Inserat pausiert + Meldung erledigt");
  };

  const sc = { open: { color: "#E65100", bg: "#FFF3E0", label: "Offen" }, pending_payment: { color: "#1565C0", bg: "#E3F2FD", label: "Gemeldet" }, paid: { color: "#2E7D32", bg: "#E8F5E9", label: "Bezahlt" }, overdue: { color: "#c62828", bg: "#FFEBEE", label: "Überfällig" } };
  const statusPill = (status) => {
    const map = { active: ["#E8F5E9", "#2E7D32", "Aktiv"], draft: ["#f5f5f5", "#666", "Entwurf"], paused: ["#FFF3E0", "#E65100", "Pausiert"], sold: ["#E3F2FD", "#1565C0", "Verkauft"], rented: ["#E3F2FD", "#1565C0", "Vermietet"], inactive: ["#f5f5f5", "#666", "Inaktiv"], pending_pause: ["#FFEBEE", "#c62828", "Wird pausiert"] };
    const [bg, col, lbl] = map[status] || map.draft;
    return pill(bg, col, lbl);
  };

  const filteredFees = feeFilter === "all" ? feeInvoices : feeInvoices.filter(i => i.status === feeFilter);
  const filteredUsers = users.filter(u => !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.city?.toLowerCase().includes(search.toLowerCase()));
  const filteredListings = listings.filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.sellerName?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade Admin...</div>;
  if (!user) return null;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <ShieldCheck size={24} color={colors.yellow} />
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: fonts.head, margin: 0 }}>ADMIN DASHBOARD</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Benutzer", value: stats.users, icon: Users },
            { label: "Inserate", value: `${stats.active}/${stats.listings}`, icon: Package },
            { label: "Verkäufe", value: stats.purchases, icon: TrendingUp },
            { label: "Gebühren", value: `CHF ${fmtCHF(stats.totalFees)}`, icon: Receipt },
            { label: "Bee-Impact", value: `CHF ${fmtCHF(stats.totalImpact)}`, icon: null, green: true },
            { label: "Meldungen", value: stats.reports, icon: Flag, red: stats.reports > 0 },
          ].map((s, i) => (
            <div key={i} style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                {s.icon ? <s.icon size={13} color={s.red ? "#c62828" : s.green ? "#5B8C5A" : colors.dark} /> : <BeeIcon size={13} color="#5B8C5A" />}
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{s.label}</p>
              </div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.red ? "#c62828" : s.green ? "#5B8C5A" : colors.dark }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden", width: "fit-content" }}>
          {[{ key: "overview", label: "Gebühren" }, { key: "users", label: "Benutzer" }, { key: "listings", label: "Inserate" }, { key: "reports", label: `Meldungen (${reports.length})` }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: fonts.body, background: tab === t.key ? colors.yellow : "transparent", color: colors.dark }}>{t.label}</button>
          ))}
        </div>

        {/* Suchfeld */}
        {(tab === "users" || tab === "listings") && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Search size={16} color={colors.muted} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
              style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, outline: "none", maxWidth: 400 }} />
          </div>
        )}

        {/* ═══ TAB: GEBÜHREN ═══ */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {[{ key: "all", label: "Alle" }, { key: "pending_payment", label: "Ausstehend" }, { key: "open", label: "Offen" }, { key: "paid", label: "Bezahlt" }].map(f => (
                <button key={f.key} onClick={() => setFeeFilter(f.key)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, border: `1px solid ${feeFilter === f.key ? colors.yellow : colors.border}`, borderRadius: 6, cursor: "pointer", fontFamily: fonts.body, background: feeFilter === f.key ? colors.yellowSoft : "transparent", color: colors.dark }}>{f.label}</button>
              ))}
            </div>
            <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={th}>Verkäufer</th><th style={th}>Referenz</th><th style={th}>Periode</th>
                  <th style={{ ...th, textAlign: "right" }}>Betrag</th><th style={{ ...th, textAlign: "right" }}>Impact</th>
                  <th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, textAlign: "center" }}>Aktion</th>
                </tr></thead>
                <tbody>
                  {filteredFees.map(inv => {
                    const s = sc[inv.status] || sc.open;
                    return (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, background: inv.status === "pending_payment" ? `${colors.blue}05` : "transparent" }}>
                        <td style={{ ...td, fontWeight: 600 }}>{inv.sellerName}</td>
                        <td style={{ ...td, color: colors.muted, fontSize: 11 }}>{inv.invoice_ref}</td>
                        <td style={td}>{new Date(inv.period_year, inv.period_month - 1).toLocaleString("de-CH", { month: "short", year: "numeric" })}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>CHF {fmtCHF(inv.total_fees)}</td>
                        <td style={{ ...td, textAlign: "right", color: "#5B8C5A", fontSize: 11 }}>CHF {fmtCHF(inv.total_bee_impact)}</td>
                        <td style={{ ...td, textAlign: "center" }}>{pill(s.bg, s.color, s.label)}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          {(inv.status === "open" || inv.status === "pending_payment" || inv.status === "overdue") && (
                            <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#2E7D32", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bestätigen</button>
                          )}
                          {inv.status === "paid" && <span style={{ fontSize: 10, color: "#2E7D32" }}>{fmtDate(inv.paid_at)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFees.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: "center", padding: 30, color: colors.muted }}>Keine Rechnungen</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB: BENUTZER (mit aufklappbaren Inseraten) ═══ */}
        {tab === "users" && (
          <div>
            {filteredUsers.map(u => {
              const isOpen = openUser === u.id;
              const uLst = userListings[u.id] || [];
              const uFee = userFees[u.id] || [];
              const totalUserFees = uFee.reduce((s, f) => s + parseFloat(f.fee_amount), 0);
              const totalUserImpact = uFee.reduce((s, f) => s + parseFloat(f.bee_impact), 0);
              return (
                <div key={u.id} style={{ marginBottom: 8, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                  {/* User Row */}
                  <div onClick={() => toggleUser(u.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.dark }}>
                      {(u.display_name || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span>
                        {u.id_verified && <span style={{ marginLeft: 4, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}>ID</span>}
                        {u.id_document_url && !u.id_verified && <span style={{ marginLeft: 4, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#FFF8E1", color: "#E65100", fontWeight: 700 }}>ID?</span>}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: colors.muted }}>{u.city} · {u.created_at ? fmtDate(u.created_at) : ""}</p>
                    </div>
                    {pill(colors.yellowSoft, colors.dark, u.bee_level || "starter")}
                    <span style={{ fontSize: 11, color: "#5B8C5A", fontWeight: 600, minWidth: 70, textAlign: "right" }}>CHF {fmtCHF(u.bee_impact_total)}</span>
                    {isOpen ? <ChevronUp size={14} color={colors.muted} /> : <ChevronDown size={14} color={colors.muted} />}
                  </div>

                  {/* User Details — aufgeklappt */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${colors.borderLt}` }}>

                      {/* ID-Verifizierung Bar */}
                      {(u.id_document_url || u.id_verified) && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                          background: u.id_verified ? "#E8F5E9" : "#FFF8E1",
                          borderBottom: `1px solid ${colors.borderLt}`,
                        }}>
                          <Shield size={16} color={u.id_verified ? "#2E7D32" : "#F4A100"} />
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: u.id_verified ? "#2E7D32" : "#E65100" }}>
                            {u.id_verified ? "ID verifiziert" : "ID hochgeladen — Prüfung ausstehend"}
                          </span>
                          {u.id_document_url && (
                            <a href={u.id_document_url} target="_blank" rel="noopener noreferrer"
                              style={{ padding: "3px 10px", borderRadius: 4, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 700, color: colors.dark, textDecoration: "none", cursor: "pointer" }}>
                              Dokument ansehen
                            </a>
                          )}
                          {u.id_document_url && !u.id_verified && (
                            <>
                              <button onClick={async () => {
                                await supabase.from("profiles").update({ id_verified: true }).eq("id", u.id);
                                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_verified: true } : x));
                                flash("ID verifiziert");
                              }} style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
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
                              }} style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                Ablehnen
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Tabs: Inserate | Bestellungen | Rechnungen | Bewertungen */}
                      <div style={{ display: "flex", borderBottom: `1px solid ${colors.borderLt}` }}>
                        {[{ key: "inserate", label: `Inserate (${uLst.length})` }, { key: "bestellungen", label: "Bestellungen" }, { key: "rechnungen", label: `Rechnungen (${(userInvoices[u.id] || []).length})` }, { key: "bewertungen", label: "Bewertungen" }].map(t => (
                          <button key={t.key} onClick={() => setUserTab(prev => ({ ...prev, [u.id]: t.key }))} style={{
                            flex: 1, padding: "8px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                            fontFamily: fonts.body, background: (userTab[u.id] || "inserate") === t.key ? colors.yellowSoft : "transparent",
                            color: colors.dark, borderBottom: (userTab[u.id] || "inserate") === t.key ? `2px solid ${colors.yellow}` : "2px solid transparent",
                          }}>{t.label}</button>
                        ))}
                      </div>

                      {/* Tab: Inserate */}
                      {(userTab[u.id] || "inserate") === "inserate" && (
                        <div style={{ padding: "10px 14px" }}>
                          {uLst.length > 0 ? uLst.map(l => (
                            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 80px 80px", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                              <Link href={`/listing/${l.id}`} style={{ fontSize: 12, fontWeight: 600, color: colors.dark, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</Link>
                              <div><TypeBadge type={l.listing_type} /></div>
                              <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right" }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</span>
                              <div style={{ textAlign: "center" }}>{statusPill(l.status)}</div>
                              <div style={{ textAlign: "center" }}>
                                {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "2px 6px", borderRadius: 3, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Pause</button>}
                                {(l.status === "paused" || l.status === "draft" || l.status === "pending_pause") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "2px 6px", borderRadius: 3, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Aktiv</button>}
                              </div>
                            </div>
                          )) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Inserate</p>}
                        </div>
                      )}

                      {/* Tab: Rechnungen */}
                      {(userTab[u.id] || "inserate") === "rechnungen" && (
                        <div style={{ padding: "10px 14px" }}>
                          {/* Gebühren-Summary */}
                          {uFee.length > 0 && (
                            <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "8px 10px", background: colors.cream, borderRadius: 6, fontSize: 11 }}>
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
                              <div key={inv.id} style={{ marginBottom: 6, borderRadius: 6, border: `1px solid ${rl >= 2 ? "#FFCDD2" : colors.borderLt}`, overflow: "hidden", background: rl >= 3 ? "#FFF5F5" : "transparent" }}>
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
                                        <span>{fmtDate(f.created_at)} — {f.listing_title}</span>
                                        <span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                                      </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, color: "#5B8C5A" }}>
                                      <span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span>
                                    </div>

                                    {/* Aktionen */}
                                    {inv.status !== "paid" && (
                                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                                        {rl < 1 && <button onClick={() => sendReminder(inv.id, u.id, 1)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Erinnerung</button>}
                                        {rl === 1 && <button onClick={() => sendReminder(inv.id, u.id, 2)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#FFE0B2", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Mahnung</button>}
                                        {rl === 2 && <button onClick={() => sendReminder(inv.id, u.id, 3)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#FFCDD2", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Sperren</button>}
                                        <button onClick={() => confirmAndReactivate(inv.id, u.id)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Bezahlt</button>
                                      </div>
                                    )}
                                    {inv.status === "paid" && <p style={{ margin: "4px 0 0", fontSize: 10, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                                  </div>
                                )}
                              </div>
                            );
                          }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Rechnungen</p>}
                        </div>
                      )}

                      {/* Sub-Tab: Bestellungen */}
                      {(userTab[u.id] || "inserate") === "bestellungen" && (
                        <div style={{ padding: "10px 14px" }}>
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
                                  {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ padding: "2px 6px", borderRadius: 3, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Storno</button>}
                                </div>
                              </div>
                            );
                          }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bestellungen</p>}
                        </div>
                      )}

                      {/* Sub-Tab: Bewertungen */}
                      {(userTab[u.id] || "inserate") === "bewertungen" && (
                        <div style={{ padding: "10px 14px" }}>
                          {reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).length > 0 ? reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).map(r => {
                            const dir = r.rater_id === u.id ? `an ${r.revieweeName}` : `von ${r.reviewerName}`;
                            return (
                              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <span style={{ color: "#F4C03F", fontSize: 12, minWidth: 70 }}>{"★".repeat(r.rating || 0)}{"☆".repeat(5 - (r.rating || 0))}</span>
                                <span style={{ fontSize: 11, color: colors.muted, minWidth: 80 }}>{dir}</span>
                                <span style={{ flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment || r.text || "—"}</span>
                                <span style={{ fontSize: 10, color: colors.muted }}>{fmtDate(r.created_at)}</span>
                                <button onClick={() => { if (confirm("Bewertung löschen?")) deleteReview(r.id); }} style={{ padding: "2px 6px", borderRadius: 3, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Löschen</button>
                              </div>
                            );
                          }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bewertungen</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TAB: INSERATE ═══ */}
        {tab === "listings" && (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={th}>Titel</th><th style={th}>Verkäufer</th><th style={th}>Typ</th>
                <th style={{ ...th, textAlign: "right" }}>Preis</th><th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, textAlign: "center" }}>Aktionen</th>
              </tr></thead>
              <tbody>
                {filteredListings.map(l => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                    <td style={{ ...td, fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                    </td>
                    <td style={{ ...td, color: colors.muted }}>{l.sellerName}</td>
                    <td style={td}><TypeBadge type={l.listing_type} /></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</td>
                    <td style={{ ...td, textAlign: "center" }}>{statusPill(l.status)}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Pause size={10} /> Pause</button>}
                        {(l.status === "paused" || l.status === "draft") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Play size={10} /> Aktiv</button>}
                        <Link href={`/listing/${l.id}`} style={{ padding: "3px 8px", borderRadius: 4, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center" }}><Eye size={10} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ TAB: MELDUNGEN ═══ */}
        {tab === "reports" && (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {reports.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <CheckCircle size={32} color={colors.green} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Keine Meldungen</p>
                <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>Alles sauber!</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${colors.borderLt}`, background: r.is_resolved ? "#fafafa" : "transparent", opacity: r.is_resolved ? 0.6 : 1 }}>
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
                        <button onClick={() => resolveReport(r.id)} style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Erledigt</button>
                        {r.listing_id && <button onClick={() => pauseReportedListing(r.id, r.listing_id)} style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Inserat pausieren</button>}
                        {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ padding: "3px 10px", borderRadius: 4, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>Ansehen</Link>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}
    </div>
  );
}
