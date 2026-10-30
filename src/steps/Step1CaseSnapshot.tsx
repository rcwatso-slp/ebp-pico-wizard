import React from 'react';
import { PhiField } from '../components/PhiField';
import type { AssessmentAnchor, CaseSnapshot, Concern, ConstraintKey, Setting, Severity, WizardData } from '../types';
import {
  ageGroupFromAge,
  buildCaseSnapshotText,
  concernGroups,
  concernOptions,
  constraintOptions,
  severityOptions,
  suggestedPopulation,
} from '../utils';
import type { StepProps } from '../common';

const settingOptions = ['University clinic', 'School', 'Outpatient', 'SNF/Rehab', 'Telepractice', 'Other'] as const;

interface SectionHeadProps {
  number: number;
  title: string;
  feeds: string;
  why: string;
}

// Each section names the part of the PICO question (or later step) it feeds, so students see how the steps stack.
const SectionHead: React.FC<SectionHeadProps> = ({ number, title, feeds, why }) => (
  <div className="sectionHead">
    <div className="sectionTitleRow">
      <h3>
        <span className="sectionNum">{number}</span>
        {title}
      </h3>
      <span className="feedsTag">Feeds: {feeds}</span>
    </div>
    <p className="muted tiny">{why}</p>
  </div>
);

