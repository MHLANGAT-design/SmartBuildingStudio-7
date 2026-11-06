// src/modules/DeviceDiscovery/Hooks/useDeviceIdentification.ts

/**
 * Focused hook for device identification.
 *
 * Exposes an identify(deviceId) action plus the identification result for the
 * currently selected device (if any) and per-call loading/error flags.
 *
 * Identification is per-device, so the hook reads the result keyed by the
 * requested id rather than a single slice slot.
 */

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSelectedDeviceId,
  selectIdentificationByDeviceId,
  selectIdentificationError,
  selectAsyncFlags,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import { identifyDevice } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

export const useDeviceIdentification = (deviceIdOverride?: string | null) => {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector(selectSelectedDeviceId);
  const targetId = deviceIdOverride ?? selectedId;

  const result = useAppSelector(selectIdentificationByDeviceId(targetId));
  const error = useAppSelector(selectIdentificationError);
  const asyncFlags = useAppSelector(selectAsyncFlags);
  const isIdentifying = asyncFlags.identifyDevice;

  // Local override so a caller can inspect a different device than the
  // currently selected one without changing global selection.
  const [localLastId, setLocalLastId] = useState<string | null>(null);
  const lastIdentifiedId = localLastId ?? targetId;

  const identify = useCallback(
    async (id: string) => {
      if (!id) throw new Error('A device is required for identification.');
      setLocalLastId(id);
      return dispatch(identifyDevice({ deviceId: id })).unwrap();
    },
    [dispatch]
  );

  const identifySelected = useCallback(async () => {
    if (!targetId) throw new Error('No device selected.');
    return identify(targetId);
  }, [identify, targetId]);

  return {
    targetId,
    lastIdentifiedId,
    result,
    isIdentifying,
    error,
    identify,
    identifySelected,
  };
};

export type UseDeviceIdentificationReturn = ReturnType<typeof useDeviceIdentification>;