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
  },
  en: {
    tagline: "Others evaluate, we reveal, guide and improve",
    btnLang: "🇫🇷 Français",
    placeholder: "Write your answer...",
    send: "Send",
    thinking: "Analyzing...",
    welcome: "Hello! I am your YELMA assistant. My role is to help you discover your strengths and find the opportunities that suit you best. To start, could you tell me a little about yourself and your current situation?",
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#FAFBFF" }}>
        <div className="w-full max-w-sm text-center">

          {/* Icône animée */}
          <div className="flex justify-center items-end gap-1 mb-4" style={{ height: "32px" }}>
            {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
              <div key={i} style={{
                width: "5px",
                borderRadius: "4px",
                background: "#FF7043",
                height: `${[12, 20, 28, 20, 12][i]}px`,
                animation: `wave 1.1s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}/>
            ))}
          </div>

          {/* Logo */}
          <h1 className="font-black tracking-tight mb-2" style={{ fontSize: "56px", color: "#1A1A2E", letterSpacing: "-2px" }}>
            YELMA
          </h1>
          <div style={{ width: "36px", height: "3px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 20px" }}/>

          {/* Slogan */}
          <p className="mb-1" style={{ fontSize: "15px", color: "#2D2D44", fontWeight: 500, lineHeight: 1.6 }}>
            Les autres évaluent,{" "}
            <span style={{ color: "#FF7043", fontWeight: 700 }}>nous on révèle, oriente et améliore</span>
          </p>
          <p className="mb-8" style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic" }}>
            Others evaluate, we reveal, guide and improve
          </p>

          {/* Boutons langue */}
          <p className="mb-4" style={{ fontSize: "13px", color: "#888" }}>
            Choisissez votre langue / Choose your language
          </p>
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => selectLang("fr")}
              className="flex-1 font-bold text-white py-4 rounded-2xl text-base transition-transform hover:-translate-y-1"
              style={{ background: "#1A1A2E", border: "none", cursor: "pointer" }}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => selectLang("en")}
              className="flex-1 font-bold py-4 rounded-2xl text-base transition-transform hover:-translate-y-1"
              style={{ background: "white", color: "#1A1A2E", border: "2px solid #E8E8F0", cursor: "pointer" }}
            >
              🇺🇸 English
            </button>
          </div>

          {/* 3 cartes */}
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-2xl p-3 text-center" style={{ border: "1.5px solid #FFE0D6" }}>
              <div className="flex justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="10" fill="none" stroke="#FFE0D6" strokeWidth="3"/>
                  <circle cx="14" cy="14" r="10" fill="none" stroke="#FF7043" strokeWidth="3" strokeDasharray="20 44" style={{ animation: "rotate 2s linear infinite", transformOrigin: "center" }}/>
                  <circle cx="14" cy="14" r="4" fill="#FF7043" style={{ animation: "pulse1 1.5s ease-in-out infinite" }}/>
                </svg>
              </div>
              <div style={{ fontSize: "11px", color: "#FF7043", fontWeight: 700 }}>Révèle</div>
              <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>vos forces</div>
            </div>

            <div className="flex-1 bg-white rounded-2xl p-3 text-center" style={{ border: "1.5px solid #D6F0FF" }}>
              <div className="flex justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#D6F0FF" strokeWidth="2"/>
                  <path d="M14 6 L18 14 L14 22 L10 14 Z" fill="#0EA5E9" style={{ animation: "bounce 1.5s ease-in-out infinite" }}/>
                </svg>
              </div>
              <div style={{ fontSize: "11px", color: "#0EA5E9", fontWeight: 700 }}>Oriente</div>
              <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>vers les postes</div>
            </div>

            <div className="flex-1 bg-white rounded-2xl p-3 text-center" style={{ border: "1.5px solid #D6FFE8" }}>
              <div className="flex justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <rect x="4" y="18" width="4" height="6" rx="2" fill="#D6FFE8"/>
                  <rect x="12" y="12" width="4" height="12" rx="2" fill="#10B981" style={{ animation: "pulse2 1.3s ease-in-out infinite", animationDelay: "0.2s" }}/>
                  <rect x="20" y="6" width="4" height="18" rx="2" fill="#10B981" style={{ animation: "pulse3 1.3s ease-in-out infinite", animationDelay: "0.4s" }}/>
                </svg>
              </div>
              <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>Améliore</div>
              <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>avec formations</div>
            </div>
          </div>

        </div>

        <style>{`
          @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.8)} }
          @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes pulse1 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
          @keyframes pulse2 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.3)} }
          @keyframes pulse3 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.3)} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
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
        <button onClick={() => setLang(null)} className="text-xs" style={{ color: "#aaa" }}>
          {t.btnLang}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user" ? "text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
            }`} style={m.role === "user" ? { background: "#1A1A2E" } : {}}>
              {m.text.split("\n").map((line, j) => (
                <span key={j}>{line}<br /></span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 px-4 py-3 rounded-2xl rounded-bl-sm text-sm shadow-sm">
              {t.thinking}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none"
          style={{ borderColor: "#E8E8F0" }}
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: "#FF7043" }}
        >
          {t.send}
        </button>
      </div>
    </div>
  );
}
