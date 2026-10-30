import React, { useState } from 'react';
import type { StepProps } from '../common';
import { conceptKeys, conceptLabels, MIN_TERMS_PER_CONCEPT, splitTerms, uniqueTerms, withKeywordColumns, type ConceptKey } from '../searchTerms';

type KeywordColumnsProps = Pick<StepProps, 'state' | 'setState'>;

const placeholders: Record<ConceptKey, string> = {
  population: 'e.g., autism, autistic, ASD',
  intervention: 'e.g., NDBI, JASPER, enhanced milieu teaching',
  outcome: 'e.g., requesting, mands, spontaneous communication',
};

export const KeywordColumns: React.FC<KeywordColumnsProps> = ({ state, setState }) => {
  const [inputs, setInputs] = useState<Record<ConceptKey, string>>({ population: '', intervention: '', outcome: '' });
  const columns = state.step3.keywordColumns;

  const add = (key: ConceptKey): void => {
    const values = splitTerms(inputs[key]);
    if (!values.length) return;
    setState((prev) => withKeywordColumns(prev, { ...prev.step3.keywordColumns, [key]: uniqueTerms([...prev.step3.keywordColumns[key], ...values]) }));
    setInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const remove = (key: ConceptKey, term: string): void =>
    setState((prev) =>
      withKeywordColumns(prev, { ...prev.step3.keywordColumns, [key]: prev.step3.keywordColumns[key].filter((t) => t !== term) }),
    );

  return (
    <div className="formGrid three conceptColumns">
      {conceptKeys.map((key) => {
        const count = columns[key].length;
        const enough = count >= MIN_TERMS_PER_CONCEPT;
        return (
          <div key={key} className="conceptColumn">
            <div className="conceptHead">
              <strong>
                <span className="conceptLetter">{conceptLabels[key].letter}</span>
                {conceptLabels[key].name}
              </strong>
              <span className={`pill ${enough ? '' : 'warn'}`}>
                {count}/{MIN_TERMS_PER_CONCEPT}
                {enough ? ' ✓' : ''}
              </span>
            </div>
            <div className="chipsWrap">
              {columns[key].map((term) => (
                <button
                  type="button"
                  className="chip selected"
                  key={term}
                  aria-label={`Remove ${term}`}
                  onClick={() => remove(key, term)}
                >
                  {term} &times;
                </button>
              ))}
            </div>
            <form
              className="chipsEditor"
              onSubmit={(e) => {
                e.preventDefault();
                add(key);
              }}
            >
              <input
                value={inputs[key]}
                placeholder={placeholders[key]}
                aria-label={`Add ${conceptLabels[key].name.toLowerCase()} terms`}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
              />
              <button type="submit" className="small">
                Add
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
};
