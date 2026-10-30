// Step 4 critical appraisal content: study designs, levels of evidence, design-finder questions,
// and short quality checklists. Checklist items are plain-language adaptations of established
// appraisal tools, credited in `source`; they are teaching versions, not the full instruments.

import type { ArticleAppraisal, CandidateArticle, ChecklistAnswer, MatchRating, StudyDesign, WizardData } from './types';

export interface DesignInfo {
  key: StudyDesign;
  label: string;
  // Level in the treatment-efficacy hierarchy ASHA adapted from SIGN (Ia strongest to IV weakest).
  level: string;
  levelNote: string;
  checklist: ChecklistKey;
}

export const designs: DesignInfo[] = [
  {
    key: 'systematic-review',
    label: 'Systematic review or meta-analysis',
    level: 'Ia',
    levelNote: 'Highest level when it combines well-designed randomized trials; weaker if the studies it reviews are weak.',
    checklist: 'review',
  },
  {
    key: 'guideline',
    label: 'Clinical practice guideline',
    level: 'Guideline',
    levelNote: 'Recommendations built from a body of evidence. Its value depends on how it was developed.',
    checklist: 'guideline',
  },
  {
    key: 'rct',
    label: 'Randomized controlled trial',
    level: 'Ib',
    levelNote: 'Participants randomly assigned to treatment or comparison groups.',
    checklist: 'group',
  },
  {
    key: 'nonrandomized',
    label: 'Controlled study without randomization',
    level: 'IIa',
    levelNote: 'Treatment and comparison groups, but not randomly assigned.',
    checklist: 'group',
  },
  {
    key: 'single-case',
    label: 'Single-case experimental design',
    level: 'IIb',
    levelNote: 'Each participant is their own control across phases. Well-controlled single-case studies are key evidence for many SLP treatments.',
    checklist: 'single-case',
  },
  {
    key: 'pre-post',
    label: 'Pre–post group study (no control group)',
    level: 'IIb',
    levelNote: 'One group measured before and after treatment. Gains could be due to other factors, such as maturation.',
    checklist: 'group',
  },
  {
    key: 'case-report',
    label: 'Case study, case series, or descriptive study',
    level: 'III',
    levelNote: 'Describes what happened without experimental control.',
    checklist: 'descriptive',
  },
  {
    key: 'qualitative',
    label: 'Qualitative study',
    level: 'Qualitative',
    levelNote: 'Explores experiences and views. Not ranked for treatment effectiveness, but valuable for client and family perspectives.',
    checklist: 'qualitative',
  },
  {
    key: 'expert-opinion',
    label: 'Expert opinion, narrative review, or tutorial',
    level: 'IV',
    levelNote: 'Based on experience or a non-systematic summary of research.',
    checklist: 'expert',
  },
];

export const designInfo = (key: StudyDesign | ''): DesignInfo | undefined => designs.find((d) => d.key === key);

// "Help me identify the design": yes/no questions that end at a design.
export interface DesignQuestion {
  id: string;
  question: string;
  hint: string;
  yes: string;
  no: string;
}

export const designQuestions: Record<string, DesignQuestion> = {
  start: {
    id: 'start',
    question: 'Does the article pull together findings from many other studies?',
    hint: 'Look at the title and abstract for words like “review,” “meta-analysis,” or “guideline.”',
    yes: 'systematic',
    no: 'data',
  },
  systematic: {
    id: 'systematic',
    question: 'Did the authors describe a systematic search, with stated rules for which studies to include?',
    hint: 'Check the Methods for databases searched and inclusion criteria.',
    yes: 'panel',
    no: 'design:expert-opinion',
  },
  panel: {
    id: 'panel',
    question: 'Does it make practice recommendations from an expert panel?',
    hint: 'Clinical practice guidelines say so in the title or abstract and list graded recommendations.',
    yes: 'design:guideline',
    no: 'design:systematic-review',
  },
  data: {
    id: 'data',
    question: 'Did the researchers collect data from participants themselves?',
    hint: 'If it explains or recommends an approach without collecting data, the answer is no.',
    yes: 'views',
    no: 'design:expert-opinion',
  },
  views: {
    id: 'views',
    question: 'Are the main findings people’s experiences or views, from interviews or focus groups?',
    hint: 'Qualitative studies report themes and quotes rather than scores.',
    yes: 'design:qualitative',
    no: 'groups',
  },
  groups: {
    id: 'groups',
    question: 'Was a treatment group compared with a separate control or comparison group?',
    hint: 'Look for two or more groups in the Methods.',
    yes: 'random',
    no: 'phases',
  },
  random: {
    id: 'random',
    question: 'Were participants randomly assigned to the groups?',
    hint: 'Look for “randomized,” “random allocation,” or “randomly assigned.”',
    yes: 'design:rct',
    no: 'design:nonrandomized',
  },
  phases: {
    id: 'phases',
    question: 'Was each participant measured repeatedly through baseline and treatment phases?',
    hint: 'For example, multiple baseline, ABAB, or alternating treatments designs. Look for graphs of each participant over sessions.',
    yes: 'design:single-case',
    no: 'prepost',
  },
  prepost: {
    id: 'prepost',
    question: 'Was a group of participants measured before and after treatment?',
    hint: 'Look for pre-test and post-test scores for the whole group.',
    yes: 'design:pre-post',
    no: 'design:case-report',
  },
};

