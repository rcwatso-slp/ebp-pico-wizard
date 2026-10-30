import React, { useState } from 'react';
import {
  answerLabels,
  appraisableArticles,
  appraisalComplete,
  appraisalFor,
  appraisalStatus,
  checklistFor,
  checklists,
  designInfo,
  designQuestions,
  designs,
  matchLabels,
  qualitySummary,
  suggestDesign,
  topArticleIds,
} from '../appraisal';
import type { StepProps } from '../common';
import type { ArticleAppraisal, ChecklistAnswer, MatchRating, StudyDesign, WizardData } from '../types';

const MAX_TOP = 5;

interface ChoiceProps<T extends string> {
  name: string;
  value: T | '';
  options: [T, string][];
  onChange: (value: T) => void;
}

const Choice = <T extends string>({ name, value, options, onChange }: ChoiceProps<T>): React.ReactElement => (
  <div className="segmented choice" role="radiogroup" aria-label={name}>
    {options.map(([key, label]) => (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={value === key}
        className={`${value === key ? 'selected' : ''} opt-${key}`}
        onClick={() => onChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);

const matchOptions = Object.entries(matchLabels) as [Exclude<MatchRating, ''>, string][];
const answerOptions = Object.entries(answerLabels) as [ChecklistAnswer, string][];

const fitSummary = (a: ArticleAppraisal): string => {
  const r = a.relevance;
  const letters: [string, MatchRating][] = [
    ['P', r.population],
    ['I', r.intervention],
    ['O', r.outcome],
  ];
  return letters.map(([l, v]) => `${l} ${v ? matchLabels[v as Exclude<MatchRating, ''>] : '–'}`).join(' · ');
};

const SectionTitle: React.FC<{ n: number; title: string; why: string }> = ({ n, title, why }) => (
  <div className="sectionHead">
    <h3>
      <span className="sectionNum">{n}</span>
      {title}
    </h3>
    <p className="muted tiny">{why}</p>
  </div>
);

export const Step4Screening: React.FC<StepProps> = ({ state, setState }) => {
  const articles = appraisableArticles(state);
  const firstOpen = articles.find((a) => !appraisalComplete(appraisalFor(state, a.id)))?.id ?? articles[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(firstOpen);
  const [finderNode, setFinderNode] = useState<string | null>(null);
  const [finderPath, setFinderPath] = useState<string[]>([]);

  const selected = articles.find((a) => a.id === selectedId) ?? articles[0];
  const idx = selected ? articles.indexOf(selected) : -1;
  const appraisal = selected ? appraisalFor(state, selected.id) : null;
  const topCount = topArticleIds(state).length;
  const doneCount = articles.filter((a) => appraisalComplete(appraisalFor(state, a.id))).length;

  const update = (patch: (a: ArticleAppraisal) => Partial<ArticleAppraisal>): void => {
    if (!selected) return;
    setState((prev: WizardData) => {
      const current = appraisalFor(prev, selected.id);
      return {
        ...prev,
        step4: { ...prev.step4, appraisals: { ...prev.step4.appraisals, [selected.id]: { ...current, ...patch(current) } } },
      };
    });
  };

  const select = (id: string): void => {
    setSelectedId(id);
    setFinderNode(null);
    setFinderPath([]);
  };

  const answerFinder = (yes: boolean): void => {
    if (!finderNode) return;
    const nextRef = yes ? designQuestions[finderNode].yes : designQuestions[finderNode].no;
    setFinderPath((p) => [...p, finderNode]);
    if (nextRef.startsWith('design:')) {
      update(() => ({ design: nextRef.slice(7) as StudyDesign }));
      setFinderNode(null);
      setFinderPath([]);
    } else {
      setFinderNode(nextRef);
    }
  };

  if (!selected || !appraisal) {
    return (
      <section>
        <h2>Step 4: Appraise Your Articles</h2>
        <p className="muted">Save at least two articles in Step 3 first.</p>
      </section>
    );
  }

  const b = state.step2.builder;
  const cs = state.caseSnapshot;
  const info = designInfo(appraisal.design);
  const suggestion = suggestDesign(selected);
  const items = checklistFor(appraisal.design);
  const quality = qualitySummary(appraisal);
  const complete = appraisalComplete(appraisal);
  const relevanceMiss = appraisal.relevance.population === 'no' || appraisal.relevance.intervention === 'no';
  const topBlocked = !appraisal.includeTop && topCount >= MAX_TOP;

  return (
    <section>
      <h2>Step 4: Appraise Your Articles</h2>
      <p className="muted">
        Professionals judge every article three ways: does it answer my question, how strong is the study, and does it fit my client? Work
        through each saved article, then choose your best 2&ndash;5.
      </p>

      <div className="card">
        <div className="buttonRow">
          <h3>Your articles</h3>
          <span className="muted tiny">
            {doneCount} of {articles.length} appraised &middot;{' '}
            <span className={`pill ${topCount < 2 || topCount > MAX_TOP ? 'warn' : ''}`}>{topCount} top (2&ndash;5)</span>
          </span>
        </div>
        <div className="tableWrap">
          <table className="appraisalTable">
            <thead>
              <tr>
                <th>Article</th>
                <th>Fit</th>
                <th>Design &amp; level</th>
                <th>Quality</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a, i) => {
                const ap = appraisalFor(state, a.id);
                const d = designInfo(ap.design);
                const q = qualitySummary(ap);
                const status = appraisalStatus(ap);
                return (
                  <tr key={a.id} className={a.id === selected.id ? 'current' : ''} onClick={() => select(a.id)}>
                    <td>
                      <button type="button" className="linkLike" onClick={() => select(a.id)}>
                        {i + 1}. {a.title}
                      </button>
                    </td>
                    <td className="nowrap">{fitSummary(ap)}</td>
                    <td>{d ? `${d.level} · ${d.label}` : '–'}</td>
                    <td>{ap.setAside ? '–' : q.rating ? `${q.rating} (${q.yes}/${q.total})` : '–'}</td>
                    <td className="nowrap">
                      <span className={`status status-${status.replace(' ', '-')}`}>{status}</span>
                      {ap.includeTop ? <span className="tag free">Top</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <article className="card appraisalCard">
        <p className="guideEyebrow">
          Article {idx + 1} of {articles.length}
        </p>
        {selected.link ? (
          <a href={selected.link} target="_blank" rel="noopener noreferrer" className="hitTitle appraisalTitle">
            {selected.title}
          </a>
        ) : (
          <strong className="appraisalTitle">{selected.title}</strong>
        )}
        <div className="hitMeta">{[selected.authors, selected.journal, selected.year].filter(Boolean).join(' · ')}</div>
        {selected.studyTypes?.length ? (
          <div className="hitTags">
            {selected.studyTypes.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {selected.notes ? <p className="muted tiny">Your Step 3 note: {selected.notes}</p> : null}
        <p className="fieldHint">Open the article and keep it beside this page. Most answers are in the abstract and the Methods.</p>

        <div className="appraisalSection">
          <SectionTitle
            n={1}
            title="Does it match your question?"
            why="Compare the study with your PICO. Check the abstract and the Methods description of participants and treatment."
          />
          {(
            [
              ['population', 'Population', b.p],
              ['intervention', 'Intervention', b.i],
              ['outcome', 'Outcome', b.o],
            ] as const
          ).map(([key, label, yours]) => (
            <div key={key} className="matchRow">
              <div>
                <strong>{label}</strong>
                <span className="muted tiny">Yours: {yours || 'not set in Step 2'}</span>
              </div>
              <Choice
                name={`${label} match`}
                value={appraisal.relevance[key]}
                options={matchOptions}
                onChange={(v) => update((a) => ({ relevance: { ...a.relevance, [key]: v } }))}
              />
            </div>
          ))}

          {relevanceMiss || appraisal.setAside ? (
            <div className="setAsideBox">
              <p>
                A study with a different population or intervention usually can&rsquo;t answer your question. Setting it aside, with a reason,
                is part of a good appraisal.
              </p>
              <label className="checkRow">
                <input type="checkbox" checked={appraisal.setAside} onChange={(e) => update(() => ({ setAside: e.target.checked, includeTop: false }))} />
                Set this article aside
              </label>
              {appraisal.setAside ? (
                <label>
                  Reason *
                  <input
                    value={appraisal.setAsideReason}
                    placeholder="e.g., Participants were adults; my client is 7."
                    onChange={(e) => update(() => ({ setAsideReason: e.target.value }))}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        {appraisal.setAside ? null : (
          <>
            <div className="appraisalSection">
              <SectionTitle
                n={2}
                title="What kind of study is it?"
                why="The design tells you how much a study can show about whether a treatment works. It also sets which quality checklist to use."
              />
              {suggestion && !appraisal.design ? (
                <div className="suggestBox">
                  <span>
                    {suggestion.note} Likely: <strong>{designInfo(suggestion.design)?.label}</strong>. Confirm in the Methods.
                  </span>
                  <button type="button" className="ghost small" onClick={() => update(() => ({ design: suggestion.design }))}>
                    Use this
                  </button>
                </div>
              ) : null}

              {finderNode ? (
                <div className="finder">
                  <p className="finderQ">{designQuestions[finderNode].question}</p>
                  <p className="muted tiny">{designQuestions[finderNode].hint}</p>
                  <div className="buttonRow">
                    <div className="buttonRow">
                      <button type="button" className="small" onClick={() => answerFinder(true)}>
                        Yes
                      </button>
                      <button type="button" className="small" onClick={() => answerFinder(false)}>
                        No
                      </button>
                    </div>
                    <div className="buttonRow">
                      {finderPath.length ? (
                        <button
                          type="button"
                          className="ghost small"
                          onClick={() => {
                            setFinderNode(finderPath[finderPath.length - 1]);
                            setFinderPath((p) => p.slice(0, -1));
                          }}
                        >
                          Back
                        </button>
                      ) : null}
                      <button type="button" className="ghost small" onClick={() => setFinderNode(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="designPick">
                  <label>
                    Study design *
                    <select value={appraisal.design} onChange={(e) => update(() => ({ design: e.target.value as StudyDesign | '' }))}>
                      <option value="">Select</option>
                      {designs.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => {
                      setFinderPath([]);
                      setFinderNode('start');
                    }}
                  >
                    Help me identify the design
                  </button>
                </div>
              )}

              {info ? (
                <p className="levelBox">
                  <span className="levelBadge">{info.level === 'Guideline' || info.level === 'Qualitative' ? info.level : `Level ${info.level}`}</span>
                  {info.levelNote}
                </p>
              ) : null}
            </div>

            {info ? (
              <div className="appraisalSection">
                <SectionTitle
                  n={3}
                  title="How well was it done?"
                  why="A strong design can still be poorly carried out. Answer each question from the article. Choose Unclear when the article doesn't say; missing information is a weakness too."
                />
                <p className="muted tiny">
                  {checklists[info.checklist].title}: {checklists[info.checklist].source}.
                </p>
                <ol className="checklist">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div>
                        <span>{item.question}</span>
                        <span className="muted tiny">Where to look: {item.where}</span>
                      </div>
                      <Choice
                        name={item.question}
                        value={appraisal.quality[item.id] ?? ''}
                        options={answerOptions}
                        onChange={(v) => update((a) => ({ quality: { ...a.quality, [item.id]: v } }))}
                      />
                    </li>
                  ))}
                </ol>
                <p className="qualityResult">
                  {quality.rating ? (
                    <>
                      <span className={`levelBadge q-${quality.rating.toLowerCase()}`}>{quality.rating}</span>
                      {quality.yes} of {quality.total} criteria met. Strong is 75% or more; moderate is 50&ndash;74%.
                    </>
                  ) : (
                    <span className="muted tiny">
                      {quality.answered} of {quality.total} answered
                    </span>
                  )}
                </p>
              </div>
            ) : null}

            {info ? (
              <div className="appraisalSection">
                <SectionTitle
                  n={4}
                  title="Does it fit your client?"
                  why="Even a strong study only helps if you could use it with this client, in this setting."
                />
                {(
                  [
                    [
                      'setting',
                      'Could you deliver this intervention in your setting?',
                      `Your setting: ${cs.setting || 'not set'}${cs.constraints.length ? `; constraints: ${cs.constraints.join(', ')}` : ''}`,
                    ],
                    [
                      'dosage',
                      'Is the study’s dosage (session length, frequency, total weeks) realistic for your client?',
                      cs.constraintNotes ? `Your notes: ${cs.constraintNotes}` : 'Compare with your scheduling in Step 1.',
                    ],
                    [
                      'priorities',
                      'Does it fit what the client and family care about?',
                      cs.clientPriorities ? `Their priorities: ${cs.clientPriorities}` : 'Consider the client’s and family’s goals.',
                    ],
                  ] as const
                ).map(([key, question, context]) => (
                  <div key={key} className="matchRow">
                    <div>
                      <span>{question}</span>
                      <span className="muted tiny">{context}</span>
                    </div>
                    <Choice
                      name={question}
                      value={appraisal.applicability[key]}
                      options={matchOptions}
                      onChange={(v) => update((a) => ({ applicability: { ...a.applicability, [key]: v } }))}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {info ? (
              <div className="appraisalSection">
                <SectionTitle
                  n={5}
                  title="Your decision"
                  why="Choose the 2–5 articles that best answer your question for this client. A slightly weaker study that fits your client can beat a strong one that doesn't."
                />
                <div className="hitTags decisionTags">
                  <span className="tag">{info.level === 'Guideline' || info.level === 'Qualitative' ? info.level : `Level ${info.level}`}</span>
                  <span className="tag">Quality: {quality.rating ?? 'not finished'}</span>
                  <span className="tag">{fitSummary(appraisal)}</span>
                </div>
                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={appraisal.includeTop}
                    disabled={!complete || topBlocked}
                    onChange={(e) => update(() => ({ includeTop: e.target.checked }))}
                  />
                  Include as one of my top articles
                </label>
                {!complete ? <p className="muted tiny">Finish sections 1&ndash;4 to include this article.</p> : null}
                {topBlocked ? <p className="muted tiny">You already have 5 top articles. Remove one to add this.</p> : null}
                {appraisal.includeTop ? (
                  <label>
                    Why is this one of your best sources? *
                    <textarea
                      value={appraisal.topReason}
                      placeholder="e.g., Strong randomized trial with the same intervention and outcome; dosage fits our twice-weekly schedule."
                      onChange={(e) => update(() => ({ topReason: e.target.value }))}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="buttonRow articleNav">
          <button type="button" className="ghost small" disabled={idx <= 0} onClick={() => select(articles[idx - 1].id)}>
            &larr; Previous article
          </button>
          <button type="button" className="ghost small" disabled={idx >= articles.length - 1} onClick={() => select(articles[idx + 1].id)}>
            Next article &rarr;
          </button>
        </div>
      </article>

      <details className="card">
        <summary>
          <strong>Levels of evidence reference</strong>
        </summary>
        <p className="muted tiny">Treatment-efficacy levels adapted by ASHA from the Scottish Intercollegiate Guidelines Network (SIGN).</p>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Design</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((d) => (
                <tr key={d.key}>
                  <td className="nowrap">{d.level}</td>
                  <td>{d.label}</td>
                  <td>{d.levelNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
};
