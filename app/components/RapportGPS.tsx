"use client";

import { useEffect, useRef, useState } from "react";

type GPS = {
  titre: string;
  salaire: number;
  action: string;
};

type Opportunite = {
  titre: string;
  salaire: number;
  description: string;
};

type Formation = {
  nom: string;
  type: string;
  plateforme: string;
  duree: string;
};

type Certification = {
  nom: string;
  organisme: string;
};

type RapportData = {
  force1?: string; force1_desc?: string;
  force2?: string; force2_desc?: string;
  force3?: string; force3_desc?: string;
  salaire_min?: number;
  salaire_max?: number;
  role_actuel?: string;
  ville?: string;
  objectif_carriere?: string;
  scenario_objectif?: number;
  message_objectif?: string;
  delai_objectif?: string;
  axe1?: string; axe1_desc?: string;
  axe2?: string; axe2_desc?: string;
  analyse_comparative?: string;
  opportunites?: Opportunite[];
  gps_an1?: GPS; gps_an2?: GPS; gps_an3?: GPS; gps_an4?: GPS; gps_an5?: GPS;
  formations?: Formation[];
  certifications?: Certification[];
  message_final?: string;
};

export function parseRapport(text: string): RapportData | null {
  const isRapport =
    text.includes("TES 3 COMPÉTENCES") ||
    text.includes("COMPÉTENCES CLÉS") ||
    text.includes("GPS DE CARRIÈRE") ||
    text.includes("An 1:");

  if (!isRapport) return null;

  // Parser depuis texte visible
  const forceBlocks = [...text.matchAll(/\d+\.\s+\*\*(.+?)\*\*\n(.+?)(?=\n\d+\.|\n\n|$)/g)];
  const forces = forceBlocks.slice(0, 3).map(m => ({
    nom: m[1]?.trim(),
    desc: m[2]?.replace(/\*\*/g, "").trim(),
  }));

  const parseGPSLines = (section: string): GPS[] => {
    const matches = [...section.matchAll(/An\s*\d\s*[:\|]\s*\*?\*?([^|\n\*]+?)\*?\*?\s*[\|]\s*([\d,\s]+)\s*[\|]\s*([^\n]+)/gi)];
    return matches.map(m => ({
      titre: m[1]?.replace(/\*\*/g, "").trim() || "",
      salaire: parseInt(m[2]?.replace(/[^\d]/g, "") || "0"),
      action: m[3]?.trim() || "",
    })).filter(g => g.salaire > 0);
  };

  const gpsSection = text.match(/GPS DE CARRIÈRE[\s\S]+?(?=OBJECTIF:|FORMATIONS|CERTIFICATIONS|$)/i)?.[0] || "";
  const yelmaGPS = parseGPSLines(gpsSection || text);

  const oppMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*([\d,\s]+)\$[^\n]*\n([^\n]+)/gi)];
  const opportunites: Opportunite[] = oppMatches.slice(0, 3).map(m => ({
    titre: m[1]?.trim() || "",
    salaire: parseInt(m[2]?.replace(/[^\d]/g, "") || "0"),
    description: m[3]?.trim() || "",
  })).filter(o => o.salaire > 0);

  const formMatches = [...text.matchAll(/\d+\.\s+([^\|]+)\|\s*([^\|]+)\|\s*([^\|]+)\|\s*([^\n]+)/gi)];
  const formations: Formation[] = formMatches.map(m => ({
    nom: m[1]?.trim() || "",
    type: m[2]?.trim() || "Formation",
    plateforme: m[3]?.trim() || "",
    duree: m[4]?.trim() || "",
  }));

  const certMatches = [...text.matchAll(/CERTIFICATIONS[\s\S]*?\n\d+\.\s+([^\|]+)\|\s*([^\n]+)/gi)];
  const certifications: Certification[] = certMatches.map(m => ({
    nom: m[1]?.trim() || "",
    organisme: m[2]?.trim() || "",
  }));

  const objectifMatch = text.match(/OBJECTIF:\s*([^\n]+)/i);
  const scenarioMatch = text.match(/SCENARIO:\s*(\d)/i);
  const messageMatch = text.match(/MESSAGE_OBJECTIF:\s*([^\n]+)/i);
  const delaiMatch = text.match(/DELAI_OBJECTIF:\s*([^\n]+)/i);

  if (forces.length === 0 && yelmaGPS.length === 0) return null;

  return {
    force1: forces[0]?.nom, force1_desc: forces[0]?.desc,
    force2: forces[1]?.nom, force2_desc: forces[1]?.desc,
    force3: forces[2]?.nom, force3_desc: forces[2]?.desc,
    salaire_min: yelmaGPS[0] ? Math.round(yelmaGPS[0].salaire * 0.85) : 40000,
    salaire_max: yelmaGPS[0]?.salaire || 60000,
    objectif_carriere: objectifMatch?.[1]?.trim(),
    scenario_objectif: parseInt(scenarioMatch?.[1] || "3"),
    message_objectif: messageMatch?.[1]?.trim(),
    delai_objectif: delaiMatch?.[1]?.trim(),
    opportunites,
    gps_an1: yelmaGPS[0], gps_an2: yelmaGPS[1],
    gps_an3: yelmaGPS[2], gps_an4: yelmaGPS[3], gps_an5: yelmaGPS[4],
    formations,
    certifications,
  };
}

