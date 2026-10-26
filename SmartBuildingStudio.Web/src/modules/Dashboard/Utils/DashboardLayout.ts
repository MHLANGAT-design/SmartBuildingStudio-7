export interface IGridCoordinateBounds {
  spanX: number;
  spanY: number;
  cssGridClass: string;
}

/**
 * Calculates responsive Tailwind grid spanning values based on dynamic widget weights.
 */
export function calculateResponsiveWidgetSpans(widgetId: string, isExpandedMode: boolean = false): IGridCoordinateBounds {
  if (isExpandedMode) {
    return {
      spanX: 3,
      spanY: 2,
      cssGridClass: "col-span-1 md:col-span-2 xl:col-span-3 row-span-2"
    };
  }

  switch (widgetId) {
    case "recent-projects":
      return {
        spanX: 2,
        spanY: 2,
        cssGridClass: "col-span-1 md:col-span-2 row-span-2"
      };

    case "activity-log":
    case "notifications-center":
      return {
        spanX: 1,
        spanY: 2,
        cssGridClass: "col-span-1 row-span-2"
      };

    case "quick-launch":
    case "recent-documents":
    case "system-health":
    default:
      return {
        spanX: 1,
        spanY: 1,
        cssGridClass: "col-span-1 row-span-1"
      };
  }
}

/**
 * Re-indexes a list of dashboard widgets following a drag-and-drop structural movement.
 */
export function reorderWidgetPositionIndices<T extends { gridOrder: number; id: string }>(
  widgets: T[],
  movedWidgetId: string,
  targetIndex: number
): T[] {
  const sorted = [...widgets].sort((a, b) => a.gridOrder - b.gridOrder);
  const currentIndex = sorted.findIndex((w) => w.id === movedWidgetId);
  
  if (currentIndex === -1) return widgets;

  const [removed] = sorted.splice(currentIndex, 1);
  sorted.splice(targetIndex, 0, removed);

  return sorted.map((widget, index) => ({
    ...widget,
    gridOrder: index
  }));
}
