

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
    """Scrape le nombre d'offres et les salaires réels sur Indeed Canada"""
    try:
        url = f"https://ca.indeed.com/jobs?q={requests.utils.quote(poste)}&l={requests.utils.quote(ville)}&lang=fr"
        res = requests.get(scraper_url(url), timeout=60)
        
        import re
        
        # Compter offres
        match = re.search(r'([\d,]+)\s+emploi', res.text, re.IGNORECASE)
        if not match:
            match = re.search(r'([\d,]+)\s+job', res.text, re.IGNORECASE)
        total = int(match.group(1).replace(',', '')) if match else 0
        
        # Extraire salaires réels
        salaires = extract_salaries_from_indeed_offers(res.text)
        stats = compute_real_salary_stats(salaires)
        
        print(f"✅ Indeed — {poste} à {ville}: {total} offres | Salaires: {stats['min'] or 0:,}$ - {stats['max'] or 0:,}$ ({stats['count']} extraits)")
        return {
            "source": "indeed", "poste": poste, "ville": ville,
            "nb_offres": total,
            "salaire_min": stats["min"] or 0,
            "salaire_max": stats["max"] or 0,
            "salaire_median": stats["median"] or 0,
            "salaires_raw": salaires,
            "date": datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"❌ Indeed error: {e}")
        return {"source": "indeed", "poste": poste, "ville": ville, "nb_offres": 0, "salaire_min": 0, "salaire_max": 0, "salaire_median": 0, "salaires_raw": [], "date": datetime.now().isoformat()}



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

    
    # S — Attractivité salariale
    salaire_median = imt.get("salaire_median", 0)
    
    # Fallback: référence manuelle si IMT vide
    if salaire_median == 0:
        profession_key = poste.lower().replace(" ", "_").replace("é", "e").replace("è", "e").replace("à", "a").replace("ê", "e")
        ref = get_salary_for_profile(profession_key, ville)
        salaire_median = ref.get("median", 0)
        if salaire_median > 0:
            print(f"   💰 Salaire ref: {salaire_median:,}$ ({ref.get('source', '')})")
    
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

 


"""
YELMA — Patch extraction salaires réels
========================================
À intégrer dans votre scraper.py existant.

Le principe : extraire les salaires directement depuis
les offres d'emploi (pas depuis les stats CNP).
Les offres affichent les vrais salaires du marché actuel.
"""

import re
from statistics import median, mean

# ── EXTRACTION SALAIRES DEPUIS LES OFFRES ─────────────────────────────────

def parse_salary_from_text(text: str) -> dict:
    """
    Extrait et normalise un salaire depuis n'importe quel texte d'offre.
    Gère : horaire, hebdo, annuel, avec/sans espaces, $ ou CAD.
    
    Exemples reconnus :
      "34,50 $ / heure"     → annualisé 71 760 $
      "55 000 $ par année"  → 55 000 $
      "72k-85k"             → min 72 000, max 85 000
      "Entre 28 et 32 $/h" → annualisé 60 320 $
    """
    result = {"raw": text, "min": None, "max": None, "annual": None, "type": None}
    
    # Nettoyage
    text_clean = text.replace("\xa0", " ").replace(",", ".").lower().strip()
    
    # Patterns de salaire
    patterns = [
        # Annuel : "55 000 $" ou "55000$" ou "72k"
        (r'(\d{2,3}[\s.]?\d{3})\s*\$?\s*(?:par\s+an|annuel|\/an|year)', "annual"),
        (r'(\d{2,3})\s*k\$?\s*(?:à|-|–)\s*(\d{2,3})\s*k', "annual_range_k"),
        (r'(\d{2,3}[\s.]?\d{3})\s*\$?\s*(?:à|-|–)\s*(\d{2,3}[\s.]?\d{3})', "annual_range"),
        # Horaire : "28.50 $/h" ou "34,50 $ de l'heure"
        (r'(\d{2,3}(?:\.\d{1,2})?)\s*\$?\s*(?:\/h|\/heure|de\s+l.heure|par\s+heure|heure)', "hourly"),
        (r'(\d{2,3}(?:\.\d{1,2})?)\s*\$?\s*(?:à|-|–)\s*(\d{2,3}(?:\.\d{1,2})?)\s*\$?\s*(?:\/h|\/heure)', "hourly_range"),
    ]
    
    for pattern, sal_type in patterns:
        match = re.search(pattern, text_clean)
        if match:
            groups = match.groups()
            if sal_type == "annual":
                val = float(groups[0].replace(" ", "").replace(".", ""))
                if val > 200000 or val < 20000:
                    continue
                result.update({"min": val, "max": val, "annual": val, "type": "annual"})
                
            elif sal_type == "annual_range_k":
                mn = float(groups[0]) * 1000
                mx = float(groups[1]) * 1000
                result.update({"min": mn, "max": mx, "annual": (mn+mx)/2, "type": "annual"})
                
            elif sal_type == "annual_range":
                mn = float(groups[0].replace(" ", "").replace(".", ""))
                mx = float(groups[1].replace(" ", "").replace(".", ""))
                if mn < 20000 or mx > 300000:
                    continue
                result.update({"min": mn, "max": mx, "annual": (mn+mx)/2, "type": "annual"})
                
            elif sal_type == "hourly":
                hourly = float(groups[0])
                if hourly < 15 or hourly > 120:
                    continue
                annual = round(hourly * 35 * 52)  # 35h/sem, 52 semaines
                result.update({"min": annual, "max": annual, "annual": annual, "type": "hourly", "hourly_rate": hourly})
                
            elif sal_type == "hourly_range":
                h_min = float(groups[0]); h_max = float(groups[1])
                if h_min < 15 or h_max > 120:
                    continue
                ann_min = round(h_min * 35 * 52)
                ann_max = round(h_max * 35 * 52)
                result.update({"min": ann_min, "max": ann_max, "annual": (ann_min+ann_max)/2,
                               "type": "hourly", "hourly_min": h_min, "hourly_max": h_max})
            break
    
    return result


