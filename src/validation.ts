import { conceptKeys, conceptLabels, MIN_TERMS_PER_CONCEPT } from './searchTerms';
import { appraisableArticles, appraisalComplete, appraisalFor, relevanceDone, topArticleIds } from './appraisal';
import type { WizardData } from './types';

const hasText = (v: string): boolean => v.trim().length > 0;

export const isStep0Complete = (s: WizardData): boolean => s.step0.noPhi && s.step0.verifySources;

const needsOtherText = (s: WizardData): boolean => {
  const cs = s.caseSnapshot;
  return (cs.primaryConcern === 'other' || cs.concerns.includes('other')) && !hasText(cs.otherConcern);
};

export const isStep1Complete = (s: WizardData): boolean => {
  const cs = s.caseSnapshot;
  return !!(
    cs.setting &&
    cs.age !== '' &&
    cs.primaryConcern &&
    !needsOtherText(s) &&
    hasText(cs.functionalProblem) &&
    hasText(cs.treatmentTarget)
  );
};

const questionChecked = (s: WizardData): boolean => Object.values(s.step2.questionChecks).every(Boolean);

export const isStep2Complete = (s: WizardData): boolean =>
  hasText(s.step2.finalPico) &&
  questionChecked(s) &&
  conceptKeys.every((k) => s.step3.keywordColumns[k].length >= MIN_TERMS_PER_CONCEPT);

export const isStep3Complete = (s: WizardData): boolean => s.step3.candidateArticles.filter((a) => hasText(a.title)).length >= 2;

// Every saved article gets a relevance screen; the top 2-5 need a full appraisal and a reason.
export const isStep4Complete = (s: WizardData): boolean => {
  const top = topArticleIds(s);
  return (
    appraisableArticles(s).every((a) => relevanceDone(appraisalFor(s, a.id))) &&
    top.length >= 2 &&
    top.length <= 5 &&
    top.every((id) => {
      const a = appraisalFor(s, id);
      return appraisalComplete(a) && !a.setAside && hasText(a.topReason);
    })
  );
};

export const isStep5Complete = (s: WizardData): boolean => {
  const selectedIds = topArticleIds(s);

  const completed = selectedIds.filter((id) => {
    const e = s.step5.extractions[id];
    return !!(
      e &&
      hasText(e.citation) &&
      hasText(e.participants) &&
      hasText(e.interventionComponents) &&
      hasText(e.dosage) &&
      hasText(e.outcomeMeasures) &&
      hasText(e.resultsSummary) &&
      hasText(e.clinicalTakeaway)
    );
  }).length;

  return completed >= 2;
};

export const isStep6Complete = (s: WizardData): boolean => {
  const ltg = s.step6.longTermGoal;
  const validLtg = hasText(ltg.behavior) && hasText(ltg.condition) && hasText(ltg.criterion) && hasText(ltg.timeframe);
  const validObj = s.step6.shortTermObjectives.filter(
    (o) => hasText(o.behavior) && hasText(o.condition) && hasText(o.criterion) && hasText(o.timeframe),
  ).length;

  const m = s.step6.methodology;
  const p = s.step6.progressMonitoring;

  return !!(
    validLtg &&
    validObj >= 2 &&
    hasText(m.sessionStructure) &&
    hasText(m.cueingHierarchy) &&
    hasText(m.feedbackTypeFrequency) &&
    hasText(m.materialsList) &&
    hasText(p.probeSchedule) &&
    hasText(p.metric) &&
    hasText(p.masteryCriteria) &&
    s.step6.rationaleArticleIds.length >= 2 &&
    s.step6.rationaleArticleIds.length <= 3
  );
};

export const completionByStep = (s: WizardData): boolean[] => [
  isStep0Complete(s),
  isStep1Complete(s),
  isStep2Complete(s),
  isStep3Complete(s),
  isStep4Complete(s),
  isStep5Complete(s),
  isStep6Complete(s),
];

export const getMaxUnlockedStep = (s: WizardData): number => {
  const c = completionByStep(s);
  let max = 0;
  for (let i = 0; i < c.length - 1; i += 1) {
    if (c[i]) max = i + 1;
    else break;
  }
  return max;
};

// Plain-language list of what still blocks "Next" on a step, shown under the nav buttons.
export const missingRequirements = (s: WizardData, step: number): string[] => {
  const missing: string[] = [];
  if (step === 0) {
    if (!s.step0.noPhi) missing.push('Confirm you will not enter PHI');
    if (!s.step0.verifySources) missing.push('Confirm you will verify sources');
  } else if (step === 1) {
    const cs = s.caseSnapshot;
    if (cs.age === '') missing.push('Age');
    if (!cs.setting) missing.push('Setting');
    if (!cs.primaryConcern) missing.push('Primary disorder area');
    if (needsOtherText(s)) missing.push('Describe the "Other" area');
    if (!hasText(cs.functionalProblem)) missing.push('Functional problem');
    if (!hasText(cs.treatmentTarget)) missing.push('Treatment target');
  } else if (step === 2) {
    if (!hasText(s.step2.finalPico)) missing.push('Your PICO question');
    if (!questionChecked(s)) missing.push('Confirm the question checks');
    conceptKeys.forEach((k) => {
      const short = MIN_TERMS_PER_CONCEPT - s.step3.keywordColumns[k].length;
      if (short > 0) missing.push(`${short} more ${conceptLabels[k].name.toLowerCase()} term${short === 1 ? '' : 's'}`);
    });
  } else if (step === 3) {
    const titled = s.step3.candidateArticles.filter((a) => hasText(a.title)).length;
    if (titled < 2) missing.push(`${2 - titled} more candidate article title(s)`);
  } else if (step === 4) {
    const unscreened = appraisableArticles(s).filter((a) => !relevanceDone(appraisalFor(s, a.id))).length;
    if (unscreened) missing.push(`Check relevance for ${unscreened} more article${unscreened === 1 ? '' : 's'}`);
    const top = topArticleIds(s);
    if (top.length < 2) missing.push(`Choose ${2 - top.length} more top article${2 - top.length === 1 ? '' : 's'}`);
    if (top.length > 5) missing.push('Choose no more than 5 top articles');
    if (top.some((id) => !appraisalComplete(appraisalFor(s, id)))) missing.push('Finish the appraisal for each top article');
    if (top.some((id) => !hasText(appraisalFor(s, id).topReason))) missing.push('Give a reason for each top article');
  } else if (step === 5 && !isStep5Complete(s)) {
    missing.push('Complete all required fields for at least 2 top articles');
  } else if (step === 6) {
    const done = (g: { behavior: string; condition: string; criterion: string; timeframe: string }): boolean =>
      hasText(g.behavior) && hasText(g.condition) && hasText(g.criterion) && hasText(g.timeframe);
    const m = s.step6.methodology;
    const p = s.step6.progressMonitoring;
    const objectives = s.step6.shortTermObjectives.filter(done).length;
    const rationale = s.step6.rationaleArticleIds.length;
    if (!done(s.step6.longTermGoal)) missing.push('Long-term goal (all 4 parts)');
    if (objectives < 2) missing.push(`${2 - objectives} more complete objective(s)`);
    if (![m.sessionStructure, m.cueingHierarchy, m.feedbackTypeFrequency, m.materialsList].every(hasText)) missing.push('Methodology');
    if (![p.probeSchedule, p.metric, p.masteryCriteria].every(hasText)) missing.push('Progress monitoring');
    if (rationale < 2 || rationale > 3) missing.push('2\u20133 rationale sources');
  }
  return missing;
};
