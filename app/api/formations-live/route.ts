import { NextRequest, NextResponse } from "next/server";

// ============================================
// GRANDES INSTITUTIONS — LIENS DIRECTS
// ============================================

const INSTITUTIONS = {
  // USA
  mit: {
    nom: "MIT OpenCourseWare",
    pays: "🇺🇸 MIT",
    base: "https://ocw.mit.edu/search/?q=",
    gratuit: true,
  },
  harvard: {
    nom: "Harvard Online",
    pays: "🇺🇸 Harvard",
    base: "https://online-learning.harvard.edu/catalog?keywords=",
    gratuit: false,
  },
  stanford: {
    nom: "Stanford Online",
    pays: "🇺🇸 Stanford",
    base: "https://online.stanford.edu/search-catalog?keywords=",
    gratuit: false,
  },
  edx_harvard: {
    nom: "edX — Harvard & MIT",
    pays: "🇺🇸 Harvard / MIT",
    base: "https://www.edx.org/search?q=",
    gratuit: false,
  },
  // Canada
  hec: {
    nom: "HEC Montréal — EDUlib",
    pays: "🇨🇦 HEC Montréal",
    base: "https://www.edulib.ca/en/find-a-course?q=",
    gratuit: true,
  },
  mcgill: {
    nom: "McGill University",
    pays: "🇨🇦 McGill",
    base: "https://www.edx.org/search?q=mcgill+",
    gratuit: false,
  },
  udem: {
    nom: "Université de Montréal",
    pays: "🇨🇦 UdeM",
    base: "https://www.edulib.ca/en/find-a-course?q=",
    gratuit: true,
  },
  poly: {
    nom: "Polytechnique Montréal",
    pays: "🇨🇦 Polytechnique",
    base: "https://www.edulib.ca/en/find-a-course?q=",
    gratuit: true,
  },
  uoft: {
    nom: "University of Toronto",
    pays: "🇨🇦 U of Toronto",
    base: "https://www.coursera.org/search?query=university+toronto+",
    gratuit: false,
  },
  ubc: {
    nom: "University of British Columbia",
    pays: "🇨🇦 UBC",
    base: "https://www.edx.org/search?q=ubc+",
    gratuit: false,
  },
};

// ============================================
// MAPPING COMPÉTENCES → MOTS CLÉS
// ============================================
function buildSearchKeywords(
  role: string,
  competences: string[],
  axes: string[],
  objectif: string,
  type: string
): string {
  const base = role?.toLowerCase() || "";

  switch (type) {
    case "renforcement":
      return competences[0] || base;
    case "gap":
      return axes[0] || base;
    case "prochain_poste":
      return objectif || base;
    case "objectif_long_terme":
      return (objectif || base) + " leadership management";
    case "certifications":
      return base + " certification professional";
    default:
      return base;
  }
}

// ============================================
// GÉNÉRER LES FORMATIONS PAR INSTITUTION
// ============================================
function genererFormations(
  keywords: string,
  type: string,
  role: string,
  langue: string = "fr"
): {
  nom: string;
  type: string;
  institution: string;
  pays: string;
  plateforme: string;
  duree: string;
  prix: string;
  lien: string;
  gratuit: boolean;
  niveau: string;
}[] {

  const kw = encodeURIComponent(keywords);
  const roleEnc = encodeURIComponent(role || "");

  const formations = [];

  // MIT OpenCourseWare — Gratuit
  formations.push({
    nom: `${keywords} — MIT OpenCourseWare`,
    type,
    institution: "MIT",
    pays: "🇺🇸 MIT",
    plateforme: "MIT OpenCourseWare",
    duree: "Libre",
    prix: "Gratuit",
    lien: `https://ocw.mit.edu/search/?q=${kw}`,
    gratuit: true,
    niveau: "Avancé",
  });

  // Harvard Online
  formations.push({
    nom: `${keywords} — Harvard Online`,
    type,
    institution: "Harvard",
    pays: "🇺🇸 Harvard",
    plateforme: "Harvard Online",
    duree: "4-12 semaines",
    prix: "Voir le site",
    lien: `https://online-learning.harvard.edu/catalog?keywords=${kw}`,
    gratuit: false,
    niveau: "Intermédiaire à Avancé",
  });

  // edX — Harvard & MIT
  formations.push({
    nom: `${keywords} — edX (Harvard & MIT)`,
    type,
    institution: "Harvard / MIT",
    pays: "🇺🇸 Harvard / MIT",
    plateforme: "edX",
    duree: "4-16 semaines",
    prix: "Gratuit (audit) / Certif. payant",
    lien: `https://www.edx.org/search?q=${kw}`,
    gratuit: true,
    niveau: "Tous niveaux",
  });

  // Stanford Online
  formations.push({
    nom: `${keywords} — Stanford Online`,
    type,
    institution: "Stanford",
    pays: "🇺🇸 Stanford",
    plateforme: "Stanford Online",
    duree: "4-8 semaines",
    prix: "Voir le site",
    lien: `https://online.stanford.edu/search-catalog?keywords=${kw}`,
    gratuit: false,
    niveau: "Avancé",
  });

  // HEC Montréal — EDUlib
  formations.push({
    nom: `${keywords} — HEC Montréal`,
    type,
    institution: "HEC Montréal",
    pays: "🇨🇦 HEC Montréal",
    plateforme: "EDUlib",
    duree: "4-8 semaines",
    prix: "Gratuit",
    lien: `https://www.edulib.ca/en/find-a-course?q=${kw}`,
    gratuit: true,
    niveau: "Intermédiaire",
  });

  // McGill via edX
  formations.push({
    nom: `${keywords} — McGill University`,
    type,
    institution: "McGill",
    pays: "🇨🇦 McGill",
    plateforme: "edX",
    duree: "6-12 semaines",
    prix: "Gratuit (audit) / Certif. payant",
    lien: `https://www.edx.org/search?q=mcgill+${kw}`,
    gratuit: true,
    niveau: "Intermédiaire",
  });

  // Université de Montréal — EDUlib
  formations.push({
    nom: `${keywords} — Université de Montréal`,
    type,
    institution: "UdeM",
    pays: "🇨🇦 UdeM",
    plateforme: "EDUlib",
    duree: "4-8 semaines",
    prix: "Gratuit",
    lien: `https://www.edulib.ca/en/find-a-course?q=${kw}`,
    gratuit: true,
    niveau: "Intermédiaire",
  });

  // Polytechnique Montréal — EDUlib
  formations.push({
    nom: `${keywords} — Polytechnique Montréal`,
    type,
    institution: "Polytechnique",
    pays: "🇨🇦 Polytechnique",
    plateforme: "EDUlib",
    duree: "4-8 semaines",
    prix: "Gratuit",
    lien: `https://www.edulib.ca/en/find-a-course?q=${kw}`,
    gratuit: true,
    niveau: "Avancé",
  });

  // University of Toronto — Coursera
  formations.push({
    nom: `${keywords} — University of Toronto`,
    type,
    institution: "U of Toronto",
    pays: "🇨🇦 U of Toronto",
    plateforme: "Coursera",
    duree: "4-8 semaines",
    prix: "Gratuit (audit) / Certif. payant",
    lien: `https://www.coursera.org/search?query=university+toronto+${kw}`,
    gratuit: true,
    niveau: "Tous niveaux",
  });

  // UBC — edX
  formations.push({
    nom: `${keywords} — University of British Columbia`,
    type,
    institution: "UBC",
    pays: "🇨🇦 UBC",
    plateforme: "edX",
    duree: "6-10 semaines",
    prix: "Gratuit (audit) / Certif. payant",
    lien: `https://www.edx.org/search?q=ubc+${kw}`,
    gratuit: true,
    niveau: "Intermédiaire",
  });

  return formations;
}

