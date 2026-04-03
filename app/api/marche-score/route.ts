import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, objectif, ville, domaine } = await req.json();

    const prompt = `Tu es un expert du marché du travail québécois.
Évalue le marché pour ce profil et retourne UNIQUEMENT ce JSON sans backticks:

Poste cible: ${objectif}
Ville: ${ville || 'Montréal'}
Domaine: ${domaine || ''}

{
  "D": 75,
  "S": 80,
  "T": 65,
  "G": 70,
  "score_marche": 74,
  "nb_offres_estimees": 47,
  "tendance": "en croissance",
  "explication": "1 phrase sur le marché"
}

RÈGLES:
- D (0-100): volume d'offres actives pour ce poste dans cette ville
- S (0-100): attractivité salariale vs médiane du marché
- T (0-100): tension métier (100 = très peu de candidats disponibles)
- G (0-100): croissance du secteur sur 2 ans
- score_marche = Math.round(100 * (0.4*D + 0.3*S + 0.2*T + 0.1*G) / 100)
- nb_offres_estimees: estimation réaliste du nombre d'offres actives
- tendance: "en croissance", "stable", ou "en déclin"`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON invalide");
    const marche = JSON.parse(jsonMatch[0]);

    if (email) {
      await supabaseAdmin.from("candidats")
        .update({ score_marche: marche.score_marche, marche_details: marche })
        .eq("email", email);
    }

    return NextResponse.json({ success: true, marche });
  } catch (error) {
    console.error("Marché score error:", error);
    return NextResponse.json({ error: "Erreur calcul marché" }, { status: 500 });
  }
}