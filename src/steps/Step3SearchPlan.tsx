import React, { useState } from 'react';
import { PhiField } from '../components/PhiField';
import type { StepProps } from '../common';

const copyText = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // noop
  }
};

export const Step3SearchPlan: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [chipsInput, setChipsInput] = useState({ population: '', intervention: '', outcome: '' });
  const [copied, setCopied] = useState('');

  const addChips = (key: 'population' | 'intervention' | 'outcome'): void => {
    const values = chipsInput[key]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!values.length) return;

    setState((prev) => ({
      ...prev,
      step3: {
        ...prev.step3,
        keywordColumns: {
          ...prev.step3.keywordColumns,
          [key]: Array.from(new Set([...prev.step3.keywordColumns[key], ...values])),
        },
      },
    }));
    setChipsInput((prev) => ({ ...prev, [key]: '' }));
  };

  const generateQueries = (): void => {
    const finalPico = state.step2.finalPico || '[Add final PICO in Step 2]';
    const p = state.step3.keywordColumns.population.join(' OR ');
    const i = state.step3.keywordColumns.intervention.join(' OR ');
    const o = state.step3.keywordColumns.outcome.join(' OR ');

    setState((prev) => ({
      ...prev,
      step3: {
        ...prev.step3,
        queries: {
          fullPico: finalPico,
          keywordOnly: `${p} AND ${i} AND ${o}`,
          interventionFocused: `${i} AND (${p})`,
          outcomeFocused: `${o} AND (${p})`,
        },
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
                    setState((prev) => ({
                      ...prev,
                      step3: {
                        ...prev.step3,
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
                  setState((prev) => ({
                    ...prev,
                    step3: { ...prev.step3, queries: { ...prev.step3.queries, [key]: e.target.value } },
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

      <h3>Candidate articles (at least 8 titles)</h3>
      {state.step3.candidateArticles.map((a, idx) => (
        <article className="card" key={a.id}>
          <h4>Article {idx + 1}</h4>
          <PhiField
            fieldId={`step3_title_${a.id}`}
            label={`Article ${idx + 1} title`}
            value={a.title}
            ignored={!!state.phiIgnoredFields[`step3_title_${a.id}`]}
            onToggleIgnore={(checked) =>
              setState((prev) => ({
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
                  setState((prev) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row) =>
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
                  setState((prev) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row) =>
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
                  setState((prev) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row) =>
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
                  setState((prev) => ({
                    ...prev,
                    step3: {
                      ...prev.step3,
                      candidateArticles: prev.step3.candidateArticles.map((row) =>
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
          setState((prev) => ({
            ...prev,
            step3: {
              ...prev.step3,
              candidateArticles: [...prev.step3.candidateArticles, { id: crypto.randomUUID(), title: '', year: '', link: '', notes: '' }],
            },
          }))
        }
      >
        Add candidate article row
      </button>
    </section>
  );
};
