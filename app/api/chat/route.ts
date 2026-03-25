import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getNiveauGPS(experience: string, roleActuel: string): {
  maxNiveaux: number;
  progression: string;
  niveauActuel: string;
} {
  const exp = experience?.toLowerCase() || "";
  const role = roleActuel?.toLowerCase() || "";
  const isManager = role.includes("manager") || role.includes("directeur") || role.includes("chef") || role.includes("responsable") || role.includes("vp") || role.includes("president");

  if (exp.includes("plus de 10")) {
    if (isManager) return { maxNiveaux: 4, progression: "Manager → Directeur adjoint → Directeur → VP → C-Suite", niveauActuel: "Manager+" };
    return { maxNiveaux: 2, progression: "Senior → Lead → Manager", niveauActuel: "Senior" };
  }
  if (exp.includes("6 à 10")) return { maxNiveaux: 3, progression: "Senior/Lead → Manager → Directeur adjoint → Directeur", niveauActuel: "Senior/Lead" };
  if (exp.includes("3 à 5")) return { maxNiveaux: 2, progression: "Intermédiaire → Senior → Lead/Expert", niveauActuel: "Intermédiaire" };
  if (exp.includes("1 à 2")) return { maxNiveaux: 2, progression: "Junior confirmé → Intermédiaire → Senior débutant", niveauActuel: "Junior" };
  return { maxNiveaux: 1, progression: "Assistant/Junior → Junior confirmé → (consolidation)", niveauActuel: "Junior/Assistant" };
}

function validateGPS(
  gpsData: {
    an1?: { titre: string; salaire: number; action: string };
    an2?: { titre: string; salaire: number; action: string };
    an3?: { titre: string; salaire: number; action: string };
    an4?: { titre: string; salaire: number; action: string };
    an5?: { titre: string; salaire: number; action: string };
  },
  salaireMin: number,
  experience: string,
  roleActuel: string,
  objectifDeclare: string
) {
  const niveauInfo = getNiveauGPS(experience, roleActuel);
  const maxNiveaux = niveauInfo.maxNiveaux;

  const s1 = Math.round(salaireMin * 1.036 / 1000) * 1000;
  const s2 = Math.round(s1 * 1.05 / 1000) * 1000;
  const s3 = Math.round(s2 * 1.06 / 1000) * 1000;
  const s4 = Math.round(s3 * 1.07 / 1000) * 1000;
  const s5 = Math.round(s4 * 1.08 / 1000) * 1000;

  const roleBase = roleActuel
    .replace(/^assistant\s*/i, "")
    .replace(/\s*junior$/i, "")
    .trim() || roleActuel;

  const getTitre = (an: number, titreGPT: string): string => {
    if (maxNiveaux === 1) {
      if (an <= 2) return roleBase + " confirmé";
      if (an <= 4) return roleBase + " senior";
      return roleBase + " expert";
    }
    if (maxNiveaux === 2) {
      if (an <= 2) return roleBase + " confirmé";
      if (an === 3) return roleBase + " senior";
      return titreGPT || roleBase + " expert";
    }
    return titreGPT || roleBase;
  };

  const validatedGPS = {
    an1: { titre: getTitre(1, gpsData.an1?.titre || ""), salaire: s1, action: gpsData.an1?.action || "Consolider les compétences" },
    an2: { titre: getTitre(2, gpsData.an2?.titre || ""), salaire: s2, action: gpsData.an2?.action || "Développer l'expertise" },
    an3: { titre: getTitre(3, gpsData.an3?.titre || ""), salaire: s3, action: gpsData.an3?.action || "Prendre plus de responsabilités" },
    an4: { titre: getTitre(4, gpsData.an4?.titre || ""), salaire: s4, action: gpsData.an4?.action || "Viser un niveau supérieur" },
    an5: { titre: getTitre(5, gpsData.an5?.titre || ""), salaire: s5, action: gpsData.an5?.action || "POTENTIEL MAX !" },
  };

  const obj = objectifDeclare?.toLowerCase() || "";
  const annee = new Date().getFullYear();
  const isVP = obj.includes("vp") || obj.includes("vice-président") || obj.includes("vice président");
  const isCEO = obj.includes("ceo") || obj.includes("pdg") || obj.includes("président général");
  const isDirecteur = obj.includes("directeur") || obj.includes("director");
  const isManager = obj.includes("manager") || obj.includes("gestionnaire") || obj.includes("chef") || obj.includes("responsable");
  const exp = experience?.toLowerCase() || "";

  let scenario = 1;
  let delai = "atteignable en 5 ans";
  let message = "Ton objectif de " + objectifDeclare + " est atteignable ! Ce GPS te montre le chemin.";

  if (exp.includes("moins") || exp.includes("aucune")) {
    if (isVP || isCEO) {
      scenario = 3; delai = "18-20 ans";
      message = "Ton objectif de " + objectifDeclare + " est excellent à long terme. Tu peux l'atteindre vers " + (annee + 18) + "-" + (annee + 20) + ". En 5 ans, concentre-toi sur " + roleBase + " expert.";
    } else if (isDirecteur) {
      scenario = 3; delai = "12-15 ans";
      message = "Ton objectif de " + objectifDeclare + " est réaliste à long terme — compte 12-15 ans. En 5 ans, vise " + roleBase + " expert.";
    } else if (isManager) {
      scenario = 2; delai = "6-8 ans";
      message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans. En 5 ans, vise " + roleBase + " senior.";
    }
  } else if (exp.includes("1 à 2")) {
    if (isVP || isCEO) {
      scenario = 3; delai = "15-18 ans";
      message = "Ton objectif de " + objectifDeclare + " est excellent — compte 15-18 ans. En 5 ans, vise " + roleBase + " senior.";
    } else if (isDirecteur) {
      scenario = 3; delai = "10-12 ans";
      message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans. En 5 ans, vise un poste senior.";
    } else if (isManager) {
      scenario = 2; delai = "5-7 ans";
      message = "Ton objectif de " + objectifDeclare + " est atteignable en 5-7 ans !";
    }
  } else if (exp.includes("3 à 5")) {
    if (isVP || isCEO) {
      scenario = 3; delai = "10-12 ans";
      message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans. En 5 ans, vise Manager.";
    } else if (isDirecteur) {
      scenario = 2; delai = "6-8 ans";
      message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans !";
    }
  } else if (exp.includes("6 à 10")) {
    if (isVP || isCEO) {
      scenario = 2; delai = "6-8 ans";
      message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans avec les bonnes certifications !";
    }
  }

  return { gps: validatedGPS, scenario, delai, message, salaireMax: s1 };
}

