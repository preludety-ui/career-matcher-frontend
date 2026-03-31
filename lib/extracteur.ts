// ============================================================
// YELMA — lib/extracteur.ts V2
// Rôle : Extraire et structurer les données depuis le formulaire
//        et le JSON GPT pour alimenter le moteur déterministe
// Les données du formulaire sont la source de vérité
// GPT extrait seulement les skills et l'intention
// ============================================================

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface DonneesFormulaire {
  prenom?:                     string
  nom?:                        string
  email?:                      string
  diplome?:                    string
  annee_diplome?:              string
  domaine_etudes?:             string
  annee_experience?:           string
  annee_autre_experience?:     string
  domaine_actuel?:             string
  role_actuel?:                string
  ville?:                      string
  statut_emploi?:              string
  objectif_declare?:           string
  ordre_professionnel_statut?: string
  ordre_professionnel_nom?:    string
  salaire_min?:                number
  salaire_max?:                number
}

export interface ExtractionGPT {
  intention:        'evolution' | 'salaire' | 'reconversion' | 'premier_emploi'
  domaine_cible:    string
  titre_cible:      string
  salaire_vise:     number | null
  soft_skills:      string[]
  hard_skills:      string[]
  force1:           string
  force1_desc:      string
  force2:           string
  force2_desc:      string
  force3:           string
  force3_desc:      string
  axe1:             string
  axe1_desc:        string
  axe2:             string
  axe2_desc:        string
  formations:       { nom: string; type: string; plateforme: string; duree: string }[]
  certifications:   { nom: string; organisme: string }[]
  opportunites:     { titre: string; salaire: number; description: string }[]
  message_objectif: string
  ville?:           string
}

export interface ProfilNormalise {
  prenom:                  string
  role_actuel:             string
  objectif_declare:        string
  titre_cible:             string
  domaine_actuel:          string
  domaine_cible:           string
  ville:                   string
  intention:               'evolution' | 'salaire' | 'reconversion' | 'premier_emploi'
  niveau_actuel:           number
  niveau_cible:            number
  diplome_niveau:          number
  annees_experience:       number
  est_reconversion:        boolean
  est_ordre_professionnel: boolean
  nom_ordre:               string
  soft_skills:             string[]
  hard_skills:             string[]
  competences_codes:       string[]
  salaire_vise:            number | null
}

// Compatibilité avec l'ancien code
export interface SignauxNormalises {
  competences_detectees: string[]
  domaine_code:          string
  niveau_actuel:         number
  niveau_cible:          number
  score_qualite:         number
  role_actuel_normalise: string
  objectif_normalise:    string
  diplome_niveau:        number
  annees_experience:     number
  est_reconversion:      boolean
}

export interface SignauxBruts {
  signaux_comportementaux: string[]
  actions_mentionnees:     string[]
  domaine_actuel:          string
  role_actuel:             string
  objectif_declare:        string
  diplome:                 string
  annees_experience:       number
  niveau_detail:           number
  structure_logique:       number
}

// ─────────────────────────────────────────────────
// MAPPING DIPLÔMES → NIVEAU (1-5)
// ─────────────────────────────────────────────────

const DIPLOME_NIVEAU: Record<string, number> = {
  'secondaire':          1,
  'sec 5':               1,
  'autodidacte':         1,
  'sans diplôme':        1,
  'dep':                 2,
  'aep':                 2,
  'asp':                 2,
  'formation technique': 2,
  'dec':                 3,
  'cégep':               3,
  'cegep':               3,
  'attestation':         3,
  'bac':                 4,
  'bachelor':            4,
  'baccalauréat':        4,
  'maîtrise':            5,
  'maitrise':            5,
  'master':              5,
  'mba':                 5,
  'doctorat':            5,
  'phd':                 5,
}

export function getNiveauDiplome(diplome: string): number {
  if (!diplome) return 2
  const d = diplome.toLowerCase()
  for (const [mot, niveau] of Object.entries(DIPLOME_NIVEAU)) {
    if (d.includes(mot)) return niveau
  }
  return 2
}

