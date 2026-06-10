"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Trophy, Target, Lock, Check, Zap, Users, Crown, TrendingUp, Loader2, Droplets, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";
import {
  BEE_LEVELS, ACHIEVEMENTS, calculateLevel, levelProgress, xpToNext,
  getUserAchievements, getChallengesWithProgress, getWeeklyLeaderboard,
  getCommunityStats, getXPHistory, touchStreak,
  NEKTAR_CATALOG,
} from "@/lib/gamification";

const REASON_LABEL = {
  listing_created: "Inserat erstellt",
  listing_published: "Inserat veröffentlicht",
  sale_completed: "Verkauf abgeschlossen",
  purchase_completed: "Kauf abgeschlossen",
  rating_given: "Bewertung abgegeben",
  rating_received_positive: "Gute Bewertung erhalten",
  rental_completed: "Vermietung abgeschlossen",
  daily_streak: "Täglicher Streak",
};
const reasonLabel = (r) => REASON_LABEL[r] || (r?.startsWith("achievement:") ? "Achievement freigeschaltet" : r);

function Card({ children, style }) {
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}
function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Icon size={18} color={colors.teal} />
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: fonts.head, color: colors.dark, flex: 1 }}>{children}</h2>
      {right}
    </div>
  );
}

export default function HivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [community, setCommunity] = useState({ totalImpact: 0, hiveMembers: 0, weekXp: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setMe(user.id);

      // Tages-Streak ticken (zählt den Besuch)
      await touchStreak(user.id);

      const [{ data: p }, ach, chs, lb, comm, hist] = await Promise.all([
        supabase.from("profiles").select("display_name, xp_total, nektar, bee_level, current_streak, longest_streak, bee_impact_total").eq("id", user.id).maybeSingle(),
        getUserAchievements(user.id),
        getChallengesWithProgress(user.id),
        getWeeklyLeaderboard(10),
        getCommunityStats(),
        getXPHistory(user.id, 8),
      ]);
      setProfile(p);
      setAchievements(ach);
      setChallenges(chs);
      setLeaderboard(lb);
      setCommunity(comm);
      setHistory(hist);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={26} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const xp = profile?.xp_total || 0;
  const level = calculateLevel(xp);
  const lvlIdx = BEE_LEVELS.indexOf(level);
  const next = BEE_LEVELS[lvlIdx + 1] || null;
  const progress = Math.round(levelProgress(xp) * 100);
  const toNext = xpToNext(xp);
  const nektar = profile?.nektar || 0;
  const unlockedKeys = new Set(achievements.map(a => a.achievement_key));
  const streak = profile?.current_streak || 0;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <BeeIcon size={26} color={colors.yellow} />
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, fontFamily: fonts.head }}>Dein Hive</h1>
        </div>

        {/* ── LEVEL HERO ── */}
        <Card style={{ background: `linear-gradient(135deg, ${level.color}14, ${colors.surface} 60%)`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: `${level.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BeeIcon size={30} color={level.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Dein Level</p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 900, fontFamily: fonts.head, color: level.color }}>{level.name}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>{xp.toLocaleString("de-CH")}</p>
              <p style={{ margin: 0, fontSize: 11, color: colors.muted, fontWeight: 600 }}>Pollen gesamt</p>
            </div>
          </div>
          {/* Progress */}
          <div style={{ height: 12, borderRadius: 6, background: colors.borderLt, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 6, background: level.color, width: `${next ? progress : 100}%`, transition: "width .6s ease-out" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
            {next ? (
              <>
                <span style={{ color: colors.dark, fontWeight: 700 }}>Noch {toNext.toLocaleString("de-CH")} Pollen bis {next.name}</span>
                <span style={{ color: colors.muted }}>Dann: {next.perk}</span>
              </>
            ) : (
              <span style={{ color: level.color, fontWeight: 700 }}>Maximales Level erreicht. Legende.</span>
            )}
          </div>

          {/* Nektar-Balance */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 14px",
            borderRadius: 12, background: "#E8A82014", border: `1px solid #E8A82033`,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#E8A82022", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Droplets size={18} color="#C8860A" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: colors.dark, fontFamily: fonts.head }}>{nektar.toLocaleString("de-CH")} Nektar</p>
              <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Einlösbare Belohnung. Verdient bei Meilensteinen.</p>
            </div>
          </div>
        </Card>

        {/* ── NEKTAR-BELOHNUNGEN (Katalog) ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon={Gift} right={<span style={{ fontSize: 12, fontWeight: 800, color: "#C8860A" }}>{nektar.toLocaleString("de-CH")} Nektar</span>}>Belohnungen einlösen</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {NEKTAR_CATALOG.map(r => {
              const affordable = nektar >= r.cost;
              return (
                <div key={r.key} style={{
                  padding: "12px 14px", borderRadius: 12, border: `1px solid ${affordable ? "#E8A82055" : colors.borderLt}`,
                  background: affordable ? "#E8A82010" : colors.surface, display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: colors.dark }}>{r.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#C8860A", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Droplets size={12} color="#C8860A" /> {r.cost}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.4, flex: 1 }}>{r.desc}</span>
                  <span style={{ alignSelf: "flex-start", marginTop: 2, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: colors.mutedLt }}>{r.group}</span>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: colors.muted }}>Einlösen kommt bald. Du siehst hier, wofür sich dein Nektar lohnt.</p>
        </Card>

        {/* ── STREAK + COMMUNITY (zwei Spalten) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="hive-two-col">
          <Card>
            <SectionTitle icon={Flame}>Streak</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flame size={44} color={streak > 0 ? "#E8622A" : colors.border} fill={streak > 0 ? "#F4A100" : "none"} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>{streak} {streak === 1 ? "Tag" : "Tage"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>Längster: {profile?.longest_streak || 0} {(profile?.longest_streak || 0) === 1 ? "Tag" : "Tage"}</p>
              </div>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: colors.muted }}>
              {streak > 0 ? "Komm morgen wieder, um deinen Streak zu halten." : "Sei heute aktiv und starte deinen Streak."}
            </p>
          </Card>
          <Card>
            <SectionTitle icon={Users}>Community-Hive</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Stat label="Bienen-Impact gesamt" value={`CHF ${community.totalImpact.toLocaleString("de-CH", { minimumFractionDigits: 2 })}`} />
              <Stat label="Aktive Hive-Mitglieder" value={community.hiveMembers.toLocaleString("de-CH")} />
              <Stat label="Pollen diese Woche" value={community.weekXp.toLocaleString("de-CH")} />
            </div>
          </Card>
        </div>

        {/* ── CHALLENGES ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon={Target} right={<span style={{ fontSize: 11, color: colors.muted }}>Wöchentlich</span>}>Challenges</SectionTitle>
          {challenges.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Aktuell keine aktiven Challenges.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {challenges.map(c => {
                const pct = Math.round((c.progress / c.target_value) * 100);
                return (
                  <div key={c.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>
                        {c.done && <Check size={14} color="#5B8C5A" style={{ verticalAlign: "-2px", marginRight: 4 }} />}
                        {c.title}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: c.done ? "#5B8C5A" : colors.teal, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Zap size={12} /> {c.xp_reward} Pollen
                      </span>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: colors.muted }}>{c.description}</p>
                    <div style={{ height: 8, borderRadius: 4, background: colors.borderLt, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: c.done ? "#5B8C5A" : colors.teal, width: `${pct}%`, transition: "width .5s" }} />
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.muted, textAlign: "right" }}>{c.progress} / {c.target_value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── ACHIEVEMENTS ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon={Trophy} right={<span style={{ fontSize: 11, color: colors.muted }}>{unlockedKeys.size}/{Object.keys(ACHIEVEMENTS).length}</span>}>Achievements</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {Object.entries(ACHIEVEMENTS).map(([key, a]) => {
              const unlocked = unlockedKeys.has(key);
              return (
                <div key={key} style={{
                  display: "flex", gap: 10, padding: "10px 12px", borderRadius: radius.md,
                  border: `1px solid ${unlocked ? colors.yellow + "55" : colors.borderLt}`,
                  background: unlocked ? colors.yellowSoft : "#fafafa", opacity: unlocked ? 1 : 0.7,
                }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {unlocked ? <Trophy size={18} color={colors.yellowDark} /> : <Lock size={16} color={colors.mutedLt} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: unlocked ? colors.dark : colors.muted }}>{a.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted, lineHeight: 1.35 }}>{a.desc}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 700, color: unlocked ? "#5B8C5A" : colors.mutedLt }}>+{a.xp} Pollen</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── LEADERBOARD ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon={Crown} right={<span style={{ fontSize: 11, color: colors.muted }}>Diese Woche</span>}>Leaderboard</SectionTitle>
          {leaderboard.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Noch keine Pollen diese Woche. Sei der Erste.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {leaderboard.map(row => {
                const isMe = row.userId === me;
                const medal = row.rank === 1 ? "#F4C03E" : row.rank === 2 ? "#B0B0B0" : row.rank === 3 ? "#CD7F32" : null;
                return (
                  <div key={row.userId} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 8,
                    background: isMe ? colors.greenSoft : "transparent",
                  }}>
                    <span style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 900, color: medal || colors.muted, fontFamily: fonts.head }}>{row.rank}</span>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: row.avatar_url ? `url(${row.avatar_url}) center/cover` : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: colors.dark, flexShrink: 0 }}>
                      {!row.avatar_url && (row.display_name || "?")[0].toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: isMe ? 800 : 600, color: colors.dark }}>{row.display_name || "Benutzer"}{isMe && " (du)"}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: colors.teal }}>{row.weekXp.toLocaleString("de-CH")} Pollen</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── RECENT XP ── */}
        {history.length > 0 && (
          <Card>
            <SectionTitle icon={TrendingUp}>Zuletzt verdient</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: "#5B8C5A", minWidth: 54 }}>
                    <Zap size={12} /> +{h.amount}
                  </span>
                  <span style={{ flex: 1, color: colors.dark }}>{reasonLabel(h.reason)}</span>
                  <span style={{ fontSize: 11, color: colors.muted }}>{new Date(h.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <style>{`@media (max-width: 640px) { .hive-two-col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 12, color: colors.muted }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: colors.dark, fontFamily: fonts.head }}>{value}</span>
    </div>
  );
}
