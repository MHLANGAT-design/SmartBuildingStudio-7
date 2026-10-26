// src/modules/FloorPlanDesigner/Components/DatabaseContentDump.tsx
// COMPLETE FILE - Pure Database Content Exposure Page
import React, { useEffect, useState } from 'react';
import { API_ROUTES } from '@/Application/ApiRoutes';

export const DatabaseContentDump: React.FC = () => {
  const [dbPayload, setDbPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const activeDocumentId = urlParams.get('documentId') || "5c5306e4-d447-4011-afd7-2dc5412b0f0a";

  useEffect(() => {
    const exposeDatabaseRow = async () => {
      try {
        const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(activeDocumentId);
        const response = await fetch(url, { method: 'GET' });
        
        if (!response.ok) throw new Error(`HTTP Database Connection Error: ${response.status}`);
        const data = await response.json();
        setDbPayload(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    exposeDatabaseRow();
  }, [activeDocumentId]);

  if (loading) return <div style={{ padding: "20px", color: "#64748B", fontFamily: "monospace" }}>🔍 Querying database engines...</div>;
  if (error) return <div style={{ padding: "20px", color: "#EF4444", fontFamily: "monospace" }}>❌ Database Connection Failed: {error}</div>;

  return (
    <div style={{ padding: "24px", backgroundColor: "#030712", minHeight: "100vh", color: "#E2E8F0", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }}>
      <div style={{ borderBottom: "1px solid #1E293B", paddingBottom: "12px", marginBottom: "16px" }}>
        <h2 style={{ color: "#05FFC4", margin: 0, textTransform: "uppercase" }}>🛢️ Database Exposure Console // Live Payload Inspection</h2>
        <span style={{ color: "#64748B", fontSize: "11px" }}>TARGET ID: {activeDocumentId}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Section 1: Raw Database Record Row */}
        <div>
          <div style={{ color: "#38BDF8", fontWeight: "bold", marginBottom: "6px" }}>[1] CORE RECORD COLUMNS:</div>
          <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px", overflowX: "auto" }}>
            <p><strong>Document Name:</strong> <span style={{ color: "#F59E0B" }}>{dbPayload?.name || dbPayload?.Name}</span></p>
            <p><strong>Created Date:</strong> {dbPayload?.createdAt}</p>
            <p><strong>Last Modified By:</strong> {dbPayload?.lastModifiedBy || "System"}</p>
          </div>
        </div>

        {/* Section 2: Expose Content Tables */}
        <div>
          <div style={{ color: "#10B981", fontWeight: "bold", marginBottom: "6px" }}>[2] EXPOSED CONTENT LAYER (drawnWallsJson):</div>
          <pre style={{ backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "8px", padding: "16px", overflowX: "auto", color: "#34D399", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {dbPayload?.drawnWallsJson || dbPayload?.DrawnWallsJson || "EMPTY (No walls or apertures found inside row)"}
          </pre>
        </div>

        <div>
          <div style={{ color: "#A855F7", fontWeight: "bold", marginBottom: "6px" }}>[3] EXPOSED CONTENT LAYER (definedRoomsJson):</div>
          <pre style={{ backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "8px", padding: "16px", overflowX: "auto", color: "#C084FC", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {dbPayload?.definedRoomsJson || dbPayload?.DefinedRoomsJson || "EMPTY (No defined architectural space entities)"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DatabaseContentDump;
