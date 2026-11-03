// src/modules/Commissioning/index.ts

export { CommissioningPage, default } from '@/modules/Commissioning/CommissioningPage';

// Export the reducer so it can be registered in ConfigureStore.ts
export { default as commissioningReducer } from '@/modules/Commissioning/store/commissioningSlice';

// Export key types for integration
export type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
export type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';