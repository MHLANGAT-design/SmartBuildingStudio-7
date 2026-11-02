// src/modules/DaliProgrammingStudio/models/ProgrammingJobStatus.ts

import { 
  PROGRAMMING_JOB_STATES, 
  type ProgrammingJobState 
} from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class ProgrammingJobStatus {
  private _currentState: ProgrammingJobState;
  private _history: { state: ProgrammingJobState; timestamp: string }[];

  constructor(initialState: ProgrammingJobState = PROGRAMMING_JOB_STATES.DRAFT) {
    this._currentState = initialState;
    this._history = [{ state: initialState, timestamp: new Date().toISOString() }];
  }

  get currentState(): ProgrammingJobState {
    return this._currentState;
  }

  get history() {
    return [...this._history];
  }

  /**
   * Transition to a new state if the transition is valid.
   * Throws an error if the transition is illegal.
   */
  public transitionTo(newState: ProgrammingJobState): void {
    if (!this.isValidTransition(this._currentState, newState)) {
      throw new Error(`Invalid state transition from ${this._currentState} to ${newState}`);
    }
    this._currentState = newState;
    this._history.push({ state: newState, timestamp: new Date().toISOString() });
  }

  /**
   * The Frozen Lifecycle Rules:
   * Draft -> DesignLoaded -> Compiling -> Compiled -> Validating -> Validated -> AwaitingApproval -> Approved -> (Execution states)
   */
  private isValidTransition(from: ProgrammingJobState, to: ProgrammingJobState): boolean {
    const S = PROGRAMMING_JOB_STATES;
    
    const validTransitions: Record<string, ProgrammingJobState[]> = {
      [S.DRAFT]: [S.DESIGN_LOADED, S.CANCELLED],
      [S.DESIGN_LOADED]: [S.COMPILING, S.DRAFT, S.CANCELLED],
      [S.COMPILING]: [S.COMPILED, S.FAILED, S.CANCELLED],
      [S.COMPILED]: [S.VALIDATING, S.COMPILING, S.CANCELLED],
      [S.VALIDATING]: [S.VALIDATED, S.FAILED, S.CANCELLED],
      [S.VALIDATED]: [S.AWAITING_APPROVAL, S.CANCELLED],
      [S.AWAITING_APPROVAL]: [S.APPROVED, S.CANCELLED],
      [S.APPROVED]: [S.DEPLOYING, S.CANCELLED],
      [S.DEPLOYING]: [S.COMPLETED, S.FAILED, S.CANCELLED],
      [S.COMPLETED]: [], // Terminal
      [S.FAILED]: [S.DRAFT], // Can reset
      [S.CANCELLED]: [S.DRAFT], // Can reset
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}