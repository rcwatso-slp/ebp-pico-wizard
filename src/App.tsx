import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProgressBar } from './components/ProgressBar';
import { ToastHost, type ToastItem } from './components/ToastHost';
import { clearState, getDefaultState, loadState, saveState } from './storage';
import { ExportView } from './ExportView';
import { Step0Welcome } from './steps/Step0Welcome';
import { Step1CaseSnapshot } from './steps/Step1CaseSnapshot';
import { Step2Pico } from './steps/Step2Pico';
import { Step3SearchPlan } from './steps/Step3SearchPlan';
import { Step4Screening } from './steps/Step4Screening';
import { Step5Extraction } from './steps/Step5Extraction';
import { Step6Plan } from './steps/Step6Plan';
import { completionByStep, getMaxUnlockedStep } from './validation';

const tips = (
  <div className="tips">
    <h3>Quick Tips</h3>
    <ul>
      <li>Keep all case details de-identified.</li>
      <li>Use concise, searchable intervention terms.</li>
      <li>Score consistently before selecting top studies.</li>
      <li>Tie goals directly to extracted findings.</li>
    </ul>
  </div>
);

const StepView: React.FC = () => {
  const [state, setState] = useState(loadState);
  const [saved, setSaved] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const navigate = useNavigate();

  const completion = useMemo(() => completionByStep(state), [state]);
  const maxUnlocked = useMemo(() => getMaxUnlockedStep(state), [state]);

  useEffect(() => {
    saveState(state);
    setSaved(true);
    const id = window.setTimeout(() => setSaved(false), 900);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (state.currentStep > maxUnlocked) {
      setState((prev) => ({ ...prev, currentStep: maxUnlocked }));
    }
  }, [maxUnlocked, state.currentStep]);

  const pushToast = (fieldId: string): void => {
    const item = { id: `${fieldId}_${Date.now()}`, message: 'Potential PHI pattern detected. Review highlighted field.' };
    setToasts((prev) => [...prev, item]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== item.id)), 2600);
  };

  const current = state.currentStep;
  const stepProps = { state, setState, onPhiWarning: pushToast };

  const canProceed = completion[current];

  const renderStep = (): React.ReactNode => {
    if (current === 0) return <Step0Welcome {...stepProps} />;
    if (current === 1) return <Step1CaseSnapshot {...stepProps} />;
    if (current === 2) return <Step2Pico {...stepProps} />;
    if (current === 3) return <Step3SearchPlan {...stepProps} />;
    if (current === 4) return <Step4Screening {...stepProps} />;
    if (current === 5) return <Step5Extraction {...stepProps} />;
    return <Step6Plan {...stepProps} />;
  };

  return (
    <>
      <ToastHost toasts={toasts} />
      <Routes>
        <Route
          path="/"
          element={
            <Layout tips={tips}>
              <header className="topBar">
                <h1>EBP Wizard: PICO → Elicit → Plan</h1>
                <div className="buttonRow">
                  <span className="saveState">{saved ? 'Saved ✓' : ''}</span>
                  <Link to="/export" className="linkBtn">
                    Export Preview
                  </Link>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      clearState();
                      setState(getDefaultState());
                      navigate('/');
                    }}
                  >
                    Reset
                  </button>
                </div>
              </header>

              <div className="phiBanner">Do not include PHI (names, DOB, addresses, MRNs, identifiable details).</div>

              <ProgressBar
                currentStep={state.currentStep}
                completed={completion}
                maxUnlocked={maxUnlocked}
                onJump={(index) => setState((prev) => ({ ...prev, currentStep: index }))}
              />

              {renderStep()}

              <footer className="navFooter">
                <span>
                  Step {state.currentStep} of 6
                </span>
                <div className="buttonRow">
                  <button
                    type="button"
                    className="ghost"
                    disabled={state.currentStep === 0}
                    onClick={() => setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={state.currentStep >= 6 || !canProceed}
                    onClick={() => setState((prev) => ({ ...prev, currentStep: Math.min(6, prev.currentStep + 1) }))}
                  >
                    {state.currentStep === 0 ? 'Start Step 1' : 'Next'}
                  </button>
                </div>
              </footer>
            </Layout>
          }
        />
        <Route path="/export" element={<ExportView state={state} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default StepView;
