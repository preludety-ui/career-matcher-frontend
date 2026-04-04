import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email, score_propulse, score_cible_pct, scenario_objectif, verdict } = await req.json();

  const { error } = await supabase
    .from("candidats")
    .update({ score_propulse, score_cible_pct, scenario_objectif, verdict })
    .eq("email", email);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}