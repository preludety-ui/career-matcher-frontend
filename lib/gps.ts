// ============================================================
// YELMA — lib/gps.ts
// Rôle : Construire le GPS de carrière sur 5 ans
//        avec salaires réels CNP par ancienneté (Low/Median/High)
// Mon code calcule — GPT reformule seulement
// ============================================================

import { supabaseAdmin } from './supabase'
import { SignauxNormalises } from './extracteur'
import { MetierScore } from './matching'

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface EtapeGPS {
    annee: number
    titre: string
    code_cnp: string
    salaire_min: number
    salaire_max: number
    actions: string[]
    est_objectif: boolean
}

export interface GPSDeterm {
    etapes: EtapeGPS[]
    objectif_atteignable: boolean
    annees_necessaires: number
    message_gps: string
    salaire_actuel: number
    salaire_cible: number
}

// ─────────────────────────────────────────────────
// SALAIRES PAR ANCIENNETÉ
// ─────────────────────────────────────────────────

interface SalairesMetier {
    salaire_low: number
    salaire_median: number
    salaire_high: number
}

function getSalaireParAnnee(
    salaires: SalairesMetier,
    annee: number
): { salaire_min: number; salaire_max: number } {
    if (annee <= 2) {
        return {
            salaire_min: Math.round(salaires.salaire_low * 0.95),
            salaire_max: Math.round(salaires.salaire_low * 1.05),
        }
    }
    if (annee === 3) {
        return {
            salaire_min: Math.round(salaires.salaire_median * 0.95),
            salaire_max: Math.round(salaires.salaire_median * 1.05),
        }
    }
    return {
        salaire_min: Math.round(salaires.salaire_high * 0.92),
        salaire_max: Math.round(salaires.salaire_high * 1.08),
    }
}

// ─────────────────────────────────────────────────
// ACTIONS PAR ÉTAPE ET SECTEUR
// ─────────────────────────────────────────────────

function genererActions(annee: number, secteur: string, est_objectif: boolean): string[] {
    const s = secteur.toUpperCase()
        .replace('TECHNOLOGIES DE L\'INFORMATION', 'TI')
        .replace('SANTÉ', 'SANTE')
        .replace('INGÉNIERIE', 'INGENIERIE')
        .replace('FINANCE ET AFFAIRES', 'FINANCE')
        .replace('ÉDUCATION', 'EDUCATION')

    const map: Record<string, Record<number, string[]>> = {
        TI: {
            1: ['Construire un portfolio GitHub solide', 'Obtenir certification cloud (AWS/Google)', 'Contribuer à des projets open source'],
            2: ['Prendre en charge des projets en autonomie', 'Obtenir certification avancée', 'Mentorer des juniors'],
            3: ['Diriger une équipe technique', 'Définir l\'architecture de projets', 'Publier des articles techniques'],
            4: ['Influencer la stratégie technique', 'Parler dans des conférences tech', 'Bâtir une réputation d\'expert'],
            5: ['Définir la vision technologique', 'Recruter et développer les talents', 'Contribuer à l\'open source senior'],
        },
        SANTE: {
            1: ['Compléter les stages cliniques', 'Obtenir certifications obligatoires (RCR)', 'Rejoindre l\'ordre professionnel'],
            2: ['Accumuler expérience clinique variée', 'Suivre formations continues obligatoires', 'Développer une spécialisation'],
            3: ['Superviser des stagiaires', 'Obtenir une spécialisation reconnue', 'Prendre en charge des cas complexes'],
            4: ['Assumer rôle de coordination', 'Former les nouvelles recrues', 'Participer à des comités professionnels'],
            5: ['Diriger une équipe clinique', 'Contribuer à la recherche', 'Influencer les pratiques professionnelles'],
        },
        CONSTRUCTION: {
            1: ['Compléter l\'apprentissage du métier', 'Obtenir certifications SST obligatoires', 'Accumuler heures pour certificat de compétence'],
            2: ['Obtenir certificat de compétence compagnon', 'Élargir les techniques maîtrisées', 'Travailler sur des chantiers variés'],
            3: ['Superviser des apprentis', 'Obtenir certifications spécialisées', 'Gérer des sections de chantier'],
            4: ['Devenir contremaître', 'Gérer équipes et sous-traitants', 'Obtenir la licence d\'entrepreneur'],
            5: ['Diriger des projets majeurs', 'Ouvrir sa propre entreprise', 'Former la prochaine génération'],
        },
        FINANCE: {
            1: ['Obtenir titre CPA ou CFA', 'Maîtriser Excel et outils financiers', 'Développer le réseau professionnel'],
            2: ['Obtenir certifications reconnues', 'Gérer dossiers clients en autonomie', 'Rejoindre associations professionnelles'],
            3: ['Développer clientèle ou portefeuille', 'Prendre en charge mandats complexes', 'Obtenir titres avancés'],
            4: ['Diriger une équipe d\'analystes', 'Gérer un portefeuille important', 'Devenir associé senior'],
            5: ['Occuper poste de direction', 'Siéger sur conseils d\'administration', 'Développer expertise reconnue'],
        },
        INGENIERIE: {
            1: ['Obtenir titre ingénieur junior (ing. jr.)', 'Accumuler heures supervisées requises', 'Maîtriser AutoCAD, Revit ou logiciels du domaine'],
            2: ['Obtenir titre ingénieur (ing.)', 'Piloter des projets en autonomie', 'Obtenir certifications PMP ou LEED'],
            3: ['Diriger des projets d\'envergure', 'Superviser ingénieurs juniors', 'Développer expertise pointue'],
            4: ['Occuper rôle de chargé de projet senior', 'Développer partenariats clients', 'Contribuer à projets innovants'],
            5: ['Devenir directeur technique', 'Influencer les normes du secteur', 'Bâtir réputation d\'expert reconnu'],
        },
        EDUCATION: {
            1: ['Obtenir le brevet d\'enseignement', 'Rejoindre syndicat d\'enseignants', 'Développer outils pédagogiques'],
            2: ['Obtenir un poste permanent', 'Suivre formations pédagogiques continues', 'Développer approches innovantes'],
            3: ['Prendre en charge des classes difficiles', 'Devenir mentor pour nouveaux enseignants', 'Participer à des comités pédagogiques'],
            4: ['Occuper rôle de direction adjointe', 'Développer des programmes', 'Former nouveaux enseignants'],
            5: ['Devenir directeur d\'école ou conseiller pédagogique senior', 'Influencer politiques éducatives', 'Publier des recherches pédagogiques'],
        },
    }

    const defaut: Record<number, string[]> = {
        1: ['Compléter la formation requise', 'Obtenir les certifications de base', 'Bâtir un réseau professionnel'],
        2: ['Accumuler de l\'expérience pratique', 'Obtenir certifications reconnues', 'Développer compétences spécialisées'],
        3: ['Prendre des responsabilités élargies', 'Superviser des collègues juniors', 'Développer expertise reconnue'],
        4: ['Occuper un rôle de leadership', 'Gérer des projets complexes', 'Contribuer à la stratégie organisationnelle'],
        5: ['Occuper un poste de direction', 'Influencer les pratiques du secteur', 'Bâtir une réputation d\'expert'],
    }

    const actions = map[s]?.[annee] ?? defaut[annee]
    return est_objectif ? [...actions, '🎯 Objectif atteint — continuer à se développer'] : actions
}

