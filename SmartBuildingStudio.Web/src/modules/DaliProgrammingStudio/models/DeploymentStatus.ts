// src/modules/DaliProgrammingStudio/models/DeploymentStatus.ts

import { 
  DEPLOYMENT_STATES, 
  type DeploymentState 
} from '@/modules/DaliProgrammingStudio/constants/deploymentConstants';
import type { DeploymentCheckpoint } from '@/modules/DaliProgrammingStudio/types/deployment.types';

export class DeploymentStatus {
  private _currentState: DeploymentState;
  private _checkpoints: DeploymentCheckpoint[];

  constructor() {
    this._currentState = DEPLOYMENT_STATES.IDLE;
    this._checkpoints = [];
  }

  get currentState(): DeploymentState {
    return this._currentState;
  }

  get checkpoints(): DeploymentCheckpoint[] {
    return [...this._checkpoints];
  }

  public transitionTo(newState: DeploymentState): void {
    // Add validation logic here if needed (e.g., cannot go from IDLE to COMPLETED)
    this._currentState = newState;
  }

  public addCheckpoint(checkpoint: DeploymentCheckpoint): void {
    this._checkpoints.push(checkpoint);
  }
}