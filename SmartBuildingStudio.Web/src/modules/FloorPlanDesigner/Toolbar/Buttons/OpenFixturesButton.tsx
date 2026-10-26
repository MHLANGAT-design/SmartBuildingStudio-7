// src/modules/FloorPlanDesigner/Toolbar/Buttons/OpenFixturesButton.tsx
//
// Toolbar button that opens the current document in FixturePlacementStudio.
// Matches the styling of SaveButton and SaveAsButton in the same toolbar.
//
// Enablement rules:
//   - Read-only (document locked by another user): disabled with
//     "🔒 Locked" tooltip. Prevents editing the locked document in
//     another module.
//   - Normal floorplan track (mode=floorplans): enabled (as long as a
//     document id is present).
//   - Import track (mode=floorplans & action=import-dwg): disabled until
//     the imported DXF has been saved — i.e., isDirty === false AND the
//     document has at least one wall, door, window, or room in Redux.
//     This prevents jumping to the studio with an unsaved import.

import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { UseOpenFixtures } from "@/modules/FloorPlanDesigner/Hooks/UseOpenFixtures";
import { UseDesignerMode } from "@/modules/FloorPlanDesigner/Hooks/UseDesignerMode";

export interface OpenFixturesButtonProps {
  /** When true, the button is shown in a compact mode (icon + short label). */
  compact?: boolean;
  /** When true, the button stretches to fill its parent width. */
  fullWidth?: boolean;
  /**
   * LEVEL 1 LOCK ENFORCEMENT — set by callers (e.g. DrawingExplorer) when
   * the source document is locked by another user. Blocks navigation
   * into FixturePlacementStudio, where the user could otherwise edit
   * the locked document (the backend would reject saves with 423, but
   * the FPS UI itself would still allow edits).
   */
  isReadOnly?: boolean;
}

export const OpenFixturesButton: React.FC<OpenFixturesButtonProps> = ({
  compact = false,
  fullWidth = false,
  isReadOnly = false,
}) => {
  const { handleOpenFixtures, isOpening } = UseOpenFixtures();
  const { isImportTrack } = UseDesignerMode();

  // Read the floor plan document + dirty flag from Redux
  const document = useAppSelector((s: any) => s.floorPlan?.document);
  const isDirty = useAppSelector((s: any) => s.floorPlan?.isDirty) === true;

  const hasGeometry =
    !!document &&
    ((document.walls?.length ?? 0) > 0 ||
      (document.doors?.length ?? 0) > 0 ||
      (document.windows?.length ?? 0) > 0 ||
      (document.rooms?.length ?? 0) > 0 ||
      (document.importedDrawings?.length ?? 0) > 0);

  const hasDocument = !!(document?.id);

  // Disabled when:
  //   - read-only (locked by another user) — HIGHEST priority
  //   - already opening
  //   - no document
  //   - in import track AND unsaved or no geometry
  const isDisabled =
    isReadOnly ||
    isOpening ||
    !hasDocument ||
    (isImportTrack && (isDirty || !hasGeometry));

  // Tooltip explains WHY the button is disabled
  const title = isReadOnly
    ? "Read-only: document is locked by another user"
    : isDisabled
    ? isImportTrack
      ? isDirty
        ? "Save the imported DXF before opening Fixture Placement Studio"
        : !hasGeometry
          ? "Import a DXF file before opening Fixture Placement Studio"
          : "Open this document in Fixture Placement Studio"
      : "Open this document in Fixture Placement Studio"
    : "Open this document in Fixture Placement Studio";

  // Visual: read-only uses amber tint to match the read-only banner,
  // other disabled states use the neutral slate "off" look.
  const buttonColor = isReadOnly ? "#FFB800" : "#F59E0B";
  const buttonBackground = isReadOnly
    ? "rgba(255, 184, 0, 0.12)"
    : isDisabled
    ? "#0F172A"
    : "rgba(245, 158, 11, 0.1)";
  const buttonBorder = isReadOnly
    ? "1px solid rgba(255, 184, 0, 0.4)"
    : "1px solid #1E293B";

  return (
    <button
      type="button"
      onClick={handleOpenFixtures}
      disabled={isDisabled}
      title={title}
      style={{
        padding: "6px 14px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        border: buttonBorder,
        borderRadius: fullWidth ? "4px" : "8px",
        backgroundColor: buttonBackground,
        color: buttonColor,
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: fullWidth ? "center" : "flex-start",
        gap: "6px",
        boxShadow:
          isDisabled || isReadOnly
            ? "none"
            : "0 0 10px rgba(245, 158, 11, 0.1)",
        width: fullWidth ? "100%" : undefined,
        opacity: isReadOnly ? 0.85 : isDisabled ? 0.4 : 1,
      }}
      className={isDisabled || isReadOnly ? "" : "hover:bg-amber-500/20"}
    >
      <span>{isReadOnly ? "🔒" : "💡"}</span>
      {isReadOnly
        ? "Fixtures — Locked"
        : isOpening
        ? "Opening..."
        : compact
        ? "Fixtures"
        : "Open Fixtures"}
    </button>
  );
};

export default OpenFixturesButton;