import React, { useState } from 'react';
import { PhiField } from '../components/PhiField';
import { buildCaseSnapshotText } from '../utils';
import type { StepProps } from '../common';

const joinKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

export const Step2Pico: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [keywordInput, setKeywordInput] = useState('');
  const b = state.step2.builder;

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

  const generatePrompt = (): void => {
    const snapshot = buildCaseSnapshotText(state);
    const prompt = [
      'You are helping an SLP student clinician refine an EBP search plan.',
      `Case snapshot: ${snapshot}`,
      `Draft PICO parts: P=${b.p}; I=${b.i}; C=${b.c || 'none'}; O=${b.o}.`,
      'Task: generate and rank 3 high-quality PICO questions.',
      'For each candidate, provide P/I/C/O breakdown, rationale, and 6-10 synonyms per P/I/O for searching Elicit and databases.',
      'Flag feasibility and searchability tradeoffs for student clinic constraints.',
    ].join('\n');

    setState((prev) => ({ ...prev, step2: { ...prev.step2, prompt } }));
  };

  return (
    <section>
      <h2>Step 2: PICO Builder</h2>
      <div className="formGrid two">
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
            <input
              value={b.p}
              onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, p: e.target.value } } }))}
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
            <input
              value={b.i}
              onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, i: e.target.value } } }))}
            />
          </label>
        </PhiField>

        <label>
          C (Comparison, optional)
          <input
            value={b.c}
            onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, c: e.target.value } } }))}
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
            <input
              value={b.o}
              onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, o: e.target.value } } }))}
            />
          </label>
        </PhiField>

        <label>
          Measurement
          <input
            value={b.measurement}
            onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, measurement: e.target.value } } }))}
          />
        </label>

        <label>
          Timeframe
          <input
            value={b.timeframe}
            onChange={(e) => setState((prev) => ({ ...prev, step2: { ...prev.step2, builder: { ...prev.step2.builder, timeframe: e.target.value } } }))}
          />
        </label>
      </div>

      <div className="buttonRow">
        <button type="button" onClick={createCandidates}>
          Create 3 candidate PICO questions
        </button>
        <button type="button" className="ghost" onClick={generatePrompt}>
          Generate ChatGPT Prompt
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

      {state.step2.prompt && (
        <label>
          ChatGPT prompt (copy/paste)
          <textarea readOnly value={state.step2.prompt} />
        </label>
      )}
    </section>
  );
};
