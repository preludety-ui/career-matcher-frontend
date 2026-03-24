import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
  const exp = candidatInfo?.annee_experience || "";
  const niveauGPS = exp.includes("Plus de 10") ? "Manager → Directeur adjoint → Directeur → VP adjoint → VP"
    : exp.includes("6 à 10") ? "Senior confirmé → Lead → Manager → Directeur adjoint → Directeur"
    : exp.includes("3 à 5") ? "Intermédiaire senior → Senior → Senior confirmé → Lead → Manager"
    : exp.includes("1 à 2") ? "Junior confirmé → Intermédiaire → Intermédiaire senior → Senior → Lead"
    : "Assistant/Junior → Junior confirmé → Analyste/Intermédiaire débutant → Intermédiaire → Intermédiaire confirmé";

  const niveauOpportunites = exp.includes("Plus de 10") ? "Manager, Directeur, Executive"
    : exp.includes("6 à 10") ? "Senior, Manager"
    : exp.includes("3 à 5") ? "Intermédiaire, Senior débutant"
    : exp.includes("1 à 2") ? "Junior confirmé, début Intermédiaire"
    : "Assistant et Junior UNIQUEMENT";

  return `Tu es YELMA, conseiller de carrière expert.

PROFIL CONNU - NE JAMAIS REDEMANDER :
- Prénom: ${candidatInfo?.prenom || ""}
- Rôle: ${candidatInfo?.role_actuel || candidatInfo?.domaine_actuel || ""}
- Expérience: ${candidatInfo?.annee_experience || ""}
- Diplôme: ${candidatInfo?.diplome || ""} en ${candidatInfo?.domaine_etudes || ""}
- Ville: ${candidatInfo?.ville || "Montréal"}
- Statut: ${candidatInfo?.statut_emploi || ""}
- Objectif déclaré: ${candidatInfo?.objectif_declare || ""}
- Fourchette salariale: ${candidatInfo?.salaire_min || 40000}$ — ${candidatInfo?.salaire_max || 60000}$

RÈGLES STRICTES :
1. NE JAMAIS redemander les infos du profil
2. NE JAMAIS répéter ce que le candidat dit
3. UNE seule question courte par échange (max 1 phrase)
4. Après 5 échanges : générer le rapport final COMPLET immédiatement
5. JAMAIS de "je vais générer" ou "voici votre rapport" — l'écrire directement
6. ZÉRO mention de pays dans le rapport
7. Si les réponses sont trop courtes, poser une question de relance pour obtenir plus de détails concrets avant de générer le rapport
8. Les compétences DOIVENT être opérationnelles et précises — format "Verbe + objet + contexte" ex: "Analyse des écarts budgétaires via Power BI", "Coordination inter-équipes pour livraison de jalons"
9. INTERDIT : compétences vagues comme "Gestion de projet", "Communication", "Leadership"

PREMIER MESSAGE : Saluer ${candidatInfo?.prenom || ""} et demander directement une réalisation concrète liée à son rôle de ${candidatInfo?.role_actuel || ""}.

RAPPORT FINAL après 5 échanges — écrire directement sans introduction :

TES 3 COMPÉTENCES CLÉS

1. **[Compétence opérationnelle]**
[Description 1 phrase max]

2. **[Compétence opérationnelle]**
[Description 1 phrase max]

3. **[Compétence opérationnelle]**
[Description 1 phrase max]

OPPORTUNITÉS (niveau ${niveauOpportunites} UNIQUEMENT)

1. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

2. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

3. **[Titre]** — [Salaire]$ CAD/an
[Description 5 mots max]

GPS YELMA — progression réaliste: ${niveauGPS}

An 1: [Titre] | [Salaire] | [Action courte]
An 2: [Titre] | [Salaire supérieur An1] | [Action courte]
An 3: [Titre] | [Salaire supérieur An2] | [Action courte]
An 4: [Titre] | [Salaire supérieur An3] | [Action courte]
An 5: [Titre] | [Salaire supérieur An4] | [Action courte]

GPS OBJECTIF (${candidatInfo?.objectif_declare || "selon aspirations"})

An 1: [Titre] | [Salaire] | [Action courte]
An 2: [Titre] | [Salaire supérieur An1] | [Action courte]
An 3: [Titre] | [Salaire supérieur An2] | [Action courte]
An 4: [Titre] | [Salaire supérieur An3] | [Action courte]
An 5: [Titre] | [Salaire supérieur An4] | [Action courte]

ANALYSE: [1 phrase HONNÊTE et RÉALISTE — si objectif irréaliste en 5 ans avec cette expérience, le dire clairement avec le délai réel estimé]

FORMATIONS
1. [Nom] | [Type: Certification/Formation/Mentorat/Événement/Diplôme] | [Plateforme] | [Durée]
2. [Nom] | [Type] | [Plateforme] | [Durée]

CERTIFICATIONS
1. [Nom] | [Organisme]
2. [Nom] | [Organisme]

[1 phrase encourageante finale]`;
}

