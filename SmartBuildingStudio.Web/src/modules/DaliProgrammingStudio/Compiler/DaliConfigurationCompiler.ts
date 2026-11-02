// src/modules/DaliProgrammingStudio/Compiler/DaliConfigurationCompiler.ts

import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { CompilationResult } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';

import { DesignInputResolver } from '@/modules/DaliProgrammingStudio/Compiler/DesignInputResolver';
import { ConfigurationNormalizer } from '@/modules/DaliProgrammingStudio/Compiler/ConfigurationNormalizer';
import { ConfigurationValidator } from '@/modules/DaliProgrammingStudio/Compiler/ConfigurationValidator';
import { CommandSequenceBuilder } from '@/modules/DaliProgrammingStudio/Compiler/CommandSequenceBuilder';
import { CommandDependencyResolver } from '@/modules/DaliProgrammingStudio/Compiler/CommandDependencyResolver';
import { CommandOrderValidator } from '@/modules/DaliProgrammingStudio/Compiler/CommandOrderValidator';
import { ProgrammingPlanBuilder } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import { CapabilityResolver } from '@/modules/DaliProgrammingStudio/Compiler/CapabilityResolver';

export class DaliConfigurationCompiler {
  private resolver = new DesignInputResolver();
  private normalizer = new ConfigurationNormalizer();
  private validator = new ConfigurationValidator();
  private capabilityResolver = new CapabilityResolver();
  private sequenceBuilder = new CommandSequenceBuilder();
  private depResolver = new CommandDependencyResolver();
  private orderValidator = new CommandOrderValidator();
  private planBuilder = new ProgrammingPlanBuilder();

  public compile(design: ApprovedDaliDesign): { result: CompilationResult; plan: ProgrammingPlan | null } {
    const errors = [];
    const warnings = [];
    const allSequences: DaliCommandSequence[] = [];

    try {
      // 1. Resolve & Validate Input
      const devices = this.resolver.resolve(design);
      
      const structuralErrors = this.validator.validate(devices);
      if (structuralErrors.length > 0) {
        return {
          result: {
            success: false,
            planId: '',
            designRevisionId: design.revisionId,
            instructions: [],
            warnings,
            errors: structuralErrors,
            compiledAt: new Date().toISOString(),
          },
          plan: null,
        };
      }

      // 2. Process Each Device
      for (const device of devices) {
        // Normalize parameters
        const normalized = this.normalizer.normalize(device);

        // Build sequences (capability-aware)
        let deviceSequences: DaliCommandSequence[] = [];
        
        if (this.capabilityResolver.canProgramParameters(normalized)) {
          // In a real implementation, we might selectively build sequences based on capability
          deviceSequences = this.sequenceBuilder.buildForDevice(normalized);
        } else {
          warnings.push({
            code: 'UNSUPPORTED_DEVICE',
            message: `Device ${device.deviceId} does not support parameter configuration.`,
            deviceId: device.deviceId,
          });
        }

        allSequences.push(...deviceSequences);
      }

      // 3. Resolve Dependencies
      const { ordered, errors: depErrors } = this.depResolver.resolve(allSequences);
      errors.push(...depErrors);

      if (errors.length > 0) {
        return {
          result: {
            success: false,
            planId: '',
            designRevisionId: design.revisionId,
            instructions: [],
            warnings,
            errors,
            compiledAt: new Date().toISOString(),
          },
          plan: null,
        };
      }

      // 4. Final Validation
      const orderErrors = this.orderValidator.validate(ordered);
      errors.push(...orderErrors);

      if (errors.length > 0) {
        return {
          result: {
            success: false,
            planId: '',
            designRevisionId: design.revisionId,
            instructions: [],
            warnings,
            errors,
            compiledAt: new Date().toISOString(),
          },
          plan: null,
        };
      }

      // 5. Build Final Plan
      const plan = this.planBuilder.build(design, ordered);

      return {
        result: {
          success: true,
          planId: plan.planId,
          designRevisionId: design.revisionId,
          instructions: ordered as any, // Casting for now, as CompilationResult instructions expects ProgrammingInstruction
          warnings,
          errors: [],
          compiledAt: new Date().toISOString(),
        },
        plan,
      };

    } catch (e: any) {
      errors.push({
        code: 'COMPILATION_EXCEPTION',
        message: e.message || 'Unknown compilation error',
        isFatal: true,
      });

      return {
        result: {
          success: false,
          planId: '',
          designRevisionId: design?.revisionId || '',
          instructions: [],
          warnings,
          errors,
          compiledAt: new Date().toISOString(),
        },
        plan: null,
      };
    }
  }
}