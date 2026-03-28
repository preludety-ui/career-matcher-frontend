"use client";

import { useState, useEffect } from "react";
import RapportGPS from "../components/RapportGPS";

type Formation = { nom: string; type: string; plateforme: string; duree: string; prix?: string; lien?: string; note?: string };
type Evenement = { nom: string; type: string; organisateur: string; date: string; lieu: string; prix: string; lien: string };
type Offre = { titre: string; entreprise: string | null; salaire: number; lien: string; source: string; score: number; insights: string[]; gap: string | null; date_publication: string };
type Candidature = { id: number; offre_titre: string; offre_entreprise: string; offre_lien: string; offre_source: string; offre_salaire: number; date_candidature: string; statut: string };
type Inscription = { id: number; formation_nom: string; formation_plateforme: string; formation_lien: string; formation_type: string; date_inscription: string; statut: string };

type Candidat = {
  email: string; prenom: string; nom: string; plan: string; trial_end: string;
  force1?: string; force1_desc?: string; force2?: string; force2_desc?: string; force3?: string; force3_desc?: string;
  axe1?: string; axe1_desc?: string; axe2?: string; axe2_desc?: string;
  salaire_min?: number; salaire_max?: number; role_actuel?: string; ville?: string;
  objectif_carriere?: string; scenario_objectif?: number; message_objectif?: string; delai_objectif?: string;
  analyse_comparative?: string;
  gps_an1?: { titre: string; salaire: number; action: string };
  gps_an2?: { titre: string; salaire: number; action: string };
  gps_an3?: { titre: string; salaire: number; action: string };
  gps_an4?: { titre: string; salaire: number; action: string };
  gps_an5?: { titre: string; salaire: number; action: string };
  opportunites?: { titre: string; salaire: number; description: string }[];
  formations?: Formation[];
  certifications?: { nom: string; organisme: string }[];
  offres?: Offre[];
  dernier_entretien?: string;
  diplome_max?: string; duree_experience?: string;
};

