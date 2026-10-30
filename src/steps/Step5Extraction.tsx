import React, { useState } from 'react';
import { appraisalFor, designInfo, qualitySummary, topArticleIds } from '../appraisal';
import { PhiField } from '../components/PhiField';
import { directionLabels, dosageText, extractionComplete, extractionFor, findingLabels } from '../extraction';
import type { StepProps } from '../common';
import type { EvidenceExtraction, ResultDirection, WizardData } from '../types';

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
    // Initials already end with a period; don't double it.
    authors ? (authors.endsWith('.') ? authors : `${authors}.`) : '',
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


interface FieldGuide {
  hint: string;
  where: string;
  placeholder: string;
}

const guides: Record<'participants' | 'interventionComponents' | 'outcomeMeasures' | 'summary' | 'clinicalTakeaway' | 'materialsSetup', FieldGuide> = {
  participants: {
    hint: 'How many, age range, diagnosis, and severity.',
    where: 'Methods: Participants',
    placeholder: 'e.g., 24 children, ages 5–8, autism, minimally verbal',
  },
  interventionComponents: {
    hint: 'The active ingredients: what the clinician did, the cueing and feedback, materials, and who delivered it.',
    where: 'Methods: Procedures or Intervention',
    placeholder: 'e.g., Clinician follows child’s lead in play; models target requests; time delay before prompting; parent coaching',
  },
  outcomeMeasures: {
    hint: 'What was measured and how: probes of treated and untreated items, standardized tests, or language samples.',
    where: 'Methods: Measures',
    placeholder: 'e.g., Spontaneous requests per 10-minute play sample; standardized language test at pre and post',
  },
  summary: {
    hint: 'Include numbers when reported: effect sizes, percent correct, or how many participants improved.',
    where: 'Results and Abstract',
    placeholder: 'e.g., Treatment group made more spontaneous requests than controls (large effect); 3 of 4 maintained gains at 2 months',
  },
  clinicalTakeaway: {
    hint: 'How will this study change what you do with your client? This carries into your plan in Step 6.',
    where: 'Your judgment, using the Discussion',
    placeholder: 'e.g., Use time delay before prompting during play; plan 2 sessions a week and probe generalization at home',
  },
  materialsSetup: {
    hint: 'Optional. Anything you would need to replicate the treatment.',
    where: 'Methods or Appendix',
    placeholder: 'e.g., Preferred toys in clear bins; visual schedule',
  },
};

const Guided: React.FC<{ label: string; guide: FieldGuide; children: React.ReactNode }> = ({ label, guide, children }) => (
  <label className="guided">
    {label}
    <span className="fieldHint">
      {guide.hint} <span className="whereTag">Where: {guide.where}</span>
    </span>
    {children}
  </label>
);

interface ChoiceProps<T extends string> {
  name: string;
  value: T | '';
  labels: Record<T, string>;
  onChange: (value: T) => void;
}

const Choice = <T extends string>({ name, value, labels, onChange }: ChoiceProps<T>): React.ReactElement => (
  <div className="segmented choice" role="radiogroup" aria-label={name}>
    {(Object.entries(labels) as [T, string][]).map(([key, label]) => (
      <button key={key} type="button" role="radio" aria-checked={value === key} className={value === key ? 'selected' : ''} onClick={() => onChange(key)}>
        {label}
      </button>
    ))}
  </div>
);

const levelText = (state: WizardData, id: string): string => {
  const ap = appraisalFor(state, id);
  const d = designInfo(ap.design);
  const q = qualitySummary(ap);
  if (!d) return '';
  const level = d.level === 'Guideline' || d.level === 'Qualitative' ? d.level : `Level ${d.level}`;
  return `${level} · ${d.label}${q.rating ? ` · ${q.rating} quality` : ''}`;
};

