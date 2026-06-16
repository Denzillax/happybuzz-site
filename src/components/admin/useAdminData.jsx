"use client";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, Shield, Users, Package, Receipt, ReceiptText, ShoppingBag, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star, ArrowLeft, Download, Mail, BellRing, LineChart, Megaphone, ScrollText } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { TrendChart } from "@/components/admin/TrendChart";
import { bucketDaily, countByType } from "@/lib/adminAnalytics";
import BeeIcon from "@/components/shared/BeeIcon";
import { TypeBadge } from "@/components/shared/Badge";
import { colors, fonts, radius } from "@/lib/theme";
import { makeBeeRef, parseArtRef, artIdRange, artRefMatches } from "@/lib/fees";
import { PURCHASE_STATUS } from "@/lib/orderStatus";
import { buildDunningEmail, DUNNING_GAP_DAYS } from "@/lib/dunning";
import { th, td, pill, bcFieldLabel, bcInput, chartCard, chartHead, chartLabel, chartBig, chartSub, sumSeries, axisLabels } from "@/components/admin/adminStyles";

const ADMIN_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";

export function useAdminData() {
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
  const [refListings, setRefListings] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [openOrder, setOpenOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState({});
  const [orderDeposit, setOrderDeposit] = useState({});
  const [emailLog, setEmailLog] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
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
      const { data: invData } = await supabase.from("fee_invoices").select("total_fees, total_bee_impact, status");
      const sumWhere = (pred, field) => (invData || []).filter(pred).reduce((s, f) => s + parseFloat(f[field] || 0), 0);
      const isPaidInv = (f) => f.status === "paid";
      const isOpenInv = (f) => f.status !== "paid" && f.status !== "cancelled";
      const feesPaid = sumWhere(isPaidInv, "total_fees");
      const feesOpen = sumWhere(isOpenInv, "total_fees");
      const impactPaid = sumWhere(isPaidInv, "total_bee_impact");
      const impactOpen = sumWhere(isOpenInv, "total_bee_impact");
      const { count: reportCount } = await supabase.from("reports").select("*", { count: "exact", head: true });
      setStats({ users: userCount, listings: listingCount, active: activeCount, purchases: purchaseCount, feesPaid, feesOpen, impactPaid, impactOpen, reports: reportCount || 0 });

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

  useEffect(() => {
    if (tab !== "listings") { setRefListings([]); return; }
    const range = artIdRange(parseArtRef(search));
    if (!range) { setRefListings([]); return; }
    let active = true;
    (async () => {
      const { data } = await supabase.from("listings").select("*").gte("id", range.lo).lte("id", range.hi);
      if (!active) return;
      const rows = data || [];
      const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
      let nameMap = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        nameMap = Object.fromEntries((profs || []).map(p => [p.id, p.display_name]));
      }
      setRefListings(rows.map(r => ({ ...r, sellerName: nameMap[r.user_id] || "—" })));
    })();
    return () => { active = false; };
  }, [tab, search]);

  useEffect(() => {
    if (tab !== "audit") return;
    let active = true;
    (async () => {
      setAuditLoading(true);
      try {
        const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
        if (active) setAuditLog(data || []);
      } finally {
        if (active) setAuditLoading(false);
      }
    })();
    return () => { active = false; };
  }, [tab]);

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
      const pids = [...new Set((items || []).map(i => i.purchase_id).filter(Boolean))];
      let lidMap = {};
      if (pids.length) {
        const { data: purs } = await supabase.from("purchases").select("id, listing_id").in("id", pids);
        lidMap = Object.fromEntries((purs || []).map(p => [p.id, p.listing_id]));
      }
      setFeeLedger(prev => ({ ...prev, [inv.id]: (items || []).map(i => ({ ...i, listing_id: lidMap[i.purchase_id] || null })) }));
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
  const stageSentAt = (invId, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === invId && x.context.level === level);
    return e?.created_at ? new Date(e.created_at) : null;
  };
  const nextStageInfo = (inv) => {
    if (inv.status === "paid") return null;
    const level = nextStage(inv);
    if (!level) return null;
    let dueDate;
    if (level === 1) {
      dueDate = inv.due_date ? new Date(inv.due_date) : null;
    } else {
      const prevAt = stageSentAt(inv.id, level - 1) || (inv.reminder_sent_at ? new Date(inv.reminder_sent_at) : null);
      dueDate = prevAt ? new Date(prevAt.getTime() + DUNNING_GAP_DAYS * 86400000) : null;
    }
    const isDue = !!dueDate && dueDate.getTime() <= Date.now();
    const daysUntil = dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / 86400000)) : 0;
    return { level, dueDate, isDue, daysUntil };
  };
  const openSentMail = (inv, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === inv.id && x.context.level === level);
    if (!e) { flash("Keine gesendete Mail gefunden"); return; }
    let body = e.context?.body;
    if (!body) {
      // Altfälle ohne gespeicherten Text: aus der Vorlage rekonstruieren
      body = buildDunningEmail({
        level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
        amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
      }).body;
    }
    setMahnModal({ inv, level, subject: e.subject, body, mode: "view", sentAt: e.created_at });
  };
  const openMahn = (inv) => {
    const level = nextStage(inv);
    if (!level) return;
    const mail = buildDunningEmail({
      level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
      amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
    });
    setMahnModal({ inv, level, subject: mail.subject, body: mail.body, mode: "send" });
  };
  const confirmMahn = async () => {
    if (!mahnModal) return;
    await sendReminder(mahnModal.inv, mahnModal.level, mahnModal.subject, mahnModal.body);
    setMahnModal(null);
  };
  const bulkSendDue = async () => {
    if (dunningDue.length === 0) return;
    if (!confirm(`${dunningDue.length} fällige Mahnung(en) senden?`)) return;
    let n = 0;
    for (const inv of dunningDue) {
      const info = nextStageInfo(inv);
      if (!info) continue;
      const mail = buildDunningEmail({
        level: info.level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
        amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
      });
      await sendReminder(inv, info.level, mail.subject, mail.body);
      n++;
    }
    flash(`${n} Mahnung(en) gesendet`);
  };

  const logAdmin = async (action, targetType, targetLabel, detail = null) => {
    const row = { admin_id: user?.id || null, action, target_type: targetType, target_label: targetLabel, detail };
    const { data } = await supabase.from("admin_audit_log").insert(row).select().maybeSingle();
    setAuditLog(prev => [data || { ...row, id: `tmp-${Date.now()}`, created_at: new Date().toISOString() }, ...prev]);
  };

  // Konto sperren / entsperren
  const toggleBan = async (u) => {
    const next = !u.is_banned;
    await supabase.from("profiles").update({ is_banned: next }).eq("id", u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: next } : x));
    flash(next ? "Konto gesperrt" : "Konto entsperrt");
    logAdmin(next ? "ban" : "unban", "user", u.display_name || u.username);
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
    logAdmin("broadcast", "broadcast", bcTitle.trim(), { count: rows.length, segment: bcSegment });
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
    const _l = listings.find(x => x.id === listingId); logAdmin(newStatus === "paused" ? "listing_pause" : "listing_activate", "listing", _l?.title || listingId);
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
    logAdmin("reminder", "invoice", inv.invoice_ref, { level, seller: inv.sellerName });
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
    const _i = feeInvoices.find(x => x.id === invId); logAdmin("fee_paid", "invoice", _i?.invoice_ref || invId);
  };

  // Bestellung stornieren
  const cancelOrder = async (orderId, listingId) => {
    await supabase.from("purchases").update({ status: "cancelled" }).eq("id", orderId);
    await supabase.from("fee_ledger").update({ status: "cancelled" }).eq("purchase_id", orderId);
    if (listingId) await supabase.from("listings").update({ status: "active" }).eq("id", listingId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    flash("Bestellung storniert — Gebühr entfernt, Artikel reaktiviert");
    logAdmin("order_cancel", "order", makeBeeRef(orderId));
  };

  // Bewertung löschen
  const deleteReview = async (reviewId) => {
    await supabase.from("ratings").delete().eq("id", reviewId);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    flash("Bewertung gelöscht");
    const _rv = reviews.find(x => x.id === reviewId); logAdmin("review_delete", "review", _rv ? `${_rv.reviewerName} → ${_rv.revieweeName}` : reviewId);
  };

  // Report erledigen
  const resolveReport = async (reportId) => {
    await supabase.from("reports").update({ is_resolved: true }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
    flash("Meldung als erledigt markiert");
    const _r = reports.find(x => x.id === reportId); logAdmin("report_resolve", "report", _r?.listingTitle || _r?.reason || reportId);
  };

  // Gemeldetes Inserat pausieren
  const pauseReportedListing = async (reportId, listingId) => {
    await supabase.from("listings").update({ status: "paused" }).eq("id", listingId);
    await supabase.from("reports").update({ is_resolved: true }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
    flash("Inserat pausiert + Meldung erledigt");
    const _r = reports.find(x => x.id === reportId); logAdmin("report_pause_listing", "listing", _r?.listingTitle || listingId);
  };

  const sc = { open: { color: "#E65100", bg: "#FFF3E0", label: "Offen" }, pending_payment: { color: "#1565C0", bg: "#E3F2FD", label: "Gemeldet" }, paid: { color: "#2E7D32", bg: "#E8F5E9", label: "Bezahlt" }, overdue: { color: "#c62828", bg: "#FFEBEE", label: "Überfällig" } };
  const statusPill = (status) => {
    const map = { active: ["#E8F5E9", "#2E7D32", "Aktiv"], draft: ["#f5f5f5", "#666", "Entwurf"], paused: ["#FFF3E0", "#E65100", "Pausiert"], sold: ["#E3F2FD", "#1565C0", "Verkauft"], rented: ["#E3F2FD", "#1565C0", "Vermietet"], inactive: ["#f5f5f5", "#666", "Inaktiv"], pending_pause: ["#FFEBEE", "#c62828", "Wird pausiert"], deleted: ["#FFEBEE", "#c62828", "Gelöscht"], expired: ["#f5f5f5", "#666", "Abgelaufen"] };
    const [bg, col, lbl] = map[status] || map.draft;
    return pill(bg, col, lbl);
  };
  const orderStatusPill = (s) => {
    if (s === "cancelled") return pill("#FFEBEE", "#c62828", "Storniert");
    if (orderStatusGroup(s) === "done") return pill("#E8F5E9", "#2E7D32", "Abgeschlossen");
    return pill("#E3F2FD", "#1565C0", PURCHASE_STATUS[s]?.label || "Offen");
  };

  const filteredUsers = users.filter(u => !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.city?.toLowerCase().includes(search.toLowerCase()));
  const filteredEmails = emailLog.filter(e => !search || (e.recipient_email || "").toLowerCase().includes(search.toLowerCase()) || (e.subject || "").toLowerCase().includes(search.toLowerCase()) || (e.template || "").toLowerCase().includes(search.toLowerCase()));
  const filteredListings = listings.filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.sellerName?.toLowerCase().includes(search.toLowerCase()) || artRefMatches(l.id, search));
  const visibleListings = (() => {
    const ids = new Set(filteredListings.map(l => l.id));
    return [...filteredListings, ...refListings.filter(r => !ids.has(r.id))];
  })();
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
  const dunningDue    = overdueInvoices.filter(i => nextStageInfo(i)?.isDue).sort((a, b) => daysOverdue(b) - daysOverdue(a));
  const dunningSoon   = overdueInvoices.filter(i => { const n = nextStageInfo(i); return n && !n.isDue; }).sort((a, b) => nextStageInfo(a).daysUntil - nextStageInfo(b).daysUntil);
  const dunningPaused = overdueInvoices.filter(i => !nextStageInfo(i)).sort((a, b) => daysOverdue(b) - daysOverdue(a));
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
      <div style={{ display: "flex", alignItems: "flex-start", margin: "12px 0 2px" }}>
        {[1, 2, 3].map((s) => {
          const reached = rl >= s;
          const isNext = (rl + 1 === s) && inv.status !== "paid";
          const d = stageDate(inv.id, s);
          const clickable = reached || isNext;
          const onClick = reached ? () => openSentMail(inv, s) : isNext ? () => openMahn(inv) : undefined;
          return (
            <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: s === 1 ? "0 0 auto" : "1 1 auto" }}>
              {s > 1 && <div style={{ flex: 1, height: 2, background: rl >= s ? "#2E7D32" : "#E2E2E2", margin: "0 6px", marginTop: 12 }} />}
              <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 96, cursor: clickable ? "pointer" : "default", opacity: (!reached && !isNext) ? 0.5 : 1 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: reached ? "#2E7D32" : "#fff", border: reached ? "none" : `2px solid ${isNext ? "#E65100" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reached ? <CheckCircle size={15} color="#fff" /> : isNext ? <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E65100" }} /> : null}
                </div>
                <span style={{ fontSize: 11, lineHeight: 1.25, textAlign: "center", color: isNext ? "#E65100" : reached ? colors.dark : "#9e9e9e", fontWeight: isNext ? 700 : 500 }}>{STAGE_LABELS[s]}</span>
                {reached ? (
                  <span style={{ fontSize: 11, color: colors.muted, display: "inline-flex", alignItems: "center", gap: 3 }}><Eye size={12} /> Mail{d ? ` · ${d}` : ""}</span>
                ) : isNext ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "1px 8px", borderRadius: 999 }}>senden</span>
                ) : null}
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

  const NAV = [
    { key: "overview", label: "Übersicht", Icon: LayoutDashboard },
    { key: "analytics", label: "Analytik", Icon: LineChart },
    { key: "users", label: "Benutzer", Icon: Users },
    { key: "orders", label: "Bestellungen", Icon: ShoppingBag },
    { key: "invoices", label: "Rechnungen", Icon: ReceiptText },
    { key: "listings", label: "Inserate", Icon: Package },
    { key: "emails", label: "E-Mails", Icon: Mail },
    { key: "dunning", label: "Mahnungen", Icon: BellRing, badge: overdueInvoices.length },
    { key: "audit", label: "Protokoll", Icon: ScrollText },
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
    { feeToggle: true, label: "Gebühren", Icon: Receipt, tint: "#D9A005" },
    { label: "Meldungen", value: stats.reports ?? 0, Icon: Flag, tint: stats.reports > 0 ? "#EB5E55" : "#999", danger: stats.reports > 0 },
  ];

  const ATTENTION = [
    { n: flaggedUsers.length, label: "Geflaggte Konten", desc: "Kontaktversuche ausserhalb BEEDARO", Icon: Flag, color: "#EB5E55", onClick: () => { setTab("users"); setSearch(""); setUserMod("flagged"); } },
    { n: bannedUsers.length, label: "Gesperrte Konten", desc: "Aktuell blockiert", Icon: Ban, color: "#c0392b", onClick: () => { setTab("users"); setSearch(""); setUserMod("banned"); } },
    { n: openReports.length, label: "Offene Meldungen", desc: "Von Nutzern gemeldet", Icon: AlertTriangle, color: "#E65100", onClick: () => { setTab("reports"); setSearch(""); } },
    { n: openFeeInvoices.length, label: "Offene Rechnungen", desc: "Gebühren-Rechnungen unbezahlt", Icon: ReceiptText, color: "#E65100", onClick: () => { setTab("invoices"); setSearch(""); setInvoiceType("fee"); } },
  ];

  return {
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
    nextStageInfo, dunningDue, dunningSoon, dunningPaused, openSentMail, bulkSendDue,
    broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, bcTargets, sendBroadcast,
    analyticsRange, setAnalyticsRange, analyticsLoading,
    auditLog, auditLoading, logAdmin,
    toggleBan, toggleListingStatus, cancelOrder, deleteReview, resolveReport, pauseReportedListing, statusPill, modPill, emailCard,
    NAV, pageTitle, exportCurrent, STAT_CARDS, ATTENTION, sc,
  };
}
