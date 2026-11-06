import React, { useState } from 'react';
import {
  Copy,
  Check,
  Bot,
  FileJson,
  Mail,
  Download,
  FileText,
  ArrowRight,
  Send,
} from 'lucide-react';
import {
  generateDotTextDocument,
  type VentureIdea,
  type DotVerdict,
  type VentureStage,
} from '../utils/ventureMath';

interface JurjenDotBridgeViewProps {
  ideas: VentureIdea[];
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
}

export const JurjenDotBridgeView: React.FC<JurjenDotBridgeViewProps> = ({
  ideas,
  onSubmitManualDotAdvice,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedIdeaIdForDoc, setSelectedIdeaIdForDoc] = useState<string>('ALL');
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Step 2 quick input state
  const [targetIdeaId, setTargetIdeaId] = useState<string>(ideas[0]?.id || '');
  const [verdict, setVerdict] = useState<DotVerdict>('go');
  const [score, setScore] = useState<number>(85);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [nextStepText, setNextStepText] = useState<string>('');
  const [riskText, setRiskText] = useState<string>('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const openApiUrl = `${origin}/api/openapi.json`;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2400);
  };

  const singleSelectedIdea =
    selectedIdeaIdForDoc !== 'ALL'
      ? ideas.find((i) => i.id === selectedIdeaIdForDoc)
      : undefined;

  const generatedDoc = generateDotTextDocument(ideas, singleSelectedIdea);
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
    generatedDoc.subject
  )}&body=${encodeURIComponent(generatedDoc.body)}`;

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

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeId = targetIdeaId || ideas[0]?.id;
    if (!activeId) return;
    await onSubmitManualDotAdvice(activeId, {
      dotVerdict: verdict,
      dotScore: Number(score),
      dotSummaryAdvice: feedbackText.trim() || 'Feedback van de Dot van Jurjen verwerkt.',
      dotNextSteps: nextStepText.trim() || 'Eerste klantvalidatie oppakken met de groep.',
      dotCriticalRisk: riskText.trim() || 'Verdienmodel toetsen in de praktijk.',
      nextStage: 'business_case',
    });
    setFeedbackText('');
    setNextStepText('');
    setRiskText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Workflow met de Dot van Jurjen: Tekstdocument Mailen (Stap 1) & Feedback Verwerken (Stap 2)
          </h2>
        </div>
        <p className="text-sm text-slate-300 max-w-4xl leading-relaxed">
          Genereer hieronder in <strong>Stap 1</strong> een kant-en-klaar tekstdocument van een los idee of van alle ingediende ideeën (inclusief hoe jullie denken er geld mee te verdienen) om te plakken of direct te mailen naar de Dot van Jurjen. Voer daarna in <strong>Stap 2</strong> de ontvangen feedback van de Dot in om de volgende stap voor de uitwerking te bepalen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* STAP 1: Tekstdocument Genereren, Plakken & Mailen */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Stap 1: Tekstdocument Genereren & Mailen naar Dot van Jurjen</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-idea-selector" className="block text-xs text-slate-400 mb-1">
                Kies welk idee in het tekstdocument moet:
              </label>
              <select
                id="doc-idea-selector"
                value={selectedIdeaIdForDoc}
                onChange={(e) => setSelectedIdeaIdForDoc(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              >
                <option value="ALL">Alle ingediende ideeën ({ideas.length})</option>
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.founderName}: {idea.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-recipient-email" className="block text-xs text-slate-400 mb-1">
                E-mailadres ontvanger (optioneel):
              </label>
              <input
                id="doc-recipient-email"
                type="email"
                placeholder="Bijv. jurjen@..."
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyText('briefing-doc', generatedDoc.body)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              {copiedKey === 'briefing-doc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>
                {copiedKey === 'briefing-doc' ? 'Tekstdocument Gekopieerd!' : 'Kopieer Tekstdocument'}
              </span>
            </button>

            <a
              href={mailtoUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Mail Tekstdocument naar Dot van Jurjen</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>

          <pre className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all">
            {generatedDoc.body}
          </pre>
        </div>

        {/* STAP 2: Feedback van de Dot Invoeren & Gebruiken voor de Volgende Stap */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span>Stap 2: Feedback van de Dot Ingeven & Volgende Stap Vastleggen</span>
            </div>
          </div>

          {ideas.length === 0 ? (
            <div className="p-6 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-400">
              Dien eerst een idee in om de feedback van de Dot van Jurjen bij dat idee te kunnen opslaan.
            </div>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="step2-idea-select" className="block text-xs text-slate-400 mb-1">
                    Selecteer idee waarvoor je Dot-feedback hebt ontvangen:
                  </label>
                  <select
                    id="step2-idea-select"
                    value={targetIdeaId || ideas[0]?.id}
                    onChange={(e) => setTargetIdeaId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                  >
                    {ideas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.founderName} — {idea.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="step2-verdict-select" className="block text-xs text-slate-400 mb-1">
                    Oordeel van de Dot:
                  </label>
                  <select
                    id="step2-verdict-select"
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value as DotVerdict)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                  >
                    <option value="go">GO (Kansrijk)</option>
                    <option value="pivot">PIVOT (Aanpassen)</option>
                    <option value="no_go">NO-GO (Afvallen)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="step2-feedback-textarea" className="block text-xs text-slate-300 font-medium mb-1">
                  1. Plak hier de feedback van de Dot van Jurjen
                </label>
                <textarea
                  id="step2-feedback-textarea"
                  rows={3}
                  required
                  placeholder="Wat zegt de Dot van Jurjen over het idee en hoe we er geld mee willen verdienen?"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div>
                <label htmlFor="step2-nextstep-textarea" className="block text-xs text-emerald-400 font-semibold mb-1">
                  2. Wat wordt onze concrete volgende stap op basis van deze feedback?
                </label>
                <textarea
                  id="step2-nextstep-textarea"
                  rows={3}
                  required
                  placeholder="Hoe gaan we dit nu met de vriendengroep oppakken? Bijv. wie gaat welk onderdeel uitzoeken of testen bij klanten?"
                  value={nextStepText}
                  onChange={(e) => setNextStepText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label htmlFor="step2-risk-input" className="block text-xs text-slate-400 mb-1">
                    Belangrijkste aandachtspunt (optioneel)
                  </label>
                  <input
                    id="step2-risk-input"
                    type="text"
                    placeholder="Bijv. Verdienmodel toetsen bij 3 potentiële klanten..."
                    value={riskText}
                    onChange={(e) => setRiskText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="step2-score-input" className="block text-xs text-slate-400 mb-1">
                    Dot Score (0-100)
                  </label>
                  <input
                    id="step2-score-input"
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Feedback Opslaan & Idee Doorzetten naar Volgende Stap</span>
              </button>
            </form>
          )}

          {/* Optional Direct API Info at bottom */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-amber-400" />
                <span>Optioneel: Directe OpenAPI Koppeling voor Jurjen’s Custom GPT</span>
              </span>
              <button
                type="button"
                onClick={() => copyText('openapi', openApiUrl)}
                className="text-amber-400 hover:underline text-xs"
              >
                {copiedKey === 'openapi' ? 'URL gekopieerd!' : 'Kopieer OpenAPI URL'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Naast het plakken of mailen van het tekstdocument kan Jurjen zijn Custom GPT ook rechtstreeks koppelen via <code className="font-mono text-slate-300">{openApiUrl}</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