// PubMed and Europe PMC publication types hint at the design; students confirm it.
export const suggestDesign = (article: CandidateArticle): { design: StudyDesign; note: string } | null => {
  const tags = (article.studyTypes ?? []).map((t) => t.toLowerCase());
  if (tags.includes('practice guideline') || tags.includes('guideline')) return { design: 'guideline', note: 'Tagged as a guideline.' };
  if (tags.includes('meta-analysis') || tags.includes('systematic review'))
    return { design: 'systematic-review', note: 'Tagged as a systematic review or meta-analysis.' };
  if (tags.includes('randomized controlled trial')) return { design: 'rct', note: 'Tagged as a randomized controlled trial.' };
  if (tags.includes('case reports')) return { design: 'case-report', note: 'Tagged as a case report.' };
  if (tags.includes('review'))
    return {
      design: 'expert-opinion',
      note: 'Tagged “Review” without “Systematic Review,” which usually means a narrative review.',
    };
  return null;
};

export type ChecklistKey = 'group' | 'single-case' | 'review' | 'guideline' | 'descriptive' | 'qualitative' | 'expert';

export interface ChecklistItem {
  id: string;
  question: string;
  where: string;
  // Only asked for these designs; omitted means every design using the checklist.
  appliesTo?: StudyDesign[];
}

export interface Checklist {
  title: string;
  source: string;
  items: ChecklistItem[];
}

const treatmentDescribed: ChecklistItem = {
  id: 'treatment-described',
  question: 'Is the treatment described in enough detail to replicate (procedures, materials, session length, frequency)?',
  where: 'Methods: Procedures or Intervention',
};

