// Step-by-step teaching content shown in the guide panel beside each wizard step.
// Examples are hypothetical and written for illustration only.

export interface GuideExample {
  label: string;
  weak: string;
  strong: string;
  why: string;
}

export interface RubricRow {
  criterion: string;
  levels: [string, string, string];
}

export interface StepGuideContent {
  title: string;
  why: string;
  steps: string[];
  examples: GuideExample[];
  rubric?: RubricRow[];
  pitfalls: string[];
  selfCheck: string[];
}

export const stepGuides: StepGuideContent[] = [
  {
    title: 'Getting started with EBP',
    why:
      'Evidence-based practice integrates three sources: the best available research evidence, your clinical expertise, and the client’s and family’s values and preferences. This wizard walks you from a real client need to a written plan you can defend with evidence.',
    steps: [
      'Case: describe the client’s functional need (de-identified).',
      'PICO: turn that need into a focused, searchable question.',
      'Search: plan keywords and run your search in Elicit and other databases.',
      'Screen: score each article for fit and quality, then pick your top studies.',
      'Extract: pull out what the studies actually did and found.',
      'Plan: write goals and methods that are tied to that evidence.',
    ],
    examples: [],
    pitfalls: [
      'Entering anything that could identify a client: names, birth dates, school or facility names, exact session dates, record numbers.',
      'Trusting an AI summary without opening the article. Tools like Elicit and ChatGPT can misstate findings or invent citations.',
    ],
    selfCheck: [
      'I know where my client’s de-identified case information is.',
      'I will open and read every article I cite.',
    ],
  },
  {
    title: 'Describing the case',
    why:
      'Finding relevant evidence starts with knowing exactly who your client is and what needs to change. Each part of this step feeds your PICO question: who the client is becomes the Population (P), the treatment target becomes the Outcome (O), and the constraints and priorities help you judge which Interventions (I) you could actually use.',
    steps: [
      'Who is the client? Enter age, setting, the primary disorder area, and severity if known. Add co-occurring areas only if they affect treatment.',
      'What needs to change? Describe the functional problem in daily life, then name one specific, observable treatment target.',
      'Assessment results: if testing is done, add the measures and key findings. They confirm the need and become baselines for your goals.',
      'What will shape treatment? Note constraints (time, attention, caregiver support) and what the client and family care about most.',
      'Check the P draft and O draft. You\u2019ll refine them into a full question in Step 2.',
    ],
    examples: [
      {
        label: 'Primary area vs. treatment target',
        weak: 'Primary area: autism. Target: communication.',
        strong: 'Primary area: autism. Target: spontaneous requesting for help and preferred items.',
        why: 'A disorder area tells you who to search for; the treatment target tells you which outcome the studies must have measured. \u201cCommunication\u201d is too broad to search.',
      },
      {
        label: 'Functional problem',
        weak: 'Has articulation problems.',
        strong:
          'Unfamiliar listeners understand about half of what the client says, so the client avoids talking during group activities at preschool.',
        why: 'The strong version names an observable problem, how big it is, and how it affects participation.',
      },
      {
        label: 'Assessment result',
        weak: 'Testing showed delays.',
        strong: 'Language sample: 2 spontaneous requests in 20 minutes of play; most requests were prompted.',
        why: 'Specific results support the target and give you a baseline to measure progress against.',
      },
    ],
    pitfalls: [
      'Using the disorder as the target (\u201cimprove autism\u201d) instead of a skill or behavior that therapy can change.',
      'Choosing a target too broad to search, such as \u201clanguage\u201d or \u201ccommunication.\u201d',
      'Selecting several co-occurring areas and losing focus. The primary area is what you search for.',
      'Skipping client and family priorities. Client values are one of the three parts of EBP.',
      'Including identifying details (names, school names, exact dates).',
    ],
    selfCheck: [
      'Could I find studies on my population draft (P) in a database?',
      'Is my treatment target something I could count or observe in a session?',
      'Does my target connect to the functional problem and the assessment results?',
      'Is every detail de-identified?',
    ],
  },
  {
    title: 'Building a PICO question',
    why:
      'PICO (Population, Intervention, Comparison, Outcome) turns a broad clinical worry into a question the literature can answer. A focused PICO also gives you the exact concepts to search for in Step 3.',
    steps: [
      'P: describe the population by age range, diagnosis, and severity if relevant.',
      'I: name a specific intervention approach, not just “therapy.”',
      'C (optional): name an alternative, such as another approach or no treatment.',
      'O: name an outcome you can measure and that matters for this client.',
      'Create candidates, rate them, then lock the one that is both feasible and searchable.',
      'Add at least 10 keywords: synonyms, abbreviations, and alternate spellings.',
    ],
    examples: [
      {
        label: 'PICO question',
        weak: 'Does therapy help kids with speech problems?',
        strong:
          'For preschool children with childhood apraxia of speech, does Dynamic Temporal and Tactile Cueing, compared with traditional articulation therapy, improve speech accuracy on untreated words?',
        why: 'The strong version has a clear population, a named intervention, a comparison, and a measurable outcome.',
      },
      {
        label: 'Keywords for one concept',
        weak: 'apraxia',
        strong: 'childhood apraxia of speech, CAS, developmental apraxia of speech, DAS, developmental verbal dyspraxia, motor speech disorder',
        why: 'Researchers use different terms for the same thing. Synonyms and abbreviations keep you from missing studies.',
      },
    ],
    pitfalls: [
      'An outcome that cannot be measured (“better communication”).',
      'A population so narrow no study will match it, or so broad that results don’t apply.',
      'An intervention that isn’t realistic in your setting.',
      'Keywords that are all one word repeated in different forms.',
    ],
    selfCheck: [
      'Can I point to each of P, I, and O in my final question?',
      'Would I know how to measure my outcome in a session?',
      'Do my keywords include synonyms for P, I, and O separately?',
    ],
  },
  {
    title: 'Planning your search',
    why:
      'A planned search is reproducible and less likely to miss key studies. Grouping keywords by concept lets you build Boolean queries, and recording what you searched lets you (and your supervisor) see how you found your evidence.',
    steps: [
      'Sort your keywords into population, intervention, and outcome columns.',
      'Use OR between synonyms in the same column, and AND between columns.',
      'Search PubMed or Europe PMC right here, and read the abstract before adding an article.',
      'Use the study design tags (systematic review, randomized controlled trial) to spot stronger evidence early.',
      'Optionally run the Elicit prompt, and check ASHA Evidence Maps or speechBITE.',
      'Record at least 2 candidate articles with title, year, and link.',
    ],
    examples: [
      {
        label: 'Boolean query',
        weak: 'apraxia therapy children',
        strong:
          '("childhood apraxia of speech" OR CAS OR "developmental apraxia of speech") AND ("integral stimulation" OR "dynamic temporal and tactile cueing" OR DTTC)',
        why: 'OR widens each concept to include synonyms; AND requires every concept to appear. Quotation marks keep phrases together.',
      },
    ],
    pitfalls: [
      'Too many results: add a concept with AND, or use more specific terms.',
      'Too few results: drop the comparison, broaden the outcome, or add synonyms with OR.',
      'Listing an article from an AI summary without confirming it exists and says what the summary claims.',
      'Using only one database.',
    ],
    selfCheck: [
      'Did I open each article and confirm the title, year, and authors?',
      'Could a classmate rerun my search from what I recorded?',
    ],
  },
  {
    title: 'Screening and scoring articles',
    why:
      'Not every article that matches your keywords answers your question. Scoring each one the same way helps you choose evidence that fits your client and is strong enough to rely on.',
    steps: [
      'Read at least the abstract and methods of each article.',
      'Score each criterion 0, 1, or 2 using the rubric below.',
      'Check the totals, but also look for any 0 on population or intervention.',
      'Select your top 2–5 articles to carry forward.',
    ],
    examples: [],
    rubric: [
      {
        criterion: 'Population match',
        levels: [
          'Different population (e.g., adults when your client is a child).',
          'Partly similar (same diagnosis but different age or severity).',
          'Closely matches your client.',
        ],
      },
      {
        criterion: 'Intervention match',
        levels: ['A different approach.', 'A related or modified version.', 'The same approach you are asking about.'],
      },
      {
        criterion: 'Outcome match',
        levels: ['Outcome is not relevant to your goal.', 'A related outcome.', 'Measures the outcome you care about.'],
      },
      {
        criterion: 'Study quality',
        levels: [
          'Case report, expert opinion, or no comparison.',
          'Group or single-case design with limited experimental control.',
          'Systematic review, randomized controlled trial, or well-controlled single-case experimental design.',
        ],
      },
      {
        criterion: 'Clinical feasibility',
        levels: [
          'Can’t be done in your setting (equipment, dosage, training).',
          'Possible with adaptations.',
          'Doable as described.',
        ],
      },
      {
        criterion: 'Recency / foundational',
        levels: [
          'Older and replaced by newer work.',
          'Older but still widely cited.',
          'Recent (about the last 10 years) or a foundational study.',
        ],
      },
    ],
    pitfalls: [
      'Scoring from the title alone.',
      'Choosing a high-total article that scores 0 on population; it may not apply to your client.',
      'Rating study quality by journal name instead of study design.',
    ],
    selfCheck: [
      'Could I explain each score to my supervisor in one sentence?',
      'Do my top picks actually answer my PICO question?',
    ],
  },
  {
    title: 'Extracting the evidence',
    why:
      'Extraction is where you find out what the study actually did and found. These details (especially dosage and outcome measures) are what you will copy into your treatment plan, so they need to come from the article, not a summary.',
    steps: [
      'Read the methods and results sections, not just the abstract.',
      'Participants: number, age range, diagnosis, severity.',
      'Dosage: minutes per session, sessions per week, total weeks or sessions.',
      'Outcome measures: what was measured and how (probes, standardized tests).',
      'Results: did it work, how much, and did it generalize or maintain?',
      'Clinical takeaway: what will you do differently for your client because of this study?',
    ],
    examples: [
      {
        label: 'Clinical takeaway (hypothetical study)',
        weak: 'This therapy works.',
        strong:
          'Accuracy improved on treated words for most participants after 4 weeks of 30-minute sessions twice a week, but gains on untreated words were small. I will use a similar dosage and probe untreated words weekly to watch for generalization.',
        why: 'The strong version is specific about dosage and results, notes a limitation, and says how it changes your plan.',
      },
    ],
    pitfalls: [
      'Copying the abstract into every field.',
      'Leaving out dosage, which you will need for your plan.',
      'Reporting only positive results and skipping limitations.',
    ],
    selfCheck: [
      'Did I find the dosage in the methods section?',
      'Does my takeaway connect the study to my specific client?',
    ],
  },
  {
    title: 'Writing the therapy plan',
    why:
      'Your plan is where the evidence, your clinical judgment, and the client’s priorities come together. Each part should trace back to something you found: goals to your outcome, methods to the studies’ intervention and dosage.',
    steps: [
      'Long-term goal: behavior, condition, criterion, and timeframe.',
      'Short-term objectives: 2–4 smaller steps that build toward the long-term goal.',
      'Methodology: session structure, cueing hierarchy, feedback, and materials, based on your extracted studies.',
      'Progress monitoring: how often you will probe, what you will measure, and what counts as mastery.',
      'Rationale: choose the 2–3 studies that most directly support this plan.',
    ],
    examples: [
      {
        label: 'Goal',
        weak: 'Client will improve speech.',
        strong:
          'Within 12 weeks, the client will produce two- and three-syllable words accurately in structured play, given no more than one model, in 80% of opportunities across 3 consecutive sessions.',
        why: 'The strong goal has a behavior, a condition, a criterion, and a timeframe, so anyone can tell whether it was met.',
      },
      {
        label: 'Feedback plan',
        weak: 'Give feedback.',
        strong:
          'Early on, give frequent, specific feedback on how the word was produced. As accuracy improves, reduce to occasional feedback on whether it was correct.',
        why: 'It names the type and frequency of feedback and how it changes over time.',
      },
    ],
    pitfalls: [
      'Goals that measure something different from the outcomes in your studies.',
      'Planning a much lower dosage than the studies used without saying why.',
      'A mastery criterion that doesn’t match the goal’s criterion.',
    ],
    selfCheck: [
      'Can I point to a study for my methods and dosage?',
      'Does each short-term objective lead toward the long-term goal?',
      'Would my supervisor know exactly how to measure progress from this plan?',
    ],
  },
];