function ensureCroissant(salaires: number[]): number[] {
  return salaires.map((val, i) => {
    if (i === 0) return val || 40000;
    const prev = salaires[i - 1];
    if (!val || val <= prev) return Math.round(prev * 1.1);
    return val;
  });
}

function getTypeIcon(type: string): string {
  const t = type?.toLowerCase() || "";
  if (t.includes("certif") || t.includes("objectif")) return "🎯";
  if (t.includes("mentor")) return "🤝";
  if (t.includes("gap") || t.includes("marché")) return "🔍";
  if (t.includes("renforcement") || t.includes("renfo")) return "💪";
  if (t.includes("prochain") || t.includes("poste")) return "📈";
  if (t.includes("événement") || t.includes("evenement")) return "🎤";
  if (t.includes("diplôme") || t.includes("diplome")) return "🎓";
  return "📚";
}

function getScenarioBadge(scenario: number, objectif: string, delai: string) {
  if (scenario === 1) return { bg: "#D6FFE8", color: "#085041", icon: "✅", label: `Atteignable en 5 ans` };
  if (scenario === 2) return { bg: "#FFF8E1", color: "#7A5F00", icon: "⏳", label: `Atteignable en ${delai || "6-8 ans"}` };
  return { bg: "#E8F4FF", color: "#0C447C", icon: "🚀", label: `Objectif long terme — ${delai || "10+ ans"}` };
}

