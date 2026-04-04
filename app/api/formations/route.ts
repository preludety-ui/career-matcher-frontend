import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cnp = searchParams.get("cnp");
    const profession = searchParams.get("profession");

    let query = supabaseAdmin
      .from("formations")
      .select("*")
      .eq("actif", true)
      .eq("url_active", true)
      .order("priorite_affichage", { ascending: true });

    if (cnp) {
      query = query.contains("cnp_cibles", [cnp]);
    }
    if (profession) {
      query = query.contains("professions_cibles", [profession]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, formations: data });
  } catch (error) {
    console.error("Formations API error:", error);
    return NextResponse.json({ error: "Erreur formations" }, { status: 500 });
  }
}