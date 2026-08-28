// BEEDARO Versand-Worker: verarbeitet email_log (pending) via Resend und
// push_queue (pending) via Web Push. Wird von pg_cron im Minutentakt mit dem
// x-worker-token aus dem Vault aufgerufen (siehe Migration notify_push_infra).
// WICHTIG: verify_jwt MUSS false sein — der Cron ruft ohne JWT auf, die
// Absicherung ist der x-worker-token (19.08.2026: ein Redeploy mit true
// blockierte den ganzen Versand).
// Geheimnisse kommen ausschliesslich aus dem Vault (RPC worker_secret,
// nur service_role): resend_api_key, vapid_public_key, vapid_private_key,
// notify_worker_token.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SITE = "https://beedaro.ch";

function absoluteLink(link: string | null): string | null {
  if (!link) return null;
  return link.startsWith("http") ? link : SITE + (link.startsWith("/") ? link : "/" + link);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Klar-Look wie die Website: heller Grund, weisse Karte mit Hairline,
// runde Honey-Buttons. Optional zeigt context.image (+ context.item_title)
// eine kleine Artikel-Karte ueber dem Text.
function renderEmail(row: { subject: string; template: string; context: Record<string, unknown> | null }): string {
  const ctx = row.context ?? {};
  const isReminder = row.template?.startsWith("reminder");
  const kicker = isReminder ? "Zahlungserinnerung" : "Benachrichtigung";
  const bodyText = String((isReminder ? ctx.body : ctx.message) ?? "");
  const link = absoluteLink(String(ctx.link ?? "") || (isReminder ? "/fees" : null));
  const image = typeof ctx.image === "string" && ctx.image.startsWith("http") ? ctx.image : null;
  const itemTitle = typeof ctx.item_title === "string" ? ctx.item_title : null;
  const button = link
    ? `<table cellpadding="0" cellspacing="0"><tr><td style="background:#F4C03F;border-radius:999px;"><a href="${link}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#191615;text-decoration:none;border-radius:999px;">Auf Beedaro ansehen</a></td></tr></table>`
    : "";
  const itemCard = image
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="background:#F4F4F2;border-radius:12px;padding:10px;"><table cellpadding="0" cellspacing="0"><tr><td style="width:72px;"><img src="${image}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:8px;object-fit:cover;"></td><td style="vertical-align:middle;padding-left:4px;"><p style="margin:0;font-size:14px;font-weight:700;color:#191615;line-height:1.4;">${escapeHtml(itemTitle ?? "")}</p></td></tr></table></td></tr></table>`
    : "";
  // Vollstaendiges HTML-Dokument mit charset: ohne <meta charset> raten
  // Mail-Clients (GMX, Outlook) die Kodierung und zerlegen Umlaute.
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F2;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E0D8;border-radius:14px;"><tr><td style="padding:32px 36px 28px;"><img src="${SITE}/logo-email.png" alt="Beedaro" width="140" style="display:block;width:140px;height:auto;margin:0 0 14px;"><p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:.5px;color:#8a8580;text-transform:uppercase;">${kicker}</p><h1 style="margin:0 0 12px;font-size:21px;font-weight:700;color:#191615;">${escapeHtml(row.subject)}</h1>${itemCard}<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#3d3a36;white-space:pre-line;">${escapeHtml(bodyText)}</p>${button}<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8a8580;">Welche Mails du bekommst, steuerst du unter Einstellungen &gt; Benachrichtigungen.</p></td></tr><tr><td style="border-top:1px solid #E4E0D8;padding:14px 36px;"><p style="margin:0;font-size:11px;color:#8a8580;">Kaufen. Verkaufen. Gutes tun. &nbsp;&middot;&nbsp; beedaro.ch</p></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const token = req.headers.get("x-worker-token") ?? "";
  const { data: expected } = await supabase.rpc("worker_secret", { p_name: "notify_worker_token" });
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const result = { emails_sent: 0, emails_failed: 0, push_sent: 0, push_failed: 0, notes: [] as string[] };

  // ── E-Mails (email_log, status pending) ──
  const { data: resendKey } = await supabase.rpc("worker_secret", { p_name: "resend_api_key" });
  const { data: mails } = await supabase
    .from("email_log").select("*")
    .eq("status", "pending").order("created_at", { ascending: true }).limit(25);

  if (mails?.length && !resendKey) {
    result.notes.push("resend_api_key fehlt im Vault, E-Mails bleiben pending");
  } else if (mails?.length) {
    for (const m of mails) {
      try {
        // Mahnwesen loggt noreply@ als Platzhalter; echte Adresse liegt in auth.users
        let to: string | null = m.recipient_email;
        if (!to || to === "noreply@beedaro.ch") {
          const { data: u } = await supabase.auth.admin.getUserById(m.recipient_id);
          to = u?.user?.email ?? null;
        }
        if (!to) throw new Error("Keine Empfaengeradresse");
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "Beedaro Info <noreply@beedaro.ch>", to, subject: m.subject, html: renderEmail(m) }),
        });
        if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
        await supabase.from("email_log").update({ status: "sent" }).eq("id", m.id);
        result.emails_sent++;
      } catch (e) {
        await supabase.from("email_log").update({
          status: "failed",
          context: { ...(m.context ?? {}), error: String(e).slice(0, 500) },
        }).eq("id", m.id);
        result.emails_failed++;
      }
    }
  }

  // ── Push (push_queue, status pending) ──
  const { data: vapidPub } = await supabase.rpc("worker_secret", { p_name: "vapid_public_key" });
  const { data: vapidPriv } = await supabase.rpc("worker_secret", { p_name: "vapid_private_key" });
  const { data: pushes } = await supabase
    .from("push_queue").select("*")
    .eq("status", "pending").order("created_at", { ascending: true }).limit(50);

  if (pushes?.length && (!vapidPub || !vapidPriv)) {
    result.notes.push("VAPID-Schluessel fehlen im Vault, Push bleibt pending");
  } else if (pushes?.length) {
    const vapidDetails = { subject: "mailto:noreply@beedaro.ch", publicKey: vapidPub, privateKey: vapidPriv };
    for (const p of pushes) {
      const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("user_id", p.user_id);
      if (!subs?.length) {
        await supabase.from("push_queue").update({ status: "skipped", error: "kein Geraet registriert" }).eq("id", p.id);
        continue;
      }
      let delivered = 0;
      let lastErr = "";
      for (const s of subs) {
        try {
          // urgency high: sonst spart FCM die Zustellung bei doezenden Geraeten
          // (Batteriesparmodus) auf und die Meldung kommt spaet oder gar nicht
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: p.title, message: p.message, link: p.link }),
            { vapidDetails, TTL: 86400, urgency: "high" },
          );
          delivered++;
        } catch (e: unknown) {
          const status = (e as { statusCode?: number })?.statusCode;
          lastErr = String(status ?? e).slice(0, 300);
          // 404/410 = Abo abgelaufen oder widerrufen, Geraet austragen
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }
      if (delivered > 0) {
        await supabase.from("push_queue").update({ status: "sent" }).eq("id", p.id);
        result.push_sent++;
      } else {
        await supabase.from("push_queue").update({ status: "failed", error: lastErr }).eq("id", p.id);
        result.push_failed++;
      }
    }
  }

  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
