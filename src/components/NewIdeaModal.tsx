import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Banknote } from 'lucide-react';
import { validateIdeaInput, type IdeaFormInput } from '../utils/ventureMath';
import type { FounderMember } from '../data/seedIdeas';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  founders: FounderMember[];
  selectedFounderFilter: string;
  onSubmitIdea: (input: IdeaFormInput) => Promise<void>;
}

export const NewIdeaModal: React.FC<NewIdeaModalProps> = ({
  isOpen,
  onClose,
  founders,
  selectedFounderFilter,
  onSubmitIdea,
}) => {
  const defaultFounder =
    selectedFounderFilter && selectedFounderFilter !== 'ALL'
      ? selectedFounderFilter
      : founders[0]?.name || 'Jurjen';

  const [title, setTitle] = useState('');
  const [founderName, setFounderName] = useState(defaultFounder);
  const [customFounderName, setCustomFounderName] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [shortSummary, setShortSummary] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [aiSolution, setAiSolution] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFounderName(
        selectedFounderFilter && selectedFounderFilter !== 'ALL'
          ? selectedFounderFilter
          : founders[0]?.name || 'Jurjen'
      );
    }
  }, [isOpen, selectedFounderFilter, founders]);

  if (!isOpen) return null;

  const activeFounder = founderName === '__CUSTOM__' ? customFounderName : founderName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: IdeaFormInput = {
      title,
      founderName: activeFounder,
      shortSummary: shortSummary.trim() ? shortSummary : undefined,
      targetMarket,
      problemStatement,
      aiSolution,
      revenueModel,
    };

    const check = validateIdeaInput(payload);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);
    try {
      await onSubmitIdea(payload);
      setTitle('');
      setTargetMarket('');
      setShortSummary('');
      setProblemStatement('');
      setAiSolution('');
      setRevenueModel('');
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Kon idee niet opslaan.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-idea-dialog-title"
    >
      <div className="w-full max-w-3xl bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 id="new-idea-dialog-title" className="text-xl font-bold text-slate-100 font-display">
              Nieuw AI-Idee Indienen
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Koppel het idee aan je naam, beschrijf hoe je denkt er geld mee te verdienen en genereer direct een tekstdocument voor de Dot van Jurjen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit venster"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-4 p-4 bg-red-950/50 border border-red-800/80 rounded-lg text-sm text-red-200 space-y-1"
          >
            <div className="flex items-center gap-2 font-semibold text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Controleer de volgende velden:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="idea-founder" className="block text-xs font-medium text-slate-300 mb-1.5">
                Naam van bedenker (Vriendengroep)
              </label>
              <select
                id="idea-founder"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {founders.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} — {f.role}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Andere naam toevoegen...</option>
              </select>
              {founderName === '__CUSTOM__' && (
                <input
                  type="text"
                  aria-label="Nieuwe naam van vriend"
                  placeholder="Typ je voornaam..."
                  value={customFounderName}
                  onChange={(e) => setCustomFounderName(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div>
              <label htmlFor="idea-title" className="block text-xs font-medium text-slate-300 mb-1.5">
                Werknaam van het AI-Idee
              </label>
              <input
                id="idea-title"
                type="text"
                placeholder="Bijv. NotarisAI — Automatische Akte-Controle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="idea-market" className="block text-xs font-medium text-slate-300 mb-1.5">
                Specifieke Doelmarkt / Klantsegment
              </label>
              <input
                id="idea-market"
                type="text"
                placeholder="Bijv. Notariskantoren & vastgoedjuristen in NL/BE"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="idea-summary" className="block text-xs font-medium text-slate-300 mb-1.5">
                Korte Samenvatting (1-2 zinnen, optioneel auto-gegenereerd)
              </label>
              <input
                id="idea-summary"
                type="text"
                placeholder="Korte pitch in één zin voor op het overzicht..."
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="idea-problem" className="block text-xs font-medium text-slate-300 mb-1.5">
                Welk pijnlijk probleem lossen we op?
              </label>
              <textarea
                id="idea-problem"
                rows={3}
                placeholder="Waar loopt deze doelgroep nu dagelijks op vast? Welk handmatig werk of risico nemen we weg?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="idea-solution" className="block text-xs font-medium text-slate-300 mb-1.5">
                Hoe lost onze AI dit op?
              </label>
              <textarea
                id="idea-solution"
                rows={3}
                placeholder="Wat doet de AI-oplossing precies en waarom is dit slimmer dan een losse ChatGPT-prompt?"
                value={aiSolution}
                onChange={(e) => setAiSolution(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Text Revenue Model Question instead of premature numbers */}
          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
            <label htmlFor="idea-revenue-model" className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Banknote className="w-4 h-4" />
              <span>Hoe denk je er geld mee te verdienen? (Verdienmodel in tekst)</span>
            </label>
            <textarea
              id="idea-revenue-model"
              rows={3}
              placeholder="Beschrijf in eigen woorden hoe we hier geld mee verdienen. Bijvoorbeeld: een maandelijks abonnement voor kantoren, betalen per gegenereerd dossier, of een succesfee op bespaarde kosten..."
              value={revenueModel}
              onChange={(e) => setRevenueModel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {isSubmitting ? 'Bezig met opslaan...' : 'Idee Opslaan & Tekstdocument Genereren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
