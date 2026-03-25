"use client";

import { useState } from "react";
import RapportGPS from "../components/RapportGPS";

const cas9Rapports = {
  1: {
    label: "Cas 1 — Débutant total",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "",
    data: {
      force1: "Curiosité intellectuelle", force1_desc: "Capacité à apprendre rapidement dans un nouveau domaine.",
      force2: "Communication interpersonnelle", force2_desc: "Aptitude naturelle à créer des liens avec les autres.",
      force3: "Résolution de problèmes", force3_desc: "Tendance à trouver des solutions créatives face aux obstacles.",
      axe1: "Compétences informatiques", axe1_desc: "Le marché demande des bases en bureautique pour la majorité des postes.",
      axe2: "Gestion du temps", axe2_desc: "Compétence clé pour s'intégrer rapidement en entreprise.",
      salaire_min: 38000, salaire_max: 42000,
      role_actuel: "", ville: "Montréal",
      objectif_carriere: "Trouver un premier emploi stable",
      scenario_objectif: 1, message_objectif: "Ton objectif est atteignable ! Commence par une formation courte pour décrocher ton premier emploi.", delai_objectif: "1-2 ans",
      opportunites: [
        { titre: "Agent de service à la clientèle", salaire: 38000, description: "Aucune expérience requise." },
        { titre: "Assistant administratif", salaire: 40000, description: "Formation courte suffisante." },
        { titre: "Préposé aux données", salaire: 39000, description: "Entrée facile en entreprise." },
      ],
      gps_an1: { titre: "Formation + premier emploi", salaire: 38000, action: "Suivre une formation initiation" },
      gps_an2: { titre: "Employé junior", salaire: 40000, action: "Stabiliser le premier emploi" },
      gps_an3: { titre: "Employé confirmé", salaire: 43000, action: "Développer une spécialisation" },
      gps_an4: { titre: "Employé confirmé", salaire: 46000, action: "Obtenir une certification" },
      gps_an5: { titre: "Employé intermédiaire", salaire: 49000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Introduction au marché du travail", type: "Renforcement", plateforme: "Emploi Québec", duree: "1 mois" },
        { nom: "Bureautique et outils Office", type: "Gap marché", plateforme: "Cégep en ligne", duree: "2 mois" },
        { nom: "Service à la clientèle", type: "Prochain poste", plateforme: "Coursera", duree: "3 semaines" },
        { nom: "Communication professionnelle", type: "Objectif long terme", plateforme: "LinkedIn Learning", duree: "2 mois" },
      ],
      certifications: [
        { nom: "Microsoft Office Specialist", organisme: "Microsoft" },
        { nom: "Attestation service clientèle", organisme: "Emploi Québec" },
      ],
    }
  },
  2: {
    label: "Cas 2 — Débutant avec diplôme",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "",
    data: {
      force1: "Analyse et synthèse", force1_desc: "Capacité à traiter et résumer des informations complexes.",
      force2: "Rigueur méthodologique", force2_desc: "Approche structurée acquise durant les études.",
      force3: "Apprentissage rapide", force3_desc: "Capacité à assimiler rapidement de nouvelles connaissances.",
      axe1: "Expérience pratique", axe1_desc: "Les employeurs recherchent des candidats avec des applications concrètes.",
      axe2: "Réseautage professionnel", axe2_desc: "Essentiel pour décrocher un premier emploi dans son domaine.",
      salaire_min: 42000, salaire_max: 48000,
      role_actuel: "", ville: "Montréal",
      objectif_carriere: "Décrocher un premier emploi dans son domaine",
      scenario_objectif: 1, message_objectif: "Ton diplôme est un atout majeur ! Complète-le avec une expérience pratique pour accélérer ton entrée sur le marché.", delai_objectif: "1-2 ans",
      opportunites: [
        { titre: "Analyste junior", salaire: 48000, description: "Premier emploi lié au diplôme." },
        { titre: "Coordinateur de projets", salaire: 45000, description: "Idéal pour nouveaux diplômés." },
        { titre: "Chargé de compte junior", salaire: 46000, description: "Compétences académiques valorisées." },
      ],
      gps_an1: { titre: "Formation pratique + stage", salaire: 43000, action: "Compléter le diplôme par une expérience pratique" },
      gps_an2: { titre: "Junior stabilisation", salaire: 46000, action: "Confirmer le premier emploi" },
      gps_an3: { titre: "Junior confirmé", salaire: 50000, action: "Spécialisation dans le domaine" },
      gps_an4: { titre: "Junior confirmé", salaire: 54000, action: "Obtenir une certification" },
      gps_an5: { titre: "Intermédiaire début", salaire: 58000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Stage professionnel intensif", type: "Renforcement", plateforme: "Université", duree: "3 mois" },
        { nom: "Outils du domaine", type: "Gap marché", plateforme: "Coursera", duree: "2 mois" },
        { nom: "Portfolio professionnel", type: "Prochain poste", plateforme: "LinkedIn Learning", duree: "1 mois" },
        { nom: "Certification domaine", type: "Objectif long terme", plateforme: "Institut professionnel", duree: "6 mois" },
      ],
      certifications: [
        { nom: "Certification domaine d'études", organisme: "Ordre professionnel" },
        { nom: "PMP entrée", organisme: "PMI" },
      ],
    }
  },
  3: {
    label: "Cas 3 — Débutant avec stage/bénévolat",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Stagiaire",
    data: {
      force1: "Travail en équipe", force1_desc: "Expérience concrète de collaboration dans un cadre professionnel.",
      force2: "Initiative et proactivité", force2_desc: "Capacité à agir sans supervision constante.",
      force3: "Adaptabilité", force3_desc: "Aptitude à s'intégrer rapidement dans un nouvel environnement.",
      axe1: "Compétences techniques du domaine", axe1_desc: "Les offres demandent des outils spécifiques non encore maîtrisés.",
      axe2: "Communication écrite professionnelle", axe2_desc: "Essentiel pour progresser au-delà du niveau junior.",
      salaire_min: 40000, salaire_max: 46000,
      role_actuel: "Stagiaire", ville: "Montréal",
      objectif_carriere: "Obtenir un emploi permanent dans le domaine du stage",
      scenario_objectif: 1, message_objectif: "Ton expérience de stage est un vrai atout ! Elle te distingue des candidats sans expérience.", delai_objectif: "5 ans",
      opportunites: [
        { titre: "Employé junior lié au stage", salaire: 44000, description: "Continuité naturelle du stage." },
        { titre: "Assistant dans le domaine", salaire: 42000, description: "Expérience de stage valorisée." },
        { titre: "Coordinateur junior", salaire: 46000, description: "Compétences transférables du bénévolat." },
      ],
      gps_an1: { titre: "Stagiaire confirmé", salaire: 41000, action: "Transformer le stage en emploi permanent" },
      gps_an2: { titre: "Junior", salaire: 44000, action: "Stabiliser le premier emploi" },
      gps_an3: { titre: "Junior confirmé", salaire: 47000, action: "Développer les compétences techniques" },
      gps_an4: { titre: "Junior confirmé", salaire: 51000, action: "Prendre plus de responsabilités" },
      gps_an5: { titre: "Intermédiaire début", salaire: 55000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Compétences clés du domaine", type: "Renforcement", plateforme: "Coursera", duree: "2 mois" },
        { nom: "Outils techniques manquants", type: "Gap marché", plateforme: "Udemy", duree: "6 semaines" },
        { nom: "Transition stage vers emploi", type: "Prochain poste", plateforme: "LinkedIn Learning", duree: "1 mois" },
        { nom: "Certification entrée domaine", type: "Objectif long terme", plateforme: "Institut", duree: "4 mois" },
      ],
      certifications: [
        { nom: "Certification domaine", organisme: "Institut professionnel" },
        { nom: "Attestation compétences", organisme: "Emploi Québec" },
      ],
    }
  },
  4: {
    label: "Cas 4 — Débutant avec objectif",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "",
    data: {
      force1: "Vision et détermination", force1_desc: "Clarté sur l'objectif professionnel à atteindre.",
      force2: "Motivation intrinsèque", force2_desc: "Drive personnel pour apprendre et progresser.",
      force3: "Capacité d'apprentissage", force3_desc: "Aptitude à acquérir rapidement les compétences nécessaires.",
      axe1: "Expérience pratique dans le domaine cible", axe1_desc: "Les employeurs recherchent une application concrète des compétences.",
      axe2: "Réseau professionnel dans le domaine cible", axe2_desc: "Le réseautage accélère l'accès aux opportunités cachées.",
      salaire_min: 42000, salaire_max: 50000,
      role_actuel: "", ville: "Montréal",
      objectif_carriere: "Développeur web junior",
      scenario_objectif: 1, message_objectif: "Ton objectif de Développeur web est atteignable en 2-3 ans avec les bonnes formations !", delai_objectif: "2-3 ans",
      opportunites: [
        { titre: "Développeur web junior", salaire: 50000, description: "Objectif direct atteignable." },
        { titre: "Intégrateur web", salaire: 46000, description: "Porte d'entrée vers le développement." },
        { titre: "Technicien support web", salaire: 44000, description: "Première étape vers l'objectif." },
      ],
      gps_an1: { titre: "Formation intensive + premier projet", salaire: 43000, action: "Bootcamp développement web" },
      gps_an2: { titre: "Développeur junior", salaire: 50000, action: "Premier emploi dans le domaine" },
      gps_an3: { titre: "Développeur junior confirmé", salaire: 58000, action: "Spécialisation frontend/backend" },
      gps_an4: { titre: "Développeur junior confirmé", salaire: 65000, action: "Contribuer à des projets complexes" },
      gps_an5: { titre: "Développeur intermédiaire", salaire: 72000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Bootcamp développement web", type: "Renforcement", plateforme: "Le Wagon", duree: "3 mois" },
        { nom: "React et Node.js", type: "Gap marché", plateforme: "Udemy", duree: "2 mois" },
        { nom: "Portfolio GitHub", type: "Prochain poste", plateforme: "GitHub", duree: "1 mois" },
        { nom: "AWS Certified Developer", type: "Objectif long terme", plateforme: "AWS", duree: "6 mois" },
      ],
      certifications: [
        { nom: "AWS Cloud Practitioner", organisme: "Amazon Web Services" },
        { nom: "Meta Front-End Developer", organisme: "Meta" },
      ],
    }
  },
  5: {
    label: "Cas 5 — Junior sans objectif",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Analyste junior",
    data: {
      force1: "Analyse de données", force1_desc: "Capacité à interpréter des données pour soutenir les décisions.",
      force2: "Communication des résultats", force2_desc: "Aptitude à présenter des analyses de façon claire.",
      force3: "Rigueur et attention aux détails", force3_desc: "Qualité essentielle pour produire des analyses fiables.",
      axe1: "Visualisation de données", axe1_desc: "Power BI et Tableau sont demandés dans 80% des offres d'analyste.",
      axe2: "SQL avancé", axe2_desc: "Compétence clé pour accéder aux données en autonomie.",
      salaire_min: 52000, salaire_max: 58000,
      role_actuel: "Analyste junior", ville: "Montréal",
      objectif_carriere: "Analyste de données senior",
      scenario_objectif: 1, message_objectif: "YELMA te propose d'évoluer vers Analyste senior — atteignable en 5 ans avec les bonnes formations !", delai_objectif: "5 ans",
      opportunites: [
        { titre: "Analyste de données", salaire: 62000, description: "Évolution naturelle du poste actuel." },
        { titre: "Analyste BI", salaire: 65000, description: "Valorise les compétences actuelles." },
        { titre: "Analyste financier", salaire: 60000, description: "Domaine alternatif bien rémunéré." },
      ],
      gps_an1: { titre: "Analyste junior confirmé", salaire: 54000, action: "Consolider les compétences analytiques" },
      gps_an2: { titre: "Analyste junior confirmé", salaire: 57000, action: "Maîtriser Power BI et SQL avancé" },
      gps_an3: { titre: "Analyste senior débutant", salaire: 62000, action: "Prendre en charge des analyses complexes" },
      gps_an4: { titre: "Analyste senior débutant", salaire: 67000, action: "Mentorer les juniors" },
      gps_an5: { titre: "Analyste senior", salaire: 72000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Power BI avancé", type: "Renforcement", plateforme: "Udemy", duree: "6 semaines" },
        { nom: "SQL avancé et bases de données", type: "Gap marché", plateforme: "Coursera", duree: "2 mois" },
        { nom: "Gestion de projets analytiques", type: "Prochain poste", plateforme: "LinkedIn Learning", duree: "1 mois" },
        { nom: "Google Data Analytics Certificate", type: "Objectif long terme", plateforme: "Google", duree: "6 mois" },
      ],
      certifications: [
        { nom: "Microsoft Power BI Data Analyst", organisme: "Microsoft" },
        { nom: "Google Data Analytics", organisme: "Google" },
      ],
    }
  },
  6: {
    label: "Cas 6 — Junior avec objectif",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Assistant contrôleur de projet",
    data: {
      force1: "Analyse budgétaire", force1_desc: "Capacité à évaluer les écarts entre coûts réels et prévisionnels.",
      force2: "Suivi d'avancement des tâches", force2_desc: "Aptitude à contrôler les livrables et alerter sur les retards.",
      force3: "Coordination des équipes", force3_desc: "Compétence à aligner les parties prenantes sur les objectifs.",
      axe1: "Gestion de budgets complexes", axe1_desc: "Les offres de chargé de projet demandent une gestion budgétaire autonome.",
      axe2: "Leadership et prise de décision", axe2_desc: "Compétence clé pour évoluer vers chargé de projet.",
      salaire_min: 52000, salaire_max: 58000,
      role_actuel: "Assistant contrôleur de projet", ville: "Montréal",
      objectif_carriere: "Chargé de projet",
      scenario_objectif: 2, message_objectif: "Ton objectif de Chargé de projet est atteignable en 5-7 ans. En 5 ans, vise Contrôleur de projet senior.", delai_objectif: "5-7 ans",
      opportunites: [
        { titre: "Contrôleur de projet junior", salaire: 58000, description: "Évolution directe du poste actuel." },
        { titre: "Analyste de projet", salaire: 56000, description: "Compétences actuelles valorisées." },
        { titre: "Coordinateur de projet", salaire: 54000, description: "Même niveau, meilleur salaire." },
      ],
      gps_an1: { titre: "Assistant contrôleur confirmé", salaire: 54000, action: "Consolider les compétences de contrôle" },
      gps_an2: { titre: "Assistant contrôleur confirmé", salaire: 57000, action: "Obtenir certification CAPM" },
      gps_an3: { titre: "Contrôleur de projet senior", salaire: 62000, action: "Gérer des projets de façon autonome" },
      gps_an4: { titre: "Contrôleur de projet senior", salaire: 67000, action: "Superviser une équipe junior" },
      gps_an5: { titre: "Contrôleur de projet expert", salaire: 72000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "MS Project avancé", type: "Renforcement", plateforme: "Udemy", duree: "2 mois" },
        { nom: "Gestion budgétaire de projet", type: "Gap marché", plateforme: "Coursera", duree: "3 mois" },
        { nom: "CAPM — Certified Associate PM", type: "Prochain poste", plateforme: "PMI", duree: "4 mois" },
        { nom: "PMP — Project Management Professional", type: "Objectif long terme", plateforme: "PMI", duree: "6 mois" },
      ],
      certifications: [
        { nom: "CAPM", organisme: "Project Management Institute" },
        { nom: "Scrum Master", organisme: "Scrum Alliance" },
      ],
    }
  },
  7: {
    label: "Cas 7 — Intermédiaire 3-5 ans",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Chargé de projet",
    data: {
      force1: "Gestion de projets complexes", force1_desc: "Capacité à livrer des projets multi-équipes dans les délais.",
      force2: "Gestion des parties prenantes", force2_desc: "Aptitude à aligner et communiquer avec tous les intervenants.",
      force3: "Gestion des risques", force3_desc: "Compétence à identifier et mitiger les risques projet.",
      axe1: "Leadership stratégique", axe1_desc: "Les postes senior demandent une vision au-delà de l'opérationnel.",
      axe2: "Gestion de programme", axe2_desc: "Compétence clé pour évoluer vers chargé de programme.",
      salaire_min: 72000, salaire_max: 82000,
      role_actuel: "Chargé de projet", ville: "Montréal",
      objectif_carriere: "Directeur de projet",
      scenario_objectif: 2, message_objectif: "Ton objectif de Directeur de projet est atteignable en 6-8 ans. En 5 ans, vise Chargé de projet senior.", delai_objectif: "6-8 ans",
      opportunites: [
        { titre: "Chargé de programme", salaire: 90000, description: "Évolution naturelle avec 3-5 ans exp." },
        { titre: "Chargé de projet senior", salaire: 85000, description: "Même domaine, niveau supérieur." },
        { titre: "Consultant en gestion de projet", salaire: 95000, description: "Valorise toute l'expertise." },
      ],
      gps_an1: { titre: "Chargé de projet stabilisation", salaire: 75000, action: "Renforcer l'expertise en gestion de programme" },
      gps_an2: { titre: "Chargé de projet confirmé", salaire: 79000, action: "Certification PMP" },
      gps_an3: { titre: "Chargé de projet confirmé", salaire: 84000, action: "Gérer un portefeuille de projets" },
      gps_an4: { titre: "Chargé de projet senior", salaire: 90000, action: "Mentorer une équipe junior" },
      gps_an5: { titre: "Chargé de projet senior expert", salaire: 97000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Gestion de programme avancée", type: "Renforcement", plateforme: "Coursera", duree: "3 mois" },
        { nom: "Leadership stratégique", type: "Gap marché", plateforme: "LinkedIn Learning", duree: "2 mois" },
        { nom: "PMP — Project Management Professional", type: "Prochain poste", plateforme: "PMI", duree: "6 mois" },
        { nom: "MBA Management de projet", type: "Objectif long terme", plateforme: "Université", duree: "2 ans" },
      ],
      certifications: [
        { nom: "PMP", organisme: "Project Management Institute" },
        { nom: "Lean Six Sigma Green Belt", organisme: "ASQ" },
      ],
    }
  },
  8: {
    label: "Cas 8 — Reconversion",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Enseignant → Développeur web",
    data: {
      force1: "Communication pédagogique", force1_desc: "Compétence rare et très valorisée dans les équipes tech.",
      force2: "Structuration de contenu complexe", force2_desc: "Capacité à décomposer des problèmes en étapes claires.",
      force3: "Patience et accompagnement", force3_desc: "Atout pour les rôles de support technique et mentorat.",
      axe1: "Compétences techniques web", axe1_desc: "HTML, CSS, JavaScript — indispensables pour la reconversion.",
      axe2: "Expérience de développement en équipe", axe2_desc: "Git, Agile, code review — standards du milieu tech.",
      salaire_min: 62000, salaire_max: 68000,
      role_actuel: "Enseignant", ville: "Montréal",
      objectif_carriere: "Développeur web",
      scenario_objectif: 1, message_objectif: "Ta reconversion vers Développeur web est réaliste ! Tes compétences en communication et pédagogie sont des atouts rares dans le milieu tech.", delai_objectif: "3-4 ans",
      opportunites: [
        { titre: "Technical Writer", salaire: 65000, description: "Pont idéal enseignement → tech." },
        { titre: "Développeur junior", salaire: 60000, description: "Objectif direct après formation." },
        { titre: "Support technique", salaire: 58000, description: "Porte d'entrée dans le milieu tech." },
      ],
      gps_an1: { titre: "Formation intensive + poste passerelle", salaire: 53000, action: "Bootcamp + Technical Writer ou support" },
      gps_an2: { titre: "Développeur junior", salaire: 62000, action: "Premier emploi en développement" },
      gps_an3: { titre: "Développeur junior confirmé", salaire: 68000, action: "Spécialisation frontend ou backend" },
      gps_an4: { titre: "Développeur intermédiaire", salaire: 75000, action: "Projets complexes en autonomie" },
      gps_an5: { titre: "Développeur intermédiaire confirmé", salaire: 83000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Bootcamp développement web full stack", type: "Renforcement", plateforme: "Le Wagon", duree: "3 mois" },
        { nom: "React et Node.js", type: "Gap marché", plateforme: "Udemy", duree: "2 mois" },
        { nom: "Git et workflow Agile", type: "Prochain poste", plateforme: "GitHub Learning", duree: "1 mois" },
        { nom: "AWS Developer Associate", type: "Objectif long terme", plateforme: "AWS", duree: "6 mois" },
      ],
      certifications: [
        { nom: "Meta Front-End Developer", organisme: "Meta" },
        { nom: "AWS Cloud Practitioner", organisme: "Amazon Web Services" },
      ],
    }
  },
  9: {
    label: "Cas 9 — Senior 10+ ans",
    plan: "propulse",
    ville: "Montréal",
    roleActuel: "Directeur de projet",
    data: {
      force1: "Leadership stratégique", force1_desc: "Capacité à définir et exécuter une vision à long terme.",
      force2: "Gestion de portefeuille de projets", force2_desc: "Expertise dans la supervision de multiples projets simultanés.",
      force3: "Développement des équipes", force3_desc: "Aptitude à faire grandir et fidéliser les talents.",
      axe1: "Transformation digitale", axe1_desc: "Les conseils d'administration recherchent des leaders en transformation numérique.",
      axe2: "Intelligence artificielle appliquée", axe2_desc: "Compétence stratégique émergente pour les postes de direction.",
      salaire_min: 110000, salaire_max: 125000,
      role_actuel: "Directeur de projet", ville: "Montréal",
      objectif_carriere: "Vice-Président des opérations",
      scenario_objectif: 2, message_objectif: "Ton objectif de Vice-Président des opérations est atteignable en 6-8 ans avec les bonnes certifications et un réseau solide.", delai_objectif: "6-8 ans",
      opportunites: [
        { titre: "Directeur des opérations", salaire: 140000, description: "Évolution directe vers le VP." },
        { titre: "Directeur de programme", salaire: 130000, description: "Tremplin vers la direction générale." },
        { titre: "Consultant stratégique senior", salaire: 150000, description: "Liberté et valorisation de l'expertise." },
      ],
      gps_an1: { titre: "Directeur de projet stabilisation", salaire: 114000, action: "Positionnement stratégique et visibilité" },
      gps_an2: { titre: "Directeur de projet confirmé", salaire: 120000, action: "Élargir le portefeuille et l'équipe" },
      gps_an3: { titre: "Directeur de projet confirmé", salaire: 127000, action: "Certification executive leadership" },
      gps_an4: { titre: "Senior Directeur", salaire: 136000, action: "Siéger dans des comités stratégiques" },
      gps_an5: { titre: "Senior Directeur expert", salaire: 147000, action: "POTENTIEL MAX !" },
      formations: [
        { nom: "Executive Leadership Program", type: "Renforcement", plateforme: "HEC Montréal", duree: "6 mois" },
        { nom: "Transformation digitale et IA", type: "Gap marché", plateforme: "MIT Online", duree: "3 mois" },
        { nom: "Gestion financière pour dirigeants", type: "Prochain poste", plateforme: "McGill", duree: "4 mois" },
        { nom: "MBA Executive", type: "Objectif long terme", plateforme: "HEC Montréal", duree: "2 ans" },
      ],
      certifications: [
        { nom: "PgMP — Program Management Professional", organisme: "PMI" },
        { nom: "Certified Director", organisme: "Collège des administrateurs" },
      ],
    }
  },
};

