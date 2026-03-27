import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================
// MAPPING COMPÉTENCES → MOTS CLÉS DOMAINES
// ============================================
function detecterDomaines(
  role: string,
  competences: string[],
  axes: string[],
  objectif: string
): string[] {
  const texte = [role, ...competences, ...axes, objectif].join(" ").toLowerCase();
  const domaines: string[] = [];

  if (texte.includes("projet") || texte.includes("pmo") || texte.includes("planif")) domaines.push("Gestion de projet");
  if (texte.includes("financ") || texte.includes("budget") || texte.includes("compt") || texte.includes("trésor")) domaines.push("Finance");
  if (texte.includes("leader") || texte.includes("manage") || texte.includes("équipe") || texte.includes("motiv")) domaines.push("Leadership");
  if (texte.includes("market") || texte.includes("vente") || texte.includes("communic")) domaines.push("Marketing");
  if (texte.includes("tech") || texte.includes("inform") || texte.includes("data") || texte.includes("python") || texte.includes("sql")) domaines.push("Technologies");
  if (texte.includes("stratég") || texte.includes("direct") || texte.includes("vp") || texte.includes("senior")) domaines.push("Management stratégique");
  if (texte.includes("entrepreneur") || texte.includes("startup") || texte.includes("innov")) domaines.push("Entrepreneuriat");
  if (texte.includes("opérat") || texte.includes("logistiq") || texte.includes("supply")) domaines.push("Gestion des opérations");
  if (texte.includes("santé") || texte.includes("médic") || texte.includes("hôpital")) domaines.push("Santé");
  if (texte.includes("ingénier") || texte.includes("génie") || texte.includes("construct")) domaines.push("Ingénierie");
  if (texte.includes("négocia") || texte.includes("présent") || texte.includes("conflit")) domaines.push("Communication");
  if (texte.includes("développement") || texte.includes("bien-être") || texte.includes("carriè")) domaines.push("Développement personnel");

  // Toujours inclure Leadership et Management si senior
  if (texte.includes("10 ans") || texte.includes("senior") || texte.includes("directeur") || texte.includes("manager")) {
    if (!domaines.includes("Leadership")) domaines.push("Leadership");
    if (!domaines.includes("Management stratégique")) domaines.push("Management stratégique");
  }

  // Fallback si rien détecté
  if (domaines.length === 0) domaines.push("Leadership", "Développement personnel");

  return [...new Set(domaines)]; // Dédupliquer
}

// ============================================
// CHERCHER FORMATIONS DANS SUPABASE
// ============================================
async function chercherFormationsParType(
  domaines: string[],
  type: string,
  competences: string[],
  langue: string = "tous"
): Promise<{
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
  description: string;
  en_ligne: boolean;
}[]> {
  try {
    // Construire la requête selon le type
    let query = supabaseAdmin
      .from("formations_verifiees")
      .select("*")
      .eq("disponible", true)
      .eq("en_ligne", true)
      .order("gratuit", { ascending: false }); // Gratuit en premier

    // Filtrer par domaine
    if (domaines.length > 0) {
      query = query.in("domaine", domaines);
    }

    // Filtrer par type de formation
    switch (type) {
      case "renforcement":
        // Cours niveau débutant/intermédiaire pour renforcer
        query = query.in("niveau", ["Débutant", "Intermédiaire"]);
        break;
      case "gap":
        // Cours pour combler les lacunes — tous niveaux
        break;
      case "prochain_poste":
        // Cours niveau intermédiaire/avancé
        query = query.in("niveau", ["Intermédiaire", "Avancé"]);
        break;
      case "objectif_long_terme":
        // Cours avancés + certifications
        query = query.in("niveau", ["Avancé", "Intermédiaire"]);
        break;
      case "certifications":
        query = query.in("domaine", ["Gestion de projet", "Technologies", "Finance"]);
        break;
    }

    const { data, error } = await query.limit(8);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((f: {
      nom_cours: string;
      institution: string;
      pays: string;
      plateforme: string;
      duree: string;
      prix: string;
      lien_direct: string;
      gratuit: boolean;
      niveau: string;
      description_courte: string;
      en_ligne: boolean;
    }) => ({
      nom: f.nom_cours,
      type,
      institution: f.institution,
      pays: f.pays,
      plateforme: f.plateforme,
      duree: f.duree,
      prix: f.prix,
      lien: f.lien_direct,
      gratuit: f.gratuit,
      niveau: f.niveau,
      description: f.description_courte,
      en_ligne: f.en_ligne,
    }));

  } catch (e) {
    console.error("Supabase formations error:", e);
    return [];
  }
}

