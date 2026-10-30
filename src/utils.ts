import type { CaseSnapshot, Concern, ConstraintKey, GoalTemplate, Severity, WizardData } from './types';

export interface ConcernOption {
  value: Concern;
  label: string;
  group: string;
  // Terms used when building Step 3 search queries.
  searchTerms: string[];
  // How the area reads in a PICO population, e.g. "children with autism".
  phrase: string;
}

export const concernOptions: ConcernOption[] = [
  { group: 'Speech sound & motor speech', value: 'phonology', label: 'Speech sound disorder (articulation/phonology)', searchTerms: ['speech sound disorder'], phrase: 'with speech sound disorders' },
  { group: 'Speech sound & motor speech', value: 'CAS', label: 'Childhood apraxia of speech (CAS)', searchTerms: ['childhood apraxia of speech'], phrase: 'with childhood apraxia of speech' },
  { group: 'Speech sound & motor speech', value: 'dysarthria', label: 'Dysarthria', searchTerms: ['dysarthria'], phrase: 'with dysarthria' },
  { group: 'Speech sound & motor speech', value: 'apraxia of speech', label: 'Acquired apraxia of speech', searchTerms: ['apraxia of speech'], phrase: 'with acquired apraxia of speech' },
  { group: 'Speech sound & motor speech', value: 'resonance', label: 'Resonance / cleft palate', searchTerms: ['cleft palate', 'velopharyngeal dysfunction'], phrase: 'with cleft palate' },
  { group: 'Language & literacy', value: 'late language emergence', label: 'Late language emergence (late talkers)', searchTerms: ['late talkers', 'late language emergence'], phrase: 'with late language emergence' },
  { group: 'Language & literacy', value: 'language', label: 'Spoken language (expressive/receptive)', searchTerms: ['language disorder'], phrase: 'with language disorders' },
  { group: 'Language & literacy', value: 'DLD', label: 'Developmental language disorder (DLD)', searchTerms: ['developmental language disorder'], phrase: 'with developmental language disorder' },
  { group: 'Language & literacy', value: 'literacy', label: 'Written language / literacy', searchTerms: ['literacy'], phrase: 'with literacy difficulties' },
  { group: 'Autism & social communication', value: 'autism', label: 'Autism', searchTerms: ['autism', 'autistic'], phrase: 'with autism' },
  { group: 'Autism & social communication', value: 'social communication', label: 'Social communication', searchTerms: ['social communication'], phrase: 'with social communication difficulties' },
  { group: 'Autism & social communication', value: 'Down syndrome', label: 'Down syndrome', searchTerms: ['Down syndrome'], phrase: 'with Down syndrome' },
  { group: 'Autism & social communication', value: 'AAC', label: 'AAC (augmentative & alternative communication)', searchTerms: ['augmentative and alternative communication'], phrase: 'who use AAC' },
  { group: 'Autism & social communication', value: 'selective mutism', label: 'Selective mutism', searchTerms: ['selective mutism'], phrase: 'with selective mutism' },
  { group: 'Fluency & voice', value: 'fluency', label: 'Stuttering', searchTerms: ['stuttering'], phrase: 'who stutter' },
  { group: 'Fluency & voice', value: 'cluttering', label: 'Cluttering', searchTerms: ['cluttering'], phrase: 'who clutter' },
  { group: 'Fluency & voice', value: 'voice', label: 'Voice', searchTerms: ['voice disorder'], phrase: 'with voice disorders' },
  { group: 'Fluency & voice', value: 'gender-affirming voice', label: 'Gender-affirming voice & communication', searchTerms: ['gender-affirming voice', 'transgender voice'], phrase: 'seeking gender-affirming voice services' },
  { group: 'Adult neurogenic & cognition', value: 'aphasia', label: 'Aphasia', searchTerms: ['aphasia'], phrase: 'with aphasia' },
  { group: 'Adult neurogenic & cognition', value: 'cognition', label: 'Cognitive-communication (TBI, dementia, RHD)', searchTerms: ['cognitive-communication'], phrase: 'with cognitive-communication disorders' },
  { group: 'Swallowing, feeding & hearing', value: 'dysphagia', label: 'Dysphagia (swallowing)', searchTerms: ['dysphagia'], phrase: 'with dysphagia' },
  { group: 'Swallowing, feeding & hearing', value: 'pediatric feeding', label: 'Pediatric feeding disorder', searchTerms: ['pediatric feeding disorder'], phrase: 'with pediatric feeding disorder' },
  { group: 'Swallowing, feeding & hearing', value: 'hearing loss', label: 'Hearing loss / aural rehabilitation', searchTerms: ['hearing loss'], phrase: 'with hearing loss' },
  { group: 'Other', value: 'other', label: 'Other (describe)', searchTerms: [], phrase: '' },
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

export const severityOptions: Severity[] = ['mild', 'moderate', 'severe', 'profound', 'not yet determined'];

const ageGroupNoun: Record<string, string> = {
  preschool: 'preschool children',
  'school-age': 'school-age children',
  adolescent: 'adolescents',
  adult: 'adults',
  'older adult': 'older adults',
};

// Draft PICO population from Step 1, e.g. "school-age children with severe autism".
export const suggestedPopulation = (cs: CaseSnapshot): string => {
  if (!cs.primaryConcern) return '';
  const who = ageGroupNoun[ageGroupFromAge(cs.age)] ?? 'clients';
  const option = concernOptions.find((o) => o.value === cs.primaryConcern);
  const phrase = cs.primaryConcern === 'other' ? (cs.otherConcern.trim() ? `with ${cs.otherConcern.trim()}` : '') : option?.phrase ?? '';
  const severity = cs.severity && cs.severity !== 'not yet determined' ? cs.severity : '';
  const withSeverity = severity && phrase.startsWith('with ') ? phrase.replace(/^with /, `with ${severity} `) : phrase;
  return `${who} ${withSeverity}`.trim();
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
  const primary = cs.primaryConcern ? concernLabel(cs.primaryConcern, cs.otherConcern) : 'an unspecified area';
  const others = cs.concerns.map((c) => concernLabel(c, cs.otherConcern));
  const anchors = cs.assessmentAnchors
    .filter((a) => a.measure.trim() && a.finding.trim())
    .map((a) => `${a.measure}: ${a.finding}`)
    .join('; ');

  return [
    `In a ${cs.setting || 'clinical'} setting, this ${ageGroup} client's primary area of need is ${primary}${
      cs.severity && cs.severity !== 'not yet determined' ? ` (${cs.severity})` : ''
    }${others.length ? `, with co-occurring ${others.join(', ')}` : ''}.`,
    `Functional problem: ${cs.functionalProblem || 'not provided'}.`,
    `Treatment target: ${cs.treatmentTarget || 'not provided'}.`,
    anchors ? `Assessment results: ${anchors}.` : '',
    cs.constraints.length || cs.constraintNotes ? `Treatment considerations: ${[cs.constraints.join(', '), cs.constraintNotes].filter(Boolean).join('; ')}.` : '',
    cs.clientPriorities ? `Client/family priorities: ${cs.clientPriorities}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\.\./g, '.');
};

export const phiPatternDetected = (value: string): boolean => {
  if (!value.trim()) return false;
  const dateLike = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const likelyName = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;
  return dateLike.test(value) || likelyName.test(value);
};

export const goalToText = (goal: GoalTemplate): string =>
  `${goal.behavior || '[behavior]'} ${goal.condition ? `under ${goal.condition}` : ''} ${goal.criterion ? `with ${goal.criterion}` : ''} ${goal.timeframe ? `within ${goal.timeframe}` : ''}`.replace(/\s+/g, ' ').trim();

