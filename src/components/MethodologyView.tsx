import React from 'react';
import { Compass, Users, FileText, Bot, ArrowRight } from 'lucide-react';
import type { FounderMember } from '../data/seedIdeas';

interface MethodologyViewProps {
  founders: FounderMember[];
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ founders }) => {
  return (
    <div className="space-y-8">
      {/* Intro: Hoe ga je met jullie vriendengroep van Zaal-Chaos naar een >€10M Uitwerking? */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-display">
            Werkwijze: Van Ruw Idee naar Uitwerking via de Dot van Jurjen
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          In de eerste brainstormfase heeft het nog geen zin om te gokken op exacte klantprijzen, aantallen klanten of exit-multipliers. Wat wél telt is dat ieder van jullie per naam scherp opschrijft: <strong>welk pijnlijk probleem lossen we op, hoe doet onze AI dat, en hoe denken we er geld mee te verdienen?</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <FileText className="w-4 h-4" />
              <span>STAP 1 · IDEE + VERDIENMODEL MAILEN</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Genereer Tekstdocument & Stuur naar de Dot van Jurjen
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zodra een vriend een idee invoert (inclusief in tekst hoe je denkt er geld mee te verdienen), maakt de site automatisch een gestructureerd tekstdocument. Dit kun je met 1 klik kopiëren om te plakken of direct mailen naar de Dot van Jurjen.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Bot className="w-4 h-4" />
              <span>STAP 2 · FEEDBACK VAN DE DOT INGEVEN</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Voer het Oordeel van de Dot van Jurjen in op de Site
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              De Dot van Jurjen beoordeelt als Advisory Board of het probleem, de AI-oplossing en het verdienmodel potentie hebben voor een &gt;€10M businesscase. Je plakt de feedback van de Dot bij het idee in Stap 2.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <ArrowRight className="w-4 h-4" />
              <span>STAP 3 · VOLGENDE STAP & UITWERKING</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Gebruik de Dot-Feedback voor Concrete Actie met de Groep
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Op basis van de ingevoerde Dot-feedback leg je per idee de concrete vervolgstap vast: wie uit de vriendengroep gaat deze week met potentiële klanten praten of een eerste test bouwen?
            </p>
          </div>
        </div>
      </div>

      {/* Rolverdeling voor de vrienden */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-display">
              De Vriendengroep ({founders.length} Co-Founders)
            </h3>
            <p className="text-xs text-slate-400">
              Iedereen dient onder zijn eigen naam ideeën in en pakt na het oordeel van de Dot van Jurjen een concrete vervolgstap op.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 px-3 font-medium">Naam</th>
                <th className="py-2.5 px-3 font-medium">Rol in de Groep</th>
                <th className="py-2.5 px-3 font-medium">Bijdrage van Idee naar Uitwerking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {founders.map((f) => (
                <tr key={f.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-100 whitespace-nowrap">{f.name}</td>
                  <td className="py-2.5 px-3 text-amber-300/90 text-xs">{f.role}</td>
                  <td className="py-2.5 px-3 text-slate-300 text-xs">{f.specialty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