export const checklists: Record<ChecklistKey, Checklist> = {
  group: {
    title: 'Group study checklist',
    source: 'Adapted from the PEDro-P scale and CASP checklists',
    items: [
      { id: 'eligibility', question: 'Were the criteria for who could participate clearly stated?', where: 'Methods: Participants' },
      {
        id: 'random',
        question: 'Were participants randomly assigned to groups?',
        where: 'Methods: look for “randomized” or “randomly assigned”',
        appliesTo: ['rct', 'nonrandomized'],
      },
      {
        id: 'concealed',
        question: 'Was assignment concealed, so the people enrolling participants could not predict which group came next?',
        where: 'Methods: Randomization or Allocation',
        appliesTo: ['rct'],
      },
      {
        id: 'similar',
        question: 'Were the groups similar at the start on key measures such as age and severity?',
        where: 'Results: usually the first table',
        appliesTo: ['rct', 'nonrandomized'],
      },
      {
        id: 'blind-assessor',
        question: 'Were the people measuring outcomes unaware (blind) of which group or time point they were scoring?',
        where: 'Methods: Outcome measures or Procedures',
      },
      {
        id: 'retention',
        question: 'Were outcomes measured for at least 85% of the participants who started?',
        where: 'Results: participant flow diagram or attrition',
      },
      {
        id: 'itt',
        question: 'Were participants analyzed in the group they were assigned to, even if they did not finish treatment?',
        where: 'Methods: Analysis; look for “intention to treat”',
        appliesTo: ['rct', 'nonrandomized'],
      },
      {
        id: 'between-groups',
        question: 'Did the study statistically compare the groups’ results, not just each group before and after?',
        where: 'Results',
        appliesTo: ['rct', 'nonrandomized'],
      },
      {
        id: 'variability',
        question: 'Does it report results with a measure of spread or size of effect (standard deviation, confidence interval, or effect size)?',
        where: 'Results: tables',
      },
      treatmentDescribed,
    ],
  },
  'single-case': {
    title: 'Single-case design checklist',
    source: 'Adapted from the RoBiNT scale (Tate et al., 2013)',
    items: [
      {
        id: 'demonstrations',
        question: 'Does the design allow at least three demonstrations of the treatment effect (such as three staggered baselines, or ABAB)?',
        where: 'Methods: Design; graphs',
      },
      { id: 'baseline-points', question: 'Were there at least three data points in each baseline and treatment phase?', where: 'Graphs' },
      {
        id: 'stable-baseline',
        question: 'Was performance stable, or not already improving, before treatment started?',
        where: 'Graphs: baseline phase',
      },
      {
        id: 'blind-assessor',
        question: 'Were outcomes scored by someone unaware (blind) of the phase or session?',
        where: 'Methods: Measurement',
      },
      { id: 'reliability', question: 'Was agreement between scorers (inter-rater reliability) reported?', where: 'Methods or Results: Reliability' },
      { id: 'fidelity', question: 'Did they check that treatment was delivered as planned (treatment fidelity)?', where: 'Methods: Fidelity' },
      {
        id: 'generalization',
        question: 'Were generalization or maintenance probes measured?',
        where: 'Results: probes or follow-up',
      },
      treatmentDescribed,
    ],
  },
  review: {
    title: 'Systematic review checklist',
    source: 'Adapted from AMSTAR 2 and the CASP systematic review checklist',
    items: [
      { id: 'question', question: 'Does the review ask a clearly focused question (population, intervention, outcome)?', where: 'Introduction or Methods' },
      { id: 'search', question: 'Was the search thorough: several databases, with search terms reported?', where: 'Methods: Search strategy' },
      {
        id: 'selection',
        question: 'Were the rules for including studies stated, with studies selected by two reviewers?',
        where: 'Methods: Study selection',
      },
      {
        id: 'risk-of-bias',
        question: 'Did the authors rate the quality or risk of bias of each included study?',
        where: 'Methods and Results: quality table',
      },
      { id: 'listed', question: 'Are the included studies listed with their key details?', where: 'Results: summary table' },
      {
        id: 'combined',
        question: 'If results were combined, did the authors check whether studies differed too much to combine (heterogeneity)?',
        where: 'Results: meta-analysis. Answer yes if results were not combined.',
      },
      {
        id: 'conclusions',
        question: 'Do the conclusions take the quality of the included studies into account?',
        where: 'Discussion',
      },
    ],
  },
  guideline: {
    title: 'Clinical guideline checklist',
    source: 'Adapted from the AGREE II instrument',
    items: [
      { id: 'scope', question: 'Are the guideline’s purpose and target population clearly described?', where: 'Introduction or Scope' },
      {
        id: 'panel',
        question: 'Did the panel include relevant professionals and client or family perspectives?',
        where: 'Methods: Panel or Development group',
      },
      { id: 'search', question: 'Was the evidence found with a systematic search?', where: 'Methods' },
      { id: 'linked', question: 'Is each recommendation clearly linked to the evidence behind it?', where: 'Recommendations' },
      { id: 'external', question: 'Was it reviewed by outside experts before publication?', where: 'Methods' },
      { id: 'current', question: 'Was it published or updated in about the last five years?', where: 'Publication date or update statement' },
    ],
  },
  descriptive: {
    title: 'Case study checklist',
    source: 'Adapted from the JBI case report checklist',
    items: [
      { id: 'participant', question: 'Are the participant’s characteristics clearly described?', where: 'Methods: Participant' },
      treatmentDescribed,
      { id: 'measures', question: 'Were outcomes measured with clear, objective measures?', where: 'Methods: Measures' },
      { id: 'before-after', question: 'Were results reported both before and after treatment?', where: 'Results' },
      {
        id: 'limitations',
        question: 'Do the authors acknowledge limitations and avoid overstating their conclusions?',
        where: 'Discussion',
      },
    ],
  },
  qualitative: {
    title: 'Qualitative study checklist',
    source: 'Adapted from the CASP qualitative checklist',
    items: [
      { id: 'appropriate', question: 'Is a qualitative approach right for the question being asked?', where: 'Introduction' },
      { id: 'recruitment', question: 'Is the way participants were recruited explained and appropriate?', where: 'Methods: Participants' },
      { id: 'collection', question: 'Are the data collection methods (interviews, focus groups) clearly described?', where: 'Methods' },
      { id: 'analysis', question: 'Was the analysis rigorous, with steps described or more than one coder?', where: 'Methods: Analysis' },
      { id: 'findings', question: 'Are the findings clearly stated and supported with participants’ own words?', where: 'Results' },
    ],
  },
  expert: {
    title: 'Expert opinion checklist',
    source: 'Adapted from the JBI checklist for text and opinion',
    items: [
      { id: 'credible', question: 'Are the authors recognized experts on this topic?', where: 'Author information' },
      { id: 'focused', question: 'Does it focus on the population and intervention in your question?', where: 'Throughout' },
      { id: 'referenced', question: 'Does it cite supporting research, not just experience?', where: 'References' },
      { id: 'balanced', question: 'Does it acknowledge other views or limitations?', where: 'Discussion' },
    ],
  },
};

