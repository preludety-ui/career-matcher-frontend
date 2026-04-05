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
  const isReconversionSenior = isReconversion && (
    exp.includes("6 à 10") || exp.includes("plus de 10") ||
    exp.includes("3 à 5")
  );

 if (sansDiplome && avecAutreExp) return 1;
if (sansDiplome) return 1;
if (isReconversionSenior) return 10;
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
      "Tu as combien d'années d'expérience dans ton ancien domaine et qu'est-ce que ça t'a appris que les jeunes diplômés n'ont pas ?",
      "Qu'est-ce que tu laisses derrière toi et pourquoi maintenant à ce stade de ta carrière ?",
      "Comment tu gères financièrement cette transition avec tes responsabilités actuelles ?",
      "Qu'est-ce que ton réseau professionnel actuel peut t'apporter dans ta nouvelle direction ?",
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
// DÉTECTION RAPPORT FINAL
// ============================================
function isRapportFinal(text: string): boolean {
  const t = text.toUpperCase();
  return (
    (t.includes("COMPÉTENCES") || t.includes("COMPETENCES") || t.includes("FORCES")) &&
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
    profession: string; ordre: string; diplome_minimum: string;
    annees_etudes: number;
    etapes_parcours: { etape: string; duree: string; salaire: number }[];
    salaire_debutant: number; salaire_intermediaire: number; salaire_senior: number;
  } | null,
  gpsDeterm?: {
    etapes: { annee: number; titre: string; salaire_min: number; salaire_max: number; actions: string[] }[];
    score_faisabilite?: number;
    message_faisabilite?: string;
  } | null
) {
  const isReconversion = candidatInfo?.statut_emploi?.toLowerCase().includes("reconversion") || false;
  const isReconversionSenior = isReconversion && (
    candidatInfo?.annee_experience?.includes("6 à 10") ||
    candidatInfo?.annee_experience?.includes("plus de 10") ||
    candidatInfo?.annee_experience?.includes("3 à 5")
  )|| false;
  const isSansDiplome = candidatInfo?.diplome?.toLowerCase().includes("autodidacte") ||
    candidatInfo?.diplome?.toLowerCase().includes("sans diplôme") || false;
  const nbEchanges = historiqueAnalyse.length;
  const scoresMoyen = historiqueAnalyse.length > 0
    ? historiqueAnalyse.reduce((acc, h) => acc + (h.score || 2), 0) / historiqueAnalyse.length
    : 0;
  const dernierMode = historiqueAnalyse.length > 0 ? historiqueAnalyse[historiqueAnalyse.length - 1].mode : "creuser";
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
- Reconversion: ${isReconversion ? "OUI" : "NON"}
- Reconversion senior (28-45 ans): ${isReconversionSenior ? "OUI — valoriser l'expérience accumulée, aborder risque financier et réseau" : "NON"}
- Sans diplôme: ${isSansDiplome ? "OUI — valoriser compétences pratiques, apprentissage autodidacte, réalisations concrètes" : "NON"}
- Échanges complétés: ${nbEchanges}/${SEUIL_MAX_RAPPORT}
- Score comportemental moyen: ${scoresMoyen.toFixed(1)}/5
- Mode actuel: ${dernierMode}

${professionReglementee ? `
⚠️ PROFESSION RÉGLEMENTÉE DÉTECTÉE : ${professionReglementee.profession}
- Ordre obligatoire : ${professionReglementee.ordre}
- Diplôme minimum requis : ${professionReglementee.diplome_minimum}
- Durée totale du parcours : ${professionReglementee.annees_etudes} ans
- Salaires : débutant ${professionReglementee.salaire_debutant}$ / intermédiaire ${professionReglementee.salaire_intermediaire}$ / senior ${professionReglementee.salaire_senior}$
` : ""}

RÈGLES ABSOLUES :
PREMIER MESSAGE : Saluer ${candidatInfo?.prenom || ""} par son prénom + mentionner son rôle de ${candidatInfo?.role_actuel || ""} + poser UNE question d'ouverture sur une réalisation concrète récente. Maximum 2 phrases.
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat dit
3. UNE seule question par échange — courte et directe
4. Générer le rapport entre ${SEUIL_MIN_RAPPORT} et ${SEUIL_MAX_RAPPORT} échanges
5. JAMAIS de "je vais générer" — écrire le rapport directement

MODE ACTUEL — ${dernierMode.toUpperCase()} :
${dernierMode === "creuser" ? "→ Approfondir avec une question concrète sur les actions ou les résultats." : ""}
${dernierMode === "complexifier" ? "→ Monter en complexité — obstacles, décisions difficiles, impact." : ""}
${dernierMode === "contourner" ? "→ Contourner avec une question indirecte sur une situation vécue." : ""}

${nbEchanges >= SEUIL_MIN_RAPPORT ? `⚡ TU AS ASSEZ DE MATIÈRE — Génère le rapport maintenant.` : ""}
${nbEchanges >= SEUIL_MAX_RAPPORT ? `🚨 RAPPORT OBLIGATOIRE — Tu dois générer le rapport final maintenant.` : ""}

RAPPORT FINAL — écrire DIRECTEMENT sans annonce :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence opérationnelle]**
[1 phrase valeur marché]

