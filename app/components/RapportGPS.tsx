"use client";

import { useEffect, useRef, useState } from "react";

type GPS = { titre: string; salaire: number; action: string };
type Opportunite = { titre: string; salaire: number; description: string };
type Formation = { nom: string; type: string; plateforme: string; duree: string };
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
  // Champs Supabase directs
  [key: string]: unknown;
};

export function parseRapport(text: string): RapportData | null {
  const isRapport =
    text.includes("TES 3 COMPÉTENCES") ||
    text.includes("COMPÉTENCES CLÉS") ||
    text.includes("GPS DE CARRIÈRE") ||
    text.includes("An 1:");
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
  const messageMatch = text.match(/MESSAGE_OBJECTIF:\s*([^\n]+)/i);
  const delaiMatch = text.match(/DELAI_OBJECTIF:\s*([^\n]+)/i);
  if (forces.length === 0 && yelmaGPS.length === 0) return null;
  return {
    force1: forces[0]?.nom, force1_desc: forces[0]?.desc,
    force2: forces[1]?.nom, force2_desc: forces[1]?.desc,
    force3: forces[2]?.nom, force3_desc: forces[2]?.desc,
    salaire_min: yelmaGPS[0] ? Math.round(yelmaGPS[0].salaire * 0.85) : 40000,
    salaire_max: yelmaGPS[0]?.salaire || 60000,
    objectif_carriere: objectifMatch?.[1]?.trim(),
    scenario_objectif: parseInt(scenarioMatch?.[1] || "3"),
    message_objectif: messageMatch?.[1]?.trim(),
    delai_objectif: delaiMatch?.[1]?.trim(),
    opportunites, gps_an1: yelmaGPS[0], gps_an2: yelmaGPS[1],
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
  data, plan, ville, roleActuel, email
}: {
  data: RapportData;
  plan: string;
  ville?: string;
  roleActuel?: string;
  email?: string;
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [activeSection, setActiveSection] = useState<string>('resume');
  const [conseillerInput, setConseillerInput] = useState('');
  const [conseillerMessages, setConseillerMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [conseillerLoading, setConseillerLoading] = useState(false);

  const [marcheScore, setMarcheScore] = useState<number | null>(null);
  const [marcheDetails, setMarcheDetails] = useState<{nb_offres_estimees?: number; tendance?: string; explication?: string} | null>(null);
  const [marcheLoading, setMarcheLoading] = useState(false);

  // ── Extraire toutes les valeurs directement depuis data ──
  const isPropulse = plan === "propulse";
  const salaireMin = Number(data.salaire_min) || 40000;
  const salaireMax = Number(data.salaire_max) || 60000;
  
  // Score PROPULSE — cherche dans tous les champs possibles
  const scorePropulse = Number(data.score_propulse) || 0;
  const scoreCible = Number(data.score_cible_pct) || 0;
  const verdict = String(data.verdict || 'atteignable');
  const messageAnalyse = String(data.message_analyse || '');
  
  // Prénom/nom — cherche dans tous les champs possibles  
  const prenom = String(data.prenom || '');
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

  useEffect(() => {
    if (!chartRef.current || activeSection !== 'gps') return;
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();
      const raw = [salaireMin, Number(data.gps_an1?.salaire) || 0, Number(data.gps_an2?.salaire) || 0, Number(data.gps_an3?.salaire) || 0, Number(data.gps_an4?.salaire) || 0, Number(data.gps_an5?.salaire) || 0];
      const yelma = ensureCroissant(raw);
      new Chart(chartRef.current!, {
        type: 'line',
        data: {
          labels: ['Auj.', 'An 1', 'An 2', 'An 3', 'An 4', 'An 5'],
          datasets: [{ label: 'Trajectoire YELMA', data: yelma, borderColor: '#E05C3A', backgroundColor: 'rgba(224,92,58,0.06)', borderWidth: 2, pointBackgroundColor: yelma.map((_, i) => i === yelma.length - 1 ? '#22A06B' : '#E05C3A'), pointRadius: 5, fill: true, tension: 0.4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => '$' + ((ctx.parsed.y ?? 0)).toLocaleString() } } },
          scales: { y: { min: 0, ticks: { callback: (v) => '$' + Math.round(Number(v) / 1000) + 'k', font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } },
        },
      });
    };
    loadChart();
  }, [data, salaireMin, activeSection]);

  useEffect(() => {
    if (activeSection === 'marche') chargerMarche();
  }, [activeSection]);

  const chargerMarche = async () => {
    if (marcheScore !== null) return;
    setMarcheLoading(true);
    try {
      const res = await fetch('/api/marche-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          objectif: data.objectif_carriere,
          ville: villeAffichee,
          domaine: String(data.domaine_actuel || ''),
        }),
      });
      const d = await res.json();
      if (d.marche) {
        setMarcheScore(d.marche.score_marche);
        setMarcheDetails(d.marche);
      }
    } catch (e) {
      console.error('Marché error:', e);
    } finally {
      setMarcheLoading(false);
    }
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
            { role: 'system', content: `Tu es le Conseiller YELMA. Le candidat s'appelle ${prenom}. Son rôle : ${roleAffiche}. Son objectif : ${data.objectif_carriere}. Son score PROPULSE : ${scorePropulse}. Réponds de façon courte, bienveillante et actionnable.` },
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
              <div style={{ fontSize: '52px', fontWeight: 700, color: propulseColor, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
                {scorePropulse}
              </div>
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

            {/* Analyse YELMA */}
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

            {/* Grille 6 tuiles */}
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', marginBottom: '12px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                TON TABLEAU DE BORD
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <Tuile titre="Mes compétences" pct={data.force1 ? 100 : 0} desc={`${[data.force1, data.force2, data.force3].filter(Boolean).length} forces identifiées par YELMA.`} onClick={() => setActiveSection('competences')} />
                <Tuile titre="Mes formations" pct={35} desc={`${(data.formations as Formation[] || []).length} formations clés pour débloquer ton potentiel.`} onClick={() => setActiveSection('formations')} />
                <Tuile titre="Mon parcours" pct={scorePropulse} desc="Ton parcours analysé par YELMA." onClick={() => setActiveSection('parcours')} />
                <Tuile titre={`Mon marché · ${villeAffichee}`} pct={80} desc={`${salaireMin.toLocaleString()} $ → ${salaireMax.toLocaleString()} $ en 5 ans.`} onClick={() => setActiveSection('marche')} />
                <Tuile titre="Mon GPS de carrière" pct={62} desc={`${salaireMin.toLocaleString()} $ → ${salaireMax.toLocaleString()} $ en 5 ans.`} onClick={() => setActiveSection('gps')} />
                {/* Tuile Conseiller */}
                <div onClick={() => setActiveSection('conseiller')} style={{ background: '#FDF6EE', borderRadius: '12px', padding: '16px', border: '1px solid #EDEAE3', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: DARK, fontWeight: 500 }}>Conseiller YELMA</div>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
                  </div>
                  <div style={{ height: '3px', background: '#E05C3A', borderRadius: '2px', width: '40%' }} />
                  <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.5, fontStyle: 'italic' }}>Tu as des questions ? Je suis là.</div>
                  <button style={{ background: ORANGE, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    Parler à YELMA →
                  </button>
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
                {prenom && <span>{prenom}, </span>}
                tu possèdes{' '}
                <span style={{ color: ORANGE, fontStyle: 'italic' }}>
                  {[data.force1, data.force2, data.force3].filter(Boolean).length} compétences rares
                </span> que le marché recherche activement.
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
                  <div>
                    <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>RARETÉ</div>
                    <div style={{ fontSize: '11px', color: f.rareteColor, fontWeight: 600 }}>{f.rarete}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>VALEUR MARCHÉ</div>
                    <div style={{ fontSize: '11px', color: DARK, fontWeight: 600 }}>{f.valeur}</div>
                  </div>
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

            {/* Axes */}
            {(data.axe1 || data.axe2) && (
              <>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  AXES DE DÉVELOPPEMENT · CE QUI TE RETIENT
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>
                <div style={{ fontSize: '16px', color: DARK }}>
                  {[data.axe1, data.axe2].filter(Boolean).length} lacunes précises bloquent{' '}
                  <span style={{ color: GOLD, fontStyle: 'italic' }}>ta progression</span> vers la cible.
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
                      <div style={{ background: '#F5F2EC', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '3px' }}>POURQUOI C&apos;EST CRITIQUE</div>
                        <div style={{ fontSize: '11px', color: DARK, lineHeight: 1.5 }}>
                          {i === 0 ? `Exigé pour progresser vers ${String(data.objectif_carriere || 'ton objectif')}.` : `Demandé dans la majorité des offres compatibles avec ton profil.`}
                        </div>
                      </div>
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

            {/* Score marché */}
            {marcheLoading && (
              <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}`, textAlign: 'center', color: '#888', fontSize: '12px' }}>
                ⏳ Analyse du marché en cours...
              </div>
            )}
            {marcheScore !== null && marcheDetails && (
              <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace' }}>SCORE MARCHÉ</div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: marcheScore >= 70 ? '#22A06B' : marcheScore >= 50 ? '#C0842A' : '#E05C3A' }}>{marcheScore}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#888' }}>{marcheDetails.nb_offres_estimees} offres estimées</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: marcheScore >= 70 ? '#22A06B' : '#C0842A' }}>Marché {marcheDetails.tendance}</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '12px', fontStyle: 'italic' }}>{marcheDetails.explication}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Demande offres', val: (marcheDetails as {D?: number}).D || 0 },
                    { label: 'Attractivité salariale', val: (marcheDetails as {S?: number}).S || 0 },
                    { label: 'Tension métier', val: (marcheDetails as {T?: number}).T || 0 },
                    { label: 'Croissance secteur', val: (marcheDetails as {G?: number}).G || 0 },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#F5F2EC', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '8px', color: '#888', fontFamily: 'monospace', marginBottom: '3px' }}>{item.label.toUpperCase()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#E8E4DD', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.val}%`, background: item.val >= 70 ? '#22A06B' : item.val >= 50 ? '#C0842A' : '#E05C3A', borderRadius: '2px' }} />
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              OPPORTUNITÉS COMPATIBLES
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>

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
            {((data.opportunites as Opportunite[]) || []).map((o, i) => (
              <div key={i} style={{ background: CARD, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', color: '#aaa', fontStyle: 'italic', minWidth: '20px' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{o.titre}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{o.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: ORANGE }}>{o.salaire?.toLocaleString()} $</div>
                  <a href={`/mon-espace?tab=offres&email=${email || ''}`} style={{ fontSize: '14px', color: '#888', textDecoration: 'none' }}>→</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GPS ── */}
        {activeSection === 'gps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ÉVOLUTION SALARIALE · GPS DE CARRIÈRE 5 ANS
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            <div style={{ background: CARD, borderRadius: '12px', padding: '16px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '22px', color: DARK, marginBottom: '4px' }}>
                {salaireMin.toLocaleString()} $ → <span style={{ color: ORANGE }}>{salaireMax.toLocaleString()} $</span> <span style={{ fontSize: '12px', color: '#888' }}>CAD/an</span>
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '16px' }}>Projection sur 5 ans · {villeAffichee}</div>
              <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
            {[
              { an: 'Auj.', gps: { titre: roleAffiche || 'Poste actuel', salaire: salaireMin, action: 'Point de départ' }, isActuel: true, isMax: false },
              { an: 'An 1', gps: data.gps_an1, isActuel: false, isMax: false },
              { an: 'An 2', gps: data.gps_an2, isActuel: false, isMax: false },
              { an: 'An 3', gps: data.gps_an3, isActuel: false, isMax: false },
              { an: 'An 4', gps: data.gps_an4, isActuel: false, isMax: false },
              { an: 'An 5', gps: data.gps_an5, isActuel: false, isMax: true },
            ].filter(e => e.gps && (e.gps as GPS).salaire).map((e, i) => {
              const gps = e.gps as GPS;
              return (
                <div key={i} style={{ background: e.isActuel ? ORANGE : e.isMax ? '#F0FFF8' : CARD, borderRadius: '10px', padding: '12px 16px', border: `1px solid ${e.isActuel ? ORANGE : e.isMax ? '#C8EFD8' : BORDER}`, display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: e.isActuel ? 'rgba(255,255,255,0.2)' : e.isMax ? '#22A06B' : '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: e.isActuel ? 'white' : e.isMax ? 'white' : '#888', flexShrink: 0 }}>{e.an}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: e.isActuel ? 'white' : e.isMax ? '#085041' : DARK }}>{gps.titre}</div>
                    {gps.action && <div style={{ fontSize: '10px', color: e.isActuel ? 'rgba(255,255,255,0.7)' : '#888', marginTop: '2px' }}>{gps.action}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: e.isActuel ? 'white' : e.isMax ? GREEN : ORANGE }}>{gps.salaire?.toLocaleString()} $</div>
                    {e.isMax && <div style={{ fontSize: '9px', color: GREEN, fontFamily: 'monospace' }}>POTENTIEL MAX</div>}
                  </div>
                </div>
              );
            })}
          </div>
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
                <a href={`/mon-espace?tab=formations&email=${email || ''}`} style={{ fontSize: '11px', color: ORANGE, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Détail →</a>
              </div>
            ))}
            {((data.certifications as Certification[]) || []).length > 0 && (
              <>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  CERTIFICATIONS ET ORDRES PROFESSIONNELS
                  <div style={{ flex: 1, height: '1px', background: BORDER }} />
                </div>
                {((data.certifications as Certification[]) || []).map((c, i) => (
                  <div key={i} style={{ background: CARD, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{c.nom}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{c.organisme}</div>
                    </div>
                    <a href="#" style={{ fontSize: '11px', color: ORANGE, textDecoration: 'none', fontWeight: 500 }}>Détail →</a>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── PARCOURS ── */}
        {activeSection === 'parcours' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
              MON PARCOURS
              <div style={{ flex: 1, height: '1px', background: BORDER }} />
            </div>
            <div style={{ background: CARD, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '8px' }}>📄 MON CV YELMA</div>
              <div style={{ fontSize: '13px', color: DARK, marginBottom: '12px' }}>YELMA génère ton CV personnalisé basé sur tes compétences révélées.</div>
              <a href={`/mon-espace?tab=cv&email=${email || ''}`} style={{ display: 'inline-block', background: DARK, color: 'white', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Générer mon CV →</a>
            </div>
            <div style={{ background: CARD, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#888', fontFamily: 'monospace', marginBottom: '8px' }}>✉️ MA LETTRE DE MOTIVATION</div>
              <div style={{ fontSize: '13px', color: DARK, marginBottom: '12px' }}>Génère une lettre personnalisée pour chaque offre qui correspond à ton profil.</div>
              <a href={`/mon-espace?tab=lettre&email=${email || ''}`} style={{ display: 'inline-block', background: ORANGE, color: 'white', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Générer ma lettre →</a>
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
                    <div style={{ fontSize: '12px', color: DARK, lineHeight: 1.6 }}>Tu as des questions sur <strong>ta cible</strong>, <strong>tes formations</strong> ou tu hésites sur la direction à prendre ?</div>
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
