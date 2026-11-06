import React, { useState } from 'react';
import {
  Users,
  Lightbulb,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  validateIdeaInput,
  buildShortSummary,
  type VentureIdea,
  type IdeaFormInput,
} from '../utils/ventureMath';
import type { FounderMember } from '../data/seedIdeas';

interface ManagePageViewProps {
  founders: FounderMember[];
  ideas: VentureIdea[];
  onAddFounder: (founder: FounderMember) => Promise<void>;
  onUpdateFounder: (originalName: string, updated: FounderMember) => Promise<void>;
  onDeleteFounder: (name: string) => Promise<void>;
  onOpenNewIdeaModal: () => void;
  onUpdateIdea: (ideaId: string, updatedFields: Partial<VentureIdea>) => Promise<void>;
  onDeleteIdea: (ideaId: string) => Promise<void>;
}

export const ManagePageView: React.FC<ManagePageViewProps> = ({
  founders,
  ideas,
  onAddFounder,
  onUpdateFounder,
  onDeleteFounder,
  onOpenNewIdeaModal,
  onUpdateIdea,
  onDeleteIdea,
}) => {
  // New Founder form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Co-Founder');
  const [newSpecialty, setNewSpecialty] = useState('€10M+ AI Venture Builder');
  const [founderError, setFounderError] = useState<string | null>(null);

  // Editing Founder state
  const [editingFounderName, setEditingFounderName] = useState<string | null>(null);
  const [editFounderForm, setEditFounderForm] = useState<FounderMember>({
    name: '',
    role: '',
    specialty: '',
  });

  // Editing Idea state
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editIdeaForm, setEditIdeaForm] = useState<IdeaFormInput>({
    title: '',
    founderName: '',
    shortSummary: '',
    problemStatement: '',
    aiSolution: '',
    targetMarket: '',
    revenueModel: '',
  });
  const [ideaErrors, setIdeaErrors] = useState<string[]>([]);

  const handleAddFounderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (cleanName.length < 2) {
      setFounderError('Vul een geldige naam in (minimaal 2 tekens).');
      return;
    }
    if (founders.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      setFounderError(`${cleanName} staat al in de vriendenlijst.`);
      return;
    }
    setFounderError(null);
    await onAddFounder({
      name: cleanName,
      role: newRole.trim() || 'Co-Founder',
      specialty: newSpecialty.trim() || '€10M+ AI Venture Builder',
    });
    setNewName('');
    setNewRole('Co-Founder');
    setNewSpecialty('€10M+ AI Venture Builder');
  };

  const startEditFounder = (founder: FounderMember) => {
    setEditingFounderName(founder.name);
    setEditFounderForm({ ...founder });
  };

  const saveEditFounder = async () => {
    if (!editingFounderName || editFounderForm.name.trim().length < 2) return;
    await onUpdateFounder(editingFounderName, {
      name: editFounderForm.name.trim(),
      role: editFounderForm.role.trim() || 'Co-Founder',
      specialty: editFounderForm.specialty.trim() || '€10M+ AI Venture Builder',
    });
    setEditingFounderName(null);
  };

  const startEditIdea = (idea: VentureIdea) => {
    setEditingIdeaId(idea.id);
    setIdeaErrors([]);
    setEditIdeaForm({
      title: idea.title,
      founderName: idea.founderName,
      shortSummary: idea.shortSummary,
      problemStatement: idea.problemStatement,
      aiSolution: idea.aiSolution,
      targetMarket: idea.targetMarket,
      revenueModel: idea.revenueModel,
    });
  };

  const saveEditIdea = async (ideaId: string) => {
    const check = validateIdeaInput(editIdeaForm);
    if (!check.valid) {
      setIdeaErrors(check.errors);
      return;
    }
    await onUpdateIdea(ideaId, {
      title: editIdeaForm.title.trim(),
      founderName: editIdeaForm.founderName.trim(),
      shortSummary: buildShortSummary(editIdeaForm),
      problemStatement: editIdeaForm.problemStatement.trim(),
      aiSolution: editIdeaForm.aiSolution.trim(),
      targetMarket: editIdeaForm.targetMarket.trim(),
      revenueModel: editIdeaForm.revenueModel.trim(),
    });
    setEditingIdeaId(null);
    setIdeaErrors([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Beheer & Edit — Vrienden en Ideeën
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Voeg vrienden of AI-ideeën toe, pas bestaande teksten of het verdienmodel aan of verwijder ze direct.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewIdeaModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw Idee Toevoegen</span>
        </button>
      </div>

      {/* Section 1: Vrienden Beheer */}
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Vriendengroep Beheren ({founders.length} vrienden)
              </h3>
              <p className="text-xs text-slate-400">
                Voeg nieuwe vrienden toe, wijzig hun rol of verwijder een naam uit de lijst.
              </p>
            </div>
          </div>
        </div>

        {founderError && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{founderError}</span>
          </div>
        )}

        {/* Add Friend Form */}
        <form onSubmit={handleAddFounderSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-[#0B0F17] p-4 rounded-lg border border-slate-800">
          <div className="md:col-span-3">
            <label htmlFor="manage-friend-name" className="block text-xs text-slate-400 mb-1">
              Naam van vriend
            </label>
            <input
              id="manage-friend-name"
              type="text"
              placeholder="Bijv. Michiel"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="manage-friend-role" className="block text-xs text-slate-400 mb-1">
              Rol in de groep
            </label>
            <input
              id="manage-friend-role"
              type="text"
              placeholder="Bijv. Co-Founder & Sales"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
            />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="manage-friend-spec" className="block text-xs text-slate-400 mb-1">
              Focus / Expertise
            </label>
            <input
              id="manage-friend-spec"
              type="text"
              placeholder="Bijv. B2B acquisitie & klantvalidatie"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vriend Toevoegen</span>
            </button>
          </div>
        </form>

        {/* Friends Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 px-3 font-medium">Naam</th>
                <th className="py-2.5 px-3 font-medium">Rol</th>
                <th className="py-2.5 px-3 font-medium">Expertise</th>
                <th className="py-2.5 px-3 font-medium text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {founders.map((f) => {
                const isEditing = editingFounderName === f.name;
                return (
                  <tr key={f.name} className="hover:bg-slate-800/30 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label="Bewerk naam van vriend"
                            value={editFounderForm.name}
                            onChange={(e) =>
                              setEditFounderForm({ ...editFounderForm, name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs text-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label="Bewerk rol van vriend"
                            value={editFounderForm.role}
                            onChange={(e) =>
                              setEditFounderForm({ ...editFounderForm, role: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs text-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label="Bewerk expertise van vriend"
                            value={editFounderForm.specialty}
                            onChange={(e) =>
                              setEditFounderForm({ ...editFounderForm, specialty: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs text-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={saveEditFounder}
                            aria-label={`Sla wijzigingen voor ${f.name} op`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded hover:bg-emerald-500/30"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Opslaan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFounderName(null)}
                            aria-label="Annuleer bewerken"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 border border-slate-700 rounded hover:bg-slate-800"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Annuleren</span>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 font-semibold text-slate-100 whitespace-nowrap">
                          {f.name}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300/90 text-xs">{f.role}</td>
                        <td className="py-2.5 px-3 text-slate-300 text-xs">{f.specialty}</td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => startEditFounder(f)}
                            aria-label={`Bewerk vriend ${f.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Bewerk</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFounder(f.name)}
                            aria-label={`Verwijder vriend ${f.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-300 hover:text-red-200 border border-red-900/60 bg-red-950/30 rounded hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Verwijder</span>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Ideeën Beheer */}
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Ingediende Ideeën Beheren ({ideas.length} ideeën)
              </h3>
              <p className="text-xs text-slate-400">
                Pas bestaande ideeën of het verdienmodel aan of verwijder ideeën die afvallen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenNewIdeaModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Idee Toevoegen</span>
          </button>
        </div>

        {ideas.length === 0 ? (
          <div className="p-8 bg-[#0B0F17] border border-slate-800 rounded-xl text-center space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Er staan momenteel 0 ideeën in de tool.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Klik op onderstaande knop om het eerste AI-idee voor een van de vrienden (Jurjen, Hans Guido, Gertjan, Erik, Matthijs, Martijn, Frank, Hermen of Rob) toe te voegen.
            </p>
            <button
              type="button"
              onClick={onOpenNewIdeaModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Eerste Idee Toevoegen</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => {
              const isEditing = editingIdeaId === idea.id;
              return (
                <div
                  key={idea.id}
                  className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-4"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      {ideaErrors.length > 0 && (
                        <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-200">
                          {ideaErrors.join(' ')}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Titel van idee</label>
                          <input
                            type="text"
                            value={editIdeaForm.title}
                            onChange={(e) =>
                              setEditIdeaForm({ ...editIdeaForm, title: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Bedenker</label>
                          <select
                            value={editIdeaForm.founderName}
                            onChange={(e) =>
                              setEditIdeaForm({ ...editIdeaForm, founderName: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                          >
                            {founders.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Doelmarkt</label>
                          <input
                            type="text"
                            value={editIdeaForm.targetMarket}
                            onChange={(e) =>
                              setEditIdeaForm({ ...editIdeaForm, targetMarket: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Korte samenvatting</label>
                        <input
                          type="text"
                          value={editIdeaForm.shortSummary || ''}
                          onChange={(e) =>
                            setEditIdeaForm({ ...editIdeaForm, shortSummary: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Probleemstelling</label>
                          <textarea
                            rows={2}
                            value={editIdeaForm.problemStatement}
                            onChange={(e) =>
                              setEditIdeaForm({ ...editIdeaForm, problemStatement: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">AI-Oplossing</label>
                          <textarea
                            rows={2}
                            value={editIdeaForm.aiSolution}
                            onChange={(e) =>
                              setEditIdeaForm({ ...editIdeaForm, aiSolution: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-amber-400 font-medium mb-1">
                          Hoe denk je er geld mee te verdienen? (Verdienmodel)
                        </label>
                        <textarea
                          rows={2}
                          value={editIdeaForm.revenueModel}
                          onChange={(e) =>
                            setEditIdeaForm({
                              ...editIdeaForm,
                              revenueModel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingIdeaId(null)}
                          className="px-3 py-1.5 text-xs text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800"
                        >
                          Annuleren
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditIdea(idea.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                        >
                          Wijzigingen Opslaan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-amber-400">{idea.founderName}</span>
                          <span>·</span>
                          <span>{idea.targetMarket}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 font-display">{idea.title}</h4>
                        <p className="text-xs text-slate-300 line-clamp-2">{idea.shortSummary}</p>
                        <p className="text-xs text-amber-300/90">
                          <strong className="text-slate-400">Verdienmodel:</strong> {idea.revenueModel}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditIdea(idea)}
                          aria-label={`Bewerk idee ${idea.title}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Bewerk</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteIdea(idea.id)}
                          aria-label={`Verwijder idee ${idea.title}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-300 border border-red-900/60 bg-red-950/30 rounded-lg hover:bg-red-900/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Verwijder</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