2. **[Compétence opérationnelle]**
[1 phrase valeur marché]

3. **[Compétence opérationnelle]**
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
[Sera généré automatiquement par le moteur YELMA — ne pas inclure dans ta réponse]

OBJECTIF: ${candidatInfo?.objectif_declare || "à définir"}
SCENARIO: 1
MESSAGE_OBJECTIF: [message honnête et motivant sur l'objectif]
DELAI_OBJECTIF: atteignable avec un plan structuré

FORMATIONS

1. [Nom] | [Type: Renforcement/Gap marché/Prochain poste/Objectif long terme] | [Plateforme parmi: MIT OCW/Harvard edX/HEC Montréal EDUlib/McGill edX/Coursera/PMI] | [Durée]
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
  "objectif_final": "${candidatInfo.objectif_declare || ""}",
  "scenario_objectif": 1,
  "message_objectif": "message honnete et motivant",
  "delai_objectif": "atteignable avec un plan structure",
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
  ],
  "capacite_adaptation": 0.7,
  "capacite_apprentissage": 0.8,
  "transferabilite": 0.6
}

REGLES:
- formations: exactement 4 avec les 4 types
- certifications: exactement 2
- axe1 et axe2: competences NON mentionnees par le candidat mais demandees par le marche
- force1/2/3 INTERDITS : Communication, Gestion du temps, Esprit critique, Adaptabilite, Creativite, Travail en equipe, Resolution de problemes, Leadership seul
- force1/2/3 OBLIGATOIRE : format Verbe + objet + contexte ex: Gestion des protocoles de soins, Supervision equipe clinique, Analyse donnees financieres
- capacite_adaptation: score 0 à 1 basé sur les exemples de changement, flexibilité, nouveaux contextes mentionnés
- capacite_apprentissage: score 0 à 1 basé sur la vitesse de progression, formations autodidactes, nouvelles compétences acquises
- transferabilite: score 0 à 1 basé sur les compétences actuelles utiles pour la cible déclarée`;
}

// ============================================
// PARSE DONNÉES EXTRAITES (simplifié — GPS vient du moteur)
// ============================================
function parseExtractedData(json: Record<string, unknown>, candidatInfo: {
  salaire_min?: number;
  role_actuel?: string;
  objectif_declare?: string;
  statut_emploi?: string;
}) {
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

  return {
    niveau_education: String(json.niveau || "JUNIOR"),
    force1: String(json.force1 || ""), force1_desc: String(json.force1_desc || ""),
    force2: String(json.force2 || ""), force2_desc: String(json.force2_desc || ""),
    force3: String(json.force3 || ""), force3_desc: String(json.force3_desc || ""),
    axe1: String(json.axe1 || ""), axe1_desc: String(json.axe1_desc || ""),
    axe2: String(json.axe2 || ""), axe2_desc: String(json.axe2_desc || ""),
    salaire_min: candidatInfo.salaire_min || 45000,
    salaire_max: candidatInfo.salaire_min ? candidatInfo.salaire_min * 1.3 : 60000,
    role_actuel: String(json.role_actuel || candidatInfo.role_actuel || ""),
    ville: String(json.ville || "Montréal"),
    objectif_carriere: candidatInfo.objectif_declare || String(json.objectif_final || ""),
    scenario_objectif: Number(json.scenario_objectif || 1),
    message_objectif: String(json.message_objectif || ""),
    delai_objectif: String(json.delai_objectif || "atteignable avec un plan structuré"),
    analyse_comparative: String(json.analyse || ""),
    capacite_adaptation: Number(json.capacite_adaptation || 0),
    capacite_apprentissage: Number(json.capacite_apprentissage || 0),
    transferabilite: Number(json.transferabilite || 0),
    gps_an1: undefined as { titre: string; salaire: number; action: string } | undefined,
    gps_an2: undefined as { titre: string; salaire: number; action: string } | undefined,
    gps_an3: undefined as { titre: string; salaire: number; action: string } | undefined,
    gps_an4: undefined as { titre: string; salaire: number; action: string } | undefined,
    gps_an5: undefined as { titre: string; salaire: number; action: string } | undefined,
    score_propulse: undefined as number | undefined,
    score_cible_pct: undefined as number | undefined,
    score_cible_5ans_pct: undefined as number | undefined,
    verdict: undefined as string | undefined,
    message_analyse: undefined as string | undefined,
    opportunites, formations, certifications,
  };
}

// ============================================
// API ROUTE PRINCIPALE
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, lang, email, nom, prenom, candidatInfo, historiqueAnalyse: historiqueAnalyseIn } = body;
    console.log("EMAIL REÇU:", email, "| NOM:", nom, "| PRENOM:", prenom);

    const profil = detecterProfil(candidatInfo || {});

    // Détecter profession réglementée
    let professionReglementee = null;
    const roleActuel = (candidatInfo?.role_actuel || candidatInfo?.domaine_actuel || "").toLowerCase();
    const objectifDeclare = (candidatInfo?.objectif_declare || "").toLowerCase();

    try {
      const { data: professions } = await supabaseAdmin.from("professions_reglementees").select("*");
      if (professions) {
        for (const p of professions) {
          const mots = p.mots_cles || [];
          const matchRole = mots.some((m: string) => roleActuel.includes(m.toLowerCase()));
          const matchObjectif = mots.some((m: string) => objectifDeclare.includes(m.toLowerCase()));
          if (matchRole || matchObjectif) { professionReglementee = p; break; }
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

    // ── MOTEUR DÉTERMINISTE — calculé avant le prompt ──
    const signauxBruts = {
      signaux_comportementaux: historiqueAnalyse.map(h => h.type),
      actions_mentionnees: [] as string[],
      domaine_actuel: candidatInfo?.domaine_actuel || "",
      role_actuel: candidatInfo?.role_actuel || "",
      objectif_declare: candidatInfo?.objectif_declare || "",
      diplome: candidatInfo?.diplome || "",
      annees_experience: candidatInfo?.annee_experience?.includes("plus de 10") ? 12 :
        candidatInfo?.annee_experience?.includes("6 à 10") ? 8 :
          candidatInfo?.annee_experience?.includes("3 à 5") ? 4 :
            candidatInfo?.annee_experience?.includes("1 à 2") ? 2 :
              candidatInfo?.annee_experience?.includes("moins") ? 0.5 : 0,
      niveau_detail: historiqueAnalyse.length > 0
        ? historiqueAnalyse.reduce((a: number, h: { score: number }) => a + (h.score || 2), 0) / historiqueAnalyse.length
        : 2,
      structure_logique: 3,
      prenom: candidatInfo?.prenom || "",
    };
    const signauxNormalises = normaliserSignaux(signauxBruts);
    const resultatMatching = await scoreMetiers(signauxNormalises);
    const gpsDeterm = resultatMatching.top_metiers.length > 0
      ? await construireGPS(signauxNormalises, resultatMatching.top_metiers[0])
      : null
    console.log('SCORES:', gpsDeterm?.score_propulse, gpsDeterm?.score_cible_pct, gpsDeterm?.verdict)

    // ── FIN MOTEUR DÉTERMINISTE ──

    const nbEchanges = history.filter((m: { role: string }) => m.role === "user").length;
    let systemPrompt = buildSystemPrompt(candidatInfo, profil, historiqueAnalyse, professionReglementee, gpsDeterm);

    if (nbEchanges >= 6) {
      const gpsPrompt = gpsDeterm ? `

