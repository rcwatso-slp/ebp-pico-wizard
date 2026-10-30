import { APP_VERSION, type WizardData } from './types';

const STORAGE_KEY = 'ebp_wizard_state_v1';

const createGoal = (id: string) => ({
  id,
  behavior: '',
  condition: '',
  criterion: '',
  timeframe: '',
});

export const getDefaultState = (): WizardData => ({
  version: APP_VERSION,
  currentStep: 0,
  step0: {
    noPhi: false,
    verifySources: false,
  },
  caseSnapshot: {
    setting: '',
    age: '',
    primaryConcern: '',
    concerns: [],
    otherConcern: '',
    severity: '',
    functionalProblem: '',
    treatmentTarget: '',
    assessmentAnchors: [{ id: crypto.randomUUID(), measure: '', finding: '' }],
    constraints: [],
    constraintNotes: '',
    clientPriorities: '',
  },
  step2: {
    builder: {
      p: '',
      i: '',
      c: '',
      o: '',
      measurement: '',
      timeframe: '',
    },
    finalPico: '',
    questionChecks: { searchable: false, feasible: false, relevant: false },
    keywords: [],
  },
  step3: {
    keywordsEdited: false,
    keywordColumns: {
      population: [],
      intervention: [],
      outcome: [],
    },
    queries: {
      fullPico: '',
      keywordOnly: '',
      interventionFocused: '',
      outcomeFocused: '',
    },
    elicitPrompt: '',
    candidateArticles: [],
    searchLog: [],
  },
  step4: {
    scores: {},
    autoSort: true,
  },
  step5: {
    extractions: {},
  },
  step6: {
    longTermGoal: createGoal(crypto.randomUUID()),
    shortTermObjectives: [createGoal(crypto.randomUUID()), createGoal(crypto.randomUUID())],
    methodology: {
      sessionStructure: '',
      cueingHierarchy: '',
      feedbackTypeFrequency: '',
      materialsList: '',
    },
    progressMonitoring: {
      probeSchedule: '',
      metric: '',
      masteryCriteria: '',
    },
    rationaleArticleIds: [],
  },
  phiIgnoredFields: {},
});

export const saveState = (state: WizardData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Older saves had a list of concerns plus an "initial target" picked from it.
// The target becomes the primary area; the rest become co-occurring areas.
const migrateCaseSnapshot = (parsed: WizardData): void => {
  const cs = parsed.caseSnapshot as WizardData['caseSnapshot'] & { initialTarget?: WizardData['caseSnapshot']['primaryConcern'] };
  if (typeof cs.primaryConcern !== 'string') {
    const primary = cs.initialTarget || cs.concerns[0] || '';
    cs.primaryConcern = primary;
    cs.concerns = cs.concerns.filter((c) => c !== primary);
  }
  delete cs.initialTarget;
  if (typeof cs.otherConcern !== 'string') cs.otherConcern = '';
  if (typeof cs.severity !== 'string') cs.severity = '';
  if (typeof cs.treatmentTarget !== 'string') cs.treatmentTarget = '';
  if (typeof cs.clientPriorities !== 'string') cs.clientPriorities = '';
};

// Older saves had candidate questions, 1-5 ratings, and a "Lock PICO" flag.
// A locked question counts as checked; the candidates and ratings are dropped.
const migrateStep2 = (parsed: WizardData): void => {
  const s2 = parsed.step2 as WizardData['step2'] & { picoLocked?: boolean; candidates?: unknown; prompt?: unknown };
  if (!s2.questionChecks) {
    const locked = s2.picoLocked === true;
    s2.questionChecks = { searchable: locked, feasible: locked, relevant: locked };
  }
  delete s2.picoLocked;
  delete s2.candidates;
  delete s2.prompt;
  if (!Array.isArray(s2.keywords)) s2.keywords = [];
};

export const loadState = (): WizardData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as WizardData;
    if (!parsed.version || parsed.version !== APP_VERSION) {
      return getDefaultState();
    }
    // Backward compatibility for older saved state created before keywordsEdited existed.
    if (typeof parsed.step3.keywordsEdited !== 'boolean') {
      parsed.step3.keywordsEdited = false;
    }
    migrateCaseSnapshot(parsed);
    migrateStep2(parsed);
    if (!Array.isArray(parsed.step3.searchLog)) {
      parsed.step3.searchLog = [];
    }
    if (typeof parsed.step3.elicitPrompt !== 'string') {
      parsed.step3.elicitPrompt = '';
    }
    return parsed;
  } catch {
    return getDefaultState();
  }
};

export const clearState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
