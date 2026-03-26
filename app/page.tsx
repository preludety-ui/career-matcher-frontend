"use client";

import { useState, useRef, useEffect } from "react";
import RapportGPSComponent from "./components/RapportGPS";

type Message = {
  role: "bot" | "user";
  text: string;
  rapport?: {
    force1?: string; force1_desc?: string;
    force2?: string; force2_desc?: string;
    force3?: string; force3_desc?: string;
    axe1?: string; axe1_desc?: string;
    axe2?: string; axe2_desc?: string;
    salaire_min?: number;
    salaire_max?: number;
    role_actuel?: string;
    ville?: string;
    objectif_carriere?: string;
    scenario_objectif?: number;
    message_objectif?: string;
    delai_objectif?: string;
    analyse_comparative?: string;
    opportunites?: { titre: string; salaire: number; description: string }[];
    gps_an1?: { titre: string; salaire: number; action: string };
    gps_an2?: { titre: string; salaire: number; action: string };
    gps_an3?: { titre: string; salaire: number; action: string };
    gps_an4?: { titre: string; salaire: number; action: string };
    gps_an5?: { titre: string; salaire: number; action: string };
    formations?: { nom: string; type: string; plateforme: string; duree: string }[];
    certifications?: { nom: string; organisme: string }[];
    message_final?: string;
  };
};

type MarketData = {
  taux_chomage: string;
  salaire_junior: string;
  postes_tech: string;
  competences: string[];
  secteurs: { nom: string; niveau: string; pourcentage: number }[];
  technologies: string[];
  conseil: string;
};

const defaultMarket: MarketData = {
  taux_chomage: "14.1%",
  salaire_junior: "42K$",
  postes_tech: "+23%",
  competences: ["IA & Machine Learning", "Python", "Analyse de données", "Communication", "Cloud AWS"],
  secteurs: [
    { nom: "Technologie & IA", niveau: "Très fort", pourcentage: 90 },
    { nom: "Santé & Services", niveau: "Fort", pourcentage: 75 },
    { nom: "Finance & Comptabilité", niveau: "Modéré", pourcentage: 65 },
  ],
  technologies: ["ChatGPT & LLMs", "Power BI", "Cybersécurité", "React / Next.js", "SQL avancé", "Figma / UX"],
  conseil: "Les employeurs cherchent des jeunes qui savent utiliser l'IA. Une certification IA augmente tes chances de 40% !"
};

const content = {
  fr: {
    tagline: "Les autres évaluent, nous on révèle, oriente et améliore",
    btnLang: "🇺🇸 English",
    placeholder: "Écrivez votre réponse...",
    send: "Envoyer",
    thinking: "En train d'analyser...",
    niche: "La plateforme carrière pour les jeunes que le marché du travail oublie trop souvent",
    nicheEN: "The career platform for young talent the job market keeps overlooking",
    slogan1: "Tu ne sais pas où tu excelles ?",
    slogan2: "On le découvre ensemble — et on t'y envoie.",
    sloganEN: "You have what it takes. YELMA finds it — and gets you hired.",
    chooseLang: "Choisissez votre langue / Choose your language",
    forYou: "YELMA c'est pour toi si...",
    forYouEN: "is for you if...",
    p1: "Tu finis tes études et tu ne sais pas par où commencer",
    p1EN: "Done with school. Now what? We have the answer.",
    p2: "Tu postules partout sans résultats",
    p2EN: "100 applications. Zero callbacks. Sound familiar?",
    p3: "Tu veux savoir exactement quoi améliorer pour décrocher un emploi",
    p3EN: "Ready to stop guessing and start getting hired?",
    card1title: "RÉVÈLE", card1sub: "vos forces cachées", card1EN: "UNCOVERS", card1subEN: "your hidden potential",
    card2title: "ORIENTE", card2sub: "où vous êtes imbattable", card2EN: "DIRECTS", card2subEN: "apply where you shine",
    card3title: "AMÉLIORE", card3sub: "vos compétences", card3EN: "BOOSTS", card3subEN: "your skills & career",
    market: "MARCHÉ · LIVE",
    seeMore: "+ voir →",
    chomage: "Chômage jeunes",
    salaire: "Salaire junior",
    postes: "Postes tech",
  },
  en: {
    tagline: "Others evaluate, we reveal, guide and improve",
    btnLang: "🇫🇷 Français",
    placeholder: "Write your answer...",
    send: "Send",
    thinking: "Analyzing...",
    niche: "The career platform for young talent the job market keeps overlooking",
    nicheEN: "La plateforme carrière pour les jeunes que le marché du travail oublie trop souvent",
    slogan1: "You have what it takes.",
    slogan2: "YELMA finds it — and gets you hired.",
    sloganEN: "Tu ne sais pas où tu excelles ? On le découvre ensemble.",
    chooseLang: "Choose your language / Choisissez votre langue",
    forYou: "YELMA is for you if...",
    forYouEN: "c'est pour toi si...",
    p1: "Done with school. Now what? We have the answer.",
    p1EN: "Tu finis tes études et tu ne sais pas par où commencer",
    p2: "100 applications. Zero callbacks. Sound familiar?",
    p2EN: "Tu postules partout sans résultats",
    p3: "Ready to stop guessing and start getting hired?",
    p3EN: "Tu veux savoir exactement quoi améliorer pour décrocher un emploi",
    card1title: "UNCOVERS", card1sub: "your hidden potential", card1EN: "RÉVÈLE", card1subEN: "vos forces cachées",
    card2title: "DIRECTS", card2sub: "apply where you shine", card2EN: "ORIENTE", card2subEN: "où vous êtes imbattable",
    card3title: "BOOSTS", card3sub: "your skills & career", card3EN: "AMÉLIORE", card3subEN: "vos compétences",
    market: "MARKET · LIVE",
    seeMore: "+ see →",
    chomage: "Youth unemployment",
    salaire: "Junior salary",
    postes: "Tech jobs",
  },
};

