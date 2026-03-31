// ============================================================
// YELMA — lib/matching.ts
// Rôle : Calculer les scores de matching entre un candidat
//        et les métiers de la base de données
// Utilise la hiérarchie CNP pour les matchs approximatifs
// ============================================================

import { supabaseAdmin } from './supabase'
import { SignauxNormalises } from './extracteur'

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface MetierScore {
  code_cnp:              string
  titre_fr:              string
  secteur:               string
  score_total:           number
  score_competences:     number
  score_domaine:         number
  score_niveau:          number
  competences_match:     string[]
  competences_manquantes: string[]
  est_reglemente:        boolean
  croissance_prevue:     string
}

export interface ResultatMatching {
  top_metiers:          MetierScore[]
  score_faisabilite:    number
  message_faisabilite:  string
  est_reconversion:     boolean
  nb_metiers_analyses:  number
}

// ─────────────────────────────────────────────────
// HIÉRARCHIE CNP
// ─────────────────────────────────────────────────

export function getGroupeCNP(code_cnp: string): {
  grand_groupe:    string
  sous_groupe:     string
  sous_groupe_min: string
} {
  const code = code_cnp.replace(/\D/g, '')
  return {
    grand_groupe:    code.substring(0, 1),
    sous_groupe:     code.substring(0, 2),
    sous_groupe_min: code.substring(0, 3),
  }
}

// Mapping grand groupe CNP → secteur YELMA
const CNP_GROUPE_SECTEUR: Record<string, string> = {
  '0': 'Finance et affaires',
  '1': 'Finance et affaires',
  '2': 'Technologies de l\'information',
  '3': 'Santé',
  '4': 'Éducation',
  '5': 'Arts, culture et communication',
  '6': 'Vente et services',
  '7': 'Construction',
  '8': 'Agriculture et environnement',
  '9': 'Sécurité et services publics',
}

export function getSecteurFromCNP(code_cnp: string): string {
  const { grand_groupe } = getGroupeCNP(code_cnp)
  return CNP_GROUPE_SECTEUR[grand_groupe] ?? 'Autre'
}

// ─────────────────────────────────────────────────
// SCORE DOMAINE
// ─────────────────────────────────────────────────

const DOMAINES_PROCHES: Record<string, string[]> = {
  'TI':           ['INGENIERIE', 'FINANCE'],
  'INGENIERIE':   ['TI', 'CONSTRUCTION'],
  'SANTE':        ['EDUCATION'],
  'EDUCATION':    ['SANTE'],
  'FINANCE':      ['TI', 'TRANSPORT'],
  'CONSTRUCTION': ['INGENIERIE', 'TRANSPORT'],
  'TRANSPORT':    ['CONSTRUCTION', 'FINANCE'],
}

function normaliserSecteur(secteur: string): string {
  return secteur.toUpperCase()
    .replace('TECHNOLOGIES DE L\'INFORMATION', 'TI')
    .replace('SANTÉ', 'SANTE')
    .replace('FINANCE ET AFFAIRES', 'FINANCE')
    .replace('INGÉNIERIE', 'INGENIERIE')
    .replace('ÉDUCATION', 'EDUCATION')
    .replace('TRANSPORT ET LOGISTIQUE', 'TRANSPORT')
    .replace('SÉCURITÉ ET SERVICES PUBLICS', 'SECURITE')
    .replace('AGRICULTURE ET ENVIRONNEMENT', 'AGRICULTURE')
    .replace('ARTS, CULTURE ET COMMUNICATION', 'ARTS')
}

function calculerScoreDomaine(
  domaine_candidat: string,
  secteur_metier: string
): number {
  const d = normaliserSecteur(domaine_candidat)
  const s = normaliserSecteur(secteur_metier)

  if (d === s) return 100
  if (DOMAINES_PROCHES[d]?.includes(s)) return 60
  return 25
}

// ─────────────────────────────────────────────────
// SCORE NIVEAU
// ─────────────────────────────────────────────────

function calculerScoreNiveau(
  niveau_candidat: number,
  niveau_metier: string
): number {
  const niveauMap: Record<string, number> = {
    'A': 4, 'B': 3, 'C': 2, 'D': 1,
  }
  const niveauRequis = niveauMap[niveau_metier] ?? 3
  const ecart = niveauRequis - niveau_candidat

  if (ecart <= 0) return 100
  if (ecart === 1) return 70
  if (ecart === 2) return 40
  return 15
}

// ─────────────────────────────────────────────────
// SCORE COMPÉTENCES
// ─────────────────────────────────────────────────

function calculerScoreCompetences(
  competences_candidat: string[],
  competences_metier: Array<{ code: string; poids: number; est_essentielle: boolean }>
): {
  score:                  number
  competences_match:      string[]
  competences_manquantes: string[]
} {
  if (competences_metier.length === 0) {
    return { score: 50, competences_match: [], competences_manquantes: [] }
  }

  let points_obtenus = 0
  let points_total   = 0
  const competences_match:      string[] = []
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

  return {
    score,
    competences_match,
    competences_manquantes: competences_manquantes.slice(0, 5),
  }
}

// ─────────────────────────────────────────────────
// SCORE FAISABILITÉ
// ─────────────────────────────────────────────────

