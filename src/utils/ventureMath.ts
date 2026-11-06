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
  revenueModel: string;
  stage: VentureStage;
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
  revenueModel: string;
}

export function buildShortSummary(input: IdeaFormInput): string {
  if (input.shortSummary && input.shortSummary.trim().length >= 10) {
    return input.shortSummary.trim().slice(0, 600);
  }
  const cleanTarget = input.targetMarket.trim();
  const cleanSol = input.aiSolution.trim();
  const cleanRev = input.revenueModel.trim();
  const generated = `AI-oplossing voor ${cleanTarget}: ${cleanSol.slice(0, 180)}${cleanSol.length > 180 ? '...' : ''} (Verdienmodel: ${cleanRev.slice(0, 120)}${cleanRev.length > 120 ? '...' : ''})`;
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
  if (!input.revenueModel || input.revenueModel.trim().length < 5 || input.revenueModel.trim().length > 1500) {
    errors.push('Beschrijf hoe je denkt er geld mee te verdienen (minimaal 5 tekens).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateDotTextDocument(
  ideas: VentureIdea[],
  singleIdea?: VentureIdea
): {
  subject: string;
  body: string;
  filename: string;
} {
  const targetList = singleIdea ? [singleIdea] : ideas;

  if (targetList.length === 0) {
    return {
      subject: 'Validatieverzoek voor de Dot van Jurjen — TienMiljoen Lab',
      body: 'Er zijn nog geen ideeën ingevoerd om te valideren.',
      filename: 'dot-van-jurjen-briefing.txt',
    };
  }

  if (singleIdea) {
    const subject = `Dot van Jurjen Validatieverzoek: ${singleIdea.title} (door ${singleIdea.founderName})`;
    const slug = singleIdea.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const body = `TEKSTDOCUMENT VOOR DE CHATGPT DOT VAN JURJEN (ADVISORY BOARD)
====================================================================
Project: TienMiljoen Lab (>€10M AI Venture Brainstorm)
Ingediend door: ${singleIdea.founderName}
Titel van het idee: ${singleIdea.title}
Huidige fase: ${singleIdea.stage}

1. KORTE SAMENVATTING
${singleIdea.shortSummary}

2. SPECIFIEKE DOELMARKT / KLANTSEGMENT
${singleIdea.targetMarket}

3. WELK PIJNLIJK PROBLEEM LOSSEN WE OP?
${singleIdea.problemStatement}

4. HOE LOST ONZE AI DIT OP (INCL. VERDEDIGBARE MOAT)?
${singleIdea.aiSolution}

5. HOE DENKEN WE HIER GELD MEE TE VERDIENEN? (VERDIENMODEL)
${singleIdea.revenueModel}

====================================================================
VRAAG AAN DE DOT VAN JURJEN (VOOR STAP 2 OP ONZE SITE):
Wil je dit idee van ${singleIdea.founderName} beoordelen voor onze vriendengroep op:
1. OORDEEL (GO / PIVOT / NO-GO) + SCORE (0-100): Heeft dit idee met dit verdienmodel realistische potentie om uit te groeien tot een >€10 miljoen bedrijf?
2. FEEDBACK OP HET VERDIENMODEL & MOAT: Is de manier waarop we geld willen verdienen schaalbaar en verdedigbaar tegen standaard AI-tools?
3. CONCRETE VERVOLGSTAP: Welke 3 concrete stappen moeten wij nu als vriendengroep zetten om dit idee van papier naar de volgende fase (klantvalidatie / eerste pilot) te brengen?`;

    return {
      subject,
      body,
      filename: `dot-briefing-${slug || 'idee'}.txt`,
    };
  }

  const subject = `Dot van Jurjen Validatieverzoek — Overzicht van ${targetList.length} AI-Ideeën (TienMiljoen Lab)`;
  const body = `TEKSTDOCUMENT VOOR DE CHATGPT DOT VAN JURJEN (ADVISORY BOARD)
====================================================================
Project: TienMiljoen Lab (>€10M AI Venture Brainstorm met de vriendengroep)
Aantal ingediende ideeën: ${targetList.length}

Hieronder staan de uitgewerkte AI-ideeën per naam, inclusief het beoogde verdienmodel:

${targetList
  .map(
    (idea, index) => `--------------------------------------------------------------------
IDEE ${index + 1}: ${idea.title.toUpperCase()}
Bedenker: ${idea.founderName}
Doelmarkt: ${idea.targetMarket}

Korte samenvatting:
${idea.shortSummary}

Het probleem:
${idea.problemStatement}

De AI-oplossing:
${idea.aiSolution}

Hoe denken we hier geld mee te verdienen?
${idea.revenueModel}
${
  idea.dotVerdict !== 'pending'
    ? `\nReeds ingevoerde Dot-feedback (${idea.dotVerdict.toUpperCase()} - Score ${idea.dotScore}/100):\n${idea.dotSummaryAdvice}\nVolgende stappen:\n${idea.dotNextSteps}`
    : ''
}`
  )
  .join('\n\n')}

====================================================================
VRAAG AAN DE DOT VAN JURJEN (VOOR STAP 2 OP ONZE SITE):
1. Geef per idee (op naam van de bedenker) een eerlijk oordeel (GO / PIVOT / NO-GO) en een score van 0 tot 100.
2. Geef scherpe feedback op het beschreven verdienmodel: hoe maken we hier een schaalbare >€10M businesscase van?
3. Formuleer per idee de concrete vervolgstappen zodat wij deze feedback in Stap 2 op onze site kunnen invoeren en gebruiken voor de uitwerking.`;

  return {
    subject,
    body,
    filename: 'dot-van-jurjen-alle-ideeen.txt',
  };
}

export function generateDeterministicDotAdvice(idea: {
  title: string;
  founderName: string;
  targetMarket: string;
  problemStatement: string;
  aiSolution: string;
  revenueModel: string;
}): {
  dotVerdict: DotVerdict;
  dotScore: number;
  dotSummaryAdvice: string;
  dotNextSteps: string;
  dotCriticalRisk: string;
  recommendedStage: VentureStage;
} {
  const revLower = idea.revenueModel.toLowerCase();
  const solLower = idea.aiSolution.toLowerCase();

  const hasRecurringRevenue =
    revLower.includes('abonnement') ||
    revLower.includes('saas') ||
    revLower.includes('licentie') ||
    revLower.includes('maand') ||
    revLower.includes('jaar') ||
    revLower.includes('contract');

  const hasValueBasedOrTransaction =
    revLower.includes('succes') ||
    revLower.includes('percentage') ||
    revLower.includes('transactie') ||
    revLower.includes('besparing') ||
    revLower.includes('per dossier') ||
    revLower.includes('per gebruik') ||
    revLower.includes('fee');

  const hasDeepWorkflowMoat =
    solLower.includes('agent') ||
    solLower.includes('integratie') ||
    solLower.includes('erp') ||
    solLower.includes('workflow') ||
    solLower.includes('data') ||
    solLower.includes('automatisch');

  let score = 68;
  if (hasRecurringRevenue) score += 10;
  if (hasValueBasedOrTransaction) score += 7;
  if (hasDeepWorkflowMoat) score += 8;
  if (idea.problemStatement.trim().length > 60) score += 4;
  score = Math.min(95, Math.max(45, score));

  const verdict: DotVerdict = score >= 78 ? 'go' : 'pivot';

  const summaryAdvice =
    verdict === 'go'
      ? `Dot van Jurjen oordeel voor ${idea.founderName}: Sterk inhoudelijk fundament in '${idea.targetMarket}'. Het voorgestelde verdienmodel ("${idea.revenueModel.slice(0, 120)}${idea.revenueModel.length > 120 ? '...' : ''}") sluit goed aan bij de waarde die de AI-oplossing levert en biedt een logische route naar een schaalbare >€10M businesscase.`
      : `Dot van Jurjen oordeel voor ${idea.founderName}: Interessant probleem in '${idea.targetMarket}', maar het verdienmodel ("${idea.revenueModel.slice(0, 120)}${idea.revenueModel.length > 120 ? '...' : ''}") moet nog scherper gekoppeld worden aan directe tijds- of kostenbesparing bij de klant voordat we hier met 9 man vol op inzetten.`;

  const nextSteps =
    `1. Verdienmodel toetsen in de markt (Week 1): Benader met 2 vrienden 5 tot 10 bedrijven in '${idea.targetMarket}' en toets of zij bereid zijn te betalen op de manier die ${idea.founderName} voorstelt (${idea.revenueModel.slice(0, 80)}).\n` +
    `2. Handmatige Pilot / Concierge Test (Week 2-3): Voer de AI-oplossing eerst voor 2 klanten handmatig of met een licht prototype uit om te bewijzen dat het probleem echt wordt opgelost.\n` +
    `3. Beslismoment met de groep (Week 4): Gebruik de klantreacties en deze Dot-feedback om te bepalen of dit idee doorgaat naar de volledige uitwerking.`;

  const criticalRisk = !hasRecurringRevenue
    ? `Let op terugkerende omzet: voor een >€10M waardering kijkt een koper of investeerder sterk naar voorspelbare, terugkerende inkomsten in plaats van eenmalige projecten.`
    : `Waak voor het 'dunne wrapper'-risico: zorg dat de AI-oplossing diep in het werkproces van '${idea.targetMarket}' zit zodat klanten niet eenvoudig overstappen.`;

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
      const hay = `${idea.title} ${idea.founderName} ${idea.shortSummary} ${idea.targetMarket} ${idea.problemStatement} ${idea.aiSolution} ${idea.revenueModel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
