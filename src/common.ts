import type { Dispatch, SetStateAction } from 'react';
import type { WizardData } from './types';

export interface StepProps {
  state: WizardData;
  setState: Dispatch<SetStateAction<WizardData>>;
  onPhiWarning: (fieldId: string) => void;
}
