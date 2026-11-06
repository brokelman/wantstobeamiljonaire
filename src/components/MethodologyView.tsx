import React from 'react';
import { Compass, Users, FileText, Bot, LayoutDashboard } from 'lucide-react';
import type { FounderMember } from '../data/seedIdeas';

interface MethodologyViewProps {
  founders: FounderMember[];
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ founders }) => {
  return (
    <div className="space-y-8">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-display">
            De 3-Staps Methode: Van Idee naar Uitwerkings-Dashboard
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Elk ingebracht idee wordt automatisch opgeslagen in de laatst geopende stap, zodat jullie na het afsluiten van de tool altijd direct verder kunnen waar jullie gebleven waren.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <FileText className="w-4 h-4" />
              <span>STAP 1 · IDEE & TEKSTDOCUMENT</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Breng het Idee + Verdienmodel in & Mail naar de Dot
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Beschrijf het probleem, de AI-oplossing en hoe je denkt er geld mee te verdienen. De tool maakt direct een tekstdocument om te plakken of te mailen naar de Dot van Jurjen.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Bot className="w-4 h-4" />
              <span>STAP 2 · ALLEEN DOT-TERUGKOPPELING</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Plak de Terugkoppeling van de Dot & Klik op &ldquo;Verwerk&rdquo;
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In Stap 2 hoef je alleen de ruwe reactie van de Dot van Jurjen te plakken en op <strong>Verwerk</strong> te klikken. De tool combineert dan alle input van het idee met de terugkoppeling van de Dot.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <LayoutDashboard className="w-4 h-4" />
              <span>STAP 3 · HET DASHBOARD & SCORES (0–100)</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Realiteitsscore (0–100), Business Case & Vervolgstappen
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Op het Stap 3 Dashboard zie je de Dot-score én onze eigen Realiteitsscore (0–100):
              <br />• <strong>&lt; 50:</strong> Niet levensvatbaar
              <br />• <strong>50 – 75:</strong> Idee & verdienmodel eerst aanscherpen
              <br />• <strong>75 – 100:</strong> Concrete vervolgstappen maken
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
              Iedereen dient onder zijn eigen naam ideeën in en doorloopt de 3 stappen van idee naar uitwerking.
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
