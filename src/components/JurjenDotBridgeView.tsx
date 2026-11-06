import React, { useState } from 'react';
import {
  Copy,
  Check,
  Bot,
  Mail,
  Download,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  generateDotTextDocument,
  type VentureIdea,
} from '../utils/ventureMath';

interface JurjenDotBridgeViewProps {
  ideas: VentureIdea[];
  onProcessDotFeedback: (ideaId: string, dotRawFeedback: string) => Promise<void>;
  onNavigateToIdeaStep3: (ideaId: string) => void;
}

export const JurjenDotBridgeView: React.FC<JurjenDotBridgeViewProps> = ({
  ideas,
  onProcessDotFeedback,
  onNavigateToIdeaStep3,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedIdeaIdForDoc, setSelectedIdeaIdForDoc] = useState<string>('ALL');
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Step 2 single feedback input state
  const [targetIdeaId, setTargetIdeaId] = useState<string>(ideas[0]?.id || '');
  const [rawFeedbackText, setRawFeedbackText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
    if (!activeId || !rawFeedbackText.trim()) return;
    setIsProcessing(true);
    try {
      await onProcessDotFeedback(activeId, rawFeedbackText.trim());
      setRawFeedbackText('');
      onNavigateToIdeaStep3(activeId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100 font-display">
            De Dot van Jurjen: Tekstdocument Mailen (Stap 1) & Terugkoppeling Verwerken naar Dashboard (Stap 2 → 3)
          </h2>
        </div>
        <p className="text-sm text-slate-300 max-w-4xl leading-relaxed">
          Kopieer of mail in <strong>Stap 1</strong> het gegenereerde tekstdocument naar de Dot van Jurjen. Plak in <strong>Stap 2</strong> alleen de terugkoppeling van de Dot en klik op <strong>Verwerk</strong> om direct naar het <strong>Stap 3 Dashboard</strong> van dat idee te gaan.
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

        {/* STAP 2: Alleen de Terugkoppeling van de Dot Inbrengen + Knop Verwerk */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span>Stap 2: Terugkoppeling van de Dot Inbrengen & Verwerken</span>
            </div>
          </div>

          {ideas.length === 0 ? (
            <div className="p-6 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-400">
              Dien eerst een idee in om de terugkoppeling van de Dot van Jurjen te kunnen verwerken.
            </div>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label htmlFor="step2-idea-select" className="block text-xs text-slate-400 mb-1">
                  Selecteer het idee waarvoor je terugkoppeling van de Dot hebt:
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
                <label htmlFor="step2-feedback-textarea" className="block text-xs text-slate-200 font-semibold mb-1.5">
                  Plak hier alleen de terugkoppeling van de Dot van Jurjen:
                </label>
                <textarea
                  id="step2-feedback-textarea"
                  rows={6}
                  required
                  placeholder="Plak of typ hier de reactie van de Dot van Jurjen..."
                  value={rawFeedbackText}
                  onChange={(e) => setRawFeedbackText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Bezig met verwerken...' : 'Verwerk naar Stap 3 Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
