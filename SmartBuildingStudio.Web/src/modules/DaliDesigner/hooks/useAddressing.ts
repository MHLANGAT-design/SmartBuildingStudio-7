import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { autoAddress } from "@/modules/DaliDesigner/store/daliThunks";
import { AddressAllocator } from "@/modules/DaliDesigner/Document/AddressAllocator";
import { selectDevices } from "@/modules/DaliDesigner/store/daliSelectors";

export function useAddressing() {
  const dispatch = useAppDispatch();
  const devices = useAppSelector(selectDevices);
  return {
    conflicts: AddressAllocator.findConflicts(devices),
    auto: () => dispatch(autoAddress()),
  };
}