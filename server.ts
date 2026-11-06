import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  calculateAnnualRecurringRevenue,
  calculateEnterpriseValuation,
  buildShortSummary,
  validateIdeaInput,
  generateDeterministicDotAdvice,
  type VentureIdea,
  type DotVerdict,
  type VentureStage,
} from './src/utils/ventureMath.ts';
import { SEED_IDEAS, INITIAL_FOUNDERS, type FounderMember } from './src/data/seedIdeas.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'ideas-store.json');

interface StoreState {
  founders: FounderMember[];
  ideas: VentureIdea[];
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as StoreState;
      if (Array.isArray(parsed.ideas) && parsed.ideas.length > 0) {
        return parsed;
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
  app.use(express.json({ limit: '1mb' }));

  // Allow CORS so Jurjen's Custom GPT / ChatGPT Dot Actions can call the API directly
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

  // 1. Get all ideas + founders (supports ?founder=Name filter for Jurjen's Dot)
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
        tenMillionReadyCount: ideas.filter((i) => i.estimatedValuationEur >= 10_000_000).length,
        validatedByDotCount: ideas.filter((i) => i.dotVerdict !== 'pending').length,
      },
    });
  });

  // 2. Add a new founder to the 10-friends roster
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

  // 3. Create a new €10M+ AI venture idea
  app.post('/api/ideas', (req, res) => {
    const body = req.body ?? {};
    const input = {
      title: String(body.title ?? ''),
      founderName: String(body.founderName ?? ''),
      shortSummary: typeof body.shortSummary === 'string' ? body.shortSummary : undefined,
      problemStatement: String(body.problemStatement ?? ''),
      aiSolution: String(body.aiSolution ?? ''),
      targetMarket: String(body.targetMarket ?? ''),
      monthlyPriceEur: Number(body.monthlyPriceEur ?? 0),
      targetCustomers: Number(body.targetCustomers ?? 0),
      arrMultiple: Number(body.arrMultiple ?? 8),
    };

    const validation = validateIdeaInput(input);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors.join(' '), errors: validation.errors });
      return;
    }

    const store = loadStore();
    const now = new Date().toISOString();
    const valuation = calculateEnterpriseValuation(
      input.monthlyPriceEur,
      input.targetCustomers,
      input.arrMultiple
    );

    const newIdea: VentureIdea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title.trim().slice(0, 120),
      founderName: input.founderName.trim().slice(0, 60),
      authorUid: String(body.authorUid ?? 'local-founder').slice(0, 128),
      shortSummary: buildShortSummary(input),
      problemStatement: input.problemStatement.trim().slice(0, 1500),
      aiSolution: input.aiSolution.trim().slice(0, 1500),
      targetMarket: input.targetMarket.trim().slice(0, 200),
      stage: 'idea',
      monthlyPriceEur: input.monthlyPriceEur,
      targetCustomers: input.targetCustomers,
      arrMultiple: input.arrMultiple,
      estimatedValuationEur: valuation,
      votesCount: 1,
      dotVerdict: 'pending',
      dotScore: 0,
      dotSummaryAdvice: 'Wacht op validatie door de ChatGPT Dot van Jurjen.',
      dotNextSteps: 'Klik op "Valideer met Dot van Jurjen" of laat Jurjen via de Dot API een advies insturen.',
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

  // 4. Vote on an idea or update its stage / unit economics
  app.patch('/api/ideas/:id', (req, res) => {
    const store = loadStore();
    const idea = store.ideas.find((i) => i.id === req.params.id);
    if (!idea) {
      res.status(404).json({ error: 'Idee niet gevonden.' });
      return;
    }

    const body = req.body ?? {};
    if (typeof body.stage === 'string' && ['idea', 'validated', 'business_case', 'execution'].includes(body.stage)) {
      idea.stage = body.stage as VentureStage;
    }
    if (typeof body.monthlyPriceEur === 'number' && body.monthlyPriceEur > 0) {
      idea.monthlyPriceEur = body.monthlyPriceEur;
    }
    if (typeof body.targetCustomers === 'number' && body.targetCustomers > 0) {
      idea.targetCustomers = body.targetCustomers;
    }
    if (typeof body.arrMultiple === 'number' && body.arrMultiple >= 1 && body.arrMultiple <= 50) {
      idea.arrMultiple = body.arrMultiple;
    }
    if (body.incrementVote === true) {
      idea.votesCount += 1;
    }

    idea.estimatedValuationEur = calculateEnterpriseValuation(
      idea.monthlyPriceEur,
      idea.targetCustomers,
      idea.arrMultiple
    );
    idea.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json({ idea });
  });

  // 5. Direct Webhook Endpoint for Jurjen's ChatGPT Dot (Custom GPT Action or Manual Paste)
  app.post('/api/ideas/:id/advise', (req, res) => {
    const store = loadStore();
    const idea = store.ideas.find((i) => i.id === req.params.id);
    if (!idea) {
      res.status(404).json({ error: 'Idee niet gevonden.' });
      return;
    }

    const body = req.body ?? {};
    const verdictRaw = String(body.dotVerdict ?? 'go').toLowerCase();
    const allowedVerdicts: DotVerdict[] = ['pending', 'go', 'pivot', 'no_go'];
    idea.dotVerdict = allowedVerdicts.includes(verdictRaw as DotVerdict)
      ? (verdictRaw as DotVerdict)
      : 'go';

    if (typeof body.dotScore === 'number') {
      idea.dotScore = Math.max(0, Math.min(100, Math.round(body.dotScore)));
    }
    if (typeof body.dotSummaryAdvice === 'string' && body.dotSummaryAdvice.trim().length > 0) {
      idea.dotSummaryAdvice = body.dotSummaryAdvice.trim().slice(0, 2000);
    }
    if (typeof body.dotNextSteps === 'string' && body.dotNextSteps.trim().length > 0) {
      idea.dotNextSteps = body.dotNextSteps.trim().slice(0, 2000);
    }
    if (typeof body.dotCriticalRisk === 'string' && body.dotCriticalRisk.trim().length > 0) {
      idea.dotCriticalRisk = body.dotCriticalRisk.trim().slice(0, 1000);
    }
    if (idea.stage === 'idea') {
      idea.stage = idea.dotVerdict === 'go' ? 'business_case' : 'validated';
    }
    idea.updatedAt = new Date().toISOString();
    saveStore(store);

    res.json({
      status: 'validated_by_jurjen_dot',
      idea,
    });
  });

  // 6. Server-side AI Advisory Validation (runs Jurjen's Dot Persona via @google/genai on server, with fallback)
  app.post('/api/ideas/:id/validate-with-dot', async (req, res) => {
    const store = loadStore();
    const idea = store.ideas.find((i) => i.id === req.params.id);
    if (!idea) {
      res.status(404).json({ error: 'Idee niet gevonden.' });
      return;
    }

    const fallback = generateDeterministicDotAdvice(idea);
    const ai = getGenAIClient();

    if (ai) {
      try {
        const arr = calculateAnnualRecurringRevenue(idea.monthlyPriceEur, idea.targetCustomers);
        const prompt = `Valideer dit AI-businesscase idee voor onze vriendengroep van 10 ondernemers die een >€10.000.000 waardering nastreven:
Titel: ${idea.title}
Bedenker: ${idea.founderName}
Doelmarkt: ${idea.targetMarket}
Probleem: ${idea.problemStatement}
AI-Oplossing: ${idea.aiSolution}
Prijsmodel: €${idea.monthlyPriceEur}/maand, doel: ${idea.targetCustomers} klanten, ARR: €${arr}, Geschatte Waardering (${idea.arrMultiple}x ARR): €${idea.estimatedValuationEur}.

Geef een scherp, eerlijk oordeel vanuit het perspectief van 'De Dot van Jurjen' (onze AI Advisory Board).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'Je bent "De Dot van Jurjen", de scherpe, pragmatische AI Advisory Board van een groep van 10 Nederlandse vrienden die samen een AI-bedrijf van >€10 miljoen euro waardering willen bouwen. Je beoordeelt ideeën streng op: 1) Haalbaarheid van €1,25M+ ARR binnen 36 maanden, 2) Verdedigbare data/workflow moat (geen dunne ChatGPT-wrapper), 3) Concrete executiestappen voor een team van 10 man. Schrijf altijd in helder, zakelijk en motiverend Nederlands.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dotVerdict: {
                  type: Type.STRING,
                  description: "Kies exact een van: 'go', 'pivot', of 'no_go'",
                },
                dotScore: {
                  type: Type. INTEGER,
                  description: 'Score tussen 1 en 100 voor €10M+ potentie',
                },
                shortSummary: {
                  type: Type.STRING,
                  description: 'Korte krachtige samenvatting van het idee in 1-2 zinnen (max 400 tekens)',
                },
                dotSummaryAdvice: {
                  type: Type.STRING,
                  description: 'Scherp oordeel van de Dot van Jurjen waarom dit wel/niet €10M+ waard wordt (max 800 tekens)',
                },
                dotNextSteps: {
                  type: Type.STRING,
                  description: '3 genummerde concrete vervolgstappen om van idee naar uitwerking en eerste betalende klanten te komen (max 1000 tekens)',
                },
                dotCriticalRisk: {
                  type: Type.STRING,
                  description: 'Het grootste risico of breekpunt waar de groep op moet letten (max 500 tekens)',
                },
              },
              required: [
                'dotVerdict',
                'dotScore',
                'shortSummary',
                'dotSummaryAdvice',
                'dotNextSteps',
                'dotCriticalRisk',
              ],
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        const verdictCandidate = String(parsed.dotVerdict ?? fallback.dotVerdict).toLowerCase();
        idea.dotVerdict = ['go', 'pivot', 'no_go'].includes(verdictCandidate)
          ? (verdictCandidate as DotVerdict)
          : fallback.dotVerdict;
        idea.dotScore =
          typeof parsed.dotScore === 'number'
            ? Math.max(1, Math.min(100, Math.round(parsed.dotScore)))
            : fallback.dotScore;
        if (typeof parsed.shortSummary === 'string' && parsed.shortSummary.trim().length >= 10) {
          idea.shortSummary = parsed.shortSummary.trim().slice(0, 600);
        }
        idea.dotSummaryAdvice = String(parsed.dotSummaryAdvice || fallback.dotSummaryAdvice).slice(0, 2000);
        idea.dotNextSteps = String(parsed.dotNextSteps || fallback.dotNextSteps).slice(0, 2000);
        idea.dotCriticalRisk = String(parsed.dotCriticalRisk || fallback.dotCriticalRisk).slice(0, 1000);
        idea.stage = idea.dotVerdict === 'go' ? 'business_case' : 'validated';
        idea.updatedAt = new Date().toISOString();
        saveStore(store);

        res.json({ idea, source: 'gemini-dot-engine' });
        return;
      } catch (err) {
        console.warn('Gemini validation fallback triggered:', err);
      }
    }

    // Apply deterministic Dot validation when API key is not configured or unavailable
    idea.dotVerdict = fallback.dotVerdict;
    idea.dotScore = fallback.dotScore;
    idea.dotSummaryAdvice = fallback.dotSummaryAdvice;
    idea.dotNextSteps = fallback.dotNextSteps;
    idea.dotCriticalRisk = fallback.dotCriticalRisk;
    idea.stage = fallback.recommendedStage;
    idea.updatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ idea, source: 'deterministic-dot-engine' });
  });

  // 7. OpenAPI 3.1.0 Spec so Jurjen's ChatGPT Dot (Custom GPT Action) can connect directly
  app.get('/api/openapi.json', (req, res) => {
    const baseUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;

    res.json({
      openapi: '3.1.0',
      info: {
        title: 'TienMiljoen Lab — De Dot van Jurjen Advisory Board API',
        description:
          'OpenAPI specificatie waarmee de ChatGPT Dot van Jurjen direct alle ingediende €10M+ AI-ideeën van de 10 vrienden per naam kan opvragen én van validatie, score en vervolgadvies kan voorzien.',
        version: '1.0.0',
      },
      servers: [{ url: baseUrl }],
      paths: {
        '/api/ideas': {
          get: {
            operationId: 'listVentureIdeas',
            summary: 'Haal alle ingediende AI-ideeën op (optioneel gefilterd op naam van een vriend)',
            parameters: [
              {
                name: 'founder',
                in: 'query',
                required: false,
                schema: { type: 'string' },
                description: 'Filter op naam van de bedenker (bijv. Jurjen, Daan, Bram)',
              },
            ],
            responses: {
              '200': {
                description: 'Lijst van ideeën inclusief samenvatting, €10M-rekensom en huidige Dot-status',
              },
            },
          },
        },
        '/api/ideas/{id}/advise': {
          post: {
            operationId: 'submitJurjenDotValidation',
            summary: 'Sla het validatie-oordeel en vervolgadvies van de Dot van Jurjen op bij een idee',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'ID van het idee',
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['dotVerdict', 'dotScore', 'dotSummaryAdvice', 'dotNextSteps', 'dotCriticalRisk'],
                    properties: {
                      dotVerdict: {
                        type: 'string',
                        enum: ['go', 'pivot', 'no_go'],
                        description: 'Go (>=10M haalbaar), Pivot (aanpassing nodig), of No-Go',
                      },
                      dotScore: {
                        type: 'integer',
                        minimum: 0,
                        maximum: 100,
                      },
                      dotSummaryAdvice: {
                        type: 'string',
                        description: 'Kernsamenvatting en validatie door de Dot van Jurjen',
                      },
                      dotNextSteps: {
                        type: 'string',
                        description: 'Concrete vervolgstappen voor de vriendengroep om dit op te pakken',
                      },
                      dotCriticalRisk: {
                        type: 'string',
                        description: 'Belangrijkste risico of aandachtspunt',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Advies succesvol opgeslagen op de site',
              },
            },
          },
        },
      },
    });
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
