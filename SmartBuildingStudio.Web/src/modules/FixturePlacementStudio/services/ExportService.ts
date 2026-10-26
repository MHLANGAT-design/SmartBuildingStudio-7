// src/modules/FixturePlacementStudio/services/ExportService.ts
//
// Export a FixtureLayout to external formats.
//
// Formats implemented in v1.0:
//   - JSON:  full layout, round-trippable
//   - CSV:   fixture list, one row per fixture
//   - PDF:   validation report (via browser print; heavy lifting deferred)
//   - DXF:   fixture symbols as POINT entities on a FI-PLACEMENT layer
//
// Formats stubbed for later:
//   - IFC
//   - Revit (RVT)
//   - Excel (XLSX)
//
// Each exporter is a pure function taking (layout, options) and
// returning a Blob or string. The caller triggers the download.

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { ValidationReport } from '@/modules/FixturePlacementStudio/services/ValidationService';
import { serializeFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import { serializeZone } from '@/modules/FixturePlacementStudio/models/Zone';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'dxf' | 'ifc' | 'rvt' | 'xlsx';

export interface ExportOptions {
  /** Optional validation report to include. Required for PDF. */
  validationReport?: ValidationReport;
  /** Include zones in the output (where applicable). */
  includeZones?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  /** MIME type for the download. */
  mimeType: string;
  /** Suggested file name (without directory). */
  fileName: string;
  /** Payload: Blob for binary formats, string for text. */
  content: Blob | string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ExportService {
  static async export(
    format: ExportFormat,
    layout: FixtureLayout,
    options?: ExportOptions
  ): Promise<ExportResult> {
    switch (format) {
      case 'json':
        return ExportService.toJson(layout, options);
      case 'csv':
        return ExportService.toCsv(layout);
      case 'pdf':
        return ExportService.toPdf(layout, options);
      case 'dxf':
        return ExportService.toDxf(layout, options);
      case 'ifc':
        throw new Error('IFC export is not implemented in v1.0.');
      case 'rvt':
        throw new Error('Revit export is not implemented in v1.0.');
      case 'xlsx':
        throw new Error('XLSX export is not implemented in v1.0.');
    }
  }

  // ─── JSON ────────────────────────────────────────────────────────────

  private static toJson(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    const payload = {
      documentId: layout.documentId,
      revision: layout.revision,
      exportedAt: new Date().toISOString(),
      fixtures: layout.fixtures.map(serializeFixture),
      zones: options?.includeZones === false ? undefined : layout.zones.map(serializeZone),
      validation: options?.validationReport ?? undefined,
    };
    return {
      format: 'json',
      mimeType: 'application/json',
      fileName: `fixture-layout-${layout.documentId}.json`,
      content: JSON.stringify(payload, null, 2),
    };
  }

  // ─── CSV ─────────────────────────────────────────────────────────────

  private static toCsv(layout: FixtureLayout): ExportResult {
    const header = [
      'id',
      'kind',
      'productId',
      'x',
      'y',
      'rotation',
      'elevation',
      'roomId',
      'zoneIds',
    ];
    const rows: string[] = [header.join(',')];

    // Build fixture → zone index.
    const zoneMembership = new Map<string, string[]>();
    for (const zone of layout.zones) {
      for (const fid of zone.memberFixtureIds) {
        if (!zoneMembership.has(fid)) zoneMembership.set(fid, []);
        zoneMembership.get(fid)!.push(zone.id);
      }
    }

    for (const fixture of layout.fixtures) {
      const zones = zoneMembership.get(fixture.id)?.join(';') ?? '';
      rows.push([
        ExportService.csvCell(fixture.id),
        ExportService.csvCell(fixture.kind),
        ExportService.csvCell(fixture.productId),
        fixture.x.toString(),
        fixture.y.toString(),
        fixture.rotation.toString(),
        (fixture.elevation ?? 0).toString(),
        ExportService.csvCell(fixture.roomId ?? ''),
        ExportService.csvCell(zones),
      ].join(','));
    }

    return {
      format: 'csv',
      mimeType: 'text/csv',
      fileName: `fixture-layout-${layout.documentId}.csv`,
      content: rows.join('\n'),
    };
  }

  private static csvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // ─── PDF ─────────────────────────────────────────────────────────────

  private static toPdf(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    // v1.0 PDF: a self-contained HTML document with print-friendly CSS.
    // The caller opens it in a new tab and invokes window.print(). This
    // avoids pulling in a heavy PDF library for what is essentially a
    // formatted report. When richer PDF is needed, replace the body of
    // this method with a jsPDF or pdfmake implementation — the interface
    // (ExportResult) does not change.
    const report = options?.validationReport;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Fixture Layout Report — ${ExportService.htmlEscape(layout.documentId)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2em; color: #111; }
  h1 { font-size: 18pt; border-bottom: 1px solid #444; padding-bottom: 4pt; }
  h2 { font-size: 14pt; margin-top: 1.5em; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; }
  th { background: #f0f0f0; }
  .pass { color: #0a7a34; font-weight: bold; }
  .fail { color: #b00020; font-weight: bold; }
  .warn { color: #b26a00; }
</style>
</head>
<body>
<h1>Fixture Layout Report</h1>
<p><strong>Document:</strong> ${ExportService.htmlEscape(layout.documentId)}<br>
<strong>Revision:</strong> ${layout.revision}<br>
<strong>Generated:</strong> ${new Date().toISOString()}</p>

<h2>Summary</h2>
<p>
  <strong>Fixtures:</strong> ${layout.fixtures.length}<br>
  <strong>Zones:</strong> ${layout.zones.length}
</p>

${report ? `
<h2>Validation</h2>
<p>
  Status: <span class="${report.passed ? 'pass' : 'fail'}">
    ${report.passed ? 'PASSED' : 'FAILED'}
  </span><br>
  Errors: ${report.errorCount} · Warnings: ${report.warningCount} · Info: ${report.infoCount}
</p>
${report.violations.length > 0 ? `
<table>
<thead><tr><th>Severity</th><th>Rule</th><th>Message</th></tr></thead>
<tbody>
${report.violations.map(v => `
<tr>
  <td class="${v.severity === 'error' ? 'fail' : v.severity === 'warning' ? 'warn' : ''}">${v.severity.toUpperCase()}</td>
  <td>${ExportService.htmlEscape(v.ruleKind)}</td>
  <td>${ExportService.htmlEscape(v.message)}</td>
</tr>`).join('')}
</tbody>
</table>` : '<p>No violations.</p>'}
` : ''}

<h2>Fixtures</h2>
<table>
<thead><tr><th>ID</th><th>Kind</th><th>Product</th><th>X</th><th>Y</th><th>Rot</th></tr></thead>
<tbody>
${layout.fixtures.map(f => `
<tr>
  <td>${ExportService.htmlEscape(f.id)}</td>
  <td>${ExportService.htmlEscape(f.kind)}</td>
  <td>${ExportService.htmlEscape(f.productId)}</td>
  <td>${f.x.toFixed(2)}</td>
  <td>${f.y.toFixed(2)}</td>
  <td>${f.rotation.toFixed(4)}</td>
</tr>`).join('')}
</tbody>
</table>

<script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;

    return {
      format: 'pdf',
      mimeType: 'text/html', // printed to PDF by the browser
      fileName: `fixture-layout-${layout.documentId}.html`,
      content: html,
    };
  }

  private static htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── DXF ─────────────────────────────────────────────────────────────

  private static toDxf(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    // v1.0 DXF: minimal valid DXF with POINT entities for each fixture
    // and a textual annotation (productId) for each. Suitable for
    // importing into CAD as a reference layer. Not a full CAD export —
    // no blocks, no dynamic symbols. Those come in a follow-up.
    const lines: string[] = [];

    // ⚠️ DXF group codes are numbers (0 = entity type, 8 = layer,
    // 10/20/30 = coordinates, etc.). The value that follows them is
    // the actual data — which can be a number or a string. Accept
    // both and coerce them to strings when pushing to the output.
    const push = (code: string | number, value: string | number): void => {
      lines.push(String(code));
      lines.push(String(value));
    };

    // Header
    push(0, 'SECTION');
    push(2, 'HEADER');
    push(0, 'ENDSEC');

    // Entities
    push(0, 'SECTION');
    push(2, 'ENTITIES');

    for (const fixture of layout.fixtures) {
      // POINT entity at fixture location.
      push(0, 'POINT');
      push(8, 'FI-PLACEMENT');
      push(10, fixture.x);
      push(20, fixture.y);
      push(30, 0);

      // Text annotation with productId just above the point.
      push(0, 'TEXT');
      push(8, 'FI-PLACEMENT-ANNOT');
      push(10, fixture.x + 0.2);
      push(20, fixture.y + 0.2);
      push(30, 0);
      push(40, 0.3); // height
      push(1, fixture.kind.toUpperCase());

      // Full metadata as extended entity data (XDATA) would go here in a
      // future version. Kept minimal for v1.0.
    }

    if (options?.includeZones) {
      // Zone boundaries are derived, not authored, so we do not emit
      // polygons. A future version could compute zone convex hulls and
      // emit them as LWPOLYLINE on a FI-ZONE layer.
    }

    push(0, 'ENDSEC');
    push(0, 'EOF');

    return {
      format: 'dxf',
      mimeType: 'application/dxf',
      fileName: `fixture-layout-${layout.documentId}.dxf`,
      content: lines.join('\n'),
    };
  }
}

export default ExportService;