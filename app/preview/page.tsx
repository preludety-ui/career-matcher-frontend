"use client";

import { useState } from "react";

// 20 profils de test couvrant professions réglementées + non réglementées + tous niveaux
const PROFILS_TEST = [
  // PROFESSIONS RÉGLEMENTÉES — SANTÉ
  {
    id: 1,
    label: "Infirmière junior 1-2 ans",
    candidatInfo: {
      prenom: "Sophie", nom: "Test", email: "test.cas1@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2024", domaine_etudes: "Sciences infirmières",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Infirmière", domaine_actuel: "Santé", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Infirmière praticienne spécialisée",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "OIIQ",
      salaire_min: 65000, salaire_max: 80000,
    },
    salaire_attendu: { min: 60000, max: 100000 },
    gps_an5_attendu: "infirmière praticienne",
  },
  {
    id: 2,
    label: "Infirmière senior 6-10 ans",
    candidatInfo: {
      prenom: "Marie", nom: "Test", email: "test.cas2@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2018", domaine_etudes: "Sciences infirmières",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Infirmière senior", domaine_actuel: "Santé", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Gestionnaire des soins infirmiers",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "OIIQ",
      salaire_min: 85000, salaire_max: 100000,
    },
    salaire_attendu: { min: 80000, max: 115000 },
    gps_an5_attendu: "gestionnaire",
  },
  {
    id: 3,
    label: "Médecin généraliste débutant",
    candidatInfo: {
      prenom: "Pierre", nom: "Test", email: "test.cas3@yelma.ca",
      diplome: "Doctorat (PhD)", annee_diplome: "2024", domaine_etudes: "Médecine",
      annee_experience: "Moins de 1 an", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Médecin", domaine_actuel: "Santé", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Médecin de famille établi",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "CMQ",
      salaire_min: 180000, salaire_max: 220000,
    },
    salaire_attendu: { min: 170000, max: 280000 },
    gps_an5_attendu: "médecin",
  },
  {
    id: 4,
    label: "Pharmacienne 3-5 ans",
    candidatInfo: {
      prenom: "Laura", nom: "Test", email: "test.cas4@yelma.ca",
      diplome: "Doctorat (PhD)", annee_diplome: "2021", domaine_etudes: "Pharmacie",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Pharmacienne", domaine_actuel: "Santé", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directrice pharmacie",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "OPQ",
      salaire_min: 90000, salaire_max: 105000,
    },
    salaire_attendu: { min: 85000, max: 130000 },
    gps_an5_attendu: "directrice",
  },

  // PROFESSIONS RÉGLEMENTÉES — DROIT / FINANCE
  {
    id: 5,
    label: "Avocat junior 1-2 ans",
    candidatInfo: {
      prenom: "David", nom: "Test", email: "test.cas5@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2023", domaine_etudes: "Droit",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Avocat", domaine_actuel: "Droit", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Associé cabinet juridique",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "Barreau du Québec",
      salaire_min: 65000, salaire_max: 80000,
    },
    salaire_attendu: { min: 60000, max: 120000 },
    gps_an5_attendu: "associé",
  },
  {
    id: 6,
    label: "CPA senior 6-10 ans",
    candidatInfo: {
      prenom: "Michel", nom: "Test", email: "test.cas6@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2016", domaine_etudes: "Comptabilité",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "CPA senior", domaine_actuel: "Finance", ville: "Toronto",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directeur financier",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "CPA Québec",
      salaire_min: 95000, salaire_max: 115000,
    },
    salaire_attendu: { min: 90000, max: 140000 },
    gps_an5_attendu: "directeur",
  },

  // PROFESSIONS RÉGLEMENTÉES — INGÉNIERIE / ARCHITECTURE
  {
    id: 7,
    label: "Ingénieur junior sans OIQ",
    candidatInfo: {
      prenom: "Karim", nom: "Test", email: "test.cas7@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2024", domaine_etudes: "Génie civil",
      annee_experience: "Moins de 1 an", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Ingénieur", domaine_actuel: "Ingénierie", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Ingénieur senior",
      ordre_professionnel_statut: "en_cours", ordre_professionnel_nom: "OIQ",
      salaire_min: 60000, salaire_max: 72000,
    },
    salaire_attendu: { min: 55000, max: 90000 },
    gps_an5_attendu: "ingénieur senior",
  },
  {
    id: 8,
    label: "Architecte intermédiaire 3-5 ans",
    candidatInfo: {
      prenom: "Isabelle", nom: "Test", email: "test.cas8@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2020", domaine_etudes: "Architecture",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Architecte", domaine_actuel: "Architecture", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Architecte associé",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "OAQ",
      salaire_min: 80000, salaire_max: 95000,
    },
    salaire_attendu: { min: 75000, max: 120000 },
    gps_an5_attendu: "architecte associé",
  },

  // PROFESSIONS RÉGLEMENTÉES — ÉDUCATION
  {
    id: 9,
    label: "Enseignant primaire débutant",
    candidatInfo: {
      prenom: "Julie", nom: "Test", email: "test.cas9@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2024", domaine_etudes: "Éducation préscolaire",
      annee_experience: "Moins de 1 an", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Enseignante primaire", domaine_actuel: "Éducation", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directrice d'école",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "MEQ — Brevet enseignement",
      salaire_min: 42000, salaire_max: 52000,
    },
    salaire_attendu: { min: 40000, max: 85000 },
    gps_an5_attendu: "enseignante",
  },
  {
    id: 10,
    label: "Professeur université 3-5 ans",
    candidatInfo: {
      prenom: "Thomas", nom: "Test", email: "test.cas10@yelma.ca",
      diplome: "Doctorat (PhD)", annee_diplome: "2021", domaine_etudes: "Économie",
      annee_experience: "3 à 5 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Professeur d'université", domaine_actuel: "Éducation", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Professeur titulaire",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 95000, salaire_max: 115000,
    },
    salaire_attendu: { min: 90000, max: 160000 },
    gps_an5_attendu: "professeur titulaire",
  },

  // PROFESSIONS NON RÉGLEMENTÉES
  {
    id: 11,
    label: "Analyste financier junior",
    candidatInfo: {
      prenom: "Nadia", nom: "Test", email: "test.cas11@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2023", domaine_etudes: "Finance",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Analyste financier junior", domaine_actuel: "Finance", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Contrôleur financier",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 52000, salaire_max: 62000,
    },
    salaire_attendu: { min: 50000, max: 80000 },
    gps_an5_attendu: "contrôleur financier",
  },
  {
    id: 12,
    label: "Développeur senior 6-10 ans",
    candidatInfo: {
      prenom: "Alex", nom: "Test", email: "test.cas12@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2016", domaine_etudes: "Informatique",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Développeur senior", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directeur technique",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 95000, salaire_max: 115000,
    },
    salaire_attendu: { min: 90000, max: 140000 },
    gps_an5_attendu: "directeur technique",
  },
  {
    id: 13,
    label: "Chargé de projet 3-5 ans",
    candidatInfo: {
      prenom: "Lucas", nom: "Test", email: "test.cas13@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2020", domaine_etudes: "Gestion de projet",
      annee_experience: "3 à 5 ans", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Chargé de projet", domaine_actuel: "Technologies", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directeur de projet",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 75000, salaire_max: 88000,
    },
    salaire_attendu: { min: 70000, max: 110000 },
    gps_an5_attendu: "directeur de projet",
  },
  {
    id: 14,
    label: "Coordinatrice marketing junior",
    candidatInfo: {
      prenom: "Sarah", nom: "Test", email: "test.cas14@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2023", domaine_etudes: "Marketing",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Coordinatrice marketing", domaine_actuel: "Marketing", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Directrice marketing",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 48000, salaire_max: 58000,
    },
    salaire_attendu: { min: 45000, max: 80000 },
    gps_an5_attendu: "directrice marketing",
  },
  {
    id: 15,
    label: "Expert RH 10+ ans",
    candidatInfo: {
      prenom: "Claire", nom: "Test", email: "test.cas15@yelma.ca",
      diplome: "Maîtrise / MBA", annee_diplome: "2012", domaine_etudes: "Ressources humaines",
      annee_experience: "Plus de 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Directrice RH", domaine_actuel: "Ressources humaines", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "VP Ressources humaines",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 110000, salaire_max: 130000,
    },
    salaire_attendu: { min: 105000, max: 180000 },
    gps_an5_attendu: "vp",
  },

  // PROFILS SPÉCIAUX
  {
    id: 16,
    label: "Reconversion — Enseignant vers Dev",
    candidatInfo: {
      prenom: "Marc", nom: "Test", email: "test.cas16@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "2015", domaine_etudes: "Éducation",
      annee_experience: "6 à 10 ans", annee_autre_experience: "Plus de 2 ans",
      role_actuel: "Enseignant secondaire", domaine_actuel: "Éducation", ville: "Montréal",
      statut_emploi: "En reconversion professionnelle",
      objectif_declare: "Développeur web",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 60000, salaire_max: 72000,
    },
    salaire_attendu: { min: 55000, max: 95000 },
    gps_an5_attendu: "développeur",
  },
  {
    id: 17,
    label: "Étudiant avec stage — Comptabilité",
    candidatInfo: {
      prenom: "Emma", nom: "Test", email: "test.cas17@yelma.ca",
      diplome: "Baccalauréat", annee_diplome: "En cours", domaine_etudes: "Comptabilité",
      annee_experience: "Aucune", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Stagiaire comptable", domaine_actuel: "Finance", ville: "Montréal",
      statut_emploi: "Étudiant(e)",
      objectif_declare: "CPA",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 40000, salaire_max: 48000,
    },
    salaire_attendu: { min: 38000, max: 65000 },
    gps_an5_attendu: "cpa",
  },
  {
    id: 18,
    label: "Autodidacte — Développeur web",
    candidatInfo: {
      prenom: "Kevin", nom: "Test", email: "test.cas18@yelma.ca",
      diplome: "Autodidacte / Sans diplôme", annee_diplome: "", domaine_etudes: "",
      annee_experience: "1 à 2 ans", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Développeur web", domaine_actuel: "Technologie", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Lead développeur",
      ordre_professionnel_statut: "non", ordre_professionnel_nom: "",
      salaire_min: 55000, salaire_max: 68000,
    },
    salaire_attendu: { min: 50000, max: 90000 },
    gps_an5_attendu: "lead développeur",
  },
  {
    id: 19,
    label: "Vétérinaire débutant",
    candidatInfo: {
      prenom: "Amélie", nom: "Test", email: "test.cas19@yelma.ca",
      diplome: "Doctorat (PhD)", annee_diplome: "2024", domaine_etudes: "Médecine vétérinaire",
      annee_experience: "Moins de 1 an", annee_autre_experience: "1 à 2 ans",
      role_actuel: "Vétérinaire", domaine_actuel: "Santé animale", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Propriétaire clinique vétérinaire",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "OMVQ",
      salaire_min: 70000, salaire_max: 85000,
    },
    salaire_attendu: { min: 65000, max: 115000 },
    gps_an5_attendu: "vétérinaire",
  },
  {
    id: 20,
    label: "Pilote commercial débutant",
    candidatInfo: {
      prenom: "Nicolas", nom: "Test", email: "test.cas20@yelma.ca",
      diplome: "DEC / Cégep", annee_diplome: "2023", domaine_etudes: "Techniques de pilotage",
      annee_experience: "Moins de 1 an", annee_autre_experience: "6 mois à 1 an",
      role_actuel: "Pilote", domaine_actuel: "Transport aérien", ville: "Montréal",
      statut_emploi: "En emploi - cherche à évoluer",
      objectif_declare: "Commandant de bord",
      ordre_professionnel_statut: "membre_actif", ordre_professionnel_nom: "Transport Canada — Pilotes",
      salaire_min: 55000, salaire_max: 68000,
    },
    salaire_attendu: { min: 50000, max: 200000 },
    gps_an5_attendu: "commandant",
  },
];

