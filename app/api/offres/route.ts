import { NextRequest, NextResponse } from "next/server";

function buildSearchQuery(candidatInfo: {
  cas: number;
  role: string;
  ville: string;
  experience: string;
  salaire_min: number;
  salaire_max: number;
  competences: string[];
  objectif: string;
  statut: string;
  domaine: string;
}) {
  const { cas, role, ville, experience, salaire_min, salaire_max, competences, objectif, statut, domaine } = candidatInfo;
  const rayon = `${ville} ou dans un rayon de 100km`;

  // Mots clés selon le cas
  const motsCles: Record<number, string> = {
    1: `emploi débutant sans expérience ${domaine || "service clientèle"} ${ville} 2026`,
    2: `emploi junior nouveau diplômé ${domaine} ${ville} 2026`,
    3: `emploi junior stage accepté ${domaine} ${ville} 2026`,
    4: `emploi débutant ${objectif} ${ville} 2026`,
    5: `emploi ${role} confirmé ${ville} salaire ${salaire_max}$ 2026`,
    6: `emploi ${role} junior ${objectif} ${ville} 2026`,
    7: `emploi ${role} senior confirmé ${ville} salaire supérieur ${salaire_min}$ 2026`,
    8: `emploi passerelle reconversion ${domaine} vers ${objectif} ${ville} 2026`,
    9: `emploi directeur manager stratégique ${domaine} ${ville} salaire ${salaire_min}$ 2026`,
    10: `emploi senior lead expert ${role} ${ville} salaire ${salaire_max}$ 2026`,
  };

  return motsCles[cas] || `emploi ${role} ${ville} 2026`;
}

function buildFallbackLinks(role: string, ville: string, experience: string) {
  const roleEnc = encodeURIComponent(role);
  const villeEnc = encodeURIComponent(ville || "Montréal");
  const expLabel = experience?.includes("moins") || experience?.includes("aucune") ? "junior" : experience?.includes("3 à 5") ? "senior" : experience?.includes("6") || experience?.includes("10") ? "directeur" : "confirmé";

  return [
    {
      titre: role + " — " + ville,
      entreprise: "",
      salaire: 0,
      lien: `https://ca.indeed.com/jobs?q=${roleEnc}&l=${villeEnc}`,
      source: "Indeed",
      score: 70,
      insights: ["Recherche directe sur Indeed"],
      gap: null,
    },
    {
      titre: role + " " + expLabel + " — " + ville,
      entreprise: "",
      salaire: 0,
      lien: `https://www.linkedin.com/jobs/search/?keywords=${roleEnc}&location=${villeEnc}`,
      source: "LinkedIn",
      score: 70,
      insights: ["Recherche directe sur LinkedIn"],
      gap: null,
    },
    {
      titre: role + " — " + ville,
      entreprise: "",
      salaire: 0,
      lien: `https://www.jobillico.com/recherche-emploi?skeywords=${roleEnc}&location=${villeEnc}`,
      source: "Jobillico",
      score: 65,
      insights: ["Recherche directe sur Jobillico"],
      gap: null,
    },
    {
      titre: role + " — Gouvernement Canada",
     entreprise: "",
      salaire: 0,
      lien: `https://emploisfp-psjobs.cfp-psc.gc.ca/psrs-srfp/applicant/page1710?searchValue=${roleEnc}&languageCode=F`,
      source: "Guichets Emploi Canada",
      score: 65,
      insights: ["Offres gouvernement fédéral"],
      gap: null,
    },
    {
      titre: role + " — Emploi Québec",
      entreprise: "",
      salaire: 0,
      lien: `https://placement.emploiquebec.gouv.qc.ca/mbe/ut/rechroffr/affrechroffr.asp?CL=french`,
      source: "Emploi Québec",
      score: 65,
      insights: ["Offres gouvernement Québec"],
      gap: null,
    },
  ];
}

