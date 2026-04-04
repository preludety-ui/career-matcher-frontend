import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ProfilPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: link } = await supabase
    .from("profil_links")
    .select("*")
    .eq("token", token)
    .eq("active", true)
    .single();

  if (!link) return notFound();

  await supabase
    .from("profil_links")
    .update({ views: (link.views || 0) + 1 })
    .eq("id", link.id);

  const { data: candidat } = await supabase
    .from("candidats")
    .select("*")
    .eq("email", link.candidat_id)
    .single();

  if (!candidat) return notFound();

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 16px", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "12px", color: "#FF7043", fontWeight: 700, marginBottom: "8px" }}>PROFIL YELMA PROPULSE</div>
        <h1 style={{ fontSize: "28px", color: "#1A1A2E", margin: "0 0 4px" }}>{candidat.prenom} {candidat.nom}</h1>
        <div style={{ fontSize: "16px", color: "#666" }}>{candidat.role_actuel}</div>
        <div style={{ fontSize: "13px", color: "#888" }}>{candidat.ville}</div>
      </div>

      <div style={{ background: "#F1EFE8", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>⚡ SCORE PROPULSE</div>
        <div style={{ fontSize: "48px", fontWeight: 700, color: "#FF7043" }}>{candidat.score_propulse}</div>
        <div style={{ fontSize: "12px", color: "#888" }}>/ 100 — {candidat.verdict || "Profil évalué par YELMA"}</div>
      </div>

      {candidat.force1 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "0.5px solid #E8E8F0", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>💪 FORCES RÉVÉLÉES</div>
          {[
            [candidat.force1, candidat.force1_desc],
            [candidat.force2, candidat.force2_desc],
            [candidat.force3, candidat.force3_desc],
          ].filter(([f]) => f).map(([force, desc], i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{force}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", marginTop: "32px" }}>
        Profil généré par YELMA • Lien sécurisé
      </div>
    </div>
  );
}