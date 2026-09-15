// POST /api/ai-tags  { listingId, force? }
// Bild-Merkmale fuer ein Inserat berechnen und speichern (einmal pro Inserat).
// Wird nach dem Einreichen eines Inserats vom Formular aufgerufen; die RPC
// dahinter laesst nur Eigentuemer/Staff (bzw. write-once) schreiben.
import { ensureImageTags } from "@/lib/server/imageTags";

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const check = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!check.ok) return Response.json({ error: "unauthorized" }, { status: 401 });
  } catch { return Response.json({ error: "auth_failed" }, { status: 401 }); }

  let body; try { body = await req.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const id = String(body?.listingId || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "bad_id" }, { status: 400 });
  try {
    const tags = await ensureImageTags(id, token, { force: body?.force === true });
    if (tags === null) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ tags });
  } catch (e) {
    return Response.json({ error: String(e?.message || "failed") }, { status: 502 });
  }
}