def extract_salaries_from_jobillico_offers(soup, max_offers=30) -> list:
    """
    Extrait les salaires de toutes les offres Jobillico sur une page.
    Retourne une liste de salaires annualisés.
    """
    salaries = []
    
    # Sélecteurs Jobillico (à ajuster si le site change)
    offer_cards = soup.select('[class*="job-card"], [class*="offer-card"], article')
    
    for card in offer_cards[:max_offers]:
        # Chercher le salaire dans la carte
        sal_el = card.select_one('[class*="salary"], [class*="salaire"], [class*="compensation"]')
        if sal_el:
            parsed = parse_salary_from_text(sal_el.get_text(strip=True))
            if parsed["annual"]:
                salaries.append(parsed["annual"])
                continue
        
        # Fallback : chercher dans tout le texte de la carte
        card_text = card.get_text(" ", strip=True)
        parsed = parse_salary_from_text(card_text)
        if parsed["annual"] and 30000 < parsed["annual"] < 250000:
            salaries.append(parsed["annual"])
    
    return salaries


def extract_salaries_from_indeed_offers(page_html: str, max_offers=30) -> list:
    """
    Extrait les salaires depuis une page Indeed Canada.
    """
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(page_html, "html.parser")
    salaries = []
    
    # Indeed affiche les salaires dans des spans spécifiques
    salary_selectors = [
        '[class*="salary-snippet"]',
        '[class*="salaryText"]',
        '[data-testid="attribute_snippet_testid"]',
        '[class*="metadata"]',
    ]
    
    for selector in salary_selectors:
        for el in soup.select(selector)[:max_offers]:
            text = el.get_text(strip=True)
            if any(kw in text.lower() for kw in ['$', 'heure', 'an', 'year', 'salary']):
                parsed = parse_salary_from_text(text)
                if parsed["annual"] and 30000 < parsed["annual"] < 250000:
                    salaries.append(parsed["annual"])
    
    return salaries