function buildExtractionPrompt(rapport: string, candidatInfo: {
  salaire_min?: number;
  salaire_max?: number;
  role_actuel?: string;
  ville?: string;
  annee_experience?: string;
  diplome?: string;
  objectif_declare?: string;
}) {
  return `Extrait les données de ce rapport YELMA et retourne UNIQUEMENT ce JSON valide sans backticks:

${rapport}

Format JSON attendu:
{
  "niveau": "UNIVERSITAIRE ou TECHNIQUE ou AUTODIDACTE ou JUNIOR",
  "force1": "compétence 1",
  "force2": "compétence 2", 
  "force3": "compétence 3",
  "opportunites": [
    {"titre": "...", "salaire": 62000, "description": "..."},
    {"titre": "...", "salaire": 72000, "description": "..."},
    {"titre": "...", "salaire": 82000, "description": "..."}
  ],
  "salaire_min": ${candidatInfo.salaire_min || 40000},
  "salaire_max": ${candidatInfo.salaire_max || 60000},
  "role_actuel": "${candidatInfo.role_actuel || ""}",
  "ville": "${candidatInfo.ville || "Montréal"}",
  "objectif_declare": "${candidatInfo.objectif_declare || ""}",
  "an1": {"titre": "NIVEAU JUNIOR selon experience - ex: Assistant/Junior confirmé", "salaire": 62000, "action": "action courte"},
  "an2": {"titre": "NIVEAU Junior confirmé/Intermédiaire débutant", "salaire": 70000, "action": "action courte"},
  "an3": {"titre": "NIVEAU Intermédiaire", "salaire": 78000, "action": "action courte"},
  "an4": {"titre": "NIVEAU Intermédiaire senior", "salaire": 87000, "action": "action courte"},
  "an5": {"titre": "NIVEAU Senior débutant MAX - JAMAIS Directeur avec moins 2 ans exp", "salaire": 96000, "action": "action courte"},
  "obj_an1": {"titre": "...", "salaire": 62000, "action": "..."},
  "obj_an2": {"titre": "...", "salaire": 72000, "action": "..."},
  "obj_an3": {"titre": "...", "salaire": 82000, "action": "..."},
  "obj_an4": {"titre": "...", "salaire": 94000, "action": "..."},
  "obj_an5": {"titre": "...", "salaire": 108000, "action": "..."},
  "analyse": "HONNÊTE: si Directeur avec moins 2 ans exp → dire explicitement irréaliste en 5 ans, délai réel 10-12 ans",
  "formations": [
    {"nom": "...", "type": "Certification", "plateforme": "...", "duree": "..."},
    {"nom": "...", "type": "Formation", "plateforme": "...", "duree": "..."}
  ],
  "certifications": [
    {"nom": "...", "organisme": "..."}
  ]
}

RÈGLES ABSOLUES pour les salaires:
- Chaque année DOIT être supérieure à la précédente — OBLIGATOIRE
- An1 YELMA doit être >= ${(candidatInfo.salaire_max || 60000) + 2000}
- An1 OBJECTIF doit être >= ${(candidatInfo.salaire_max || 60000) + 1000}
- Progression réaliste de 8-15% par an
- obj_an5 NE PEUT PAS être 0 — mettre un chiffre réaliste TOUJOURS
- Si objectif irréaliste en 5 ans: obj_an5 = étape intermédiaire réaliste (pas le titre final)
- Analyse HONNÊTE : si Directeur avec moins de 2 ans exp → dire "difficile à atteindre en 5 ans, viser plutôt [poste intermédiaire] — compter 10-12 ans"
- Niveau GPS selon expérience:
  * Moins 1 an: An1=Assistant/Junior, An2=Junior confirmé, An3=Intermédiaire débutant, An4=Intermédiaire, An5=Intermédiaire confirmé
  * 1-2 ans: An1=Junior confirmé, An2=Intermédiaire, An3=Intermédiaire senior, An4=Senior débutant, An5=Senior
  * 3-5 ans: An1=Intermédiaire senior, An2=Senior, An3=Senior confirmé, An4=Lead, An5=Manager
  * 6-10 ans: An1=Senior confirmé, An2=Lead, An3=Manager, An4=Directeur adjoint, An5=Directeur
  * Plus 10 ans: An1=Manager, An2=Directeur adjoint, An3=Directeur, An4=VP adjoint, An5=VP
`;}