// ─────────────────────────────────────────────────
// MAPPING EXPÉRIENCE → NIVEAU (1-5) ET ANNÉES
// ─────────────────────────────────────────────────

export function getNiveauExperience(experience: string): {
  niveau: number
  annees: number
} {
  if (!experience) return { niveau: 1, annees: 0 }
  const exp = experience.toLowerCase()

  if (exp.includes('aucune') || exp === '')      return { niveau: 1, annees: 0 }
  if (exp.includes('moins'))                     return { niveau: 1, annees: 0.5 }
  if (exp.includes('1 à 2'))                     return { niveau: 2, annees: 2 }
  if (exp.includes('3 à 5'))                     return { niveau: 3, annees: 4 }
  if (exp.includes('6 à 10'))                    return { niveau: 4, annees: 8 }
  if (exp.includes('plus de 10'))                return { niveau: 5, annees: 12 }
  return { niveau: 2, annees: 1 }
}

// ─────────────────────────────────────────────────
// MAPPING DOMAINES → SECTEUR YELMA
// ─────────────────────────────────────────────────

const DOMAINE_SECTEUR: Record<string, string> = {
  'développeur':               'Technologies de l\'information',
  'developpeur':               'Technologies de l\'information',
  'programmeur':               'Technologies de l\'information',
  'informatique':              'Technologies de l\'information',
  'logiciel':                  'Technologies de l\'information',
  'web':                       'Technologies de l\'information',
  'données':                   'Technologies de l\'information',
  'donnees':                   'Technologies de l\'information',
  'réseau':                    'Technologies de l\'information',
  'cybersécurité':             'Technologies de l\'information',
  'cloud':                     'Technologies de l\'information',
  'devops':                    'Technologies de l\'information',
  'intelligence artificielle': 'Technologies de l\'information',
  'technologie':               'Technologies de l\'information',
  'infirmier':                 'Santé',
  'infirmière':                'Santé',
  'médecin':                   'Santé',
  'medecin':                   'Santé',
  'pharmacien':                'Santé',
  'dentiste':                  'Santé',
  'physiothérapeute':          'Santé',
  'ergothérapeute':            'Santé',
  'paramédic':                 'Santé',
  'ambulancier':               'Santé',
  'santé':                     'Santé',
  'sante':                     'Santé',
  'soins':                     'Santé',
  'vétérinaire':               'Santé',
  'veterinaire':               'Santé',
  'électricien':               'Construction',
  'plombier':                  'Construction',
  'charpentier':               'Construction',
  'soudeur':                   'Construction',
  'mécanicien':                'Construction',
  'construction':              'Construction',
  'bâtiment':                  'Construction',
  'comptable':                 'Finance et affaires',
  'finance':                   'Finance et affaires',
  'banque':                    'Finance et affaires',
  'assurance':                 'Finance et affaires',
  'ressources humaines':       'Finance et affaires',
  'marketing':                 'Finance et affaires',
  'gestionnaire':              'Finance et affaires',
  'administration':            'Finance et affaires',
  'analyste':                  'Finance et affaires',
  'enseignant':                'Éducation',
  'professeur':                'Éducation',
  'éducateur':                 'Éducation',
  'pédagogie':                 'Éducation',
  'ingénieur':                 'Ingénierie',
  'ingenieur':                 'Ingénierie',
  'génie':                     'Ingénierie',
  'architecte':                'Ingénierie',
  'camionneur':                'Transport et logistique',
  'logistique':                'Transport et logistique',
  'transport':                 'Transport et logistique',
  'pilote':                    'Transport et logistique',
  'avocat':                    'Droit',
  'notaire':                   'Droit',
  'juriste':                   'Droit',
  'droit':                     'Droit',
}

export function detecterSecteur(texte: string): string {
  if (!texte) return 'Autre'
  const t = texte.toLowerCase()
  for (const [mot, secteur] of Object.entries(DOMAINE_SECTEUR)) {
    if (t.includes(mot)) return secteur
  }
  return 'Autre'
}

