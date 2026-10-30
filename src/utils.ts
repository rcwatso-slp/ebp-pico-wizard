import type { CandidateArticle, Concern, ConstraintKey, GoalTemplate, WizardData } from './types';

export interface ConcernOption {
  value: Concern;
  label: string;
  group: string;
  // Terms used when building Step 3 search queries.
  searchTerms: string[];
}

export const concernOptions: ConcernOption[] = [
  { group: 'Speech sound & motor speech', value: 'phonology', label: 'Speech sound disorder (articulation/phonology)', searchTerms: ['speech sound disorder'] },
  { group: 'Speech sound & motor speech', value: 'CAS', label: 'Childhood apraxia of speech (CAS)', searchTerms: ['childhood apraxia of speech'] },
  { group: 'Speech sound & motor speech', value: 'dysarthria', label: 'Dysarthria', searchTerms: ['dysarthria'] },
  { group: 'Speech sound & motor speech', value: 'apraxia of speech', label: 'Acquired apraxia of speech', searchTerms: ['apraxia of speech'] },
  { group: 'Speech sound & motor speech', value: 'resonance', label: 'Resonance / cleft palate', searchTerms: ['cleft palate', 'velopharyngeal dysfunction'] },
  { group: 'Language & literacy', value: 'late language emergence', label: 'Late language emergence (late talkers)', searchTerms: ['late talkers', 'late language emergence'] },
  { group: 'Language & literacy', value: 'language', label: 'Spoken language (expressive/receptive)', searchTerms: ['language disorder'] },
  { group: 'Language & literacy', value: 'DLD', label: 'Developmental language disorder (DLD)', searchTerms: ['developmental language disorder'] },
  { group: 'Language & literacy', value: 'literacy', label: 'Written language / literacy', searchTerms: ['literacy'] },
  { group: 'Autism & social communication', value: 'autism', label: 'Autism', searchTerms: ['autism', 'autistic'] },
  { group: 'Autism & social communication', value: 'social communication', label: 'Social communication', searchTerms: ['social communication'] },
  { group: 'Autism & social communication', value: 'Down syndrome', label: 'Down syndrome', searchTerms: ['Down syndrome'] },
  { group: 'Autism & social communication', value: 'AAC', label: 'AAC (augmentative & alternative communication)', searchTerms: ['augmentative and alternative communication'] },
  { group: 'Autism & social communication', value: 'selective mutism', label: 'Selective mutism', searchTerms: ['selective mutism'] },
  { group: 'Fluency & voice', value: 'fluency', label: 'Stuttering', searchTerms: ['stuttering'] },
  { group: 'Fluency & voice', value: 'cluttering', label: 'Cluttering', searchTerms: ['cluttering'] },
  { group: 'Fluency & voice', value: 'voice', label: 'Voice', searchTerms: ['voice disorder'] },
  { group: 'Fluency & voice', value: 'gender-affirming voice', label: 'Gender-affirming voice & communication', searchTerms: ['gender-affirming voice', 'transgender voice'] },
  { group: 'Adult neurogenic & cognition', value: 'aphasia', label: 'Aphasia', searchTerms: ['aphasia'] },
  { group: 'Adult neurogenic & cognition', value: 'cognition', label: 'Cognitive-communication (TBI, dementia, RHD)', searchTerms: ['cognitive-communication'] },
  { group: 'Swallowing, feeding & hearing', value: 'dysphagia', label: 'Dysphagia (swallowing)', searchTerms: ['dysphagia'] },
  { group: 'Swallowing, feeding & hearing', value: 'pediatric feeding', label: 'Pediatric feeding disorder', searchTerms: ['pediatric feeding disorder'] },
  { group: 'Swallowing, feeding & hearing', value: 'hearing loss', label: 'Hearing loss / aural rehabilitation', searchTerms: ['hearing loss'] },
  { group: 'Other', value: 'other', label: 'Other (describe)', searchTerms: [] },
];

export const concernGroups: string[] = Array.from(new Set(concernOptions.map((o) => o.group)));

const findConcern = (value: Concern): ConcernOption | undefined => concernOptions.find((o) => o.value === value);

// Readable name for a stored concern; "other" shows what the student typed.
export const concernLabel = (value: Concern, otherText = ''): string => {
  if (value === 'other') return otherText.trim() || 'other';
  return findConcern(value)?.label ?? value;
};

export const concernSearchTerms = (value: Concern, otherText = ''): string[] => {
  if (value === 'other') return otherText.trim() ? [otherText.trim()] : [];
  return findConcern(value)?.searchTerms ?? [value];
};

export const constraintOptions: ConstraintKey[] = [
  'frequency/time',
  'attention',
  'caregiver support',
  'materials',
  'group vs individual',
  'other',
];

export const ageGroupFromAge = (age: number | ''): string => {
  if (age === '' || Number.isNaN(age)) return 'Not set';
  if (age <= 5) return 'preschool';
  if (age <= 12) return 'school-age';
  if (age <= 17) return 'adolescent';
  if (age <= 64) return 'adult';
  return 'older adult';
};

export const buildCaseSnapshotText = (state: WizardData): string => {
  const cs = state.caseSnapshot;
  const ageGroup = ageGroupFromAge(cs.age);
  const anchors = cs.assessmentAnchors
    .filter((a) => a.measure.trim() && a.finding.trim())
    .map((a) => `${a.measure}: ${a.finding}`)
    .join('; ');

  return [
    `In a ${cs.setting || 'clinical'} setting, this ${ageGroup} client presents with ${cs.concerns.map((c) => concernLabel(c, cs.otherConcern)).join(', ') || 'unspecified concern'}.`,
    `Primary participation issue: ${cs.functionalProblem || 'not provided'}.`,
    anchors ? `Assessment anchors include ${anchors}.` : '',
    `Initial target area is ${cs.initialTarget ? concernLabel(cs.initialTarget, cs.otherConcern) : 'not selected'}.`,
    cs.constraints.length ? `Constraints include ${cs.constraints.join(', ')}${cs.constraintNotes ? ` (${cs.constraintNotes})` : ''}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

export const phiPatternDetected = (value: string): boolean => {
  if (!value.trim()) return false;
  const dateLike = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const likelyName = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;
  return dateLike.test(value) || likelyName.test(value);
};

export const goalToText = (goal: GoalTemplate): string =>
  `${goal.behavior || '[behavior]'} ${goal.condition ? `under ${goal.condition}` : ''} ${goal.criterion ? `with ${goal.criterion}` : ''} ${goal.timeframe ? `within ${goal.timeframe}` : ''}`.replace(/\s+/g, ' ').trim();

export const getScoreTotal = (s: {
  populationMatch: number;
  interventionMatch: number;
  outcomeMatch: number;
  studyQuality: number;
  clinicalFeasibility: number;
  recencyFoundational: number;
}): number =>
  s.populationMatch + s.interventionMatch + s.outcomeMatch + s.studyQuality + s.clinicalFeasibility + s.recencyFoundational;

export const orderedArticles = (articles: CandidateArticle[], scores: WizardData['step4']['scores'], autoSort: boolean): CandidateArticle[] => {
  const withOrder = articles.map((article, idx) => {
    const score = scores[article.id];
    const total = score ? getScoreTotal(score) : 0;
    return {
      article,
      total,
      order: score?.manualOrder ?? idx,
    };
  });

  if (autoSort) {
    return withOrder.sort((a, b) => b.total - a.total).map((x) => x.article);
  }
  return withOrder.sort((a, b) => a.order - b.order).map((x) => x.article);
};
