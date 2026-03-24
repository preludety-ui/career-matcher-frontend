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
  lien?: string;
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
  salaire_actuel?: number;
  ville?: string;
  opportunites?: Opportunite[];
  gps_an1?: GPS; gps_an2?: GPS; gps_an3?: GPS; gps_an4?: GPS; gps_an5?: GPS;
  obj_an1?: GPS; obj_an2?: GPS; obj_an3?: GPS; obj_an4?: GPS; obj_an5?: GPS;
  analyse_comparative?: string;
  formations?: Formation[];
  certifications?: Certification[];
  message_final?: string;
};

export function parseRapport(text: string): RapportData | null {
  const isRapport =
    text.includes("TES 3 COMPÉTENCES") ||
    text.includes("TES 3 FORCES") ||
    text.includes("TRAJECTOIRE YELMA") ||
    text.includes("FORCE1:") ||
    text.includes("AN1:");

  if (!isRapport) return null;

  const hasData = text.includes("---YELMA_DATA---");

  if (hasData) {
    const start = text.indexOf("---YELMA_DATA---");
    const end = text.indexOf("---END_DATA---");
    const data = end > start ? text.substring(start + 16, end) : text.substring(start + 16);

    const get = (key: string) => data.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim();

    const parseGPS = (val: string | null | undefined): GPS | undefined => {
      if (!val) return undefined;
      const parts = val.split("|");
      return {
        titre: parts[0]?.trim() || "",
        salaire: parseInt(parts[1]?.replace(/[^\d]/g, "") || "0"),
        action: parts[2]?.trim() || "",
      };
    };

    const parseFormation = (key: string): Formation | undefined => {
      const val = get(key);
      if (!val) return undefined;
      const parts = val.split("|");
      return {
        nom: parts[0]?.trim() || "",
        type: parts[1]?.trim() || "Formation",
        plateforme: parts[2]?.trim() || "",
        duree: parts[3]?.trim() || "",
      };
    };

    const parseCertification = (key: string): Certification | undefined => {
      const val = get(key);
      if (!val) return undefined;
      const parts = val.split("|");
      return { nom: parts[0]?.trim() || "", organisme: parts[1]?.trim() || "" };
    };

    const formations = [
      parseFormation("FORMATION1"),
      parseFormation("FORMATION2"),
      parseFormation("FORMATION3"),
    ].filter(Boolean) as Formation[];

    const certifications = [
      parseCertification("CERTIFICATION1"),
      parseCertification("CERTIFICATION2"),
    ].filter(Boolean) as Certification[];

    return {
      force1: get("FORCE1"), force2: get("FORCE2"), force3: get("FORCE3"),
      salaire_actuel: parseInt(get("SALAIRE") || "0"),
      ville: get("VILLE") || "Canada",
      gps_an1: parseGPS(get("AN1")),
      gps_an2: parseGPS(get("AN2")),
      gps_an3: parseGPS(get("AN3")),
      gps_an4: parseGPS(get("AN4")),
      gps_an5: parseGPS(get("AN5")),
      obj_an1: parseGPS(get("OBJ_AN1")),
      obj_an2: parseGPS(get("OBJ_AN2")),
      obj_an3: parseGPS(get("OBJ_AN3")),
      obj_an4: parseGPS(get("OBJ_AN4")),
      obj_an5: parseGPS(get("OBJ_AN5")),
      analyse_comparative: get("ANALYSE"),
      formations,
      certifications,
    };
  }

  // Fallback — parser depuis texte visible
  const forceBlocks = [...text.matchAll(/\d+\.\s+\*\*(.+?)\*\*\n(.+?)(?=\n\d+\.|\n\n|$)/g)];
  const forces = forceBlocks.slice(0, 3).map(m => ({
    nom: m[1]?.trim(),
    desc: m[2]?.replace(/\*\*/g, "").trim(),
  }));

  const parseGPSLines = (section: string): GPS[] => {
    const matches = [...section.matchAll(/Annee?\s*\d\s*[:\-]\s*\*?\*?([^—\n\*]+?)\*?\*?\s*[—-]\s*([\d\s,]+)\$[^\n]*\n?[^\n]*Action\s*:?\s*([^\n\.]+)/gi)];
    return matches.map(m => ({
      titre: m[1]?.replace(/\*\*/g, "").trim() || "",
      salaire: parseInt(m[2]?.replace(/[\s,]/g, "") || "0"),
      action: m[3]?.trim() || "",
    }));
  };

  const yelmaSection = text.match(/TRAJECTOIRE YELMA[\s\S]+?(?=TRAJECTOIRE OBJECTIF|ANALYSE|FORMATIONS|$)/i)?.[0] || "";
  const objSection = text.match(/TRAJECTOIRE OBJECTIF[\s\S]+?(?=ANALYSE|FORMATIONS|$)/i)?.[0] || "";
  const yelmaGPS = parseGPSLines(yelmaSection || text);
  const objGPS = parseGPSLines(objSection);

  const oppMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*([\d\s,]+)\$[^\n]*\n([^\n]+)/gi)];
  const opportunites: Opportunite[] = oppMatches.slice(0, 3).map(m => ({
    titre: m[1]?.trim() || "",
    salaire: parseInt(m[2]?.replace(/[\s,]/g, "") || "0"),
    description: m[3]?.trim() || "",
  }));

  const formMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*Type:\s*([^—\n]+)\s*[—-]\s*([^\s—\-]+)\s*[—-]\s*([^\n]+)/gi)];
  const formations: Formation[] = formMatches.map(m => ({
    nom: m[1]?.trim() || "",
    type: m[2]?.trim() || "Formation",
    plateforme: m[3]?.trim() || "",
    duree: m[4]?.trim() || "",
  }));

  const analyseMatch = text.match(/ANALYSE YELMA\n([^\n]+)/i);
  const analyse_comparative = analyseMatch?.[1]?.trim();

  const msgMatch = text.match(/---\n\n([\s\S]+?)$/);
  const message_final = msgMatch?.[1]?.replace(/\*\*/g, "").trim();

  const salaireActuel = yelmaGPS[0] ? Math.round(yelmaGPS[0].salaire * 0.85) : 0;

  if (forces.length === 0 && yelmaGPS.length === 0) return null;

  return {
    force1: forces[0]?.nom, force1_desc: forces[0]?.desc,
    force2: forces[1]?.nom, force2_desc: forces[1]?.desc,
    force3: forces[2]?.nom, force3_desc: forces[2]?.desc,
    salaire_actuel: salaireActuel,
    opportunites,
    gps_an1: yelmaGPS[0], gps_an2: yelmaGPS[1], gps_an3: yelmaGPS[2],
    gps_an4: yelmaGPS[3], gps_an5: yelmaGPS[4],
    obj_an1: objGPS[0], obj_an2: objGPS[1], obj_an3: objGPS[2],
    obj_an4: objGPS[3], obj_an5: objGPS[4],
    formations,
    analyse_comparative,
    message_final,
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
  if (t.includes("certif")) return "🏆";
  if (t.includes("mentor")) return "🤝";
  if (t.includes("événement") || t.includes("evenement")) return "🎤";
  if (t.includes("diplôme") || t.includes("diplome") || t.includes("bac") || t.includes("maît")) return "🎓";
  return "📚";
}

