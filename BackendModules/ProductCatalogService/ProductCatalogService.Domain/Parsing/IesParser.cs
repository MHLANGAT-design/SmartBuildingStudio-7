using System.Globalization;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.Exceptions;
using ProductCatalogService.Domain.ValueObjects;

namespace ProductCatalogService.Domain.Parsing;

/// <summary>
/// Parses IES LM-63 (1986 / 1991 / 1995 / 2002) photometric files.
///
/// Format overview:
///   Header lines: "IESNA:LM-63-2002" followed by [KEY] value pairs.
///   "TILT=NONE" (or TILT=INCLUDE / TILT=data-file).
///   Numeric block: 10 lines of numbers (see below).
///   Angle arrays: vertical angles, then horizontal angles.
///   Candela grid: one value per (horizontal, vertical) combination.
///
/// The numeric block (10 values on one line in most files):
///   [0] number of lamps
///   [1] lumens per lamp
///   [2] candela multiplier
///   [3] number of vertical angles
///   [4] number of horizontal angles
///   [5] photometric type (1=C, 2=B, 3=A)
///   [6] units type (1=feet, 2=meters)
///   [7] width
///   [8] length
///   [9] height
///
/// TILT is accepted but not applied (TILT=NONE is the only variant
/// that matters for catalog data; files with tilt are rare and would
/// need an additional transformation).
///
/// BOM HANDLING:
///   Some Windows tools (PowerShell's `-Encoding UTF8`, Notepad, some
///   manufacturer exports) prepend a UTF-8 byte-order mark (\uFEFF)
///   to the file. The parser strips it before validation so files with
///   or without a BOM both parse cleanly.
/// </summary>
public static class IesParser
{
    public sealed record ParseResult(
        double TotalLumens,
        double PeakCandela,
        PhotometricSymmetry Symmetry,
        IReadOnlyList<CandelaSample> Samples,
        int VerticalAngleCount,
        int HorizontalAngleCount,
        string? Manufacturer,
        string? LuminaireName
    );

