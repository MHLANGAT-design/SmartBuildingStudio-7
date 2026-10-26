import { ElementType } from './types';

/**
 * Global interface theme configuration properties 
 * for the dark AutoCAD-style vector workspace.
 */
export const CAD_THEME = {
  BACKGROUND: '#000000',
  AXIS_GRID: '#1C1C1C',
  HUD_TEXT: '#00FF00'
};

/**
 * Strict vector color assignment mapping schemas.
 * Forces high-contrast visibility to separate elements instantly.
 */
export const LAYER_COLOR_MAP: Record<ElementType, string> = {
  [ElementType.Wall]: '#FFFFFF',    // Crisp Solid White for structural wall lines
  [ElementType.Door]: '#FF69B4',    // Bright High-Visibility Hot Pink for all doors
  [ElementType.Window]: '#00FFFF'   // Vivid Cyan Blue for window pane tracks inside openings
};
