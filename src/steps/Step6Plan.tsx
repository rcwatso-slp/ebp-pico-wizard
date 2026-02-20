import React from 'react';
import { PhiField } from '../components/PhiField';
import { goalToText } from '../utils';
import type { StepProps } from '../common';

const sessionStructures = ['1:1 direct therapy', 'small group', 'hybrid direct + caregiver coaching', 'telepractice', 'other'];

export const Step6Plan: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const topArticles = Object.values(state.step4.scores)
    .filter((s) => s.includeTop)
    .map((s) => state.step3.candidateArticles.find((a) => a.id === s.articleId))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <section>
      <h2>Step 6: Therapy Plan Builder</h2>

      <article className="card">
        <h3>Long-term goal *</h3>
        <div className="formGrid two">
          {(['behavior', 'condition', 'criterion', 'timeframe'] as const).map((key) => (
            <label key={key}>
              {key}
              <input
                value={state.step6.longTermGoal[key]}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    step6: {
                      ...prev.step6,
                      longTermGoal: { ...prev.step6.longTermGoal, [key]: e.target.value },
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>
        <p className="preview">{goalToText(state.step6.longTermGoal)}</p>
      </article>

      <article className="card">
        <div className="buttonRow">
          <h3>Short-term objectives (2-4 required)</h3>
          <button
            type="button"
            className="ghost"
            disabled={state.step6.shortTermObjectives.length >= 4}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                step6: {
                  ...prev.step6,
                  shortTermObjectives: [
                    ...prev.step6.shortTermObjectives,
                    { id: crypto.randomUUID(), behavior: '', condition: '', criterion: '', timeframe: '' },
                  ],
                },
              }))
            }
          >
            Add objective
          </button>
        </div>

        {state.step6.shortTermObjectives.map((goal, idx) => (
          <div className="card" key={goal.id}>
            <div className="buttonRow">
              <h4>Objective {idx + 1}</h4>
              <button
                type="button"
                className="ghost"
                disabled={state.step6.shortTermObjectives.length <= 2}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    step6: {
                      ...prev.step6,
                      shortTermObjectives: prev.step6.shortTermObjectives.filter((row) => row.id !== goal.id),
                    },
                  }))
                }
              >
                Remove
              </button>
            </div>
            <div className="formGrid two">
              {(['behavior', 'condition', 'criterion', 'timeframe'] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={goal[key]}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        step6: {
                          ...prev.step6,
                          shortTermObjectives: prev.step6.shortTermObjectives.map((row) =>
                            row.id === goal.id ? { ...row, [key]: e.target.value } : row,
                          ),
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <p className="preview">{goalToText(goal)}</p>
          </div>
        ))}
      </article>

      <article className="card">
        <h3>Methodology *</h3>
        <div className="formGrid two">
          <label>
            Session structure
            <select
              value={state.step6.methodology.sessionStructure}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: { ...prev.step6, methodology: { ...prev.step6.methodology, sessionStructure: e.target.value } },
                }))
              }
            >
              <option value="">Select</option>
              {sessionStructures.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Feedback type/frequency
            <input
              value={state.step6.methodology.feedbackTypeFrequency}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: {
                    ...prev.step6,
                    methodology: { ...prev.step6.methodology, feedbackTypeFrequency: e.target.value },
                  },
                }))
              }
            />
          </label>
        </div>

        <PhiField
          fieldId="step6_cueing"
          label="Cueing hierarchy"
          value={state.step6.methodology.cueingHierarchy}
          ignored={!!state.phiIgnoredFields.step6_cueing}
          onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step6_cueing: checked } }))}
          onWarning={onPhiWarning}
        >
          <label>
            Cueing hierarchy
            <textarea
              value={state.step6.methodology.cueingHierarchy}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: {
                    ...prev.step6,
                    methodology: { ...prev.step6.methodology, cueingHierarchy: e.target.value },
                  },
                }))
              }
            />
          </label>
        </PhiField>

        <label>
          Materials list
          <textarea
            value={state.step6.methodology.materialsList}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                step6: {
                  ...prev.step6,
                  methodology: { ...prev.step6.methodology, materialsList: e.target.value },
                },
              }))
            }
          />
        </label>
      </article>

      <article className="card">
        <h3>Progress monitoring *</h3>
        <div className="formGrid three">
          <label>
            Probe schedule
            <input
              value={state.step6.progressMonitoring.probeSchedule}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: {
                    ...prev.step6,
                    progressMonitoring: { ...prev.step6.progressMonitoring, probeSchedule: e.target.value },
                  },
                }))
              }
            />
          </label>
          <label>
            Metric
            <input
              value={state.step6.progressMonitoring.metric}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: {
                    ...prev.step6,
                    progressMonitoring: { ...prev.step6.progressMonitoring, metric: e.target.value },
                  },
                }))
              }
            />
          </label>
          <label>
            Mastery criteria
            <input
              value={state.step6.progressMonitoring.masteryCriteria}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  step6: {
                    ...prev.step6,
                    progressMonitoring: { ...prev.step6.progressMonitoring, masteryCriteria: e.target.value },
                  },
                }))
              }
            />
          </label>
        </div>
      </article>

      <article className="card">
        <h3>Rationale builder (pick 2-3 evidence sources)</h3>
        <div className="chipsWrap">
          {topArticles.map((a) => {
            const selected = state.step6.rationaleArticleIds.includes(a.id);
            const tooMany = !selected && state.step6.rationaleArticleIds.length >= 3;
            return (
              <label key={a.id} className={`chip ${selected ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={tooMany}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      step6: {
                        ...prev.step6,
                        rationaleArticleIds: e.target.checked
                          ? [...prev.step6.rationaleArticleIds, a.id]
                          : prev.step6.rationaleArticleIds.filter((id) => id !== a.id),
                      },
                    }))
                  }
                />
                {a.title}
              </label>
            );
          })}
        </div>
      </article>
    </section>
  );
};