function parseExtractedData(json: Record<string, unknown>, candidatInfo: {
  salaire_min?: number;
  annee_experience?: string;
  role_actuel?: string;
  objectif_declare?: string;
}) {
  const parseGPSRaw = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return undefined;
    const g = obj as Record<string, unknown>;
    return { titre: String(g.titre || ""), salaire: Number(g.salaire || 0), action: String(g.action || "") };
  };

  const opportunites = Array.isArray(json.opportunites)
    ? json.opportunites.map((o: unknown) => {
        const op = o as Record<string, unknown>;
        return { titre: String(op.titre || ""), salaire: Number(op.salaire || 0), description: String(op.description || "") };
      }) : [];

  const formations = Array.isArray(json.formations)
    ? json.formations.map((f: unknown) => {
        const fm = f as Record<string, unknown>;
        return { nom: String(fm.nom || ""), type: String(fm.type || "Formation"), plateforme: String(fm.plateforme || ""), duree: String(fm.duree || "") };
      }) : [];

  const certifications = Array.isArray(json.certifications)
    ? json.certifications.map((c: unknown) => {
        const ct = c as Record<string, unknown>;
        return { nom: String(ct.nom || ""), organisme: String(ct.organisme || "") };
      }) : [];

  const salaireMin = candidatInfo.salaire_min || 45000;
  const objectifDeclare = String(json.objectif_final || candidatInfo.objectif_declare || "");

  const validated = validateGPS(
    { an1: parseGPSRaw(json.an1), an2: parseGPSRaw(json.an2), an3: parseGPSRaw(json.an3), an4: parseGPSRaw(json.an4), an5: parseGPSRaw(json.an5) },
    salaireMin,
    candidatInfo.annee_experience || "",
    candidatInfo.role_actuel || "",
    objectifDeclare
  );

  return {
    niveau_education: String(json.niveau || "JUNIOR"),
    force1: String(json.force1 || ""), force1_desc: String(json.force1_desc || ""),
    force2: String(json.force2 || ""), force2_desc: String(json.force2_desc || ""),
    force3: String(json.force3 || ""), force3_desc: String(json.force3_desc || ""),
    salaire_min: salaireMin,
    salaire_max: validated.salaireMax,
    role_actuel: String(json.role_actuel || candidatInfo.role_actuel || ""),
    ville: String(json.ville || "Montréal"),
    objectif_carriere: objectifDeclare,
    scenario_objectif: validated.scenario,
    message_objectif: validated.message,
    delai_objectif: validated.delai,
    analyse_comparative: String(json.analyse || ""),
    gps_an1: validated.gps.an1,
    gps_an2: validated.gps.an2,
    gps_an3: validated.gps.an3,
    gps_an4: validated.gps.an4,
    gps_an5: validated.gps.an5,
    opportunites,
    formations,
    certifications,
  };
}

