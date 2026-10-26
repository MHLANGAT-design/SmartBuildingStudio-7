// Re-export shim — the real hooks live in the app-level store.
// Kept so DALI Designer (and anything else) can keep importing from
// "@/store/hooks" without churn.
export { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";