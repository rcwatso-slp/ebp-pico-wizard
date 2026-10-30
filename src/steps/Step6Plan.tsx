import React from 'react';
import { appraisalFor, designInfo, qualitySummary, topArticleIds } from '../appraisal';
import { PhiField } from '../components/PhiField';
import { directionLabels, dosageText, extractionFor, findingLabels } from '../extraction';
import type { StepProps } from '../common';
import type { GoalTemplate, Step6State, WizardData } from '../types';
import { goalIssues, goalToText } from '../utils';

const goalFields = [
  ['behavior', 'Behavior: what the client will do', 'e.g., spontaneously request help or a preferred item'],
  ['condition', 'Condition: in what situation, with what support', 'e.g., during play routines, given a 5-second expectant pause'],
  ['criterion', 'Criterion: how accurately or how often', 'e.g., in 4 of 5 opportunities across 3 sessions'],
  ['timeframe', 'Timeframe: by when', 'e.g., 12 weeks'],
] as const;

const sessionStructures = ['1:1 direct therapy', 'small group', 'hybrid direct + caregiver coaching', 'telepractice', 'other'];

const SectionHead: React.FC<{ n: number; title: string; from: string; why: string }> = ({ n, title, from, why }) => (
  <div className="sectionHead">
    <div className="sectionTitleRow">
      <h3>
        <span className="sectionNum">{n}</span>
        {title}
      </h3>
      <span className="feedsTag">Built from: {from}</span>
    </div>
    <p className="muted tiny">{why}</p>
  </div>
);

const levelText = (state: WizardData, id: string): string => {
  const d = designInfo(appraisalFor(state, id).design);
  const q = qualitySummary(appraisalFor(state, id));
  if (!d) return '';
  return `${d.level === 'Guideline' || d.level === 'Qualitative' ? d.level : `Level ${d.level}`}${q.rating ? `, ${q.rating.toLowerCase()}` : ''}`;
};

