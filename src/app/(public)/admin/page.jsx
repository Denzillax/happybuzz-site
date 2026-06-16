"use client";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, Shield, Users, Package, Receipt, ReceiptText, ShoppingBag, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star, ArrowLeft, Download, Mail, BellRing, LineChart, Megaphone } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { TrendChart } from "@/components/admin/TrendChart";
import { bucketDaily, countByType } from "@/lib/adminAnalytics";
import BeeIcon from "@/components/shared/BeeIcon";
import { TypeBadge } from "@/components/shared/Badge";
import { colors, fonts, radius } from "@/lib/theme";
import { makeBeeRef } from "@/lib/fees";
import { orderQrPayload, feeQrPayload, qrImageUrl } from "@/lib/swissQR";
import { buildDunningEmail } from "@/lib/dunning";

const ADMIN_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";
const th = { padding: "11px 14px", fontSize: 9.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left", fontFamily: fonts.body };
const td = { padding: "12px 14px", fontSize: 12.5, fontFamily: fonts.body };
const pill = (bg, color, label) => <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color }}>{label}</span>;

const bcFieldLabel = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 4 };
const bcInput = { width: "100%", boxSizing: "border-box", border: "1px solid #E2E2E2", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: fonts.body, color: "#191615", outline: "none" };