async function analyserOffre(url: string, competences: string[]): Promise<{
  insights: string[];
  gap: string | null;
  salaire_reel: number;
  niveau_reel: string;
}> {
  try {
    const prompt = `Analyse cette offre d'emploi et extrait les informations implicites.
URL: ${url}
Compétences du candidat: ${competences.join(", ")}

Retourne UNIQUEMENT ce JSON sans backticks:
{
  "insights": ["Culture startup dynamique", "Télétravail hybride", "Évolution possible"],
  "gap": "Python mentionné dans l'offre mais absent du profil candidat",
  "salaire_reel": 65000,
  "niveau_reel": "Junior-Intermédiaire"
}

Si tu ne peux pas lire l'URL, retourne:
{
  "insights": [],
  "gap": null,
  "salaire_reel": 0,
  "niveau_reel": ""
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Analyse offre error:", e);
  }
  return { insights: [], gap: null, salaire_reel: 0, niveau_reel: "" };
}

function calculerScore(offre: {
  titre: string;
  description?: string;
}, competences: string[], salaire_min: number, salaire_max: number, experience: string): number {
  let score = 60;

  // Match compétences dans titre/description
  const texte = (offre.titre + " " + (offre.description || "")).toLowerCase();
  competences.forEach(comp => {
    if (texte.includes(comp.toLowerCase())) score += 10;
  });

  // Match expérience
  const exp = experience?.toLowerCase() || "";
  if (exp.includes("moins") && texte.includes("junior")) score += 8;
  if (exp.includes("3 à 5") && (texte.includes("senior") || texte.includes("confirmé"))) score += 8;
  if (exp.includes("6 à 10") && texte.includes("senior")) score += 8;
  if (exp.includes("plus de 10") && texte.includes("directeur")) score += 8;

  return Math.min(score, 99);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cas, role, ville, experience, salaire_min, salaire_max, competences, objectif, statut, domaine } = body;

    const searchQuery = buildSearchQuery({ cas, role, ville, experience, salaire_min, salaire_max, competences, objectif, statut, domaine });
    console.log("SEARCH QUERY:", searchQuery);

    // Appel Claude web search pour trouver les offres
    const prompt = `Cherche des offres d'emploi récentes au Canada pour ce profil en 2026.
Recherche: ${searchQuery}
Ville principale: ${ville || "Montréal"}
Rayon: 100km autour de ${ville || "Montréal"}

Trouve TOUTES les offres disponibles (pas de limite).
Pour chaque offre retourne UNIQUEMENT ce JSON array sans backticks:
[
  {
    "titre": "Titre exact du poste",
    "entreprise": "Nom entreprise",
    "salaire": 62000,
    "lien": "https://lien-direct-offre.com",
    "source": "Indeed/LinkedIn/Jobillico/Site entreprise/Gouvernement",
    "ville_offre": "Montréal",
    "distance_km": 5
  }
]

Cherche sur: LinkedIn, Indeed, Jobillico, Guichets Emploi Canada, Emploi Québec, sites carrières des grandes entreprises canadiennes (CGI, Desjardins, Bell, RBC, BMO, TD, SNC-Lavalin, etc.)
Si salaire non mentionné mettre 0.
Retourne minimum 5 offres si disponibles.`;

    let offres: {
      titre: string;
      entreprise: string;
      salaire: number;
      lien: string;
      source: string;
      score: number;
      insights: string[];
      gap: string | null;
    }[] = [];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const rawOffres = JSON.parse(jsonMatch[0]);
          console.log("OFFRES FOUND:", rawOffres.length);

          // Calculer score + analyser chaque offre (max 5 pour limiter les coûts)
          const offresToAnalyze = rawOffres.slice(0, 5);
          const offresAvecScore = await Promise.all(
            offresToAnalyze.map(async (o: {
              titre: string;
              entreprise: string;
              salaire: number;
              lien: string;
              source: string;
            }) => {
              const score = calculerScore(o, competences || [], salaire_min, salaire_max, experience);
              // Analyser seulement les offres avec score > 70
              let insights: string[] = [];
              let gap: string | null = null;
              if (score > 70 && o.lien) {
                const analyse = await analyserOffre(o.lien, competences || []);
                insights = analyse.insights;
                gap = analyse.gap;
                if (analyse.salaire_reel > 0) o.salaire = analyse.salaire_reel;
              }
              return { ...o, score, insights, gap };
            })
          );

          // Trier par score décroissant
          offres = offresAvecScore.sort((a, b) => b.score - a.score);

          // Ajouter les offres restantes sans analyse
          if (rawOffres.length > 5) {
            const offresRestantes = rawOffres.slice(5).map((o: {
              titre: string;
              entreprise: string;
              salaire: number;
              lien: string;
              source: string;
            }) => ({
              ...o,
              score: calculerScore(o, competences || [], salaire_min, salaire_max, experience),
              insights: [],
              gap: null,
            }));
            offres = [...offres, ...offresRestantes];
          }
        }
      }
    } catch (e) {
      console.error("Claude search error:", e);
    }

    // Fallback si pas d'offres trouvées
    if (offres.length === 0) {
      console.log("USING FALLBACK LINKS");
      offres = buildFallbackLinks(role, ville, experience);
    }

    return NextResponse.json({ offres, total: offres.length });

  } catch (error) {
    console.error("Offres API error:", error);
    return NextResponse.json({ offres: [], total: 0 }, { status: 500 });
  }
}
