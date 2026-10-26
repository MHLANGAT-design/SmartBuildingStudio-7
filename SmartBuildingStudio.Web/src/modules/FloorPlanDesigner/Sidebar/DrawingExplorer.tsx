// src/modules/FloorPlanDesigner/Sidebar/DrawingExplorer.tsx
//
// Sidebar panel for inspecting and importing DXF content.
//
// LEVEL 1 READ-ONLY: accepts isReadOnly from FloorPlanSidebar, which
// gets it from FloorPlanDesigner (which derives it from the loaded
// document's isLocked / lockedByUsername fields). When read-only:
//   • Save Plan Variations button is disabled
//   • Choose DXF File button is disabled (importing = editing)
//   • Open Fixtures button is disabled (would let user edit in FPS)
//   • Entity list is still browsable (reading is fine)
//
// IMPORT SAFETY GATE — hasSavedGeometry:
//   The Choose DXF File button is disabled when the current document
//   already contains floorplan geometry (walls / doors / windows /
//   rooms / elements). Importing a fresh DXF would overwrite the
//   stored plan, which is destructive and cannot be undone from the
//   UI.
//
//   IMPORTANT: this gate reads DOCUMENT STATE, not the URL mode.
//   `UseDesignerMode().isFloorPlanTrack` is a URL-derived flag meaning
//   "the URL is the default floorplans track" — it is true for any
//   empty document opened via /designer?mode=floorplans too, and it is
//   false for the explicit import track (`?action=import-dwg`). Neither
//   matches the requirement. The requirement is a property of the
//   document's content, so we read the content. The toolbar's
//   ImportDrawingButton reads the same predicate so both entry points
//   behave identically.

import React, { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { UseFloorPlanSaving } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanSaving";
import { UseDesignerMode } from "@/modules/FloorPlanDesigner/Hooks/UseDesignerMode";
import { UseDxfImport } from "@/modules/FloorPlanDesigner/Hooks/UseDxfImport";
import {
  RawDxfEntity,
  getElementType,
} from "@/modules/FloorPlanDesigner/core/parsers/DxfResponseBuilders";
import { OpenFixturesButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/OpenFixturesButton";

// Patch the global document instance with method-shaped accessors some
// legacy code reads. Runs once at module load.
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__floorPlanActiveDocumentInstance) win.__floorPlanActiveDocumentInstance = {};
  const doc = win.__floorPlanActiveDocumentInstance;
  if (!doc.getWalls) doc.getWalls = () => doc.walls || [];
  if (!doc.getDoors) doc.getDoors = () => doc.doors || [];
  if (!doc.getWindows) doc.getWindows = () => doc.windows || [];
  if (!doc.getRooms) doc.getRooms = () => doc.rooms || [];
}

export interface DrawingExplorerProps {
  toolManager?: any;
  toolContext?: any;
  isReadOnly?: boolean;
}

