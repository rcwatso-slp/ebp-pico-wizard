import type { CandidateArticle, Concern, ConstraintKey, GoalTemplate, WizardData } from './types';

export const concernOptions: Concern[] = [
  'CAS',
  'phonology',
  'language',
  'fluency',
  'voice',
  'dysarthria',
  'aphasia',
  'cognition',
  'dysphagia',
  'AAC',
  'social communication',
  'other',
];

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
    `In a ${cs.setting || 'clinical'} setting, this ${ageGroup} client presents with ${cs.concerns.join(', ') || 'unspecified concern'}.`,
    `Primary participation issue: ${cs.functionalProblem || 'not provided'}.`,
    anchors ? `Assessment anchors include ${anchors}.` : '',
    `Initial target area is ${cs.initialTarget || 'not selected'}.`,
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
