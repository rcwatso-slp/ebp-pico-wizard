import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  completed: boolean[];
  maxUnlocked: number;
  onJump: (index: number) => void;
}

const labels = ['Welcome', 'Case', 'PICO', 'Search', 'Screen', 'Extract', 'Plan'];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, completed, maxUnlocked, onJump }) => (
  <ol className="progressBar">
    {labels.map((label, idx) => {
      const isLocked = idx > maxUnlocked;
      return (
        <li key={label}>
          <button
            className={`progressStep ${idx === currentStep ? 'active' : ''} ${completed[idx] ? 'done' : ''}`}
            disabled={isLocked}
            onClick={() => onJump(idx)}
          >
            <span>{label}</span>
            <span>{completed[idx] ? '✓' : idx}</span>
          </button>
        </li>
      );
    })}
  </ol>
);
