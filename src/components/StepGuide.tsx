import React from 'react';
import { stepGuides } from '../teaching';

interface StepGuideProps {
  step: number;
}

export const StepGuide: React.FC<StepGuideProps> = ({ step }) => {
  const guide = stepGuides[step];
  if (!guide) return null;

  return (
    <div className="guide">
      <p className="guideEyebrow">Step {step} guide</p>
      <h3>{guide.title}</h3>

      <h4>Why this step matters</h4>
      <p>{guide.why}</p>

      <h4>What to do</h4>
      <ol className="guideList">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      {guide.rubric ? (
        <details className="guideSection" open>
          <summary>Scoring rubric (0 / 1 / 2)</summary>
          {guide.rubric.map((row) => (
            <div key={row.criterion} className="rubricRow">
              <strong>{row.criterion}</strong>
              <dl>
                {row.levels.map((level, score) => (
                  <React.Fragment key={score}>
                    <dt>{score}</dt>
                    <dd>{level}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ))}
        </details>
      ) : null}

      {guide.examples.length ? (
        <details className="guideSection" open>
          <summary>Examples: weak vs. strong</summary>
          {guide.examples.map((ex) => (
            <div key={ex.label} className="example">
              <p className="exampleLabel">{ex.label}</p>
              <p className="exampleWeak">
                <span>Weak</span>
                {ex.weak}
              </p>
              <p className="exampleStrong">
                <span>Strong</span>
                {ex.strong}
              </p>
              <p className="muted tiny">{ex.why}</p>
            </div>
          ))}
        </details>
      ) : null}

      <details className="guideSection">
        <summary>Common pitfalls</summary>
        <ul className="guideList">
          {guide.pitfalls.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </details>

      <details className="guideSection">
        <summary>Before you click Next</summary>
        <ul className="guideList">
          {guide.selfCheck.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </details>
    </div>
  );
};
