import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { poste_actuel, poste_cible, ville, annee_arrivee } = await req.json();

        // Chercher données réelles dans Supabase market_data
        const { data: dataActuel } = await supabaseAdmin
            .from("market_data")
            .select("*")
            .ilike("poste", `%${poste_actuel}%`)
            .eq("ville", ville || "Montréal")
            .single();

        const { data: dataCible } = await supabaseAdmin
            .from("market_data")
            .select("*")
            .ilike("poste", `%${poste_cible}%`)
            .eq("ville", ville || "Montréal")
            .single();

        const anneeActuelle = new Date().getFullYear();

        // Générer projection 5 ans basée sur score réel ou estimation
        const scoreActuel = Math.min(80, dataActuel?.score_marche || 60);
        const scoreCible = Math.min(75, dataCible?.score_marche || 45);

        // Taux de croissance annuel
        const tauxActuel = 0.01; // stable +1%/an
        const tauxCible = 0.05;  // en croissance +5%/an

        const annees = Array.from({ length: 6 }, (_, i) => anneeActuelle + i);

        const courbeActuel = annees.map((_, i) =>
            Math.round(scoreActuel * Math.pow(1 + tauxActuel, i))
        );

        const courbeCible = annees.map((_, i) =>
            Math.round(scoreCible * Math.pow(1 + tauxCible, i))
        );

        // Année d'arrivée de Sophie selon son GPS
        const anneeArrivee = anneeActuelle + (annee_arrivee || 5);

        return NextResponse.json({
            success: true,
            annees,
            courbe_actuel: courbeActuel,
            courbe_cible: courbeCible,
            annee_arrivee: anneeArrivee,
            poste_actuel: poste_actuel,
            poste_cible: poste_cible,
            score_actuel: scoreActuel,
            score_cible: scoreCible,
            tendance_actuel: dataActuel?.tendance || "stable",
            tendance_cible: dataCible?.tendance || "en croissance",
            nb_offres_actuel: dataActuel?.nb_offres || 0,
            nb_offres_cible: dataCible?.nb_offres || 0,
            source_reelle: !!(dataActuel || dataCible),
        });

    } catch (error) {
        console.error("Market trend error:", error);
        return NextResponse.json({ error: "Erreur tendance marché" }, { status: 500 });
    }
}