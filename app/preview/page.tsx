"use client";

import { useState } from "react";

// 10 profils de test couvrant tous les cas
const PROFILS_TEST = [
  {
    id: 1,
    label: "Cas 1 — Autodidacte",
    candidatInfo: {
      prenom: "Alex", nom: "Test", email: "test.cas1@yelma.ca",
      diplome: "Autodidacte / Sans diplôme", annee_diplome: "", domaine_etudes: "",
      annee_experience: "Aucune", annee_autre_experience: "Aucune",
      role_actuel: "", domaine_actuel: "Commerce", ville: "Montréal",
      statut_emploi: "En recherche d'emploi active", objectif_declare: "Vendeur senior",
      salaire_min: 35000, salaire_max: 42000,
    },
    reponses: [
      "J'ai monté une page Instagram pour vendre des produits artisanaux et j'ai atteint 500 abonnés et 50 ventes par mois en 6 mois",
      "J'ai géré les commandes, les livraisons et le service client seul pendant 2 ans",
      "J'ai créé des promotions saisonnières qui ont doublé mes ventes en décembre",
      "Quand un client était insatisfait, je remplaçais le produit immédiatement sans question",
      "J'ai appris à utiliser Shopify, Canva et Google Analytics par moi-même",
      "Je répondais à tous les messages dans les 2 heures même la nuit",
      "J'ai développé un système de fidélité qui a ramené 30% de clients récurrents",
      "Ma plus grande difficulté était de gérer les ruptures de stock en période de forte demande",
    ],
  },
  {
    id: 2,
    label: "Cas 2 — Étudiant sans stage",
    candidatInfo: {
      prenom: "Marie", nom: "Test", email: "test.cas2@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "En cours", domaine_etudes: "Comptabilité",
      annee_experience: "Aucune", annee_autre_experience: "Aucune",
      role_actuel: "", domaine_actuel: "Finance", ville: "Montréal",
      statut_emploi: "Étudiant(e)", objectif_declare: "Comptable",
      salaire_min: 42000, salaire_max: 50000,
    },
    reponses: [
      "J'ai eu A+ dans mon cours d'audit et j'ai créé un modèle Excel d'analyse financière que le prof a utilisé comme exemple",
      "J'ai choisi comptabilité parce que j'adore les chiffres et j'aime résoudre des problèmes complexes",
      "Dans mes travaux d'équipe, je suis toujours celle qui organise et qui crée les plans de travail",
      "Mon projet de fin d'études portait sur l'optimisation fiscale d'une PME fictive avec des économies de 15%",
      "J'ai obtenu la meilleure note de ma classe en fiscalité deux semestres de suite",
      "Je suis trésorière de mon association étudiante et je gère un budget de 8000$",
      "J'ai appris QuickBooks et Sage par moi-même en regardant des tutoriels",
      "Mon professeur m'a recommandé pour un prix d'excellence académique cette année",
    ],
  },
  {
    id: 3,
    label: "Cas 3 — Étudiant avec stage",
    candidatInfo: {
      prenom: "Lucas", nom: "Test", email: "test.cas3@yelma.ca",
      diplome: "DEC / Cégep", annee_diplome: "En cours", domaine_etudes: "Informatique",
      annee_experience: "Aucune", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Stagiaire développeur", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "Étudiant(e)", objectif_declare: "Développeur full-stack",
      salaire_min: 40000, salaire_max: 48000,
    },
    reponses: [
      "J'ai développé une fonctionnalité de notification push pour l'app mobile avec 15 000 utilisateurs actifs",
      "J'ai réécrit 3 composants React legacy en TypeScript ce qui a réduit les bugs de 40%",
      "Quand j'avais un problème, je cherchais d'abord seul pendant 30 minutes avant de demander de l'aide",
      "J'ai créé une documentation technique complète que l'équipe utilise encore",
      "Mon superviseur m'a confié un ticket critique en production après seulement 2 semaines",
      "J'ai participé à tous les code reviews et j'ai proposé des améliorations acceptées",
      "J'ai appris React Native en 3 semaines pour les besoins du projet",
      "Je suis resté après les heures pour livrer une fonctionnalité urgente avant le sprint review",
    ],
  },
  {
    id: 4,
    label: "Cas 4 — Junior sans objectif",
    candidatInfo: {
      prenom: "Thomas", nom: "Test", email: "test.cas4@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2023", domaine_etudes: "Finance",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Analyste financier junior", domaine_actuel: "Finance", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "",
      salaire_min: 52000, salaire_max: 62000,
    },
    reponses: [
      "J'ai automatisé le processus de réconciliation bancaire avec VBA — 3 heures réduit à 20 minutes",
      "J'ai créé un tableau de bord Power BI utilisé par toute l'équipe de direction",
      "J'ai identifié une anomalie de 50 000$ dans les états financiers que personne n'avait vue",
      "Je prépare les rapports mensuels pour 3 directeurs et je réponds à leurs questions en temps réel",
      "J'ai formé 2 nouveaux collègues sur nos processus de reporting",
      "J'ai proposé une nouvelle structure de rapport qui a été adoptée par tout le département",
      "Je gère les relations avec les auditeurs externes pendant les périodes de clôture",
      "Mon directeur me délègue de plus en plus de dossiers complexes depuis 6 mois",
    ],
  },
  {
    id: 5,
    label: "Cas 5 — Junior avec objectif",
    candidatInfo: {
      prenom: "Karim", nom: "Test", email: "test.cas5@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2023", domaine_etudes: "Gestion de projet",
      annee_experience: "Moins de 1 an", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Assistant contrôleur de projet", domaine_actuel: "Gestion de projet", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Chargé de projet",
      salaire_min: 50000, salaire_max: 58000,
    },
    reponses: [
      "J'ai résolu un problème de retard de livraison en proposant une livraison progressive des artefacts",
      "Je contrôle les heures réelles vs planifiées avec Excel TCD croisé avec MS Project et SAP",
      "J'ai créé une matrice de compétences pour identifier les ressources clés et leurs back-up",
      "J'ai instauré un rapport hebdomadaire qui a permis d'éviter 3 dépassements budgétaires",
      "Le contrôleur senior me délègue maintenant l'analyse complète des écarts budgétaires",
      "J'ai développé un tableau de bord Power BI pour le suivi en temps réel des projets",
      "J'ai présenté les résultats budgétaires mensuels au comité de direction",
      "J'ai formé un nouveau collègue sur notre processus de réconciliation des coûts",
    ],
  },
  {
    id: 6,
    label: "Cas 6 — Intermédiaire",
    candidatInfo: {
      prenom: "Isabelle", nom: "Test", email: "test.cas6@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2019", domaine_etudes: "Administration",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Chargée de projet", domaine_actuel: "Technologies", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Directrice de projet",
      salaire_min: 75000, salaire_max: 88000,
    },
    reponses: [
      "J'ai livré la migration d'un système bancaire de 2M$ en avance de 2 semaines sans incident",
      "Je gère simultanément 3 projets avec des équipes de 8 à 15 personnes chacune",
      "J'ai mis en place une méthodologie agile hybride adoptée par tout le département IT",
      "J'ai résolu un conflit majeur entre deux équipes qui bloquait le projet depuis 3 semaines",
      "J'ai négocié une extension de délai avec le client tout en maintenant la relation de confiance",
      "J'ai recruté et intégré 4 nouveaux membres d'équipe en 6 mois",
      "Mon taux de livraison dans les délais est de 94% sur 2 ans",
      "J'ai présenté notre méthodologie à une conférence PMI à Montréal",
    ],
  },
  {
    id: 7,
    label: "Cas 7 — Senior 6-10 ans",
    candidatInfo: {
      prenom: "David", nom: "Test", email: "test.cas7@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2015", domaine_etudes: "Informatique",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Développeur senior", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Directeur technique",
      salaire_min: 95000, salaire_max: 115000,
    },
    reponses: [
      "J'ai architecturé une plateforme cloud qui supporte 2 millions d'utilisateurs avec 99.99% uptime",
      "J'ai migré 3 systèmes legacy vers microservices sans interruption de service",
      "Je dirige techniquement une équipe de 12 développeurs sur 2 fuseaux horaires",
      "J'ai réduit les coûts d'infrastructure de 35% en optimisant l'architecture AWS",
      "J'ai créé un framework de code review adopté par 3 équipes différentes",
      "J'ai recruté et mentoré 5 développeurs juniors qui sont maintenant seniors",
      "J'ai présenté notre architecture devant le conseil d'administration pour un budget de 5M$",
      "Je représente l'entreprise dans des conférences tech et j'ai publié 2 articles techniques",
    ],
  },
  {
    id: 8,
    label: "Cas 8 — Expert 10+ ans",
    candidatInfo: {
      prenom: "Michel", nom: "Test", email: "test.cas8@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2010", domaine_etudes: "Management",
      annee_experience: "Plus de 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Directeur de projet", domaine_actuel: "Technologies", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "VP des opérations",
      salaire_min: 110000, salaire_max: 130000,
    },
    reponses: [
      "J'ai transformé le département IT d'une banque de 200 personnes avec ROI de 35% en 3 ans",
      "J'ai piloté 15 projets simultanément avec un budget total de 50M$ en 2023",
      "J'ai développé une méthodologie propriétaire de gestion de programme utilisée dans 3 pays",
      "J'ai négocié et signé 3 contrats de partenariat stratégique pour 20M$ total",
      "J'ai restructuré une équipe de 50 personnes en maintenant 95% de rétention",
      "J'ai présenté devant le conseil d'administration 8 fois cette année pour des décisions stratégiques",
      "J'ai créé un programme de mentorat qui a promu 12 managers en 2 ans",
      "Ma réputation dans le secteur m'a valu 3 offres non sollicitées cette année",
    ],
  },
  {
    id: 9,
    label: "Cas 9 — Reconversion",
    candidatInfo: {
      prenom: "Sophie", nom: "Test", email: "test.cas9@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2015", domaine_etudes: "Éducation",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Enseignante", domaine_actuel: "Éducation", ville: "Montréal",
      statut_emploi: "En reconversion professionnelle", objectif_declare: "Développeur web",
      salaire_min: 60000, salaire_max: 70000,
    },
    reponses: [
      "J'ai créé des cours interactifs numériques sur Moodle adoptés par tout mon département",
      "J'ai développé 3 sites web pour des organismes sans but lucratif avec React et WordPress",
      "Ma capacité à expliquer des concepts complexes clairement est mon atout principal",
      "J'ai terminé le bootcamp The Odin Project et construit 5 projets personnels",
      "J'ai contribué à un projet open source sur GitHub avec 2 pull requests acceptées",
      "J'ai organisé des ateliers de formation numérique pour 50 enseignants",
      "J'ai appris JavaScript, React et Node.js de façon autonome en 8 mois",
      "Une startup EdTech m'a approchée après avoir vu mes projets sur GitHub",
    ],
  },
  {
    id: 10,
    label: "Cas 10 — Marketing Senior",
    candidatInfo: {
      prenom: "Nadia", nom: "Test", email: "test.cas10@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2018", domaine_etudes: "Marketing",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Coordinatrice marketing", domaine_actuel: "Marketing", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer", objectif_declare: "Directrice marketing",
      salaire_min: 62000, salaire_max: 75000,
    },
    reponses: [
      "J'ai lancé une campagne LinkedIn qui a généré 500 leads qualifiés en 3 mois pour 15 000$",
      "J'ai augmenté le taux de conversion du site web de 1.2% à 3.8% en 6 mois",
      "Je gère un budget marketing de 200 000$ par an avec un ROI moyen de 4:1",
      "J'ai créé une stratégie de contenu qui a multiplié le trafic organique par 3 en 1 an",
      "J'ai coordonné le lancement de 2 nouveaux produits avec des équipes de 8 personnes",
      "J'ai formé une équipe de 3 juniors sur les outils d'automatisation marketing",
      "J'ai négocié des partenariats médias qui ont réduit nos coûts publicitaires de 25%",
      "Mon rapport mensuel est maintenant présenté directement au CEO chaque mois",
    ],
  },
];

