
import { NextRequest, NextResponse } from "next/server"
 
export async function POST(req: NextRequest) {
  const { candidat, mode, poste } = await req.json()
 
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Génère un CV Propulse en HTML compact pour ${candidat.prenom} ${candidat.nom}, ${candidat.titre}, visant "${poste}" à ${candidat.ville}.
 
Compétences révélées YELMA :
${(candidat.competences || []).map((c: {nom: string; pct: number}) => `- ${c.nom} (${c.pct}%)`).join('\n')}
 
Score Propulse : ${candidat.scorePropulse}/100
Score match avec ${poste} : ${candidat.scoreMatch}%
 
Style HTML : fond blanc, accentuation en #D85A30, typographie Georgia.
Inclure : nom/prénom, titre actuel → poste cible, compétences révélées avec barres visuelles (en HTML inline), score match affiché.
NE PAS inclure email/téléphone.
Réponds UNIQUEMENT avec le HTML, commence par <div style="font-family:Georgia,serif;padding:16px;">`
      }],
    }),
  })
 
  const data = await res.json()
  return NextResponse.json({ cv: data.content?.[0]?.text || "" })
}

 