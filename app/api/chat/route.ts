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

  const infosCandidat = candidatInfo ? `
PROFIL DU CANDIDAT (DÉJÀ CONNU - NE JAMAIS REDEMANDER CES INFORMATIONS) :
- Prénom : ${candidatInfo.prenom || "Non fourni"}
- Diplôme : ${candidatInfo.diplome || "Non fourni"} (${candidatInfo.annee_diplome || "année inconnue"})
- Domaine d'études : ${candidatInfo.domaine_etudes || "Non fourni"}
- Expérience professionnelle : ${candidatInfo.annee_experience || "Non fourni"}
- Autres expériences : ${candidatInfo.annee_autre_experience || "Non fourni"}
- Domaine actuel : ${candidatInfo.domaine_actuel || "Non fourni"}
- Statut : ${candidatInfo.statut_emploi || "Non fourni"}
- Objectif déclaré : ${candidatInfo.objectif_declare || "Non fourni"}
- Salaire actuel estimé : ${salaireActuel}$
` : "";

  const messageDebut = candidatInfo?.prenom
    ? `Commence la conversation par un message personnalisé qui :
1. Accueille ${candidatInfo.prenom} chaleureusement
2. Montre que tu connais déjà son profil (diplôme en ${candidatInfo.domaine_etudes || candidatInfo.domaine_actuel || "son domaine"}, ${candidatInfo.annee_experience || "son expérience"})
3. Explique brièvement que tu vas chercher ses forces cachées
4. Pose UNE question ouverte sur une réalisation concrète récente

IMPORTANT: Ne jamais dire "trouver ta voie" ou faire référence à un pays spécifique.
Varie la formulation à chaque fois - ne pas utiliser de template fixe.

Exemple de ton attendu:
"Bonjour ${candidatInfo.prenom} ! Avec ton parcours en ${candidatInfo.domaine_etudes || candidatInfo.domaine_actuel}, tu as sûrement développé des compétences que même toi tu ne réalises pas encore. Je vais t'aider à les mettre en lumière. Raconte-moi une situation récente où tu t'es senti vraiment efficace — que ce soit au travail, en stage, ou même dans ta vie perso."`
    : `Commence par accueillir chaleureusement le candidat et pose une question sur une réalisation concrète récente.`;

  return `Tu es YELMA, un conseiller de carrière expert et bienveillant.

${infosCandidat}

MISSION :
Révéler les 3 compétences opérationnelles cachées — formulées comme dans une offre d'emploi réelle.
Exemples de BONNES compétences : "Analyse de données institutionnelles", "Gestion de portefeuille de projets", "Rédaction de rapports financiers"
Exemples de MAUVAISES compétences : "Curiosité", "Empathie", "Organisation" (trop vagues)

RÈGLES :
- NE JAMAIS redemander les infos du profil ci-dessus
- UNE seule question courte par échange
- Maximum 5 échanges avant le rapport
- Chercher les compétences de façon IMPLICITE
- Courbe salariale TOUJOURS croissante — chaque année > année précédente
- Ne jamais mentionner "Canada" ou "trouver ta voie" — formulations inclusives uniquement

${messageDebut}

RAPPORT FINAL — FORMAT EXACT OBLIGATOIRE :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence opérationnelle 1]**
[Description en lien avec tâche réelle d'offre d'emploi]

2. **[Compétence opérationnelle 2]**
[Description en lien avec tâche réelle d'offre d'emploi]

3. **[Compétence opérationnelle 3]**
[Description en lien avec tâche réelle d'offre d'emploi]

OPPORTUNITÉS QUI TE CORRESPONDENT

1. **[Titre poste]** — [Salaire]$ CAD/an
[Description courte]

2. **[Titre poste]** — [Salaire]$ CAD/an
[Description courte]

3. **[Titre poste]** — [Salaire]$ CAD/an
[Description courte]

TRAJECTOIRE YELMA (selon tes forces révélées)

Valeur actuelle : ${salaireActuel}$ CAD/an

Annee 1 : [Titre] — [S1 > ${salaireActuel}]$ — Action : [action]
Annee 2 : [Titre] — [S2 > S1]$ — Action : [action]
Annee 3 : [Titre] — [S3 > S2]$ — Action : [action]
Annee 4 : [Titre] — [S4 > S3]$ — Action : [action]
Annee 5 : [Titre] — [S5 > S4]$ — POTENTIEL MAX !

TRAJECTOIRE OBJECTIF DÉCLARÉ (${candidatInfo?.objectif_declare || "selon tes aspirations"})

Annee 1 : [Titre] — [S1 > ${salaireActuel}]$ — Action : [action]
Annee 2 : [Titre] — [S2 > S1]$ — Action : [action]
Annee 3 : [Titre] — [S3 > S2]$ — Action : [action]
Annee 4 : [Titre] — [S4 > S3]$ — Action : [action]
Annee 5 : [Titre] — [S5 > S4]$ — OBJECTIF DÉCLARÉ !

ANALYSE YELMA
[2-3 phrases comparant les deux trajectoires]

FORMATIONS RECOMMANDÉES

1. **[Nom formation]** — Type: [Certification/Formation/Mentorat/Événement/Diplôme] — [Plateforme] — [Durée]
2. **[Nom formation]** — Type: [Certification/Formation/Mentorat/Événement/Diplôme] — [Plateforme] — [Durée]
3. **[Nom formation]** — Type: [Certification/Formation/Mentorat/Événement/Diplôme] — [Plateforme] — [Durée]

CERTIFICATIONS RECOMMANDÉES

1. **[Certification]** — [Organisme]
2. **[Certification]** — [Organisme]

[Message final encourageant — SANS mention de pays ou de "voie"]

---YELMA_DATA---
NIVEAU: [UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR]
DIPLOME: [diplome max]
EXPERIENCE: [duree experience]
DOMAINE: [domaine actuel]
OBJECTIF: [objectif revele par YELMA]
OBJECTIF_DECLARE: [objectif declare par candidat]
STATUT: [statut emploi]
VILLE: [ville ou Montreal]
PAYS: [pays ou Canada]
SALAIRE: ${salaireActuel}
FORCE1: [competence operationnelle 1]
FORCE2: [competence operationnelle 2]
FORCE3: [competence operationnelle 3]
AN1: [titre]|[salaire > ${salaireActuel}]|[action]
AN2: [titre]|[salaire > AN1]|[action]
AN3: [titre]|[salaire > AN2]|[action]
AN4: [titre]|[salaire > AN3]|[action]
AN5: [titre]|[salaire > AN4]|[action]
OBJ_AN1: [titre]|[salaire > ${salaireActuel}]|[action]
OBJ_AN2: [titre]|[salaire > OBJ_AN1]|[action]
OBJ_AN3: [titre]|[salaire > OBJ_AN2]|[action]
OBJ_AN4: [titre]|[salaire > OBJ_AN3]|[action]
OBJ_AN5: [titre]|[salaire > OBJ_AN4]|[action]
ANALYSE: [analyse comparative 1 phrase]
FORMATION1: [nom]|[type: Certification ou Formation ou Mentorat ou Evenement ou Diplome]|[plateforme]|[duree]
FORMATION2: [nom]|[type]|[plateforme]|[duree]
FORMATION3: [nom]|[type]|[plateforme]|[duree]
CERTIFICATION1: [nom]|[organisme]
CERTIFICATION2: [nom]|[organisme]
---END_DATA---
ATTENTION: Ces balises sont OBLIGATOIRES. Ne jamais les omettre.`;
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

  const parseFormation = (val: string | null | undefined) => {
    if (!val) return null;
    const parts = val.split("|");
    return { nom: parts[0]?.trim() || "", type: parts[1]?.trim() || "Formation", plateforme: parts[2]?.trim() || "", duree: parts[3]?.trim() || "" };
  };

  const parseCertification = (val: string | null | undefined) => {
    if (!val) return null;
    const parts = val.split("|");
    return { nom: parts[0]?.trim() || "", organisme: parts[1]?.trim() || "" };
  };

  const formations = [
    parseFormation(get("FORMATION1")),
    parseFormation(get("FORMATION2")),
    parseFormation(get("FORMATION3")),
  ].filter(Boolean);

  const certifications = [
    parseCertification(get("CERTIFICATION1")),
    parseCertification(get("CERTIFICATION2")),
  ].filter(Boolean);

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
    formations,
    certifications,
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
            email, nom, prenom,
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