export default function RapportGPS({
  data, plan, ville, roleActuel, email
}: {
  data: RapportData;
  plan: string;
  ville?: string;
  roleActuel?: string;
  email?: string;
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [openJalon, setOpenJalon] = useState<number | null>(null);

  const isPropulse = plan === "propulse";
  const isDecouverte = !isPropulse;
  const salaireMin = data.salaire_min || 40000;
  const salaireMax = data.salaire_max || 60000;
  const scenario = data.scenario_objectif || 3;
  const scenarioBadge = getScenarioBadge(scenario, data.objectif_carriere || "", data.delai_objectif || "");

  useEffect(() => {
    if (!chartRef.current) return;
    const loadChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();

      const rawYelma = [
        salaireMin,
        data.gps_an1?.salaire || 0,
        data.gps_an2?.salaire || 0,
        data.gps_an3?.salaire || 0,
        data.gps_an4?.salaire || 0,
        data.gps_an5?.salaire || 0,
      ];

      const yelma = ensureCroissant(rawYelma);

      new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels: ["Auj.", "An 1", "An 2", "An 3", "An 4", "An 5"],
          datasets: [{
            label: "Trajectoire YELMA",
            data: yelma,
            borderColor: "#FF7043",
            backgroundColor: "rgba(255,112,67,0.08)",
            borderWidth: 2.5,
            pointBackgroundColor: yelma.map((_, i) => i === yelma.length - 1 ? "#10B981" : "#FF7043"),
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => "$" + ((ctx.parsed.y ?? 0)).toLocaleString()
              }
            }
          },
          scales: {
            y: {
              min: 0,
              ticks: { callback: (v) => "$" + Math.round(Number(v) / 1000) + "k", font: { size: 9 } },
              grid: { color: "rgba(0,0,0,0.04)" }
            },
            x: { ticks: { font: { size: 9 } }, grid: { display: false } },
          },
        },
      });
    };
    loadChart();
  }, [data, salaireMin]);

  const jalons = [
    { an: 1, gps: data.gps_an1 },
    { an: 2, gps: data.gps_an2 },
    { an: 3, gps: data.gps_an3 },
    { an: 4, gps: data.gps_an4 },
  ];

  const today = new Date().toLocaleDateString("fr-CA", {
    year: "numeric", month: "long", day: "numeric"
  });

  const villeAffichee = ville || data.ville || "Canada";
  const roleAffiche = roleActuel || data.role_actuel || "";

  const opportunitesVisibles = isDecouverte
    ? (data.opportunites || []).slice(0, 1)
    : (data.opportunites || []);

  const formationsVisibles = isPropulse ? (data.formations || []) : [];
  const certificationsVisibles = isPropulse ? (data.certifications || []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>

      {/* Header */}
      <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Ton rapport YELMA 🎯</div>
          <div style={{ fontSize: "9px", color: "#FF7043", marginTop: "2px" }}>{today} · {villeAffichee}</div>
        </div>
        <div style={{ background: isPropulse ? "#FF7043" : "#555", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", color: "white", fontWeight: 600 }}>
          {isPropulse ? "PROPULSE" : "DÉCOUVERTE"}
        </div>
      </div>

      {/* 3 Forces */}
      {(data.force1 || data.force2 || data.force3) && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🎯 TES 3 COMPÉTENCES CLÉS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { nom: data.force1, desc: data.force1_desc, color: "#FF7043", bg: "#FFF8F6" },
              { nom: data.force2, desc: data.force2_desc, color: "#0EA5E9", bg: "#F0F9FF" },
              { nom: data.force3, desc: data.force3_desc, color: "#10B981", bg: "#F0FFF4" },
            ].filter(f => f.nom).map((f, i) => (
              <div key={i} style={{ background: f.bg, borderRadius: "10px", padding: "10px 12px", borderLeft: `3px solid ${f.color}` }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: f.color, marginBottom: "3px" }}>{f.nom}</div>
                {f.desc && <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.5 }}>{f.desc}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Axes de développement */}
      {isPropulse && (data.axe1 || data.axe2) && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>📈 TES 2 AXES DE DÉVELOPPEMENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { axe: data.axe1, desc: data.axe1_desc },
              { axe: data.axe2, desc: data.axe2_desc },
            ].filter(a => a.axe).map((a, i) => (
              <div key={i} style={{ background: "#F8F6FF", borderRadius: "10px", padding: "10px 12px", borderLeft: "3px solid #8B5CF6" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#8B5CF6", marginBottom: "3px" }}>🔹 {a.axe}</div>
                {a.desc && <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.5 }}>{a.desc}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunités */}
      {opportunitesVisibles.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>
            💼 OPPORTUNITÉS COMPATIBLES {isDecouverte && <span style={{ color: "#FF7043", fontWeight: 400 }}>(1 sur 3)</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {opportunitesVisibles.map((o, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAFBFF", borderRadius: "10px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{o.titre}</div>
                  {o.description && <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>{o.description}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#FF7043" }}>{o.salaire?.toLocaleString()} $</div>
                  <a href={`/mon-espace?tab=offres&email=${email || ""}`} style={{ background: "#1A1A2E", color: "white", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", textDecoration: "none", fontWeight: 600 }}>💼 Voir mes offres →</a>
                </div>
              </div>
            ))}
            {isDecouverte && (
              <div style={{ padding: "8px 12px", background: "#F1EFE8", borderRadius: "10px", textAlign: "center", fontSize: "10px", color: "#888" }}>
                🔒 2 autres opportunités disponibles avec Propulse
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fourchette salariale + Graphique */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
        <div style={{ background: "#FFF8F6", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", color: "#888", marginBottom: "4px" }}>
            💰 Ta valeur sur le marché · {roleAffiche && `${roleAffiche} · `}{villeAffichee}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FF7043" }}>
              {salaireMin > 0 ? salaireMin.toLocaleString() : "—"} $
            </div>
            {salaireMax > salaireMin && (
              <>
                <div style={{ fontSize: "14px", color: "#888" }}>—</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#10B981" }}>
                  {salaireMax.toLocaleString()} $
                </div>
              </>
            )}
            <div style={{ fontSize: "10px", color: "#888" }}>CAD/an</div>
          </div>
          <div style={{ fontSize: "9px", color: "#aaa", marginTop: "3px" }}>
            Basé sur les données du marché en temps réel
          </div>
        </div>

        <div style={{ position: "relative", width: "100%", height: "160px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* GPS Jalons */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🗺️ GPS DE CARRIÈRE — 5 ANS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {jalons.map(({ an, gps }) => {
            if (!gps || !gps.salaire) return null;
            const isLocked = an > 1 && isDecouverte;
            const isOpen = openJalon === an;

            return (
              <div
                key={an}
                onClick={() => isLocked ? setOpenJalon(isOpen ? null : an) : null}
                style={{ background: "#FAFBFF", borderRadius: "10px", padding: "10px 12px", border: "0.5px solid #E8E8F0", cursor: isLocked ? "pointer" : "default", position: "relative", overflow: "hidden" }}
              >
                <div style={{ filter: isLocked && !isOpen ? "blur(4px)" : "none", pointerEvents: "none" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ background: "#FFE0D6", color: "#993C1D", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{an}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{gps.titre}</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043" }}>{gps.salaire?.toLocaleString()} $</div>
                      </div>
                      {gps.action && (
                        <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", background: "white", padding: "4px 8px", borderRadius: "6px" }}>
                          {gps.action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isLocked && !isOpen && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(250,251,255,0.8)" }}>
                    <span style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600 }}>🔒 Cliquer pour révéler</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* An 5 */}
          {data.gps_an5 && data.gps_an5.salaire > 0 && (
            <div style={{ background: "#E1F5EE", borderRadius: "10px", padding: "10px 12px", border: "1.5px solid #9FE1CB" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ background: "#085041", color: "#E1F5EE", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>5</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#085041" }}>{data.gps_an5.titre}</div>
                  <div style={{ fontSize: "11px", color: "#0F6E56", fontWeight: 600 }}>{data.gps_an5.salaire?.toLocaleString()} $ — POTENTIEL MAX 🎯</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Objectif déclaré — section dédiée */}
      {data.objectif_carriere && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🎯 TON OBJECTIF DE CARRIÈRE</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{data.objectif_carriere}</div>
            <span style={{ background: scenarioBadge.bg, color: scenarioBadge.color, borderRadius: "20px", padding: "2px 10px", fontSize: "10px", fontWeight: 600, flexShrink: 0 }}>
              {scenarioBadge.icon} {scenarioBadge.label}
            </span>
          </div>
          {data.message_objectif && (
            <div style={{ background: scenarioBadge.bg, borderRadius: "10px", padding: "10px 12px", fontSize: "11px", color: scenarioBadge.color, lineHeight: 1.6 }}>
              {data.message_objectif}
            </div>
          )}
        </div>
      )}

      {/* Formations — Propulse seulement */}
      {isPropulse && formationsVisibles.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "8px" }}>📚 FORMATIONS RECOMMANDÉES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {formationsVisibles.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#FAFBFF", borderRadius: "8px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                    <span>{getTypeIcon(f.type)}</span>
                    <span style={{ fontSize: "9px", background: "#FFE0D6", color: "#993C1D", borderRadius: "20px", padding: "1px 6px" }}>{f.type}</span>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "#1A1A2E" }}>{f.nom}</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>{f.plateforme} · {f.duree}</div>
                </div>
                <a href={`/mon-espace?tab=formations&email=${email || ""}`} style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", textDecoration: "none", fontWeight: 600 }}>Détail →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications — Propulse seulement */}
      {isPropulse && certificationsVisibles.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "8px" }}>🏆 CERTIFICATIONS RECOMMANDÉES</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {certificationsVisibles.map((c, i) => (
              <div key={i} style={{ flex: 1, minWidth: "120px", background: "#FFF8F6", borderRadius: "8px", padding: "8px 10px", borderLeft: "3px solid #FF7043" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#FF7043" }}>{c.nom}</div>
                <div style={{ fontSize: "9px", color: "#888", marginBottom: "4px" }}>{c.organisme}</div>
                <a href="/mon-espace?tab=formations" style={{ fontSize: "9px", color: "#FF7043", textDecoration: "none", fontWeight: 600 }}>Détail →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge upgrade si Découverte */}
      {isDecouverte && (
        <div style={{ background: "#FFE0D6", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#993C1D", fontWeight: 600, marginBottom: "4px" }}>🔒 Débloquez votre GPS complet avec YELMA Propulse</div>
          <div style={{ fontSize: "10px", color: "#993C1D", marginBottom: "8px" }}>An 2 à 5 · 3 opportunités · Formations · Certifications · Objectif de carrière</div>
          <a href="/pricing" style={{ display: "inline-block", background: "#FF7043", color: "white", borderRadius: "20px", padding: "6px 16px", fontSize: "11px", fontWeight: 600, textDecoration: "none" }}>S&apos;abonner — 4.99$/mois →</a>
        </div>
      )}

      {/* Message final */}
      {data.message_final && (
        <div style={{ background: "#F8F6FF", borderLeft: "3px solid #FF7043", borderRadius: "0 12px 12px 0", padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: "#1A1A2E", lineHeight: 1.7 }}>{data.message_final}</div>
        </div>
      )}

    </div>
  );
}