⚠️ GPS CALCULÉ PAR LE MOTEUR YELMA — NE PAS INCLURE DANS TA RÉPONSE :
An 1: ${gpsDeterm.etapes[0]?.titre} | ${gpsDeterm.etapes[0]?.salaire_min}$-${gpsDeterm.etapes[0]?.salaire_max}$
An 2: ${gpsDeterm.etapes[1]?.titre} | ${gpsDeterm.etapes[1]?.salaire_min}$-${gpsDeterm.etapes[1]?.salaire_max}$
An 3: ${gpsDeterm.etapes[2]?.titre} | ${gpsDeterm.etapes[2]?.salaire_min}$-${gpsDeterm.etapes[2]?.salaire_max}$
An 4: ${gpsDeterm.etapes[3]?.titre} | ${gpsDeterm.etapes[3]?.salaire_min}$-${gpsDeterm.etapes[3]?.salaire_max}$
An 5: ${gpsDeterm.etapes[4]?.titre} | ${gpsDeterm.etapes[4]?.salaire_min}$-${gpsDeterm.etapes[4]?.salaire_max}$
Score faisabilité : ${resultatMatching.score_faisabilite}%` : "";

      systemPrompt += `\n\n🚨 RAPPORT OBLIGATOIRE MAINTENANT — Tu as ${nbEchanges} échanges. Génère IMMÉDIATEMENT le rapport final. NE PAS poser de question. Commence directement par "TES 3 COMPÉTENCES CLÉS".${gpsPrompt}`;
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
          const rapportData = parseExtractedData(parsed, candidatInfo || {});

          // ── GPS 100% DÉTERMINISTE — notre moteur décide tout ──
          if (gpsDeterm && gpsDeterm.etapes.length === 5) {
            rapportData.gps_an1 = { titre: gpsDeterm.etapes[0].titre, salaire: gpsDeterm.etapes[0].salaire_min, action: gpsDeterm.etapes[0].actions[0] }
            rapportData.gps_an2 = { titre: gpsDeterm.etapes[1].titre, salaire: gpsDeterm.etapes[1].salaire_min, action: gpsDeterm.etapes[1].actions[0] }
            rapportData.gps_an3 = { titre: gpsDeterm.etapes[2].titre, salaire: gpsDeterm.etapes[2].salaire_min, action: gpsDeterm.etapes[2].actions[0] }
            rapportData.gps_an4 = { titre: gpsDeterm.etapes[3].titre, salaire: gpsDeterm.etapes[3].salaire_min, action: gpsDeterm.etapes[3].actions[0] }
            rapportData.gps_an5 = { titre: gpsDeterm.etapes[4].titre, salaire: gpsDeterm.etapes[4].salaire_min, action: gpsDeterm.etapes[4].actions[0] }
            rapportData.salaire_min = gpsDeterm.salaire_actuel
            rapportData.salaire_max = gpsDeterm.salaire_cible
            rapportData.objectif_carriere = signauxNormalises.objectif_normalise

            // ── Score PROPULSE avec les scores IA ──
            const variable_experience = Math.min(1, signauxBruts.annees_experience / (gpsDeterm.annees_necessaires || 5))
            const score_propulse_final = Math.min(99, Math.round(
              100 * (
                0.30 * variable_experience +
                0.25 * (rapportData.transferabilite || 0) +
                0.20 * (rapportData.capacite_adaptation || 0) +
                0.15 * (rapportData.capacite_apprentissage || 0) +
                0.10 * 0  // formations = 0 à T=0
              )
            ))
            rapportData.score_propulse = score_propulse_final
            rapportData.score_cible_pct = gpsDeterm.score_cible_pct
            rapportData.score_cible_5ans_pct = gpsDeterm.score_cible_5ans_pct
            rapportData.verdict = gpsDeterm.verdict
            rapportData.message_analyse = gpsDeterm.message_analyse
          }

          console.log('UPSERT SCORES:', rapportData.score_propulse, rapportData.score_cible_pct, rapportData.verdict, rapportData.transferabilite, rapportData.capacite_adaptation)

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
            score_propulse: rapportData.score_propulse,
            score_cible_pct: rapportData.score_cible_pct,
            score_cible_5ans_pct: rapportData.score_cible_5ans_pct,
            verdict: rapportData.verdict,
            message_analyse: rapportData.message_analyse,
            nb_entretiens: 1,
            dernier_entretien: new Date().toISOString(),
          }, { onConflict: "email", ignoreDuplicates: false })

          // Force update des scores
          await supabaseAdmin.from("candidats")
            .update({
              score_propulse: rapportData.score_propulse,
              score_cible_pct: rapportData.score_cible_pct,
              score_cible_5ans_pct: rapportData.score_cible_5ans_pct,
              verdict: rapportData.verdict,
              message_analyse: rapportData.message_analyse,
            })
            .eq("email", email);


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
            matching_score: resultatMatching.score_faisabilite,
            top_metiers: resultatMatching.top_metiers.slice(0, 3).map(m => ({
              titre: m.titre_fr, score: m.score_total, cnp: m.code_cnp
            })),
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