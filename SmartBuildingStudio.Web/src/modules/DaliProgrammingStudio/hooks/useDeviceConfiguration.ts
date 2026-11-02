// src/modules/DaliProgrammingStudio/hooks/useDeviceConfiguration.ts

import { useCallback } from 'react';
import { ConfigurationService } from '@/modules/DaliProgrammingStudio/Services/ConfigurationService';
import { useDaliDesign } from '@/modules/DaliProgrammingStudio/hooks/useDaliDesign';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

export function useDeviceConfiguration(service: ConfigurationService) {
  const { design } = useDaliDesign();

  const getConfigCommandsForDevice = useCallback((deviceId: string) => {
    if (!design) return [];
    const device = design.devices.find((d: DaliDeviceDefinition) => d.deviceId === deviceId);
    if (!device) return [];
    return service.buildConfigurationsForDevice(device);
  }, [design, service]);

  const getAllConfigCommands = useCallback(() => {
    if (!design) return [];
    return service.buildConfigurationsForAll(design.devices);
  }, [design, service]);

  return {
    getConfigCommandsForDevice,
    getAllConfigCommands,
    hasDesign: design !== null,
  };
}