function isRapportFinal(text: string): boolean {
  return (
    (text.includes("TES 3 COMPÉTENCES") || text.includes("COMPÉTENCES CLÉS")) &&
    (text.includes("GPS DE CARRIÈRE") || text.includes("An 1:") || text.includes("An 1 :")) &&
    text.includes("FORMATIONS")
  );
}

function buildConversationPrompt(candidatInfo?: {
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
  const niveauInfo = getNiveauGPS(
    candidatInfo?.annee_experience || "",
    candidatInfo?.role_actuel || ""
  );
  const isReconversion = candidatInfo?.statut_emploi?.includes("reconversion") || false;
  const niveauEffectif = isReconversion ? "Junior confirmé → Intermédiaire → Senior débutant" : niveauInfo.progression;
  const maxNiveauxEffectif = isReconversion ? 2 : niveauInfo.maxNiveaux;

  return `Tu es YELMA, conseiller de carrière expert et bienveillant.

PROFIL CONNU - NE JAMAIS REDEMANDER :
- Prénom: ${candidatInfo?.prenom || ""}
- Rôle actuel: ${candidatInfo?.role_actuel || candidatInfo?.domaine_actuel || ""}
- Expérience: ${candidatInfo?.annee_experience || ""}
- Diplôme: ${candidatInfo?.diplome || ""} en ${candidatInfo?.domaine_etudes || ""}
- Ville: ${candidatInfo?.ville || "Montréal"}
- Statut: ${candidatInfo?.statut_emploi || ""}
- Objectif déclaré: ${candidatInfo?.objectif_declare || "non fourni"}
- Fourchette salariale: ${candidatInfo?.salaire_min || 40000}$ — ${candidatInfo?.salaire_max || 60000}$
- Niveau actuel: ${niveauInfo.niveauActuel}
- Reconversion: ${isReconversion ? "OUI" : "NON"}

MISSION : Révéler 3 compétences opérationnelles TRANSFÉRABLES et GÉNÉRIQUES.

RÈGLES COMPÉTENCES :
- Format court et professionnel : "Analyse budgétaire", "Coordination des équipes", "Gestion des risques"
- NE PAS répéter les outils ou détails que le candidat a mentionnés
- Les compétences doivent être reconnues dans les offres d'emploi
- YELMA déduit et reformule — il ne répète pas

RÈGLES CONVERSATION :
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat dit
3. UNE seule question courte par échange (max 1 phrase)
4. Après 5 échanges : générer le rapport IMMÉDIATEMENT
5. JAMAIS de "je vais générer" — écrire le rapport directement
6. Si réponses trop courtes : poser une question de relance

PREMIER MESSAGE :
Saluer ${candidatInfo?.prenom || ""} par son prénom + mentionner son rôle ${candidatInfo?.role_actuel || ""} + poser UNE question directe sur une réalisation concrète récente. Maximum 2 phrases.

LOGIQUE GPS — PROGRESSION RÉALISTE :
Niveau actuel: ${niveauInfo.niveauActuel}
Progression autorisée: maximum ${maxNiveauxEffectif} niveau(x) en 5 ans
Trajectoire: ${niveauEffectif}
${isReconversion ? "RECONVERSION: traiter comme 1-2 ans exp dans la nouvelle carrière" : ""}

LOGIQUE OBJECTIF DÉCLARÉ :
${candidatInfo?.objectif_declare && candidatInfo.objectif_declare !== "non fourni"
  ? `Objectif: "${candidatInfo.objectif_declare}"
- Vérifier si atteignable en 5 ans selon la grille de progression
- Si OUI → GPS mène directement vers cet objectif
- Si NON → GPS réaliste sur 5 ans + message honnête avec année d'atteinte estimée`
  : "Pas d'objectif déclaré → YELMA propose un objectif réaliste selon la grille"
}

LOGIQUE OPPORTUNITÉS :
Pour ${candidatInfo?.role_actuel || "ce rôle"} avec ${candidatInfo?.annee_experience || "cette expérience"} :
- Proposer postes du même domaine si salaire dans partie haute de la fourchette
- Proposer postes niveau supérieur si années exp requises compatibles
- Proposer postes domaine différent si salaire plus élevé

LOGIQUE FORMATIONS :
1. Renforcement : formations pour approfondir les compétences révélées
2. Gap marché : compétences manquantes vs offres d'emploi pour ce rôle
3. Prochain poste : formations pour atteindre An 1-2 du GPS
4. Objectif long terme : certifications pour atteindre l'objectif final

RAPPORT FINAL après 5 échanges :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence générique transférable]**
[1 phrase expliquant la valeur marché]

