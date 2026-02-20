import React, { useEffect, useMemo, useRef } from 'react';
import { phiPatternDetected } from '../utils';

interface PhiFieldProps {
  fieldId: string;
  label: string;
  value: string;
  ignored: boolean;
  onToggleIgnore: (checked: boolean) => void;
  onWarning: (fieldId: string) => void;
  children: React.ReactNode;
}

export const PhiField: React.FC<PhiFieldProps> = ({
  fieldId,
  label,
  value,
  ignored,
  onToggleIgnore,
  onWarning,
  children,
}) => {
  const warned = useMemo(() => phiPatternDetected(value), [value]);
  const lastWarnedRef = useRef(false);

  useEffect(() => {
    if (warned && !ignored && !lastWarnedRef.current) {
      onWarning(fieldId);
    }
    lastWarnedRef.current = warned;
  }, [fieldId, ignored, onWarning, warned]);

  return (
    <div className={`phiField ${warned && !ignored ? 'phiFlag' : ''}`}>
      {children}
      {warned && (
        <div className="phiWarning">
          <strong>Potential PHI pattern detected</strong> in {label}. Review before exporting.
          <label>
            <input
              type="checkbox"
              checked={ignored}
              onChange={(e) => onToggleIgnore(e.target.checked)}
            />{' '}
            Ignore warning for this field
          </label>
        </div>
      )}
    </div>
  );
};
