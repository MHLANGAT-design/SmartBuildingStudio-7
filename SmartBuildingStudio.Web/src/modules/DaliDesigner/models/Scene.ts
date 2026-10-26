export interface Scene {
  id: string;
  name: string;
  levels: Record<string, number>; // deviceId -> 0..254
  fadeTime?: number;
}