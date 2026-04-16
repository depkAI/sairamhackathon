const FALLBACK_PHONE = "919384557144";

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; fallback?: boolean }> {
  try {
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });

    if (res.ok) {
      return { success: true };
    }

    // API not configured or failed — fall back to wa.me link
    const waUrl = `https://wa.me/${to.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    return { success: true, fallback: true };
  } catch {
    // Network error — fall back to wa.me link
    const waUrl = `https://wa.me/${to.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    return { success: true, fallback: true };
  }
}

export function getWhatsAppPhone() {
  return FALLBACK_PHONE;
}
