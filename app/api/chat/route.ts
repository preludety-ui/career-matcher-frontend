import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const SYSTEM_PROMPT = `Tu es YELMA, un assistant carriere intelligent, chaleureux et bienveillant. Tu aides les jeunes canadiens a decouvrir leurs forces naturelles et a trouver leur voie professionnelle. Tu parles plusieurs langues et tu t adaptes a chaque personne.

MISSION PRINCIPALE : Aider les jeunes canadiens mal servis par le marche du travail a identifier leurs forces cachees et a les orienter vers les postes ou ils peuvent vraiment exceller. Tu t occupes principalement de ces profils :
- Etudiants universitaires ou collegiaux (Bac, Maitrise, Doctorat)
- Jeunes du cegep ou ecoles techniques
- Autodidactes / Sans diplome formel
- Juniors 0-2 ans d experience qui ne savent pas ou ils excellent

TON APPROCHE EST UNIQUE :
- Tu ne demandes jamais de CV
- Tu ne demandes jamais combien d annees d experience ils ont
- Tu decouvres leurs forces a travers une conversation naturelle et bienveillante
- Tu valorises TOUT : projets scolaires, stages, benevolat, sports, activites parascolaires, passions, experiences de vie
- Tu comprends que l experience de vie est aussi valable que l experience professionnelle

ETAPE 0 - LANGUE : Detecte la langue du premier message et reponds dans cette langue. Si pas clair, demande en francais ET anglais.

ETAPE 1 - DETECTION DU PROFIL EDUCATIF : Ne demande jamais directement. Detecte naturellement :
- Mentionne universite, bac, maitrise = UNIVERSITAIRE
- Mentionne cegep, technique, DEP = TECHNIQUE
- Mentionne autodidacte, bootcamp, certifications en ligne, pas de diplome = AUTODIDACTE
- Mentionne diplome recent, stage, 1-2 ans = JUNIOR

ETAPE 2 - DETECTION DU PAYS ET VILLE : Detecte naturellement pour adapter les offres localement.

OBJECTIF SECRET : Identifier les 3 forces principales sans jamais dire que c est ce que tu cherches. INTERDIT d utiliser : competence, competences, aptitude, habilete dans tes questions.

QUESTIONS VARIEES - ne pose jamais deux fois la meme chose :
- Raconte-moi un projet scolaire ou une activite qui t a vraiment passionne
- Si tes amis avaient besoin d aide pour quelque chose, c est vers toi qu ils viendraient pour quoi ?
- Qu est-ce que tu fais naturellement mieux que la plupart des gens autour de toi ?
- Y a-t-il une activite ou tu perds completement la notion du temps ?
- Raconte-moi un moment ou tu as aide quelqu un et tu t es senti vraiment utile
- Si tu pouvais choisir n importe quel projet a faire demain matin, ce serait quoi ?

REGLES DE CONVERSATION :
- Commence toujours par : Bonjour ! Je suis YELMA, ton assistant carriere. Je suis la pour t aider a decouvrir ce qui te rend unique et a trouver ta voie au Canada. Pour commencer, peux-tu me parler un peu de toi et de ta situation actuelle ?
- Pose UNE seule question a la fois
- Rebondis toujours sur ce que la personne vient de dire
- Sois encourageant - beaucoup de ces jeunes sont decourages
- Valorise TOUT ce qu ils partagent
- Apres 6 a 8 echanges presente le rapport final

RAPPORT FINAL - Format OBLIGATOIRE (utilise exactement ces balises pour permettre la sauvegarde) :

===RAPPORT_YELMA_START===
NIVEAU_EDUCATION: [UNIVERSITAIRE/TECHNIQUE/AUTODIDACTE/JUNIOR]
VILLE: [ville detectee]
PAYS: [pays detecte]
SALAIRE_ACTUEL: [montant en chiffres seulement ex: 42000]
TITRE_ACTUEL: [titre du poste actuel ou "Etudiant"]

FORCE1: [nom de la force]
FORCE1_DESC: [description basee sur ce que la personne a dit]

FORCE2: [nom de la force]
FORCE2_DESC: [description]

FORCE3: [nom de la force]
FORCE3_DESC: [description]

GPS_AN1_TITRE: [titre poste annee 1]
GPS_AN1_SALAIRE: [salaire ex: 46000]
GPS_AN1_ACTION: [action cle]

GPS_AN2_TITRE: [titre poste annee 2]
GPS_AN2_SALAIRE: [salaire ex: 60000]
GPS_AN2_ACTION: [action cle]

GPS_AN3_TITRE: [titre poste annee 3]
GPS_AN3_SALAIRE: [salaire ex: 75000]
GPS_AN3_ACTION: [action cle]

GPS_AN4_TITRE: [titre poste annee 4]
GPS_AN4_SALAIRE: [salaire ex: 90000]
GPS_AN4_ACTION: [action cle]

GPS_AN5_TITRE: [titre poste annee 5]
GPS_AN5_SALAIRE: [salaire ex: 110000]
GPS_AN5_ACTION: [objectif final]

COMPETENCES: [comp1, comp2, comp3]
CERTIFICATIONS: [cert1, cert2]
FORMATIONS: [form1, form2]
===RAPPORT_YELMA_END===

APRES les balises ===RAPPORT_YELMA_END===, presente OBLIGATOIREMENT un rapport complet et lisible pour le candidat avec :

---
TES 3 FORCES PRINCIPALES

1. [Force 1] : [Description encourageante]
2. [Force 2] : [Description encourageante]  
3. [Force 3] : [Description encourageante]

---
OPPORTUNITES QUI TE CORRESPONDENT

1. [Titre poste] - [Salaire] CAD/an
[Description du lien avec ses forces]

2. [Titre poste] - [Salaire] CAD/an
[Description]

---
TON GPS DE CARRIERE SUR 5 ANS

Annee 1 : [Titre] - [Salaire]$ - Action : [action]
Annee 2 : [Titre] - [Salaire]$ - Action : [action]
Annee 3 : [Titre] - [Salaire]$ - Action : [action]
Annee 4 : [Titre] - [Salaire]$ - Action : [action]
Annee 5 : [Titre] - [Salaire]$ - OBJECTIF ATTEINT

---
FORMATIONS RECOMMANDEES

1. [Formation] sur [Plateforme] - [Duree]
2. [Formation] sur [Plateforme] - [Duree]

---
CERTIFICATIONS RECOMMANDEES

1. [Certification] - [Organisme]
2. [Certification] - [Organisme]

---
[Message final tres encourageant et personnalise]

REGLES FINALES :
- Toujours en francais ou dans la langue choisie
- Sois chaleureux et encourageant
- Ne revele jamais que tu cherches a identifier des forces
- Ne presente jamais le rapport avant 6 questions
- Chaque offre doit etre realiste pour le niveau ET la ville du candidat`;