export default function MonEspace() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [candidat, setCandidat] = useState<Candidat | null>(null);
  const [activeTab, setActiveTab] = useState("rapport");
  const [tokenLoading, setTokenLoading] = useState(false);

  const [offres, setOffres] = useState<Offre[]>([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [formations, setFormations] = useState<{ renforcement: Formation[]; gap: Formation[]; prochain_poste: Formation[]; objectif_long_terme: Formation[] }>({ renforcement: [], gap: [], prochain_poste: [], objectif_long_terme: [] });
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [formationsLoading, setFormationsLoading] = useState(false);
  const [cv, setCv] = useState("");
  const [cvLoading, setCvLoading] = useState(false);
  const [lettre, setLettre] = useState("");
  const [lettreLoading, setLettreLoading] = useState(false);
  const [offreSelectionnee, setOffreSelectionnee] = useState<Offre | null>(null);
  const [cvCopied, setCvCopied] = useState(false);
  const [lettreCopied, setLettreCopied] = useState(false);

  // Suivi candidatures
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [postulLoading, setPostulLoading] = useState<string | null>(null);
  const [inscritLoading, setInscritLoading] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setTokenLoading(true);
      fetch(`/api/auth?token=${token}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) { 
  setCandidat(data.candidat); 
  localStorage.setItem("yelma_email", data.candidat.email);
  window.history.replaceState({}, "", "/mon-espace"); 
}
          else setError(data.error || "Lien invalide ou expiré");
        })
        .catch(() => setError("Erreur de connexion"))
        .finally(() => setTokenLoading(false));
    }
  }, []);
      
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const emailParam = params.get("email") || localStorage.getItem("yelma_email") || "";
    if (tab) setActiveTab(tab);
    if (emailParam) {
  // Essayer de charger directement depuis Supabase
  fetch(`/api/candidats?email=${encodeURIComponent(emailParam)}`)
    .then(r => r.json())
    .then(data => {
      if (data.candidat) {
        setCandidat(data.candidat);
        localStorage.setItem("yelma_email", emailParam);
      } else {
        // Fallback — envoyer magic link
        setEmail(emailParam);
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailParam }),
        });
      }
    })
    .catch(() => setEmail(emailParam));
}

   }, []);

  // Charger candidatures et inscriptions
  useEffect(() => {
    if (candidat?.email) {
      fetch(`/api/candidatures?email=${encodeURIComponent(candidat.email)}`)
        .then(r => r.json())
        .then(data => {
          if (data.candidatures) setCandidatures(data.candidatures);
          if (data.inscriptions) setInscriptions(data.inscriptions);
        })
        .catch(e => console.error("Candidatures load error:", e));
    }
  }, [candidat]);

  const sendMagicLink = async () => {
    if (!email.includes("@")) { setError("Email invalide"); return; }
    
    // Accès admin direct en développement
    if (process.env.NODE_ENV === "development" && email === "preludety@gmail.com") {
      const res = await fetch(`/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.dev_link) {
        const token = new URL(data.dev_link).searchParams.get("token");
        if (token) {
          const res2 = await fetch(`/api/auth?token=${token}`);
          const data2 = await res2.json();
          if (data2.success) { setCandidat(data2.candidat); return; }
        }
      }
    }

    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        if (data.dev_link) {
          const token = new URL(data.dev_link).searchParams.get("token");
          if (token) {
            const res2 = await fetch(`/api/auth?token=${token}`);
            const data2 = await res2.json();
            if (data2.success) setCandidat(data2.candidat);
          }
        }
      } else setError(data.error || "Erreur — vérifiez votre email");
    } catch { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  };

  const chargerOffres = async () => {
    if (!candidat) return;
    setOffresLoading(true);
    try {
      const res = await fetch("/api/offres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: candidat.role_actuel || "",
          ville: candidat.ville || "Montréal",
          experience: candidat.duree_experience || "",
          competences: [candidat.force1, candidat.force2, candidat.force3].filter(Boolean),
          objectif: candidat.objectif_carriere || "",
          domaine: candidat.role_actuel || "",
        }),
      });
      const data = await res.json();
      if (data.offres) setOffres(data.offres);
    } catch (e) { console.error("Offres error:", e); }
    finally { setOffresLoading(false); }
  };

  const chargerFormations = async () => {
    if (!candidat) return;
    setFormationsLoading(true);
    try {
      const res = await fetch("/api/formations-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: candidat.role_actuel, ville: candidat.ville,
          competences: [candidat.force1, candidat.force2, candidat.force3].filter(Boolean),
          axes: [candidat.axe1, candidat.axe2].filter(Boolean),
          objectif: candidat.objectif_carriere, experience: candidat.duree_experience,
          gps_an1_titre: candidat.gps_an1?.titre,
        }),
      });
      const data = await res.json();
      if (data.formations) setFormations(data.formations);
      if (data.evenements) setEvenements(data.evenements);
    } catch (e) { console.error("Formations error:", e); }
    finally { setFormationsLoading(false); }
  };

  const genererCV = async () => {
    if (!candidat) return;
    setCvLoading(true);
    try {
      const res = await fetch("/api/cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: candidat.email }) });
      const data = await res.json();
      if (data.cv) setCv(data.cv);
    } catch (e) { console.error("CV error:", e); }
    finally { setCvLoading(false); }
  };

  const genererLettre = async (offre?: Offre) => {
    if (!candidat) return;
    setLettreLoading(true);
    const offreTarget = offre || offreSelectionnee;
    try {
      const res = await fetch("/api/lettre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidat_prenom: candidat.prenom, candidat_nom: candidat.nom,
          candidat_email: candidat.email, candidat_ville: candidat.ville,
          candidat_role: candidat.role_actuel, candidat_experience: candidat.duree_experience,
          force1: candidat.force1, force2: candidat.force2, force3: candidat.force3,
          offre_titre: offreTarget?.titre || "", offre_entreprise: offreTarget?.entreprise || "",
          offre_description: offreTarget?.insights?.join(", ") || "",
          objectif_carriere: candidat.objectif_carriere,
        }),
      });
      const data = await res.json();
      if (data.lettre) { setLettre(data.lettre); setActiveTab("lettre"); }
    } catch (e) { console.error("Lettre error:", e); }
    finally { setLettreLoading(false); }
  };

  const marquerPostule = async (offre: Offre) => {
    if (!candidat) return;
    setPostulLoading(offre.lien);
    try {
      await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "candidature",
          email: candidat.email,
          data: { titre: offre.titre, entreprise: offre.entreprise, lien: offre.lien, source: offre.source, salaire: offre.salaire },
        }),
      });
      setCandidatures(prev => [...prev, { id: Date.now(), offre_titre: offre.titre, offre_entreprise: offre.entreprise || "", offre_lien: offre.lien, offre_source: offre.source, offre_salaire: offre.salaire, date_candidature: new Date().toISOString(), statut: "postulé" }]);
    } catch (e) { console.error("Postul error:", e); }
    finally { setPostulLoading(null); }
  };

  const marquerInscrit = async (formation: Formation) => {
    if (!candidat) return;
    setInscritLoading(formation.nom);
    try {
      await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "formation",
          email: candidat.email,
          data: { nom: formation.nom, plateforme: formation.plateforme, lien: formation.lien, type: formation.type },
        }),
      });
      setInscriptions(prev => [...prev, { id: Date.now(), formation_nom: formation.nom, formation_plateforme: formation.plateforme, formation_lien: formation.lien || "", formation_type: formation.type, date_inscription: new Date().toISOString(), statut: "inscrit" }]);
    } catch (e) { console.error("Inscrit error:", e); }
    finally { setInscritLoading(null); }
  };

  const aPostule = (lien: string) => candidatures.some(c => c.offre_lien === lien);
  const aInscrit = (nom: string) => inscriptions.some(i => i.formation_nom === nom);

  useEffect(() => {
    if (candidat && activeTab === "offres" && offres.length === 0) chargerOffres();
    if (candidat && (activeTab === "formations" || activeTab === "evenements") && formations.renforcement.length === 0) chargerFormations();
  }, [activeTab, candidat]);

  if (tokenLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFBFF" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
        <div style={{ fontSize: "14px", color: "#888" }}>Connexion en cours...</div>
      </div>
    </div>
  );

  if (!candidat) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFBFF", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ background: "#1A1A2E", borderRadius: "16px", padding: "24px", marginBottom: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#FF7043", letterSpacing: "-1px", marginBottom: "4px" }}>YELMA</div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>Mon Espace Personnel</div>
        </div>
        {!sent ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "0.5px solid #E8E8F0" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Accéder à mon espace</div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>Entrez votre email pour recevoir un lien de connexion</div>
            <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMagicLink()} style={{ width: "100%", border: "1px solid #E8E8F0", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", marginBottom: "10px", boxSizing: "border-box", outline: "none" }} />
            {error && <div style={{ fontSize: "11px", color: "#FF7043", marginBottom: "8px" }}>{error}</div>}
            <button onClick={sendMagicLink} disabled={loading} style={{ width: "100%", background: "#FF7043", color: "white", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Envoi en cours..." : "Recevoir mon lien →"}
            </button>
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <a href="/" style={{ fontSize: "11px", color: "#888", textDecoration: "none" }}>← Retour à l'accueil</a>
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "0.5px solid #E8E8F0", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📧</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Lien envoyé !</div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>Vérifiez votre boîte mail — expire dans 30 minutes</div>
            <button onClick={() => { setSent(false); setError(""); }} style={{ fontSize: "12px", color: "#FF7043", background: "none", border: "none", cursor: "pointer" }}>Renvoyer un lien</button>
          </div>
        )}
      </div>
    </div>
  );

  const trialEnd = new Date(candidat.trial_end);
  const now = new Date();
  const joursRestants = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isPropulse = candidat.plan === "propulse";

  const tabs = [
    { id: "rapport", label: "📊 Rapport" },
    { id: "offres", label: "💼 Offres" },
    { id: "formations", label: "📚 Formations" },
    { id: "evenements", label: "🎤 Événements" },
    { id: "cv", label: "📄 CV" },
    { id: "lettre", label: "✉️ Lettre" },
    { id: "candidatures", label: `📋 Suivi (${candidatures.length + inscriptions.length})` },
    { id: "profil", label: "👤 Profil" },
  ];

  const allFormations = [
    ...formations.renforcement.map(f => ({ ...f, type: "Renforcement" })),
    ...formations.gap.map(f => ({ ...f, type: "Gap marché" })),
    ...formations.prochain_poste.map(f => ({ ...f, type: "Prochain poste" })),
    ...formations.objectif_long_terme.map(f => ({ ...f, type: "Objectif long terme" })),
  ];

  const getTypeIcon = (type: string) => {
    if (type?.includes("Renforcement")) return "💪";
    if (type?.includes("Gap")) return "🔍";
    if (type?.includes("Prochain")) return "📈";
    if (type?.includes("Objectif")) return "🎯";
    return "📚";
  };

  // Filtrer offres et formations déjà postulées
  const offresDisponibles = offres.filter(o => !aPostule(o.lien));
  const formationsDisponibles = allFormations.filter(f => !aInscrit(f.nom));

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#1A1A2E", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#FF7043", letterSpacing: "-0.5px" }}>YELMA</div>
          <div style={{ fontSize: "10px", color: "#aaa" }}>Mon Espace Personnel</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "white", fontWeight: 600 }}>{candidat.prenom} {candidat.nom}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
            <span style={{ background: isPropulse ? "#FF7043" : "#555", borderRadius: "20px", padding: "1px 8px", fontSize: "9px", color: "white", fontWeight: 600 }}>
              {isPropulse ? "PROPULSE" : "DÉCOUVERTE"}
            </span>
            {joursRestants > 0 && !isPropulse && <span style={{ fontSize: "9px", color: "#aaa" }}>{joursRestants}j essai</span>}
          </div>
        </div>
      </div>

      {!isPropulse && joursRestants === 0 && (
        <div style={{ background: "#FF7043", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "white" }}>🔒 Votre essai est terminé</div>
          <a href="/pricing" style={{ background: "white", color: "#FF7043", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>S'abonner →</a>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E8F0", padding: "0 12px", display: "flex", gap: "2px", overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "12px 10px", border: "none", background: "none", cursor: "pointer", fontSize: "11px", fontWeight: activeTab === tab.id ? 700 : 400, color: activeTab === tab.id ? "#FF7043" : "#888", borderBottom: activeTab === tab.id ? "2px solid #FF7043" : "2px solid transparent", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>

        {/* RAPPORT */}
        {activeTab === "rapport" && (
          <div>
            {candidat.force1 ? (
              <RapportGPS data={candidat} plan={candidat.plan} ville={candidat.ville} roleActuel={candidat.role_actuel} />
            ) : (
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A2E", marginBottom: "8px" }}>Aucun rapport disponible</div>
                <a href="/?lang=fr&free=1" style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>Commencer mon entretien →</a>
              </div>
            )}
          </div>
        )}

        {/* OFFRES */}
        {activeTab === "offres" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {offresDisponibles.length > 0 ? `${offresDisponibles.length} offres disponibles` : offresLoading ? "Recherche..." : "Aucune offre"}
                {candidatures.length > 0 && <span style={{ marginLeft: "8px", color: "#10B981", fontWeight: 600 }}> · {candidatures.length} postulé(s)</span>}
              </div>
              <button onClick={chargerOffres} disabled={offresLoading} style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {offresLoading ? "⏳ Recherche..." : "🔄 Actualiser"}
              </button>
            </div>

            {offresLoading && (
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</div>
                <div style={{ fontSize: "13px", color: "#888" }}>YELMA cherche les meilleures offres pour vous...</div>
              </div>
            )}

            {!offresLoading && offresDisponibles.map((o, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{o.titre}</div>
                    {o.entreprise && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{o.entreprise}</div>}
                    {o.date_publication && <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>📅 {o.date_publication}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", marginLeft: "8px" }}>
                    <span style={{ background: o.score >= 85 ? "#D6FFE8" : o.score >= 70 ? "#FFF8E1" : "#F1EFE8", color: o.score >= 85 ? "#085041" : o.score >= 70 ? "#7A5F00" : "#888", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>
                      {o.score}% match
                    </span>
                    {o.salaire > 0 && <div style={{ fontSize: "12px", fontWeight: 700, color: "#FF7043" }}>{o.salaire.toLocaleString()} $</div>}
                  </div>
                </div>
                {o.insights?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                    {o.insights.map((ins, j) => <span key={j} style={{ background: "#F0F9FF", color: "#0C447C", borderRadius: "20px", padding: "2px 8px", fontSize: "9px" }}>{ins}</span>)}
                  </div>
                )}
                {o.gap && <div style={{ background: "#FFF8E1", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", color: "#7A5F00", marginBottom: "6px" }}>⚠️ Gap : {o.gap}</div>}
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button onClick={() => { setOffreSelectionnee(o); genererLettre(o); }} style={{ background: "#F0F9FF", color: "#0C447C", border: "none", borderRadius: "20px", padding: "5px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>✉️ Lettre</button>
                  <a href={o.lien} target="_blank" rel="noopener noreferrer" onClick={() => {
                    setTimeout(() => {
                      if (window.confirm("Avez-vous postulé pour cette offre ?")) marquerPostule(o);
                    }, 2000);
                  }} style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "5px 12px", fontSize: "10px", fontWeight: 700, textDecoration: "none" }}>
                    {postulLoading === o.lien ? "⏳..." : "Postuler →"}
                  </a>
                  <button onClick={() => marquerPostule(o)} style={{ background: "#D6FFE8", color: "#085041", border: "none", borderRadius: "20px", padding: "5px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                    ✅ J'ai postulé
                  </button>
                </div>
              </div>
            ))}

            {!offresLoading && candidatures.length > 0 && (
              <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#10B981", marginBottom: "8px" }}>✅ OFFRES OÙ VOUS AVEZ POSTULÉ</div>
                {candidatures.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{c.offre_titre}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{c.offre_entreprise} · {new Date(c.date_candidature).toLocaleDateString("fr-CA")}</div>
                    </div>
                    <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", fontWeight: 600 }}>✅ Postulé</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FORMATIONS */}
        {activeTab === "formations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {formationsDisponibles.length > 0 ? `${formationsDisponibles.length} formations disponibles` : "Chargement..."}
                {inscriptions.length > 0 && <span style={{ marginLeft: "8px", color: "#10B981", fontWeight: 600 }}> · {inscriptions.length} inscrit(s)</span>}
              </div>
              <button onClick={chargerFormations} disabled={formationsLoading} style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {formationsLoading ? "⏳..." : "🔄 Actualiser"}
              </button>
            </div>

            {formationsLoading && (
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📚</div>
                <div style={{ fontSize: "13px", color: "#888" }}>YELMA cherche les meilleures formations pour vous...</div>
              </div>
            )}

            {["Renforcement", "Gap marché", "Prochain poste", "Objectif long terme"].map(type => {
              const typeKey = type === "Renforcement" ? "renforcement" : type === "Gap marché" ? "gap" : type === "Prochain poste" ? "prochain_poste" : "objectif_long_terme";
              const list = formations[typeKey as keyof typeof formations].filter(f => !aInscrit(f.nom));
              if (list.length === 0 && !formationsLoading) return null;
              return (
                <div key={type} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>{getTypeIcon(type)} {type.toUpperCase()}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {list.map((f, i) => (
                      <div key={i} style={{ background: "#FAFBFF", borderRadius: "10px", padding: "10px 12px", border: "0.5px solid #E8E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E", marginBottom: "2px" }}>{f.nom}</div>
                            <div style={{ fontSize: "10px", color: "#888" }}>{f.plateforme} · {f.duree}</div>
                            {f.note && <div style={{ fontSize: "9px", color: "#FF7043", marginTop: "2px" }}>⭐ {f.note}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", marginLeft: "8px" }}>
                            {f.prix && <span style={{ fontSize: "10px", fontWeight: 600, color: f.prix === "Gratuit" ? "#10B981" : "#FF7043" }}>{f.prix}</span>}
                            <div style={{ display: "flex", gap: "4px" }}>
                              {f.lien && (
                                <a href={f.lien} target="_blank" rel="noopener noreferrer" onClick={() => {
                                  setTimeout(() => {
                                    if (window.confirm("Êtes-vous inscrit à cette formation ?")) marquerInscrit(f);
                                  }, 2000);
                                }} style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", textDecoration: "none", fontWeight: 600 }}>S'inscrire →</a>
                              )}
                              <button onClick={() => marquerInscrit(f)} disabled={inscritLoading === f.nom} style={{ background: "#D6FFE8", color: "#085041", border: "none", borderRadius: "20px", padding: "3px 8px", fontSize: "9px", fontWeight: 600, cursor: "pointer" }}>
                                ✅ Inscrit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {inscriptions.length > 0 && (
              <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#10B981", marginBottom: "8px" }}>✅ FORMATIONS OÙ VOUS ÊTES INSCRIT</div>
                {inscriptions.map((ins, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{ins.formation_nom}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{ins.formation_plateforme} · {new Date(ins.date_inscription).toLocaleDateString("fr-CA")}</div>
                    </div>
                    <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", fontWeight: 600 }}>✅ Inscrit</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÉVÉNEMENTS */}
        {activeTab === "evenements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#888" }}>{evenements.length > 0 ? `${evenements.length} événements trouvés` : "Chargement..."}</div>
              <button onClick={chargerFormations} disabled={formationsLoading} style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {formationsLoading ? "⏳..." : "🔄 Actualiser"}
              </button>
            </div>
            {evenements.map((e, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ background: e.type === "Mentorat" ? "#D6FFE8" : "#FFE0D6", color: e.type === "Mentorat" ? "#085041" : "#993C1D", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", fontWeight: 600 }}>{e.type}</span>
                  {e.prix && <span style={{ fontSize: "9px", fontWeight: 600, color: e.prix === "Gratuit" ? "#10B981" : "#FF7043" }}>{e.prix}</span>}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "2px" }}>{e.nom}</div>
                <div style={{ fontSize: "10px", color: "#888" }}>{e.organisateur}</div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>📅 {e.date} · 📍 {e.lieu}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
  {e.lien && <a href={e.lien} target="_blank" rel="noopener noreferrer" style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "5px 12px", fontSize: "10px", fontWeight: 700, textDecoration: "none" }}>S'inscrire →</a>}
  <button onClick={() => marquerInscrit({ nom: e.nom, type: e.type, plateforme: e.organisateur, lien: e.lien, duree: "" })} style={{ background: "#D6FFE8", color: "#085041", border: "none", borderRadius: "20px", padding: "5px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
    ✅ Inscrit
  </button>
</div>

  <button onClick={() => marquerInscrit({ nom: e.nom, type: e.type, plateforme: e.organisateur, lien: e.lien, duree: "" })} style={{ background: "#D6FFE8", color: "#085041", border: "none", borderRadius: "20px", padding: "5px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
    ✅ Je m'inscris
  </button>
</div>
              </div>
            ))}
          </div>
        )}

        {/* CV */}
        {activeTab === "cv" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>📄 MON CV YELMA</div>
              {!cv ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>📄</div>
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>YELMA génère votre CV personnalisé basé sur vos compétences révélées</div>
                  <button onClick={genererCV} disabled={cvLoading} style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "20px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    {cvLoading ? "⏳ Génération en cours..." : "✨ Générer mon CV YELMA"}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ background: "#FAFBFF", borderRadius: "10px", padding: "16px", marginBottom: "10px", whiteSpace: "pre-wrap", fontSize: "11px", lineHeight: 1.8, color: "#1A1A2E", border: "0.5px solid #E8E8F0", maxHeight: "400px", overflowY: "auto" }}>{cv}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { navigator.clipboard.writeText(cv); setCvCopied(true); setTimeout(() => setCvCopied(false), 2000); }} style={{ flex: 1, background: "#1A1A2E", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {cvCopied ? "✅ Copié !" : "📋 Copier le CV"}
                    </button>
                    <button onClick={genererCV} disabled={cvLoading} style={{ background: "#F1EFE8", color: "#888", border: "none", borderRadius: "10px", padding: "10px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>{cvLoading ? "⏳" : "🔄"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LETTRE */}
        {activeTab === "lettre" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>✉️ MA LETTRE DE MOTIVATION</div>
              {!lettre ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>✉️</div>
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Générez une lettre pour une offre spécifique</div>
                  <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "16px" }}>Allez dans Offres et cliquez "✉️ Lettre" pour une offre précise</div>
                  <button onClick={() => genererLettre()} disabled={lettreLoading} style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "20px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    {lettreLoading ? "⏳ Génération..." : "✨ Générer une lettre générique"}
                  </button>
                </div>
              ) : (
                <div>
                  {offreSelectionnee && (
                    <div style={{ background: "#F0F9FF", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px", fontSize: "11px", color: "#0C447C" }}>
                      Pour : <strong>{offreSelectionnee.titre}</strong>{offreSelectionnee.entreprise ? ` — ${offreSelectionnee.entreprise}` : ""}
                    </div>
                  )}
                  <div style={{ background: "#FAFBFF", borderRadius: "10px", padding: "16px", marginBottom: "10px", whiteSpace: "pre-wrap", fontSize: "11px", lineHeight: 1.8, color: "#1A1A2E", border: "0.5px solid #E8E8F0", maxHeight: "400px", overflowY: "auto" }}>{lettre}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { navigator.clipboard.writeText(lettre); setLettreCopied(true); setTimeout(() => setLettreCopied(false), 2000); }} style={{ flex: 1, background: "#1A1A2E", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {lettreCopied ? "✅ Copié !" : "📋 Copier la lettre"}
                    </button>
                    <button onClick={() => genererLettre()} disabled={lettreLoading} style={{ background: "#F1EFE8", color: "#888", border: "none", borderRadius: "10px", padding: "10px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>{lettreLoading ? "⏳" : "🔄"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUIVI CANDIDATURES */}
        {activeTab === "candidatures" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>💼 MES CANDIDATURES ({candidatures.length})</div>
              {candidatures.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", fontSize: "12px", color: "#888" }}>Aucune candidature pour le moment</div>
              ) : (
                candidatures.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{c.offre_titre}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{c.offre_entreprise} · {c.offre_source}</div>
                      <div style={{ fontSize: "10px", color: "#aaa" }}>📅 {new Date(c.date_candidature).toLocaleDateString("fr-CA")}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", fontWeight: 600 }}>✅ Postulé</span>
                      {c.offre_salaire > 0 && <span style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600 }}>{c.offre_salaire.toLocaleString()}$</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>📚 MES FORMATIONS ({inscriptions.length})</div>
              {inscriptions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", fontSize: "12px", color: "#888" }}>Aucune inscription pour le moment</div>
              ) : (
                inscriptions.map((ins, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{ins.formation_nom}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{ins.formation_plateforme} · {ins.formation_type}</div>
                      <div style={{ fontSize: "10px", color: "#aaa" }}>📅 {new Date(ins.date_inscription).toLocaleDateString("fr-CA")}</div>
                    </div>
                    <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", fontWeight: 600 }}>✅ Inscrit</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PROFIL */}
        {activeTab === "profil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>👤 MON PROFIL</div>
              {[
                ["Prénom", candidat.prenom], ["Nom", candidat.nom], ["Email", candidat.email],
                ["Rôle actuel", candidat.role_actuel || "—"], ["Ville", candidat.ville || "—"],
                ["Objectif", candidat.objectif_carriere || "—"],
                ["Plan", candidat.plan === "propulse" ? "Propulse ✅" : "Découverte"],
                ["Candidatures", candidatures.length + " offres"],
                ["Formations", inscriptions.length + " inscriptions"],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>{label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#1A1A2E" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>⚙️ ACTIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href="/?lang=fr&free=1" style={{ display: "block", background: "#FF7043", color: "white", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>🔄 Refaire mon entretien YELMA</a>
                {candidat.plan !== "propulse" && (
                  <a href="/pricing" style={{ display: "block", background: "#1A1A2E", color: "white", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>⭐ Passer à Propulse — 4.99$/mois</a>
                )}
                <button onClick={() => { setCandidat(null); window.location.href = "/mon-espace"; }} style={{ background: "#F1EFE8", color: "#888", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>Se déconnecter</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
