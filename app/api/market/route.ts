import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function fetchMarketData() {
  const prompt = `Tu es un expert du marché du travail canadien. Recherche les données les plus récentes et retourne UNIQUEMENT un JSON valide sans backticks ni markdown, avec exactement ce format:
{
  "taux_chomage": "XX.X%",
  "salaire_junior": "XXK$",
  "postes_tech": "+XX%",
  "competences": ["compétence1", "compétence2", "compétence3", "compétence4", "compétence5"],
  "secteurs": [
    {"nom": "Technologie & IA", "niveau": "Très fort", "pourcentage": 90},
    {"nom": "Santé & Services", "niveau": "Fort", "pourcentage": 75},
    {"nom": "Finance & Comptabilité", "niveau": "Modéré", "pourcentage": 65},
    {"nom": "Marketing & Communication", "niveau": "Modéré", "pourcentage": 60}
  ],
  "technologies": ["tech1", "tech2", "tech3", "tech4", "tech5", "tech6"],
  "conseil": "Un conseil actionnable en 1-2 phrases pour les jeunes canadiens en 2026"
}

Données à rechercher pour le Canada en 2026:
- Taux de chômage actuel des jeunes de 15-24 ans
- Salaire moyen junior (0-2 ans expérience)
- Croissance des postes tech
- Top 5 compétences les plus demandées
- Secteurs qui recrutent le plus
- Technologies qui montent
- Un conseil pour les jeunes`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  
  // Extraire le texte de la réponse
  const textContent = data.content?.find((c: {type: string}) => c.type === "text");
  if (!textContent) throw new Error("Pas de réponse texte");
  
  // Parser le JSON
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON valide");
  
  return JSON.parse(jsonMatch[0]);
}

export async function GET() {
  try {
    // Vérifier si les données ont été mises à jour aujourd'hui
    const today = new Date().toISOString().split("T")[0];
    
    const { data: existing } = await supabaseAdmin
      .from("market_data")
      .select("*")
      .gte("updated_at", `${today}T00:00:00`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    // Si données d'aujourd'hui existent, les retourner
    if (existing) {
      console.log("Market data from cache");
      return NextResponse.json({ data: existing, source: "cache" });
    }

    // Sinon, récupérer les nouvelles données via GPT + web search
    console.log("Fetching fresh market data...");
    const marketData = await fetchMarketData();

    // Sauvegarder dans Supabase
    const { data: saved, error } = await supabaseAdmin
      .from("market_data")
      .insert({
        taux_chomage: marketData.taux_chomage,
        salaire_junior: marketData.salaire_junior,
        postes_tech: marketData.postes_tech,
        competences: marketData.competences,
        secteurs: marketData.secteurs,
        technologies: marketData.technologies,
        conseil: marketData.conseil,
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Market data saved successfully!");
    return NextResponse.json({ data: saved, source: "fresh" });

  } catch (error) {
    console.error("Market data error:", error);
    
    // Fallback avec données statiques si erreur
    return NextResponse.json({
      data: {
        taux_chomage: "14.1%",
        salaire_junior: "42K$",
        postes_tech: "+23%",
        competences: ["IA & Machine Learning", "Python", "Analyse de données", "Communication", "Cloud AWS"],
        secteurs: [
          { nom: "Technologie & IA", niveau: "Très fort", pourcentage: 90 },
          { nom: "Santé & Services", niveau: "Fort", pourcentage: 75 },
          { nom: "Finance & Comptabilité", niveau: "Modéré", pourcentage: 65 },
        ],
        technologies: ["ChatGPT & LLMs", "Power BI", "Cybersécurité", "React / Next.js", "SQL avancé", "Figma / UX"],
        conseil: "Les employeurs canadiens cherchent des jeunes qui savent utiliser l'IA. Une certification IA augmente tes chances de 40% !"
      },
      source: "fallback"
    });
  }
}
