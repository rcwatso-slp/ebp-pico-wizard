import React, { useEffect, useState } from 'react';
import { LiteratureSearch } from '../components/LiteratureSearch';
import { hitLink, type SearchHit, type SearchSource } from '../search';
import { ageGroupFromAge } from '../utils';
import type { StepProps } from '../common';
import type { CandidateArticle, SearchKeywords, WizardData } from '../types';

const copyText = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // noop
  }
};

const uniqueTerms = (values: string[]): string[] =>
  Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

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

const buildQueries = (finalPico: string, keywords: SearchKeywords): WizardData['step3']['queries'] => {
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

const buildElicitPrompt = (state: WizardData): string => {
  const { queries, keywordColumns } = state.step3;
  const population = keywordColumns.population.join(', ') || 'none';
  const intervention = keywordColumns.intervention.join(', ') || 'none';
  const outcome = keywordColumns.outcome.join(', ') || 'none';

  return [
    'You are helping with an evidence-based search for an SLP student clinician.',
    `Case context: ${state.caseSnapshot.setting || 'clinical setting'}; age group: ${ageGroupFromAge(state.caseSnapshot.age)}; concerns: ${state.caseSnapshot.concerns.join(', ') || 'not specified'}.`,
    `Final PICO: ${state.step2.finalPico || '[missing final PICO]'}`,
    '',
    'Search queries to run:',
    `1) Full PICO sentence: ${queries.fullPico}`,
    `2) Keyword-only (P+I+O): ${queries.keywordOnly}`,
    `3) Intervention-focused: ${queries.interventionFocused}`,
    `4) Outcome-focused: ${queries.outcomeFocused}`,
    '',
    `Keyword banks -> Population: ${population}; Intervention: ${intervention}; Outcome: ${outcome}.`,
    '',
    'Task:',
    '- Return the best matching peer-reviewed studies (or high-quality foundational papers if limited).',
    '- Prioritize direct relevance to population, intervention, and outcomes.',
    '- Include citation, year, link/DOI, study design, and a 1-2 sentence relevance note for each result.',
    '- Return at least 8 candidate articles and rank them from strongest to weakest match.',
  ].join('\n');
};

export const Step3SearchPlan: React.FC<StepProps> = ({ state, setState }) => {
  const [chipsInput, setChipsInput] = useState({ population: '', intervention: '', outcome: '' });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (state.step3.keywordsEdited) return;

    // Auto-derive keyword buckets from Case Snapshot + PICO so Step 3 starts pre-filled.
    // Setting, age group, and timeframe would widen an OR'd concept rather than focus it,
    // and Step 2 keywords are sorted by the student below.
    const population = uniqueTerms([
      state.step2.builder.p,
      state.caseSnapshot.initialTarget === 'other' ? '' : state.caseSnapshot.initialTarget,
      ...state.caseSnapshot.concerns.filter((c) => c !== 'other'),
    ]);
    const intervention = uniqueTerms([state.step2.builder.i]);
    const outcome = uniqueTerms([state.step2.builder.o, state.step2.builder.measurement]);
    const keywordColumns = { population, intervention, outcome };
    const queries = buildQueries(state.step2.finalPico, keywordColumns);

    const sameKeywords = JSON.stringify(state.step3.keywordColumns) === JSON.stringify(keywordColumns);
    const sameQueries = JSON.stringify(state.step3.queries) === JSON.stringify(queries);
    if (sameKeywords && sameQueries) return;

    setState((prev: WizardData) => ({
      ...prev,
      step3: {
        ...prev.step3,
        keywordColumns,
        queries,
      },
    }));
  }, [
    setState,
    state.caseSnapshot.concerns,
    state.caseSnapshot.initialTarget,
    state.step2.builder.i,
    state.step2.builder.measurement,
    state.step2.builder.o,
    state.step2.builder.p,
    state.step2.finalPico,
    state.step3.keywordsEdited,
    state.step3.keywordColumns,
    state.step3.queries,
  ]);

  const addChips = (key: 'population' | 'intervention' | 'outcome'): void => {
    const values = chipsInput[key]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!values.length) return;

    setState((prev: WizardData) => ({
      ...prev,
      step3: {
        ...prev.step3,
        keywordsEdited: true,
        keywordColumns: {
          ...prev.step3.keywordColumns,
          [key]: Array.from(new Set([...prev.step3.keywordColumns[key], ...values])),
        },
      },
    }));
    setChipsInput((prev) => ({ ...prev, [key]: '' }));
  };

  const placeKeyword = (term: string, key: 'population' | 'intervention' | 'outcome'): void => {
    setState((prev: WizardData) => {
      const keywordColumns = {
        ...prev.step3.keywordColumns,
        [key]: Array.from(new Set([...prev.step3.keywordColumns[key], term])),
      };
      return {
        ...prev,
        step3: {
          ...prev.step3,
          keywordsEdited: true,
          keywordColumns,
          queries: buildQueries(prev.step2.finalPico, keywordColumns),
        },
      };
    });
  };

  const sortedTerms = new Set(
    [...state.step3.keywordColumns.population, ...state.step3.keywordColumns.intervention, ...state.step3.keywordColumns.outcome].map(
      (t) => t.toLowerCase(),
    ),
  );
  const unsortedKeywords = state.step2.keywords.filter((k) => !sortedTerms.has(k.toLowerCase()));

  const addFromSearch = (hit: SearchHit, source: SearchSource): void => {
    const article = {
      title: hit.title,
      year: hit.year,
      link: hitLink(hit),
      notes: `Found via ${source === 'pubmed' ? 'PubMed' : 'Europe PMC'}${hit.studyTypes.length ? ` (${hit.studyTypes.join(', ')})` : ''}`,
    };
    setState((prev: WizardData) => {
      const blank = prev.step3.candidateArticles.find((a) => !a.title.trim() && !a.link.trim());
      const candidateArticles = blank
        ? prev.step3.candidateArticles.map((a) => (a.id === blank.id ? { ...a, ...article } : a))
        : [...prev.step3.candidateArticles, { id: crypto.randomUUID(), ...article }];
      return { ...prev, step3: { ...prev.step3, candidateArticles } };
    });
  };

  const generateQueries = (): void => {
    setState((prev: WizardData) => ({
      ...prev,
      step3: {
        ...prev.step3,
        keywordsEdited: true,
        queries: buildQueries(prev.step2.finalPico, prev.step3.keywordColumns),
      },
    }));
  };

  return (
    <section>
      <h2>Step 3: Search Plan</h2>
      <p className="muted">Group your keywords by concept, build queries, then search for candidate articles.</p>

      {unsortedKeywords.length ? (
        <div className="card">
          <h3>Sort your Step 2 keywords</h3>
          <p className="muted tiny">Which concept does each keyword describe? Click P, I, or O to place it in a column below.</p>
          <ul className="sortList">
            {unsortedKeywords.map((k) => (
              <li key={k} className="sortItem">
                <span>{k}</span>
                {(['population', 'intervention', 'outcome'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    className="ghost small"
                    title={`Add to ${col}`}
                    aria-label={`Add ${k} to ${col}`}
                    onClick={() => placeKeyword(k, col)}
                  >
                    {col[0].toUpperCase()}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="formGrid three">
        {(['population', 'intervention', 'outcome'] as const).map((key) => (
          <div key={key} className="card">
            <h3>{key[0].toUpperCase() + key.slice(1)} keywords</h3>
            <div className="chipsEditor">
              <input
                value={chipsInput[key]}
                onChange={(e) => setChipsInput((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="comma-separated"
              />
              <button type="button" onClick={() => addChips(key)}>
                Add
              </button>
            </div>
            <div className="chipsWrap">
              {state.step3.keywordColumns[key].map((chip) => (
                <button
                  type="button"
                  className="chip selected"
                  key={chip}
                  onClick={() =>
                    setState((prev: WizardData) => ({
                      ...prev,
                      step3: {
                        ...prev.step3,
                        keywordsEdited: true,
                        keywordColumns: {
                          ...prev.step3.keywordColumns,
                          [key]: prev.step3.keywordColumns[key].filter((v) => v !== chip),
                        },
                      },
                    }))
                  }
                >
                  {chip} ×
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={generateQueries}>
        Rebuild queries from keywords
      </button>

      <div className="queryGrid">
        {([
          ['fullPico', '1) Full PICO sentence'],
          ['keywordOnly', '2) Keyword only (P + I + O)'],
          ['interventionFocused', '3) Intervention-focused'],
          ['outcomeFocused', '4) Outcome-focused'],
        ] as const).map(([key, label]) => (
          <div className="card" key={key}>
            <label>
              {label}
              <textarea
                value={state.step3.queries[key]}
                onChange={(e) =>
                  setState((prev: WizardData) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      keywordsEdited: true,
                      queries: { ...prev.step3.queries, [key]: e.target.value },
                    },
                  }))
                }
              />
            </label>
            <button
              type="button"
              className="ghost"
              onClick={async () => {
                await copyText(state.step3.queries[key]);
                setCopied(key);
                window.setTimeout(() => setCopied(''), 1200);
              }}
            >
              {copied === key ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        ))}
      </div>

      <LiteratureSearch queries={state.step3.queries} articles={state.step3.candidateArticles} onAdd={addFromSearch} />

      <div className="card">
        <div className="buttonRow">
          <h3>Optional: search with Elicit</h3>
          <button
            type="button"
            onClick={() =>
              setState((prev: WizardData) => ({
                ...prev,
                step3: {
                  ...prev.step3,
                  elicitPrompt: buildElicitPrompt(prev),
                },
              }))
            }
          >
            Generate full Elicit prompt
          </button>
        </div>
        <label>
          Copy/paste prompt for Elicit
          <textarea value={state.step3.elicitPrompt} readOnly />
        </label>
        <button
          type="button"
          className="ghost"
          disabled={!state.step3.elicitPrompt.trim()}
          onClick={async () => {
            await copyText(state.step3.elicitPrompt);
            setCopied('elicitPrompt');
            window.setTimeout(() => setCopied(''), 1200);
          }}
        >
          {copied === 'elicitPrompt' ? 'Copied ✓' : 'Copy full prompt'}
        </button>{' '}
        <a className="linkBtn" href="https://elicit.com" target="_blank" rel="noopener noreferrer">
          Open Elicit
        </a>
      </div>

      <h3>Candidate articles (at least 2 titles)</h3>
      {state.step3.candidateArticles.map((a, idx) => (
        <article className="card" key={a.id}>
          <div className="buttonRow">
            <h4>Article {idx + 1}</h4>
            <button
              type="button"
              className="ghost"
              disabled={state.step3.candidateArticles.length <= 2}
              onClick={() =>
                setState((prev: WizardData) => ({
                  ...prev,
                  step3: {
                    ...prev.step3,
                    candidateArticles: prev.step3.candidateArticles.filter((row: CandidateArticle) => row.id !== a.id),
                  },
                }))
              }
            >
              Remove Article
            </button>
          </div>
          <label>
            Title *
            <input
              value={a.title}
              onChange={(e) =>
                setState((prev: WizardData) => ({
                  ...prev,
                  step3: {
                    ...prev.step3,
                    candidateArticles: prev.step3.candidateArticles.map((row: CandidateArticle) =>
                      row.id === a.id ? { ...row, title: e.target.value } : row,
                    ),
                  },
                }))
              }
            />
          </label>
          <div className="formGrid three">
            <label>
              Year
              <input
                value={a.year}
                onChange={(e) =>
                  setState((prev: WizardData) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row: CandidateArticle) =>
                        row.id === a.id ? { ...row, year: e.target.value } : row,
                      ),
                    },
                  }))
                }
              />
            </label>
            <label>
              Link/DOI
              <input
                value={a.link}
                onChange={(e) =>
                  setState((prev: WizardData) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row: CandidateArticle) =>
                        row.id === a.id ? { ...row, link: e.target.value } : row,
                      ),
                    },
                  }))
                }
              />
            </label>
            <label>
              Notes
              <input
                value={a.notes}
                onChange={(e) =>
                  setState((prev: WizardData) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row: CandidateArticle) =>
                        row.id === a.id ? { ...row, notes: e.target.value } : row,
                      ),
                    },
                  }))
                }
              />
            </label>
          </div>
        </article>
      ))}
      <button
        type="button"
        className="ghost"
        onClick={() =>
          setState((prev: WizardData) => ({
            ...prev,
            step3: {
              ...prev.step3,
              candidateArticles: [...prev.step3.candidateArticles, { id: crypto.randomUUID(), title: '', year: '', link: '', notes: '' }],
            },
          }))
        }
      >
        Add Article
      </button>
    </section>
  );
};
