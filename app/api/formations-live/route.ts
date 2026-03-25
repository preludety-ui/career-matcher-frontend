import { NextRequest, NextResponse } from "next/server";

function buildFormationsQuery(candidatInfo: {
  cas: number;
  role: string;
  ville: string;
  competences: string[];
  axes: string[];
  objectif: string;
  experience: string;
  gps_an1_titre?: string;
}) {
  const { role, ville, competences, axes, objectif, gps_an1_titre } = candidatInfo;

  return {
    renforcement: `formation ${competences[0] || role} avancé en ligne 2026 Coursera Udemy prix`,
    gap: `formation ${axes[0] || "compétences"} ${axes[1] || ""} en ligne 2026 Canada prix inscription`,
    prochain_poste: `formation certification ${gps_an1_titre || role} ${ville} 2026 prix`,
    objectif_long_terme: `certification ${objectif || role} senior Canada 2026 inscription prix`,
    evenements: `conférence networking événement ${role} ${ville} 2026 gratuit`,
    mentorat: `programme mentorat ${role} ${ville} Canada 2026 gratuit`,
  };
}

async function chercherFormations(query: string, type: string): Promise<{
  nom: string;
  type: string;
  plateforme: string;
  duree: string;
  prix: string;
  lien: string;
  note?: string;
}[]> {
  try {
    const prompt = `Cherche des formations réelles disponibles en 2026 pour cette recherche: "${query}"

Retourne UNIQUEMENT ce JSON array sans backticks ni markdown:
[
  {
    "nom": "Nom exact de la formation",
    "type": "${type}",
    "plateforme": "Coursera/Udemy/LinkedIn Learning/Cégep/Université/PMI/etc",
    "duree": "ex: 4 semaines / 3 mois / 35 heures",
    "prix": "ex: Gratuit / 49$ / 299$ / Inclus abonnement",
    "lien": "https://lien-direct-formation.com",
    "note": "ex: 4.7/5 (12 000 avis)"
  }
]

Cherche sur: Coursera, Udemy, LinkedIn Learning, edX, Cégep en ligne, TÉLUQ, Université de Montréal, HEC, Polytechnique, PMI, Scrum Alliance, Google, Microsoft, AWS, IBM.
Retourne 3 à 5 formations réelles avec vrais liens.
Si prix non trouvé mettre "Voir le site".`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Formations search error:", e);
  }
  return [];
}

async function chercherEvenements(query: string, ville: string): Promise<{
  nom: string;
  type: string;
  organisateur: string;
  date: string;
  lieu: string;
  prix: string;
  lien: string;
}[]> {
  try {
    const prompt = `Cherche des événements, conférences et programmes de mentorat réels pour cette recherche: "${query}"
Ville principale: ${ville}

Retourne UNIQUEMENT ce JSON array sans backticks ni markdown:
[
  {
    "nom": "Nom exact de l'événement",
    "type": "Conférence/Mentorat/Networking/Atelier/Webinaire",
    "organisateur": "Nom de l'organisateur",
    "date": "ex: Avril 2026 / Date exacte si disponible",
    "lieu": "ex: Montréal / En ligne / Hybride",
    "prix": "ex: Gratuit / 50$ / Sur inscription",
    "lien": "https://lien-direct-evenement.com"
  }
]

Cherche sur: Eventbrite, LinkedIn Events, Meetup, organismes professionnels, chambres de commerce, universités.
Retourne 3 à 5 événements réels.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Evenements search error:", e);
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cas, role, ville, competences, axes, objectif, experience, gps_an1_titre } = body;

    const queries = buildFormationsQuery({ cas, role, ville, competences, axes, objectif, experience, gps_an1_titre });

    // Chercher toutes les formations en parallèle
    const [renforcement, gap, prochain, longTerme, evenements, mentorat] = await Promise.all([
      chercherFormations(queries.renforcement, "Renforcement"),
      chercherFormations(queries.gap, "Gap marché"),
      chercherFormations(queries.prochain_poste, "Prochain poste"),
      chercherFormations(queries.objectif_long_terme, "Objectif long terme"),
      chercherEvenements(queries.evenements, ville),
      chercherEvenements(queries.mentorat, ville),
    ]);

    return NextResponse.json({
      formations: {
        renforcement,
        gap,
        prochain_poste: prochain,
        objectif_long_terme: longTerme,
      },
      evenements: [...evenements, ...mentorat],
      total_formations: renforcement.length + gap.length + prochain.length + longTerme.length,
      total_evenements: evenements.length + mentorat.length,
    });

  } catch (error) {
    console.error("Formations live API error:", error);
    return NextResponse.json({
      formations: { renforcement: [], gap: [], prochain_poste: [], objectif_long_terme: [] },
      evenements: [],
      total_formations: 0,
      total_evenements: 0,
    }, { status: 500 });
  }
}