    public static ParseResult Parse(string iesText)
    {
        if (string.IsNullOrWhiteSpace(iesText))
            throw new IesParseException("File is empty.");

        // Strip UTF-8 BOM if present. Both PowerShell `-Encoding UTF8`
        // (Windows PowerShell 5.1) and some manufacturer export tools
        // prepend one. Without this, the header check fails with
        // "Missing IES header. First line: \uFEFFIESNA..."
        var cleanedText = iesText.TrimStart('\uFEFF');

        var lines = cleanedText
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Split('\n')
            .Select(l => l.Trim())
            .ToArray();

        if (lines.Length == 0)
            throw new IesParseException("File contains no lines.");

        // ── Header ─────────────────────────────────────────────
        if (!lines[0].StartsWith("IESNA", StringComparison.OrdinalIgnoreCase) &&
            !lines[0].StartsWith("IES", StringComparison.OrdinalIgnoreCase))
        {
            throw new IesParseException(
                $"Missing IES header. First line: \"{lines[0]}\"");
        }

        string? manufacturer = null;
        string? luminaireName = null;
        int idx = 1;

        while (idx < lines.Length)
        {
            var line = lines[idx];
            if (line.StartsWith("TILT=", StringComparison.OrdinalIgnoreCase))
                break;

            if (line.StartsWith("[MANUFAC]", StringComparison.OrdinalIgnoreCase))
                manufacturer = line["[MANUFAC]".Length..].Trim();
            else if (line.StartsWith("[LUMINAIRE]", StringComparison.OrdinalIgnoreCase))
                luminaireName = line["[LUMINAIRE]".Length..].Trim();

            idx++;
        }

        if (idx >= lines.Length || !lines[idx].StartsWith("TILT=", StringComparison.OrdinalIgnoreCase))
            throw new IesParseException("Missing TILT= line.");

        var tilt = lines[idx]["TILT=".Length..].Trim();
        idx++;

        if (!tilt.Equals("NONE", StringComparison.OrdinalIgnoreCase))
        {
            // TILT=INCLUDE has an additional numeric block before the main
            // one. TILT=datafile references an external file. Neither is
            // handled; skip by throwing so the user knows.
            throw new IesParseException(
                $"TILT={tilt} is not supported. Only TILT=NONE files are accepted.");
        }

        // ── Numeric block ──────────────────────────────────────
        // Skip blank lines.
        while (idx < lines.Length && string.IsNullOrWhiteSpace(lines[idx]))
            idx++;

        if (idx >= lines.Length)
            throw new IesParseException("File ends before numeric block.");

        var numericTokens = lines[idx].Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        if (numericTokens.Length < 10)
        {
            // Some files split the numeric block across two lines.
            // Join with the next line.
            if (idx + 1 < lines.Length)
            {
                numericTokens = (lines[idx] + " " + lines[idx + 1])
                    .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
                idx += 2;
            }
        }
        else
        {
            idx++;
        }

        if (numericTokens.Length < 10)
            throw new IesParseException(
                $"Numeric block requires 10 values, found {numericTokens.Length}.");

        var numLamps = ParseDouble(numericTokens[0], "number of lamps");
        var lumensPerLamp = ParseDouble(numericTokens[1], "lumens per lamp");
        var candelaMultiplier = ParseDouble(numericTokens[2], "candela multiplier");
        var numVertical = (int)ParseDouble(numericTokens[3], "number of vertical angles");
        var numHorizontal = (int)ParseDouble(numericTokens[4], "number of horizontal angles");
        // [5] photometric type, [6] units — informational, not used
        // [7] width, [8] length, [9] height — informational

        if (numVertical < 1 || numVertical > 1000)
            throw new IesParseException($"Invalid vertical angle count: {numVertical}.");
        if (numHorizontal < 1 || numHorizontal > 1000)
            throw new IesParseException($"Invalid horizontal angle count: {numHorizontal}.");

        // ── Vertical angles ────────────────────────────────────
        var verticalAngles = new double[numVertical];
        var vAnglesRead = 0;
        while (vAnglesRead < numVertical && idx < lines.Length)
        {
            var tokens = lines[idx].Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            idx++;
            foreach (var tok in tokens)
            {
                if (vAnglesRead >= numVertical) break;
                verticalAngles[vAnglesRead++] = ParseDouble(tok, "vertical angle");
            }
        }
        if (vAnglesRead < numVertical)
            throw new IesParseException($"Expected {numVertical} vertical angles, got {vAnglesRead}.");

        // ── Horizontal angles ──────────────────────────────────
        var horizontalAngles = new double[numHorizontal];
        var hAnglesRead = 0;
        while (hAnglesRead < numHorizontal && idx < lines.Length)
        {
            var tokens = lines[idx].Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            idx++;
            foreach (var tok in tokens)
            {
                if (hAnglesRead >= numHorizontal) break;
                horizontalAngles[hAnglesRead++] = ParseDouble(tok, "horizontal angle");
            }
        }
        if (hAnglesRead < numHorizontal)
            throw new IesParseException($"Expected {numHorizontal} horizontal angles, got {hAnglesRead}.");

        // ── Candela grid ───────────────────────────────────────
        // The grid has numHorizontal rows, each with numVertical values.
        // File order: all vertical angles for horizontal[0], then all for
        // horizontal[1], etc.
        var totalCandelaValues = numHorizontal * numVertical;
        var candela = new double[totalCandelaValues];
        var candelaRead = 0;
        while (candelaRead < totalCandelaValues && idx < lines.Length)
        {
            var tokens = lines[idx].Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            idx++;
            foreach (var tok in tokens)
            {
                if (candelaRead >= totalCandelaValues) break;
                candela[candelaRead++] = ParseDouble(tok, "candela value") * candelaMultiplier;
            }
        }
        if (candelaRead < totalCandelaValues)
            throw new IesParseException(
                $"Expected {totalCandelaValues} candela values, got {candelaRead}.");

        // ── Build CandelaSample list ──────────────────────────
        var samples = new List<CandelaSample>(totalCandelaValues);
        double peak = 0;
        for (int h = 0; h < numHorizontal; h++)
        {
            for (int v = 0; v < numVertical; v++)
            {
                var c = candela[h * numVertical + v];
                if (c > peak) peak = c;
                // Clamp negative → 0 to satisfy CandelaSample's non-negative check
                if (c < 0) c = 0;
                samples.Add(new CandelaSample(
                    horizontalAngle: horizontalAngles[h],
                    verticalAngle: verticalAngles[v],
                    candela: c));
            }
        }

        // ── Symmetry ───────────────────────────────────────────
        var symmetry = DeriveSymmetry(horizontalAngles);

        // ── Total lumens ──────────────────────────────────────
        // Prefer numLamps × lumensPerLamp when both are positive;
        // otherwise fall back to numeric integration of the candela grid.
        var totalLumens = numLamps > 0 && lumensPerLamp > 0
            ? numLamps * lumensPerLamp
            : IntegrateLumens(verticalAngles, horizontalAngles, candela, numHorizontal, numVertical);

        return new ParseResult(
            TotalLumens: totalLumens,
            PeakCandela: peak,
            Symmetry: symmetry,
            Samples: samples,
            VerticalAngleCount: numVertical,
            HorizontalAngleCount: numHorizontal,
            Manufacturer: manufacturer,
            LuminaireName: luminaireName);
    }

