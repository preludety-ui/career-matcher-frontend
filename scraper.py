"""
YELMA Market Data Scraper
Sources: Jobillico, Indeed Canada, Emploi-Québec IMT
Scheduler: hebdomadaire automatique
"""

import os
import json
import time
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

# ── Config ──────────────────────────────────────────────
SCRAPER_API_KEY = "11fdae378015f5309c5399322923ed6c"
SUPABASE_URL    = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scraper_url(url: str) -> str:
    """Wrapper ScraperAPI"""
    return f"http://api.scraperapi.com?api_key={SCRAPER_API_KEY}&url={requests.utils.quote(url)}"


# ══════════════════════════════════════════════════════════
# 1. JOBILLICO
# ══════════════════════════════════════════════════════════

def scraper_jobillico(poste: str, ville: str = "montreal") -> dict:
    try:
        url = f"https://www.jobillico.com/recherche-emploi?skwd={requests.utils.quote(poste)}&scty={ville}&action=submit"
        res = requests.get(scraper_url(url), timeout=60)
        
        import re
        match = re.search(r'(\d+)\s*(?:emploi|poste|offre)', res.text, re.IGNORECASE)
        if not match:
            match = re.search(r'"count"\s*:\s*(\d+)', res.text)
        total = int(match.group(1)) if match else 0
        
        print(f"✅ Jobillico — {poste} à {ville}: {total} offres")
        return {"source": "jobillico", "poste": poste, "ville": ville, "nb_offres": total, "date": datetime.now().isoformat()}
    
    except Exception as e:
        print(f"❌ Jobillico error: {e}")
        return {"source": "jobillico", "poste": poste, "ville": ville, "nb_offres": 0, "date": datetime.now().isoformat()}


# ══════════════════════════════════════════════════════════
# 2. INDEED CANADA
# ══════════════════════════════════════════════════════════

def scraper_indeed(poste: str, ville: str = "Montreal, QC") -> dict:
    """Scrape le nombre d'offres sur Indeed Canada"""
    try:
        url = f"https://ca.indeed.com/jobs?q={requests.utils.quote(poste)}&l={requests.utils.quote(ville)}&lang=fr"
        res = requests.get(scraper_url(url), timeout=60)
        
        import re
        # Indeed affiche "X emplois" ou "X jobs"
        match = re.search(r'([\d,]+)\s+emploi', res.text, re.IGNORECASE)
        if not match:
            match = re.search(r'([\d,]+)\s+job', res.text, re.IGNORECASE)
        
        total = int(match.group(1).replace(',', '')) if match else 0
        
        print(f"✅ Indeed — {poste} à {ville}: {total} offres")
        return {"source": "indeed", "poste": poste, "ville": ville, "nb_offres": total, "date": datetime.now().isoformat()}
    
    except Exception as e:
        print(f"❌ Indeed error: {e}")
        return {"source": "indeed", "poste": poste, "ville": ville, "nb_offres": 0, "date": datetime.now().isoformat()}


# ══════════════════════════════════════════════════════════
# 3. EMPLOI-QUÉBEC IMT ONLINE
# ══════════════════════════════════════════════════════════

def scraper_imt_quebec(code_cnp: str) -> dict:
    """
    Récupère les données officielles d'Emploi-Québec IMT Online
    Source: https://imt.emploiquebec.gouv.qc.ca
    """
    try:
        url = f"https://imt.emploiquebec.gouv.qc.ca/mtg/inter/noncache/contenu/asp/mtg122_compnpc_01.asp?lang=FRAN&Ree_code_npc={code_cnp}&PT=on"
        res = requests.get(scraper_url(url), timeout=60)
        
        import re
        
        # Extraire perspectives d'emploi
        perspectives = "inconnues"
        if "favorables" in res.text.lower():
            perspectives = "favorables"
        elif "acceptables" in res.text.lower():
            perspectives = "acceptables"
        elif "limitées" in res.text.lower() or "limitees" in res.text.lower():
            perspectives = "limitées"
        
        # Extraire salaire médian
        salaire_match = re.search(r'(\d+[\s,]\d+)\s*\$', res.text)
        salaire_median = int(salaire_match.group(1).replace(' ', '').replace(',', '')) if salaire_match else 0
        
        # Extraire taux de chômage
        chomage_match = re.search(r'(\d+[,\.]\d+)\s*%', res.text)
        taux_chomage = float(chomage_match.group(1).replace(',', '.')) if chomage_match else 0
        
        data = {
            "source": "emploi_quebec_imt",
            "code_cnp": code_cnp,
            "perspectives": perspectives,
            "salaire_median": salaire_median,
            "taux_chomage": taux_chomage,
            "date": datetime.now().isoformat()
        }
        
        print(f"✅ IMT Québec — CNP {code_cnp}: {perspectives}, salaire médian {salaire_median}$")
        return data
    
    except Exception as e:
        print(f"❌ IMT Québec error: {e}")
        return {"source": "emploi_quebec_imt", "code_cnp": code_cnp, "perspectives": "inconnues", "date": datetime.now().isoformat()}