export function DrawingExplorer({
  toolManager,
  toolContext,
  isReadOnly = false,
}: DrawingExplorerProps = {}) {
  const dispatch = useAppDispatch();

  const {
    fileInputRef,
    importing,
    error,
    triggerFilePicker,
    handleFileChange,
  } = UseDxfImport();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeLayerFilter, setActiveLayerFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());

  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const docMeta = floorPlanState.document || floorPlanState.Document;
  const rawElements: RawDxfEntity[] = docMeta?.elements || [];

  // Document already carries floorplan geometry. Blocks import.
  // Same predicate as ImportDrawingButton — see file header comment.
  const hasSavedGeometry = (() => {
    const doc: any = docMeta;
    if (!doc) return false;
    return (
      (Array.isArray(doc.walls) && doc.walls.length > 0) ||
      (Array.isArray(doc.doors) && doc.doors.length > 0) ||
      (Array.isArray(doc.windows) && doc.windows.length > 0) ||
      (Array.isArray(doc.rooms) && doc.rooms.length > 0) ||
      (Array.isArray(doc.elements) && doc.elements.length > 0)
    );
  })();

  const { isSaving, isDirty, saveWorkspaceData } = UseFloorPlanSaving();
  const hasValidId = docMeta && docMeta.id && docMeta.id !== "";

  // Kept for potential future URL-mode-based UI. Not used by the import
  // gate any more (see header comment).
  const { isFloorPlanTrack } = UseDesignerMode();

  const layers = useMemo(() => {
    const layerSet = new Set<string>();
    rawElements.forEach((ent) => {
      const l = ent.layer || ent.Layer || ent.originalLayer || ent.OriginalLayer;
      if (l) layerSet.add(l);
    });
    return Array.from(layerSet).sort();
  }, [rawElements]);

  const entityGroupCounts = useMemo(() => {
    return rawElements.reduce<Record<string, number>>((acc, ent) => {
      const typeStr = getElementType(ent);
      acc[typeStr] = (acc[typeStr] || 0) + 1;
      return acc;
    }, {});
  }, [rawElements]);

  const filteredEntities = useMemo(() => {
    return rawElements.filter((ent) => {
      const entLayer = ent.layer || ent.Layer || ent.originalLayer || "UNASSIGNED";
      const entType = getElementType(ent);
      const matchesLayer = activeLayerFilter === "ALL" || entLayer === activeLayerFilter;
      const matchesSearch =
        searchQuery === "" ||
        String(ent.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ent.name && ent.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLayer && matchesSearch;
    });
  }, [rawElements, activeLayerFilter, searchQuery]);

  const handleSave = async () => {
    if (isReadOnly) {
      setSaveError("Read-only: cannot save a locked document.");
      return;
    }
    setSaveError(null);
    setSaveSuccess(null);
    if (!hasValidId) {
      setSaveError("Document ID is missing.");
      return;
    }
    try {
      await saveWorkspaceData();
      setSaveSuccess("✅ Saved successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Save failed.");
    }
  };

  const toggleEntitySelection = (id: string) => {
    const next = new Set(selectedEntityIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedEntityIds(next);
  };

  const handleSelectAllVisible = () => {
    if (selectedEntityIds.size === filteredEntities.length) {
      setSelectedEntityIds(new Set());
    } else {
      setSelectedEntityIds(new Set(filteredEntities.map((e) => String(e.id))));
    }
  };

  // Combined disable state for the Choose DXF File button.
  const chooseDxfDisabled = importing || hasSavedGeometry || isReadOnly;

  return (
    <div
      style={{
        background: "#0B0F19",
        border: "1px dashed #1E293B",
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
        maxHeight: "85vh",
        color: "#F8FAFC",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".dxf"
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={chooseDxfDisabled}
          title={
            isReadOnly
              ? "Read-only: cannot import into a locked document"
              : hasSavedGeometry
              ? "A floor plan is already saved for this document. Clear the plan before importing a new DWG."
              : "Choose a DXF file to import"
          }
          style={{
            background:
              isReadOnly || hasSavedGeometry ? "#0F172A" : "rgba(56, 189, 248, 0.1)",
            border: "1px solid #0EA5E9",
            color: "#38BDF8",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "11px",
            cursor: chooseDxfDisabled ? "not-allowed" : "pointer",
            width: "100%",
            fontWeight: 600,
            opacity: chooseDxfDisabled ? 0.4 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {importing
            ? "Processing Pipeline..."
            : hasSavedGeometry
            ? "🔒 Choose DXF File"
            : "📥 Choose DXF File"}
        </button>

        {hasValidId && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isReadOnly}
            title={isReadOnly ? "Read-only: document is locked by another user" : undefined}
            style={{
              background: isReadOnly
                ? "rgba(255, 184, 0, 0.12)"
                : isDirty
                ? "#10B981"
                : "#1E293B",
              color: isReadOnly ? "#FFB800" : "#FFFFFF",
              border: isReadOnly ? "1px solid rgba(255, 184, 0, 0.4)" : "none",
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: isSaving || isReadOnly ? "not-allowed" : "pointer",
              width: "100%",
              fontWeight: 600,
              opacity: isReadOnly ? 0.75 : 1,
              transition: "all 0.15s ease",
            }}
          >
            {isReadOnly
              ? "🔒 Locked — Read-only"
              : isSaving
              ? "Saving..."
              : isDirty
              ? "💾 Save Plan Variations"
              : "Saved"}
          </button>
        )}

        {hasValidId && (
          <OpenFixturesButton fullWidth isReadOnly={isReadOnly} />
        )}
      </div>

      {saveError && <div style={{ fontSize: "10px", color: "#EF4444" }}>{saveError}</div>}
      {saveSuccess && <div style={{ fontSize: "10px", color: "#05FFC4" }}>{saveSuccess}</div>}
      {error && <div style={{ fontSize: "10px", color: "#EF4444" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
        <input
          type="text"
          placeholder="Search entities, handles, layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "#0F172A",
            border: "1px solid #334155",
            color: "#F8FAFC",
            padding: "6px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <select
          value={activeLayerFilter}
          onChange={(e) => setActiveLayerFilter(e.target.value)}
          style={{
            background: "#0F172A",
            border: "1px solid #334155",
            color: "#F8FAFC",
            padding: "6px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            width: "100%",
          }}
        >
          <option value="ALL">All CAD Layers ({rawElements.length})</option>
          {layers.map((layer) => (
            <option key={layer} value={layer}>
              Layer: {layer}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "6px 0",
          borderTop: "1px solid #1E293B",
          borderBottom: "1px solid #1E293B",
        }}
      >
        {Object.entries(entityGroupCounts).map(([type, count]) => (
          <span
            key={type}
            style={{
              fontSize: "9px",
              fontFamily: "monospace",
              background: "#1E293B",
              color: "#94A3B8",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {type.toUpperCase()}: {count}
          </span>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          paddingRight: "2px",
        }}
      >
        {filteredEntities.length === 0 ? (
          <div style={{ fontSize: "11px", color: "#64748B", textAlign: "center", padding: "12px 0" }}>
            No DXF elements match selection.
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const idStr = String(entity.id || "");
            const entityType = getElementType(entity);
            const isSelected = selectedEntityId === idStr;
            const isChecked = selectedEntityIds.has(idStr);

            return (
              <div
                key={idStr}
                onClick={() => setSelectedEntityId(idStr)}
                style={{
                  padding: "6px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  background: isSelected ? "rgba(14, 165, 233, 0.15)" : "#0F172A",
                  border: isSelected ? "1px solid #0EA5E9" : "1px solid #1E293B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleEntitySelection(idStr);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{entity.name || idStr}</div>
                    <div style={{ fontSize: "9px", color: "#64748B", fontFamily: "monospace" }}>
                      TYPE: {entityType} | LAYER: {entity.layer || entity.Layer || entity.originalLayer || "DEFPOINTS"}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: "bold",
                    padding: "1px 4px",
                    borderRadius: "2px",
                    background:
                      entityType === "door"
                        ? "rgba(234, 179, 8, 0.2)"
                        : entityType === "wall"
                        ? "rgba(59, 130, 246, 0.2)"
                        : entityType === "window"
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(148, 163, 184, 0.2)",
                    color:
                      entityType === "door"
                        ? "#EAB308"
                        : entityType === "wall"
                        ? "#60A5FA"
                        : entityType === "window"
                        ? "#34D399"
                        : "#94A3B8",
                  }}
                >
                  {entityType.toUpperCase()}
                </span>
              </div>
            );
          })
        )}
      </div>

      {filteredEntities.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#94A3B8",
            borderTop: "1px solid #1E293B",
            paddingTop: "6px",
          }}
        >
          <span>Selected: {selectedEntityIds.size}</span>
          <button
            type="button"
            onClick={handleSelectAllVisible}
            style={{
              background: "none",
              border: "none",
              color: "#38BDF8",
              fontSize: "10px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {selectedEntityIds.size === filteredEntities.length ? "Deselect All" : "Select All Visible"}
          </button>
        </div>
      )}
    </div>
  );
}

export default DrawingExplorer;