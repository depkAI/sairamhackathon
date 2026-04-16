import { supabase } from "./supabase";

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    read: false,
    link: link || null,
  });
  if (error) {
    console.error("Failed to send notification:", error.message);
  }
}