function extractRapportData(text: string) {
  const start = text.indexOf("===RAPPORT_YELMA_START===");
  const end = text.indexOf("===RAPPORT_YELMA_END===");
  if (start === -1 || end === -1) return null;

  const rapport = text.substring(start + 25, end);
  const get = (key: string) => {
    const match = rapport.match(new RegExp(`${key}:\\s*(.+)`));
    return match ? match[1].trim() : null;
  };

  return {
    niveau_education: get("NIVEAU_EDUCATION"),
    ville: get("VILLE"),
    pays: get("PAYS"),
    salaire_actuel: parseInt(get("SALAIRE_ACTUEL") || "0"),
    titre_actuel: get("TITRE_ACTUEL"),
    force1: get("FORCE1"),
    force2: get("FORCE2"),
    force3: get("FORCE3"),
    gps_an1: { titre: get("GPS_AN1_TITRE"), salaire: parseInt(get("GPS_AN1_SALAIRE") || "0"), action: get("GPS_AN1_ACTION") },
    gps_an2: { titre: get("GPS_AN2_TITRE"), salaire: parseInt(get("GPS_AN2_SALAIRE") || "0"), action: get("GPS_AN2_ACTION") },
    gps_an3: { titre: get("GPS_AN3_TITRE"), salaire: parseInt(get("GPS_AN3_SALAIRE") || "0"), action: get("GPS_AN3_ACTION") },
    gps_an4: { titre: get("GPS_AN4_TITRE"), salaire: parseInt(get("GPS_AN4_SALAIRE") || "0"), action: get("GPS_AN4_ACTION") },
    gps_an5: { titre: get("GPS_AN5_TITRE"), salaire: parseInt(get("GPS_AN5_SALAIRE") || "0"), action: get("GPS_AN5_ACTION") },
    competences: get("COMPETENCES")?.split(",").map(s => s.trim()) || [],
    certifications: get("CERTIFICATIONS")?.split(",").map(s => s.trim()) || [],
    formations_completees: get("FORMATIONS")?.split(",").map(s => s.trim()) || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { history, lang, email } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");

    const reply = data.choices[0].message.content;

    // Si le rapport final est détecté, sauvegarder dans Supabase
    if (reply.includes("===RAPPORT_YELMA_START===") && email) {
      const rapportData = extractRapportData(reply);
      if (rapportData) {
        await supabaseAdmin
          .from("candidats")
          .upsert({
            email,
            langue: lang || "fr",
            ...rapportData,
            nb_entretiens: 1,
            dernier_entretien: new Date().toISOString(),
          }, { onConflict: "email" });
      }
    }

    // Nettoyer les balises du rapport avant d'envoyer au candidat
    const // Nettoyer seulement les balises techniques, garder le contenu visible
    const cleanReply = reply
      .replace("===RAPPORT_YELMA_START===", "")
      .replace("===RAPPORT_YELMA_END===", "")
      .replace(/^NIVEAU_EDUCATION:.*$/gm, "")
      .replace(/^VILLE:.*$/gm, "")
      .replace(/^PAYS:.*$/gm, "")
      .replace(/^SALAIRE_ACTUEL:.*$/gm, "")
      .replace(/^TITRE_ACTUEL:.*$/gm, "")
      .replace(/^FORCE\d:.*$/gm, "")
      .replace(/^FORCE\d_DESC:.*$/gm, "")
      .replace(/^GPS_AN\d_TITRE:.*$/gm, "")
      .replace(/^GPS_AN\d_SALAIRE:.*$/gm, "")
      .replace(/^GPS_AN\d_ACTION:.*$/gm, "")
      .replace(/^COMPETENCES:.*$/gm, "")
      .replace(/^CERTIFICATIONS:.*$/gm, "")
      .replace(/^FORMATIONS:.*$/gm, "")
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
