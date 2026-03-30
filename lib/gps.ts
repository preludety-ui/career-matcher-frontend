// ============================================================
// YELMA — lib/gps.ts
// Rôle : Construire le GPS de carrière sur 5 ans
//        avec données réelles CNP et salaires Supabase
// Mon code calcule — GPT reformule seulement
// ============================================================

import { supabaseAdmin } from './supabase'
import { SignauxNormalises } from './extracteur'
import { MetierScore } from './matching'

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface EtapeGPS {
  annee:        number   // 1 à 5
  titre:        string   // ex: "Développeur web junior"
  code_cnp:     string   // ex: "21230"
  salaire_min:  number   // ex: 55000
  salaire_max:  number   // ex: 70000
  actions:      string[] // ex: ["Obtenir certification AWS", "Développer portfolio"]
  est_objectif: boolean  // true si c'est l'objectif final
}

export interface GPSDeterm {
  etapes:              EtapeGPS[]
  objectif_atteignable: boolean
  annees_necessaires:  number    // si > 5, objectif non atteignable en 5 ans
  message_gps:         string
  salaire_actuel:      number
  salaire_cible:       number
}

// ─────────────────────────────────────────────────
// PROGRESSION DE SALAIRE
// Taux de croissance annuel selon le niveau
// ─────────────────────────────────────────────────

const TAUX_CROISSANCE: Record<number, number> = {
  1: 0.08,   // débutant → croissance rapide
  2: 0.07,
  3: 0.055,
  4: 0.04,
  5: 0.036,  // expert → croissance plus stable
}

function interpolerSalaire(salaire_base: number, niveau: number, annee: number): number {
  const taux = TAUX_CROISSANCE[niveau] ?? 0.05
  return Math.round(salaire_base * Math.pow(1 + taux, annee))
}

// ─────────────────────────────────────────────────
// ACTIONS PAR ÉTAPE
// Actions concrètes selon le niveau et le secteur
// ─────────────────────────────────────────────────

