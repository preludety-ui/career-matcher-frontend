// ============================================================
// YELMA — lib/extracteur.ts
// Rôle : Nettoyer et structurer les signaux bruts extraits par GPT
// GPT extrait → ce fichier normalise → matching.ts score
// ============================================================

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface SignauxBruts {
  signaux_comportementaux: string[]   // ex: ["leadership", "analyse", "communication"]
  actions_mentionnees: string[]       // ex: ["géré équipe 12", "réduit coûts 35%"]
  domaine_actuel: string              // ex: "Technologies de l'information"
  role_actuel: string                 // ex: "Développeur web junior"
  objectif_declare: string            // ex: "Architecte de solutions"
  diplome: string                     // ex: "DEC informatique", "Bac génie", "Secondaire 5"
  annees_experience: number           // ex: 3
  niveau_detail: number               // 1-5 (qualité des réponses)
  structure_logique: number           // 1-5 (cohérence du discours)
}

export interface SignauxNormalises {
  competences_detectees: string[]     // codes YELMA ex: ["TECH-002", "SOFT-004"]
  domaine_code: string                // ex: "TI", "SANTE", "CONSTRUCTION"
  niveau_actuel: number               // 1-5 (débutant → expert)
  niveau_cible: number                // 1-5
  score_qualite: number               // 0-100 (qualité globale de l'entretien)
  role_actuel_normalise: string       // rôle nettoyé
  objectif_normalise: string          // objectif nettoyé
  diplome_niveau: number              // 1=secondaire, 2=DEP, 3=DEC, 4=BAC, 5=MAITRISE+
  annees_experience: number
  est_reconversion: boolean           // domaine actuel ≠ domaine cible
}

// ─────────────────────────────────────────────────
// MAPPING SIGNAUX → CODES COMPÉTENCES YELMA
// ─────────────────────────────────────────────────

const MAPPING_SIGNAUX: Record<string, string[]> = {
  // Soft skills
  leadership:         ['SOFT-004', 'SOFT-012'],
  communication:      ['SOFT-001', 'SOFT-002'],
  équipe:             ['SOFT-003', 'SOFT-023'],
  organisation:       ['SOFT-005', 'SOFT-014'],
  analyse:            ['SOFT-008', 'TRANS-002'],
  résolution:         ['SOFT-006'],
  créativité:         ['SOFT-013'],
  empathie:           ['SOFT-009', 'SOFT-022'],
  autonomie:          ['SOFT-015'],
  rigueur:            ['SOFT-019'],
  négociation:        ['SOFT-011'],
  initiative:         ['SOFT-020'],
  stress:             ['SOFT-010'],
  écoute:             ['SOFT-016'],
  conflit:            ['SOFT-017'],
  client:             ['SOFT-018', 'TRANS-009'],
  responsabilité:     ['SOFT-025'],
  persévérance:       ['SOFT-024'],

  // Hard TI
  programmation:      ['TECH-001', 'TECH-002'],
  javascript:         ['TECH-002'],
  python:             ['TECH-001'],
  react:              ['TECH-003'],
  'next.js':          ['TECH-003'],
  données:            ['TECH-008', 'TECH-019'],
  'base de données':  ['TECH-004', 'TECH-014'],
  sql:                ['TECH-004'],
  cloud:              ['TECH-005'],
  sécurité:           ['TECH-006', 'TECH-018'],
  ia:                 ['TECH-007'],
  'machine learning': ['TECH-007'],
  devops:             ['TECH-009'],
  réseau:             ['TECH-011'],
  git:                ['TECH-016'],
  api:                ['TECH-015'],
  agile:              ['TECH-020'],
  scrum:              ['TECH-020'],

  // Hard Santé
  soins:              ['SANTE-001', 'SANTE-002'],
  médical:            ['SANTE-002', 'SANTE-009'],
  pharmacie:          ['SANTE-003'],
  urgence:            ['SANTE-004', 'SANTE-011'],
  réadaptation:       ['SANTE-007', 'SANTE-014'],
  laboratoire:        ['SANTE-006'],

  // Hard Métiers techniques
  électricité:        ['METIER-001'],
  plomberie:          ['METIER-002'],
  soudure:            ['METIER-003'],
  charpenterie:       ['METIER-004'],
  mécanique:          ['METIER-005', 'METIER-006'],
  construction:       ['METIER-004', 'METIER-015'],
  plans:              ['METIER-008'],
  sécurité_chantier:  ['METIER-012'],

  // Transversales
  projet:             ['TRANS-001'],
  rapport:            ['TRANS-003'],
  budget:             ['TRANS-008'],
  formation:          ['TRANS-010'],
  conformité:         ['TRANS-011'],
  éthique:            ['TRANS-007'],
  bilinguisme:        ['LANG-003'],
  anglais:            ['LANG-002'],
  français:           ['LANG-001'],
}

