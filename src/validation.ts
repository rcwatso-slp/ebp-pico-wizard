import type { WizardData } from './types';

const hasText = (v: string): boolean => v.trim().length > 0;

export const isStep0Complete = (s: WizardData): boolean => s.step0.noPhi && s.step0.verifySources;

export const isStep1Complete = (s: WizardData): boolean => {
  const cs = s.caseSnapshot;
  return !!(
    cs.setting &&
    cs.age !== '' &&
    cs.concerns.length > 0 &&
    hasText(cs.functionalProblem) &&
    cs.initialTarget &&
    cs.constraints.length > 0
  );
};

export const isStep2Complete = (s: WizardData): boolean => s.step2.picoLocked && hasText(s.step2.finalPico) && s.step2.keywords.length >= 10;

export const isStep3Complete = (s: WizardData): boolean => s.step3.candidateArticles.filter((a) => hasText(a.title)).length >= 2;

export const isStep4Complete = (s: WizardData): boolean => {
  const selected = Object.values(s.step4.scores).filter((v) => v.includeTop).length;
  return selected >= 2 && selected <= 5;
};

export const isStep5Complete = (s: WizardData): boolean => {
  const selectedIds = Object.values(s.step4.scores)
    .filter((v) => v.includeTop)
    .map((v) => v.articleId);

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
