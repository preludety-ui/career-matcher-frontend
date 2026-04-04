import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const {
    candidat_prenom, candidat_nom, candidat_ville, candidat_role, candidat_experience,
    force1, force2, force3, offre_titre, offre_entreprise, offre_description, objectif_carriere
  } = await req.json()

  const prompt = `Génère une lettre de motivation en texte simple (pas de HTML) pour ${candidat_prenom} ${candidat_nom}, ${candidat_role}, visant le poste "${offre_titre}"${offre_entreprise ? ` chez ${offre_entreprise}` : ""} à ${candidat_ville}.

Expérience : ${candidat_experience || "non précisée"}
Forces révélées : ${[force1, force2, force3].filter(Boolean).join(", ")}
Objectif carrière : ${objectif_carriere || offre_titre}
${offre_description ? `Contexte offre : ${offre_description}` : ""}

Ton professionnel et humain. Maximum 250 mots.
Réponds UNIQUEMENT avec le texte de la lettre, sans balises HTML, sans markdown.`

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await res.json()
  const texte = data.content?.[0]?.text || ""
  const textePropre = texte
    .replace(/^```html\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  return NextResponse.json({ lettre: textePropre })
}