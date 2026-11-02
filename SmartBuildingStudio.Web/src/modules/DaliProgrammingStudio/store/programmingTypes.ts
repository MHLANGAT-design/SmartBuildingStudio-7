// src/modules/DaliProgrammingStudio/store/programmingTypes.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';
import type { ProgrammingJobState } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';

export interface ProgrammingState {
  currentDocument: ProgrammingDocument | null;
  approvedDesign: ApprovedDaliDesign | null;
  programmingPlan: ProgrammingPlan | null;
  
  // NEW: History for undo/redo
  pastPlans: ProgrammingPlan[];
  futurePlans: ProgrammingPlan[];
  
  deploymentProgress: DeploymentProgress | null;
  deploymentResult: DeploymentResult | null;
  verificationReport: VerificationReport | null;
  diagnosticsReport: DiagnosticsReport | null;
  
  jobState: ProgrammingJobState;
  isCompiling: boolean;
  isDeploying: boolean;
  isVerifying: boolean;
  
  error: string | null;
  compileErrors: CompilationError[];
  warnings: string[];
}