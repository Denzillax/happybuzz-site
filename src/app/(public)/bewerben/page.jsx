"use client";

// Mitarbeiter-Bewerbung fuer Angemeldete. Beta-Tester bewerben sich NICHT:
// jeder mit Konto ist automatisch Tester (Hinweisbox oben, Link /beta).
// Es gilt: nur EINE offene Bewerbung pro Person (DB-Index applications_one_open).
// Der Klick legt eine applications-Zeile an und benachrichtigt den Owner.
// Eine Bewerbung schaltet NIE selbst eine Rolle frei; die Vergabe macht der
// Owner im Mitarbeiter-Tab. Absagen setzt status 'abgesagt': die Karte bleibt
// gesperrt, eine ANDERE Stelle wird wieder waehlbar.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import { createNotification } from "@/lib/notifications";
import { Check, X, LifeBuoy, ShieldCheck, Receipt, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { K, MONO, HEAD, BODY } from "@/lib/katalog";

const OWNER_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";

// Mitarbeiter-Funktionen: Erklärung nennt, was man tut und welche
// Admin-Bereiche man sieht (abgeleitet aus ROLE_TABS in lib/staff.js).
const FUNKTIONEN = [
  { key: "mitarbeiter_support",    label: "Support",    Icon: LifeBuoy,    desc: "Hilft Nutzern bei Fragen und Problemen. Du siehst: Benutzer, Bestellungen, Meldungen, E-Mails, Feedback." },
  { key: "mitarbeiter_moderation", label: "Moderation", Icon: ShieldCheck, desc: "Prüft neue Inserate und Meldungen, greift bei Verstössen durch. Du siehst: Inserate, Meldungen, Benutzer." },
  { key: "mitarbeiter_finance",    label: "Finanzen",   Icon: Receipt,     desc: "Behält Gebühren, Rechnungen und Mahnwesen im Blick. Du siehst: Rechnungen, Mahnungen, Analytik." },
  { key: "mitarbeiter_manager",    label: "Manager",    Icon: Briefcase,   desc: "Koordiniert den ganzen Betrieb. Du siehst: fast alle Bereiche." },
];

// Top-Level (NICHT in der Page definieren): eine Inline-Komponente wäre bei
// jedem Render ein neuer Typ, React würde alle Karten neu mounten — Klicks
// auf gerade ausgetauschte Knoten verpuffen (so beim ersten Live-Test passiert).
function Karte({ r, zustand, sperrtext, busy, onClick }) {
  // zustand: frei | neu | erledigt | abgesagt | gesperrt
  const klickbar = zustand === "frei" && !busy;
  const gruen = zustand === "neu" || zustand === "erledigt";
  const text =
    zustand === "neu" ? "Beworben. Denis meldet sich bei dir." :
    zustand === "erledigt" ? "Bewerbung abgeschlossen." :
    zustand === "abgesagt" ? "Leider müssen wir dir mitteilen: diesmal hat es nicht geklappt. Danke für dein Interesse." :
    zustand === "gesperrt" ? sperrtext :
    r.desc;
  return (
    <button onClick={onClick} disabled={!klickbar}
      style={{
        display: "block", textAlign: "left", padding: "20px 20px 18px",
        cursor: klickbar ? "pointer" : "default",
        background: gruen ? "#EEF4EC" : zustand === "abgesagt" ? "#F3EFE8" : "#fff",
        opacity: zustand === "gesperrt" ? 0.55 : 1,
        border: `1px solid ${gruen ? K.moss : K.ink}`, borderRadius: 10,
        boxShadow: zustand === "frei" ? "0 2px 8px rgba(25,22,21,.15)" : "none",
        fontFamily: BODY, transition: "all .15s",
      }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: gruen || zustand === "abgesagt" ? "#fff" : K.sand, border: "1px solid #E4E0D8", marginBottom: 12 }}>
        {gruen ? <Check size={19} color={K.moss} /> : zustand === "abgesagt" ? <X size={19} color="#A0522D" /> : <r.Icon size={19} color={K.ink} />}
      </span>
      <span style={{ display: "block", fontFamily: HEAD, fontSize: 17, fontWeight: 700, color: K.ink, marginBottom: 4 }}>
        {r.label}
      </span>
      <span style={{ display: "block", fontSize: 13, color: "rgba(20,17,13,0.6)", lineHeight: 1.55 }}>
        {text}
      </span>
    </button>
  );
}

