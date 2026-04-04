import { NextRequest, NextResponse } from "next/server";

async function chercherOffresJSearch(query: string, ville: string): Promise<{
  titre: string; entreprise: string; salaire: number; lien: string;
  source: string; date_publication: string; description: string; experience_requise: string;
}[]> {
  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + " " + ville)}&page=1&num_pages=1&country=ca&language=fr&date_posted=month`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
    });
    if (!response.ok) throw new Error("JSearch API error: " + response.status);
    const data = await response.json();
    if (!data.data || data.data.length === 0) return [];
    return data.data.map((job: any) => ({
      titre: job.job_title || "", entreprise: job.employer_name || "",
      salaire: job.job_min_salary ? Math.round((job.job_min_salary + (job.job_max_salary || job.job_min_salary)) / 2) : 0,
      lien: job.job_apply_link || "", source: job.job_publisher || "Google Jobs",
      date_publication: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString("fr-CA") : "",
      description: (job.job_description || "").slice(0, 500),
      experience_requise: job.job_required_experience?.required_experience_in_months ? Math.round(job.job_required_experience.required_experience_in_months / 12) + " ans" : "",
    }));
  } catch (e) { console.error("JSearch error:", e); return []; }
}

function calculerScore(offre: { titre: string; description: string; experience_requise: string }, competences: string[], experience: string): number {
  let score = 60;
  const texte = (offre.titre + " " + offre.description).toLowerCase();
  competences.forEach(comp => { if (comp && texte.includes(comp.toLowerCase())) score += 8; });
  const exp = experience?.toLowerCase() || "";
  if (exp.includes("plus de 10") && (texte.includes("senior") || texte.includes("directeur"))) score += 10;
  if (exp.includes("6 à 10") && texte.includes("senior")) score += 8;
  if (exp.includes("3 à 5") && (texte.includes("senior") || texte.includes("confirmé"))) score += 8;
  if (exp.includes("1 à 2") && texte.includes("junior")) score += 8;
  return Math.min(score, 99);
}

function extraireInsights(description: string): string[] {
  const insights: string[] = [];
  const desc = description.toLowerCase();
  if (desc.includes("télétravail") || desc.includes("remote") || desc.includes("hybride")) insights.push("🏠 Télétravail/Hybride");
  if (desc.includes("startup") || desc.includes("scale")) insights.push("🚀 Startup");
  if (desc.includes("avancement") || desc.includes("évolution")) insights.push("📈 Évolution possible");
  if (desc.includes("assurance") || desc.includes("avantages")) insights.push("✅ Avantages sociaux");
  if (desc.includes("bilingual") || desc.includes("bilingue")) insights.push("🌍 Bilingue requis");
  if (desc.includes("urgent") || desc.includes("immédiat")) insights.push("⚡ Recrutement urgent");
  return insights.slice(0, 3);
}

function extraireGap(description: string, competences: string[]): string | null {
  const desc = description.toLowerCase();
  const techs = ["python", "sql", "power bi", "sap", "oracle", "salesforce", "aws", "azure", "jira"];
  for (const tech of techs) {
    if (desc.includes(tech) && !competences.some(c => c.toLowerCase().includes(tech))) return `${tech.toUpperCase()} mentionné dans l'offre`;
  }
  return null;
}

function buildFallbackLinks(role: string, ville: string) {
  const r = encodeURIComponent(role);
  const v = encodeURIComponent(ville || "Montréal");
  return [
    { titre: role + " — LinkedIn", entreprise: "", salaire: 0, lien: `https://www.linkedin.com/jobs/search/?keywords=${r}&location=${v}`, source: "LinkedIn", score: 65, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Indeed", entreprise: "", salaire: 0, lien: `https://ca.indeed.com/jobs?q=${r}&l=${v}`, source: "Indeed", score: 65, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Jobillico", entreprise: "", salaire: 0, lien: `https://www.jobillico.com/recherche-emploi?skeywords=${r}`, source: "Jobillico", score: 60, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Emploi Québec", entreprise: "", salaire: 0, lien: `https://placement.emploiquebec.gouv.qc.ca/mbe/ut/rechroffr/affrechroffr.asp?CL=french`, source: "Emploi Québec", score: 60, insights: [], gap: null, date_publication: "" },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, ville, experience, competences, objectif, domaine } = body;

    if (!role) return NextResponse.json({ offres: [], offres_cibles: [], total: 0 });

    console.log("OFFRES REQUEST:", { role, ville, experience, objectif });

    // ── OFFRES IMMÉDIATES ──
    let rawActuelles: Awaited<ReturnType<typeof chercherOffresJSearch>> = [];
    for (const query of [role, domaine ? `${role} ${domaine}` : role]) {
      const results = await chercherOffresJSearch(query, ville || "Montréal, Quebec, Canada");
      if (results.length > 0) { rawActuelles = [...rawActuelles, ...results]; break; }
    }

    // ── OFFRES CIBLES ──
    let rawCibles: Awaited<ReturnType<typeof chercherOffresJSearch>> = [];
    if (objectif && objectif !== role) {
      rawCibles = await chercherOffresJSearch(objectif, ville || "Montréal, Quebec, Canada");
    }

    // Dédupliquer
    const dedupe = (arr: typeof rawActuelles) => { const seen = new Set<string>(); return arr.filter(o => { if (seen.has(o.lien)) return false; seen.add(o.lien); return true; }); };
    rawActuelles = dedupe(rawActuelles);
    rawCibles = dedupe(rawCibles);

    const formater = (raw: typeof rawActuelles) => raw
      .map(o => ({ titre: o.titre, entreprise: o.entreprise, salaire: o.salaire, lien: o.lien, source: o.source, date_publication: o.date_publication, score: calculerScore(o, competences || [], experience || ""), insights: extraireInsights(o.description), gap: extraireGap(o.description, competences || []) }))
      .sort((a, b) => b.score - a.score);

    const offres = rawActuelles.length > 0 ? formater(rawActuelles) : buildFallbackLinks(role, ville || "Montréal");
    const offres_cibles = rawCibles.length > 0 ? formater(rawCibles) : objectif && objectif !== role ? buildFallbackLinks(objectif, ville || "Montréal") : [];

    return NextResponse.json({ offres, offres_cibles, total: offres.length + offres_cibles.length, source: rawActuelles.length > 0 ? "jsearch" : "fallback" });

  } catch (error) {
    console.error("Offres API error:", error);
    return NextResponse.json({ offres: [], offres_cibles: [], total: 0 }, { status: 500 });
  }
}