export const checklistFor = (design: StudyDesign | ''): ChecklistItem[] => {
  const info = designInfo(design);
  if (!info) return [];
  return checklists[info.checklist].items.filter((item) => !item.appliesTo || item.appliesTo.includes(design as StudyDesign));
};

export type QualityRating = 'Strong' | 'Moderate' | 'Weak';

// Share of "yes" answers; "unclear" counts against the study because unreported methods are a weakness.
export const qualitySummary = (appraisal: ArticleAppraisal): { yes: number; total: number; answered: number; rating: QualityRating | null } => {
  const items = checklistFor(appraisal.design);
  const answers = items.map((i) => appraisal.quality[i.id]);
  const answered = answers.filter(Boolean).length;
  const yes = answers.filter((a) => a === 'yes').length;
  if (!items.length || answered < items.length) return { yes, total: items.length, answered, rating: null };
  const share = yes / items.length;
  return { yes, total: items.length, answered, rating: share >= 0.75 ? 'Strong' : share >= 0.5 ? 'Moderate' : 'Weak' };
};

export const blankAppraisal = (articleId: string): ArticleAppraisal => ({
  articleId,
  relevance: { population: '', intervention: '', outcome: '' },
  setAside: false,
  setAsideReason: '',
  design: '',
  quality: {},
  applicability: { setting: '', dosage: '', priorities: '' },
  includeTop: false,
  topReason: '',
});

export const appraisalFor = (state: WizardData, articleId: string): ArticleAppraisal =>
  state.step4.appraisals[articleId] ?? blankAppraisal(articleId);

const rated = (values: MatchRating[]): boolean => values.every(Boolean);

export const relevanceDone = (a: ArticleAppraisal): boolean => rated([a.relevance.population, a.relevance.intervention, a.relevance.outcome]);

export const appraisalComplete = (a: ArticleAppraisal): boolean =>
  relevanceDone(a) &&
  (a.setAside
    ? a.setAsideReason.trim().length > 0
    : !!a.design &&
      qualitySummary(a).rating !== null &&
      rated([a.applicability.setting, a.applicability.dosage, a.applicability.priorities]));

export const appraisalStatus = (a: ArticleAppraisal): 'not started' | 'in progress' | 'set aside' | 'appraised' => {
  if (a.setAside && appraisalComplete(a)) return 'set aside';
  if (appraisalComplete(a)) return 'appraised';
  const started = relevanceDone(a) || !!a.relevance.population || !!a.design;
  return started ? 'in progress' : 'not started';
};

// Saved articles with a title; these are what students appraise.
export const appraisableArticles = (state: WizardData): CandidateArticle[] =>
  state.step3.candidateArticles.filter((a) => a.title.trim());

export const topArticleIds = (state: WizardData): string[] =>
  appraisableArticles(state)
    .map((a) => a.id)
    .filter((id) => state.step4.appraisals[id]?.includeTop);

export const matchLabels: Record<Exclude<MatchRating, ''>, string> = { yes: 'Yes', partly: 'Partly', no: 'No' };
export const answerLabels: Record<ChecklistAnswer, string> = { yes: 'Yes', no: 'No', unclear: 'Unclear' };