# ══════════════════════════════════════════════════════════
# 4. CALCUL SCORE MARCHÉ
# ══════════════════════════════════════════════════════════

def calculer_score_marche(poste: str, ville: str, code_cnp: str = None) -> dict:
    """
    Calcule le score marché complet
    Marché = 100 × (0.4×D + 0.3×S + 0.2×T + 0.1×G)
    """
    print(f"\n🔍 Analyse marché: {poste} à {ville}")
    
    # Scraper les 3 sources
    jobillico = scraper_jobillico(poste, ville.lower().replace(" ", "-"))
    time.sleep(5)  # éviter rate limiting
    indeed = scraper_indeed(poste, ville)
    time.sleep(5)
    imt = scraper_imt_quebec(code_cnp) if code_cnp else {}
    
    # Total offres combinées
    nb_offres_total = jobillico["nb_offres"] + indeed["nb_offres"]
    
    # D — Demande offres (normalisé sur 100, max estimé = 50 offres)
    D = min(100, int((nb_offres_total / 50) * 100))

    
    # S — Attractivité salariale (basé IMT ou estimation)
    salaire_median = imt.get("salaire_median", 0)
    if salaire_median > 80000:
        S = 90
    elif salaire_median > 60000:
        S = 75
    elif salaire_median > 45000:
        S = 60
    else:
        S = 50
    
    # T — Tension métier (basé perspectives IMT)
    perspectives = imt.get("perspectives", "inconnues")
    if perspectives == "favorables":
        T = 85
    elif perspectives == "acceptables":
        T = 60
    elif perspectives == "limitées":
        T = 35
    else:
        T = 55  # défaut
    
    # G — Croissance secteur (basé sur données historiques IMT)
    chomage = imt.get("taux_chomage", 5)
    G = max(0, min(100, int(100 - chomage * 5)))
    
    # Score final
    score = round(100 * (0.4 * D + 0.3 * S + 0.2 * T + 0.1 * G) / 100)
    
    tendance = "en croissance" if score >= 70 else "stable" if score >= 50 else "en déclin"
    
    result = {
        "poste": poste,
        "ville": ville,
        "code_cnp": code_cnp,
        "D": D,
        "S": S,
        "T": T,
        "G": G,
        "score_marche": score,
        "nb_offres_total": nb_offres_total,
        "nb_offres_jobillico": jobillico["nb_offres"],
        "nb_offres_indeed": indeed["nb_offres"],
        "tendance": tendance,
        "perspectives_imt": perspectives,
        "salaire_median_imt": salaire_median,
        "date_collecte": datetime.now().isoformat(),
    }
    
    print(f"\n📊 Score Marché: {score}/100 ({tendance})")
    print(f"   D={D} S={S} T={T} G={G}")
    print(f"   Offres: {nb_offres_total} (Jobillico: {jobillico['nb_offres']}, Indeed: {indeed['nb_offres']})")
    
    return result


# ══════════════════════════════════════════════════════════
# 5. PROJECTION 5 ANS
# ══════════════════════════════════════════════════════════

def get_5year_forecast(poste: str, ville: str, code_cnp: str = None) -> dict:
    """
    Calcule la projection de demande sur 5 ans
    Basé sur les données IMT + tendance historique des offres
    """
    score_actuel = calculer_score_marche(poste, ville, code_cnp)
    
    # Taux de croissance annuel estimé basé sur le score
    if score_actuel["score_marche"] >= 75:
        taux_croissance = 0.08  # +8%/an
    elif score_actuel["score_marche"] >= 60:
        taux_croissance = 0.04  # +4%/an
    elif score_actuel["score_marche"] >= 45:
        taux_croissance = 0.01  # +1%/an
    else:
        taux_croissance = -0.02  # -2%/an
    
    annee_actuelle = datetime.now().year
    projection = []
    
    for i in range(6):  # 0 à 5 ans
        annee = annee_actuelle + i
        score_proj = min(100, round(score_actuel["score_marche"] * ((1 + taux_croissance) ** i)))
        projection.append({"annee": annee, "score": score_proj})
    
    return {
        "poste": poste,
        "ville": ville,
        "score_actuel": score_actuel["score_marche"],
        "taux_croissance_annuel": round(taux_croissance * 100, 1),
        "tendance": score_actuel["tendance"],
        "projection": projection,
        "date": datetime.now().isoformat()
    }


# ══════════════════════════════════════════════════════════
# 6. SAUVEGARDER DANS SUPABASE
# ══════════════════════════════════════════════════════════

