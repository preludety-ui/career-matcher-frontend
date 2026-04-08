"use client";

import React, { useState, useEffect, useRef } from "react";
import RapportGPSComponent from "./components/RapportGPS";

type Message = {
  role: "bot" | "user";
  text: string;
  historiqueAnalyse?: { type: string; score: number; mode: string }[];
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
    statut_emploi?: string; objectif_declare?: string; ordre_professionnel_statut?: string; ordre_professionnel_nom?: string;
    salaire_min?: number; salaire_max?: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "",
    diplome: "", annee_diplome: "", domaine_etudes: "", ordre_professionnel_statut: "",
    annee_experience: "", annee_autre_experience: "", ordre_professionnel_nom: "",
    domaine_actuel: "", role_actuel: "", ville: "",
    statut_emploi: "", objectif_declare: ""
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rapportGenere, setRapportGenere] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [marketData, setMarketData] = useState<MarketData>(defaultMarket);
  const [marketLoading, setMarketLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [contactForm, setContactForm] = useState({ nom: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [demoTab, setDemoTab] = useState("resume");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get("lang") as "fr" | "en" | null;
    const free = params.get("free");
    if (l) setLang(l);
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
    if (!formData.objectif_declare.trim()) {
      setFormError(lang === "fr" ? "Veuillez indiquer votre objectif de carrière" : "Please indicate your career goal");
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
      // Sauvegarder email pour mon-espace
      localStorage.setItem("yelma_email", formData.email);
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
          historiqueAnalyse: (messages.filter(m => m.role === "bot").slice(-1)[0] as Message)?.historiqueAnalyse || [],

        }),
      });
      const data = await res.json();
      const { parseRapport } = await import("./components/RapportGPS");
      const rapport = data.rapportData || parseRapport(data.reply);
      const botMessage: Message = {
        role: "bot",
        text: data.reply,
        rapport: rapport || undefined,
        historiqueAnalyse: data.historiqueAnalyse || [],
      };
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);


      if (rapport) {
        setRapportGenere(true);
        setTimeout(() => {
          localStorage.setItem("yelma_email", userInfo?.email || "");
          window.location.href = `/mon-espace?email=${encodeURIComponent(userInfo?.email || "")}&tab=rapport`;
        }, 8000);
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
    if (userInfo) {
      setShowWelcomePopup(true);
    }
  }, [userInfo]);

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

          {/* Logo animé */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "3px", height: "20px", margin: "0 auto 8px" }}>
            {[7, 13, 20, 13, 7].map((h, i) => (
              <div key={i} style={{ width: "4px", borderRadius: "3px", background: "#FF7043", height: `${h}px`, animation: `wave 1.1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A2E", letterSpacing: "-1px", margin: "0 0 4px" }}>YELMA</h1>
          <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 10px" }} />

          <div style={{ display: "inline-block", background: "#FFE0D6", borderRadius: "20px", padding: "3px 12px", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", color: "#993C1D", fontWeight: 600 }}>La plateforme carrière pour les jeunes que le marché du travail oublie trop souvent</span>
          </div>

          <p style={{ fontSize: "13px", color: "#2D2D44", fontWeight: 500, lineHeight: 1.6, margin: "0 0 16px" }}>
            Tu ne sais pas où tu excelles ? <span style={{ color: "#FF7043", fontWeight: 700 }}>On le découvre ensemble — et on t'y envoie.</span>
          </p>

          {/* Marché live */}
          <div style={{ background: "#1A1A2E", borderRadius: "10px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "8px", color: "#FF7043", fontWeight: 600 }}>MARCHÉ · LIVE 🔴</div>
            <div style={{ display: "flex", gap: "12px" }}>
              {[[marketData.taux_chomage, "Chômage jeunes", "#FF7043"], [marketData.postes_tech, "Postes tech", "#10B981"], [marketData.salaire_junior, "Salaire junior", "#0EA5E9"]].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: c as string }}>{v}</div>
                  <div style={{ fontSize: "7px", color: "#aaa" }}>{l}</div>
                </div>
              ))}
              <button onClick={() => { const p = document.getElementById("yelma-popup"); if (p) p.style.display = "flex"; }} style={{ background: "#FF7043", border: "none", color: "white", fontSize: "8px", cursor: "pointer", fontWeight: 600, padding: "4px 8px", borderRadius: "6px" }}>+ voir →</button>
            </div>
          </div>

          {/* 3 cartes */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {[
              { bg: "#FFE0D6", stroke: "#FF7043", title: "RÉVÈLE", sub: "vos forces cachées" },
              { bg: "#D6F0FF", stroke: "#0EA5E9", title: "ORIENTE", sub: "où vous êtes imbattable" },
              { bg: "#D6FFE8", stroke: "#10B981", title: "AMÉLIORE", sub: "vos compétences" },
            ].map((card, i) => (
              <div key={i} style={{ flex: 1, background: "white", borderRadius: "12px", padding: "10px 6px", textAlign: "center", border: `1.5px solid ${card.bg}` }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: card.stroke, animation: "pulse1 1.5s ease-in-out infinite" }} />
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: card.stroke }}>{card.title}</div>
                <div style={{ fontSize: "7px", color: card.stroke, opacity: .8 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Comment ça marche */}
          <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0", marginBottom: "12px", textAlign: "left" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#888", marginBottom: "12px", textAlign: "center" }}>COMMENT ÇA MARCHE</div>
            {[
              { num: "1", titre: "Tu passes l'entretien YELMA", desc: "8 questions, 5 minutes. L'IA analyse tes forces cachées.", couleur: "#FF7043" },
              { num: "2", titre: "Tu reçois ton Rapport GPS", desc: "Score Propulse, forces révélées, plan de carrière sur 5 ans.", couleur: "#0EA5E9" },
              { num: "3", titre: "Tu passes à l'action", desc: "Offres ciblées, CV personnalisé, lettre générée par l'IA.", couleur: "#10B981" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 2 ? "10px" : 0 }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step.couleur, color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step.num}</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1A2E" }}>{step.titre}</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Témoignage mini */}
          <div style={{ background: "white", borderRadius: "12px", padding: "14px", border: "0.5px solid #E8E8F0", marginBottom: "12px", textAlign: "left", borderLeft: "4px solid #FF7043" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>💬 ILS ONT ESSAYÉ YELMA</div>
            <p style={{ fontSize: "12px", color: "#444", fontStyle: "italic", lineHeight: 1.6, margin: "0 0 8px" }}>
              &ldquo;J'avais postulé 34 fois sans réponse. Après YELMA, j'ai compris mes vraies forces. 3 semaines après, j'avais une offre.&rdquo;
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "10px", color: "#888" }}>— Karima B., Montréal · Score 74</div>
              <a href="/temoignages" style={{ fontSize: "10px", color: "#FF7043", fontWeight: 600, textDecoration: "none" }}>Voir tous les témoignages →</a>
            </div>
          </div>
          {/* Lien À propos */}
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <a href="/a-propos" style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 600, textDecoration: "none", background: "#F1EFE8", borderRadius: "20px", padding: "8px 16px" }}>
              En savoir plus sur YELMA →
            </a>
          </div>
          {/* Pour toi si */}
          <div style={{ background: "white", borderRadius: "10px", padding: "10px 12px", border: "0.5px solid #E8E8F0", marginBottom: "16px", textAlign: "left" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF7043", marginBottom: "8px" }}>YELMA C'EST POUR TOI SI...</div>
            {[
              ["Tu finis tes études et tu ne sais pas par où commencer", "#FF7043"],
              ["Tu postules partout sans résultats", "#0EA5E9"],
              ["Tu veux savoir exactement quoi améliorer pour décrocher un emploi", "#10B981"],
              ["Tu as 30+ ans et tu veux changer de métier sans repartir à zéro", "#993C1D"],
              ["Tu es autodidacte ou sans diplôme et le marché ne te donne pas ta chance", "#FF7043"],
            ].map(([p, c], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: i < 2 ? "6px" : 0 }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "#1A1A2E" }}>{p}</span>
              </div>
            ))}
          </div>

          {/* Boutons langue */}
          {/* Accès rapide — visible sur mobile */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <a href="/mon-espace" style={{ flex: 1, background: "#FF7043", color: "white", borderRadius: "12px", padding: "10px", fontSize: "12px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>🎯 Espace candidat</a>
            <a href="/dashboard" style={{ flex: 1, background: "#1A1A2E", color: "white", borderRadius: "12px", padding: "10px", fontSize: "12px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>👔 Espace recruteur</a>
          </div>

          {/* DÉMO INTERACTIVE */}
          <div style={{ background: "#1A1A2E", borderRadius: "16px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF7043", letterSpacing: "2px", marginBottom: "10px", textAlign: "center" }}>
              EXEMPLE RÉEL — AMINA, PRÉPOSÉE AUX BÉNÉFICIAIRES
            </div>

            {/* Header candidat */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>Amina Traoré</div>
                <div style={{ fontSize: "10px", color: "#aaa" }}>Préposée aux bénéficiaires · Montréal</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#FF7043", lineHeight: 1 }}>79</div>
                <div style={{ fontSize: "9px", color: "#aaa" }}>SCORE PROPULSE</div>
              </div>
            </div>

            {/* Tabs */}
            {(() => {
              
              return (
                <>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "10px", overflowX: "auto" }}>
                    {[
                      { id: "resume", label: "Résumé" },
                      { id: "forces", label: "Forces" },
                      { id: "gps", label: "GPS" },
                      { id: "marche", label: "Marché" },
                      { id: "action", label: "Action" },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setDemoTab(tab.id)} style={{ padding: "5px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: "none", whiteSpace: "nowrap", background: demoTab === tab.id ? "#FF7043" : "rgba(255,255,255,0.1)", color: demoTab === tab.id ? "white" : "#aaa" }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Résumé */}
                  {demoTab === "resume" && (
                    <img src="/demo-resume.png" alt="Résumé Amina" style={{ width: "100%", borderRadius: "12px" }} />
                  )}

                  {/* Forces */}
                  {demoTab === "forces" && (
                    <img src="/demo-forces.png" alt="Forces Amina" style={{ width: "100%", borderRadius: "12px" }} />
                  )}

                  {/* GPS */}
                  {demoTab === "gps" && (
                    <img src="/demo-gps.png" alt="GPS Amina" style={{ width: "100%", borderRadius: "12px" }} />
                  )}

                  {/* Marché */}
                  {demoTab === "marche" && (
                    <img src="/demo-marche.png" alt="Marché Amina" style={{ width: "100%", borderRadius: "12px" }} />
                  )}

                  {/* Action */}
                  {demoTab === "action" && (
                    <img src="/demo-action.png" alt="Action Amina" style={{ width: "100%", borderRadius: "12px" }} />
                  )}
                </>
              );
            })()}


            <div style={{ background: "#FF7043", borderRadius: "12px", padding: "12px", textAlign: "center", marginTop: "10px", cursor: "pointer" }} onClick={() => selectLang("fr")}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Commencer gratuitement →</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>2 semaines gratuites · Pas de carte de crédit</div>
            </div>
          </div>
          <p style={{ fontSize: "10px", color: "#888", margin: "0 0 8px" }}>Choisissez votre langue / Choose your language</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => selectLang("fr")} style={{ flex: 1, background: "#1A1A2E", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Français</button>
            <button onClick={() => selectLang("en")} style={{ flex: 1, background: "white", color: "#1A1A2E", border: "2px solid #E8E8F0", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>English</button>
          </div>
        </div >

        {/* Boutons flottants — simplifiés */}
        {/* Boutons flottants — cachés sur mobile */}
        <a href="/pricing" style={{ position: "fixed", bottom: "20px", right: "20px", background: "#FF7043", color: "white", borderRadius: "20px", padding: "8px 16px", fontSize: "11px", fontWeight: 600, textDecoration: "none", zIndex: 100 }}>✦ Commencer gratuitement</a>
        {/* Bouton Support */}
        <button
          onClick={() => setShowContactPopup(true)}
          style={{ position: "fixed", bottom: "60px", right: "20px", background: "white", color: "#1A1A2E", border: "1px solid #E8E8F0", borderRadius: "20px", padding: "8px 16px", fontSize: "11px", fontWeight: 600, zIndex: 100, cursor: "pointer" }}
        >
          💬 Support
        </button>

        {/* Popup Contact */}
        {
          showContactPopup && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "380px", width: "100%", position: "relative" }}>
                <button onClick={() => { setShowContactPopup(false); setContactSent(false); setContactForm({ nom: "", email: "", message: "" }); }} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>×</button>

                <div style={{ fontSize: "20px", textAlign: "center", marginBottom: "8px" }}>💬</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A2E", marginBottom: "4px", textAlign: "center" }}>Contactez-nous</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px", textAlign: "center" }}>Notre équipe vous répond sous 24h</div>

                {contactSent ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A2E", marginBottom: "8px" }}>Message envoyé !</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>Nous vous répondrons sous 24h.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#1A1A2E", display: "block", marginBottom: "4px" }}>Votre nom</label>
                      <input value={contactForm.nom} onChange={e => setContactForm({ ...contactForm, nom: e.target.value })} placeholder="Prénom Nom" style={{ width: "100%", border: "1px solid #E8E8F0", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#1A1A2E", display: "block", marginBottom: "4px" }}>Votre email</label>
                      <input value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="votre@email.com" type="email" style={{ width: "100%", border: "1px solid #E8E8F0", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#1A1A2E", display: "block", marginBottom: "4px" }}>Votre message</label>
                      <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Décrivez votre problème..." rows={4} style={{ width: "100%", border: "1px solid #E8E8F0", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", boxSizing: "border-box", resize: "none" }} />
                    </div>
                    <button
                      onClick={async () => {
                        if (!contactForm.nom || !contactForm.email || !contactForm.message) return;
                        setContactLoading(true);
                        try {
                          await fetch("/api/contact", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(contactForm),
                          });
                          setContactSent(true);
                        } catch { console.error("Erreur envoi contact"); }
                        finally { setContactLoading(false); }
                      }}
                      disabled={contactLoading}
                      style={{ background: "#FF7043", color: "white", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", opacity: contactLoading ? 0.7 : 1 }}
                    >
                      {contactLoading ? "Envoi en cours..." : "Envoyer le message →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }
        {/* Popup marché — inchangé */}
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
                  <div style={{ fontSize: "16px", fontWeight: 500, color: color as string }}>{val}</div>
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
            <div style={{ background: "#F8F6FF", borderLeft: "3px solid #FF7043", borderRadius: "0 10px 10px 0", padding: "10px 12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888", marginBottom: "3px" }}>CONSEIL DU MOMENT</div>
              <div style={{ fontSize: "11px", color: "#1A1A2E", lineHeight: 1.6 }}>{marketData.conseil}</div>
            </div>
          </div>
        </div>

        <style>{`
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.8)} }
        @keyframes pulse1 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @media (max-width: 640px) { .hidden-mobile { display: none !important; } }
      `}</style>
      </div >
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
                    {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => <option key={y}>{y}</option>)}
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
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Objectif de carrière *" : "Career goal (optional)"}</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ borderColor: "#E8E8F0" }} placeholder={lang === "fr" ? "ex: Devenir gestionnaire de projet, infirmière praticienne..." : "ex: ex: Become a nurse practitioner, project manager..."} value={formData.objectif_declare} onChange={(e) => setFormData({ ...formData, objectif_declare: e.target.value })} />
              </div>

              <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Membre d'un ordre professionnel ?" : "Member of a professional order?"}</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.ordre_professionnel_statut} onChange={(e) => setFormData({ ...formData, ordre_professionnel_statut: e.target.value })}>
                <option value="">{lang === "fr" ? "Sélectionnez" : "Select"}</option>
                <option value="non">Non</option>
                <option value="en_cours">En cours d&apos;admission</option>
                <option value="membre_actif">Oui — membre actif</option>
              </select>
            </div>
            {formData.ordre_professionnel_statut && formData.ordre_professionnel_statut !== "non" && (
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#1A1A2E" }}>{lang === "fr" ? "Quel ordre professionnel ?" : "Which professional order?"}</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" style={{ borderColor: "#E8E8F0" }} value={formData.ordre_professionnel_nom} onChange={(e) => setFormData({ ...formData, ordre_professionnel_nom: e.target.value })}>
                  <option value="">Sélectionnez</option>
                  <option>OIIQ — Infirmières et Infirmiers</option>
                  <option>CMQ — Collège des médecins</option>
                  <option>OIQ — Ingénieurs</option>
                  <option>CPA Québec — Comptables</option>
                  <option>Barreau du Québec — Avocats</option>
                  <option>OAQ — Architectes</option>
                  <option>OMVQ — Médecins vétérinaires</option>
                  <option>Chambre des notaires</option>
                  <option>OPQ — Psychologues</option>
                  <option>ODQ — Dentistes</option>
                  <option>OOQ — Optométristes</option>
                  <option>OOAQ — Orthophonistes</option>
                  <option>OEQ — Ergothérapeutes</option>
                  <option>OTSTCFQ — Travailleurs sociaux</option>
                  <option>Transport Canada — Pilotes</option>
                  <option>MEQ — Brevet enseignement</option>
                  <option>Autre</option>
                </select>
              </div>
            )}

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
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>

      {/* POPUP BIENVENUE */}
      {showWelcomePopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "380px", width: "100%", position: "relative" }}>
            <button
              onClick={() => setShowWelcomePopup(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}
            >×</button>
            <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>🎯</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A2E", marginBottom: "16px", textAlign: "center" }}>
              Bienvenue dans votre entretien YELMA
            </div>
            <div style={{ background: "#F1EFE8", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "10px" }}>📊 VOS DROITS D'ENTRETIEN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#1A1A2E" }}>🎁 Période d'essai (2 semaines)</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#FF7043" }}>1 entretien</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#1A1A2E" }}>🔓 Plan Découverte</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#888" }}>1/mois</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#1A1A2E" }}>⭐ Plan Propulse</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#10B981" }}>2/mois</span>
                </div>
              </div>
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: "12px", padding: "14px", marginBottom: "16px", borderLeft: "4px solid #FF7043" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF7043", marginBottom: "6px" }}>💡 CONSEIL POUR UN MEILLEUR RAPPORT</div>
              <div style={{ fontSize: "11px", color: "#444", lineHeight: 1.7 }}>
                Répondez avec des <strong>exemples concrets</strong> — une situation réelle, une action que vous avez prise, un résultat obtenu. Plus vous êtes précis, plus YELMA révèle vos vraies forces.
              </div>
            </div>
            <button
              onClick={() => setShowWelcomePopup(false)}
              style={{ width: "100%", background: "#FF7043", color: "white", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              J'ai compris — Commencer mon entretien →
            </button>
          </div>
        </div>
      )}

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
                  email={userInfo?.email}
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
            <a href={`/mon-espace?email=${encodeURIComponent(userInfo?.email || "")}&tab=offres`}
              onClick={() => localStorage.setItem("yelma_email", userInfo?.email || "")} style={{ flex: 1, background: "#1A1A2E", color: "white", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
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
