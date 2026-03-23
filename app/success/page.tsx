"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/?lang=fr&free=true");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#FAFBFF" }}>
      <div className="w-full max-w-md text-center">

        {/* Icône succès */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#D6FFE8" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20 L16 28 L32 12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Logo */}
        <h1 className="font-black text-3xl mb-2" style={{ color: "#1A1A2E", letterSpacing: "-1px" }}>YELMA</h1>
        <div style={{ width: "28px", height: "2px", background: "#FF7043", borderRadius: "4px", margin: "0 auto 20px" }}></div>

        {/* Message succès */}
        <div className="bg-white rounded-2xl p-8 mb-6" style={{ border: "1.5px solid #9FE1CB" }}>
          <div className="text-2xl font-bold mb-2" style={{ color: "#085041" }}>
            Bienvenue dans YELMA Propulse ! 🚀
          </div>
          <div className="text-sm mb-1" style={{ color: "#0F6E56" }}>
            Welcome to YELMA Propulse!
          </div>
          <div className="text-sm mt-4 mb-2" style={{ color: "#444", lineHeight: 1.6 }}>
            Votre abonnement est actif. Vous avez maintenant accès à toutes les fonctionnalités YELMA — GPS de carrière complet, entretiens illimités et suivi de progression.
          </div>
          <div className="text-xs mt-4 p-3 rounded-xl" style={{ background: "#F0FFF4", color: "#085041" }}>
            Redirection automatique dans <strong>{countdown}</strong> seconde{countdown > 1 ? "s" : ""}...
          </div>
        </div>

        {/* Boutons */}
        <button
          onClick={() => router.push("/?lang=fr&free=true")}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-3"
          style={{ background: "#FF7043" }}
        >
          Commencer mon entretien YELMA maintenant →
        </button>

        <button
          onClick={() => router.push("/?lang=en&free=true")}
          className="w-full py-4 rounded-2xl text-sm font-bold mb-3"
          style={{ background: "white", color: "#1A1A2E", border: "2px solid #E8E8F0" }}
        >
          Start my YELMA interview now →
        </button>

      </div>
    </div>
  );
}

