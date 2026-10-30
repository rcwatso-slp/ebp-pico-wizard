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
      'Case: describe your client and the specific skill to change (de-identified).',
      'PICO: turn that into a focused, searchable question and search terms.',
      'Search: search databases and trusted SLP sources, and save possible articles.',
      'Appraise: judge each article\u2019s fit, study design, and quality, then pick your top studies.',
      'Extract: pull out what the studies actually did and found, and summarize the evidence.',
      'Plan: write goals, methods, and progress monitoring tied to that evidence.',
    ],
    examples: [],
    pitfalls: [
      'Entering anything that could identify a client: names, birth dates, school or facility names, exact session dates, record numbers.',
      'Trusting an AI summary without opening the article. AI tools such as Elicit and ChatGPT can misstate findings or invent citations.',
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
      'Start from your Step 1 drafts for P and O.',
      'P: describe the population by age group, disorder, and severity if relevant.',
      'I: name a specific intervention approach, not just \u201ctherapy.\u201d',
      'C (optional): add a comparison only if you are choosing between options, such as another approach or no treatment.',
      'O: name an outcome you can measure and that matters for this client.',
      'Optionally brainstorm with a generative AI tool, then judge its suggestions yourself.',
      'Write your question, then check that it is searchable, feasible, and relevant.',
      'List at least 3 search terms for each of P, I, and O: synonyms, abbreviations, and related names.',
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
      'Adding a comparison just to fill the box. If you are not choosing between two options, leave C blank.',
      'Copying an AI-suggested question without checking that it still matches your client and treatment target.',
      'An outcome that cannot be measured (“better communication”).',
      'A population so narrow no study will match it, or so broad that results don’t apply.',
      'An intervention that isn’t realistic in your setting.',
      'Keywords that are all one word repeated in different forms.',
    ],
    selfCheck: [
      'Can I point to each of P, I, and O in my final question?',
      'Would I know how to measure my outcome in a session?',
      'Do I have at least 3 short search terms for each of P, I, and O?',
    ],
  },
  {
    title: 'Searching for evidence',
    why:
      'A planned, recorded search finds the studies that actually match your question and lets someone else repeat it. Starting focused and widening on purpose teaches you how much evidence exists, and where the gaps are.',
    steps: [
      'Start with P + I + O, the most focused search.',
      'Too few results? Drop the outcome (P + I). Want to see what else works for this outcome? Try P + O.',
      'Too many results? Turn on the design filter for systematic reviews and randomized controlled trials.',
      'Read the abstract, then save anything that might fit. Aim for 5\u201310 articles.',
      'Check trusted sources such as ASHA Evidence Maps and The Informed SLP for reviews and guidelines.',
      'Note why each saved article might be relevant. Your search log records the rest.',
    ],
    examples: [
      {
        label: 'Boolean query',
        weak: 'apraxia therapy children',
        strong:
          '("childhood apraxia of speech" OR CAS) AND ("integral stimulation" OR "dynamic temporal and tactile cueing" OR DTTC)',
        why: 'OR widens each concept to include synonyms; AND requires every concept to appear. Quotation marks keep phrases together.',
      },
      {
        label: 'Relevance note',
        weak: 'Looks good.',
        strong: 'Same intervention and outcome; participants were preschoolers, younger than my client.',
        why: 'Noting what matches and what doesn\u2019t prepares you to score the article in Step 4.',
      },
    ],
    pitfalls: [
      'Stopping at the first search. If you only ran one search, you may have missed the best evidence.',
      'Saving articles from the title alone without reading the abstract.',
      'Listing an article from an AI tool without opening it to confirm it exists and says what the tool claims.',
      'Ignoring synthesized evidence. A good systematic review or guideline can be worth more than several single studies.',
    ],
    selfCheck: [
      'Did I try more than one search strategy or database?',
      'Could a classmate repeat my searches from my search log?',
      'Did I open each saved article and confirm the title, year, and authors?',
    ],
  },
  {
    title: 'Appraising the evidence',
    why:
      'Critical appraisal is how clinicians decide which evidence to trust. You ask three questions about every article: does it answer my question, how strong is the study, and does it fit my client? The checklists here are short teaching versions of tools professionals use, such as PEDro-P, RoBiNT, AMSTAR 2, and CASP.',
    steps: [
      'Open the article. Most answers are in the abstract and the Methods.',
      'Match: rate how well the population, intervention, and outcome match your PICO. Set aside articles that clearly don\u2019t fit, with a reason.',
      'Design: identify the study design. Use \u201cHelp me identify the design\u201d if you\u2019re unsure. The design sets the level of evidence.',
      'Quality: answer the checklist for that design. Choose Unclear when the article doesn\u2019t say.',
      'Fit: judge whether you could use it with your client, in your setting, at that dosage.',
      'Choose your top 2\u20135 and explain why each one made the cut.',
    ],
    examples: [
      {
        label: 'PubMed\u2019s \u201cReview\u201d tag',
        weak: 'It says Review, so it\u2019s a systematic review (Level Ia).',
        strong: 'It says Review but not Systematic Review, and there is no search method, so it\u2019s a narrative review (Level IV).',
        why: 'Only reviews with a systematic, reported search count as systematic reviews.',
      },
      {
        label: 'Reason for a top article',
        weak: 'Good study.',
        strong: 'Randomized trial rated Strong (7/9); same intervention and outcome; twice-weekly dosage fits our schedule.',
        why: 'A good reason names the design, quality, and fit, so a supervisor can follow your thinking.',
      },
    ],
    pitfalls: [
      'Rating quality from the design alone. A randomized trial can still be poorly run.',
      'Answering Yes when the article doesn\u2019t actually report it. Choose Unclear instead.',
      'Picking the highest level of evidence even when the population is very different from your client.',
      'Skipping single-case designs. Well-controlled single-case studies are strong evidence for many SLP treatments.',
    ],
    selfCheck: [
      'Did I check the Methods, not just the abstract, for each answer?',
      'Could I defend each top pick on design, quality, and fit?',
      'Did I record a reason for every article I set aside?',
    ],
  },
  {
    title: 'Extracting the evidence',
    why:
      'Extraction is where you find out what each study actually did and found. The details you pull out (who was studied, the active ingredients, the dosage, and the outcomes) become your treatment plan in Step 6, so they need to come from the article itself.',
    steps: [
      'Work through one article at a time. Read the Methods and Results, not just the abstract.',
      'Participants: number, age range, diagnosis, and severity.',
      'Treatment: the active ingredients, plus dosage (session length, sessions per week, total length). Write NR if it isn\u2019t reported.',
      'Outcomes: what was measured, whether it improved, and whether gains generalized and were maintained.',
      'Clinical takeaway: what you will do differently for your client because of this study.',
      'Finally, summarize what the evidence says together, including its strength and its gaps.',
    ],
    examples: [
      {
        label: 'Dosage',
        weak: 'Twice a week.',
        strong: '30-minute sessions, 2 per week, for 12 weeks (24 sessions); about 100 practice trials per session.',
        why: 'Session length, frequency, and total length together tell you whether you can match the study\u2019s dosage.',
      },
      {
        label: 'Clinical takeaway (hypothetical study)',
        weak: 'This therapy works.',
        strong:
          'Accuracy improved on treated words for most participants, but gains on untreated words were small. I will use a similar dosage and probe untreated words weekly to watch for generalization.',
        why: 'The strong version is specific about results, notes a limitation, and says how it changes your plan.',
      },
      {
        label: 'Evidence summary',
        weak: 'The studies show the treatment works.',
        strong:
          'Two strong studies agree the treatment improves the target, but most participants were younger than my client and maintenance was not measured.',
        why: 'A good summary weighs agreement, strength, and gaps for your specific client.',
      },
    ],
    pitfalls: [
      'Copying the abstract into every field.',
      'Leaving out dosage; you need it to plan sessions.',
      'Marking generalization as Yes when the study never measured it.',
      'Summarizing each study separately instead of saying what they show together.',
    ],
    selfCheck: [
      'Did I find the dosage in the Methods?',
      'Does each takeaway connect the study to my client?',
      'Does my summary say how strong the evidence is and what is missing?',
    ],
  },
  {
    title: 'Writing the therapy plan',
    why:
      'Your plan is where research evidence, your clinical expertise, and the client\u2019s and family\u2019s priorities come together. Each part should trace back to something you found: goals to the treatment target and baseline, methods and dosage to the studies, and progress monitoring to the studies\u2019 outcome measures.',
    steps: [
      'Record the baseline, then write a long-term goal with a behavior, condition, criterion, and timeframe.',
      'Break it into 2\u20134 short-term objectives that build toward the goal.',
      'Plan methods and dosage using the studies; explain any changes you make.',
      'Choose how and how often you will measure progress, and what you will change if progress stalls.',
      'Write a rationale that covers research evidence, the client and family perspective, and your clinical judgment.',
    ],
    examples: [
      {
        label: 'Goal',
        weak: 'Client will improve communication.',
        strong:
          'Within 12 weeks, the client will spontaneously request help or a preferred item during play routines, given a 5-second expectant pause, in 4 of 5 opportunities across 3 sessions.',
        why: 'The strong goal has an observable behavior, a condition, a numeric criterion, and a timeframe, so anyone can tell whether it was met.',
      },
      {
        label: 'Decision rule',
        weak: 'I will keep going and see.',
        strong: 'If requests haven\u2019t increased after 6 sessions, I will add a visual cue and review the plan with my supervisor.',
        why: 'A decision rule says what you will change and when, based on data.',
      },
    ],
    pitfalls: [
      'Goals that measure something different from the outcomes in your studies.',
      'Planning much less treatment than the studies used without saying why.',
      'A mastery criterion that doesn\u2019t match the goal\u2019s criterion.',
      'A rationale that cites studies but leaves out the client\u2019s priorities or your own judgment.',
    ],
    selfCheck: [
      'Can I point to a study for my methods and dosage?',
      'Would someone else know exactly how to measure progress from this plan?',
      'Does my rationale address all three parts of evidence-based practice?',
    ],
  },
];
