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
    // ── Nouveaux champs PROPULSE ──
    score_propulse: number        // Score global 0-100
    score_cible_pct: number       // % progression vers objectif
    score_cible_5ans_pct: number  // % atteint dans 5 ans si > 5 ans
    message_analyse: string       // "Ce que YELMA a vu en toi"
    verdict: 'atteignable' | 'ambitieux' | 'defi' // Type de profil
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

    // 1. Chercher le métier actuel dans Supabase
    const motCle = signaux.role_actuel_normalise.trim()
    const { data: metierActuelData } = await supabaseAdmin
        .from('metiers')
        .select('id, titre_fr, code_cnp, secteur')
        .or(`titre_fr.ilike.%${motCle}%,alias.cs.{"${motCle}"}`)
        .limit(1)
        .single()


    const metier_actuel = metierActuelData ?? {
        id: null as string | null,
        titre_fr: signaux.role_actuel_normalise,
        code_cnp: '00000',
        secteur: signaux.domaine_code,
    }

    // 2. Générer le GPS via Claude
    let metier_cible: { id: string | null; titre_fr: string; code_cnp: string; secteur: string } | null = null
    let annees_evolution_min = 2
    let annees_evolution_max = 5

    try {
        const gpsPrompt = `Tu es un expert en orientation de carrière au Québec.
Génère un plan de carrière réaliste pour cette personne :
- Rôle actuel : ${signaux.role_actuel_normalise}
- Objectif : ${signaux.objectif_normalise}
- Expérience : ${signaux.annees_experience} ans
- Diplôme : ${signaux.diplome || 'non précisé'}
- Ville : ${signaux.ville || 'Montréal'}

Réponds UNIQUEMENT avec ce JSON valide, rien d'autre :
{
  "titre_cible": "titre exact du poste cible au Québec",
  "secteur_cible": "secteur (ex: Gestion, TI, Santé, Construction)",
  "annees_min": 2,
  "annees_max": 5,
  "etapes": [
    {"annee": 1, "titre": "titre poste année 1", "action": "action concrète année 1"},
    {"annee": 2, "titre": "titre poste année 2", "action": "action concrète année 2"},
    {"annee": 3, "titre": "titre poste année 3", "action": "action concrète année 3"},
    {"annee": 4, "titre": "titre poste année 4", "action": "action concrète année 4"},
    {"annee": 5, "titre": "titre poste année 5", "action": "action concrète année 5"}
  ]
}

RÈGLES :
- Titres de postes réels et reconnus au Québec
- Si sans diplôme → proposer certifications reconnues (PMP, CAPM, etc.) dans les actions
- Progression réaliste et atteignable
- Actions concrètes et spécifiques au domaine`

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 800,
                messages: [{ role: 'user', content: gpsPrompt }],
            }),
        })

        const claudeData = await claudeRes.json()
        const claudeText = claudeData.content?.[0]?.text || ''
        const jsonMatch = claudeText.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
            const gpsJson = JSON.parse(jsonMatch[0])
            // Chercher le vrai code CNP du métier cible
            let code_cnp_cible = top_metier.code_cnp
            const { data: metierCibleDB } = await supabaseAdmin
                .from('metiers')
                .select('code_cnp')
                .ilike('titre_fr', `%${gpsJson.titre_cible.split(' ')[0]}%`)
                .limit(1)
                .single()

            if (metierCibleDB) code_cnp_cible = metierCibleDB.code_cnp

            metier_cible = {
                id: null,
                titre_fr: gpsJson.titre_cible,
                code_cnp: code_cnp_cible,
                secteur: gpsJson.secteur_cible,
            }
            annees_evolution_min = gpsJson.annees_min || 2
            annees_evolution_max = gpsJson.annees_max || 5

            // Remplacer les actions génériques par celles de Claude
            const actionsParAnnee: Record<number, string[]> = {}
            for (const etape of gpsJson.etapes) {
                actionsParAnnee[etape.annee] = [etape.action]
            }

            // Stocker pour utilisation dans construireGPS
            ; (signaux as any)._actionsClaudeGPS = actionsParAnnee
                ; (signaux as any)._titresClaudeGPS = gpsJson.etapes.reduce((acc: Record<number, string>, e: { annee: number, titre: string }) => {
                    acc[e.annee] = e.titre
                    return acc
                }, {})
        }
    } catch (e) {
        console.error('GPS Claude error:', e)
    }

    // Fallback si Claude échoue
    if (!metier_cible) {
        metier_cible = {
            id: null,
            titre_fr: signaux.objectif_normalise,
            code_cnp: top_metier.code_cnp,
            secteur: top_metier.secteur,
        }
    }

    // 4. Chercher les salaires réels
    const salairesActuel = await chercherSalaires(metier_actuel.code_cnp)
    const salairesCible = await chercherSalaires(metier_cible.code_cnp)

    const salaire_actuel = salairesActuel.salaire_low
    const salaire_cible = getSalaireParAnnee(salairesCible, 5).salaire_min

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

        const titreEtape = (signaux as any)._titresClaudeGPS?.[annee] || (est_objectif ? metier_cible.titre_fr : signaux.role_actuel_normalise);
        const isEtudiant = titreEtape.toLowerCase().includes('étudiant') ||
            titreEtape.toLowerCase().includes('stagiaire') ||
            titreEtape.toLowerCase().includes('cégep') ||
            titreEtape.toLowerCase().includes('stage') ||
            titreEtape.toLowerCase().includes('formation');

        etapes.push({
            annee,
            titre: titreEtape,
            code_cnp: est_objectif ? metier_cible.code_cnp : metier_actuel.code_cnp,
            salaire_min: isEtudiant ? 18000 : salaire_min,
            salaire_max: isEtudiant ? 22000 : salaire_max,
            actions: (signaux as any)._actionsClaudeGPS?.[annee]
                ? [(signaux as any)._actionsClaudeGPS[annee]]
                : genererActions(annee, est_objectif ? metier_cible.secteur : metier_actuel.secteur, est_objectif),
            est_objectif,
        })
    }

    const message_gps = objectif_atteignable
        ? `Votre objectif "${metier_cible.titre_fr}" est atteignable en ${annees_necessaires} an${annees_necessaires > 1 ? 's' : ''} avec un plan structuré.`
        : `Votre objectif "${metier_cible.titre_fr}" nécessite plus de 5 ans. Voici un plan réaliste pour maximiser votre progression.`

    // ── Calculer Score CIBLE % ──
    const annees_experience = signaux.annees_experience ?? 1
    const score_cible_pct = Math.min(85, Math.round(
        (annees_experience / Math.max(annees_necessaires + 3, 5)) * 100
    ))
    const score_cible_5ans_pct = annees_necessaires > 5
        ? Math.min(100, Math.round((5 / annees_necessaires) * 100))
        : 100

    // ── Calculer Score PROPULSE ──
    const niveau_competences = signaux.niveau_actuel * 20  // 1-5 → 20-100
    const exp_score = Math.min(100, annees_experience * 15) // expérience
    const marche_score = 80 // base marché
    const score_propulse = Math.min(99, Math.round(
        niveau_competences * 0.5 +
        exp_score * 0.3 +
        marche_score * 0.2
    ))

    // ── Verdict ──
    const verdict = annees_necessaires <= 5 ? 'atteignable'
        : annees_necessaires <= 8 ? 'ambitieux'
            : 'defi'

    // ── Message analyse ──
    const prenom = signaux.prenom ?? 'Toi'
    const message_analyse = verdict === 'atteignable'
        ? `${prenom}, tu possèdes des forces que peu de candidats ont. En complétant tes formations et en comblant tes écarts, tu rejoindras l'élite de ton domaine — les professionnels que les employeurs s'arrachent.`
        : `${prenom}, ton ambition révèle quelque chose d'important sur toi. Ta cible est exigeante — le marché trace ton chemin sur ${annees_necessaires} ans. Dans 5 ans, tu seras déjà à ${score_cible_5ans_pct}% de ton objectif, avec un profil que peu de candidates auront su construire.`

    return {
        etapes,
        objectif_atteignable,
        annees_necessaires,
        message_gps,
        salaire_actuel,
        salaire_cible,
        score_propulse,
        score_cible_pct,
        score_cible_5ans_pct,
        message_analyse,
        verdict,
    }
}