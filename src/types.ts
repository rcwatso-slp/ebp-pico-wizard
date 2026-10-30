export const APP_VERSION = 1;

export type Setting =
  | 'University clinic'
  | 'School'
  | 'Outpatient'
  | 'SNF/Rehab'
  | 'Telepractice'
  | 'Other';

// Stored values; display labels and search terms live in concernOptions (utils.ts).
// Keep existing values unchanged so students' saved work still matches.
export type Concern =
  | 'phonology'
  | 'CAS'
  | 'dysarthria'
  | 'apraxia of speech'
  | 'resonance'
  | 'late language emergence'
  | 'language'
  | 'DLD'
  | 'literacy'
  | 'autism'
  | 'social communication'
  | 'Down syndrome'
  | 'AAC'
  | 'selective mutism'
  | 'fluency'
  | 'cluttering'
  | 'voice'
  | 'gender-affirming voice'
  | 'aphasia'
  | 'cognition'
  | 'dysphagia'
  | 'pediatric feeding'
  | 'hearing loss'
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

export type Severity = 'mild' | 'moderate' | 'severe' | 'profound' | 'not yet determined';

export interface CaseSnapshot {
  setting: Setting | '';
  age: '' | number;
  // The area this EBP question is about; drives the search population.
  primaryConcern: Concern | '';
  // Co-occurring areas (context only; never includes primaryConcern).
  concerns: Concern[];
  otherConcern: string;
  severity: Severity | '';
  functionalProblem: string;
  // The specific skill or behavior to change; becomes the PICO outcome.
  treatmentTarget: string;
  assessmentAnchors: AssessmentAnchor[];
  constraints: ConstraintKey[];
  constraintNotes: string;
  clientPriorities: string;
}

export interface PicoBuilder {
  p: string;
  i: string;
  c: string;
  o: string;
  measurement: string;
  timeframe: string;
}

export interface QuestionChecks {
  searchable: boolean;
  feasible: boolean;
  relevant: boolean;
}

export interface Step2State {
  builder: PicoBuilder;
  finalPico: string;
  questionChecks: QuestionChecks;
  // Older saves kept one unsorted keyword list; it is shown for sorting into the concept columns.
  keywords: string[];
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
  // Why it might be relevant.
  notes: string;
  // Filled in when saved from the built-in search.
  authors?: string;
  journal?: string;
  studyTypes?: string[];
  // Where it was found: "PubMed", "Europe PMC", or what the student typed.
  source?: string;
  searchId?: string;
}

export interface SearchLogEntry {
  id: string;
  date: string;
  source: string;
  strategy: string;
  query: string;
  total: number;
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
  // Every search run in the app, so the search can be reproduced and reported.
  searchLog: SearchLogEntry[];
}

export type MatchRating = 'yes' | 'partly' | 'no' | '';
export type ChecklistAnswer = 'yes' | 'no' | 'unclear';
export type StudyDesign =
  | 'systematic-review'
  | 'guideline'
  | 'rct'
  | 'nonrandomized'
  | 'single-case'
  | 'pre-post'
  | 'case-report'
  | 'qualitative'
  | 'expert-opinion';

// One student's critical appraisal of one saved article (see appraisal.ts).
export interface ArticleAppraisal {
  articleId: string;
  relevance: { population: MatchRating; intervention: MatchRating; outcome: MatchRating };
  setAside: boolean;
  setAsideReason: string;
  design: StudyDesign | '';
  // Checklist item id -> answer.
  quality: Record<string, ChecklistAnswer>;
  applicability: { setting: MatchRating; dosage: MatchRating; priorities: MatchRating };
  includeTop: boolean;
  topReason: string;
}

export interface Step4State {
  appraisals: Record<string, ArticleAppraisal>;
}

export type ResultDirection = 'improved' | 'mixed' | 'no-difference' | 'worse';
export type MeasuredFinding = 'yes' | 'partly' | 'no' | 'not-measured';

// What a student pulls out of one top article (see extraction.ts).
export interface EvidenceExtraction {
  articleId: string;
  citation: string;
  participants: string;
  interventionComponents: string;
  dosage: { sessionLength: string; frequency: string; duration: string; notes: string };
  outcomeMeasures: string;
  results: {
    direction: ResultDirection | '';
    generalization: MeasuredFinding | '';
    maintenance: MeasuredFinding | '';
    summary: string;
  };
  clinicalTakeaway: string;
  materialsSetup: string;
}

export interface Step5State {
  extractions: Record<string, EvidenceExtraction>;
  // The student's summary of what the top articles say together.
  synthesis: string;
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
  step5: Step5State;
  step6: Step6State;
  phiIgnoredFields: Record<string, boolean>;
}
