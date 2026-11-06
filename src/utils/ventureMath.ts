export type VentureStage = 'idea' | 'validated' | 'business_case' | 'execution';
export type DotVerdict = 'pending' | 'go' | 'pivot' | 'no_go';

export interface VentureIdea {
  id: string;
  title: string;
  founderName: string;
  authorUid: string;
  shortSummary: string;
  problemStatement: string;
  aiSolution: string;
  targetMarket: string;
  stage: VentureStage;
  monthlyPriceEur: number;
  targetCustomers: number;
  arrMultiple: number;
  estimatedValuationEur: number;
  votesCount: number;
  dotVerdict: DotVerdict;
  dotScore: number;
  dotSummaryAdvice: string;
  dotNextSteps: string;
  dotCriticalRisk: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaFormInput {
  title: string;
  founderName: string;
  shortSummary?: string;
  problemStatement: string;
  aiSolution: string;
  targetMarket: string;
  monthlyPriceEur: number;
  targetCustomers: number;
  arrMultiple: number;
}

export function calculateAnnualRecurringRevenue(monthlyPriceEur: number, targetCustomers: number): number {
  if (monthlyPriceEur <= 0 || targetCustomers <= 0) return 0;
  return Math.round(monthlyPriceEur * 12 * targetCustomers);
}

export function calculateEnterpriseValuation(
  monthlyPriceEur: number,
  targetCustomers: number,
  arrMultiple: number
): number {
  const arr = calculateAnnualRecurringRevenue(monthlyPriceEur, targetCustomers);
  if (arr <= 0 || arrMultiple <= 0) return 0;
  return Math.round(arr * arrMultiple);
}

export function isTenMillionPlusCase(valuationEur: number): boolean {
  return valuationEur >= 10_000_000;
}

export function calculateCustomersNeededForTenMillion(
  monthlyPriceEur: number,
  arrMultiple: number
): number {
  if (monthlyPriceEur <= 0 || arrMultiple <= 0) return 0;
  const valuePerCustomerPerYear = monthlyPriceEur * 12 * arrMultiple;
  return Math.ceil(10_000_000 / valuePerCustomerPerYear);
}

export function calculateFounderExitPayout(
  valuationEur: number,
  founderCount: number = 10,
  retainedEquityPercent: number = 80
): number {
  if (valuationEur <= 0 || founderCount <= 0 || retainedEquityPercent <= 0) return 0;
  return Math.round((valuationEur * (retainedEquityPercent / 100)) / founderCount);
}

export function buildShortSummary(input: IdeaFormInput): string {
  if (input.shortSummary && input.shortSummary.trim().length >= 10) {
    return input.shortSummary.trim().slice(0, 600);
  }
  const cleanTarget = input.targetMarket.trim();
  const cleanSol = input.aiSolution.trim();
  const arr = calculateAnnualRecurringRevenue(input.monthlyPriceEur, input.targetCustomers);
  const arrFormatted = (arr / 1_000_000).toFixed(2);
  const generated = `AI-oplossing voor ${cleanTarget}: ${cleanSol.slice(0, 220)}${cleanSol.length > 220 ? '...' : ''} (Doel: €${arrFormatted}M ARR bij ${input.targetCustomers} klanten).`;
  return generated.slice(0, 600);
}

export function validateIdeaInput(input: IdeaFormInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 3 || input.title.trim().length > 120) {
    errors.push('Geef het idee een duidelijke naam (tussen 3 en 120 tekens).');
  }
  if (!input.founderName || input.founderName.trim().length < 2 || input.founderName.trim().length > 60) {
    errors.push('Selecteer of vul de naam van de bedenker in (2 tot 60 tekens).');
  }
  if (!input.targetMarket || input.targetMarket.trim().length < 2 || input.targetMarket.trim().length > 200) {
    errors.push('Specificeer een concrete doelmarkt of klantsegment (minimaal 2 tekens).');
  }
  if (!input.problemStatement || input.problemStatement.trim().length < 10 || input.problemStatement.trim().length > 1500) {
    errors.push('Beschrijf het pijnlijke probleem uitgebreider (minimaal 10 tekens).');
  }
  if (!input.aiSolution || input.aiSolution.trim().length < 10 || input.aiSolution.trim().length > 1500) {
    errors.push('Leg uit hoe de AI-oplossing werkt en waarde levert (minimaal 10 tekens).');
  }
  if (!Number.isFinite(input.monthlyPriceEur) || input.monthlyPriceEur <= 0) {
    errors.push('Vul een geldige maandprijs in euro’s in (groter dan €0).');
  }
  if (!Number.isFinite(input.targetCustomers) || input.targetCustomers <= 0) {
    errors.push('Vul een realistisch doel-aantal klanten in (groter dan 0).');
  }
  if (!Number.isFinite(input.arrMultiple) || input.arrMultiple < 1 || input.arrMultiple > 50) {
    errors.push('De ARR-multiple moet tussen 1x en 50x liggen (standaard voor AI SaaS is 6x–10x).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateDeterministicDotAdvice(idea: {
  title: string;
  founderName: string;
  targetMarket: string;
  problemStatement: string;
  aiSolution: string;
  monthlyPriceEur: number;
  targetCustomers: number;
  arrMultiple: number;
}): {
  dotVerdict: DotVerdict;
  dotScore: number;
  dotSummaryAdvice: string;
  dotNextSteps: string;
  dotCriticalRisk: string;
  recommendedStage: VentureStage;
} {
  const valuation = calculateEnterpriseValuation(
    idea.monthlyPriceEur,
    idea.targetCustomers,
    idea.arrMultiple
  );
  const arr = calculateAnnualRecurringRevenue(idea.monthlyPriceEur, idea.targetCustomers);
  const neededCustomers = calculateCustomersNeededForTenMillion(idea.monthlyPriceEur, idea.arrMultiple);

  const hasB2BPricing = idea.monthlyPriceEur >= 250;
  const hitsTenMillion = valuation >= 10_000_000;
  const manageableCustomerCount = idea.targetCustomers <= 2500;

  let score = 58;
  if (hitsTenMillion) score += 18;
  if (hasB2BPricing) score += 10;
  if (manageableCustomerCount) score += 7;
  if (idea.aiSolution.toLowerCase().includes('agent') || idea.aiSolution.toLowerCase().includes('integratie') || idea.aiSolution.toLowerCase().includes('erp') || idea.aiSolution.toLowerCase().includes('workflow')) {
    score += 5;
  }
  score = Math.min(96, Math.max(35, score));

  let verdict: DotVerdict = 'pivot';
  if (hitsTenMillion && score >= 78) {
    verdict = 'go';
  } else if (valuation < 4_000_000 && idea.monthlyPriceEur < 50) {
    verdict = 'no_go';
  }

  const formattedVal = (valuation / 1_000_000).toFixed(1);
  const formattedArr = (arr / 1_000_000).toFixed(2);

  const summaryAdvice = hitsTenMillion
    ? `Dot van Jurjen oordeel voor ${idea.founderName}: Sterke €10M+ potentie (geschatte waardering €${formattedVal}M bij €${formattedArr}M ARR). De combinatie van een specifiek pijnpunt in '${idea.targetMarket}' en een prijs van €${idea.monthlyPriceEur}/mnd maakt dat jullie slechts ${neededCustomers} betalende klanten nodig hebben voor de €10M-grens.`
    : `Dot van Jurjen oordeel voor ${idea.founderName}: De huidige rekensom komt uit op €${formattedVal}M waardering (€${formattedArr}M ARR). Om met 10 man de €10M-grens te kraken moeten jullie óf de ticketprijs verhogen naar een enterprise workflow-niveau, óf doorgroeien naar minimaal ${neededCustomers} klanten in '${idea.targetMarket}'.`;

  const nextSteps =
    `1. Klantvalidatie (Week 1-2): Laat 2 man uit de groep deze week 15 beslissers in '${idea.targetMarket}' bellen met één vraag: 'Betalen jullie €${idea.monthlyPriceEur}/mnd als wij dit probleem 80% autonoom oplossen?'\n` +
    `2. Concierge MVP (Week 3-4): Bouw nog geen compleet platform; draai de AI-workflow eerst handmatig achter de schermen voor 3 pilotklanten.\n` +
    `3. Data-Moat vastleggen (Maand 2): Koppel direct aan de bronsystemen van de klant zodat jullie oplossing niet eenvoudig door een standaard ChatGPT-prompt te kopiëren is.`;

  const criticalRisk = !hasB2BPricing
    ? `Lage ticketprijs (€${idea.monthlyPriceEur}/mnd) vereist ${neededCustomers} klanten voor €10M waardering — hoge marketingkosten (CAC) voor een team zonder megabudget.`
    : `Dunne 'wrapper'-gevaar: als jullie AI-oplossing geen eigen domeindata of directe systeemintegratie in '${idea.targetMarket}' opbouwt, kan een concurrent de prompt binnen 2 weken kopiëren.`;

  return {
    dotVerdict: verdict,
    dotScore: score,
    dotSummaryAdvice: summaryAdvice,
    dotNextSteps: nextSteps,
    dotCriticalRisk: criticalRisk,
    recommendedStage: verdict === 'go' ? 'business_case' : 'validated',
  };
}

export function filterIdeas(
  ideas: VentureIdea[],
  options: {
    founderName?: string;
    stage?: string;
    verdict?: string;
    searchQuery?: string;
  }
): VentureIdea[] {
  return ideas.filter((idea) => {
    if (options.founderName && options.founderName !== 'ALL') {
      if (idea.founderName.toLowerCase() !== options.founderName.toLowerCase()) {
        return false;
      }
    }
    if (options.stage && options.stage !== 'ALL') {
      if (idea.stage !== options.stage) return false;
    }
    if (options.verdict && options.verdict !== 'ALL') {
      if (idea.dotVerdict !== options.verdict) return false;
    }
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.trim().toLowerCase();
      const hay = `${idea.title} ${idea.founderName} ${idea.shortSummary} ${idea.targetMarket} ${idea.problemStatement} ${idea.aiSolution}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