function parseExtractedData(json: object) {
  const d = json as Record<string, unknown>;
  const parseGPS = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const g = obj as Record<string, unknown>;
    return { titre: String(g.titre || ""), salaire: Number(g.salaire || 0), action: String(g.action || "") };
  };

  const opportunites = Array.isArray(d.opportunites) ? d.opportunites.map((o: unknown) => {
    const op = o as Record<string, unknown>;
    return { titre: String(op.titre || ""), salaire: Number(op.salaire || 0), description: String(op.description || "") };
  }) : [];

  const formations = Array.isArray(d.formations) ? d.formations.map((f: unknown) => {
    const fm = f as Record<string, unknown>;
    return { nom: String(fm.nom || ""), type: String(fm.type || "Formation"), plateforme: String(fm.plateforme || ""), duree: String(fm.duree || "") };
  }) : [];

  const certifications = Array.isArray(d.certifications) ? d.certifications.map((c: unknown) => {
    const ct = c as Record<string, unknown>;
    return { nom: String(ct.nom || ""), organisme: String(ct.organisme || "") };
  }) : [];

  return {
    niveau_education: String(d.niveau || "JUNIOR"),
    force1: String(d.force1 || ""),
    force2: String(d.force2 || ""),
    force3: String(d.force3 || ""),
    salaire_min: Number(d.salaire_min || 40000),
    salaire_max: Number(d.salaire_max || 60000),
    role_actuel: String(d.role_actuel || ""),
    ville: String(d.ville || "Montréal"),
    objectif_declare: String(d.objectif_declare || ""),
    analyse_comparative: String(d.analyse || ""),
    gps_an1: parseGPS(d.an1),
    gps_an2: parseGPS(d.an2),
    gps_an3: parseGPS(d.an3),
    gps_an4: parseGPS(d.an4),
    gps_an5: parseGPS(d.an5),
    obj_an1: parseGPS(d.obj_an1),
    obj_an2: parseGPS(d.obj_an2),
    obj_an3: parseGPS(d.obj_an3),
    obj_an4: parseGPS(d.obj_an4),
    obj_an5: parseGPS(d.obj_an5),
    opportunites,
    formations,
    certifications,
  };
}

function isRapportFinal(text: string): boolean {
  const hasCompetences = text.includes("TES 3 COMPÉTENCES") || text.includes("COMPÉTENCES CLÉS");
  const hasGPS = text.includes("GPS YELMA") || text.includes("An 1:");
  const hasFormations = text.includes("FORMATIONS") || text.includes("CERTIFICATIONS");
  return hasCompetences && hasGPS && hasFormations;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, lang, email, nom, prenom, candidatInfo } = body;

    // Appel 1 — Conversation normale
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

    // Appel 2 — Extraction des données si rapport final détecté
    if (isRapportFinal(reply) && email) {
      console.log("EXTRACTING DATA FROM RAPPORT...");
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
          const rapportData = parseExtractedData(parsed);

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
              objectif_carriere: candidatInfo?.objectif_declare,
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
