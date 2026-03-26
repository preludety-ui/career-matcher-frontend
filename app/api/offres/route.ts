import { NextRequest, NextResponse } from "next/server";

async function chercherOffresJSearch(query: string, ville: string): Promise<{
  titre: string;
  entreprise: string;
  salaire: number;
  lien: string;
  source: string;
  date_publication: string;
  description: string;
  experience_requise: string;
}[]> {
  try {
    const location = ville || "Montreal, Quebec, Canada";
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + " " + location)}&page=1&num_pages=1&country=ca&language=fr&date_posted=month`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    if (!response.ok) throw new Error("JSearch API error: " + response.status);
    const data = await response.json();

    if (!data.data || data.data.length === 0) return [];

    return data.data.map((job: {
      job_title: string;
      employer_name: string;
      job_min_salary?: number;
      job_max_salary?: number;
      job_salary_currency?: string;
      job_apply_link: string;
      job_publisher?: string;
      job_posted_at_datetime_utc?: string;
      job_description?: string;
      job_required_experience?: { required_experience_in_months?: number };
    }) => ({
      titre: job.job_title || "",
      entreprise: job.employer_name || "",
      salaire: job.job_min_salary
        ? Math.round((job.job_min_salary + (job.job_max_salary || job.job_min_salary)) / 2)
        : 0,
      lien: job.job_apply_link || "",
      source: job.job_publisher || "Google Jobs",
      date_publication: job.job_posted_at_datetime_utc
        ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString("fr-CA")
        : "",
      description: (job.job_description || "").slice(0, 500),
      experience_requise: job.job_required_experience?.required_experience_in_months
        ? Math.round(job.job_required_experience.required_experience_in_months / 12) + " ans"
        : "",
    }));

  } catch (e) {
    console.error("JSearch error:", e);
    return [];
  }
}

function calculerScore(offre: {
  titre: string;
  description: string;
  experience_requise: string;
}, competences: string[], experience: string): number {
  let score = 60;
  const texte = (offre.titre + " " + offre.description).toLowerCase();

  // Match compétences
  competences.forEach(comp => {
    if (comp && texte.includes(comp.toLowerCase())) score += 8;
  });

  // Match expérience
  const exp = experience?.toLowerCase() || "";
  const expOffre = offre.experience_requise || "";
  if (exp.includes("plus de 10") && (texte.includes("senior") || texte.includes("directeur"))) score += 10;
  if (exp.includes("6 à 10") && texte.includes("senior")) score += 8;
  if (exp.includes("3 à 5") && (texte.includes("senior") || texte.includes("confirmé"))) score += 8;
  if (exp.includes("1 à 2") && texte.includes("junior")) score += 8;
  if (expOffre && exp.includes(expOffre.split(" ")[0])) score += 5;

  return Math.min(score, 99);
}

function extraireInsights(description: string): string[] {
  const insights: string[] = [];
  const desc = description.toLowerCase();

  if (desc.includes("télétravail") || desc.includes("remote") || desc.includes("hybride")) insights.push("🏠 Télétravail/Hybride");
  if (desc.includes("startup") || desc.includes("scale")) insights.push("🚀 Startup");
  if (desc.includes("grande entreprise") || desc.includes("corporation")) insights.push("🏢 Grande entreprise");
  if (desc.includes("avancement") || desc.includes("évolution") || desc.includes("croissance")) insights.push("📈 Évolution possible");
  if (desc.includes("assurance") || desc.includes("avantages") || desc.includes("bénéfices")) insights.push("✅ Avantages sociaux");
  if (desc.includes("bilingual") || desc.includes("bilingue")) insights.push("🌍 Bilingue requis");
  if (desc.includes("urgent") || desc.includes("immédiat") || desc.includes("dès que possible")) insights.push("⚡ Recrutement urgent");
  if (desc.includes("pmp") || desc.includes("scrum") || desc.includes("agile")) insights.push("🏆 Certifications valorisées");

  return insights.slice(0, 3);
}

function extraireGap(description: string, competences: string[]): string | null {
  const desc = description.toLowerCase();
  const techsMentionnees = ["python", "sql", "power bi", "sap", "oracle", "salesforce", "aws", "azure", "jira", "excel avancé", "tableau", "r studio"];

  for (const tech of techsMentionnees) {
    if (desc.includes(tech)) {
      const dejaDans = competences.some(c => c.toLowerCase().includes(tech));
      if (!dejaDans) return `${tech.toUpperCase()} mentionné dans l'offre`;
    }
  }
  return null;
}

