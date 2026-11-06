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
  Cloud,
  Settings,
  Trash2,
  LayoutDashboard,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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
  buildShortSummary,
  validateIdeaInput,
  synthesizeStep3Dashboard,
  getViabilityBand,
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
import { ManagePageView } from './components/ManagePageView';

type ActiveTab = 'ideas' | 'manage' | 'dot_bridge' | 'methodology';

const LOCAL_STORAGE_IDEAS_KEY = 'tienmiljoen_lab_ideas_v3';
const LEGACY_IDEAS_KEYS = ['tienmiljoen_lab_ideas_v2', 'tienmiljoen_lab_ideas_v1', 'tienmiljoen_lab_ideas'];
const LOCAL_STORAGE_FOUNDERS_KEY = 'tienmiljoen_lab_founders_v3';
const LEGACY_FOUNDERS_KEYS = ['tienmiljoen_lab_founders_v2', 'tienmiljoen_lab_founders_v1'];
const LOCAL_STORAGE_DELETED_IDS_KEY = 'tienmiljoen_lab_deleted_ids_v3';
const LOCAL_STORAGE_UI_STATE_KEY = 'tienmiljoen_lab_ui_state_v3';

function normalizeClientIdea(raw: Record<string, unknown>): VentureIdea {
  const now = new Date().toISOString();
  const stepNum = Number(raw.currentStep);
  const currentStep: 1 | 2 | 3 =
    stepNum === 2 || stepNum === 3
      ? stepNum
      : raw.dotVerdict && raw.dotVerdict !== 'pending'
      ? 3
      : 1;

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
          ? `Maandelijks B2B-abonnement (€${raw.monthlyPriceEur}/mnd)`
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

function loadInitialLocalIdeas(): VentureIdea[] {
  try {
    const allKeys = [LOCAL_STORAGE_IDEAS_KEY, ...LEGACY_IDEAS_KEYS];
    const mergedMap = new Map<string, VentureIdea>();
    for (const key of allKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item.id === 'string') {
              const norm = normalizeClientIdea(item);
              if (!mergedMap.has(norm.id)) {
                mergedMap.set(norm.id, norm);
              }
            }
          });
        }
      }
    }
    if (mergedMap.size > 0) {
      return Array.from(mergedMap.values());
    }
  } catch {
    // ignore storage errors
  }
  return SEED_IDEAS;
}

function loadInitialLocalFounders(): FounderMember[] {
  try {
    const allKeys = [LOCAL_STORAGE_FOUNDERS_KEY, ...LEGACY_FOUNDERS_KEYS];
    for (const key of allKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_FOUNDERS;
}

function loadDeletedIds(): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_IDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function loadSavedUiState(): { activeTab: ActiveTab; selectedIdeaId: string; selectedFounder: string } {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_UI_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        activeTab: ['ideas', 'manage', 'dot_bridge', 'methodology'].includes(parsed.activeTab)
          ? parsed.activeTab
          : 'ideas',
        selectedIdeaId: typeof parsed.selectedIdeaId === 'string' ? parsed.selectedIdeaId : '',
        selectedFounder: typeof parsed.selectedFounder === 'string' ? parsed.selectedFounder : 'ALL',
      };
    }
  } catch {
    // ignore
  }
  return { activeTab: 'ideas', selectedIdeaId: '', selectedFounder: 'ALL' };
}

