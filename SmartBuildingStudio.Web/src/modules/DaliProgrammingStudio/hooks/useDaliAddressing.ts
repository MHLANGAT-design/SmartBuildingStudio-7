// src/modules/DaliProgrammingStudio/hooks/useDaliAddressing.ts

import { useCallback, useState } from 'react';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';
import { AddressingService } from '@/modules/DaliProgrammingStudio/Services/AddressingService';
import { useDaliDesign } from '@/modules/DaliProgrammingStudio/hooks/useDaliDesign';

export function useDaliAddressing(service: AddressingService) {
  const { design } = useDaliDesign();
  const [addressingResult, setAddressingResult] = useState<AddressingResult | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const planAddresses = useCallback(() => {
    if (!design) return null;
    setIsPlanning(true);
    try {
      const result = service.planAddressing(design.devices);
      setAddressingResult(result);
      return result;
    } finally {
      setIsPlanning(false);
    }
  }, [design, service]);

  const buildSequences = useCallback(() => {
    if (!addressingResult || !addressingResult.success) return [];
    return service.buildAddressingSequences(addressingResult);
  }, [addressingResult, service]);

  return {
    addressingResult,
    isPlanning,
    planAddresses,
    buildSequences,
    hasConflicts: (addressingResult?.conflicts.length ?? 0) > 0,
    assignedCount: addressingResult?.assignedCount ?? 0,
  };
}