// ─────────────────────────────────────────────────
// CHERCHER SALAIRES RÉELS DANS SUPABASE
// ─────────────────────────────────────────────────

async function chercherSalaires(
    code_cnp: string,
    province: string = 'QC'
): Promise<SalairesMetier> {
    const codeNettoye = code_cnp.replace(/\D/g, '')

    const { data } = await supabaseAdmin
        .from('salaires_cnp')
        .select('Low_Wage_Salaire_Minium, Median_Wage_Salaire_Median, High_Wage_Salaire_Maximal')
        .eq('prov', province)
        .ilike('NOC_CNP', `%${codeNettoye}%`)
        .not('Median_Wage_Salaire_Median', 'is', null)
        .limit(1)
        .single()

    if (data) {
        const low = Number(data.Low_Wage_Salaire_Minium) || 0
        const median = Number(data.Median_Wage_Salaire_Median) || 0
        const high = Number(data.High_Wage_Salaire_Maximal) || 0

        const isHoraire = median > 0 && median < 200
        const facteur = isHoraire ? 1950 : 1

        return {
            salaire_low: Math.round(low * facteur),
            salaire_median: Math.round(median * facteur),
            salaire_high: Math.round(high * facteur),
        }
    }

    return {
        salaire_low: 45000,
        salaire_median: 60000,
        salaire_high: 80000,
    }
}

// ─────────────────────────────────────────────────
// FONCTION PRINCIPALE — construireGPS()
// ─────────────────────────────────────────────────

