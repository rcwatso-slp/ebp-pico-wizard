import React, { useState } from 'react';
import { PhiField } from '../components/PhiField';
import { buildCaseSnapshotText, suggestedPopulation } from '../utils';
import type { StepProps } from '../common';

const joinKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

export const Step2Pico: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [copied, setCopied] = useState(false);
  const b = state.step2.builder;
  const draftP = suggestedPopulation(state.caseSnapshot);
  const draftO = state.caseSnapshot.treatmentTarget.trim();
  const draftsApplied = b.p === draftP && b.o === draftO;

  const setBuilder = (patch: Partial<typeof b>): void =>
    setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, ...patch } } }));

  const buildQuestion = (variant: number): string => {
    const comparator = b.c ? ` compared with ${b.c}` : '';
    const base = `For ${b.p || '[Population]'}, does ${b.i || '[Intervention]'}${comparator} improve ${b.o || '[Outcome]'}`;
    if (variant === 1) return `${base}${b.measurement ? ` as measured by ${b.measurement}` : ''}${b.timeframe ? ` over ${b.timeframe}` : ''}?`;
    if (variant === 2) return `${base} in routine SLP treatment${b.timeframe ? ` within ${b.timeframe}` : ''}?`;
    return `${base} for functional gains${b.measurement ? ` on ${b.measurement}` : ''}?`;
  };

  const createCandidates = (): void => {
    const candidates = [1, 2, 3].map((variant) => ({
      id: crypto.randomUUID(),
      question: buildQuestion(variant),
      p: b.p,
      i: b.i,
      c: b.c,
      o: b.o,
      feasibility: 3,
      searchability: 3,
    }));
    setState((prev) => ({ ...prev, step2: { ...prev.step2, candidates } }));
  };

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
          fit your client and are searchable. Paste the comma-separated search terms it gives you into the Keywords box below.
        </p>
        <textarea readOnly value={aiPrompt} rows={10} aria-label="Generative AI prompt" />
        <button type="button" className="ghost small" onClick={() => void copyPrompt()}>
          {copied ? 'Copied \u2713' : 'Copy prompt'}
        </button>
      </details>

      <div className="buttonRow">
        <button type="button" onClick={createCandidates}>
          Create 3 candidate PICO questions
        </button>
      </div>

      {state.step2.candidates.map((c) => (
        <article key={c.id} className="card">
          <h3>{c.question}</h3>
          <p>P: {c.p || '-'}</p>
          <p>I: {c.i || '-'}</p>
          <p>C: {c.c || '-'}</p>
          <p>O: {c.o || '-'}</p>
          <div className="formGrid two compact">
            <label>
              Feasibility ({c.feasibility})
              <input
                type="range"
                min={1}
                max={5}
                value={c.feasibility}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    step2: {
                      ...prev.step2,
                      candidates: prev.step2.candidates.map((row) =>
                        row.id === c.id ? { ...row, feasibility: Number(e.target.value) } : row,
                      ),
                    },
                  }))
                }
              />
            </label>
            <label>
              Searchability ({c.searchability})
              <input
                type="range"
                min={1}
                max={5}
                value={c.searchability}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    step2: {
                      ...prev.step2,
                      candidates: prev.step2.candidates.map((row) =>
                        row.id === c.id ? { ...row, searchability: Number(e.target.value) } : row,
                      ),
                    },
                  }))
                }
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                step2: { ...prev.step2, finalPico: c.question, picoLocked: false },
              }))
            }
          >
            Select this PICO
          </button>
        </article>
      ))}

      <PhiField
        fieldId="step2_final_pico"
        label="Final PICO"
        value={state.step2.finalPico}
        ignored={!!state.phiIgnoredFields.step2_final_pico}
        onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, step2_final_pico: checked } }))}
        onWarning={onPhiWarning}
      >
        <label>
          Final locked PICO question *
          <textarea
            value={state.step2.finalPico}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                step2: { ...prev.step2, finalPico: e.target.value, picoLocked: false },
              }))
            }
          />
        </label>
      </PhiField>
      <button
        type="button"
        onClick={() =>
          setState((prev) => ({
            ...prev,
            step2: { ...prev.step2, picoLocked: prev.step2.finalPico.trim().length > 0 },
          }))
        }
      >
        {state.step2.picoLocked ? 'PICO Locked ✓' : 'Lock PICO'}
      </button>

      <h3>Keywords (at least 10)</h3>
      <div className="chipsEditor">
        <input value={keywordInput} placeholder="Add comma-separated terms" onChange={(e) => setKeywordInput(e.target.value)} />
        <button
          type="button"
          onClick={() => {
            const incoming = joinKeywords(keywordInput);
            if (!incoming.length) return;
            setState((prev) => ({
              ...prev,
              step2: {
                ...prev.step2,
                keywords: Array.from(new Set([...prev.step2.keywords, ...incoming])),
              },
            }));
            setKeywordInput('');
          }}
        >
          Add keywords
        </button>
      </div>
      <div className="chipsWrap">
        {state.step2.keywords.map((k) => (
          <button
            type="button"
            className="chip selected"
            key={k}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                step2: { ...prev.step2, keywords: prev.step2.keywords.filter((item) => item !== k) },
              }))
            }
          >
            {k} ×
          </button>
        ))}
      </div>
    </section>
  );
};
