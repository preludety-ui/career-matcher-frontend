import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================
// PLAFONDS PAR NIVEAU HIÉRARCHIQUE
// ============================================
const PLAFONDS_NIVEAU: Record<string, number> = {
  "sans_experience": 55000,
  "junior": 70000,
  "intermediaire": 95000,
  "senior": 130000,
  "manager": 160000,
  "directeur": 200000,
  "vp": 280000,
};

// ============================================
// MULTIPLICATEURS SECTEUR
// ============================================
const MULTIPLICATEURS_SECTEUR: Record<string, number> = {
  "ti": 1.25,
  "technologie": 1.25,
  "informatique": 1.25,
  "finance": 1.15,
  "banque": 1.18,
  "assurance": 1.12,
  "sante": 1.05,
  "pharmaceutique": 1.15,
  "ingenierie": 1.10,
  "construction": 0.95,
  "education": 0.90,
  "gouvernement": 1.05,
  "commerce": 0.85,
  "restauration": 0.75,
  "transport": 0.90,
  "manufacture": 0.92,
  "energie": 1.15,
  "mining": 1.20,
  "juridique": 1.10,
  "comptabilite": 1.08,
  "marketing": 0.95,
  "ressources_humaines": 0.95,
  "default": 1.0,
};

// ============================================
// MULTIPLICATEURS VILLE
// ============================================
const MULTIPLICATEURS_VILLE: Record<string, number> = {
  "toronto": 1.17,
  "vancouver": 1.15,
  "calgary": 1.12,
  "ottawa": 1.08,
  "montreal": 1.0,
  "montréal": 1.0,
  "quebec": 0.95,
  "québec": 0.95,
  "edmonton": 1.10,
  "winnipeg": 0.92,
  "halifax": 0.90,
  "default": 1.0,
};

// ============================================
// MULTIPLICATEURS EXPÉRIENCE
// ============================================
const MULTIPLICATEURS_EXPERIENCE: Record<string, number> = {
  "aucune": 0.75,
  "moins": 0.85,
  "1 à 2": 0.95,
  "3 à 5": 1.10,
  "6 à 10": 1.25,
  "plus de 10": 1.35,
  "default": 1.0,
};

// ============================================
// MULTIPLICATEURS DIPLÔME
// ============================================
const MULTIPLICATEURS_DIPLOME: Record<string, number> = {
  "autodidacte": 0.85,
  "sans diplôme": 0.85,
  "secondaire": 0.88,
  "dep": 0.92,
  "dec": 0.95,
  "cégep": 0.95,
  "baccalauréat": 1.0,
  "baccalaureat": 1.0,
  "maîtrise": 1.20,
  "maitrise": 1.20,
  "mba": 1.25,
  "doctorat": 1.30,
  "default": 1.0,
};

// ============================================
// DÉTECTER LE NIVEAU SELON RÔLE + EXPÉRIENCE
// ============================================
function detecterNiveau(role: string, experience: string): string {
  const r = role?.toLowerCase() || "";
  const e = experience?.toLowerCase() || "";

  if (r.includes("vp") || r.includes("vice-président") || r.includes("c-suite") || r.includes("ceo") || r.includes("cfo") || r.includes("cto")) return "vp";
  if (r.includes("directeur") || r.includes("director")) return "directeur";
  if (r.includes("manager") || r.includes("gestionnaire") || r.includes("responsable") || r.includes("chef")) return "manager";
  if (e.includes("plus de 10") || e.includes("6 à 10")) return "senior";
  if (e.includes("3 à 5")) return "intermediaire";
  if (e.includes("1 à 2") || e.includes("moins")) return "junior";
  return "sans_experience";
}

