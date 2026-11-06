export type VentureStage = 'idea' | 'validated' | 'business_case' | 'execution';
export type DotVerdict = 'pending' | 'go' | 'pivot' | 'no_go';
export type ViabilityBand = 'not_viable' | 'needs_sharpening' | 'viable_action_ready';

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
  currentStep: 1 | 2 | 3;
  votesCount: number;
  dotRawFeedback: string;
  dotVerdict: DotVerdict;
  dotScore: number;
  aiRealityScore: number;
  businessCaseSummary: string;
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

export function getViabilityBand(dotScore: number, aiRealityScore: number): {
  band: ViabilityBand;
  effectiveScore: number;
  label: string;
  description: string;
} {
  // As requested by the user: if either the Dot score or our own reality score is too low,
  // we classify accordingly (<50 not viable, 50-74 sharpen idea, 75-100 concrete next steps).
  const lowestScore = Math.min(dotScore, aiRealityScore);
  const averageScore = Math.round((dotScore + aiRealityScore) / 2);
  const effectiveScore = lowestScore < 50 ? lowestScore : averageScore;

  if (lowestScore < 50 || effectiveScore < 50) {
    return {
      band: 'not_viable',
      effectiveScore,
      label: 'Score < 50: Niet Levensvatbaar',
      description:
        'De score van de Dot van Jurjen of de AI-Realiteitsscore ligt onder de 50. In de huidige vorm is dit idee niet levensvatbaar voor een >€10M businesscase.',
    };
  }

  if (lowestScore < 75 || effectiveScore < 75) {
    return {
      band: 'needs_sharpening',
      effectiveScore,
      label: 'Score 50 – 75: Idee & Business Case Aanscherpen',
      description:
        'De kern heeft potentie, maar de score ligt tussen de 50 en 75. Jullie moeten eerst het idee, de doelgroep of het verdienmodel aanscherpen voordat jullie gaan bouwen.',
    };
  }

  return {
    band: 'viable_action_ready',
    effectiveScore,
    label: 'Score 75 – 100: Sterk & Levensvatbaar — Concrete Vervolgstappen',
    description:
      'Zowel de Dot van Jurjen als de AI-Realiteitsscore geven 75+ punten. Dit idee is klaar voor concrete validatie- en vervolgstappen met de vriendengroep.',
  };
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
1. SCORE (0-100) & EERLIJK OORDEEL: Hoe levensvatbaar is dit idee om uit te groeien tot een >€10 miljoen bedrijf? (Onder 50 = niet levensvatbaar, 50-75 = eerst aanscherpen, 75-100 = klaar voor vervolgstappen).
2. FEEDBACK OP DE BUSINESS CASE & HET VERDIENMODEL: Is de manier waarop we geld willen verdienen schaalbaar en verdedigbaar tegen standaard AI-tools?
3. ADVIES VOOR DE VOLGENDE STAP: Wat moeten we aanscherpen óf welke concrete stappen moeten we nu als vriendengroep zetten?`;

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
    ? `\nVerwerkte Status (Dot Score ${idea.dotScore}/100 | Realiteitsscore ${idea.aiRealityScore}/100):\n${idea.dotSummaryAdvice}\nVervolgstappen:\n${idea.dotNextSteps}`
    : ''
}`
  )
  .join('\n\n')}

