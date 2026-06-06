"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ChevronDown } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function MessagePanel({ questions, user, listing, isOwner, onSendMsg }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgPublic, setMsgPublic] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const l = listing;

  const handleSend = async () => {
    if (!user || !msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      await onSendMsg(msgText.trim(), isOwner ? true : msgPublic);
      setMsgText("");
    } catch (e) { console.error(e); }
    setSendingMsg(false);
  };

  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 20 }}>
      {/* Header mit Toggle */}
      <div onClick={() => setMsgOpen(!msgOpen)} style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageCircle size={16} color={colors.muted} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Nachrichten</p>
          {questions.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.teal, background: `${colors.teal}12`, padding: "2px 8px", borderRadius: 10 }}>
              {questions.reduce((sum, q) => sum + (q.messages?.length || 0), 0)}
            </span>
          )}
        </div>
        <ChevronDown size={18} color={colors.muted} style={{ transform: msgOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>

      {msgOpen && (
      <>
      <div style={{ padding: "0 20px 10px", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", justifyContent: "flex-end" }}>
        {isOwner ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.muted, padding: "5px 12px", background: colors.cream, borderRadius: 6 }}>Öffentlich</span>
        ) : (
          <div style={{ display: "flex", background: colors.cream, borderRadius: 6, overflow: "hidden", border: `1px solid ${colors.borderLt}` }}>
            <button onClick={() => setMsgPublic(true)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, border: "none", background: msgPublic ? colors.yellow : "transparent", color: colors.dark, transition: "all .15s" }}>
              Öffentlich ({questions.filter(q => q.is_public).length})
            </button>
            <button onClick={() => setMsgPublic(false)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, border: "none", background: !msgPublic ? colors.yellow : "transparent", color: colors.dark, transition: "all .15s" }}>
              Privat ({questions.filter(q => !q.is_public).length})
            </button>
          </div>
        )}
      </div>

      {/* Chat-Bereich */}
      <div style={{ height: 320, overflowY: "auto", padding: "16px 20px", background: colors.cream }}>
        {(() => {
          const viewPublic = isOwner ? true : msgPublic;
          const filtered = questions.filter(q => viewPublic ? q.is_public : !q.is_public);
          const allMsgs = filtered.flatMap(q => q.messages.map(m => ({ ...m, convId: q.id })));
          allMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          return allMsgs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allMsgs.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const isSeller = msg.sender_id === l.user_id;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "75%", padding: "8px 12px", borderRadius: 14,
                      background: isMe ? colors.yellow : colors.surface,
                      border: isMe ? "none" : `1px solid ${colors.borderLt}`,
                      borderBottomRightRadius: isMe ? 4 : 14,
                      borderBottomLeftRadius: isMe ? 14 : 4,
                    }}>
                      {!isMe && (
                        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: isSeller ? colors.blue : colors.dark }}>
                          {msg.sender?.display_name || "Benutzer"}
                          {isSeller && <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: colors.blue, color: "#fff", fontWeight: 600, marginLeft: 4 }}>Verkäufer</span>}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: colors.dark }}>{msg.content}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: isMe ? "rgba(0,0,0,.35)" : colors.mutedLt, textAlign: "right" }}>
                        {new Date(msg.created_at).toLocaleString("de-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: colors.mutedLt }}>
                {(isOwner || msgPublic) ? "Noch keine öffentlichen Nachrichten." : "Noch keine privaten Nachrichten."}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Input-Bar */}
      {user && l.status === "active" && (
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.borderLt}`, background: colors.surface, display: "flex", gap: 8, alignItems: "center" }}>
          <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && msgText.trim() && handleSend()}
            placeholder={isOwner ? "Öffentliche Nachricht als Verkäufer..." : (msgPublic ? "Öffentliche Nachricht..." : "Private Nachricht...")}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: `1.5px solid ${colors.borderLt}`, fontSize: 13, fontFamily: fonts.body, outline: "none", background: colors.cream }} />
          <button onClick={handleSend} disabled={!msgText.trim() || sendingMsg}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: msgText.trim() ? colors.yellow : colors.warm, cursor: msgText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
            <MessageCircle size={16} color={msgText.trim() ? colors.dark : colors.mutedLt} />
          </button>
        </div>
      )}

      {!user && l.status === "active" && (
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.borderLt}`, background: colors.surface }}>
          <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
            <Link href="/login" style={{ color: colors.blue }}>Anmelden</Link> um eine Nachricht zu schreiben.
          </p>
        </div>
      )}
      </>
      )}
    </div>
  );
}
