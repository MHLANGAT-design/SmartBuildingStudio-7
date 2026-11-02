// src/modules/DaliProgrammingStudio/store/index.ts

import programmingReducer from '@/modules/DaliProgrammingStudio/store/programmingSlice';

export const daliProgrammingReducer = programmingReducer;

export * from '@/modules/DaliProgrammingStudio/store/programmingSlice';
export * from '@/modules/DaliProgrammingStudio/store/programmingThunks';
export * from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
export type { ProgrammingState } from '@/modules/DaliProgrammingStudio/store/programmingTypes';