// ============================================
// DÉTECTER LE SECTEUR
// ============================================
function detecterSecteur(domaine: string, role: string): string {
  const texte = ((domaine || "") + " " + (role || "")).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (texte.includes("ti") || texte.includes("technolog") || texte.includes("inform") || texte.includes("logiciel") || texte.includes("developpeur") || texte.includes("programmeur")) return "ti";
  if (texte.includes("financ") || texte.includes("comptab") || texte.includes("tresor") || texte.includes("fiscalit")) return "finance";
  if (texte.includes("banque") || texte.includes("bancaire")) return "banque";
  if (texte.includes("assurance")) return "assurance";
  if (texte.includes("sante") || texte.includes("medical") || texte.includes("infirmier") || texte.includes("hopital")) return "sante";
  if (texte.includes("pharm")) return "pharmaceutique";
  if (texte.includes("ingeni") || texte.includes("genie")) return "ingenierie";
  if (texte.includes("construct") || texte.includes("batiment") || texte.includes("immobilier")) return "construction";
  if (texte.includes("educat") || texte.includes("enseignant") || texte.includes("professeur") || texte.includes("scolaire")) return "education";
  if (texte.includes("gouvern") || texte.includes("public") || texte.includes("municipal") || texte.includes("federal")) return "gouvernement";
  if (texte.includes("energie") || texte.includes("electr") || texte.includes("petrole") || texte.includes("gaz")) return "energie";
  if (texte.includes("juridique") || texte.includes("droit") || texte.includes("avocat") || texte.includes("notaire")) return "juridique";
  if (texte.includes("market") || texte.includes("communication") || texte.includes("publicite")) return "marketing";
  if (texte.includes("rh") || texte.includes("ressources humaines") || texte.includes("recrutement")) return "ressources_humaines";
  if (texte.includes("transport") || texte.includes("logistique")) return "transport";
  if (texte.includes("manufactur") || texte.includes("usine") || texte.includes("production")) return "manufacture";

  return "default";
}

// ============================================
// CHERCHER DANS SUPABASE (CSV Statistique Canada)
// ============================================
async function chercherDansCSV(role: string, province: string): Promise<{
  median: number;
  low: number;
  high: number;
} | null> {
  try {
    const termes = role.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(" ")
      .filter(t => t.length > 3);

    if (termes.length === 0) return null;

    const prov = province?.toLowerCase().includes("québec") || province?.toLowerCase().includes("montreal") || province?.toLowerCase().includes("québec") ? "QC" :
      province?.toLowerCase().includes("ontario") || province?.toLowerCase().includes("toronto") ? "ON" :
      province?.toLowerCase().includes("alberta") || province?.toLowerCase().includes("calgary") ? "AB" :
      province?.toLowerCase().includes("colombie") || province?.toLowerCase().includes("vancouver") ? "BC" : "NAT";

    const { data, error } = await supabaseAdmin
      .from("salaires_cnp")
      .select('"NOC_Title_fra", "NOC_Title_eng", "Median_Wage_Salaire_Median", "Low_Wage_Salaire_Minium", "High_Wage_Salaire_Maximal"')
      .or(termes.map(t => `NOC_Title_fra.ilike.%${t}%`).join(","))
      .eq("prov", prov)
      .not("Median_Wage_Salaire_Median", "is", null)
      .neq("Median_Wage_Salaire_Median", "")
      .limit(5);

    if (error || !data || data.length === 0) return null;

    const medians = data
      .map((d: Record<string, string>) => parseInt(d["Median_Wage_Salaire_Median"] || "0"))
      .filter(v => v > 10000);

    if (medians.length === 0) return null;

    const median = Math.round(medians.reduce((a, b) => a + b, 0) / medians.length);
    const lows = data.map((d: Record<string, string>) => parseInt(d["Low_Wage_Salaire_Minium"] || "0")).filter(v => v > 0);
    const highs = data.map((d: Record<string, string>) => parseInt(d["High_Wage_Salaire_Maximal"] || "0")).filter(v => v > 0);
    const low = lows.length > 0 ? Math.round(lows.reduce((a, b) => a + b, 0) / lows.length) : Math.round(median * 0.75);
    const high = highs.length > 0 ? Math.round(highs.reduce((a, b) => a + b, 0) / highs.length) : Math.round(median * 1.35);

    console.log("CSV match found:", data[0]["NOC_Title_fra"], "median:", median);
    return { median, low, high };

  } catch (e) {
    console.error("CSV search error:", e);
    return null;
  }
}

