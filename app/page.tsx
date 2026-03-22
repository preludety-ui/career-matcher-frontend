"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  role: "bot" | "user";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Bonjour ! Je suis votre assistant carrière. Mon rôle est de vous aider à découvrir vos points forts et à trouver les opportunités qui vous correspondent le mieux. Pour commencer, pouvez-vous me parler un peu de vous et de votre situation actuelle ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", text: input },
    ];
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
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "bot", text: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "bot", text: "Une erreur est survenue. Veuillez réessayer." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{height: '100dvh'}}>
      
      {/* Header fixe en haut */}
      <div className="bg-blue-600 text-white px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-semibold">Assistant Carrière</h1>
        <p className="text-blue-100 text-sm">Découvrez vos 3 compétences clés</p>
      </div>

      {/* Zone messages qui prend tout l'espace disponible */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.text.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 px-4 py-3 rounded-2xl rounded-bl-sm text-sm shadow-sm">
              En train d'analyser...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fixe en bas */}
      <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          placeholder="Écrivez votre réponse..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>

    </div>
  );
}
```

Sauvegardez avec **`Ctrl+S`** puis envoyez sur Vercel avec ces commandes dans le terminal :
```
git add .
git commit -m "correction affichage mobile"
git push