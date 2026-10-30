import React, { useEffect, useRef, useState } from 'react';
import { fetchPubMedAbstract, hitLink, searchLiterature, type SearchHit, type SearchSource } from '../search';
import type { CandidateArticle, SearchLogEntry, Step3State } from '../types';

interface LiteratureSearchProps {
  queries: Step3State['queries'];
  articles: CandidateArticle[];
  onAdd: (hit: SearchHit, source: SearchSource, searchId: string) => void;
  // Records a completed search and returns its log id.
  onLog: (entry: Omit<SearchLogEntry, 'id' | 'date'>) => string;
}

const sources: { key: SearchSource; label: string; note: string; webUrl: (q: string) => string }[] = [
  {
    key: 'pubmed',
    label: 'PubMed',
    note: 'The main biomedical database, including ASHA journals. Shows study design tags.',
    webUrl: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
  },
  {
    key: 'europepmc',
    label: 'Europe PMC',
    note: 'Includes PubMed plus more. Shows abstracts and flags free full text.',
    webUrl: (q) => `https://europepmc.org/search?query=${encodeURIComponent(q)}`,
  },
];

// Search strategies, from most to least focused. Each teaches when to widen a search.
const strategies = [
  {
    key: 'keywordOnly',
    label: 'P + I + O',
    title: 'All three concepts',
    when: 'Most focused. Start here.',
  },
  {
    key: 'interventionFocused',
    label: 'P + I',
    title: 'Drop the outcome',
    when: 'Too few results? See everything studied with this intervention and population.',
  },
  {
    key: 'outcomeFocused',
    label: 'P + O',
    title: 'Drop the intervention',
    when: 'Find which interventions have been studied for this outcome.',
  },
] as const;

type StrategyKey = (typeof strategies)[number]['key'];

// Limits results to stronger designs. Syntax differs by database.
const designFilter: Record<SearchSource, string> = {
  pubmed: ' AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])',
  europepmc: ' AND (PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Randomized Controlled Trial")',
};

const sameArticle = (a: CandidateArticle, hit: SearchHit): boolean =>
  a.link.trim() === hitLink(hit) ||
  a.link.trim() === hit.url ||
  (!!a.title.trim() && a.title.trim().toLowerCase() === hit.title.toLowerCase());

const resultHint = (total: number, strategy: StrategyKey | 'custom', filtered: boolean): string => {
  if (total === 0) {
    if (filtered) return 'No results. Turn off the design filter to include other study types.';
    if (strategy === 'keywordOnly') return 'No results. Try "Drop the outcome," or add more synonyms to your terms.';
    return 'No results. Add synonyms with OR in your terms, or try another strategy.';
  }
  if (total > 300) return 'That is a lot to screen. Try the design filter, or use more specific terms.';
  return '';
};

