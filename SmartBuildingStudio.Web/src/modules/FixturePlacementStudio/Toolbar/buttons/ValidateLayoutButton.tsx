// src/modules/FixturePlacementStudio/Toolbar/buttons/ValidateLayoutButton.tsx
//
// Runs validation and opens the report dialog on completion.
//
// The thunk (runValidationThunk) is synchronous — it validates in
// process, no async work — so after the dispatch returns, the report is
// already in the slice. We open the dialog by rendering it locally; the
// dialog reads the report from the slice via the parent (AnalysisGroup),
// not itself.
//
// Design note: the button does not own the dialog. AnalysisGroup does.
// The button just raises an "open" signal up. That keeps the button
// stateless and lets the group coordinate the dialog across buttons if
// more callbacks need to open it later.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { runValidationThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import {
  selectValidating,
  selectRuleSet,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export interface ValidateLayoutButtonProps {
  /** Called after the thunk completes successfully. The parent uses this
   *  to open the report dialog. */
  onValidated?: () => void;
}

export const ValidateLayoutButton: React.FC<ValidateLayoutButtonProps> = ({
  onValidated,
}) => {
  const dispatch = useAppDispatch();
  const validating = useAppSelector(selectValidating);
  const ruleSet = useAppSelector(selectRuleSet);

  const disabled = validating || !ruleSet;

  const handleClick = async () => {
    if (disabled) return;
    await dispatch(runValidationThunk() as any);
    onValidated?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        !ruleSet
          ? 'No rule set loaded'
          : validating
          ? 'Validating…'
          : 'Validate layout against the loaded rule set'
      }
      style={{
        ...button,
        background: disabled
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(16, 185, 129, 0.12)',
        borderColor: disabled ? '#1E293B' : '#10B981',
        color: disabled ? '#475569' : '#6EE7B7',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {validating ? '✓ Validating…' : '✓ Validate'}
    </button>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  fontSize: 11,
  fontFamily: 'monospace',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default ValidateLayoutButton;