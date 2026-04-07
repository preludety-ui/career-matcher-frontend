import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, objectif, ville, domaine } = await req.json();

    // 1. Chercher dans market_data d'abord (données réelles)
    const { data: marketData } = await supabaseAdmin
      .from("market_data")
      .select("*")
      .ilike("poste", `%${objectif?.split(' ')[0] || ''}%`)
      .eq("ville", ville || "Montréal")
      .single();

    if (marketData && marketData.score_marche) {
      // Données réelles disponibles!
      const marche = {
        score_marche: marketData.score_marche,
        nb_offres_estimees: marketData.nb_offres,
        tendance: marketData.tendance,
        explication: `Basé sur ${marketData.nb_offres} offres réelles analysées sur Jobillico et Indeed.`,
        D: marketData.details?.D || 0,
        S: marketData.details?.S || 0,
        T: marketData.details?.T || 0,
        G: marketData.details?.G || 0,
        source: "real",
      };

      if (email) {
        await supabaseAdmin.from("candidats")
          .update({ score_marche: marche.score_marche, marche_details: marche })
          .eq("email", email);
      }

      return NextResponse.json({ success: true, marche });
    }

    // 2. Fallback : IA si pas de données réelles
   const prompt = `Tu es un expert du marché du travail québécois avec accès aux données réelles de 2026.
Évalue le marché SPECIFIQUEMENT pour ce profil et retourne UNIQUEMENT ce JSON sans backticks:

Poste cible: ${objectif}
Ville: ${ville || 'Montréal'}
Domaine: ${domaine || ''}

IMPORTANT: Les valeurs doivent être DIFFERENTES pour chaque poste. 
Exemples réels 2026:
- Infirmière Montréal: D=90, S=85, T=80, G=75, offres=200+
- Gestionnaire projet Montréal: D=70, S=75, T=65, G=70, offres=120
- Caissier Montréal: D=85, S=40, T=30, G=35, offres=300+
- Chirurgien Montréal: D=60, S=95, T=90, G=70, offres=30
- Développeur web Montréal: D=80, S=85, T=75, G=90, offres=150

{
  "D": 0,
  "S": 0,
  "T": 0,
  "G": 0,
  "score_marche": 0,
  "nb_offres_estimees": 0,
  "tendance": "en croissance",
  "explication": "1 phrase sur le marché"
}

RÈGLES:
- D (0-100): volume d'offres actives pour ce poste dans cette ville
- S (0-100): attractivité salariale vs médiane du marché
- T (0-100): tension métier
- G (0-100): croissance du secteur sur 2 ans
- score_marche = Math.round(100 * (0.4*D + 0.3*S + 0.2*T + 0.1*G) / 100)`;

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
    const marche = { ...JSON.parse(jsonMatch[0]), source: "ai" };

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