export async function construireGPS(
    signaux: SignauxNormalises,
    top_metier: MetierScore
): Promise<GPSDeterm> {
    console.log('GPS CALLED avec:', signaux.role_actuel_normalise, signaux.objectif_normalise)
    // 1. Chercher le métier actuel dans Supabase
    const motCle = signaux.role_actuel_normalise.trim()
    const { data: metierActuelData } = await supabaseAdmin
        .from('metiers')
        .select('id, titre_fr, code_cnp, secteur')
        .or(`titre_fr.ilike.%${motCle}%,alias.cs.{"${motCle}"}`)
        .limit(1)
        .single()

    console.log('METIER ACTUEL:', metierActuelData)

    const metier_actuel = metierActuelData ?? {
        id: null as string | null,
        titre_fr: signaux.role_actuel_normalise,
        code_cnp: '00000',
        secteur: signaux.domaine_code,
    }


    // 2. Chercher le métier cible via metier_evolution (source de vérité)
    let metier_cible: { id: string | null; titre_fr: string; code_cnp: string; secteur: string } | null = null
    let type_evolution = 'progression'
    let annees_evolution_min = 2
    let annees_evolution_max = 5

    if (metier_actuel.id) {
        console.log('RECHERCHE EVOLUTIONS POUR ID:', metier_actuel.id)
        const { data: evolutions } = await supabaseAdmin
            .from('metier_evolution')
            .select(`
                type_evolution, annees_min, annees_max,
                diplome_requis, ordre_requis, nom_ordre,
                metier_cible:metier_id_cible (id, titre_fr, code_cnp, secteur)
            `)
            .eq('metier_id_source', metier_actuel.id)
            .order('annees_min', { ascending: true })
        const normalize = (s: string) =>
            s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        const objectif = normalize(signaux.objectif_normalise || '')
        console.log('EVOLUTIONS TROUVÉES:', evolutions?.length, evolutions?.map(e => (e.metier_cible as unknown as { titre_fr: string })?.titre_fr))

        const evolution = evolutions?.find(e => {
            const titreCible = (e.metier_cible as unknown as { titre_fr: string })?.titre_fr || ''
            const cible = normalize(titreCible)
            const motsObjectif = objectif.split(' ').filter(mot => mot.length > 3)
            const motsCible = cible.split(' ').filter(mot => mot.length > 3)
            const match = (
                cible.includes(objectif) || objectif.includes(cible) || motsObjectif.every(mot => cible.includes(mot)) || motsCible.every(mot => objectif.includes(mot))
            )
            console.log('MATCH CHECK:', cible, '|', objectif, '|', match)
            return match
        }) ?? evolutions?.find(e => e.type_evolution === 'progression')
            ?? evolutions?.[0]
            ?? null
        console.log('EVOLUTION SELECTIONNEE:', JSON.stringify(evolution))

        if (evolution?.metier_cible) {
            const cibleRaw = evolution.metier_cible as unknown as { id: string; titre_fr: string; code_cnp: string; secteur: string } | { id: string; titre_fr: string; code_cnp: string; secteur: string }[]
            const cibleData = Array.isArray(cibleRaw) ? cibleRaw[0] : cibleRaw
            metier_cible = cibleData
            type_evolution = evolution.type_evolution
            annees_evolution_min = evolution.annees_min
            annees_evolution_max = evolution.annees_max
            console.log('METIER CIBLE ASSIGNE:', metier_cible)
        }
    }

    // 3. Si pas trouvé dans metier_evolution → chercher dans metiers par secteur
    if (!metier_cible) {
        const { data: metierCibleData } = await supabaseAdmin
            .from('metiers')
            .select('id, titre_fr, code_cnp, secteur')
            .ilike('titre_fr', `%${signaux.objectif_normalise.split(' ')[0]}%`)
            .eq('secteur', metier_actuel.secteur)
            .limit(1)
            .single()

        metier_cible = metierCibleData ?? {
            id: null,
            titre_fr: top_metier.titre_fr,
            code_cnp: top_metier.code_cnp,
            secteur: top_metier.secteur,
        }
    }

    // 4. Chercher les salaires réels
    const salairesActuel = await chercherSalaires(metier_actuel.code_cnp)
    const salairesCible = await chercherSalaires(metier_cible.code_cnp)

    const salaire_actuel = salairesActuel.salaire_low
    const salaire_cible = salairesCible.salaire_high

    // 5. Calculer le nombre d'années nécessaires
    const objectifDifferent = signaux.objectif_normalise.toLowerCase() !== signaux.role_actuel_normalise.toLowerCase()
    const ecartBrut = signaux.niveau_cible - signaux.niveau_actuel
    const ecart = objectifDifferent && ecartBrut <= 0 ? 2 : ecartBrut
    const annees_necessaires = Math.max(
        annees_evolution_min,
        Math.min(annees_evolution_max, ecart <= 0 ? annees_evolution_min : Math.round(ecart * 1.5))
    )
    const objectif_atteignable = annees_necessaires <= 5

    // 6. Construire les 5 étapes
    const etapes: EtapeGPS[] = []

    for (let annee = 1; annee <= 5; annee++) {
        const annees_effectives = Math.min(annees_necessaires, 5)
        const est_objectif = annee >= annees_effectives && metier_cible.code_cnp !== metier_actuel.code_cnp
        const salairesEtape = est_objectif ? salairesCible : salairesActuel
        const { salaire_min, salaire_max } = getSalaireParAnnee(salairesEtape, annee)

        etapes.push({
            annee,
            titre: est_objectif ? metier_cible.titre_fr : signaux.role_actuel_normalise,
            code_cnp: est_objectif ? metier_cible.code_cnp : metier_actuel.code_cnp,
            salaire_min,
            salaire_max,
            actions: genererActions(annee, est_objectif ? metier_cible.secteur : metier_actuel.secteur, est_objectif),
            est_objectif,
        })
    }

    const message_gps = objectif_atteignable
        ? `Votre objectif "${metier_cible.titre_fr}" est atteignable en ${annees_necessaires} an${annees_necessaires > 1 ? 's' : ''} avec un plan structuré.`
        : `Votre objectif "${metier_cible.titre_fr}" nécessite plus de 5 ans. Voici un plan réaliste pour maximiser votre progression.`

    return {
        etapes,
        objectif_atteignable,
        annees_necessaires,
        message_gps,
        salaire_actuel,
        salaire_cible,
    }
}