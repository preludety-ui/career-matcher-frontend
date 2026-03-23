import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      langue,
      plan,
      niveau_education,
      ville,
      pays,
      force1,
      force2,
      force3,
      salaire_actuel,
      titre_actuel,
      gps_an1,
      gps_an2,
      gps_an3,
      gps_an4,
      gps_an5,
      competences,
      certifications,
      formations_completees,
      historique,
    } = body;

    // Vérifier si le candidat existe déjà
    const { data: existing } = await supabaseAdmin
      .from("candidats")
      .select("id, nb_entretiens")
      .eq("email", email)
      .single();

    if (existing) {
      // Mettre à jour le profil existant
      const { data, error } = await supabaseAdmin
        .from("candidats")
        .update({
          langue,
          plan,
          niveau_education,
          ville,
          pays,
          force1,
          force2,
          force3,
          salaire_actuel,
          titre_actuel,
          gps_an1,
          gps_an2,
          gps_an3,
          gps_an4,
          gps_an5,
          competences,
          certifications,
          formations_completees,
          nb_entretiens: (existing.nb_entretiens || 0) + 1,
          dernier_entretien: new Date().toISOString(),
          historique,
        })
        .eq("email", email)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data, action: "updated" });
    } else {
      // Créer un nouveau profil
      const { data, error } = await supabaseAdmin
        .from("candidats")
        .insert({
          email,
          langue,
          plan,
          niveau_education,
          ville,
          pays,
          force1,
          force2,
          force3,
          salaire_actuel,
          titre_actuel,
          gps_an1,
          gps_an2,
          gps_an3,
          gps_an4,
          gps_an5,
          competences,
          certifications,
          formations_completees,
          nb_entretiens: 1,
          dernier_entretien: new Date().toISOString(),
          historique,
        })
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data, action: "created" });
    }
  } catch (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du profil" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("candidats")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: "Profil non trouvé" },
      { status: 404 }
    );
  }
}
