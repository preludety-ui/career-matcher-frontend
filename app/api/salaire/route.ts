import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { role, experience, ville, diplome, competences } = await req.json();

    const prompt = `Tu es un expert en rémunération sur le marché du travail canadien.

Calcule la fourchette salariale pour ce profil :
- Rôle : ${role || "Non spécifié"}
- Expérience : ${experience || "Moins de 1 an"}
- Ville : ${ville || "Montréal"}
- Diplôme : ${diplome || "Baccalauréat"}
- Compétences : ${competences || "Non spécifiées"}

Recherche les salaires réels actuels sur le marché canadien pour ce profil.
Tiens compte de :
1. Le rôle exact et son niveau de séniorité
2. Les années d'expérience
3. La ville (Montréal, Toronto, Vancouver ont des salaires différents)
4. Le diplôme
5. Les compétences spécifiques (ex: Power BI, Python augmentent le salaire)

Règles importantes :
- Si le candidat est au chômage, utilise son dernier rôle
- Si étudiant sans expérience, base-toi sur le rôle junior du domaine
- Si autodidacte, base-toi sur les compétences révélées

Retourne UNIQUEMENT ce JSON sans backticks ni markdown :
{
  "salaire_min": 42000,
  "salaire_max": 58000,
  "salaire_median": 50000,
  "explication": "Basé sur les données du marché canadien pour un Assistant contrôleur de projet junior à Montréal"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    // Extraire le texte de la réponse
    const textContent = data.content?.find((c: { type: string }) => c.type === "text");
    if (!textContent) {
      throw new Error("Pas de réponse texte");
    }

    // Parser le JSON
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Pas de JSON valide");

    const salaires = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      salaire_min: salaires.salaire_min || 40000,
      salaire_max: salaires.salaire_max || 60000,
      salaire_median: salaires.salaire_median || 50000,
      explication: salaires.explication || "Basé sur les données du marché canadien",
    });

  } catch (error) {
    console.error("Salaire API error:", error);
    // Fallback avec données statiques
    return NextResponse.json({
      salaire_min: 40000,
      salaire_max: 60000,
      salaire_median: 50000,
      explication: "Estimation basée sur les données du marché canadien",
    });
  }
}
