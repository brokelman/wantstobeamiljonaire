import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ThumbsUp,
  UserPlus,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  testFirestoreConnection,
  signInWithGoogle,
  signOutUser,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  filterIdeas,
  calculateAnnualRecurringRevenue,
  calculateEnterpriseValuation,
  buildShortSummary,
  validateIdeaInput,
  generateDeterministicDotAdvice,
  type VentureIdea,
  type IdeaFormInput,
  type VentureStage,
  type DotVerdict,
} from './utils/ventureMath';
import { SEED_IDEAS, INITIAL_FOUNDERS, type FounderMember } from './data/seedIdeas';
import { NewIdeaModal } from './components/NewIdeaModal';
import { IdeaDetailPanel } from './components/IdeaDetailPanel';
import { JurjenDotBridgeView } from './components/JurjenDotBridgeView';
import { MethodologyView } from './components/MethodologyView';

type ActiveTab = 'ideas' | 'dot_bridge' | 'methodology';

const LOCAL_STORAGE_IDEAS_KEY = 'tienmiljoen_lab_ideas_v1';
const LOCAL_STORAGE_FOUNDERS_KEY = 'tienmiljoen_lab_founders_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ideas');
  const [ideas, setIdeas] = useState<VentureIdea[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_IDEAS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return SEED_IDEAS;
  });
  const [founders, setFounders] = useState<FounderMember[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FOUNDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_FOUNDERS;
  });
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(SEED_IDEAS[0]?.id || '');

  // Filters
  const [selectedFounder, setSelectedFounder] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI states
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState<boolean>(false);
  const [isValidatingDot, setIsValidatingDot] = useState<boolean>(false);
  const [newFriendInput, setNewFriendInput] = useState<string>('');
  const [showAddFriend, setShowAddFriend] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Persist to localStorage for static hosting resilience
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_IDEAS_KEY, JSON.stringify(ideas));
    } catch {
      // ignore
    }
  }, [ideas]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FOUNDERS_KEY, JSON.stringify(founders));
    } catch {
      // ignore
    }
  }, [founders]);

  // 1. Load shared ideas from Express backend if available
  const fetchBackendIdeas = async () => {
    try {
      const res = await fetch('/api/ideas');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.ideas) && data.ideas.length > 0) {
          setIdeas(data.ideas);
        }
        if (Array.isArray(data.founders) && data.founders.length > 0) {
          setFounders(data.founders);
        }
      }
    } catch {
      // Static host (e.g. Netlify) without Express backend — uses localStorage & Firestore
    }
  };

  useEffect(() => {
    testFirestoreConnection();
    fetchBackendIdeas();

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // 2. Sync with Firestore when authenticated
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const path = 'ideas';
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreIdeas: VentureIdea[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            firestoreIdeas.push({
              id: docSnap.id,
              title: d.title,
              founderName: d.founderName,
              authorUid: d.authorUid,
              shortSummary: d.shortSummary,
              problemStatement: d.problemStatement,
              aiSolution: d.aiSolution,
              targetMarket: d.targetMarket,
              stage: d.stage,
              monthlyPriceEur: d.monthlyPriceEur,
              targetCustomers: d.targetCustomers,
              arrMultiple: d.arrMultiple,
              estimatedValuationEur: d.estimatedValuationEur,
              votesCount: d.votesCount,
              dotVerdict: d.dotVerdict,
              dotScore: d.dotScore,
              dotSummaryAdvice: d.dotSummaryAdvice,
              dotNextSteps: d.dotNextSteps,
              dotCriticalRisk: d.dotCriticalRisk,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : String(d.createdAt || ''),
              updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : String(d.updatedAt || ''),
            });
          });
          setIdeas((prev) => {
            const map = new Map<string, VentureIdea>();
            prev.forEach((item) => map.set(item.id, item));
            firestoreIdeas.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [isAuthReady, currentUser]);

  const filteredIdeas = useMemo(() => {
    return filterIdeas(ideas, {
      founderName: selectedFounder,
      stage: selectedStage,
      verdict: selectedVerdict,
      searchQuery,
    });
  }, [ideas, selectedFounder, selectedStage, selectedVerdict, searchQuery]);

  const activeIdea = useMemo(() => {
    return (
      filteredIdeas.find((i) => i.id === selectedIdeaId) ||
      filteredIdeas[0] ||
      ideas.find((i) => i.id === selectedIdeaId) ||
      ideas[0]
    );
  }, [filteredIdeas, ideas, selectedIdeaId]);

  const syncIdeaToFirestoreIfSignedIn = async (idea: VentureIdea, isNew: boolean) => {
    if (!currentUser || !currentUser.emailVerified) return;
    const cleanId = idea.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    const path = `ideas/${cleanId}`;
    try {
      await setDoc(doc(db, 'ideas', cleanId), {
        title: idea.title.slice(0, 120),
        founderName: idea.founderName.slice(0, 60),
        authorUid: currentUser.uid,
        shortSummary: idea.shortSummary.slice(0, 600),
        problemStatement: idea.problemStatement.slice(0, 1500),
        aiSolution: idea.aiSolution.slice(0, 1500),
        targetMarket: idea.targetMarket.slice(0, 200),
        stage: idea.stage,
        monthlyPriceEur: idea.monthlyPriceEur,
        targetCustomers: idea.targetCustomers,
        arrMultiple: idea.arrMultiple,
        estimatedValuationEur: idea.estimatedValuationEur,
        votesCount: idea.votesCount,
        dotVerdict: idea.dotVerdict,
        dotScore: idea.dotScore,
        dotSummaryAdvice: idea.dotSummaryAdvice.slice(0, 2000),
        dotNextSteps: idea.dotNextSteps.slice(0, 2000),
        dotCriticalRisk: idea.dotCriticalRisk.slice(0, 1000),
        createdAt: isNew ? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.WRITE, path);
    }
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCreateIdea = async (input: IdeaFormInput) => {
    const check = validateIdeaInput(input);
    if (!check.valid) {
      throw new Error(check.errors.join(' '));
    }

    let created: VentureIdea | null = null;
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          authorUid: currentUser?.uid || 'local-founder',
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        created = data.idea;
      }
    } catch {
      // Static fallback below
    }

    if (!created) {
      const now = new Date().toISOString();
      created = {
        id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: input.title.trim().slice(0, 120),
        founderName: input.founderName.trim().slice(0, 60),
        authorUid: currentUser?.uid || 'local-founder',
        shortSummary: buildShortSummary(input),
        problemStatement: input.problemStatement.trim().slice(0, 1500),
        aiSolution: input.aiSolution.trim().slice(0, 1500),
        targetMarket: input.targetMarket.trim().slice(0, 200),
        stage: 'idea',
        monthlyPriceEur: input.monthlyPriceEur,
        targetCustomers: input.targetCustomers,
        arrMultiple: input.arrMultiple,
        estimatedValuationEur: calculateEnterpriseValuation(
          input.monthlyPriceEur,
          input.targetCustomers,
          input.arrMultiple
        ),
        votesCount: 1,
        dotVerdict: 'pending',
        dotScore: 0,
        dotSummaryAdvice: 'Wacht op validatie door de ChatGPT Dot van Jurjen.',
        dotNextSteps: 'Klik op "Valideer met Dot van Jurjen" om direct een analyse en vervolgstappen te genereren.',
        dotCriticalRisk: 'Nog niet geanalyseerd.',
        createdAt: now,
        updatedAt: now,
      };
    }

    setIdeas((prev) => [created!, ...prev]);
    setSelectedIdeaId(created.id);
    if (!founders.some((f) => f.name.toLowerCase() === created!.founderName.toLowerCase())) {
      setFounders((prev) => [
        ...prev,
        { name: created!.founderName, role: 'Co-Founder', specialty: '€10M+ AI Venture Builder' },
      ]);
    }
    await syncIdeaToFirestoreIfSignedIn(created, true);
    showToast(`Idee "${created.title}" van ${created.founderName} toegevoegd!`);
  };

  const handleVote = async (ideaId: string) => {
    let updatedIdea: VentureIdea | null = null;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incrementVote: true }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        updatedIdea = data.idea;
      }
    } catch {
      // Static fallback below
    }

    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const next = updatedIdea || { ...item, votesCount: item.votesCount + 1, updatedAt: new Date().toISOString() };
        syncIdeaToFirestoreIfSignedIn(next, false);
        showToast(`Stem geregistreerd op "${next.title}"!`);
        return next;
      })
    );
  };

  const handleStageChange = async (ideaId: string, stage: VentureStage) => {
    let updatedIdea: VentureIdea | null = null;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        updatedIdea = data.idea;
      }
    } catch {
      // Static fallback below
    }

    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const next = updatedIdea || { ...item, stage, updatedAt: new Date().toISOString() };
        syncIdeaToFirestoreIfSignedIn(next, false);
        return next;
      })
    );
    showToast(`Fase bijgewerkt naar ${stage}.`);
  };

  const handleUpdateEconomics = async (
    ideaId: string,
    monthlyPriceEur: number,
    targetCustomers: number,
    arrMultiple: number
  ) => {
    let updatedIdea: VentureIdea | null = null;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyPriceEur, targetCustomers, arrMultiple }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        updatedIdea = data.idea;
      }
    } catch {
      // Static fallback below
    }

    const newVal = calculateEnterpriseValuation(monthlyPriceEur, targetCustomers, arrMultiple);
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const next = updatedIdea || {
          ...item,
          monthlyPriceEur,
          targetCustomers,
          arrMultiple,
          estimatedValuationEur: newVal,
          updatedAt: new Date().toISOString(),
        };
        syncIdeaToFirestoreIfSignedIn(next, false);
        return next;
      })
    );
    showToast(`Nieuwe €10M-rekensom opgeslagen: €${(newVal / 1_000_000).toFixed(2)}M waardering.`);
  };

  const handleTriggerDotValidation = async (ideaId: string) => {
    setIsValidatingDot(true);
    try {
      let updatedIdea: VentureIdea | null = null;
      try {
        const res = await fetch(`/api/ideas/${ideaId}/validate-with-dot`, {
          method: 'POST',
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          updatedIdea = data.idea;
        }
      } catch {
        // Static fallback below
      }

      setIdeas((prev) =>
        prev.map((item) => {
          if (item.id !== ideaId) return item;
          if (updatedIdea) {
            syncIdeaToFirestoreIfSignedIn(updatedIdea, false);
            showToast(`De Dot van Jurjen heeft "${updatedIdea.title}" gevalideerd (Score: ${updatedIdea.dotScore}/100)!`);
            return updatedIdea;
          }
          const fallback = generateDeterministicDotAdvice(item);
          const next: VentureIdea = {
            ...item,
            dotVerdict: fallback.dotVerdict,
            dotScore: fallback.dotScore,
            dotSummaryAdvice: fallback.dotSummaryAdvice,
            dotNextSteps: fallback.dotNextSteps,
            dotCriticalRisk: fallback.dotCriticalRisk,
            stage: fallback.recommendedStage,
            updatedAt: new Date().toISOString(),
          };
          syncIdeaToFirestoreIfSignedIn(next, false);
          showToast(`De Dot van Jurjen heeft "${next.title}" gevalideerd (Score: ${next.dotScore}/100)!`);
          return next;
        })
      );
    } finally {
      setIsValidatingDot(false);
    }
  };

  const handleSubmitManualDotAdvice = async (
    ideaId: string,
    payload: {
      dotVerdict: DotVerdict;
      dotScore: number;
      dotSummaryAdvice: string;
      dotNextSteps: string;
      dotCriticalRisk: string;
    }
  ) => {
    let updatedIdea: VentureIdea | null = null;
    try {
      const res = await fetch(`/api/ideas/${ideaId}/advise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        updatedIdea = data.idea;
      }
    } catch {
      // Static fallback below
    }

    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const next: VentureIdea = updatedIdea || {
          ...item,
          dotVerdict: payload.dotVerdict,
          dotScore: payload.dotScore,
          dotSummaryAdvice: payload.dotSummaryAdvice,
          dotNextSteps: payload.dotNextSteps,
          dotCriticalRisk: payload.dotCriticalRisk,
          stage: item.stage === 'idea' ? (payload.dotVerdict === 'go' ? 'business_case' : 'validated') : item.stage,
          updatedAt: new Date().toISOString(),
        };
        syncIdeaToFirestoreIfSignedIn(next, false);
        showToast(`Advies van de Dot van Jurjen opgeslagen bij "${next.title}".`);
        return next;
      })
    );
  };

  const handleAddFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFriendInput.trim();
    if (!cleanName || cleanName.length < 2) return;
    try {
      const res = await fetch('/api/founders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setFounders(data.founders);
      } else if (!founders.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
        setFounders((prev) => [
          ...prev,
          { name: cleanName, role: 'Co-Founder', specialty: 'Venture Ideation & Uitwerking' },
        ]);
      }
    } catch {
      if (!founders.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
        setFounders((prev) => [
          ...prev,
          { name: cleanName, role: 'Co-Founder', specialty: 'Venture Ideation & Uitwerking' },
        ]);
      }
    }
    setSelectedFounder(cleanName);
    setNewFriendInput('');
    setShowAddFriend(false);
    showToast(`${cleanName} toegevoegd aan de vriendengroep!`);
  };

  // Summary metrics across all ideas
  const totalTenMillionCases = ideas.filter((i) => i.estimatedValuationEur >= 10_000_000).length;
  const dotGoCases = ideas.filter((i) => i.dotVerdict === 'go').length;
  const highestValuationEur = ideas.reduce(
    (max, i) => (i.estimatedValuationEur > max ? i.estimatedValuationEur : max),
    0
  );

  // Count ideas per friend
  const countByFounder = useMemo(() => {
    const counts: Record<string, number> = {};
    ideas.forEach((i) => {
      const key = i.founderName.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [ideas]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/95 sticky top-0 z-30 backdrop-blur">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('ideas');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          TienMiljoen Lab
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav aria-label="Hoofdnavigatie" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('ideas')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'ideas'
                ? 'text-slate-100 border-amber-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Ideeën per Naam
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dot_bridge')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'dot_bridge'
                ? 'text-slate-100 border-amber-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Dot van Jurjen Koppeling
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'methodology'
                ? 'text-slate-100 border-amber-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Van Idee naar €10M+ Methode
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewIdeaOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw €10M+ Idee Indienen</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-[#111827] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'ideas' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Ideeën per Naam
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dot_bridge')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'dot_bridge' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Dot van Jurjen Koppeling
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'methodology' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Van Idee naar €10M+ Methode
        </button>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {statusMessage && (
          <div
            role="status"
            className="px-4 py-3 bg-emerald-950/80 border border-emerald-700/80 rounded-lg text-xs font-medium text-emerald-200 flex items-center justify-between"
          >
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Executive Context & KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Vriendengroep & Ideeënpijplijn</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-1">
              {ideas.length} cases · {founders.length} vrienden
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Georganiseerd per naam buiten de vergaderzaal
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">&gt;€10 Miljoen Business Cases</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {totalTenMillionCases} van {ideas.length} ideeën
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              Hoogste case: €{(highestValuationEur / 1_000_000).toFixed(1)}M waardering
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Oordeel: De Dot van Jurjen (Advisory Board)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
              {dotGoCases} GO · {ideas.length - dotGoCases} In Review/Pivot
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Directe AI-validatie + vervolgstappen
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Cloud & Dot API Synchronisatie</span>
              <Cloud className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              {currentUser ? (
                <>
                  <span className="text-xs text-emerald-400 truncate">
                    Ingelogd: {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="px-2.5 py-1 text-xs text-slate-300 border border-slate-700 rounded hover:bg-slate-800 shrink-0"
                  >
                    Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-300">Live Server + Firebase Ready</span>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle().catch(() => {})}
                    className="px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/10 whitespace-nowrap shrink-0"
                  >
                    Google Sync
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {activeTab === 'dot_bridge' && <JurjenDotBridgeView ideas={ideas} />}

        {activeTab === 'methodology' && <MethodologyView founders={founders} />}

        {activeTab === 'ideas' && (
          <div className="space-y-6">
            {/* Filter Bar per Naam van de 10 Vrienden */}
            <section
              aria-label="Filter ideeën op naam van vriend"
              className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-display">
                    Filter Ideeën per Naam (Jullie 10-Koppige Vriendengroep)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik op een naam om direct alle ingediende AI-businesscases, samenvattingen en adviezen van Jurjen’s Dot voor die persoon te bekijken.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddFriend(!showAddFriend)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vriend Toevoegen</span>
                </button>
              </div>

              {showAddFriend && (
                <form onSubmit={handleAddFounder} className="flex items-center gap-2 pt-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Voornaam van vriend..."
                    aria-label="Voornaam van vriend toevoegen"
                    value={newFriendInput}
                    onChange={(e) => setNewFriendInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                  >
                    Toevoegen
                  </button>
                </form>
              )}

              {/* Interactive Segmented Buttons per Friend Name */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedFounder('ALL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedFounder === 'ALL'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  Alle Vrienden ({ideas.length})
                </button>

                {founders.map((f) => {
                  const count = countByFounder[f.name.toLowerCase()] || 0;
                  const isSelected = selectedFounder.toLowerCase() === f.name.toLowerCase();
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFounder(f.name)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {f.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Secondary Search & Status Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Zoek op idee, markt of samenvatting"
                    placeholder="Zoek op idee, naam of doelmarkt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <select
                    aria-label="Filter op fase"
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200"
                  >
                    <option value="ALL">Alle Fases (1 t/m 4)</option>
                    <option value="idea">1. Ruwe Brainstorm</option>
                    <option value="validated">2. Gevalideerd door Jurjen’s Dot</option>
                    <option value="business_case">3. €10M+ Business Case Klaar</option>
                    <option value="execution">4. In 90-Dagen Executie</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter op oordeel van Jurjen's Dot"
                    value={selectedVerdict}
                    onChange={(e) => setSelectedVerdict(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200"
                  >
                    <option value="ALL">Alle Oordelen van Dot van Jurjen</option>
                    <option value="go">GO — &gt;€10M Haalbaar</option>
                    <option value="pivot">PIVOT — Aanpassing Vereist</option>
                    <option value="no_go">NO-GO — Onvoldoende Schaal</option>
                    <option value="pending">Wacht op Validatie</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Main 2-Column Workspace: Left = Ideas per Name List, Right = Selected Idea + Dot Advice + Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: High-Density Idea Cards per Name */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedFounder === 'ALL'
                      ? `Overzicht van alle ${filteredIdeas.length} ideeën`
                      : `Ideeën van ${selectedFounder} (${filteredIdeas.length})`}
                  </span>
                  {selectedFounder !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedFounder('ALL')}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Toon alle vrienden
                    </button>
                  )}
                </div>

                {filteredIdeas.length === 0 ? (
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center space-y-3">
                    <p className="text-sm font-medium text-slate-200">
                      Nog geen ideeën gevonden voor dit filter ({selectedFounder}).
                    </p>
                    <p className="text-xs text-slate-400">
                      Dien direct het eerste &gt;€10M AI-idee in op naam van{' '}
                      {selectedFounder === 'ALL' ? 'een van de vrienden' : selectedFounder} en laat de Dot van Jurjen het valideren.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsNewIdeaOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Idee Indienen voor {selectedFounder === 'ALL' ? 'Groep' : selectedFounder}</span>
                    </button>
                  </div>
                ) : (
                  filteredIdeas.map((idea) => {
                    const isSelected = activeIdea?.id === idea.id;
                    const arr = calculateAnnualRecurringRevenue(idea.monthlyPriceEur, idea.targetCustomers);
                    const is10M = idea.estimatedValuationEur >= 10_000_000;

                    return (
                      <div
                        key={idea.id}
                        onClick={() => setSelectedIdeaId(idea.id)}
                        className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'bg-[#161F33] border-amber-500/70'
                            : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Clean unboxed inline metadata with separators (Zero-Pill Discipline) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-amber-400">{idea.founderName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Waardering: €{(idea.estimatedValuationEur / 1_000_000).toFixed(1)}M
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              ARR: €{(arr / 1_000_000).toFixed(2)}M
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-mono tabular-nums">
                            {idea.dotVerdict === 'go' && (
                              <span className="text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Dot GO ({idea.dotScore})
                              </span>
                            )}
                            {idea.dotVerdict === 'pivot' && (
                              <span className="text-amber-400 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Dot PIVOT ({idea.dotScore})
                              </span>
                            )}
                            {idea.dotVerdict === 'no_go' && (
                              <span className="text-red-400 inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                Dot NO-GO ({idea.dotScore})
                              </span>
                            )}
                            {idea.dotVerdict === 'pending' && (
                              <span className="text-slate-400 inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Wacht op Dot
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-100 font-display leading-snug">
                          {idea.title}
                        </h3>

                        {/* Short Summary */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {idea.shortSummary}
                        </p>

                        {/* Advice snippet from Jurjen's Dot */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span className="truncate">
                            <strong className="text-slate-300">Dot Advies:</strong> {idea.dotSummaryAdvice}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-300 shrink-0">
                            <ThumbsUp className="w-3 h-3 text-amber-400" />
                            {idea.votesCount}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[11px] font-mono tabular-nums ${is10M ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {is10M
                              ? `✓ >€10M Doel Gehaald (${idea.targetCustomers} klanten @ €${idea.monthlyPriceEur}/mnd)`
                              : `Onder €10M drempel (€${idea.monthlyPriceEur}/mnd)`}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIdeaId(idea.id);
                              handleTriggerDotValidation(idea.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Hervalideer met Dot</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Full Detail View, Jurjen's Dot Advisory Board & Interactive €10M+ Simulator */}
              <div className="lg:col-span-7">
                {activeIdea && (
                  <IdeaDetailPanel
                    idea={activeIdea}
                    onVote={handleVote}
                    onStageChange={handleStageChange}
                    onUpdateEconomics={handleUpdateEconomics}
                    onTriggerDotValidation={handleTriggerDotValidation}
                    onSubmitManualDotAdvice={handleSubmitManualDotAdvice}
                    isValidatingDot={isValidatingDot}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-800/80 py-6 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 max-w-[1400px] w-full mx-auto">
        <span>TienMiljoen Lab — Gedeelde €10M+ AI Venture Werkplaats voor jullie 10 vrienden</span>
        <span>Advisory Board gekoppeld aan de ChatGPT Dot van Jurjen (/api/openapi.json)</span>
      </footer>

      <NewIdeaModal
        isOpen={isNewIdeaOpen}
        onClose={() => setIsNewIdeaOpen(false)}
        founders={founders}
        selectedFounderFilter={selectedFounder}
        onSubmitIdea={handleCreateIdea}
      />
    </div>
  );
}
