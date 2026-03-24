"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Offre = {
  id: string;
  nom: string;
  type: string;
  prix: number;
  description: string;
  lien: string;
  duree: string;
  nb_clics: number;
  nb_conversions: number;
};

type Partenaire = {
  id: string;
  nom: string;
  type: string;
  email: string;
  logo_url: string;
  site_web: string;
  description: string;
  date_contrat: string;
  taux_commission: number;
  statut: string;
  nb_candidats_referes: number;
  nb_clics: number;
  revenus_generes: number;
  offres: Offre[];
};

export default function PartenaireDashboard() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [partenaire, setPartenaire] = useState<Partenaire | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/partenaires/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setPartenaire(data.partenaire);
        setStep("dashboard");
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (step === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-black text-3xl mb-2" style={{ color: "#1A1A2E", letterSpacing: "-1px" }}>YELMA</h1>
            <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 10px" }}/>
            <p className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Espace Partenaire</p>
            <p className="text-xs mt-1" style={{ color: "#888" }}>Accès réservé aux partenaires YELMA</p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>Email partenaire</label>
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ borderColor: "#E8E8F0" }}
                placeholder="votre@organisation.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>Mot de passe</label>
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ borderColor: "#E8E8F0" }}
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-xs text-center" style={{ color: "#FF7043" }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#FF7043" }}
            >
              {loading ? "Connexion..." : "Accéder à mon espace →"}
            </button>
            <button onClick={() => router.push("/")} className="text-xs text-center" style={{ color: "#888", background: "none", border: "none", cursor: "pointer" }}>
              ← Retour à l'accueil
            </button>
          </div>

          {/* Note contact */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#888" }}>Pas encore partenaire ?</p>
            <a href="mailto:partenaires@yelma.ca" className="text-xs font-semibold" style={{ color: "#FF7043" }}>
              Contactez-nous → partenaires@yelma.ca
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!partenaire) return null;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "contrat", label: "Mon contrat" },
    { id: "offres", label: "Mes offres" },
    { id: "catalogue", label: "Catalogue public" },
    { id: "stats", label: "Statistiques" },
  ];

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "#FF7043", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "white" }}>
              {partenaire.nom[0]}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{partenaire.nom}</div>
              <div style={{ fontSize: "10px", color: "#FF7043" }}>Partenaire YELMA · {partenaire.type}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: partenaire.statut === "actif" ? "#D6FFE8" : "#FFE0D6", color: partenaire.statut === "actif" ? "#085041" : "#993C1D", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 600 }}>
              {partenaire.statut === "actif" ? "✅ Actif" : "⏳ En attente"}
            </div>
            <button onClick={() => setStep("login")} style={{ background: "none", border: "none", color: "#aaa", fontSize: "11px", cursor: "pointer" }}>Déconnexion</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: activeTab === tab.id ? "#FF7043" : "white", color: activeTab === tab.id ? "white" : "#888", outline: activeTab === tab.id ? "none" : "0.5px solid #E8E8F0" } as React.CSSProperties}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vue d'ensemble */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Stats rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[
                { label: "Candidats référés", value: partenaire.nb_candidats_referes, color: "#FF7043" },
                { label: "Clics sur vos offres", value: partenaire.nb_clics, color: "#0EA5E9" },
                { label: "Revenus générés", value: `${partenaire.revenus_generes} $`, color: "#10B981" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Résumé partenariat */}
            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>RÉSUMÉ DU PARTENARIAT</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  ["Type de partenariat", partenaire.type],
                  ["Taux de commission", `${partenaire.taux_commission}%`],
                  ["Date de contrat", partenaire.date_contrat ? new Date(partenaire.date_contrat).toLocaleDateString("fr-CA") : "—"],
                  ["Statut", partenaire.statut],
                  ["Site web", partenaire.site_web || "—"],
                  ["Email", partenaire.email],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontSize: "9px", color: "#888", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 500, marginTop: "2px" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {partenaire.description && (
              <div style={{ background: "#F8F6FF", borderLeft: "3px solid #FF7043", borderRadius: "0 12px 12px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#888", marginBottom: "4px" }}>À PROPOS</div>
                <div style={{ fontSize: "12px", color: "#1A1A2E", lineHeight: 1.6 }}>{partenaire.description}</div>
              </div>
            )}

          </div>
        )}

        {/* Contrat */}
        {activeTab === "contrat" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "0.5px solid #E8E8F0" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A2E", marginBottom: "16px" }}>📄 Contrat de Partenariat YELMA</div>

            <div style={{ background: "#FAFBFF", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#888" }}>PARTENAIRE</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{partenaire.nom}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "#888" }}>DATE</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>
                    {partenaire.date_contrat ? new Date(partenaire.date_contrat).toLocaleDateString("fr-CA") : "—"}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "0.5px solid #E8E8F0", paddingTop: "12px" }}>
                {[
                  ["Type de partenariat", partenaire.type],
                  ["Taux de commission YELMA", `${partenaire.taux_commission}% sur chaque conversion`],
                  ["Tracking", "Lien YELMA unique par offre"],
                  ["Paiement", "Mensuel par virement bancaire"],
                  ["Durée", "Renouvellement annuel automatique"],
                  ["Statut", partenaire.statut === "actif" ? "✅ Actif" : "⏳ En attente de signature"],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #F1EFE8" }}>
                    <span style={{ fontSize: "11px", color: "#888" }}>{label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "#1A1A2E" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FFE0D6", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#993C1D", marginBottom: "8px" }}>Pour toute question sur votre contrat :</div>
              <a href="mailto:partenaires@yelma.ca" style={{ fontSize: "12px", fontWeight: 600, color: "#FF7043" }}>partenaires@yelma.ca</a>
            </div>
          </div>
        )}

        {/* Offres */}
        {activeTab === "offres" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>VOS OFFRES LISTÉES SUR YELMA</div>
              {partenaire.offres && partenaire.offres.length > 0 ? (
                partenaire.offres.map((offre, i) => (
                  <div key={i} style={{ padding: "12px", background: "#FAFBFF", borderRadius: "10px", marginBottom: "8px", border: "0.5px solid #E8E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{offre.nom}</div>
                        <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>{offre.type} · {offre.prix} $</div>
                      </div>
                      <span style={{ background: "#D6FFE8", color: "#085041", borderRadius: "20px", padding: "2px 8px", fontSize: "9px" }}>Actif</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0EA5E9" }}>{offre.nb_clics || 0}</div>
                        <div style={{ fontSize: "9px", color: "#888" }}>Clics</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#10B981" }}>{offre.nb_conversions || 0}</div>
                        <div style={{ fontSize: "9px", color: "#888" }}>Conversions</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#FF7043" }}>{((offre.nb_conversions || 0) * offre.prix * (partenaire.taux_commission / 100)).toFixed(0)} $</div>
                        <div style={{ fontSize: "9px", color: "#888" }}>Commission</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "30px", color: "#888", fontSize: "12px" }}>
                  Aucune offre listée pour le moment.<br/>
                  <a href="mailto:partenaires@yelma.ca" style={{ color: "#FF7043", fontSize: "11px" }}>Contactez-nous pour ajouter vos offres →</a>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Catalogue public — Cluster 2 */}
        {activeTab === "catalogue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "#FFF8F6", borderRadius: "12px", padding: "12px 16px", border: "1.5px solid #FFE0D6" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", marginBottom: "4px" }}>📢 Cluster public — visible par les candidats</div>
              <div style={{ fontSize: "10px", color: "#888" }}>Ces offres apparaissent dans les rapports YELMA avec un lien "Détail →" qui mène ici.</div>
            </div>

            {partenaire.offres && partenaire.offres.length > 0 ? (
              partenaire.offres.map((offre, i) => (
                <div key={i} style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px" }}>
                          {offre.type?.toLowerCase().includes("certif") ? "🏆" :
                           offre.type?.toLowerCase().includes("mentor") ? "🤝" :
                           offre.type?.toLowerCase().includes("événement") || offre.type?.toLowerCase().includes("evenement") ? "🎤" :
                           offre.type?.toLowerCase().includes("diplôme") || offre.type?.toLowerCase().includes("diplome") ? "🎓" : "📚"}
                        </span>
                        <span style={{ fontSize: "9px", background: "#FFE0D6", color: "#993C1D", borderRadius: "20px", padding: "2px 8px", fontWeight: 600 }}>{offre.type || "Formation"}</span>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>{offre.nom}</div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#FF7043" }}>{offre.prix} $</div>
                  </div>

                  <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.6, marginBottom: "10px" }}>
                    {offre.description || "Description non disponible."}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    {[
                      ["📅 Durée", offre.duree || "—"],
                      ["🏢 Organisme", partenaire.nom],
                      ["💰 Prix", `${offre.prix} $ CAD`],
                      ["🔗 Site web", partenaire.site_web || "—"],
                    ].map(([label, value], j) => (
                      <div key={j} style={{ background: "#FAFBFF", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "9px", color: "#888" }}>{label}</div>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "#1A1A2E" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                     {partenaire.site_web && (
                      <a
                        href={partenaire.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, background: "#FF7043", color: "white", borderRadius: "10px", padding: "10px", fontSize: "12px", fontWeight: 600, textDecoration: "none", textAlign: "center" }}
                      >
                        S&apos;inscrire →
                      </a>
                    )}
                    
                       href={`mailto:${partenaire.email}`}
                      <a
                      style={{ flex: 1, background: "#F1EFE8", color: "#1A1A2E", borderRadius: "10px", padding: "10px", fontSize: "12px", fontWeight: 600, textDecoration: "none", textAlign: "center" }}
                    >
                      Contacter →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: "white", borderRadius: "12px", padding: "30px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📭</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Aucune offre dans le catalogue pour le moment.</div>
                <a href={`mailto:partenaires@yelma.ca`} style={{ fontSize: "11px", color: "#FF7043", fontWeight: 600 }}>Contactez-nous pour ajouter vos offres →</a>
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        {activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>PERFORMANCE GLOBALE</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Candidats référés par YELMA", value: partenaire.nb_candidats_referes, max: 100, color: "#FF7043" },
                  { label: "Clics sur vos offres", value: partenaire.nb_clics, max: 500, color: "#0EA5E9" },
                  { label: "Taux de conversion", value: partenaire.nb_candidats_referes > 0 ? Math.round((partenaire.nb_candidats_referes / partenaire.nb_clics) * 100) : 0, max: 100, color: "#10B981", suffix: "%" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#1A1A2E" }}>{stat.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: stat.color }}>{stat.value}{stat.suffix || ""}</span>
                    </div>
                    <div style={{ height: "6px", background: "#F1EFE8", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%`, height: "100%", background: stat.color, borderRadius: "3px" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "12px" }}>REVENUS ESTIMÉS</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#FAFBFF", borderRadius: "10px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Total revenus générés via YELMA</div>
                  <div style={{ fontSize: "9px", color: "#888", marginTop: "2px" }}>Commission YELMA : {partenaire.taux_commission}%</div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#10B981" }}>{partenaire.revenus_generes} $</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
