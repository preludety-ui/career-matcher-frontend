
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    // Récupérer les données du candidat
    const { data: candidat, error } = await supabaseAdmin
      .from("candidats")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !candidat) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 });
    }

    // Générer le CV avec GPT
    const prompt = `Tu es un expert en rédaction de CV professionnels canadiens.

Génère un CV professionnel complet en français pour ce candidat basé sur son rapport YELMA :

PROFIL :
- Nom : ${candidat.nom} ${candidat.prenom}
- Rôle actuel : ${candidat.role_actuel || "Non spécifié"}
- Ville : ${candidat.ville || "Montréal"}
- Diplôme : ${candidat.diplome_max || "Non spécifié"}
- Expérience : ${candidat.duree_experience || "Non spécifié"}
- Objectif : ${candidat.objectif_carriere || "Non spécifié"}

COMPÉTENCES RÉVÉLÉES PAR YELMA :
1. ${candidat.force1 || ""} — ${candidat.force1_desc || ""}
2. ${candidat.force2 || ""} — ${candidat.force2_desc || ""}
3. ${candidat.force3 || ""} — ${candidat.force3_desc || ""}

AXES DE DÉVELOPPEMENT :
1. ${candidat.axe1 || ""}
2. ${candidat.axe2 || ""}

GPS CARRIÈRE AN 1 : ${candidat.gps_an1 ? JSON.stringify(candidat.gps_an1) : "Non spécifié"}

Génère un CV professionnel avec ces sections :
1. En-tête (nom, titre professionnel, ville, email)
2. Résumé professionnel (3-4 phrases percutantes basées sur les compétences YELMA)
3. Compétences clés (liste des 6-8 compétences opérationnelles)
4. Expérience professionnelle (basée sur le rôle actuel — générer 3-4 réalisations concrètes plausibles)
5. Formation (basée sur le diplôme)
6. Certifications recommandées (selon GPS YELMA)

Format : texte structuré clair, adapté au marché canadien.
Langue : français professionnel.
Ton : dynamique et orienté résultats.`;

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
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");

    const cv = data.choices[0].message.content;

    // Sauvegarder le CV dans Supabase
    await supabaseAdmin
      .from("candidats")
      .update({ cv_genere: cv, cv_date: new Date().toISOString() })
      .eq("email", email);

    return NextResponse.json({ cv, success: true });

  } catch (error) {
    console.error("CV API error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du CV" }, { status: 500 });
  }
}