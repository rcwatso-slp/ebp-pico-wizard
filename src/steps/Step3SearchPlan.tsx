import React, { useState } from 'react';
import { KeywordColumns } from '../components/KeywordColumns';
import { LiteratureSearch } from '../components/LiteratureSearch';
import { hitLink, type SearchHit, type SearchSource } from '../search';
import { buildElicitPrompt, conceptKeys } from '../searchTerms';
import type { StepProps } from '../common';
import type { CandidateArticle, SearchLogEntry, WizardData } from '../types';

const copyText = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

interface TrustedSource {
  name: string;
  url: string;
  what: string;
}

// Sources students should know beyond database searches; synthesized evidence first.
const trustedSources: TrustedSource[] = [
  {
    name: 'ASHA Evidence Maps',
    url: 'https://www.asha.org/evidence-maps/',
    what: 'Systematic reviews, guidelines, and client perspectives organized by disorder area. A good first stop.',
  },
  {
    name: 'ASHA Practice Portal',
    url: 'https://www.asha.org/practice-portal/',
    what: 'Overviews of assessment and treatment for each disorder area, with key references.',
  },
  {
    name: 'The Informed SLP',
    url: 'https://www.theinformedslp.com/',
    what: 'Plain-language reviews of recent SLP research. Ask your supervisor about access.',
  },
  {
    name: 'speechBITE',
    url: 'https://speechbite.com/',
    what: 'A database of speech pathology treatment studies, with a quality rating for each study.',
  },
  {
    name: 'Cochrane Library',
    url: 'https://www.cochranelibrary.com/',
    what: 'High-quality systematic reviews of health interventions.',
  },
];

const emptyManual = { title: '', year: '', link: '', source: '', notes: '' };