// ============================================
// API ROUTE
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, ville, competences, axes, objectif, experience, gps_an1_titre } = body;

    const roleBase = role || gps_an1_titre || "gestion";

    // Générer les formations par type
    const renforcement = genererFormations(
      buildSearchKeywords(roleBase, competences || [], axes || [], objectif || "", "renforcement"),
      "Renforcement",
      roleBase
    );

    const gap = genererFormations(
      buildSearchKeywords(roleBase, competences || [], axes || [], objectif || "", "gap"),
      "Gap marché",
      roleBase
    );

    const prochainPoste = genererFormations(
      buildSearchKeywords(roleBase, competences || [], axes || [], objectif || "", "prochain_poste"),
      "Prochain poste",
      roleBase
    );

    const objectifLongTerme = genererFormations(
      buildSearchKeywords(roleBase, competences || [], axes || [], objectif || "", "objectif_long_terme"),
      "Objectif long terme",
      roleBase
    );

    // Événements — liens directs vers grandes conférences
    const evenements = [
      {
        nom: `Conférence ${roleBase} — Eventbrite Montréal`,
        type: "Conférence",
        organisateur: "Eventbrite",
        date: "2026",
        lieu: ville || "Montréal",
        prix: "Voir le site",
        lien: `https://www.eventbrite.ca/d/canada--montreal/${encodeURIComponent(roleBase)}/`,
      },
      {
        nom: `Networking ${roleBase} — Meetup Montréal`,
        type: "Networking",
        organisateur: "Meetup",
        date: "2026",
        lieu: ville || "Montréal",
        prix: "Gratuit",
        lien: `https://www.meetup.com/find/?keywords=${encodeURIComponent(roleBase)}&location=Montréal`,
      },
      {
        nom: `Programme mentorat — Réseau des Femmes d'Affaires du Québec`,
        type: "Mentorat",
        organisateur: "RFAQ",
        date: "2026",
        lieu: "Québec",
        prix: "Voir le site",
        lien: "https://www.rfaq.ca/",
      },
      {
        nom: "Programme mentorat — Futurpreneur Canada",
        type: "Mentorat",
        organisateur: "Futurpreneur",
        date: "2026",
        lieu: "Canada",
        prix: "Gratuit",
        lien: "https://www.futurpreneur.ca/fr/",
      },
      {
        nom: "Mentorat professionnel — Mentorat Québec",
        type: "Mentorat",
        organisateur: "Mentorat Québec",
        date: "2026",
        lieu: "Québec",
        prix: "Gratuit",
        lien: "https://www.mentoratquebec.org/",
      },
    ];

    return NextResponse.json({
      formations: {
        renforcement,
        gap,
        prochain_poste: prochainPoste,
        objectif_long_terme: objectifLongTerme,
      },
      evenements,
      total_formations: renforcement.length + gap.length + prochainPoste.length + objectifLongTerme.length,
      total_evenements: evenements.length,
      institutions: Object.keys(INSTITUTIONS).length,
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