// ─────────────────────────────────────────────────
// MAPPING DOMAINES
// ─────────────────────────────────────────────────

const MAPPING_DOMAINES: Record<string, string> = {
  // TI
  'développeur':              'TI',
  'programmeur':              'TI',
  'informatique':             'TI',
  'logiciel':                 'TI',
  'web':                      'TI',
  'données':                  'TI',
  'réseau':                   'TI',
  'cybersécurité':            'TI',
  'cloud':                    'TI',
  'devops':                   'TI',
  'ia':                       'TI',
  'intelligence artificielle':'TI',

  // Santé
  'infirmier':                'SANTE',
  'infirmière':               'SANTE',
  'médecin':                  'SANTE',
  'pharmacien':               'SANTE',
  'dentiste':                 'SANTE',
  'physiothérapeute':         'SANTE',
  'ergothérapeute':           'SANTE',
  'paramédic':                'SANTE',
  'ambulancier':              'SANTE',
  'soins':                    'SANTE',
  'santé':                    'SANTE',

  // Construction
  'électricien':              'CONSTRUCTION',
  'plombier':                 'CONSTRUCTION',
  'charpentier':              'CONSTRUCTION',
  'soudeur':                  'CONSTRUCTION',
  'mécanicien':               'CONSTRUCTION',
  'construction':             'CONSTRUCTION',
  'chantier':                 'CONSTRUCTION',
  'bâtiment':                 'CONSTRUCTION',

  // Finance
  'comptable':                'FINANCE',
  'analyste financier':       'FINANCE',
  'finance':                  'FINANCE',
  'banque':                   'FINANCE',
  'assurance':                'FINANCE',
  'ressources humaines':      'FINANCE',
  'rh':                       'FINANCE',
  'marketing':                'FINANCE',

  // Éducation
  'enseignant':               'EDUCATION',
  'professeur':               'EDUCATION',
  'éducateur':                'EDUCATION',
  'pédagogie':                'EDUCATION',
  'école':                    'EDUCATION',

  // Ingénierie
  'ingénieur':                'INGENIERIE',
  'ingénieure':               'INGENIERIE',
  'génie':                    'INGENIERIE',
  'architecte':               'INGENIERIE',

  // Transport
  'camionneur':               'TRANSPORT',
  'chauffeur':                'TRANSPORT',
  'logistique':               'TRANSPORT',
  'transport':                'TRANSPORT',
  'pilote':                   'TRANSPORT',
}

// ─────────────────────────────────────────────────
// MAPPING DIPLÔMES
// ─────────────────────────────────────────────────

const MAPPING_DIPLOMES: Record<string, number> = {
  'secondaire':       1,
  'sec 5':            1,
  'dep':              2,
  'aep':              2,
  'asp':              2,
  'dec':              3,
  'attestation':      3,
  'bac':              4,
  'bachelor':         4,
  'licence':          4,
  'maîtrise':         5,
  'master':           5,
  'mba':              5,
  'doctorat':         5,
  'phd':              5,
}

