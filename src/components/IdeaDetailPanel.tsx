import React, { useState, useEffect } from 'react';
import {
  Bot,
  ThumbsUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sliders,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  calculateAnnualRecurringRevenue,
  calculateEnterpriseValuation,
  calculateCustomersNeededForTenMillion,
  calculateFounderExitPayout,
  type VentureIdea,
  type VentureStage,
  type DotVerdict,
} from '../utils/ventureMath';

interface IdeaDetailPanelProps {
  idea: VentureIdea;
  onVote: (ideaId: string) => Promise<void>;
  onStageChange: (ideaId: string, stage: VentureStage) => Promise<void>;
  onUpdateEconomics: (
    ideaId: string,
    monthlyPriceEur: number,
    targetCustomers: number,
    arrMultiple: number
  ) => Promise<void>;
  onTriggerDotValidation: (ideaId: string) => Promise<void>;
  onSubmitManualDotAdvice: (
    ideaId: string,
    payload: {
      dotVerdict: DotVerdict;
      dotScore: number;
      dotSummaryAdvice: string;
      dotNextSteps: string;
      dotCriticalRisk: string;
    }
  ) => Promise<void>;
  isValidatingDot: boolean;
}

const STAGES: { key: VentureStage; label: string; step: string }[] = [
  { key: 'idea', label: '1. Ruwe Brainstorm', step: 'Pitch & Probleem' },
  { key: 'validated', label: '2. Dot Validatie', step: 'Getoetst door Jurjen’s Dot' },
  { key: 'business_case', label: '3. €10M+ Rekensom', step: 'Unit Economics & Moat' },
  { key: 'execution', label: '4. 90-Dagen Executie', step: 'Klantpilots & Bouw' },
];