====================================================================
VRAAG AAN DE DOT VAN JURJEN (VOOR STAP 2 OP ONZE SITE):
1. Geef per idee (op naam van de bedenker) een eerlijke score van 0 tot 100 (<50 = niet levensvatbaar, 50-75 = aanscherpen, 75-100 = concrete vervolgstappen).
2. Geef scherpe feedback op het beschreven verdienmodel en de business case.
3. Formuleer wat we moeten aanscherpen of welke concrete vervolgstappen we moeten zetten.`;

  return {
    subject,
    body,
    filename: 'dot-van-jurjen-alle-ideeen.txt',
  };
}

export function extractScoreFromText(text: string): number | null {
  if (!text) return null;
  // Match patterns like "Score: 82", "78/100", "score van 65", "80 punten"
  const slashMatch = text.match(/\b(\d{1,3})\s*\/\s*100\b/);
  if (slashMatch) {
    const val = Number(slashMatch[1]);
    if (val >= 0 && val <= 100) return val;
  }
  const scoreWordMatch = text.match(/(?:score|oordeel|cijfer|punten)[:\s]+(?:van\s+)?(\d{1,3})\b/i);
  if (scoreWordMatch) {
    const val = Number(scoreWordMatch[1]);
    if (val >= 0 && val <= 100) return val;
  }
  return null;
}

export function synthesizeStep3Dashboard(
  idea: {
    title: string;
    founderName: string;
    targetMarket: string;
    problemStatement: string;
    aiSolution: string;
    revenueModel: string;
  },
  dotRawFeedback: string
): {
  dotVerdict: DotVerdict;
  dotScore: number;
  aiRealityScore: number;
  businessCaseSummary: string;
  dotSummaryAdvice: string;
  dotNextSteps: string;
  dotCriticalRisk: string;
  recommendedStage: VentureStage;
} {
  const cleanFeedback = dotRawFeedback.trim();
  const fbLower = cleanFeedback.toLowerCase();
  const revLower = idea.revenueModel.toLowerCase();
  const solLower = idea.aiSolution.toLowerCase();

  // 1. Calculate our own independent AI Reality Score (0 - 100)
  let aiRealityScore = 58;

  const hasRecurringRevenue =
    revLower.includes('abonnement') ||
    revLower.includes('saas') ||
    revLower.includes('licentie') ||
    revLower.includes('maand') ||
    revLower.includes('jaar') ||
    revLower.includes('contract');

  const hasValueBasedPricing =
    revLower.includes('succes') ||
    revLower.includes('percentage') ||
    revLower.includes('transactie') ||
    revLower.includes('besparing') ||
    revLower.includes('per dossier') ||
    revLower.includes('fee');

  const hasDeepWorkflowMoat =
    solLower.includes('agent') ||
    solLower.includes('integratie') ||
    solLower.includes('erp') ||
    solLower.includes('workflow') ||
    solLower.includes('data') ||
    solLower.includes('automatisch') ||
    solLower.includes('koppeling');

  if (hasRecurringRevenue) aiRealityScore += 12;
  if (hasValueBasedPricing) aiRealityScore += 8;
  if (hasDeepWorkflowMoat) aiRealityScore += 10;
  if (idea.problemStatement.trim().length >= 60) aiRealityScore += 5;
  if (idea.targetMarket.trim().length >= 12) aiRealityScore += 4;

  // Check if the idea or feedback exposes severe weaknesses
  const isNegativeFeedback =
    fbLower.includes('niet levensvatbaar') ||
    fbLower.includes('kansloos') ||
    fbLower.includes('no-go') ||
    fbLower.includes('no go') ||
    fbLower.includes('stoppen') ||
    fbLower.includes('slecht idee') ||
    fbLower.includes('te klein') ||
    fbLower.includes('geen markt');

  const isCriticalOrSharpenFeedback =
    fbLower.includes('aanscherpen') ||
    fbLower.includes('twijfel') ||
    fbLower.includes('pivot') ||
    fbLower.includes('lastig') ||
    fbLower.includes('te breed') ||
    fbLower.includes('wrapper') ||
    fbLower.includes('onduidelijk') ||
    fbLower.includes('maar');

  const isPositiveFeedback =
    fbLower.includes('sterk') ||
    fbLower.includes('kansrijk') ||
    fbLower.includes('go!') ||
    fbLower.includes('top') ||
    fbLower.includes('schaalbaar') ||
    fbLower.includes('potentie') ||
    fbLower.includes('levensvatbaar');

  if (isNegativeFeedback) {
    aiRealityScore = Math.min(aiRealityScore, 44);
  } else if (isCriticalOrSharpenFeedback && !isPositiveFeedback) {
    aiRealityScore = Math.min(Math.max(aiRealityScore - 12, 54), 72);
  } else if (isPositiveFeedback) {
    aiRealityScore = Math.min(94, Math.max(aiRealityScore, 78));
  }

  aiRealityScore = Math.max(15, Math.min(96, aiRealityScore));

  // 2. Determine Dot van Jurjen Score (0 - 100) from pasted feedback
  const explicitScore = extractScoreFromText(cleanFeedback);
  let dotScore = explicitScore ?? aiRealityScore;

  if (explicitScore === null) {
    if (isNegativeFeedback) {
      dotScore = 38;
    } else if (isCriticalOrSharpenFeedback && !isPositiveFeedback) {
      dotScore = 64;
    } else if (isPositiveFeedback) {
      dotScore = Math.max(80, aiRealityScore);
    } else if (cleanFeedback.length > 0) {
      dotScore = Math.min(92, Math.max(55, aiRealityScore - 2));
    }
  }

  // If explicitScore was very low (<50), also pull reality score into realistic alignment
  if (explicitScore !== null && explicitScore < 50) {
    aiRealityScore = Math.min(aiRealityScore, 48);
  } else if (explicitScore !== null && explicitScore < 75 && aiRealityScore >= 75) {
    aiRealityScore = 70;
  }

  const bandInfo = getViabilityBand(dotScore, aiRealityScore);

  let verdict: DotVerdict = 'go';
  let recommendedStage: VentureStage = 'business_case';

  if (bandInfo.band === 'not_viable') {
    verdict = 'no_go';
    recommendedStage = 'validated';
  } else if (bandInfo.band === 'needs_sharpening') {
    verdict = 'pivot';
    recommendedStage = 'validated';
  } else {
    verdict = 'go';
    recommendedStage = 'business_case';
  }

  const businessCaseSummary =
    `Doelmarkt: ${idea.targetMarket}\n` +
    `Beoogd Verdienmodel: ${idea.revenueModel}\n` +
    `Synthese naar >€10M Business Case: ${
      bandInfo.band === 'not_viable'
        ? `Met een gecombineerde realiteitsscore van ${bandInfo.effectiveScore}/100 is deze case nu te zwak om met 9 vrienden op in te zetten. De kosten van klantacquisitie of het gebrek aan onderscheidend vermogen ten opzichte van standaard AI staan een >€10M waardering in de weg.`
        : bandInfo.band === 'needs_sharpening'
        ? `Dit idee van ${idea.founderName} scoort ${bandInfo.effectiveScore}/100 (tussen de 50 en 75). Het probleem in '${idea.targetMarket}' is reëel, maar om richting >€10M bedrijfswaarde te groeien moet het verdienmodel ("${idea.revenueModel.slice(0, 100)}") en de technische AI-moat eerst scherper worden afgebakend.`
        : `Sterke >€10M propositie (${bandInfo.effectiveScore}/100)! Door het specifieke pijnpunt in '${idea.targetMarket}' te koppelen aan het verdienmodel ("${idea.revenueModel.slice(0, 100)}") kunnen jullie een schaalbare, terugkerende omzetstroom opbouwen.`
    }`;

  const dotSummaryAdvice = cleanFeedback
    ? `Samenvatting Dot-terugkoppeling & Analyse (${bandInfo.label}): "${cleanFeedback}"`
    : `Analyse op basis van het ingebrachte idee van ${idea.founderName} (${bandInfo.label}).`;

  let nextSteps = '';
  if (bandInfo.band === 'not_viable') {
    nextSteps =
      `SCORE ONDER 50 (${bandInfo.effectiveScore}/100) — NIET LEVENSVATBAAR IN HUIDIGE VORM:\n` +
      `1. Stop of Herontwerp: Steek als vriendengroep nu géén ontwikkeluren in dit idee zoals het er staat.\n` +
      `2. Oorzaak analyseren met ${idea.founderName}: Bekijk de kritiek uit de Dot van Jurjen ("${cleanFeedback.slice(0, 120) || 'Te lage schaalbaarheid / moat'}") en bepaal of er een compleet ander, duurder B2B-probleem in '${idea.targetMarket}' te vinden is.\n` +
      `3. Focus verleggen: Indien ${idea.founderName} het verdienmodel niet radicaal kan veranderen naar terugkerende B2B-waarde, kies dan als groep een ander idee met een score >75.`;
  } else if (bandInfo.band === 'needs_sharpening') {
    nextSteps =
      `SCORE TUSSEN 50 EN 75 (${bandInfo.effectiveScore}/100) — EERST IDEE & BUSINESS CASE AANSCHERPEN:\n` +
      `1. Aanscherping Verdienmodel (Stap 1 bijwerken): ${idea.founderName} scherpt het verdienmodel ("${idea.revenueModel.slice(0, 80)}") aan zodat klanten maandelijks of per resultaat een substantieel bedrag betalen.\n` +
      `2. Verdedigbare AI-Moat toevoegen: Werk in de AI-oplossing concreet uit welke eigen data of systeemkoppeling jullie gebruiken zodat klanten dit niet zelf in ChatGPT kunnen doen.\n` +
      `3. Toets de aangescherpte versie bij 3 bedrijven in '${idea.targetMarket}' en haal het idee daarna opnieuw door Stap 2 & 3 om boven de 75 punten te komen.`;
  } else {
    nextSteps =
      `SCORE 75 – 100 (${bandInfo.effectiveScore}/100) — CONCRETE VERVOLGSTAPPEN VOOR EXECUTIE:\n` +
      `1. Klantgesprekken voeren (Week 1): ${idea.founderName} en 2 vrienden uit de groep benaderen deze week 5 tot 10 beslissers in '${idea.targetMarket}' om het verdienmodel ("${idea.revenueModel.slice(0, 80)}") in de praktijk te valideren.\n` +
      `2. Concierge Pilot opzetten (Week 2-3): Zoek 2 pilotklanten die direct willen meedoen en draai de AI-oplossing eerst pragmatisch voor hen om resultaat te bewijzen.\n` +
      `3. Go/No-Go voor Groeps-Sprint (Week 4): Bij 2 positieve betalende intenties zetten we dit idee door naar Fase 4 (Klantpilots & Bouw).`;
  }

  const criticalRisk =
    bandInfo.band === 'not_viable'
      ? `Score < 50: Onvoldoende fundament voor een >€10M waardering op basis van de huidige probleemstelling en Dot-terugkoppeling.`
      : bandInfo.band === 'needs_sharpening'
      ? `Score 50-75: Zonder aanscherping van het verdienmodel en een diepere workflow-integratie blijft dit idee steken onder de €10M-grens.`
      : `Waak ervoor dat jullie eerst betalingsbereidheid bij klanten in '${idea.targetMarket}' vastleggen voordat jullie maandenlang gaan programmeren.`;

  return {
    dotVerdict: verdict,
    dotScore,
    aiRealityScore,
    businessCaseSummary: businessCaseSummary.slice(0, 2000),
    dotSummaryAdvice: dotSummaryAdvice.slice(0, 2000),
    dotNextSteps: nextSteps.slice(0, 2000),
    dotCriticalRisk: criticalRisk.slice(0, 1000),
    recommendedStage,
  };
}

export function generateDeterministicDotAdvice(idea: {
  title: string;
  founderName: string;
  targetMarket: string;
  problemStatement: string;
  aiSolution: string;
  revenueModel: string;
}) {
  return synthesizeStep3Dashboard(
    idea,
    `Positieve eerste indruk voor ${idea.founderName} in ${idea.targetMarket}, maar let scherp op schaalbaarheid van het verdienmodel (${idea.revenueModel.slice(0, 80)}) en zorg voor een sterke integratie-moat.`
  );
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
      const hay = `${idea.title} ${idea.founderName} ${idea.shortSummary} ${idea.targetMarket} ${idea.problemStatement} ${idea.aiSolution} ${idea.revenueModel} ${idea.dotRawFeedback || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
