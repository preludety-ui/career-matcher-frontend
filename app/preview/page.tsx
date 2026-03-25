"use client";

import { useState } from "react";
import RapportGPS from "../components/RapportGPS";

// Profils pré-remplis pour chaque cas
const cas9Profils = {
  1: {
    label: "Cas 1 — Débutant total",
    candidatInfo: {
      prenom: "Alex", nom: "Test", email: "test.cas1@yelma.ca",
      diplome: "Autodidacte / Sans diplôme", annee_diplome: "", domaine_etudes: "",
      annee_experience: "Aucune", annee_autre_experience: "Aucune",
      role_actuel: "", domaine_actuel: "", ville: "Montréal",
      statut_emploi: "En recherche d'emploi active", objectif_declare: "",
      salaire_min: 35000, salaire_max: 42000,
    },
    reponses: [
      "J'aime aider les gens et résoudre des problèmes du quotidien",
      "Je préfère le contact avec les gens, pas trop derrière un écran",
      "Les gens disent que je suis bon pour expliquer les choses clairement",
      "J'ai aidé mon voisin à organiser ses finances personnelles",
      "Je suis très patient et j'apprends vite quand quelque chose m'intéresse",
    ],
  },
  2: {
    label: "Cas 2 — Débutant avec diplôme",
    candidatInfo: {
      prenom: "Marie", nom: "Test", email: "test.cas2@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2024", domaine_etudes: "Comptabilité",
      annee_experience: "Aucune", annee_autre_experience: "Aucune",
      role_actuel: "", domaine_actuel: "", ville: "Montréal",
      statut_emploi: "En recherche d'emploi active", objectif_declare: "",
      salaire_min: 42000, salaire_max: 50000,
    },
    reponses: [
      "J'ai choisi la comptabilité car j'aime les chiffres et l'ordre",
      "J'ai adoré les cours de fiscalité et d'audit",
      "Mon projet de fin d'études portait sur l'optimisation fiscale d'une PME",
      "Je veux travailler dans un cabinet comptable ou en entreprise",
      "La finance m'attire aussi, surtout l'analyse financière",
    ],
  },
  3: {
    label: "Cas 3 — Débutant avec stage",
    candidatInfo: {
      prenom: "Lucas", nom: "Test", email: "test.cas3@yelma.ca",
      diplome: "DEC / Cégep", annee_diplome: "2023", domaine_etudes: "Informatique",
      annee_experience: "Aucune", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Stagiaire développeur", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "En recherche d'emploi active", objectif_declare: "",
      salaire_min: 40000, salaire_max: 48000,
    },
    reponses: [
      "Mon stage chez une startup tech où j'ai développé des fonctionnalités React",
      "Je codais les interfaces utilisateur et je faisais des revues de code",
      "J'ai appris que j'aime résoudre des bugs complexes et collaborer en équipe",
      "L'environnement startup dynamique me convenait parfaitement",
      "J'aurais voulu faire plus de backend et de bases de données",
    ],
  },
  4: {
    label: "Cas 4 — Débutant avec objectif",
    candidatInfo: {
      prenom: "Sarah", nom: "Test", email: "test.cas4@yelma.ca",
      diplome: "Diplôme secondaire", annee_diplome: "2022", domaine_etudes: "",
      annee_experience: "Aucune", annee_autre_experience: "Moins de 6 mois",
      role_actuel: "", domaine_actuel: "", ville: "Montréal",
      statut_emploi: "En recherche d'emploi active", objectif_declare: "Développeur web",
      salaire_min: 42000, salaire_max: 55000,
    },
    reponses: [
      "Je veux devenir développeur web car j'adore créer des sites et voir les résultats immédiatement",
      "J'ai fait quelques tutoriels HTML/CSS et créé un petit site pour ma famille",
      "Je pense avoir de la logique et de la persévérance pour résoudre les problèmes",
      "Il me manque des bases solides en JavaScript et les frameworks modernes",
      "J'ai regardé des vidéos sur React et ça m'a beaucoup intéressé",
    ],
  },
  5: {
    label: "Cas 5 — Junior sans objectif",
    candidatInfo: {
      prenom: "Thomas", nom: "Test", email: "test.cas5@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2022", domaine_etudes: "Finance",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Analyste junior", domaine_actuel: "Finance", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "",
      salaire_min: 52000, salaire_max: 60000,
    },
    reponses: [
      "J'ai créé un tableau de bord Power BI qui a réduit le temps de reporting de 40%",
      "J'aime l'analyse de données et la visualisation des tendances financières",
      "Je n'aime pas les tâches répétitives sans valeur ajoutée analytique",
      "Je me sens le plus compétent en modélisation financière et Excel avancé",
      "J'aimerais prendre plus de responsabilités en analyse stratégique",
    ],
  },
  6: {
    label: "Cas 6 — Junior avec objectif",
    candidatInfo: {
      prenom: "Karim", nom: "Test", email: "test.cas6@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2023", domaine_etudes: "Gestion de projet",
      annee_experience: "Moins de 1 an", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Assistant contrôleur de projet", domaine_actuel: "Gestion de projet", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Chargé de projet",
      salaire_min: 50000, salaire_max: 58000,
    },
    reponses: [
      "J'ai accompagné les équipes durant les scrums en calculant le ratio reste à faire sur délai",
      "J'utilise Excel, MS Project et Jira pour le suivi des tâches et des budgets",
      "Il me manque encore de l'autonomie dans la gestion complète d'un projet",
      "J'ai développé des compétences en communication avec les parties prenantes",
      "Je suis motivé par la livraison réussie de projets complexes",
    ],
  },
  7: {
    label: "Cas 7 — Intermédiaire 3-5 ans",
    candidatInfo: {
      prenom: "Isabelle", nom: "Test", email: "test.cas7@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2019", domaine_etudes: "Administration",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Chargé de projet", domaine_actuel: "Technologies", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Directeur de projet",
      salaire_min: 72000, salaire_max: 85000,
    },
    reponses: [
      "J'ai livré la migration d'un système bancaire de 2M$ dans les délais et le budget",
      "Je suis frustré par le manque de vision stratégique dans mon poste actuel",
      "Je veux prendre en charge un programme multi-projets et gérer une équipe",
      "Dans 5 ans je me vois Directeur de projet ou chargé de programme senior",
      "Je veux absolument développer mes compétences en leadership et gestion d'équipe",
    ],
  },
  8: {
    label: "Cas 8 — Reconversion",
    candidatInfo: {
      prenom: "Sophie", nom: "Test", email: "test.cas8@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2015", domaine_etudes: "Éducation",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Enseignante", domaine_actuel: "Éducation", ville: "Montréal",
      statut_emploi: "En reconversion professionnelle", objectif_declare: "Développeur web",
      salaire_min: 60000, salaire_max: 70000,
    },
    reponses: [
      "J'ai besoin d'un nouveau défi — l'enseignement ne me stimule plus intellectuellement",
      "J'ai développé des cours interactifs numériques très appréciés par mes élèves",
      "Ma capacité à expliquer des concepts complexes clairement est très transférable",
      "J'ai suivi des cours en ligne de HTML/CSS et je comprends les bases",
      "Ma plus grande crainte est d'être trop vieille pour apprendre la programmation",
    ],
  },
 
  10: {
    label: "Cas 10 — Senior 6-10 ans",
    candidatInfo: {
      prenom: "David", nom: "Test", email: "test.cas10@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2015", domaine_etudes: "Informatique",
      annee_experience: "6 à 10 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Développeur senior", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Directeur technique",
      salaire_min: 95000, salaire_max: 115000,
    },
    reponses: [
      "J'ai architecturé et livré une plateforme cloud qui supporte 2 millions d'utilisateurs",
      "Mon expertise la plus rare est l'architecture microservices et la scalabilité",
      "Je veux évoluer vers un rôle de leadership technique — moins de code, plus de vision",
      "Je ne veux plus faire du développement pur — je veux définir l'architecture globale",
      "Dans 5 ans je me vois CTO ou Directeur technique d'une scale-up",
    ],
  },
  9: {
    label: "Cas 9 — Senior 10+ ans",
    candidatInfo: {
      prenom: "Michel", nom: "Test", email: "test.cas9@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2010", domaine_etudes: "Management",
      annee_experience: "Plus de 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Directeur de projet", domaine_actuel: "Technologies", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "VP des opérations",
      salaire_min: 110000, salaire_max: 130000,
    },
    reponses: [
      "J'ai transformé le département IT d'une banque — 200 employés — en 3 ans avec ROI de 35%",
      "Mon expertise la plus rare est la transformation digitale à grande échelle dans le secteur financier",
      "J'aspire à la direction générale — je veux avoir un impact stratégique sur toute l'organisation",
      "Je ne veux plus gérer des projets opérationnels — je veux définir la vision et la stratégie",
      "Dans 5 ans je me vois VP ou membre du conseil d'administration",
    ],
  },
};