// ============================================
// ÉVÉNEMENTS — LIENS VÉRIFIÉS
// ============================================
function getEvenements(role: string, ville: string) {
  const roleEnc = encodeURIComponent(role || "gestion");
  const villeEnc = encodeURIComponent(ville || "Montréal");

  return [
    {
      nom: `Conférence ${role} — Eventbrite ${ville || "Montréal"}`,
      type: "Conférence",
      organisateur: "Eventbrite",
      date: "2026",
      lieu: ville || "Montréal",
      prix: "Voir le site",
      lien: `https://www.eventbrite.ca/d/canada--${villeEnc}/${roleEnc}/`,
    },
    {
      nom: `Networking ${role} — Meetup ${ville || "Montréal"}`,
      type: "Networking",
      organisateur: "Meetup",
      date: "2026",
      lieu: ville || "Montréal",
      prix: "Gratuit",
      lien: `https://www.meetup.com/find/?keywords=${roleEnc}&location=${villeEnc}`,
    },
    {
      nom: "Programme de mentorat professionnel — Mentorat Québec",
      type: "Mentorat",
      organisateur: "Mentorat Québec",
      date: "2026",
      lieu: "Québec",
      prix: "Gratuit",
      lien: "https://www.mentoratquebec.org/",
    },
    {
      nom: "Mentorat jeunes entrepreneurs — Futurpreneur Canada",
      type: "Mentorat",
      organisateur: "Futurpreneur Canada",
      date: "2026",
      lieu: "Canada",
      prix: "Gratuit",
      lien: "https://www.futurpreneur.ca/fr/",
    },
    {
      nom: "Réseau des Femmes d'Affaires du Québec — Mentorat",
      type: "Mentorat",
      organisateur: "RFAQ",
      date: "2026",
      lieu: "Québec",
      prix: "Voir le site",
      lien: "https://www.rfaq.ca/",
    },
    {
      nom: "Forum Emploi — Ordre des ingénieurs du Québec",
      type: "Networking",
      organisateur: "OIQ",
      date: "2026",
      lieu: "Montréal",
      prix: "Voir le site",
      lien: "https://www.oiq.qc.ca/",
    },
  ];
}

// ============================================
// API ROUTE
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, ville, competences, axes, objectif, experience, gps_an1_titre } = body;

    const roleBase = role || gps_an1_titre || "gestion";
    const competencesArr = competences || [];
    const axesArr = axes || [];
    const objectifStr = objectif || "";

    // Détecter les domaines pertinents
    const domaines = detecterDomaines(roleBase, competencesArr, axesArr, objectifStr);
    console.log("FORMATIONS DOMAINES DÉTECTÉS:", domaines);

    // Chercher formations par type en parallèle
    const [renforcement, gap, prochainPoste, objectifLT] = await Promise.all([
      chercherFormationsParType(domaines, "renforcement", competencesArr),
      chercherFormationsParType(domaines, "gap", competencesArr),
      chercherFormationsParType(domaines, "prochain_poste", competencesArr),
      chercherFormationsParType(domaines, "objectif_long_terme", competencesArr),
    ]);

    // Dédupliquer entre les types
    const liensVus = new Set<string>();
    const dedup = (list: typeof renforcement) => list.filter(f => {
      if (liensVus.has(f.lien)) return false;
      liensVus.add(f.lien);
      return true;
    });

    const renf = dedup(renforcement);
    const gapF = dedup(gap);
    const proch = dedup(prochainPoste);
    const objLT = dedup(objectifLT);

    const evenements = getEvenements(roleBase, ville);

    console.log(`FORMATIONS: ${renf.length} renf, ${gapF.length} gap, ${proch.length} proch, ${objLT.length} objLT`);

    return NextResponse.json({
      formations: {
        renforcement: renf,
        gap: gapF,
        prochain_poste: proch,
        objectif_long_terme: objLT,
      },
      evenements,
      total_formations: renf.length + gapF.length + proch.length + objLT.length,
      total_evenements: evenements.length,
      domaines_detectes: domaines,
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
