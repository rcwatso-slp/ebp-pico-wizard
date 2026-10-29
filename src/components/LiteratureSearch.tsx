import React, { useEffect, useRef, useState } from 'react';
import { fetchPubMedAbstract, hitLink, searchLiterature, type SearchHit, type SearchSource } from '../search';
import type { CandidateArticle, Step3State } from '../types';

interface LiteratureSearchProps {
  queries: Step3State['queries'];
  articles: CandidateArticle[];
  onAdd: (hit: SearchHit, source: SearchSource, query: string) => void;
}

const sources: { key: SearchSource; label: string; note: string }[] = [
  { key: 'pubmed', label: 'PubMed', note: 'The main biomedical database, including ASHA journals. Shows study design tags.' },
  { key: 'europepmc', label: 'Europe PMC', note: 'Includes PubMed plus more. Shows abstracts and flags free full text.' },
];

const queryOptions = [
  ['keywordOnly', 'Keyword only (P + I + O)'],
  ['interventionFocused', 'Intervention-focused'],
  ['outcomeFocused', 'Outcome-focused'],
  ['fullPico', 'Full PICO sentence'],
] as const;

type QueryKey = (typeof queryOptions)[number][0];

const sameArticle = (a: CandidateArticle, hit: SearchHit): boolean =>
  a.link.trim() === hitLink(hit) ||
  a.link.trim() === hit.url ||
  (!!a.title.trim() && a.title.trim().toLowerCase() === hit.title.toLowerCase());

const resultHint = (total: number): string => {
  if (total === 0) return 'No results. Try removing a concept joined with AND, dropping the comparison, or adding synonyms with OR.';
  if (total > 300) return 'That is a lot to screen. Add a concept with AND or use more specific terms to narrow it down.';
  return '';
};

export const LiteratureSearch: React.FC<LiteratureSearchProps> = ({ queries, articles, onAdd }) => {
  const [source, setSource] = useState<SearchSource>('pubmed');
  const [queryKey, setQueryKey] = useState<QueryKey>('keywordOnly');
  const [query, setQuery] = useState(queries.keywordOnly);
  const [ranQuery, setRanQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [next, setNext] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAbstracts, setOpenAbstracts] = useState<Record<string, boolean>>({});
  const [abstracts, setAbstracts] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the box in sync when the student rebuilds queries above.
  const selectedQuery = queries[queryKey];
  useEffect(() => setQuery(selectedQuery), [selectedQuery]);

  const run = async (append: boolean): Promise<void> => {
    const q = append ? ranQuery : query.trim();
    if (!q) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const page = await searchLiterature(source, q, append ? next : null, controller.signal);
      setHits((prev) => (append ? [...prev, ...page.hits] : page.hits));
      setTotal(page.total);
      setNext(page.next);
      setRanQuery(q);
      if (!append) setOpenAbstracts({});
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
  const hint = total !== null ? resultHint(total) : '';

  return (
    <div className="card searchPanel">
      <h3>Search the literature</h3>
      <p className="muted tiny">
        Free databases with no account needed. Open and read an article before adding it to your plan; titles and abstracts are not
        enough.
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

      <label>
        Start from one of your queries
        <select
          value={queryKey}
          onChange={(e) => {
            const key = e.target.value as QueryKey;
            setQueryKey(key);
            setQuery(queries[key]);
          }}
        >
          {queryOptions.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

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

      {error ? <p className="searchError">{error}</p> : null}

      {total !== null && !error ? (
        <div className="searchSummary" aria-live="polite">
          <strong>
            {total.toLocaleString()} result{total === 1 ? '' : 's'}
          </strong>{' '}
          in {sources.find((s) => s.key === source)?.label}
          {hits.length ? ` · showing ${hits.length}` : ''}
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
                  <button type="button" className="small" disabled={added} onClick={() => onAdd(hit, source, ranQuery)}>
                    {added ? 'Added ✓' : 'Add to candidates'}
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
