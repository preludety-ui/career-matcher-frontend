"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "bot" | "user";
  text: string;
};

const content = {
  fr: {
    tagline: "Les autres évaluent, nous on révèle, oriente et améliore",
    btnLang: "🇺🇸 English",
    placeholder: "Écrivez votre réponse...",
    send: "Envoyer",
    thinking: "En train d'analyser...",
    welcome: "Bonjour ! Je suis votre assistant YELMA. Mon rôle est de vous aider à découvrir vos points forts et à trouver les opportunités qui vous correspondent le mieux. Pour commencer, pouvez-vous me parler un peu de vous et de votre situation actuelle ?",
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
    market: "MARCHÉ · CANADA · LIVE",
    seeMore: "+ voir →",
  },
  en: {
    tagline: "Others evaluate, we reveal, guide and improve",
    btnLang: "🇫🇷 Français",
    placeholder: "Write your answer...",
    send: "Send",
    thinking: "Analyzing...",
    welcome: "Hello! I am your YELMA assistant. My role is to help you discover your strengths and find the opportunities that suit you best. To start, could you tell me a little about yourself and your current situation?",
    niche: "The career platform for young talent the job market keeps overlooking",
    nicheEN: "La plateforme carrière pour les jeunes que le marché du travail oublie trop souvent",
    slogan1: "You have what it takes.",
    slogan2: "YELMA finds it — and gets you hired.",
    sloganEN: "Tu ne sais pas où tu excelles ? On le découvre ensemble — et on t'y envoie.",
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
    market: "MARKET · CANADA · LIVE",
    seeMore: "+ see more →",
  },
};

