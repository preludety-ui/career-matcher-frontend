import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normaliserSignaux } from "@/lib/extracteur";
import { scoreMetiers } from "@/lib/matching";
import { construireGPS } from "@/lib/gps";

// ============================================
// DÉTECTION PROFIL 1-10
// ============================================
function detecterProfil(candidatInfo: {
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
  const statut = candidatInfo.statut_emploi?.toLowerCase() || "";

  const sansExp = exp.includes("aucune") || exp === "";
  const avecAutreExp = !autreExp.includes("aucune") && autreExp !== "";
  const sansDiplome = diplome.includes("autodidacte") || diplome.includes("sans diplôme");
  const isEtudiant = statut.includes("étudiant");
  const isReconversion = statut.includes("reconversion");

  if (sansDiplome) return 1;
  if (isEtudiant && !avecAutreExp) return 2;
  if (isEtudiant && avecAutreExp) return 3;
  if (sansExp && !avecAutreExp) return 4;
  if (sansExp && avecAutreExp) return 5;
  if (exp.includes("moins") || exp.includes("1 à 2")) return 6;
  if (exp.includes("3 à 5")) return 7;
  if (exp.includes("6 à 10")) return 8;
  if (exp.includes("plus de 10")) return 9;
  if (isReconversion) return 10;
  return 6;
}

// ============================================
// GRILLE GPS RÉALISTE
// ============================================
function getNiveauGPS(experience: string, roleActuel: string) {
  const exp = experience?.toLowerCase() || "";
  const role = roleActuel?.toLowerCase() || "";
  const isManager = role.includes("manager") || role.includes("directeur") || role.includes("chef") || role.includes("responsable") || role.includes("vp");

  if (exp.includes("plus de 10")) {
    if (isManager) return { maxNiveaux: 4, niveauActuel: "Manager+" };
    return { maxNiveaux: 2, niveauActuel: "Senior" };
  }
  if (exp.includes("6 à 10")) return { maxNiveaux: 2, niveauActuel: "Senior/Lead" };
  if (exp.includes("3 à 5")) return { maxNiveaux: 1, niveauActuel: "Intermédiaire" };
  if (exp.includes("1 à 2")) return { maxNiveaux: 1, niveauActuel: "Junior" };
  return { maxNiveaux: 1, niveauActuel: "Junior/Assistant" };
}

// ============================================
// CLASSIFICATION DYNAMIQUE DE LA RÉPONSE
// ============================================
function classifierReponse(reponse: string): {
  type: "vague" | "structuree" | "evitement" | "riche";
  actions: string[];
  niveau_detail: number;
  structure_logique: number;
  ton: string;
  score: number;
} {
  const r = reponse.toLowerCase().trim();
  const mots = r.split(" ").length;

  const signauxEvitement = ["je ne sais pas", "ça dépend", "c'est difficile", "je suppose", "peut-être", "honnêtement je ne sais"];
  const isEvitement = signauxEvitement.some(s => r.includes(s)) && mots < 30;
  const isVague = mots < 25 && !isEvitement;
  const isRiche = mots > 80 && (r.includes("parce que") || r.includes("résultat") || r.includes("%") || r.includes("$") || r.split("j'ai").length > 3);

  const verbesAction = ["géré", "créé", "développé", "livré", "organisé", "coordonné", "analysé", "présenté", "négocié", "formé", "supervisé", "planifié", "construit", "automatisé", "optimisé", "résolu", "piloté", "dirigé", "conçu", "implémenté", "déployé"];
  const actions = verbesAction.filter(v => r.includes(v));

  let ton = "hesitant";
  if (r.includes("j'ai") && actions.length >= 2) ton = "assertif";
  if (r.includes("toujours") || r.includes("naturellement") || r.includes("automatiquement")) ton = "proactif";
  if (isEvitement) ton = "hesitant";
  if (mots < 15) ton = "vague";

  const niveau_detail = isEvitement ? 1 : isVague ? 2 : isRiche ? 5 : Math.min(4, Math.floor(mots / 20) + 1);
  const structure_logique = actions.length >= 3 ? 5 : actions.length >= 2 ? 4 : actions.length >= 1 ? 3 : isEvitement ? 1 : 2;
  const score = isEvitement ? 0.8 : isVague ? 1.5 : isRiche ? 4.5 + Math.min(actions.length * 0.1, 0.5) : 2.5 + actions.length * 0.3;

  const type = isEvitement ? "evitement" : isVague ? "vague" : isRiche ? "riche" : "structuree";

  return { type, actions, niveau_detail, structure_logique, ton, score: Math.min(score, 5) };
}

// ============================================
// DÉCISION MODE QUESTION
// ============================================
function deciderModeQuestion(
  historiqueAnalyse: { type: string; score: number }[],
  dernierType: string
): "creuser" | "complexifier" | "contourner" {
  if (dernierType === "evitement") return "contourner";
  if (dernierType === "riche" || dernierType === "structuree") return "complexifier";
  return "creuser";
}

// ============================================
// BANQUES DE QUESTIONS PAR PROFIL
// ============================================
const BANQUES_QUESTIONS: Record<number, Record<string, string[]>> = {
  1: {
    decouverte: [
      "Qu'est-ce que tu as appris seul qui t'a vraiment rendu fier ?",
      "Raconte-moi un problème concret que tu as résolu sans aide extérieure.",
      "Qu'est-ce que les gens autour de toi te demandent souvent de faire ?",
      "Quelle est la chose la plus utile que tu aies créée ou construite ?",
      "Si tu avais une journée entière sans contrainte, sur quoi travaillerais-tu ?",
      "Quelle compétence as-tu développée par curiosité personnelle ?",
      "Quel projet personnel t'a demandé le plus d'efforts et pourquoi tu ne t'es pas arrêté ?",
      "Comment tu apprends quelque chose de nouveau quand tu n'as personne pour t'aider ?",
      "Qu'est-ce que tu as accompli que les gens de ton entourage n'auraient pas su faire ?",
      "Raconte-moi une fois où tu as transformé une idée en quelque chose de concret.",
    ],
    creuser: [
      "Tu peux me donner un exemple concret de ça ?",
      "Qu'est-ce que tu as fait exactement dans cette situation ?",
      "Quel était le résultat final ?",
      "Combien de temps ça t'a pris et comment tu t'y es pris ?",
      "Qu'est-ce qui t'a poussé à continuer quand c'était difficile ?",
    ],
    complexifier: [
      "Et si ça n'avait pas fonctionné, tu aurais fait quoi différemment ?",
      "Comment tu as géré les obstacles que tu as rencontrés ?",
      "Qu'est-ce que cette expérience t'a appris sur toi-même ?",
      "Comment tu t'es amélioré depuis cette première fois ?",
      "Quel impact ça a eu sur les gens autour de toi ?",
    ],
    contourner: [
      "Pense à la dernière fois que quelqu'un t'a dit merci pour ton aide — c'était pour quoi ?",
      "Dans ta vie quotidienne, qu'est-ce qui te vient naturellement sans effort ?",
      "Décris une journée où tu t'es senti vraiment utile.",
      "Qu'est-ce que tu ferais si on te donnait un budget de 1000$ pour résoudre un problème dans ta communauté ?",
    ],
  },
  2: {
    decouverte: [
      "Quel cours t'a le plus passionné et pourquoi exactement ?",
      "Décris un projet scolaire dont tu es vraiment fier.",
      "Dans les travaux d'équipe, quel rôle tu prends naturellement ?",
      "Qu'est-ce que tu fais en dehors des cours qui te ressemble vraiment ?",
      "Si tu pouvais travailler sur n'importe quel type de projet, ce serait quoi ?",
      "Qu'est-ce que tes professeurs disent généralement de toi ?",
      "Quel défi académique as-tu surmonté qui t'a surpris toi-même ?",
      "Comment tu aides tes collègues de classe quand ils ont du mal ?",
      "Qu'est-ce que tu apprends le plus rapidement dans tes études ?",
      "Si tu avais à choisir une spécialisation demain, ce serait laquelle et pourquoi ?",
    ],
    creuser: [
      "Concrètement, qu'est-ce que tu as fait dans ce projet ?",
      "Quel a été ton rôle exact dans l'équipe ?",
      "Qu'est-ce qui a bien marché et qu'est-ce qui t'a posé problème ?",
      "Qu'est-ce que le professeur a dit de ton travail ?",
    ],
    complexifier: [
      "Comment tu aurais fait différemment si tu recommençais ?",
      "Qu'est-ce que ce projet t'a appris que tes cours ne t'ont pas appris ?",
      "Comment tu as géré les désaccords avec tes coéquipiers ?",
      "Comment tu t'assures que ta contribution est vraiment utile à l'équipe ?",
    ],
    contourner: [
      "À quoi tu passes ton temps libre quand personne ne te regarde ?",
      "Si tu avais à expliquer ton domaine à un enfant de 10 ans, tu dirais quoi ?",
      "Qu'est-ce que tu fais naturellement que tes camarades trouvent difficile ?",
    ],
  },
  3: {
    decouverte: [
      "Quelle tâche pendant ton stage tu ferais encore aujourd'hui pour rien ?",
      "Raconte-moi la journée de stage dont tu es le plus fier.",
      "Qu'est-ce que tu as appris sur toi-même pendant ce stage ?",
      "Comment tes collègues de stage te percevaient-ils ?",
      "Qu'est-ce que tu aurais voulu faire de plus pendant ce stage ?",
      "Quel problème as-tu résolu que ton superviseur ne t'avait pas demandé de résoudre ?",
      "Comment tu t'es adapté quand quelque chose ne se passait pas comme prévu ?",
      "Qu'est-ce que ce stage t'a confirmé sur toi-même ?",
      "Quelle compétence as-tu développée pendant ce stage que tu n'avais pas avant ?",
      "Comment tu as géré une situation difficile ou un conflit pendant le stage ?",
    ],
    creuser: [
      "Qu'est-ce que tu as fait concrètement dans cette situation ?",
      "Quel impact ton travail a eu sur l'équipe ou le projet ?",
      "Tu peux me donner des chiffres ou des résultats mesurables ?",
      "Comment tu as su que tu avais bien fait ton travail ?",
    ],
    complexifier: [
      "Qu'est-ce que tu ferais différemment si tu refaisais ce stage ?",
      "Comment tu gères une situation où tu ne sais pas quoi faire ?",
      "Qu'est-ce que tu as pris comme initiative sans qu'on te le demande ?",
      "Comment tu as su prioriser quand tu avais plusieurs tâches en même temps ?",
    ],
    contourner: [
      "Qu'est-ce que ton superviseur t'a dit qui t'a surpris positivement ?",
      "Dans quel type de situation tu te sentais le plus à ta place pendant le stage ?",
      "Qu'est-ce que tes collègues de stage sont venus te demander le plus souvent ?",
    ],
  },
  4: {
    decouverte: [
      "Pourquoi ce domaine précisément — qu'est-ce qui t'attire vraiment dedans ?",
      "Qu'est-ce que tu as déjà fait qui se rapproche de cet objectif ?",
      "Qu'est-ce que les gens de ce domaine font au quotidien selon toi ?",
      "Qu'est-ce que tu as comme compétences que tu penses transférables ?",
      "Comment tu t'es préparé concrètement pour ce domaine ?",
      "Qu'est-ce que tu as appris sur ce secteur par toi-même en dehors des cours ?",
      "Quel projet académique te rapproche le plus de cet objectif ?",
      "Comment tu imagines ta première semaine dans ce rôle ?",
      "Qu'est-ce qui te ferait abandonner cet objectif ?",
      "Comment tu saurais que tu as réussi dans ce domaine dans 3 ans ?",
    ],
    creuser: [
      "Donne-moi un exemple concret de ce que tu viens de dire.",
      "Comment tu sais que tu serais bon dans ce domaine ?",
      "Qu'est-ce que tu as déjà accompli qui prouve cette capacité ?",
    ],
    complexifier: [
      "Qu'est-ce qui te manque encore selon toi pour y arriver ?",
      "Comment tu comptes combler ces lacunes concrètement ?",
      "Qu'est-ce qu'un bon professionnel dans ce domaine fait différemment d'un mauvais selon toi ?",
    ],
    contourner: [
      "Si tu imaginais ta première journée dans ce rôle, tu ferais quoi exactement ?",
      "Qu'est-ce que tu sais déjà faire aujourd'hui qui sera utile dans ce rôle ?",
      "Qui dans ton entourage exerce ce métier et qu'est-ce que tu as retenu de ses expériences ?",
    ],
  },
  5: {
    decouverte: [
      "Quelle réalisation concrète de ton stage es-tu le plus fier de mentionner en entrevue ?",
      "Qu'est-ce que tu aimais tellement dans ton stage que tu ne regardais pas l'heure ?",
      "Comment tes résultats de stage se comparaient à ceux de tes collègues ?",
      "Qu'est-ce que tu veux faire différemment dans ton prochain rôle ?",
      "Quelle compétence as-tu développée pendant le stage qui t'a surpris toi-même ?",
      "Comment tu as contribué à quelque chose de plus grand que ta tâche assignée ?",
      "Qu'est-ce que tu as pris comme initiative que ton superviseur n'attendait pas ?",
      "Comment tu as géré un moment de pression ou d'urgence pendant le stage ?",
      "Qu'est-ce que ce stage t'a appris sur la façon dont les entreprises fonctionnent ?",
      "Quelle décision as-tu prise seul pendant le stage et quel en était le résultat ?",
    ],
    creuser: [
      "Tu peux quantifier l'impact de ce que tu as fait ?",
      "Qu'est-ce que tu as mis en place exactement pour obtenir ce résultat ?",
      "Qui d'autre a bénéficié de ton travail et comment ?",
    ],
    complexifier: [
      "Comment tu as géré une situation où ça n'allait pas comme prévu ?",
      "Qu'est-ce que cette expérience t'a appris sur ta façon de travailler ?",
      "Si tu avais eu plus d'autonomie, qu'est-ce que tu aurais fait en plus ?",
      "Comment tu maintiens la qualité de ton travail quand tu es sous pression ?",
    ],
    contourner: [
      "Qu'est-ce que tu as fait pendant ton stage que personne ne t'avait demandé de faire ?",
      "Quel problème as-tu vu dans ton stage que tu aurais aimé résoudre mais tu n'avais pas l'autorité ?",
      "Qu'est-ce que tes collègues ont remarqué chez toi que tu n'aurais pas dit toi-même ?",
    ],
  },
  6: {
    decouverte: [
      "Quelle est ta réalisation la plus concrète depuis que tu travailles ?",
      "Qu'est-ce que tu fais mieux que la plupart de tes collègues au même niveau ?",
      "Raconte-moi une situation difficile que tu as gérée seul.",
      "Qu'est-ce qui te frustre dans ton rôle actuel ?",
      "Qu'est-ce que ton patron te demande le plus souvent de faire ?",
      "Comment tu as évolué depuis tes premiers mois dans ce poste ?",
      "Quelle décision as-tu prise récemment qui a eu un impact positif ?",
      "Comment tu gères quand tu reçois des directives contradictoires ?",
      "Qu'est-ce que tu as appris dans ce poste qui t'a surpris ?",
      "Quelle compétence as-tu développée que tu n'avais pas en arrivant ?",
    ],
    creuser: [
      "Comment tu t'y es pris exactement pour obtenir ce résultat ?",
      "Quel était l'enjeu si ça n'avait pas fonctionné ?",
      "Quels outils ou méthodes tu as utilisés ?",
      "En combien de temps tu as livré ça ?",
      "Qui était impliqué et quel était ton rôle exact ?",
    ],
    complexifier: [
      "Comment tu gères quand tu as 3 priorités en même temps et pas assez de temps ?",
      "Donne-moi un exemple où tu as dû convaincre quelqu'un qui n'était pas d'accord avec toi.",
      "Comment tu t'assures que ton travail a vraiment l'impact attendu ?",
      "Qu'est-ce que tu as changé dans ta façon de travailler depuis tes débuts ?",
      "Comment tu gères une erreur que tu as faite au travail ?",
    ],
    contourner: [
      "Si ton patron devait te décrire à un collègue, il dirait quoi selon toi ?",
      "Qu'est-ce que tu as appris dans ce poste que tu n'aurais pas appris à l'école ?",
      "Quel aspect de ton travail tu maîtrises tellement que tu pourrais enseigner ?",
      "Qu'est-ce que tes collègues viennent te demander quand ils sont bloqués ?",
    ],
  },
  7: {
    decouverte: [
      "Quelle est la réalisation de ta carrière dont tu es le plus fier et pourquoi ?",
      "Qu'est-ce que tu fais que peu de gens à ton niveau savent faire ?",
      "Comment tu as évolué en termes de responsabilités depuis 3 ans ?",
      "Qu'est-ce qui te frustre dans ton poste actuel et pourquoi ça bloque ?",
      "Comment tu prends des décisions quand tu n'as pas toutes les informations ?",
      "Raconte-moi un moment où tu as eu un impact au-delà de tes responsabilités directes.",
      "Comment tu développes les compétences de tes collègues moins expérimentés ?",
      "Qu'est-ce que tu as mis en place qui dure encore après toi ?",
      "Comment tu gères des parties prenantes qui ont des intérêts contradictoires ?",
      "Quelle décision difficile as-tu dû prendre sans avoir le soutien de tout le monde ?",
    ],
    creuser: [
      "Quel était le contexte exact et quels étaient les enjeux ?",
      "Comment tu as mesuré le succès de cette initiative ?",
      "Quels obstacles tu as rencontrés et comment tu les as surmontés ?",
      "Quelle était ta part personnelle versus celle de l'équipe ?",
    ],
    complexifier: [
      "Raconte-moi un échec professionnel significatif et ce que tu en as tiré.",
      "Comment tu gères quand tu dois défendre une décision impopulaire ?",
      "Donne-moi un exemple où tu as changé d'avis sur quelque chose d'important.",
      "Comment tu restes efficace quand l'organisation change autour de toi ?",
    ],
    contourner: [
      "Si tu pouvais changer une seule chose dans ton organisation, ce serait quoi et pourquoi ?",
      "Qu'est-ce que tu ferais différemment si tu recommençais ta carrière depuis le début ?",
      "Qu'est-ce que les gens qui travaillent avec toi disent de toi quand tu n'es pas là ?",
    ],
  },
  8: {
    decouverte: [
      "Quelle est ton expertise la plus rare sur le marché selon toi ?",
      "Comment tu as développé une compétence que peu de personnes possèdent dans ton domaine ?",
      "Quel problème complexe as-tu résolu que d'autres avaient abandonné ?",
      "Comment ton approche diffère de celle de tes pairs de même niveau ?",
      "Quel impact financier ou stratégique as-tu eu dans ta dernière organisation ?",
      "Comment tu construis et maintiens ton réseau d'influence interne et externe ?",
      "Raconte-moi une transformation que tu as initiée de bout en bout.",
      "Comment tu gères l'ambiguïté stratégique quand la direction n'est pas claire ?",
      "Qu'est-ce que tu as fait qui a changé la façon dont ton organisation fonctionne ?",
      "Comment tu identifies les opportunités que personne d'autre ne voit ?",
    ],
    creuser: [
      "Quel était l'impact financier ou stratégique de cette décision ?",
      "Comment tu as influencé des décisions au-delà de ton périmètre direct ?",
      "Quelles ressources tu avais et comment tu les as optimisées ?",
      "Comment tu as mesuré concrètement le succès de cette initiative ?",
    ],
    complexifier: [
      "Raconte-moi une situation où tu as dû aller contre la décision de ta hiérarchie.",
      "Comment tu maintiens ton niveau d'expertise dans un domaine qui évolue vite ?",
      "Qu'est-ce que tu ferais différemment dans ta carrière avec ce que tu sais maintenant ?",
      "Comment tu gères le fait de savoir plus que tes supérieurs sur certains sujets ?",
    ],
    contourner: [
      "Si tu devais former ton remplaçant en 3 mois, sur quoi tu insisterais absolument ?",
      "Qu'est-ce que tu ne feras plus jamais dans ta carrière et pourquoi ?",
      "Qu'est-ce que tes clients ou partenaires te disent que tes collègues n'entendent pas ?",
    ],
  },
  9: {
    decouverte: [
      "Quel est ton impact le plus mesurable sur une organisation au cours des 5 dernières années ?",
      "Quelle transformation as-tu initiée qui a changé la façon dont une industrie ou organisation fonctionne ?",
      "Comment tu définis ton héritage professionnel ?",
      "Qu'est-ce que tu peux faire aujourd'hui que tu ne pouvais pas faire il y a 5 ans ?",
      "Comment tu restes pertinent dans un domaine qui évolue aussi vite ?",
      "Raconte-moi une décision stratégique difficile que tu as prise et dont tu es fier.",
      "Comment tu alignes des parties prenantes de niveaux très différents sur une vision commune ?",
      "Qu'est-ce que tu as construit qui existera encore dans 10 ans ?",
      "Comment tu développes les leaders de demain dans ton équipe ?",
      "Quelle est la chose la plus contre-intuitive que tu aies apprise dans ta carrière ?",
    ],
    creuser: [
      "Quel était le contexte de marché ou organisationnel qui rendait ça si complexe ?",
      "Comment tu as aligné des parties prenantes de niveaux très différents ?",
      "Quel a été ton rôle exact versus celui de ton équipe ?",
      "Quel était le risque si tu t'étais trompé ?",
    ],
    complexifier: [
      "Comment tu gères des situations où tu es le moins expert dans la pièce ?",
      "Raconte-moi une décision stratégique difficile que tu regrettes.",
      "Comment tu transmets ton expertise à la prochaine génération ?",
      "Qu'est-ce qui t'empêche d'avoir encore plus d'impact ?",
    ],
    contourner: [
      "Si tu devais conseiller ton jeune toi de 30 ans, tu lui dirais quoi ?",
      "Qu'est-ce que les gens sous-estiment le plus dans ton domaine d'expertise ?",
      "Quel conseil donnes-tu systématiquement et que les gens ignorent souvent ?",
    ],
  },
  10: {
    decouverte: [
      "Qu'est-ce qui t'a convaincu que tu devais absolument changer de domaine maintenant ?",
      "Quelle compétence de ton ancien domaine tu penses vraiment transférable dans le nouveau ?",
      "Comment tu t'es préparé concrètement à cette transition ?",
      "Qu'est-ce que tu savais faire dans ton ancien rôle que les gens du nouveau domaine ne savent généralement pas faire ?",
      "Quel aspect de ton nouveau domaine te passionne le plus et pourquoi ?",
      "Comment tu as validé que tu avais les capacités pour réussir dans ce nouveau domaine ?",
      "Qu'est-ce que tu as déjà accompli concrètement dans ce nouveau domaine ?",
      "Quel déclencheur exact t'a poussé à faire ce changement maintenant et pas avant ?",
      "Comment tu gères la baisse de statut potentielle et le retour en bas de l'échelle ?",
      "Comment tu expliques cette reconversion à un recruteur sceptique ?",
    ],
    creuser: [
      "Qu'est-ce que tu as fait concrètement pour te préparer à ce nouveau domaine ?",
      "Comment tu as validé que cette compétence est vraiment transférable ?",
      "Quel résultat concret as-tu déjà obtenu dans ce nouveau domaine ?",
    ],
    complexifier: [
      "Qu'est-ce que tu feras si dans 1 an tu n'as pas encore percé dans le nouveau domaine ?",
      "Comment tu gères l'incertitude financière de cette transition ?",
      "Qu'est-ce que tu as dû abandonner et comment tu l'as vécu ?",
      "Comment tu construis ta crédibilité dans un domaine où tu es perçu comme débutant ?",
    ],
    contourner: [
      "Si tu n'avais pas de contraintes financières, tu aurais fait cette reconversion il y a combien d'années ?",
      "Qu'est-ce que les gens de ton entourage disent de cette décision ?",
      "Qu'est-ce qui dans ton ancien métier te manquera le plus ?",
    ],
  },
};

// ============================================
// SÉLECTIONNER LA PROCHAINE QUESTION
// ============================================
function selectionnerQuestion(
  profil: number,
  mode: "creuser" | "complexifier" | "contourner",
  questionsDejaposees: string[]
): string {
  const banque = BANQUES_QUESTIONS[profil] || BANQUES_QUESTIONS[6];
  const pool = banque[mode] || banque.creuser;
  const disponibles = pool.filter(q => !questionsDejaposees.includes(q));
  if (disponibles.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

// ============================================
// SAUVEGARDER PATTERN RÉEL
// ============================================
async function sauvegarderPattern(
  profil: number,
  domaine: string,
  question: string,
  reponse: string,
  analyse: ReturnType<typeof classifierReponse>
) {
  try {
    await supabaseAdmin.from("patterns_calibration").insert({
      profil_type: profil,
      domaine,
      question_objectif: question,
      reponse_brute: reponse,
      type_reponse: analyse.type,
      actions_detectees: analyse.actions,
      niveau_detail: analyse.niveau_detail,
      structure_logique: analyse.structure_logique,
      ton: analyse.ton,
      score_comportemental: analyse.score,
      source: "reel",
    });
  } catch (e) {
    console.error("Erreur sauvegarde pattern:", e);
  }
}

// ============================================
// VALIDATION GPS
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
  const facteurAn1 = isReconversion ? 0.85 : 1.036;
  const s1 = Math.round(salaireMin * facteurAn1 / 1000) * 1000;
  const s2 = Math.round(s1 * 1.05 / 1000) * 1000;
  const s3 = Math.round(s2 * 1.06 / 1000) * 1000;
  const s4 = Math.round(s3 * 1.07 / 1000) * 1000;
  const s5 = Math.round(s4 * 1.08 / 1000) * 1000;

  // Nettoyer le rôle actuel
  const roleBase = roleActuel
    .replace(/^assistant\s*/i, "")
    .replace(/^adjoint\s*/i, "")
    .replace(/\s*junior$/i, "")
    .replace(/\s*débutant$/i, "")
    .trim() || roleActuel;

  // Détecter si objectif est déclaré et différent du rôle actuel
  const hasObjectif =
    objectifDeclare &&
    objectifDeclare.trim() !== "" &&
    objectifDeclare.toLowerCase() !== "non fourni" &&
    objectifDeclare.toLowerCase() !== roleActuel.toLowerCase() &&
    objectifDeclare.toLowerCase() !== roleBase.toLowerCase();

  // Évaluer si objectif est réalisable en 5 ans
  const obj = objectifDeclare?.toLowerCase() || "";
  const exp = experience?.toLowerCase() || "";
  const isVP = obj.includes("vp") || obj.includes("vice-président") || obj.includes("vice president");
  const isCEO = obj.includes("ceo") || obj.includes("pdg") || obj.includes("président général");
  const isDirecteur = obj.includes("directeur") || obj.includes("director");
  const isManagerObj = obj.includes("manager") || obj.includes("gestionnaire") || obj.includes("chef") || obj.includes("responsable");

  // Calculer si objectif réalisable en 5 ans selon expérience
  let objectifRealisable5ans = true;
  if (exp.includes("moins") || exp.includes("aucune")) {
    if (isVP || isCEO) objectifRealisable5ans = false;
    if (isDirecteur) objectifRealisable5ans = false;
    if (isManagerObj) objectifRealisable5ans = false;
  } else if (exp.includes("1 à 2")) {
    if (isVP || isCEO) objectifRealisable5ans = false;
    if (isDirecteur) objectifRealisable5ans = false;
  } else if (exp.includes("3 à 5")) {
    if (isVP || isCEO) objectifRealisable5ans = false;
  }

  // Reconversion → objectif toujours dans le nouveau domaine
  const objectifFinal = isReconversion
    ? objectifDeclare.trim()
    : (hasObjectif ? objectifDeclare.trim() : roleBase);

  // Construire les titres GPS selon la logique universelle
  const getTitre = (an: number, titreGPT: string): string => {

    // CAS RECONVERSION — progression dans le nouveau domaine
    if (isReconversion && hasObjectif) {
      if (an === 1) return objectifFinal + " junior";
      if (an === 2) return objectifFinal;
      if (an === 3) return objectifFinal + " confirmé";
      if (an === 4) return objectifFinal + " senior";
      return objectifFinal + " senior confirmé";
    }

    // CAS OBJECTIF RÉALISABLE EN 5 ANS — progression vers l'objectif
    if (hasObjectif && objectifRealisable5ans) {
      if (an === 1) return roleBase + " confirmé";
      if (an === 2) return "Assistant " + objectifFinal;
      if (an === 3) return objectifFinal + " junior";
      if (an === 4) return objectifFinal;
      return objectifFinal + " senior";
    }

    // CAS OBJECTIF IRRÉALISABLE EN 5 ANS — progression réaliste depuis rôle actuel
    if (hasObjectif && !objectifRealisable5ans) {
      if (maxNiveaux <= 1) {
        if (an === 1) return roleBase + " confirmé";
        if (an === 2) return roleBase + " confirmé";
        if (an === 3) return roleBase + " senior";
        if (an === 4) return roleBase + " senior";
        return roleBase + " expert";
      }
      if (maxNiveaux === 2) {
        if (an <= 2) return roleBase + " confirmé";
        if (an === 3) return roleBase + " senior";
        return titreGPT || roleBase + " expert";
      }
      return titreGPT || roleBase;
    }

    // CAS PAS D'OBJECTIF — progression naturelle depuis rôle actuel
    if (maxNiveaux <= 1) {
      if (an === 1) return roleBase + " confirmé";
      if (an === 2) return roleBase + " confirmé";
      if (an === 3) return roleBase + " senior";
      if (an === 4) return roleBase + " senior";
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

  // Calculer scénario objectif
  const annee = new Date().getFullYear();
  let scenario = 1;
  let delai = "atteignable en 5 ans";
  let message = "Ton objectif de " + objectifDeclare + " est atteignable ! Ce GPS te montre le chemin.";

  if (!objectifDeclare || objectifDeclare === "non fourni") {
    scenario = 1;
    delai = "5 ans";
    message = "YELMA t'a défini un objectif réaliste selon ton profil et tes compétences révélées.";
  } else if (!objectifRealisable5ans) {
    if (isVP || isCEO) {
      if (exp.includes("moins") || exp.includes("aucune")) { scenario = 3; delai = "18-20 ans"; message = "Ton objectif de " + objectifDeclare + " est excellent à long terme. Tu peux l'atteindre vers " + (annee + 18) + "-" + (annee + 20) + ". En 5 ans, concentre-toi sur " + roleBase + " expert."; }
      else if (exp.includes("1 à 2")) { scenario = 3; delai = "15-18 ans"; message = "Ton objectif de " + objectifDeclare + " est excellent — compte 15-18 ans. En 5 ans, vise " + roleBase + " senior."; }
      else if (exp.includes("3 à 5")) { scenario = 3; delai = "10-12 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans."; }
      else { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans !"; }
    } else if (isDirecteur) {
      if (exp.includes("moins") || exp.includes("aucune")) { scenario = 3; delai = "12-15 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste à long terme — compte 12-15 ans. En 5 ans, vise " + roleBase + " expert."; }
      else if (exp.includes("1 à 2")) { scenario = 3; delai = "10-12 ans"; message = "Ton objectif de " + objectifDeclare + " est réaliste en 10-12 ans."; }
      else { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans !"; }
    } else if (isManagerObj) {
      if (exp.includes("moins") || exp.includes("aucune")) { scenario = 2; delai = "6-8 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 6-8 ans. En 5 ans, vise " + roleBase + " senior."; }
      else { scenario = 2; delai = "5-7 ans"; message = "Ton objectif de " + objectifDeclare + " est atteignable en 5-7 ans !"; }
    }
  }

  return { gps: validatedGPS, scenario, delai, message, salaireMax: s1 };
}

// ============================================
// PARSE DONNÉES EXTRAITES
// ============================================


const nettoyerTitreGPS = (titre: string): string => {
  if (!titre) return titre;
  return titre
    .replace(/^devenir\s+/i, "")
    .replace(/^ouvrir\s+(ma|mon|une|un|sa|son)?\s*/i, "")
    .replace(/^diriger\s+(une|un|ma|mon|sa|son)?\s*/i, "")
    .replace(/^créer\s+(une|un|ma|mon|sa|son)?\s*/i, "")
    .replace(/^établir\s+(un|une)?\s*/i, "")
    .replace(/\s+senior\s+senior/gi, " senior")
    .replace(/\s+confirmé\s+confirmé/gi, " confirmé")
    .trim();
};

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

  const opportunites = Array.isArray(json.opportunites) ? json.opportunites.map((o: unknown) => {
    const op = o as Record<string, unknown>;
    return { titre: String(op.titre || ""), salaire: Number(op.salaire || 0), description: String(op.description || "") };
  }) : [];

  const formations = Array.isArray(json.formations) ? json.formations.map((f: unknown) => {
    const fm = f as Record<string, unknown>;
    return { nom: String(fm.nom || ""), type: String(fm.type || "Formation"), plateforme: String(fm.plateforme || ""), duree: String(fm.duree || "") };
  }) : [];

  const certifications = Array.isArray(json.certifications) ? json.certifications.map((c: unknown) => {
    const ct = c as Record<string, unknown>;
    return { nom: String(ct.nom || ""), organisme: String(ct.organisme || "") };
  }) : [];

  const salaireMin = candidatInfo.salaire_min || 45000;
  const objectifDeclare = String(json.objectif_final || candidatInfo.objectif_declare || "");
  const isReconversion = candidatInfo.statut_emploi?.toLowerCase().includes("reconversion") || false;

  const validated = validateGPS(
    { an1: parseGPSRaw(json.an1), an2: parseGPSRaw(json.an2), an3: parseGPSRaw(json.an3), an4: parseGPSRaw(json.an4), an5: parseGPSRaw(json.an5) },
    salaireMin, candidatInfo.annee_experience || "", candidatInfo.role_actuel || "", objectifDeclare, isReconversion
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
    gps_an1: validated.gps.an1 ? { ...validated.gps.an1, titre: nettoyerTitreGPS(validated.gps.an1.titre) } : undefined,
    gps_an2: validated.gps.an2 ? { ...validated.gps.an2, titre: nettoyerTitreGPS(validated.gps.an2.titre) } : undefined,
    gps_an3: validated.gps.an3 ? { ...validated.gps.an3, titre: nettoyerTitreGPS(validated.gps.an3.titre) } : undefined,
    gps_an4: validated.gps.an4 ? { ...validated.gps.an4, titre: nettoyerTitreGPS(validated.gps.an4.titre) } : undefined,
    gps_an5: validated.gps.an5 ? {
      ...validated.gps.an5,
      titre: (() => {
        const objectif = candidatInfo?.objectif_declare?.trim();
        const titreGPT = nettoyerTitreGPS(validated.gps.an5.titre);
        if (!objectif) return titreGPT;
        // Si le titre GPT ne contient pas les mots clés de l'objectif → forcer l'objectif
        const motsObjectif = objectif.toLowerCase().split(" ").filter(m => m.length > 3);
        const titreContientObjectif = motsObjectif.some(m => titreGPT.toLowerCase().includes(m));
        if (!titreContientObjectif) return objectif + " senior";
        return titreGPT;
      })()
    } : undefined,

    opportunites, formations, certifications,
  };
}

// ============================================
// DÉTECTION RAPPORT FINAL
// ============================================
function isRapportFinal(text: string): boolean {
  const t = text.toUpperCase();
  return (
    (t.includes("COMPÉTENCES") || t.includes("COMPETENCES") || t.includes("FORCES")) &&
    (t.includes("GPS") || t.includes("AN 1:") || t.includes("AN 1 :")) &&
    (t.includes("FORMATION") || t.includes("OPPORTUNIT"))
  );
}

// ============================================
// PROMPT SYSTÈME DYNAMIQUE
// ============================================
function buildSystemPrompt(
  candidatInfo: {
    prenom?: string; diplome?: string; annee_diplome?: string; domaine_etudes?: string;
    annee_experience?: string; annee_autre_experience?: string; domaine_actuel?: string;
    role_actuel?: string; ville?: string; statut_emploi?: string; objectif_declare?: string;
    salaire_min?: number; salaire_max?: number;
  },
  profil: number,
  historiqueAnalyse: { type: string; score: number; mode: string }[],
  professionReglementee?: {
    profession: string;
    ordre: string;
    diplome_minimum: string;
    annees_etudes: number;
    etapes_parcours: { etape: string; duree: string; salaire: number }[];
    salaire_debutant: number;
    salaire_intermediaire: number;
    salaire_senior: number;
  } | null

) {
  const niveauInfo = getNiveauGPS(candidatInfo?.annee_experience || "", candidatInfo?.role_actuel || "");
  const isReconversion = candidatInfo?.statut_emploi?.toLowerCase().includes("reconversion") || false;
  const nbEchanges = historiqueAnalyse.length;
  const scoresMoyen = historiqueAnalyse.length > 0
    ? historiqueAnalyse.reduce((acc, h) => acc + (h.score || 2), 0) / historiqueAnalyse.length
    : 0;
  const dernierMode = historiqueAnalyse.length > 0 ? historiqueAnalyse[historiqueAnalyse.length - 1].mode : "creuser";

  // Seuil rapport : entre 8 et 10 échanges
  const SEUIL_MIN_RAPPORT = 8;
  const SEUIL_MAX_RAPPORT = 10;

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
- PROFIL DÉTECTÉ: ${profil}
- Niveau actuel: ${niveauInfo.niveauActuel}
- Reconversion: ${isReconversion ? "OUI" : "NON"}
- Échanges complétés: ${nbEchanges}/${SEUIL_MAX_RAPPORT}
- Score comportemental moyen: ${scoresMoyen.toFixed(1)}/5
- Mode actuel: ${dernierMode}

MISSION YELMA :

${professionReglementee ? `
⚠️ PROFESSION RÉGLEMENTÉE DÉTECTÉE : ${professionReglementee.profession}
- Ordre obligatoire : ${professionReglementee.ordre}
- Diplôme minimum requis : ${professionReglementee.diplome_minimum}
- Durée totale du parcours : ${professionReglementee.annees_etudes} ans
- Statut ordre candidat : ${(candidatInfo as { ordre_professionnel_statut?: string })?.ordre_professionnel_statut || "non fourni"}
- Ordre déclaré : ${(candidatInfo as { ordre_professionnel_nom?: string })?.ordre_professionnel_nom || "non fourni"}

RÈGLES SPÉCIALES PROFESSION RÉGLEMENTÉE :
1. Salaires GPS basés sur la grille réelle : débutant ${professionReglementee.salaire_debutant}$ / intermédiaire ${professionReglementee.salaire_intermediaire}$ / senior ${professionReglementee.salaire_senior}$
2. Si candidat PAS encore membre ordre → GPS An 1 inclut l'étape d'admission à l'ordre
3. Si diplôme déclaré insuffisant → alerter honnêtement et inclure parcours académique dans formations
4. Formations recommandées incluent les formations continues obligatoires de l'ordre
5. GPS suit les étapes réelles du parcours professionnel réglementé
` : ""}

Révéler 3 à 5 compétences PROFESSIONNELLES OPÉRATIONNELLES reconnues dans les offres d'emploi.

EXEMPLES DE BONNES COMPÉTENCES (matchables avec offres d'emploi) :
✅ "Suivi et contrôle de l'avancement de projet"
✅ "Analyse des écarts budgétaires"
✅ "Coordination inter-équipes et parties prenantes"
✅ "Gestion des risques et des délais"
✅ "Reporting et communication de la performance"

EXEMPLES DE MAUVAISES COMPÉTENCES (trop vagues ou soft) :
❌ "Écoute active", "Patience", "Résilience", "Communication"
❌ Ces soft skills doivent être TRADUITS en compétences métier + 2 axes de développement
en analysant IMPLICITEMENT les comportements — jamais en demandant directement.

RÈGLES ABSOLUES :
PREMIER MESSAGE OBLIGATOIRE :
Saluer ${candidatInfo?.prenom || ""} par son prénom + mentionner son rôle de ${candidatInfo?.role_actuel || ""} + poser UNE question d'ouverture sur une réalisation concrète récente. Maximum 2 phrases. JAMAIS une question de relance comme première question.
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat dit
3. UNE seule question par échange — courte et directe
4. Générer le rapport entre ${SEUIL_MIN_RAPPORT} et ${SEUIL_MAX_RAPPORT} échanges
   - À partir de ${SEUIL_MIN_RAPPORT} échanges : générer le rapport si tu as assez de matière
   - À ${SEUIL_MAX_RAPPORT} échanges : générer le rapport OBLIGATOIREMENT
5. JAMAIS de "je vais générer" — écrire le rapport directement
6. Questions formulées DIFFÉREMMENT à chaque conversation

LOGIQUE DE PROGRESSION DES QUESTIONS :
- Échanges 1-3 : Questions de découverte — explorer les domaines, intérêts, réalisations
- Échanges 4-6 : Questions d'approfondissement — détails, résultats, impact mesurable
- Échanges 7-8 : Questions de complexification — obstacles, décisions, valeurs, vision
- Échanges 9-10 : Synthèse ou rapport si assez de matière

MODE ACTUEL — ${dernierMode.toUpperCase()} :
${dernierMode === "creuser" ? "→ Réponse vague détectée. Approfondir avec une question concrète sur les actions ou les résultats." : ""}
${dernierMode === "complexifier" ? "→ Bonne réponse détectée. Monter en complexité — obstacles, décisions difficiles, impact." : ""}
${dernierMode === "contourner" ? "→ Évitement détecté. Contourner avec une question indirecte sur une situation vécue." : ""}

${nbEchanges >= SEUIL_MIN_RAPPORT ? `⚡ TU AS ASSEZ DE MATIÈRE — Génère le rapport maintenant si les compétences sont claires.` : ""}
${nbEchanges >= SEUIL_MAX_RAPPORT ? `🚨 RAPPORT OBLIGATOIRE — Tu dois générer le rapport final maintenant.` : ""}

PROGRESSION GPS — RÉALISTE :
Niveau: ${niveauInfo.niveauActuel} — Max ${niveauInfo.maxNiveaux} niveau(x) en 5 ans
${isReconversion ? "RECONVERSION: An 1 = baisse temporaire de salaire (-15%) à mentionner honnêtement" : ""}

RAPPORT FINAL — écrire DIRECTEMENT sans annonce :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence générique]**
[1 phrase valeur marché]

2. **[Compétence générique]**
[1 phrase valeur marché]

3. **[Compétence générique]**
[1 phrase valeur marché]

TES 2 AXES DE DÉVELOPPEMENT

🔹 [Compétence manquante 1] — [explication courte]
🔹 [Compétence manquante 2] — [explication courte]

OPPORTUNITÉS

1. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

2. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

3. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

GPS DE CARRIÈRE — 5 ANS

An 1: [Vrai titre de poste du marché] | [Salaire] | [Action courte]
An 2: [Vrai titre de poste du marché] | [Salaire] | [Action courte]
An 3: [Vrai titre de poste du marché] | [Salaire] | [Action courte]
An 4: [Vrai titre de poste du marché] | [Salaire] | [Action courte]
An 5: [Vrai titre de poste du marché — JAMAIS une phrase comme "Devenir X" ou "Ouvrir X"] | [Salaire] | [Action courte]

RÈGLE ABSOLUE GPS :
1. Les titres doivent être des vrais titres de postes reconnus sur le marché canadien
2. An 5 DOIT être aligné avec l'objectif déclaré : "${candidatInfo?.objectif_declare || "non déclaré"}"
3. Si objectif déclaré existe → An 5 = ce titre exact ou variante senior/confirmé
4. JAMAIS de phrases : "Devenir X", "Ouvrir X", "Diriger X", "Lancer X", "Établir X"
5. EXEMPLES CORRECTS : "Directrice marketing", "CPA senior", "Lead développeur", "Architecte associé", "Professeur titulaire"
6. EXEMPLES INCORRECTS : "Devenir directrice", "Ouvrir une clinique", "Lancer un laboratoire"

OBJECTIF: [objectif déclaré ou proposé]
SCENARIO: [1/2/3]
MESSAGE_OBJECTIF: [message honnête et motivant]
DELAI_OBJECTIF: [délai réaliste]

FORMATIONS

1. [Nom] | [Type: Renforcement/Gap marché/Prochain poste/Objectif long terme] | [Plateforme parmi: MIT OCW/Harvard edX/HEC Montréal EDUlib/McGill edX/Polytechnique EDUlib/Coursera/PMI] | [Durée]
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
  salaire_min?: number; salaire_max?: number; role_actuel?: string;
  ville?: string; annee_experience?: string; objectif_declare?: string; statut_emploi?: string;
}) {
  const niveauInfo = getNiveauGPS(candidatInfo.annee_experience || "", candidatInfo.role_actuel || "");

  return `Extrait les données de ce rapport YELMA et retourne UNIQUEMENT ce JSON valide sans backticks:

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
  "axe1_desc": "explication courte",
  "axe2": "competence manquante 2",
  "axe2_desc": "explication courte",
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
  "analyse": "1 phrase honnete sur objectif",
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
- GPS maximum ${niveauInfo.maxNiveaux} niveaux depuis ${niveauInfo.niveauActuel}
- formations: exactement 4 avec les 4 types
- certifications: exactement 2
- axe1 et axe2: competences NON mentionnees par le candidat mais demandees par le marche
- force1/2/3 INTERDITS : Communication, Gestion du temps, Competences cliniques, Competences techniques, Esprit critique, Adaptabilite, Creativite, HTML seul, CSS seul, JavaScript seul, Communication des concepts techniques, Travail en equipe, Resolution de problemes, Leadership seul
- force1/2/3 OBLIGATOIRE : format Verbe + objet + contexte ex: Gestion des protocoles de soins, Supervision equipe clinique, Analyse donnees financieres, Architecture systemes cloud`;

}

// ============================================
// API ROUTE PRINCIPALE
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, lang, email, nom, prenom, candidatInfo, historiqueAnalyse: historiqueAnalyseIn } = body;

    const profil = detecterProfil(candidatInfo || {});
    // Détecter profession réglementée
    let professionReglementee = null;
    const roleActuel = (candidatInfo?.role_actuel || candidatInfo?.domaine_actuel || "").toLowerCase();
    const objectifDeclare = (candidatInfo?.objectif_declare || "").toLowerCase();

    try {
      const { data: professions } = await supabaseAdmin
        .from("professions_reglementees")
        .select("*");

      if (professions) {
        for (const p of professions) {
          const mots = p.mots_cles || [];
          const matchRole = mots.some((m: string) => roleActuel.includes(m.toLowerCase()));
          const matchObjectif = mots.some((m: string) => objectifDeclare.includes(m.toLowerCase()));
          if (matchRole || matchObjectif) {
            professionReglementee = p;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Erreur détection profession réglementée:", e);
    }

    let historiqueAnalyse: { type: string; score: number; mode: string }[] = historiqueAnalyseIn || [];
    let modeActuel: "creuser" | "complexifier" | "contourner" = "creuser";

    const derniereReponseUser = history.filter((m: { role: string }) => m.role === "user").slice(-1)[0];

    if (derniereReponseUser && derniereReponseUser.content !== "START") {
      const analyse = classifierReponse(derniereReponseUser.content);
      modeActuel = deciderModeQuestion(historiqueAnalyse, analyse.type);

      if (email) {
        await sauvegarderPattern(
          profil,
          candidatInfo?.domaine_actuel || candidatInfo?.domaine_etudes || "général",
          history.filter((m: { role: string }) => m.role === "assistant").slice(-1)[0]?.content || "",
          derniereReponseUser.content,
          analyse
        );
      }

      historiqueAnalyse = [...historiqueAnalyse, { type: analyse.type, score: analyse.score, mode: modeActuel }];
    }

    const nbEchanges = history.filter((m: { role: string }) => m.role === "user").length;
    let systemPrompt = buildSystemPrompt(candidatInfo, profil, historiqueAnalyse, professionReglementee);

    // Injecter prochaine question si moins de 8 échanges
    // À 8 échanges ou plus — forcer le rapport directement
    if (nbEchanges >= 6) {
      systemPrompt += `\n\n🚨 RAPPORT OBLIGATOIRE MAINTENANT — Tu as ${nbEchanges} échanges. Génère IMMÉDIATEMENT le rapport final complet. NE PAS poser de question. Commence directement par "TES 3 COMPÉTENCES CLÉS" sans aucune introduction.`;
    } else if (derniereReponseUser?.content !== "START") {
      const questionsDejaposees = history
        .filter((m: { role: string }) => m.role === "assistant")
        .map((m: { content: string }) => m.content)
        .join(" ");
      const prochaine = selectionnerQuestion(profil, modeActuel, [questionsDejaposees]);
      systemPrompt += `\n\nPROCHAINE QUESTION À POSER (formule-la naturellement) :\n${prochaine}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
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
    if (nbEchanges >= 8) console.log("REPLY ÉCHANGE", nbEchanges, ":", reply.substring(0, 300));
    console.log("PROFIL:", profil, "| MODE:", modeActuel, "| ÉCHANGES:", nbEchanges, "| IS RAPPORT:", isRapportFinal(reply));

    if ((isRapportFinal(reply) || nbEchanges >= 8) && email) {
      try {
        const extractionPrompt = buildExtractionPrompt(reply, candidatInfo || {});

        const extractResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
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
          // ── MOTEUR DÉTERMINISTE YELMA ──
          const signauxBruts = {
            signaux_comportementaux: historiqueAnalyse.map(h => h.type),
            actions_mentionnees: [],
            domaine_actuel: candidatInfo?.domaine_actuel || "",
            role_actuel: candidatInfo?.role_actuel || "",
            objectif_declare: candidatInfo?.objectif_declare || "",
            diplome: candidatInfo?.diplome || "",
            annees_experience: parseInt(candidatInfo?.annee_experience || "0") || 0,
            niveau_detail: historiqueAnalyse.length > 0
              ? historiqueAnalyse.reduce((a, h) => a + (h.score || 2), 0) / historiqueAnalyse.length
              : 2,
            structure_logique: 3,
          };

          const signauxNormalises = normaliserSignaux(signauxBruts);
          const resultatMatching = await scoreMetiers(signauxNormalises);
          const gpsDeterm = resultatMatching.top_metiers.length > 0
            ? await construireGPS(signauxNormalises, resultatMatching.top_metiers[0])
            : null;
          // ── FIN MOTEUR DÉTERMINISTE ──

          const rapportData = parseExtractedData(parsed, candidatInfo || {});

          await supabaseAdmin.from("candidats").upsert({
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

          const scoresMoyen = historiqueAnalyse.length > 0
            ? historiqueAnalyse.reduce((acc, h) => acc + h.score, 0) / historiqueAnalyse.length
            : 0;

          await supabaseAdmin.from("entretiens_enrichis").insert({
            email,
            profil_type: profil,
            domaine: candidatInfo?.domaine_actuel || candidatInfo?.domaine_etudes || "général",
            echanges: history.map((m: { role: string; content: string }, i: number) => ({
              role: m.role, contenu: m.content,
              analyse: historiqueAnalyse[Math.floor(i / 2)] || null,
            })),
            scores_finaux: {
              score_moyen: scoresMoyen,
              nb_echanges: historiqueAnalyse.length,
              distribution: {
                vague: historiqueAnalyse.filter(h => h.type === "vague").length,
                structuree: historiqueAnalyse.filter(h => h.type === "structuree").length,
                evitement: historiqueAnalyse.filter(h => h.type === "evitement").length,
                riche: historiqueAnalyse.filter(h => h.type === "riche").length,
              }
            },
            competences_detectees: [rapportData.force1, rapportData.force2, rapportData.force3].filter(Boolean),
            gaps_detectes: [rapportData.axe1, rapportData.axe2].filter(Boolean),
            moteur_dominant: scoresMoyen >= 4 ? "accomplissement" : scoresMoyen >= 3 ? "influence" : "affiliation",
            top_competences: {
              force1: { nom: rapportData.force1, desc: rapportData.force1_desc },
              force2: { nom: rapportData.force2, desc: rapportData.force2_desc },
              force3: { nom: rapportData.force3, desc: rapportData.force3_desc },
            },
          });

          return NextResponse.json({
            reply,
            rapportData,
            historiqueAnalyse,
            matching: resultatMatching,
            gps_determ: gpsDeterm,
          });
        }
      } catch (extractError) {
        console.error("Extraction error:", extractError);
      }
    }

    return NextResponse.json({ reply, historiqueAnalyse });

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json({ reply: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
