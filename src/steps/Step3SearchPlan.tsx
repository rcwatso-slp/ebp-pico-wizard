import React, { useEffect, useState } from 'react';
import { PhiField } from '../components/PhiField';
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

const buildQueries = (finalPico: string, keywords: SearchKeywords): WizardData['step3']['queries'] => {
  const p = keywords.population.join(' OR ');
  const i = keywords.intervention.join(' OR ');
  const o = keywords.outcome.join(' OR ');

  return {
    fullPico: finalPico || '[Add final PICO in Step 2]',
    keywordOnly: `${p} AND ${i} AND ${o}`,
    interventionFocused: `${i} AND (${p})`,
    outcomeFocused: `${o} AND (${p})`,
  };
};

export const Step3SearchPlan: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [chipsInput, setChipsInput] = useState({ population: '', intervention: '', outcome: '' });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (state.step3.keywordsEdited) return;

    // Auto-derive keyword buckets from Case Snapshot + PICO so Step 3 starts pre-filled.
    const population = uniqueTerms([
      state.step2.builder.p,
      ageGroupFromAge(state.caseSnapshot.age),
      state.caseSnapshot.setting,
      state.caseSnapshot.initialTarget,
      ...state.caseSnapshot.concerns,
    ]);
    const intervention = uniqueTerms([state.step2.builder.i, ...state.step2.keywords]);
    const outcome = uniqueTerms([state.step2.builder.o, state.step2.builder.measurement, state.step2.builder.timeframe]);
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
    state.caseSnapshot.age,
    state.caseSnapshot.concerns,
    state.caseSnapshot.initialTarget,
    state.caseSnapshot.setting,
    state.step2.builder.i,
    state.step2.builder.measurement,
    state.step2.builder.o,
    state.step2.builder.p,
    state.step2.builder.timeframe,
    state.step2.finalPico,
    state.step2.keywords,
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
      <h2>Step 3: Search Plan (Elicit)</h2>
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
        Elicit query generator
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
          <PhiField
            fieldId={`step3_title_${a.id}`}
            label={`Article ${idx + 1} title`}
            value={a.title}
            ignored={!!state.phiIgnoredFields[`step3_title_${a.id}`]}
            onToggleIgnore={(checked) =>
              setState((prev: WizardData) => ({
                ...prev,
                phiIgnoredFields: { ...prev.phiIgnoredFields, [`step3_title_${a.id}`]: checked },
              }))
            }
            onWarning={onPhiWarning}
          >
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
          </PhiField>
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
