import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

// Générer et envoyer un magic link
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    // Vérifier que le candidat existe
    const { data: candidat, error } = await supabaseAdmin
      .from("candidats")
      .select("email, prenom, nom, plan_choisi, trial_end")
      .eq("email", email)
      .single();

    if (error || !candidat) {
      return NextResponse.json({ error: "Aucun compte trouvé pour cet email" }, { status: 404 });
    }

    // Générer token unique
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Sauvegarder token dans Supabase
    await supabaseAdmin
      .from("candidats")
      .update({ magic_token: token, magic_token_expiry: expiry.toISOString() })
      .eq("email", email);

    // Envoyer email avec magic link
    const magicLink = `${process.env.NEXT_PUBLIC_URL || "https://yelma.ca"}/mon-espace?token=${token}`;

    // Utiliser Resend ou simple fetch vers API email
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "YELMA <noreply@yelma.ca>",
          to: email,
          subject: "Votre accès YELMA",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <div style="background: #1A1A2E; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FF7043; margin: 0; font-size: 28px;">YELMA</h1>
                <p style="color: #aaa; margin: 5px 0 0; font-size: 12px;">Votre conseiller carrière IA</p>
              </div>
              <p style="color: #1A1A2E;">Bonjour ${candidat.prenom} !</p>
              <p style="color: #555;">Cliquez sur le bouton ci-dessous pour accéder à votre espace personnel YELMA :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background: #FF7043; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Accéder à mon espace →
                </a>
              </div>
              <p style="color: #888; font-size: 12px;">Ce lien expire dans 30 minutes. Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
              <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px; text-align: center;">
                <p style="color: #aaa; font-size: 11px;">© 2026 YELMA Inc. — yelma.ca</p>
              </div>
            </div>
          `
        }),
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Continuer même si l'email échoue — retourner le lien pour les tests
    }

    console.log("MAGIC LINK:", magicLink); // Pour les tests
    return NextResponse.json({ 
      success: true, 
      message: "Lien envoyé à " + email,
      // Retourner le lien en dev pour faciliter les tests
      dev_link: process.env.NODE_ENV === "development" ? magicLink : undefined
    });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Vérifier le token et retourner les données du candidat
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

    const { data: candidat, error } = await supabaseAdmin
      .from("candidats")
      .select("*")
      .eq("magic_token", token)
      .single();

    if (error || !candidat) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
    }

    // Vérifier expiry
    if (new Date(candidat.magic_token_expiry) < new Date()) {
      return NextResponse.json({ error: "Lien expiré" }, { status: 401 });
    }

    // Invalider le token après usage
    await supabaseAdmin
      .from("candidats")
      .update({ magic_token: null, magic_token_expiry: null })
      .eq("email", candidat.email);

    // Calculer plan effectif
    const now = new Date();
    const trialEnd = new Date(candidat.trial_end || now);
    const isPropulse = candidat.plan_choisi === "propulse" || now < trialEnd;

    return NextResponse.json({
      success: true,
      candidat: {
        email: candidat.email,
        prenom: candidat.prenom,
        nom: candidat.nom,
        plan: isPropulse ? "propulse" : "decouverte",
        trial_end: candidat.trial_end,
        // Données rapport
        force1: candidat.force1, force1_desc: candidat.force1_desc,
        force2: candidat.force2, force2_desc: candidat.force2_desc,
        force3: candidat.force3, force3_desc: candidat.force3_desc,
        axe1: candidat.axe1, axe1_desc: candidat.axe1_desc,
        axe2: candidat.axe2, axe2_desc: candidat.axe2_desc,
        salaire_min: candidat.salaire_min,
        salaire_max: candidat.salaire_max,
        role_actuel: candidat.role_actuel,
        ville: candidat.ville,
        objectif_carriere: candidat.objectif_carriere,
        scenario_objectif: candidat.scenario_objectif,
        message_objectif: candidat.message_objectif,
        delai_objectif: candidat.delai_objectif,
        analyse_comparative: candidat.analyse_comparative,
        gps_an1: candidat.gps_an1,
        gps_an2: candidat.gps_an2,
        gps_an3: candidat.gps_an3,
        gps_an4: candidat.gps_an4,
        gps_an5: candidat.gps_an5,
        opportunites: candidat.opportunites,
        formations: candidat.formations,
        certifications: candidat.certifications,
        offres: candidat.offres,
        dernier_entretien: candidat.dernier_entretien,
      }
    });

  } catch (error) {
    console.error("Token verify error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


