// src/modules/DaliProgrammingStudio/Deployment/DeploymentPlan.ts

import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';

export interface DeploymentPlan {
  deploymentId: string;
  programmingPlan: ProgrammingPlan;
  gatewayId: string;
  targetLineId: string;
  createdAt: string;
  requiresConfirmation: boolean; // Safety Rule #3
}