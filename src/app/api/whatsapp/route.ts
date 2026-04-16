import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Twilio sandbox default

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing 'to' or 'message'" }, { status: 400 });
    }

    if (!TWILIO_SID || !TWILIO_AUTH) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
    }

    // Ensure phone has + prefix and country code
    const phone = to.replace(/[^0-9]/g, "");
    const formattedTo = `whatsapp:+${phone}`;

    const client = twilio(TWILIO_SID, TWILIO_AUTH);

    const msg = await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: formattedTo,
      body: message,
    });

    return NextResponse.json({
      success: true,
      messageId: msg.sid,
      status: msg.status,
    });
  } catch (error: unknown) {
    console.error("Twilio WhatsApp error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to send";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