// ─────────────────────────────────────────────────
// MAPPING SKILLS → CODES COMPÉTENCES YELMA
// ─────────────────────────────────────────────────

const SKILL_CODES: Record<string, string[]> = {
  'leadership':    ['SOFT-004', 'SOFT-012'],
  'communication': ['SOFT-001', 'SOFT-002'],
  'équipe':        ['SOFT-003'],
  'organisation':  ['SOFT-005', 'SOFT-014'],
  'analyse':       ['SOFT-008', 'TRANS-002'],
  'résolution':    ['SOFT-006'],
  'créativité':    ['SOFT-013'],
  'empathie':      ['SOFT-009'],
  'autonomie':     ['SOFT-015'],
  'rigueur':       ['SOFT-019'],
  'négociation':   ['SOFT-011'],
  'initiative':    ['SOFT-020'],
  'python':        ['TECH-001'],
  'javascript':    ['TECH-002'],
  'react':         ['TECH-003'],
  'sql':           ['TECH-004'],
  'cloud':         ['TECH-005'],
  'sécurité':      ['TECH-006'],
  'données':       ['TECH-008'],
  'devops':        ['TECH-009'],
  'git':           ['TECH-016'],
  'agile':         ['TECH-020'],
  'soins':         ['SANTE-001', 'SANTE-002'],
  'pharmacologie': ['SANTE-003'],
  'urgence':       ['SANTE-004'],
  'électricité':   ['METIER-001'],
  'plomberie':     ['METIER-002'],
  'soudure':       ['METIER-003'],
  'projet':        ['TRANS-001'],
  'budget':        ['TRANS-008'],
  'anglais':       ['LANG-002'],
  'français':      ['LANG-001'],
  'bilinguisme':   ['LANG-003'],
}

export function extraireCodesCompetences(skills: string[]): string[] {
  const codes = new Set<string>()
  for (const skill of skills) {
    const s = skill.toLowerCase()
    for (const [mot, codesList] of Object.entries(SKILL_CODES)) {
      if (s.includes(mot)) codesList.forEach(c => codes.add(c))
    }
  }
  return Array.from(codes)
}

// ─────────────────────────────────────────────────
// DÉTECTER L'INTENTION
// ─────────────────────────────────────────────────

export function detecterIntention(
  objectif: string,
  statut: string
): 'evolution' | 'salaire' | 'reconversion' | 'premier_emploi' {
  if (!objectif) return 'evolution'
  const o = objectif.toLowerCase()
  const s = statut.toLowerCase()

  if (o.includes('salaire') || o.includes('gagner') || o.includes('150') || o.includes('100 000')) return 'salaire'
  if (o.includes('changer') || o.includes('reconversion') || s.includes('reconversion')) return 'reconversion'
  if (s.includes('étudiant') || o.includes('premier emploi')) return 'premier_emploi'
  return 'evolution'
}

// ─────────────────────────────────────────────────
// DÉTECTER LE NIVEAU CIBLE
// ─────────────────────────────────────────────────