// What the student extracted in Step 5, shown beside the part of the plan it should inform.
const EvidencePanel: React.FC<{ state: WizardData; kind: 'methods' | 'monitoring' }> = ({ state, kind }) => {
  const ids = topArticleIds(state);
  if (!ids.length) return null;
  return (
    <details className="evidencePanel" open>
      <summary>What your evidence says</summary>
      <ul>
        {ids.map((id, i) => {
          const a = state.step3.candidateArticles.find((x) => x.id === id);
          const e = extractionFor(state, id);
          return (
            <li key={id}>
              <strong>
                Study {i + 1}
                {levelText(state, id) ? ` (${levelText(state, id)})` : ''}:
              </strong>{' '}
              <span className="muted">{a?.title}</span>
              {kind === 'methods' ? (
                <>
                  <span className="evRow">
                    <em>Treatment:</em> {e.interventionComponents || '–'}
                  </span>
                  <span className="evRow">
                    <em>Dosage:</em> {dosageText(e) || '–'}
                  </span>
                  <span className="evRow">
                    <em>Your takeaway:</em> {e.clinicalTakeaway || '–'}
                  </span>
                </>
              ) : (
                <>
                  <span className="evRow">
                    <em>Measured:</em> {e.outcomeMeasures || '–'}
                  </span>
                  <span className="evRow">
                    <em>Results:</em> {e.results.direction ? directionLabels[e.results.direction] : '–'}; generalized:{' '}
                    {e.results.generalization ? findingLabels[e.results.generalization].toLowerCase() : '–'}; maintained:{' '}
                    {e.results.maintenance ? findingLabels[e.results.maintenance].toLowerCase() : '–'}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
};

export const Step6Plan: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const s6 = state.step6;
  const cs = state.caseSnapshot;
  const topIds = topArticleIds(state);

  const update = (patch: (s: Step6State) => Partial<Step6State>): void =>
    setState((prev) => ({ ...prev, step6: { ...prev.step6, ...patch(prev.step6) } }));

  const phi = (fieldId: string, label: string, value: string, children: React.ReactNode): React.ReactElement => (
    <PhiField
      fieldId={fieldId}
      label={label}
      value={value}
      ignored={!!state.phiIgnoredFields[fieldId]}
      onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, [fieldId]: checked } }))}
      onWarning={onPhiWarning}
    >
      {children}
    </PhiField>
  );

  const anchors = cs.assessmentAnchors.filter((a) => a.measure.trim() && a.finding.trim());
  const anchorText = anchors.map((a) => `${a.measure}: ${a.finding}`).join('; ');

  const goalEditor = (goal: GoalTemplate, onChange: (key: keyof GoalTemplate, value: string) => void): React.ReactNode => {
    const issues = goalIssues(goal);
    return (
      <>
        <div className="formGrid two">
          {goalFields.map(([key, label, hint]) => (
            <label key={key}>
              {label}
              <input placeholder={hint} value={goal[key]} onChange={(e) => onChange(key, e.target.value)} />
            </label>
          ))}
        </div>
        <p className="preview">{goalToText(goal)}</p>
        {issues.length ? (
          <ul className="autoChecks">
            {issues.map((issue) => (
              <li key={issue} className="todo">
                {issue}
              </li>
            ))}
          </ul>
        ) : null}
      </>
    );
  };

  const setMethod = (key: keyof Step6State['methodology'], value: string): void =>
    update((s) => ({ methodology: { ...s.methodology, [key]: value } }));
  const setMonitor = (key: keyof Step6State['progressMonitoring'], value: string): void =>
    update((s) => ({ progressMonitoring: { ...s.progressMonitoring, [key]: value } }));

  const selectedSources = s6.rationaleArticleIds.filter((id) => topIds.includes(id));

  return (
    <section>
      <h2>Step 6: Therapy Plan</h2>
      <p className="muted">
        Bring it together: your evidence, your clinical judgment, and your client&rsquo;s priorities. Each section shows what you found earlier,
        so your plan stays tied to the evidence.
      </p>

      <article className="card">
        <SectionHead
          n={1}
          title="Goals"
          from="treatment target (Step 1) and outcomes (Step 5)"
          why="A measurable goal names what the client will do, under what conditions, how well, and by when."
        />
        <div className="contextBox">
          <span>
            <strong>Treatment target:</strong> {cs.treatmentTarget || '–'}
          </span>
          <span>
            <strong>Functional problem:</strong> {cs.functionalProblem || '–'}
          </span>
        </div>

        {phi(
          'step6_baseline',
          'Baseline',
          s6.baseline,
          <label>
            Current level (baseline)
            <span className="fieldHint">Where the client is now on the target. Your goals and progress are measured against this.</span>
            <textarea
              rows={2}
              value={s6.baseline}
              placeholder="e.g., 2 spontaneous requests in a 20-minute play sample; most requests prompted"
              onChange={(e) => update(() => ({ baseline: e.target.value }))}
            />
          </label>,
        )}
        {anchorText && !s6.baseline.trim() ? (
          <button type="button" className="ghost small" onClick={() => update(() => ({ baseline: anchorText }))}>
            Use my Step 1 assessment results
          </button>
        ) : null}

        <h4 className="subHead">Long-term goal *</h4>
        {!s6.longTermGoal.behavior.trim() && cs.treatmentTarget.trim() ? (
          <button
            type="button"
            className="ghost small"
            onClick={() => update((s) => ({ longTermGoal: { ...s.longTermGoal, behavior: cs.treatmentTarget.trim() } }))}
          >
            Start from my treatment target
          </button>
        ) : null}
        {goalEditor(s6.longTermGoal, (key, value) => update((s) => ({ longTermGoal: { ...s.longTermGoal, [key]: value } })))}

        <div className="buttonRow">
          <h4 className="subHead">Short-term objectives (2&ndash;4) *</h4>
          <button
            type="button"
            className="ghost small"
            disabled={s6.shortTermObjectives.length >= 4}
            onClick={() =>
              update((s) => ({
                shortTermObjectives: [...s.shortTermObjectives, { id: crypto.randomUUID(), behavior: '', condition: '', criterion: '', timeframe: '' }],
              }))
            }
          >
            Add objective
          </button>
        </div>
        <p className="fieldHint">Smaller steps toward the long-term goal, such as more support at first, then less.</p>
        {s6.shortTermObjectives.map((goal, idx) => (
          <div className="card nested" key={goal.id}>
            <div className="buttonRow">
              <h4>Objective {idx + 1}</h4>
              <button
                type="button"
                className="ghost small"
                disabled={s6.shortTermObjectives.length <= 2}
                onClick={() => update((s) => ({ shortTermObjectives: s.shortTermObjectives.filter((row) => row.id !== goal.id) }))}
              >
                Remove
              </button>
            </div>
            {goalEditor(goal, (key, value) =>
              update((s) => ({ shortTermObjectives: s.shortTermObjectives.map((row) => (row.id === goal.id ? { ...row, [key]: value } : row)) })),
            )}
          </div>
        ))}
      </article>

      <article className="card">
        <SectionHead
          n={2}
          title="Treatment methods"
          from="treatment and dosage (Step 5)"
          why="Use what worked in the studies. Where you change something, say why; that is your clinical expertise at work."
        />
        <EvidencePanel state={state} kind="methods" />

        <label>
          Session structure *
          <select value={s6.methodology.sessionStructure} onChange={(e) => setMethod('sessionStructure', e.target.value)}>
            <option value="">Select</option>
            {sessionStructures.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <p className="fieldLabel">Planned dosage *</p>
        <p className="fieldHint">Compare with the studies above{cs.constraintNotes ? ` and your client’s schedule: ${cs.constraintNotes}` : ''}.</p>
        <div className="formGrid three">
          {(
            [
              ['sessionLength', 'Session length', 'e.g., 45 minutes'],
              ['frequency', 'Sessions per week', 'e.g., 2 per week'],
              ['duration', 'Total length', 'e.g., 12 weeks'],
            ] as const
          ).map(([key, label, ph]) => (
            <label key={key}>
              {label}
              <input
                value={s6.methodology.dosage[key]}
                placeholder={ph}
                onChange={(e) => update((s) => ({ methodology: { ...s.methodology, dosage: { ...s.methodology.dosage, [key]: e.target.value } } }))}
              />
            </label>
          ))}
        </div>

        {phi(
          'step6_cueing',
          'Cueing hierarchy',
          s6.methodology.cueingHierarchy,
          <label>
            Cueing hierarchy *
            <span className="fieldHint">The order of support you will give, and whether you move from most to least support or least to most.</span>
            <textarea
              rows={2}
              value={s6.methodology.cueingHierarchy}
              placeholder="e.g., Least to most: expectant pause, then gesture, then verbal model"
              onChange={(e) => setMethod('cueingHierarchy', e.target.value)}
            />
          </label>,
        )}
        <label>
          Feedback: type and how often *
          <span className="fieldHint">Specific feedback is often given more frequently early on and faded as accuracy improves.</span>
          <textarea
            rows={2}
            value={s6.methodology.feedbackTypeFrequency}
            placeholder="e.g., Natural consequence (gets the item) every time; specific praise early, then faded"
            onChange={(e) => setMethod('feedbackTypeFrequency', e.target.value)}
          />
        </label>
        <label>
          Materials *
          <textarea
            rows={2}
            value={s6.methodology.materialsList}
            placeholder="e.g., Preferred toys in clear bins, snack containers, visual schedule"
            onChange={(e) => setMethod('materialsList', e.target.value)}
          />
        </label>
        {phi(
          'step6_adaptations',
          'Adaptations',
          s6.methodology.adaptations,
          <label>
            How does your plan differ from the studies, and why?
            <span className="fieldHint">Leave blank if you are following the studies closely.</span>
            <textarea
              rows={2}
              value={s6.methodology.adaptations}
              placeholder="e.g., Studies used 30-minute sessions; we have 45 minutes, so I will add a 10-minute caregiver coaching segment."
              onChange={(e) => setMethod('adaptations', e.target.value)}
            />
          </label>,
        )}
      </article>

      <article className="card">
        <SectionHead
          n={3}
          title="Progress monitoring"
          from="outcome measures (Step 5)"
          why="Measure progress the way the studies did, so you can tell whether your client is responding the way their participants did."
        />
        <EvidencePanel state={state} kind="monitoring" />
        <div className="formGrid two">
          <label>
            What you will measure *
            <input
              value={s6.progressMonitoring.metric}
              placeholder="e.g., Spontaneous requests per 10-minute play sample"
              onChange={(e) => setMonitor('metric', e.target.value)}
            />
          </label>
          <label>
            How often you will probe *
            <input
              value={s6.progressMonitoring.probeSchedule}
              placeholder="e.g., Every second session; untreated items monthly"
              onChange={(e) => setMonitor('probeSchedule', e.target.value)}
            />
          </label>
        </div>
        <label>
          Mastery criteria *
          <input
            value={s6.progressMonitoring.masteryCriteria}
            placeholder="e.g., 4 of 5 opportunities across 3 consecutive sessions"
            onChange={(e) => setMonitor('masteryCriteria', e.target.value)}
          />
        </label>
        <label>
          If progress stalls, what will you change, and when? *
          <span className="fieldHint">A decision rule keeps you from continuing a plan that isn&rsquo;t working.</span>
          <textarea
            rows={2}
            value={s6.progressMonitoring.decisionRule}
            placeholder="e.g., If requests haven't increased after 6 sessions, add a visual cue and review the plan with my supervisor."
            onChange={(e) => setMonitor('decisionRule', e.target.value)}
          />
        </label>
      </article>

      <article className="card">
        <SectionHead
          n={4}
          title="Rationale"
          from="all steps"
          why="Evidence-based practice combines three things: research evidence, the client's and family's perspective, and your clinical expertise. Address each one."
        />

        <p className="fieldLabel">Research evidence: which studies support this plan? (at least 2) *</p>
        <div className="chipsWrap">
          {topIds.map((id, i) => {
            const a = state.step3.candidateArticles.find((x) => x.id === id);
            const selected = s6.rationaleArticleIds.includes(id);
            return (
              <label key={id} className={`chip ${selected ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) =>
                    update((s) => ({
                      rationaleArticleIds: e.target.checked ? [...s.rationaleArticleIds, id] : s.rationaleArticleIds.filter((x) => x !== id),
                    }))
                  }
                />
                Study {i + 1}: {a?.title}
              </label>
            );
          })}
        </div>
        {state.step5.synthesis ? <p className="compareNote spacedTop">Your evidence summary: {state.step5.synthesis}</p> : null}

        {phi(
          'step6_client_perspective',
          'Client and family perspective',
          s6.rationale.clientPerspective,
          <label className="spaced">
            Client and family perspective *
            <span className="fieldHint">
              How does this plan reflect what matters to them?{cs.clientPriorities ? ` Their priorities from Step 1: ${cs.clientPriorities}` : ''}
            </span>
            <textarea
              rows={2}
              value={s6.rationale.clientPerspective}
              placeholder="e.g., The family wants the client to ask for help at school, so goals use school-like routines and include caregiver coaching."
              onChange={(e) => update((s) => ({ rationale: { ...s.rationale, clientPerspective: e.target.value } }))}
            />
          </label>,
        )}
        {phi(
          'step6_clinical_judgment',
          'Clinical judgment',
          s6.rationale.clinicalJudgment,
          <label>
            Clinical judgment *
            <span className="fieldHint">Why is this the right plan for this client in this setting? Note anything the evidence doesn&rsquo;t cover.</span>
            <textarea
              rows={2}
              value={s6.rationale.clinicalJudgment}
              placeholder="e.g., Most study participants were younger, so I will watch closely for slower progress and adjust using my decision rule."
              onChange={(e) => update((s) => ({ rationale: { ...s.rationale, clinicalJudgment: e.target.value } }))}
            />
          </label>,
        )}
        {selectedSources.length ? (
          <p className="muted tiny">
            Citing: {selectedSources.map((id) => extractionFor(state, id).citation || state.step3.candidateArticles.find((a) => a.id === id)?.title).join(' | ')}
          </p>
        ) : null}
      </article>
    </section>
  );
};
