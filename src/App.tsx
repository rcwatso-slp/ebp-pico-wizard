import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProgressBar, stepLabels } from './components/ProgressBar';
import { StepGuide } from './components/StepGuide';
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
import { completionByStep, getMaxUnlockedStep, missingRequirements } from './validation';

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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.currentStep]);

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

  const missing = missingRequirements(state, current);

  const resetWizard = (): void => {
    const ok = window.confirm('Start over? This erases all of your work saved in this browser and cannot be undone.');
    if (!ok) return;
    clearState();
    setState(getDefaultState());
    navigate('/');
  };

  return (
    <>
      <ToastHost toasts={toasts} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <header className="appBar">
                <div className="appBarInner">
                  <div className="brand">
                    <span className="brandMark" aria-hidden="true">EBP</span>
                    <div>
                      <strong>EBP Wizard</strong>
                      <span className="brandSub">PICO &rarr; Search &rarr; Plan</span>
                    </div>
                  </div>
                  <div className="appBarActions">
                    <span className={`saveState ${saved ? 'flash' : ''}`} aria-live="polite">
                      {saved ? 'Saved' : 'Saved in this browser'}
                    </span>
                    <Link to="/export" className="linkBtn">
                      Export PDF
                    </Link>
                    <button type="button" className="danger" onClick={resetWizard}>
                      Start over
                    </button>
                  </div>
                </div>
              </header>

              <div className="pageShell">
                <div className="phiBanner">Do not include PHI: names, birth dates, addresses, record numbers, or other identifying details.</div>

                <ProgressBar
                  currentStep={state.currentStep}
                  completed={completion}
                  maxUnlocked={maxUnlocked}
                  onJump={(index) => setState((prev) => ({ ...prev, currentStep: index }))}
                />

                <Layout tips={<StepGuide step={current} />}>
                  {renderStep()}

                  <footer className="navFooter">
                    <div className="navStatus">
                      <strong>
                        Step {current} of 6 &middot; {stepLabels[current]}
                      </strong>
                      {missing.length ? (
                        <ul className="navMissing" aria-label="Still needed to continue">
                          {/* Keep the sticky footer short; the full list is in each section. */}
                          {missing.slice(0, 3).map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                          {missing.length > 3 ? <li className="more">and {missing.length - 3} more</li> : null}
                        </ul>
                      ) : (
                        <div className="navReady">{current === 6 ? 'Plan complete: ready to export' : 'Ready for the next step'}</div>
                      )}
                    </div>
                    <div className="buttonRow">
                      <button
                        type="button"
                        className="ghost"
                        disabled={current === 0}
                        onClick={() => setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      >
                        Back
                      </button>
                      {current === 6 ? (
                        <Link to="/export" className={`linkBtn ${canProceed ? 'primaryLink' : ''}`}>
                          Preview &amp; export
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={!canProceed}
                          onClick={() => setState((prev) => ({ ...prev, currentStep: Math.min(6, prev.currentStep + 1) }))}
                        >
                          {current === 0 ? 'Start Step 1' : 'Next'}
                        </button>
                      )}
                    </div>
                  </footer>
                </Layout>
              </div>
            </>
          }
        />
        <Route path="/export" element={<ExportView state={state} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default StepView;
