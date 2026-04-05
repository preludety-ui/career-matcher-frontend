"use client";

import { useEffect, useRef, useState } from "react";

type GPS = { titre: string; salaire: number; action: string };
type Opportunite = { titre: string; salaire: number; description: string };
type Formation = { nom: string; type: string; plateforme: string; duree: string; url?: string; pourquoi?: string; urgent?: boolean; pts?: number };
type Certification = { nom: string; organisme: string };

type RapportData = {
  force1?: string; force1_desc?: string;
  force2?: string; force2_desc?: string;
  force3?: string; force3_desc?: string;
  salaire_min?: number; salaire_max?: number;
  role_actuel?: string; ville?: string;
  objectif_carriere?: string; scenario_objectif?: number;
  message_objectif?: string; delai_objectif?: string;
  axe1?: string; axe1_desc?: string;
  axe2?: string; axe2_desc?: string;
  analyse_comparative?: string;
  opportunites?: Opportunite[];
  gps_an1?: GPS; gps_an2?: GPS; gps_an3?: GPS; gps_an4?: GPS; gps_an5?: GPS;
  formations?: Formation[];
  certifications?: Certification[];
  message_final?: string;
  score_propulse?: number;
  score_cible_pct?: number;
  score_cible_5ans_pct?: number;
  verdict?: string;
  message_analyse?: string;
  prenom?: string;
  nom?: string;
  score_marche?: number;
  marche_details?: unknown;
  domaine_actuel?: string;
  diplome_max?: string;
  [key: string]: unknown;


};



type TendanceData = {
  annees: number[];
  courbe_actuel: number[];
  courbe_cible: number[];
  annee_arrivee: number;
  poste_actuel: string;
  poste_cible: string;
  tendance_actuel: string;
  tendance_cible: string;
  nb_offres_actuel: number;
  nb_offres_cible: number;
};

type MarcheDetails = {
  nb_offres_estimees?: number;
  tendance?: string;
  explication?: string;
  D?: number;
  S?: number;
  T?: number;
  G?: number;
};

type ProfilLink = {
  id: string;
  url: string;
  createdAt: string;
  views: number;
  active: boolean;
  employeur?: string;
};

type CandidatureLocal = {
  id: string;
  employeur: string;
  poste: string;
  statut: 'envoyee' | 'en_attente' | 'sauvegardee' | 'entretien' | 'refus';
  match: number;
  date: string;
  deadline?: string;
  rappel?: string;
};

// ── parseRapport avec score_cible_pct corrigé ────────────────
export function parseRapport(text: string): RapportData | null {
  const isRapport =
    text.includes("TES 3 COMPÉTENCES") ||
    text.includes("COMPÉTENCES CLÉS") ||
    text.includes("GPS DE CARRIÈRE") ||
    text.includes("An 1:") ||
    text.includes("SCORE_CIBLE");
  if (!isRapport) return null;

  const forceBlocks = [...text.matchAll(/\d+\.\s+\*\*(.+?)\*\*\n(.+?)(?=\n\d+\.|\n\n|$)/g)];
  const forces = forceBlocks.slice(0, 3).map(m => ({ nom: m[1]?.trim(), desc: m[2]?.replace(/\*\*/g, "").trim() }));

  const parseGPSLines = (section: string): GPS[] => {
    const matches = [...section.matchAll(/An\s*\d\s*[:\|]\s*\*?\*?([^|\n\*]+?)\*?\*?\s*[\|]\s*([\d,\s]+)\s*[\|]\s*([^\n]+)/gi)];
    return matches.map(m => ({ titre: m[1]?.replace(/\*\*/g, "").trim() || "", salaire: parseInt(m[2]?.replace(/[^\d]/g, "") || "0"), action: m[3]?.trim() || "" })).filter(g => g.salaire > 0);
  };

  const gpsSection = text.match(/GPS DE CARRIÈRE[\s\S]+?(?=OBJECTIF:|FORMATIONS|CERTIFICATIONS|$)/i)?.[0] || "";
  const yelmaGPS = parseGPSLines(gpsSection || text);

  const oppMatches = [...text.matchAll(/\d+\.\s+\*\*([^*]+)\*\*\s*[—-]\s*([\d,\s]+)\$[^\n]*\n([^\n]+)/gi)];
  const opportunites: Opportunite[] = oppMatches.slice(0, 3).map(m => ({ titre: m[1]?.trim() || "", salaire: parseInt(m[2]?.replace(/[^\d]/g, "") || "0"), description: m[3]?.trim() || "" })).filter(o => o.salaire > 0);

  const formMatches = [...text.matchAll(/\d+\.\s+([^\|]+)\|\s*([^\|]+)\|\s*([^\|]+)\|\s*([^\n]+)/gi)];
  const formations: Formation[] = formMatches.map(m => ({ nom: m[1]?.trim() || "", type: m[2]?.trim() || "Formation", plateforme: m[3]?.trim() || "", duree: m[4]?.trim() || "" }));

  const certMatches = [...text.matchAll(/CERTIFICATIONS[\s\S]*?\n\d+\.\s+([^\|]+)\|\s*([^\n]+)/gi)];
  const certifications: Certification[] = certMatches.map(m => ({ nom: m[1]?.trim() || "", organisme: m[2]?.trim() || "" }));

  const objectifMatch = text.match(/OBJECTIF:\s*([^\n]+)/i);
  const scenarioMatch = text.match(/SCENARIO:\s*(\d)/i);
  const scoreCibleMatch = text.match(/SCORE_CIBLE:\s*(\d+)/i);
  const messageMatch = text.match(/MESSAGE_OBJECTIF:\s*([^\n]+)/i);
  const delaiMatch = text.match(/DELAI_OBJECTIF:\s*([^\n]+)/i);

  const scenarioNum = parseInt(scenarioMatch?.[1] || "3");

  // Score cible : SCORE_CIBLE direct > fallback SCENARIO > fallback salaires
  let scoreCiblePct: number;
  if (scoreCibleMatch) {
    scoreCiblePct = Math.min(100, Math.max(5, parseInt(scoreCibleMatch[1])));
  } else if (scenarioNum === 1) {
    scoreCiblePct = 65;
  } else if (scenarioNum === 2) {
    scoreCiblePct = 40;
  } else {
    scoreCiblePct = 20;
  }

  const verdict = scenarioNum === 1 ? "atteignable" : scenarioNum === 2 ? "ambitieux" : "difficile";

  if (forces.length === 0 && yelmaGPS.length === 0) return null;

  return {
    force1: forces[0]?.nom, force1_desc: forces[0]?.desc,
    force2: forces[1]?.nom, force2_desc: forces[1]?.desc,
    force3: forces[2]?.nom, force3_desc: forces[2]?.desc,
    salaire_min: yelmaGPS[0] ? Math.round(yelmaGPS[0].salaire * 0.85) : 40000,
    salaire_max: yelmaGPS[4]?.salaire || yelmaGPS[3]?.salaire || yelmaGPS[0]?.salaire || 60000,
    objectif_carriere: objectifMatch?.[1]?.trim(),
    scenario_objectif: scenarioNum,
    score_cible_pct: scoreCiblePct,
    verdict,
    message_objectif: messageMatch?.[1]?.trim(),
    delai_objectif: delaiMatch?.[1]?.trim(),
    opportunites,
    gps_an1: yelmaGPS[0], gps_an2: yelmaGPS[1],
    gps_an3: yelmaGPS[2], gps_an4: yelmaGPS[3], gps_an5: yelmaGPS[4],
    formations, certifications,
  };
}

