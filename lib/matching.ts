// ============================================================
// YELMA — lib/matching.ts
// Rôle : Calculer les scores de matching entre un candidat
//        et les métiers de la base de données
// C'est MON CODE qui décide — pas GPT
// ============================================================

import { supabaseAdmin } from './supabase'
import { SignauxNormalises } from './extracteur'

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface MetierScore {
  code_cnp:         string
  titre_fr:         string
  secteur:          string
  score_total:      number   // 0-100
  score_competences: number  // 0-100
  score_domaine:    number   // 0-100
  score_niveau:     number   // 0-100
  competences_match: string[] // compétences qui matchent
  competences_manquantes: string[] // compétences à développer
  est_reglemente:   boolean
  croissance_prevue: string
}

export interface ResultatMatching {
  top_metiers:       MetierScore[]  // top 5
  score_faisabilite: number         // 0-100
  message_faisabilite: string
  est_reconversion:  boolean
  nb_metiers_analyses: number
}

// ─────────────────────────────────────────────────
// SCORE DOMAINE
// Mesure l'alignement entre le domaine du candidat
// et celui du métier cible
// ─────────────────────────────────────────────────

const DOMAINES_PROCHES: Record<string, string[]> = {
  'TI':           ['INGENIERIE', 'FINANCE'],
  'INGENIERIE':   ['TI', 'CONSTRUCTION'],
  'SANTE':        ['EDUCATION'],
  'EDUCATION':    ['SANTE'],
  'FINANCE':      ['TI', 'TRANSPORT'],
  'CONSTRUCTION': ['INGENIERIE', 'TRANSPORT'],
  'TRANSPORT':    ['CONSTRUCTION', 'FINANCE'],
  'AUTRE':        [],
}

function calculerScoreDomaine(
  domaine_candidat: string,
  secteur_metier: string
): number {
  const domaineMetier = secteur_metier
    .toUpperCase()
    .replace('TECHNOLOGIES DE L\'INFORMATION', 'TI')
    .replace('SANTÉ', 'SANTE')
    .replace('FINANCE ET AFFAIRES', 'FINANCE')
    .replace('INGÉNIERIE', 'INGENIERIE')
    .replace('ÉDUCATION', 'EDUCATION')
    .replace('TRANSPORT ET LOGISTIQUE', 'TRANSPORT')
    .replace('SÉCURITÉ ET SERVICES PUBLICS', 'SECURITE')
    .replace('AGRICULTURE ET ENVIRONNEMENT', 'AGRICULTURE')
    .replace('ARTS, CULTURE ET COMMUNICATION', 'ARTS')

  if (domaine_candidat === domaineMetier) return 100
  if (DOMAINES_PROCHES[domaine_candidat]?.includes(domaineMetier)) return 60
  return 25 // reconversion complète
}

// ─────────────────────────────────────────────────
// SCORE NIVEAU
// Mesure si le niveau du candidat correspond
// au niveau requis pour ce métier
// ─────────────────────────────────────────────────

function calculerScoreNiveau(
  niveau_candidat: number,
  niveau_metier: string
): number {
  const niveauMap: Record<string, number> = {
    'A': 4, // Universitaire
    'B': 3, // Collégial / Technique
    'C': 2, // Secondaire / DEP
    'D': 1, // Sans formation formelle
  }

  const niveauRequis = niveauMap[niveau_metier] ?? 3
  const ecart = niveauRequis - niveau_candidat

  if (ecart <= 0) return 100        // candidat surqualifié ou niveau exact
  if (ecart === 1) return 70        // 1 niveau à combler
  if (ecart === 2) return 40        // 2 niveaux à combler
  return 15                          // écart trop grand
}

// ─────────────────────────────────────────────────
// SCORE COMPÉTENCES
// Compare les compétences du candidat avec celles
// requises pour le métier (depuis metier_competence)
// ─────────────────────────────────────────────────

function calculerScoreCompetences(
  competences_candidat: string[],
  competences_metier: Array<{ code: string; poids: number; est_essentielle: boolean }>
): {
  score: number
  competences_match: string[]
  competences_manquantes: string[]
} {
  if (competences_metier.length === 0) {
    return { score: 50, competences_match: [], competences_manquantes: [] }
  }

  let points_obtenus = 0
  let points_total = 0
  const competences_match: string[] = []
  const competences_manquantes: string[] = []

  for (const cm of competences_metier) {
    const poids = cm.est_essentielle ? cm.poids * 1.5 : cm.poids
    points_total += poids

    if (competences_candidat.includes(cm.code)) {
      points_obtenus += poids
      competences_match.push(cm.code)
    } else {
      competences_manquantes.push(cm.code)
    }
  }

  const score = points_total > 0
    ? Math.round((points_obtenus / points_total) * 100)
    : 50

  return { score, competences_match, competences_manquantes }
}

// ─────────────────────────────────────────────────
// SCORE FAISABILITÉ
// Calcule la probabilité d'atteindre l'objectif
// ─────────────────────────────────────────────────

