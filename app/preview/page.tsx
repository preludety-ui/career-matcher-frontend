"use client";

import { useState } from "react";
import RapportGPS from "../components/RapportGPS";

const rapportDecouverte = {
  force1: "Analyse budgétaire",
  force1_desc: "Capacité à évaluer les écarts entre coûts réels et prévisionnels pour soutenir la prise de décision.",
  force2: "Suivi d'avancement des tâches",
  force2_desc: "Aptitude à contrôler le statut des livrables et à alerter proactivement sur les retards potentiels.",
  force3: "Coordination des équipes",
  force3_desc: "Compétence à aligner les parties prenantes sur les objectifs et les risques du projet.",
  salaire_min: 45000,
  salaire_max: 55000,
  role_actuel: "Assistant contrôleur de projet",
  ville: "Montréal",
  objectif_carriere: "Directeur de projet",
  scenario_objectif: 3,
  message_objectif: "Ton objectif de Directeur est excellent à long terme. Avec cette progression, tu l'atteindras vers 2036-2038. En 5 ans, tu peux viser Contrôleur de projet confirmé.",
  delai_objectif: "10-12 ans",
  analyse_comparative: "Ton objectif de Directeur est réaliste à long terme — compte 10-12 ans avec cette progression.",
  opportunites: [
    { titre: "Assistant de projet", salaire: 48000, description: "Suivi des tâches et budgets." },
    { titre: "Analyste de projet junior", salaire: 52000, description: "Analyse des données de projet." },
    { titre: "Contrôleur junior", salaire: 56000, description: "Contrôle budgétaire et reporting." },
  ],
  gps_an1: { titre: "Assistant contrôleur confirmé", salaire: 52000, action: "Renforcer les compétences en analyse budgétaire" },
  gps_an2: { titre: "Contrôleur de projet junior", salaire: 58000, action: "Obtenir certification CAPM" },
  gps_an3: { titre: "Contrôleur de projet", salaire: 64000, action: "Gérer des projets de façon autonome" },
  gps_an4: { titre: "Contrôleur de projet senior", salaire: 71000, action: "Superviser une équipe junior" },
  gps_an5: { titre: "Contrôleur de projet confirmé", salaire: 78000, action: "POTENTIEL MAX 5 ANS !" },
  formations: [
    { nom: "MS Project avancé", type: "Renforcement", plateforme: "Udemy", duree: "2 mois" },
    { nom: "Analyse financière de projet", type: "Gap marché", plateforme: "Coursera", duree: "3 mois" },
    { nom: "CAPM — Certified Associate PM", type: "Prochain poste", plateforme: "PMI", duree: "4 mois" },
    { nom: "PMP — Project Management Professional", type: "Objectif long terme", plateforme: "PMI", duree: "6 mois" },
  ],
  certifications: [
    { nom: "CAPM", organisme: "Project Management Institute" },
    { nom: "Scrum Master", organisme: "Scrum Alliance" },
  ],
  message_final: "Tu as toutes les compétences pour progresser rapidement. Continue à te former et à prendre des initiatives — tu es sur la bonne voie !",
};

const rapportPropulse = {
  ...rapportDecouverte,
  scenario_objectif: 2,
  message_objectif: "Ton objectif de Chef de projet senior est atteignable en 6-8 ans. En 5 ans, tu peux viser Contrôleur de projet confirmé — excellent tremplin !",
  delai_objectif: "6-8 ans",
  objectif_carriere: "Chef de projet senior",
};

export default function Preview() {
  const [plan, setPlan] = useState<"decouverte" | "propulse">("decouverte");

  const rapportActuel = plan === "propulse" ? rapportPropulse : rapportDecouverte;

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
        <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "12px", border: "0.5px solid #E8E8F0", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPlan("decouverte")}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", background: plan === "decouverte" ? "#1A1A2E" : "#F1EFE8", color: plan === "decouverte" ? "white" : "#888", fontSize: "13px", fontWeight: 700 }}
          >
            Plan Découverte
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
            {plan === "propulse"
              ? "✅ Tout visible — formations, certifications, objectif"
              : "🔒 An 2-5 floutés — 1 opportunité — formations cachées"}
          </span>
        </div>

        {/* Rapport */}
        <RapportGPS
          data={rapportActuel}
          plan={plan === "propulse" ? "propulse" : "decouverte"}
          ville="Montréal"
          roleActuel="Assistant contrôleur de projet"
        />

      </div>
    </div>
  );
}
