// ============================================================
// YELMA — scripts/yelma-gps-setup.ts
// Rôle : Auto-setup GPS pour nouveaux profils
// Usage : npx ts-node scripts/yelma-gps-setup.ts
// ============================================================
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface ProfilTest {
  nom: string
  role_actuel: string
  objectif: string
  secteur: string
  code_cnp_source?: string
  code_cnp_cible?: string
  type_evolution: 'progression' | 'nomination' | 'specialisation' | 'reconversion' | 'enseignement'
  annees_min: number
  annees_max: number
  diplome_requis?: string
  ordre_requis?: boolean
  nom_ordre?: string
}

// ─────────────────────────────────────────────────
// PROFILS À CONFIGURER
// Ajoute ici tes nouveaux profils
// ─────────────────────────────────────────────────

const PROFILS: ProfilTest[] = [
  // SANTÉ
  {
    nom: 'Infirmière junior',
    role_actuel: 'Infirmière',
    objectif: 'Infirmière praticienne spécialisée',
    secteur: 'Santé',
    code_cnp_source: '31301',
    code_cnp_cible: '31302',
    type_evolution: 'progression',
    annees_min: 3,
    annees_max: 6,
    diplome_requis: 'Maîtrise en sciences infirmières',
    ordre_requis: true,
    nom_ordre: 'OIIQ',
  },
  {
    nom: 'Infirmière senior',
    role_actuel: 'Infirmière senior',
    objectif: 'Gestionnaire des soins infirmiers',
    secteur: 'Santé',
    code_cnp_source: '31301',
    code_cnp_cible: '30010',
    type_evolution: 'nomination',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'BAC + formation gestion des soins',
    ordre_requis: true,
    nom_ordre: 'OIIQ',
  },
  {
    nom: 'Médecin généraliste',
    role_actuel: 'Médecin',
    objectif: 'Médecin spécialiste',
    secteur: 'Santé',
    code_cnp_source: '31102',
    code_cnp_cible: '31100',
    type_evolution: 'specialisation',
    annees_min: 3,
    annees_max: 8,
    diplome_requis: 'Doctorat médecine + résidence spécialisée',
    ordre_requis: true,
    nom_ordre: 'CMQ',
  },
  {
    nom: 'Pharmacienne',
    role_actuel: 'Pharmacienne',
    objectif: 'Directrice de pharmacie',
    secteur: 'Santé',
    code_cnp_source: '31120',
    code_cnp_cible: '31121',
    type_evolution: 'nomination',
    annees_min: 6,
    annees_max: 12,
    diplome_requis: 'Doctorat pharmacie + formation gestion',
    ordre_requis: true,
    nom_ordre: 'OPQ',
  },
  {
    nom: 'Vétérinaire',
    role_actuel: 'Vétérinaire',
    objectif: 'Propriétaire clinique vétérinaire',
    secteur: 'Santé',
    code_cnp_source: '31103',
    code_cnp_cible: '31104',
    type_evolution: 'nomination',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'Doctorat médecine vétérinaire + gestion',
    ordre_requis: true,
    nom_ordre: 'OMVQ',
  },

  // DROIT
  {
    nom: 'Avocat junior',
    role_actuel: 'Avocat',
    objectif: 'Associé cabinet juridique',
    secteur: 'Droit',
    code_cnp_source: '41101',
    code_cnp_cible: '41102',
    type_evolution: 'nomination',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'BAC droit + expérience cabinet',
    ordre_requis: true,
    nom_ordre: 'Barreau du Québec',
  },

  // FINANCE
  {
    nom: 'CPA senior',
    role_actuel: 'CPA senior',
    objectif: 'Directeur financier',
    secteur: 'Finance et affaires',
    code_cnp_source: '11100',
    code_cnp_cible: '10010',
    type_evolution: 'nomination',
    annees_min: 6,
    annees_max: 12,
    diplome_requis: 'CPA + MBA ou finance corporative',
    ordre_requis: true,
    nom_ordre: 'CPA Québec',
  },
  {
    nom: 'Analyste financier junior',
    role_actuel: 'Analyste financier junior',
    objectif: 'Contrôleur financier',
    secteur: 'Finance et affaires',
    code_cnp_source: '11101',
    code_cnp_cible: '11104',
    type_evolution: 'nomination',
    annees_min: 3,
    annees_max: 6,
    diplome_requis: 'CPA ou CFA + expérience analyse financière',
    ordre_requis: false,
  },
  {
    nom: 'Coordinatrice marketing',
    role_actuel: 'Coordinatrice marketing',
    objectif: 'Directrice marketing',
    secteur: 'Finance et affaires',
    code_cnp_source: '11206',
    code_cnp_cible: '10022',
    type_evolution: 'nomination',
    annees_min: 4,
    annees_max: 8,
    diplome_requis: 'BAC marketing + MBA',
    ordre_requis: false,
  },
  {
    nom: 'Directrice RH',
    role_actuel: 'Directrice RH',
    objectif: 'VP Ressources humaines',
    secteur: 'Finance et affaires',
    code_cnp_source: '10011B',
    code_cnp_cible: '10019',
    type_evolution: 'nomination',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'BAC RH + MBA + expérience direction',
    ordre_requis: false,
  },
  {
    nom: 'Chargé de projet',
    role_actuel: 'Chargé de projet',
    objectif: 'Directeur de projet',
    secteur: 'Finance et affaires',
    code_cnp_source: '11200',
    code_cnp_cible: '10020',
    type_evolution: 'nomination',
    annees_min: 3,
    annees_max: 6,
    diplome_requis: 'BAC + PMP ou expérience gestion',
    ordre_requis: false,
  },

  // TI
  {
    nom: 'Développeur senior',
    role_actuel: 'Développeur senior',
    objectif: 'Directeur technique',
    secteur: 'Technologies de l\'information',
    code_cnp_source: '21232',
    code_cnp_cible: '20012',
    type_evolution: 'nomination',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'BAC informatique + leadership technique',
    ordre_requis: false,
  },
  {
    nom: 'Autodidacte développeur web',
    role_actuel: 'Développeur web',
    objectif: 'Lead développeur',
    secteur: 'Technologies de l\'information',
    code_cnp_source: '21234',
    code_cnp_cible: '21234L',
    type_evolution: 'progression',
    annees_min: 3,
    annees_max: 6,
    diplome_requis: 'Expérience confirmée + leadership technique',
    ordre_requis: false,
  },

  // INGÉNIERIE
  {
    nom: 'Architecte intermédiaire',
    role_actuel: 'Architecte',
    objectif: 'Associé en architecture',
    secteur: 'Ingénierie',
    code_cnp_source: '21200',
    code_cnp_cible: '21200A',
    type_evolution: 'nomination',
    annees_min: 3,
    annees_max: 5,
    diplome_requis: 'BAC ou Maîtrise architecture + OAQ',
    ordre_requis: true,
    nom_ordre: 'OAQ',
  },

  // ÉDUCATION
  {
    nom: 'Enseignante primaire',
    role_actuel: 'Enseignante primaire',
    objectif: 'Directrice d\'école',
    secteur: 'Éducation',
    code_cnp_source: '41221',
    code_cnp_cible: '40021',
    type_evolution: 'nomination',
    annees_min: 6,
    annees_max: 12,
    diplome_requis: 'BAC + formation administration scolaire',
    ordre_requis: true,
    nom_ordre: 'MEQ',
  },
  {
    nom: 'Enseignant secondaire → Dev',
    role_actuel: 'Enseignant secondaire',
    objectif: 'Développeur web',
    secteur: 'Éducation',
    code_cnp_source: '41220',
    code_cnp_cible: '21234',
    type_evolution: 'reconversion',
    annees_min: 2,
    annees_max: 4,
    diplome_requis: 'Bootcamp développement web ou BAC informatique',
    ordre_requis: false,
  },

  // TRANSPORT
  {
    nom: 'Pilote commercial',
    role_actuel: 'Pilote',
    objectif: 'Commandant de bord',
    secteur: 'Transport et logistique',
    code_cnp_source: '73400',
    code_cnp_cible: '73401',
    type_evolution: 'progression',
    annees_min: 5,
    annees_max: 10,
    diplome_requis: 'Licence commandant de bord + 5000h vol',
    ordre_requis: true,
    nom_ordre: 'Transport Canada',
  },
]

