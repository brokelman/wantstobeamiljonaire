import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateIdeaInput,
  generateDotTextDocument,
  synthesizeStep3Dashboard,
  getViabilityBand,
  filterIdeas,
  type VentureIdea,
} from './ventureMath';

test('getViabilityBand classifies scores into <50 (not_viable), 50-75 (needs_sharpening), and 75-100 (viable_action_ready)', () => {
  const lowBand = getViabilityBand(42, 70);
  assert.equal(lowBand.band, 'not_viable');
  assert.ok(lowBand.label.includes('Niet Levensvatbaar'));

  const midBand = getViabilityBand(65, 72);
  assert.equal(midBand.band, 'needs_sharpening');
  assert.ok(midBand.label.includes('Aanscherpen'));

  const highBand = getViabilityBand(82, 86);
  assert.equal(highBand.band, 'viable_action_ready');
  assert.ok(highBand.label.includes('Concrete Vervolgstappen'));
});

test('synthesizeStep3Dashboard combines idea input and Dot feedback into Step 3 dashboard across score bands', () => {
  const baseIdea = {
    title: 'BouwBestek AI Agent',
    founderName: 'Hans Guido',
    targetMarket: 'Middelgrote aannemers en calculatiebureaus',
    problemStatement: 'Calculators zijn wekelijks 40 uur kwijt aan handmatige bestekcalculaties en offertes.',
    aiSolution: 'Autonome AI-agent gekoppeld aan ERP en CAD die automatisch conceptbegrotingen maakt.',
    revenueModel: 'Jaarlijks SaaS-abonnement per bouwbedrijf plus succesfee per aanbesteding.',
  };

  // Band 1: < 50 (Niet levensvatbaar)
  const lowResult = synthesizeStep3Dashboard(
    baseIdea,
    'Score: 35/100. Niet levensvatbaar in deze vorm, markt is te klein en klanten willen hier niet voor betalen.'
  );
  assert.equal(lowResult.dotVerdict, 'no_go');
  assert.ok(lowResult.dotScore < 50);
  assert.ok(lowResult.dotNextSteps.includes('NIET LEVENSVATBAAR'));

  // Band 2: 50 - 75 (Aanscherpen)
  const midResult = synthesizeStep3Dashboard(
    baseIdea,
    'Score: 62/100. Interessant idee maar we moeten het verdienmodel en de doelgroep eerst aanscherpen.'
  );
  assert.equal(midResult.dotVerdict, 'pivot');
  assert.equal(midResult.dotScore, 62);
  assert.ok(midResult.dotNextSteps.includes('AANSCHERPEN'));

  // Band 3: 75 - 100 (Concrete vervolgstappen)
  const highResult = synthesizeStep3Dashboard(
    baseIdea,
    'Score: 86/100. Zeer sterk en schaalbaar idee! Goede terugkerende omzet en duidelijke AI-moat.'
  );
  assert.equal(highResult.dotVerdict, 'go');
  assert.equal(highResult.dotScore, 86);
  assert.ok(highResult.aiRealityScore >= 75);
  assert.ok(highResult.dotNextSteps.includes('CONCRETE VERVOLGSTAPPEN'));
  assert.ok(highResult.businessCaseSummary.includes('Doelmarkt:'));
});

