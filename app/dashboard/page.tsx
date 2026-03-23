"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  ville: string;
  pays: string;
  niveau_education: string;
  diplome_max: string;
  duree_experience: string;
  domaine_actuel: string;
  objectif_carriere: string;
  statut_emploi: string;
  force1: string;
  force2: string;
  force3: string;
  plan: string;
  gps_visible: boolean;
  gps_an1: { titre: string; salaire: number; action: string };
  gps_an2: { titre: string; salaire: number; action: string };
  gps_an3: { titre: string; salaire: number; action: string };
  gps_an4: { titre: string; salaire: number; action: string };
  gps_an5: { titre: string; salaire: number; action: string };
  competences: string[];
  certifications: string[];
  nb_entretiens: number;
  dernier_entretien: string;
  created_at: string;
};

const MOT_DE_PASSE = "yelma2026";

export default function Dashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEdu, setFilterEdu] = useState("tous");
  const [filterVille, setFilterVille] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [selected, setSelected] = useState<Candidat | null>(null);

  const handleLogin = () => {
    if (pwd === MOT_DE_PASSE) {
      setAuth(true);
      loadCandidats();
    } else {
      setPwdError("Mot de passe incorrect");
    }
  };

  const loadCandidats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setCandidats(data.candidats || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Prénom", "Nom", "Email", "Ville", "Diplôme", "Expérience", "Domaine", "Objectif", "Statut", "Force 1", "Force 2", "Force 3", "Plan"];
    const rows = filtered.map(c => [
      c.prenom, c.nom, c.email, c.ville, c.diplome_max,
      c.duree_experience, c.domaine_actuel, c.objectif_carriere,
      c.statut_emploi, c.force1, c.force2, c.force3, c.plan
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidats_yelma.csv";
    a.click();
  };

  const villes = ["tous", ...Array.from(new Set(candidats.map(c => c.ville).filter(Boolean)))];
  const niveaux = ["tous", "UNIVERSITAIRE", "TECHNIQUE", "AUTODIDACTE", "JUNIOR"];
  const statuts = ["tous", "En emploi", "En recherche d emploi", "Etudiant"];

  const filtered = candidats.filter(c => {
    const matchSearch = !search || `${c.prenom} ${c.nom} ${c.domaine_actuel} ${c.ville}`.toLowerCase().includes(search.toLowerCase());
    const matchEdu = filterEdu === "tous" || c.niveau_education === filterEdu;
    const matchVille = filterVille === "tous" || c.ville === filterVille;
    const matchStatut = filterStatut === "tous" || c.statut_emploi === filterStatut;
    return matchSearch && matchEdu && matchVille && matchStatut;
  });

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-black text-3xl mb-2" style={{ color: "#1A1A2E", letterSpacing: "-1px" }}>YELMA</h1>
            <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 10px" }}/>
            <p className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Dashboard Recruteur</p>
            <p className="text-xs mt-1" style={{ color: "#888" }}>Accès réservé aux recruteurs partenaires</p>
          </div>
          <div className="flex flex-col gap-4">
            <input
              type="password"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: "#E8E8F0" }}
              placeholder="Mot de passe recruteur"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            {pwdError && <p className="text-xs text-center" style={{ color: "#FF7043" }}>{pwdError}</p>}
            <button onClick={handleLogin} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#FF7043" }}>
              Accéder au dashboard
            </button>
            <button onClick={() => router.push("/")} className="text-xs text-center" style={{ color: "#888", background: "none", border: "none", cursor: "pointer" }}>
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>

      {/* Header */}
      <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>YELMA Dashboard</div>
          <div style={{ fontSize: "10px", color: "#FF7043" }}>Espace recruteur</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600 }}>
            {filtered.length} candidat{filtered.length > 1 ? "s" : ""}
          </div>
          <button onClick={exportCSV} style={{ background: "white", color: "#1A1A2E", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: "white", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "0.5px solid #E8E8F0", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Rechercher un candidat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", border: "0.5px solid #E8E8F0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", outline: "none" }}
        />
        <select value={filterEdu} onChange={e => setFilterEdu(e.target.value)} style={{ border: "0.5px solid #E8E8F0", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", outline: "none" }}>
          {niveaux.map(n => <option key={n} value={n}>{n === "tous" ? "Tous niveaux" : n}</option>)}
        </select>
        <select value={filterVille} onChange={e => setFilterVille(e.target.value)} style={{ border: "0.5px solid #E8E8F0", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", outline: "none" }}>
          {villes.map(v => <option key={v} value={v}>{v === "tous" ? "Toutes villes" : v}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ border: "0.5px solid #E8E8F0", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", outline: "none" }}>
          {statuts.map(s => <option key={s} value={s}>{s === "tous" ? "Tous statuts" : s}</option>)}
        </select>
      </div>

      {/* Liste candidats */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "14px" }}>Chargement des candidats...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: c.plan === "propulse" ? "1.5px solid #FF7043" : "0.5px solid #E8E8F0", cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start" }}>

              {/* Avatar */}
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: c.plan === "propulse" ? "#FFE0D6" : "#F1EFE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: c.plan === "propulse" ? "#FF7043" : "#888", flexShrink: 0 }}>
                {(c.prenom || "?")[0]}{(c.nom || "?")[0]}
              </div>

              {/* Infos */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{c.prenom} {c.nom}</span>
                    {c.plan === "propulse" && <span style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "1px 8px", fontSize: "9px", fontWeight: 600, marginLeft: "6px" }}>PROPULSE</span>}
                  </div>
                  <span style={{ fontSize: "10px", color: c.statut_emploi === "En emploi" ? "#10B981" : "#FF7043", fontWeight: 500 }}>{c.statut_emploi}</span>
                </div>

                <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>
                  {c.ville} · {c.diplome_max || c.niveau_education} · {c.duree_experience}
                </div>

                <div style={{ fontSize: "11px", color: "#0EA5E9", marginBottom: "6px" }}>
                  {c.domaine_actuel} → {c.objectif_carriere}
                </div>

                {/* Forces */}
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {c.force1 && <span style={{ background: "#FFE0D6", color: "#993C1D", borderRadius: "20px", padding: "2px 8px", fontSize: "10px" }}>{c.force1}</span>}
                  {c.plan === "propulse" ? (
                    <>
                      {c.force2 && <span style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "2px 8px", fontSize: "10px" }}>{c.force2}</span>}
                      {c.force3 && <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "10px" }}>{c.force3}</span>}
                    </>
                  ) : (
                    <span style={{ background: "#F1EFE8", color: "#888", borderRadius: "20px", padding: "2px 8px", fontSize: "10px" }}>🔒 2 forces cachées</span>
                  )}
                </div>
              </div>

            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "14px" }}>
              Aucun candidat trouvé
            </div>
          )}
        </div>
      )}

      {/* Popup fiche candidat */}
      {selected && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: selected.plan === "propulse" ? "#FFE0D6" : "#F1EFE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: selected.plan === "propulse" ? "#FF7043" : "#888" }}>
                  {(selected.prenom || "?")[0]}{(selected.nom || "?")[0]}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#1A1A2E" }}>{selected.prenom} {selected.nom}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{selected.email}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>×</button>
            </div>

            {/* Infos de base */}
            <div style={{ background: "#FAFBFF", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["Ville", selected.ville],
                  ["Statut", selected.statut_emploi],
                  ["Diplôme", selected.diplome_max],
                  ["Expérience", selected.duree_experience],
                  ["Domaine", selected.domaine_actuel],
                  ["Objectif", selected.objectif_carriere],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontSize: "9px", color: "#888", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 500 }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forces */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>FORCES PRINCIPALES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {selected.force1 && <div style={{ background: "#FFF8F6", borderLeft: "3px solid #FF7043", borderRadius: "0 8px 8px 0", padding: "6px 10px", fontSize: "12px", color: "#1A1A2E" }}>{selected.force1}</div>}
                {selected.plan === "propulse" ? (
                  <>
                    {selected.force2 && <div style={{ background: "#F0F9FF", borderLeft: "3px solid #0EA5E9", borderRadius: "0 8px 8px 0", padding: "6px 10px", fontSize: "12px", color: "#1A1A2E" }}>{selected.force2}</div>}
                    {selected.force3 && <div style={{ background: "#F0FFF4", borderLeft: "3px solid #10B981", borderRadius: "0 8px 8px 0", padding: "6px 10px", fontSize: "12px", color: "#1A1A2E" }}>{selected.force3}</div>}
                  </>
                ) : (
                  <div style={{ background: "#F1EFE8", borderRadius: "8px", padding: "10px", textAlign: "center", fontSize: "11px", color: "#888" }}>
                    🔒 Forces 2 et 3 visibles uniquement pour les profils Propulse
                  </div>
                )}
              </div>
            </div>

            {/* GPS Carrière */}
            {selected.plan === "propulse" && selected.gps_visible && selected.gps_an1 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>GPS DE CARRIÈRE 5 ANS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {[selected.gps_an1, selected.gps_an2, selected.gps_an3, selected.gps_an4, selected.gps_an5].map((gps, i) => gps && (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: i === 4 ? "#E1F5EE" : "#FAFBFF", borderRadius: "8px", fontSize: "11px" }}>
                      <span style={{ color: "#1A1A2E", fontWeight: 500 }}>An {i + 1} — {gps.titre}</span>
                      <span style={{ color: i === 4 ? "#085041" : "#FF7043", fontWeight: 600 }}>{gps.salaire?.toLocaleString()}$</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formations & Certifications */}
            {selected.plan === "propulse" && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>FORMATIONS & CERTIFICATIONS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {(selected.competences || []).map((f, i) => (
                    <span key={i} style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "3px 8px", fontSize: "10px" }}>{f}</span>
                  ))}
                  {(selected.certifications || []).map((c, i) => (
                    <span key={i} style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "3px 8px", fontSize: "10px" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
