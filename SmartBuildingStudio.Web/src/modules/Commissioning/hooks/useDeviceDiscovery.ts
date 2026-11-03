// src/modules/Commissioning/hooks/useDeviceDiscovery.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectIsDiscovering, 
  selectDeviceCount,
  selectActiveSession 
} from '@/modules/Commissioning/store/commissioningSelectors';
import { DeviceDiscoveryFlow } from '@/modules/Commissioning/Workflows/deviceDiscoveryFlow';
import { setSession, setDiscovering, setError } from '@/modules/Commissioning/store/commissioningSlice';

export function useDeviceDiscovery() {
  const dispatch = useAppDispatch();
  
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const deviceCount = useAppSelector(selectDeviceCount);
  const session = useAppSelector(selectActiveSession);

  const discoverDevices = useCallback(async (gatewayId: string, lineId: string) => {
    if (!session) return null;

    dispatch(setDiscovering(true));
    try {
      // Note: Flow returns a new session object
      const updatedSession = await DeviceDiscoveryFlow.execute(session, gatewayId, lineId);
      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message || 'Discovery failed'));
      return null;
    } finally {
      dispatch(setDiscovering(false));
    }
  }, [dispatch, session]);

  return {
    isDiscovering,
    deviceCount,
    discoverDevices,
    hasDiscovered: deviceCount > 0,
  };
}