export function getNiveauCible(
  titre_cible: string,
  intention: string,
  niveau_actuel: number
): number {
  if (!titre_cible) return Math.min(5, niveau_actuel + 2)
  const t = titre_cible.toLowerCase()

  if (t.includes('directeur') || t.includes('vp') || t.includes('vice-président') ||
      t.includes('pdg') || t.includes('ceo') || t.includes('président')) return 5

  if (t.includes('senior') || t.includes('gestionnaire') || t.includes('manager') ||
      t.includes('chef') || t.includes('responsable') || t.includes('lead') ||
      t.includes('praticien') || t.includes('spécialiste')) return 4

  if (t.includes('confirmé') || t.includes('intermédiaire') || t.includes('associé')) return 3

  if (intention === 'reconversion') return 2

  return Math.min(5, niveau_actuel + 2)
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE — normaliserProfil()
// ─────────────────────────────────────────────────

export function normaliserProfil(
  formulaire: DonneesFormulaire,
  extractionGPT?: Partial<ExtractionGPT>
): ProfilNormalise {

  const { niveau: niveau_actuel, annees: annees_experience } =
    getNiveauExperience(formulaire.annee_experience || '')

  const diplome_niveau = getNiveauDiplome(formulaire.diplome || '')

  const domaine_actuel = formulaire.domaine_actuel ||
    detecterSecteur(formulaire.role_actuel || '')

  const intention = detecterIntention(
    formulaire.objectif_declare || '',
    formulaire.statut_emploi || ''
  )

  const titre_cible = extractionGPT?.titre_cible ||
    formulaire.objectif_declare || ''

  const domaine_cible = extractionGPT?.domaine_cible ||
    detecterSecteur(titre_cible) ||
    domaine_actuel

  const niveau_cible = getNiveauCible(titre_cible, intention, niveau_actuel)

  const est_reconversion =
    intention === 'reconversion' ||
    (domaine_actuel !== domaine_cible && domaine_cible !== 'Autre' && domaine_actuel !== 'Autre')

  const allSkills = [
    ...(extractionGPT?.soft_skills || []),
    ...(extractionGPT?.hard_skills || []),
  ]
  const competences_codes = extraireCodesCompetences(allSkills)

  const est_ordre_professionnel =
    formulaire.ordre_professionnel_statut === 'membre_actif' ||
    formulaire.ordre_professionnel_statut === 'en_cours'

  return {
    prenom:                  formulaire.prenom || '',
    role_actuel:             formulaire.role_actuel || '',
    objectif_declare:        formulaire.objectif_declare || '',
    titre_cible,
    domaine_actuel,
    domaine_cible,
    ville:                   formulaire.ville || 'Montréal',
    intention,
    niveau_actuel,
    niveau_cible,
    diplome_niveau,
    annees_experience,
    est_reconversion,
    est_ordre_professionnel,
    nom_ordre:               formulaire.ordre_professionnel_nom || '',
    soft_skills:             extractionGPT?.soft_skills || [],
    hard_skills:             extractionGPT?.hard_skills || [],
    competences_codes,
    salaire_vise:            extractionGPT?.salaire_vise || null,
  }
}

// ─────────────────────────────────────────────────
// COMPATIBILITÉ — normaliserSignaux()
// Utilisé par l'ancien code — redirige vers normaliserProfil
// ─────────────────────────────────────────────────

export function normaliserSignaux(bruts: SignauxBruts): SignauxNormalises {
  const { niveau: niveau_actuel, annees: annees_experience } =
    getNiveauExperience('')

  const intention = detecterIntention(bruts.objectif_declare, '')
  const niveau_cible = getNiveauCible(bruts.objectif_declare, intention, niveau_actuel)
  const domaine_actuel = detecterSecteur(bruts.role_actuel + ' ' + bruts.domaine_actuel)
  const domaine_cible = detecterSecteur(bruts.objectif_declare)
  const est_reconversion = domaine_actuel !== domaine_cible && domaine_cible !== 'Autre'

  // Niveau depuis les années d'expérience réelles
  const niveauDepuisAnnees =
    bruts.annees_experience <= 0 ? 1 :
    bruts.annees_experience <= 2 ? 2 :
    bruts.annees_experience <= 5 ? 3 :
    bruts.annees_experience <= 10 ? 4 : 5

  return {
    competences_detectees: extraireCodesCompetences([
      ...bruts.signaux_comportementaux,
      ...bruts.actions_mentionnees,
    ]),
    domaine_code:          domaine_actuel,
    niveau_actuel:         niveauDepuisAnnees,
    niveau_cible,
    score_qualite:         Math.round(((bruts.niveau_detail + bruts.structure_logique) / 10) * 100),
    role_actuel_normalise: bruts.role_actuel.trim(),
    objectif_normalise:    bruts.objectif_declare.trim(),
    diplome_niveau:        getNiveauDiplome(bruts.diplome),
    annees_experience:     bruts.annees_experience,
    est_reconversion,
  }
}