export const Step5Extraction: React.FC<StepProps> = ({ state, setState, onPhiWarning }) => {
  const topIds = topArticleIds(state);
  const firstOpen = topIds.find((id) => !extractionComplete(extractionFor(state, id))) ?? topIds[0] ?? '';
  const [selectedId, setSelectedId] = useState(firstOpen);
  const [citationLoading, setCitationLoading] = useState(false);
  const [citationError, setCitationError] = useState('');

  const id = topIds.includes(selectedId) ? selectedId : topIds[0];
  const idx = topIds.indexOf(id);
  const article = state.step3.candidateArticles.find((a) => a.id === id);
  const e = extractionFor(state, id);
  const cs = state.caseSnapshot;

  const update = (patch: (e: EvidenceExtraction) => Partial<EvidenceExtraction>): void =>
    setState((prev: WizardData) => {
      const current = extractionFor(prev, id);
      return { ...prev, step5: { ...prev.step5, extractions: { ...prev.step5.extractions, [id]: { ...current, ...patch(current) } } } };
    });

  const select = (next: string): void => {
    setSelectedId(next);
    setCitationError('');
  };

  const autofillCitation = async (): Promise<void> => {
    const doi = extractDoi(article?.link || '') || extractDoi(e.citation);
    if (!doi) {
      setCitationError('No DOI found. Add a DOI or doi.org link to this article in Step 3, or type the citation.');
      return;
    }
    setCitationLoading(true);
    setCitationError('');
    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      if (!response.ok) throw new Error('Crossref request failed');
      const data = (await response.json()) as { message?: CrossrefWork };
      if (!data.message) throw new Error('Crossref response missing metadata');
      const citation = formatApaCitation(data.message);
      update(() => ({ citation }));
    } catch {
      setCitationError('Could not look up that DOI. Check it and try again, or type the citation.');
    } finally {
      setCitationLoading(false);
    }
  };

  if (!article) {
    return (
      <section>
        <h2>Step 5: Extract the Evidence</h2>
        <p className="muted">Choose your top articles in Step 4 first.</p>
      </section>
    );
  }

  const phi = (fieldId: string, label: string, value: string, children: React.ReactNode): React.ReactElement => (
    <PhiField
      fieldId={fieldId}
      label={label}
      value={value}
      ignored={!!state.phiIgnoredFields[fieldId]}
      onToggleIgnore={(checked) => setState((prev) => ({ ...prev, phiIgnoredFields: { ...prev.phiIgnoredFields, [fieldId]: checked } }))}
      onWarning={onPhiWarning}
    >
      {children}
    </PhiField>
  );

  const doneCount = topIds.filter((t) => extractionComplete(extractionFor(state, t))).length;
  const directions = topIds.map((t) => extractionFor(state, t).results.direction).filter(Boolean) as ResultDirection[];

  return (
    <section>
      <h2>Step 5: Extract the Evidence</h2>
      <p className="muted">
        Pull out exactly what each top study did and found. These details become your treatment plan in Step 6, so take them from the article,
        not from a summary.
      </p>

      <div className="card">
        <div className="buttonRow">
          <h3>Your evidence table</h3>
          <span className="muted tiny">
            {doneCount} of {topIds.length} complete
          </span>
        </div>
        <div className="tableWrap">
          <table className="appraisalTable evidenceTable">
            <thead>
              <tr>
                <th>Study</th>
                <th>Participants</th>
                <th>Dosage</th>
                <th>Outcome</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              {topIds.map((t, i) => {
                const a = state.step3.candidateArticles.find((x) => x.id === t);
                const ex = extractionFor(state, t);
                return (
                  <tr key={t} className={t === id ? 'current' : ''} onClick={() => select(t)}>
                    <td>
                      <button type="button" className="linkLike" onClick={() => select(t)}>
                        {i + 1}. {a?.title}
                      </button>
                      <span className="muted tiny block">{levelText(state, t)}</span>
                      {extractionComplete(ex) ? <span className="status status-appraised">complete</span> : null}
                    </td>
                    <td>{ex.participants || '–'}</td>
                    <td>{dosageText(ex) || '–'}</td>
                    <td>{ex.outcomeMeasures || '–'}</td>
                    <td>{ex.results.direction ? directionLabels[ex.results.direction] : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <article className="card appraisalCard">
        <p className="guideEyebrow">
          Article {idx + 1} of {topIds.length}
        </p>
        {article.link ? (
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="hitTitle appraisalTitle">
            {article.title}
          </a>
        ) : (
          <strong className="appraisalTitle">{article.title}</strong>
        )}
        <div className="hitTags">
          <span className="tag">{levelText(state, id) || 'Not appraised'}</span>
        </div>
        <p className="fieldHint">Your reason for choosing it: {appraisalFor(state, id).topReason || '–'}</p>

        <div className="appraisalSection">
          <label className="guided">
            Citation (APA) *
            <span className="fieldHint">Look it up from the DOI, then check it against the article.</span>
            <textarea rows={3} value={e.citation} onChange={(ev) => update(() => ({ citation: ev.target.value }))} />
          </label>
          <button type="button" className="ghost small" disabled={citationLoading} onClick={() => void autofillCitation()}>
            {citationLoading ? 'Looking up…' : 'Fill in from DOI'}
          </button>
          {citationError ? <p className="muted tiny">{citationError}</p> : null}
        </div>

        <div className="appraisalSection">
          <h3>Who was studied?</h3>
          {phi(
            `step5_${id}_participants`,
            'Participants',
            e.participants,
            <Guided label="Participants *" guide={guides.participants}>
              <textarea
                rows={2}
                value={e.participants}
                placeholder={guides.participants.placeholder}
                onChange={(ev) => update(() => ({ participants: ev.target.value }))}
              />
            </Guided>,
          )}
          <p className="muted tiny">
            You rated the population match as{' '}
            <strong>{appraisalFor(state, id).relevance.population || 'not rated'}</strong> in Step 4.
          </p>
        </div>

        <div className="appraisalSection">
          <h3>What did the treatment involve?</h3>
          {phi(
            `step5_${id}_interventionComponents`,
            'Intervention components',
            e.interventionComponents,
            <Guided label="Key components *" guide={guides.interventionComponents}>
              <textarea
                rows={3}
                value={e.interventionComponents}
                placeholder={guides.interventionComponents.placeholder}
                onChange={(ev) => update(() => ({ interventionComponents: ev.target.value }))}
              />
            </Guided>,
          )}

          <p className="fieldLabel">Dosage *</p>
          <p className="fieldHint">
            How much treatment participants received. Write NR if the article doesn&rsquo;t report it.{' '}
            <span className="whereTag">Where: Methods: Procedures</span>
          </p>
          <div className="formGrid three">
            {(
              [
                ['sessionLength', 'Session length', 'e.g., 30 minutes'],
                ['frequency', 'Sessions per week', 'e.g., 2 per week'],
                ['duration', 'Total length', 'e.g., 12 weeks'],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key}>
                {label}
                <input value={e.dosage[key]} placeholder={ph} onChange={(ev) => update((cur) => ({ dosage: { ...cur.dosage, [key]: ev.target.value } }))} />
              </label>
            ))}
          </div>
          <label>
            Other dosage details
            <input
              value={e.dosage.notes}
              placeholder="e.g., about 100 practice trials per session"
              onChange={(ev) => update((cur) => ({ dosage: { ...cur.dosage, notes: ev.target.value } }))}
            />
          </label>
          {cs.constraintNotes ? <p className="compareNote">Compare with your client&rsquo;s schedule: {cs.constraintNotes}</p> : null}

          {phi(
            `step5_${id}_materialsSetup`,
            'Materials and setup',
            e.materialsSetup,
            <Guided label="Materials and setup" guide={guides.materialsSetup}>
              <input
                value={e.materialsSetup}
                placeholder={guides.materialsSetup.placeholder}
                onChange={(ev) => update(() => ({ materialsSetup: ev.target.value }))}
              />
            </Guided>,
          )}
        </div>

        <div className="appraisalSection">
          <h3>What was measured, and what happened?</h3>
          {phi(
            `step5_${id}_outcomeMeasures`,
            'Outcome measures',
            e.outcomeMeasures,
            <Guided label="Outcome measures *" guide={guides.outcomeMeasures}>
              <textarea
                rows={2}
                value={e.outcomeMeasures}
                placeholder={guides.outcomeMeasures.placeholder}
                onChange={(ev) => update(() => ({ outcomeMeasures: ev.target.value }))}
              />
            </Guided>,
          )}

          {(
            [
              ['direction', 'Did the targeted skill improve? *', directionLabels],
              ['generalization', 'Did gains generalize to untreated items, people, or settings? *', findingLabels],
              ['maintenance', 'Were gains maintained after treatment ended? *', findingLabels],
            ] as const
          ).map(([key, question, labels]) => (
            <div key={key} className="matchRow">
              <span>{question}</span>
              <Choice
                name={question}
                value={e.results[key]}
                labels={labels as Record<string, string>}
                onChange={(v) => update((cur) => ({ results: { ...cur.results, [key]: v } }))}
              />
            </div>
          ))}

          {phi(
            `step5_${id}_summary`,
            'Results summary',
            e.results.summary,
            <Guided label="Results summary *" guide={guides.summary}>
              <textarea
                rows={3}
                value={e.results.summary}
                placeholder={guides.summary.placeholder}
                onChange={(ev) => update((cur) => ({ results: { ...cur.results, summary: ev.target.value } }))}
              />
            </Guided>,
          )}
        </div>

        <div className="appraisalSection">
          <h3>What does it mean for your client?</h3>
          {phi(
            `step5_${id}_clinicalTakeaway`,
            'Clinical takeaway',
            e.clinicalTakeaway,
            <Guided label="Clinical takeaway *" guide={guides.clinicalTakeaway}>
              <textarea
                rows={3}
                value={e.clinicalTakeaway}
                placeholder={guides.clinicalTakeaway.placeholder}
                onChange={(ev) => update(() => ({ clinicalTakeaway: ev.target.value }))}
              />
            </Guided>,
          )}
        </div>

        <div className="buttonRow articleNav">
          <button type="button" className="ghost small" disabled={idx <= 0} onClick={() => select(topIds[idx - 1])}>
            &larr; Previous article
          </button>
          <button type="button" className="ghost small" disabled={idx >= topIds.length - 1} onClick={() => select(topIds[idx + 1])}>
            Next article &rarr;
          </button>
        </div>
      </article>

      <article className="card">
        <h3>What does the evidence say overall?</h3>
        <p className="fieldHint">
          Clinicians weigh the whole body of evidence, not one study. Consider: Do the studies agree? How strong is the evidence, given the
          levels and quality? What is missing for your client, such as age, severity, or setting?
        </p>
        <div className="hitTags">
          {topIds.map((t, i) => (
            <span key={t} className="tag">
              Study {i + 1}: {levelText(state, t) || 'not appraised'}
            </span>
          ))}
          {directions.length ? (
            <span className="tag free">
              Results: {directions.map((d) => directionLabels[d].toLowerCase()).join(', ')}
            </span>
          ) : null}
        </div>
        {phi(
          'step5_synthesis',
          'Evidence summary',
          state.step5.synthesis,
          <label className="spaced">
            Evidence summary *
            <textarea
              rows={5}
              value={state.step5.synthesis}
              placeholder="e.g., Two strong studies (a systematic review and a randomized trial) agree that NDBIs improve spontaneous communication in autistic children. Most participants were younger than my client, and generalization was rarely measured, so I will monitor it closely."
              onChange={(ev) => setState((prev) => ({ ...prev, step5: { ...prev.step5, synthesis: ev.target.value } }))}
            />
          </label>,
        )}
      </article>
    </section>
  );
};
