import React, { useEffect, useState } from 'react';
import { PhiField } from '../components/PhiField';
import type { StepProps } from '../common';
import type { WizardData } from '../types';

const requiredKeys = [
  'citation',
  'participants',
  'interventionComponents',
  'dosage',
  'outcomeMeasures',
  'resultsSummary',
  'clinicalTakeaway',
] as const;

interface CrossrefAuthor {
  family?: string;
  given?: string;
}

interface CrossrefWork {
  title?: string[];
  'container-title'?: string[];
  issued?: { 'date-parts'?: number[][] };
  author?: CrossrefAuthor[];
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
}

const extractDoi = (value: string): string | null => {
  const text = value.trim();
  if (!text) return null;
  const doiPattern = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
  const match = text.match(doiPattern);
  return match ? match[0] : null;
};

const formatAuthorApa = (author: CrossrefAuthor): string => {
  const family = (author.family || '').trim();
  const given = (author.given || '').trim();
  if (!family) return '';
  if (!given) return family;
  const initials = given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ''}.`)
    .join(' ');
  return `${family}, ${initials}`;
};

const formatAuthorsApa7 = (authors: CrossrefAuthor[]): string => {
  const names = authors.map(formatAuthorApa).filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length <= 20) return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
  return `${names.slice(0, 19).join(', ')}, ... ${names[names.length - 1]}`;
};

const formatApaCitation = (work: CrossrefWork): string => {
  const authors = formatAuthorsApa7(work.author || []);
  const year = work.issued?.['date-parts']?.[0]?.[0];
  const title = work.title?.[0] || 'Untitled article';
  const journal = work['container-title']?.[0] || '';
  const volumeIssue = [work.volume, work.issue ? `(${work.issue})` : ''].filter(Boolean).join('');
  const pages = work.page ? `, ${work.page}` : '';
  const doiUrl = work.DOI ? `https://doi.org/${work.DOI}` : '';

  return [
    authors ? `${authors}.` : '',
    year ? `(${year}).` : '(n.d.).',
    `${title}.`,
    journal ? `${journal}${volumeIssue ? `, ${volumeIssue}` : ''}${pages}.` : '',
    doiUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const Step5Extraction: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const [citationLoading, setCitationLoading] = useState<Record<string, boolean>>({});
  const [citationError, setCitationError] = useState<Record<string, string>>({});

  const topIds = Object.values(state.step4.scores)
    .filter((s) => s.includeTop)
    .map((s) => s.articleId);

  const autofillCitation = async (articleId: string): Promise<void> => {
    const article = state.step3.candidateArticles.find((a) => a.id === articleId);
    const extraction = state.step5.extractions[articleId];
    const doi = extractDoi(article?.link || '') || extractDoi(extraction?.citation || '');

    if (!doi) {
      setCitationError((prev) => ({
        ...prev,
        [articleId]: 'No DOI detected. Add DOI or doi.org link in Step 3 Link/DOI, then retry.',
      }));
      return;
    }

    setCitationLoading((prev) => ({ ...prev, [articleId]: true }));
    setCitationError((prev) => ({ ...prev, [articleId]: '' }));

    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      if (!response.ok) {
        throw new Error('Crossref request failed');
      }
      const data = (await response.json()) as { message?: CrossrefWork };
      if (!data.message) {
        throw new Error('Crossref response missing metadata');
      }
      const citation = formatApaCitation(data.message);

      setState((prev: WizardData) => ({
        ...prev,
        step5: {
          extractions: {
            ...prev.step5.extractions,
            [articleId]: { ...prev.step5.extractions[articleId], citation },
          },
        },
      }));
    } catch {
      setCitationError((prev) => ({
        ...prev,
        [articleId]: 'Unable to fetch citation metadata. Check DOI and try again.',
      }));
    } finally {
      setCitationLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const next = { ...prev.step5.extractions };
      topIds.forEach((id) => {
        if (!next[id]) {
          changed = true;
          next[id] = {
            articleId: id,
            citation: '',
            participants: '',
            interventionComponents: '',
            dosage: '',
            outcomeMeasures: '',
            resultsSummary: '',
            clinicalTakeaway: '',
            materialsSetup: '',
            collapsed: false,
          };
        }
      });
      return changed ? { ...prev, step5: { extractions: next } } : prev;
    });
  }, [setState, topIds]);

  return (
    <section>
      <h2>Step 5: Evidence Extraction Table</h2>
      <p className="muted">Complete required fields for at least 2 selected top articles. Citation can auto-fill from DOI.</p>
      {topIds.map((id) => {
        const article = state.step3.candidateArticles.find((a) => a.id === id);
        const extraction = state.step5.extractions[id];
        if (!extraction) return null;
        const complete = requiredKeys.every((k) => extraction[k].trim().length > 0);

        return (
          <article key={id} className="card">
            <div className="buttonRow">
              <h3>
                {article?.title || 'Selected article'} {complete ? '✓' : '○'}
              </h3>
              <div className="buttonRow">
                <button
                  type="button"
                  className="ghost"
                  disabled={!!citationLoading[id]}
                  onClick={() => void autofillCitation(id)}
                >
                  {citationLoading[id] ? 'Auto-filling...' : 'Auto-fill citation'}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setState((prev: WizardData) => ({
                      ...prev,
                      step5: {
                        extractions: {
                          ...prev.step5.extractions,
                          [id]: { ...prev.step5.extractions[id], collapsed: !prev.step5.extractions[id].collapsed },
                        },
                      },
                    }))
                  }
                >
                  {extraction.collapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
            </div>
            {citationError[id] ? <p className="muted">{citationError[id]}</p> : null}

            {!extraction.collapsed ? (
              <div className="formGrid one">
                {([
                  ['citation', 'Citation *'],
                  ['participants', 'Participants (age/diagnosis, n) *'],
                  ['interventionComponents', 'Intervention components (bullets) *'],
                  ['dosage', 'Dosage (min/session, frequency, duration) *'],
                  ['outcomeMeasures', 'Outcome measures *'],
                  ['resultsSummary', 'Results summary *'],
                  ['clinicalTakeaway', 'Clinical takeaway *'],
                  ['materialsSetup', 'Materials/setup (optional)'],
                ] as const).map(([key, label]) => (
                  <PhiField
                    key={key}
                    fieldId={`step5_${id}_${key}`}
                    label={label}
                    value={extraction[key]}
                    ignored={!!state.phiIgnoredFields[`step5_${id}_${key}`]}
                    onToggleIgnore={(checked) =>
                      setState((prev: WizardData) => ({
                        ...prev,
                        phiIgnoredFields: { ...prev.phiIgnoredFields, [`step5_${id}_${key}`]: checked },
                      }))
                    }
                    onWarning={onPhiWarning}
                  >
                    <label>
                      {label}
                      <textarea
                        value={extraction[key]}
                        onChange={(e) =>
                          setState((prev: WizardData) => ({
                            ...prev,
                            step5: {
                              extractions: {
                                ...prev.step5.extractions,
                                [id]: { ...prev.step5.extractions[id], [key]: e.target.value },
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </PhiField>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
};
