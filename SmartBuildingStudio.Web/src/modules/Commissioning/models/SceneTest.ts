// src/modules/Commissioning/models/SceneTest.ts

export interface SceneTestStep {
  deviceId: string;
  expectedLevel: number;
  actualLevel: number | null;
  passed: boolean;
}

export interface SceneTest {
  sceneTestId: string;
  sceneId: string;
  sceneName: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  startedAt: string | null;
  completedAt: string | null;
  steps: SceneTestStep[];
}