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
  titre_actuel?: string;
  ville?: string;
  opportunites?: Opportunite[];
  gps_an1?: GPS; gps_an2?: GPS; gps_an3?: GPS; gps_an4?: GPS; gps_an5?: GPS;
  formations?: Formation[];
  certifications?: Certification[];
  message_final?: string;
};

export function parseRapport(text: string): RapportData | null {
  const isRapport =
    text.includes("TES 3 FORCES") ||
    text.includes("GPS DE CARRIERE") ||
    text.includes("FORCE1:") ||
    text.includes("AN1:");

  if (!isRapport) return null;

  // Parser depuis balises techniques
  const hasData = text.includes("---YELMA_DATA---");

  if (hasData) {
    const start = text.indexOf("---YELMA_DATA---");
    const end = text.indexOf("---END_DATA---");
    const data = end > start ? text.substring(start + 16, end) : text.substring(start + 16);
    const get = (key: string) => data.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim();
    const parseGPS = (val: string | null | undefined): GPS | undefined => {
      if (!val) return undefined;
      const parts = val.split("|");
      return { titre: parts[0]?.trim() || "", salaire: parseInt(parts[1] || "0"), action: parts[2]?.trim() || "" };
    };
    return {
      force1: get("FORCE1"), force2: get("FORCE2"), force3: get("FORCE3"),
      salaire_actuel: parseInt(get("SALAIRE") || "0"),
      titre_actuel: get("TITRE") || "",
      ville: get("VILLE") || "Canada",
      gps_an1: parseGPS(get("AN1")),
      gps_an2: parseGPS(get("AN2")),
      gps_an3: parseGPS(get("AN3")),
      gps_an4: parseGPS(get("AN4")),
      gps_an5: parseGPS(get("AN5")),
    };
  }

  // Parser depuis texte visible
  // Forces avec descriptions
  const forceBlocks = [...text.matchAll(/\d+\.\s+\*\*(.+?)\*\*\n(.+?)(?=\n\d+\.|\n\n|$)/g)];
  const forces = forceBlocks.slice(0, 3).map(m => ({ nom: m[1]?.trim(), desc: m[2]?.replace(/\*\*/g, "").trim() }));

  // GPS
  const gpsMatches = [...text.matchAll(/Annee?\s*(\d)\s*[:\-]\s*\*?\*?([^—\n\*]+?)\*?\*?\s*[—-]\s*([\d\s,]+)\$[^\n]*\n?[^\n]*Action\s*:?\s*([^\n\.]+)/gi)];
  const gpsList: GPS[] = gpsMatches.map(m => ({
    titre: m[2]?.replace(/\*\*/g, "").trim() || "",
    salaire: parseInt(m[3]?.replace(/[\s,]/g, "") || "0"),
    action: m[4]?.trim() || "",
  }));

  // Opportunités
  const oppMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*([\d\s,]+)\$[^\n]*\n([^\n]+)/gi)];
  const opportunites: Opportunite[] = oppMatches.slice(0, 3).map(m => ({
    titre: m[1]?.trim() || "",
    salaire: parseInt(m[2]?.replace(/[\s,]/g, "") || "0"),
    description: m[3]?.trim() || "",
  }));

  // Formations
  const formMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s+sur\s+([^\s—\-]+)\s*[—-]\s*([^\n]+)/gi)];
  const formations: Formation[] = formMatches.map(m => ({
    nom: m[1]?.trim() || "",
    plateforme: m[2]?.trim() || "",
    duree: m[3]?.trim() || "",
  }));

  // Certifications
  const certSection = text.match(/CERTIFICATIONS?[^\n]*\n([\s\S]+?)(?:\n\n|---|\n[A-Z]{4}|$)/i)?.[1] || "";
  const certMatches = [...certSection.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*([^\n]+)/gi)];
  const certifications: Certification[] = certMatches.map(m => ({
    nom: m[1]?.trim() || "",
    organisme: m[2]?.trim() || "",
  }));

  // Message final
  const msgMatch = text.match(/---\n\n([\s\S]+?)$/);
  const message_final = msgMatch?.[1]?.replace(/\*\*/g, "").trim();

  // Salaire actuel estimé
  const salaireActuel = gpsList[0] ? Math.round(gpsList[0].salaire * 0.85) : 0;

  if (forces.length === 0 && gpsList.length === 0) return null;

  return {
    force1: forces[0]?.nom, force1_desc: forces[0]?.desc,
    force2: forces[1]?.nom, force2_desc: forces[1]?.desc,
    force3: forces[2]?.nom, force3_desc: forces[2]?.desc,
    salaire_actuel: salaireActuel,
    opportunites,
    gps_an1: gpsList[0],
    gps_an2: gpsList[1],
    gps_an3: gpsList[2],
    gps_an4: gpsList[3],
    gps_an5: gpsList[4],
    formations,
    certifications,
    message_final,
  };
}

