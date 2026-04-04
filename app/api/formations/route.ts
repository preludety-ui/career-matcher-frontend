import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DIPLOME_TO_NIVEAU: Record<string, string[]> = {
  'Doctorat (PhD)': ['expert', 'avance', 'intermediaire'],
  'Maîtrise / MBA': ['avance', 'intermediaire'],
  'Baccalauréat': ['avance', 'intermediaire'],
  'DEC / Cégep': ['intermediaire', 'debutant'],
  'DEP / Formation technique': ['intermediaire', 'debutant'],
  'Diplôme secondaire': ['debutant'],
  'Autodidacte / Sans diplôme': ['debutant'],
};

const CNP_TO_CATEGORIE: Record<string, string> = {
  '3012': 'soins_infirmiers',
  '0311': 'gestion_sante',
  '2174': 'technologie',
  '2175': 'technologie',
  '1111': 'finance',
  '0111': 'leadership',
  '0112': 'rh',
  '0114': 'leadership',
  '0213': 'gestion_projet',
  '7241': 'construction',
  '7251': 'construction',
  '7237': 'construction',
  '7321': 'mecanique',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cnp = searchParams.get("cnp");
    const diplome = searchParams.get("diplome") || 'Baccalauréat';
    const domaine = searchParams.get("domaine");

    const niveaux = DIPLOME_TO_NIVEAU[diplome] || ['intermediaire', 'debutant'];
    const categorie = domaine || (cnp ? CNP_TO_CATEGORIE[cnp] : null);

    let query = supabaseAdmin
      .from("formations")
      .select("*")
      .eq("actif", true)
      .eq("url_active", true)
      .in("niveau", niveaux)
      .order("badge_urgent", { ascending: false })
      .order("priorite_affichage", { ascending: true })
      .limit(6);

    if (cnp) {
      query = query.contains("cnp_cibles", [cnp]);
    } else if (categorie) {
      query = query.eq("categorie", categorie);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, formations: data || [] });
  } catch (error) {
    console.error("Formations API error:", error);
    return NextResponse.json({ error: "Erreur formations" }, { status: 500 });
  }
}