function genererActions(niveau: number, secteur: string, est_objectif: boolean): string[] {
  const secteurCode = secteur.toUpperCase()
    .replace('TECHNOLOGIES DE L\'INFORMATION', 'TI')
    .replace('SANTÉ', 'SANTE')
    .replace('INGÉNIERIE', 'INGENIERIE')
    .replace('CONSTRUCTION', 'CONSTRUCTION')
    .replace('FINANCE ET AFFAIRES', 'FINANCE')
    .replace('ÉDUCATION', 'EDUCATION')

  const actionsParSecteur: Record<string, Record<number, string[]>> = {
    TI: {
      1: ['Compléter une formation en ligne (Udemy, Coursera)', 'Construire un portfolio GitHub', 'Obtenir une première certification (AWS, Google)'],
      2: ['Contribuer à des projets open source', 'Obtenir certification cloud (AWS Solutions Architect)', 'Développer 2-3 projets personnels concrets'],
      3: ['Prendre en charge un projet complet', 'Mentorer des juniors', 'Obtenir certification avancée (AWS Professional)'],
      4: ['Diriger une équipe technique', 'Participer à des conférences tech', 'Publier des articles techniques'],
      5: ['Définir l\'architecture globale', 'Influencer la stratégie technique', 'Bâtir une réputation d\'expert reconnu'],
    },
    SANTE: {
      1: ['Compléter les stages cliniques requis', 'Obtenir certifications de base (RCR, premiers soins)', 'Rejoindre l\'ordre professionnel'],
      2: ['Accumuler de l\'expérience en milieu clinique', 'Suivre des formations continues obligatoires', 'Développer des spécialisations'],
      3: ['Prendre en charge des cas complexes', 'Superviser des stagiaires', 'Obtenir une spécialisation reconnue'],
      4: ['Assumer des responsabilités de coordination', 'Former les nouvelles recrues', 'Participer à des comités professionnels'],
      5: ['Occuper un poste de direction clinique', 'Contribuer à la recherche', 'Influencer les pratiques professionnelles'],
    },
    CONSTRUCTION: {
      1: ['Compléter l\'apprentissage du métier', 'Obtenir les certifications SST obligatoires', 'Accumuler les heures requises pour le certificat de compétence'],
      2: ['Obtenir le certificat de compétence compagnon', 'Élargir les techniques maîtrisées', 'Travailler sur des chantiers variés'],
      3: ['Superviser des apprentis', 'Obtenir des certifications spécialisées', 'Gérer des sections de chantier'],
      4: ['Devenir contremaître', 'Gérer des équipes et des sous-traitants', 'Obtenir la licence d\'entrepreneur'],
      5: ['Diriger des projets majeurs', 'Ouvrir sa propre entreprise', 'Former la prochaine génération'],
    },
    FINANCE: {
      1: ['Obtenir le titre CPA ou CFA (selon le rôle)', 'Maîtriser Excel et les outils financiers', 'Développer le réseau professionnel'],
      2: ['Obtenir des certifications reconnues', 'Gérer des dossiers clients en autonomie', 'Rejoindre des associations professionnelles'],
      3: ['Développer une clientèle ou un portefeuille', 'Obtenir des titres avancés', 'Prendre en charge des mandats complexes'],
      4: ['Diriger une équipe d\'analystes', 'Gérer un portefeuille important', 'Devenir associé ou gestionnaire senior'],
      5: ['Occuper un poste de direction', 'Siéger sur des conseils d\'administration', 'Développer une expertise reconnue'],
    },
    INGENIERIE: {
      1: ['Obtenir le titre d\'ingénieur junior (ing. jr.)', 'Accumuler les heures supervisées requises', 'Maîtriser les logiciels de conception (AutoCAD, Revit)'],
      2: ['Obtenir le titre d\'ingénieur (ing.)', 'Piloter des projets en autonomie', 'Obtenir des certifications spécialisées (PMP, LEED)'],
      3: ['Diriger des projets d\'envergure', 'Superviser des ingénieurs juniors', 'Développer une expertise pointue'],
      4: ['Occuper un rôle de chargé de projet senior', 'Développer des partenariats clients', 'Contribuer à des projets innovants'],
      5: ['Devenir directeur technique', 'Influencer les normes du secteur', 'Bâtir une réputation d\'expert reconnu'],
    },
    EDUCATION: {
      1: ['Obtenir le brevet d\'enseignement', 'Rejoindre un syndicat d\'enseignants', 'Développer des outils pédagogiques'],
      2: ['Obtenir un poste permanent', 'Suivre des formations pédagogiques continues', 'Développer des approches innovantes'],
      3: ['Prendre en charge des classes difficiles', 'Devenir mentor pour nouveaux enseignants', 'Participer à des comités pédagogiques'],
      4: ['Occuper un rôle de direction adjointe', 'Développer des programmes', 'Former les nouveaux enseignants'],
      5: ['Devenir directeur d\'école ou conseiller pédagogique senior', 'Influencer les politiques éducatives', 'Publier des recherches pédagogiques'],
    },
  }

  const actionsDefaut: Record<number, string[]> = {
    1: ['Compléter la formation requise', 'Obtenir les certifications de base', 'Bâtir un réseau professionnel'],
    2: ['Accumuler de l\'expérience pratique', 'Obtenir des certifications reconnues', 'Développer des compétences spécialisées'],
    3: ['Prendre des responsabilités élargies', 'Superviser des collègues juniors', 'Développer une expertise reconnue'],
    4: ['Occuper un rôle de leadership', 'Gérer des projets complexes', 'Contribuer à la stratégie organisationnelle'],
    5: ['Occuper un poste de direction', 'Influencer les pratiques du secteur', 'Bâtir une réputation d\'expert'],
  }

  const actions = actionsParSecteur[secteurCode]?.[niveau] ?? actionsDefaut[niveau]

  if (est_objectif) {
    return [...actions, '🎯 Objectif atteint — continuer à se développer']
  }

  return actions
}

// ─────────────────────────────────────────────────
// CONSTRUIRE LES ÉTAPES DU GPS
// ─────────────────────────────────────────────────

