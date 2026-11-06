import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateIdeaInput,
  generateDotTextDocument,
  generateDeterministicDotAdvice,
  filterIdeas,
  type VentureIdea,
} from './ventureMath';

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
    votesCount: 1,
    dotVerdict: 'pending',
    dotScore: 0,
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
  assert.ok(singleDoc.body.includes('VRAAG AAN DE DOT VAN JURJEN'));

  const multiDoc = generateDotTextDocument([sampleIdea]);
  assert.ok(multiDoc.subject.includes('1 AI-Ideeën'));
  assert.ok(multiDoc.body.includes('IDEE 1: BOUWBESTEK AI AGENT'));
});

test('generateDeterministicDotAdvice produces structured validation based on revenueModel text', () => {
  const result = generateDeterministicDotAdvice({
    title: 'BouwBestek AI Agent',
    founderName: 'Jurjen',
    targetMarket: 'Middelgrote bouwbedrijven',
    problemStatement: 'Handmatige calculaties kosten 40 uur per aanbesteding en leiden tot dure fouten.',
    aiSolution: 'AI workflow agent gekoppeld aan ERP en CAD.',
    revenueModel: 'Jaarlijks SaaS abonnement per bouwbedrijf plus succesfee op besparing.',
  });
  assert.equal(result.dotVerdict, 'go');
  assert.ok(result.dotScore >= 80);
  assert.ok(result.dotSummaryAdvice.includes('Jurjen'));
  assert.ok(result.dotNextSteps.includes('Verdienmodel toetsen'));
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
      title: 'Erik Logistics Agent',
      founderName: 'Erik',
      authorUid: 'u2',
      shortSummary: 'Samenvatting 2',
      problemStatement: 'Probleem 67890',
      aiSolution: 'Oplossing 67890',
      targetMarket: 'Transportbedrijven',
      revenueModel: 'Succesfee per bespaarde lege rit',
      stage: 'idea',
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

  const searchSuccesfee = filterIdeas(mockIdeas, { searchQuery: 'succesfee' });
  assert.equal(searchSuccesfee.length, 1);
  assert.equal(searchSuccesfee[0].founderName, 'Erik');
});

test('netlify.toml disables smart secret scanning false positives for Firebase client config', async () => {
  const fs = await import('node:fs');
  const netlifyToml = fs.readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8');
  assert.ok(netlifyToml.includes('SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"'));
  assert.ok(netlifyToml.includes('SECRETS_SCAN_OMIT_PATHS'));
});

test('Initial seed state starts with 0 ideas and the 9 requested friends', async () => {
  const { INITIAL_FOUNDERS, SEED_IDEAS } = await import('../data/seedIdeas');
  assert.equal(SEED_IDEAS.length, 0);
  assert.deepEqual(
    INITIAL_FOUNDERS.map((f) => f.name),
    ['Jurjen', 'Hans Guido', 'Gertjan', 'Erik', 'Matthijs', 'Martijn', 'Frank', 'Hermen', 'Rob']
  );
});
