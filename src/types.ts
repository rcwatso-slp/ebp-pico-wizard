export const APP_VERSION = 1;

export type Setting =
  | 'University clinic'
  | 'School'
  | 'Outpatient'
  | 'SNF/Rehab'
  | 'Telepractice'
  | 'Other';

export type Concern =
  | 'CAS'
  | 'phonology'
  | 'language'
  | 'fluency'
  | 'voice'
  | 'dysarthria'
  | 'aphasia'
  | 'cognition'
  | 'dysphagia'
  | 'AAC'
  | 'social communication'
  | 'other';

export type ConstraintKey =
  | 'frequency/time'
  | 'attention'
  | 'caregiver support'
  | 'materials'
  | 'group vs individual'
  | 'other';

export interface AssessmentAnchor {
  id: string;
  measure: string;
  finding: string;
}

export interface CaseSnapshot {
  setting: Setting | '';
  age: '' | number;
  concerns: Concern[];
  functionalProblem: string;
  assessmentAnchors: AssessmentAnchor[];
  initialTarget: Concern | '';
  constraints: ConstraintKey[];
  constraintNotes: string;
}

export interface PicoBuilder {
  p: string;
  i: string;
  c: string;
  o: string;
  measurement: string;
  timeframe: string;
}

export interface PicoCandidate {
  id: string;
  question: string;
  p: string;
  i: string;
  c: string;
  o: string;
  feasibility: number;
  searchability: number;
}

export interface Step2State {
  builder: PicoBuilder;
  candidates: PicoCandidate[];
  finalPico: string;
  picoLocked: boolean;
  keywords: string[];
  prompt: string;
}

export interface SearchKeywords {
  population: string[];
  intervention: string[];
  outcome: string[];
}

export interface CandidateArticle {
  id: string;
  title: string;
  year: string;
  link: string;
  notes: string;
}

export interface Step3State {
  // Prevents auto-derivation from overwriting user-customized keywords/queries.
  keywordsEdited: boolean;
  keywordColumns: SearchKeywords;
  queries: {
    fullPico: string;
    keywordOnly: string;
    interventionFocused: string;
    outcomeFocused: string;
  };
  elicitPrompt: string;
  candidateArticles: CandidateArticle[];
}

export interface ArticleScore {
  articleId: string;
  populationMatch: number;
  interventionMatch: number;
  outcomeMatch: number;
  studyQuality: number;
  clinicalFeasibility: number;
  recencyFoundational: number;
  includeTop: boolean;
  manualOrder: number;
}

export interface Step4State {
  scores: Record<string, ArticleScore>;
  autoSort: boolean;
}

export interface EvidenceExtraction {
  articleId: string;
  citation: string;
  participants: string;
  interventionComponents: string;
  dosage: string;
  outcomeMeasures: string;
  resultsSummary: string;
  clinicalTakeaway: string;
  materialsSetup: string;
  collapsed: boolean;
}

export interface GoalTemplate {
  id: string;
  behavior: string;
  condition: string;
  criterion: string;
  timeframe: string;
}

export interface Step6State {
  longTermGoal: GoalTemplate;
  shortTermObjectives: GoalTemplate[];
  methodology: {
    sessionStructure: string;
    cueingHierarchy: string;
    feedbackTypeFrequency: string;
    materialsList: string;
  };
  progressMonitoring: {
    probeSchedule: string;
    metric: string;
    masteryCriteria: string;
  };
  rationaleArticleIds: string[];
}

export interface WizardData {
  version: number;
  currentStep: number;
  step0: {
    noPhi: boolean;
    verifySources: boolean;
  };
  caseSnapshot: CaseSnapshot;
  step2: Step2State;
  step3: Step3State;
  step4: Step4State;
  step5: {
    extractions: Record<string, EvidenceExtraction>;
  };
  step6: Step6State;
  phiIgnoredFields: Record<string, boolean>;
}
