import React, { useState } from 'react';
import { LiteratureSearch } from '../components/LiteratureSearch';
import { hitLink, type SearchHit, type SearchSource } from '../search';
import { KeywordColumns } from '../components/KeywordColumns';
import { withKeywordColumns } from '../searchTerms';
import { ageGroupFromAge, concernLabel } from '../utils';
import type { StepProps } from '../common';
import type { CandidateArticle, WizardData } from '../types';

const copyText = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // noop
  }
};

const buildElicitPrompt = (state: WizardData): string => {
  const { queries, keywordColumns } = state.step3;
  const population = keywordColumns.population.join(', ') || 'none';
  const intervention = keywordColumns.intervention.join(', ') || 'none';
  const outcome = keywordColumns.outcome.join(', ') || 'none';

  return [
    'You are helping with an evidence-based search for an SLP student clinician.',
    `Case context: ${state.caseSnapshot.setting || 'clinical setting'}; age group: ${ageGroupFromAge(state.caseSnapshot.age)}; primary area: ${state.caseSnapshot.primaryConcern ? concernLabel(state.caseSnapshot.primaryConcern, state.caseSnapshot.otherConcern) : 'not specified'}; treatment target: ${state.caseSnapshot.treatmentTarget || 'not specified'}.`,
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
  const [copied, setCopied] = useState('');

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

  const resetQueries = (): void => setState((prev: WizardData) => withKeywordColumns(prev, prev.step3.keywordColumns));

  return (
    <section>
      <h2>Step 3: Search Plan</h2>
      <p className="muted">Your search terms from Step 2 become Boolean searches. Run them here, then save the articles worth screening.</p>

      <div className="card">
        <h3>Your search terms</h3>
        <p className="fieldHint">Terms in the same concept are joined with OR; concepts are joined with AND. Changing a term rebuilds the searches below.</p>
        <KeywordColumns state={state} setState={setState} />
      </div>

      <div className="buttonRow">
        <h3>Searches built from your terms</h3>
        <button type="button" className="ghost small" onClick={resetQueries}>
          Undo my edits to the searches
        </button>
      </div>

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
