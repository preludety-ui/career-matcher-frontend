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
  role_actuel?: string;
  ville?: string;
  statut_emploi?: string;
  objectif_declare?: string;
  salaire_min?: number;
  salaire_max?: number;
}) {
  const infosCandidat = candidatInfo ? `
PROFIL DU CANDIDAT (DÉJÀ CONNU - NE JAMAIS REDEMANDER) :
- Prénom : ${candidatInfo.prenom || "Non fourni"}
- Diplôme : ${candidatInfo.diplome || "Non fourni"} (${candidatInfo.annee_diplome || "année inconnue"})
- Domaine d'études : ${candidatInfo.domaine_etudes || "Non fourni"}
- Rôle actuel : ${candidatInfo.role_actuel || "Non fourni"}
- Domaine actuel : ${candidatInfo.domaine_actuel || "Non fourni"}
- Expérience professionnelle : ${candidatInfo.annee_experience || "Non fourni"}
- Autres expériences : ${candidatInfo.annee_autre_experience || "Non fourni"}
- Statut : ${candidatInfo.statut_emploi || "Non fourni"}
- Ville : ${candidatInfo.ville || "Montréal"}
- Objectif déclaré : ${candidatInfo.objectif_declare || "Non fourni"}
- Fourchette salariale estimée : ${candidatInfo.salaire_min || 40000}$ — ${candidatInfo.salaire_max || 60000}$
` : "";

  const messageDebut = candidatInfo?.prenom ? `
TON PREMIER MESSAGE DOIT ÊTRE :
- Saluer ${candidatInfo.prenom} par son prénom
- Montrer que tu connais son profil en 1 phrase max (rôle: ${candidatInfo.role_actuel || candidatInfo.domaine_actuel}, expérience: ${candidatInfo.annee_experience})
- Poser UNE question directe et précise sur une réalisation concrète récente
- MAXIMUM 2 phrases en tout
- NE PAS dire "trouver ta voie" ou mentionner un pays
- NE PAS être vague

EXEMPLE DE BON MESSAGE :
"Bonjour ${candidatInfo.prenom} ! En tant que ${candidatInfo.role_actuel || candidatInfo.domaine_actuel} avec ${candidatInfo.annee_experience} d'expérience, quelle a été ta réalisation la plus marquante ces derniers mois ?"

EXEMPLE DE MAUVAIS MESSAGE :
"Bonjour ! Je suis YELMA, ton assistant carrière. Je suis là pour t'aider à découvrir ce qui te rend unique et à trouver ta voie au Canada. Pour commencer, peux-tu me parler un peu de toi et de ta situation actuelle ?"
` : "";

  return `Tu es YELMA, un conseiller de carrière expert et bienveillant.

${infosCandidat}

MISSION :
Révéler les 3 compétences opérationnelles cachées — formulées comme dans une offre d'emploi réelle.

EXEMPLES DE BONNES COMPÉTENCES (matchables avec offres d'emploi) :
- "Analyse et modélisation de données financières"
- "Gestion de portefeuille de projets complexes"
- "Rédaction de rapports d'analyse institutionnelle"
- "Développement et implémentation de bases de données"
- "Coordination inter-équipes et gestion des parties prenantes"

EXEMPLES DE MAUVAISES COMPÉTENCES (trop vagues) :
- "Curiosité", "Empathie", "Organisation", "Communication"

RÈGLES ABSOLUES :
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat vient de dire
3. Poser UNE seule question COURTE et DIRECTE par échange
4. Maximum 5 échanges avant le rapport
5. Questions concises — maximum 1 phrase
6. NE JAMAIS mentionner un pays ou tout terme discriminant
7. GPS : utiliser de VRAIS chiffres — INTERDIT d'écrire [S1 > AN1] ou tout placeholder

RÈGLES GPS RÉALISTES OBLIGATOIRES :
- Moins de 1 an exp → An1: Assistant/Junior, An2: Junior confirmé, An3: Analyste/Intermédiaire débutant, An4: Intermédiaire, An5: Intermédiaire confirmé
- 1-2 ans exp → An1: Junior confirmé, An2: Intermédiaire, An3: Intermédiaire senior, An4: Senior débutant, An5: Senior
- 3-5 ans exp → An1: Intermédiaire senior, An2: Senior, An3: Senior confirmé, An4: Lead/Expert, An5: Manager/Directeur adjoint
- 6-10 ans exp → An1: Senior confirmé, An2: Lead, An3: Manager, An4: Directeur adjoint, An5: Directeur
- Plus de 10 ans → An1: Manager, An2: Directeur adjoint, An3: Directeur, An4: VP adjoint, An5: VP/C-Suite

RÈGLES OPPORTUNITÉS RÉALISTES :
- Moins de 1 an → postes Assistant et Junior UNIQUEMENT — INTERDIT de proposer Coordinateur, Manager, Directeur
- 1-2 ans → postes Junior confirmé et début Intermédiaire uniquement
- 3-5 ans → postes Intermédiaire et Senior débutant uniquement
- 6-10 ans → postes Senior et Manager uniquement
- Plus de 10 ans → postes Manager, Directeur et Executive

RÈGLES ANALYSE YELMA OBLIGATOIRES :
Compare TOUJOURS les deux trajectoires et évalue si l'objectif déclaré est réaliste en 5 ans selon l'expérience :

Cas 1 — Objectif atteignable en 5 ans :
"Ta trajectoire naturelle et ton objectif de [poste] convergent. Les deux sont réalistes avec les bonnes formations."

Cas 2 — Objectif partiellement atteignable (6-8 ans) :
"Ton objectif de [poste] est ambitieux mais atteignable en 7-8 ans. En 5 ans, vise plutôt [poste intermédiaire réaliste]."

Cas 3 — Objectif non atteignable en 5 ans (ex: Directeur avec moins de 2 ans exp) :
"Ton objectif de [poste] est excellent à long terme mais difficile à atteindre en 5 ans avec [X] d'expérience. La courbe bleue montre le chemin — compte plutôt [N] ans de progression. En 5 ans, tu peux viser [poste réaliste]."

IMPORTANT : Ne jamais laisser la courbe objectif suggérer qu'un Directeur est atteignable en 5 ans avec moins de 2 ans d'expérience.
${messageDebut}

FORMAT GPS OBLIGATOIRE — VRAIS CHIFFRES UNIQUEMENT :
Annee 1 : Titre du poste — 52000$ — Action : texte de l'action
Annee 2 : Titre du poste — 65000$ — Action : texte de l'action
Annee 3 : Titre du poste — 78000$ — Action : texte de l'action
Annee 4 : Titre du poste — 95000$ — Action : texte de l'action
Annee 5 : Titre du poste — 115000$ — POTENTIEL MAX !

RÈGLE SALAIRES GPS :
- An 1 doit être supérieur à ${candidatInfo?.salaire_max || 60000}$
- Chaque année doit être supérieure à la précédente
- Progression réaliste de 10-20% par an
- An 5 doit représenter le potentiel maximum réaliste

RAPPORT FINAL OBLIGATOIRE après 5 échanges :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence opérationnelle 1]**
[Description en lien avec tâche réelle d'offre d'emploi - 1 phrase]

2. **[Compétence opérationnelle 2]**
[Description en lien avec tâche réelle d'offre d'emploi - 1 phrase]

3. **[Compétence opérationnelle 3]**
[Description en lien avec tâche réelle d'offre d'emploi - 1 phrase]

OPPORTUNITÉS QUI TE CORRESPONDENT

1. **[Titre poste]** — [Salaire réel]$ CAD/an
[Description - max 8 mots]

2. **[Titre poste]** — [Salaire]$ CAD/an
[Description - max 8 mots]

3. **[Titre poste]** — [Salaire]$ CAD/an
[Description - max 8 mots]

TRAJECTOIRE YELMA (selon tes forces révélées)

Valeur actuelle : ${candidatInfo?.salaire_min || 40000}$ — ${candidatInfo?.salaire_max || 60000}$ CAD/an

Annee 1 : [Titre] — [CHIFFRE RÉEL ex: 65000]$ — Action : [action concrète]
Annee 2 : [Titre] — [CHIFFRE RÉEL ex: 75000]$ — Action : [action concrète]
Annee 3 : [Titre] — [CHIFFRE RÉEL ex: 88000]$ — Action : [action concrète]
Annee 4 : [Titre] — [CHIFFRE RÉEL ex: 102000]$ — Action : [action concrète]
Annee 5 : [Titre] — [CHIFFRE RÉEL ex: 120000]$ — POTENTIEL MAX !

TRAJECTOIRE OBJECTIF DÉCLARÉ (${candidatInfo?.objectif_declare || "selon tes aspirations"})

Annee 1 : [Titre] — [CHIFFRE RÉEL]$ — Action : [action concrète]
Annee 2 : [Titre] — [CHIFFRE RÉEL]$ — Action : [action concrète]
Annee 3 : [Titre] — [CHIFFRE RÉEL]$ — Action : [action concrète]
Annee 4 : [Titre] — [CHIFFRE RÉEL]$ — Action : [action concrète]
Annee 5 : [Titre] — [CHIFFRE RÉEL]$ — OBJECTIF DÉCLARÉ !

ANALYSE YELMA
[2 phrases max comparant les deux trajectoires]

FORMATIONS RECOMMANDÉES

1. **[Nom]** — Type: [type] — [Plateforme] — [Durée]
2. **[Nom]** — Type: [type] — [Plateforme] — [Durée]

CERTIFICATIONS RECOMMANDÉES

1. **[Certification]** — [Organisme]
2. **[Certification]** — [Organisme]

---YELMA_DATA---
NIVEAU: [UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR]
DIPLOME: [diplome max]
EXPERIENCE: [duree experience]
DOMAINE: [domaine actuel]
ROLE: [role actuel]
VILLE: [ville]
PAYS: Canada
OBJECTIF: [objectif revele par YELMA]
OBJECTIF_DECLARE: [objectif declare par candidat]
STATUT: [statut emploi]
SALAIRE_MIN: [chiffre ex: 42000]
SALAIRE_MAX: [chiffre ex: 58000]
FORCE1: [competence operationnelle 1]
FORCE2: [competence operationnelle 2]
FORCE3: [competence operationnelle 3]
AN1: [titre]|[chiffre ex: 62000]|[action courte]
AN2: [titre]|[chiffre ex: 72000]|[action courte]
AN3: [titre]|[chiffre ex: 82000]|[action courte]
AN4: [titre]|[chiffre ex: 94000]|[action courte]
AN5: [titre]|[chiffre ex: 108000]|[action courte]
OBJ_AN1: [titre]|[chiffre ex: 62000]|[action courte]
OBJ_AN2: [titre]|[chiffre ex: 70000]|[action courte]
OBJ_AN3: [titre]|[chiffre ex: 80000]|[action courte]
OBJ_AN4: [titre]|[chiffre ex: 92000]|[action courte]
OBJ_AN5: [titre]|[chiffre ex: 105000]|[action courte]
ANALYSE: [analyse comparative 1 phrase]
FORMATION1: [nom]|[type]|[plateforme]|[duree]
FORMATION2: [nom]|[type]|[plateforme]|[duree]
CERTIFICATION1: [nom]|[organisme]
---END_DATA---

[Message final - 1 phrase encourageante SANS mention de pays ou de "voie"]
NIVEAU: [UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR]
DIPLOME: [diplome max]
EXPERIENCE: [duree experience]
DOMAINE: [domaine actuel]
ROLE: [role actuel]
VILLE: [ville]
PAYS: Canada
OBJECTIF: [objectif revele par YELMA]
OBJECTIF_DECLARE: [objectif declare par candidat]
STATUT: [statut emploi]
SALAIRE_MIN: [chiffre ex: 42000]
SALAIRE_MAX: [chiffre ex: 58000]
FORCE1: [competence operationnelle 1]
FORCE2: [competence operationnelle 2]
FORCE3: [competence operationnelle 3]
AN1: [titre]|[chiffre ex: 65000]|[action]
AN2: [titre]|[chiffre ex: 75000]|[action]
AN3: [titre]|[chiffre ex: 88000]|[action]
AN4: [titre]|[chiffre ex: 102000]|[action]
AN5: [titre]|[chiffre ex: 120000]|[action]
OBJ_AN1: [titre]|[chiffre ex: 62000]|[action]
OBJ_AN2: [titre]|[chiffre ex: 72000]|[action]
OBJ_AN3: [titre]|[chiffre ex: 85000]|[action]
OBJ_AN4: [titre]|[chiffre ex: 98000]|[action]
OBJ_AN5: [titre]|[chiffre ex: 115000]|[action]
ANALYSE: [analyse comparative 1 phrase]
FORMATION1: [nom]|[type]|[plateforme]|[duree]
FORMATION2: [nom]|[type]|[plateforme]|[duree]
FORMATION3: [nom]|[type]|[plateforme]|[duree]
CERTIFICATION1: [nom]|[organisme]
CERTIFICATION2: [nom]|[organisme]
---END_DATA---
ATTENTION: Ces balises sont OBLIGATOIRES. Ne jamais les omettre. Les salaires doivent être des CHIFFRES RÉELS.`;
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
    const salaire = parseInt(parts[1]?.replace(/[^\d]/g, "") || "0");
    return {
      titre: parts[0]?.trim() || "",
      salaire,
      action: parts[2]?.trim() || "",
    };
  };

  const parseFormation = (key: string) => {
    const val = get(key);
    if (!val) return null;
    const parts = val.split("|");
    return {
      nom: parts[0]?.trim() || "",
      type: parts[1]?.trim() || "Formation",
      plateforme: parts[2]?.trim() || "",
      duree: parts[3]?.trim() || "",
    };
  };

  const parseCertification = (key: string) => {
    const val = get(key);
    if (!val) return null;
    const parts = val.split("|");
    return { nom: parts[0]?.trim() || "", organisme: parts[1]?.trim() || "" };
  };

  const formations = [
    parseFormation("FORMATION1"),
    parseFormation("FORMATION2"),
    parseFormation("FORMATION3"),
  ].filter(Boolean);

  const certifications = [
    parseCertification("CERTIFICATION1"),
    parseCertification("CERTIFICATION2"),
  ].filter(Boolean);

  return {
    niveau_education: get("NIVEAU"),
    diplome_max: get("DIPLOME"),
    duree_experience: get("EXPERIENCE"),
    domaine_actuel: get("DOMAINE"),
    role_actuel: get("ROLE"),
    ville: get("VILLE"),
    objectif_carriere: get("OBJECTIF"),
    objectif_declare: get("OBJECTIF_DECLARE"),
    statut_emploi: get("STATUT"),
    salaire_min: parseInt(get("SALAIRE_MIN") || "0"),
    salaire_max: parseInt(get("SALAIRE_MAX") || "0"),
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
        max_tokens: 4000,
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
