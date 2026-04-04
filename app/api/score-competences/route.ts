import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, objectif_carriere, force1, force2, force3 } = await req.json();

    const prompt = `Tu es un expert RH québécois.
Pour le poste cible "${objectif_carriere}", liste exactement 5 compétences clés requises.
Retourne UNIQUEMENT ce JSON sans backticks:
{
  "competences_requises": [
    "Compétence 1",
    "Compétence 2", 
    "Compétence 3",
    "Compétence 4",
    "Compétence 5"
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON invalide");
    
    const result = JSON.parse(jsonMatch[0]);
    const competences_requises: string[] = result.competences_requises || [];
    
    // Compétences du candidat
    const competences_candidat = [force1, force2, force3].filter(Boolean);
    
    // Calcul score : combien de compétences candidat matchent les requises
    let matches = 0;
    for (const comp of competences_candidat) {
      for (const req of competences_requises) {
        const compLower = comp.toLowerCase();
        const reqLower = req.toLowerCase();
        // Match si les mots clés se chevauchent
        const wordsComp = compLower.split(/\s+/);
        const wordsReq = reqLower.split(/\s+/);
        const overlap = wordsComp.some((w: string) => w.length > 3 && wordsReq.some((r: string) => r.includes(w) || w.includes(r)));
        if (overlap) { matches++; break; }
      }
    }
    
    const score_competences = Math.round(100 * (competences_candidat.length / competences_requises.length));
    
    // Sauvegarder dans Supabase
    if (email) {
      await supabaseAdmin.from("candidats")
        .update({ score_competences })
        .eq("email", email);
    }

    return NextResponse.json({ 
      success: true, 
      score_competences,
      competences_requises,
      competences_candidat,
      matches,
    });

  } catch (error) {
    console.error("Score compétences error:", error);
    return NextResponse.json({ error: "Erreur calcul compétences" }, { status: 500 });
  }
}