2. **[Compétence générique transférable]**
[1 phrase]

3. **[Compétence générique transférable]**
[1 phrase]

OPPORTUNITÉS

1. **[Titre poste]** — [Salaire]$ CAD/an
[Description 5 mots max]

2. **[Titre poste]** — [Salaire]$ CAD/an
[Description 5 mots max]

3. **[Titre poste]** — [Salaire]$ CAD/an
[Description 5 mots max]

GPS DE CARRIÈRE — 5 ANS
(Maximum ${maxNiveauxEffectif} niveau(x) — progression réaliste)

An 1: [Titre poste] | [Salaire] | [Action courte]
An 2: [Titre poste] | [Salaire] | [Action courte]
An 3: [Titre poste] | [Salaire] | [Action courte]
An 4: [Titre poste] | [Salaire] | [Action courte]
An 5: [Titre poste] | [Salaire] | [Action courte]

OBJECTIF: [objectif déclaré ou proposé par YELMA]
SCENARIO: [1=réaliste 5ans / 2=6-8ans / 3=long terme 10+ans]
MESSAGE_OBJECTIF: [message honnête et motivant]
DELAI_OBJECTIF: [délai réaliste]

FORMATIONS

1. [Nom] | [Type: Renforcement/Gap marché/Prochain poste/Objectif long terme] | [Plateforme] | [Durée]
2. [Nom] | [Type] | [Plateforme] | [Durée]
3. [Nom] | [Type] | [Plateforme] | [Durée]
4. [Nom] | [Type] | [Plateforme] | [Durée]

CERTIFICATIONS

1. [Nom] | [Organisme]
2. [Nom] | [Organisme]

[1 phrase finale encourageante]`;
}

function buildExtractionPrompt(rapport: string, candidatInfo: {
  salaire_min?: number;
  salaire_max?: number;
  role_actuel?: string;
  ville?: string;
  annee_experience?: string;
  diplome?: string;
  objectif_declare?: string;
  statut_emploi?: string;
}) {
  const niveauInfo = getNiveauGPS(
    candidatInfo.annee_experience || "",
    candidatInfo.role_actuel || ""
  );

  return `Extrait les données de ce rapport YELMA et retourne UNIQUEMENT ce JSON valide sans backticks ni markdown:

${rapport}