def sauvegarder_donnees_marche(donnees: dict):
    """Sauvegarde les données dans la table market_data de Supabase"""
    try:
        # Créer la table si elle n'existe pas (via upsert)
        result = supabase.table("market_data").upsert({
            "poste": donnees["poste"],
            "ville": donnees["ville"],
            "code_cnp": donnees.get("code_cnp"),
            "score_marche": donnees["score_marche"],
            "nb_offres": donnees.get("nb_offres_total", 0),
            "tendance": donnees["tendance"],
            "details": json.dumps(donnees),
            "updated_at": datetime.now().isoformat(),
        }, on_conflict="poste,ville").execute()
        
        print(f"✅ Données sauvegardées dans Supabase: {donnees['poste']} à {donnees['ville']}")
        return result
    except Exception as e:
        print(f"❌ Supabase error: {e}")
        return None


# ══════════════════════════════════════════════════════════
# 7. SCHEDULER HEBDOMADAIRE
# ══════════════════════════════════════════════════════════

# Liste des postes à surveiller (CNP + titre)
POSTES_A_SURVEILLER = [
    {"titre": "Infirmière praticienne spécialisée", "cnp": "31302", "ville": "Montréal"},
    {"titre": "Infirmière", "cnp": "31301", "ville": "Montréal"},
    {"titre": "Médecin de famille", "cnp": "31102", "ville": "Montréal"},
    {"titre": "Pharmacien", "cnp": "31120", "ville": "Montréal"},
    {"titre": "Développeur web", "cnp": "21234", "ville": "Montréal"},
    {"titre": "Développeur senior", "cnp": "21232", "ville": "Montréal"},
    {"titre": "Analyste financier", "cnp": "11101", "ville": "Montréal"},
    {"titre": "Directeur financier", "cnp": "10010", "ville": "Montréal"},
    {"titre": "Chargé de projet", "cnp": "11200", "ville": "Montréal"},
    {"titre": "Directeur de projet", "cnp": "10020", "ville": "Montréal"},
    {"titre": "Avocat", "cnp": "41101", "ville": "Montréal"},
    {"titre": "Architecte", "cnp": "21200", "ville": "Montréal"},
    {"titre": "Ingénieur civil", "cnp": "21300", "ville": "Montréal"},
    {"titre": "Enseignant primaire", "cnp": "41221", "ville": "Montréal"},
    {"titre": "Directeur d'école", "cnp": "40021", "ville": "Montréal"},
    {"titre": "Vétérinaire", "cnp": "31103", "ville": "Montréal"},
    {"titre": "Pilote de ligne", "cnp": "73400", "ville": "Montréal"},
    {"titre": "Coordinateur marketing", "cnp": "11206", "ville": "Montréal"},
    {"titre": "Directeur marketing", "cnp": "10022", "ville": "Montréal"},
    {"titre": "Directeur RH", "cnp": "10011B", "ville": "Montréal"},
]


def run_weekly_scraper():
    """Lance le scraper pour tous les postes surveillés"""
    print(f"\n{'='*60}")
    print(f"🚀 YELMA Market Scraper — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}\n")
    
    resultats = []
    
    for poste in POSTES_A_SURVEILLER:
        try:
            donnees = calculer_score_marche(
                poste["titre"],
                poste["ville"],
                poste.get("cnp")
            )
            sauvegarder_donnees_marche(donnees)
            resultats.append(donnees)
            time.sleep(3)  # éviter rate limiting
        except Exception as e:
            print(f"❌ Erreur pour {poste['titre']}: {e}")
            continue
    
    print(f"\n{'='*60}")
    print(f"✅ Scraping terminé: {len(resultats)}/{len(POSTES_A_SURVEILLER)} postes traités")
    print(f"{'='*60}\n")
    
    return resultats


# ══════════════════════════════════════════════════════════
# 8. TEST UNITAIRE
# ══════════════════════════════════════════════════════════

def test_single(poste: str = "Infirmière praticienne spécialisée", ville: str = "Montréal", cnp: str = "31302"):
    """Test rapide pour un seul poste"""
    print(f"\n🧪 TEST: {poste} à {ville}")
    donnees = calculer_score_marche(poste, ville, cnp)
    sauvegarder_donnees_marche(donnees)
    print(f"\n📊 Résultat: {json.dumps(donnees, indent=2, ensure_ascii=False)}")
    return donnees


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "weekly":
        # Mode scheduler hebdomadaire
        run_weekly_scraper()
    elif len(sys.argv) > 1 and sys.argv[1] == "test":
        # Mode test
        poste = sys.argv[2] if len(sys.argv) > 2 else "Infirmière praticienne spécialisée"
        test_single(poste)
    else:
        # Par défaut: test avec Infirmière IPS
        test_single()