type ResultatTest = {
  id: number;
  label: string;
  statut: "en_attente" | "en_cours" | "termine" | "erreur";
  salaire_marche?: { min: number; max: number };
  salaire_attendu?: { min: number; max: number };
  salaire_ok?: boolean;
  gps_an1?: string;
  gps_an5?: string;
  gps_ok?: boolean;
  competences?: string[];
  competences_ok?: boolean;
  questions_posees?: string[];
  nb_questions?: number;
  erreur?: string;
  duree?: number;
};

export default function Preview() {
  const [resultats, setResultats] = useState<ResultatTest[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState(0);
  const [filtreStatut, setFiltreStatut] = useState<"tous" | "ok" | "erreur">("tous");

  const testerSalaire = async (profil: typeof PROFILS_TEST[0]) => {
    try {
      const res = await fetch("/api/salaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: profil.candidatInfo.role_actuel,
          experience: profil.candidatInfo.annee_experience,
          ville: profil.candidatInfo.ville,
          diplome: profil.candidatInfo.diplome,
          domaine: profil.candidatInfo.domaine_actuel,
        }),
      });
      const data = await res.json();
      return {
        min: data.salaire_min || 0,
        max: data.salaire_max || 0,
      };
    } catch {
      return { min: 0, max: 0 };
    }
  };

  const simulerEntretien = async (profil: typeof PROFILS_TEST[0]) => {
    const debut = Date.now();
    try {
      const { candidatInfo } = profil;
      const history: { role: string; content: string }[] = [];
      const questions: string[] = [];
      let rapportData = null;
      let historiqueAnalyse: { type: string; score: number; mode: string }[] = [];

      const reponses = [
        "J'ai géré des situations d'urgence et coordonné avec plusieurs équipes pour améliorer les soins",
        "J'ai développé des protocoles qui ont réduit les incidents de 20% dans mon service",
        "Je collabore avec les médecins pour adapter les plans de soins selon l'évolution des patients",
        "J'ai formé 3 nouveaux collègues et je supervise leur intégration depuis 6 mois",
        "Ma plus grande réalisation est d'avoir mis en place un système de triage plus efficace",
        "Je gère les conflits d'équipe en facilitant des réunions de résolution de problèmes",
        "J'utilise les données cliniques pour anticiper les besoins des patients et prévenir les complications",
        "Mon objectif est de développer mes compétences en gestion pour avoir plus d'impact",
        "Je cherche à me spécialiser pour offrir des soins plus avancés et autonomes",
        "J'ai développé une approche personnalisée qui améliore la satisfaction des patients",
      ];

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

        // Extraire question posée
        const lignes = botReply.split("\n").filter((l: string) => l.trim().endsWith("?"));
        if (lignes.length > 0) questions.push(lignes[0].trim());

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
        rapportData,
        questions,
        duree: Math.round((Date.now() - debut) / 1000),
      };
    } catch (e) {
      return { rapportData: null, questions: [], duree: 0, erreur: String(e) };
    }
  };

  const testerUnProfil = async (profil: typeof PROFILS_TEST[0]): Promise<ResultatTest> => {
    // Test salaire
    const salaire = await testerSalaire(profil);
    const salaire_ok = salaire.min >= profil.salaire_attendu.min * 0.8 &&
      salaire.max <= profil.salaire_attendu.max * 1.3;

    // Test entretien
    const { rapportData, questions, duree } = await simulerEntretien(profil);

    if (!rapportData) {
      return {
        id: profil.id, label: profil.label, statut: "erreur",
        salaire_marche: salaire, salaire_attendu: profil.salaire_attendu, salaire_ok,
        erreur: "Rapport non généré", duree,
      };
    }

    // Vérifier GPS
    const an5 = rapportData.gps_an5?.titre?.toLowerCase() || "";
    const gps_ok = profil.gps_an5_attendu.split(" ").some(mot => an5.includes(mot));

    // Vérifier compétences
    const competences = [rapportData.force1, rapportData.force2, rapportData.force3].filter(Boolean);
    const softSkillsVagues = ["patience", "empathie", "écoute active", "maîtrise de soi", "persuasion", "communication"];
    const competences_ok = competences.length >= 3 &&
      !competences.some(c => softSkillsVagues.some(s => c?.toLowerCase().includes(s)));

    // Détecter doublons questions
    const questionsUniques = new Set(questions).size;
    const nb_questions = questions.length;

    return {
      id: profil.id, label: profil.label, statut: "termine",
      salaire_marche: salaire, salaire_attendu: profil.salaire_attendu, salaire_ok,
      gps_an1: rapportData.gps_an1?.titre,
      gps_an5: rapportData.gps_an5?.titre,
      gps_ok,
      competences,
      competences_ok,
      questions_posees: questions,
      nb_questions,
      duree,
    };
  };

  const lancerTousLesTests = async () => {
    setEnCours(true);
    setProgression(0);
    setResultats(PROFILS_TEST.map(p => ({ id: p.id, label: p.label, statut: "en_attente" })));

    for (let i = 0; i < PROFILS_TEST.length; i++) {
      setResultats(prev => prev.map(r => r.id === PROFILS_TEST[i].id ? { ...r, statut: "en_cours" } : r));
      const resultat = await testerUnProfil(PROFILS_TEST[i]);
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
    const resultat = await testerUnProfil(profil);
    setResultats(prev => {
      const existe = prev.find(r => r.id === profil.id);
      if (existe) return prev.map(r => r.id === resultat.id ? resultat : r);
      return [...prev, resultat];
    });
  };

  const termines = resultats.filter(r => r.statut === "termine");
  const salairesOk = termines.filter(r => r.salaire_ok).length;
  const gpsOk = termines.filter(r => r.gps_ok).length;
  const competencesOk = termines.filter(r => r.competences_ok).length;
  const dureeeMoyenne = termines.length > 0
    ? Math.round(termines.reduce((acc, r) => acc + (r.duree || 0), 0) / termines.length)
    : 0;

  const resultatsFiltrés = resultats.filter(r => {
    if (filtreStatut === "ok") return r.statut === "termine" && r.salaire_ok && r.gps_ok && r.competences_ok;
    if (filtreStatut === "erreur") return r.statut === "erreur" || !r.salaire_ok || !r.gps_ok || !r.competences_ok;
    return true;
  });

  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1A1A2E", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>🧪 Programme de Test YELMA — 20 profils</div>
            <div style={{ fontSize: "10px", color: "#FF7043", marginTop: "2px" }}>Salaires · GPS · Compétences · Questions · Professions réglementées</div>
          </div>
          <a href="/" style={{ fontSize: "11px", color: "#aaa", textDecoration: "none" }}>← Accueil</a>
        </div>

        {/* Bouton lancer */}
        <button
          onClick={lancerTousLesTests}
          disabled={enCours}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: enCours ? "#aaa" : "#FF7043", color: "white", fontSize: "14px", fontWeight: 700, cursor: enCours ? "not-allowed" : "pointer", marginBottom: "12px" }}
        >
          {enCours ? `⏳ Tests en cours... ${progression}%` : "🚀 Lancer les 20 tests automatiques"}
        </button>

        {/* Barre progression */}
        {enCours && (
          <div style={{ background: "white", borderRadius: "10px", padding: "10px", marginBottom: "12px", border: "0.5px solid #E8E8F0" }}>
            <div style={{ background: "#F1EFE8", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
              <div style={{ background: "#FF7043", height: "100%", width: `${progression}%`, borderRadius: "6px", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", textAlign: "center" }}>{progression}% — {termines.length}/{PROFILS_TEST.length} profils testés</div>
          </div>
        )}

        {/* Analyse globale */}
        {termines.length >= 3 && (
          <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>📊 ANALYSE GLOBALE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {[
                { label: "Tests réussis", val: `${termines.length}/${PROFILS_TEST.length}`, color: "#085041", bg: "#D6FFE8" },
                { label: "Salaires corrects", val: `${salairesOk}/${termines.length}`, color: salairesOk === termines.length ? "#085041" : "#993C1D", bg: salairesOk === termines.length ? "#D6FFE8" : "#FFE0D6" },
                { label: "GPS alignés", val: `${gpsOk}/${termines.length}`, color: gpsOk === termines.length ? "#085041" : "#993C1D", bg: gpsOk === termines.length ? "#D6FFE8" : "#FFE0D6" },
                { label: "Compétences OK", val: `${competencesOk}/${termines.length}`, color: competencesOk === termines.length ? "#085041" : "#993C1D", bg: competencesOk === termines.length ? "#D6FFE8" : "#FFE0D6" },
                { label: "Durée moyenne", val: `${dureeeMoyenne}s`, color: "#0C447C", bg: "#F0F9FF" },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: stat.color }}>{stat.val}</div>
                  <div style={{ fontSize: "9px", color: stat.color }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filtres */}
            <div style={{ display: "flex", gap: "6px" }}>
              {(["tous", "ok", "erreur"] as const).map(f => (
                <button key={f} onClick={() => setFiltreStatut(f)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: 600, background: filtreStatut === f ? "#1A1A2E" : "#F1EFE8", color: filtreStatut === f ? "white" : "#888" }}>
                  {f === "tous" ? "Tous" : f === "ok" ? "✅ OK" : "❌ Problèmes"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grille résultats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {(resultatsFiltrés.length > 0 ? resultatsFiltrés : PROFILS_TEST.map(p => ({ id: p.id, label: p.label, statut: "en_attente" as const }))).map(resultat => {
            const profil = PROFILS_TEST.find(p => p.id === resultat.id)!;
            return (
              <div key={resultat.id} style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1A1A2E" }}>{profil.label}</div>
                  <button onClick={() => lancerUnTest(profil)} disabled={enCours || resultat.statut === "en_cours"} style={{ background: "#FFE0D6", border: "none", borderRadius: "8px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", color: "#993C1D", fontWeight: 600 }}>
                    {resultat.statut === "en_cours" ? "⏳" : "Tester"}
                  </button>
                </div>

                <div style={{ fontSize: "9px", color: "#888", marginBottom: "8px" }}>
                  {profil.candidatInfo.role_actuel || "Sans rôle"} → {profil.candidatInfo.objectif_declare || "Sans objectif"}
                  {profil.candidatInfo.ordre_professionnel_statut !== "non" && (
                    <span style={{ marginLeft: "6px", background: "#FFE0D6", color: "#993C1D", borderRadius: "10px", padding: "1px 6px", fontSize: "8px" }}>
                      🏅 {profil.candidatInfo.ordre_professionnel_nom}
                    </span>
                  )}
                </div>

                {resultat.statut === "termine" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

                    {/* Salaire */}
                    <div style={{ background: resultat.salaire_ok ? "#D6FFE8" : "#FFE0D6", borderRadius: "8px", padding: "8px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: resultat.salaire_ok ? "#085041" : "#993C1D", marginBottom: "3px" }}>
                        {resultat.salaire_ok ? "✅" : "❌"} SALAIRE MARCHÉ
                      </div>
                      <div style={{ fontSize: "11px", color: "#1A1A2E" }}>
                        Obtenu: {resultat.salaire_marche?.min?.toLocaleString()}$ — {resultat.salaire_marche?.max?.toLocaleString()}$
                      </div>
                      <div style={{ fontSize: "10px", color: "#888" }}>
                        Attendu: {resultat.salaire_attendu?.min?.toLocaleString()}$ — {resultat.salaire_attendu?.max?.toLocaleString()}$
                      </div>
                    </div>

                    {/* GPS */}
                    <div style={{ background: resultat.gps_ok ? "#D6FFE8" : "#FFE0D6", borderRadius: "8px", padding: "8px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: resultat.gps_ok ? "#085041" : "#993C1D", marginBottom: "3px" }}>
                        {resultat.gps_ok ? "✅" : "❌"} GPS
                      </div>
                      <div style={{ fontSize: "10px", color: "#1A1A2E" }}>An 1: {resultat.gps_an1}</div>
                      <div style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600 }}>An 5: {resultat.gps_an5}</div>
                      <div style={{ fontSize: "9px", color: "#888" }}>Attendu: contient "{profil.gps_an5_attendu}"</div>
                    </div>

                    {/* Compétences */}
                    <div style={{ background: resultat.competences_ok ? "#D6FFE8" : "#FFE0D6", borderRadius: "8px", padding: "8px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: resultat.competences_ok ? "#085041" : "#993C1D", marginBottom: "3px" }}>
                        {resultat.competences_ok ? "✅" : "❌"} COMPÉTENCES
                      </div>
                      {resultat.competences?.map((c, i) => (
                        <div key={i} style={{ fontSize: "10px", color: "#1A1A2E" }}>• {c}</div>
                      ))}
                    </div>

                    {/* Questions */}
                    <div style={{ background: "#F0F9FF", borderRadius: "8px", padding: "8px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#0C447C", marginBottom: "3px" }}>
                        📋 {resultat.nb_questions} QUESTIONS POSÉES
                      </div>
                      {resultat.questions_posees?.slice(0, 3).map((q, i) => (
                        <div key={i} style={{ fontSize: "9px", color: "#555", marginBottom: "2px" }}>• {q.substring(0, 60)}...</div>
                      ))}
                    </div>

                    <div style={{ fontSize: "9px", color: "#888", textAlign: "right" }}>⏱ {resultat.duree}s</div>
                  </div>
                )}

                {resultat.statut === "en_cours" && (
                  <div style={{ background: "#FFF8E1", borderRadius: "8px", padding: "8px", fontSize: "10px", color: "#7A5F00" }}>⏳ Test en cours...</div>
                )}

                {resultat.statut === "erreur" && (
                  <div style={{ background: "#FFE0D6", borderRadius: "8px", padding: "8px", fontSize: "10px", color: "#993C1D" }}>❌ {resultat.erreur}</div>
                )}

                {resultat.statut === "en_attente" && (
                  <div style={{ background: "#F1EFE8", borderRadius: "8px", padding: "8px", fontSize: "10px", color: "#888" }}>En attente...</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