// ─────────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────────

/**
 * Détecte le domaine à partir d'un texte libre
 */
export function detecterDomaine(texte: string): string {
  const texteLower = texte.toLowerCase()
  for (const [mot, domaine] of Object.entries(MAPPING_DOMAINES)) {
    if (texteLower.includes(mot)) return domaine
  }
  return 'AUTRE'
}

/**
 * Détecte le niveau (1-5) selon l'expérience et le rôle
 */
export function detecterNiveau(role: string, annees: number): number {
  const roleLower = role.toLowerCase()

  // Détection par mots-clés dans le titre
  if (roleLower.includes('stagiaire') || roleLower.includes('apprenti')) return 1
  if (roleLower.includes('junior') || annees <= 2) return 2
  if (roleLower.includes('intermédiaire') || (annees >= 3 && annees <= 5)) return 3
  if (roleLower.includes('senior') || (annees >= 6 && annees <= 10)) return 4
  if (roleLower.includes('expert') || roleLower.includes('directeur') ||
      roleLower.includes('architecte') || roleLower.includes('chef') || annees > 10) return 5

  // Par défaut selon années
  if (annees <= 1) return 1
  if (annees <= 3) return 2
  if (annees <= 6) return 3
  if (annees <= 10) return 4
  return 5
}

/**
 * Détecte le niveau de diplôme (1-5)
 */
export function detecterNiveauDiplome(diplome: string): number {
  const diplomeLower = diplome.toLowerCase()
  for (const [mot, niveau] of Object.entries(MAPPING_DIPLOMES)) {
    if (diplomeLower.includes(mot)) return niveau
  }
  return 2 // Par défaut : DEP / formation technique
}

/**
 * Extrait les codes de compétences YELMA depuis les signaux bruts GPT
 */
export function extraireCompetences(signaux: string[], actions: string[]): string[] {
  const competencesSet = new Set<string>()
  const tousLesTextes = [...signaux, ...actions].map(s => s.toLowerCase())

  for (const texte of tousLesTextes) {
    for (const [motCle, codes] of Object.entries(MAPPING_SIGNAUX)) {
      if (texte.includes(motCle)) {
        codes.forEach(code => competencesSet.add(code))
      }
    }
  }

  return Array.from(competencesSet)
}

/**
 * Calcule un score de qualité de l'entretien (0-100)
 */
export function calculerScoreQualite(niveauDetail: number, structureLogique: number): number {
  return Math.round(((niveauDetail + structureLogique) / 10) * 100)
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────

/**
 * Normalise les signaux bruts GPT en données structurées
 * pour le moteur de matching
 */
export function normaliserSignaux(bruts: SignauxBruts): SignauxNormalises {
  const domaine_actuel = detecterDomaine(bruts.role_actuel + ' ' + bruts.domaine_actuel)
  const domaine_cible  = detecterDomaine(bruts.objectif_declare)

  const niveau_actuel = detecterNiveau(bruts.role_actuel, bruts.annees_experience)
  const niveau_cible  = detecterNiveau(bruts.objectif_declare, 0)

  const competences_detectees = extraireCompetences(
    bruts.signaux_comportementaux,
    bruts.actions_mentionnees
  )

  return {
    competences_detectees,
    domaine_code:           domaine_actuel,
    niveau_actuel,
    niveau_cible,
    score_qualite:          calculerScoreQualite(bruts.niveau_detail, bruts.structure_logique),
    role_actuel_normalise:  bruts.role_actuel.trim(),
    objectif_normalise:     bruts.objectif_declare.trim(),
    diplome_niveau:         detecterNiveauDiplome(bruts.diplome),
    annees_experience:      bruts.annees_experience,
    est_reconversion:       domaine_actuel !== domaine_cible && domaine_cible !== 'AUTRE',
  }
}