import React from 'react';
import { PhiField } from '../components/PhiField';
import type { AssessmentAnchor, Concern, ConstraintKey, Setting, WizardData } from '../types';
import { ageGroupFromAge, buildCaseSnapshotText, concernGroups, concernLabel, concernOptions, constraintOptions } from '../utils';
import type { StepProps } from '../common';

const settingOptions = ['University clinic', 'School', 'Outpatient', 'SNF/Rehab', 'Telepractice', 'Other'] as const;

export const Step1CaseSnapshot: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const cs = state.caseSnapshot;
  const toggleConcern = (value: Concern): void => {
    setState((prev: WizardData) => ({
      ...prev,
      caseSnapshot: {
        ...prev.caseSnapshot,
        concerns: prev.caseSnapshot.concerns.includes(value)
          ? prev.caseSnapshot.concerns.filter((c: Concern) => c !== value)
          : [...prev.caseSnapshot.concerns, value],
        // The initial target must be one of the selected areas.
        initialTarget:
          prev.caseSnapshot.initialTarget === value && prev.caseSnapshot.concerns.includes(value) ? '' : prev.caseSnapshot.initialTarget,
      },
    }));
  };

  const toggleConstraint = (value: ConstraintKey): void => {
    setState((prev: WizardData) => ({
      ...prev,
      caseSnapshot: {
        ...prev.caseSnapshot,
        constraints: prev.caseSnapshot.constraints.includes(value)
          ? prev.caseSnapshot.constraints.filter((c: ConstraintKey) => c !== value)
          : [...prev.caseSnapshot.constraints, value],
      },
    }));
  };

  return (
    <section>
      <h2>Step 1: Case Snapshot</h2>
      <div className="formGrid two">
        <label>
          Setting *
          <select
            value={cs.setting}
            onChange={(e) =>
              setState((prev: WizardData) => ({
                ...prev,
                caseSnapshot: { ...prev.caseSnapshot, setting: e.target.value as Setting },
              }))
            }
          >
            <option value="">Select</option>
            {settingOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Age *
          <input
            type="number"
            min={0}
            value={cs.age}
            onChange={(e) =>
              setState((prev: WizardData) => ({
                ...prev,
                caseSnapshot: { ...prev.caseSnapshot, age: e.target.value ? Number(e.target.value) : '' },
              }))
            }
          />
        </label>
      </div>

      <p className="pill">Broad age group: {ageGroupFromAge(cs.age)}</p>

      <fieldset>
        <legend>Disorder areas / concerns * (select all that apply)</legend>
        {concernGroups.map((group) => (
          <div key={group} className="chipGroup">
            <p className="chipGroupLabel">{group}</p>
            <div className="chipsWrap">
              {concernOptions
                .filter((o) => o.group === group)
                .map((o) => (
                  <label key={o.value} className={`chip ${cs.concerns.includes(o.value) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={cs.concerns.includes(o.value)} onChange={() => toggleConcern(o.value)} />
                    {o.label}
                  </label>
                ))}
            </div>
          </div>
        ))}
      </fieldset>

      {cs.concerns.includes('other') ? (
        <label>
          Describe the other area *
          <input
            value={cs.otherConcern}
            placeholder="e.g., auditory processing"
            onChange={(e) =>
              setState((prev: WizardData) => ({
                ...prev,
                caseSnapshot: { ...prev.caseSnapshot, otherConcern: e.target.value },
              }))
            }
          />
        </label>
      ) : null}

      <PhiField
        fieldId="step1_functional_problem"
        label="Functional participation problem"
        value={cs.functionalProblem}
        ignored={!!state.phiIgnoredFields.step1_functional_problem}
        onToggleIgnore={(checked) =>
          setState((prev: WizardData) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step1_functional_problem: checked } }))
        }
        onWarning={onPhiWarning}
      >
        <label>
          Functional participation problem *
          <textarea
            value={cs.functionalProblem}
            onChange={(e) =>
              setState((prev: WizardData) => ({
                ...prev,
                caseSnapshot: { ...prev.caseSnapshot, functionalProblem: e.target.value },
              }))
            }
          />
        </label>
      </PhiField>

      <h3>Key assessment anchors (optional)</h3>
      {cs.assessmentAnchors.map((a, idx) => (
        <div className="formGrid two" key={a.id}>
          <label>
            Measure
            <input
              value={a.measure}
              onChange={(e) =>
                setState((prev: WizardData) => ({
                  ...prev,
                  caseSnapshot: {
                    ...prev.caseSnapshot,
                    assessmentAnchors: prev.caseSnapshot.assessmentAnchors.map((row: AssessmentAnchor) =>
                      row.id === a.id ? { ...row, measure: e.target.value } : row,
                    ),
                  },
                }))
              }
            />
          </label>
          <label>
            Key finding
            <input
              value={a.finding}
              onChange={(e) =>
                setState((prev: WizardData) => ({
                  ...prev,
                  caseSnapshot: {
                    ...prev.caseSnapshot,
                    assessmentAnchors: prev.caseSnapshot.assessmentAnchors.map((row: AssessmentAnchor) =>
                      row.id === a.id ? { ...row, finding: e.target.value } : row,
                    ),
                  },
                }))
              }
            />
          </label>
          {cs.assessmentAnchors.length > 1 && (
            <button
              type="button"
              className="ghost"
              onClick={() =>
                setState((prev: WizardData) => ({
                  ...prev,
                  caseSnapshot: {
                    ...prev.caseSnapshot,
                    assessmentAnchors: prev.caseSnapshot.assessmentAnchors.filter(
                      (row: AssessmentAnchor) => row.id !== a.id,
                    ),
                  },
                }))
              }
            >
              Remove row {idx + 1}
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="ghost"
        onClick={() =>
          setState((prev: WizardData) => ({
            ...prev,
            caseSnapshot: {
              ...prev.caseSnapshot,
              assessmentAnchors: [...prev.caseSnapshot.assessmentAnchors, { id: crypto.randomUUID(), measure: '', finding: '' }],
            },
          }))
        }
      >
        Add anchor row
      </button>

      <label>
        Initial target area *
        <select
          value={cs.initialTarget}
          disabled={!cs.concerns.length}
          onChange={(e) =>
            setState((prev: WizardData) => ({
              ...prev,
              caseSnapshot: { ...prev.caseSnapshot, initialTarget: e.target.value as Concern },
            }))
          }
        >
          <option value="">{cs.concerns.length ? 'Select the area to focus on first' : 'Select disorder areas above first'}</option>
          {concernOptions
            .filter((o) => cs.concerns.includes(o.value))
            .map((o) => (
              <option key={o.value} value={o.value}>
                {concernLabel(o.value, cs.otherConcern)}
              </option>
            ))}
        </select>
      </label>

      <fieldset>
        <legend>Constraints * (pick at least one)</legend>
        <div className="chipsWrap">
          {constraintOptions.map((c: ConstraintKey) => (
            <label key={c} className={`chip ${cs.constraints.includes(c) ? 'selected' : ''}`}>
              <input type="checkbox" checked={cs.constraints.includes(c)} onChange={() => toggleConstraint(c)} />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <PhiField
        fieldId="step1_constraints_notes"
        label="Constraints notes"
        value={cs.constraintNotes}
        ignored={!!state.phiIgnoredFields.step1_constraints_notes}
        onToggleIgnore={(checked) =>
          setState((prev: WizardData) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step1_constraints_notes: checked } }))
        }
        onWarning={onPhiWarning}
      >
        <label>
          Constraint notes (optional)
          <textarea
            value={cs.constraintNotes}
            onChange={(e) =>
              setState((prev: WizardData) => ({ ...prev, caseSnapshot: { ...prev.caseSnapshot, constraintNotes: e.target.value } }))
            }
          />
        </label>
      </PhiField>

      <h3>Case Snapshot (copy-ready)</h3>
      <p className="preview">{buildCaseSnapshotText(state)}</p>
    </section>
  );
};
