import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  completed: boolean[];
  maxUnlocked: number;
  onJump: (index: number) => void;
}

export const stepLabels = ['Welcome', 'Case', 'PICO', 'Search', 'Appraise', 'Extract', 'Plan'];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, completed, maxUnlocked, onJump }) => (
  <nav className="stepper" aria-label="Wizard steps">
    <ol>
      {stepLabels.map((label, idx) => {
        const isLocked = idx > maxUnlocked;
        return (
          <li key={label} className={`${idx === currentStep ? 'active' : ''} ${completed[idx] ? 'done' : ''}`}>
            <button
              type="button"
              className="stepBtn"
              disabled={isLocked}
              aria-current={idx === currentStep ? 'step' : undefined}
              aria-label={`Step ${idx}: ${label}${completed[idx] ? ' (complete)' : ''}${isLocked ? ' (locked)' : ''}`}
              title={isLocked ? 'Finish the earlier steps to unlock' : undefined}
              onClick={() => onJump(idx)}
            >
              <span className="stepDot">{completed[idx] ? '✓' : idx}</span>
              <span className="stepLabel">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
    <p className="stepperCaption">
      Step {currentStep} of 6 &middot; {stepLabels[currentStep]}
    </p>
  </nav>
);
