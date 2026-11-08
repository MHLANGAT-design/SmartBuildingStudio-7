// Integrations/ProjectDesignIntegration/ProjectDesignProvider.cs

using System.Text.Json;
using DeviceDiscoveryService.Application.Exceptions;
using DeviceDiscoveryService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace DeviceDiscoveryService.Infrastructure.Integrations.ProjectDesignIntegration;

public sealed class ProjectDesignProvider : IProjectDesignProvider
{
    private readonly ProjectDesignClient _client;
    private readonly ILogger<ProjectDesignProvider> _logger;

    public ProjectDesignProvider(
        ProjectDesignClient client,
        ILogger<ProjectDesignProvider> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RawDesignFixture>> GetFixturesForLineAsync(
        Guid projectId,
        Guid drawingDocumentId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        // ProjectExplorer returns all fixtures for the floorplan; we filter
        // by line client-side (matches the pattern used by the frontend
        // DeviceDiscoveryFloorplanLoader).
        var all = await GetFixturesForFloorAsync(projectId, drawingDocumentId, cancellationToken);
        return all
            .Where(f => string.Equals(f.LineId, lineId, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task<IReadOnlyList<RawDesignFixture>> GetFixturesForFloorAsync(
        Guid projectId,
        Guid floorId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var json = await _client.GetFixturesForFloorplanAsync(projectId, floorId, cancellationToken);
            return ParseFixtures(json);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "ProjectExplorer fixture fetch failed for project {ProjectId} floor {FloorId}",
                projectId, floorId);
            throw new ProviderUnavailableException("ProjectExplorer", ex.Message, ex);
        }
    }

    private static IReadOnlyList<RawDesignFixture> ParseFixtures(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<RawDesignFixture>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            JsonElement array = default;
            if (root.ValueKind == JsonValueKind.Array)
            {
                array = root;
            }
            else if (root.ValueKind == JsonValueKind.Object
                     && root.TryGetProperty("fixtures", out var arr)
                     && arr.ValueKind == JsonValueKind.Array)
            {
                array = arr;
            }

            if (array.ValueKind != JsonValueKind.Array) return Array.Empty<RawDesignFixture>();

            var list = new List<RawDesignFixture>();
            foreach (var f in array.EnumerateArray())
            {
                if (f.ValueKind != JsonValueKind.Object) continue;

                string? GetStr(string name) =>
                    f.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.String
                        ? el.GetString() : null;
                int? GetInt(string name) =>
                    f.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.Number
                        ? el.GetInt32() : null;
                double GetDbl(string name) =>
                    f.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.Number
                        ? el.GetDouble() : 0;

                var id = GetStr("id") ?? GetStr("fixtureId");
                if (string.IsNullOrWhiteSpace(id)) continue;

                list.Add(new RawDesignFixture(
                    FixtureId: id!,
                    ProductId: GetStr("productId"),
                    ProductName: GetStr("productName"),
                    DaliGroup: GetStr("daliGroup"),
                    ShortAddress: GetInt("shortAddress"),
                    X: GetDbl("x"),
                    Y: GetDbl("y"),
                    LineId: GetStr("lineId")));
            }
            return list;
        }
        catch (JsonException)
        {
            return Array.Empty<RawDesignFixture>();
        }
    }
}