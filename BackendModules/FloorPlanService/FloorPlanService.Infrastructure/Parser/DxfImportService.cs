using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FloorPlanService.Application.Interfaces;
using FloorPlanService.Domain.Exceptions;
using FloorPlanService.Domain.Models;

namespace FloorPlanService.Infrastructure.Parser;

public class DxfImportService : IDxfImportService
{
    private class PythonShapeDto
    {
        public string type { get; set; } = string.Empty;
        public List<List<double>> points { get; set; } = new();
        public bool is_closed { get; set; }
        public string layer { get; set; } = string.Empty;
        public string? group_id { get; set; }
        public string? block_name { get; set; }     // ← ADD
    }

    private static readonly string[] ApiProjectFolderNames = { "FloorPlanService.Api" };
    private static readonly string[] InfraProjectFolderNames = { "FloorPlanService.Infrastructure" };

    private const string AppPyRelativePath = "FloorPlanService.Api/app.py";
    private const string VenvPythonRelativePath =
        "FloorPlanService.Infrastructure/Parser/.venv/Scripts/python.exe";

    private const string EnvAppPyPath = "FLOORPLAN_APP_PY";
    private const string EnvPythonExePath = "FLOORPLAN_PYTHON_EXE";

    public DxfArchitecturalPlan ImportDxf(Stream fileStream, string fileId)
    {
        string tempDxfPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.dxf");

        try
        {
            using (var file = File.Create(tempDxfPath))
            {
                fileStream.CopyTo(file);
            }

            string jsonOutput = RunPythonExtractor(tempDxfPath);

            var shapes = JsonSerializer.Deserialize<List<PythonShapeDto>>(jsonOutput);
            if (shapes == null || !shapes.Any())
                throw new InvalidDxfException("Python parser returned an empty or invalid JSON payload.");

            double minX = double.MaxValue, minY = double.MaxValue;
            double maxX = double.MinValue, maxY = double.MinValue;

            foreach (var shape in shapes)
            {
                if (shape.points == null) continue;
                foreach (var pt in shape.points)
                {
                    if (pt.Count >= 2)
                    {
                        minX = Math.Min(minX, pt[0]);
                        minY = Math.Min(minY, pt[1]);
                        maxX = Math.Max(maxX, pt[0]);
                        maxY = Math.Max(maxY, pt[1]);
                    }
                }
            }

            var plan = new DxfArchitecturalPlan(fileId, DxfStructureType.ExplodedGeometry);
            int entityCounter = 0;
            int fixtureCounter = 0;

            foreach (var shape in shapes)
            {
                if (shape.points == null || shape.points.Count < 2) continue;

                var normalizedPoints2D = new List<Vector2D>();
                foreach (var pt in shape.points)
                {
                    if (pt.Count >= 2)
                    {
                        double normalizedX = pt[0] - minX;
                        double normalizedY = pt[1] - minY;
                        normalizedPoints2D.Add(new Vector2D(normalizedX, normalizedY));
                    }
                }

                var (elementType, kind) = ClassifyLayerAndKind(shape.layer);

                if (elementType == ElementType.Fixture)
                {
                    double fMinX = double.MaxValue, fMinY = double.MaxValue;
                    double fMaxX = double.MinValue, fMaxY = double.MinValue;
                    foreach (var p in normalizedPoints2D)
                    {
                        fMinX = Math.Min(fMinX, p.X);
                        fMinY = Math.Min(fMinY, p.Y);
                        fMaxX = Math.Max(fMaxX, p.X);
                        fMaxY = Math.Max(fMaxY, p.Y);
                    }
                    double cx = (fMinX + fMaxX) / 2.0;
                    double cy = (fMinY + fMaxY) / 2.0;

                    plan.AddElement(new VectorEntity(
                        Id: $"py_fixture_{fixtureCounter++}",
                        Type: ElementType.Fixture,
                        OriginalLayer: shape.layer,
                        Points: new List<Vector2D> { new Vector2D(cx, cy) },
                        Rotation: 0,
                        Kind: kind,
                        GroupId: shape.group_id,
                        BlockName: shape.block_name        // ← ADD
                    ));
                    continue;
                }

                plan.AddElement(new VectorEntity(
                    Id: $"py_ent_{entityCounter++}",
                    Type: elementType,
                    OriginalLayer: shape.layer,
                    Points: normalizedPoints2D,
                    Rotation: 0,
                    Kind: null,
                    GroupId: shape.group_id,
                    BlockName: shape.block_name            // ← ADD
                ));
            }

            return plan;
        }
        catch (Exception ex)
        {
            try
            {
                File.WriteAllText(
                    Path.Combine(Path.GetTempPath(), "dxf_import_error.txt"),
                    ex.ToString()
                );
            }
            catch { /* ignore secondary failure */ }

            throw new InvalidDxfException($"DXF import pipeline failed: {ex.Message}", ex);
        }
        finally
        {
            if (File.Exists(tempDxfPath))
                File.Delete(tempDxfPath);
        }
    }

