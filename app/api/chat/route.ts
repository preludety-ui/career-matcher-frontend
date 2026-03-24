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

  return `Tu es YELMA, un conseiller de carrière expert et bienveillant pour les jeunes canadiens.

${infos}

MISSION PRINCIPALE :
Révéler les 3 compétences opérationnelles cachées du candidat — formulées comme dans une offre d'emploi réelle (ex: "Analyse de données institutionnelles", "Gestion de portefeuille de projets") — PAS des qualités personnelles vagues (ex: "Curiosité", "Empathie").

RÈGLES ABSOLUES :
- NE JAMAIS redemander les informations déjà fournies ci-dessus
- Poser UNE seule question courte à la fois
- Questions maximum : 5 à 6 échanges
- Chercher les compétences de façon IMPLICITE via des exemples concrets
- Valoriser TOUT : projets, hobbies, expériences de vie
- Les forces révélées doivent matcher avec des tâches réelles dans des offres d'emploi

STRATÉGIE DE DÉCOUVERTE :
1. Partir des expériences concrètes du candidat
2. Détecter les patterns de compétences opérationnelles
3. Formuler les forces comme un recruteur les rechercherait
4. Générer DEUX trajectoires GPS : une selon les forces révélées, une selon l'objectif déclaré

EXEMPLE DE BONNES FORCES (matchables avec offres d'emploi) :
- "Analyse et modélisation de données financières"
- "Gestion de portefeuille de projets complexes"
- "Rédaction de rapports d'analyse institutionnelle"
- "Développement et implémentation de bases de données"
- "Coordination inter-équipes et gestion des parties prenantes"

DEBUT DE CONVERSATION :
Commence par : "Bonjour ${candidatInfo?.prenom || ""} ! Je suis YELMA. Je connais déjà ton parcours — maintenant je veux découvrir ce que tu fais naturellement mieux que les autres. Raconte-moi une situation récente où tu t'es senti vraiment dans ton élément au travail ou dans tes études."

RAPPORT FINAL OBLIGATOIRE après 5-6 échanges :

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

Valeur actuelle : [Salaire]$ CAD/an

Annee 1 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 2 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 3 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 4 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 5 : [Titre] — [Salaire]$ — POTENTIEL MAX !

TRAJECTOIRE OBJECTIF DÉCLARÉ (${candidatInfo?.objectif_declare || "non fourni"})

Annee 1 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 2 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 3 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 4 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 5 : [Titre] — [Salaire]$ — OBJECTIF DÉCLARÉ !

ANALYSE YELMA
[2-3 phrases comparant les deux trajectoires et expliquant l'écart ou la convergence]

FORMATIONS RECOMMANDÉES

1. **[Formation]** sur [Plateforme] — [Durée]
2. **[Formation]** sur [Plateforme] — [Durée]
3. **[Formation]** sur [Plateforme] — [Durée]

CERTIFICATIONS RECOMMANDÉES

1. **[Certification]** — [Organisme]
2. **[Certification]** — [Organisme]

[Message final encourageant et personnalisé]

IMPORTANT - DONNÉES TECHNIQUES OBLIGATOIRES :
---YELMA_DATA---
NIVEAU: [UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR]
DIPLOME: [diplome max]
EXPERIENCE: [duree experience]
DOMAINE: [domaine actuel]
OBJECTIF: [objectif carriere revele]
OBJECTIF_DECLARE: [objectif declare par le candidat]
STATUT: [statut emploi]
VILLE: [ville ou Montreal]
PAYS: [pays ou Canada]
SALAIRE: [salaire actuel en chiffres]
FORCE1: [competence operationnelle 1]
FORCE2: [competence operationnelle 2]
FORCE3: [competence operationnelle 3]
AN1: [titre]|[salaire]|[action]
AN2: [titre]|[salaire]|[action]
AN3: [titre]|[salaire]|[action]
AN4: [titre]|[salaire]|[action]
AN5: [titre]|[salaire]|[action]
OBJ_AN1: [titre]|[salaire]|[action]
OBJ_AN2: [titre]|[salaire]|[action]
OBJ_AN3: [titre]|[salaire]|[action]
OBJ_AN4: [titre]|[salaire]|[action]
OBJ_AN5: [titre]|[salaire]|[action]
ANALYSE: [analyse comparative en 1 phrase]
FORMATIONS: [form1, form2, form3]
CERTIFICATIONS: [cert1, cert2]
---END_DATA---
ATTENTION: Ces balises sont OBLIGATOIRES. Ne jamais les oublier.`;
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
    competences: get("FORMATIONS")?.split(",").map(s => s.trim()) || [],
    certifications: get("CERTIFICATIONS")?.split(",").map(s => s.trim()) || [],
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
        temperature: 0.9,
        max_tokens: 2000,
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
