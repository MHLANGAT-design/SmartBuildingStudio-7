// src/modules/DaliProgrammingStudio/Document/ProgrammingDocumentManager.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';

import { ProgrammingDocumentValidator } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocumentValidator';
import { ProgrammingDocumentSerializer } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocumentSerializer';
import { ProgrammingHistory } from '@/modules/DaliProgrammingStudio/Document/ProgrammingHistory';
import { ProgrammingRevisionManager } from '@/modules/DaliProgrammingStudio/Document/ProgrammingRevisionManager';
import { AutoSaveManager } from '@/modules/DaliProgrammingStudio/Document/AutoSaveManager';
import { PROGRAMMING_JOB_STATES, type ProgrammingJobState } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class ProgrammingDocumentManager {
  private validator = new ProgrammingDocumentValidator();
  private history = new ProgrammingHistory();
  private revisionManager = new ProgrammingRevisionManager();
  private autoSaveManager: AutoSaveManager;
  private currentDoc: ProgrammingDocument | null = null;

  constructor(saveCallback: (jsonString: string) => Promise<void>) {
    this.autoSaveManager = new AutoSaveManager(saveCallback);
  }

  public createNewDocument(projectId: string, jobName: string, userId: string): ProgrammingDocument {
    const doc: ProgrammingDocument = {
      documentId: `doc_${Date.now()}`,
      projectId,
      jobName,
      state: PROGRAMMING_JOB_STATES.DRAFT,
      approvedDesign: null,
      programmingPlan: null,
      deploymentResult: null,
      verificationReport: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      revisionId: `rev_${Date.now()}`,
    };

    this.currentDoc = doc;
    this.history.record(userId, 'DOCUMENT_CREATED', `Job: ${jobName}`);
    return doc;
  }

  public attachDesign(design: ApprovedDaliDesign, userId: string): void {
    if (!this.currentDoc) throw new Error('No active document.');
    this.currentDoc.approvedDesign = design;
    this.currentDoc.state = PROGRAMMING_JOB_STATES.DESIGN_LOADED;
    this.currentDoc.updatedAt = new Date().toISOString();
    this.history.record(userId, 'DESIGN_ATTACHED', `Revision: ${design.revisionId}`);
  }

  public attachProgrammingPlan(plan: ProgrammingPlan, userId: string): void {
    if (!this.currentDoc) throw new Error('No active document.');
    this.currentDoc.programmingPlan = plan;
    this.currentDoc.state = PROGRAMMING_JOB_STATES.COMPILED;
    this.currentDoc.updatedAt = new Date().toISOString();
    this.history.record(userId, 'PLAN_COMPILED', `Plan: ${plan.planId}`);
  }

  public attachDeploymentResult(result: DeploymentResult, userId: string): void {
    if (!this.currentDoc) throw new Error('No active document.');
    this.currentDoc.deploymentResult = result;
    this.currentDoc.state = result.success ? PROGRAMMING_JOB_STATES.COMPLETED : PROGRAMMING_JOB_STATES.FAILED;
    this.currentDoc.updatedAt = new Date().toISOString();
    this.history.record(userId, 'DEPLOYMENT_FINISHED', `Success: ${result.success}`);
  }

  public attachVerificationReport(report: VerificationReport, userId: string): void {
    if (!this.currentDoc) throw new Error('No active document.');
    this.currentDoc.verificationReport = report;
    this.currentDoc.updatedAt = new Date().toISOString();
    this.history.record(userId, 'VERIFICATION_FINISHED', `Verified: ${report.isFullyVerified}`);
  }

  public save(userId: string, comment?: string): string {
    if (!this.currentDoc) throw new Error('No active document.');
    
    const validation = this.validator.validate(this.currentDoc);
    if (!validation.isValid) {
      throw new Error(`Cannot save document: ${validation.errors.join(', ')}`);
    }

    this.revisionManager.createRevision(this.currentDoc, comment);
    this.history.record(userId, 'DOCUMENT_SAVED', comment);

    return ProgrammingDocumentSerializer.serialize(this.currentDoc);
  }

  public loadFromJson(jsonString: string): ProgrammingDocument {
    const doc = ProgrammingDocumentSerializer.deserialize(jsonString);
    const validation = this.validator.validate(doc);
    
    if (!validation.isValid) {
      throw new Error(`Cannot load document: ${validation.errors.join(', ')}`);
    }

    this.currentDoc = doc;
    return doc;
  }

  public startAutoSave(): void {
    if (!this.currentDoc) return;
    this.autoSaveManager.start(() => this.currentDoc!);
  }

  public stopAutoSave(): void {
    this.autoSaveManager.stop();
  }

  public getCurrentDocument(): ProgrammingDocument | null {
    return this.currentDoc;
  }

  public getHistory(): ProgrammingHistory {
    return this.history;
  }

  public getRevisions() {
    return this.revisionManager.getRevisions();
  }
}