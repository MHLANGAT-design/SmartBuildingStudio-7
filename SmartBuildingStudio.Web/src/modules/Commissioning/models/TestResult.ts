// src/modules/Commissioning/models/TestResult.ts

export type TestStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING';

export interface TestResult {
  testId: string;
  targetId: string; // deviceId or groupId
  testType: 'NETWORK' | 'SCENE' | 'SIGNAL' | 'DEVICE';
  status: TestStatus;
  expectedValue: unknown;
  actualValue: unknown;
  message?: string;
  timestamp: string;
  durationMs: number;
}