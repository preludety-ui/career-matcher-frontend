"use client";

export default function APropos() {
  return (
    <div style={{ background: "#FAFBFF", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      
      {/* Header */}
      <div style={{ background: "#1A1A2E", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontSize: "20px", fontWeight: 800, color: "#FF7043", textDecoration: "none", letterSpacing: "-1px" }}>YELMA</a>
        <a href="/pricing" style={{ background: "#FF7043", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
          Commencer gratuitement →
        </a>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 16px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "12px" }}>
            NOTRE MISSION
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 16px", lineHeight: 1.3 }}>
            Le marché du travail oublie trop de monde. YELMA corrige ça.
          </h1>
          <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.8 }}>
            Des milliers de personnes postulent sans réponse — pas parce qu'elles manquent de talent, mais parce qu'elles ne savent pas comment présenter leurs vraies forces. YELMA utilise l'intelligence artificielle pour révéler ce que vous valez vraiment sur le marché.
          </p>
        </div>

        {/* Pour qui */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "0.5px solid #E8E8F0", marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "16px" }}>YELMA EST FAIT POUR VOUS SI...</div>
          {[
            { emoji: "🎓", titre: "Vous venez de terminer vos études", desc: "et vous ne savez pas par où commencer sur le marché du travail." },
            { emoji: "🔄", titre: "Vous êtes en reconversion (28-45 ans)", desc: "et vous voulez changer de métier sans repartir à zéro." },
            { emoji: "📋", titre: "Vous postulez partout sans résultats", desc: "et vous vous demandez ce qui ne va pas dans votre approche." },
            { emoji: "💪", titre: "Vous êtes autodidacte ou sans diplôme", desc: "et le marché ne vous donne pas votre chance malgré vos compétences." },
            { emoji: "📈", titre: "Vous voulez évoluer dans votre domaine", desc: "et vous avez besoin d'un plan concret pour y arriver." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "20px", flexShrink: 0 }}>{item.emoji}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "2px" }}>{item.titre}</div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment ça marche */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "0.5px solid #E8E8F0", marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "20px" }}>COMMENT ÇA MARCHE</div>
          {[
            { num: "1", titre: "Tu passes l'entretien YELMA", desc: "8 questions sur ce que tu fais concrètement. L'IA analyse chaque réponse pour détecter tes vraies forces — pas celles que tu penses avoir.", couleur: "#FF7043" },
            { num: "2", titre: "Tu reçois ton Rapport GPS", desc: "Score Propulse sur 100, 3 forces révélées, gaps de marché identifiés, et un plan de carrière sur 5 ans avec les vrais salaires québécois.", couleur: "#0EA5E9" },
            { num: "3", titre: "Tu passes à l'action", desc: "Offres ciblées selon ton profil ET ton objectif, CV personnalisé, lettre de motivation IA, et lien de profil à partager aux employeurs.", couleur: "#10B981" },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", marginBottom: i < 2 ? "20px" : 0, alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step.couleur, color: "white", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step.num}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A2E", marginBottom: "4px" }}>{step.titre}</div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ce que YELMA révèle */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "0.5px solid #E8E8F0", marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "16px" }}>CE QUE YELMA GÉNÈRE POUR VOUS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { icon: "⚡", titre: "Score Propulse", desc: "Votre valeur réelle sur le marché sur 100" },
              { icon: "💪", titre: "3 Forces cachées", desc: "Vos compétences que le marché recherche" },
              { icon: "🗺️", titre: "GPS 5 ans", desc: "Votre plan de carrière étape par étape" },
              { icon: "📊", titre: "Analyse de marché", desc: "Salaires réels et tension du marché" },
              { icon: "💼", titre: "Offres ciblées", desc: "Emplois qui correspondent à votre profil" },
              { icon: "📄", titre: "CV + Lettre IA", desc: "Générés depuis vos forces révélées" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#FAFBFF", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>{item.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E", marginBottom: "2px" }}>{item.titre}</div>
                <div style={{ fontSize: "11px", color: "#888" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exemple réel */}
        <div style={{ background: "#F1EFE8", borderRadius: "16px", padding: "24px", marginBottom: "24px", borderLeft: "4px solid #FF7043" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "12px" }}>EXEMPLE RÉEL — AMINA, PRÉPOSÉE AUX BÉNÉFICIAIRES</div>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.7, marginBottom: "16px" }}>
            Amina travaille comme préposée aux bénéficiaires à Montréal depuis 4 ans. Elle veut devenir infirmière mais ne sait pas par où commencer. En 5 minutes d'entretien YELMA :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "✅ Score Propulse : 79/100 — profil solide",
              "✅ Forces révélées : Coordination d'équipe, Écoute clinique, Gestion urgences",
              "✅ GPS : DEC Soins infirmiers → Infirmière diplômée en 4 ans",
              "✅ Salaire cible : 89,700$/an",
              "✅ 250 offres compatibles à Montréal",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: "12px", color: "#1A1A2E" }}>{item}</div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#1A1A2E", borderRadius: "16px", padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", marginBottom: "8px", letterSpacing: "1px" }}>PRÊT À DÉCOUVRIR CE QUE VOUS VALEZ ?</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "8px" }}>2 semaines gratuites — sans carte de crédit</div>
          <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>Rejoignez les candidats qui ont trouvé leur voie avec YELMA</div>
          <a href="/pricing" style={{ display: "block", background: "#FF7043", color: "white", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: 700, textDecoration: "none", marginBottom: "10px" }}>
            Commencer gratuitement →
          </a>
          <a href="/" style={{ fontSize: "12px", color: "#aaa", textDecoration: "none" }}>← Retour à l'accueil</a>
        </div>

      </div>
    </div>
  );
}