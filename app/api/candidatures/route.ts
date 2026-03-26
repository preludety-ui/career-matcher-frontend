import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Ajouter une candidature ou inscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, data } = body;

    if (!email || !type) {
      return NextResponse.json({ error: "Email et type requis" }, { status: 400 });
    }

    if (type === "candidature") {
      const { error } = await supabaseAdmin
        .from("candidatures")
        .insert({
          email,
          offre_titre: data.titre,
          offre_entreprise: data.entreprise,
          offre_lien: data.lien,
          offre_source: data.source,
          offre_salaire: data.salaire || 0,
          statut: "postulé",
        });

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Candidature enregistrée" });
    }

    if (type === "formation") {
      const { error } = await supabaseAdmin
        .from("inscriptions_formations")
        .insert({
          email,
          formation_nom: data.nom,
          formation_plateforme: data.plateforme,
          formation_lien: data.lien,
          formation_type: data.type,
          statut: "inscrit",
        });

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Inscription enregistrée" });
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });

  } catch (error) {
    console.error("Candidatures API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Récupérer les candidatures et inscriptions d'un candidat
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    const [candidatures, inscriptions] = await Promise.all([
      supabaseAdmin
        .from("candidatures")
        .select("*")
        .eq("email", email)
        .order("date_candidature", { ascending: false }),
      supabaseAdmin
        .from("inscriptions_formations")
        .select("*")
        .eq("email", email)
        .order("date_inscription", { ascending: false }),
    ]);

    return NextResponse.json({
      candidatures: candidatures.data || [],
      inscriptions: inscriptions.data || [],
    });

  } catch (error) {
    console.error("GET candidatures error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprimer une candidature ou inscription
export async function DELETE(req: NextRequest) {
  try {
    const { type, id } = await req.json();

    if (type === "candidature") {
      await supabaseAdmin.from("candidatures").delete().eq("id", id);
    } else if (type === "formation") {
      await supabaseAdmin.from("inscriptions_formations").delete().eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE candidature error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
