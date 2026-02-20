import React, { useEffect } from 'react';
import { getScoreTotal, orderedArticles } from '../utils';
import type { StepProps } from '../common';

const scoreKeys = [
  ['populationMatch', 'Population match'],
  ['interventionMatch', 'Intervention match'],
  ['outcomeMatch', 'Outcome match'],
  ['studyQuality', 'Study quality'],
  ['clinicalFeasibility', 'Clinical feasibility'],
  ['recencyFoundational', 'Recency/foundational'],
] as const;

export const Step4Screening: React.FC<StepProps> = ({ state, setState }) => {
  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const scores = { ...prev.step4.scores };
      prev.step3.candidateArticles.forEach((article, idx) => {
        if (!scores[article.id]) {
          changed = true;
          scores[article.id] = {
            articleId: article.id,
            populationMatch: 0,
            interventionMatch: 0,
            outcomeMatch: 0,
            studyQuality: 0,
            clinicalFeasibility: 0,
            recencyFoundational: 0,
            includeTop: false,
            manualOrder: idx,
          };
        }
      });
      return changed ? { ...prev, step4: { ...prev.step4, scores } } : prev;
    });
  }, [setState]);

  const topCount = Object.values(state.step4.scores).filter((x) => x.includeTop).length;
  const rows = orderedArticles(state.step3.candidateArticles, state.step4.scores, state.step4.autoSort);

  return (
    <section>
      <h2>Step 4: Screening & Scoring</h2>
      <div className="buttonRow">
        <button type="button" onClick={() => setState((prev) => ({ ...prev, step4: { ...prev.step4, autoSort: !prev.step4.autoSort } }))}>
          {state.step4.autoSort ? 'Disable auto sort (manual mode)' : 'Enable auto sort (score mode)'}
        </button>
        <p className={`pill ${topCount < 2 || topCount > 5 ? 'warn' : ''}`}>Top selected: {topCount} (required: 2-5)</p>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Article</th>
              {scoreKeys.map(([, label]) => (
                <th key={label}>{label}</th>
              ))}
              <th>Total</th>
              <th>Include in Top</th>
              {!state.step4.autoSort ? <th>Order</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((article, idx) => {
              const score = state.step4.scores[article.id];
              if (!score) return null;
              const total = getScoreTotal(score);
              const maxReached = topCount >= 5 && !score.includeTop;
              return (
                <tr key={article.id}>
                  <td>
                    <strong>{article.title || `Untitled article ${idx + 1}`}</strong>
                    <div className="muted tiny">{article.year} {article.link}</div>
                  </td>
                  {scoreKeys.map(([key]) => (
                    <td key={key}>
                      <select
                        value={score[key]}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            step4: {
                              ...prev.step4,
                              scores: {
                                ...prev.step4.scores,
                                [article.id]: { ...prev.step4.scores[article.id], [key]: Number(e.target.value) },
                              },
                            },
                          }))
                        }
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                      </select>
                    </td>
                  ))}
                  <td>{total}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={score.includeTop}
                      disabled={maxReached}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          step4: {
                            ...prev.step4,
                            scores: {
                              ...prev.step4.scores,
                              [article.id]: { ...prev.step4.scores[article.id], includeTop: e.target.checked },
                            },
                          },
                        }))
                      }
                    />
                  </td>
                  {!state.step4.autoSort ? (
                    <td>
                      <div className="buttonCol">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              step4: {
                                ...prev.step4,
                                scores: {
                                  ...prev.step4.scores,
                                  [article.id]: {
                                    ...prev.step4.scores[article.id],
                                    manualOrder: Math.max(0, prev.step4.scores[article.id].manualOrder - 1),
                                  },
                                },
                              },
                            }))
                          }
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              step4: {
                                ...prev.step4,
                                scores: {
                                  ...prev.step4.scores,
                                  [article.id]: {
                                    ...prev.step4.scores[article.id],
                                    manualOrder: prev.step4.scores[article.id].manualOrder + 1,
                                  },
                                },
                              },
                            }))
                          }
                        >
                          Down
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