export const IdeaDetailPanel: React.FC<IdeaDetailPanelProps> = ({
  idea,
  onVote,
  onStageChange,
  onUpdateEconomics,
  onTriggerDotValidation,
  onSubmitManualDotAdvice,
  isValidatingDot,
}) => {
  const [price, setPrice] = useState(idea.monthlyPriceEur);
  const [customers, setCustomers] = useState(idea.targetCustomers);
  const [multiple, setMultiple] = useState(idea.arrMultiple);
  const [showManualDotForm, setShowManualDotForm] = useState(false);

  const [manualVerdict, setManualVerdict] = useState<DotVerdict>(
    idea.dotVerdict === 'pending' ? 'go' : idea.dotVerdict
  );
  const [manualScore, setManualScore] = useState<number>(idea.dotScore || 85);
  const [manualSummary, setManualSummary] = useState(idea.dotSummaryAdvice);
  const [manualSteps, setManualSteps] = useState(idea.dotNextSteps);
  const [manualRisk, setManualRisk] = useState(idea.dotCriticalRisk);

  useEffect(() => {
    setPrice(idea.monthlyPriceEur);
    setCustomers(idea.targetCustomers);
    setMultiple(idea.arrMultiple);
    setManualVerdict(idea.dotVerdict === 'pending' ? 'go' : idea.dotVerdict);
    setManualScore(idea.dotScore || 85);
    setManualSummary(idea.dotSummaryAdvice);
    setManualSteps(idea.dotNextSteps);
    setManualRisk(idea.dotCriticalRisk);
  }, [idea]);

  const arr = calculateAnnualRecurringRevenue(price, customers);
  const valuation = calculateEnterpriseValuation(price, customers, multiple);
  const neededCustomers = calculateCustomersNeededForTenMillion(price, multiple);
  const payoutPerFriend = calculateFounderExitPayout(valuation, 10, 80);
  const hitsTenMillion = valuation >= 10_000_000;
  const economicsChanged =
    price !== idea.monthlyPriceEur ||
    customers !== idea.targetCustomers ||
    multiple !== idea.arrMultiple;

  const renderVerdictStatus = (verdict: DotVerdict, score: number) => {
    if (verdict === 'go') {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>GO VOOR €10M+ · Dot Score {score}/100</span>
        </span>
      );
    }
    if (verdict === 'pivot') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>PIVOT VEREIST · Dot Score {score}/100</span>
        </span>
      );
    }
    if (verdict === 'no_go') {
      return (
        <span className="inline-flex items-center gap-1.5 text-red-400 font-medium text-xs">
          <XCircle className="w-4 h-4" />
          <span>NO-GO (&lt;€10M) · Dot Score {score}/100</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-xs">
        <Clock className="w-4 h-4" />
        <span>Wacht op oordeel van Jurjen’s Dot</span>
      </span>
    );
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitManualDotAdvice(idea.id, {
      dotVerdict: manualVerdict,
      dotScore: Number(manualScore),
      dotSummaryAdvice: manualSummary,
      dotNextSteps: manualSteps,
      dotCriticalRisk: manualRisk,
    });
    setShowManualDotForm(false);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Header & Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-amber-400">Bedenker: {idea.founderName}</span>
            <span aria-hidden="true">·</span>
            <span>Doelmarkt: {idea.targetMarket}</span>
            <span aria-hidden="true">·</span>
            {renderVerdictStatus(idea.dotVerdict, idea.dotScore)}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-display">{idea.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{idea.shortSummary}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onVote(idea.id)}
            aria-label={`Stem op ${idea.title}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums">{idea.votesCount} stemmen (van 10)</span>
          </button>

          <button
            type="button"
            disabled={isValidatingDot}
            onClick={() => onTriggerDotValidation(idea.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isValidatingDot ? 'Dot van Jurjen analyseert...' : 'Valideer met Dot van Jurjen'}
            </span>
          </button>
        </div>
      </div>

      {/* 4-Stage Venture Funnel Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">
            Positie in de €10M Venture Funnel (klik om fase bij te werken)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STAGES.map((s) => {
            const active = idea.stage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onStageChange(idea.id, s.key)}
                className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors ${
                  active
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-200'
                    : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold whitespace-nowrap truncate">{s.label}</div>
                <div className="text-[11px] opacity-75 truncate">{s.step}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem & AI Solution Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400">Het Pijnlijke Klantprobleem</h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80">
            {idea.problemStatement}
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400">AI-Architectuur & Verdedigbare Moat</h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80">
            {idea.aiSolution}
          </p>
        </div>
      </div>

      {/* Advisory Board Section: De ChatGPT Dot van Jurjen */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display">
                Advisory Board Rapport — De ChatGPT Dot van Jurjen
              </h3>
              <p className="text-xs text-slate-400">
                Validatie op haalbaarheid van &gt;€10M waardering en concrete vervolgstappen voor de groep
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowManualDotForm(!showManualDotForm)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {showManualDotForm ? 'Sluit handmatige invoer' : 'Plak / Bewerk Advies van Jurjen’s Dot'}
          </button>
        </div>

        {showManualDotForm ? (
          <form onSubmit={handleManualSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dot-verdict-select" className="block text-xs text-slate-400 mb-1">
                  Dot Verdict
                </label>
                <select
                  id="dot-verdict-select"
                  value={manualVerdict}
                  onChange={(e) => setManualVerdict(e.target.value as DotVerdict)}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="go">GO — €10M+ Case Haalbaar</option>
                  <option value="pivot">PIVOT — Prijs of Niche Aanpassen</option>
                  <option value="no_go">NO-GO — Te Kleine Markt / Wrapper</option>
                </select>
              </div>
              <div>
                <label htmlFor="dot-score-input" className="block text-xs text-slate-400 mb-1">
                  Dot Validatie Score (0 - 100)
                </label>
                <input
                  id="dot-score-input"
                  type="number"
                  min={0}
                  max={100}
                  value={manualScore}
                  onChange={(e) => setManualScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dot-summary-input" className="block text-xs text-slate-400 mb-1">
                Validatie Oordeel van Jurjen’s Dot
              </label>
              <textarea
                id="dot-summary-input"
                rows={2}
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
                className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="dot-steps-input" className="block text-xs text-slate-400 mb-1">
                Concrete Vervolgstappen (Hoe pakken we dit verder op?)
              </label>
              <textarea
                id="dot-steps-input"
                rows={3}
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="dot-risk-input" className="block text-xs text-slate-400 mb-1">
                Grootste Risico / Aandachtspunt
              </label>
              <input
                id="dot-risk-input"
                type="text"
                value={manualRisk}
                onChange={(e) => setManualRisk(e.target.value)}
                className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dot Advies Opslaan</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Samenvattend Oordeel van Jurjen’s Dot
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{idea.dotSummaryAdvice}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
              <div className="md:col-span-2 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Advies: Hoe dit verder op te pakken met de groep</span>
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {idea.dotNextSteps}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Kritiek Aandachtspunt / Moat</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{idea.dotCriticalRisk}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive €10M+ Business Case Simulator */}
      <div className="pt-2 border-t border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Interactieve €10M+ Business Case Simulator</span>
          </div>
          {economicsChanged && (
            <button
              type="button"
              onClick={() => onUpdateEconomics(idea.id, price, customers, multiple)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Nieuwe Rekensom Opslaan
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <label htmlFor="sim-price">Maandprijs (€/mnd)</label>
              <span className="font-mono tabular-nums text-slate-200 font-semibold">€{price}</span>
            </div>
            <input
              id="sim-price"
              type="range"
              min={25}
              max={2500}
              step={25}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <label htmlFor="sim-customers">Aantal Klanten (Jaar 3)</label>
              <span className="font-mono tabular-nums text-slate-200 font-semibold">{customers}</span>
            </div>
            <input
              id="sim-customers"
              type="range"
              min={10}
              max={1500}
              step={10}
              value={customers}
              onChange={(e) => setCustomers(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <label htmlFor="sim-multiple">Exit Multiple (x ARR)</label>
              <span className="font-mono tabular-nums text-slate-200 font-semibold">{multiple}x</span>
            </div>
            <input
              id="sim-multiple"
              type="range"
              min={4}
              max={15}
              step={1}
              value={multiple}
              onChange={(e) => setMultiple(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400">Jaaromzet (ARR)</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-100 mt-0.5">
              €{(arr / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <div className="p-3 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400">Bedrijfswaardering</div>
            <div
              className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                hitsTenMillion ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              €{(valuation / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <div className="p-3 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400">Nodig voor €10M Exit</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-100 mt-0.5">
              {neededCustomers} klanten
            </div>
          </div>
          <div className="p-3 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400">Exit per Vriend (10 man)</div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-300 mt-0.5">
              €{(payoutPerFriend / 1_000_000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
