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
      'A good clinical question starts with a real functional problem, not just a diagnosis. Framing the need in terms of the client’s daily communication and participation (as in the ICF framework) keeps your search and goals meaningful to the client.',
    steps: [
      'Pick the setting, age, and areas of concern.',
      'Describe the functional problem: what the client cannot do yet, and where it matters in daily life.',
      'Add assessment anchors: the measures and findings that support the problem.',
      'Choose one initial target to focus the search.',
      'Note real constraints (time, attention, caregiver support, materials) that will shape what is feasible.',
    ],
    examples: [
      {
        label: 'Functional problem',
        weak: 'Has articulation problems.',
        strong:
          'Unfamiliar listeners understand about half of what the client says, so the client avoids talking during group activities at preschool.',
        why: 'The strong version names an observable problem, how big it is, and how it affects participation.',
      },
      {
        label: 'Assessment anchor',
        weak: 'Testing showed delays.',
        strong: 'Standardized articulation test: standard score 72; inconsistent errors on repeated productions of the same words.',
        why: 'Specific findings point you toward the right population and outcome terms for your PICO.',
      },
    ],
    pitfalls: [
      'Listing a diagnosis instead of a functional need.',
      'Choosing a target that does not match the assessment findings.',
      'Skipping constraints; they matter later when you judge feasibility.',
      'Including identifying details (school name, exact dates, unusual personal details).',
    ],
    selfCheck: [
      'Could a peer understand the client’s main communication need from my snapshot?',
      'Does my initial target follow from my assessment findings?',
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
