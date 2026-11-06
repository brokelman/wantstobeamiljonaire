import React, { useState } from 'react';
import { Compass, Users, Calculator, CheckCircle2, Layers } from 'lucide-react';
import {
  calculateAnnualRecurringRevenue,
  calculateEnterpriseValuation,
  calculateCustomersNeededForTenMillion,
  calculateFounderExitPayout,
} from '../utils/ventureMath';
import type { FounderMember } from '../data/seedIdeas';

interface MethodologyViewProps {
  founders: FounderMember[];
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ founders }) => {
  const [targetExitMillions, setTargetExitMillions] = useState<number>(12.5);
  const [monthlyTicketEur, setMonthlyTicketEur] = useState<number>(850);
  const [saasMultiple, setSaasMultiple] = useState<number>(8);

  const targetValuationEur = targetExitMillions * 1_000_000;
  const requiredArrEur = Math.round(targetValuationEur / saasMultiple);
  const requiredCustomers = Math.ceil(requiredArrEur / (monthlyTicketEur * 12));
  const payoutPerPerson = calculateFounderExitPayout(targetValuationEur, founders.length || 10, 80);

  return (
    <div className="space-y-8">
      {/* Intro: Hoe ga je met 10 vrienden van Zaal-Chaos naar een >€10M Uitwerking? */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-display">
            Blauwdruk: Hoe kom je met 10 vrienden van los idee naar een &gt;€10M AI-uitwerking?
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Met 10 man in een zaal brainstormen mislukt bijna altijd door drie valkuilen: <strong>groepsdenken</strong>{' '}
          (de luidste prater wint), <strong>B2C-valkuilen</strong> (leuke consumenten-apps van €15/mnd waar je 80.000
          klanten voor nodig hebt) en <strong>gebrek aan opvolging</strong>. Daarom is deze site gebouwd als een{' '}
          <strong>4-Stage Venture Trechter</strong> waarin de ChatGPT Dot van Jurjen fungeert als onafhankelijke
          poortwachter.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-mono text-amber-400">FASE 01 · ASYNCHROON</div>
            <h3 className="text-sm font-bold text-slate-100">Individuele Invoer per Naam</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vóór jullie bijeenkomst dient ieder van de 10 vrienden 1 tot 2 uitgewerkte AI-cases in onder zijn eigen
              naam. Geen losse kreten, maar een specifiek B2B-pijnpunt + prijsmodel.
            </p>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-mono text-amber-400">FASE 02 · JURJEN’S DOT GATE</div>
            <h3 className="text-sm font-bold text-slate-100">Objectieve AI-Validatie</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              De Dot van Jurjen keurt elk idee op 3 harde criteria: Is €1,5M+ ARR haalbaar? Is het verdedigbaar tegen
              standaard ChatGPT? Wat zijn de eerste 3 validatiestappen?
            </p>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-mono text-amber-400">FASE 03 · KILL YOUR DARLINGS</div>
            <h3 className="text-sm font-bold text-slate-100">Top-2 Selectie & Klantbellen</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kies tijdens de sessie de Top 2 ideeën met een &lsquo;GO&rsquo; van Jurjen’s Dot. Twee subteams van 5 man
              bellen binnen 14 dagen elk 15 potentiële klanten om betalingsbereidheid te testen.
            </p>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-mono text-amber-400">FASE 04 · 90-DAGEN SPRINT</div>
            <h3 className="text-sm font-bold text-slate-100">Concierge MVP & 5 Betaalde Pilots</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Het idee dat als eerste 3 getekende pilot-intenties (€500–€1.250/mnd) ophaalt, krijgt alle 10 vrienden
              erachter. Pas dán bouwen jullie de schaalbare software.
            </p>
          </div>
        </div>
      </div>

      {/* Reverse-Engineering Calculator: Wat is er nodig om alle 10 vrienden miljonair te maken? */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-display">
                De &ldquo;Met 10 Man Miljonair&rdquo; Terugreken-Machine
              </h3>
              <p className="text-xs text-slate-400">
                Reken exact terug hoeveel klanten en welke maandprijs jullie nodig hebben voor een &gt;€10M exit
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <label htmlFor="exit-target-slider">Gewenste Exit Waardering (€M)</label>
              <span className="font-mono tabular-nums font-bold text-amber-400">€{targetExitMillions.toFixed(1)}M</span>
            </div>
            <input
              id="exit-target-slider"
              type="range"
              min={10}
              max={30}
              step={0.5}
              value={targetExitMillions}
              onChange={(e) => setTargetExitMillions(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <label htmlFor="ticket-slider">B2B Abonnementsprijs (€/maand)</label>
              <span className="font-mono tabular-nums font-bold text-slate-100">€{monthlyTicketEur}/mnd</span>
            </div>
            <input
              id="ticket-slider"
              type="range"
              min={100}
              max={2500}
              step={50}
              value={monthlyTicketEur}
              onChange={(e) => setMonthlyTicketEur(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <label htmlFor="multiple-slider">Waarderings-Multiple (x ARR)</label>
              <span className="font-mono tabular-nums font-bold text-slate-100">{saasMultiple}x ARR</span>
            </div>
            <input
              id="multiple-slider"
              type="range"
              min={5}
              max={12}
              step={1}
              value={saasMultiple}
              onChange={(e) => setSaasMultiple(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="text-xs text-slate-400">Benodigde Jaaromzet (ARR)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-100 mt-1">
              €{(requiredArrEur / 1_000_000).toFixed(2)} miljoen / jaar
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              = €{Math.round(requiredArrEur / 12).toLocaleString('nl-NL')} MRR per maand
            </div>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="text-xs text-slate-400">Totaal Benodigde Betalende Klanten</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              Slechts {requiredCustomers} klanten
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Dat zijn slechts {Math.ceil(requiredCustomers / (founders.length || 10))} klanten per vriend!
            </div>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <div className="text-xs text-slate-400">Uitkering per Vriend (bij 80% behoud)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-1">
              €{payoutPerPerson.toLocaleString('nl-NL')} p.p.
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verdeeld over {founders.length || 10} co-founders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rolverdeling voor 10 man */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-display">
              Rolverdeling voor jullie 10 Vrienden (Geen Passagiers, Iedereen Eigenaar)
            </h3>
            <p className="text-xs text-slate-400">
              Met 10 man is jullie grootste wapen distributiekracht en domeinnetwerk. Zo verdelen jullie de rollen:
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 px-3 font-medium">Naam</th>
                <th className="py-2.5 px-3 font-medium">Focusrol in de Venture</th>
                <th className="py-2.5 px-3 font-medium">Concrete Bijdrage richting €10M+</th>
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