function construireEtapes(
  metier_actuel: { titre_fr: string; code_cnp: string; secteur: string },
  metier_cible: { titre_fr: string; code_cnp: string; secteur: string },
  niveau_actuel: number,
  niveau_cible: number,
  salaire_actuel: number,
  salaire_cible: number,
  annees_necessaires: number
): EtapeGPS[] {
  const etapes: EtapeGPS[] = []
  const ecart = niveau_cible - niveau_actuel

  for (let annee = 1; annee <= 5; annee++) {
    // Progression du niveau sur 5 ans
    const progression = ecart <= 0 ? 0 : Math.min(ecart, Math.round((annee / annees_necessaires) * ecart))
    const niveau_etape = Math.min(5, niveau_actuel + progression)

    // Titre de l'étape
    const est_objectif = annee >= annees_necessaires && ecart > 0
    const titre = est_objectif
      ? metier_cible.titre_fr
      : annee === 1
        ? metier_actuel.titre_fr
        : `${metier_actuel.titre_fr} — niveau ${niveau_etape}/5`

    // Salaire interpolé
    const salaire_base = annee <= annees_necessaires
      ? salaire_actuel + ((salaire_cible - salaire_actuel) * (annee / annees_necessaires))
      : salaire_cible

    const salaire_min = Math.round(salaire_base * 0.92)
    const salaire_max = Math.round(salaire_base * 1.08)

    etapes.push({
      annee,
      titre,
      code_cnp: est_objectif ? metier_cible.code_cnp : metier_actuel.code_cnp,
      salaire_min,
      salaire_max,
      actions: genererActions(niveau_etape, est_objectif ? metier_cible.secteur : metier_actuel.secteur, est_objectif),
      est_objectif,
    })
  }

  return etapes
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE — construireGPS()
// ─────────────────────────────────────────────────

export async function construireGPS(
  signaux: SignauxNormalises,
  top_metier: MetierScore
): Promise<GPSDeterm> {

  // 1. Chercher le métier actuel dans Supabase
  const { data: metierActuelData } = await supabaseAdmin
    .from('metiers')
    .select('titre_fr, code_cnp, secteur')
    .ilike('titre_fr', `%${signaux.role_actuel_normalise.split(' ')[0]}%`)
    .limit(1)
    .single()

  const metier_actuel = metierActuelData ?? {
    titre_fr: signaux.role_actuel_normalise,
    code_cnp: '00000',
    secteur: signaux.domaine_code,
  }

  // 2. Chercher le métier cible dans Supabase
  const { data: metierCibleData } = await supabaseAdmin
    .from('metiers')
    .select('titre_fr, code_cnp, secteur')
    .ilike('titre_fr', `%${signaux.objectif_normalise.split(' ')[0]}%`)
    .limit(1)
    .single()

  const metier_cible = metierCibleData ?? {
    titre_fr: top_metier.titre_fr,
    code_cnp: top_metier.code_cnp,
    secteur: top_metier.secteur,
  }

  // 3. Chercher les salaires réels dans Supabase
  const { data: salaireActuelData } = await supabaseAdmin
    .from('salaires_cnp')
    .select('salaire_median')
    .eq('code_cnp', metier_actuel.code_cnp)
    .limit(1)
    .single()

  const { data: salaireCibleData } = await supabaseAdmin
    .from('salaires_cnp')
    .select('salaire_median')
    .eq('code_cnp', metier_cible.code_cnp)
    .limit(1)
    .single()

  // Fallback si pas de données de salaire
  const salaire_actuel = salaireActuelData?.salaire_median
    ?? interpolerSalaire(45000, signaux.niveau_actuel, 0)

  const salaire_cible = salaireCibleData?.salaire_median
    ?? interpolerSalaire(55000, signaux.niveau_cible, 0)

  // 4. Calculer le nombre d'années nécessaires
  const ecart = signaux.niveau_cible - signaux.niveau_actuel
  const annees_necessaires = Math.max(1, Math.min(5, ecart <= 0 ? 1 : ecart * 1.5))
  const objectif_atteignable = annees_necessaires <= 5

  // 5. Construire les étapes
  const etapes = construireEtapes(
    metier_actuel,
    metier_cible,
    signaux.niveau_actuel,
    signaux.niveau_cible,
    salaire_actuel,
    salaire_cible,
    annees_necessaires
  )

  // 6. Message GPS
  const message_gps = objectif_atteignable
    ? `Votre objectif "${metier_cible.titre_fr}" est atteignable en ${Math.round(annees_necessaires)} an${annees_necessaires > 1 ? 's' : ''} avec un plan structuré.`
    : `Votre objectif "${metier_cible.titre_fr}" nécessite plus de 5 ans. Voici un plan réaliste pour maximiser votre progression.`

  return {
    etapes,
    objectif_atteignable,
    annees_necessaires: Math.round(annees_necessaires),
    message_gps,
    salaire_actuel,
    salaire_cible,
  }
}