    private static string FindSolutionRoot(string startDir)
    {
        var dir = new DirectoryInfo(startDir);
        while (dir != null)
        {
            bool hasApi = ApiProjectFolderNames.Any(
                n => Directory.Exists(Path.Combine(dir.FullName, n))
            );
            bool hasInfra = InfraProjectFolderNames.Any(
                n => Directory.Exists(Path.Combine(dir.FullName, n))
            );

            if (hasApi && hasInfra)
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Could not locate FloorPlanService solution root from '{startDir}'. " +
            $"Expected an ancestor directory containing both " +
            $"'{ApiProjectFolderNames[0]}' and '{InfraProjectFolderNames[0]}'."
        );
    }

    private string RunPythonExtractor(string dxfFilePath)
    {
        string? envScriptPath = Environment.GetEnvironmentVariable(EnvAppPyPath);
        string? envVenvPython = Environment.GetEnvironmentVariable(EnvPythonExePath);

        string solutionRoot = FindSolutionRoot(AppContext.BaseDirectory);

        string scriptPath = !string.IsNullOrWhiteSpace(envScriptPath)
            ? envScriptPath!
            : Path.Combine(solutionRoot, AppPyRelativePath);

        string venvPython = !string.IsNullOrWhiteSpace(envVenvPython)
            ? envVenvPython!
            : Path.Combine(solutionRoot, VenvPythonRelativePath);

        if (!File.Exists(scriptPath))
            throw new FileNotFoundException(
                $"app.py was not found at '{scriptPath}'. " +
                $"Set the {EnvAppPyPath} environment variable to override."
            );

        if (!File.Exists(venvPython))
            throw new FileNotFoundException(
                $"Virtual environment python not found at '{venvPython}'. " +
                $"Set the {EnvPythonExePath} environment variable to override."
            );

        var startInfo = new ProcessStartInfo
        {
            FileName = venvPython,
            Arguments = $"\"{scriptPath}\" \"{dxfFilePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var process = new Process { StartInfo = startInfo };
        process.Start();

        string output = process.StandardOutput.ReadToEnd();
        string error = process.StandardError.ReadToEnd();
        process.WaitForExit();

        // Surface stderr always. app.py writes diagnostic messages to
        // stderr (block-name dump, debug file path) that are useful for
        // tracing import issues. Without this, they're silently dropped
        // unless the process exits non-zero.
        if (!string.IsNullOrWhiteSpace(error))
        {
            Console.WriteLine($"[DxfImportService] python stderr:\n{error}");
        }

        if (process.ExitCode != 0)
            throw new Exception($"Python Execution Failure (Exit Code {process.ExitCode}): {error}");

        if (string.IsNullOrWhiteSpace(output))
            throw new Exception($"Python output was empty. Error details: {error}");

        return output;
    }

    /// <summary>
    /// Classify a layer name (or a semantic tag emitted by app.py)
    /// into an ElementType and, for fixtures, a Kind string.
    /// </summary>
    private (ElementType Type, string? Kind) ClassifyLayerAndKind(string layerName)
    {
        if (string.IsNullOrWhiteSpace(layerName))
            return (ElementType.RawGeometry, null);

        if (layerName == "Semantic_Door")
            return (ElementType.Door, null);
        if (layerName == "Semantic_Window")
            return (ElementType.Window, null);
        if (layerName == "Semantic_Wall")
            return (ElementType.Wall, null);
        if (layerName == "Semantic_Wall_Structural")
            return (ElementType.Wall, null);

        const string FixturePrefix = "Semantic_Fixture_";
        if (layerName.StartsWith(FixturePrefix, StringComparison.Ordinal))
        {
            string kind = layerName.Substring(FixturePrefix.Length);
            if (string.IsNullOrWhiteSpace(kind)) kind = "luminaire";
            return (ElementType.Fixture, kind);
        }

        string l = layerName.ToLowerInvariant();

        if (l.Contains("door") || l.Contains("dr_") || l.Contains("panel"))
            return (ElementType.Door, null);

        if (l.Contains("win") || l.Contains("wd_") || l.Contains("glaz") || l.Contains("sash"))
            return (ElementType.Window, null);

        return (ElementType.RawGeometry, null);
    }
}