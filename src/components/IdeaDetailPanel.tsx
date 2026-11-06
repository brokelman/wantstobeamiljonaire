import React, { useState, useEffect } from 'react';
import {
  Bot,
  ThumbsUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  Copy,
  Check,
  Mail,
  Download,
  FileText,
  Banknote,
} from 'lucide-react';
import {
  generateDotTextDocument,
  type VentureIdea,
  type VentureStage,
  type DotVerdict,
} from '../utils/ventureMath';

interface IdeaDetailPanelProps {
  idea: VentureIdea;
  onVote: (ideaId: string) => Promise<void>;
  onStageChange: (ideaId: string, stage: VentureStage) => Promise<void>;
  onTriggerDotValidation: (ideaId: string) => Promise<void>;
  onSubmitManualDotAdvice: (
    ideaId: string,
    payload: {
      dotVerdict: DotVerdict;
      dotScore: number;
      dotSummaryAdvice: string;
      dotNextSteps: string;
      dotCriticalRisk: string;
      nextStage?: VentureStage;
    }
  ) => Promise<void>;
  isValidatingDot: boolean;
}

const STAGES: { key: VentureStage; label: string; step: string }[] = [
  { key: 'idea', label: '1. Idee & Verdienmodel', step: 'Klaar voor Dot Tekstdocument' },
  { key: 'validated', label: '2. Dot Feedback Ontvangen', step: 'Getoetst door Jurjen’s Dot' },
  { key: 'business_case', label: '3. Uitwerking & Validatie', step: 'Volgende stap met de groep' },
  { key: 'execution', label: '4. Klantpilots & Bouw', step: 'Eerste betalende klanten' },
];