// ─────────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────────

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

async function trouverMetier(codeCnp: string) {
  const { data } = await supabase
    .from('metiers')
    .select('id, titre_fr, code_cnp, secteur, alias')
    .eq('code_cnp', codeCnp)
    .single()
  return data
}

async function trouverEvolution(idSource: string, idCible: string) {
  const { data } = await supabase
    .from('metier_evolution')
    .select('id, type_evolution')
    .eq('metier_id_source', idSource)
    .eq('metier_id_cible', idCible)
    .single()
  return data
}

async function creerMetier(titre: string, codeCnp: string, secteur: string, alias: string[]) {
  const { data, error } = await supabase
    .from('metiers')
    .insert({
      titre_fr: titre,
      code_cnp: codeCnp,
      secteur,
      niveau_formation: 'A',
      est_reglemente: false,
      actif: true,
      alias,
    })
    .select()
    .single()

  if (error) {
    console.error(`❌ Erreur création métier ${titre}:`, error.message)
    return null
  }
  console.log(`✅ Métier créé: ${titre} (${codeCnp})`)
  return data
}

async function creerEvolution(
  idSource: string,
  idCible: string,
  profil: ProfilTest
) {
  const { error } = await supabase
    .from('metier_evolution')
    .insert({
      metier_id_source: idSource,
      metier_id_cible: idCible,
      type_evolution: profil.type_evolution,
      annees_min: profil.annees_min,
      annees_max: profil.annees_max,
      diplome_requis: profil.diplome_requis || '',
      experience_min: 0,
      ordre_requis: profil.ordre_requis || false,
      nom_ordre: profil.nom_ordre || '',
      description: `${profil.role_actuel} → ${profil.objectif}`,
      actif: true,
    })

  if (error) {
    if (error.code === '23505') {
      console.log(`ℹ️  Évolution déjà existante: ${profil.role_actuel} → ${profil.objectif}`)
    } else {
      console.error(`❌ Erreur création évolution:`, error.message)
    }
    return false
  }
  console.log(`✅ Évolution créée: ${profil.role_actuel} → ${profil.objectif}`)
  return true
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────

async function setupGPS() {
  console.log('\n🚀 YELMA GPS Auto-Setup\n')
  console.log('='.repeat(50))

  let totalCreés = 0
  let totalExistants = 0
  let totalErreurs = 0

  for (const profil of PROFILS) {
    console.log(`\n📋 Profil: ${profil.nom}`)
    console.log(`   ${profil.role_actuel} → ${profil.objectif}`)

    // 1. Vérifier métier source
    let source = profil.code_cnp_source
      ? await trouverMetier(profil.code_cnp_source)
      : null

    if (!source) {
      console.log(`   ⚠️  Métier source introuvable: ${profil.role_actuel} (${profil.code_cnp_source})`)
      console.log(`   → Création automatique...`)
      source = await creerMetier(
        profil.role_actuel,
        profil.code_cnp_source!,
        profil.secteur,
        [profil.role_actuel]
      )
      if (source) totalCreés++
      else { totalErreurs++; continue }
    } else {
      console.log(`   ✅ Source trouvée: ${source.titre_fr}`)
      totalExistants++
    }

    // 2. Vérifier métier cible
    let cible = profil.code_cnp_cible
      ? await trouverMetier(profil.code_cnp_cible)
      : null

    if (!cible) {
      console.log(`   ⚠️  Métier cible introuvable: ${profil.objectif} (${profil.code_cnp_cible})`)
      console.log(`   → Création automatique...`)
      cible = await creerMetier(
        profil.objectif,
        profil.code_cnp_cible!,
        profil.secteur,
        [profil.objectif]
      )
      if (cible) totalCreés++
      else { totalErreurs++; continue }
    } else {
      console.log(`   ✅ Cible trouvée: ${cible.titre_fr}`)
      totalExistants++
    }

    // 3. Vérifier évolution
    const evolution = await trouverEvolution(source.id, cible.id)

    if (!evolution) {
      console.log(`   ⚠️  Évolution manquante`)
      console.log(`   → Création automatique...`)
      const créée = await creerEvolution(source.id, cible.id, profil)
      if (créée) totalCreés++
      else totalErreurs++
    } else {
      console.log(`   ✅ Évolution trouvée: ${evolution.type_evolution}`)
      totalExistants++
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ')
  console.log(`   ✅ Éléments existants: ${totalExistants}`)
  console.log(`   🆕 Éléments créés: ${totalCreés}`)
  console.log(`   ❌ Erreurs: ${totalErreurs}`)
  console.log('\n✨ Setup terminé!\n')
}

// Lancer le script
setupGPS().catch(console.error)