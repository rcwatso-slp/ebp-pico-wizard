// Search terms grouped by PICO concept, and the Boolean queries built from them.
// Step 2 collects the terms; Step 3 searches with the queries.

import type { SearchKeywords, WizardData } from './types';
import { buildCaseSnapshotText, concernSearchTerms } from './utils';

export const conceptKeys = ['population', 'intervention', 'outcome'] as const;
export type ConceptKey = (typeof conceptKeys)[number];

export const conceptLabels: Record<ConceptKey, { letter: string; name: string }> = {
  population: { letter: 'P', name: 'Population' },
  intervention: { letter: 'I', name: 'Intervention' },
  outcome: { letter: 'O', name: 'Outcome' },
};

export const MIN_TERMS_PER_CONCEPT = 3;

// Case-insensitive dedupe that keeps the first spelling seen.
export const uniqueTerms = (values: string[]): string[] => {
  const seen = new Set<string>();
  return values
    .map((v) => v.trim())
    .filter((v) => {
      const key = v.toLowerCase();
      if (!v || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const quoteTerm = (term: string): string => {
  const t = term.trim();
  if (!t) return '';
  if (/^".*"$/.test(t) || !/\s/.test(t)) return t;
  return `"${t.replace(/"/g, '')}"`;
};

// OR the synonyms inside one concept; parenthesize when there is more than one.
const orGroup = (terms: string[]): string => {
  const quoted = terms.map(quoteTerm).filter(Boolean);
  if (quoted.length <= 1) return quoted[0] ?? '';
  return `(${quoted.join(' OR ')})`;
};

const andGroups = (...groups: string[]): string => groups.filter(Boolean).join(' AND ');

export const buildQueries = (finalPico: string, keywords: SearchKeywords): WizardData['step3']['queries'] => {
  const p = orGroup(keywords.population);
  const i = orGroup(keywords.intervention);
  const o = orGroup(keywords.outcome);

  return {
    fullPico: finalPico || '[Add final PICO in Step 2]',
    keywordOnly: andGroups(p, i, o),
    interventionFocused: andGroups(i, p),
    outcomeFocused: andGroups(o, p),
  };
};

// Starting terms for each concept: the primary area's search terms (not the whole P phrase,
// which rarely appears word-for-word in articles), the intervention, and the outcome.
export const seedKeywordColumns = (state: WizardData): SearchKeywords => {
  const cs = state.caseSnapshot;
  const b = state.step2.builder;
  return {
    population: uniqueTerms(cs.primaryConcern ? concernSearchTerms(cs.primaryConcern, cs.otherConcern) : []),
    intervention: uniqueTerms([b.i]),
    outcome: uniqueTerms([b.o]),
  };
};

// Every change to the terms rebuilds the queries so Step 3 always searches with the current terms.
export const withKeywordColumns = (prev: WizardData, keywordColumns: SearchKeywords): WizardData => ({
  ...prev,
  step3: {
    ...prev.step3,
    keywordsEdited: true,
    keywordColumns,
    queries: buildQueries(prev.step2.finalPico, keywordColumns),
  },
});

export const splitTerms = (value: string): string[] =>
  value
    .split(/[,;\n]/)
    .map((v) => v.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean);

// Prompt for AI research assistants such as Elicit. Built live so it always matches the current terms.
export const buildElicitPrompt = (state: WizardData): string => {
  const { queries, keywordColumns } = state.step3;
  return [
    'I am a graduate student clinician in speech-language pathology looking for research evidence for a clinical question.',
    '',
    `Case (de-identified): ${buildCaseSnapshotText(state)}`,
    `PICO question: ${state.step2.finalPico || '[missing PICO question]'}`,
    '',
    'Search terms by concept:',
    `- Population: ${keywordColumns.population.join(', ') || 'none'}`,
    `- Intervention: ${keywordColumns.intervention.join(', ') || 'none'}`,
    `- Outcome: ${keywordColumns.outcome.join(', ') || 'none'}`,
    '',
    'Boolean searches I am using:',
    `- P + I + O: ${queries.keywordOnly}`,
    `- P + I: ${queries.interventionFocused}`,
    `- P + O: ${queries.outcomeFocused}`,
    '',
    'Please find peer-reviewed studies that best answer my PICO question. For each, give the citation, year, DOI or link, study design, and one or two sentences on how closely it matches my population, intervention, and outcome. Rank them from strongest to weakest match. Only include studies you can link to; do not invent citations.',
  ].join('\n');
};
