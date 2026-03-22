"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "bot" | "user";
  text: string;
};

const content = {
  fr: {
    tagline: "Les autres évaluent, nous on révèle, oriente et améliore",
    btnLang: "English",
    placeholder: "Écrivez votre réponse...",
    send: "Envoyer",
    thinking: "En train d'analyser...",
    welcome: "Bonjour ! Je suis votre assistant YELMA. Mon rôle est de vous aider à découvrir vos points forts et à trouver les opportunités qui vous correspondent le mieux. Pour commencer, pouvez-vous me parler un peu de vous et de votre situation actuelle ?",
  },
  en: {
    tagline: "Others evaluate, we reveal, guide and improve",
    btnLang: "Français",
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

  // Page d'accueil
  if (!lang) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md text-center">
          
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-blue-600 tracking-tight">YELMA</h1>
            <div className="h-1 w-24 bg-blue-600 mx-auto mt-3 rounded-full"></div>
          </div>

          {/* Slogan */}
          <div className="mb-12">
            <p className="text-gray-600 text-base leading-relaxed">
              Les autres évaluent,{" "}
              <span className="text-blue-600 font-medium">nous on révèle, oriente et améliore</span>
            </p>
            <p className="text-gray-400 text-sm mt-2 italic">
              Others evaluate, we reveal, guide and improve
            </p>
          </div>

          {/* Boutons langue */}
          <p className="text-gray-500 text-sm mb-6">Choisissez votre langue / Choose your language</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => selectLang("fr")}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => selectLang("en")}
              className="flex-1 bg-gray-800 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-gray-900 transition-colors"
            >
              🇬🇧 English
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Page chat
  const t = content[lang];
  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">YELMA</h1>
          <p className="text-blue-100 text-xs">{t.tagline}</p>
        </div>
        <button
          onClick={() => setLang(null)}
          className="text-blue-200 text-xs hover:text-white"
        >
          {t.btnLang}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
            }`}>
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

      {/* Input */}
      <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {t.send}
        </button>
      </div>

    </div>
  );
}
