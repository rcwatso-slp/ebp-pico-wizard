import React, { useState } from 'react';
import { PhiField } from '../components/PhiField';
import { KeywordColumns } from '../components/KeywordColumns';
import { conceptKeys, seedKeywordColumns, uniqueTerms, withKeywordColumns, type ConceptKey } from '../searchTerms';
import type { QuestionChecks } from '../types';
import { buildCaseSnapshotText, suggestedPopulation } from '../utils';
import type { StepProps } from '../common';

const GENERIC_INTERVENTIONS = /^(speech|language|speech[- ]language)?\s*(therapy|treatment|intervention|services)$/i;

const selfChecks: { key: keyof QuestionChecks; title: string; detail: string }[] = [
  {
    key: 'searchable',
    title: 'Searchable',
    detail: 'I expect there is published research on this intervention with this population.',
  },
  {
    key: 'feasible',
    title: 'Feasible',
    detail: 'I could deliver this intervention in my setting, given the constraints from Step 1.',
  },
  {
    key: 'relevant',
    title: 'Relevant',
    detail: 'The answer would change what I do with this client.',
  },
];

export const Step2Pico: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [copied, setCopied] = useState(false);
  const b = state.step2.builder;
  const draftP = suggestedPopulation(state.caseSnapshot);
  const draftO = state.caseSnapshot.treatmentTarget.trim();
  const draftsApplied = b.p === draftP && b.o === draftO;

  const setBuilder = (patch: Partial<typeof b>): void =>
    setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, ...patch } } }));

  const assembled =
    b.p && b.i && b.o
      ? `For ${b.p}, does ${b.i}${b.c ? `, compared with ${b.c},` : ''} improve ${b.o}${b.measurement ? `, as measured by ${b.measurement}` : ''}${
          b.timeframe ? `, over ${b.timeframe}` : ''
        }?`
      : '';

  const setFinal = (finalPico: string): void =>
    setState((prev) => ({
      ...prev,
      step2: { ...prev.step2, finalPico },
      step3: { ...prev.step3, queries: { ...prev.step3.queries, fullPico: finalPico } },
    }));

  const setCheck = (key: keyof QuestionChecks, value: boolean): void =>
    setState((prev) => ({ ...prev, step2: { ...prev.step2, questionChecks: { ...prev.step2.questionChecks, [key]: value } } }));

  const target = state.caseSnapshot.treatmentTarget.trim().toLowerCase();
  const outcome = b.o.trim().toLowerCase();
  const autoChecks = [
    { ok: !!b.p.trim(), text: 'Population describes who the client is (age group, disorder, severity).' },
    {
      ok: !!b.i.trim() && !GENERIC_INTERVENTIONS.test(b.i.trim()),
      text: b.i.trim() && GENERIC_INTERVENTIONS.test(b.i.trim()) ? '\u201cTherapy\u201d is too general. Name a specific approach.' : 'Intervention names a specific approach.',
    },
    { ok: !!outcome, text: 'Outcome names a measurable change.' },
    {
      ok: !target || (!!outcome && (outcome.includes(target) || target.includes(outcome))),
      text: target
        ? `Outcome matches your Step 1 treatment target (\u201c${state.caseSnapshot.treatmentTarget.trim()}\u201d). If you changed it on purpose, that\u2019s fine.`
        : 'Outcome matches your treatment target.',
    },
  ];

  const columns = state.step3.keywordColumns;
  const columnsEmpty = conceptKeys.every((k) => !columns[k].length);
  const seeds = seedKeywordColumns(state);
  const hasSeeds = conceptKeys.some((k) => seeds[k].length);
  const sorted = new Set(conceptKeys.flatMap((k) => columns[k]).map((t) => t.toLowerCase()));
  const unsortedKeywords = state.step2.keywords.filter((k) => !sorted.has(k.toLowerCase()));

  const placeKeyword = (term: string, key: ConceptKey): void =>
    setState((prev) => withKeywordColumns(prev, { ...prev.step3.keywordColumns, [key]: uniqueTerms([...prev.step3.keywordColumns[key], term]) }));

  const aiPrompt = [
    'You are helping a graduate student clinician in speech-language pathology write a focused, searchable PICO question for an evidence-based practice search.',
    '',
    `Case (de-identified): ${buildCaseSnapshotText(state)}`,
    '',
    'My draft PICO:',
    `- P (Population): ${b.p || 'not written yet'}`,
    `- I (Intervention): ${b.i || 'not written yet'}`,
    `- C (Comparison): ${b.c || 'none'}`,
    `- O (Outcome): ${b.o || 'not written yet'}`,
    b.measurement ? `- Measured by: ${b.measurement}` : '',
    b.timeframe ? `- Timeframe: ${b.timeframe}` : '',
    '',
    'Please:',
    '1. Suggest 3 PICO questions that fit this case, from most to least focused. For each, list P, I, C (or "none"), and O, and explain in one sentence why it fits.',
    '2. Point out anything in my draft that is too broad, too narrow, or hard to measure, and suggest a fix.',
    '3. For Population, Intervention, and Outcome, list 6-10 search terms each (synonyms, abbreviations, alternate spellings) as comma-separated lists I can paste into a search tool.',
    '4. Do not name or cite specific studies. I will search the literature myself.',
  ]
    .filter((line, idx, arr) => line !== '' || arr[idx - 1] !== '')
    .join('\n');

  const copyPrompt = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the prompt is still selectable in the box.
    }
  };

  return (
    <section>
      <h2>Step 2: PICO Builder</h2>

      {draftP || draftO ? (
        <div className="card fromStep1">
          <h3>From your case snapshot</h3>
          <p className="muted tiny">Start from these drafts, then make them specific enough to search.</p>
          {draftP ? (
            <p className="picoDraft">
              <span>P draft</span>
              {draftP}
            </p>
          ) : null}
          {draftO ? (
            <p className="picoDraft">
              <span>O draft</span>
              {draftO}
            </p>
          ) : null}
          <button
            type="button"
            className="ghost small"
            disabled={draftsApplied}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                step2: {
                  ...prev.step2,
                  builder: { ...prev.step2.builder, p: draftP || prev.step2.builder.p, o: draftO || prev.step2.builder.o },
                },
              }))
            }
          >
            {draftsApplied ? 'Drafts in use \u2713' : 'Use these drafts for P and O'}
          </button>
        </div>
      ) : null}
      <article className="card">
        <h3>Build your PICO</h3>
        <div className="formGrid one">
          <PhiField
            fieldId="step2_p"
            label="P"
            value={b.p}
            ignored={!!state.phiIgnoredFields.step2_p}
            onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step2_p: checked } }))}
            onWarning={onPhiWarning}
          >
            <label>
              P (Population) *
              <span className="fieldHint">Age group, disorder, and severity. Specific enough to match your client, broad enough that studies exist.</span>
              <input
                value={b.p}
                placeholder="e.g., school-age children with autism"
                onChange={(e) => setBuilder({ p: e.target.value })}
              />
            </label>
          </PhiField>

          <PhiField
            fieldId="step2_i"
            label="I"
            value={b.i}
            ignored={!!state.phiIgnoredFields.step2_i}
            onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step2_i: checked } }))}
            onWarning={onPhiWarning}
          >
            <label>
              I (Intervention) *
              <span className="fieldHint">A named treatment approach you are considering, not just &ldquo;therapy.&rdquo;</span>
              <input
                value={b.i}
                placeholder="e.g., naturalistic developmental behavioral intervention (NDBI)"
                onChange={(e) => setBuilder({ i: e.target.value })}
              />
            </label>
          </PhiField>

          <label>
            C (Comparison, optional)
            <span className="fieldHint">
              What you would compare the intervention to: another treatment, usual care, or no treatment. Leave it blank if you only want to
              know whether the intervention works. Many SLP questions have no comparison, and C is not added to your search terms.
            </span>
            <input
              value={b.c}
              placeholder="e.g., discrete trial training, or no treatment"
              onChange={(e) => setBuilder({ c: e.target.value })}
            />
          </label>

          <PhiField
            fieldId="step2_o"
            label="O"
            value={b.o}
            ignored={!!state.phiIgnoredFields.step2_o}
            onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step2_o: checked } }))}
            onWarning={onPhiWarning}
          >
            <label>
              O (Outcome) *
              <span className="fieldHint">The specific, measurable change you want. Usually your Step 1 treatment target.</span>
              <input value={b.o} placeholder="e.g., spontaneous requesting" onChange={(e) => setBuilder({ o: e.target.value })} />
            </label>
          </PhiField>

        </div>
        <div className="formGrid two">
          <label>
            Measurement (optional)
            <span className="fieldHint">How you would measure the outcome. Helps you spot studies that used similar measures.</span>
            <input
              value={b.measurement}
              placeholder="e.g., spontaneous requests in a 20-minute play sample"
              onChange={(e) => setBuilder({ measurement: e.target.value })}
            />
          </label>

          <label>
            Timeframe (optional)
            <span className="fieldHint">How long treatment would run (the T in PICOT). Usually left out of the search itself.</span>
            <input value={b.timeframe} placeholder="e.g., 12 weeks" onChange={(e) => setBuilder({ timeframe: e.target.value })} />
          </label>
        </div>
      </article>

      <details className="card aiHelper">
        <summary>
          <strong>Optional: brainstorm with generative AI</strong>
          <span className="muted tiny">Get suggested PICO questions and search terms</span>
        </summary>
        <p className="muted tiny">
          Copy this prompt into any generative AI tool you are allowed to use, such as ChatGPT, Claude, Gemini, or Copilot. It is built
          from your case and draft above, and updates as you edit. Using AI to draft is fine; your job is to judge whether its suggestions
          fit your client and are searchable. Paste each list of search terms it gives you into the matching column under Search terms by concept.
        </p>
        <textarea readOnly value={aiPrompt} rows={10} aria-label="Generative AI prompt" />
        <button type="button" className="ghost small" onClick={() => void copyPrompt()}>
          {copied ? 'Copied \u2713' : 'Copy prompt'}
        </button>
      </details>

      <article className="card">
        <h3>Write your question</h3>
        {assembled ? (
          <>
            <p className="fieldHint">Your PICO parts as one question:</p>
            <p className="picoDraft">
              <span>Draft</span>
              {assembled}
            </p>
            <button type="button" className="ghost small" disabled={state.step2.finalPico === assembled} onClick={() => setFinal(assembled)}>
              {state.step2.finalPico === assembled ? 'Using this wording \u2713' : 'Use this wording'}
            </button>
          </>
        ) : (
          <p className="muted tiny">Fill in P, I, and O above to see them assembled into a question.</p>
        )}
        <PhiField
          fieldId="step2_final_pico"
          label="PICO question"
          value={state.step2.finalPico}
          ignored={!!state.phiIgnoredFields.step2_final_pico}
          onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step2_final_pico: checked } }))}
          onWarning={onPhiWarning}
        >
          <label className="spaced">
            Your PICO question *
            <span className="fieldHint">Edit the wording so it reads naturally, or paste a question from the AI helper.</span>
            <textarea value={state.step2.finalPico} onChange={(e) => setFinal(e.target.value)} />
          </label>
        </PhiField>
      </article>

      <article className="card">
        <h3>Check your question</h3>
        <ul className="autoChecks">
          {autoChecks.map((c) => (
            <li key={c.text} className={c.ok ? 'ok' : 'todo'}>
              {c.text}
            </li>
          ))}
        </ul>
        <p className="fieldHint">Then confirm each of these yourself *</p>
        <div className="agreeList compact">
          {selfChecks.map((c) => {
            const checked = state.step2.questionChecks[c.key];
            return (
              <label key={c.key} className={`agreeCard ${checked ? 'checked' : ''}`}>
                <input type="checkbox" checked={checked} onChange={(e) => setCheck(c.key, e.target.checked)} />
                <div>
                  <strong>{c.title}</strong>
                  <span>{c.detail}</span>
                </div>
              </label>
            );
          })}
        </div>
      </article>

      <article className="card">
        <h3>Search terms by concept</h3>
        <p className="fieldHint">
          Researchers describe the same idea in different ways. Add at least 3 short terms (1&ndash;3 words) for each concept: synonyms,
          abbreviations, and related names. You can paste a comma-separated list, such as one from the AI helper. These become your
          searches in Step 3.
        </p>

        {columnsEmpty && hasSeeds ? (
          <button
            type="button"
            className="ghost small"
            onClick={() => setState((prev) => withKeywordColumns(prev, seedKeywordColumns(prev)))}
          >
            Start with terms from my PICO
          </button>
        ) : null}

        {unsortedKeywords.length ? (
          <div className="sortBox">
            <p className="fieldHint">Your earlier keywords: click P, I, or O to place each one in a concept.</p>
            <ul className="sortList">
              {unsortedKeywords.map((k) => (
                <li key={k} className="sortItem">
                  <span>{k}</span>
                  {conceptKeys.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className="ghost small"
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

        <KeywordColumns state={state} setState={setState} />
      </article>
    </section>
  );
};
