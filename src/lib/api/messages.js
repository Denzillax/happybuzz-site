import { supabase } from "@/lib/supabase/supabase";


export async function getOrCreateConversation(listingId, buyerId, sellerId) {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_listing_id: listingId, p_buyer_id: buyerId, p_seller_id: sellerId
  });
  if (error) throw error;
  return data;
}


export async function getMyConversations(userId) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, listing:listings(id, title, listing_images(*)), buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) return [];

  // Ungelesen-Status + letzte Nachricht pro Conversation laden
  const result = [];
  for (const c of (data || [])) {
    const { count } = await supabase.from("messages").select("*", { count: "exact", head: true })
      .eq("conversation_id", c.id).neq("sender_id", userId).eq("is_read", false);
    const { data: lastMsg } = await supabase.from("messages").select("content")
      .eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1);
    result.push({
      ...c,
      listingTitle: c.listing?.title || "Gelöschtes Inserat",
      listingImage: c.listing?.listing_images?.[0]?.url || null,
      otherUser: c.buyer_id === userId ? c.seller : c.buyer,
      hasUnread: (count || 0) > 0,
      lastMessagePreview: lastMsg?.[0]?.content || "",
    });
  }
  return result;
}


export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data || [];
}


export async function sendMessage(conversationId, senderId, content) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return data;
}


export async function markMessagesRead(conversationId, userId) {
  await supabase.from("messages").update({ is_read: true })
    .eq("conversation_id", conversationId).neq("sender_id", userId).eq("is_read", false);
}


export async function getUnreadCount(userId) {
  const { data, error } = await supabase.rpc("get_unread_count_for_user", { p_user_id: userId });
  if (error) return 0;
  return data || 0;
}


export async function getListingQuestions(listingId) {
  // RLS handles visibility: public für alle, private nur für Beteiligte
  const { data, error } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, is_public, created_at, buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });
  if (error) return [];
  // Lade Messages für jede Conversation
  const result = [];
  for (const conv of (data || [])) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    result.push({ ...conv, messages: msgs || [] });
  }
  return result;
}


export async function askPublicQuestion(listingId, buyerId, sellerId, content) {
  // Öffentliche Conversation erstellen oder finden
  let { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .eq("is_public", true)
    .maybeSingle();

  let convId;
  if (existing) {
    convId = existing.id;
  } else {
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId, is_public: true })
      .select()
      .single();
    if (error) throw error;
    convId = newConv.id;
  }

  const { error: msgErr } = await supabase.from("messages").insert({ conversation_id: convId, sender_id: buyerId, content });
  if (msgErr) throw msgErr;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId);
  return convId;
}


export async function replyToQuestion(conversationId, senderId, content) {
  await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, content });
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}
