import { useAppSelector } from "@/store/hooks";
import { selectDevices, selectDeviceById } from "@/modules/DaliDesigner/store/daliSelectors";

export function useDevices() {
  const devices = useAppSelector(selectDevices);
  return { devices };
}

export function useDevice(id: string) {
  return useAppSelector((s) => selectDeviceById(s, id));
}