test('validateIdeaInput validates text revenueModel instead of numeric price/customer/multiplier fields', () => {
  const invalid = validateIdeaInput({
    title: 'AI',
    founderName: '',
    problemStatement: 'Te kort',
    aiSolution: 'Kort',
    targetMarket: '',
    revenueModel: ' €',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 5);

  const valid = validateIdeaInput({
    title: 'BouwBestek AI Agent',
    founderName: 'Jurjen',
    problemStatement: 'Aannemers verliezen honderden uren aan handmatige calculaties en aanbestedingen.',
    aiSolution: 'Autonome AI-agent die bouwtekeningen en bestekken uitleest en direct offertes genereert.',
    targetMarket: 'Middelgrote bouwbedrijven in de Benelux',
    revenueModel: 'Maandelijks SaaS-abonnement voor bouwbedrijven plus een succesfee per gewonnen aanbesteding.',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.errors.length, 0);
});

test('generateDotTextDocument creates structured copyable and mailable text document for Jurjens Dot', () => {
  const sampleIdea: VentureIdea = {
    id: 'idea-1',
    title: 'BouwBestek AI Agent',
    founderName: 'Hans Guido',
    authorUid: 'u1',
    shortSummary: 'AI-oplossing voor bouwbedrijven die automatisch bestekken doorrekent.',
    problemStatement: 'Calculators zijn 40 uur kwijt per bestek.',
    aiSolution: 'AI leest PDF en CAD tekeningen direct uit.',
    targetMarket: 'Aannemers in Nederland',
    revenueModel: 'Vast maandabonnement per calculator + licentie per project.',
    stage: 'idea',
    currentStep: 1,
    votesCount: 1,
    dotRawFeedback: '',
    dotVerdict: 'pending',
    dotScore: 0,
    aiRealityScore: 0,
    businessCaseSummary: '',
    dotSummaryAdvice: 'Wacht op validatie.',
    dotNextSteps: 'Stuur naar de Dot van Jurjen.',
    dotCriticalRisk: 'Nog te bepalen.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const singleDoc = generateDotTextDocument([sampleIdea], sampleIdea);
  assert.ok(singleDoc.subject.includes('BouwBestek AI Agent'));
  assert.ok(singleDoc.subject.includes('Hans Guido'));
  assert.ok(singleDoc.body.includes('HOE DENKEN WE HIER GELD MEE TE VERDIENEN?'));
  assert.ok(singleDoc.body.includes('Vast maandabonnement per calculator'));
});

test('filterIdeas filters accurately by friend name and revenueModel search query', () => {
  const mockIdeas: VentureIdea[] = [
    {
      id: '1',
      title: 'Jurjen Legal AI',
      founderName: 'Jurjen',
      authorUid: 'u1',
      shortSummary: 'Samenvatting 1',
      problemStatement: 'Probleem 12345',
      aiSolution: 'Oplossing 12345',
      targetMarket: 'Advocaten',
      revenueModel: 'Abonnement per advocaat per maand',
      stage: 'validated',
      currentStep: 3,
      votesCount: 5,
      dotRawFeedback: 'Goede feedback',
      dotVerdict: 'go',
      dotScore: 88,
      aiRealityScore: 84,
      businessCaseSummary: 'Sterke case',
      dotSummaryAdvice: 'Top idee',
      dotNextSteps: 'Bellen',
      dotCriticalRisk: 'Integratie',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Erik Logistics Agent',
      founderName: 'Erik',
      authorUid: 'u2',
      shortSummary: 'Samenvatting 2',
      problemStatement: 'Probleem 67890',
      aiSolution: 'Oplossing 67890',
      targetMarket: 'Transportbedrijven',
      revenueModel: 'Succesfee per bespaarde lege rit',
      stage: 'idea',
      currentStep: 1,
      votesCount: 3,
      dotRawFeedback: '',
      dotVerdict: 'pivot',
      dotScore: 72,
      aiRealityScore: 68,
      businessCaseSummary: 'Aanscherpen',
      dotSummaryAdvice: 'Focus verscherpen',
      dotNextSteps: 'Testen',
      dotCriticalRisk: 'Data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const jurjenOnly = filterIdeas(mockIdeas, { founderName: 'Jurjen' });
  assert.equal(jurjenOnly.length, 1);
  assert.equal(jurjenOnly[0].id, '1');

  const searchSuccesfee = filterIdeas(mockIdeas, { searchQuery: 'succesfee' });
  assert.equal(searchSuccesfee.length, 1);
  assert.equal(searchSuccesfee[0].founderName, 'Erik');
});
