import type { WizardData } from '../types';
import React from 'react';
import type { StepProps } from '../common';

const rules = [
  {
    key: 'noPhi',
    title: 'I will not enter PHI',
    detail: 'Describe the client in de-identified terms only. No names, birth dates, school or facility names, or record numbers.',
  },
  {
    key: 'verifySources',
    title: 'I will verify sources and not fabricate citations',
    detail: 'AI tools can invent or misstate studies. I will open and read every article I list or cite.',
  },
] as const;

export const Step0Welcome: React.FC<StepProps> = ({ state, setState }) => (
  <section>
    <h2>Welcome</h2>
    <p className="welcomeLead">
      This wizard walks you from a client&rsquo;s functional need to a therapy plan backed by research. You&rsquo;ll build a PICO
      question, search for evidence, score and summarize the best studies, and write goals you can defend. Your work saves in
      this browser as you go, and you can export it as a PDF at any time.
    </p>

    <h3>Before you start</h3>
    <div className="agreeList">
      {rules.map((rule) => {
        const checked = state.step0[rule.key];
        return (
          <label key={rule.key} className={`agreeCard ${checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                setState((prev: WizardData) => ({
                  ...prev,
                  step0: { ...prev.step0, [rule.key]: e.target.checked },
                }))
              }
            />
            <div>
              <strong>{rule.title}</strong>
              <span>{rule.detail}</span>
            </div>
          </label>
        );
      })}
    </div>
  </section>
);
