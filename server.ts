import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  buildShortSummary,
  validateIdeaInput,
  synthesizeStep3Dashboard,
  getViabilityBand,
  type VentureIdea,
  type DotVerdict,
  type VentureStage,
} from './src/utils/ventureMath.ts';
import { SEED_IDEAS, INITIAL_FOUNDERS, type FounderMember } from './src/data/seedIdeas.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'ideas-store-v3.json');
const LEGACY_STORE_PATHS = [
  path.join(DATA_DIR, 'ideas-store-v2.json'),
  path.join(DATA_DIR, 'ideas-store.json'),
];

interface StoreState {
  founders: FounderMember[];
  ideas: VentureIdea[];
}

function normalizeIdea(raw: Partial<VentureIdea> & Record<string, unknown>): VentureIdea {
  const now = new Date().toISOString();
  const stepNum = Number(raw.currentStep);
  const currentStep: 1 | 2 | 3 = stepNum === 2 || stepNum === 3 ? stepNum : raw.dotVerdict && raw.dotVerdict !== 'pending' ? 3 : 1;

  return {
    id: String(raw.id || `idea-${Date.now()}`),
    title: String(raw.title || 'Naamloos Idee').slice(0, 120),
    founderName: String(raw.founderName || 'Jurjen').slice(0, 60),
    authorUid: String(raw.authorUid || 'local-founder').slice(0, 128),
    shortSummary: String(raw.shortSummary || 'AI-oplossing in ontwikkeling.').slice(0, 600),
    problemStatement: String(raw.problemStatement || 'Probleemstelling nog aan te vullen.').slice(0, 1500),
    aiSolution: String(raw.aiSolution || 'AI-oplossing nog aan te vullen.').slice(0, 1500),
    targetMarket: String(raw.targetMarket || 'B2B Doelmarkt').slice(0, 200),
    revenueModel: String(
      raw.revenueModel ||
        (typeof raw.monthlyPriceEur === 'number' && raw.monthlyPriceEur > 0
          ? `Maandelijks B2B-abonnement (eerder ingevoerd: €${raw.monthlyPriceEur}/mnd)`
          : 'Maandelijks abonnement / licentiemodel')
    ).slice(0, 1500),
    stage: (['idea', 'validated', 'business_case', 'execution'].includes(String(raw.stage))
      ? raw.stage
      : 'idea') as VentureStage,
    currentStep,
    votesCount: typeof raw.votesCount === 'number' ? raw.votesCount : 1,
    dotRawFeedback: String(raw.dotRawFeedback || '').slice(0, 4000),
    dotVerdict: (['pending', 'go', 'pivot', 'no_go'].includes(String(raw.dotVerdict))
      ? raw.dotVerdict
      : 'pending') as DotVerdict,
    dotScore: typeof raw.dotScore === 'number' ? raw.dotScore : 0,
    aiRealityScore:
      typeof raw.aiRealityScore === 'number'
        ? raw.aiRealityScore
        : typeof raw.dotScore === 'number'
        ? raw.dotScore
        : 0,
    businessCaseSummary: String(
      raw.businessCaseSummary ||
        'Wordt gegenereerd in Stap 3 zodra je in Stap 2 op "Verwerk" klikt.'
    ).slice(0, 2000),
    dotSummaryAdvice: String(
      raw.dotSummaryAdvice || 'Wacht op terugkoppeling van de Dot van Jurjen (Stap 2).'
    ).slice(0, 2000),
    dotNextSteps: String(
      raw.dotNextSteps ||
        'Kopieer of mail het tekstdocument in Stap 1 naar de Dot van Jurjen en plak de reactie in Stap 2.'
    ).slice(0, 2000),
    dotCriticalRisk: String(raw.dotCriticalRisk || 'Nog niet geanalyseerd.').slice(0, 1000),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  };
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as StoreState;
      if (Array.isArray(parsed.founders) && Array.isArray(parsed.ideas)) {
        return {
          founders: parsed.founders.length > 0 ? parsed.founders : INITIAL_FOUNDERS,
          ideas: parsed.ideas.map((i) => normalizeIdea(i as unknown as Record<string, unknown>)),
        };
      }
    }
    // Check legacy store files if v3 doesn't exist yet
    for (const legacyPath of LEGACY_STORE_PATHS) {
      if (fs.existsSync(legacyPath)) {
        const raw = fs.readFileSync(legacyPath, 'utf8');
        const parsed = JSON.parse(raw) as StoreState;
        if (Array.isArray(parsed.ideas) && parsed.ideas.length > 0) {
          const migrated: StoreState = {
            founders:
              Array.isArray(parsed.founders) && parsed.founders.length > 0
                ? parsed.founders
                : INITIAL_FOUNDERS,
            ideas: parsed.ideas.map((i) => normalizeIdea(i as unknown as Record<string, unknown>)),
          };
          saveStore(migrated);
          return migrated;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read store, initializing with seed data:', err);
  }
  const initial: StoreState = {
    founders: INITIAL_FOUNDERS,
    ideas: SEED_IDEAS,
  };
  saveStore(initial);
  return initial;
}

function saveStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

function getGenAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Jurjen-Dot-Token');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // 1. Get all ideas + founders
  app.get('/api/ideas', (req, res) => {
    const store = loadStore();
    const founderFilter = typeof req.query.founder === 'string' ? req.query.founder.trim() : '';
    let ideas = store.ideas;
    if (founderFilter && founderFilter.toUpperCase() !== 'ALL') {
      ideas = ideas.filter((i) => i.founderName.toLowerCase() === founderFilter.toLowerCase());
    }
    res.json({
      founders: store.founders,
      ideas,
      summary: {
        totalIdeas: ideas.length,
        validatedByDotCount: ideas.filter((i) => i.dotVerdict !== 'pending').length,
      },
    });
  });

  // 1b. Bidirectional Sync Endpoint: merges client localStorage ideas into server store so ideas are never lost across container restarts
  app.post('/api/ideas/sync', (req, res) => {
    const store = loadStore();
    const incomingIdeas = Array.isArray(req.body?.ideas) ? req.body.ideas : [];
    const incomingFounders = Array.isArray(req.body?.founders) ? req.body.founders : [];
    const deletedIds = new Set<string>(Array.isArray(req.body?.deletedIds) ? req.body.deletedIds : []);

    const ideaMap = new Map<string, VentureIdea>();
    store.ideas.forEach((idea) => {
      if (!deletedIds.has(idea.id)) {
        ideaMap.set(idea.id, idea);
      }
    });

    incomingIdeas.forEach((raw: Record<string, unknown>) => {
      if (!raw || typeof raw.id !== 'string' || deletedIds.has(raw.id)) return;
      const norm = normalizeIdea(raw);
      const existing = ideaMap.get(norm.id);
      if (!existing || new Date(norm.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        ideaMap.set(norm.id, norm);
      }
    });

    store.ideas = Array.from(ideaMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (incomingFounders.length > 0) {
      incomingFounders.forEach((f: FounderMember) => {
        if (f && typeof f.name === 'string' && f.name.trim().length >= 2) {
          if (!store.founders.some((ef) => ef.name.toLowerCase() === f.name.trim().toLowerCase())) {
            store.founders.push({
              name: f.name.trim(),
              role: f.role || 'Co-Founder',
              specialty: f.specialty || '€10M+ AI Venture Builder',
            });
          }
        }
      });
    }

    saveStore(store);
    res.json({ founders: store.founders, ideas: store.ideas });
  });

  // 2. Add a new founder
  app.post('/api/founders', (req, res) => {
    const { name, role, specialty } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Geef een geldige naam op (minimaal 2 tekens).' });
      return;
    }
    const store = loadStore();
    const cleanName = name.trim().slice(0, 40);
    if (!store.founders.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      store.founders.push({
        name: cleanName,
        role: typeof role === 'string' && role.trim() ? role.trim().slice(0, 60) : 'Co-Founder',
        specialty:
          typeof specialty === 'string' && specialty.trim()
            ? specialty.trim().slice(0, 100)
            : 'Venture Ideation & Uitwerking',
      });
      saveStore(store);
    }
    res.json({ founders: store.founders });
  });

  // 2b. Edit a founder
  app.patch('/api/founders/:name', (req, res) => {
    const store = loadStore();
    const targetName = decodeURIComponent(req.params.name).trim();
    const idx = store.founders.findIndex((f) => f.name.toLowerCase() === targetName.toLowerCase());
    if (idx === -1) {
      res.status(404).json({ error: 'Vriend niet gevonden.' });
      return;
    }
    const { name, role, specialty } = req.body ?? {};
    const oldName = store.founders[idx].name;
    const newName = typeof name === 'string' && name.trim().length >= 2 ? name.trim().slice(0, 40) : oldName;
    store.founders[idx] = {
      name: newName,
      role: typeof role === 'string' && role.trim() ? role.trim().slice(0, 60) : store.founders[idx].role,
      specialty:
        typeof specialty === 'string' && specialty.trim()
          ? specialty.trim().slice(0, 100)
          : store.founders[idx].specialty,
    };
    if (newName !== oldName) {
      store.ideas.forEach((idea) => {
        if (idea.founderName.toLowerCase() === oldName.toLowerCase()) {
          idea.founderName = newName;
        }
      });
    }
    saveStore(store);
    res.json({ founders: store.founders, ideas: store.ideas });
  });

  // 2c. Delete a founder
  app.delete('/api/founders/:name', (req, res) => {
    const store = loadStore();
    const targetName = decodeURIComponent(req.params.name).trim();
    store.founders = store.founders.filter((f) => f.name.toLowerCase() !== targetName.toLowerCase());
    saveStore(store);
    res.json({ founders: store.founders });
  });

  // 3. Create a new AI venture idea (Starts at Step 1)
  app.post('/api/ideas', (req, res) => {
    const body = req.body ?? {};
    const input = {
      title: String(body.title ?? ''),
      founderName: String(body.founderName ?? ''),
      shortSummary: typeof body.shortSummary === 'string' ? body.shortSummary : undefined,
      problemStatement: String(body.problemStatement ?? ''),
      aiSolution: String(body.aiSolution ?? ''),
      targetMarket: String(body.targetMarket ?? ''),
      revenueModel: String(body.revenueModel ?? ''),
    };

    const validation = validateIdeaInput(input);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors.join(' '), errors: validation.errors });
      return;
    }

    const store = loadStore();
    const now = new Date().toISOString();

    const newIdea: VentureIdea = {
      id: typeof body.id === 'string' && body.id ? body.id : `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title.trim().slice(0, 120),
      founderName: input.founderName.trim().slice(0, 60),
      authorUid: String(body.authorUid ?? 'local-founder').slice(0, 128),
      shortSummary: buildShortSummary(input),
      problemStatement: input.problemStatement.trim().slice(0, 1500),
      aiSolution: input.aiSolution.trim().slice(0, 1500),
      targetMarket: input.targetMarket.trim().slice(0, 200),
      revenueModel: input.revenueModel.trim().slice(0, 1500),
      stage: 'idea',
      currentStep: 1,
      votesCount: 1,
      dotRawFeedback: '',
      dotVerdict: 'pending',
      dotScore: 0,
      aiRealityScore: 0,
      businessCaseSummary: 'Wordt gegenereerd in Stap 3 zodra je in Stap 2 op "Verwerk" klikt.',
      dotSummaryAdvice: 'Wacht op terugkoppeling van de Dot van Jurjen (Stap 2).',
      dotNextSteps: 'Kopieer of mail het gegenereerde tekstdocument (Stap 1) naar de Dot van Jurjen en plak de terugkoppeling in Stap 2.',
      dotCriticalRisk: 'Nog niet geanalyseerd.',
      createdAt: now,
      updatedAt: now,
    };

    if (!store.founders.some((f) => f.name.toLowerCase() === newIdea.founderName.toLowerCase())) {
      store.founders.push({
        name: newIdea.founderName,
        role: 'Co-Founder',
        specialty: '€10M+ AI Venture Builder',
      });
    }

    store.ideas.unshift(newIdea);
    saveStore(store);
    res.status(201).json({ idea: newIdea });
  });

  // 4. Update an idea (content, stage, currentStep, votes)
  app.patch('/api/ideas/:id', (req, res) => {
    const store = loadStore();
    const idea = store.ideas.find((i) => i.id === req.params.id);
    if (!idea) {
      res.status(404).json({ error: 'Idee niet gevonden.' });
      return;
    }

    const body = req.body ?? {};
    if (typeof body.title === 'string' && body.title.trim().length >= 3) {
      idea.title = body.title.trim().slice(0, 120);
    }
    if (typeof body.founderName === 'string' && body.founderName.trim().length >= 2) {
      idea.founderName = body.founderName.trim().slice(0, 60);
    }
    if (typeof body.shortSummary === 'string' && body.shortSummary.trim().length >= 10) {
      idea.shortSummary = body.shortSummary.trim().slice(0, 600);
    }
    if (typeof body.problemStatement === 'string' && body.problemStatement.trim().length >= 10) {
      idea.problemStatement = body.problemStatement.trim().slice(0, 1500);
    }
    if (typeof body.aiSolution === 'string' && body.aiSolution.trim().length >= 10) {
      idea.aiSolution = body.aiSolution.trim().slice(0, 1500);
    }
    if (typeof body.targetMarket === 'string' && body.targetMarket.trim().length >= 2) {
      idea.targetMarket = body.targetMarket.trim().slice(0, 200);
    }
    if (typeof body.revenueModel === 'string' && body.revenueModel.trim().length >= 5) {
      idea.revenueModel = body.revenueModel.trim().slice(0, 1500);
    }
    if (typeof body.stage === 'string' && ['idea', 'validated', 'business_case', 'execution'].includes(body.stage)) {
      idea.stage = body.stage as VentureStage;
    }
    if (typeof body.currentStep === 'number' && (body.currentStep === 1 || body.currentStep === 2 || body.currentStep === 3)) {
      idea.currentStep = body.currentStep;
    }
    if (body.incrementVote === true) {
      idea.votesCount += 1;
    }

    // Recompute short summary if core fields were updated
    idea.shortSummary = buildShortSummary({
      title: idea.title,
      founderName: idea.founderName,
      problemStatement: idea.problemStatement,
      aiSolution: idea.aiSolution,
      targetMarket: idea.targetMarket,
      revenueModel: idea.revenueModel,
    });

    idea.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json({ idea });
  });

  // 4b. Delete an idea
  app.delete('/api/ideas/:id', (req, res) => {
    const store = loadStore();
    store.ideas = store.ideas.filter((i) => i.id !== req.params.id);
    saveStore(store);
    res.json({ ideas: store.ideas });
  });

  // 5. STEP 2 -> STEP 3 PROCESSOR: Combines all input of the idea + raw feedback from Jurjen's Dot into the Step 3 Dashboard
  app.post('/api/ideas/:id/process-dot-feedback', async (req, res) => {
    const store = loadStore();
    const idea = store.ideas.find((i) => i.id === req.params.id);
    if (!idea) {
      res.status(404).json({ error: 'Idee niet gevonden.' });
      return;
    }

    const rawFeedback = String(req.body?.dotRawFeedback ?? '').trim().slice(0, 4000);
    idea.dotRawFeedback = rawFeedback;

    const deterministic = synthesizeStep3Dashboard(idea, rawFeedback);
    const ai = getGenAIClient();

    if (ai) {
      try {
        const prompt = `Je verwerkt voor onze vriendengroep alle input van een AI-idee PLUS de terugkoppeling van 'De Dot van Jurjen' naar een Stap 3 Beslis-Dashboard.

INGEBRACHT IDEE (STAP 1):
- Bedenker: ${idea.founderName}
- Titel: ${idea.title}
- Doelmarkt: ${idea.targetMarket}
- Pijnlijk Probleem: ${idea.problemStatement}
- AI-Oplossing: ${idea.aiSolution}
- Hoe we denken er geld mee te verdienen: ${idea.revenueModel}

INGEBRACHTE TERUGKOPPELING VAN DE DOT VAN JURJEN (STAP 2):
"""
${rawFeedback}
"""

OPDRACHT VOOR STAP 3 DASHBOARD:
1. Bepaal de 'dotScore' (0-100) uit de terugkoppeling van de Dot van Jurjen.
2. Bepaal jouw eigen onafhankelijke 'aiRealityScore' (0-100) voor hoe realistisch dit een >€10M business case wordt.
3. Hanteer strikt deze 3 scorebanden voor de vervolgstappen:
   - Als dotScore OF aiRealityScore ONDER DE 50 ligt (<50): Niet levensvatbaar in huidige vorm. Leg uit waarom en adviseer te stoppen of fundamenteel te herontwerpen.
   - Als de score TUSSEN DE 50 EN 75 ligt (50-74): Idee & Business Case aanscherpen. Geef concrete punten die ${idea.founderName} eerst moet aanscherpen aan het idee of verdienmodel.
   - Als beide scores TUSSEN DE 75 EN 100 liggen (75-100): Levensvatbaar! Geef concrete vervolgstappen om dit direct met de vriendengroep te valideren en uit te werken.`;

        const aiCall = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'Je bent de strategische AI Venture Synthesizer van TienMiljoen Lab. Je brengt het ingebrachte idee en de feedback van de Dot van Jurjen samen tot een scherp Stap 3 Dashboard met een eerlijke Realiteitsscore (0-100) en vervolgstappen volgens de drempels <50 (niet levensvatbaar), 50-75 (aanscherpen), en 75-100 (concrete vervolgstappen). Schrijf in helder Nederlands.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dotScore: {
                  type: Type.INTEGER,
                  description: 'Score (0-100) van de Dot van Jurjen op basis van de terugkoppeling',
                },
                aiRealityScore: {
                  type: Type.INTEGER,
                  description: 'Jouw eigen objectieve Realiteitsscore (0-100) voor >€10M haalbaarheid',
                },
                businessCaseSummary: {
                  type: Type.STRING,
                  description: 'Synthese van de business case en het verdienmodel (max 1000 tekens)',
                },
                dotSummaryAdvice: {
                  type: Type.STRING,
                  description: 'Korte samenvatting van het gezamenlijke oordeel (max 800 tekens)',
                },
                dotNextSteps: {
                  type: Type.STRING,
                  description: 'Genummerde vervolgstappen passend bij de scoreband (<50 niet levensvatbaar, 50-75 aanscherpen, 75-100 concrete actie) (max 1200 tekens)',
                },
                dotCriticalRisk: {
                  type: Type.STRING,
                  description: 'Belangrijkste risico of aanscherpingspunt (max 500 tekens)',
                },
              },
              required: [
                'dotScore',
                'aiRealityScore',
                'businessCaseSummary',
                'dotSummaryAdvice',
                'dotNextSteps',
                'dotCriticalRisk',
              ],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI synthesis timeout')), 3500)
        );
        const response = await Promise.race([aiCall, timeoutPromise]);

        const parsed = JSON.parse((response.text ?? '{}').trim());
        const dScore =
          typeof parsed.dotScore === 'number'
            ? Math.max(0, Math.min(100, Math.round(parsed.dotScore)))
            : deterministic.dotScore;
        const rScore =
          typeof parsed.aiRealityScore === 'number'
            ? Math.max(0, Math.min(100, Math.round(parsed.aiRealityScore)))
            : deterministic.aiRealityScore;

        const band = getViabilityBand(dScore, rScore);

        idea.dotScore = dScore;
        idea.aiRealityScore = rScore;
        idea.dotVerdict =
          band.band === 'not_viable'
            ? 'no_go'
            : band.band === 'needs_sharpening'
            ? 'pivot'
            : 'go';
        idea.stage = band.band === 'viable_action_ready' ? 'business_case' : 'validated';
        idea.currentStep = 3;
        idea.businessCaseSummary = String(parsed.businessCaseSummary || deterministic.businessCaseSummary).slice(0, 2000);
        idea.dotSummaryAdvice = String(parsed.dotSummaryAdvice || deterministic.dotSummaryAdvice).slice(0, 2000);
        idea.dotNextSteps = String(parsed.dotNextSteps || deterministic.dotNextSteps).slice(0, 2000);
        idea.dotCriticalRisk = String(parsed.dotCriticalRisk || deterministic.dotCriticalRisk).slice(0, 1000);
        idea.updatedAt = new Date().toISOString();
        saveStore(store);

        res.json({ idea, source: 'gemini-step3-synthesizer' });
        return;
      } catch (err) {
        console.warn('Gemini Step 3 synthesis fallback triggered:', err);
      }
    }

    // Apply deterministic Step 3 synthesis
    idea.dotVerdict = deterministic.dotVerdict;
    idea.dotScore = deterministic.dotScore;
    idea.aiRealityScore = deterministic.aiRealityScore;
    idea.businessCaseSummary = deterministic.businessCaseSummary;
    idea.dotSummaryAdvice = deterministic.dotSummaryAdvice;
    idea.dotNextSteps = deterministic.dotNextSteps;
    idea.dotCriticalRisk = deterministic.dotCriticalRisk;
    idea.stage = deterministic.recommendedStage;
    idea.currentStep = 3;
    idea.updatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ idea, source: 'deterministic-step3-synthesizer' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TienMiljoen Lab server listening on http://localhost:${PORT}`);
  });
}

startServer();
