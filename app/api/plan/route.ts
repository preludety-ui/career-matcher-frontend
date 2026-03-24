import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export function calculerPlanEffectif(candidat: {
  plan: string;
  plan_choisi: string;
  trial_end: string;
}) {
  const now = new Date();
  const trialEnd = new Date(candidat.trial_end);
  const enPeriodeEssai = now <= trialEnd;

  // Pendant l'essai gratuit → toujours Propulse
  if (enPeriodeEssai) return "propulse";

  // Après l'essai
  const planPaye = candidat.plan;

  if (planPaye === "propulse" || planPaye === "propulse_annuel") {
    return "propulse";
  }

  // Pas payé → Découverte
  return "decouverte";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("candidats")
      .select("plan, plan_choisi, trial_start, trial_end")
      .eq("email", email)
      .single();

    if (error || !data) {
      // Nouveau candidat — trial démarre maintenant
      return NextResponse.json({ plan_effectif: "propulse", nouveau: true });
    }

    const plan_effectif = calculerPlanEffectif(data);

    // Mettre à jour trial_start si pas encore défini
    if (!data.trial_start) {
      await supabaseAdmin
        .from("candidats")
        .update({
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("email", email);
    }

    return NextResponse.json({
      plan_effectif,
      trial_end: data.trial_end,
      plan_paye: data.plan,
      en_essai: new Date() <= new Date(data.trial_end),
    });

  } catch (error) {
    console.error("Plan error:", error);
    return NextResponse.json({ plan_effectif: "propulse" });
  }
}
