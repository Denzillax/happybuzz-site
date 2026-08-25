"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { createNotification } from "@/lib/notifications";

const K = { ink: "#14110D", sand: "#F4F4F2", paper: "#FFFFFF", honey: "#F4C03F", petrol: "#0B5E5C" };

const RATING_TAGS = ["Schneller Versand", "Wie beschrieben", "Freundliche Kommunikation", "Faire Preise", "Gut verpackt"];

export default function RatingSection({ purchase, user, listing, isService, isBuyer, counterpartName }) {
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [ratingDone, setRatingDone] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const p = purchase;

  // Load existing rating
  useState(() => {
    if (!user || !p) return;
    supabase.from("ratings")
      .select("*")
      .eq("purchase_id", p.id)
      .eq("rater_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyRating(data); });
  }, [user?.id, p?.id]);

  // Service: erst ab Rechnung. Alle anderen: immer möglich
  if (isService && !["payment_pending", "payment_marked", "payment_confirmed", "completed"].includes(p.status)) return null;

  const submitRating = async () => {
    if (!rating) return;
    try {
      const raterId = user.id;
      const ratedId = isBuyer ? p.seller_id : p.buyer_id;
      const { error } = await supabase.from("ratings").insert({
        purchase_id: p.id, role: isBuyer ? "buyer" : "seller",
        rater_id: raterId, rated_id: ratedId,
        rating, comment: ratingComment || null, tags: selectedTags,
      });
      if (error) { console.error("Rating error:", JSON.stringify(error)); return; }
      setRatingDone(true);
      setMyRating({ rating, comment: ratingComment });
      setShowModal(false);
      // XP/Achievements (Bewertender + Bewerteter) werden serverseitig per DB-Trigger vergeben.
      // Bewerteten benachrichtigen (Glocke immer; Mail/Push je nach Einstellung review_received)
      try {
        const { data: rater } = await supabase.from("profiles").select("display_name").eq("id", raterId).maybeSingle();
        const wer = rater?.display_name || "Jemand";
        await createNotification(
          ratedId, "rating", "Neue Bewertung erhalten",
          `${wer} hat dich mit ${rating} von 5 Sternen bewertet${ratingComment ? `: "${ratingComment.slice(0, 120)}"` : "."}`,
          `/order/${p.id}`, "review_received"
        );
      } catch (e) { console.error("Rating notification:", e); }
    } catch (err) { console.error("Rating exception:", err); }
  };

  return (
    <>
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E4E0D8", padding: 20, marginBottom: 16 }}>
      {myRating || ratingDone ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 3 }}>{[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= (myRating?.rating || rating) ? colors.yellow : "none"} color={s <= (myRating?.rating || rating) ? colors.yellow : colors.muted} />)}</div>
          <span style={{ fontSize: 13, color: "#5B8C5A", fontWeight: 600 }}>Bewertung abgegeben</span>
          {(myRating?.comment || ratingComment) && <span style={{ fontSize: 12, color: colors.muted, marginLeft: "auto" }}>"{myRating?.comment || ratingComment}"</span>}
        </div>
      ) : (
        <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #E4E0D8", background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Star size={18} color={K.honey} /> {counterpartName} bewerten
        </button>
      )}
    </div>

    {showModal && (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: K.paper, borderRadius: 10, border: "1px solid #E4E0D8", padding: "28px 24px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, fontFamily: fonts.body }}>Bewertung</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: colors.muted, fontFamily: fonts.body }}>Wie war deine Erfahrung mit {counterpartName}?</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transition: "transform .1s", transform: s <= rating ? "scale(1.15)" : "scale(1)" }}>
                <Star size={36} fill={s <= rating ? colors.yellow : "none"} color={s <= rating ? colors.yellow : colors.muted} strokeWidth={1.5} />
              </button>
            ))}
          </div>
          {rating > 0 && <p style={{ textAlign: "center", fontSize: 13, color: colors.dark, fontWeight: 600, margin: "0 0 14px", fontFamily: fonts.body }}>{["", "Schlecht", "Geht so", "Okay", "Gut", "Ausgezeichnet"][rating]}</p>}
          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, justifyContent: "center" }}>
            {RATING_TAGS.map(t => {
              const on = selectedTags.includes(t);
              return (
                <button key={t} type="button" onClick={() => setSelectedTags(prev => on ? prev.filter(x => x !== t) : [...prev, t])}
                  style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontFamily: fonts.body, fontSize: 12, fontWeight: on ? 700 : 500,
                    border: "1px solid #E4E0D8", background: on ? K.honey : "#fff", color: K.ink }}>
                  {t}
                </button>
              );
            })}
          </div>
          <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Kommentar (optional)" rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E4E0D8", fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submitRating} disabled={!rating} style={{ flex: 1, padding: 14, borderRadius: 10, border: "1px solid #E4E0D8", background: rating ? K.honey : "#ddd", color: K.ink, fontSize: 14, fontWeight: 800, cursor: rating ? "pointer" : "default", fontFamily: fonts.body, boxShadow: rating ? "0 2px 8px rgba(25,22,21,.15)" : "none" }}>Bewertung abgeben</button>
            <button onClick={() => setShowModal(false)} style={{ padding: "14px 20px", borderRadius: 10, border: "1px solid #E4E0D8", background: "#fff", color: K.ink, fontSize: 13, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
