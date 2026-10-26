// src/modules/Admin/ProductCatalog/lib/iesClientParser.ts
//
// Client-side IES LM-63 parser — used only for previewing a file
// before upload. The authoritative parse happens on the backend
// (IesParser.cs) after the file is POSTed; this is for UI feedback.
//
// Handles the same formats as the backend parser (1986 / 1991 / 1995
// / 2002, TILT=NONE) and produces a summary the dialog can display:
// sample count, total lumens, peak candela, symmetry, manufacturer.
//
// The logic is a faithful port of IesParser.cs, minus the full
// CandelaSample[] construction — we don't need the samples array
// client-side, only the summary.

export type IesSymmetry = 'none' | 'rotational' | 'quadrantal' | 'bilateral';

export interface IesPreviewResult {
  totalLumens: number;
  peakCandela: number;
  symmetry: IesSymmetry;
  sampleCount: number;
  verticalAngleCount: number;
  horizontalAngleCount: number;
  manufacturer: string | null;
  luminaireName: string | null;
}

export interface IesPreviewError {
  error: string;
}

export type IesPreviewOutcome = IesPreviewResult | IesPreviewError;

export function isIesPreviewSuccess(r: IesPreviewOutcome): r is IesPreviewResult {
  return 'totalLumens' in r;
}

/**
 * Parse an IES file for display preview. Never throws — returns
 * { error } for any failure so the dialog can show the message
 * without try/catch ceremony.
 */
export function parseIesForPreview(text: string): IesPreviewOutcome {
  try {
    return parseInternal(text);
  } catch (err: any) {
    return { error: err?.message ?? 'Failed to parse IES file' };
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

function parseInternal(iesText: string): IesPreviewResult {
  if (!iesText || iesText.trim().length === 0) {
    throw new Error('File is empty.');
  }

  // Strip UTF-8 BOM if present (same as backend).
  const cleanedText = iesText.replace(/^\uFEFF/, '');

  const lines = cleanedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  if (lines.length === 0) {
    throw new Error('File contains no lines.');
  }

  // ── Header ─────────────────────────────────────────────
  const first = lines[0];
  if (!/^IESNA/i.test(first) && !/^IES/i.test(first)) {
    throw new Error(`Missing IES header. First line: "${first}"`);
  }

  let manufacturer: string | null = null;
  let luminaireName: string | null = null;
  let idx = 1;

  while (idx < lines.length) {
    const line = lines[idx];
    if (/^TILT=/i.test(line)) break;
    if (/^\[MANUFAC\]/i.test(line)) {
      manufacturer = line.substring('[MANUFAC]'.length).trim();
    } else if (/^\[LUMINAIRE\]/i.test(line)) {
      luminaireName = line.substring('[LUMINAIRE]'.length).trim();
    }
    idx++;
  }

  if (idx >= lines.length || !/^TILT=/i.test(lines[idx])) {
    throw new Error('Missing TILT= line.');
  }

  const tilt = lines[idx].substring('TILT='.length).trim();
  idx++;

  if (!/^NONE$/i.test(tilt)) {
    throw new Error(
      `TILT=${tilt} is not supported. Only TILT=NONE files are accepted.`
    );
  }

  // ── Numeric block ──────────────────────────────────────
  while (idx < lines.length && lines[idx].trim().length === 0) idx++;
  if (idx >= lines.length) throw new Error('File ends before numeric block.');

  let numericTokens = lines[idx].split(/\s+/).filter(Boolean);
  if (numericTokens.length < 10 && idx + 1 < lines.length) {
    numericTokens = (lines[idx] + ' ' + lines[idx + 1]).split(/\s+/).filter(Boolean);
    idx += 2;
  } else {
    idx++;
  }

  if (numericTokens.length < 10) {
    throw new Error(`Numeric block requires 10 values, found ${numericTokens.length}.`);
  }

  const numLamps = parseNum(numericTokens[0], 'number of lamps');
  const lumensPerLamp = parseNum(numericTokens[1], 'lumens per lamp');
  const candelaMultiplier = parseNum(numericTokens[2], 'candela multiplier');
  const numVertical = Math.floor(parseNum(numericTokens[3], 'number of vertical angles'));
  const numHorizontal = Math.floor(parseNum(numericTokens[4], 'number of horizontal angles'));

  if (numVertical < 1 || numVertical > 1000) {
    throw new Error(`Invalid vertical angle count: ${numVertical}.`);
  }
  if (numHorizontal < 1 || numHorizontal > 1000) {
    throw new Error(`Invalid horizontal angle count: ${numHorizontal}.`);
  }

  // ── Vertical angles ────────────────────────────────────
  const verticalAngles = readNumbers(lines, idx, numVertical, 'vertical angle');
  idx = verticalAngles.nextIdx;

  // ── Horizontal angles ──────────────────────────────────
  const horizontalAngles = readNumbers(lines, idx, numHorizontal, 'horizontal angle');
  idx = horizontalAngles.nextIdx;

  // ── Candela grid ───────────────────────────────────────
  const total = numHorizontal * numVertical;
  const candelaValues = readNumbers(lines, idx, total, 'candela value');
  // idx = candelaValues.nextIdx; // not needed past here

  let peak = 0;
  for (const raw of candelaValues.values) {
    const c = raw * candelaMultiplier;
    if (c > peak) peak = c;
  }

  // ── Symmetry ───────────────────────────────────────────
  const symmetry = deriveSymmetry(horizontalAngles.values);

  // ── Total lumens ───────────────────────────────────────
  const totalLumens =
    numLamps > 0 && lumensPerLamp > 0
      ? numLamps * lumensPerLamp
      : 0;

  return {
    totalLumens,
    peakCandela: peak,
    symmetry,
    sampleCount: total,
    verticalAngleCount: numVertical,
    horizontalAngleCount: numHorizontal,
    manufacturer,
    luminaireName,
  };
}

function parseNum(s: string, context: string): number {
  const v = Number(s);
  if (!Number.isFinite(v)) {
    throw new Error(`Cannot parse ${context}: "${s}".`);
  }
  return v;
}

function readNumbers(
  lines: string[],
  startIdx: number,
  count: number,
  context: string
): { values: number[]; nextIdx: number } {
  const values: number[] = [];
  let idx = startIdx;
  while (values.length < count && idx < lines.length) {
    const tokens = lines[idx].split(/\s+/).filter(Boolean);
    idx++;
    for (const tok of tokens) {
      if (values.length >= count) break;
      values.push(parseNum(tok, context));
    }
  }
  if (values.length < count) {
    throw new Error(`Expected ${count} ${context}s, got ${values.length}.`);
  }
  return { values, nextIdx: idx };
}

function deriveSymmetry(horizontalAngles: number[]): IesSymmetry {
  if (horizontalAngles.length === 1) return 'rotational';

  const min = Math.min(...horizontalAngles);
  const max = Math.max(...horizontalAngles);

  if (Math.abs(min) < 0.5 && Math.abs(max - 180) < 0.5 && horizontalAngles.length === 2) {
    return 'bilateral';
  }
  if (Math.abs(min) < 0.5 && Math.abs(max - 90) < 0.5) {
    return 'quadrantal';
  }

  return 'none';
}