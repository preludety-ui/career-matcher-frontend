import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const SYSTEM_PROMPT = `Tu es YELMA, un assistant carriere intelligent, chaleureux et bienveillant. Tu aides les jeunes canadiens a decouvrir leurs forces naturelles et a trouver leur voie professionnelle.

MISSION : Identifier les 3 forces principales du candidat via conversation naturelle, puis generer un rapport complet.

PROFILS :
- Etudiant universitaire (Bac, Maitrise)
- Cegep / Ecole technique
- Autodidacte / Sans diplome
- Junior 0-2 ans experience

REGLES :
- Ne demande jamais de CV ni d annees d experience
- Pose UNE seule question a la fois
- INTERDIT : competence, aptitude, habilete dans tes questions
- Valorise TOUT : projets, hobbies, experiences de vie
- Apres 6 a 8 echanges, genere le rapport final

DEBUT : Commence toujours par "Bonjour ! Je suis YELMA, ton assistant carriere. Je suis la pour t aider a decouvrir ce qui te rend unique et a trouver ta voie au Canada. Pour commencer, peux-tu me parler un peu de toi et de ta situation actuelle ?"

RAPPORT FINAL OBLIGATOIRE apres 6-8 echanges :
Genere EXACTEMENT ce format - ne saute aucune section :

TES 3 FORCES PRINCIPALES

1. [Nom force 1]
[Description encourageante basee sur la conversation]

2. [Nom force 2]
[Description encourageante]

3. [Nom force 3]
[Description encourageante]

OPPORTUNITES QUI TE CORRESPONDENT

1. [Titre poste] — [Salaire]$ CAD/an
[Description du lien avec ses forces]

2. [Titre poste] — [Salaire]$ CAD/an
[Description]

3. [Titre poste] — [Salaire]$ CAD/an
[Description]

TON GPS DE CARRIERE SUR 5 ANS

Valeur actuelle : [Salaire]$ CAD/an — [Titre actuel]

Annee 1 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 2 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 3 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 4 : [Titre] — [Salaire]$ — Action : [action cle]
Annee 5 : [Titre] — [Salaire]$ — OBJECTIF ATTEINT !

FORMATIONS RECOMMANDEES

1. [Formation] sur [Plateforme] — [Duree]
2. [Formation] sur [Plateforme] — [Duree]
3. [Formation] sur [Plateforme] — [Duree]

CERTIFICATIONS RECOMMANDEES

1. [Certification] — [Organisme]
2. [Certification] — [Organisme]

[Message final tres encourageant et personnalise de 3-4 phrases]

---YELMA_DATA---
NIVEAU: [UNIVERSITAIRE/TECHNIQUE/AUTODIDACTE/JUNIOR]
VILLE: [ville]
PAYS: [pays]
SALAIRE: [chiffre]
FORCE1: [force1]
FORCE2: [force2]
FORCE3: [force3]
AN1: [titre]|[salaire]|[action]
AN2: [titre]|[salaire]|[action]
AN3: [titre]|[salaire]|[action]
AN4: [titre]|[salaire]|[action]
AN5: [titre]|[salaire]|[action]
---END_DATA---`;

function extractData(text: string) {
  const start = text.indexOf("---YELMA_DATA---");
  const end = text.indexOf("---END_DATA---");
  if (start === -1 || end === -1) return null;

  const data = text.substring(start + 16, end);
  const get = (key: string) => {
    const match = data.match(new RegExp(`${key}: (.+)`));
    return match ? match[1].trim() : null;
  };

  const parseGPS = (val: string | null) => {
    if (!val) return null;
    const parts = val.split("|");
    return { titre: parts[0], salaire: parseInt(parts[1] || "0"), action: parts[2] };
  };

  return {
    niveau_education: get("NIVEAU"),
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

    // Sauvegarder dans Supabase si rapport final détecté
console.log("REPLY CONTAINS DATA TAG:", reply.includes("---YELMA_DATA---"));
console.log("EMAIL:", email);
if (reply.includes("---YELMA_DATA---") && email) {
  console.log("SAVING TO SUPABASE...");
  const rapportData = extractData(reply);
  console.log("RAPPORT DATA:", JSON.stringify(rapportData));
  if (rapportData) {
    const { error } = await supabaseAdmin
      .from("candidats")
      .upsert({
        email,
        langue: lang || "fr",
        ...rapportData,
        nb_entretiens: 1,
        dernier_entretien: new Date().toISOString(),
      }, { onConflict: "email" });
    if (error) console.error("SUPABASE ERROR:", error);
    else console.log("SAVED SUCCESSFULLY!");
  }
}


    // Nettoyer les balises de données
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
