import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { nom, email, message } = await req.json();

    if (!nom || !email || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // Envoyer via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "YELMA Support <onboarding@resend.dev>",
        to: process.env.SUPPORT_EMAIL,
        subject: `Message de support YELMA — ${nom}`,
        html: `
          <h2>Nouveau message de support</h2>
          <p><strong>Nom:</strong> ${nom}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <hr/>
          <p>Répondre à: ${email}</p>
        `,
      }),
    });

    if (!res.ok) throw new Error("Erreur Resend");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}