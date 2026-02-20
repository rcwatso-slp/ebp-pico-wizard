import React, { useEffect } from 'react';
import { PhiField } from '../components/PhiField';
import type { StepProps } from '../common';

const requiredKeys = [
  'citation',
  'participants',
  'interventionComponents',
  'dosage',
  'outcomeMeasures',
  'resultsSummary',
  'clinicalTakeaway',
] as const;

export const Step5Extraction: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const topIds = Object.values(state.step4.scores)
    .filter((s) => s.includeTop)
    .map((s) => s.articleId);

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const next = { ...prev.step5.extractions };
      topIds.forEach((id) => {
        if (!next[id]) {
          changed = true;
          next[id] = {
            articleId: id,
            citation: '',
            participants: '',
            interventionComponents: '',
            dosage: '',
            outcomeMeasures: '',
            resultsSummary: '',
            clinicalTakeaway: '',
            materialsSetup: '',
            collapsed: false,
          };
        }
      });
      return changed ? { ...prev, step5: { extractions: next } } : prev;
    });
  }, [setState, topIds]);

  return (
    <section>
      <h2>Step 5: Evidence Extraction Table</h2>
      <p className="muted">Complete required fields for at least 3 selected top articles.</p>
      {topIds.map((id) => {
        const article = state.step3.candidateArticles.find((a) => a.id === id);
        const extraction = state.step5.extractions[id];
        if (!extraction) return null;
        const complete = requiredKeys.every((k) => extraction[k].trim().length > 0);

        return (
          <article key={id} className="card">
            <div className="buttonRow">
              <h3>
                {article?.title || 'Selected article'} {complete ? '✓' : '○'}
              </h3>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    step5: {
                      extractions: {
                        ...prev.step5.extractions,
                        [id]: { ...prev.step5.extractions[id], collapsed: !prev.step5.extractions[id].collapsed },
                      },
                    },
                  }))
                }
              >
                {extraction.collapsed ? 'Expand' : 'Collapse'}
              </button>
            </div>

            {!extraction.collapsed ? (
              <div className="formGrid one">
                {([
                  ['citation', 'Citation *'],
                  ['participants', 'Participants (age/diagnosis, n) *'],
                  ['interventionComponents', 'Intervention components (bullets) *'],
                  ['dosage', 'Dosage (min/session, frequency, duration) *'],
                  ['outcomeMeasures', 'Outcome measures *'],
                  ['resultsSummary', 'Results summary *'],
                  ['clinicalTakeaway', 'Clinical takeaway *'],
                  ['materialsSetup', 'Materials/setup (optional)'],
                ] as const).map(([key, label]) => (
                  <PhiField
                    key={key}
                    fieldId={`step5_${id}_${key}`}
                    label={label}
                    value={extraction[key]}
                    ignored={!!state.phiIgnoredFields[`step5_${id}_${key}`]}
                    onToggleIgnore={(checked) =>
                      setState((prev) => ({
                        ...prev,
                        phiIgnoredFields: { ...prev.phiIgnoredFields, [`step5_${id}_${key}`]: checked },
                      }))
                    }
                    onWarning={onPhiWarning}
                  >
                    <label>
                      {label}
                      <textarea
                        value={extraction[key]}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            step5: {
                              extractions: {
                                ...prev.step5.extractions,
                                [id]: { ...prev.step5.extractions[id], [key]: e.target.value },
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </PhiField>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
};