function ensureCroissant(salaires: number[]): number[] {
  return salaires.map((val, i) => {
    if (i === 0) return val || 40000;
    const prev = salaires[i - 1];
    if (!val || val <= prev) return Math.round(prev * 1.1);
    return val;
  });
}

function getTypeIcon(type: string): string {
  const t = type?.toLowerCase() || "";
  if (t.includes("gap") || t.includes("marché")) return "🔍";
  if (t.includes("renforcement")) return "💪";
  if (t.includes("prochain") || t.includes("poste")) return "📈";
  if (t.includes("objectif")) return "🎯";
  return "📚";
}

function JaugeArc({ pct, verdict }: { pct: number; verdict: string }) {
  const radius = 52;
  const cx = 70; const cy = 70;
  const startAngle = -200;
  const sweepAngle = 220;
  const endAngle = startAngle + sweepAngle * (Math.min(100, Math.max(0, pct)) / 100);
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, r: number) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const color = verdict === 'atteignable' ? '#E05C3A' : verdict === 'ambitieux' ? '#C0842A' : '#888';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: '#888', fontWeight: 600, fontFamily: 'monospace' }}>SCORE CIBLE</div>
      <svg width="140" height="100" viewBox="0 0 140 100">
        <path d={arcPath(startAngle, startAngle + sweepAngle, radius)} fill="none" stroke="#E8E4DD" strokeWidth="6" strokeLinecap="round" />
        {pct > 0 && <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />}
        <text x="18" y="88" fontSize="8" fill="#aaa">0%</text>
        <text x="108" y="88" fontSize="8" fill="#aaa">100%</text>
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
        <text x="70" y="82" textAnchor="middle" fontSize="8" fill="#888">DE TA CIBLE</text>
      </svg>
    </div>
  );
}

