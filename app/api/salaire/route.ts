import { NextRequest, NextResponse } from "next/server";

function getSalaireRef(role: string, experience: string, ville: string) {
  const r = role?.toLowerCase() || "";
  const e = experience?.toLowerCase() || "";
  const v = ville?.toLowerCase() || "";

  // Base salariale selon rôle
  const base =
    r.includes("vp") || r.includes("vice-président") ? 130000
    : r.includes("directeur") || r.includes("director") ? 110000
    : r.includes("manager") || r.includes("gestionnaire") ? 95000
    : r.includes("chef") || r.includes("responsable") || r.includes("lead") ? 85000
    : r.includes("senior") ? 80000
    : r.includes("chargé de programme") || r.includes("charge de programme") ? 90000
    : r.includes("chargé de projet") || r.includes("charge de projet") ? 75000
    : r.includes("contrôleur de projet") || r.includes("controleur de projet") ? 85000
    : r.includes("contrôleur") || r.includes("controleur") ? 80000
    : r.includes("chargé") || r.includes("coordinateur") ? 72000
    : r.includes("contrôleur") || r.includes("controleur") ? 72000
    : r.includes("analyste") ? 65000
    : r.includes("assistant") || r.includes("junior") ? 48000
    : 58000;

  // Multiplicateur selon expérience
  const expMult =
    e.includes("plus de 10") ? 1.45
    : e.includes("6 à 10") ? 1.25
    : e.includes("6 à 10") ? 1.2
    : e.includes("3 à 5") ? 1.1
    : e.includes("1 à 2") ? 1.0
    : 0.88;

  // Multiplicateur selon ville
  const villeMult =
    v.includes("toronto") || v.includes("vancouver") ? 1.15
    : v.includes("calgary") ? 1.1
    : v.includes("ottawa") ? 1.05
    : 1.0; // Montréal et autres

  const salaire_median = Math.round(base * expMult * villeMult / 1000) * 1000;
  const salaire_min = Math.round(salaire_median * 0.9 / 1000) * 1000;
  const salaire_max = Math.round(salaire_median * 1.1 / 1000) * 1000;

  return { salaire_min, salaire_max, salaire_median };
}

export async function POST(req: NextRequest) {
  try {
    const { role, experience, ville, diplome, competences } = await req.json();

    // Essayer d'abord l'API Anthropic
    try {
      const prompt = `Tu es un expert en rémunération au Canada. Donne la fourchette salariale pour ce profil au Canada en 2026.
Rôle: ${role || "Non spécifié"}
Expérience: ${experience || "Moins de 1 an"}
Ville: ${ville || "Montréal"}
Diplôme: ${diplome || "Non spécifié"}
Compétences: ${competences || "Non spécifiées"}

Retourne UNIQUEMENT ce JSON sans aucun texte avant ou après, sans backticks:
{"salaire_min":45000,"salaire_max":65000,"salaire_median":55000,"explication":"raison courte"}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.salaire_min && parsed.salaire_max) {
            console.log("Salaire from Anthropic:", parsed);
            return NextResponse.json(parsed);
          }
        }
      }
    } catch (e) {
      console.log("Anthropic salaire failed, using reference table:", e);
    }

    // Fallback — table de référence
    const ref = getSalaireRef(role || "", experience || "", ville || "Montréal");
    console.log("Salaire from reference table:", ref);
    return NextResponse.json({
      ...ref,
      explication: "Estimation basée sur les données du marché canadien",
    });

  } catch (error) {
    console.error("Salaire API error:", error);
    return NextResponse.json({
      salaire_min: 45000,
      salaire_max: 65000,
      salaire_median: 55000,
      explication: "Estimation par défaut",
    });
  }
}
