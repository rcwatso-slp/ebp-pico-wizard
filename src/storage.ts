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
    concerns: [],
    functionalProblem: '',
    assessmentAnchors: [{ id: crypto.randomUUID(), measure: '', finding: '' }],
    initialTarget: '',
    constraints: [],
    constraintNotes: '',
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
    candidates: [],
    finalPico: '',
    picoLocked: false,
    keywords: [],
    prompt: '',
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
    candidateArticles: Array.from({ length: 2 }).map(() => ({
      id: crypto.randomUUID(),
      title: '',
      year: '',
      link: '',
      notes: '',
    })),
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