export function calculerScoreFaisabilite(signaux: SignauxNormalises): {
  score: number
  message: string
} {
  // 1. Écart de niveau (40%)
  const ecart = signaux.niveau_cible - signaux.niveau_actuel
  const score_ecart = Math.max(0, 100 - ecart * 20)

  // 2. Alignement domaine (30%)
  const score_domaine = signaux.est_reconversion ? 35 : 100

  // 3. Diplôme (30%)
  const score_diplome = signaux.diplome_niveau >= signaux.niveau_cible ? 100 : 45

  // Score pondéré
  const score = Math.round(
    score_ecart  * 0.40 +
    score_domaine * 0.30 +
    score_diplome * 0.30
  )

  // Message selon score
  let message = ''
  if (score >= 80) {
    message = `Votre profil est très bien aligné avec votre objectif. Probabilité de réussite : ${score}%.`
  } else if (score >= 60) {
    message = `Votre objectif est atteignable avec un plan structuré. Probabilité de réussite : ${score}%.`
  } else if (score >= 40) {
    message = `Votre objectif nécessite un effort significatif sur 5 ans. Probabilité de réussite : ${score}%.`
  } else {
    message = `Votre objectif représente une reconversion majeure. Probabilité de réussite : ${score}%. Un plan réaliste sur 5 ans est essentiel.`
  }

  return { score, message }
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE — scoreMetiers()
// Interroge Supabase et retourne les top 5 métiers
// ─────────────────────────────────────────────────

export async function scoreMetiers(
  signaux: SignauxNormalises
): Promise<ResultatMatching> {

  // 1. Charger tous les métiers actifs depuis Supabase
  const { data: metiers, error: errMetiers } = await supabaseAdmin
    .from('metiers')
    .select('id, code_cnp, titre_fr, secteur, niveau_formation, est_reglemente, croissance_prevue')
    .eq('actif', true)

  if (errMetiers || !metiers) {
    console.error('Erreur chargement métiers:', errMetiers)
    return {
      top_metiers: [],
      score_faisabilite: 0,
      message_faisabilite: 'Erreur de chargement des données.',
      est_reconversion: signaux.est_reconversion,
      nb_metiers_analyses: 0,
    }
  }

  // 2. Charger toutes les compétences liées à chaque métier
  const { data: liens, error: errLiens } = await supabaseAdmin
    .from('metier_competence')
    .select(`
      metier_id,
      poids,
      est_essentielle,
      competences (code)
    `)

  if (errLiens || !liens) {
    console.error('Erreur chargement compétences:', errLiens)
    return {
      top_metiers: [],
      score_faisabilite: 0,
      message_faisabilite: 'Erreur de chargement des compétences.',
      est_reconversion: signaux.est_reconversion,
      nb_metiers_analyses: 0,
    }
  }

  // 3. Grouper les compétences par métier
  const competencesParMetier: Record<string, Array<{
    code: string
    poids: number
    est_essentielle: boolean
  }>> = {}

  for (const lien of liens) {
    const metier_id = lien.metier_id
    if (!competencesParMetier[metier_id]) {
      competencesParMetier[metier_id] = []
    }
    competencesParMetier[metier_id].push({
      code: (lien.competences as any)?.code ?? '',
      poids: lien.poids,
      est_essentielle: lien.est_essentielle,
    })
  }

  // 4. Scorer chaque métier
  const scores: MetierScore[] = []

  for (const metier of metiers) {
    const comps = competencesParMetier[metier.id] ?? []

    const { score: score_competences, competences_match, competences_manquantes } =
      calculerScoreCompetences(signaux.competences_detectees, comps)

    const score_domaine = calculerScoreDomaine(signaux.domaine_code, metier.secteur)
    const score_niveau  = calculerScoreNiveau(signaux.niveau_actuel, metier.niveau_formation)

    // Score total pondéré
    const score_total = Math.round(
      score_competences * 0.50 +
      score_domaine     * 0.30 +
      score_niveau      * 0.20
    )

    scores.push({
      code_cnp:              metier.code_cnp,
      titre_fr:              metier.titre_fr,
      secteur:               metier.secteur,
      score_total,
      score_competences,
      score_domaine,
      score_niveau,
      competences_match,
      competences_manquantes: competences_manquantes.slice(0, 5), // top 5 manquantes
      est_reglemente:        metier.est_reglemente,
      croissance_prevue:     metier.croissance_prevue,
    })
  }

  // 5. Trier et garder le top 5
  const top_metiers = scores
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 5)

  // 6. Calculer la faisabilité
  const { score: score_faisabilite, message: message_faisabilite } =
    calculerScoreFaisabilite(signaux)

  return {
    top_metiers,
    score_faisabilite,
    message_faisabilite,
    est_reconversion:    signaux.est_reconversion,
    nb_metiers_analyses: metiers.length,
  }
}