export const Step3SearchPlan: React.FC<StepProps> = ({ state, setState }) => {
  const [copied, setCopied] = useState('');
  const [manual, setManual] = useState(emptyManual);
  const [showManual, setShowManual] = useState(false);
  const { candidateArticles: articles, searchLog, keywordColumns } = state.step3;

  const flashCopied = (key: string): void => {
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1500);
  };

  const setArticles = (update: (articles: CandidateArticle[]) => CandidateArticle[]): void =>
    setState((prev: WizardData) => ({ ...prev, step3: { ...prev.step3, candidateArticles: update(prev.step3.candidateArticles) } }));

  const updateArticle = (id: string, patch: Partial<CandidateArticle>): void =>
    setArticles((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const logSearch = (entry: Omit<SearchLogEntry, 'id' | 'date'>): string => {
    const id = crypto.randomUUID();
    setState((prev: WizardData) => ({
      ...prev,
      step3: { ...prev.step3, searchLog: [...prev.step3.searchLog, { ...entry, id, date: new Date().toISOString() }] },
    }));
    return id;
  };

  const addFromSearch = (hit: SearchHit, source: SearchSource, searchId: string): void => {
    const article: Omit<CandidateArticle, 'id'> = {
      title: hit.title,
      year: hit.year,
      link: hitLink(hit),
      notes: '',
      authors: hit.authors,
      journal: hit.journal,
      studyTypes: hit.studyTypes,
      source: source === 'pubmed' ? 'PubMed' : 'Europe PMC',
      searchId,
    };
    // Older saves start with blank rows; fill one of those before adding a new row.
    setArticles((list) => {
      const blank = list.find((a) => !a.title.trim() && !a.link.trim());
      return blank ? list.map((a) => (a.id === blank.id ? { ...a, ...article } : a)) : [...list, { id: crypto.randomUUID(), ...article }];
    });
  };

  const addManual = (): void => {
    if (!manual.title.trim()) return;
    setArticles((list) => [...list, { id: crypto.randomUUID(), ...manual, title: manual.title.trim() }]);
    setManual(emptyManual);
    setShowManual(false);
  };

  const removeArticle = (id: string): void => setArticles((list) => list.filter((row) => row.id !== id));

  const saved = articles.filter((a) => a.title.trim());
  const scholarQuery = state.step3.queries.keywordOnly || conceptKeys.map((k) => keywordColumns[k][0]).filter(Boolean).join(' ');

  return (
    <section>
      <h2>Step 3: Search for Evidence</h2>
      <p className="muted">
        Run your searches, check trusted SLP sources, and save every article that might answer your PICO question. You&rsquo;ll score them in
        Step 4.
      </p>

      <p className="preview">
        <strong>Your question:</strong> {state.step2.finalPico || 'Write your PICO question in Step 2.'}
      </p>

      <details className="card termsCard">
        <summary>
          <strong>Your search terms</strong>
          <span className="muted tiny">
            {conceptKeys.map((k) => `${k[0].toUpperCase()}: ${keywordColumns[k].length}`).join(' · ')} &middot; open to edit
          </span>
        </summary>
        <p className="fieldHint">
          Terms in the same concept are joined with OR, and concepts are joined with AND. These are the same terms as Step 2; changing them
          updates your searches.
        </p>
        <KeywordColumns state={state} setState={setState} />
      </details>

      <LiteratureSearch queries={state.step3.queries} articles={articles} onAdd={addFromSearch} onLog={logSearch} />

      {searchLog.length ? (
        <div className="card">
          <h3>Search log</h3>
          <p className="fieldHint">Every search you ran here, so you or your supervisor can repeat it. It is included in your exported packet.</p>
          <div className="tableWrap">
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
                {searchLog.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{entry.source}</td>
                    <td>{entry.strategy}</td>
                    <td className="queryCell">{entry.query}</td>
                    <td>{entry.total.toLocaleString()}</td>
                    <td>{articles.filter((a) => a.searchId === entry.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>Other trusted sources</h3>
        <p className="fieldHint">
          Database searches miss things. Check sources that summarize SLP evidence, especially for guidelines and systematic reviews, then add
          what you find with &ldquo;Add an article you found elsewhere&rdquo; below.
        </p>
        <ul className="sourceList">
          {trustedSources.map((src) => (
            <li key={src.name}>
              <a href={src.url} target="_blank" rel="noopener noreferrer">
                {src.name}
              </a>
              <span className="muted tiny">{src.what}</span>
            </li>
          ))}
          <li>
            <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(scholarQuery)}`} target="_blank" rel="noopener noreferrer">
              Google Scholar
            </a>
            <span className="muted tiny">Opens with your P + I + O search. Very broad, so check that each source is peer-reviewed.</span>
          </li>
        </ul>

        <details className="elicitBox">
          <summary>
            <strong>Elicit and other AI research assistants</strong>
            <span className="muted tiny">AI tools that find and summarize papers. Always open the paper to confirm what it says.</span>
          </summary>
          <div className="buttonRow">
            <button
              type="button"
              className="ghost small"
              disabled={!state.step2.finalPico.trim()}
              onClick={async () => (await copyText(state.step2.finalPico)) && flashCopied('pico')}
            >
              {copied === 'pico' ? 'Copied ✓' : 'Copy my PICO question'}
            </button>
            <button
              type="button"
              className="ghost small"
              onClick={async () => (await copyText(buildElicitPrompt(state))) && flashCopied('prompt')}
            >
              {copied === 'prompt' ? 'Copied ✓' : 'Copy detailed prompt'}
            </button>
            <a className="linkBtn small" href="https://elicit.com" target="_blank" rel="noopener noreferrer">
              Open Elicit
            </a>
          </div>
          <p className="muted tiny">
            Elicit works best with your PICO question in plain language. The detailed prompt adds your terms and searches, for AI tools that
            accept longer instructions.
          </p>
        </details>
      </div>

      <div className="card">
        <div className="buttonRow">
          <h3>Saved articles</h3>
          <span className={`pill ${saved.length < 2 ? 'warn' : ''}`}>{saved.length} saved (at least 2)</span>
        </div>
        <p className="fieldHint">Aim for 5&ndash;10 articles to screen in Step 4. Save anything that might fit; you&rsquo;ll score them next.</p>

        {articles.length ? (
          <ol className="savedList">
            {articles.map((a) => (
              <li key={a.id} className="savedArticle">
                {a.searchId ? (
                  <>
                    <div className="savedHead">
                      {a.link ? (
                        <a href={a.link} target="_blank" rel="noopener noreferrer" className="hitTitle">
                          {a.title}
                        </a>
                      ) : (
                        <strong>{a.title}</strong>
                      )}
                      <button type="button" className="ghost small" onClick={() => removeArticle(a.id)}>
                        Remove
                      </button>
                    </div>
                    <div className="hitMeta">{[a.authors, a.journal, a.year].filter(Boolean).join(' · ')}</div>
                    <div className="hitTags">
                      {(a.studyTypes ?? []).map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                      {a.source ? <span className="tag source">Found in {a.source}</span> : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="savedHead">
                      <label className="grow">
                        Title *
                        <input value={a.title} onChange={(e) => updateArticle(a.id, { title: e.target.value })} />
                      </label>
                      <button type="button" className="ghost small" onClick={() => removeArticle(a.id)}>
                        Remove
                      </button>
                    </div>
                    <div className="formGrid three">
                      <label>
                        Year
                        <input value={a.year} onChange={(e) => updateArticle(a.id, { year: e.target.value })} />
                      </label>
                      <label>
                        Link or DOI
                        <input value={a.link} onChange={(e) => updateArticle(a.id, { link: e.target.value })} />
                      </label>
                      <label>
                        Where you found it
                        <input
                          value={a.source ?? ''}
                          placeholder="e.g., ASHA Evidence Map"
                          onChange={(e) => updateArticle(a.id, { source: e.target.value })}
                        />
                      </label>
                    </div>
                  </>
                )}
                <label className="noteField">
                  Why it might be relevant
                  <input
                    value={a.notes}
                    placeholder="e.g., Same intervention and outcome; participants slightly younger"
                    onChange={(e) => updateArticle(a.id, { notes: e.target.value })}
                  />
                </label>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted tiny">Nothing saved yet. Use &ldquo;Save for screening&rdquo; on a search result, or add an article below.</p>
        )}

        {showManual ? (
          <div className="manualForm">
            <h4>Add an article you found elsewhere</h4>
            <label>
              Title *
              <input value={manual.title} onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))} />
            </label>
            <div className="formGrid three">
              <label>
                Year
                <input value={manual.year} onChange={(e) => setManual((m) => ({ ...m, year: e.target.value }))} />
              </label>
              <label>
                Link or DOI
                <input value={manual.link} onChange={(e) => setManual((m) => ({ ...m, link: e.target.value }))} />
              </label>
              <label>
                Where you found it
                <input
                  value={manual.source}
                  placeholder="e.g., ASHA Evidence Map"
                  onChange={(e) => setManual((m) => ({ ...m, source: e.target.value }))}
                />
              </label>
            </div>
            <div className="buttonRow">
              <button type="button" className="small" disabled={!manual.title.trim()} onClick={addManual}>
                Add article
              </button>
              <button type="button" className="ghost small" onClick={() => setShowManual(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="ghost small" onClick={() => setShowManual(true)}>
            Add an article you found elsewhere
          </button>
        )}
      </div>
    </section>
  );
};
