"use client";

import { useState } from "react";
import RapportGPS from "../components/RapportGPS";

const rapportDemo = {
  force1: "Analyse financière",
  force1_desc: "Tu comprends les implications économiques des projets et contribues à la stratégie globale de l'entreprise.",
  force2: "Vision globale",
  force2_desc: "Tu vois comment les différents éléments s'imbriquent — pensée stratégique de haut niveau.",
  force3: "Leadership humain",
  force3_desc: "Tu valorises les connexions humaines et inspires ton équipe à se dépasser.",
  salaire_actuel: 51000,
  titre_actuel: "Contrôleur de projet",
  ville: "Montréal",
  opportunites: [
    { titre: "Responsable de portefeuille", salaire: 75000, description: "Ta vision globale correspond parfaitement à ce rôle stratégique." },
    { titre: "Contrôleur financier", salaire: 90000, description: "Dirige des analyses financières approfondies en phase avec la gestion de projets." },
    { titre: "Directeur de projet", salaire: 110000, description: "Ton leadership humain et ton analyse te permettront d'exceller dans ce rôle." },
  ],
  gps_an1: { titre: "Analyste de projet senior", salaire: 60000, action: "Développer des compétences en gestion de portefeuille" },
  gps_an2: { titre: "Responsable de portefeuille", salaire: 75000, action: "Suivre des formations en gestion financière avancée" },
  gps_an3: { titre: "Contrôleur financier", salaire: 90000, action: "Réseauter avec des professionnels du secteur" },
  gps_an4: { titre: "Directeur de projet", salaire: 110000, action: "Obtenir la certification PMP avancée" },
  gps_an5: { titre: "Directeur de portefeuille", salaire: 125000, action: "OBJECTIF ATTEINT !" },
  formations: [
    { nom: "Gestion de projet avancée", plateforme: "Coursera", duree: "3 mois" },
    { nom: "Analyse financière", plateforme: "Udemy", duree: "2 mois" },
    { nom: "Leadership et management", plateforme: "LinkedIn Learning", duree: "1 mois" },
  ],
  certifications: [
    { nom: "PMP", organisme: "Project Management Institute" },
    { nom: "CMA", organisme: "CPA Canada" },
  ],
  message_final: "Tu as toutes les qualités pour réussir. Avec ta détermination et tes forces uniques, tu es sur la bonne voie pour atteindre tes objectifs professionnels. Continue à croire en toi ! 🚀",
};

export default function Preview() {
  const [plan, setPlan] = useState<"gratuit" | "propulse">("gratuit");

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Header preview */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>🎨 Mode Prévisualisation</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>Testez le rendu des deux plans</div>
          </div>
          <a href="/" style={{ fontSize: "11px", color: "#aaa", textDecoration: "none" }}>← Accueil</a>
        </div>

        {/* Toggle plan */}
        <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "16px", border: "0.5px solid #E8E8F0", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPlan("gratuit")}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", background: plan === "gratuit" ? "#1A1A2E" : "#F1EFE8", color: plan === "gratuit" ? "white" : "#888", fontSize: "13px", fontWeight: 700 }}
          >
            Plan Gratuit
          </button>
          <button
            onClick={() => setPlan("propulse")}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", background: plan === "propulse" ? "#FF7043" : "#F1EFE8", color: plan === "propulse" ? "white" : "#888", fontSize: "13px", fontWeight: 700 }}
          >
            Plan Propulse
          </button>
        </div>

        {/* Badge plan actif */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ background: plan === "propulse" ? "#FFE0D6" : "#F1EFE8", color: plan === "propulse" ? "#993C1D" : "#888", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", fontWeight: 600 }}>
            {plan === "propulse" ? "✅ Tout visible — rien de flouté" : "🔒 An 2-4 floutés — formations cachées"}
          </span>
        </div>

        {/* Rapport */}
        <RapportGPS data={rapportDemo} plan={plan} ville="Montréal" />

      </div>
    </div>
  );
}
