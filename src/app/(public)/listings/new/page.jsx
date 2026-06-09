"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useRouter } from "next/navigation";
import { createListing, uploadListingImages, updateListingStatus, getCategories, checkProfileComplete } from "@/lib/listings";
import { saveListingAttributes } from "@/lib/api/attributes";
import { useState, useEffect } from "react";
import ListingForm from "@/components/listings/ListingForm";

export default function NewListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [profileWarning, setProfileWarning] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }
      setUser(session.user);
      setCategories(await getCategories());
    }
    init();
  }, [router]);

  async function handleSave(formData) {
    if (!user) throw new Error("Nicht eingeloggt");
    // Profil-Check: IBAN nötig zum Verkaufen/Vermieten
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
    // Save category-specific attributes
    if (formData.attributeValues && Object.keys(formData.attributeValues).length > 0) {
      await saveListingAttributes(listing.id, formData.attributeValues);
    }
    if (formData.publish) {
      await updateListingStatus(listing.id, "active");
    }
    router.push("/listings");
    return listing;
  }

  if (!user) return (
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
      <ListingForm categories={categories} onSave={handleSave} onCancel={() => router.push("/listings")} isEdit={false} />
    </div>
  );
}
