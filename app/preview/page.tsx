"use client";

import { useState } from "react";

// 20 profils de test couvrant professions réglementées + non réglementées + tous niveaux

const PROFILS_TEST = [
  {
    id: 1, label: "Infirmière junior 1-2 ans",
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
    reponses: [
      "J'ai géré une situation d'urgence où un patient en détresse respiratoire nécessitait une intervention immédiate — j'ai coordonné l'équipe et stabilisé le patient avant l'arrivée du médecin",
      "J'ai développé un protocole de triage qui a réduit le temps d'attente de 30% dans mon unité",
      "Je collabore quotidiennement avec les médecins pour ajuster les plans de soins selon l'évolution clinique",
      "J'ai formé 3 infirmières juniors sur les protocoles de soins intensifs en 6 mois",
      "J'utilise les données cliniques pour anticiper les complications et prévenir les réadmissions",
      "J'ai mis en place des réunions hebdomadaires d'équipe qui ont amélioré la communication de 40%",
      "Je gère les dossiers patients avec précision en utilisant le système OACIS",
      "J'aspire à devenir IPS pour avoir plus d'autonomie dans la prise en charge des patients chroniques",
    ],
  },
  {
    id: 2, label: "Infirmière senior 6-10 ans",
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
    reponses: [
      "J'ai supervisé une équipe de 12 infirmières pendant 3 ans et réduit le taux de roulement de 25%",
      "J'ai implanté un nouveau système de gestion des médicaments qui a éliminé les erreurs d'administration",
      "Je gère les conflits entre membres d'équipe en utilisant une approche de médiation structurée",
      "J'ai développé et dispensé des formations sur les soins palliatifs à 50 professionnels de santé",
      "Je collabore avec la direction pour élaborer les politiques de soins de mon département",
      "J'ai optimisé les horaires de travail réduisant les heures supplémentaires de 20%",
      "Je supervise l'intégration des nouvelles technologies cliniques dans mon unité",
      "Mon objectif est de diriger un département entier et d'avoir un impact sur la qualité des soins à l'échelle institutionnelle",
    ],
  },
  {
    id: 3, label: "Médecin généraliste débutant",
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
    reponses: [
      "J'ai diagnostiqué et traité un cas complexe de diabète de type 2 avec complications cardiovasculaires en coordonnant avec 3 spécialistes",
      "J'ai développé un protocole de suivi pour les patients chroniques qui a réduit les hospitalisations de 15%",
      "Je gère en moyenne 25 patients par jour en consultation tout en maintenant une qualité de soins élevée",
      "J'ai formé des résidents en médecine familiale sur les techniques d'entrevue motivationnelle",
      "J'utilise les données probantes pour actualiser mes pratiques cliniques chaque semaine",
      "J'ai mis en place un système de rappel pour les vaccinations qui a augmenté la couverture de 30%",
      "Je collabore avec les travailleurs sociaux pour les patients vulnérables ayant des déterminants sociaux de santé complexes",
      "Mon objectif est d'ouvrir ma propre clinique de médecine familiale dans 5 ans",
    ],
  },
  {
    id: 4, label: "Pharmacienne 3-5 ans",
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
    reponses: [
      "J'ai identifié et résolu 3 interactions médicamenteuses dangereuses pour des patients polymédiqués cette année",
      "J'ai optimisé le processus de distribution des médicaments réduisant les erreurs de 40%",
      "Je supervise une équipe de 5 techniciens en pharmacie et coordonne les formations continues",
      "J'ai implanté un programme de révision médicamenteuse pour les patients âgés en collaboration avec les médecins",
      "J'ai développé des protocoles de substitution thérapeutique adoptés par toute la chaîne de pharmacies",
      "Je gère le budget de la pharmacie et négocie avec les fournisseurs pour optimiser les coûts",
      "J'ai formé mes collègues sur les nouvelles thérapies biologiques et leur gestion clinique",
      "Mon objectif est de diriger une chaîne de pharmacies et d'avoir un impact sur la santé publique",
    ],
  },
  {
    id: 5, label: "Avocat junior 1-2 ans",
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
    reponses: [
      "J'ai rédigé et plaidé 15 dossiers en droit du travail cette année avec un taux de succès de 80%",
      "J'ai négocié un règlement hors cour de 500 000$ évitant un procès coûteux à mon client",
      "Je gère simultanément 25 dossiers actifs en respectant tous les délais de prescription",
      "J'ai développé une expertise en droit des technologies que peu d'avocats de mon cabinet possèdent",
      "J'ai formé des stagiaires sur la rédaction de contrats commerciaux complexes",
      "J'ai identifié une jurisprudence récente qui a permis de gagner un dossier considéré perdu",
      "Je collabore avec des avocats seniors pour préparer les plaidoiries devant la Cour d'appel",
      "Mon objectif est de devenir associé en développant une clientèle propre en droit commercial",
    ],
  },
  {
    id: 6, label: "CPA senior 6-10 ans",
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
    reponses: [
      "J'ai dirigé la clôture fiscale annuelle d'une entreprise de 500M$ en réduisant le délai de 3 semaines",
      "J'ai identifié des économies fiscales de 2M$ grâce à une restructuration corporative innovante",
      "Je supervise une équipe de 8 comptables et gère leur développement professionnel",
      "J'ai implanté un système ERP SAP qui a automatisé 60% des processus comptables",
      "J'ai présenté les résultats financiers trimestriels au conseil d'administration pendant 3 ans",
      "J'ai développé des modèles financiers pour évaluer 5 acquisitions potentielles",
      "Je gère les relations avec les vérificateurs externes et les autorités fiscales",
      "Mon objectif est de devenir CFO d'une entreprise cotée en bourse dans les 5 prochaines années",
    ],
  },
  {
    id: 7, label: "Ingénieur junior sans OIQ",
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
    reponses: [
      "J'ai conçu les plans structuraux d'un bâtiment de 10 étages en respectant les normes parasismiques du Code du bâtiment",
      "J'ai optimisé le design d'une fondation réduisant les coûts de matériaux de 15% sans compromettre la sécurité",
      "Je coordonne avec les architectes et entrepreneurs pour résoudre les problèmes techniques sur chantier",
      "J'ai développé des calculs structuraux vérifiés par un ingénieur senior pour 3 projets résidentiels",
      "J'utilise AutoCAD et ETABS pour modéliser et analyser les structures complexes",
      "J'ai identifié un problème de drainage critique sur un chantier évitant des dommages estimés à 200 000$",
      "Je prépare les rapports techniques et la documentation pour les demandes de permis municipaux",
      "Mon objectif est d'obtenir mon titre d'ingénieur OIQ et de me spécialiser en génie parasismique",
    ],
  },
  {
    id: 8, label: "Architecte intermédiaire 3-5 ans",
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
    reponses: [
      "J'ai dirigé la conception d'un complexe résidentiel de 150 unités de 45M$ de la phase concept à la construction",
      "J'ai intégré des principes de design durable LEED Gold réduisant la consommation énergétique de 35%",
      "Je coordonne 5 consultants spécialisés pour assurer la cohérence technique et esthétique des projets",
      "J'ai développé un processus de révision de plans qui a réduit les erreurs de construction de 25%",
      "Je présente les concepts architecturaux aux clients et aux comités d'urbanisme avec succès",
      "J'ai remporté un appel d'offres compétitif pour la rénovation d'un bâtiment patrimonial",
      "J'utilise Revit et BIM pour modéliser les projets et détecter les conflits avant construction",
      "Mon objectif est de devenir associé et de développer une spécialité en architecture institutionnelle",
    ],
  },
  {
    id: 9, label: "Enseignant primaire débutant",
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
    gps_an5_attendu: "école",
    reponses: [
      "J'ai développé une approche pédagogique différenciée qui a permis à 3 élèves en difficulté d'atteindre leur niveau scolaire",
      "J'ai créé des outils d'évaluation formative qui m'ont permis d'adapter mon enseignement en temps réel",
      "Je collabore avec les orthopédagogues et les parents pour créer des plans d'intervention personnalisés",
      "J'ai organisé un projet interdisciplinaire sur l'environnement qui a engagé toute l'école",
      "J'utilise les technologies numériques pour rendre l'apprentissage plus interactif et motivant",
      "J'ai participé au comité pédagogique pour réviser le programme de mathématiques de l'école",
      "Je gère efficacement une classe de 28 élèves avec des besoins très diversifiés",
      "Mon objectif est de développer mes compétences en leadership pour éventuellement diriger une école",
    ],
  },
  {
    id: 10, label: "Professeur université 3-5 ans",
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
    reponses: [
      "J'ai publié 8 articles dans des revues à comité de lecture avec facteur d'impact élevé en 3 ans",
      "J'ai obtenu une subvention CRSH de 150 000$ pour financer mes recherches sur les inégalités économiques",
      "Je supervise 3 étudiants au doctorat et 5 à la maîtrise avec un taux de diplomation de 100%",
      "J'ai développé un nouveau cours sur l'économie comportementale adopté par 3 universités canadiennes",
      "Je présente mes recherches dans 4 conférences internationales par année",
      "J'ai collaboré avec Statistique Canada pour analyser les données sur la mobilité sociale",
      "Je siège sur 2 comités éditoriaux de revues scientifiques reconnues",
      "Mon objectif est d'obtenir la permanence et de créer un laboratoire de recherche sur les politiques économiques",
    ],
  },
  {
    id: 11, label: "Analyste financier junior",
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
    reponses: [
      "J'ai automatisé le processus de réconciliation bancaire avec Excel VBA réduisant le temps de traitement de 3 heures à 20 minutes",
      "J'ai créé un tableau de bord Power BI pour suivre les indicateurs financiers clés utilisé par toute la direction",
      "J'ai identifié une anomalie de 50 000$ dans les états financiers que personne n'avait remarquée",
      "Je prépare les rapports financiers mensuels pour 3 directeurs et réponds à leurs questions en temps réel",
      "J'ai formé 2 nouveaux analystes sur nos processus de reporting financier",
      "J'ai proposé une nouvelle structure de rapport adoptée par tout le département",
      "Je gère les relations avec les auditeurs externes pendant les périodes de clôture trimestrielle",
      "Mon directeur me délègue des dossiers de plus en plus complexes depuis 6 mois",
    ],
  },
  {
    id: 12, label: "Développeur senior 6-10 ans",
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
    reponses: [
      "J'ai architecturé une plateforme cloud qui supporte 2 millions d'utilisateurs avec 99.99% de disponibilité",
      "J'ai migré 3 systèmes legacy vers microservices sans interruption de service sur 18 mois",
      "Je dirige techniquement une équipe de 12 développeurs sur 2 fuseaux horaires différents",
      "J'ai réduit les coûts d'infrastructure AWS de 35% en optimisant l'architecture et en éliminant les ressources inutilisées",
      "J'ai créé un framework de code review adopté par 3 équipes différentes dans l'entreprise",
      "J'ai recruté et mentoré 5 développeurs juniors qui sont maintenant tous au niveau senior",
      "J'ai présenté notre architecture devant le conseil d'administration pour un budget de 5M$",
      "Mon objectif est de devenir CTO et de définir la vision technologique d'une scale-up",
    ],
  },
  {
    id: 13, label: "Chargé de projet 3-5 ans",
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
    reponses: [
      "J'ai livré la migration d'un système bancaire de 2M$ en avance de 2 semaines avec zéro incident",
      "Je gère simultanément 3 projets avec des équipes de 8 à 15 personnes chacune",
      "J'ai mis en place une méthodologie agile hybride adoptée par tout le département IT",
      "J'ai résolu un conflit majeur entre deux équipes qui bloquait le projet depuis 3 semaines",
      "J'ai négocié une extension de délai avec le client tout en maintenant la relation de confiance",
      "Mon taux de livraison dans les délais est de 94% sur 3 ans de projets",
      "J'ai développé un tableau de bord de suivi de projet utilisé par toute la direction",
      "Mon objectif est de diriger un programme multi-projets et de gérer une équipe de chargés de projet",
    ],
  },
  {
    id: 14, label: "Coordinatrice marketing junior",
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
    reponses: [
      "J'ai lancé une campagne LinkedIn B2B qui a généré 500 leads qualifiés en 3 mois pour un budget de 15 000$",
      "J'ai augmenté le taux de conversion du site web de 1.2% à 3.8% en optimisant les landing pages",
      "Je gère le calendrier éditorial de 5 plateformes sociales avec une croissance organique de 25% mensuelle",
      "J'ai créé une stratégie de contenu SEO qui a multiplié le trafic organique par 3 en 8 mois",
      "J'ai coordonné le lancement de 2 nouveaux produits avec des équipes de vente et produit",
      "J'ai formé une équipe de 3 juniors sur les outils d'automatisation HubSpot et Salesforce",
      "J'ai négocié des partenariats médias réduisant nos coûts publicitaires de 25%",
      "Mon directeur me confie maintenant la présentation des résultats marketing au CEO chaque mois",
    ],
  },
  {
    id: 15, label: "Expert RH 10+ ans",
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
    reponses: [
      "J'ai transformé la culture organisationnelle d'une entreprise de 800 personnes réduisant le taux de roulement de 35% à 18%",
      "J'ai développé et implanté une stratégie de talent acquisition qui a réduit le délai d'embauche de 60 jours à 25 jours",
      "Je supervise une équipe RH de 12 personnes couvrant 5 pays en Amérique du Nord",
      "J'ai négocié et renouvelé 3 conventions collectives complexes sans conflit de travail",
      "J'ai développé un programme de leadership qui a promu 15 gestionnaires en 2 ans",
      "J'ai implanté un SIRH complet Workday pour 1200 employés en 8 mois",
      "Je siège au comité exécutif et j'influence les décisions stratégiques de l'entreprise",
      "Mon objectif est de devenir CHRO d'une grande entreprise et d'avoir un impact sur la stratégie globale",
    ],
  },
  {
    id: 16, label: "Reconversion — Enseignant vers Dev",
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
    reponses: [
      "Je veux changer de carrière car je veux créer des outils numériques qui facilitent l'apprentissage",
      "En 8 ans d'enseignement j'ai développé des compétences en communication, pédagogie et gestion de projets éducatifs",
      "J'ai suivi 3 formations en ligne en JavaScript React et Node.js et construit 4 projets personnels",
      "J'ai créé une application web pour gérer les notes de mes élèves utilisée par 5 collègues enseignants",
      "Ma capacité à expliquer des concepts complexes clairement est un atout pour la documentation technique",
      "J'ai contribué à 2 projets open source sur GitHub avec des pull requests acceptées",
      "Une startup EdTech m'a approché après avoir vu mes projets sur GitHub",
      "Je cherche à allier ma passion pour l'éducation et la technologie dans un rôle de développeur",
    ],
  },
  {
    id: 17, label: "Étudiant avec stage — Comptabilité",
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
    reponses: [
      "Pendant mon stage j'ai préparé les états financiers mensuels et réconcilié les comptes bancaires de 3 entités",
      "J'ai identifié une erreur de classification de 15 000$ dans les charges que mon superviseur avait manquée",
      "J'ai créé un fichier Excel automatisé pour le suivi des comptes clients réduisant le temps de traitement de 2 heures",
      "Mon superviseur m'a confié la préparation des déclarations de TPS TVQ de façon autonome dès la 3e semaine",
      "J'ai obtenu la meilleure note de ma cohorte en fiscalité et en audit l'année passée",
      "Je suis trésorière de mon association étudiante et gère un budget annuel de 12 000$",
      "J'ai appris QuickBooks et Sage par moi-même en regardant des tutoriels pendant mes temps libres",
      "Mon objectif est d'obtenir le titre CPA et de travailler en vérification dans un grand cabinet",
    ],
  },
  {
    id: 18, label: "Autodidacte — Développeur web",
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
    reponses: [
      "J'ai appris JavaScript React et Node.js seul en 18 mois et j'ai été embauché sans diplôme grâce à mon portfolio",
      "J'ai développé une application SaaS de gestion de facturation qui a 50 clients payants",
      "Je résous des bugs complexes en production en utilisant une approche méthodique de débogage",
      "J'ai refactorisé le code legacy de mon équipe réduisant le temps de chargement de 60%",
      "Je contribue activement à des projets open source et j'ai 200 étoiles sur GitHub",
      "J'ai formé 2 collègues juniors sur React et les bonnes pratiques de développement",
      "J'ai proposé et implanté une architecture qui a permis de passer de 100 à 10 000 utilisateurs",
      "Mon objectif est de devenir lead développeur et d'influencer les décisions techniques de mon équipe",
    ],
  },
  {
    id: 19, label: "Vétérinaire débutant",
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
    reponses: [
      "J'ai diagnostiqué et traité un cas complexe d'intoxication chez un chien sauvant sa vie grâce à une intervention rapide",
      "J'ai développé un protocole de soins post-opératoires qui a réduit les complications de 20% dans ma clinique",
      "Je gère en moyenne 15 consultations par jour tout en maintenant une qualité de soins élevée",
      "J'ai formé les assistants vétérinaires sur les nouvelles techniques chirurgicales minimalement invasives",
      "J'utilise les dernières avancées en médecine vétérinaire pour offrir des soins de pointe",
      "J'ai mis en place un système de suivi des patients chroniques améliorant leur qualité de vie",
      "Je collabore avec des spécialistes vétérinaires pour les cas complexes nécessitant une expertise pointue",
      "Mon objectif est d'ouvrir ma propre clinique vétérinaire spécialisée en médecine interne animale",
    ],
  },
  {
    id: 20, label: "Pilote commercial débutant",
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
    reponses: [
      "J'ai effectué 500 heures de vol sur Boeing 737 en maintenant un bilan de sécurité parfait",
      "J'ai géré une situation d'urgence météorologique en déroutant vers un aéroport alternatif sans incident",
      "Je collabore avec les contrôleurs aériens et le personnel de cabine pour assurer la sécurité des vols",
      "J'ai développé des procédures d'approche optimisées réduisant la consommation de carburant de 8%",
      "Je me forme continuellement sur les nouvelles réglementations Transport Canada et les procédures OACI",
      "J'ai formé des co-pilotes juniors sur les procédures d'urgence et la gestion des ressources d'équipage",
      "J'ai maintenu un taux de ponctualité de 96% sur mes 200 derniers vols malgré les contraintes opérationnelles",
      "Mon objectif est d'accumuler les heures de vol nécessaires pour devenir commandant de bord dans 10 ans",
    ],
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
  score_propulse?: number;
  score_cible_pct?: number;
  verdict?: string;
  message_analyse?: string;
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

      const reponses = profil.reponses;

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
      score_propulse: rapportData.score_propulse,
      score_cible_pct: rapportData.score_cible_pct,
      verdict: rapportData.verdict,
      message_analyse: rapportData.message_analyse,
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

                    {/* Scores PROPULSE */}
                    {resultat.score_propulse && (
                      <div style={{ background: "#FFF7ED", borderRadius: "8px", padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF6B35", marginBottom: "2px" }}>🧠 SCORE PROPULSE</div>
                          <div style={{ fontSize: "9px", color: "#888" }}>Cible: {resultat.score_cible_pct}% · {resultat.verdict}</div>
                        </div>
                       <div>
                          <div style={{ fontSize: "8px", color: "#888", textAlign: "center", marginBottom: "4px" }}>SCORE PROPULSE</div>
                          <div style={{ fontSize: "24px", fontWeight: 700, color: resultat.verdict === 'atteignable' ? "#FF6B35" : "#B8860B", textAlign: "center", marginTop: "8px" }}>
                            {resultat.score_propulse}
                          </div>
                        </div>
                      </div>
                    )}
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
