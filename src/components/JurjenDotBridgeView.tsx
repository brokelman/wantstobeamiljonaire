import React, { useState } from 'react';
import { Copy, Check, Terminal, Bot, Share2, FileJson } from 'lucide-react';
import type { VentureIdea } from '../utils/ventureMath';

interface JurjenDotBridgeViewProps {
  ideas: VentureIdea[];
}

export const JurjenDotBridgeView: React.FC<JurjenDotBridgeViewProps> = ({ ideas }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const openApiUrl = `${origin}/api/openapi.json`;
  const ideasApiUrl = `${origin}/api/ideas`;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const dotBriefingPrompt = `Je bent "De Dot van Jurjen", de AI Advisory Board van onze vriendengroep van 10 man. Ons doel is om samen één AI-bedrijf te bouwen met een bedrijfswaardering van >€10 miljoen euro (zodat ieder lid ~€1M+ overhoudt bij exit).

Hieronder staan de huidige ingediende AI-ideeën van onze groep (per naam):

${ideas
  .map(
    (idea, idx) =>
      `${idx + 1}. [${idea.founderName}] "${idea.title}" (ID: ${idea.id})
   - Doelmarkt: ${idea.targetMarket}
   - Samenvatting: ${idea.shortSummary}
   - Probleem: ${idea.problemStatement}
   - AI-Oplossing: ${idea.aiSolution}
   - Rekensom: €${idea.monthlyPriceEur}/mnd × ${idea.targetCustomers} klanten = €${(
        (idea.monthlyPriceEur * 12 * idea.targetCustomers) /
        1_000_000
      ).toFixed(2)}M ARR -> Geschatte Waardering: €${(idea.estimatedValuationEur / 1_000_000).toFixed(2)}M`
  )
  .join('\n\n')}

Opdracht aan de Dot van Jurjen:
1. Beoordeel per naam/idee of de €10M+ businesscase realistisch en verdedigbaar is (GO, PIVOT of NO-GO) en geef een score van 0-100.
2. Geef per idee 3 concrete vervolgstappen hoe wij dit met 10 man volgende week moeten oppakken.
3. Kies de Top 2 beste ideeën die we als groep moeten combineren of uitvoeren.`;

  const customGptInstructions = `Je bent "De Dot van Jurjen", de officiële Advisory Board van onze 10-koppige vriendengroep op TienMiljoen Lab.
Je hebt via je Actions directe toegang tot onze site (${origin}):
1. Gebruik 'listVentureIdeas' (GET /api/ideas) om alle ideeën van de vrienden per naam op te halen.
2. Analyseer elk idee streng op:
   - Kan dit binnen 3 jaar €1,25M tot €2,0M ARR halen (waardering >€10M bij 6x-8x multiple)?
   - Is er een echte B2B workflow- of data-moat (geen dunne ChatGPT wrapper)?
3. Gebruik 'submitJurjenDotValidation' (POST /api/ideas/{id}/advise) om jouw validatie, score (0-100), korte samenvatting en 3 concrete vervolgstappen direct terug op onze site te publiceren.`;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Toegang & Koppeling voor de ChatGPT Dot van Jurjen
          </h2>
        </div>
        <p className="text-sm text-slate-300 max-w-4xl leading-relaxed">
          Om de ChatGPT Dot van Jurjen als volwaardige Advisory Board toegang te geven tot jullie site, ondersteunt
          TienMiljoen Lab twee directe werkwijzen: een live <strong>OpenAPI Action-koppeling</strong> (waarmee Jurjen’s
          Custom GPT zelfstandig ideeën van de site leest en valideert) én een{' '}
          <strong>1-Klik Voice/Chat Briefing</strong> voor tijdens jullie gezamenlijke sessies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optie 1: Custom GPT Action / OpenAPI */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>1. Live API Koppeling (Custom GPT Actions)</span>
            </div>
            <span className="text-xs font-mono text-emerald-400">OpenAPI 3.1 Ready</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Jurjen kan zijn ChatGPT / Custom GPT direct toegang geven tot deze site. Ga in ChatGPT naar{' '}
            <strong>Configure → Actions → Create new action → Import from URL</strong> en plak onderstaande OpenAPI-link:
          </p>

          <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-amber-300 truncate">{openApiUrl}</code>
            <button
              type="button"
              onClick={() => copyText('openapi', openApiUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md shrink-0"
            >
              {copiedKey === 'openapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'openapi' ? 'Gekopieerd' : 'Kopieer URL'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Systeem-instructie voor in Jurjen’s Custom GPT:
              </span>
              <button
                type="button"
                onClick={() => copyText('gpt-instructions', customGptInstructions)}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
              >
                {copiedKey === 'gpt-instructions' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'gpt-instructions' ? 'Instructie gekopieerd' : 'Kopieer GPT Instructie'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {customGptInstructions}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">Beschikbare REST Endpoints voor Jurjen’s Dot:</div>
            <div className="font-mono text-[11px] text-slate-400">
              GET {ideasApiUrl}?founder=Jurjen
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              POST {ideasApiUrl}/:id/advise
            </div>
          </div>
        </div>

        {/* Optie 2: Live Briefing voor ChatGPT Voice / Dot */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>2. Directe Briefing voor Jurjen’s Voice Dot</span>
            </div>
            <button
              type="button"
              onClick={() => copyText('briefing', dotBriefingPrompt)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              {copiedKey === 'briefing' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'briefing' ? 'Briefing Gekopieerd!' : 'Kopieer Volledige Dot Briefing'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Zitten jullie bij elkaar of gebruikt Jurjen zijn ChatGPT Dot via spraak/telefoon? Kopieer met één klik
            onderstaande live samenvatting van alle {ideas.length} ideeën (inclusief naam en €10M-rekensom) en stuur
            deze naar Jurjen’s ChatGPT Dot.
          </p>

          <pre className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
            {dotBriefingPrompt}
          </pre>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Tip: Je kunt op elk idee in het dashboard ook direct op <strong>&ldquo;Valideer met Dot van Jurjen&rdquo;</strong> klikken voor een directe AI-beoordeling.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