JSON attendu:
{
  "niveau": "UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR",
  "force1": "competence generique courte ex: Analyse budgetaire",
  "force1_desc": "1 phrase valeur marche",
  "force2": "competence generique courte",
  "force2_desc": "1 phrase valeur marche",
  "force3": "competence generique courte",
  "force3_desc": "1 phrase valeur marche",
  "opportunites": [
    {"titre": "vrai titre poste", "salaire": 52000, "description": "5 mots max"},
    {"titre": "vrai titre poste", "salaire": 56000, "description": "5 mots max"},
    {"titre": "vrai titre poste", "salaire": 60000, "description": "5 mots max"}
  ],
  "salaire_min": ${candidatInfo.salaire_min || 40000},
  "salaire_max": ${candidatInfo.salaire_max || 60000},
  "role_actuel": "${candidatInfo.role_actuel || ""}",
  "ville": "${candidatInfo.ville || "Montreal"}",
  "objectif_final": "objectif declare ou propose par YELMA en toutes lettres",
  "scenario_objectif": 1,
  "message_objectif": "message honnete et motivant",
  "delai_objectif": "ex: atteignable en 5 ans",
  "an1": {"titre": "vrai titre de poste", "salaire": 58000, "action": "action courte"},
  "an2": {"titre": "vrai titre de poste", "salaire": 64000, "action": "action courte"},
  "an3": {"titre": "vrai titre de poste", "salaire": 70000, "action": "action courte"},
  "an4": {"titre": "vrai titre de poste", "salaire": 76000, "action": "action courte"},
  "an5": {"titre": "vrai titre de poste", "salaire": 83000, "action": "action courte"},
  "analyse": "1 phrase honnnete sur l objectif",
  "formations": [
    {"nom": "nom formation", "type": "Renforcement", "plateforme": "nom plateforme", "duree": "duree"},
    {"nom": "nom formation", "type": "Gap marche", "plateforme": "nom plateforme", "duree": "duree"},
    {"nom": "nom formation", "type": "Prochain poste", "plateforme": "nom plateforme", "duree": "duree"},
    {"nom": "nom formation", "type": "Objectif long terme", "plateforme": "nom plateforme", "duree": "duree"}
  ],
  "certifications": [
    {"nom": "nom cert", "organisme": "organisme"},
    {"nom": "nom cert", "organisme": "organisme"}
  ]
}

REGLES:
- Niveau GPS maximum ${niveauInfo.maxNiveaux} niveaux depuis ${niveauInfo.niveauActuel}
- Sigles: VP=Vice-President, CEO=Directeur general, CFO=Directeur financier, COO=Directeur operations
- objectif_final en toutes lettres jamais de sigle
- formations: exactement 4 avec les 4 types differents
- certifications: exactement 2`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, lang, email, nom, prenom, candidatInfo } = body;

    const conversationPrompt = buildConversationPrompt(candidatInfo);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: conversationPrompt }, ...history],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");

    const reply = data.choices[0].message.content;
    console.log("EMAIL:", email);
    console.log("IS RAPPORT FINAL:", isRapportFinal(reply));

    if (isRapportFinal(reply) && email) {
      console.log("EXTRACTING DATA...");
      try {
        const extractionPrompt = buildExtractionPrompt(reply, candidatInfo || {});

        const extractResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        });

        const extractData = await extractResponse.json();
        const extractText = extractData.choices?.[0]?.message?.content || "";
        const jsonMatch = extractText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const rapportData = parseExtractedData(parsed, candidatInfo || {});

          console.log("SAVING TO SUPABASE...");
          const { error } = await supabaseAdmin
            .from("candidats")
            .upsert({
              email, nom, prenom,
              langue: lang || "fr",
              trial_start: new Date().toISOString(),
              trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              plan_choisi: "decouverte",
              domaine_actuel: candidatInfo?.domaine_actuel,
              diplome_max: candidatInfo?.diplome,
              duree_experience: candidatInfo?.annee_experience,
              statut_emploi: candidatInfo?.statut_emploi,
              objectif_declare: candidatInfo?.objectif_declare,
              ...rapportData,
              nb_entretiens: 1,
              dernier_entretien: new Date().toISOString(),
            }, { onConflict: "email" });

          if (error) console.error("SUPABASE ERROR:", error);
          else console.log("SAVED SUCCESSFULLY!");

          return NextResponse.json({ reply, rapportData });
        }
      } catch (extractError) {
        console.error("Extraction error:", extractError);
      }
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { reply: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
