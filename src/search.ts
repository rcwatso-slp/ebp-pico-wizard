// Free literature search against PubMed (NCBI E-utilities) and Europe PMC.
// Both allow browser requests and need no account or API key.

export type SearchSource = 'pubmed' | 'europepmc';

export interface SearchHit {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  url: string;
  pmid: string;
  studyTypes: string[];
  abstract?: string;
  openAccess?: boolean;
}

export interface SearchPage {
  total: number;
  hits: SearchHit[];
  // PubMed pages by offset; Europe PMC by cursor.
  next: number | string | null;
}

export const PAGE_SIZE = 10;

// Publication types worth showing students, strongest designs first.
const DESIGN_TYPES = [
  'Meta-Analysis',
  'Systematic Review',
  'Practice Guideline',
  'Guideline',
  'Randomized Controlled Trial',
  'Controlled Clinical Trial',
  'Clinical Trial',
  'Observational Study',
  'Comparative Study',
  'Case Reports',
  'Review',
  'Preprint',
];

const pickStudyTypes = (types: string[]): string[] => {
  const lower = types.map((t) => t.toLowerCase());
  return DESIGN_TYPES.filter((d) => lower.includes(d.toLowerCase()));
};

const cleanTitle = (title: string): string =>
  title
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '');

const shortAuthors = (names: string[]): string => {
  const list = names.filter(Boolean);
  if (list.length <= 3) return list.join(', ');
  return `${list.slice(0, 3).join(', ')}, et al.`;
};

const getJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  let response = await fetch(url, { signal });
  // NCBI allows ~3 requests/second per network without a key; wait and retry once.
  if (response.status === 429) {
    await new Promise((r) => window.setTimeout(r, 1200));
    response = await fetch(url, { signal });
  }
  if (!response.ok) throw new Error(`Search service returned ${response.status}`);
  return response.json() as Promise<T>;
};

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EUTILS_TOOL = 'tool=ebp-pico-wizard';

interface ESearchResponse {
  esearchresult: { count: string; idlist: string[] };
}

interface ESummaryRecord {
  uid: string;
  title: string;
  pubdate: string;
  source: string;
  fulljournalname?: string;
  authors?: { name: string }[];
  pubtype?: string[];
  articleids?: { idtype: string; value: string }[];
}

const searchPubMed = async (query: string, start: number, signal?: AbortSignal): Promise<SearchPage> => {
  const search = await getJson<ESearchResponse>(
    `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${PAGE_SIZE}&retstart=${start}&${EUTILS_TOOL}&term=${encodeURIComponent(query)}`,
    signal,
  );
  const total = Number(search.esearchresult.count) || 0;
  const ids = search.esearchresult.idlist;
  if (!ids.length) return { total, hits: [], next: null };

  const summary = await getJson<{ result: Record<string, ESummaryRecord> }>(
    `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&${EUTILS_TOOL}&id=${ids.join(',')}`,
    signal,
  );

  const hits = ids
    .map((id) => summary.result[id])
    .filter((r): r is ESummaryRecord => !!r)
    .map((r) => {
      const doi = r.articleids?.find((a) => a.idtype === 'doi')?.value ?? '';
      return {
        id: `pubmed_${r.uid}`,
        title: cleanTitle(r.title),
        authors: shortAuthors((r.authors ?? []).map((a) => a.name)),
        journal: r.fulljournalname || r.source,
        year: (r.pubdate.match(/\d{4}/) ?? [''])[0],
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${r.uid}/`,
        pmid: r.uid,
        studyTypes: pickStudyTypes(r.pubtype ?? []),
      };
    });

  const nextStart = start + PAGE_SIZE;
  return { total, hits, next: nextStart < total ? nextStart : null };
};

// PubMed summaries omit abstracts, so fetch one on demand when a student expands it.
export const fetchPubMedAbstract = async (pmid: string, signal?: AbortSignal): Promise<string> => {
  const response = await fetch(`${EUTILS}/efetch.fcgi?db=pubmed&retmode=xml&${EUTILS_TOOL}&id=${pmid}`, { signal });
  if (!response.ok) throw new Error(`Search service returned ${response.status}`);
  const xml = new DOMParser().parseFromString(await response.text(), 'text/xml');
  const parts = Array.from(xml.querySelectorAll('Abstract > AbstractText')).map((node) => {
    const label = node.getAttribute('Label');
    const text = (node.textContent ?? '').trim();
    return label ? `${label}: ${text}` : text;
  });
  return parts.join('\n\n');
};

interface EuropePmcResult {
  id: string;
  source: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  doi?: string;
  pmid?: string;
  abstractText?: string;
  isOpenAccess?: string;
  journalInfo?: { journal?: { title?: string } };
  bookOrReportDetails?: { publisher?: string };
  pubTypeList?: { pubType?: string[] };
}

interface EuropePmcResponse {
  hitCount: number;
  nextCursorMark?: string;
  resultList: { result: EuropePmcResult[] };
}

const searchEuropePmc = async (query: string, cursor: string, signal?: AbortSignal): Promise<SearchPage> => {
  const data = await getJson<EuropePmcResponse>(
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=${PAGE_SIZE}&cursorMark=${encodeURIComponent(cursor)}&query=${encodeURIComponent(query)}`,
    signal,
  );

  const hits = data.resultList.result.map((r) => {
    const authorList = (r.authorString ?? '').replace(/\.$/, '').split(', ');
    return {
      id: `epmc_${r.source}_${r.id}`,
      title: cleanTitle(r.title ?? 'Untitled'),
      authors: shortAuthors(authorList),
      journal: r.journalInfo?.journal?.title ?? r.bookOrReportDetails?.publisher ?? '',
      year: r.pubYear ?? '',
      doi: r.doi ?? '',
      url: `https://europepmc.org/article/${r.source}/${r.id}`,
      pmid: r.pmid ?? '',
      studyTypes: pickStudyTypes(r.pubTypeList?.pubType ?? []),
      abstract: (r.abstractText ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      openAccess: r.isOpenAccess === 'Y',
    };
  });

  const more = !!data.nextCursorMark && data.nextCursorMark !== cursor && hits.length === PAGE_SIZE;
  return { total: data.hitCount, hits, next: more ? data.nextCursorMark ?? null : null };
};

export const searchLiterature = (
  source: SearchSource,
  query: string,
  page: number | string | null,
  signal?: AbortSignal,
): Promise<SearchPage> =>
  source === 'pubmed'
    ? searchPubMed(query, typeof page === 'number' ? page : 0, signal)
    : searchEuropePmc(query, typeof page === 'string' ? page : '*', signal);

// The link stored on a candidate article. A doi.org link keeps Step 5's citation autofill working.
export const hitLink = (hit: SearchHit): string => (hit.doi ? `https://doi.org/${hit.doi}` : hit.url);