// ============================================
// CHERCHER AVEC CLAUDE WEB SEARCH (fallback)
// ============================================
async function chercherAvecClaude(role: string, experience: string, ville: string, secteur: string): Promise<{
  median: number;
  low: number;
  high: number;
} | null> {
  try {
    const prompt = `Donne la fourchette salariale annuelle réelle au Canada en 2025 pour ce profil:
Poste: ${role}
Expérience: ${experience}
Ville: ${ville}
Secteur: ${secteur}

Retourne UNIQUEMENT ce JSON sans backticks:
{"low": 65000, "median": 85000, "high": 110000}

Chiffres réalistes du marché canadien 2025 en dollars canadiens annuels.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.median > 20000) {
        console.log("Claude salary found:", parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error("Claude salary error:", e);
  }
  return null;
}

// ============================================
// CALCULER LA FOURCHETTE FINALE
// ============================================
function calculerFourchette(
  base: { median: number; low: number; high: number },
  role: string,
  experience: string,
  ville: string,
  diplome: string,
  secteur: string
): { salaire_min: number; salaire_max: number; salaire_median: number } {

  const niveau = detecterNiveau(role, experience);
  const plafond = PLAFONDS_NIVEAU[niveau] || 130000;

  // Multiplicateurs
  const multExp = Object.entries(MULTIPLICATEURS_EXPERIENCE).find(([k]) => experience?.toLowerCase().includes(k))?.[1] || 1.0;
  const multVille = Object.entries(MULTIPLICATEURS_VILLE).find(([k]) => ville?.toLowerCase().includes(k))?.[1] || 1.0;
  const multDiplome = Object.entries(MULTIPLICATEURS_DIPLOME).find(([k]) => diplome?.toLowerCase().includes(k))?.[1] || 1.0;
  const multSecteur = MULTIPLICATEURS_SECTEUR[secteur] || 1.0;

  // Calcul
  const median_ajuste = Math.round(base.median * multExp * multVille * multDiplome);
  const max_brut = Math.round(base.median * multSecteur * multExp * multVille * multDiplome * 1.04);
  const min_ajuste = Math.round(base.low * multVille * 0.95);

  // Appliquer plafond
  const salaire_max = Math.min(max_brut, plafond);
  const salaire_min = Math.min(min_ajuste, Math.round(salaire_max * 0.82));
  const salaire_median = Math.min(median_ajuste, Math.round(salaire_max * 0.92));

  // Arrondir à 1000$
  return {
    salaire_min: Math.round(salaire_min / 1000) * 1000,
    salaire_max: Math.round(salaire_max / 1000) * 1000,
    salaire_median: Math.round(salaire_median / 1000) * 1000,
  };
}

// ============================================
// API ROUTE
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { role, experience, ville, diplome, competences, domaine, secteur } = await req.json();

    const secteurDetecte = secteur || detecterSecteur(domaine || "", role || "");
    const province = ville || "Montréal";

    console.log("SALAIRE REQUEST:", { role, experience, ville, secteurDetecte });

    // Étape 1 — Chercher dans CSV Statistique Canada
    let base = await chercherDansCSV(role || "", province);

    // Étape 2 — Fallback Claude web search
    if (!base) {
      console.log("CSV not found, trying Claude...");
      base = await chercherAvecClaude(role || "", experience || "", ville || "Montréal", secteurDetecte);
    }

    // Étape 3 — Fallback table statique
    if (!base) {
      console.log("Using static fallback");
      const r = (role || "").toLowerCase();
      const baseMedian =
        r.includes("directeur") || r.includes("director") ? 110000 :
        r.includes("manager") || r.includes("gestionnaire") ? 95000 :
        r.includes("senior") ? 85000 :
        r.includes("chargé") || r.includes("charge") ? 75000 :
        r.includes("contrôleur") || r.includes("controleur") ? 80000 :
        r.includes("analyste") ? 65000 :
        r.includes("assistant") || r.includes("junior") ? 48000 :
        60000;
      base = { median: baseMedian, low: Math.round(baseMedian * 0.75), high: Math.round(baseMedian * 1.35) };
    }

    // Calculer fourchette finale avec tous les multiplicateurs
    const result = calculerFourchette(base, role || "", experience || "", ville || "Montréal", diplome || "", secteurDetecte);

    console.log("SALAIRE RESULT:", result);

    return NextResponse.json({
      ...result,
      secteur: secteurDetecte,
      source: base ? "csv_or_claude" : "static",
      explication: "Basé sur les données du marché canadien 2025 — Statistique Canada",
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