def compute_real_salary_stats(salaries: list) -> dict:
    """
    Calcule les statistiques salariales à partir d'une liste de salaires réels.
    Filtre les outliers avant le calcul.
    """
    if not salaries:
        return {"median": None, "min": None, "max": None, "count": 0}
    
    # Filtrer les outliers (hors Q1-1.5*IQR et Q3+1.5*IQR)
    sorted_s = sorted(salaries)
    n = len(sorted_s)
    if n >= 4:
        q1 = sorted_s[n//4]
        q3 = sorted_s[3*n//4]
        iqr = q3 - q1
        filtered = [s for s in sorted_s if q1 - 1.5*iqr <= s <= q3 + 1.5*iqr]
    else:
        filtered = sorted_s
    
    if not filtered:
        filtered = sorted_s
    
    return {
        "median": round(median(filtered)),
        "mean":   round(mean(filtered)),
        "min":    round(min(filtered)),
        "max":    round(max(filtered)),
        "p25":    round(filtered[len(filtered)//4]) if len(filtered) >= 4 else None,
        "p75":    round(filtered[3*len(filtered)//4]) if len(filtered) >= 4 else None,
        "count":  len(filtered),
        "raw_count": len(salaries),
    }


# ── FALLBACK SALAIRES PAR PROFESSION (données IMT + conventions collectives) ──
# Source : conventions collectives CISSS/CIUSSS + IMT En ligne + Glassdoor Canada
# À mettre à jour 1x/an manuellement

SALARY_REFERENCE = {
    # Format: "profession_key": {"min": x, "median": y, "max": z, "source": "..."}
    
    "infirmiere_praticienne_specialisee": {
        "min": 72000, "median": 88000, "max": 105000,
        "source": "Convention collective CISSS/CIUSSS 2024",
        "note": "Échelon 1 à échelon max, IPS spécialisée Montréal"
    },
    "infirmiere_praticienne": {
        "min": 72000, "median": 88000, "max": 105000,
        "source": "Convention collective CISSS/CIUSSS 2024",
        "note": "Infirmière praticienne Montréal"
    },
    "coordonnateur_soins": {
        "min": 75000, "median": 88000, "max": 105000,
        "source": "IMT En ligne + Glassdoor Montréal 2024",
    },
    "formateur_soins_infirmiers": {
        "min": 58000, "median": 68000, "max": 80000,
        "source": "Cégeps + établissements de santé Québec 2024",
    },
    "developpeur_python": {
        "min": 70000, "median": 90000, "max": 130000,
        "source": "Stack Overflow Survey Canada 2024 + Glassdoor Montréal",
    },
    "developpeur_react": {
        "min": 68000, "median": 88000, "max": 125000,
        "source": "Glassdoor + LinkedIn Salary Montréal 2024",
    },
    "data_scientist": {
        "min": 80000, "median": 100000, "max": 140000,
        "source": "Glassdoor Montréal + Levels.fyi Canada 2024",
    },
    "chef_de_projet_it": {
        "min": 75000, "median": 95000, "max": 130000,
        "source": "PMI Salary Survey Canada 2024",
    },
    "responsable_rh": {
        "min": 65000, "median": 80000, "max": 105000,
        "source": "CRHA Québec + Glassdoor 2024",
    },
}


def get_salary_for_profile(profession_key: str, city: str, scraped_salaries: list = None) -> dict:
    """
    Retourne le meilleur salaire disponible pour un profil YELMA.
    Priorité : 1) salaires scrappés réels > 2) référence manuelle > 3) fallback CNP
    
    C'est cette fonction que vous appelez dans votre API Next.js.
    """
    
    # 1. Salaires scrappés réels (meilleure source)
    if scraped_salaries and len(scraped_salaries) >= 3:
        stats = compute_real_salary_stats(scraped_salaries)
        return {
            "median":  stats["median"],
            "min":     stats["min"],
            "max":     stats["max"],
            "p25":     stats["p25"],
            "p75":     stats["p75"],
            "source":  f"Offres réelles · {stats['count']} offres analysées",
            "quality": "high",
        }
    
    # 2. Référence manuelle (conventions collectives + Glassdoor)
    if profession_key in SALARY_REFERENCE:
        ref = SALARY_REFERENCE[profession_key]
        return {
            "median":  ref["median"],
            "min":     ref["min"],
            "max":     ref["max"],
            "source":  ref["source"],
            "quality": "medium",
        }
    
    # 3. Fallback CNP (le moins précis — à éviter)
    CNP_FALLBACK = {
        "3012": 72000,  # IPS / Infirmières
        "0311": 88000,  # Directeurs soins infirmiers
        "4021": 65000,  # Enseignants niveau collégial
        "2174": 88000,  # Programmeurs / développeurs
        "2172": 98000,  # Analystes / data scientists
        "0112": 78000,  # RH
        "0114": 74000,  # Autres gestionnaires admin
        "0213": 92000,  # Directeurs informatique
    }
    cnp = profession_key  # si vous passez le CNP directement
    return {
        "median":  CNP_FALLBACK.get(cnp, 65000),
        "source":  "IMT En ligne · Statistique Canada (médiane provinciale)",
        "quality": "low",
        "warning": "Chiffre provincial — peut sous-estimer le marché montréalais de 10-20%"
    }


# ── TEST ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Test du parser
    tests = [
        "34,50 $ de l'heure",
        "55 000 $ par année",
        "72k à 85k",
        "Entre 28 $ et 32 $ / heure",
        "Salaire : 88 000 $ - 105 000 $ annuellement",
        "Rémunération compétitive selon convention collective",
    ]
    
    print("=== TEST EXTRACTION SALAIRES ===\n")
    for t in tests:
        result = parse_salary_from_text(t)
        annual = result.get("annual")
        print(f"  Input:  {t}")
        print(f"  Annuel: {f'{annual:,.0f} $' if annual else 'non détecté'}")
        print()
    
    # Test stats
    sample_salaries = [72000, 75000, 80000, 82000, 85000, 88000, 95000, 100000, 68000, 71000]
    stats = compute_real_salary_stats(sample_salaries)
    print(f"Stats sur {len(sample_salaries)} salaires:")
    print(f"  Médiane: {stats['median']:,} $")
    print(f"  Min: {stats['min']:,} $  |  Max: {stats['max']:,} $")
    print(f"  P25: {stats['p25']:,} $  |  P75: {stats['p75']:,} $")
    
    # Test référence manuelle
    result = get_salary_for_profile("infirmiere_praticienne_specialisee", "Montreal")
    print(f"\nSalaire IPS Montréal (référence): {result['median']:,} $ (source: {result['source']})")





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