function Tuile({ titre, pct, desc, onClick }: { titre: string; pct: number; desc: string; onClick?: () => void }) {
  const barColor = pct >= 70 ? '#22A06B' : pct >= 40 ? '#C0842A' : '#E05C3A';
  return (
    <div onClick={onClick} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #EDEAE3', display: 'flex', flexDirection: 'column', gap: '8px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#2C2C2C', fontWeight: 500 }}>{titre}</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: barColor }}>{pct}%</div>
      </div>
      <div style={{ height: '3px', background: '#F0EDE6', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px' }} />
      </div>
      <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>{desc}</div>
      {onClick && <div style={{ fontSize: '11px', color: '#E05C3A', fontWeight: 500 }}>Voir →</div>}
    </div>
  );
}

export default function RapportGPS({
  data, plan, ville, roleActuel, email, enEssai
}: {
  data: RapportData;
  plan: string;
  ville?: string;
  roleActuel?: string;
  email?: string;
  enEssai?: boolean;
}) {
  if (!data) return null;

  console.log('SCORE CHECK:', {
    score_propulse: data.score_propulse,
    score_cible_pct: data.score_cible_pct,
    scenario_objectif: data.scenario_objectif,
  });

  const salaire_min: number = (data.salaire_min as number) ?? 0;
  const salaire_max: number = (data.salaire_max as number) ?? 0;
  const salaire_median: number = (data as any).salaire_median ?? 0;
  const [activeTab, setActiveTab] = useState('rapport');

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartTendanceRef = useRef<HTMLCanvasElement>(null);
  const [activeSection, setActiveSection] = useState<string>('resume');
  const [conseillerInput, setConseillerInput] = useState('');
  const [conseillerMessages, setConseillerMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [conseillerLoading, setConseillerLoading] = useState(false);
  const [marcheScore, setMarcheScore] = useState<number | null>(null);
  const [marcheDetails, setMarcheDetails] = useState<MarcheDetails | null>(null);
  const [marcheLoading, setMarcheLoading] = useState(false);
  const [tendanceData, setTendanceData] = useState<TendanceData | null>(null);
  const [messageGPS, setMessageGPS] = useState<string>('');

  // ── États parcours ───────────────────────────────────────────
  const [cvMode, setCvMode] = useState<'ips' | 'coordination' | 'formation'>('ips');
  const [cvGenerating, setCvGenerating] = useState(false);
  const [cvContent, setCvContent] = useState<string | null>(null);
  const [lettreMode, setLettreMode] = useState<'offre' | 'generale'>('offre');
  const [lettreGenerating, setLettreGenerating] = useState(false);
  const [lettreContent, setLettreContent] = useState<string | null>(null);
  const [lettreOffre, setLettreOffre] = useState('');
  const [profilLinks, setProfilLinks] = useState<ProfilLink[]>([]);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);
  const [linkCreating, setLinkCreating] = useState(false);
  const [candidaturesLocales, setCandidaturesLocales] = useState<CandidatureLocal[]>([]);

  const isPropulse = plan === "propulse";
  const salaireMin = Number(data.salaire_min) || 40000;
  const salaireMax = Number(data.salaire_max) || 60000;
  const scorePropulse = Number(data.score_propulse) || 0;

  // ── Score cible : données DB en priorité, sinon parseRapport ─
  const scoreCible = (() => {
    if (data.score_cible_pct && data.score_cible_pct > 0) return data.score_cible_pct;
    const scenario = data.scenario_objectif ?? 3;
    if (scenario === 1) return 65;
    if (scenario === 2) return 40;
    return 20;
  })();

  const verdict = String(data.verdict || 'atteignable');
  const prenom = String(data.prenom || '').split(' ')[0] || '';
  const messageAnalyse = String(data.message_analyse || '').replace(/^,\s*/, prenom ? `${prenom}, ` : '');
  const nom = String(data.nom || '');
  const villeAffichee = ville || String(data.ville || 'Montréal');
  const roleAffiche = roleActuel || String(data.role_actuel || '');
  const today = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const propulseColor = verdict === 'atteignable' ? '#E05C3A' : '#C0842A';
  const GREEN = '#22A06B';
  const ORANGE = '#E05C3A';
  const GOLD = '#C0842A';
  const DARK = '#1C1C1C';
  const BG = '#F5F2EC';
  const BORDER = '#EDEAE3';
  const CARD = '#FFFFFF';

  // ── Fonctions IA ─────────────────────────────────────────────
  const chargerMessageGPS = async () => {
    if (messageGPS) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [{
            role: 'user',
            content: `Tu es le conseiller YELMA. Écris UN SEUL paragraphe court (2-3 phrases max) personnalisé pour ${prenom}:
- Poste actuel: ${roleAffiche} à ${salaireMin.toLocaleString()}$/an
- Poste cible: ${String(data.objectif_carriere)}
- Progression: An1=${data.gps_an1?.salaire?.toLocaleString()}$ → An5=${salaireMax.toLocaleString()}$
- Verdict: ${verdict} · Ville: ${villeAffichee}
Commence par "En ${new Date().getFullYear() + 5},"`,
          }],
          lang: 'fr', email,
        }),
      });
      const d = await res.json();
      if (d.reply) setMessageGPS(d.reply);
    } catch (e) { console.error('Message GPS error:', e); }
  };

  const chargerMarche = async () => {
    if (marcheScore !== null) return;
    setMarcheLoading(true);
    try {
      const res = await fetch('/api/marche-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, objectif: data.objectif_carriere, ville: villeAffichee, domaine: String(data.domaine_actuel || '') }),
      });
      const d = await res.json();
      if (d.marche) { setMarcheScore(d.marche.score_marche); setMarcheDetails(d.marche); }
    } catch (e) { console.error('Marché error:', e); }
    finally { setMarcheLoading(false); }
  };

  const chargerTendance = async () => {
    if (tendanceData) return;
    try {
      const res = await fetch('/api/market/trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poste_actuel: roleAffiche, poste_cible: String(data.objectif_carriere || ''), ville: villeAffichee, annee_arrivee: 5 }),
      });
      const d = await res.json();
      if (d.success) setTendanceData(d);
    } catch (e) { console.error('Tendance error:', e); }
  };

  const envoyerConseiller = async (messageOverride?: string) => {
    const msg = messageOverride || conseillerInput.trim();
    if (!msg) return;
    const newMessages = [...conseillerMessages, { role: 'user' as const, text: msg }];
    setConseillerMessages(newMessages);
    setConseillerInput('');
    setConseillerLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [
            { role: 'system', content: `Tu es le Conseiller YELMA. Candidat: ${prenom}. Rôle: ${roleAffiche}. Objectif: ${data.objectif_carriere}. Score PROPULSE: ${scorePropulse}. Réponds de façon courte et actionnable.` },
            ...newMessages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
          ],
          lang: 'fr', email,
        }),
      });
      const d = await res.json();
      setConseillerMessages([...newMessages, { role: 'bot', text: d.reply || "Je suis là pour t'aider!" }]);
    } catch {
      setConseillerMessages([...newMessages, { role: 'bot', text: "Une erreur est survenue. Réessaie!" }]);
    } finally { setConseillerLoading(false); }
  };

  // ── Fonctions parcours ───────────────────────────────────────
  const generateCV = async () => {
    setCvGenerating(true);
    setCvContent(null);
    try {
      const modesLabel = { ips: String(data.objectif_carriere || 'Poste cible'), coordination: 'Coordination', formation: 'Formation' };
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidat: {
            prenom, nom, titre: roleAffiche, ville: villeAffichee,
            scorePropulse, scoreMatch: scoreCible,
            competences: [
              { nom: data.force1, pct: 92, rarete: 'rare' },
              { nom: data.force2, pct: 85, rarete: 'élevée' },
              { nom: data.force3, pct: 78, rarete: 'élevée' },
            ].filter(c => c.nom),
            offres: marcheDetails?.nb_offres_estimees || 0,
            cible: String(data.objectif_carriere || ''),
          },
          mode: cvMode,
          poste: modesLabel[cvMode],
        }),
      });
      const d = await res.json();
      setCvContent(d.cv || 'Erreur de génération');
    } catch (e) { console.error(e); }
    finally { setCvGenerating(false); }
  };

  const generateLettre = async () => {
    setLettreGenerating(true);
    setLettreContent(null);
    try {
      const res = await fetch('/api/lettre/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidat: {
            prenom, nom, titre: roleAffiche, ville: villeAffichee,
            competences: [{ nom: data.force1 }, { nom: data.force2 }, { nom: data.force3 }].filter(c => c.nom),
            cible: String(data.objectif_carriere || ''),
          },
          offre: lettreMode === 'offre' ? lettreOffre : null,
          mode: lettreMode,
        }),
      });
      const d = await res.json();
      setLettreContent(d.lettre || 'Erreur de génération');
    } catch (e) { console.error(e); }
    finally { setLettreGenerating(false); }
  };

  const createProfilLink = async () => {
    setLinkCreating(true);
    try {
      const res = await fetch('/api/profil/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatId: email }),
      });
      const d = await res.json();
      if (d.link) setProfilLinks(prev => [d.link, ...prev]);
    } catch (e) { console.error(e); }
    finally { setLinkCreating(false); }
  };

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setLinkCopied(id);
    setTimeout(() => setLinkCopied(null), 2000);
  };

  const revokeLink = async (id: string) => {
    await fetch(`/api/profil/revoke-link/${id}`, { method: 'DELETE' });
    setProfilLinks(prev => prev.map(l => l.id === id ? { ...l, active: false } : l));
  };

  // ── useEffects ───────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current || activeSection !== 'gps') return;
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();
      const raw = [salaireMin, Number(data.gps_an1?.salaire) || 0, Number(data.gps_an2?.salaire) || 0, Number(data.gps_an3?.salaire) || 0, Number(data.gps_an4?.salaire) || 0, Number(data.gps_an5?.salaire) || 0];
      const yelma = ensureCroissant(raw);
      const stepLabels = ['Auj.', 'An 1', 'An 2', 'An 3', 'An 4', 'An 5'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const circlesPlugin = {
        id: 'circlesPlugin',
        afterDraw(chart: any) {
          const ctx = chart.ctx;
          const xScale = chart.scales.x;
          const yBottom = chart.scales.y.bottom;
          stepLabels.forEach((label, i) => {
            const x = xScale.getPixelForValue(i);
            const y = yBottom + 22;
            const isOrange = i === 0 || i === stepLabels.length - 1;
            ctx.beginPath(); ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fillStyle = isOrange ? '#E05C3A' : 'white'; ctx.fill();
            ctx.strokeStyle = isOrange ? '#E05C3A' : '#ddd'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = isOrange ? 'white' : '#888';
            ctx.font = '700 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
          });
        }
      };
      new Chart(chartRef.current!, {
        type: 'line', plugins: [circlesPlugin],
        data: {
          labels: stepLabels,
          datasets: [{ label: 'Trajectoire YELMA', data: yelma, borderColor: '#E05C3A', backgroundColor: 'rgba(224,92,58,0.06)', borderWidth: 2, pointBackgroundColor: yelma.map((_, i) => i === yelma.length - 1 ? '#22A06B' : '#E05C3A'), pointRadius: 5, fill: true, tension: 0.4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: { bottom: 40, left: 0, right: 30 } },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => '$' + ((ctx.parsed.y ?? 0)).toLocaleString() } } },
          scales: {
            y: { min: 0, ticks: { callback: (v) => '$' + Math.round(Number(v) / 1000) + 'k', font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { ticks: { display: false }, grid: { display: false }, border: { display: false }, offset: false },
          },
        },
      });
    };
    loadChart();
  }, [data, salaireMin, activeSection]);

  useEffect(() => {
    if (!chartTendanceRef.current || !tendanceData) return;
    const loadTendanceChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const existing = Chart.getChart(chartTendanceRef.current!);
      if (existing) existing.destroy();
      const indexArrivee = tendanceData.annees.indexOf(tendanceData.annee_arrivee);
      new Chart(chartTendanceRef.current!, {
        type: 'line',
        data: {
          labels: tendanceData.annees.map(String),
          datasets: [
            { label: tendanceData.poste_actuel, data: tendanceData.courbe_actuel, borderColor: GREEN, backgroundColor: 'rgba(34,160,107,0.06)', borderWidth: 2, pointBackgroundColor: GREEN, pointRadius: 4, fill: true, tension: 0.4 },
            { label: tendanceData.poste_cible, data: tendanceData.courbe_cible, borderColor: ORANGE, backgroundColor: 'rgba(224,92,58,0.06)', borderWidth: 2, pointBackgroundColor: tendanceData.courbe_cible.map((_, i) => i === indexArrivee ? '#FF0000' : ORANGE), pointRadius: tendanceData.courbe_cible.map((_, i) => i === indexArrivee ? 8 : 4), fill: true, tension: 0.4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label || ''}: ${ctx.parsed.y}` } } },
          scales: { y: { min: 0, max: 100, ticks: { font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } },
        },
      });
    };
    loadTendanceChart();
  }, [tendanceData, GREEN, ORANGE]);

  useEffect(() => {
    if (activeSection === 'marche') { chargerMarche(); chargerTendance(); }
    if (activeSection === 'gps') { chargerMessageGPS(); }
  }, [activeSection]);

  // Initialiser candidatures depuis les données
  useEffect(() => {
    if (data.objectif_carriere && candidaturesLocales.length === 0) {
      setCandidaturesLocales([{
        id: 'c1', employeur: 'Candidature récente', poste: String(data.objectif_carriere),
        statut: 'en_attente', match: scoreCible, date: new Date().toLocaleDateString('fr-CA'),
      }]);
    }
  }, [data.objectif_carriere]);

  const sections = [
    { id: 'resume', label: 'RÉSUMÉ' },
    { id: 'competences', label: 'COMPÉTENCES' },
    { id: 'marche', label: 'MARCHÉ' },
    { id: 'gps', label: 'GPS' },
    { id: 'formations', label: 'FORMATIONS' },
    { id: 'parcours', label: 'PARCOURS' },
    { id: 'conseiller', label: 'CONSEILLER' },
  ];

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: BG, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${BORDER}` }}>

      {/* HEADER */}
      <div style={{ background: BG, padding: '24px 24px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', marginBottom: '12px', fontFamily: 'monospace' }}>
          • YELMA · RAPPORT DE CARRIÈRE · {isPropulse ? 'PROPULSE' : 'DÉCOUVERTE'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '28px', color: DARK, fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {prenom} <span style={{ color: ORANGE, fontStyle: 'italic' }}>{nom}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', display: 'flex', gap: '12px' }}>
              <span>👤 {roleAffiche || 'Professionnel'} · {villeAffichee}</span>
              <span>🗓 {today}</span>
            </div>
          </div>
          {scorePropulse > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '52px', fontWeight: 700, color: propulseColor, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{scorePropulse}</div>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: '#888', fontFamily: 'monospace' }}>SCORE PROPULSE</div>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: BG, borderBottom: `1px solid ${BORDER}`, display: 'flex', overflowX: 'auto', padding: '0 16px' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: activeSection === s.id ? 600 : 400,
            color: activeSection === s.id ? ORANGE : '#888',
            borderBottom: activeSection === s.id ? `2px solid ${ORANGE}` : '2px solid transparent',
            whiteSpace: 'nowrap', fontFamily: 'monospace', letterSpacing: '0.5px',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px' }}>

        {/* ── RÉSUMÉ ── */}
        {activeSection === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', marginBottom: '12px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                RÉSUMÉ · L&apos;ANALYSE YELMA
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ background: CARD, borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <JaugeArc pct={scoreCible} verdict={verdict} />
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: '#888', fontFamily: 'monospace' }}>— CE QUE YELMA A VU EN TOI</div>
                  {messageAnalyse ? (
                    <div style={{ fontSize: '11px', color: DARK, lineHeight: 1.7 }}>{messageAnalyse}</div>
                  ) : (
                    <div style={{ fontSize: '11px', color: DARK, lineHeight: 1.7 }}>
                      {prenom && <span style={{ fontWeight: 500 }}>{prenom}, </span>}
                      tu possèdes des forces que{' '}
                      <span style={{ color: ORANGE, fontStyle: 'italic' }}>peu de candidats ont.</span>{' '}
                      En complétant tes formations et en comblant tes écarts, tu rejoindras{' '}
                      <span style={{ color: ORANGE, fontStyle: 'italic' }}>l&apos;élite de ton domaine —</span>{' '}
                      les professionnels que les employeurs{' '}
                      <span style={{ color: ORANGE, fontStyle: 'italic' }}>s&apos;arrachent.</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.objectif_carriere && (
                      <div style={{ background: '#FFF0EB', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '140px' }}>
                        <div style={{ fontSize: '9px', color: ORANGE, fontFamily: 'monospace' }}>⊙ {String(data.objectif_carriere)}</div>
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Ta cible déclarée</div>
                        {salaireMax > 0 && <div style={{ fontSize: '10px', color: ORANGE, fontWeight: 600 }}>· {salaireMax.toLocaleString()} $/an</div>}
                      </div>
                    )}
                    <div style={{ background: verdict === 'atteignable' ? '#F0FFF8' : '#FFF9F0', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '140px', border: `1px solid ${verdict === 'atteignable' ? '#C8EFD8' : '#F0DDB8'}` }}>
                      <div style={{ fontSize: '10px', color: verdict === 'atteignable' ? GREEN : GOLD, fontWeight: 600 }}>
                        {verdict === 'atteignable' ? '✓ Atteignable en 5 ans' : verdict === 'ambitieux' ? '○ Objectif ambitieux' : '○ Défi à long terme'}
                      </div>
                      <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Selon ton GPS YELMA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', marginBottom: '12px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                TON TABLEAU DE BORD
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <Tuile titre="Mes compétences" pct={
                  Math.round(
                    [data.force1 ? 92 : 0, data.force2 ? 85 : 0, data.force3 ? 78 : 0]
                      .filter(Boolean)
                      .reduce((a, b) => a + b, 0) /
                    ([data.force1, data.force2, data.force3].filter(Boolean).length || 1)
                  )
                } desc={`${[data.force1, data.force2, data.force3].filter(Boolean).length} forces identifiées par YELMA.`} onClick={() => setActiveSection('competences')} />
                <Tuile titre="Mes formations" pct={35} desc={`${(data.formations as Formation[] || []).length} formations clés.`} onClick={() => setActiveSection('formations')} />
                <Tuile titre="Mon parcours" pct={scorePropulse} desc="Ton parcours analysé par YELMA." onClick={() => setActiveSection('parcours')} />
                <Tuile titre={`Mon marché · ${villeAffichee}`} pct={marcheScore !== null ? marcheScore : Number(data.score_marche) || 80} desc={`${salaireMin.toLocaleString()} $ → ${salaireMax.toLocaleString()} $ en 5 ans.`} onClick={() => setActiveSection('marche')} />
                <Tuile titre="Mon GPS de carrière" pct={scoreCible} desc={`${salaireMin.toLocaleString()} $ → ${salaireMax.toLocaleString()} $ en 5 ans.`} onClick={() => setActiveSection('gps')} />
                <div onClick={() => setActiveSection('conseiller')} style={{ background: '#FDF6EE', borderRadius: '12px', padding: '16px', border: '1px solid #EDEAE3', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: DARK, fontWeight: 500 }}>Conseiller YELMA</div>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
                  </div>
                  <div style={{ height: '3px', background: '#E05C3A', borderRadius: '2px', width: '40%' }} />
                  <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.5, fontStyle: 'italic' }}>Tu as des questions ? Je suis là.</div>
                  <button style={{ background: ORANGE, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Parler à YELMA →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPÉTENCES ── */}
        {activeSection === 'competences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              TES FORCES · CE QUE YELMA A RÉVÉLÉ
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            {(data.force1 || data.force2 || data.force3) && (
              <div style={{ fontSize: '18px', color: DARK, lineHeight: 1.4 }}>
                {prenom && <span>{prenom}, </span>}tu possèdes{' '}
                <span style={{ color: ORANGE, fontStyle: 'italic' }}>{[data.force1, data.force2, data.force3].filter(Boolean).length} compétences rares</span> que le marché recherche activement.
              </div>
            )}
            {[
              { nom: data.force1, desc: data.force1_desc, num: '1', bg: '#FFF5F2', border: '#F9C5B4', badge: 'Top 10% marché', badgeBg: '#FFF0EB', badgeColor: ORANGE, niveau: 92, valeur: '+4 200 $/an', rarete: 'Élevée', rareteColor: ORANGE },
              { nom: data.force2, desc: data.force2_desc, num: '2', bg: '#F2FFF8', border: '#B8EDD0', badge: 'Très demandée', badgeBg: '#E8FFF2', badgeColor: GREEN, niveau: 85, valeur: '+2 800 $/an', rarete: 'Modérée', rareteColor: GREEN },
              { nom: data.force3, desc: data.force3_desc, num: '3', bg: '#F5F2FF', border: '#C8BFEE', badge: 'Rare', badgeBg: '#EEE8FF', badgeColor: '#7B5EA7', niveau: 78, valeur: '+3 500 $/an', rarete: 'Élevée', rareteColor: '#7B5EA7' },
            ].filter(f => f.nom).map((f, i) => (
              <div key={i} style={{ background: f.bg, borderRadius: '12px', padding: '18px', border: `1px solid ${f.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '22px', color: f.badgeColor, fontStyle: 'italic', lineHeight: 1 }}>{f.num}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: DARK }}>{String(f.nom)}</div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', lineHeight: 1.5 }}>{String(f.desc || '')}</div>
                    </div>
                  </div>
                  <div style={{ background: f.badgeBg, borderRadius: '20px', padding: '3px 10px', fontSize: '9px', color: f.badgeColor, fontWeight: 600, fontFamily: 'monospace' }}>{f.badge}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                  <div><div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>RARETÉ</div><div style={{ fontSize: '11px', color: f.rareteColor, fontWeight: 600 }}>{f.rarete}</div></div>
                  <div><div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>VALEUR MARCHÉ</div><div style={{ fontSize: '11px', color: DARK, fontWeight: 600 }}>{f.valeur}</div></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '4px' }}>Niveau</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#E8E4DD', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${f.niveau}%`, background: f.badgeColor, borderRadius: '2px' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{f.niveau}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(data.axe1 || data.axe2) && (
              <>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  AXES DE DÉVELOPPEMENT
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { axe: data.axe1, desc: data.axe1_desc, num: '01', color: ORANGE },
                    { axe: data.axe2, desc: data.axe2_desc, num: '02', color: '#7B5EA7' },
                  ].filter(a => a.axe).map((a, i) => (
                    <div key={i} style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}`, borderTop: `3px solid ${a.color}` }}>
                      <div style={{ fontSize: '22px', color: a.color, fontStyle: 'italic', marginBottom: '8px' }}>{a.num}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: DARK, marginBottom: '6px' }}>{String(a.axe)}</div>
                      <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: '10px' }}>{String(a.desc || '')}</div>
                      <button onClick={() => setActiveSection('formations')} style={{ fontSize: '11px', color: a.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>Voir les formations →</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MARCHÉ ── */}
        {activeSection === 'marche' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              MON MARCHÉ · {villeAffichee}
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            {marcheLoading && <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}`, textAlign: 'center', color: '#888', fontSize: '12px' }}>⏳ Analyse du marché en cours...</div>}
            {marcheScore !== null && marcheDetails && (
              <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>SCORE MARCHÉ</div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: marcheScore >= 70 ? GREEN : marcheScore >= 50 ? GOLD : ORANGE }}>{marcheScore}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#888' }}>{marcheDetails.nb_offres_estimees} offres estimées</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: marcheScore >= 70 ? GREEN : GOLD }}>Marché {marcheDetails.tendance}</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '12px', fontStyle: 'italic' }}>{marcheDetails.explication}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[{ label: 'Demande offres', val: marcheDetails.D || 0 }, { label: 'Attractivité salariale', val: marcheDetails.S || 0 }, { label: 'Tension métier', val: marcheDetails.T || 0 }, { label: 'Croissance secteur', val: marcheDetails.G || 0 }].map((item, i) => (
                    <div key={i} style={{ background: '#F5F2EC', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '8px', color: '#888', fontFamily: 'monospace', marginBottom: '3px' }}>{item.label.toUpperCase()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#E8E4DD', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.val}%`, background: item.val >= 70 ? GREEN : item.val >= 50 ? GOLD : ORANGE, borderRadius: '2px' }} />
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '4px' }}>💰 TA VALEUR SUR LE MARCHÉ · {roleAffiche} · {villeAffichee}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: ORANGE }}>{salaireMin.toLocaleString()} $</div>
                <div style={{ color: '#888' }}>—</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: GREEN }}>{salaireMax.toLocaleString()} $</div>
                <div style={{ fontSize: '11px', color: '#888' }}>CAD/an</div>
              </div>
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '3px' }}>Basé sur les données du marché en temps réel</div>
            </div>
            <div style={{ background: CARD, borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: ORANGE, lineHeight: 1 }}>{marcheDetails?.nb_offres_estimees || 0}</div>
                  <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.4 }}>offres actives<br />à {villeAffichee}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '6px' }}>Le marché te cherche — maintenant.</div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.6, marginBottom: '12px' }}>{marcheDetails?.nb_offres_estimees || 0} offres correspondent à ton profil à {villeAffichee}.</div>
                  <a href={`/mon-espace?tab=offres&email=${email || ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: DARK, color: 'white', borderRadius: '8px', padding: '10px 18px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                    Voir mes {marcheDetails?.nb_offres_estimees || 0} offres →
                  </a>
                </div>
              </div>
            </div>
            {tendanceData && (
              <div style={{ background: CARD, borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '20px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  TENDANCES DU MARCHÉ · 5 ANS
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>
                <div style={{ fontSize: '12px', color: DARK, lineHeight: 1.6, marginBottom: '16px' }}>
                  <strong>{prenom}</strong>, tu évolues dans <strong>{tendanceData.poste_actuel}</strong> et tu vises <strong>{tendanceData.poste_cible}</strong>. Trajectoires très différentes.
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '20px', height: '2px', background: GREEN }} /><span style={{ fontSize: '10px', color: '#555' }}>{tendanceData.poste_actuel} (actuel)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '20px', height: '2px', background: ORANGE }} /><span style={{ fontSize: '10px', color: '#555' }}>{tendanceData.poste_cible} (cible)</span></div>
                </div>
                <div style={{ position: 'relative', height: '200px', marginBottom: '16px' }}>
                  <canvas ref={chartTendanceRef} />
                  <div style={{ position: 'absolute', left: `${(tendanceData.annees.indexOf(tendanceData.annee_arrivee) / (tendanceData.annees.length - 1)) * 85 + 5}%`, top: '0', bottom: '20px', width: '1px', borderLeft: `1.5px dashed ${ORANGE}`, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '4px', fontSize: '9px', color: ORANGE, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{prenom} arrive ici</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#F5F2EC', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: GREEN }} /><span style={{ fontSize: '10px', fontWeight: 600, color: DARK }}>{tendanceData.poste_actuel}</span></div>
                    <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5 }}>Demande <strong>{tendanceData.tendance_actuel}</strong>. {tendanceData.nb_offres_actuel > 0 ? `${tendanceData.nb_offres_actuel} offres actives.` : 'Marché établi.'}</div>
                  </div>
                  <div style={{ background: '#FFF5F2', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ORANGE }} /><span style={{ fontSize: '10px', fontWeight: 600, color: DARK }}>{tendanceData.poste_cible}</span></div>
                    <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5 }}>Demande <strong>{tendanceData.tendance_cible}</strong>. {tendanceData.nb_offres_cible > 0 ? `${tendanceData.nb_offres_cible} offres actives.` : 'Secteur en expansion.'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GPS ── */}
        {activeSection === 'gps' && (
          <>
            {plan !== 'propulse' && !enEssai ? (
              <div style={{ background: "white", borderRadius: "12px", padding: "32px 20px", textAlign: "center", border: "0.5px solid #E8E8F0" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E", marginBottom: "8px" }}>GPS Complet 5 ans — Plan Propulse</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Vous voyez votre GPS Année 1 seulement.</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>Passez à Propulse pour voir votre plan complet sur 5 ans.</div>
                <a href="/pricing" style={{ display: "inline-block", background: "#FF7043", color: "white", borderRadius: "20px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                  Débloquer mon GPS 5 ans — 4.99$/mois →
                </a>
                <div style={{ marginTop: "20px", background: "#F1EFE8", borderRadius: "12px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", marginBottom: "8px" }}>📍 VOTRE GPS ANNÉE 1</div>
                  {data.gps_an1 && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E" }}>{data.gps_an1.titre}</div>
                      <div style={{ fontSize: "12px", color: "#FF7043", fontWeight: 700 }}>{data.gps_an1.salaire?.toLocaleString()} $</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{data.gps_an1.action}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    ÉVOLUTION SALARIALE · GPS DE CARRIÈRE 5 ANS
                    <div style={{ flex: 1, height: '1px', background: BORDER }} />
                  </div>
                  <div style={{ fontSize: '28px', color: DARK, fontWeight: 400 }}>
                    {salaireMin.toLocaleString()} $ → <span style={{ color: ORANGE, fontWeight: 700 }}>{salaireMax.toLocaleString()} $</span>
                    <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>CAD/an</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Projection sur 5 ans · Données marché temps réel · {villeAffichee}</div>
                </div>
                <div style={{ background: CARD, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER}` }}>
                  <div style={{ position: 'relative', width: '100%', height: '220px' }}><canvas ref={chartRef}></canvas></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginTop: '8px' }}>
                    {[
                      { gps: { titre: roleAffiche || 'Poste actuel', salaire: salaireMin, action: 'Point de départ' }, isMax: false },
                      { gps: data.gps_an1, isMax: false }, { gps: data.gps_an2, isMax: false },
                      { gps: data.gps_an3, isMax: false }, { gps: data.gps_an4, isMax: false },
                      { gps: data.gps_an5, isMax: true },
                    ].filter(e => e.gps && (e.gps as GPS).salaire).map((e, i) => {
                      const gps = e.gps as GPS;
                      return (
                        <div key={i} style={{ textAlign: 'center', paddingTop: '4px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: e.isMax ? ORANGE : DARK, lineHeight: 1.3, marginBottom: '2px' }}>{gps.titre}</div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: e.isMax ? ORANGE : '#555' }}>{gps.salaire?.toLocaleString()} $</div>
                          {gps.action && <div style={{ fontSize: '8px', color: '#aaa', marginTop: '2px', lineHeight: 1.3 }}>{gps.action}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: CARD, borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', marginBottom: '4px' }}>PRÉVISION · {String(data.objectif_carriere || '').toUpperCase()} {new Date().getFullYear()}–{new Date().getFullYear() + 5}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: DARK }}>Poste cible : <span style={{ color: ORANGE, fontStyle: 'italic' }}>{String(data.objectif_carriere || '')}</span></div>
                      <div style={{ marginTop: '6px' }}><span style={{ background: '#FFF0EB', color: ORANGE, borderRadius: '20px', padding: '2px 10px', fontSize: '9px', fontFamily: 'monospace' }}>⊙ Ta cible · {verdict === 'atteignable' ? 'Atteignable en 5 ans' : 'Objectif ambitieux'}</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace' }}>Indice de tension</div><div style={{ fontSize: '18px', fontWeight: 700, color: ORANGE }}>Élevé</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 80px', padding: '8px 20px', background: '#FAFAF8', borderBottom: `1px solid ${BORDER}` }}>
                    {['ANNÉE', 'SALAIRE MÉDIAN', 'CROISSANCE', 'DEMANDE'].map((h, i) => (<div key={i} style={{ fontSize: '8px', letterSpacing: '1px', color: '#aaa', fontFamily: 'monospace' }}>{h}</div>))}
                  </div>
                  {[
                    { an: new Date().getFullYear(), gps: { titre: roleAffiche, salaire: salaireMin, action: '' }, isTarget: false },
                    { an: new Date().getFullYear() + 1, gps: data.gps_an1, isTarget: false },
                    { an: new Date().getFullYear() + 2, gps: data.gps_an2, isTarget: false },
                    { an: new Date().getFullYear() + 3, gps: data.gps_an3, isTarget: false },
                    { an: new Date().getFullYear() + 4, gps: data.gps_an4, isTarget: false },
                    { an: new Date().getFullYear() + 5, gps: data.gps_an5, isTarget: true },
                  ].filter(e => e.gps && (e.gps as GPS).salaire).map((e, i) => {
                    const gps = e.gps as GPS;
                    const prevSalaire = i === 0 ? null : (() => { const prev = [salaireMin, data.gps_an1?.salaire, data.gps_an2?.salaire, data.gps_an3?.salaire, data.gps_an4?.salaire][i - 1]; return Number(prev) || salaireMin; })();
                    const croissance = prevSalaire ? Math.round(((gps.salaire - prevSalaire) / prevSalaire) * 100) : null;
                    const demande = Math.min(100, 55 + i * 7);
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 80px', padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, background: e.isTarget ? '#FFF5F2' : 'white', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: e.isTarget ? 700 : 400, color: e.isTarget ? ORANGE : '#888', fontFamily: 'monospace' }}>{e.an}</div>
                        <div style={{ fontSize: '13px', fontWeight: e.isTarget ? 700 : 500, color: e.isTarget ? ORANGE : DARK }}>{gps.salaire?.toLocaleString()} $</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {croissance !== null ? (<><span style={{ fontSize: '10px', color: croissance > 0 ? GREEN : '#888', fontWeight: 600, minWidth: '36px' }}>{croissance > 0 ? `+${croissance}%` : '—'}</span><div style={{ flex: 1, height: '4px', background: '#F0EDE6', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, Math.abs(croissance) * 3)}%`, background: e.isTarget ? ORANGE : GREEN, borderRadius: '2px' }} /></div></>) : <span style={{ fontSize: '10px', color: '#aaa' }}>—</span>}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: e.isTarget ? ORANGE : '#555' }}>{demande}</div>
                      </div>
                    );
                  })}
                  <div style={{ padding: '14px 20px', background: '#FAFAF8' }}>
                    <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.7 }}>
                      {messageGPS || `En ${new Date().getFullYear() + 5}, le salaire médian ${String(data.objectif_carriere || '')} à ${villeAffichee} est projeté à `}
                      {!messageGPS && <><strong style={{ color: ORANGE }}>{salaireMax.toLocaleString()} $</strong>. {prenom}, si tu suis ton GPS, tu arriveras exactement au bon moment sur le marché.</>}
                    </div>
                  </div>
                </div>
              </div>

            )}
          </>
        )}

        {/* ── FORMATIONS ── */}
        {activeSection === 'formations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              FORMATIONS RECOMMANDÉES
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            {((data.formations as Formation[]) || []).map((f, i) => (
              <div key={i} style={{ background: CARD, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '20px' }}>{getTypeIcon(f.type)}</div>
                  <div>
                    <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '2px' }}>{f.type?.toUpperCase()}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{f.nom}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{f.plateforme} · {f.duree}</div>
                  </div>
                </div>
                <a href={f.url || `/mon-espace?tab=formations&email=${email || ''}`} target={f.url ? '_blank' : '_self'} rel="noopener noreferrer" style={{ fontSize: '11px', color: ORANGE, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Détail →</a>
              </div>
            ))}
            {((data.certifications as Certification[]) || []).length > 0 && (
              <>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  CERTIFICATIONS
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>
                {((data.certifications as Certification[]) || []).map((c, i) => (
                  <div key={i} style={{ background: CARD, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{c.nom}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{c.organisme}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: ORANGE, fontWeight: 500 }}>Détail →</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── PARCOURS ENRICHI ── */}
        {activeSection === 'parcours' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Hero */}
            <div style={{ background: BG, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 700, color: ORANGE, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{scorePropulse}</div>
                <div style={{ fontSize: '9px', color: '#888', letterSpacing: '1.5px', fontFamily: 'monospace', marginTop: '2px' }}>PROPULSE</div>
              </div>
              <div style={{ width: '1px', background: BORDER, alignSelf: 'stretch' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: DARK, marginBottom: '4px' }}>{prenom} {nom} · {roleAffiche} · {villeAffichee}</div>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.6, marginBottom: '10px' }}>Profil complet à 78%. Complète ton parcours pour débloquer ton score final.</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[data.force1, data.force2, data.force3].filter(Boolean).length > 0 && <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 500, background: '#E1F5EE', border: '0.5px solid #5DCAA5', color: '#0F6E56' }}>{[data.force1, data.force2, data.force3].filter(Boolean).length} compétences révélées</span>}
                  {(data.formations as Formation[] || []).length > 0 && <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 500, background: '#FAECE7', border: '0.5px solid #F0997B', color: '#993C1D' }}>{(data.formations as Formation[] || []).length} formations recommandées</span>}
                  {marcheDetails?.nb_offres_estimees && <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 500, background: '#FAEEDA', border: '0.5px solid #EF9F27', color: '#854F0B' }}>{marcheDetails.nb_offres_estimees} offres compatibles</span>}
                </div>
              </div>
            </div>

            {/* CV Propulse */}
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                MON CV PROPULSE <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, marginBottom: '12px' }}>Pas un CV traditionnel — un profil de compétences vivant en 3 modes selon le poste visé.</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[
                  { id: 'ips' as const, label: String(data.objectif_carriere || 'Poste cible'), match: scoreCible },
                  { id: 'coordination' as const, label: 'Coordination', match: Math.max(60, scoreCible - 10) },
                  { id: 'formation' as const, label: 'Formation', match: Math.max(55, scoreCible - 15) },
                ].map(m => (
                  <button key={m.id} onClick={() => { setCvMode(m.id); setCvContent(null); }} style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${cvMode === m.id ? ORANGE : BORDER}`, background: cvMode === m.id ? '#FFF0EB' : 'white', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: cvMode === m.id ? '#993C1D' : '#555', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.label}
                    {cvMode === m.id && <span style={{ fontSize: '10px', background: ORANGE, color: 'white', borderRadius: '20px', padding: '1px 7px', fontFamily: 'monospace' }}>{m.match}%</span>}
                  </button>
                ))}
              </div>
              {!cvContent && !cvGenerating && (
                <div style={{ border: `1.5px dashed ${BORDER}`, borderRadius: '12px', padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>CV Propulse · {cvMode === 'ips' ? String(data.objectif_carriere || 'Poste cible') : cvMode === 'coordination' ? 'Coordination' : 'Formation'}</div>
                  <div style={{ fontSize: '11px', color: '#888', maxWidth: '320px', lineHeight: 1.6 }}>Généré depuis tes compétences révélées, ton parcours et tes formations.</div>
                  <button onClick={generateCV} style={{ background: ORANGE, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 22px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Générer mon CV →</button>
                </div>
              )}
              {cvGenerating && <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: '#888' }}>⏳ YELMA génère ton CV Propulse...</div>}
              {cvContent && !cvGenerating && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', background: '#FFF0EB', color: ORANGE, borderRadius: '20px', padding: '3px 10px', fontFamily: 'monospace' }}>✓ CV Propulse généré · Match {scoreCible}%</span>
                    <button onClick={() => setCvContent(null)} style={{ fontSize: '10px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Regénérer</button>
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.8, color: DARK, borderTop: `1px solid ${BORDER}`, paddingTop: '12px', marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: cvContent }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`/mon-espace?tab=cv&email=${email || ''}`} style={{ display: 'inline-block', background: ORANGE, color: 'white', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Télécharger PDF</a>
                    <button onClick={() => setCvContent(null)} style={{ background: '#F5F2EC', color: '#555', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Regénérer</button>
                  </div>
                </div>
              )}
              {/* Lien sécurisé */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#FAFAF8', marginTop: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ORANGE, fontSize: '14px' }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: DARK, marginBottom: '2px' }}>Partager avec un employeur</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Lien sécurisé · Pas de PDF · Révocable à tout moment</div>
                </div>
                <button onClick={createProfilLink} disabled={linkCreating} style={{ fontSize: '11px', color: ORANGE, background: 'none', border: `1px solid #F0997B`, borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  {linkCreating ? '...' : 'Créer le lien →'}
                </button>
              </div>
              {profilLinks.filter(l => l.active).length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {profilLinks.filter(l => l.active).map(link => (
                    <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#F5F2EC', borderRadius: '8px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22A06B', flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '11px', color: ORANGE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>{link.views} vue{link.views !== 1 ? 's' : ''}</div>
                      <button onClick={() => copyLink(link.url, link.id)} style={{ fontSize: '10px', color: '#555', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>{linkCopied === link.id ? '✓ Copié' : 'Copier'}</button>
                      <button onClick={() => revokeLink(link.id)} style={{ fontSize: '10px', color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: BORDER }} />

            {/* Lettre de motivation */}
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                MA LETTRE DE MOTIVATION <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, marginBottom: '12px' }}>Générée pour chaque offre spécifique. Personnalisée avec tes compétences révélées.</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[{ id: 'offre' as const, label: 'Pour une offre spécifique' }, { id: 'generale' as const, label: 'Lettre générale' }].map(m => (
                  <button key={m.id} onClick={() => { setLettreMode(m.id); setLettreContent(null); }} style={{ padding: '7px 14px', borderRadius: '10px', border: `1px solid ${lettreMode === m.id ? '#22A06B' : BORDER}`, background: lettreMode === m.id ? '#E8FFF2' : 'white', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: lettreMode === m.id ? '#0F6E56' : '#555', fontFamily: 'Georgia, serif' }}>{m.label}</button>
                ))}
              </div>
              {!lettreContent && !lettreGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lettreMode === 'offre' && (
                    <textarea value={lettreOffre} onChange={e => setLettreOffre(e.target.value)} placeholder="Colle le texte de l'offre d'emploi ici... YELMA va analyser les mots-clés et personnaliser ta lettre." rows={4} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${BORDER}`, fontSize: '12px', fontFamily: 'Georgia, serif', color: DARK, resize: 'vertical', outline: 'none', background: 'white', boxSizing: 'border-box' }} />
                  )}
                  {lettreMode === 'generale' && (
                    <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, padding: '12px 14px', background: '#FAFAF8', borderRadius: '10px', border: `1px solid ${BORDER}` }}>Lettre polyvalente basée sur ton profil Propulse. Réutilisable pour les candidatures spontanées.</div>
                  )}
                  <button onClick={generateLettre} disabled={lettreMode === 'offre' && !lettreOffre.trim()} style={{ background: '#22A06B', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Georgia, serif', opacity: lettreMode === 'offre' && !lettreOffre.trim() ? 0.4 : 1 }}>Générer ma lettre →</button>
                </div>
              )}
              {lettreGenerating && <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#888' }}>⏳ YELMA rédige ta lettre...</div>}
              {lettreContent && !lettreGenerating && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', background: '#E8FFF2', color: '#0F6E56', borderRadius: '20px', padding: '3px 10px', fontFamily: 'monospace' }}>✓ Lettre générée</span>
                    <button onClick={() => setLettreContent(null)} style={{ fontSize: '10px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Regénérer</button>
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.8, color: DARK, borderTop: `1px solid ${BORDER}`, paddingTop: '12px', marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: lettreContent }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`/mon-espace?tab=lettre&email=${email || ''}`} style={{ display: 'inline-block', background: '#22A06B', color: 'white', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Télécharger PDF</a>
                    <button onClick={() => navigator.clipboard.writeText(lettreContent || '')} style={{ background: '#F5F2EC', color: '#555', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Copier le texte</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: BORDER }} />

            {/* Suivi candidatures */}
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                MES CANDIDATURES <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, marginBottom: '12px' }}>YELMA suit tes candidatures et te rappelle de relancer au bon moment.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Envoyées', val: candidaturesLocales.filter(c => c.statut === 'envoyee').length, color: ORANGE },
                  { label: 'En attente', val: candidaturesLocales.filter(c => c.statut === 'en_attente').length, color: GOLD },
                  { label: 'Sauvegardées', val: candidaturesLocales.filter(c => c.statut === 'sauvegardee').length, color: '#888' },
                  { label: 'Entretiens', val: candidaturesLocales.filter(c => c.statut === 'entretien').length, color: GREEN },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#F5F2EC', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '3px', fontFamily: 'Georgia, serif' }}>{s.val}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {candidaturesLocales.map((c, i) => {
                  const cfg: Record<string, { label: string; color: string; bg: string }> = {
                    envoyee: { label: 'CV envoyé', color: '#0F6E56', bg: '#E1F5EE' },
                    en_attente: { label: 'En attente', color: '#854F0B', bg: '#FAEEDA' },
                    sauvegardee: { label: 'Sauvegardée', color: '#5F5E5A', bg: '#F1EFE8' },
                    entretien: { label: 'Entretien prévu', color: '#185FA5', bg: '#E6F1FB' },
                    refus: { label: 'Refus', color: '#A32D2D', bg: '#FCEBEB' },
                  };
                  const s = cfg[c.statut];
                  const dotStyle = c.statut === 'envoyee' ? { background: GREEN } : c.statut === 'en_attente' ? { background: 'white', border: `2px solid ${ORANGE}` } : { background: 'white', border: '1.5px solid #ccc' };
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: '14px', paddingBottom: i < candidaturesLocales.length - 1 ? '16px' : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, ...dotStyle }} />
                        {i < candidaturesLocales.length - 1 && <div style={{ width: '1px', flex: 1, background: 'rgba(0,0,0,0.08)', marginTop: '3px' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{c.employeur} — {c.poste}</div>
                          <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px', color: s.color, background: s.bg, flexShrink: 0 }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Match {c.match}%{c.rappel && <span style={{ color: GOLD }}> · {c.rappel}</span>}</div>
                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{c.statut === 'sauvegardee' ? 'À postuler avant le' : 'Postulé le'} {c.date}</div>
                        {c.statut === 'en_attente' && (
                          <button onClick={() => envoyerConseiller(`Aide-moi à rédiger une relance pour ${c.employeur}`)} style={{ marginTop: '6px', fontSize: '10px', color: ORANGE, background: 'none', border: `1px solid #F0997B`, borderRadius: '20px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Générer une relance →</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setCandidaturesLocales(prev => [...prev, { id: Date.now().toString(), employeur: 'Nouvelle candidature', poste: String(data.objectif_carriere || 'Poste cible'), statut: 'sauvegardee', match: scoreCible, date: new Date().toLocaleDateString('fr-CA') }])} style={{ width: '100%', marginTop: '14px', padding: '10px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: 'white', fontSize: '12px', color: '#555', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                + Ajouter une candidature
              </button>
            </div>

            {/* Note sécurité */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#F5F2EC', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', flexShrink: 0 }}>🔒</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#555', marginBottom: '2px' }}>Données sécurisées</div>
                <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.6 }}>L&apos;employeur voit uniquement ton profil Propulse. Aucune donnée personnelle partagée sans ton accord. Tu peux révoquer l&apos;accès à tout moment.</div>
              </div>
            </div>

          </div>
        )}

        {/* ── CONSEILLER ── */}
        {activeSection === 'conseiller' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              TON CONSEILLER YELMA
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            <div style={{ background: CARD, borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: DARK }}>Conseiller YELMA</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>Orientation · Formations · Stratégie de carrière</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
                  <div style={{ fontSize: '10px', color: GREEN, fontWeight: 500 }}>Disponible</div>
                </div>
              </div>
              {conseillerMessages.length > 0 && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {conseillerMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5, background: m.role === 'user' ? DARK : '#F5F2EC', color: m.role === 'user' ? 'white' : DARK }}>{m.text}</div>
                    </div>
                  ))}
                  {conseillerLoading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ background: '#F5F2EC', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', color: '#888' }}>En train de réfléchir...</div></div>}
                </div>
              )}
              {conseillerMessages.length === 0 && (
                <>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '12px', color: DARK, lineHeight: 1.6 }}>Tu as des questions sur <strong>ta cible</strong>, <strong>tes formations</strong> ou tu hésites sur la direction ?</div>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: `1px solid ${BORDER}` }}>
                    {['Je doute de ma cible', 'Quelle formation prioriser ?', 'Améliorer mon score', 'Explorer un autre domaine'].map(q => (
                      <button key={q} onClick={() => envoyerConseiller(q)} style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '6px 14px', fontSize: '11px', color: DARK, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>{q}</button>
                    ))}
                  </div>
                </>
              )}
              <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                <input value={conseillerInput} onChange={e => setConseillerInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyerConseiller()} placeholder="Ecris ta question à ton conseiller..." style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '8px 14px', fontSize: '12px', outline: 'none', fontFamily: 'Georgia, serif', background: '#FAFAF8' }} />
                <button onClick={() => envoyerConseiller()} disabled={conseillerLoading} style={{ background: conseillerLoading ? '#ddd' : DARK, color: 'white', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px' }}>→</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
