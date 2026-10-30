import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildElicitPrompt } from './searchTerms';
import type { WizardData } from './types';
import { appraisableArticles, appraisalFor, designInfo, qualitySummary, topArticleIds } from './appraisal';
import { buildCaseSnapshotText, goalToText } from './utils';

interface ExportViewProps {
  state: WizardData;
}

export const ExportView: React.FC<ExportViewProps> = ({ state }) => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const topIds = topArticleIds(state);
  const fullElicitPrompt = buildElicitPrompt(state);

  return (
    <div className="exportPage">
      <header className="exportHeader noPrintBreak">
        <h1>EBP Packet</h1>
        <div className="buttonRow">
          <Link to="/" className="linkBtn">
            &larr; Back to wizard
          </Link>
          <button type="button" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
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
        <h2>Search Terms + Queries</h2>
        <p><strong>Population:</strong> {state.step3.keywordColumns.population.join(', ')}</p>
        <p><strong>Intervention:</strong> {state.step3.keywordColumns.intervention.join(', ')}</p>
        <p><strong>Outcome:</strong> {state.step3.keywordColumns.outcome.join(', ')}</p>
        <ul>
          <li><strong>P + I + O:</strong> {state.step3.queries.keywordOnly}</li>
          <li><strong>P + I:</strong> {state.step3.queries.interventionFocused}</li>
          <li><strong>P + O:</strong> {state.step3.queries.outcomeFocused}</li>
        </ul>
      </section>

      {state.step3.searchLog.length ? (
        <section className="exportSection">
          <h2>Search Log</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Database</th>
                <th>Strategy</th>
                <th>Search</th>
                <th>Results</th>
                <th>Saved</th>
              </tr>
            </thead>
            <tbody>
              {state.step3.searchLog.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{entry.source}</td>
                  <td>{entry.strategy}</td>
                  <td>{entry.query}</td>
                  <td>{entry.total.toLocaleString()}</td>
                  <td>{state.step3.candidateArticles.filter((a) => a.searchId === entry.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="exportSection">
        <h2>AI Research Assistant Prompt (Elicit)</h2>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{fullElicitPrompt}</pre>
      </section>

      <section className="exportSection">
        <h2>Article Appraisals</h2>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Fit (P / I / O)</th>
              <th>Design and level</th>
              <th>Quality</th>
              <th>Fits client</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {appraisableArticles(state).map((a) => {
              const ap = appraisalFor(state, a.id);
              const d = designInfo(ap.design);
              const q = qualitySummary(ap);
              const fit = (v: string): string => (v ? v : '\u2013');
              return (
                <tr key={a.id}>
                  <td>
                    {a.title}
                    {a.year ? ` (${a.year})` : ''}
                  </td>
                  <td>
                    {fit(ap.relevance.population)} / {fit(ap.relevance.intervention)} / {fit(ap.relevance.outcome)}
                  </td>
                  <td>{ap.setAside ? '\u2013' : d ? `${d.level}: ${d.label}` : '\u2013'}</td>
                  <td>{ap.setAside ? '\u2013' : q.rating ? `${q.rating} (${q.yes}/${q.total})` : '\u2013'}</td>
                  <td>
                    {ap.setAside
                      ? '\u2013'
                      : `${fit(ap.applicability.setting)} / ${fit(ap.applicability.dosage)} / ${fit(ap.applicability.priorities)}`}
                  </td>
                  <td>{ap.includeTop ? 'Top article' : ap.setAside ? `Set aside: ${ap.setAsideReason}` : 'Not selected'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted tiny">Fits client: setting / dosage / client and family priorities.</p>
      </section>

      <section className="exportSection">
        <h2>Top Articles and Reasons</h2>
        <ul>
          {topIds.map((id) => {
            const a = state.step3.candidateArticles.find((x) => x.id === id);
            return (
              <li key={id}>
                <strong>{a?.title || id}</strong>: {appraisalFor(state, id).topReason}
              </li>
            );
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
