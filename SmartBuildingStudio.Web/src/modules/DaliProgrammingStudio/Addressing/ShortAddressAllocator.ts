// src/modules/DaliProgrammingStudio/Addressing/ShortAddressAllocator.ts

import { DALI_HARD_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliConstants';

export class ShortAddressAllocator {
  /**
   * Allocates the lowest available short address on a specific line.
   * Returns null if the line is full.
   */
  public allocate(lineId: string, currentlyUsedAddresses: number[]): number | null {
    const used = new Set(currentlyUsedAddresses);
    
    for (let addr = DALI_HARD_LIMITS.MIN_SHORT_ADDRESS; addr <= DALI_HARD_LIMITS.MAX_SHORT_ADDRESS; addr++) {
      if (!used.has(addr)) {
        return addr;
      }
    }

    return null; // No available addresses (line is full)
  }
}