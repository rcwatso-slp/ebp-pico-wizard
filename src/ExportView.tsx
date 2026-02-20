import React from 'react';
import type { WizardData } from './types';
import { buildCaseSnapshotText, getScoreTotal, goalToText, orderedArticles } from './utils';

interface ExportViewProps {
  state: WizardData;
}

export const ExportView: React.FC<ExportViewProps> = ({ state }) => {
  const ordered = orderedArticles(state.step3.candidateArticles, state.step4.scores, true);
  const topIds = Object.values(state.step4.scores)
    .filter((s) => s.includeTop)
    .map((s) => s.articleId);

  return (
    <div className="exportPage">
      <header className="exportHeader noPrintBreak">
        <h1>EBP Packet</h1>
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </header>

      <section className="exportSection">
        <h2>Case Snapshot</h2>
        <p>{buildCaseSnapshotText(state)}</p>
      </section>

      <section className="exportSection">
        <h2>Final PICO</h2>
        <p>{state.step2.finalPico}</p>
      </section>

      <section className="exportSection">
        <h2>Keywords + Elicit Queries</h2>
        <p><strong>Keywords:</strong> {state.step2.keywords.join(', ')}</p>
        <ul>
          <li><strong>Full PICO:</strong> {state.step3.queries.fullPico}</li>
          <li><strong>Keyword only:</strong> {state.step3.queries.keywordOnly}</li>
          <li><strong>Intervention-focused:</strong> {state.step3.queries.interventionFocused}</li>
          <li><strong>Outcome-focused:</strong> {state.step3.queries.outcomeFocused}</li>
        </ul>
      </section>

      <section className="exportSection">
        <h2>Candidate + Scoring Table</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Year</th>
              <th>Link</th>
              <th>Total</th>
              <th>Top</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((a) => {
              const score = state.step4.scores[a.id];
              return (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.year}</td>
                  <td>{a.link}</td>
                  <td>{score ? getScoreTotal(score) : 0}</td>
                  <td>{score?.includeTop ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="exportSection">
        <h2>Top Article Selections</h2>
        <ul>
          {topIds.map((id) => {
            const a = state.step3.candidateArticles.find((x) => x.id === id);
            return <li key={id}>{a?.title || id}</li>;
          })}
        </ul>
      </section>

      <section className="exportSection">
        <h2>Evidence Extraction</h2>
        {topIds.map((id) => {
          const a = state.step3.candidateArticles.find((x) => x.id === id);
          const e = state.step5.extractions[id];
          if (!e) return null;
          return (
            <article key={id} className="exportCard">
              <h3>{a?.title}</h3>
              <p><strong>Citation:</strong> {e.citation}</p>
              <p><strong>Participants:</strong> {e.participants}</p>
              <p><strong>Intervention components:</strong> {e.interventionComponents}</p>
              <p><strong>Dosage:</strong> {e.dosage}</p>
              <p><strong>Outcome measures:</strong> {e.outcomeMeasures}</p>
              <p><strong>Results:</strong> {e.resultsSummary}</p>
              <p><strong>Clinical takeaway:</strong> {e.clinicalTakeaway}</p>
              {e.materialsSetup ? <p><strong>Materials/setup:</strong> {e.materialsSetup}</p> : null}
            </article>
          );
        })}
      </section>

      <section className="exportSection">
        <h2>Therapy Plan</h2>
        <p><strong>Long-term goal:</strong> {goalToText(state.step6.longTermGoal)}</p>
        <p><strong>Short-term objectives:</strong></p>
        <ul>
          {state.step6.shortTermObjectives.map((goal) => (
            <li key={goal.id}>{goalToText(goal)}</li>
          ))}
        </ul>
        <p><strong>Session structure:</strong> {state.step6.methodology.sessionStructure}</p>
        <p><strong>Cueing hierarchy:</strong> {state.step6.methodology.cueingHierarchy}</p>
        <p><strong>Feedback:</strong> {state.step6.methodology.feedbackTypeFrequency}</p>
        <p><strong>Materials:</strong> {state.step6.methodology.materialsList}</p>
        <p><strong>Progress monitoring:</strong> {state.step6.progressMonitoring.probeSchedule}; {state.step6.progressMonitoring.metric}; {state.step6.progressMonitoring.masteryCriteria}</p>
        <p><strong>Rationale references:</strong> {state.step6.rationaleArticleIds.map((id) => state.step3.candidateArticles.find((a) => a.id === id)?.title || id).join('; ')}</p>
      </section>
    </div>
  );
};
