import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("partenaires")
      .select("*")
      .eq("email", email)
      .eq("mot_de_passe", password)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Identifiants invalides" });
    }

    return NextResponse.json({ success: true, partenaire: data });

  } catch (error) {
    console.error("Login partenaire error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