export default function RapportGPS({ data, plan, ville }: { data: RapportData; plan: string; ville?: string }) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [openJalon, setOpenJalon] = useState<number | null>(null);
  const isPropulse = plan === "propulse";

  useEffect(() => {
    if (!chartRef.current) return;
    const loadChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();

      // Construire les salaires en s'assurant que la courbe monte toujours
      const rawSalaires = [
        data.salaire_actuel || 0,
        data.gps_an1?.salaire || 0,
        data.gps_an2?.salaire || 0,
        data.gps_an3?.salaire || 0,
        data.gps_an4?.salaire || 0,
        data.gps_an5?.salaire || 0,
      ];

      // Corriger la courbe pour qu'elle monte toujours
      const salaires = rawSalaires.map((val, i) => {
        if (i === 0) return val;
        const prev = rawSalaires[i - 1];
        // Si An5 est 0 ou inférieur au précédent, estimer une progression de 10%
        if (val === 0 || val < prev) {
          return Math.round(prev * 1.1);
        }
        return val;
      });

      const labels = ["Auj.", "An 1", "An 2", "An 3", "An 4", "An 5"].slice(0, salaires.length);
      const pointColors = salaires.map((_, i) =>
        i === salaires.length - 1 ? "#10B981" : i <= 1 ? "#FF7043" : "#aaa"
      );

      new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: salaires,
            borderColor: "#FF7043",
            backgroundColor: "rgba(255,112,67,0.08)",
            borderWidth: 2,
            pointBackgroundColor: pointColors,
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
            y: { min: 0, ticks: { callback: (v) => "$" + Math.round(Number(v) / 1000) + "k", font: { size: 9 } }, grid: { color: "rgba(0,0,0,0.04)" } },
            x: { ticks: { font: { size: 9 } }, grid: { display: false } },
          },
        },
      });
    };
    loadChart();
  }, [data]);

  const jalons = [
    { an: 1, gps: data.gps_an1 },
    { an: 2, gps: data.gps_an2 },
    { an: 3, gps: data.gps_an3 },
    { an: 4, gps: data.gps_an4 },
  ];

  const today = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>

      {/* Header */}
      <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Ton rapport YELMA 🎯</div>
          <div style={{ fontSize: "9px", color: "#FF7043", marginTop: "2px" }}>{today} · {ville || data.ville || "Canada"}</div>
        </div>
        <div style={{ background: isPropulse ? "#FF7043" : "#555", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", color: "white", fontWeight: 600 }}>
          {isPropulse ? "PROPULSE" : "GRATUIT"}
        </div>
      </div>

      {/* 3 Forces */}
      {(data.force1 || data.force2 || data.force3) && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🎯 TES 3 FORCES PRINCIPALES</div>
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
      {data.opportunites && data.opportunites.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>💼 OPPORTUNITÉS COMPATIBLES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.opportunites.map((o, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAFBFF", borderRadius: "10px", border: "0.5px solid #E8E8F0" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{o.titre}</div>
                  {o.description && <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>{o.description}</div>}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#FF7043", flexShrink: 0, marginLeft: "8px" }}>{o.salaire?.toLocaleString()} $</div>
              </div>
            ))}
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
        <div style={{ position: "relative", width: "100%", height: "140px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* GPS Jalons */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "10px" }}>🗺️ GPS DE CARRIÈRE — 5 ANS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

          {jalons.map(({ an, gps }) => {
            if (!gps) return null;
            const isLocked = an > 1 && !isPropulse;
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
                  <div style={{ fontSize: "11px", color: "#0F6E56", fontWeight: 600 }}>{data.gps_an5.salaire?.toLocaleString()} $ — OBJECTIF ATTEINT 🎯</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Formations & Certifications — Propulse seulement */}
      {isPropulse && ((data.formations?.length ?? 0) > 0 || (data.certifications?.length ?? 0) > 0) && (
        <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
          {data.formations && data.formations.length > 0 && (
            <>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "8px" }}>📚 FORMATIONS RECOMMANDÉES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                {data.formations.map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#FAFBFF", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 500, color: "#1A1A2E" }}>{f.nom}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{f.plateforme} · {f.duree}</div>
                    </div>
                    <span style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", flexShrink: 0, marginLeft: "8px" }}>En ligne</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: ".5px", marginBottom: "8px" }}>🏆 CERTIFICATIONS RECOMMANDÉES</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {data.certifications.map((c, i) => (
                  <div key={i} style={{ flex: 1, minWidth: "120px", background: "#FFF8F6", borderRadius: "8px", padding: "8px 10px", borderLeft: "3px solid #FF7043" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#FF7043" }}>{c.nom}</div>
                    <div style={{ fontSize: "9px", color: "#888" }}>{c.organisme}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Badge upgrade si gratuit */}
      {!isPropulse && (
        <div style={{ background: "#FFE0D6", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#993C1D", fontWeight: 600, marginBottom: "4px" }}>🔒 Débloquez votre GPS complet avec YELMA Propulse</div>
          <div style={{ fontSize: "10px", color: "#993C1D", marginBottom: "8px" }}>An 2 à 4 détaillés · Formations · Certifications · Suivi de progression</div>
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
