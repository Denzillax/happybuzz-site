"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useRouter, useParams } from "next/navigation";
import { getListing, updateListing, uploadListingImages, deleteListingImage, updateListingStatus, getCategories } from "@/lib/listings";
import { saveListingAttributes, clearListingAttributes } from "@/lib/api/attributes";
import { useState, useEffect } from "react";
import ListingForm from "@/components/listings/ListingForm";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id;
  const [listing, setListing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const [listingData, cats] = await Promise.all([getListing(listingId), getCategories()]);
      if (listingData.user_id !== user.id) { router.push("/listings"); return; }
      setListing(listingData);
      setCategories(cats);
      setLoading(false);
    }
    init();
  }, [listingId, router]);

  async function handleSave(formData) {
    if (!user) throw new Error("Nicht eingeloggt");
    await updateListing(listingId, formData);
    const existingIds = new Set(formData.existingImages?.map(i => i.id) || []);
    for (const img of (listing?.listing_images || [])) {
      if (!existingIds.has(img.id)) await deleteListingImage(img.id, img.storage_path);
    }
    if (formData.newFiles?.length > 0) {
      const startIdx = formData.existingImages?.length || 0;
      await uploadListingImages(listingId, formData.newFiles.map((f, i) => ({ ...f, sortOrder: startIdx + i })));
    }
    if (formData.publish) await updateListingStatus(listingId, "active");
    // Save category-specific attributes
    if (formData.attributeValues) {
      await clearListingAttributes(listingId);
      if (Object.keys(formData.attributeValues).length > 0) {
        await saveListingAttributes(listingId, formData.attributeValues);
      }
    }
    router.push("/listings");
  }

  if (loading) return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9490" }}>Lade…</div>
  );

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#FFFFFF", minHeight: "100vh" }}>
      <ListingForm categories={categories} onSave={handleSave} onCancel={() => router.push("/listings")} isEdit={true} initialData={listing} />
    </div>
  );
}