export default function Home() {
  const [lang, setLang] = useState<"fr" | "en" | null>(null);
  const [userInfo, setUserInfo] = useState<{
    nom: string; prenom: string; email: string; plan: string;
    diplome?: string; annee_diplome?: string; domaine_etudes?: string;
    annee_experience?: string; annee_autre_experience?: string;
    domaine_actuel?: string; role_actuel?: string; ville?: string;
    statut_emploi?: string; objectif_declare?: string;
    salaire_min?: number; salaire_max?: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "",
    diplome: "", annee_diplome: "", domaine_etudes: "",
    annee_experience: "", annee_autre_experience: "",
    domaine_actuel: "", role_actuel: "", ville: "",
    statut_emploi: "", objectif_declare: ""
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rapportGenere, setRapportGenere] = useState(false);
  const [marketData, setMarketData] = useState<MarketData>(defaultMarket);
  const [marketLoading, setMarketLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get("lang") as "fr" | "en" | null;
    const free = params.get("free");
    if (l && free) setLang(l);
  }, []);

  useEffect(() => {
    const loadMarket = async () => {
      try {
        const res = await fetch("/api/market");
        const json = await res.json();
        if (json.data) setMarketData(json.data);
      } catch (e) {
        console.error("Market data error:", e);
      } finally {
        setMarketLoading(false);
      }
    };
    loadMarket();
  }, []);

  const selectLang = (l: "fr" | "en") => {
    window.location.href = `/pricing?lang=${l}`;
  };

  const handleFormSubmit = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
      setFormError(lang === "fr" ? "Veuillez remplir au moins prénom, nom et email" : "Please fill in at least first name, last name and email");
      return;
    }
    if (!formData.email.includes("@")) {
      setFormError(lang === "fr" ? "Email invalide" : "Invalid email");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const planRes = await fetch(`/api/plan?email=${formData.email}`);
      const planData = await planRes.json();
      const plan = planData?.plan_effectif || "propulse";

      let salaire_min = 40000;
      let salaire_max = 60000;

      if (formData.role_actuel || formData.domaine_actuel) {
        try {
          const salaireRes = await fetch("/api/salaire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: formData.role_actuel || formData.domaine_actuel,
              experience: formData.annee_experience,
              ville: formData.ville || "Montréal",
              diplome: formData.diplome,
              competences: formData.domaine_etudes,
              domaine: formData.domaine_actuel,
              secteur: formData.domaine_actuel,
            }),
          });
          const salaireData = await salaireRes.json();
          salaire_min = salaireData.salaire_min || 40000;
          salaire_max = salaireData.salaire_max || 60000;
        } catch (e) {
          console.error("Salaire API error:", e);
        }
      }

      setUserInfo({ ...formData, plan, salaire_min, salaire_max });
      setMessages([]);
      setRapportGenere(false);

    } catch {
      setUserInfo({ ...formData, plan: "propulse", salaire_min: 40000, salaire_max: 60000 });
    } finally {
      setFormLoading(false);
    }
  };

  const sendMessage = async (initialMessage?: string) => {
    if (!lang) return;

    const messageText = initialMessage || input.trim();
    if (!messageText && !initialMessage) return;

    const newMessages: Message[] = initialMessage
      ? messages
      : [...messages, { role: "user", text: messageText }];

    if (!initialMessage) setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newMessages.map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
          lang,
          email: userInfo?.email,
          nom: userInfo?.nom,
          prenom: userInfo?.prenom,
          candidatInfo: {
            prenom: userInfo?.prenom,
            diplome: userInfo?.diplome,
            annee_diplome: userInfo?.annee_diplome,
            domaine_etudes: userInfo?.domaine_etudes,
            annee_experience: userInfo?.annee_experience,
            annee_autre_experience: userInfo?.annee_autre_experience,
            domaine_actuel: userInfo?.domaine_actuel,
            role_actuel: userInfo?.role_actuel,
            ville: userInfo?.ville,
            statut_emploi: userInfo?.statut_emploi,
            objectif_declare: userInfo?.objectif_declare,
            salaire_min: userInfo?.salaire_min,
            salaire_max: userInfo?.salaire_max,
          },
        }),
      });

      const data = await res.json();
      const { parseRapport } = await import("./components/RapportGPS");
      const rapport = data.rapportData || parseRapport(data.reply);
      const botMessage: Message = {
        role: "bot",
        text: data.reply,
        rapport: rapport || undefined,
      };
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);

      if (rapport) {
        setRapportGenere(true);
      }

    } catch {
      setMessages([...newMessages, {
        role: "bot",
        text: lang === "fr" ? "Une erreur est survenue." : "An error occurred."
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo && messages.length === 0 && !loading) {
      sendMessage("START");
    }
  }, [userInfo]);

  if (!lang) {
    const t = content.fr;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm" style={{ textAlign: "center" }}>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "3px", height: "20px", margin: "0 auto 8px" }}>
            {[7, 13, 20, 13, 7].map((h, i) => (
              <div key={i} style={{ width: "4px", borderRadius: "3px", background: "#FF7043", height: `${h}px`, animation: `wave 1.1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A2E", letterSpacing: "-1px", margin: "0 0 4px" }}>YELMA</h1>
          <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 6px" }} />
          <div style={{ display: "inline-block", background: "#FFE0D6", borderRadius: "20px", padding: "3px 12px", marginBottom: "6px" }}>
            <span style={{ fontSize: "9px", color: "#993C1D", fontWeight: 600 }}>{t.niche}</span>
          </div>
          <div style={{ fontSize: "8px", color: "#aaa", fontStyle: "italic", marginBottom: "8px" }}>{t.nicheEN}</div>
          <p style={{ fontSize: "11px", color: "#2D2D44", fontWeight: 500, lineHeight: 1.6, margin: "0 0 2px" }}>
            {t.slogan1} <span style={{ color: "#FF7043", fontWeight: 700 }}>{t.slogan2}</span>
          </p>
          <p style={{ fontSize: "9px", color: "#aaa", fontStyle: "italic", margin: "0 0 10px" }}>{t.sloganEN}</p>

          <div style={{ background: "#1A1A2E", borderRadius: "10px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ fontSize: "8px", color: "#FF7043", fontWeight: 600 }}>{t.market}</div>
              {marketLoading && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF7043", animation: "pulse1 1s ease-in-out infinite" }} />}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {[[marketData.taux_chomage, t.chomage, "#FF7043"], [marketData.postes_tech, t.postes, "#10B981"], [marketData.salaire_junior, t.salaire, "#0EA5E9"]].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: c }}>{v}</div>
                  <div style={{ fontSize: "7px", color: "#aaa" }}>{l}</div>
                </div>
              ))}
              <button onClick={() => { const p = document.getElementById("yelma-popup"); if (p) p.style.display = "flex"; }} style={{ background: "#FF7043", border: "none", color: "white", fontSize: "8px", cursor: "pointer", fontWeight: 600, padding: "4px 8px", borderRadius: "6px" }}>{t.seeMore}</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {[
              { bg: "#FFE0D6", stroke: "#FF7043", title: t.card1title, sub: t.card1sub, titleEN: t.card1EN, subEN: t.card1subEN },
              { bg: "#D6F0FF", stroke: "#0EA5E9", title: t.card2title, sub: t.card2sub, titleEN: t.card2EN, subEN: t.card2subEN },
              { bg: "#D6FFE8", stroke: "#10B981", title: t.card3title, sub: t.card3sub, titleEN: t.card3EN, subEN: t.card3subEN },
            ].map((card, i) => (
              <div key={i} style={{ flex: 1, background: "white", borderRadius: "12px", padding: "10px 6px", textAlign: "center", border: `1.5px solid ${card.bg}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ fontSize: "8px", fontWeight: 600, color: "#aaa" }}>{card.titleEN}</div>
                <div style={{ fontSize: "7px", color: "#bbb" }}>{card.subEN}</div>
                <div style={{ width: "1px", height: "5px", background: card.bg }} />
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: card.stroke, animation: "pulse1 1.5s ease-in-out infinite" }} />
                </div>
                <div style={{ width: "1px", height: "5px", background: card.bg }} />
                <div style={{ fontSize: "10px", fontWeight: 700, color: card.stroke }}>{card.title}</div>
                <div style={{ fontSize: "7px", color: card.stroke, opacity: .8 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "10px", padding: "10px 12px", border: "0.5px solid #E8E8F0", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ background: "#FFE0D6", borderRadius: "8px", padding: "5px 7px", flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#FF7043" }}>YELMA</div>
                <div style={{ fontSize: "7px", color: "#993C1D" }}>{t.forYou}</div>
                <div style={{ fontSize: "7px", color: "#993C1D", fontStyle: "italic" }}>{t.forYouEN}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                {[[t.p1, t.p1EN, "#FF7043"], [t.p2, t.p2EN, "#0EA5E9"], [t.p3, t.p3EN, "#10B981"]].map(([p, pEN, c], i) => (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                      <span style={{ fontSize: "9px", color: "#1A1A2E", fontWeight: 500 }}>{p}</span>
                    </div>
                    <div style={{ paddingLeft: "10px", fontSize: "8px", color: "#aaa", fontStyle: "italic" }}>{pEN}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "10px", color: "#888", margin: "0 0 8px" }}>{t.chooseLang}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => selectLang("fr")} style={{ flex: 1, background: "#1A1A2E", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Français</button>
            <button onClick={() => selectLang("en")} style={{ flex: 1, background: "white", color: "#1A1A2E", border: "2px solid #E8E8F0", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>English</button>
          </div>
        </div>

        <a href="/pricing" style={{ position: "fixed", bottom: "20px", right: "20px", background: "#FF7043", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "11px", fontWeight: 600, textDecoration: "none", zIndex: 100 }}>✦ Commencer — 4.99$/mois</a>
        <a href="/partenaires" style={{ position: "fixed", bottom: "60px", left: "20px", background: "#0EA5E9", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "11px", fontWeight: 600, textDecoration: "none", zIndex: 100 }}>🤝 Espace partenaire</a>
        <a href="/dashboard" style={{ position: "fixed", bottom: "20px", left: "20px", background: "#1A1A2E", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "11px", fontWeight: 600, textDecoration: "none", zIndex: 100 }}>👔 Espace recruteur</a>

        <div id="yelma-popup" style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = "none"; }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "18px", width: "92%", maxWidth: "380px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A2E" }}>Tendances marché · 2026</div>
                <div style={{ fontSize: "10px", color: "#FF7043" }}>Mise à jour quotidienne · Données réelles</div>
              </div>
              <button onClick={() => { const p = document.getElementById("yelma-popup"); if (p) p.style.display = "none"; }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "14px" }}>
              {[[marketData.taux_chomage, "Chômage jeunes", "#FF7043"], [marketData.postes_tech, "Postes tech", "#10B981"], [marketData.salaire_junior, "Salaire junior", "#0EA5E9"]].map(([val, label, color], i) => (
                <div key={i} style={{ background: "#FAFBFF", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: 500, color }}>{val}</div>
                  <div style={{ fontSize: "8px", color: "#888" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>TOP COMPÉTENCES DEMANDÉES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {marketData.competences.map((c, i) => (
                  <span key={i} style={{ background: "#FFE0D6", color: "#993C1D", borderRadius: "20px", padding: "3px 8px", fontSize: "10px" }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>SECTEURS QUI RECRUTENT</div>
              {marketData.secteurs.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#1A1A2E" }}>{s.nom}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "80px", height: "5px", background: "#F1EFE8", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${s.pourcentage}%`, height: "100%", background: i === 0 ? "#FF7043" : i === 1 ? "#10B981" : "#0EA5E9", borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "10px", color: i === 0 ? "#FF7043" : i === 1 ? "#10B981" : "#0EA5E9", fontWeight: 500 }}>{s.niveau}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>TECHNOLOGIES QUI MONTENT</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {marketData.technologies.map((t, i) => (
                  <span key={i} style={{ background: "#D6F0FF", color: "#0C447C", borderRadius: "20px", padding: "3px 8px", fontSize: "10px" }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ background: "#F8F6FF", borderLeft: "3px solid #FF7043", borderRadius: "0 10px 10px 0", padding: "10px 12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888", marginBottom: "3px" }}>CONSEIL DU MOMENT</div>
              <div style={{ fontSize: "11px", color: "#1A1A2E", lineHeight: 1.6 }}>{marketData.conseil}</div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.8)} }
          @keyframes pulse1 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        `}</style>
      </div>
    );
  }

  const t = content[lang];

  if (!userInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="font-black text-3xl mb-2" style={{ color: "#1A1A2E", letterSpacing: "-1px" }}>YELMA</h1>
            <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 10px" }} />
            <p className="text-sm font-medium" style={{ color: "#1A1A2E" }}>
              {lang === "fr" ? "Avant de commencer, parlons de toi !" : "Before we start, tell us about you!"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#888" }}>
              {lang === "fr" ? "Ces infos aident YELMA à mieux cibler tes forces" : "This helps YELMA better identify your strengths"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF7043", letterSpacing: ".5px", marginBottom: "10px" }}>👤 IDENTITÉ</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Prénom *" : "First name *"}</label>
                  <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder={lang === "fr" ? "Votre prénom" : "First name"} value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Nom *" : "Last name *"}</label>
                  <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder={lang === "fr" ? "Votre nom" : "Last name"} value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Email *" : "Email *"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder="votre@email.com" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#0EA5E9", letterSpacing: ".5px", marginBottom: "10px" }}>🎓 FORMATION</div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Diplôme le plus élevé" : "Highest degree"}</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.diplome} onChange={(e) => setFormData({ ...formData, diplome: e.target.value })}>
                  <option value="">{lang === "fr" ? "Sélectionnez" : "Select"}</option>
                  <option>Doctorat (PhD)</option>
                  <option>Maîtrise / MBA</option>
                  <option>Baccalauréat</option>
                  <option>DEC / Cégep</option>
                  <option>DEP / Formation technique</option>
                  <option>Diplôme secondaire</option>
                  <option>Autodidacte / Sans diplôme</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Domaine d'études" : "Field of study"}</label>
                  <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder="ex: Finance" value={formData.domaine_etudes} onChange={(e) => setFormData({ ...formData, domaine_etudes: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Année d'obtention" : "Year"}</label>
                  <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.annee_diplome} onChange={(e) => setFormData({ ...formData, annee_diplome: e.target.value })}>
                    <option value="">{lang === "fr" ? "Année" : "Year"}</option>
                    <option>En cours</option>
                    {[2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015].map(y => <option key={y}>{y}</option>)}
                    <option>Avant 2015</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#10B981", letterSpacing: ".5px", marginBottom: "10px" }}>💼 EXPÉRIENCE</div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Rôle / Titre du poste actuel" : "Current / last job title"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder="ex: Analyste financier, Contrôleur de projet" value={formData.role_actuel} onChange={(e) => setFormData({ ...formData, role_actuel: e.target.value })} />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Domaine actuel" : "Current field"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder="ex: Finance, Technologie" value={formData.domaine_actuel} onChange={(e) => setFormData({ ...formData, domaine_actuel: e.target.value })} />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Années d'expérience professionnelle" : "Years of work experience"}</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.annee_experience} onChange={(e) => setFormData({ ...formData, annee_experience: e.target.value })}>
                  <option value="">{lang === "fr" ? "Sélectionnez" : "Select"}</option>
                  <option>Aucune</option>
                  <option>Moins de 1 an</option>
                  <option>1 à 2 ans</option>
                  <option>3 à 5 ans</option>
                  <option>6 à 10 ans</option>
                  <option>Plus de 10 ans</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Autres expériences (stage, bénévolat, job)" : "Other experience"}</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.annee_autre_experience} onChange={(e) => setFormData({ ...formData, annee_autre_experience: e.target.value })}>
                  <option value="">{lang === "fr" ? "Sélectionnez" : "Select"}</option>
                  <option>Aucune</option>
                  <option>Moins de 6 mois</option>
                  <option>6 mois à 1 an</option>
                  <option>1 à 2 ans</option>
                  <option>Plus de 2 ans</option>
                </select>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#993C1D", letterSpacing: ".5px", marginBottom: "10px" }}>🎯 OBJECTIF</div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Ville" : "City"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder="ex: Montréal, Toronto, Québec" value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Statut actuel" : "Current status"}</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.statut_emploi} onChange={(e) => setFormData({ ...formData, statut_emploi: e.target.value })}>
                  <option value="">{lang === "fr" ? "Sélectionnez" : "Select"}</option>
                  <option>En recherche d&apos;emploi active</option>
                  <option>En emploi - cherche à évoluer</option>
                  <option>Étudiant(e)</option>
                  <option>En reconversion professionnelle</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Objectif de carrière (optionnel)" : "Career goal (optional)"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder={lang === "fr" ? "ex: Devenir directeur de projet..." : "ex: Become a project manager..."} value={formData.objectif_declare} onChange={(e) => setFormData({ ...formData, objectif_declare: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-center" style={{ color: "#FF7043" }}>{formError}</p>}

            <button onClick={handleFormSubmit} disabled={formLoading} className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50" style={{ background: "#FF7043" }}>
              {formLoading ? (lang === "fr" ? "Calcul de votre profil..." : "Calculating your profile...") : (lang === "fr" ? "Commencer mon entretien YELMA →" : "Start my YELMA interview →")}
            </button>

            <div style={{ textAlign: "center", fontSize: "10px", color: "#888" }}>
              🔒 {lang === "fr" ? "Vos informations sont confidentielles et sécurisées" : "Your information is private and secure"}
            </div>

            <button onClick={() => setLang(null)} className="text-xs text-center" style={{ color: "#888", background: "none", border: "none", cursor: "pointer" }}>
              {lang === "fr" ? "← Retour" : "← Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      <div className="text-white px-6 py-4 flex-shrink-0 flex justify-between items-center" style={{ background: "#1A1A2E" }}>
        <div>
          <h1 className="text-lg font-black" style={{ letterSpacing: "-1px" }}>YELMA</h1>
          <p className="text-xs" style={{ color: "#FF7043" }}>{t.tagline}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#aaa" }}>{userInfo.prenom}</span>
          <button onClick={() => { setLang(null); setUserInfo(null); setMessages([]); setRapportGenere(false); }} className="text-xs" style={{ color: "#aaa" }}>{t.btnLang}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"}`} style={m.role === "user" ? { background: "#1A1A2E" } : {}}>
              {m.rapport ? (
                <RapportGPSComponent
                  data={m.rapport}
                  plan={userInfo?.plan || "propulse"}
                  ville={userInfo?.ville}
                  roleActuel={userInfo?.role_actuel}
                />
              ) : (
                m.text.split("\n").map((line, j) => (<span key={j}>{line}<br /></span>))
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 px-4 py-3 rounded-2xl rounded-bl-sm text-sm shadow-sm">{t.thinking}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!rapportGenere ? (
        <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <input
            className="flex-1 border rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none"
            style={{ borderColor: "#E8E8F0" }}
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: "#FF7043" }}
          >
            {t.send}
          </button>
        </div>
      ) : (
        <div className="bg-white px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <div style={{ display: "flex", gap: "8px" }}>
            <a href="/mon-espace" style={{ flex: 1, background: "#1A1A2E", color: "white", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
              📊 Accéder à mon espace →
            </a>
            <button
              onClick={() => { setRapportGenere(false); setMessages([]); setUserInfo(null); }}
              style={{ background: "#F1EFE8", color: "#888", border: "none", borderRadius: "12px", padding: "12px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              🔄 Refaire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
