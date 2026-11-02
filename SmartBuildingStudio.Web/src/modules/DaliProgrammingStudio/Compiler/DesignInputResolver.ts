// src/modules/DaliProgrammingStudio/Compiler/DesignInputResolver.ts

import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import { ProgrammingError } from '@/modules/DaliProgrammingStudio/models/ProgrammingError';

export class DesignInputResolver {
  /**
   * Validates the overall integrity of the approved design.
   * Throws a ProgrammingError if the design is fundamentally invalid.
   */
  public resolve(design: ApprovedDaliDesign): DaliDeviceDefinition[] {
    if (!design.topology) {
      throw new ProgrammingError('INVALID_DESIGN', 'Design is missing topology.');
    }

    if (!design.devices || design.devices.length === 0) {
      throw new ProgrammingError('EMPTY_DESIGN', 'Design contains no devices to program.');
    }

    // Validate that every device belongs to a line defined in the topology
    const validLineIds = new Set(design.topology.lines.map(l => l.lineId));

    for (const device of design.devices) {
      if (!validLineIds.has(device.lineId)) {
        throw new ProgrammingError(
          'ORPHAN_DEVICE',
          `Device ${device.deviceId} references unknown line ${device.lineId}`,
          device.deviceId,
          true
        );
      }
    }

    return design.devices;
  }
}