export const IdeaDetailPanel: React.FC<IdeaDetailPanelProps> = ({
  idea,
  onVote,
  onStageChange,
  onTriggerDotValidation,
  onSubmitManualDotAdvice,
  isValidatingDot,
}) => {
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [jurjenEmail, setJurjenEmail] = useState('');
  const [showStep2Form, setShowStep2Form] = useState(idea.dotVerdict === 'pending');

  const [manualVerdict, setManualVerdict] = useState<DotVerdict>(
    idea.dotVerdict === 'pending' ? 'go' : idea.dotVerdict
  );
  const [manualScore, setManualScore] = useState<number>(idea.dotScore || 85);
  const [manualSummary, setManualSummary] = useState(
    idea.dotVerdict === 'pending' ? '' : idea.dotSummaryAdvice
  );
  const [manualSteps, setManualSteps] = useState(
    idea.dotVerdict === 'pending' ? '' : idea.dotNextSteps
  );
  const [manualRisk, setManualRisk] = useState(
    idea.dotVerdict === 'pending' ? '' : idea.dotCriticalRisk
  );
  const [nextStageChoice, setNextStageChoice] = useState<VentureStage>(
    idea.stage === 'idea' ? 'validated' : idea.stage
  );

  useEffect(() => {
    setManualVerdict(idea.dotVerdict === 'pending' ? 'go' : idea.dotVerdict);
    setManualScore(idea.dotScore || 85);
    setManualSummary(idea.dotVerdict === 'pending' ? '' : idea.dotSummaryAdvice);
    setManualSteps(idea.dotVerdict === 'pending' ? '' : idea.dotNextSteps);
    setManualRisk(idea.dotVerdict === 'pending' ? '' : idea.dotCriticalRisk);
    setNextStageChoice(idea.stage === 'idea' ? 'validated' : idea.stage);
    setShowStep2Form(idea.dotVerdict === 'pending');
  }, [idea]);

  const generatedDoc = generateDotTextDocument([idea], idea);
  const mailtoHref = `mailto:${encodeURIComponent(jurjenEmail.trim())}?subject=${encodeURIComponent(
    generatedDoc.subject
  )}&body=${encodeURIComponent(generatedDoc.body)}`;

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(generatedDoc.body);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedDoc.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedDoc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderVerdictStatus = (verdict: DotVerdict, score: number) => {
    if (verdict === 'go') {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>GO VAN DOT · Score {score}/100</span>
        </span>
      );
    }
    if (verdict === 'pivot') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>AANPASSING NODIG (PIVOT) · Score {score}/100</span>
        </span>
      );
    }
    if (verdict === 'no_go') {
      return (
        <span className="inline-flex items-center gap-1.5 text-red-400 font-medium text-xs">
          <XCircle className="w-4 h-4" />
          <span>NO-GO · Score {score}/100</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-xs">
        <Clock className="w-4 h-4" />
        <span>Stap 1 klaar · Wacht op feedback van Jurjen’s Dot</span>
      </span>
    );
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitManualDotAdvice(idea.id, {
      dotVerdict: manualVerdict,
      dotScore: Number(manualScore),
      dotSummaryAdvice:
        manualSummary.trim() || 'Feedback van de Dot van Jurjen verwerkt.',
      dotNextSteps:
        manualSteps.trim() || 'Bespreek deze feedback met de vriendengroep en bepaal de eerste klantactie.',
      dotCriticalRisk: manualRisk.trim() || 'Geen specifiek risico opgegeven.',
      nextStage: nextStageChoice,
    });
    setShowStep2Form(false);
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
            <span className="font-mono tabular-nums">{idea.votesCount} stemmen</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Venture Funnel Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">
            Voortgang van Idee naar Uitwerking (klik om fase bij te werken)
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

      {/* Problem, AI Solution & Revenue Model */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400">1. Het Pijnlijke Klantprobleem</h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
            {idea.problemStatement}
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400">2. De AI-Oplossing</h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
            {idea.aiSolution}
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" />
            <span>3. Hoe verdienen we hier geld mee?</span>
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
            {idea.revenueModel}
          </p>
        </div>
      </div>

      {/* STAP 1: Gegeneerd Tekstdocument om te Plakken en te Mailen naar de Dot van Jurjen */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-start gap-2.5">
            <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display">
                Stap 1: Tekstdocument voor de Dot van Jurjen (Plakken of Mailen)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dit tekstdocument bevat de volledige pitch én het verdienmodel van {idea.founderName}. Kopieer de tekst om te plakken of mail hem direct naar Jurjen / de Dot van Jurjen.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDoc}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {copiedDoc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDoc ? 'Tekstdocument Gekopieerd!' : 'Kopieer Tekstdocument'}</span>
            </button>

            <a
              href={mailtoHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Mail naar Dot van Jurjen</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <label htmlFor="jurjen-email-input" className="text-slate-400 whitespace-nowrap">
            Optioneel ontvanger e-mailadres (voor Mail-knop):
          </label>
          <input
            id="jurjen-email-input"
            type="email"
            placeholder="Bijv. jurjen@voorbeeld.nl (of laat leeg om in je mailprogramma te kiezen)"
            value={jurjenEmail}
            onChange={(e) => setJurjenEmail(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <pre
          aria-label="Gegenereerd tekstdocument voor de Dot van Jurjen"
          className="p-4 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed select-all"
        >
          {generatedDoc.body}
        </pre>
      </div>

      {/* STAP 2: Feedback van de Dot van Jurjen Ingeven & Gebruiken voor de Volgende Stap */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-start gap-2.5">
            <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display">
                Stap 2: Feedback van de Dot van Jurjen Invoeren & Volgende Stap Bepalen
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Plak hier de reactie van Jurjen’s Dot en leg direct vast hoe jullie dit idee in de volgende stap gaan uitwerken.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isValidatingDot}
              onClick={() => onTriggerDotValidation(idea.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isValidatingDot ? 'Dot-analyse bezig...' : 'Laat AI alvast concept-feedback invullen'}
              </span>
            </button>

            {idea.dotVerdict !== 'pending' && (
              <button
                type="button"
                onClick={() => setShowStep2Form(!showStep2Form)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                {showStep2Form ? 'Toon Overzicht' : 'Bewerk Dot Feedback & Vervolgstap'}
              </button>
            )}
          </div>
        </div>

        {showStep2Form ? (
          <form onSubmit={handleManualSave} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dot-verdict-select" className="block text-xs text-slate-300 font-medium mb-1">
                  Oordeel van de Dot van Jurjen
                </label>
                <select
                  id="dot-verdict-select"
                  value={manualVerdict}
                  onChange={(e) => setManualVerdict(e.target.value as DotVerdict)}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                >
                  <option value="go">GO — Kansrijke &gt;€10M Case</option>
                  <option value="pivot">PIVOT — Verdienmodel of Niche Aanscherpen</option>
                  <option value="no_go">NO-GO — Afvallen</option>
                </select>
              </div>

              <div>
                <label htmlFor="dot-score-input" className="block text-xs text-slate-300 font-medium mb-1">
                  Dot Score (0 - 100)
                </label>
                <input
                  id="dot-score-input"
                  type="number"
                  min={0}
                  max={100}
                  value={manualScore}
                  onChange={(e) => setManualScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono tabular-nums text-slate-100"
                />
              </div>

              <div>
                <label htmlFor="dot-next-stage-select" className="block text-xs text-slate-300 font-medium mb-1">
                  Zet idee door naar volgende fase
                </label>
                <select
                  id="dot-next-stage-select"
                  value={nextStageChoice}
                  onChange={(e) => setNextStageChoice(e.target.value as VentureStage)}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                >
                  <option value="validated">2. Dot Feedback Ontvangen</option>
                  <option value="business_case">3. Uitwerking & Validatie met Groep</option>
                  <option value="execution">4. Klantpilots & Bouw</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dot-summary-input" className="block text-xs text-slate-300 font-medium mb-1">
                Feedback van de Dot van Jurjen (plak hier het antwoord uit de mail of ChatGPT Dot)
              </label>
              <textarea
                id="dot-summary-input"
                rows={3}
                placeholder="Plak hier wat de Dot van Jurjen vindt van het idee en het voorgestelde verdienmodel..."
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="dot-steps-input" className="block text-xs text-emerald-400 font-semibold mb-1">
                Actieplan voor de Volgende Stap (Hoe pakken we dit nu verder op met de groep?)
              </label>
              <textarea
                id="dot-steps-input"
                rows={3}
                placeholder="Welke concrete vervolgstap zetten we op basis van deze feedback? Bijv. wie uit de groep belt deze week 5 bedrijven om het verdienmodel te toetsen?"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="dot-risk-input" className="block text-xs text-slate-300 font-medium mb-1">
                Belangrijkste Aandachtspunt / Risico uit de Dot-feedback (optioneel)
              </label>
              <input
                id="dot-risk-input"
                type="text"
                placeholder="Bijv. Zorg dat het een terugkerend abonnement wordt i.p.v. uurtje-factuurtje..."
                value={manualRisk}
                onChange={(e) => setManualRisk(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dot Feedback & Volgende Stap Opslaan</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-1.5">
              <div className="text-xs font-semibold text-amber-400">
                Ingevoerde Feedback van de Dot van Jurjen
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {idea.dotSummaryAdvice}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 bg-[#111827] border border-emerald-900/50 rounded-lg space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Volgende Stap: Hoe we dit nu verder oppakken</span>
                </div>
                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {idea.dotNextSteps}
                </pre>
              </div>

              <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-1.5">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Aandachtspunt / Moat</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{idea.dotCriticalRisk}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