export function calculerScoreFaisabilite(signaux: SignauxNormalises): {
  score:   number
  message: string
} {
  const ecart         = signaux.niveau_cible - signaux.niveau_actuel
  const score_ecart   = Math.max(0, 100 - ecart * 20)
  const score_domaine = signaux.est_reconversion ? 35 : 100
  const score_diplome = signaux.diplome_niveau >= signaux.niveau_cible ? 100 : 45

  const score = Math.round(
    score_ecart   * 0.40 +
    score_domaine * 0.30 +
    score_diplome * 0.30
  )

  let message = ''
  if (score >= 80) {
    message = `Votre profil est très bien aligné. Probabilité de réussite : ${score}%.`
  } else if (score >= 60) {
    message = `Votre objectif est atteignable avec un plan structuré. Probabilité de réussite : ${score}%.`
  } else if (score >= 40) {
    message = `Votre objectif nécessite un effort significatif. Probabilité de réussite : ${score}%.`
  } else {
    message = `Votre objectif représente une reconversion majeure. Probabilité de réussite : ${score}%.`
  }

  return { score, message }
}

// ─────────────────────────────────────────────────
// CHERCHER MÉTIER PAR GROUPE CNP (cascade)
// exact → sous-groupe 3 → sous-groupe 2 → grand groupe
// ─────────────────────────────────────────────────

export async function chercherMetierParGroupeCNP(
  texte: string,
  code_cnp_reference?: string
): Promise<{
  id: string; titre_fr: string; code_cnp: string
  secteur: string; niveau_formation: string
  est_reglemente: boolean; croissance_prevue: string
} | null> {

  // 1. Cherche par titre
  const motCle = texte.split(' ')[0]
  const { data: exact } = await supabaseAdmin
    .from('metiers')
    .select('id, titre_fr, code_cnp, secteur, niveau_formation, est_reglemente, croissance_prevue')
    .ilike('titre_fr', `%${motCle}%`)
    .eq('actif', true)
    .limit(1)
    .single()

  if (exact) return exact

  // 2. Recherche en cascade par groupe CNP
  if (code_cnp_reference) {
    const { sous_groupe_min, sous_groupe, grand_groupe } = getGroupeCNP(code_cnp_reference)

    for (const prefix of [sous_groupe_min, sous_groupe, grand_groupe]) {
      const { data } = await supabaseAdmin
        .from('metiers')
        .select('id, titre_fr, code_cnp, secteur, niveau_formation, est_reglemente, croissance_prevue')
        .ilike('code_cnp', `${prefix}%`)
        .eq('actif', true)
        .limit(1)
        .single()

      if (data) return data
    }
  }

  return null
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE — scoreMetiers()
// ─────────────────────────────────────────────────

export async function scoreMetiers(
  signaux: SignauxNormalises
): Promise<ResultatMatching> {

  // 1. Charger tous les métiers actifs
  const { data: metiers, error: errMetiers } = await supabaseAdmin
    .from('metiers')
    .select('id, code_cnp, titre_fr, secteur, niveau_formation, est_reglemente, croissance_prevue')
    .eq('actif', true)

  if (errMetiers || !metiers) {
    console.error('Erreur chargement métiers:', errMetiers)
    return {
      top_metiers: [], score_faisabilite: 0,
      message_faisabilite: 'Erreur de chargement.',
      est_reconversion: signaux.est_reconversion,
      nb_metiers_analyses: 0,
    }
  }

  // 2. Charger toutes les compétences liées
  const { data: liens, error: errLiens } = await supabaseAdmin
    .from('metier_competence')
    .select('metier_id, poids, est_essentielle, competences (code)')

  if (errLiens || !liens) {
    console.error('Erreur chargement compétences:', errLiens)
    return {
      top_metiers: [], score_faisabilite: 0,
      message_faisabilite: 'Erreur compétences.',
      est_reconversion: signaux.est_reconversion,
      nb_metiers_analyses: 0,
    }
  }

  // 3. Grouper compétences par métier
  const competencesParMetier: Record<string, Array<{
    code: string; poids: number; est_essentielle: boolean
  }>> = {}

 for (const lien of liens) {
    const mid = lien.metier_id
    if (!competencesParMetier[mid]) competencesParMetier[mid] = []
    competencesParMetier[mid].push({
      code:            (lien.competences as unknown as { code: string })?.code ?? '',
      poids:           lien.poids,
      est_essentielle: lien.est_essentielle,
    })
  
  }

  // 4. Scorer chaque métier
  const scores: MetierScore[] = []

  for (const metier of metiers) {
    const comps = competencesParMetier[metier.id] ?? []

    const { score: score_competences, competences_match, competences_manquantes } =
      calculerScoreCompetences(signaux.competences_detectees, comps)

    // Secteur depuis la table, sinon dérivé du groupe CNP
    const secteurEffectif = metier.secteur || getSecteurFromCNP(metier.code_cnp)

    const score_domaine = calculerScoreDomaine(signaux.domaine_code, secteurEffectif)
    const score_niveau  = calculerScoreNiveau(signaux.niveau_actuel, metier.niveau_formation)

    const score_total = Math.round(
      score_competences * 0.50 +
      score_domaine     * 0.30 +
      score_niveau      * 0.20
    )

    scores.push({
      code_cnp:               metier.code_cnp,
      titre_fr:               metier.titre_fr,
      secteur:                secteurEffectif,
      score_total,
      score_competences,
      score_domaine,
      score_niveau,
      competences_match,
      competences_manquantes,
      est_reglemente:         metier.est_reglemente,
      croissance_prevue:      metier.croissance_prevue,
    })
  }

  // 5. Top 5
  const top_metiers = scores
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 5)

  // 6. Faisabilité
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