type RapportData = {
  force1?: string; force1_desc?: string;
  force2?: string; force2_desc?: string;
  force3?: string; force3_desc?: string;
  axe1?: string; axe1_desc?: string;
  axe2?: string; axe2_desc?: string;
  salaire_min?: number; salaire_max?: number;
  role_actuel?: string; ville?: string;
  objectif_carriere?: string;
  scenario_objectif?: number;
  message_objectif?: string;
  delai_objectif?: string;
  analyse_comparative?: string;
  opportunites?: { titre: string; salaire: number; description: string }[];
  gps_an1?: { titre: string; salaire: number; action: string };
  gps_an2?: { titre: string; salaire: number; action: string };
  gps_an3?: { titre: string; salaire: number; action: string };
  gps_an4?: { titre: string; salaire: number; action: string };
  gps_an5?: { titre: string; salaire: number; action: string };
  formations?: { nom: string; type: string; plateforme: string; duree: string }[];
  certifications?: { nom: string; organisme: string }[];
};

export default function Preview() {
  const [casSelectionne, setCasSelectionne] = useState<number>(6);
  const [plan, setPlan] = useState<"decouverte" | "propulse">("propulse");
  const [rapport, setRapport] = useState<RapportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [etape, setEtape] = useState("");

  const casActuel = cas9Profils[casSelectionne as keyof typeof cas9Profils];

  const simulerEntretien = async () => {
    setLoading(true);
    setRapport(null);
    setEtape("Initialisation de l'entretien...");

    try {
      const { candidatInfo, reponses } = casActuel;
      const history: { role: string; content: string }[] = [];

      // Simuler les 5 échanges
      for (let i = 0; i < reponses.length; i++) {
        setEtape("Échange " + (i + 1) + " / 5 en cours...");

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history,
            lang: "fr",
            email: candidatInfo.email,
            nom: candidatInfo.nom,
            prenom: candidatInfo.prenom,
            candidatInfo,
          }),
        });

        const data = await res.json();
        const botReply = data.reply || "";

        // Ajouter la réponse du bot
        history.push({ role: "assistant", content: botReply });

        // Vérifier si c'est déjà le rapport final
        if (data.rapportData) {
          setRapport(data.rapportData);
          setEtape("✅ Rapport généré avec succès !");
          setLoading(false);
          return;
        }

        // Ajouter la réponse simulée du candidat (sauf après le dernier échange)
        if (i < reponses.length - 1) {
          history.push({ role: "user", content: reponses[i] });
        } else {
          // Dernier échange — forcer la génération du rapport
          history.push({ role: "user", content: reponses[i] });
          setEtape("Génération du rapport final...");

          const finalRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              history,
              lang: "fr",
              email: candidatInfo.email,
              nom: candidatInfo.nom,
              prenom: candidatInfo.prenom,
              candidatInfo,
            }),
          });

          const finalData = await finalRes.json();
          if (finalData.rapportData) {
            setRapport(finalData.rapportData);
            setEtape("✅ Rapport généré avec succès !");
          } else {
            setEtape("⚠️ Rapport généré sans données structurées");
          }
        }
      }
    } catch (error) {
      console.error("Erreur simulation:", error);
      setEtape("❌ Erreur lors de la simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>🎨 Mode Test Rapide</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>9 cas profils — rapport automatique</div>
          </div>
          <a href="/" style={{ fontSize: "11px", color: "#aaa", textDecoration: "none" }}>← Accueil</a>
        </div>

        {/* Sélecteur cas */}
        <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "8px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>SÉLECTIONNER UN CAS PROFIL</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {Object.entries(cas9Profils).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { setCasSelectionne(parseInt(key)); setRapport(null); setEtape(""); }}
                style={{
                  padding: "8px 12px", borderRadius: "8px", border: "none",
                  cursor: "pointer", textAlign: "left", fontSize: "12px",
                  fontWeight: casSelectionne === parseInt(key) ? 700 : 400,
                  background: casSelectionne === parseInt(key) ? "#FFE0D6" : "#F8F8F8",
                  color: casSelectionne === parseInt(key) ? "#993C1D" : "#555",
                }}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle plan */}
        <div style={{ background: "white", borderRadius: "12px", padding: "10px", marginBottom: "8px", border: "0.5px solid #E8E8F0", display: "flex", gap: "8px" }}>
          <button onClick={() => setPlan("decouverte")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", background: plan === "decouverte" ? "#1A1A2E" : "#F1EFE8", color: plan === "decouverte" ? "white" : "#888", fontSize: "12px", fontWeight: 700 }}>
            Plan Découverte
          </button>
          <button onClick={() => setPlan("propulse")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", background: plan === "propulse" ? "#FF7043" : "#F1EFE8", color: plan === "propulse" ? "white" : "#888", fontSize: "12px", fontWeight: 700 }}>
            Plan Propulse
          </button>
        </div>

        {/* Bouton simuler */}
        <button
          onClick={simulerEntretien}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", border: "none",
            background: loading ? "#aaa" : "#FF7043", color: "white",
            fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "12px",
          }}
        >
          {loading ? "⏳ Simulation en cours..." : "🚀 Simuler entretien complet — " + casActuel.label}
        </button>

        {/* Étape en cours */}
        {etape && (
          <div style={{ background: "#F8F6FF", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", fontSize: "12px", color: "#8B5CF6", fontWeight: 500, textAlign: "center" }}>
            {etape}
          </div>
        )}

        {/* Profil du cas */}
        <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "12px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>PROFIL DU CAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            {[
              ["Prénom", casActuel.candidatInfo.prenom],
              ["Diplôme", casActuel.candidatInfo.diplome],
              ["Expérience", casActuel.candidatInfo.annee_experience],
              ["Rôle actuel", casActuel.candidatInfo.role_actuel || "—"],
              ["Ville", casActuel.candidatInfo.ville],
              ["Statut", casActuel.candidatInfo.statut_emploi],
              ["Objectif", casActuel.candidatInfo.objectif_declare || "Non fourni"],
              ["Salaire", casActuel.candidatInfo.salaire_min + "$ — " + casActuel.candidatInfo.salaire_max + "$"],
            ].map(([label, value], i) => (
              <div key={i} style={{ background: "#FAFBFF", borderRadius: "6px", padding: "5px 8px" }}>
                <div style={{ fontSize: "8px", color: "#aaa" }}>{label}</div>
                <div style={{ fontSize: "10px", color: "#1A1A2E", fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rapport généré */}
        {rapport && (
          <RapportGPS
            data={rapport}
            plan={plan}
            ville={casActuel.candidatInfo.ville}
            roleActuel={casActuel.candidatInfo.role_actuel}
          />
        )}

      </div>
    </div>
  );
}

