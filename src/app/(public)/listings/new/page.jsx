"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { createListing, uploadListingImages, updateListingStatus, getCategories, checkProfileComplete, getListing } from "@/lib/listings";
import { saveListingAttributes } from "@/lib/api/attributes";
import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import ListingForm from "@/components/listings/ListingForm";

// Übernimmt alle wiederverwendbaren Felder, aber NICHT Titel, Fotos, Id/Status.
function stripForTemplate(listing) {
  if (!listing) return null;
  const { id, slug, title, status, created_at, published_at, expires_at, view_count, favorite_count, listing_images, ...rest } = listing;
  return { ...rest, title: "", listing_images: [] };
}

export default function NewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dupId = searchParams.get("duplicate");
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [profileWarning, setProfileWarning] = useState(null);
  const [template, setTemplate] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }
      setUser(session.user);
      setCategories(await getCategories());
      if (dupId) {
        try {
          const src = await getListing(dupId);
          if (src && src.user_id === session.user.id) setTemplate(stripForTemplate(src));
        } catch {}
      }
      setReady(true);
    }
    init();
  }, [router, dupId]);

  async function useLastAsTemplate() {
    if (!user) return;
    const { data } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.id) return;
    try {
      const src = await getListing(data.id);
      setTemplate(stripForTemplate(src));
    } catch {}
  }

  async function handleSave(formData) {
    if (!user) throw new Error("Nicht eingeloggt");
    if (formData.publish) {
      const action = (formData.listing_type === "rent" || formData.listing_type === "service") ? "rent_out" : "sell";
      const check = await checkProfileComplete(user.id, action);
      if (!check.complete) {
        setProfileWarning(check.missing);
        throw new Error("Profil unvollständig");
      }
    }
    setProfileWarning(null);
    const listing = await createListing(user.id, formData);
    if (formData.newFiles?.length > 0) {
      await uploadListingImages(listing.id, formData.newFiles);
    }
    if (formData.attributeValues && Object.keys(formData.attributeValues).length > 0) {
      await saveListingAttributes(listing.id, formData.attributeValues);
    }
    if (formData.publish) {
      await updateListingStatus(listing.id, "active");
    }
    router.push("/listings");
    return listing;
  }

  if (!user || !ready) return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#F9F4EC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9490" }}>
      Lade…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#F9F4EC", minHeight: "100vh" }}>
      {profileWarning && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px 0" }}>
          <div style={{ background: "#FFF3E0", border: "1.5px solid #F4A100", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#E65100" }}>Profil unvollständig — bitte ergänzen:</p>
            {profileWarning.map((m, i) => <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "#E65100" }}>• {m}</p>)}
            <a href="/settings" style={{ display: "inline-block", marginTop: 10, padding: "8px 20px", borderRadius: 6, background: "#F4A100", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Zu den Einstellungen</a>
          </div>
        </div>
      )}
      {/* Vorlage / Duplikat-Hinweis */}
      {!template ? (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>
          <button
            onClick={useLastAsTemplate}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderRadius: 10, border: "1.5px solid #E2E2E2", background: "#fff",
              color: "#04151F", fontSize: 13, fontWeight: 700, fontFamily: "'Manrope', sans-serif", cursor: "pointer",
            }}
          >
            <Copy size={15} color="#0E9493" /> Letztes Inserat als Vorlage verwenden
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#E6F5F5", border: "1px solid #0E949333", fontSize: 13, color: "#0A7170", fontFamily: "'Manrope', sans-serif" }}>
            <Copy size={15} /> Felder aus einem bestehenden Inserat übernommen. Titel und Fotos bitte neu setzen.
          </div>
        </div>
      )}
      <ListingForm key={template ? "tpl" : "blank"} categories={categories} onSave={handleSave} onCancel={() => router.push("/listings")} isEdit={false} initialData={template} />
    </div>
  );
}