export default function Home() {
  const [lang, setLang] = useState<"fr" | "en" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectLang = (l: "fr" | "en") => {
    setLang(l);
    setMessages([{ role: "bot", text: content[l].welcome }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !lang) return;
    const newMessages: Message[] = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
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
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "bot", text: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "bot", text: lang === "fr" ? "Une erreur est survenue." : "An error occurred." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!lang) {
    const t = content.fr;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm" style={{ textAlign: "center" }}>

          {/* Icône animée */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "3px", height: "20px", margin: "0 auto 8px" }}>
            {[7, 13, 20, 13, 7].map((h, i) => (
              <div key={i} style={{ width: "4px", borderRadius: "3px", background: "#FF7043", height: `${h}px`, animation: `wave 1.1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}/>
            ))}
          </div>

          {/* Logo + niche */}
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A2E", letterSpacing: "-1px", margin: "0 0 4px" }}>YELMA</h1>
          <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 6px" }}/>
          <div style={{ display: "inline-block", background: "#FFE0D6", borderRadius: "20px", padding: "3px 12px", marginBottom: "6px" }}>
            <span style={{ fontSize: "9px", color: "#993C1D", fontWeight: 600 }}>{t.niche}</span>
          </div>
          <div style={{ fontSize: "8px", color: "#aaa", fontStyle: "italic", marginBottom: "8px" }}>{t.nicheEN}</div>

          {/* Slogan */}
          <p style={{ fontSize: "11px", color: "#2D2D44", fontWeight: 500, lineHeight: 1.6, margin: "0 0 2px" }}>
            {t.slogan1} <span style={{ color: "#FF7043", fontWeight: 700 }}>{t.slogan2}</span>
          </p>
          <p style={{ fontSize: "9px", color: "#aaa", fontStyle: "italic", margin: "0 0 10px" }}>{t.sloganEN}</p>

          {/* Stats marché */}
          <div style={{ background: "#1A1A2E", borderRadius: "10px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "8px", color: "#FF7043", fontWeight: 600 }}>{t.market}</div>
            <div style={{ display: "flex", gap: "12px" }}>
              {[["14.1%", "Chômage jeunes", "#FF7043"], ["+23%", "Postes tech", "#10B981"], ["42K$", "Salaire junior", "#0EA5E9"]].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: c }}>{v}</div>
                  <div style={{ fontSize: "7px", color: "#aaa" }}>{l}</div>
                </div>
              ))}
              <button onClick={() => document.getElementById("yelma-popup")!.style.display = "flex"} style={{ background: "#FF7043", border: "none", color: "white", fontSize: "8px", cursor: "pointer", fontWeight: 600, padding: "4px 8px", borderRadius: "6px" }}>{t.seeMore}</button>
            </div>
          </div>

          {/* 3 cartes */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {[
              { bg: "#FFE0D6", stroke: "#FF7043", title: t.card1title, sub: t.card1sub, titleEN: t.card1EN, subEN: t.card1subEN },
              { bg: "#D6F0FF", stroke: "#0EA5E9", title: t.card2title, sub: t.card2sub, titleEN: t.card2EN, subEN: t.card2subEN },
              { bg: "#D6FFE8", stroke: "#10B981", title: t.card3title, sub: t.card3sub, titleEN: t.card3EN, subEN: t.card3subEN },
            ].map((card, i) => (
              <div key={i} style={{ flex: 1, background: "white", borderRadius: "12px", padding: "10px 6px", textAlign: "center", border: `1.5px solid ${card.bg}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ fontSize: "8px", fontWeight: 600, color: "#aaa" }}>{card.titleEN}</div>
                <div style={{ fontSize: "7px", color: "#bbb" }}>{card.subEN}</div>
                <div style={{ width: "1px", height: "5px", background: card.bg }}/>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: card.stroke, animation: "pulse1 1.5s ease-in-out infinite" }}/>
                </div>
                <div style={{ width: "1px", height: "5px", background: card.bg }}/>
                <div style={{ fontSize: "10px", fontWeight: 700, color: card.stroke }}>{card.title}</div>
                <div style={{ fontSize: "7px", color: card.stroke, opacity: .8 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* YELMA c'est pour toi si */}
          <div style={{ background: "white", borderRadius: "10px", padding: "10px 12px", border: "0.5px solid var(--color-border-tertiary)", marginBottom: "8px" }}>
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
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, flexShrink: 0 }}/>
                      <span style={{ fontSize: "9px", color: "var(--color-text-primary)", fontWeight: 500 }}>{p}</span>
                    </div>
                    <div style={{ paddingLeft: "10px", fontSize: "8px", color: "#aaa", fontStyle: "italic" }}>{pEN}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Boutons langue */}
          <p style={{ fontSize: "10px", color: "#888", margin: "0 0 8px" }}>{t.chooseLang}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => selectLang("fr")} style={{ flex: 1, background: "#1A1A2E", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Français</button>
            <button onClick={() => selectLang("en")} style={{ flex: 1, background: "white", color: "#1A1A2E", border: "2px solid #E8E8F0", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>English</button>
          </div>

        </div>

        {/* POPUP */}
        <div id="yelma-popup" style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = "none"; }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "18px", width: "92%", maxWidth: "380px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A2E" }}>Tendances marché · Canada 2026</div>
                <div style={{ fontSize: "10px", color: "#FF7043" }}>Mise à jour en temps réel</div>
              </div>
              <button onClick={() => { const p = document.getElementById("yelma-popup"); if (p) p.style.display = "none"; }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            {[["Diplômé universitaire", "Bac+", "#D6F0FF", "#0C447C", [["Analyste financier junior", "48 000 $"], ["Développeur junior", "55 000 $"], ["Assistant marketing", "42 000 $"]]], ["Cégep / École technique", "Technique", "#D6FFE8", "#085041", [["Technicien informatique", "44 000 $"], ["Technicien comptabilité", "40 000 $"], ["Technicien santé", "52 000 $"]]], ["Autodidacte / Sans diplôme", "Self-taught", "#FFE0D6", "#993C1D", [["Développeur web (bootcamp)", "45 000 $"], ["Community manager", "38 000 $"], ["Assistant administratif", "36 000 $"]]]].map(([title, badge, bg, color, jobs], i) => (
              <div key={i} style={{ border: `0.5px solid ${bg}`, borderRadius: "10px", padding: "10px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: color as string }}>{title as string}</span>
                  <span style={{ background: bg as string, color: color as string, borderRadius: "20px", padding: "2px 7px", fontSize: "9px" }}>{badge as string}</span>
                </div>
                {(jobs as string[][]).map(([job, salary], j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{job}</span>
                    <span style={{ color: color as string, fontWeight: 500 }}>{salary}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ background: "#F8F6FF", borderLeft: "3px solid #FF7043", borderRadius: "0 10px 10px 0", padding: "10px 12px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "3px" }}>CONSEIL YELMA DU MOMENT</div>
              <div style={{ fontSize: "11px", color: "#1A1A2E", lineHeight: 1.6 }}>Peu importe ton niveau, les employeurs cherchent des jeunes qui utilisent l&apos;IA. Une certification IA augmente tes chances de <span style={{ fontWeight: 500, color: "#FF7043" }}>40%</span> !</div>
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
  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      <div className="text-white px-6 py-4 flex-shrink-0 flex justify-between items-center" style={{ background: "#1A1A2E" }}>
        <div>
          <h1 className="text-lg font-black" style={{ letterSpacing: "-1px" }}>YELMA</h1>
          <p className="text-xs" style={{ color: "#FF7043" }}>{t.tagline}</p>
        </div>
        <button onClick={() => setLang(null)} className="text-xs" style={{ color: "#aaa" }}>{t.btnLang}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"}`} style={m.role === "user" ? { background: "#1A1A2E" } : {}}>
              {m.text.split("\n").map((line, j) => (<span key={j}>{line}<br /></span>))}
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

      <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          className="flex-1 border rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none"
          style={{ borderColor: "#E8E8F0" }}
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading} className="text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: "#FF7043" }}>
          {t.send}
        </button>
      </div>
    </div>
  );
}
