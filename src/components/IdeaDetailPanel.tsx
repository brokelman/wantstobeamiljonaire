import React, { useState, useEffect } from 'react';
import {
  Bot,
  ThumbsUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  Check,
  Mail,
  Download,
  FileText,
  Banknote,
  LayoutDashboard,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import {
  generateDotTextDocument,
  getViabilityBand,
  type VentureIdea,
  type VentureStage,
} from '../utils/ventureMath';

interface IdeaDetailPanelProps {
  idea: VentureIdea;
  onVote: (ideaId: string) => Promise<void>;
  onStageChange: (ideaId: string, stage: VentureStage) => Promise<void>;
  onStepChange: (ideaId: string, step: 1 | 2 | 3) => Promise<void>;
  onUpdateIdea: (ideaId: string, updatedFields: Partial<VentureIdea>) => Promise<void>;
  onProcessDotFeedback: (ideaId: string, dotRawFeedback: string) => Promise<void>;
  isValidatingDot: boolean;
}

export const IdeaDetailPanel: React.FC<IdeaDetailPanelProps> = ({
  idea,
  onVote,
  onStepChange,
  onUpdateIdea,
  onProcessDotFeedback,
  isValidatingDot,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(idea.currentStep || 1);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [jurjenEmail, setJurjenEmail] = useState('');
  const [rawFeedbackInput, setRawFeedbackInput] = useState(idea.dotRawFeedback || '');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Inline sharpen/edit state in Step 1
  const [isEditingStep1, setIsEditingStep1] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editMarket, setEditMarket] = useState(idea.targetMarket);
  const [editProblem, setEditProblem] = useState(idea.problemStatement);
  const [editSolution, setEditSolution] = useState(idea.aiSolution);
  const [editRevenue, setEditRevenue] = useState(idea.revenueModel);

  useEffect(() => {
    setActiveStep(idea.currentStep || 1);
    setRawFeedbackInput(idea.dotRawFeedback || '');
    setEditTitle(idea.title);
    setEditMarket(idea.targetMarket);
    setEditProblem(idea.problemStatement);
    setEditSolution(idea.aiSolution);
    setEditRevenue(idea.revenueModel);
    setIsEditingStep1(false);
    setFeedbackError(null);
  }, [idea.id, idea.currentStep, idea.dotRawFeedback, idea.title, idea.targetMarket, idea.problemStatement, idea.aiSolution, idea.revenueModel]);

  const handleSelectStep = async (step: 1 | 2 | 3) => {
    setActiveStep(step);
    if (idea.currentStep !== step) {
      await onStepChange(idea.id, step);
    }
  };

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

  const handleSaveStep1Edits = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateIdea(idea.id, {
      title: editTitle.trim() || idea.title,
      targetMarket: editMarket.trim() || idea.targetMarket,
      problemStatement: editProblem.trim() || idea.problemStatement,
      aiSolution: editSolution.trim() || idea.aiSolution,
      revenueModel: editRevenue.trim() || idea.revenueModel,
    });
    setIsEditingStep1(false);
  };

  const handleProcessFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rawFeedbackInput.trim();
    if (cleaned.length < 5) {
      setFeedbackError('Plak of typ eerst de terugkoppeling van de Dot van Jurjen (minimaal 5 tekens).');
      return;
    }
    setFeedbackError(null);
    setActiveStep(3);
    await onProcessDotFeedback(idea.id, cleaned);
  };

  const bandInfo = getViabilityBand(idea.dotScore || 0, idea.aiRealityScore || 0);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Header & Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-amber-400">Bedenker: {idea.founderName}</span>
            <span aria-hidden="true">·</span>
            <span>Doelmarkt: {idea.targetMarket}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              Huidige Stap: {activeStep} van 3
            </span>
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

      {/* 3-Step Workflow Selector (Stap 1 -> Stap 2 -> Stap 3) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">
            3-Staps Validatie & Uitwerking (status wordt automatisch opgeslagen)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectStep(1)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              activeStep === 1
                ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">STAP 1</span>
              <FileText className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xs font-semibold text-slate-100 mt-1">
              Idee & Tekstdocument voor Dot
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ingebrachte pitch + verdienmodel mailen/plakken
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStep(2)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              activeStep === 2
                ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">STAP 2</span>
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xs font-semibold text-slate-100 mt-1">
              Terugkoppeling van Dot Inbrengen
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Plak alleen de Dot-reactie & klik op Verwerk
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStep(3)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              activeStep === 3
                ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">STAP 3</span>
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-semibold text-slate-100 mt-1">
              Dashboard: Case, Score & Vervolg
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {idea.dotVerdict === 'pending'
                ? 'Wordt gevuld na klikken op Verwerk in Stap 2'
                : `Dot ${idea.dotScore}/100 · Realiteit ${idea.aiRealityScore}/100`}
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================================
          STAP 1 CONTENT: Idee Overzicht & Tekstdocument voor de Dot van Jurjen
      ===================================================================== */}
      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 font-display">
              Ingebrachte Gegevens van het Idee ({idea.founderName})
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingStep1(!isEditingStep1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditingStep1 ? 'Annuleer bewerken' : 'Idee of Verdienmodel Aanscherpen'}</span>
            </button>
          </div>

          {isEditingStep1 ? (
            <form onSubmit={handleSaveStep1Edits} className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titel van het idee</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Doelmarkt / Klantsegment</label>
                  <input
                    type="text"
                    value={editMarket}
                    onChange={(e) => setEditMarket(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Het Pijnlijke Klantprobleem</label>
                  <textarea
                    rows={3}
                    value={editProblem}
                    onChange={(e) => setEditProblem(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">De AI-Oplossing</label>
                  <textarea
                    rows={3}
                    value={editSolution}
                    onChange={(e) => setEditSolution(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-amber-400 font-medium mb-1">
                  Hoe denken we hier geld mee te verdienen? (Verdienmodel)
                </label>
                <textarea
                  rows={2}
                  value={editRevenue}
                  onChange={(e) => setEditRevenue(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingStep1(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 border border-slate-700 rounded-lg"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Aanscherping Opslaan
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400">1. Het Pijnlijke Klantprobleem</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
                  {idea.problemStatement}
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400">2. De AI-Oplossing</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
                  {idea.aiSolution}
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>3. Hoe verdienen we hier geld mee?</span>
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800/80 h-full">
                  {idea.revenueModel}
                </p>
              </div>
            </div>
          )}

          {/* Gegeneerd Tekstdocument om te Plakken en te Mailen naar de Dot van Jurjen */}
          <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Gegenereerd Tekstdocument voor de Dot van Jurjen (Plakken of Mailen)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kopieer dit tekstdocument om te plakken of mail het naar de Dot van Jurjen. Heb je de terugkoppeling binnen? Ga dan door naar Stap 2.
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
              className="p-4 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed select-all"
            >
              {generatedDoc.body}
            </pre>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSelectStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <span>Ga naar Stap 2: Terugkoppeling van de Dot Inbrengen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAP 2 CONTENT: Alleen de Terugkoppeling van de Dot Inbrengen + Knop "Verwerk"
      ===================================================================== */}
      {activeStep === 2 && (
        <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-start gap-2.5">
              <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Stap 2: Terugkoppeling van de Dot van Jurjen Inbrengen
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Plak of typ hieronder alleen de terugkoppeling van de Dot van Jurjen op <strong>{idea.title}</strong>. Zodra je op <strong>Verwerk</strong> klikt, combineren we alle input van het idee met de terugkoppeling van de Dot tot het Stap 3 Dashboard (inclusief Realiteitsscore 0–100 en vervolgstappen).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setRawFeedbackInput(
                  `De Dot van Jurjen ziet duidelijke potentie in ${idea.targetMarket} voor het idee van ${idea.founderName}. Score: 68/100. Het probleem is pijnlijk genoeg, maar het verdienmodel (${idea.revenueModel}) moet nog scherper gekoppeld worden aan vaste maandelijkse licenties en een diepere koppeling met klantdata zodat het geen simpele wrapper is.`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vul voorbeeld-terugkoppeling in</span>
            </button>
          </div>

          {feedbackError && (
            <div
              role="alert"
              className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200"
            >
              {feedbackError}
            </div>
          )}

          <form onSubmit={handleProcessFeedbackSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="dot-raw-feedback-input"
                className="block text-xs font-semibold text-slate-200 mb-2"
              >
                Terugkoppeling van de Dot van Jurjen:
              </label>
              <textarea
                id="dot-raw-feedback-input"
                rows={7}
                placeholder="Plak hier de volledige reactie / terugkoppeling die je van de Dot van Jurjen hebt gekregen (inclusief eventuele score, kritiekpunten of suggesties)..."
                value={rawFeedbackInput}
                onChange={(e) => setRawFeedbackInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectStep(1)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ← Terug naar Stap 1 (Tekstdocument)
              </button>

              <button
                type="submit"
                disabled={isValidatingDot}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isValidatingDot
                    ? 'Bezig met verwerken naar Stap 3 Dashboard...'
                    : 'Verwerk'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          STAP 3 CONTENT: Het Verwerkte Dashboard (Idee + Business Case + Scores 0-100 + Vervolgstappen)
      ===================================================================== */}
      {activeStep === 3 && (
        <div className="space-y-6">
          {idea.dotVerdict === 'pending' && !idea.dotRawFeedback ? (
            <div className="p-8 bg-[#0B0F17] border border-slate-800 rounded-xl text-center space-y-3">
              <p className="text-sm font-semibold text-slate-200">
                Er is nog geen terugkoppeling van de Dot van Jurjen verwerkt voor dit idee.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Voer eerst in Stap 2 de terugkoppeling van de Dot van Jurjen in en klik op <strong>Verwerk</strong> om dit dashboard te genereren.
              </p>
              <button
                type="button"
                onClick={() => handleSelectStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                <span>Ga naar Stap 2: Terugkoppeling Inbrengen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Score Cards & Levensvatbaarheid Drempel (0-49, 50-75, 75-100) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Score Dot van Jurjen</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
                    {idea.dotScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Op basis van ingebrachte Dot-terugkoppeling
                  </div>
                </div>

                <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Onze Eigen Realiteitsscore</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                    {idea.aiRealityScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Toets op &gt;€10M schaalbaarheid, moat & verdienmodel
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-1 ${
                    bandInfo.band === 'not_viable'
                      ? 'bg-red-950/30 border-red-800/80'
                      : bandInfo.band === 'needs_sharpening'
                      ? 'bg-amber-950/30 border-amber-700/80'
                      : 'bg-emerald-950/30 border-emerald-700/80'
                  }`}
                >
                  <div className="text-xs text-slate-300 font-medium">Eindoordeel & Statusband</div>
                  <div
                    className={`text-base font-bold font-display flex items-center gap-1.5 ${
                      bandInfo.band === 'not_viable'
                        ? 'text-red-400'
                        : bandInfo.band === 'needs_sharpening'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {bandInfo.band === 'not_viable' && <XCircle className="w-4 h-4 shrink-0" />}
                    {bandInfo.band === 'needs_sharpening' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                    {bandInfo.band === 'viable_action_ready' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>
                      {bandInfo.band === 'not_viable'
                        ? 'Niet Levensvatbaar (<50)'
                        : bandInfo.band === 'needs_sharpening'
                        ? 'Idee Aanscherpen (50–75)'
                        : 'Concrete Vervolgstappen (75–100)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    {bandInfo.description}
                  </div>
                </div>
              </div>

              {/* Visuele Schaalverdeling (0-50 | 50-75 | 75-100) */}
              <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    Positie op de Realiteitsmeter (Gecombineerde score: {bandInfo.effectiveScore}/100)
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className={bandInfo.band === 'not_viable' ? 'text-red-400 font-bold' : 'text-slate-500'}>
                      0–49: Niet levensvatbaar
                    </span>
                    <span className={bandInfo.band === 'needs_sharpening' ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      50–75: Eerst aanscherpen
                    </span>
                    <span className={bandInfo.band === 'viable_action_ready' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      75–100: Concrete vervolgstappen
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all ${
                      bandInfo.band === 'not_viable'
                        ? 'bg-red-500'
                        : bandInfo.band === 'needs_sharpening'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, bandInfo.effectiveScore))}%` }}
                  />
                </div>
              </div>

              {/* Dashboard Sectie 1 & 2: Het Idee + De Business Case */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-100 font-display border-b border-slate-800 pb-2">
                    1. Dashboard: Het Idee & Dot Terugkoppeling ({idea.founderName})
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Kernprobleem ({idea.targetMarket}):</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed">{idea.problemStatement}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">AI-Oplossing:</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed">{idea.aiSolution}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-amber-400 font-semibold">Ingebrachte Terugkoppeling Dot van Jurjen:</span>
                      <p className="text-slate-300 mt-0.5 leading-relaxed whitespace-pre-wrap">
                        {idea.dotRawFeedback || idea.dotSummaryAdvice}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-100 font-display border-b border-slate-800 pb-2">
                    2. Dashboard: De Business Case & Verdienmodel Synthese
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-amber-400 font-semibold">Hoe we geld verdienen (Ingebracht):</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed">{idea.revenueModel}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Synthese Business Case (&gt;€10M Toets):</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed whitespace-pre-wrap">
                        {idea.businessCaseSummary}
                      </p>
                    </div>
                    <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Belangrijkste Aandachtspunt / Risico:</span>
                      </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">{idea.dotCriticalRisk}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Sectie 3: Vervolgstappen op basis van de Scoreband */}
              <div
                className={`p-5 rounded-xl border space-y-4 ${
                  bandInfo.band === 'not_viable'
                    ? 'bg-red-950/20 border-red-800/70'
                    : bandInfo.band === 'needs_sharpening'
                    ? 'bg-amber-950/20 border-amber-700/70'
                    : 'bg-emerald-950/20 border-emerald-700/70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                      <span>
                        3. Dashboard: Concrete Vervolgstappen ({bandInfo.label})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Automatisch bepaald op basis van het idee van {idea.founderName}, de Dot-score ({idea.dotScore}/100) en de AI-Realiteitsscore ({idea.aiRealityScore}/100).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(1);
                        setIsEditingStep1(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Idee & Verdienmodel Aanscherpen in Stap 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStep(2)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Dot-Terugkoppeling Aanpassen (Stap 2)</span>
                    </button>
                  </div>
                </div>

                <pre className="text-sm text-slate-100 whitespace-pre-wrap font-sans leading-relaxed bg-[#0B0F17] p-4 rounded-lg border border-slate-800">
                  {idea.dotNextSteps}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