type ResultatTest = {
  id: number;
  label: string;
  statut: "en_attente" | "en_cours" | "termine" | "erreur";
  rapport?: {
    force1?: string; force2?: string; force3?: string;
    axe1?: string; axe2?: string;
    gps_an1?: { titre: string; salaire: number };
    gps_an5?: { titre: string; salaire: number };
    objectif_carriere?: string;
    scenario_objectif?: number;
    opportunites?: { titre: string; salaire: number }[];
  };
  questionsposees?: string[];
  erreur?: string;
  duree?: number;
};

export default function Preview() {
  const [resultats, setResultats] = useState<ResultatTest[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState(0);

  const simulerUnEntretien = async (profil: typeof PROFILS_TEST[0]): Promise<ResultatTest> => {
    const debut = Date.now();
    try {
      const { candidatInfo, reponses } = profil;
      const history: { role: string; content: string }[] = [];
      const questionsposees: string[] = [];
      let rapportData = null;
      let historiqueAnalyse: { type: string; score: number; mode: string }[] = [];

      for (let i = 0; i <= reponses.length; i++) {
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
            historiqueAnalyse,
          }),
        });

        const data = await res.json();
        const botReply = data.reply || "";
        historiqueAnalyse = data.historiqueAnalyse || historiqueAnalyse;

        // Extraire la question posée
        const lignes = botReply.split("\n").filter((l: string) => l.trim().length > 10);
        if (lignes.length > 0) questionsposees.push(lignes[lignes.length - 1]);

        history.push({ role: "assistant", content: botReply });

        if (data.rapportData) {
          rapportData = data.rapportData;
          break;
        }

        if (i < reponses.length) {
          history.push({ role: "user", content: reponses[i] });
        }
      }

      return {
        id: profil.id,
        label: profil.label,
        statut: rapportData ? "termine" : "erreur",
        rapport: rapportData,
        questionsposees,
        duree: Math.round((Date.now() - debut) / 1000),
        erreur: rapportData ? undefined : "Rapport non généré",
      };

    } catch (e) {
      return {
        id: profil.id,
        label: profil.label,
        statut: "erreur",
        erreur: String(e),
        duree: Math.round((Date.now() - Date.now()) / 1000),
      };
    }
  };

  const lancerTousLesTests = async () => {
    setEnCours(true);
    setProgression(0);
    setResultats(PROFILS_TEST.map(p => ({ id: p.id, label: p.label, statut: "en_attente" })));

    for (let i = 0; i < PROFILS_TEST.length; i++) {
      setResultats(prev => prev.map(r => r.id === PROFILS_TEST[i].id ? { ...r, statut: "en_cours" } : r));
      const resultat = await simulerUnEntretien(PROFILS_TEST[i]);
      setResultats(prev => prev.map(r => r.id === resultat.id ? resultat : r));
      setProgression(Math.round(((i + 1) / PROFILS_TEST.length) * 100));
    }

    setEnCours(false);
  };

  const lancerUnTest = async (profil: typeof PROFILS_TEST[0]) => {
    setResultats(prev => {
      const existe = prev.find(r => r.id === profil.id);
      if (existe) return prev.map(r => r.id === profil.id ? { ...r, statut: "en_cours" } : r);
      return [...prev, { id: profil.id, label: profil.label, statut: "en_cours" }];
    });
    const resultat = await simulerUnEntretien(profil);
    setResultats(prev => {
      const existe = prev.find(r => r.id === profil.id);
      if (existe) return prev.map(r => r.id === resultat.id ? resultat : r);
      return [...prev, resultat];
    });
  };

  const getStatutColor = (statut: string) => {
    if (statut === "termine") return "#D6FFE8";
    if (statut === "en_cours") return "#FFF8E1";
    if (statut === "erreur") return "#FFE0D6";
    return "#F1EFE8";
  };

  const getStatutIcon = (statut: string) => {
    if (statut === "termine") return "✅";
    if (statut === "en_cours") return "⏳";
    if (statut === "erreur") return "❌";
    return "⬜";
  };

  // Détecter les questions dupliquées
  const detecterDoublons = () => {
    const tousQuestions: string[] = [];
    resultats.forEach(r => r.questionsposees?.forEach(q => tousQuestions.push(q)));
    const freq: Record<string, number> = {};
    tousQuestions.forEach(q => { freq[q] = (freq[q] || 0) + 1; });
    return Object.entries(freq).filter(([, count]) => count > 2).map(([q]) => q);
  };

  const doublons = detecterDoublons();

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>🧪 Programme de Test YELMA</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>10 profils — simulation automatique complète</div>
          </div>
          <a href="/" style={{ fontSize: "11px", color: "#aaa", textDecoration: "none" }}>← Accueil</a>
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={lancerTousLesTests}
            disabled={enCours}
            style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: enCours ? "#aaa" : "#FF7043", color: "white", fontSize: "14px", fontWeight: 700, cursor: enCours ? "not-allowed" : "pointer" }}
          >
            {enCours ? `⏳ Tests en cours... ${progression}%` : "🚀 Lancer les 10 tests simultanément"}
          </button>
        </div>

        {/* Barre de progression */}
        {enCours && (
          <div style={{ background: "white", borderRadius: "10px", padding: "10px", marginBottom: "12px", border: "0.5px solid #E8E8F0" }}>
            <div style={{ background: "#F1EFE8", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
              <div style={{ background: "#FF7043", height: "100%", width: `${progression}%`, borderRadius: "6px", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", textAlign: "center" }}>{progression}% complété</div>
          </div>
        )}

        {/* Alerte doublons */}
        {doublons.length > 0 && (
          <div style={{ background: "#FFE0D6", borderRadius: "10px", padding: "12px", marginBottom: "12px", border: "1.5px solid #FF7043" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#993C1D", marginBottom: "6px" }}>⚠️ {doublons.length} questions répétées détectées</div>
            {doublons.map((q, i) => (
              <div key={i} style={{ fontSize: "10px", color: "#993C1D", marginBottom: "2px" }}>• {q.substring(0, 80)}...</div>
            ))}
          </div>
        )}

        {/* Grille résultats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {PROFILS_TEST.map(profil => {
            const resultat = resultats.find(r => r.id === profil.id);
            return (
              <div key={profil.id} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1A1A2E" }}>{profil.label}</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {resultat && <span style={{ fontSize: "14px" }}>{getStatutIcon(resultat.statut)}</span>}
                    <button
                      onClick={() => lancerUnTest(profil)}
                      disabled={enCours || resultat?.statut === "en_cours"}
                      style={{ background: "#FFE0D6", border: "none", borderRadius: "8px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", color: "#993C1D", fontWeight: 600 }}
                    >
                      Tester
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "9px", color: "#888", marginBottom: "6px" }}>
                  {profil.candidatInfo.role_actuel || "Sans rôle"} → {profil.candidatInfo.objectif_declare || "Sans objectif"}
                </div>

                {resultat?.statut === "termine" && resultat.rapport && (
                  <div style={{ background: getStatutColor(resultat.statut), borderRadius: "8px", padding: "8px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#085041", marginBottom: "4px" }}>
                      ✅ {resultat.duree}s — {resultat.questionsposees?.length} questions
                    </div>

                    {/* Compétences */}
                    <div style={{ marginBottom: "6px" }}>
                      <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>COMPÉTENCES</div>
                      {[resultat.rapport.force1, resultat.rapport.force2, resultat.rapport.force3].filter(Boolean).map((f, i) => (
                        <div key={i} style={{ fontSize: "10px", color: "#085041" }}>• {f}</div>
                      ))}
                    </div>

                    {/* GPS */}
                    <div style={{ marginBottom: "6px" }}>
                      <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>GPS</div>
                      <div style={{ fontSize: "10px", color: "#1A1A2E" }}>
                        An 1: {resultat.rapport.gps_an1?.titre} — {resultat.rapport.gps_an1?.salaire?.toLocaleString()}$
                      </div>
                      <div style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600 }}>
                        An 5: {resultat.rapport.gps_an5?.titre} — {resultat.rapport.gps_an5?.salaire?.toLocaleString()}$
                      </div>
                    </div>

                    {/* Objectif */}
                    <div style={{ fontSize: "9px", background: "white", borderRadius: "6px", padding: "4px 6px" }}>
                      🎯 {resultat.rapport.objectif_carriere} — Scénario {resultat.rapport.scenario_objectif}
                    </div>

                    {/* Axes */}
                    {(resultat.rapport.axe1 || resultat.rapport.axe2) && (
                      <div style={{ marginTop: "4px" }}>
                        <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>AXES DEV</div>
                        {[resultat.rapport.axe1, resultat.rapport.axe2].filter(Boolean).map((a, i) => (
                          <div key={i} style={{ fontSize: "10px", color: "#993C1D" }}>⚠️ {a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {resultat?.statut === "en_cours" && (
                  <div style={{ background: "#FFF8E1", borderRadius: "8px", padding: "8px", fontSize: "10px", color: "#7A5F00" }}>
                    ⏳ Simulation en cours...
                  </div>
                )}

                {resultat?.statut === "erreur" && (
                  <div style={{ background: "#FFE0D6", borderRadius: "8px", padding: "8px", fontSize: "10px", color: "#993C1D" }}>
                    ❌ {resultat.erreur}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Analyse globale */}
        {resultats.filter(r => r.statut === "termine").length >= 3 && (
          <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>📊 ANALYSE GLOBALE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#D6FFE8", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#085041" }}>
                  {resultats.filter(r => r.statut === "termine").length}/{PROFILS_TEST.length}
                </div>
                <div style={{ fontSize: "9px", color: "#085041" }}>Tests réussis</div>
              </div>
              <div style={{ background: doublons.length > 0 ? "#FFE0D6" : "#D6FFE8", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: doublons.length > 0 ? "#993C1D" : "#085041" }}>
                  {doublons.length}
                </div>
                <div style={{ fontSize: "9px", color: doublons.length > 0 ? "#993C1D" : "#085041" }}>Questions dupliquées</div>
              </div>
              <div style={{ background: "#F0F9FF", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0C447C" }}>
                  {resultats.filter(r => r.statut === "termine").length > 0
                    ? Math.round(resultats.filter(r => r.statut === "termine").reduce((acc, r) => acc + (r.duree || 0), 0) / resultats.filter(r => r.statut === "termine").length)
                    : 0}s
                </div>
                <div style={{ fontSize: "9px", color: "#0C447C" }}>Durée moyenne</div>
              </div>
            </div>

            {/* Vérification GPS */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "6px" }}>VÉRIFICATION GPS — Objectif vs An 5</div>
              {resultats.filter(r => r.statut === "termine" && r.rapport).map(r => {
                const profil = PROFILS_TEST.find(p => p.id === r.id);
                const objectif = profil?.candidatInfo.objectif_declare || "";
                const an5 = r.rapport?.gps_an5?.titre || "";
                const aligned = objectif && an5.toLowerCase().includes(objectif.toLowerCase().split(" ")[0]);
                return (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: aligned ? "#D6FFE8" : "#FFE0D6", borderRadius: "6px", marginBottom: "4px" }}>
                    <div style={{ fontSize: "10px", color: "#1A1A2E" }}>{r.label}</div>
                    <div style={{ fontSize: "9px" }}>
                      {objectif || "—"} → {an5}
                      <span style={{ marginLeft: "6px" }}>{aligned ? "✅" : "⚠️"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