    // ── Helpers ────────────────────────────────────────────────

    private static double ParseDouble(string s, string context)
    {
        if (!double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var v))
            throw new IesParseException($"Cannot parse {context}: \"{s}\".");
        if (!double.IsFinite(v))
            throw new IesParseException($"{context} is not finite: {s}.");
        return v;
    }

    private static PhotometricSymmetry DeriveSymmetry(double[] horizontalAngles)
    {
        // IES symmetry is inferred from the horizontal angle count and range:
        //   1 horizontal angle            → rotational (symmetry code 4)
        //   2 angles, 0 and 180           → bilateral (symmetry code 3)
        //   3+ angles, 0..90              → quadrantal (symmetry code 2)
        //   3+ angles, 0..360, uneven     → none (symmetry code 1)
        if (horizontalAngles.Length == 1)
            return PhotometricSymmetry.Rotational;

        var max = horizontalAngles.Max();
        var min = horizontalAngles.Min();

        if (Math.Abs(min) < 0.5 && Math.Abs(max - 180) < 0.5 && horizontalAngles.Length == 2)
            return PhotometricSymmetry.Bilateral;

        if (Math.Abs(min) < 0.5 && Math.Abs(max - 90) < 0.5)
            return PhotometricSymmetry.Quadrantal;

        return PhotometricSymmetry.None;
    }

    /// <summary>
    /// Integrate candela over the lower hemisphere to estimate total flux.
    /// Used only when lumens-per-lamp is missing from the header.
    ///
    ///   Φ = Σ_θ I(θ) · 2π · sin(θ) · dθ   (rotational approximation)
    ///
    /// For non-rotational distributions, this over/under-counts. It's
    /// only a fallback for files with a missing lumens field.
    /// </summary>
    private static double IntegrateLumens(
        double[] verticalAngles,
        double[] horizontalAngles,
        double[] candelaGrid,
        int numHorizontal,
        int numVertical)
    {
        // Take the C0 plane (first horizontal) for a conservative estimate.
        double total = 0;
        for (int v = 0; v < numVertical - 1; v++)
        {
            var theta1 = verticalAngles[v] * Math.PI / 180;
            var theta2 = verticalAngles[v + 1] * Math.PI / 180;
            var midTheta = (theta1 + theta2) / 2;
            var dTheta = theta2 - theta1;

            var c1 = candelaGrid[0 * numVertical + v];
            var c2 = candelaGrid[0 * numVertical + v + 1];
            var midC = (c1 + c2) / 2;

            total += midC * Math.Sin(midTheta) * dTheta;
        }
        return total * 2 * Math.PI;
    }
}