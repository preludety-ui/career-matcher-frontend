import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================
// DÉTECTION DU CAS PROFIL (1-9)
// ============================================
function detecterCas(candidatInfo: {
  annee_experience?: string;
  annee_autre_experience?: string;
  diplome?: string;
  objectif_declare?: string;
  statut_emploi?: string;
  role_actuel?: string;
}): number {
  const exp = candidatInfo.annee_experience?.toLowerCase() || "";
  const autreExp = candidatInfo.annee_autre_experience?.toLowerCase() || "";
  const diplome = candidatInfo.diplome?.toLowerCase() || "";
  const objectif = candidatInfo.objectif_declare?.trim() || "";
  const statut = candidatInfo.statut_emploi?.toLowerCase() || "";

  const sansExp = exp.includes("aucune") || exp === "";
  const avecAutreExp = !autreExp.includes("aucune") && autreExp !== "";
  const sansDiplome = diplome.includes("autodidacte") || diplome.includes("sans diplôme");
  const avecObjectif = objectif.length > 0;
  const isReconversion = statut.includes("reconversion");
  const isSenior = exp.includes("plus de 10");
  const isInter = exp.includes("3 à 5");
  const isJunior = exp.includes("moins") || exp.includes("1 à 2");

  if (isSenior) return 9;
  if (isReconversion) return 8;
  if (isInter) return 7;
  if (isJunior && avecObjectif) return 6;
  if (isJunior && !avecObjectif) return 5;
  if (sansExp && avecObjectif) return 4;
  if (sansExp && avecAutreExp) return 3;
  if (sansExp && !sansDiplome) return 2;
  return 1;
}

// ============================================
// GRILLE GPS RÉALISTE
// ============================================
function getNiveauGPS(experience: string, roleActuel: string): {
  maxNiveaux: number;
  an1: string;
  an2: string;
  an3: string;
  an4: string;
  an5: string;
  niveauActuel: string;
} {
  const exp = experience?.toLowerCase() || "";
  const role = roleActuel?.toLowerCase() || "";
  const isManager = role.includes("manager") || role.includes("directeur") || role.includes("chef") || role.includes("responsable") || role.includes("vp");

  if (exp.includes("plus de 10")) {
    if (isManager) return {
      maxNiveaux: 4,
      an1: "Stabilisation + positionnement stratégique",
      an2: "Manager confirmé",
      an3: "Manager confirmé",
      an4: "Senior Manager",
      an5: "Directeur",
      niveauActuel: "Manager+"
    };
    return {
      maxNiveaux: 2,
      an1: "Stabilisation poste actuel",
      an2: "Senior confirmé",
      an3: "Lead / Expert",
      an4: "Lead confirmé",
      an5: "Manager possible",
      niveauActuel: "Senior"
    };
  }
  if (exp.includes("6 à 10")) return {
    maxNiveaux: 2,
    an1: "Stabilisation poste actuel",
    an2: "Senior confirmé",
    an3: "Senior confirmé",
    an4: "Lead / Expert",
    an5: "Manager début possible",
    niveauActuel: "Senior/Lead"
  };
  if (exp.includes("3 à 5")) return {
    maxNiveaux: 1,
    an1: "Stabilisation poste actuel",
    an2: "Intermédiaire confirmé",
    an3: "Intermédiaire confirmé",
    an4: "Senior début",
    an5: "Senior",
    niveauActuel: "Intermédiaire"
  };
  if (exp.includes("1 à 2")) return {
    maxNiveaux: 1,
    an1: "Junior confirmé",
    an2: "Stabilisation",
    an3: "Intermédiaire début",
    an4: "Intermédiaire",
    an5: "Intermédiaire confirmé",
    niveauActuel: "Junior"
  };
  // Moins 1 an
  return {
    maxNiveaux: 1,
    an1: "Stabilisation poste actuel",
    an2: "Junior confirmé",
    an3: "Junior confirmé",
    an4: "Intermédiaire début",
    an5: "Intermédiaire",
    niveauActuel: "Junior/Assistant"
  };
}