function buildFallbackLinks(role: string, ville: string): {
  titre: string;
  entreprise: string;
  salaire: number;
  lien: string;
  source: string;
  score: number;
  insights: string[];
  gap: string | null;
  date_publication: string;
}[] {
  const roleEnc = encodeURIComponent(role);
  const villeEnc = encodeURIComponent(ville || "Montréal");
  return [
    { titre: role + " — LinkedIn", entreprise: "", salaire: 0, lien: `https://www.linkedin.com/jobs/search/?keywords=${roleEnc}&location=${villeEnc}`, source: "LinkedIn", score: 65, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Indeed", entreprise: "", salaire: 0, lien: `https://ca.indeed.com/jobs?q=${roleEnc}&l=${villeEnc}`, source: "Indeed", score: 65, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Jobillico", entreprise: "", salaire: 0, lien: `https://www.jobillico.com/recherche-emploi?skeywords=${roleEnc}`, source: "Jobillico", score: 60, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Emploi Québec", entreprise: "", salaire: 0, lien: `https://placement.emploiquebec.gouv.qc.ca/mbe/ut/rechroffr/affrechroffr.asp?CL=french`, source: "Emploi Québec", score: 60, insights: [], gap: null, date_publication: "" },
    { titre: role + " — Guichets Emploi Canada", entreprise: "", salaire: 0, lien: `https://www.guichetsemploi.gc.ca/rechercheemploi/avis-important`, source: "Gouvernement Canada", score: 60, insights: [], gap: null, date_publication: "" },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, ville, experience, competences, objectif, domaine } = body;

    if (!role) {
      return NextResponse.json({ offres: [], total: 0 });
    }

    console.log("OFFRES REQUEST:", { role, ville, experience });

    // Chercher offres avec JSearch
    const queries = [
      role,
      objectif || role,
      domaine ? `${role} ${domaine}` : role,
    ];

    let rawOffres: {
      titre: string;
      entreprise: string;
      salaire: number;
      lien: string;
      source: string;
      date_publication: string;
      description: string;
      experience_requise: string;
    }[] = [];

    // Essayer les queries jusqu'à avoir des résultats
    for (const query of queries) {
      const results = await chercherOffresJSearch(query, ville || "Montréal, Quebec, Canada");
      if (results.length > 0) {
        rawOffres = [...rawOffres, ...results];
        if (rawOffres.length >= 5) break;
      }
    }

    // Dédupliquer par lien
    const seen = new Set<string>();
    rawOffres = rawOffres.filter(o => {
      if (seen.has(o.lien)) return false;
      seen.add(o.lien);
      return true;
    });

    console.log("OFFRES FOUND:", rawOffres.length);

    if (rawOffres.length === 0) {
      console.log("USING FALLBACK LINKS");
      return NextResponse.json({
        offres: buildFallbackLinks(role, ville || "Montréal"),
        total: 5,
        source: "fallback",
      });
    }

    // Calculer score + extraire insights + gap
    const offres = rawOffres
      .map(o => ({
        titre: o.titre,
        entreprise: o.entreprise,
        salaire: o.salaire,
        lien: o.lien,
        source: o.source,
        date_publication: o.date_publication,
        score: calculerScore(o, competences || [], experience || ""),
        insights: extraireInsights(o.description),
        gap: extraireGap(o.description, competences || []),
      }))
      .sort((a, b) => b.score - a.score); // Trier par score décroissant

    return NextResponse.json({ offres, total: offres.length, source: "jsearch" });

  } catch (error) {
    console.error("Offres API error:", error);
    return NextResponse.json({ offres: [], total: 0 }, { status: 500 });
  }
}
