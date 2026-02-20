import type { WizardData } from '../types';
import React from 'react';
import type { StepProps } from '../common';

export const Step0Welcome: React.FC<StepProps> = ({ state, setState }) => (
  <section>
    <h2>Step 0: Welcome & Rules</h2>
    <p className="muted">You must confirm both rules before starting the wizard.</p>
    <label className="checkRow">
      <input
        type="checkbox"
        checked={state.step0.noPhi}
        onChange={(e) =>
          setState((prev: WizardData) => ({
            ...prev,
            step0: { ...prev.step0, noPhi: e.target.checked },
          }))
        }
      />
      I will not enter PHI
    </label>
    <label className="checkRow">
      <input
        type="checkbox"
        checked={state.step0.verifySources}
        onChange={(e) =>
          setState((prev: WizardData) => ({
            ...prev,
            step0: { ...prev.step0, verifySources: e.target.checked },
          }))
        }
      />
      I will verify sources and not fabricate citations
    </label>
  </section>
);