export default function Preview() {
  const [casSelectionne, setCasSelectionne] = useState<number>(6);
  const [plan, setPlan] = useState<"decouverte" | "propulse">("propulse");

  const casActuel = cas9Rapports[casSelectionne as keyof typeof cas9Rapports];

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>🎨 Mode Test Rapide</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>9 cas profils — rapport instantané</div>
          </div>
          <a href="/" style={{ fontSize: "11px", color: "#aaa", textDecoration: "none" }}>← Accueil</a>
        </div>

        {/* Sélecteur cas */}
        <div style={{ background: "white", borderRadius: "12px", padding: "12px", marginBottom: "8px", border: "0.5px solid #E8E8F0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>SÉLECTIONNER UN CAS PROFIL</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {Object.entries(cas9Rapports).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setCasSelectionne(parseInt(key))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "12px",
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
        <div style={{ background: "white", borderRadius: "12px", padding: "10px", marginBottom: "12px", border: "0.5px solid #E8E8F0", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPlan("decouverte")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", background: plan === "decouverte" ? "#1A1A2E" : "#F1EFE8", color: plan === "decouverte" ? "white" : "#888", fontSize: "12px", fontWeight: 700 }}
          >
            Plan Découverte
          </button>
          <button
            onClick={() => setPlan("propulse")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", background: plan === "propulse" ? "#FF7043" : "#F1EFE8", color: plan === "propulse" ? "white" : "#888", fontSize: "12px", fontWeight: 700 }}
          >
            Plan Propulse
          </button>
        </div>

        {/* Rapport */}
        <RapportGPS
          data={casActuel.data}
          plan={plan}
          ville={casActuel.ville}
          roleActuel={casActuel.roleActuel}
        />

      </div>
    </div>
  );
}

