// src/modules/DaliProgrammingStudio/Document/ProgrammingDocument.ts

import type { ProgrammingJobState } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';

export interface ProgrammingDocument {
  documentId: string;
  projectId: string;
  jobName: string;
  state: ProgrammingJobState;
  
  // The inputs
  approvedDesign: ApprovedDaliDesign | null;
  
  // The compiled output
  programmingPlan: ProgrammingPlan | null;
  
  // The execution results
  deploymentResult: DeploymentResult | null;
  verificationReport: VerificationReport | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  revisionId: string;
}