export default function BewerbenPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [meine, setMeine] = useState({});   // role -> status
  const [busy, setBusy] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login?redirect=/bewerben"); return; }
      setUser(session.user);
      const { data } = await supabase.from("applications").select("role, status").eq("user_id", session.user.id);
      setMeine(Object.fromEntries((data || []).map(r => [r.role, r.status])));
      setReady(true);
    })();
  }, [router]);

  const offene = Object.values(meine).find(s => s === "neu")
    ? FUNKTIONEN.find(f => meine[f.key] === "neu")
    : null;

  const bewerben = async (rolle) => {
    if (busy || meine[rolle.key] || offene) return;
    setBusy(rolle.key);
    const { error } = await supabase.from("applications").insert({ user_id: user.id, role: rolle.key });
    // 23505 deckt beides ab: gleiche Rolle nochmal ODER Race auf den One-Open-Index
    if (!error || error.code === "23505") {
      setMeine(prev => ({ ...prev, [rolle.key]: "neu" }));
      if (!error) {
        const { data: p } = await supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle();
        const name = p?.display_name || p?.username || "Jemand";
        await createNotification(OWNER_ID, "application", "Neue Bewerbung", `${name} möchte als Mitarbeiter mitarbeiten (${rolle.label}).`, "/admin");
      }
    }
    setBusy(null);
  };

  if (!ready) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, color: "#9A9490" }}>Lade…</div>;

  return (
    <div style={{ background: K.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "44px 24px 80px" }}>
        <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: K.petrol, margin: "0 0 10px" }}>
          Beta-Crew · Bewerbung
        </p>
        <h1 style={{ fontFamily: HEAD, fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700, color: K.ink, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          Mitarbeiter werden.
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 15, color: "rgba(20,17,13,0.65)", lineHeight: 1.7, margin: "0 0 22px", maxWidth: 560 }}>
          Ein Klick genügt. Du bist angemeldet, wir wissen wer du bist: Denis
          bekommt deine Bewerbung direkt aufs Pult und meldet sich bei dir.
        </p>

        {/* ── Hinweis: Tester bewerben sich nicht, die sind es schon ── */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: "#FDF6E3", border: "1px solid #E4E0D8", marginBottom: 30 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: K.honey, border: "1px solid #E4E0D8", flexShrink: 0 }}>
            <Sparkles size={17} color={K.ink} />
          </span>
          <div style={{ fontFamily: BODY, fontSize: 13.5, color: K.ink, lineHeight: 1.6 }}>
            <strong>Beta-Tester?</strong> Da gibt es nichts zu bewerben: wer ein Konto hat, testet automatisch mit.
            Einfach die Seite benutzen und melden, was klemmt.{" "}
            <Link href="/beta" style={{ color: K.petrol, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              So funktioniert die Beta <ArrowRight size={12} style={{ verticalAlign: "-1px" }} />
            </Link>
          </div>
        </div>

        {/* ── Mitarbeiter: eine Stelle pro Person ── */}
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: K.ink, margin: "0 0 10px" }}>
          Offene Funktionen
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {FUNKTIONEN.map((r) => {
            const status = meine[r.key];
            const zustand = status ? status : offene ? "gesperrt" : "frei";
            return (
              <Karte key={r.key} r={r} zustand={zustand}
                sperrtext={offene ? `Du hast dich schon als ${offene.label} beworben. Eine Stelle pro Person.` : ""}
                busy={busy === r.key} onClick={() => bewerben(r)} />
            );
          })}
        </div>

        <p style={{ fontFamily: BODY, fontSize: 12.5, color: "rgba(20,17,13,0.55)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 560 }}>
          Deine Bewerbung geht direkt an Denis. Die Rolle wird persönlich vergeben,
          eine Bewerbung schaltet nichts frei. Eine Stelle pro Person: erst wenn
          eine Bewerbung entschieden ist, kannst du dich auf eine andere bewerben.
        </p>
      </div>
    </div>
  );
}
