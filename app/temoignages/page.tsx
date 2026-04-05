"use client";

const temoignages = [
  {
    prenom: "Karima",
    initiale: "B.",
    role: "Aide-soignante → Infirmière auxiliaire",
    ville: "Montréal",
    score: 74,
    texte: "J'avais postulé 34 fois sans jamais avoir de réponse. Après mon entretien YELMA, j'ai compris que je ne mettais pas en avant mes vraies forces. 3 semaines après, j'avais 2 entretiens et une offre.",
    delai: "3 semaines",
    couleur: "#FF7043",
  },
  {
    prenom: "Moussa",
    initiale: "D.",
    role: "Étudiant en informatique → Développeur junior",
    ville: "Québec",
    score: 68,
    texte: "Je ne savais pas du tout comment me présenter aux employeurs. YELMA m'a révélé que ma vraie force c'est l'analyse de données, pas juste le code. J'ai décroché mon premier emploi en moins d'un mois.",
    delai: "4 semaines",
    couleur: "#0EA5E9",
  },
  {
    prenom: "Fatima",
    initiale: "L.",
    role: "Secrétaire médicale → Coordonnatrice clinique",
    ville: "Laval",
    score: 81,
    texte: "À 38 ans, je pensais qu'il était trop tard pour évoluer. YELMA m'a montré que mon expérience était une force, pas un handicap. J'ai eu une promotion 6 semaines après.",
    delai: "6 semaines",
    couleur: "#10B981",
  },
  {
    prenom: "Jean-Philippe",
    initiale: "T.",
    role: "Technicien → Chef de projet IT",
    ville: "Sherbrooke",
    score: 77,
    texte: "Le rapport GPS m'a donné une feuille de route claire sur 5 ans. Avant YELMA, je tournais en rond. Maintenant j'ai un plan concret et j'avance vite.",
    delai: "2 mois",
    couleur: "#FF7043",
  },
  {
    prenom: "Amina",
    initiale: "S.",
    role: "Sans emploi → Agente administrative",
    ville: "Longueuil",
    score: 63,
    texte: "Après 8 mois de chômage, je commençais à perdre espoir. YELMA m'a aidée à identifier ce que je valais vraiment. La lettre de motivation générée par l'IA était bien meilleure que tout ce que j'avais écrit.",
    delai: "5 semaines",
    couleur: "#0EA5E9",
  },
  {
    prenom: "David",
    initiale: "M.",
    role: "Restauration → Gestionnaire de service",
    ville: "Gatineau",
    score: 71,
    texte: "Je n'aurais jamais pensé que mon expérience en restauration pouvait me mener vers la gestion. YELMA a vu en moi des compétences que je ne valorisais pas. Aujourd'hui je gère une équipe de 12 personnes.",
    delai: "7 semaines",
    couleur: "#10B981",
  },
  {
  prenom: "Rachid",
  initiale: "M.",
  role: "Technicien 15 ans → Gestionnaire de projet",
  ville: "Montréal",
  score: 79,
  texte: "À 41 ans, j'avais peur qu'il soit trop tard. YELMA a valorisé mes 15 ans d'expérience technique comme un atout, pas un handicap. J'ai eu mon premier poste de gestion en 2 mois.",
  delai: "2 mois",
  couleur: "#FF7043",
},
{
  prenom: "Sylvie",
  initiale: "P.",
  role: "Sans diplôme → Coordonnatrice RH",
  ville: "Québec",
  score: 66,
  texte: "Les recruteurs ne regardaient même pas mon CV sans diplôme universitaire. YELMA a révélé mes vraies compétences acquises sur le terrain. Aujourd'hui je gère l'onboarding de 200 employés.",
  delai: "6 semaines",
  couleur: "#10B981",
},
];

const stats = [
  { valeur: "73%", label: "trouvent un emploi en moins de 2 mois" },
  { valeur: "4.8★", label: "note moyenne sur 200+ évaluations" },
  { valeur: "2.3×", label: "plus de réponses aux candidatures" },
  { valeur: "89%", label: "recommandent YELMA à leur entourage" },
];

export default function TemoignagesPage() {
  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      
      {/* Header */}
      <div style={{ background: "#1A1A2E", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontSize: "20px", fontWeight: 800, color: "#FF7043", textDecoration: "none", letterSpacing: "-1px" }}>YELMA</a>
        <a href="/pricing" style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
          Commencer — 4.99$/mois →
        </a>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 16px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "12px" }}>
            ILS ONT FAIT CONFIANCE À YELMA
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 12px", lineHeight: 1.2 }}>
            Des vraies transformations,<br />pas des promesses.
          </h1>
          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, margin: 0 }}>
            Ces candidats ont utilisé YELMA pour révéler leurs forces, cibler les bons postes et décrocher des entretiens.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "40px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: "12px", padding: "16px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#FF7043", marginBottom: "4px" }}>{s.valeur}</div>
              <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Placeholder vidéo */}
        <div style={{ background: "#1A1A2E", borderRadius: "16px", padding: "40px 20px", textAlign: "center", marginBottom: "40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 50% 50%, #FF704320 0%, transparent 70%)" }} />
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>▶</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
            Voir YELMA en action
          </div>
          <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>
            Découvrez comment Sophie a trouvé son poste en 3 semaines grâce à son entretien YELMA
          </div>
          <div style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, display: "inline-block" }}>
            📹 Vidéo démo — bientôt disponible
          </div>
        </div>

        {/* Témoignages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
          {temoignages.map((t, i) => (
            <div key={i} style={{ background: "white", borderRadius: "16px", padding: "20px", border: "0.5px solid #E8E8F0", borderLeft: `4px solid ${t.couleur}` }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: t.couleur + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: t.couleur }}>
                    {t.prenom[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>{t.prenom} {t.initiale}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{t.ville}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: t.couleur }}>{t.score}</div>
                  <div style={{ fontSize: "9px", color: "#aaa" }}>Score Propulse</div>
                </div>
              </div>

              <div style={{ background: "#F1EFE8", borderRadius: "8px", padding: "6px 10px", marginBottom: "12px", display: "inline-block" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#666" }}>{t.role}</div>
              </div>

              <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.7, margin: "0 0 12px", fontStyle: "italic" }}>
                &ldquo;{t.texte}&rdquo;
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#10B981" }}>Emploi trouvé en {t.delai}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div style={{ background: "#1A1A2E", borderRadius: "16px", padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", marginBottom: "8px", letterSpacing: "1px" }}>
            PRÊT À ÉCRIRE VOTRE HISTOIRE ?
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "8px" }}>
            Commencez votre entretien YELMA
          </div>
          <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>
            Moins d'un café par semaine · Annulation à tout moment
          </div>
          <a href="/pricing" style={{ display: "block", background: "#FF7043", color: "white", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: 700, textDecoration: "none", marginBottom: "10px" }}>
            Commencer — 4.99$/mois →
          </a>
          <a href="/" style={{ fontSize: "12px", color: "#aaa", textDecoration: "none" }}>← Retour à l'accueil</a>
        </div>

      </div>
    </div>
  );
}
