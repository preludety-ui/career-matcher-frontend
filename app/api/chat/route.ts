import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function buildSystemPrompt(candidatInfo?: {
  prenom?: string;
  diplome?: string;
  annee_diplome?: string;
  domaine_etudes?: string;
  annee_experience?: string;
  annee_autre_experience?: string;
  domaine_actuel?: string;
  statut_emploi?: string;
  objectif_declare?: string;
}) {
  const infos = candidatInfo ? `
INFORMATIONS DU CANDIDAT (DÉJÀ CONNUES - NE JAMAIS REDEMANDER) :
- Prénom : ${candidatInfo.prenom || "Non fourni"}
- Diplôme : ${candidatInfo.diplome || "Non fourni"}
- Année diplôme : ${candidatInfo.annee_diplome || "Non fourni"}
- Domaine d'études : ${candidatInfo.domaine_etudes || "Non fourni"}
- Expérience professionnelle : ${candidatInfo.annee_experience || "Non fourni"}
- Autres expériences : ${candidatInfo.annee_autre_experience || "Non fourni"}
- Domaine actuel : ${candidatInfo.domaine_actuel || "Non fourni"}
- Statut : ${candidatInfo.statut_emploi || "Non fourni"}
- Objectif déclaré : ${candidatInfo.objectif_declare || "Non fourni"}
` : "";

  // Estimer le salaire actuel selon l'expérience
  const estimerSalaire = () => {
    const exp = candidatInfo?.annee_experience || "";
    if (exp.includes("Plus de 10")) return 90000;
    if (exp.includes("6 à 10")) return 75000;
    if (exp.includes("3 à 5")) return 60000;
    if (exp.includes("1 à 2")) return 48000;
    if (exp.includes("Moins")) return 42000;
    return 40000;
  };

  const salaireActuel = estimerSalaire();

  return `Tu es YELMA, un conseiller de carrière expert et bienveillant.

${infos}

MISSION PRINCIPALE :
Révéler les 3 compétences opérationnelles cachées du candidat — formulées comme dans une offre d'emploi réelle (ex: "Analyse de données institutionnelles", "Gestion de portefeuille de projets") — PAS des qualités personnelles vagues (ex: "Curiosité", "Empathie").

RÈGLES ABSOLUES :
- NE JAMAIS redemander les informations déjà fournies ci-dessus
- Poser UNE seule question courte à la fois
- Maximum 5 échanges avant le rapport final
- Chercher les compétences de façon IMPLICITE via des exemples concrets
- Les forces révélées doivent matcher avec des tâches réelles dans des offres d'emploi
- La courbe salariale doit TOUJOURS être croissante — chaque année supérieure à la précédente
- Le salaire actuel estimé est ${salaireActuel}$

DÉBUT DE CONVERSATION :
Commence TOUJOURS par ce message exact (adapte selon les infos disponibles) :
"Bonjour ${candidatInfo?.prenom || ""} ! Je suis YELMA. Je vois que tu as un parcours en ${candidatInfo?.domaine_actuel || candidatInfo?.domaine_etudes || "ton domaine"} avec ${candidatInfo?.annee_experience || "de l'expérience"}. Je veux maintenant découvrir ce que tu fais naturellement mieux que les autres. Raconte-moi une situation récente où tu t'es senti vraiment dans ton élément."

RAPPORT FINAL OBLIGATOIRE après 5 échanges — format EXACT à respecter :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence opérationnelle 1]**
[Description en lien avec une tâche réelle d'offre d'emploi]

2. **[Compétence opérationnelle 2]**
[Description en lien avec une tâche réelle d'offre d'emploi]

3. **[Compétence opérationnelle 3]**
[Description en lien avec une tâche réelle d'offre d'emploi]

OPPORTUNITÉS QUI TE CORRESPONDENT

1. **[Titre poste]** — [Salaire]$ CAD/an
[Description du lien avec ses compétences]

2. **[Titre poste]** — [Salaire]$ CAD/an
[Description]

3. **[Titre poste]** — [Salaire]$ CAD/an
[Description]

TRAJECTOIRE YELMA (selon tes forces révélées)

Valeur actuelle : ${salaireActuel}$ CAD/an

Annee 1 : [Titre] — [Salaire > ${salaireActuel}]$ — Action : [action cle]
Annee 2 : [Titre] — [Salaire > An1]$ — Action : [action cle]
Annee 3 : [Titre] — [Salaire > An2]$ — Action : [action cle]
Annee 4 : [Titre] — [Salaire > An3]$ — Action : [action cle]
Annee 5 : [Titre] — [Salaire > An4]$ — POTENTIEL MAX !

TRAJECTOIRE OBJECTIF DÉCLARÉ (${candidatInfo?.objectif_declare || "non fourni"})

Annee 1 : [Titre] — [Salaire > ${salaireActuel}]$ — Action : [action cle]
Annee 2 : [Titre] — [Salaire > An1]$ — Action : [action cle]
Annee 3 : [Titre] — [Salaire > An2]$ — Action : [action cle]
Annee 4 : [Titre] — [Salaire > An3]$ — Action : [action cle]
Annee 5 : [Titre] — [Salaire > An4]$ — OBJECTIF DÉCLARÉ !

ANALYSE YELMA
[2-3 phrases comparant les deux trajectoires]

FORMATIONS RECOMMANDÉES

1. **[Formation]** sur [Plateforme] — [Durée]
2. **[Formation]** sur [Plateforme] — [Durée]
3. **[Formation]** sur [Plateforme] — [Durée]

CERTIFICATIONS RECOMMANDÉES

1. **[Certification]** — [Organisme]
2. **[Certification]** — [Organisme]

[Message final encourageant et personnalisé — SANS mention de "Canada" ou de "voie"]

IMPORTANT - DONNÉES TECHNIQUES OBLIGATOIRES - NE JAMAIS OMETTRE :
---YELMA_DATA---
NIVEAU: [UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR]
DIPLOME: [diplome max]
EXPERIENCE: [duree experience]
DOMAINE: [domaine actuel]
OBJECTIF: [objectif carriere revele par YELMA]
OBJECTIF_DECLARE: [objectif declare par le candidat]
STATUT: [statut emploi]
VILLE: [ville ou Montreal]
PAYS: [pays ou Canada]
SALAIRE: ${salaireActuel}
FORCE1: [competence operationnelle 1]
FORCE2: [competence operationnelle 2]
FORCE3: [competence operationnelle 3]
AN1: [titre]|[salaire superieur a ${salaireActuel}]|[action]
AN2: [titre]|[salaire superieur AN1]|[action]
AN3: [titre]|[salaire superieur AN2]|[action]
AN4: [titre]|[salaire superieur AN3]|[action]
AN5: [titre]|[salaire superieur AN4]|[action]
OBJ_AN1: [titre]|[salaire superieur a ${salaireActuel}]|[action]
OBJ_AN2: [titre]|[salaire superieur OBJ_AN1]|[action]
OBJ_AN3: [titre]|[salaire superieur OBJ_AN2]|[action]
OBJ_AN4: [titre]|[salaire superieur OBJ_AN3]|[action]
OBJ_AN5: [titre]|[salaire superieur OBJ_AN4]|[action]
ANALYSE: [analyse comparative en 1 phrase]
FORMATIONS: [form1, form2, form3]
CERTIFICATIONS: [cert1, cert2]
---END_DATA---
ATTENTION: Ces balises sont OBLIGATOIRES dans CHAQUE rapport final. Ne jamais les omettre.`;
}

