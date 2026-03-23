"use client";

import { useEffect, useRef, useState } from "react";

type GPS = {
  titre: string;
  salaire: number;
  action: string;
};

type RapportData = {
  force1?: string;
  force2?: string;
  force3?: string;
  salaire_actuel?: number;
  gps_an1?: GPS;
  gps_an2?: GPS;
  gps_an3?: GPS;
  gps_an4?: GPS;
  gps_an5?: GPS;
  competences?: string[];
  certifications?: string[];
};

export function parseRapport(text: string): RapportData | null {
  // Détecter si c'est un rapport final
  const isRapport = text.includes("TES 3 FORCES") || 
                    text.includes("GPS DE CARRIERE") || 
                    text.includes("FORCE1:") ||
                    text.includes("AN1:");
  
  if (!isRapport) return null;

  // Essayer d'abord les balises techniques
  const hasData = text.includes("---YELMA_DATA---");
  
  if (hasData) {
    const start = text.indexOf("---YELMA_DATA---");
    const end = text.indexOf("---END_DATA---");
    const data = end > start ? text.substring(start + 16, end) : text.substring(start + 16);
    
    const get = (key: string) => data.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim();
    const parseGPS = (val: string | null | undefined) => {
      if (!val) return undefined;
      const parts = val.split("|");
      return { titre: parts[0]?.trim() || "", salaire: parseInt(parts[1] || "0"), action: parts[2]?.trim() || "" };
    };

    return {
      force1: get("FORCE1"),
      force2: get("FORCE2"),
      force3: get("FORCE3"),
      salaire_actuel: parseInt(get("SALAIRE") || "0"),
      gps_an1: parseGPS(get("AN1")),
      gps_an2: parseGPS(get("AN2")),
      gps_an3: parseGPS(get("AN3")),
      gps_an4: parseGPS(get("AN4")),
      gps_an5: parseGPS(get("AN5")),
      competences: get("FORMATIONS")?.split(",").map(s => s.trim()),
      certifications: get("CERTIFICATIONS")?.split(",").map(s => s.trim()),
    };
  }

  // Fallback : parser le texte visible du rapport
  const forces: string[] = [];
  const forceMatches = text.matchAll(/\d+\.\s+\*\*(.+?)\*\*/g);
  for (const m of forceMatches) {
    if (forces.length < 3) forces.push(m[1].trim());
  }

  // Parser le GPS depuis le texte visible
  const gpsLines = text.match(/Annee?\s+\d\s*:?\s*\*?\*?(.+?)\*?\*?\s*[—-]\s*([\d,]+)\$.*?Action\s*:?\s*(.+?)(?:\n|$)/gi) || [];
  
  const parseGPSLine = (line: string) => {
    const titre = line.match(/:\s*\*?\*?(.+?)\*?\*?\s*[—-]/)?.[1]?.trim() || "";
    const salaire = parseInt(line.replace(/,/g, "").match(/[\d]{4,6}/)?.[0] || "0");
    const action = line.match(/Action\s*:?\s*(.+?)$/i)?.[1]?.trim() || "";
    return { titre, salaire, action };
  };

  const gpsList = gpsLines.map(parseGPSLine);

  // Parser formations
  const formations: string[] = [];
  const formMatches = text.matchAll(/\d+\.\s+\*\*(.+?)\*\*\s+sur\s+(.+?)\s+[—-]/gi);
  for (const m of formMatches) {
    formations.push(`${m[1]} sur ${m[2]}`);
  }

  if (forces.length === 0 && gpsList.length === 0) return null;

  return {
    force1: forces[0],
    force2: forces[1],
    force3: forces[2],
    salaire_actuel: 0,
    gps_an1: gpsList[0],
    gps_an2: gpsList[1],
    gps_an3: gpsList[2],
    gps_an4: gpsList[3],
    gps_an5: gpsList[4],
    competences: formations,
  };
}

