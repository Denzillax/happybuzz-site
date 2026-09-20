"use client";
// Emoji-Auswahl (Denis, 16.09. / 18.09.2026): ein Baustein fuer den Chat und fuer die
// oeffentlichen Fragen auf dem Inserat. Fuegt an der Cursorposition des Eingabefelds ein.
import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { colors } from "@/lib/theme";

export const EMOJI_GRUPPEN = [
    { name: "Smileys", liste: ["🙂","😄","😁","😂","🤣","😉","😊","😍","🥰","😘","😎","🤩","🥳","😅","😜","🤔","🤨","😐","🙄","😴","😢","😭","😡","🤯","🤗","🤫","🤭","🫣","😇","🥺","🤒","🤠"] },
    { name: "Gesten", liste: ["👍","👎","👌","🤞","✌️","🤙","👋","🙏","🙌","👏","🤝","💪","☝️","👉","👈","🫶","❤️","🧡","💛","💚","💙","💔","🔥","⭐","✨","💯","✅","❌","❓","❗","⚠️","🚫"] },
    { name: "Handel", liste: ["📦","🚚","🚗","🚲","🏠","📍","🗓️","⏰","💰","💵","💳","🧾","🏷️","🎁","🔑","📸","📱","💻","🎮","🎧","👕","👟","👜","⌚","📚","🛋️","🌱","🐝","🎉","🍀","☀️","🌧️"] },
];

// Besteht die Nachricht nur aus (bis zu 8) Emojis? Dann wird sie gross gezeigt.
export const istNurEmoji = (text) =>
  !!text && /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s){1,8}$/u.test(String(text).trim());

export default function EmojiPicker({ value, onChange, inputRef, size = 38 }) {
  const [offen, setOffen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!offen) return;
    const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOffen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);

  const einfuegen = (e) => {
    const el = inputRef?.current, text = value || "";
    const start = el?.selectionStart ?? text.length, end = el?.selectionEnd ?? text.length;
    onChange(text.slice(0, start) + e + text.slice(end));
    requestAnimationFrame(() => { if (el) { el.focus(); const pos = start + e.length; el.setSelectionRange(pos, pos); } });
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" onClick={() => setOffen(o => !o)} title="Emoji einfügen" aria-label="Emoji einfügen" aria-expanded={offen}
        style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${offen ? colors.teal : colors.border}`, background: offen ? "#DBF5F0" : colors.cream, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Smile size={18} color={offen ? colors.teal : colors.muted} />
      </button>
      {offen && (
        <div style={{ position: "absolute", bottom: size + 8, left: 0, zIndex: 60, width: 8 * 34 + 16, maxWidth: "calc(100vw / var(--bd-zoom, 1) - 28px)", maxHeight: 260, overflowY: "auto", background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 20, boxShadow: "0 18px 40px -18px rgba(29,29,29,.35)", padding: 8 }}>
          {EMOJI_GRUPPEN.map(g => (
            <div key={g.name} style={{ marginBottom: 6 }}>
              <p style={{ margin: "2px 0 2px 4px", fontSize: 10.5, fontWeight: 700, color: colors.mutedLt, textTransform: "uppercase", letterSpacing: ".04em" }}>{g.name}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 34px)", gap: 2 }}>
                {g.liste.map(e => (
                  <button key={e} type="button" className="eckig" onClick={() => einfuegen(e)} style={{ width: 34, height: 34, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>{e}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
