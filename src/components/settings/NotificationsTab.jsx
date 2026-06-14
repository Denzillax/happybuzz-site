"use client";
import { colors } from "@/lib/theme";
import { Check, CreditCard, Star, Bell, Eye } from "lucide-react";
import { Btn } from "./shared";
const C = colors;


  // ── Notification helpers ──
  export default function NotificationsTab({ form, setForm, showToast }) {
  const toggleNoti = (key, channel) => {
      setForm(prev => ({
        ...prev,
        noti: {
          ...prev.noti,
          [key]: { ...prev.noti[key], [channel]: !prev.noti[key][channel] },
        },
      }));
    };
  
    const toggleAllInCategory = (keys, channel) => {
      const allOn = keys.every(k => form.noti[k]?.[channel]);
      setForm(prev => {
        const newNoti = { ...prev.noti };
        keys.forEach(k => {
          newNoti[k] = { ...newNoti[k], [channel]: !allOn };
        });
        return { ...prev, noti: newNoti };
      });
    };
  
    const NotiCheckbox = ({ checked, onChange, accent }) => (
      <div
        onClick={onChange}
        style={{
          width: 22, height: 22, borderRadius: 5, cursor: "pointer",
          border: `2px solid ${checked ? (accent || C.yellow) : C.border}`,
          background: checked ? (accent || C.yellow) : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}
      >
        {checked && <Check size={13} color={checked && accent ? "#fff" : C.dark} />}
      </div>
    );
  
    const NotiCategory = ({ title, icon: CatIcon, items, keys }) => {
      const allEmail = keys.every(k => form.noti[k]?.email);
      const allPush = keys.every(k => form.noti[k]?.push);
      return (
        <div style={{ marginBottom: 24 }}>
          {/* Category header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 50px 50px",
            alignItems: "center", padding: "10px 0",
            borderBottom: `2px solid ${C.dark}`, marginBottom: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CatIcon size={16} color={C.dark} />
              <span style={{
                fontFamily: "'General Sans', sans-serif", fontSize: 15,
                letterSpacing: ".5px", color: C.dark,
              }}>{title}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <NotiCheckbox checked={allEmail} onChange={() => toggleAllInCategory(keys, "email")} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <NotiCheckbox checked={allPush} onChange={() => toggleAllInCategory(keys, "push")} />
            </div>
          </div>
          {/* Rows */}
          {items.map((item, i) => (
            <div key={item.key} style={{
              display: "grid", gridTemplateColumns: "1fr 50px 50px",
              alignItems: "center", padding: "11px 0",
              borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ paddingLeft: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{item.label}</div>
                {item.desc && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{item.desc}</div>}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <NotiCheckbox checked={form.noti[item.key]?.email} onChange={() => toggleNoti(item.key, "email")} />
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <NotiCheckbox checked={form.noti[item.key]?.push} onChange={() => toggleNoti(item.key, "push")} />
              </div>
            </div>
          ))}
        </div>
      );
    };
    const Mail = () => <CreditCard size={14} />;
    return (
      <>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 50px 50px",
          alignItems: "center", padding: "0 0 8px",
          marginBottom: 8,
        }}>
          <div />
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
            E-Mail
          </div>
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
            Push
          </div>
        </div>

        <NotiCategory
          title="KAUFEN"
          icon={CreditCard}
          keys={["buy_outbid", "buy_auction_end", "buy_won", "buy_payment"]}
          items={[
            { key: "buy_outbid",      label: "Überboten",           desc: "Jemand hat dein Gebot überboten" },
            { key: "buy_auction_end", label: "Auktion endet bald",  desc: "Auktionen auf deiner Watchlist" },
            { key: "buy_won",         label: "Auktion gewonnen",    desc: "Du hast den Zuschlag erhalten" },
            { key: "buy_payment",     label: "Zahlungsbestätigung", desc: "Zahlung eingegangen" },
          ]}
        />

        <NotiCategory
          title="VERKAUFEN"
          icon={Star}
          keys={["sell_new_bid", "sell_question", "sell_sold", "sell_expiring", "sell_report"]}
          items={[
            { key: "sell_new_bid",   label: "Neues Gebot",          desc: "Jemand hat auf deinen Artikel geboten" },
            { key: "sell_question",  label: "Neue Frage",           desc: "Frage zu deinem Inserat" },
            { key: "sell_sold",      label: "Artikel verkauft",     desc: "Dein Artikel wurde gekauft" },
            { key: "sell_expiring",  label: "Inserat läuft ab",     desc: "Erinnerung vor Ablauf" },
            { key: "sell_report",    label: "Verkaufsbericht",      desc: "Monatliche Verkaufsübersicht" },
          ]}
        />

        <NotiCategory
          title="NACHRICHTEN"
          icon={Bell}
          keys={["msg_new", "msg_offer"]}
          items={[
            { key: "msg_new",   label: "Neue Nachricht",     desc: "Jemand hat dir geschrieben" },
            { key: "msg_offer", label: "Preisvorschlag",     desc: "Jemand hat dir einen Preis vorgeschlagen" },
          ]}
        />

        <NotiCategory
          title="BEWERTUNGEN"
          icon={Star}
          keys={["review_received", "review_reminder"]}
          items={[
            { key: "review_received", label: "Neue Bewertung",      desc: "Du hast eine Bewertung erhalten" },
            { key: "review_reminder", label: "Bewertungserinnerung", desc: "Erinnere dich, den Käufer zu bewerten" },
          ]}
        />

        <NotiCategory
          title="FAVORITEN & SUCHE"
          icon={Eye}
          keys={["fav_price_change", "fav_sold", "search_new_match"]}
          items={[
            { key: "fav_price_change", label: "Preisänderung",       desc: "Ein Favorit hat den Preis geändert" },
            { key: "fav_sold",         label: "Favorit verkauft",    desc: "Ein Favorit wurde verkauft" },
            { key: "search_new_match", label: "Neue Treffer",        desc: "Neue Artikel zu deinen Suchaufträgen" },
          ]}
        />

        <NotiCategory
          title="ALLGEMEIN"
          icon={Bell}
          keys={["gen_newsletter", "gen_tips", "gen_promo"]}
          items={[
            { key: "gen_newsletter", label: "BEEDARO Newsletter",     desc: "News und neue Features" },
            { key: "gen_tips",       label: "Tipps & Tricks",         desc: "So verkaufst du erfolgreicher" },
            { key: "gen_promo",      label: "Aktionen & Angebote",    desc: "Spezialangebote und Rabattcodes" },
          ]}
        />

        <Btn onClick={() => showToast("Benachrichtigungen gespeichert")} style={{ width: "100%" }}>
          Änderungen speichern
        </Btn>
      </>
    );
  };

