// Re-export shim — the real store lives in ConfigureStore.ts.
export {
  store,
  useAppDispatch,
  useAppSelector,
  type RootState,
  type AppDispatch,
  type ThunkApiConfig,
} from "@/Application/ConfigureStore";