export const LiteratureSearch: React.FC<LiteratureSearchProps> = ({ queries, articles, onAdd, onLog }) => {
  const [source, setSource] = useState<SearchSource>('pubmed');
  const [strategy, setStrategy] = useState<StrategyKey>('keywordOnly');
  const [query, setQuery] = useState(queries.keywordOnly);
  const [filterDesigns, setFilterDesigns] = useState(false);
  const [ran, setRan] = useState<{ query: string; source: SearchSource; strategy: StrategyKey | 'custom'; filtered: boolean } | null>(null);
  const [searchId, setSearchId] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [next, setNext] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAbstracts, setOpenAbstracts] = useState<Record<string, boolean>>({});
  const [abstracts, setAbstracts] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the box in sync when the student changes their terms.
  const strategyQuery = queries[strategy];
  useEffect(() => setQuery(strategyQuery), [strategyQuery]);

  const edited = query.trim() !== strategyQuery.trim();
  const fullQuery = (q: string, src: SearchSource, filtered: boolean): string => (filtered ? `(${q})${designFilter[src]}` : q);

  const run = async (append: boolean): Promise<void> => {
    const base = append && ran ? ran.query : query.trim();
    const src = append && ran ? ran.source : source;
    const filtered = append && ran ? ran.filtered : filterDesigns;
    if (!base) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const page = await searchLiterature(src, fullQuery(base, src, filtered), append ? next : null, controller.signal);
      setHits((prev) => (append ? [...prev, ...page.hits] : page.hits));
      setTotal(page.total);
      setNext(page.next);
      if (!append) {
        const strat = edited ? 'custom' : strategy;
        const label = strat === 'custom' ? 'Custom' : strategies.find((s) => s.key === strat)?.label ?? '';
        setRan({ query: base, source: src, strategy: strat, filtered });
        setOpenAbstracts({});
        setSearchId(
          onLog({
            source: sources.find((s) => s.key === src)?.label ?? src,
            strategy: filtered ? `${label}, reviews & trials only` : label,
            query: base,
            total: page.total,
          }),
        );
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('The search service did not respond. Check your connection and try again in a moment.');
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const toggleAbstract = async (hit: SearchHit): Promise<void> => {
    const opening = !openAbstracts[hit.id];
    setOpenAbstracts((prev) => ({ ...prev, [hit.id]: opening }));
    if (!opening || hit.abstract !== undefined || abstracts[hit.id] !== undefined || !hit.pmid) return;
    try {
      const text = await fetchPubMedAbstract(hit.pmid);
      setAbstracts((prev) => ({ ...prev, [hit.id]: text }));
    } catch {
      setAbstracts((prev) => ({ ...prev, [hit.id]: '' }));
    }
  };

  const abstractFor = (hit: SearchHit): string | undefined => hit.abstract ?? abstracts[hit.id];
  const ranSource = ran ? sources.find((s) => s.key === ran.source) : undefined;
  const hint = total !== null && ran ? resultHint(total, ran.strategy, ran.filtered) : '';

  return (
    <div className="card searchPanel">
      <h3>Search the literature</h3>
      <p className="muted tiny">
        Free databases with no account needed. Every search you run is saved to your search log. Open and read an article before relying on
        it; titles and abstracts are not enough.
      </p>

      <div className="segmented" role="radiogroup" aria-label="Database">
        {sources.map((s) => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={source === s.key}
            className={source === s.key ? 'selected' : ''}
            onClick={() => setSource(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="muted tiny">{sources.find((s) => s.key === source)?.note}</p>

      <fieldset>
        <legend>Search strategy</legend>
        <div className="strategyList" role="radiogroup">
          {strategies.map((s) => (
            <label key={s.key} className={`strategyCard ${strategy === s.key ? 'checked' : ''}`}>
              <input type="radio" name="strategy" checked={strategy === s.key} onChange={() => setStrategy(s.key)} />
              <span className="strategyLabel">{s.label}</span>
              <span>
                <strong>{s.title}</strong>
                <span className="muted tiny">{s.when}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <form
        className="searchForm"
        onSubmit={(e) => {
          e.preventDefault();
          void run(false);
        }}
      >
        <label className="srOnly" htmlFor="litSearchQuery">
          Search query
        </label>
        <textarea id="litSearchQuery" rows={3} value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading && !hits.length ? 'Searching…' : 'Search'}
        </button>
      </form>
      <div className="searchOptions">
        <label className="checkRow">
          <input type="checkbox" checked={filterDesigns} onChange={(e) => setFilterDesigns(e.target.checked)} />
          Only systematic reviews, meta-analyses, and randomized controlled trials
        </label>
        {edited ? (
          <button type="button" className="ghost small" onClick={() => setQuery(strategyQuery)}>
            Undo my edits
          </button>
        ) : null}
      </div>

      {error ? <p className="searchError">{error}</p> : null}

      {total !== null && !error && ranSource ? (
        <div className="searchSummary" aria-live="polite">
          <strong>
            {total.toLocaleString()} result{total === 1 ? '' : 's'}
          </strong>{' '}
          in {ranSource.label}
          {hits.length ? ` · showing ${hits.length}` : ''}
          {' · '}
          <a href={ranSource.webUrl(fullQuery(ran!.query, ran!.source, ran!.filtered))} target="_blank" rel="noopener noreferrer">
            Open this search in {ranSource.label}
          </a>
          {hint ? <p className="muted tiny">{hint}</p> : null}
        </div>
      ) : null}

      {hits.length ? (
        <ol className="hitList">
          {hits.map((hit) => {
            const added = articles.some((a) => sameArticle(a, hit));
            const abstract = abstractFor(hit);
            const canShowAbstract = hit.abstract ? true : !!hit.pmid;
            return (
              <li key={hit.id} className="hit">
                <a href={hit.url} target="_blank" rel="noopener noreferrer" className="hitTitle">
                  {hit.title}
                </a>
                <div className="hitMeta">{[hit.authors, hit.journal, hit.year].filter(Boolean).join(' · ')}</div>
                {hit.studyTypes.length || hit.openAccess ? (
                  <div className="hitTags">
                    {hit.studyTypes.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                    {hit.openAccess ? <span className="tag free">Free full text</span> : null}
                  </div>
                ) : null}
                {openAbstracts[hit.id] ? (
                  <p className="hitAbstract">
                    {abstract === undefined ? 'Loading abstract…' : abstract || 'No abstract available. Open the article to read it.'}
                  </p>
                ) : null}
                <div className="hitActions">
                  {canShowAbstract ? (
                    <button type="button" className="ghost small" onClick={() => void toggleAbstract(hit)}>
                      {openAbstracts[hit.id] ? 'Hide abstract' : 'Show abstract'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="small"
                    disabled={added}
                    onClick={() => onAdd(hit, ran?.source ?? source, searchId)}
                  >
                    {added ? 'Saved ✓' : 'Save for screening'}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {next !== null && hits.length ? (
        <button type="button" className="ghost" disabled={loading} onClick={() => void run(true)}>
          {loading ? 'Loading…' : 'Show 10 more'}
        </button>
      ) : null}
    </div>
  );
};