// ============================================
// VALIDATION GPS CÔTÉ CODE
// ============================================
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
  objectifDeclare: string,
  isReconversion: boolean
) {
  const niveauInfo = getNiveauGPS(experience, roleActuel);
  const maxNiveaux = niveauInfo.maxNiveaux;

  // Salaire An1 = salaire actuel × 1.036 (sauf reconversion × 0.85)
  const facteurAn1 = isReconversion ? 0.85 : 1.036;
  const s1 = Math.round(salaireMin * facteurAn1 / 1000) * 1000;
  const s2 = Math.round(s1 * 1.05 / 1000) * 1000;
  const s3 = Math.round(s2 * 1.06 / 1000) * 1000;
  const s4 = Math.round(s3 * 1.07 / 1000) * 1000;
  const s5 = Math.round(s4 * 1.08 / 1000) * 1000;

  const roleBase = roleActuel
    .replace(/^assistant\s*/i, "")
    .replace(/\s*junior$/i, "")
    .trim() || roleActuel;

  const getTitre = (an: number, titreGPT: string): string => {
    if (maxNiveaux <= 1) {
      if (an === 1) return roleBase + " confirmé";
      if (an === 2) return roleBase + " confirmé";
      if (an === 3) return roleBase + " senior";
      if (an === 4) return roleBase + " senior";
      return roleBase + " expert";
    }
    if (maxNiveaux === 2) {
      if (an === 1) return roleBase + " confirmé";
      if (an === 2) return roleBase + " senior";
      if (an === 3) return roleBase + " senior";
      return titreGPT || roleBase + " expert";
    }
    return titreGPT || roleBase;
  };

  // An5 différent de An4
  const titreAn4 = getTitre(4, gpsData.an4?.titre || "");
  const titreAn5Raw = getTitre(5, gpsData.an5?.titre || "");
  const titreAn5 = titreAn5Raw === titreAn4 ? titreAn4 + " senior" : titreAn5Raw;

  const validatedGPS = {
    an1: { titre: getTitre(1, gpsData.an1?.titre || ""), salaire: s1, action: gpsData.an1?.action || "Consolider les compétences" },
    an2: { titre: getTitre(2, gpsData.an2?.titre || ""), salaire: s2, action: gpsData.an2?.action || "Développer l'expertise" },
    an3: { titre: getTitre(3, gpsData.an3?.titre || ""), salaire: s3, action: gpsData.an3?.action || "Prendre plus de responsabilités" },
    an4: { titre: titreAn4, salaire: s4, action: gpsData.an4?.action || "Viser un niveau supérieur" },
    an5: { titre: titreAn5, salaire: s5, action: gpsData.an5?.action || "POTENTIEL MAX !" },
  };

  // Scénario objectif
  const obj = objectifDeclare?.toLowerCase() || "";
  const annee = new Date().getFullYear();
  const isVP = obj.includes("vp") || obj.includes("vice-président") || obj.includes("vice président");
  const isCEO = obj.includes("ceo") || obj.includes("pdg") || obj.includes("président général");
  const isDirecteur = obj.includes("directeur") || obj.includes("director");
  const isManagerObj = obj.includes("manager") || obj.includes("gestionnaire") || obj.includes("chef") || obj.includes("responsable");
  const exp = experience?.toLowerCase() || "";

  let scenario = 1;
  let delai = "atteignable en 5 ans";
  let message = "Ton objectif de " + objectifDeclare + " est atteignable ! Ce GPS te montre le chemin.";

  if (!objectifDeclare) {
    scenario = 1;
    delai = "5 ans";
    message = "YELMA t'a défini un objectif réaliste selon ton profil et tes compétences révélées.";
  } else if (exp.includes("moins") || exp.includes("aucune")) {
    if (isVP || isCEO) { scenario = 3; delai = "18-20 ans"; message = "Ton objectif de " + objectifDeclare + " est excellent à long terme. Tu peux l'atteindre vers " + (annee + 18) + "-" + (annee + 20) + ". En 5 ans, concentre-toi sur " + roleBase + " expert."; }
    else if (isDirecteur) { scenario = 3; delai = "12-15 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste à long terme — compte 12-15 ans. En 5 ans, vise " + roleBase + " expert."; }
    else if (isManagerObj) { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans. En 5 ans, vise " + roleBase + " senior."; }
  } else if (exp.includes("1 à 2")) {
    if (isVP || isCEO) { scenario = 3; delai = "15-18 ans"; message = "Ton objectif de " + objectifDeclare + " est excellent — compte 15-18 ans. En 5 ans, vise " + roleBase + " senior."; }
    else if (isDirecteur) { scenario = 3; delai = "10-12 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans. En 5 ans, vise un poste senior."; }
    else if (isManagerObj) { scenario = 2; delai = "5-7 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 5-7 ans !"; }
  } else if (exp.includes("3 à 5")) {
    if (isVP || isCEO) { scenario = 3; delai = "10-12 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans. En 5 ans, vise Senior."; }
    else if (isDirecteur) { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans !"; }
  } else if (exp.includes("6 à 10")) {
    if (isVP || isCEO) { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans avec les bonnes certifications !"; }
  }

  return { gps: validatedGPS, scenario, delai, message, salaireMax: s1 };
}

// ============================================
// PROMPT CONVERSATION — 9 CAS
// ============================================
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
  const cas = detecterCas(candidatInfo || {});
  const niveauInfo = getNiveauGPS(
    candidatInfo?.annee_experience || "",
    candidatInfo?.role_actuel || ""
  );
  const isReconversion = candidatInfo?.statut_emploi?.toLowerCase().includes("reconversion") || false;

  // Questions par objectif selon le cas
  const objectifsQuestions: Record<number, string[]> = {
    1: [
      "OBJECTIF : Découvrir les intérêts et passions — demande ce qui l'attire dans la vie professionnelle sans jamais mentionner de métier précis",
      "OBJECTIF : Identifier l'environnement de travail préféré — terrain, bureau, créatif, technique",
      "OBJECTIF : Détecter les activités naturelles — ce qui vient sans effort",
      "OBJECTIF : Identifier les soft skills — comment il aide les autres",
      "OBJECTIF : Détecter les préférences de domaine — ce que les gens autour de lui disent qu'il fait bien",
    ],
    2: [
      "OBJECTIF : Comprendre le choix d'études — pourquoi ce diplôme",
      "OBJECTIF : Identifier ce qu'il a préféré dans ses études",
      "OBJECTIF : Détecter un projet académique marquant",
      "OBJECTIF : Identifier le type de travail qui l'attire dans son domaine",
      "OBJECTIF : Explorer si un autre domaine l'attire aussi",
    ],
    3: [
      "OBJECTIF : Analyser l'expérience de stage ou bénévolat la plus marquante",
      "OBJECTIF : Identifier la tâche qu'il faisait le mieux",
      "OBJECTIF : Ce qu'il a appris sur lui-même",
      "OBJECTIF : L'environnement où il s'est senti le plus à l'aise",
      "OBJECTIF : Ce qu'il aurait voulu faire de plus dans cette expérience",
    ],
    4: [
      "OBJECTIF : Valider la motivation derrière l'objectif déclaré",
      "OBJECTIF : Identifier ce qu'il a déjà fait qui se rapproche de cet objectif",
      "OBJECTIF : Compétences qu'il pense avoir pour atteindre l'objectif",
      "OBJECTIF : Ce qui lui manque selon lui pour y arriver",
      "OBJECTIF : Son niveau de connaissance du domaine cible",
    ],
    5: [
      "OBJECTIF : Identifier une réalisation concrète récente dans son rôle actuel",
      "OBJECTIF : Ce qu'il aime le plus dans son travail actuel",
      "OBJECTIF : Ce qu'il aime le moins — frustrations actuelles",
      "OBJECTIF : Domaine où il se sent le plus compétent",
      "OBJECTIF : Comment il voudrait faire évoluer son rôle",
    ],
    6: [
      "OBJECTIF : Identifier une réalisation concrète récente",
      "OBJECTIF : Lien entre rôle actuel et objectif déclaré",
      "OBJECTIF : Ce qui lui manque encore pour atteindre l'objectif",
      "OBJECTIF : Compétence développée récemment",
      "OBJECTIF : Motivation derrière l'objectif déclaré",
    ],
    7: [
      "OBJECTIF : Identifier la réalisation la plus significative",
      "OBJECTIF : Frustrations actuelles dans le poste",
      "OBJECTIF : Responsabilités supplémentaires souhaitées",
      "OBJECTIF : Vision dans 5 ans",
      "OBJECTIF : Compétence prioritaire à développer",
    ],
    8: [
      "OBJECTIF : Comprendre la raison du changement de domaine",
      "OBJECTIF : Réalisation dont il est fier dans son domaine actuel",
      "OBJECTIF : Compétences transférables identifiées",
      "OBJECTIF : Niveau de connaissance du nouveau domaine",
      "OBJECTIF : Plus grande crainte dans cette reconversion",
    ],
    9: [
      "OBJECTIF : Identifier la réalisation professionnelle la plus marquante",
      "OBJECTIF : Expertise la plus rare et précieuse sur le marché",
      "OBJECTIF : Aspiration — management, conseil ou liberté",
      "OBJECTIF : Ce qu'il ne veut plus faire dans sa carrière",
      "OBJECTIF : Vision dans 5 ans — même domaine ou évolution",
    ],
  };

  const questions = objectifsQuestions[cas] || objectifsQuestions[7];

  const gpsDescription = isReconversion
    ? `An 1: Poste passerelle (salaire × 0.85 — baisse temporaire honnête à mentionner)
An 2: Junior nouveau domaine (retour au salaire actuel)
An 3: Junior confirmé nouveau domaine
An 4: Intermédiaire nouveau domaine
An 5: Intermédiaire confirmé nouveau domaine`
    : `An 1: ${niveauInfo.an1}
An 2: ${niveauInfo.an2}
An 3: ${niveauInfo.an3}
An 4: ${niveauInfo.an4}
An 5: ${niveauInfo.an5}`;

  return `Tu es YELMA, conseiller de carrière expert et bienveillant.

PROFIL CONNU - NE JAMAIS REDEMANDER :
- Prénom: ${candidatInfo?.prenom || ""}
- Rôle actuel: ${candidatInfo?.role_actuel || candidatInfo?.domaine_actuel || "non fourni"}
- Expérience: ${candidatInfo?.annee_experience || "non fournie"}
- Autres expériences: ${candidatInfo?.annee_autre_experience || "aucune"}
- Diplôme: ${candidatInfo?.diplome || "non fourni"} en ${candidatInfo?.domaine_etudes || "non fourni"}
- Ville: ${candidatInfo?.ville || "Montréal"}
- Statut: ${candidatInfo?.statut_emploi || "non fourni"}
- Objectif déclaré: ${candidatInfo?.objectif_declare || "non fourni"}
- Fourchette salariale: ${candidatInfo?.salaire_min || 40000}$ — ${candidatInfo?.salaire_max || 60000}$
- CAS PROFIL DÉTECTÉ: ${cas}
- Niveau actuel: ${niveauInfo.niveauActuel}
- Reconversion: ${isReconversion ? "OUI" : "NON"}

MISSION : Révéler 3 compétences GÉNÉRIQUES et TRANSFÉRABLES + 2 axes de développement.

RÈGLES COMPÉTENCES :
- Format court : "Analyse budgétaire", "Coordination des équipes", "Gestion des risques"
- YELMA déduit et reformule — il ne répète JAMAIS ce que le candidat dit
- Les compétences doivent être reconnues dans les offres d'emploi

RÈGLES AXES DE DÉVELOPPEMENT :
- Détecter 2 compétences que le candidat N'A PAS mentionnées
- Mais que le marché demande fréquemment pour ce rôle
- Formuler positivement : "Axe de développement" jamais "faiblesse"
- Format: "Compétence — explication courte pourquoi c'est important"

RÈGLES CONVERSATION :
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat dit
3. UNE seule question par échange — formulée DIFFÉREMMENT à chaque conversation
4. Après 5 échanges : générer le rapport IMMÉDIATEMENT sans annonce
5. Questions variées — même objectif, formulation toujours différente
6. Si réponse trop courte : relancer avec une question de précision

OBJECTIFS DES 5 QUESTIONS (formuler librement — ne jamais copier mot pour mot) :
${questions.map((q, i) => `Question ${i + 1} — ${q}`).join("\n")}

PREMIER MESSAGE :
${cas <= 4
  ? "Saluer " + (candidatInfo?.prenom || "") + " et poser directement la première question selon l'objectif ci-dessus. Maximum 2 phrases."
  : "Saluer " + (candidatInfo?.prenom || "") + " en mentionnant son rôle de " + (candidatInfo?.role_actuel || "") + " et poser directement la première question. Maximum 2 phrases."
}

GPS RÉALISTE — CAS ${cas} :
${gpsDescription}
${isReconversion ? "IMPORTANT reconversion: mentionner honnêtement la baisse temporaire de salaire An 1 (-15%) et l'accélération grâce aux compétences transférables" : ""}

LOGIQUE OPPORTUNITÉS — CAS ${cas} :
${cas <= 4 ? "Proposer jobs accessibles sans expérience ou avec peu d'expérience — salaire entrée de gamme" : ""}
${cas === 5 || cas === 6 ? "Proposer postes similaires mieux rémunérés OU postes légèrement supérieurs si exp compatible" : ""}
${cas === 7 ? "Proposer postes intermédiaires supérieurs OU senior débutant" : ""}
${cas === 8 ? "Proposer postes PASSERELLES entre ancien et nouveau domaine" : ""}
${cas === 9 ? "Proposer postes stratégiques, conseil, direction, freelance" : ""}

LOGIQUE FORMATIONS — 4 types obligatoires :
1. Renforcement : approfondir une compétence révélée
2. Gap marché : combler un axe de développement détecté
3. Prochain poste : préparer An 1-2 du GPS
4. Objectif long terme : certification pour objectif final

RAPPORT FINAL après 5 échanges — écrire DIRECTEMENT sans introduction :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence générique]**
[1 phrase valeur marché]

2. **[Compétence générique]**
[1 phrase valeur marché]

3. **[Compétence générique]**
[1 phrase valeur marché]

TES 2 AXES DE DÉVELOPPEMENT

🔹 [Compétence manquante 1] — [explication courte pourquoi important]
🔹 [Compétence manquante 2] — [explication courte pourquoi important]

OPPORTUNITÉS

1. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

2. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

3. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

GPS DE CARRIÈRE — 5 ANS

An 1: [Titre] | [Salaire] | [Action courte]
An 2: [Titre] | [Salaire] | [Action courte]
An 3: [Titre] | [Salaire] | [Action courte]
An 4: [Titre] | [Salaire] | [Action courte]
An 5: [Titre] | [Salaire] | [Action courte]

OBJECTIF: [objectif déclaré ou proposé par YELMA]
SCENARIO: [1/2/3]
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

// ============================================
// PROMPT EXTRACTION JSON
// ============================================
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
  "force1": "competence generique courte",
  "force1_desc": "1 phrase valeur marche",
  "force2": "competence generique courte",
  "force2_desc": "1 phrase valeur marche",
  "force3": "competence generique courte",
  "force3_desc": "1 phrase valeur marche",
  "axe1": "competence manquante 1",
  "axe1_desc": "explication courte pourquoi important",
  "axe2": "competence manquante 2",
  "axe2_desc": "explication courte pourquoi important",
  "opportunites": [
    {"titre": "vrai titre poste", "salaire": 52000, "description": "5 mots max"},
    {"titre": "vrai titre poste", "salaire": 56000, "description": "5 mots max"},
    {"titre": "vrai titre poste", "salaire": 60000, "description": "5 mots max"}
  ],
  "salaire_min": ${candidatInfo.salaire_min || 40000},
  "salaire_max": ${candidatInfo.salaire_max || 60000},
  "role_actuel": "${candidatInfo.role_actuel || ""}",
  "ville": "${candidatInfo.ville || "Montreal"}",
  "objectif_final": "objectif en toutes lettres",
  "scenario_objectif": 1,
  "message_objectif": "message honnete et motivant",
  "delai_objectif": "ex: atteignable en 5 ans",
  "an1": {"titre": "vrai titre", "salaire": 58000, "action": "action courte"},
  "an2": {"titre": "vrai titre", "salaire": 64000, "action": "action courte"},
  "an3": {"titre": "vrai titre", "salaire": 70000, "action": "action courte"},
  "an4": {"titre": "vrai titre", "salaire": 76000, "action": "action courte"},
  "an5": {"titre": "vrai titre", "salaire": 83000, "action": "action courte"},
  "analyse": "1 phrase honnnete sur objectif",
  "formations": [
    {"nom": "nom", "type": "Renforcement", "plateforme": "plateforme", "duree": "duree"},
    {"nom": "nom", "type": "Gap marche", "plateforme": "plateforme", "duree": "duree"},
    {"nom": "nom", "type": "Prochain poste", "plateforme": "plateforme", "duree": "duree"},
    {"nom": "nom", "type": "Objectif long terme", "plateforme": "plateforme", "duree": "duree"}
  ],
  "certifications": [
    {"nom": "nom", "organisme": "organisme"},
    {"nom": "nom", "organisme": "organisme"}
  ]
}

REGLES:
- Niveau GPS maximum ${niveauInfo.maxNiveaux} niveaux depuis ${niveauInfo.niveauActuel}
- Sigles: VP=Vice-President, CEO=Directeur general, CFO=Directeur financier
- objectif_final en toutes lettres
- formations: exactement 4 avec les 4 types
- certifications: exactement 2
- axe1 et axe2: competences NON mentionnees par le candidat mais demandees par le marche`;
}

// ============================================
// PARSE DONNÉES EXTRAITES
// ============================================
function parseExtractedData(json: Record<string, unknown>, candidatInfo: {
  salaire_min?: number;
  annee_experience?: string;
  role_actuel?: string;
  objectif_declare?: string;
  statut_emploi?: string;
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
  const isReconversion = candidatInfo.statut_emploi?.toLowerCase().includes("reconversion") || false;

  const validated = validateGPS(
    { an1: parseGPSRaw(json.an1), an2: parseGPSRaw(json.an2), an3: parseGPSRaw(json.an3), an4: parseGPSRaw(json.an4), an5: parseGPSRaw(json.an5) },
    salaireMin,
    candidatInfo.annee_experience || "",
    candidatInfo.role_actuel || "",
    objectifDeclare,
    isReconversion
  );

  return {
    niveau_education: String(json.niveau || "JUNIOR"),
    force1: String(json.force1 || ""), force1_desc: String(json.force1_desc || ""),
    force2: String(json.force2 || ""), force2_desc: String(json.force2_desc || ""),
    force3: String(json.force3 || ""), force3_desc: String(json.force3_desc || ""),
    axe1: String(json.axe1 || ""), axe1_desc: String(json.axe1_desc || ""),
    axe2: String(json.axe2 || ""), axe2_desc: String(json.axe2_desc || ""),
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

// ============================================
// DÉTECTION RAPPORT FINAL
// ============================================
function isRapportFinal(text: string): boolean {
  return (
    (text.includes("TES 3 COMPÉTENCES") || text.includes("COMPÉTENCES CLÉS")) &&
    (text.includes("GPS DE CARRIÈRE") || text.includes("An 1:")) &&
    text.includes("FORMATIONS")
  );
}

// ============================================
// API ROUTE
// ============================================
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
