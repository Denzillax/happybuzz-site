"use client";
// Zwei-Pane-Chat-Shell: links die Gesprächsliste (Sidebar), rechts der aktive
// Thread ({children} = /chat oder /chat/[id]). Desktop = beide Spalten,
// Mobile = eine Spalte (Liste ODER Thread, je nach Route).
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import { getMyConversations, setConversationHidden } from "@/lib/listings";
import Link from "next/link";
import { toast } from "sonner";
import { MessageCircle, User, Package, ShoppingBag, Tag, Trash2, RotateCcw, Search, X } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

// Eine Gesprächszeile: Desktop mit Papierkorb (Hover), Mobile mit Wisch-Geste.
// Inaktive Inserate (verkauft/gelöscht/abgelaufen) werden ausgegraut.
function ConvRow({ c, isBuyer, active, timeLabel, onHide, onRestore, hiddenView, preview }) {
  const [dx, setDx] = useState(0);
  const dragRef = useRef(null);

  const onTouchStart = (e) => {
    if (hiddenView) return;
    dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, aktiv: true };
  };
  const onTouchMove = (e) => {
    if (!dragRef.current?.aktiv) return;
    const ddx = e.touches[0].clientX - dragRef.current.x;
    const ddy = e.touches[0].clientY - dragRef.current.y;
    if (Math.abs(ddy) > Math.abs(ddx) + 8) { dragRef.current.aktiv = false; setDx(0); return; } // Scrollen gewinnt
    setDx(Math.max(-96, Math.min(0, ddx)));
  };
  const onTouchEnd = () => {
    const weit = dx < -70;
    setDx(0);
    dragRef.current = null;
    if (weit) onHide();
  };

  const grau = c.listingInactive;

  return (
    <div className="chat-rowwrap" style={{ position: "relative", overflow: "hidden" }}>
      {/* Rotes Feld hinter der Zeile: wird durch den Wisch freigelegt, Ziel ist das Archiv */}
      {!hiddenView && (
        <div style={{ position: "absolute", inset: 0, background: "#c62828", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 20, color: "#fff", fontSize: 12, fontWeight: 800 }}>
          Archiv
        </div>
      )}
      <Link href={`/chat/${c.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            background: active ? "#E6F5F5" : "#fff",
            borderLeft: `3px solid ${active ? colors.teal : "transparent"}`,
            borderBottom: `1px solid ${colors.cream}`,
            transform: `translateX(${dx}px)`,
            transition: dragRef.current?.aktiv ? "none" : "transform .18s",
          }}
        >
          {/* Inserat-Thumbnail + Avatar-Overlay */}
          <div style={{ position: "relative", flexShrink: 0, opacity: grau ? 0.55 : 1 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: colors.warm, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.listingImage ? <img src={c.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: grau ? "grayscale(1)" : "none" }} /> : <Package size={18} color={colors.mutedLt} />}
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: colors.yellowSoft, border: "2px solid #fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.otherUser?.avatar_url ? <img src={c.otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} color={colors.yellow} />}
            </div>
          </div>

          {/* Mitte */}
          <div style={{ flex: 1, minWidth: 0, opacity: grau ? 0.6 : 1 }}>
            {/* flexWrap: Chips brechen bei Platzmangel um, statt den Titel wegzudruecken */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: c.hasUnread ? 800 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 60, flex: "1 1 auto", maxWidth: "100%" }}>{c.listingTitle || "Gelöschtes Inserat"}</p>
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", padding: "1px 6px", borderRadius: 999, background: isBuyer ? "#E6F5F5" : colors.natureSoft, color: isBuyer ? colors.tealDark : "#3F6B3E" }}>
                {isBuyer ? <><ShoppingBag size={9} /> Kaufen</> : <><Tag size={9} /> Verkaufen</>}
              </span>
              {c.is_public && (
                <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", padding: "1px 6px", borderRadius: 999, background: "#FDF3D9", color: "#8a6d1a" }}>
                  Öffentlich
                </span>
              )}
              {grau && (
                <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", padding: "1px 6px", borderRadius: 999, background: "#E8E5E0", color: "#6b655e" }}>
                  {c.listingStatus === "sold" ? "Verkauft" : "Nicht mehr aktiv"}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.otherUser?.display_name || "Benutzer"}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: c.hasUnread ? colors.dark : colors.muted, fontWeight: c.hasUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview || c.lastMessagePreview || "Bild gesendet"}</p>
            {/* Wiederherstellen unter der Vorschau, damit rechts nichts ueberlappt */}
            {hiddenView && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRestore(); }}
                title="Wiederherstellen"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, border: "1px solid #E4E0D8", background: "#fff", padding: "4px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, color: colors.dark }}
              >
                <RotateCcw size={11} /> Wiederherstellen
              </button>
            )}
          </div>

          {/* Rechts: Zeit + Unread + Archivieren */}
          <div style={{ textAlign: "right", flexShrink: 0, alignSelf: "flex-start", paddingTop: 2, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontSize: 10, color: c.hasUnread ? colors.teal : colors.muted, fontWeight: c.hasUnread ? 700 : 400, whiteSpace: "nowrap" }}>{timeLabel}</span>
            {c.hasUnread && !hiddenView && <span style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: colors.teal }} />}
            {!hiddenView && (
              <button
                className="chat-del"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHide(); }}
                title="Ins Archiv verschieben"
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: colors.muted }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ChatLayout({ children }) {
  const pathname = usePathname();
  const activeId = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const onThread = !!activeId;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        setUserId(user.id);
        setConversations(await getMyConversations(user.id));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Liste aktualisieren bei Threadwechsel + wenn Nachrichten gelesen markiert wurden
  useEffect(() => {
    if (!userId) return;
    getMyConversations(userId).then(setConversations).catch(() => {});
  }, [pathname, userId]);
  useEffect(() => {
    const onRead = () => { if (userId) getMyConversations(userId).then(setConversations).catch(() => {}); };
    window.addEventListener("beedaro:messages-read", onRead);
    return () => window.removeEventListener("beedaro:messages-read", onRead);
  }, [userId]);

  // Archivieren/Wiederherstellen: sofort lokal, dann in der DB (optimistisch)
  const handleSetHidden = async (c, hidden) => {
    setConversations((prev) => prev.map((x) => x.id === c.id ? { ...x, hiddenForMe: hidden } : x));
    const { error } = await setConversationHidden(c.id, userId, hidden);
    if (error) {
      setConversations((prev) => prev.map((x) => x.id === c.id ? { ...x, hiddenForMe: !hidden } : x));
      toast.error("Konnte nicht gespeichert werden");
    } else {
      toast.success(hidden ? "Ins Archiv verschoben" : "Gespräch wiederhergestellt");
    }
  };

  const sichtbar = conversations
    .filter((c) => !c.hiddenForMe)
    .sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));
  const versteckt = conversations
    .filter((c) => c.hiddenForMe)
    .sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));

  // Suche: Inserat-Titel, Name der Gegenseite und alle Nachrichtentexte.
  // Bei Treffer im Verlauf zeigt die Vorschau den gefundenen Satz.
  const norm = (s) => (s || "").toLowerCase();
  const q = norm(searchQ.trim());
  const findSnippet = (c) => {
    if (!q) return null;
    const treffer = (c.messages || [])
      .filter((m) => norm(m.content).includes(q))
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];
    if (!treffer) return null;
    const txt = treffer.content || "";
    const i = norm(txt).indexOf(q);
    const start = Math.max(0, i - 18);
    return (start > 0 ? "…" : "") + txt.slice(start, i + q.length + 60);
  };
  const passt = (c) => !q || norm(c.listingTitle).includes(q) || norm(c.otherUser?.display_name).includes(q) || !!findSnippet(c);

  const imArchiv = filter === "archive";
  let convs = imArchiv ? versteckt : sichtbar;
  if (filter === "unread") convs = convs.filter((c) => c.hasUnread);
  if (filter === "active") convs = convs.filter((c) => !c.listingInactive);
  if (q) convs = convs.filter(passt);
  const totalUnread = sichtbar.filter((c) => c.hasUnread).length;

  const PILLS = [
    { key: "all", label: "Alle" },
    { key: "active", label: "Aktiv" },
    { key: "unread", label: "Ungelesen" },
    { key: "archive", label: versteckt.length ? `Archiv ${versteckt.length}` : "Archiv" },
  ];

  const fmtTime = (d) => {
    if (!d) return "";
    const date = new Date(d); const now = new Date();
    const diff = (now - date) / 60000;
    if (diff < 60) return `${Math.max(1, Math.floor(diff))} Min.`;
    if (diff < 1440) return `${Math.floor(diff / 60)} Std.`;
    if (diff < 2880) return "Gestern";
    return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
  };

  const leerText = () => {
    if (q) return { titel: "Keine Treffer", sub: `Nichts gefunden zu "${searchQ.trim()}".` };
    if (imArchiv) return { titel: "Archiv ist leer", sub: "Entfernte Gespräche landen hier." };
    if (filter === "unread") return { titel: "Nichts Ungelesenes", sub: "Du bist auf dem Laufenden." };
    if (filter === "active") return { titel: "Keine aktiven Gespräche", sub: "Gespräche zu aktiven Inseraten erscheinen hier." };
    return { titel: "Keine Nachrichten", sub: "Schreib einem Verkäufer über ein Inserat." };
  };

  return (
    <div className="chat-backdrop" style={{ height: "calc(100dvh - 64px)", background: "#ECEEF1", padding: 16, display: "flex", justifyContent: "center", fontFamily: fonts.body, color: colors.dark }}>
      <div className="chat-shell" style={{ display: "flex", background: colors.surface, width: "100%", maxWidth: 1360, height: "100%", overflow: "hidden", borderRadius: 10, border: `1px solid ${colors.borderLt}`, boxShadow: "0 6px 24px rgba(0,0,0,.07)" }}>

      {/* ── Sidebar: Gesprächsliste ── */}
      <aside className={`chat-sidebar${onThread ? " is-hidden-mobile" : ""}`} style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${colors.borderLt}`, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${colors.borderLt}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, fontFamily: fonts.head }}>Nachrichten</h1>
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQ(""); }}
              title="Nachrichten durchsuchen"
              style={{ border: "none", background: searchOpen ? colors.yellow : "transparent", cursor: "pointer", padding: 6, display: "flex", color: colors.dark }}
            >
              <Search size={17} />
            </button>
          </div>

          {searchOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, border: "1px solid #E4E0D8", background: "#fff", padding: "7px 10px" }}>
              <Search size={14} color={colors.muted} />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Titel, Namen und Nachrichten durchsuchen…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: fonts.body, color: colors.dark, background: "transparent", minWidth: 0 }}
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", color: colors.muted }}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {PILLS.map((s) => (
              <button key={s.key} onClick={() => setFilter(s.key)} style={{
                padding: "5px 11px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", borderRadius: 999,
                fontFamily: fonts.body, background: filter === s.key ? colors.yellow : colors.cream, color: colors.dark,
              }}>{s.label}</button>
            ))}
          </div>
          <p style={{ margin: "7px 0 0", fontSize: 12, color: colors.muted }}>{totalUnread > 0 ? `${totalUnread} ungelesen` : "Alles gelesen"}</p>
        </div>

        <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {loading && <div style={{ padding: 20, color: colors.muted, fontSize: 13 }}>Lädt…</div>}

          {!loading && convs.length === 0 && (() => { const t = leerText(); return (
            <div style={{ textAlign: "center", padding: 32, color: colors.muted }}>
              <MessageCircle size={32} color={colors.mutedLt} style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: colors.dark }}>{t.titel}</p>
              <p style={{ fontSize: 12, margin: 0 }}>{t.sub}</p>
            </div>
          ); })()}

          {!loading && convs.map((c) => (
            <div key={c.id} style={imArchiv ? { opacity: 0.75 } : undefined}>
              <ConvRow
                c={c}
                isBuyer={c.buyer_id === userId}
                active={c.id === activeId}
                timeLabel={fmtTime(c.last_message_at)}
                hiddenView={imArchiv}
                preview={findSnippet(c)}
                onHide={() => handleSetHidden(c, true)}
                onRestore={() => handleSetHidden(c, false)}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* ── Rechts: aktiver Thread / Platzhalter ── */}
      <main className={`chat-main${onThread ? "" : " is-hidden-mobile"}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      </div>
    </div>
  );
}