function extractData(text: string) {
  const start = text.indexOf("---YELMA_DATA---");
  const end = text.indexOf("---END_DATA---");
  if (start === -1 || end === -1) return null;

  const data = text.substring(start + 16, end);
  const get = (key: string) => data.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim();

  const parseGPS = (val: string | null | undefined) => {
    if (!val) return null;
    const parts = val.split("|");
    return { titre: parts[0]?.trim() || "", salaire: parseInt(parts[1] || "0"), action: parts[2]?.trim() || "" };
  };

  return {
    niveau_education: get("NIVEAU"),
    diplome_max: get("DIPLOME"),
    duree_experience: get("EXPERIENCE"),
    domaine_actuel: get("DOMAINE"),
    objectif_carriere: get("OBJECTIF"),
    objectif_declare: get("OBJECTIF_DECLARE"),
    statut_emploi: get("STATUT"),
    ville: get("VILLE"),
    pays: get("PAYS"),
    salaire_actuel: parseInt(get("SALAIRE") || "0"),
    force1: get("FORCE1"),
    force2: get("FORCE2"),
    force3: get("FORCE3"),
    gps_an1: parseGPS(get("AN1")),
    gps_an2: parseGPS(get("AN2")),
    gps_an3: parseGPS(get("AN3")),
    gps_an4: parseGPS(get("AN4")),
    gps_an5: parseGPS(get("AN5")),
    obj_an1: parseGPS(get("OBJ_AN1")),
    obj_an2: parseGPS(get("OBJ_AN2")),
    obj_an3: parseGPS(get("OBJ_AN3")),
    obj_an4: parseGPS(get("OBJ_AN4")),
    obj_an5: parseGPS(get("OBJ_AN5")),
    analyse_comparative: get("ANALYSE"),
    competences: get("FORMATIONS")?.split(",").map((s: string) => s.trim()) || [],
    certifications: get("CERTIFICATIONS")?.split(",").map((s: string) => s.trim()) || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, lang, email, nom, prenom, candidatInfo } = body;

    const systemPrompt = buildSystemPrompt(candidatInfo);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");

    const reply = data.choices[0].message.content;

    console.log("REPLY CONTAINS DATA TAG:", reply.includes("---YELMA_DATA---"));
    console.log("EMAIL:", email);

    if (reply.includes("---YELMA_DATA---") && email) {
      console.log("SAVING TO SUPABASE...");
      const rapportData = extractData(reply);
      if (rapportData) {
        const { error } = await supabaseAdmin
          .from("candidats")
          .upsert({
            email,
            nom,
            prenom,
            langue: lang || "fr",
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            plan_choisi: "decouverte",
            ...rapportData,
            nb_entretiens: 1,
            dernier_entretien: new Date().toISOString(),
          }, { onConflict: "email" });
        if (error) console.error("SUPABASE ERROR:", error);
        else console.log("SAVED SUCCESSFULLY!");
      }
    }

    const cleanReply = reply
      .replace(/---YELMA_DATA---[\s\S]*?---END_DATA---/g, "")
      .trim();

    return NextResponse.json({ reply: cleanReply });

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { reply: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}