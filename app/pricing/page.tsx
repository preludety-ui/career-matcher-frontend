"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const lang = searchParams?.get("lang") || "fr";

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Erreur paiement:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "#FAFBFF" }}>
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-black text-3xl mb-1" style={{ color: "#1A1A2E", letterSpacing: "-1px" }}>YELMA</h1>
          <p className="text-sm" style={{ color: "#FF7043" }}>Choisissez votre plan / Choose your plan</p>
        </div>

        {/* 3 plans côte à côte */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", alignItems: "start" }}>

          {/* Plan Gratuit */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "0.5px solid #E8E8F0" }}>
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: "#888" }}>DÉCOUVERTE</div>
              <div className="text-3xl font-medium" style={{ color: "#1A1A2E" }}>0 $</div>
              <div className="text-xs mt-1" style={{ color: "#888" }}>Pour toujours</div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {["1 entretien par mois", "3 forces révélées", "3 opportunités", "GPS Année 1"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#444" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#10B981" }}></div>{f}
                </div>
              ))}
              {["GPS complet 5 ans", "Profil sauvegardé", "Mise à jour compétences"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#bbb" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#ddd" }}></div>{f}
                </div>
              ))}
            </div>
            <button onClick={() => router.push(`/?lang=${lang}&free=true`)} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "#F1EFE8", color: "#5F5E5A" }}>
              Commencer gratuitement
            </button>
          </div>

          {/* Plan Mensuel */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "2px solid #FF7043", position: "relative" }}>
            <div className="absolute text-xs font-medium text-white px-3 py-1 rounded-full" style={{ background: "#FF7043", top: "-12px", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
              Le plus populaire
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: "#FF7043" }}>PROPULSE</div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-medium" style={{ color: "#1A1A2E" }}>4.99 $</div>
                <div className="text-xs" style={{ color: "#888" }}>/mois</div>
              </div>
              <div className="text-xs mt-1" style={{ color: "#888" }}>Moins qu'un café/semaine</div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {["Entretiens illimités", "GPS complet 5 ans", "Jalons détaillés", "Profil sauvegardé", "Mise à jour compétences", "Suivi progression", "Accès prioritaire"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#444" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#FF7043" }}></div>{f}
                </div>
              ))}
            </div>
            <button onClick={() => handleSubscribe("monthly")} disabled={loading === "monthly"} className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: "#FF7043" }}>
              {loading === "monthly" ? "..." : "S'abonner — 4.99 $/mois"}
            </button>
          </div>

          {/* Plan Annuel */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "0.5px solid #E8E8F0" }}>
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: "#888" }}>PROPULSE ANNUEL</div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-medium" style={{ color: "#1A1A2E" }}>39.99 $</div>
                <div className="text-xs" style={{ color: "#888" }}>/an</div>
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: "#10B981" }}>Économise 20$ — 3.33$/mois</div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {["Tout Propulse inclus", "2 mois offerts", "Accompagnement 12 mois"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#444" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#10B981" }}></div>{f}
                </div>
              ))}
            </div>
            <button onClick={() => handleSubscribe("annual")} disabled={loading === "annual"} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ background: "#1A1A2E", color: "white" }}>
              {loading === "annual" ? "..." : "S'abonner — 39.99 $/an"}
            </button>
          </div>

        </div>

        {/* Note sécurité */}
        <div className="text-center mt-6 text-xs" style={{ color: "#888", lineHeight: 1.6 }}>
          Paiement sécurisé par Stripe 🔒 · Carte, débit, Apple Pay, Google Pay · Annulation à tout moment
        </div>

        <div className="text-center mt-3">
          <button onClick={() => router.push("/")} className="text-xs" style={{ color: "#FF7043", background: "none", border: "none", cursor: "pointer" }}>
            ← Retour à l'accueil
          </button>
        </div>

      </div>
    </div>
  );
}
