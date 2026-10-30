// Step 5 evidence extraction: defaults, completion rules, and labels.

import type { EvidenceExtraction, MeasuredFinding, ResultDirection, WizardData } from './types';

export const blankExtraction = (articleId: string): EvidenceExtraction => ({
  articleId,
  citation: '',
  participants: '',
  interventionComponents: '',
  dosage: { sessionLength: '', frequency: '', duration: '', notes: '' },
  outcomeMeasures: '',
  results: { direction: '', generalization: '', maintenance: '', summary: '' },
  clinicalTakeaway: '',
  materialsSetup: '',
});

export const extractionFor = (state: WizardData, articleId: string): EvidenceExtraction =>
  state.step5.extractions[articleId] ?? blankExtraction(articleId);

const has = (v: string): boolean => v.trim().length > 0;

export const extractionComplete = (e: EvidenceExtraction): boolean =>
  has(e.citation) &&
  has(e.participants) &&
  has(e.interventionComponents) &&
  has(e.dosage.sessionLength) &&
  has(e.dosage.frequency) &&
  has(e.dosage.duration) &&
  has(e.outcomeMeasures) &&
  !!e.results.direction &&
  !!e.results.generalization &&
  !!e.results.maintenance &&
  has(e.results.summary) &&
  has(e.clinicalTakeaway);

export const directionLabels: Record<ResultDirection, string> = {
  improved: 'Improved',
  mixed: 'Mixed',
  'no-difference': 'No difference',
  worse: 'Worse',
};

export const findingLabels: Record<MeasuredFinding, string> = {
  yes: 'Yes',
  partly: 'Partly',
  no: 'No',
  'not-measured': 'Not measured',
};

export const dosageText = (e: EvidenceExtraction): string => {
  const d = e.dosage;
  const parts = [d.sessionLength && `${d.sessionLength} per session`, d.frequency, d.duration && `for ${d.duration}`].filter(Boolean);
  return [parts.join(', '), d.notes].filter(Boolean).join('; ');
};
