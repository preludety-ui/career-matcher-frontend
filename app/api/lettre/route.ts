
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidat_prenom, candidat_nom, candidat_email,
      candidat_ville, candidat_role, candidat_experience,
      force1, force2, force3,
      offre_titre, offre_entreprise, offre_description,
      objectif_carriere,
    } = body;

    const prompt = `Tu es un expert en rédaction de lettres de motivation professionnelles canadiennes.

Rédige une lettre de motivation percutante et personnalisée en français pour ce candidat :

CANDIDAT :
- Nom : ${candidat_prenom} ${candidat_nom}
- Ville : ${candidat_ville || "Montréal"}
- Rôle actuel : ${candidat_role || "Non spécifié"}
- Expérience : ${candidat_experience || "Non spécifié"}
- Objectif : ${objectif_carriere || "Non spécifié"}

COMPÉTENCES CLÉS RÉVÉLÉES PAR YELMA :
1. ${force1 || ""}
2. ${force2 || ""}
3. ${force3 || ""}

OFFRE VISÉE :
- Poste : ${offre_titre || ""}
- Entreprise : ${offre_entreprise || ""}
- Description : ${offre_description || ""}

RÈGLES DE RÉDACTION :
1. Ton professionnel et dynamique — pas trop formel
2. 3 paragraphes maximum
3. Paragraphe 1 : accroche forte + pourquoi cette entreprise
4. Paragraphe 2 : 2-3 compétences YELMA liées à l'offre avec exemples concrets
5. Paragraphe 3 : appel à l'action + disponibilité
6. Adapté au marché canadien — pas de formules françaises trop formelles
7. Maximum 250 mots
8. Inclure objet, salutation et signature

Génère la lettre directement sans introduction ni explication.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");

    const lettre = data.choices[0].message.content;

    return NextResponse.json({ lettre, success: true });

  } catch (error) {
    console.error("Lettre API error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération de la lettre" }, { status: 500 });
  }
}
