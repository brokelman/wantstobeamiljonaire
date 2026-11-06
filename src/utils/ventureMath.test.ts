import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnnualRecurringRevenue,
  calculateEnterpriseValuation,
  isTenMillionPlusCase,
  calculateCustomersNeededForTenMillion,
  calculateFounderExitPayout,
  validateIdeaInput,
  generateDeterministicDotAdvice,
  filterIdeas,
  type VentureIdea,
} from './ventureMath';

test('calculateAnnualRecurringRevenue computes 12x monthly revenue across customers', () => {
  assert.equal(calculateAnnualRecurringRevenue(500, 250), 1_500_000);
  assert.equal(calculateAnnualRecurringRevenue(0, 250), 0);
});

test('calculateEnterpriseValuation & isTenMillionPlusCase verify >10M EUR business cases', () => {
  // €500/mo * 12 * 250 customers = €1.5M ARR * 8x multiple = €12.0M valuation
  const val = calculateEnterpriseValuation(500, 250, 8);
  assert.equal(val, 12_000_000);
  assert.equal(isTenMillionPlusCase(val), true);

  const smallVal = calculateEnterpriseValuation(100, 100, 6);
  assert.equal(smallVal, 720_000);
  assert.equal(isTenMillionPlusCase(smallVal), false);
});

test('calculateCustomersNeededForTenMillion reverse-engineers customer target', () => {
  // At €1,000/mo (€12,000/yr) and 8x multiple (€96,000 valuation per customer), 10M / 96k = 105 customers
  assert.equal(calculateCustomersNeededForTenMillion(1000, 8), 105);
});

test('calculateFounderExitPayout splits exit value across the 10 friends', () => {
  // €12.5M valuation, 10 founders, 80% retained equity = €1,000,000 per friend
  assert.equal(calculateFounderExitPayout(12_500_000, 10, 80), 1_000_000);
});

test('validateIdeaInput rejects empty or invalid form submissions', () => {
  const invalid = validateIdeaInput({
    title: 'AI',
    founderName: '',
    problemStatement: 'Te kort',
    aiSolution: 'Kort',
    targetMarket: '',
    monthlyPriceEur: 0,
    targetCustomers: -5,
    arrMultiple: 8,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 5);

  const valid = validateIdeaInput({
    title: 'BouwBestek AI Agent',
    founderName: 'Jurjen',
    problemStatement: 'Aannemers verliezen honderden uren aan handmatige calculaties en aanbestedingen.',
    aiSolution: 'Autonome AI-agent die bouwtekeningen en bestekken uitleest en direct offertes genereert.',
    targetMarket: 'Middelgrote bouwbedrijven in de Benelux',
    monthlyPriceEur: 750,
    targetCustomers: 200,
    arrMultiple: 8,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.errors.length, 0);
});

test('generateDeterministicDotAdvice produces structured validation from Jurjens Dot', () => {
  const result = generateDeterministicDotAdvice({
    title: 'BouwBestek AI Agent',
    founderName: 'Jurjen',
    targetMarket: 'Middelgrote bouwbedrijven',
    problemStatement: 'Handmatige calculaties kosten 40 uur per aanbesteding.',
    aiSolution: 'AI workflow agent gekoppeld aan ERP en CAD.',
    monthlyPriceEur: 800,
    targetCustomers: 200,
    arrMultiple: 8,
  });
  assert.equal(result.dotVerdict, 'go');
  assert.ok(result.dotScore >= 80);
  assert.ok(result.dotSummaryAdvice.includes('Jurjen'));
  assert.ok(result.dotNextSteps.includes('Klantvalidatie'));
});

test('filterIdeas filters accurately by friend name and search query', () => {
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
      stage: 'validated',
      monthlyPriceEur: 500,
      targetCustomers: 300,
      arrMultiple: 8,
      estimatedValuationEur: 14_400_000,
      votesCount: 5,
      dotVerdict: 'go',
      dotScore: 88,
      dotSummaryAdvice: 'Top idee',
      dotNextSteps: 'Bellen',
      dotCriticalRisk: 'Integratie',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Daan Logistics Agent',
      founderName: 'Daan',
      authorUid: 'u2',
      shortSummary: 'Samenvatting 2',
      problemStatement: 'Probleem 67890',
      aiSolution: 'Oplossing 67890',
      targetMarket: 'Transportbedrijven',
      stage: 'idea',
      monthlyPriceEur: 400,
      targetCustomers: 300,
      arrMultiple: 8,
      estimatedValuationEur: 11_520_000,
      votesCount: 3,
      dotVerdict: 'pivot',
      dotScore: 72,
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

  const searchTransport = filterIdeas(mockIdeas, { searchQuery: 'transport' });
  assert.equal(searchTransport.length, 1);
  assert.equal(searchTransport[0].founderName, 'Daan');
});