export const Step1CaseSnapshot: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const cs = state.caseSnapshot;

  const update = (patch: Partial<CaseSnapshot>): void =>
    setState((prev: WizardData) => ({ ...prev, caseSnapshot: { ...prev.caseSnapshot, ...patch } }));

  const ignorePhi = (fieldId: string) => (checked: boolean) =>
    setState((prev: WizardData) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, [fieldId]: checked } }));

  const setPrimary = (value: Concern | ''): void =>
    setState((prev: WizardData) => ({
      ...prev,
      caseSnapshot: {
        ...prev.caseSnapshot,
        primaryConcern: value,
        // An area can't be both primary and co-occurring.
        concerns: prev.caseSnapshot.concerns.filter((c) => c !== value),
      },
    }));

  const toggleCoOccurring = (value: Concern): void =>
    setState((prev: WizardData) => ({
      ...prev,
      caseSnapshot: {
        ...prev.caseSnapshot,
        concerns: prev.caseSnapshot.concerns.includes(value)
          ? prev.caseSnapshot.concerns.filter((c) => c !== value)
          : [...prev.caseSnapshot.concerns, value],
      },
    }));

  const toggleConstraint = (value: ConstraintKey): void =>
    update({
      constraints: cs.constraints.includes(value) ? cs.constraints.filter((c) => c !== value) : [...cs.constraints, value],
    });

  const updateAnchor = (id: string, patch: Partial<AssessmentAnchor>): void =>
    setState((prev: WizardData) => ({
      ...prev,
      caseSnapshot: {
        ...prev.caseSnapshot,
        assessmentAnchors: prev.caseSnapshot.assessmentAnchors.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      },
    }));

  const usesOther = cs.primaryConcern === 'other' || cs.concerns.includes('other');
  const population = suggestedPopulation(cs);

  return (
    <section>
      <h2>Step 1: Case Snapshot</h2>
      <p className="muted">
        Describe your client in a way that leads to a focused clinical question. Each section below feeds a part of your PICO question in Step 2.
      </p>

      <article className="card">
        <SectionHead
          number={1}
          title="Who is the client?"
          feeds="P (Population)"
          why="Age, disorder area, and severity decide which studies match your client."
        />
        <div className="formGrid two">
          <label>
            Age *
            <input
              type="number"
              min={0}
              value={cs.age}
              onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : '' })}
            />
            {cs.age !== '' ? <span className="fieldHint">Age group: {ageGroupFromAge(cs.age)}</span> : null}
          </label>
          <label>
            Setting *
            <select value={cs.setting} onChange={(e) => update({ setting: e.target.value as Setting })}>
              <option value="">Select</option>
              {settingOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Primary disorder area *
          <span className="fieldHint">The area this evidence question is about. You&rsquo;ll search for research on this.</span>
          <select value={cs.primaryConcern} onChange={(e) => setPrimary(e.target.value as Concern | '')}>
            <option value="">Select</option>
            {concernGroups.map((group) => (
              <optgroup key={group} label={group}>
                {concernOptions
                  .filter((o) => o.group === group)
                  .map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>Severity (if known)</legend>
          <div className="chipsWrap" role="radiogroup">
            {severityOptions.map((sev: Severity) => (
              <label key={sev} className={`chip ${cs.severity === sev ? 'selected' : ''}`}>
                <input type="radio" name="severity" checked={cs.severity === sev} onChange={() => update({ severity: sev })} />
                {sev}
              </label>
            ))}
          </div>
        </fieldset>

        <details className="coOccurring">
          <summary>
            Co-occurring areas (optional){cs.concerns.length ? ` · ${cs.concerns.length} selected` : ''}
          </summary>
          <p className="muted tiny">
            Other areas that may affect treatment, such as autism with a speech sound disorder. These give context but are not part of your search.
          </p>
          {concernGroups.map((group) => {
            const options = concernOptions.filter((o) => o.group === group && o.value !== cs.primaryConcern);
            if (!options.length) return null;
            return (
              <div key={group} className="chipGroup">
                <p className="chipGroupLabel">{group}</p>
                <div className="chipsWrap">
                  {options.map((o) => (
                    <label key={o.value} className={`chip ${cs.concerns.includes(o.value) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={cs.concerns.includes(o.value)} onChange={() => toggleCoOccurring(o.value)} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </details>

        {usesOther ? (
          <label>
            Describe the &ldquo;Other&rdquo; area *
            <input value={cs.otherConcern} placeholder="e.g., auditory processing" onChange={(e) => update({ otherConcern: e.target.value })} />
          </label>
        ) : null}

        {population ? (
          <p className="picoDraft">
            <span>P draft</span>
            {population}
          </p>
        ) : null}
      </article>

      <article className="card">
        <SectionHead
          number={2}
          title="What needs to change?"
          feeds="O (Outcome)"
          why="A specific, observable target leads to studies that measured that same outcome."
        />
        <PhiField
          fieldId="step1_functional_problem"
          label="Functional problem"
          value={cs.functionalProblem}
          ignored={!!state.phiIgnoredFields.step1_functional_problem}
          onToggleIgnore={ignorePhi('step1_functional_problem')}
          onWarning={onPhiWarning}
        >
          <label>
            Functional problem *
            <span className="fieldHint">What can&rsquo;t the client do yet, and where does it matter in daily life?</span>
            <textarea
              value={cs.functionalProblem}
              placeholder="e.g., Rarely asks for help or items at school, so needs go unmet and frustration leads to leaving the activity."
              onChange={(e) => update({ functionalProblem: e.target.value })}
            />
          </label>
        </PhiField>

        <PhiField
          fieldId="step1_treatment_target"
          label="Treatment target"
          value={cs.treatmentTarget}
          ignored={!!state.phiIgnoredFields.step1_treatment_target}
          onToggleIgnore={ignorePhi('step1_treatment_target')}
          onWarning={onPhiWarning}
        >
          <label>
            Treatment target *
            <span className="fieldHint">The specific skill or behavior therapy will change. This becomes your outcome (O).</span>
            <input
              value={cs.treatmentTarget}
              placeholder="e.g., spontaneous requesting"
              onChange={(e) => update({ treatmentTarget: e.target.value })}
            />
          </label>
        </PhiField>

        {cs.treatmentTarget.trim() ? (
          <p className="picoDraft">
            <span>O draft</span>
            {cs.treatmentTarget.trim()}
          </p>
        ) : null}
      </article>

      <article className="card">
        <SectionHead
          number={3}
          title="Assessment results (if completed)"
          feeds="P detail and goal baselines (Step 6)"
          why="Results confirm the need, refine the population, and give you a starting point for measuring progress."
        />
        {cs.assessmentAnchors.map((a, idx) => (
          <div className="anchorRow" key={a.id}>
            <label>
              Measure
              <input value={a.measure} placeholder="e.g., language sample" onChange={(e) => updateAnchor(a.id, { measure: e.target.value })} />
            </label>
            <label>
              Key finding
              <input
                value={a.finding}
                placeholder="e.g., 2 spontaneous requests in 20 minutes"
                onChange={(e) => updateAnchor(a.id, { finding: e.target.value })}
              />
            </label>
            {cs.assessmentAnchors.length > 1 ? (
              <button
                type="button"
                className="ghost small"
                aria-label={`Remove result ${idx + 1}`}
                onClick={() => update({ assessmentAnchors: cs.assessmentAnchors.filter((row) => row.id !== a.id) })}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="ghost small"
          onClick={() => update({ assessmentAnchors: [...cs.assessmentAnchors, { id: crypto.randomUUID(), measure: '', finding: '' }] })}
        >
          Add another result
        </button>
      </article>

      <article className="card">
        <SectionHead
          number={4}
          title="What will shape treatment choices?"
          feeds="I (Intervention) and feasibility scoring (Step 4)"
          why="An intervention only helps if it fits the client, family, and setting. Use this to judge which studies you could actually apply."
        />
        <fieldset>
          <legend>Constraints (select any that apply)</legend>
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
          label="Constraint notes"
          value={cs.constraintNotes}
          ignored={!!state.phiIgnoredFields.step1_constraints_notes}
          onToggleIgnore={ignorePhi('step1_constraints_notes')}
          onWarning={onPhiWarning}
        >
          <label>
            Constraint notes
            <textarea
              value={cs.constraintNotes}
              placeholder="e.g., Two 30-minute sessions per week; attention drops after about 10 minutes of table work."
              onChange={(e) => update({ constraintNotes: e.target.value })}
            />
          </label>
        </PhiField>

        <PhiField
          fieldId="step1_client_priorities"
          label="Client and family priorities"
          value={cs.clientPriorities}
          ignored={!!state.phiIgnoredFields.step1_client_priorities}
          onToggleIgnore={ignorePhi('step1_client_priorities')}
          onWarning={onPhiWarning}
        >
          <label>
            Client and family priorities
            <span className="fieldHint">What matters most to them? Client values are one of the three parts of EBP.</span>
            <textarea
              value={cs.clientPriorities}
              placeholder="e.g., Family wants the client to ask for help at school without an adult prompting."
              onChange={(e) => update({ clientPriorities: e.target.value })}
            />
          </label>
        </PhiField>
      </article>

      <h3>Case snapshot</h3>
      <p className="muted tiny">This summary is used in your prompts and your exported packet.</p>
      <p className="preview">{buildCaseSnapshotText(state)}</p>
    </section>
  );
};