export default function RapportGPS({
  data, plan, ville
}: {
  data: RapportData;
  plan: string;
  ville?: string;
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [openJalon, setOpenJalon] = useState<number | null>(null);

  // Logique plan effectif
  const isPropulse = plan === "propulse";
  const isDecouverte = !isPropulse;
  const hasObjectif = !!(data.obj_an1 || data.obj_an2);

  useEffect(() => {
    if (!chartRef.current) return;
    const loadChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();

      const rawYelma = [
        data.salaire_actuel || 40000,
        data.gps_an1?.salaire || 0,
        data.gps_an2?.salaire || 0,
        data.gps_an3?.salaire || 0,
        data.gps_an4?.salaire || 0,
        data.gps_an5?.salaire || 0,
      ];

      const yelma = ensureCroissant(rawYelma);

      const datasets: object[] = [
        {
          label: "Trajectoire YELMA",
          data: yelma,
          borderColor: "#FF7043",
          backgroundColor: "rgba(255,112,67,0.06)",
          borderWidth: 2.5,
          pointBackgroundColor: yelma.map((_, i) => i === yelma.length - 1 ? "#10B981" : "#FF7043"),
          pointRadius: 4,
          fill: true,
          tension: 0.4,
        },
      ];

      if (hasObjectif && isPropulse) {
        const rawObj = [
          data.salaire_actuel || 40000,
          data.obj_an1?.salaire || 0,
          data.obj_an2?.salaire || 0,
          data.obj_an3?.salaire || 0,
          data.obj_an4?.salaire || 0,
          data.obj_an5?.salaire || 0,
        ];
        const obj = ensureCroissant(rawObj);
        datasets.push({
          label: "Objectif déclaré",
          data: obj,
          borderColor: "#0EA5E9",
          backgroundColor: "rgba(14,165,233,0.04)",
          borderWidth: 2,
          borderDash: [6, 3],
          pointBackgroundColor: obj.map(() => "#0EA5E9"),
          pointRadius: 3,
          fill: true,
          tension: 0.4,
        });
      }

      new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels: ["Auj.", "An 1", "An 2", "An 3", "An 4", "An 5"],
          datasets: datasets as never[],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: hasObjectif && isPropulse,
              position: "top",
              labels: { font: { size: 9 }, boxWidth: 20 }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.dataset.label + ": $" + ((ctx.parsed.y ?? 0)).toLocaleString()
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
  }, [data, hasObjectif, isPropulse]);

  const jalons = [
    { an: 1, gps: data.gps_an1 },
    { an: 2, gps: data.gps_an2 },
    { an: 3, gps: data.gps_an3 },
    { an: 4, gps: data.gps_an4 },
  ];

  const today = new Date().toLocaleDateString("fr-CA", {
    year: "numeric", month: "long", day: "numeric"
  });

  // Opportunités visibles selon plan
  const opportunitesVisibles = isDecouverte
    ? (data.opportunites || []).slice(0, 1)
    : (data.opportunites || []);

  // Formations visibles selon plan
  const formationsVisibles = isPropulse ? (data.formations || []) : [];
  const certificationsVisibles = isPropulse ? (data.certifications || []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>

      {/* Header */}
      <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Ton rapport YELMA 🎯</div>
          <div style={{ fontSize: "9px", color: "#FF7043", marginTop: "2px" }}>{today} · {ville || data.ville || "Canada"}</div>
        </div>
        <div style={{ background: isPropulse ? "#FF7043" : "#555", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", color: "white", fontWeight: 600 }}>
          {isPropulse ? "PROPULSE" : "DÉCOUVERTE"}
        </div>
      </div>

      {/* 3 Forces — toujours visibles */}
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

      {/* Opportunités */}
      {opportunitesVisibles.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>
            💼 OPPORTUNITÉS COMPATIBLES {isDecouverte && <span style={{ color: "#FF7043" }}>(1 sur 3)</span>}
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
                  <a href="https://www.linkedin.com/jobs" target="_blank" rel="noopener noreferrer" style={{ background: "#1A1A2E", color: "white", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", textDecoration: "none", fontWeight: 600 }}>Offres →</a>
                </div>
              </div>
            ))}
            {isDecouverte && (
              <div style={{ padding: "10px 12px", background: "#F1EFE8", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "10px", color: "#888" }}>🔒 2 autres opportunités disponibles avec Propulse</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valeur actuelle + Graphique */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
        <div style={{ background: "#FFF8F6", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "9px", color: "#888" }}>Ta valeur actuelle sur le marché</div>
            <div style={{ fontSize: "9px", color: "#888" }}>{ville || data.ville || "Canada"} · selon ton profil</div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#FF7043" }}>
            {(data.salaire_actuel || 0).toLocaleString()} $
          </div>
        </div>

        {hasObjectif && isPropulse && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "20px", height: "3px", background: "#FF7043", borderRadius: "2px" }} />
              <span style={{ fontSize: "9px", color: "#1A1A2E" }}>Trajectoire YELMA</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "20px", height: "2px", background: "#0EA5E9", borderRadius: "2px" }} />
              <span style={{ fontSize: "9px", color: "#1A1A2E" }}>Objectif déclaré</span>
            </div>
          </div>
        )}

        <div style={{ position: "relative", width: "100%", height: "160px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Analyse comparative — Propulse seulement */}
      {isPropulse && hasObjectif && data.analyse_comparative && (
        <div style={{ background: "#FFF8F6", borderLeft: "3px solid #FF7043", borderRadius: "0 10px 10px 0", padding: "10px 12px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF7043", marginBottom: "4px" }}>💡 ANALYSE YELMA</div>
          <div style={{ fontSize: "11px", color: "#1A1A2E", lineHeight: 1.6 }}>{data.analyse_comparative}</div>
        </div>
      )}

      {/* Comparaison An 5 — Propulse seulement */}
      {isPropulse && hasObjectif && data.gps_an5 && data.obj_an5 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ background: "#FFF8F6", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1.5px solid #FFE0D6" }}>
            <div style={{ fontSize: "9px", color: "#888", marginBottom: "4px" }}>TRAJECTOIRE YELMA</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#FF7043" }}>{Math.round((data.gps_an5.salaire || 0) / 1000)}K$</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>{data.gps_an5.titre}</div>
          </div>
          <div style={{ background: "#F0F9FF", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1.5px solid #D6F0FF" }}>
            <div style={{ fontSize: "9px", color: "#888", marginBottom: "4px" }}>OBJECTIF DÉCLARÉ</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0EA5E9" }}>{Math.round((data.obj_an5.salaire || 0) / 1000)}K$</div>
            <div style={{ fontSize: "10px", color: "#0EA5E9", marginTop: "2px" }}>{data.obj_an5.titre}</div>
          </div>
        </div>
      )}

      {/* GPS Jalons */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🗺️ GPS DE CARRIÈRE — 5 ANS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {jalons.map(({ an, gps }) => {
            if (!gps) return null;
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
                          Action : {gps.action}
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
          {data.gps_an5 && (
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
                <a href="/partenaires/offres" style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", textDecoration: "none", flexShrink: 0, marginLeft: "8px", fontWeight: 600 }}>Détail →</a>
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
                <a href="/partenaires/offres" style={{ fontSize: "9px", color: "#FF7043", textDecoration: "none", fontWeight: 600 }}>Détail →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge upgrade si Découverte */}
      {isDecouverte && (
        <div style={{ background: "#FFE0D6", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#993C1D", fontWeight: 600, marginBottom: "4px" }}>🔒 Débloquez votre GPS complet avec YELMA Propulse</div>
          <div style={{ fontSize: "10px", color: "#993C1D", marginBottom: "8px" }}>An 2 à 5 détaillés · 3 opportunités · Formations · Certifications · Double courbe GPS</div>
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