export default function RapportGPS({ data, plan }: { data: RapportData; plan: string }) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [openJalon, setOpenJalon] = useState<number | null>(null);
  const isPropulse = plan === "propulse";

  useEffect(() => {
    if (!chartRef.current) return;
    let chartInstance: unknown = null;

    const loadChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);

      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();

      const salaires = [
        data.salaire_actuel || 0,
        data.gps_an1?.salaire || 0,
        data.gps_an2?.salaire || 0,
        data.gps_an3?.salaire || 0,
        data.gps_an4?.salaire || 0,
        data.gps_an5?.salaire || 0,
      ];

      chartInstance = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels: ["Auj.", "An 1", "An 2", "An 3", "An 4", "An 5"],
          datasets: [{
            data: salaires,
            borderColor: "#FF7043",
            backgroundColor: "rgba(255,112,67,0.08)",
            borderWidth: 2,
            pointBackgroundColor: ["#FF7043", "#FF7043", "#aaa", "#aaa", "#aaa", "#10B981"],
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
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
    return () => {
      if (chartInstance && typeof (chartInstance as {destroy?: () => void}).destroy === "function") {
        (chartInstance as {destroy: () => void}).destroy();
      }
    };
  }, [data, isPropulse]);

  const jalons = [
    { an: 1, gps: data.gps_an1, locked: false },
    { an: 2, gps: data.gps_an2, locked: true },
    { an: 3, gps: data.gps_an3, locked: true },
    { an: 4, gps: data.gps_an4, locked: true },
  ];

  const hasForces = data.force1 || data.force2 || data.force3;
  const hasGPS = data.gps_an1 || data.gps_an2;

  if (!hasForces && !hasGPS) return null;

  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0", marginTop: "8px" }}>

      {/* 3 Forces */}
      {hasForces && (
        <>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#1A1A2E", marginBottom: "6px" }}>🎯 TES 3 FORCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
            {data.force1 && <div style={{ background: "#FFF8F6", borderLeft: "3px solid #FF7043", borderRadius: "0 6px 6px 0", padding: "5px 8px", fontSize: "11px", color: "#1A1A2E" }}>{data.force1}</div>}
            {data.force2 && <div style={{ background: "#F0F9FF", borderLeft: "3px solid #0EA5E9", borderRadius: "0 6px 6px 0", padding: "5px 8px", fontSize: "11px", color: "#1A1A2E" }}>{data.force2}</div>}
            {data.force3 && <div style={{ background: "#F0FFF4", borderLeft: "3px solid #10B981", borderRadius: "0 6px 6px 0", padding: "5px 8px", fontSize: "11px", color: "#1A1A2E" }}>{data.force3}</div>}
          </div>
        </>
      )}

      {/* Valeur actuelle */}
      <div style={{ background: "#FFF8F6", borderRadius: "10px", padding: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "9px", color: "#888" }}>Ta valeur actuelle</div>
          <div style={{ fontSize: "9px", color: "#888" }}>Canada · selon ton profil</div>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#FF7043" }}>
          {data.gps_an1?.salaire ? `${(data.gps_an1.salaire * 0.85).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $` : "—"}
        </div>
      </div>

      {/* Graphique */}
      {hasGPS && (
        <div style={{ position: "relative", width: "100%", height: "130px", marginBottom: "10px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      )}

      {/* GPS Jalons */}
      {hasGPS && (
        <>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#1A1A2E", marginBottom: "6px" }}>🗺️ GPS DE CARRIÈRE — 5 ANS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>

            {jalons.map(({ an, gps, locked }) => {
              if (!gps) return null;
              const isLocked = locked && isPropulse;
              const isOpen = openJalon === an;

              return (
                <div
                  key={an}
                  onClick={() => isLocked ? setOpenJalon(isOpen ? null : an) : null}
                  style={{ background: "#FAFBFF", borderRadius: "8px", padding: "8px 10px", border: "0.5px solid #E8E8F0", cursor: isLocked ? "pointer" : "default", position: "relative", overflow: "hidden" }}
                >
                  <div style={{ filter: isLocked && !isOpen ? "blur(3px)" : "none", pointerEvents: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ background: "#FFE0D6", color: "#993C1D", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700 }}>{an}</div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "#1A1A2E" }}>{gps.titre}</div>
                          <div style={{ fontSize: "10px", color: "#FF7043", fontWeight: 500 }}>{gps.salaire?.toLocaleString()} $ CAD</div>
                        </div>
                      </div>
                    </div>
                    {(!isLocked || isOpen) && gps.action && (
                      <div style={{ marginTop: "5px", padding: "5px 8px", background: "white", borderRadius: "6px", fontSize: "10px", color: "#888" }}>
                        Action : {gps.action}
                      </div>
                    )}
                  </div>
                  {isLocked && !isOpen && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(250,251,255,0.7)" }}>
                      <span style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600 }}>🔒 Cliquer pour révéler</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* An 5 objectif */}
            {data.gps_an5 && (
              <div style={{ background: "#E1F5EE", borderRadius: "8px", padding: "8px 10px", border: "1.5px solid #9FE1CB" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ background: "#085041", color: "#E1F5EE", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700 }}>5</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#085041" }}>{data.gps_an5.titre}</div>
                    <div style={{ fontSize: "10px", color: "#0F6E56", fontWeight: 600 }}>{data.gps_an5.salaire?.toLocaleString()} $ — OBJECTIF ATTEINT 🎯</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {/* Badge upgrade si gratuit */}
      {!isPropulse && (
        <div style={{ marginTop: "10px", background: "#FFE0D6", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#993C1D", fontWeight: 600 }}>🔒 Débloquez les détails An 2-4 avec YELMA Propulse</div>
          <div style={{ fontSize: "10px", color: "#993C1D", marginTop: "2px" }}>GPS complet · Formations · Suivi de progression</div>
          <a href="/pricing" style={{ display: "inline-block", marginTop: "6px", background: "#FF7043", color: "white", borderRadius: "20px", padding: "5px 14px", fontSize: "10px", fontWeight: 600, textDecoration: "none" }}>S&apos;abonner — 4.99$/mois →</a>
        </div>
      )}

      {/* Formations si Propulse */}
      {isPropulse && data.competences && data.competences.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#1A1A2E", marginBottom: "5px" }}>📚 FORMATIONS & CERTIFICATIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {data.competences.map((f, i) => (
              <span key={i} style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "2px 8px", fontSize: "9px" }}>{f}</span>
            ))}
            {(data.certifications || []).map((c, i) => (
              <span key={i} style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px" }}>{c}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