export default function App() {
  const initialUi = loadSavedUiState();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialUi.activeTab);
  const [ideas, setIdeas] = useState<VentureIdea[]>(loadInitialLocalIdeas);
  const [founders, setFounders] = useState<FounderMember[]>(loadInitialLocalFounders);
  const [deletedIds, setDeletedIds] = useState<string[]>(loadDeletedIds);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(initialUi.selectedIdeaId);

  // Filters
  const [selectedFounder, setSelectedFounder] = useState<string>(initialUi.selectedFounder);
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

  // Persist ideas, founders, deletedIds, and last active UI state to localStorage immediately
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DELETED_IDS_KEY, JSON.stringify(deletedIds));
    } catch {
      // ignore
    }
  }, [deletedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_UI_STATE_KEY,
        JSON.stringify({ activeTab, selectedIdeaId, selectedFounder })
      );
    } catch {
      // ignore
    }
  }, [activeTab, selectedIdeaId, selectedFounder]);

  // 1. Bidirectional sync with Express backend so local ideas are NEVER overwritten by an empty server restart
  const syncWithBackend = async () => {
    try {
      const localIdeasNow = loadInitialLocalIdeas();
      const localFoundersNow = loadInitialLocalFounders();
      const localDeletedNow = loadDeletedIds();

      const res = await fetch('/api/ideas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideas: localIdeasNow,
          founders: localFoundersNow,
          deletedIds: localDeletedNow,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.ideas)) {
          setIdeas(data.ideas.map((i: Record<string, unknown>) => normalizeClientIdea(i)));
        }
        if (Array.isArray(data.founders) && data.founders.length > 0) {
          setFounders(data.founders);
        }
      }
    } catch {
      // Static host (e.g. Netlify) without Express backend — uses localStorage & Firestore seamlessly
    }
  };

  useEffect(() => {
    testFirestoreConnection();
    syncWithBackend();

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
            firestoreIdeas.push(
              normalizeClientIdea({
                ...d,
                id: docSnap.id,
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : String(d.createdAt || ''),
                updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : String(d.updatedAt || ''),
              })
            );
          });
          setIdeas((prev) => {
            const deletedSet = new Set(loadDeletedIds());
            const map = new Map<string, VentureIdea>();
            prev.forEach((item) => {
              if (!deletedSet.has(item.id)) map.set(item.id, item);
            });
            firestoreIdeas.forEach((item) => {
              if (!deletedSet.has(item.id)) {
                const existing = map.get(item.id);
                if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
                  map.set(item.id, item);
                }
              }
            });
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
      if (isNew) {
        await setDoc(doc(db, 'ideas', cleanId), {
          title: idea.title.slice(0, 120),
          founderName: idea.founderName.slice(0, 60),
          authorUid: currentUser.uid,
          shortSummary: idea.shortSummary.slice(0, 600),
          problemStatement: idea.problemStatement.slice(0, 1500),
          aiSolution: idea.aiSolution.slice(0, 1500),
          targetMarket: idea.targetMarket.slice(0, 200),
          revenueModel: idea.revenueModel.slice(0, 1500),
          stage: idea.stage,
          currentStep: idea.currentStep,
          votesCount: idea.votesCount,
          dotRawFeedback: idea.dotRawFeedback.slice(0, 4000),
          dotVerdict: idea.dotVerdict,
          dotScore: idea.dotScore,
          aiRealityScore: idea.aiRealityScore,
          businessCaseSummary: idea.businessCaseSummary.slice(0, 2000),
          dotSummaryAdvice: idea.dotSummaryAdvice.slice(0, 2000),
          dotNextSteps: idea.dotNextSteps.slice(0, 2000),
          dotCriticalRisk: idea.dotCriticalRisk.slice(0, 1000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'ideas', cleanId), {
          votesCount: idea.votesCount,
          stage: idea.stage,
          currentStep: idea.currentStep,
          dotRawFeedback: idea.dotRawFeedback.slice(0, 4000),
          dotVerdict: idea.dotVerdict,
          dotScore: idea.dotScore,
          aiRealityScore: idea.aiRealityScore,
          businessCaseSummary: idea.businessCaseSummary.slice(0, 2000),
          dotSummaryAdvice: idea.dotSummaryAdvice.slice(0, 2000),
          dotNextSteps: idea.dotNextSteps.slice(0, 2000),
          dotCriticalRisk: idea.dotCriticalRisk.slice(0, 1000),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
    }
  };

  const deleteIdeaFromFirestoreIfSignedIn = async (ideaId: string) => {
    if (!currentUser || !currentUser.emailVerified) return;
    const cleanId = ideaId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    const path = `ideas/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'ideas', cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
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
        created = normalizeClientIdea(data.idea);
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
        dotNextSteps:
          'Kopieer of mail het gegenereerde tekstdocument (Stap 1) naar de Dot van Jurjen en plak de terugkoppeling in Stap 2.',
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
    showToast(`Idee "${created.title}" opgeslagen in Stap 1! Kopieer of mail nu het tekstdocument naar de Dot van Jurjen.`);
  };

  const handleUpdateIdea = async (ideaId: string, updatedFields: Partial<VentureIdea>) => {
    let updatedIdea: VentureIdea | null = null;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        updatedIdea = normalizeClientIdea(data.idea);
      }
    } catch {
      // Static fallback below
    }

    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const next: VentureIdea = updatedIdea || {
          ...item,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        syncIdeaToFirestoreIfSignedIn(next, false);
        return next;
      })
    );
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const target = ideas.find((i) => i.id === ideaId);
    setDeletedIds((prev) => (prev.includes(ideaId) ? prev : [...prev, ideaId]));
    try {
      await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });
    } catch {
      // Static fallback
    }
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    await deleteIdeaFromFirestoreIfSignedIn(ideaId);
    showToast(`Idee ${target ? `"${target.title}"` : ''} verwijderd.`);
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
        updatedIdea = normalizeClientIdea(data.idea);
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
    await handleUpdateIdea(ideaId, { stage });
  };

  const handleStepChange = async (ideaId: string, currentStep: 1 | 2 | 3) => {
    await handleUpdateIdea(ideaId, { currentStep });
  };

  // STEP 2 -> STEP 3 Processor ("Verwerk" button)
  const handleProcessDotFeedback = async (ideaId: string, dotRawFeedback: string) => {
    setIsValidatingDot(true);

    // 1. Immediate optimistic synthesis & persistence so Step 3 Dashboard opens without delay
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id !== ideaId) return item;
        const synth = synthesizeStep3Dashboard(item, dotRawFeedback);
        const optimisticNext: VentureIdea = {
          ...item,
          dotRawFeedback,
          dotVerdict: synth.dotVerdict,
          dotScore: synth.dotScore,
          aiRealityScore: synth.aiRealityScore,
          businessCaseSummary: synth.businessCaseSummary,
          dotSummaryAdvice: synth.dotSummaryAdvice,
          dotNextSteps: synth.dotNextSteps,
          dotCriticalRisk: synth.dotCriticalRisk,
          stage: synth.recommendedStage,
          currentStep: 3,
          updatedAt: new Date().toISOString(),
        };
        const band = getViabilityBand(optimisticNext.dotScore, optimisticNext.aiRealityScore);
        showToast(
          `Stap 3 Dashboard klaar voor "${optimisticNext.title}" — ${band.label} (Score: ${band.effectiveScore}/100)`
        );
        return optimisticNext;
      })
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`/api/ideas/${ideaId}/process-dot-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dotRawFeedback }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const serverIdea = normalizeClientIdea(data.idea);
        setIdeas((prev) =>
          prev.map((item) => (item.id === ideaId ? serverIdea : item))
        );
        await syncIdeaToFirestoreIfSignedIn(serverIdea, false);
      }
    } catch {
      // Optimistic synthesis is already applied and saved to localStorage
    } finally {
      setIsValidatingDot(false);
    }
  };

  const handleAddFounderObject = async (founder: FounderMember) => {
    try {
      const res = await fetch('/api/founders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(founder),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setFounders(data.founders);
      } else if (!founders.some((f) => f.name.toLowerCase() === founder.name.toLowerCase())) {
        setFounders((prev) => [...prev, founder]);
      }
    } catch {
      if (!founders.some((f) => f.name.toLowerCase() === founder.name.toLowerCase())) {
        setFounders((prev) => [...prev, founder]);
      }
    }
    showToast(`${founder.name} toegevoegd aan de vriendengroep!`);
  };

  const handleUpdateFounder = async (originalName: string, updated: FounderMember) => {
    try {
      const res = await fetch(`/api/founders/${encodeURIComponent(originalName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.founders)) setFounders(data.founders);
        if (Array.isArray(data.ideas)) {
          setIdeas(data.ideas.map((i: Record<string, unknown>) => normalizeClientIdea(i)));
        }
        showToast(`Gegevens van ${updated.name} bijgewerkt!`);
        return;
      }
    } catch {
      // Static fallback below
    }
    setFounders((prev) =>
      prev.map((f) => (f.name.toLowerCase() === originalName.toLowerCase() ? updated : f))
    );
    if (originalName !== updated.name) {
      setIdeas((prev) =>
        prev.map((i) =>
          i.founderName.toLowerCase() === originalName.toLowerCase()
            ? { ...i, founderName: updated.name }
            : i
        )
      );
    }
    showToast(`Gegevens van ${updated.name} bijgewerkt!`);
  };

  const handleDeleteFounder = async (name: string) => {
    try {
      const res = await fetch(`/api/founders/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.founders)) {
          setFounders(data.founders);
          if (selectedFounder.toLowerCase() === name.toLowerCase()) {
            setSelectedFounder('ALL');
          }
          showToast(`${name} verwijderd uit de vriendenlijst.`);
          return;
        }
      }
    } catch {
      // Static fallback below
    }
    setFounders((prev) => prev.filter((f) => f.name.toLowerCase() !== name.toLowerCase()));
    if (selectedFounder.toLowerCase() === name.toLowerCase()) {
      setSelectedFounder('ALL');
    }
    showToast(`${name} verwijderd uit de vriendenlijst.`);
  };

  const handleAddFounderQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFriendInput.trim();
    if (!cleanName || cleanName.length < 2) return;
    await handleAddFounderObject({
      name: cleanName,
      role: 'Co-Founder',
      specialty: 'Venture Ideation & Uitwerking',
    });
    setSelectedFounder(cleanName);
    setNewFriendInput('');
    setShowAddFriend(false);
  };

  // Summary metrics across all ideas
  const step3ProcessedCount = ideas.filter((i) => i.currentStep === 3 || i.dotVerdict !== 'pending').length;
  const actionReadyCount = ideas.filter(
    (i) => i.dotVerdict !== 'pending' && getViabilityBand(i.dotScore, i.aiRealityScore).band === 'viable_action_ready'
  ).length;

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
            Ideeën & 3-Staps Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'manage'
                ? 'text-slate-100 border-amber-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Beheer & Edit
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
            Dot Tekstdocument & Verwerk
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
            Werkwijze
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
            <span>Nieuw Idee Indienen</span>
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
          Ideeën & Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'manage' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Beheer & Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dot_bridge')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'dot_bridge' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Dot Tekstdocument & Verwerk
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'methodology' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
          }`}
        >
          Werkwijze
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
            <div className="text-xs text-slate-400">Opgeslagen Ideeën & Vrienden</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-1">
              {ideas.length} ideeën · {founders.length} vrienden
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Blijft bewaard in laatst geopende status
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Stap 1 → Stap 2 → Stap 3 Flow</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
              {step3ProcessedCount} van {ideas.length} in Stap 3
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Idee + Dot-terugkoppeling verwerkt tot dashboard
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Realiteitsscore 75–100 (Actieklaar)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {actionReadyCount} kansrijke cases
            </div>
            <div className="text-xs text-slate-400 mt-1">
              &lt;50 niet levensvatbaar · 50–75 aanscherpen
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Automatische Opslag</span>
              <Cloud className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              {currentUser ? (
                <>
                  <span className="text-xs text-emerald-400 truncate">
                    Cloud + Browser Sync ({currentUser.displayName || currentUser.email})
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
                  <span className="text-xs text-emerald-400">Browser + Server Opslag Actief</span>
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

        {activeTab === 'manage' && (
          <ManagePageView
            founders={founders}
            ideas={ideas}
            onAddFounder={handleAddFounderObject}
            onUpdateFounder={handleUpdateFounder}
            onDeleteFounder={handleDeleteFounder}
            onOpenNewIdeaModal={() => setIsNewIdeaOpen(true)}
            onUpdateIdea={handleUpdateIdea}
            onDeleteIdea={handleDeleteIdea}
          />
        )}

        {activeTab === 'dot_bridge' && (
          <JurjenDotBridgeView
            ideas={ideas}
            onProcessDotFeedback={handleProcessDotFeedback}
            onNavigateToIdeaStep3={(ideaId) => {
              setSelectedIdeaId(ideaId);
              setActiveTab('ideas');
            }}
          />
        )}

        {activeTab === 'methodology' && <MethodologyView founders={founders} />}

        {activeTab === 'ideas' && (
          <div className="space-y-6">
            {/* Filter Bar per Naam van de Vrienden */}
            <section
              aria-label="Filter ideeën op naam van vriend"
              className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-display">
                    Filter Ideeën per Naam ({founders.length} Vrienden)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik op een naam om de ingebrachte ideeën te bekijken in Stap 1 (Tekstdocument), Stap 2 (Dot-terugkoppeling inbrengen) of Stap 3 (Het Verwerkte Dashboard).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFriend(!showAddFriend)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Snel Vriend Toevoegen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Beheer Vrienden & Ideeën</span>
                  </button>
                </div>
              </div>

              {showAddFriend && (
                <form onSubmit={handleAddFounderQuick} className="flex items-center gap-2 pt-1 max-w-md">
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
                    aria-label="Zoek op idee, markt of verdienmodel"
                    placeholder="Zoek op idee, naam of verdienmodel..."
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
                    <option value="ALL">Alle Fases</option>
                    <option value="idea">1. Idee & Tekstdocument</option>
                    <option value="validated">2. Gevalideerd / Aanscherpen</option>
                    <option value="business_case">3. Concrete Vervolgstappen (75+)</option>
                    <option value="execution">4. In Executie</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter op scoreband"
                    value={selectedVerdict}
                    onChange={(e) => setSelectedVerdict(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200"
                  >
                    <option value="ALL">Alle Scorebanden</option>
                    <option value="go">Score 75–100: Concrete Vervolgstappen</option>
                    <option value="pivot">Score 50–75: Eerst Aanscherpen</option>
                    <option value="no_go">Score &lt;50: Niet Levensvatbaar</option>
                    <option value="pending">Nog in Stap 1 of 2</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Empty State when there are 0 ideas */}
            {filteredIdeas.length === 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-10 text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-100 font-display">
                  {ideas.length === 0
                    ? 'Klaar voor de aftrap: nog 0 ideeën ingediend'
                    : `Nog geen ideeën gevonden voor ${selectedFounder === 'ALL' ? 'dit filter' : selectedFounder}`}
                </h3>
                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Dien een idee in voor een van de vrienden ({founders.map((f) => f.name).join(', ')}). Elk idee wordt automatisch opgeslagen in de laatst geopende stap (Stap 1: Idee & Tekstdocument → Stap 2: Dot-terugkoppeling inbrengen → Stap 3: Dashboard met Score 0–100 & Vervolgstappen).
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewIdeaOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {selectedFounder === 'ALL'
                        ? 'Eerste Idee Indienen'
                        : `Idee Indienen voor ${selectedFounder}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Open Beheer & Edit Pagina</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Main 2-Column Workspace when ideas exist */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-400">
                      {selectedFounder === 'ALL'
                        ? `Opgeslagen ideeën (${filteredIdeas.length})`
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

                  {filteredIdeas.map((idea) => {
                    const isSelected = activeIdea?.id === idea.id;
                    const band = getViabilityBand(idea.dotScore, idea.aiRealityScore);

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
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-amber-400">{idea.founderName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-300">Stap {idea.currentStep || 1}/3</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-mono tabular-nums">
                            {idea.dotVerdict === 'pending' ? (
                              <span className="text-slate-400 inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Stap {idea.currentStep || 1}
                              </span>
                            ) : band.band === 'viable_action_ready' ? (
                              <span className="text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {band.effectiveScore}/100 (Actieklaar)
                              </span>
                            ) : band.band === 'needs_sharpening' ? (
                              <span className="text-amber-400 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {band.effectiveScore}/100 (Aanscherpen)
                              </span>
                            ) : (
                              <span className="text-red-400 inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                {band.effectiveScore}/100 (&lt;50)
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-100 font-display leading-snug">
                          {idea.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {idea.shortSummary}
                        </p>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <LayoutDashboard className="w-3 h-3 text-amber-400" />
                            <span>
                              {idea.currentStep === 3
                                ? 'Stap 3 Dashboard Gereed'
                                : idea.currentStep === 2
                                ? 'Stap 2: Dot-Terugkoppeling'
                                : 'Stap 1: Tekstdocument'}
                            </span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-300">
                              <ThumbsUp className="w-3 h-3 text-amber-400" />
                              {idea.votesCount}
                            </span>
                            <button
                              type="button"
                              aria-label={`Verwijder ${idea.title}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteIdea(idea.id);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Verwijder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="lg:col-span-8">
                  {activeIdea && (
                    <IdeaDetailPanel
                      idea={activeIdea}
                      onVote={handleVote}
                      onStageChange={handleStageChange}
                      onStepChange={handleStepChange}
                      onUpdateIdea={handleUpdateIdea}
                      onProcessDotFeedback={handleProcessDotFeedback}
                      isValidatingDot={isValidatingDot}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-800/80 py-6 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 max-w-[1400px] w-full mx-auto">
        <span>TienMiljoen Lab — Gedeelde AI Venture Werkplaats voor jullie vriendengroep</span>
        <span>Stap 1: Idee & Tekstdocument · Stap 2: Dot-Terugkoppeling & Verwerk · Stap 3: Dashboard (Score 0–100)</span>
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