const chartCard = { border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, background: "#fff" };
const chartHead = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const chartLabel = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted };
const chartBig = { fontSize: 22, fontWeight: 800, fontFamily: fonts.head, margin: "2px 0 8px" };
const chartSub = { fontSize: 11, fontWeight: 600, color: colors.muted };
const sumSeries = (s) => Math.round((s || []).reduce((a, d) => a + d.value, 0));
const axisLabels = (s) => s && s.length ? (
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: colors.muted }}>
    <span>{fmtDate(s[0].date)}</span><span>heute</span>
  </div>
) : null;

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
  const [userMod, setUserMod] = useState("all");
  const [invoiceType, setInvoiceType] = useState("all");
  const [openInvoiceKey, setOpenInvoiceKey] = useState(null);
  const [feeLedger, setFeeLedger] = useState({});
  const [feeSeller, setFeeSeller] = useState({});
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [openOrder, setOpenOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState({});
  const [orderDeposit, setOrderDeposit] = useState({});
  const [emailLog, setEmailLog] = useState([]);
  const [openEmail, setOpenEmail] = useState(null);
  const [mahnModal, setMahnModal] = useState(null); // { inv, level, subject, body } | null
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcSegment, setBcSegment] = useState("all");
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcLink, setBcLink] = useState("");
  const [bcSending, setBcSending] = useState(false);
  const [bcUserIds, setBcUserIds] = useState([]);
  const [bcUserQuery, setBcUserQuery] = useState("");

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
      const { data: ords } = await supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(1000);
      const ordsWithNames = [];
      for (const o of (ords || [])) {
        const buyerName = cache[o.buyer_id] || (await supabase.from("profiles").select("display_name").eq("id", o.buyer_id).single()).data?.display_name || "—";
        const sellerName = cache[o.seller_id] || (await supabase.from("profiles").select("display_name").eq("id", o.seller_id).single()).data?.display_name || "—";
        cache[o.buyer_id] = buyerName; cache[o.seller_id] = sellerName;
        const { data: lst } = await supabase.from("listings").select("title").eq("id", o.listing_id).single();
        ordsWithNames.push({ ...o, buyerName, sellerName, listingTitle: lst?.title || "—" });
      }
      setOrders(ordsWithNames);

      // E-Mail-Log
      const { data: mails } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(500);
      setEmailLog(mails || []);

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

  useEffect(() => {
    if (tab !== "analytics") return;
    let active = true;
    (async () => {
      setAnalyticsLoading(true);
      const start = new Date(Date.now() - analyticsRange * 86400000).toISOString();
      const [u, l, p, lt] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", start),
        supabase.from("listings").select("created_at").gte("created_at", start),
        supabase.from("purchases").select("created_at, price, shipping_cost, status").gte("created_at", start),
        supabase.from("listings").select("listing_type"),
      ]);
      if (!active) return;
      const paid = (p.data || []).filter(x => x.status !== "cancelled");
      setAnalytics({
        users: bucketDaily(u.data, analyticsRange, () => 1),
        listings: bucketDaily(l.data, analyticsRange, () => 1),
        gmv: bucketDaily(paid, analyticsRange, r => parseFloat(r.price || 0) + parseFloat(r.shipping_cost || 0)),
        sales: paid.length,
        byType: countByType(lt.data),
      });
      setAnalyticsLoading(false);
    })();
    return () => { active = false; };
  }, [tab, analyticsRange]);

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

  const ORDER_DETAIL_SELECT = "*, listing:listings(id, title, price, listing_type, rent_price, deposit_amount, fee_percentage, fee_tier, shipping_cost, free_shipping)";
  const loadOrderDetail = async (orderId) => {
    if (orderDetail[orderId]) return;
    const { data: p } = await supabase.from("purchases").select(ORDER_DETAIL_SELECT).eq("id", orderId).maybeSingle();
    if (!p) return;
    const { data: buyer } = await supabase.from("profiles").select("*").eq("id", p.buyer_id).maybeSingle();
    const { data: seller } = await supabase.from("profiles").select("*").eq("id", p.seller_id).maybeSingle();
    setOrderDetail(prev => ({ ...prev, [orderId]: { ...p, buyer, seller } }));
  };
  const toggleOrder = async (orderId) => {
    if (openOrder === orderId) { setOpenOrder(null); return; }
    setOpenOrder(orderId);
    await loadOrderDetail(orderId);
  };
  const loadFeeDetail = async (inv) => {
    if (!feeLedger[inv.id]) {
      const { data: items } = await supabase.from("fee_ledger").select("*").eq("fee_invoice_id", inv.id).order("created_at", { ascending: true });
      setFeeLedger(prev => ({ ...prev, [inv.id]: items || [] }));
    }
    if (!feeSeller[inv.id]) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", inv.seller_id).maybeSingle();
      setFeeSeller(prev => ({ ...prev, [inv.id]: prof }));
    }
  };
  const toggleInvoiceRow = async (kind, idOrInv) => {
    const key = `${kind}:${kind === "bee" ? idOrInv : idOrInv.id}`;
    if (openInvoiceKey === key) { setOpenInvoiceKey(null); return; }
    setOpenInvoiceKey(key);
    if (kind === "bee") await loadOrderDetail(idOrInv);
    else await loadFeeDetail(idOrInv);
  };
  const orderStatusGroup = (s) => s === "cancelled" ? "cancelled" : (["completed", "delivered", "picked_up"].includes(s) ? "done" : "open");
  const beeRefIncludes = (id, q) => {
    const ref = makeBeeRef(id).toLowerCase();
    const qq = (q || "").toLowerCase().trim();
    return ref.includes(qq) || ref.replace("bee-", "").startsWith(qq.replace("bee-", ""));
  };

  const STAGE_LABELS = { 1: "Erinnerung", 2: "Mahnung", 3: "Letzte Mahnung" };
  const isOverdue = (inv) => inv.status !== "paid" && !!inv.due_date && new Date(inv.due_date).getTime() < Date.now();
  const daysOverdue = (inv) => inv.due_date ? Math.max(0, Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)) : 0;
  const nextStage = (inv) => { const n = (inv.reminder_level || 0) + 1; return n <= 3 ? n : null; };
  const stageDate = (invId, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === invId && x.context.level === level);
    return e && e.created_at ? fmtDate(e.created_at) : null;
  };
  const openMahn = (inv) => {
    const level = nextStage(inv);
    if (!level) return;
    const mail = buildDunningEmail({
      level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
      amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
    });
    setMahnModal({ inv, level, subject: mail.subject, body: mail.body });
  };
  const confirmMahn = async () => {
    if (!mahnModal) return;
    await sendReminder(mahnModal.inv, mahnModal.level, mahnModal.subject, mahnModal.body);
    setMahnModal(null);
  };

  // Konto sperren / entsperren
  const toggleBan = async (u) => {
    const next = !u.is_banned;
    await supabase.from("profiles").update({ is_banned: next }).eq("id", u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: next } : x));
    flash(next ? "Konto gesperrt" : "Konto entsperrt");
  };

  const bcTargets = bcSegment === "selected"
    ? users.filter(u => bcUserIds.includes(u.id))
    : users.filter(u =>
        bcSegment === "all" ? true :
        bcSegment === "business" ? u.account_type === "business" :
        u.account_type !== "business");
  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) return;
    setBcSending(true);
    const rows = bcTargets.map(u => ({
      user_id: u.id, type: "announcement",
      title: bcTitle.trim(), message: bcMessage.trim(),
      link: bcLink.trim() || null, is_read: false,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    setBcSending(false);
    if (error) { flash("Fehler beim Senden"); return; }
    flash(`Ankündigung an ${rows.length} Nutzer gesendet`);
    setBroadcastOpen(false); setBcTitle(""); setBcMessage(""); setBcLink(""); setBcSegment("all"); setBcUserIds([]); setBcUserQuery("");
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

  // Mahnung senden — speichert die gerenderte Mail (subject + body) lesbar im email_log.
  const sendReminder = async (inv, level, subject, body) => {
    await supabase.from("fee_invoices").update({
      reminder_level: level, reminder_sent_at: new Date().toISOString(), status: "overdue",
      ...(level >= 3 ? { listings_paused: true } : {}),
    }).eq("id", inv.id);

    if (level >= 3) {
      const { data: result } = await supabase.rpc("pause_seller_listings", { p_seller_id: inv.seller_id });
      const paused = result?.paused || 0, prot = result?.protected || 0;
      flash(prot > 0 ? `Stufe 3: ${paused} pausiert, ${prot} geschützt` : `Stufe 3: ${paused} Inserate pausiert`);
    } else {
      flash(`${STAGE_LABELS[level]} gesendet`);
    }

    const ctx = { invoice_id: inv.id, level, body, seller_name: inv.sellerName, invoice_ref: inv.invoice_ref, amount: inv.total_fees };
    const { data: logged } = await supabase.from("email_log")
      .insert({ recipient_id: inv.seller_id, recipient_email: "noreply@beedaro.ch", subject, template: `reminder_${level}`, status: "sent", context: ctx })
      .select().maybeSingle();

    const patch = { reminder_level: level, status: "overdue", listings_paused: level >= 3, reminder_sent_at: new Date().toISOString() };
    setFeeInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, ...patch } : i));
    setUserInvoices(prev => { const u = { ...prev }; Object.keys(u).forEach(k => { u[k] = (u[k] || []).map(i => i.id === inv.id ? { ...i, ...patch } : i); }); return u; });
    const row = logged || { id: `tmp-${inv.id}-${level}-${Date.now()}`, recipient_id: inv.seller_id, recipient_email: "noreply@beedaro.ch", subject, template: `reminder_${level}`, status: "sent", context: ctx, created_at: new Date().toISOString() };
    setEmailLog(prev => [row, ...prev]);
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
  const orderStatusPill = (s) => {
    if (s === "cancelled") return pill("#FFEBEE", "#c62828", "Storniert");
    if (orderStatusGroup(s) === "done") return pill("#E8F5E9", "#2E7D32", "Abgeschlossen");
    const map = { confirmed: "Bestätigt", payment_marked: "Zahlung gemeldet", paid: "Bezahlt", shipped: "Versendet", payment_pending: "Rechnung offen" };
    return pill("#E3F2FD", "#1565C0", map[s] || (s || "Offen"));
  };

  const filteredUsers = users.filter(u => !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.city?.toLowerCase().includes(search.toLowerCase()));
  const filteredEmails = emailLog.filter(e => !search || (e.recipient_email || "").toLowerCase().includes(search.toLowerCase()) || (e.subject || "").toLowerCase().includes(search.toLowerCase()) || (e.template || "").toLowerCase().includes(search.toLowerCase()));
  const filteredListings = listings.filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.sellerName?.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter(o =>
    (!search || beeRefIncludes(o.id, search) || o.listingTitle?.toLowerCase().includes(search.toLowerCase()) || o.buyerName?.toLowerCase().includes(search.toLowerCase()) || o.sellerName?.toLowerCase().includes(search.toLowerCase()))
    && (orderStatusFilter === "all" || orderStatusGroup(o.status) === orderStatusFilter)
  );

  const beeInvoiceRows = orders.map(o => ({
    kind: "bee", id: o.id, ref: makeBeeRef(o.id), payer: o.buyerName, payee: o.sellerName,
    amount: parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0), status: o.status, date: o.created_at,
  }));
  const feeInvoiceRows = feeInvoices.map(inv => ({
    kind: "fee", id: inv.id, ref: inv.invoice_ref, payer: inv.sellerName, payee: "BEEDARO",
    amount: parseFloat(inv.total_fees || 0), status: inv.status, date: inv.created_at, inv,
  }));
  const invoiceRows = [
    ...(invoiceType === "fee" ? [] : beeInvoiceRows),
    ...(invoiceType === "bee" ? [] : feeInvoiceRows),
  ].filter(r => !search || (r.ref || "").toLowerCase().includes(search.toLowerCase()) || (r.payer || "").toLowerCase().includes(search.toLowerCase()) || (r.payee || "").toLowerCase().includes(search.toLowerCase()))
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Moderation: abgeleitete Mengen
  const flaggedUsers = users.filter(u => (u.contact_violations || 0) > 0);
  const bannedUsers = users.filter(u => u.is_banned);
  const openReports = reports.filter(r => !r.is_resolved);
  const openFeeInvoices = feeInvoices.filter(i => i.status !== "paid");
  const overdueInvoices = feeInvoices.filter(isOverdue).sort((a, b) => ((b.reminder_level || 0) - (a.reminder_level || 0)) || (daysOverdue(b) - daysOverdue(a)));
  const overdueSum = overdueInvoices.reduce((s, i) => s + parseFloat(i.total_fees || 0), 0);
  const nonCancelledOrders = orders.filter(o => o.status !== "cancelled");
  const gmv = nonCancelledOrders.reduce((s, o) => s + parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0), 0);
  const avgOrder = nonCancelledOrders.length ? gmv / nonCancelledOrders.length : 0;
  const topSellers = Object.values(nonCancelledOrders.reduce((acc, o) => {
    const k = o.seller_id || "?";
    if (!acc[k]) acc[k] = { name: o.sellerName || "—", count: 0, sum: 0 };
    acc[k].count += 1; acc[k].sum += parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
    return acc;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 5);
  const visibleUsers = filteredUsers.filter(u =>
    userMod === "flagged" ? (u.contact_violations || 0) > 0 :
    userMod === "banned" ? u.is_banned : true);

  const dunningTimeline = (inv) => {
    const rl = inv.reminder_level || 0;
    return (
      <div style={{ display: "flex", alignItems: "center", margin: "10px 0 2px" }}>
        {[1, 2, 3].map((s) => {
          const reached = rl >= s;
          const isNext = (rl + 1 === s) && inv.status !== "paid";
          const d = stageDate(inv.id, s);
          const ring = reached ? "#2E7D32" : isNext ? "#E65100" : "#ccc";
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: s === 1 ? "0 0 auto" : "1 1 auto" }}>
              {s > 1 && <div style={{ flex: 1, height: 2, background: rl >= s ? "#2E7D32" : "#E2E2E2", margin: "0 4px", marginBottom: 18 }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: (!reached && !isNext) ? 0.5 : 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: reached ? "#2E7D32" : "#fff", border: reached ? "none" : `2px solid ${ring}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reached ? <CheckCircle size={11} color="#fff" /> : isNext ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E65100" }} /> : null}
                </div>
                <span style={{ fontSize: 8.5, lineHeight: 1.2, textAlign: "center", color: isNext ? "#E65100" : "#757575", fontWeight: isNext ? 700 : 400 }}>
                  {STAGE_LABELS[s]}<br />{reached ? (d || "gesendet") : isNext ? "fällig" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const mahnButton = (inv) => {
    if (inv.status === "paid") return null;
    const level = nextStage(inv);
    if (!level) return <span style={{ fontSize: 11, color: "#c62828", fontWeight: 600 }}>Inserate pausiert</span>;
    const bg = level === 1 ? colors.yellow : level === 2 ? "#E65100" : "#c62828";
    const fg = level === 1 ? "#191615" : "#fff";
    return <button onClick={() => openMahn(inv)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: fg, background: bg, border: "none", borderRadius: 999, padding: "7px 14px", cursor: "pointer", fontFamily: fonts.body }}>{STAGE_LABELS[level]} senden →</button>;
  };

  const emailCard = (e) => {
    const isOpen = openEmail === e.id;
    const recName = users.find(x => x.id === e.recipient_id)?.display_name || (e.recipient_email && e.recipient_email !== "noreply@beedaro.ch" ? e.recipient_email : "—");
    const statusColor = e.status === "sent" ? ["#E8F5E9", "#2E7D32"] : e.status === "failed" ? ["#FFEBEE", "#c62828"] : ["#FFF3E0", "#E65100"];
    const body = e.context && e.context.body;
    return (
      <div key={e.id} style={{ marginBottom: 8, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden" }}>
        <div onClick={() => setOpenEmail(isOpen ? null : e.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
          <Mail size={15} color={colors.muted} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject || "(kein Betreff)"}</div>
            <div style={{ fontSize: 11, color: colors.muted }}>An: {recName}</div>
          </div>
          {e.template && pill(colors.cream, colors.muted, e.template)}
          {e.status && pill(statusColor[0], statusColor[1], e.status)}
          <span style={{ fontSize: 11, color: colors.muted, minWidth: 80, textAlign: "right" }}>{e.created_at ? fmtDate(e.created_at) : ""}</span>
          {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
        </div>
        {isOpen && (
          <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: 16, background: "#FAFAF8" }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>An: <strong style={{ color: colors.dark }}>{recName}</strong> · Betreff: <strong style={{ color: colors.dark }}>{e.subject || "—"}</strong></div>
            {body
              ? <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{body}</div>
              : <div style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>(kein Text gespeichert)</div>}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade Admin...</div>;
  if (!user) return null;

  const NAV = [
    { key: "overview", label: "Übersicht", Icon: LayoutDashboard },
    { key: "analytics", label: "Analytik", Icon: LineChart },
    { key: "users", label: "Benutzer", Icon: Users },
    { key: "orders", label: "Bestellungen", Icon: ShoppingBag },
    { key: "invoices", label: "Rechnungen", Icon: ReceiptText },
    { key: "listings", label: "Inserate", Icon: Package },
    { key: "emails", label: "E-Mails", Icon: Mail },
    { key: "dunning", label: "Mahnungen", Icon: BellRing, badge: overdueInvoices.length },
    { key: "reports", label: "Meldungen", Icon: Flag, badge: openReports.length },
  ];
  const pageTitle = NAV.find(n => n.key === tab)?.label || "Übersicht";

  const today = () => new Date().toISOString().slice(0, 10);
  const exportCurrent = () => {
    if (tab === "orders") {
      downloadCSV(`beedaro-bestellungen-${today()}.csv`,
        ["BEE-Nr", "Datum", "Artikel", "Käufer", "Verkäufer", "Preis", "Versand", "Status"],
        filteredOrders.map(o => [makeBeeRef(o.id), fmtDate(o.created_at), o.listingTitle, o.buyerName, o.sellerName, fmtCHF(o.price), fmtCHF(o.shipping_cost), o.status]));
    } else if (tab === "invoices") {
      downloadCSV(`beedaro-rechnungen-${today()}.csv`,
        ["Typ", "Nr", "Zahler", "Empfänger", "Betrag", "Status", "Datum"],
        invoiceRows.map(r => [r.kind.toUpperCase(), r.ref, r.payer, r.payee, fmtCHF(r.amount), r.status, fmtDate(r.date)]));
    } else if (tab === "users") {
      downloadCSV(`beedaro-benutzer-${today()}.csv`,
        ["Name", "Username", "Stadt", "Level", "Blüten", "Kontaktverstöße", "Gesperrt", "Erstellt"],
        visibleUsers.map(u => [u.display_name, u.username, u.city, u.bee_level || "starter", u.blueten || 0, u.contact_violations || 0, u.is_banned ? "ja" : "nein", u.created_at ? fmtDate(u.created_at) : ""]));
    }
  };

  const modPill = (on) => ({ padding: "7px 15px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, border: "none", background: on ? colors.dark : colors.cream, color: on ? "#fff" : colors.muted });

  // Übersicht-Karten
  const STAT_CARDS = [
    { label: "Benutzer", value: (stats.users ?? 0).toLocaleString("de-CH"), Icon: Users, tint: "#0E9493" },
    { label: "Aktive Inserate", value: `${stats.active ?? 0}`, sub: `von ${stats.listings ?? 0}`, Icon: Package, tint: "#0E9493" },
    { label: "Verkäufe", value: (stats.purchases ?? 0).toLocaleString("de-CH"), Icon: TrendingUp, tint: "#0E9493" },
    { label: "Gebühren", value: `CHF ${fmtCHF(stats.totalFees || 0)}`, Icon: Receipt, tint: "#D9A005" },
    { label: "Bee-Impact", value: `CHF ${fmtCHF(stats.totalImpact || 0)}`, Bee: true, tint: "#5B8C5A" },
    { label: "Meldungen", value: stats.reports ?? 0, Icon: Flag, tint: stats.reports > 0 ? "#EB5E55" : "#999", danger: stats.reports > 0 },
  ];

  const ATTENTION = [
    { n: flaggedUsers.length, label: "Geflaggte Konten", desc: "Kontaktversuche ausserhalb BEEDARO", Icon: Flag, color: "#EB5E55", onClick: () => { setTab("users"); setSearch(""); setUserMod("flagged"); } },
    { n: bannedUsers.length, label: "Gesperrte Konten", desc: "Aktuell blockiert", Icon: Ban, color: "#c0392b", onClick: () => { setTab("users"); setSearch(""); setUserMod("banned"); } },
    { n: openReports.length, label: "Offene Meldungen", desc: "Von Nutzern gemeldet", Icon: AlertTriangle, color: "#E65100", onClick: () => { setTab("reports"); setSearch(""); } },
    { n: openFeeInvoices.length, label: "Offene Rechnungen", desc: "Gebühren-Rechnungen unbezahlt", Icon: ReceiptText, color: "#E65100", onClick: () => { setTab("invoices"); setSearch(""); setInvoiceType("fee"); } },
  ];

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
          {(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices" || tab === "emails") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.cream, borderRadius: 999, padding: "8px 15px", minWidth: 220 }}>
              <Search size={15} color={colors.muted} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "users" ? "Benutzer suchen..." : tab === "listings" ? "Inserate suchen..." : tab === "orders" ? "BEE-Nummer, Artikel oder Name..." : tab === "emails" ? "Empfänger, Betreff oder Template..." : "Nummer (BEE/FEE) oder Name..."}
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
                const qrUrl = det ? qrImageUrl(orderQrPayload(det, { deposit }), 220) : null;
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
                      <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 220, fontSize: 12, lineHeight: 1.9 }}>
                          {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`], ["Bee-Rate", det?.listing?.fee_percentage != null ? `${det.listing.fee_percentage}%` : "…"]].map(([k, v], i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                            <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                            {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                          </div>
                        </div>
                        <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                          {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                          <div style={{ fontSize: 10, color: colors.muted, marginTop: 8 }}>{deposit ? "Kaution " : "Rechnung "}{ref}</div>
                          {canDeposit && (
                            <div style={{ display: "inline-flex", marginTop: 10, background: colors.cream, borderRadius: 999, padding: 2 }}>
                              {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                                <button key={lbl} onClick={() => setOrderDeposit(prev => ({ ...prev, [o.id]: val }))} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                              ))}
                            </div>
                          )}
                          <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
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
                const sc2 = sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: r.status || "?" });
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
                      const det = orderDetail[r.id];
                      const qrUrl = det ? qrImageUrl(orderQrPayload(det, { deposit: false }), 220) : null;
                      return (
                        <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 220, fontSize: 12, lineHeight: 1.9 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
                          </div>
                          <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                            {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                            <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                          </div>
                        </div>
                      );
                    })()}
                    {isOpen && r.kind === "fee" && (() => {
                      const inv = r.inv;
                      const seller = feeSeller[inv.id];
                      const ledger = feeLedger[inv.id] || [];
                      const rl = inv.reminder_level || 0;
                      const qrUrl = seller ? qrImageUrl(feeQrPayload(inv, seller), 220) : null;
                      return (
                        <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 220, fontSize: 12 }}>
                            {ledger.map(f => (
                              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <span>{fmtDate(f.created_at)} · {f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""}{f.listing_title}</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
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
                          </div>
                          <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                            {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                            <a href={`/fees/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
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
